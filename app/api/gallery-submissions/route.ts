import { NextResponse } from "next/server"

import { saveEnquiry } from "@/lib/enquiries"
import { sendGallerySubmissionEmail } from "@/lib/gallery-submission-email"
import { checkRateLimit, getClientIp, rateLimitResponseHeaders } from "@/lib/rate-limit"
import { isRequestTooLarge } from "@/lib/request-size"

export const runtime = "nodejs"

const maxNameLength = 120
const maxEmailLength = 254
const maxOrderReferenceLength = 120
const maxReviewLength = 1800
const maxPhotos = 4
const maxPhotoSize = 2 * 1024 * 1024
const maxTotalPhotoSize = 8 * 1024 * 1024
const maxRequestSize = 10 * 1024 * 1024
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"])

const cleanText = (value: string, maxLength: number) => value.trim().replace(/\s+/g, " ").slice(0, maxLength)
const cleanReview = (value: string) => value.trim().slice(0, maxReviewLength)
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
const safeFilename = (value: string, index: number) => {
  const fallback = `gallery-photo-${index + 1}.jpg`
  const cleaned = value.trim().replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(0, 90)
  return cleaned || fallback
}
const hasBytes = (buffer: Buffer, expected: number[], offset = 0) =>
  expected.every((byte, index) => buffer[offset + index] === byte)
const getDetectedMimeType = (buffer: Buffer) => {
  if (hasBytes(buffer, [0xff, 0xd8, 0xff])) return "image/jpeg"
  if (hasBytes(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png"
  if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return "image/webp"
  return ""
}

export async function POST(request: Request) {
  try {
    if (isRequestTooLarge(request, maxRequestSize)) {
      return NextResponse.json({ error: "Please keep the total upload under 8MB." }, { status: 413 })
    }

    const formData = await request.formData()
    const name = formData.get("name")
    const email = formData.get("email")
    const orderReference = formData.get("orderReference")
    const review = formData.get("review")
    const permission = formData.get("permission")
    const company = formData.get("company")

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof review !== "string" ||
      typeof permission !== "string" ||
      (orderReference !== null && typeof orderReference !== "string")
    ) {
      return NextResponse.json({ error: "Invalid gallery submission" }, { status: 400 })
    }

    if (typeof company === "string" && company.trim()) {
      return NextResponse.json({ ok: true }, { status: 202 })
    }

    const cleanedName = cleanText(name, maxNameLength)
    const cleanedEmail = email.trim().toLowerCase().slice(0, maxEmailLength)
    const cleanedOrderReference = typeof orderReference === "string" ? cleanText(orderReference, maxOrderReferenceLength) : ""
    const cleanedReview = cleanReview(review)

    if (!cleanedName || !isValidEmail(cleanedEmail) || cleanedReview.length < 8 || permission !== "yes") {
      return NextResponse.json({ error: "Please complete the required fields and permission checkbox." }, { status: 400 })
    }

    const photos = formData.getAll("photos").filter((value): value is File => value instanceof File && value.size > 0)

    if (photos.length === 0) {
      return NextResponse.json({ error: "Please upload at least one photo." }, { status: 400 })
    }

    if (photos.length > maxPhotos) {
      return NextResponse.json({ error: `Please upload no more than ${maxPhotos} photos.` }, { status: 400 })
    }

    const totalPhotoSize = photos.reduce((total, photo) => total + photo.size, 0)

    if (totalPhotoSize > maxTotalPhotoSize) {
      return NextResponse.json({ error: "Please keep the total upload under 8MB." }, { status: 400 })
    }

    for (const photo of photos) {
      if (!allowedTypes.has(photo.type)) {
        return NextResponse.json({ error: "Photos must be JPG, PNG, or WebP files." }, { status: 400 })
      }

      if (photo.size > maxPhotoSize) {
        return NextResponse.json({ error: "Each photo must be 2MB or smaller." }, { status: 400 })
      }
    }

    const clientIp = getClientIp(request)
    const rateLimit = checkRateLimit({
      key: `gallery:${clientIp}:${cleanedEmail}`,
      limit: 3,
      windowMs: 60 * 60 * 1000,
    })

    if (!rateLimit.ok) {
      return NextResponse.json(
        { error: "Too many gallery submissions. Please try again shortly." },
        { status: 429, headers: rateLimitResponseHeaders(rateLimit.resetAt) },
      )
    }

    const attachments = await Promise.all(
      photos.map(async (photo, index) => {
        const content = Buffer.from(await photo.arrayBuffer())

        if (getDetectedMimeType(content) !== photo.type) {
          throw new Error("Uploaded photos must be valid JPG, PNG, or WebP image files.")
        }

        return {
          filename: safeFilename(photo.name, index),
          contentType: photo.type,
          content,
        }
      }),
    )

    const permissionNote =
      "The sender ticked the permission box confirming they are happy for Little Legends Story to review the submitted photos/review for possible publication, and that they will only be published after admin approval."
    const enquiryMessage = [
      "Gallery submission",
      ...(cleanedOrderReference ? [`Order/reference number: ${cleanedOrderReference}`] : []),
      "",
      "Review:",
      cleanedReview,
      "",
      `Photos attached by email: ${attachments.map((attachment) => attachment.filename).join(", ")}`,
      "",
      permissionNote,
    ].join("\n")

    const enquiry = await saveEnquiry({
      name: cleanedName,
      email: cleanedEmail,
      subject: "Gallery submission",
      message: enquiryMessage,
    })

    const notification = await sendGallerySubmissionEmail({
      name: cleanedName,
      email: cleanedEmail,
      orderReference: cleanedOrderReference,
      review: cleanedReview,
      permissionNote,
      attachments,
    })

    if (!notification.sent) {
      console.warn("Gallery submission saved but email was not sent:", notification.reason)
      return NextResponse.json({ enquiry, notification }, { status: 202 })
    }

    return NextResponse.json({ enquiry, notification }, { status: 201 })
  } catch (error) {
    console.error("Failed to save gallery submission:", error)
    if (error instanceof Error && error.message.startsWith("Uploaded photos")) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: "Failed to save gallery submission" }, { status: 500 })
  }
}
