import { NextResponse } from "next/server"

import { readEnquiries, saveEnquiry, updateEnquiryStatus, type EnquiryStatus } from "@/lib/enquiries"

const enquiryStatuses: EnquiryStatus[] = ["new", "replied", "closed"]

export async function GET() {
  try {
    const enquiries = await readEnquiries()
    return NextResponse.json({ enquiries })
  } catch (error) {
    console.error("Failed to read enquiries:", error)
    return NextResponse.json({ error: "Failed to read enquiries" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json()

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof subject !== "string" ||
      typeof message !== "string" ||
      !email.includes("@")
    ) {
      return NextResponse.json({ error: "Invalid enquiry" }, { status: 400 })
    }

    const enquiry = await saveEnquiry({
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
    })

    return NextResponse.json({ enquiry }, { status: 201 })
  } catch (error) {
    console.error("Failed to save enquiry:", error)
    return NextResponse.json({ error: "Failed to save enquiry" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { enquiryId, status } = await request.json()

    if (typeof enquiryId !== "string" || !enquiryStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid enquiry update" }, { status: 400 })
    }

    const enquiry = await updateEnquiryStatus(enquiryId, status)

    if (!enquiry) {
      return NextResponse.json({ error: "Enquiry not found" }, { status: 404 })
    }

    return NextResponse.json({ enquiry })
  } catch (error) {
    console.error("Failed to update enquiry:", error)
    return NextResponse.json({ error: "Failed to update enquiry" }, { status: 500 })
  }
}
