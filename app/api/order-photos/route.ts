import { NextResponse } from "next/server"

import { hasValidOrderAccess } from "@/lib/order-access"
import { createOrderPhotoPreviewLinks, listOrderPhotos, saveOrderPhotos } from "@/lib/order-photos"
import { readOrders } from "@/lib/orders"
import { checkRateLimit, getClientIp, rateLimitResponseHeaders } from "@/lib/rate-limit"

const isFile = (value: FormDataEntryValue | null): value is File =>
  typeof File !== "undefined" && value instanceof File

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get("orderId")

    if (!orderId?.trim()) {
      return NextResponse.json({ error: "Order id is required" }, { status: 400 })
    }

    const photos = await listOrderPhotos(orderId)

    const photosWithPreviewLinks = await createOrderPhotoPreviewLinks(photos)

    return NextResponse.json({ photos: photosWithPreviewLinks })
  } catch (error) {
    console.error("Failed to read order photos:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to read order photos" },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const orderId = formData.get("orderId")
    const accessToken = formData.get("accessToken")
    const files = formData.getAll("photos").filter(isFile)

    if (typeof orderId !== "string" || !orderId.trim()) {
      return NextResponse.json({ error: "Order id is required" }, { status: 400 })
    }

    if (typeof accessToken !== "string" || !hasValidOrderAccess(orderId, accessToken)) {
      return NextResponse.json({ error: "Order access is invalid" }, { status: 403 })
    }

    const orders = await readOrders()
    const orderExists = orders.some((order) => order.id === orderId)

    if (!orderExists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const rateLimit = checkRateLimit({
      key: `order-photos:${getClientIp(request)}:${orderId}`,
      limit: 6,
      windowMs: 60 * 60 * 1000,
    })

    if (!rateLimit.ok) {
      return NextResponse.json(
        { error: "Too many photo upload attempts. Please try again shortly." },
        { status: 429, headers: rateLimitResponseHeaders(rateLimit.resetAt) },
      )
    }

    const savedPhotos = await saveOrderPhotos(orderId, files)

    return NextResponse.json({
      photos: savedPhotos.map((photo) => ({
        name: photo.name,
        size: photo.size,
        mimeType: photo.mimeType,
        uploadedAt: photo.uploadedAt,
        source: photo.source,
      })),
    })
  } catch (error) {
    console.error("Failed to save order photos:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save order photos" },
      { status: 500 },
    )
  }
}
