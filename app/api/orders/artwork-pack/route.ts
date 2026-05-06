import { NextResponse } from "next/server"

import { createOrderArtworkPack, getOrderArtworkPackCsv } from "@/lib/order-artwork-pack"
import { readOrders } from "@/lib/orders"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get("orderId")?.trim()
    const format = searchParams.get("format")

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 })
    }

    const orders = await readOrders()
    const order = orders.find((savedOrder) => savedOrder.id === orderId)

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const pack = await createOrderArtworkPack(order)

    if (format === "csv") {
      const fileName = `little-legends-artwork-pack-${order.id}.csv`

      return new Response(getOrderArtworkPackCsv(pack), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${fileName}"`,
        },
      })
    }

    return NextResponse.json(pack)
  } catch (error) {
    console.error("Failed to create order artwork pack:", error)
    return NextResponse.json({ error: "Failed to create order artwork pack" }, { status: 500 })
  }
}
