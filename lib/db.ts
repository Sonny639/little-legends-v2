import { Pool, type QueryResultRow } from "pg"

let pool: Pool | null = null

export const hasDatabase = () => Boolean(process.env.DATABASE_URL)

export const getPool = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured")
  }

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
    })
  }

  return pool
}

export const query = async <T extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []) => {
  return getPool().query<T>(text, values)
}
