import { NextResponse } from "next/server"

import { createGalleryEntry, deleteGalleryEntry, readGalleryEntriesWithUrls, updateGalleryEntryStatus, type GalleryEntryStatus } from "@/lib/gallery"
import { isRequestTooLarge } from "@/lib/request-size"

export const runtime = "nodejs"

const galleryStatuses: GalleryEntryStatus[] = ["draft", "published"]
const maxGalleryUploadBytes = 28 * 1024 * 1024

export async function GET() {
  try {
    const entries = await readGalleryEntriesWithUrls()
    return NextResponse.json({ entries })
  } catch (error) {
    console.error("Failed to read gallery entries:", error)
    return NextResponse.json({ error: "Failed to read gallery entries" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    if (isRequestTooLarge(request, maxGalleryUploadBytes)) {
      return NextResponse.json({ error: "Gallery upload is too large" }, { status: 413 })
    }

    const formData = await request.formData()
    const title = String(formData.get("title") || "")
    const review = String(formData.get("review") || "")
    const credit = String(formData.get("credit") || "")
    const status = String(formData.get("status") || "draft")
    const files = formData.getAll("images").filter((file): file is File => file instanceof File && file.size > 0)

    if (!galleryStatuses.includes(status as GalleryEntryStatus)) {
      return NextResponse.json({ error: "Invalid gallery status" }, { status: 400 })
    }

    const entry = await createGalleryEntry({
      title,
      review,
      credit,
      status: status as GalleryEntryStatus,
      files,
    })

    return NextResponse.json({ entry }, { status: 201 })
  } catch (error) {
    console.error("Failed to create gallery entry:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create gallery entry" },
      { status: 400 },
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const { entryId, status } = await request.json()

    if (typeof entryId !== "string" || !galleryStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid gallery update" }, { status: 400 })
    }

    const entry = await updateGalleryEntryStatus(entryId, status)

    if (!entry) {
      return NextResponse.json({ error: "Gallery entry not found" }, { status: 404 })
    }

    return NextResponse.json({ entry })
  } catch (error) {
    console.error("Failed to update gallery entry:", error)
    return NextResponse.json({ error: "Failed to update gallery entry" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const entryId = new URL(request.url).searchParams.get("entryId")

    if (!entryId) {
      return NextResponse.json({ error: "Missing gallery entry id" }, { status: 400 })
    }

    const deleted = await deleteGalleryEntry(entryId)

    if (!deleted) {
      return NextResponse.json({ error: "Gallery entry not found" }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Failed to delete gallery entry:", error)
    return NextResponse.json({ error: "Failed to delete gallery entry" }, { status: 500 })
  }
}
