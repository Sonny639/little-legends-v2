import { type NextRequest, NextResponse } from "next/server"

import {
  createOrderStoryArtworkLinks,
  getOrderStoryArtworkSummary,
  readOrderStoryArtworkManifest,
  startOrderStoryArtwork,
  syncOrderStoryArtwork,
} from "@/lib/order-story-artwork"
import { getTrustedAppUrl } from "@/lib/app-url"
import { hasValidOrderAccess } from "@/lib/order-access"
import { isSafeOrderId } from "@/lib/order-id"
import { readOrders } from "@/lib/orders"

export const maxDuration = 300

const isPaid = (status: string) => status === "paid" || status === "paid_demo"

const getPaidOrder = async (orderId: string) => {
  const order = (await readOrders()).find((candidate) => candidate.id === orderId)

  if (!order) throw new Error("Order not found.")
  if (!isPaid(order.status)) throw new Error("Payment is not confirmed yet.")

  return order
}

export async function POST(request: NextRequest) {
  try {
    const { orderId, accessToken } = await request.json()

    if (typeof orderId !== "string" || !orderId.trim() || !isSafeOrderId(orderId.trim())) {
      return NextResponse.json({ error: "Order id is required." }, { status: 400 })
    }

    const cleanedOrderId = orderId.trim()

    if (typeof accessToken !== "string" || !hasValidOrderAccess(cleanedOrderId, accessToken)) {
      return NextResponse.json({ error: "Order access is invalid." }, { status: 403 })
    }

    const order = await getPaidOrder(cleanedOrderId)
    const manifest = await startOrderStoryArtwork(order, getTrustedAppUrl(request))
    const summary = getOrderStoryArtworkSummary(manifest)

    return NextResponse.json({ artwork: { ...summary, pages: manifest.pages } })
  } catch (error) {
    console.error("Failed to start story artwork:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start story artwork." },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const orderId = request.nextUrl.searchParams.get("orderId")?.trim()
    const accessToken = request.nextUrl.searchParams.get("access")?.trim()

    if (!orderId || !isSafeOrderId(orderId)) {
      return NextResponse.json({ error: "Order id is required." }, { status: 400 })
    }

    if (!hasValidOrderAccess(orderId, accessToken)) {
      return NextResponse.json({ error: "Order access is invalid." }, { status: 403 })
    }

    await getPaidOrder(orderId)
    const manifest = await readOrderStoryArtworkManifest(orderId)

    if (!manifest) {
      return NextResponse.json({
        artwork: {
          totalPages: 0,
          readyCount: 0,
          failedCount: 0,
          complete: false,
          pages: [],
        },
      })
    }

    const syncedManifest = await syncOrderStoryArtwork(manifest)
    const linkedManifest = await createOrderStoryArtworkLinks(syncedManifest)
    const summary = getOrderStoryArtworkSummary(linkedManifest)

    return NextResponse.json({
      artwork: {
        ...summary,
        pages: linkedManifest.pages,
      },
    })
  } catch (error) {
    console.error("Failed to read story artwork status:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to read story artwork status." },
      { status: 500 },
    )
  }
}
