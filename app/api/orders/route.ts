import { NextResponse } from "next/server"

import { checkoutProducts } from "@/lib/checkout"
import { getOrderDownloadUrl, sendOrderConfirmationEmail } from "@/lib/email"
import { getOrderAccessToken } from "@/lib/order-access"
import { clearOrders, readOrders, saveOrder, updateOrderFulfilmentStatus, updateOrderPaymentStatus, type FulfilmentStatus, type OrderRecord, type PaymentStatus } from "@/lib/orders"
import { checkRateLimit, getClientIp, rateLimitResponseHeaders } from "@/lib/rate-limit"

const fulfilmentStatuses: FulfilmentStatus[] = ["new", "in_progress", "ready", "sent"]
const paymentStatuses: PaymentStatus[] = ["payment_pending", "paid_demo", "paid"]
const checkoutProductIds = Object.keys(checkoutProducts)
const maxOrderIdLength = 80
const maxShortTextLength = 160
const maxEmailLength = 254
const maxChoices = 20

const cleanText = (value: string, maxLength = maxShortTextLength) => value.trim().replace(/\s+/g, " ").slice(0, maxLength)
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

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

const isCheckoutProduct = (product: string): product is OrderRecord["product"] => checkoutProductIds.includes(product)

const normalizeNewOrder = (order: OrderRecord): OrderRecord => {
  const product = checkoutProducts[order.product]
  const createdAt = new Date().toISOString()
  const choices = (order.choices || []).slice(0, maxChoices).map((choice) => ({
    pageId: cleanText(choice.pageId, 80),
    choiceId: cleanText(choice.choiceId, 80),
    pathTag: choice.pathTag,
    text: cleanText(choice.text, 240),
  }))

  return {
    ...order,
    id: cleanText(order.id, maxOrderIdLength),
    createdAt,
    total: product.price,
    email: order.email.trim().toLowerCase().slice(0, maxEmailLength),
    phone: order.phone ? cleanText(order.phone, 40) : undefined,
    heroName: cleanText(order.heroName),
    heroType: cleanText(order.heroType),
    storyTitle: cleanText(order.storyTitle, 220),
    storyId: cleanText(order.storyId, 80),
    choices,
    postage: order.postage
      ? {
          fullName: cleanText(order.postage.fullName || ""),
          addressLine1: cleanText(order.postage.addressLine1 || ""),
          addressLine2: cleanText(order.postage.addressLine2 || ""),
          city: cleanText(order.postage.city || ""),
          postcode: cleanText(order.postage.postcode || "", 40),
          country: cleanText(order.postage.country || "", 80),
        }
      : undefined,
    status: "payment_pending",
    fulfilmentStatus: "new",
    fulfilmentUpdatedAt: createdAt,
    emailSentAt: undefined,
    downloadUrl: getOrderDownloadUrl(order.id),
  }
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

    if (!isCheckoutProduct(order.product)) {
      return NextResponse.json({ error: "Invalid order product" }, { status: 400 })
    }

    const normalisedOrder = normalizeNewOrder(order)

    if (
      !normalisedOrder.id ||
      !isValidEmail(normalisedOrder.email) ||
      !normalisedOrder.heroName ||
      !normalisedOrder.heroType ||
      !normalisedOrder.storyTitle ||
      !normalisedOrder.storyId
    ) {
      return NextResponse.json({ error: "Invalid order" }, { status: 400 })
    }

    if (normalisedOrder.postage && (!normalisedOrder.postage.fullName || !normalisedOrder.postage.addressLine1 || !normalisedOrder.postage.city || !normalisedOrder.postage.postcode)) {
      return NextResponse.json({ error: "Invalid postage details" }, { status: 400 })
    }

    const clientIp = getClientIp(request)
    const rateLimit = checkRateLimit({
      key: `order:${clientIp}:${normalisedOrder.email}`,
      limit: 8,
      windowMs: 60 * 60 * 1000,
    })

    if (!rateLimit.ok) {
      return NextResponse.json(
        { error: "Too many order attempts. Please try again shortly." },
        { status: 429, headers: rateLimitResponseHeaders(rateLimit.resetAt) },
      )
    }

    if (!isValidEmail(order.email.trim().toLowerCase())) {
      return NextResponse.json({ error: "Invalid order email" }, { status: 400 })
    }

    const existingOrders = await readOrders()
    const existingOrder = existingOrders.find((savedOrder) => savedOrder.id === normalisedOrder.id)

    if (existingOrder) {
      return NextResponse.json({ error: "Order already exists" }, { status: 409 })
    }

    const savedOrder = await saveOrder(normalisedOrder)
    return NextResponse.json(
      {
        order: savedOrder,
        accessToken: getOrderAccessToken(savedOrder.id),
      },
      { status: 201 },
    )
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
    if (process.env.NODE_ENV === "production" && process.env.ALLOW_ORDER_CLEAR !== "1") {
      return NextResponse.json({ error: "Clearing orders is disabled in production" }, { status: 403 })
    }

    await clearOrders()
    return NextResponse.json({ orders: [] })
  } catch (error) {
    console.error("Failed to clear orders:", error)
    return NextResponse.json({ error: "Failed to clear orders" }, { status: 500 })
  }
}
