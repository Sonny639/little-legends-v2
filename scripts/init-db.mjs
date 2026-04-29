import fs from "node:fs/promises"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"

import pg from "pg"

const { Pool } = pg
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const schemaPath = path.join(root, "db", "schema.sql")

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error("DATABASE_URL is required.")
  process.exit(1)
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
})

try {
  const schema = await fs.readFile(schemaPath, "utf8")
  await pool.query(schema)
  console.log("Database schema is ready.")
} finally {
  await pool.end()
}
