import { NextResponse } from "next/server"

import fs from "fs/promises"

import { listOrderPhotos, saveOrderPhotos } from "@/lib/order-photos"
import { getSupabaseAdmin, hasSupabaseAdmin } from "@/lib/supabase-admin"
import { readOrders } from "@/lib/orders"

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

    if (photos.length === 0) {
      return NextResponse.json({ photos: [] })
    }

    if (hasSupabaseAdmin()) {
      const bucket = process.env.SUPABASE_STORAGE_BUCKET || "order-photos"
      const client = getSupabaseAdmin()
      const { data, error } = await client.storage
        .from(bucket)
        .createSignedUrls(
          photos.map((photo) => photo.storagePath),
          60 * 60,
        )

      if (error) {
        throw new Error(`Failed to create photo preview links: ${error.message}`)
      }

      return NextResponse.json({
        photos: photos.map((photo, index) => ({
          ...photo,
          url: data?.[index]?.signedUrl || "",
        })),
      })
    }

    const localPhotos = await Promise.all(
      photos.map(async (photo) => {
        const buffer = await fs.readFile(photo.storagePath)

        return {
          ...photo,
          url: `data:${photo.mimeType};base64,${buffer.toString("base64")}`,
        }
      }),
    )

    return NextResponse.json({ photos: localPhotos })
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
    const files = formData.getAll("photos").filter(isFile)

    if (typeof orderId !== "string" || !orderId.trim()) {
      return NextResponse.json({ error: "Order id is required" }, { status: 400 })
    }

    const orders = await readOrders()
    const orderExists = orders.some((order) => order.id === orderId)

    if (!orderExists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
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
