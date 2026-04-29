import { NextResponse } from "next/server"

import { getOrderDownloadUrl, sendOrderConfirmationEmail } from "@/lib/email"
import { clearOrders, readOrders, saveOrder, updateOrderFulfilmentStatus, updateOrderPaymentStatus, type FulfilmentStatus, type OrderRecord, type PaymentStatus } from "@/lib/orders"

const fulfilmentStatuses: FulfilmentStatus[] = ["new", "in_progress", "ready", "sent"]
const paymentStatuses: PaymentStatus[] = ["payment_pending", "paid_demo", "paid"]

const isOrderRecord = (value: unknown): value is OrderRecord => {
  if (!value || typeof value !== "object") return false

  const order = value as Partial<OrderRecord>

  return (
    typeof order.id === "string" &&
    typeof order.createdAt === "string" &&
    typeof order.product === "string" &&
    typeof order.total === "number" &&
    typeof order.email === "string" &&
    typeof order.heroName === "string" &&
    typeof order.heroType === "string" &&
    typeof order.storyTitle === "string" &&
    typeof order.storyId === "string" &&
    Array.isArray(order.choices) &&
    typeof order.status === "string"
  )
}

export async function GET() {
  try {
    const orders = await readOrders()
    return NextResponse.json({ orders })
  } catch (error) {
    console.error("Failed to read orders:", error)
    return NextResponse.json({ error: "Failed to read orders" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const order = await request.json()

    if (!isOrderRecord(order)) {
      return NextResponse.json({ error: "Invalid order" }, { status: 400 })
    }

    const savedOrder = await saveOrder({
      ...order,
      downloadUrl: order.downloadUrl || getOrderDownloadUrl(order.id),
    })
    return NextResponse.json({ order: savedOrder }, { status: 201 })
  } catch (error) {
    console.error("Failed to save order:", error)
    return NextResponse.json({ error: "Failed to save order" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { orderId, fulfilmentStatus, status } = await request.json()

    if (typeof orderId !== "string") {
      return NextResponse.json({ error: "Invalid order update" }, { status: 400 })
    }

    if (paymentStatuses.includes(status)) {
      const updatedOrder = await updateOrderPaymentStatus(orderId, status)

      if (!updatedOrder) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 })
      }

      if ((status === "paid" || status === "paid_demo") && !updatedOrder.emailSentAt) {
        const email = await sendOrderConfirmationEmail(updatedOrder)
        return NextResponse.json({
          order: {
            ...updatedOrder,
            emailSentAt: email.sentAt,
            downloadUrl: email.downloadUrl,
          },
        })
      }

      return NextResponse.json({ order: updatedOrder })
    }

    if (fulfilmentStatuses.includes(fulfilmentStatus)) {
      const updatedOrder = await updateOrderFulfilmentStatus(orderId, fulfilmentStatus)

      if (!updatedOrder) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 })
      }

      return NextResponse.json({ order: updatedOrder })
    }

    return NextResponse.json({ error: "Invalid order update" }, { status: 400 })
  } catch (error) {
    console.error("Failed to update order:", error)
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    await clearOrders()
    return NextResponse.json({ orders: [] })
  } catch (error) {
    console.error("Failed to clear orders:", error)
    return NextResponse.json({ error: "Failed to clear orders" }, { status: 500 })
  }
}
