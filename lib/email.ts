import fs from "fs/promises"
import path from "path"

import nodemailer from "nodemailer"

import { hasDatabase, query } from "@/lib/db"
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

export const getOrderDownloadUrl = (orderId: string) => `${appUrl()}/download/${encodeURIComponent(orderId)}`

const smtpPort = () => Number(process.env.SMTP_PORT || 587)

const hasSmtpConfig = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD)

const isTestRecipient = (email: string) => /@(example\.com|example\.test|test\.local)$/i.test(email)

const sendSmtpEmail = async ({ to, subject, body }: { to: string; subject: string; body: string }) => {
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
    text: body,
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

export const sendOrderConfirmationEmail = async (order: OrderRecord) => {
  const downloadUrl = order.downloadUrl || getOrderDownloadUrl(order.id)
  const createdAt = new Date().toISOString()
  const subject = `Your Little Legends story is ready: ${order.storyTitle}`
  const photoCount = order.photoCount || 0
  const photoFollowUp =
    photoCount > 0
      ? [
          ``,
          `Photo note: ${photoCount} reference photo${photoCount === 1 ? " was" : "s were"} selected during checkout.`,
          `The reference photo${photoCount === 1 ? " is" : "s are"} stored privately with your order for the personalised artwork stage.`,
        ]
      : []
  const body = [
    `Hi there,`,
    ``,
    `Your Little Legends story is ready.`,
    ``,
    `${order.heroName}'s personalised adventure has been created and is ready to read, print, or save.`,
    ``,
    `Story: ${order.storyTitle}`,
    `Hero: ${order.heroName} the ${order.heroType}`,
    `Order reference: ${order.id}`,
    `Download link: ${downloadUrl}`,
    ``,
    order.product === "digital"
      ? `Your digital story is available straight away. Open the link above and use Download PDF to save a copy.`
      : `Your digital copy is available now. Your printed book order has also been logged for fulfilment.`,
    ...photoFollowUp,
    ``,
    `If anything looks wrong, reply via the contact page with your order reference and we will help.`,
    ``,
    `Little Legends`,
  ].join("\n")
  let provider: EmailLogEntry["provider"] = "log"

  try {
    provider = (await sendSmtpEmail({ to: order.email, subject, body })) ? "smtp" : "log"
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

  await updateOrderEmailSentAt(order.id, createdAt)

  return {
    provider,
    sentAt: createdAt,
    to: order.email,
    subject,
    downloadUrl,
  }
}
