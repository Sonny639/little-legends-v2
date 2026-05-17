import { type NextRequest, NextResponse } from "next/server"

import {
  createOrderStoryArtworkLinks,
  getOrderStoryArtworkSummary,
  readOrderStoryArtworkManifest,
  startOrderStoryArtwork,
  syncOrderStoryArtwork,
} from "@/lib/order-story-artwork"
import { hasValidOrderAccess } from "@/lib/order-access"
import { readOrders } from "@/lib/orders"

export const maxDuration = 300

const isPaid = (status: string) => status === "paid" || status === "paid_demo"

const getAppUrl = (request: Request) => {
  const origin = request.headers.get("origin")

  if (origin && origin !== "null") return origin.replace(/\/$/, "")

  const forwardedHost = request.headers.get("x-forwarded-host")
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https"

  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return "http://localhost:3003"
}

const getPaidOrder = async (orderId: string) => {
  const order = (await readOrders()).find((candidate) => candidate.id === orderId)

  if (!order) throw new Error("Order not found.")
  if (!isPaid(order.status)) throw new Error("Payment is not confirmed yet.")

  return order
}

export async function POST(request: NextRequest) {
  try {
    const { orderId, accessToken } = await request.json()

    if (typeof orderId !== "string" || !orderId.trim()) {
      return NextResponse.json({ error: "Order id is required." }, { status: 400 })
    }

    if (typeof accessToken !== "string" || !hasValidOrderAccess(orderId, accessToken)) {
      return NextResponse.json({ error: "Order access is invalid." }, { status: 403 })
    }

    const order = await getPaidOrder(orderId)
    const manifest = await startOrderStoryArtwork(order, getAppUrl(request))
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

    if (!orderId) {
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
