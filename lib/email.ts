import fs from "fs/promises"
import path from "path"

import nodemailer from "nodemailer"

import { hasDatabase, query } from "@/lib/db"
import { renderBrandedEmail, withPlainEmailSignature } from "@/lib/email-template"
import { getOrderAccessToken } from "@/lib/order-access"
import { type OrderRecord, updateOrderEmailSentAt } from "@/lib/orders"
import { getSupabase, hasSupabase } from "@/lib/supabase"

export type EmailLogEntry = {
  id: string
  createdAt: string
  to: string
  subject: string
  body: string
  orderId: string
  provider: "log" | "smtp"
}

const dataDirectory = path.join(process.cwd(), "data")
const emailLogFile = path.join(dataDirectory, "email-log.json")
const money = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" })

type EmailLogRow = {
  id: string
  created_at: Date | string
  recipient: string
  subject: string
  body: string
  order_id: string
  provider: "log" | "smtp"
}

const toIso = (value: Date | string) => (value instanceof Date ? value.toISOString() : new Date(value).toISOString())

const rowToEmailLogEntry = (row: EmailLogRow): EmailLogEntry => ({
  id: row.id,
  createdAt: toIso(row.created_at),
  to: row.recipient,
  subject: row.subject,
  body: row.body,
  orderId: row.order_id,
  provider: row.provider,
})

const emailLogEntryToRow = (entry: EmailLogEntry) => ({
  id: entry.id,
  created_at: entry.createdAt,
  recipient: entry.to,
  subject: entry.subject,
  body: entry.body,
  order_id: entry.orderId,
  provider: entry.provider,
})

const isLocalUrl = (value: string) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(value)

const appUrl = () => {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL

  if (configuredUrl && !(process.env.NODE_ENV === "production" && isLocalUrl(configuredUrl))) {
    return configuredUrl.replace(/\/$/, "")
  }

  if (process.env.NODE_ENV === "production") {
    return "https://www.littlelegendsstory.com"
  }

  return "http://localhost:3003"
}

const getOrderAccessQuery = (orderId: string) => `?access=${encodeURIComponent(getOrderAccessToken(orderId))}`

export const getOrderDownloadUrl = (orderId: string) =>
  `${appUrl()}/download/${encodeURIComponent(orderId)}${getOrderAccessQuery(orderId)}`
export const getOrderUpgradeUrl = (orderId: string) =>
  `${appUrl()}/upgrade/${encodeURIComponent(orderId)}${getOrderAccessQuery(orderId)}`

const smtpPort = () => Number(process.env.SMTP_PORT || 587)

const hasSmtpConfig = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD)

const isTestRecipient = (email: string) => /@(example\.com|example\.test|test\.local)$/i.test(email)

const getAdminOrderNotificationEmail = () =>
  process.env.ADMIN_ORDER_NOTIFICATION_EMAIL ||
  process.env.CONTACT_TO_EMAIL ||
  process.env.SMTP_FROM_EMAIL ||
  "hello@littlelegendsstory.com"

const sendSmtpEmail = async ({
  to,
  subject,
  text,
  html,
}: {
  to: string
  subject: string
  text: string
  html: string
}) => {
  if (!hasSmtpConfig()) return false
  if (isTestRecipient(to)) return false

  const port = smtpPort()
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || "hello@littlelegendsstory.com"
  const fromName = process.env.SMTP_FROM_NAME || "Little Legends Story"

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 8000,
  })

  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    replyTo: process.env.CONTACT_TO_EMAIL || fromEmail,
    subject,
    text,
    html,
  })

  return true
}

const ensureEmailLogFile = async () => {
  await fs.mkdir(dataDirectory, { recursive: true })

  try {
    await fs.access(emailLogFile)
  } catch {
    await fs.writeFile(emailLogFile, "[]", "utf8")
  }
}

const appendEmailLog = async (entry: EmailLogEntry) => {
  if (hasSupabase()) {
    const { error } = await getSupabase().from("email_logs").upsert(emailLogEntryToRow(entry), { onConflict: "id" })

    if (error) throw new Error(`Failed to save Supabase email log: ${error.message}`)

    return
  }

  if (hasDatabase()) {
    await query(
      `
        insert into email_logs (id, created_at, recipient, subject, body, order_id, provider)
        values ($1, $2, $3, $4, $5, $6, $7)
        on conflict (id) do update set
          created_at = excluded.created_at,
          recipient = excluded.recipient,
          subject = excluded.subject,
          body = excluded.body,
          order_id = excluded.order_id,
          provider = excluded.provider
      `,
      [entry.id, entry.createdAt, entry.to, entry.subject, entry.body, entry.orderId, entry.provider],
    )

    return
  }

  await ensureEmailLogFile()

  const fileContents = await fs.readFile(emailLogFile, "utf8")
  const parsedEntries = JSON.parse(fileContents.replace(/^\uFEFF/, ""))
  const entries = Array.isArray(parsedEntries) ? parsedEntries : []

  await fs.writeFile(emailLogFile, JSON.stringify([entry, ...entries], null, 2), "utf8")
}

const sendAdminOrderNotification = async (order: OrderRecord, createdAt: string) => {
  if (order.status !== "paid" || isTestRecipient(order.email)) {
    return
  }

  const to = getAdminOrderNotificationEmail()
  const adminOrdersUrl = `${appUrl()}/admin/orders?order=${encodeURIComponent(order.id)}`
  const productLabel =
    order.product === "hardback"
      ? "Hardback"
      : order.product === "upgrade"
        ? "Hardback upgrade"
        : "Digital PDF"
  const subject = `New Little Legends order: ${productLabel} - ${order.id}`
  const deliverySummary = order.postage
    ? [
        `Delivery name: ${order.postage.fullName}`,
        `Delivery country: ${order.postage.country}`,
      ]
    : []
  const plainBody = [
    "A new paid Little Legends order has been received.",
    "",
    `Order reference: ${order.id}`,
    `Product: ${productLabel}`,
    `Total: ${money.format(order.total)}`,
    `Customer email: ${order.email}`,
    `Hero: ${order.heroName} the ${order.heroType}`,
    `Story: ${order.storyTitle}`,
    `Photos uploaded: ${order.photoCount || 0}`,
    ...deliverySummary,
    "",
    `Log in and check the order: ${adminOrdersUrl}`,
  ].join("\n")
  const body = withPlainEmailSignature(plainBody)
  const html = renderBrandedEmail({
    preheader: `New paid ${productLabel.toLowerCase()} order ${order.id}.`,
    title: "New paid order",
    intro: `A new paid ${productLabel.toLowerCase()} order has arrived and is ready to check in admin.`,
    paragraphs: [
      order.product === "digital"
        ? "Check the customer email log and support status when convenient."
        : "This order may need Lulu/manual print fulfilment after the personalised files are ready.",
    ],
    details: [
      { label: "Order", value: order.id },
      { label: "Product", value: productLabel },
      { label: "Total", value: money.format(order.total) },
      { label: "Customer", value: order.email },
      { label: "Hero", value: `${order.heroName} the ${order.heroType}` },
      { label: "Story", value: order.storyTitle },
      { label: "Photos", value: String(order.photoCount || 0) },
      ...(order.postage ? [{ label: "Delivery", value: `${order.postage.fullName}, ${order.postage.country}` }] : []),
    ],
    cta: { label: "Open admin orders", url: adminOrdersUrl },
    footerNote: "Internal notification from Little Legends Story.",
  })
  let provider: EmailLogEntry["provider"] = "log"

  try {
    provider = (await sendSmtpEmail({ to, subject, text: body, html })) ? "smtp" : "log"
  } catch (error) {
    console.warn("Admin order notification could not be sent via SMTP; saved to email log only:", error)
    provider = "log"
  }

  await appendEmailLog({
    id: `email_admin_${Date.now()}`,
    createdAt,
    to,
    subject,
    body,
    orderId: order.id,
    provider,
  })
}

export const readEmailLog = async (): Promise<EmailLogEntry[]> => {
  if (hasSupabase()) {
    const { data, error } = await getSupabase().from("email_logs").select("*").order("created_at", { ascending: false })

    if (error) throw new Error(`Failed to read Supabase email log: ${error.message}`)

    return (data || []).map((row) => rowToEmailLogEntry(row as EmailLogRow))
  }

  if (hasDatabase()) {
    const result = await query<EmailLogRow>("select * from email_logs order by created_at desc")
    return result.rows.map(rowToEmailLogEntry)
  }

  await ensureEmailLogFile()

  const fileContents = await fs.readFile(emailLogFile, "utf8")
  const parsedEntries = JSON.parse(fileContents.replace(/^\uFEFF/, ""))

  return Array.isArray(parsedEntries) ? parsedEntries : []
}

export const deleteEmailLogEntry = async (emailId: string) => {
  if (hasSupabase()) {
    const { data, error } = await getSupabase().from("email_logs").delete().eq("id", emailId).select("id").maybeSingle()

    if (error) throw new Error(`Failed to delete Supabase email log: ${error.message}`)

    return Boolean(data)
  }

  if (hasDatabase()) {
    const result = await query<{ id: string }>("delete from email_logs where id = $1 returning id", [emailId])
    return (result.rowCount || 0) > 0
  }

  await ensureEmailLogFile()

  const fileContents = await fs.readFile(emailLogFile, "utf8")
  const parsedEntries = JSON.parse(fileContents.replace(/^\uFEFF/, ""))
  const entries = Array.isArray(parsedEntries) ? parsedEntries : []
  const nextEntries = entries.filter((entry) => entry?.id !== emailId)

  if (nextEntries.length === entries.length) {
    return false
  }

  await fs.writeFile(emailLogFile, JSON.stringify(nextEntries, null, 2), "utf8")

  return true
}

export const sendPrintFulfilmentEmail = async (order: OrderRecord) => {
  if (order.product === "digital") {
    throw new Error("Print fulfilment emails are only available for hardback orders")
  }

  const createdAt = new Date().toISOString()
  const subject = `Your Little Legends hardback has been sent for printing: ${order.storyTitle}`
  const body = withPlainEmailSignature([
    `Hi there,`,
    ``,
    `Good news - ${order.heroName}'s hardback storybook has now been sent for printing and fulfilment.`,
    ``,
    `Story: ${order.storyTitle}`,
    `Hero: ${order.heroName} the ${order.heroType}`,
    `Order reference: ${order.id}`,
    ``,
    `The print partner will prepare the book and send it to the delivery address on your order. Please keep an eye out for any delivery or tracking updates.`,
    ``,
    `If anything looks wrong, reply via the contact page with your order reference and we will help.`,
  ].join("\n"))
  const html = renderBrandedEmail({
    preheader: `${order.heroName}'s hardback storybook has been sent for printing.`,
    title: "Sent for printing",
    intro: `Good news - ${order.heroName}'s hardback storybook has now been sent for printing and fulfilment.`,
    paragraphs: [
      "The print partner will prepare the book and send it to the delivery address on your order.",
      "Please keep an eye out for any delivery or tracking updates. If anything looks wrong, reply via the contact page with your order reference and we will help.",
    ],
    details: [
      { label: "Story", value: order.storyTitle },
      { label: "Hero", value: `${order.heroName} the ${order.heroType}` },
      { label: "Order", value: order.id },
      ...(order.postage ? [{ label: "Delivery", value: `${order.postage.fullName}, ${order.postage.country}` }] : []),
    ],
    footerNote: "You are receiving this because your hardback order is being fulfilled by Little Legends Story.",
  })
  let provider: EmailLogEntry["provider"] = "log"

  try {
    provider = (await sendSmtpEmail({ to: order.email, subject, text: body, html })) ? "smtp" : "log"
  } catch (error) {
    console.warn("Print fulfilment email could not be sent via SMTP; saved to email log only:", error)
    provider = "log"
  }

  await appendEmailLog({
    id: `email_print_${Date.now()}`,
    createdAt,
    to: order.email,
    subject,
    body,
    orderId: order.id,
    provider,
  })

  return {
    provider,
    sentAt: createdAt,
    to: order.email,
    subject,
  }
}

export const sendOrderConfirmationEmail = async (order: OrderRecord) => {
  const downloadUrl = getOrderDownloadUrl(order.id)
  const upgradeUrl = order.product === "digital" ? getOrderUpgradeUrl(order.id) : ""
  const createdAt = new Date().toISOString()
  const photoCount = order.photoCount || 0
  const deliveryLabel = order.postage?.shippingLabel
  const deliveryPrice =
    typeof order.postage?.shippingPrice === "number"
      ? order.postage.shippingPrice > 0
        ? money.format(order.postage.shippingPrice)
        : "Free"
      : ""
  const requiresArtworkPreparation = photoCount > 0
  const subject = requiresArtworkPreparation
    ? `Your Little Legends order is confirmed: ${order.storyTitle}`
    : `Your Little Legends story is ready: ${order.storyTitle}`
  const photoFollowUp =
    photoCount > 0
      ? [
          ``,
          `Photo note: ${photoCount} reference photo${photoCount === 1 ? " was" : "s were"} selected during checkout.`,
          `The reference photo${photoCount === 1 ? " is" : "s are"} stored privately with your order for the personalised artwork stage.`,
        ]
      : []
  const plainBody = [
    `Hi there,`,
    ``,
    requiresArtworkPreparation ? `Your Little Legends order is confirmed.` : `Your Little Legends story is ready.`,
    ``,
    requiresArtworkPreparation
      ? `${order.heroName}'s personalised adventure is now being prepared. This may take a little while while each page is finished with their likeness.`
      : `${order.heroName}'s personalised adventure has been created and is ready to read, print, or save.`,
    ``,
    `Story: ${order.storyTitle}`,
    `Hero: ${order.heroName} the ${order.heroType}`,
    `Order reference: ${order.id}`,
    `Order total: ${money.format(order.total)}`,
    ...(deliveryLabel ? [`Delivery: ${deliveryLabel}${deliveryPrice ? ` (${deliveryPrice})` : ""}`] : []),
    `Download link: ${downloadUrl}`,
    ``,
    requiresArtworkPreparation
      ? `Open the link above to watch the personalised storybook prepare. Please keep that page open while the artwork is being finished.`
      : order.product === "digital"
        ? `Your digital story is available straight away. Open the link above and use Download PDF to save a copy.`
        : `Your digital copy is available now. Your printed book order has also been logged for fulfilment.`,
    ...(upgradeUrl
      ? [
          ``,
          `Want the hardback later? You can upgrade this digital order here: ${upgradeUrl}`,
        ]
      : []),
    ...photoFollowUp,
    ``,
    `If anything looks wrong, reply via the contact page with your order reference and we will help.`,
  ].join("\n")
  const body = withPlainEmailSignature(plainBody)
  const html = renderBrandedEmail({
    preheader: requiresArtworkPreparation
      ? `${order.heroName}'s personalised adventure is being prepared.`
      : `${order.heroName}'s personalised adventure is ready to download.`,
    title: requiresArtworkPreparation ? "Your order is confirmed" : "Your story is ready",
    intro: requiresArtworkPreparation
      ? `${order.heroName}'s personalised adventure is now being prepared. This may take a little while while each page is finished with their likeness.`
      : `${order.heroName}'s personalised adventure has been created and is ready to read, print, or save.`,
    paragraphs: [
      requiresArtworkPreparation
        ? `Open the download link to watch the personalised storybook prepare. Please keep that page open while the artwork is being finished.`
        : order.product === "digital"
          ? `Your digital story is available straight away. Open the link and use Download PDF to save a copy.`
          : `Your digital copy is available now. Your printed book order has also been logged for fulfilment.`,
      ...(photoCount > 0
        ? [
            `${photoCount} reference photo${photoCount === 1 ? " was" : "s were"} selected during checkout and stored privately with the order for the personalised artwork stage.`,
          ]
        : []),
      `If anything looks wrong, reply via the contact page with your order reference and we will help.`,
    ],
    details: [
      { label: "Story", value: order.storyTitle },
      { label: "Hero", value: `${order.heroName} the ${order.heroType}` },
      { label: "Order", value: order.id },
      { label: "Total", value: money.format(order.total) },
      ...(deliveryLabel ? [{ label: "Delivery", value: `${deliveryLabel}${deliveryPrice ? ` (${deliveryPrice})` : ""}` }] : []),
    ],
    cta: { label: requiresArtworkPreparation ? "Open story preparation" : "Download your story", url: downloadUrl },
    secondaryCta: upgradeUrl ? { label: "Add the hardback", url: upgradeUrl } : undefined,
    footerNote: "You are receiving this because an order was placed with Little Legends Story.",
  })
  let provider: EmailLogEntry["provider"] = "log"

  try {
    provider = (await sendSmtpEmail({ to: order.email, subject, text: body, html })) ? "smtp" : "log"
  } catch (error) {
    console.warn("Order confirmation email could not be sent via SMTP; saved to email log only:", error)
    provider = "log"
  }

  await appendEmailLog({
    id: `email_${Date.now()}`,
    createdAt,
    to: order.email,
    subject,
    body,
    orderId: order.id,
    provider,
  })

  await sendAdminOrderNotification(order, createdAt)
  await updateOrderEmailSentAt(order.id, createdAt)

  return {
    provider,
    sentAt: createdAt,
    to: order.email,
    subject,
    downloadUrl,
  }
}
