import { NextResponse } from "next/server"

import { checkoutProducts } from "@/lib/checkout"
import { type OrderRecord } from "@/lib/orders"
import { stripe } from "@/lib/stripe"

const isCheckoutOrder = (value: unknown): value is OrderRecord => {
  if (!value || typeof value !== "object") return false

  const order = value as Partial<OrderRecord>

  return (
    typeof order.id === "string" &&
    typeof order.email === "string" &&
    typeof order.product === "string" &&
    typeof order.total === "number" &&
    typeof order.storyTitle === "string"
  )
}

const trimTrailingSlash = (value: string) => value.replace(/\/$/, "")

const getAppUrl = (request: Request) => {
  const origin = request.headers.get("origin")

  if (origin && origin !== "null") {
    return trimTrailingSlash(origin)
  }

  const forwardedHost = request.headers.get("x-forwarded-host")
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https"

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`
  }

  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL

  if (configuredUrl) {
    return trimTrailingSlash(configuredUrl)
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  return "http://localhost:3003"
}

export async function POST(request: Request) {
  try {
    const { order } = await request.json()

    if (!isCheckoutOrder(order)) {
      return NextResponse.json({ error: "Invalid checkout order" }, { status: 400 })
    }

    const product = checkoutProducts[order.product]

    if (!product || order.total !== product.price) {
      return NextResponse.json({ error: "Invalid checkout product total" }, { status: 400 })
    }

    const appUrl = getAppUrl(request)
    const stripeSuccessUrl = `${appUrl}/checkout/success?orderId=${encodeURIComponent(order.id)}&session_id={CHECKOUT_SESSION_ID}`
    const demoSuccessUrl = `${appUrl}/checkout/success?orderId=${encodeURIComponent(order.id)}`
    const cancelUrl = `${appUrl}/create?checkout=cancelled&orderId=${encodeURIComponent(order.id)}`

    if (stripe) {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: order.email,
        success_url: stripeSuccessUrl,
        cancel_url: cancelUrl,
        client_reference_id: order.id,
        metadata: {
          orderId: order.id,
          product: order.product,
          storyId: order.storyId,
        },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: product.currency,
              unit_amount: product.unitAmountPence,
              product_data: {
                name: product.label,
                description: product.summary,
              },
            },
          },
        ],
      })

      return NextResponse.json({
        checkout: {
          id: session.id,
          sessionId: session.id,
          mode: "stripe",
          orderId: order.id,
          amountSubtotal: session.amount_subtotal,
          amountTotal: session.amount_total,
          currency: session.currency,
          url: session.url,
          successUrl: stripeSuccessUrl,
          cancelUrl,
        },
      })
    }

    return NextResponse.json({
      checkout: {
        id: `mock_checkout_${order.id}`,
        sessionId: `mock_checkout_${order.id}`,
        mode: "demo",
        orderId: order.id,
        amountSubtotal: product.unitAmountPence,
        amountTotal: product.unitAmountPence,
        currency: product.currency,
        url: demoSuccessUrl,
        successUrl: demoSuccessUrl,
        cancelUrl,
        lineItems: [
          {
            quantity: 1,
            priceData: {
              currency: product.currency,
              unitAmount: product.unitAmountPence,
              productData: {
                name: product.label,
                description: product.summary,
              },
              lookupKey: product.stripeLookupKey,
            },
          },
        ],
      },
    })
  } catch (error) {
    console.error("Failed to create checkout session:", error)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}
