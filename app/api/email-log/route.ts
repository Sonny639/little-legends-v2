import { NextResponse } from "next/server"

import { readEmailLog } from "@/lib/email"

export async function GET() {
  try {
    const emails = await readEmailLog()
    return NextResponse.json({ emails })
  } catch (error) {
    console.error("Failed to read email log:", error)
    return NextResponse.json({ error: "Failed to read email log" }, { status: 500 })
  }
}
