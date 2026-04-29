import { NextResponse } from "next/server"

import { sendOrderConfirmationEmail } from "@/lib/email"
import { readOrders } from "@/lib/orders"

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json()

    if (typeof orderId !== "string") {
      return NextResponse.json({ error: "Invalid email request" }, { status: 400 })
    }

    const orders = await readOrders()
    const order = orders.find((savedOrder) => savedOrder.id === orderId)

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.status !== "paid" && order.status !== "paid_demo") {
      return NextResponse.json({ error: "Order is not paid yet" }, { status: 400 })
    }

    const email = await sendOrderConfirmationEmail(order)

    return NextResponse.json({ email })
  } catch (error) {
    console.error("Failed to send order email:", error)
    return NextResponse.json({ error: "Failed to send order email" }, { status: 500 })
  }
}
