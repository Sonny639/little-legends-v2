import { NextResponse } from "next/server"

import { deleteEmailLogEntry, readEmailLog } from "@/lib/email"

export async function GET() {
  try {
    const emails = await readEmailLog()
    return NextResponse.json({ emails })
  } catch (error) {
    console.error("Failed to read email log:", error)
    return NextResponse.json({ error: "Failed to read email log" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const emailId = new URL(request.url).searchParams.get("emailId")?.trim().slice(0, 120)

    if (!emailId) {
      return NextResponse.json({ error: "Email id is required" }, { status: 400 })
    }

    const deleted = await deleteEmailLogEntry(emailId)

    if (!deleted) {
      return NextResponse.json({ error: "Email log not found" }, { status: 404 })
    }

    return NextResponse.json({ deleted: true, emailId })
  } catch (error) {
    console.error("Failed to delete email log:", error)
    return NextResponse.json({ error: "Failed to delete email log" }, { status: 500 })
  }
}
