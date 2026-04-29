import fs from "node:fs/promises"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"

import pg from "pg"

const { Pool } = pg
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const dataDir = path.join(root, "data")

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error("DATABASE_URL is required.")
  process.exit(1)
}

const readJsonArray = async (fileName) => {
  try {
    const fileContents = await fs.readFile(path.join(dataDir, fileName), "utf8")
    const parsed = JSON.parse(fileContents.replace(/^\uFEFF/, ""))
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    if (error.code === "ENOENT") return []
    throw error
  }
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
})

try {
  const [orders, enquiries, emails] = await Promise.all([
    readJsonArray("orders.json"),
    readJsonArray("enquiries.json"),
    readJsonArray("email-log.json"),
  ])

  for (const order of orders) {
    await pool.query(
      `
        insert into orders (
          id, created_at, product, total, email, phone, hero_name, hero_type, story_title, story_id,
          gender, photo_count, choices, postage, status, fulfilment_status, fulfilment_updated_at,
          download_url, email_sent_at
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14::jsonb, $15, $16, $17, $18, $19)
        on conflict (id) do nothing
      `,
      [
        order.id,
        order.createdAt,
        order.product,
        order.total,
        order.email,
        order.phone || null,
        order.heroName,
        order.heroType,
        order.storyTitle,
        order.storyId,
        order.gender,
        order.photoCount || 0,
        JSON.stringify(order.choices || []),
        order.postage ? JSON.stringify(order.postage) : null,
        order.status,
        order.fulfilmentStatus || "new",
        order.fulfilmentUpdatedAt || order.createdAt,
        order.downloadUrl || null,
        order.emailSentAt || null,
      ],
    )
  }

  for (const enquiry of enquiries) {
    await pool.query(
      `
        insert into enquiries (id, created_at, name, email, subject, message, status)
        values ($1, $2, $3, $4, $5, $6, $7)
        on conflict (id) do nothing
      `,
      [
        enquiry.id,
        enquiry.createdAt,
        enquiry.name,
        enquiry.email,
        enquiry.subject,
        enquiry.message,
        enquiry.status || "new",
      ],
    )
  }

  for (const email of emails) {
    await pool.query(
      `
        insert into email_logs (id, created_at, recipient, subject, body, order_id, provider)
        values ($1, $2, $3, $4, $5, $6, $7)
        on conflict (id) do nothing
      `,
      [email.id, email.createdAt, email.to, email.subject, email.body, email.orderId, email.provider || "log"],
    )
  }

  console.log(`Imported ${orders.length} orders, ${enquiries.length} enquiries, and ${emails.length} email log entries.`)
} finally {
  await pool.end()
}
