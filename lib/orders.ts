import fs from "fs/promises"
import path from "path"

import { hasDatabase, query } from "@/lib/db"
import { getSupabase, hasSupabase } from "@/lib/supabase"

export type CheckoutProduct = "digital" | "hardback" | "upgrade"
export type PaymentStatus = "payment_pending" | "paid_demo" | "paid"
export type FulfilmentStatus = "new" | "in_progress" | "ready" | "sent"

export type StoryPathChoice = {
  pageId: string
  choiceId: string
  pathTag?: string
  text: string
}

export type OrderRecord = {
  id: string
  createdAt: string
  product: CheckoutProduct
  total: number
  email: string
  phone?: string
  heroName: string
  heroType: string
  storyTitle: string
  storyId: string
  gender: "boy" | "girl" | null
  photoCount?: number
  choices: StoryPathChoice[]
  postage?: {
    fullName: string
    addressLine1: string
    addressLine2: string
    city: string
    postcode: string
    country: string
    countryCode?: string
    shippingLabel?: string
    shippingPrice?: number
    shippingPricePence?: number
  }
  status: PaymentStatus
  fulfilmentStatus?: FulfilmentStatus
  fulfilmentUpdatedAt?: string
  downloadUrl?: string
  emailSentAt?: string
}

const dataDirectory = path.join(process.cwd(), "data")
const ordersFile = path.join(dataDirectory, "orders.json")

type OrderRow = {
  id: string
  created_at: Date | string
  product: CheckoutProduct
  total: string | number
  email: string
  phone: string | null
  hero_name: string
  hero_type: string
  story_title: string
  story_id: string
  gender: "boy" | "girl" | null
  photo_count: number
  choices: StoryPathChoice[]
  postage: OrderRecord["postage"] | null
  status: PaymentStatus
  fulfilment_status: FulfilmentStatus | null
  fulfilment_updated_at: Date | string | null
  download_url: string | null
  email_sent_at: Date | string | null
}

const toIso = (value: Date | string | null | undefined) => {
  if (!value) return undefined
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

const rowToOrder = (row: OrderRow): OrderRecord => ({
  id: row.id,
  createdAt: toIso(row.created_at) || new Date().toISOString(),
  product: row.product,
  total: Number(row.total),
  email: row.email,
  phone: row.phone || undefined,
  heroName: row.hero_name,
  heroType: row.hero_type,
  storyTitle: row.story_title,
  storyId: row.story_id,
  gender: row.gender,
  photoCount: row.photo_count,
  choices: row.choices || [],
  postage: row.postage || undefined,
  status: row.status,
  fulfilmentStatus: row.fulfilment_status || "new",
  fulfilmentUpdatedAt: toIso(row.fulfilment_updated_at),
  downloadUrl: row.download_url || undefined,
  emailSentAt: toIso(row.email_sent_at),
})

const orderToRow = (order: OrderRecord) => ({
  id: order.id,
  created_at: order.createdAt,
  product: order.product,
  total: order.total,
  email: order.email,
  phone: order.phone || null,
  hero_name: order.heroName,
  hero_type: order.heroType,
  story_title: order.storyTitle,
  story_id: order.storyId,
  gender: order.gender,
  photo_count: order.photoCount || 0,
  choices: order.choices || [],
  postage: order.postage || null,
  status: order.status,
  fulfilment_status: order.fulfilmentStatus || "new",
  fulfilment_updated_at: order.fulfilmentUpdatedAt || order.createdAt,
  download_url: order.downloadUrl || null,
  email_sent_at: order.emailSentAt || null,
})

const ensureDataFile = async () => {
  await fs.mkdir(dataDirectory, { recursive: true })

  try {
    await fs.access(ordersFile)
  } catch {
    await fs.writeFile(ordersFile, "[]", "utf8")
  }
}

export const readOrders = async (): Promise<OrderRecord[]> => {
  if (hasSupabase()) {
    const { data, error } = await getSupabase().from("orders").select("*").order("created_at", { ascending: false })

    if (error) throw new Error(`Failed to read Supabase orders: ${error.message}`)

    return (data || []).map((row) => rowToOrder(row as OrderRow))
  }

  if (hasDatabase()) {
    const result = await query<OrderRow>("select * from orders order by created_at desc")
    return result.rows.map(rowToOrder)
  }

  await ensureDataFile()

  const fileContents = await fs.readFile(ordersFile, "utf8")
  const parsedOrders = JSON.parse(fileContents)

  return Array.isArray(parsedOrders) ? parsedOrders : []
}

export const saveOrder = async (order: OrderRecord) => {
  const normalisedOrder = {
    ...order,
    photoCount: order.photoCount || 0,
    fulfilmentStatus: order.fulfilmentStatus || "new",
    fulfilmentUpdatedAt: order.fulfilmentUpdatedAt || order.createdAt,
  }

  if (hasSupabase()) {
    const { error } = await getSupabase().from("orders").upsert(orderToRow(normalisedOrder), { onConflict: "id" })

    if (error) throw new Error(`Failed to save Supabase order: ${error.message}`)

    return normalisedOrder
  }

  if (hasDatabase()) {
    await query(
      `
        insert into orders (
          id, created_at, product, total, email, phone, hero_name, hero_type, story_title, story_id,
          gender, photo_count, choices, postage, status, fulfilment_status, fulfilment_updated_at,
          download_url, email_sent_at
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14::jsonb, $15, $16, $17, $18, $19)
        on conflict (id) do update set
          created_at = excluded.created_at,
          product = excluded.product,
          total = excluded.total,
          email = excluded.email,
          phone = excluded.phone,
          hero_name = excluded.hero_name,
          hero_type = excluded.hero_type,
          story_title = excluded.story_title,
          story_id = excluded.story_id,
          gender = excluded.gender,
          photo_count = excluded.photo_count,
          choices = excluded.choices,
          postage = excluded.postage,
          status = excluded.status,
          fulfilment_status = excluded.fulfilment_status,
          fulfilment_updated_at = excluded.fulfilment_updated_at,
          download_url = excluded.download_url,
          email_sent_at = excluded.email_sent_at
      `,
      [
        normalisedOrder.id,
        normalisedOrder.createdAt,
        normalisedOrder.product,
        normalisedOrder.total,
        normalisedOrder.email,
        normalisedOrder.phone || null,
        normalisedOrder.heroName,
        normalisedOrder.heroType,
        normalisedOrder.storyTitle,
        normalisedOrder.storyId,
        normalisedOrder.gender,
        normalisedOrder.photoCount,
        JSON.stringify(normalisedOrder.choices || []),
        normalisedOrder.postage ? JSON.stringify(normalisedOrder.postage) : null,
        normalisedOrder.status,
        normalisedOrder.fulfilmentStatus,
        normalisedOrder.fulfilmentUpdatedAt,
        normalisedOrder.downloadUrl || null,
        normalisedOrder.emailSentAt || null,
      ],
    )

    return normalisedOrder
  }

  const orders = await readOrders()
  const nextOrders = [normalisedOrder, ...orders.filter((savedOrder) => savedOrder.id !== order.id)]

  await fs.writeFile(ordersFile, JSON.stringify(nextOrders, null, 2), "utf8")

  return normalisedOrder
}

export const updateOrderFulfilmentStatus = async (orderId: string, fulfilmentStatus: FulfilmentStatus) => {
  if (hasSupabase()) {
    const { data, error } = await getSupabase()
      .from("orders")
      .update({ fulfilment_status: fulfilmentStatus, fulfilment_updated_at: new Date().toISOString() })
      .eq("id", orderId)
      .select("*")
      .maybeSingle()

    if (error) throw new Error(`Failed to update Supabase order fulfilment: ${error.message}`)

    return data ? rowToOrder(data as OrderRow) : null
  }

  if (hasDatabase()) {
    const result = await query<OrderRow>(
      "update orders set fulfilment_status = $2, fulfilment_updated_at = $3 where id = $1 returning *",
      [orderId, fulfilmentStatus, new Date().toISOString()],
    )

    return result.rows[0] ? rowToOrder(result.rows[0]) : null
  }

  const orders = await readOrders()
  const orderExists = orders.some((order) => order.id === orderId)

  if (!orderExists) {
    return null
  }

  const nextOrders = orders.map((order) =>
    order.id === orderId
      ? {
          ...order,
          fulfilmentStatus,
          fulfilmentUpdatedAt: new Date().toISOString(),
        }
      : order,
  )

  await fs.writeFile(ordersFile, JSON.stringify(nextOrders, null, 2), "utf8")

  return nextOrders.find((order) => order.id === orderId) || null
}

export const updateOrderPaymentStatus = async (orderId: string, status: PaymentStatus) => {
  if (hasSupabase()) {
    const { data, error } = await getSupabase()
      .from("orders")
      .update({ status })
      .eq("id", orderId)
      .select("*")
      .maybeSingle()

    if (error) throw new Error(`Failed to update Supabase order payment: ${error.message}`)

    return data ? rowToOrder(data as OrderRow) : null
  }

  if (hasDatabase()) {
    const result = await query<OrderRow>("update orders set status = $2 where id = $1 returning *", [orderId, status])

    return result.rows[0] ? rowToOrder(result.rows[0]) : null
  }

  const orders = await readOrders()
  const orderExists = orders.some((order) => order.id === orderId)

  if (!orderExists) {
    return null
  }

  const nextOrders = orders.map((order) =>
    order.id === orderId
      ? {
          ...order,
          status,
        }
      : order,
  )

  await fs.writeFile(ordersFile, JSON.stringify(nextOrders, null, 2), "utf8")

  return nextOrders.find((order) => order.id === orderId) || null
}

export const updateOrderEmailSentAt = async (orderId: string, emailSentAt: string) => {
  if (hasSupabase()) {
    const { data, error } = await getSupabase()
      .from("orders")
      .update({ email_sent_at: emailSentAt })
      .eq("id", orderId)
      .select("*")
      .maybeSingle()

    if (error) throw new Error(`Failed to update Supabase order email status: ${error.message}`)

    return data ? rowToOrder(data as OrderRow) : null
  }

  if (hasDatabase()) {
    const result = await query<OrderRow>("update orders set email_sent_at = $2 where id = $1 returning *", [orderId, emailSentAt])

    return result.rows[0] ? rowToOrder(result.rows[0]) : null
  }

  const orders = await readOrders()
  const orderExists = orders.some((order) => order.id === orderId)

  if (!orderExists) {
    return null
  }

  const nextOrders = orders.map((order) =>
    order.id === orderId
      ? {
          ...order,
          emailSentAt,
        }
      : order,
  )

  await fs.writeFile(ordersFile, JSON.stringify(nextOrders, null, 2), "utf8")

  return nextOrders.find((order) => order.id === orderId) || null
}

export const clearOrders = async () => {
  if (hasSupabase()) {
    const { error } = await getSupabase().from("orders").delete().neq("id", "")

    if (error) throw new Error(`Failed to clear Supabase orders: ${error.message}`)

    return
  }

  if (hasDatabase()) {
    await query("delete from orders")
    return
  }

  await ensureDataFile()
  await fs.writeFile(ordersFile, "[]", "utf8")
}
