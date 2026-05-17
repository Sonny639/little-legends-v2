import { NextResponse } from "next/server"

import { checkoutProducts } from "@/lib/checkout"
import { getOrderDownloadUrl } from "@/lib/email"
import { hasValidOrderAccess } from "@/lib/order-access"
import { readOrders, saveOrder, type OrderRecord } from "@/lib/orders"

type UpgradeRequest = {
  orderId?: string
  accessToken?: string
  postage?: Partial<NonNullable<OrderRecord["postage"]>>
}

const cleanText = (value: string, maxLength = 160) => value.trim().replace(/\s+/g, " ").slice(0, maxLength)
const createUpgradeOrderId = () => {
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `LL-UP-${Date.now().toString(36).toUpperCase()}-${randomPart}`
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as UpgradeRequest
    const sourceOrderId = typeof body.orderId === "string" ? cleanText(body.orderId, 80) : ""
    const accessToken = typeof body.accessToken === "string" ? body.accessToken : ""
    const postage = body.postage

    if (!sourceOrderId || !postage || !hasValidOrderAccess(sourceOrderId, accessToken)) {
      return NextResponse.json({ error: "Invalid upgrade request" }, { status: 400 })
    }

    const fullName = cleanText(postage.fullName || "")
    const addressLine1 = cleanText(postage.addressLine1 || "")
    const addressLine2 = cleanText(postage.addressLine2 || "")
    const city = cleanText(postage.city || "")
    const postcode = cleanText(postage.postcode || "", 40)
    const country = cleanText(postage.country || "", 80)

    if (!fullName || !addressLine1 || !city || !postcode || !country) {
      return NextResponse.json({ error: "Invalid postage details" }, { status: 400 })
    }

    const orders = await readOrders()
    const sourceOrder = orders.find((order) => order.id === sourceOrderId)
    const isPaidDigitalOrder =
      sourceOrder?.product === "digital" && (sourceOrder.status === "paid" || sourceOrder.status === "paid_demo")

    if (!sourceOrder || !isPaidDigitalOrder) {
      return NextResponse.json({ error: "Only paid digital orders can be upgraded" }, { status: 400 })
    }

    const createdAt = new Date().toISOString()
    const upgradeOrder: OrderRecord = {
      ...sourceOrder,
      id: createUpgradeOrderId(),
      createdAt,
      product: "upgrade",
      total: checkoutProducts.upgrade.price,
      postage: {
        fullName,
        addressLine1,
        addressLine2,
        city,
        postcode,
        country,
      },
      status: "payment_pending",
      fulfilmentStatus: "new",
      fulfilmentUpdatedAt: createdAt,
      downloadUrl: getOrderDownloadUrl(sourceOrder.id),
      emailSentAt: undefined,
    }

    const savedOrder = await saveOrder(upgradeOrder)
    return NextResponse.json({ order: savedOrder }, { status: 201 })
  } catch (error) {
    console.error("Failed to create upgrade order:", error)
    return NextResponse.json({ error: "Failed to create upgrade order" }, { status: 500 })
  }
}
