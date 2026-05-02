import fs from "fs/promises"
import path from "path"

import { hasDatabase, query } from "@/lib/db"
import { getSupabase, hasSupabase } from "@/lib/supabase"

export type EnquiryStatus = "new" | "replied" | "closed"

export type EnquiryRecord = {
  id: string
  createdAt: string
  name: string
  email: string
  subject: string
  message: string
  status: EnquiryStatus
}

const dataDirectory = path.join(process.cwd(), "data")
const enquiriesFile = path.join(dataDirectory, "enquiries.json")

type EnquiryRow = {
  id: string
  created_at: Date | string
  name: string
  email: string
  subject: string
  message: string
  status: EnquiryStatus
}

const toIso = (value: Date | string) => (value instanceof Date ? value.toISOString() : new Date(value).toISOString())

const rowToEnquiry = (row: EnquiryRow): EnquiryRecord => ({
  id: row.id,
  createdAt: toIso(row.created_at),
  name: row.name,
  email: row.email,
  subject: row.subject,
  message: row.message,
  status: row.status,
})

const enquiryToRow = (enquiry: EnquiryRecord) => ({
  id: enquiry.id,
  created_at: enquiry.createdAt,
  name: enquiry.name,
  email: enquiry.email,
  subject: enquiry.subject,
  message: enquiry.message,
  status: enquiry.status,
})

const ensureEnquiriesFile = async () => {
  await fs.mkdir(dataDirectory, { recursive: true })

  try {
    await fs.access(enquiriesFile)
  } catch {
    await fs.writeFile(enquiriesFile, "[]", "utf8")
  }
}

export const readEnquiries = async (): Promise<EnquiryRecord[]> => {
  if (hasSupabase()) {
    const { data, error } = await getSupabase().from("enquiries").select("*").order("created_at", { ascending: false })

    if (error) throw new Error(`Failed to read Supabase enquiries: ${error.message}`)

    return (data || []).map((row) => rowToEnquiry(row as EnquiryRow))
  }

  if (hasDatabase()) {
    const result = await query<EnquiryRow>("select * from enquiries order by created_at desc")
    return result.rows.map(rowToEnquiry)
  }

  await ensureEnquiriesFile()

  const fileContents = await fs.readFile(enquiriesFile, "utf8")
  const parsedEnquiries = JSON.parse(fileContents.replace(/^\uFEFF/, ""))

  return Array.isArray(parsedEnquiries) ? parsedEnquiries : []
}

export const saveEnquiry = async (enquiry: Omit<EnquiryRecord, "id" | "createdAt" | "status">) => {
  const createdAt = new Date().toISOString()
  const savedEnquiry: EnquiryRecord = {
    ...enquiry,
    id: `enquiry_${Date.now()}`,
    createdAt,
    status: "new",
  }

  if (hasSupabase()) {
    const { error } = await getSupabase().from("enquiries").insert(enquiryToRow(savedEnquiry))

    if (error) throw new Error(`Failed to save Supabase enquiry: ${error.message}`)

    return savedEnquiry
  }

  if (hasDatabase()) {
    await query(
      `
        insert into enquiries (id, created_at, name, email, subject, message, status)
        values ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        savedEnquiry.id,
        savedEnquiry.createdAt,
        savedEnquiry.name,
        savedEnquiry.email,
        savedEnquiry.subject,
        savedEnquiry.message,
        savedEnquiry.status,
      ],
    )

    return savedEnquiry
  }

  const enquiries = await readEnquiries()

  await fs.writeFile(enquiriesFile, JSON.stringify([savedEnquiry, ...enquiries], null, 2), "utf8")

  return savedEnquiry
}

export const updateEnquiryStatus = async (enquiryId: string, status: EnquiryStatus) => {
  if (hasSupabase()) {
    const { data, error } = await getSupabase()
      .from("enquiries")
      .update({ status })
      .eq("id", enquiryId)
      .select("*")
      .maybeSingle()

    if (error) throw new Error(`Failed to update Supabase enquiry: ${error.message}`)

    return data ? rowToEnquiry(data as EnquiryRow) : null
  }

  if (hasDatabase()) {
    const result = await query<EnquiryRow>("update enquiries set status = $2 where id = $1 returning *", [enquiryId, status])

    return result.rows[0] ? rowToEnquiry(result.rows[0]) : null
  }

  const enquiries = await readEnquiries()
  const enquiryExists = enquiries.some((enquiry) => enquiry.id === enquiryId)

  if (!enquiryExists) return null

  const nextEnquiries = enquiries.map((enquiry) => (enquiry.id === enquiryId ? { ...enquiry, status } : enquiry))
  await fs.writeFile(enquiriesFile, JSON.stringify(nextEnquiries, null, 2), "utf8")

  return nextEnquiries.find((enquiry) => enquiry.id === enquiryId) || null
}
