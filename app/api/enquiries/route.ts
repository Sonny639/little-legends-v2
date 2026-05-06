import { NextResponse } from "next/server"

import { sendContactEmail } from "@/lib/contact-email"
import { readEnquiries, saveEnquiry, updateEnquiryStatus, type EnquiryStatus } from "@/lib/enquiries"
import { checkRateLimit, getClientIp, rateLimitResponseHeaders } from "@/lib/rate-limit"

const enquiryStatuses: EnquiryStatus[] = ["new", "replied", "closed"]
const maxNameLength = 120
const maxEmailLength = 254
const maxSubjectLength = 160
const maxMessageLength = 3000

const cleanText = (value: string, maxLength: number) => value.trim().replace(/\s+/g, " ").slice(0, maxLength)
const cleanMessage = (value: string) => value.trim().slice(0, maxMessageLength)

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

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
    const { name, email, subject, message, source, company, website } = await request.json()

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof subject !== "string" ||
      typeof message !== "string" ||
      typeof source !== "undefined" && typeof source !== "string"
    ) {
      return NextResponse.json({ error: "Invalid enquiry" }, { status: 400 })
    }

    if ((typeof company === "string" && company.trim()) || (typeof website === "string" && website.trim())) {
      return NextResponse.json({ ok: true }, { status: 202 })
    }

    const cleanedName = cleanText(name, maxNameLength)
    const cleanedEmail = email.trim().toLowerCase().slice(0, maxEmailLength)
    const cleanedSubject = cleanText(subject, maxSubjectLength)
    const cleanedMessage = cleanMessage(message)

    if (!cleanedName || !isValidEmail(cleanedEmail) || !cleanedSubject || cleanedMessage.length < 2) {
      return NextResponse.json({ error: "Invalid enquiry" }, { status: 400 })
    }

    const clientIp = getClientIp(request)
    const rateLimit = checkRateLimit({
      key: `enquiry:${clientIp}:${cleanedEmail}`,
      limit: 6,
      windowMs: 60 * 60 * 1000,
    })

    if (!rateLimit.ok) {
      return NextResponse.json(
        { error: "Too many enquiries. Please try again shortly." },
        { status: 429, headers: rateLimitResponseHeaders(rateLimit.resetAt) },
      )
    }

    const enquiry = await saveEnquiry({
      name: cleanedName,
      email: cleanedEmail,
      subject: cleanedSubject,
      message: cleanedMessage,
    })

    if (source === "contact") {
      const notification = await sendContactEmail({
        name: cleanedName,
        email: cleanedEmail,
        subject: cleanedSubject,
        message: cleanedMessage,
      })

      if (!notification.sent) {
        console.warn("Enquiry saved but contact email notification was not sent:", notification.reason)
        return NextResponse.json({ enquiry, notification }, { status: 202 })
      }

      return NextResponse.json({ enquiry, notification }, { status: 201 })
    }

    return NextResponse.json({ enquiry }, { status: 201 })
  } catch (error) {
    console.error("Failed to save enquiry:", error)
    return NextResponse.json(
      {
        error: "Failed to save enquiry",
        ...(process.env.NEXT_PUBLIC_APP_URL?.includes("localhost") && error instanceof Error
          ? { detail: error.message }
          : {}),
      },
      { status: 500 },
    )
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
