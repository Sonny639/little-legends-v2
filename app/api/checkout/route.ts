import { NextResponse } from "next/server"

import { checkoutProducts } from "@/lib/checkout"
import { getTrustedAppUrl } from "@/lib/app-url"
import { hasValidOrderAccess } from "@/lib/order-access"
import { readOrders, type OrderRecord } from "@/lib/orders"
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

export async function POST(request: Request) {
  try {
    const { order, accessToken } = await request.json()

    if (!isCheckoutOrder(order)) {
      return NextResponse.json({ error: "Invalid checkout order" }, { status: 400 })
    }

    const savedOrders = await readOrders()
    const savedOrder = savedOrders.find((candidate) => candidate.id === order.id)

    if (!savedOrder) {
      return NextResponse.json({ error: "Order must be saved before checkout" }, { status: 404 })
    }

    if (typeof accessToken !== "string" || !hasValidOrderAccess(savedOrder.id, accessToken)) {
      return NextResponse.json({ error: "Order access is invalid" }, { status: 403 })
    }

    const product = checkoutProducts[savedOrder.product]

    if (!product) {
      return NextResponse.json({ error: "Invalid checkout product" }, { status: 400 })
    }

    const appUrl = getTrustedAppUrl(request)
    const stripeSuccessUrl = `${appUrl}/checkout/success?orderId=${encodeURIComponent(savedOrder.id)}&session_id={CHECKOUT_SESSION_ID}`
    const demoSuccessUrl = `${appUrl}/checkout/success?orderId=${encodeURIComponent(savedOrder.id)}`
    const cancelUrl = `${appUrl}/checkout/cancel?orderId=${encodeURIComponent(savedOrder.id)}`
    const expectedTotalPence = Math.round(savedOrder.total * 100)
    const shippingAmountPence = savedOrder.product === "digital" ? 0 : Math.max(0, expectedTotalPence - product.unitAmountPence)
    const lineItems = [
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
      ...(shippingAmountPence > 0
        ? [
            {
              quantity: 1,
              price_data: {
                currency: product.currency,
                unit_amount: shippingAmountPence,
                product_data: {
                  name: savedOrder.postage?.shippingLabel || "International delivery",
                  description: `Delivery to ${savedOrder.postage?.country || "your address"}`,
                },
              },
            },
          ]
        : []),
    ]

    if (stripe) {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: savedOrder.email,
        allow_promotion_codes: true,
        success_url: stripeSuccessUrl,
        cancel_url: cancelUrl,
        client_reference_id: savedOrder.id,
        metadata: {
          orderId: savedOrder.id,
          product: savedOrder.product,
          storyId: savedOrder.storyId,
        },
        line_items: lineItems,
      })

      return NextResponse.json({
        checkout: {
          id: session.id,
          sessionId: session.id,
          mode: "stripe",
          orderId: savedOrder.id,
          amountSubtotal: session.amount_subtotal,
          amountTotal: session.amount_total,
          currency: session.currency,
          url: session.url,
          successUrl: stripeSuccessUrl,
          cancelUrl,
        },
      })
    }

    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Secure checkout is not configured" }, { status: 503 })
    }

    return NextResponse.json({
      checkout: {
        id: `mock_checkout_${savedOrder.id}`,
        sessionId: `mock_checkout_${savedOrder.id}`,
        mode: "demo",
        orderId: savedOrder.id,
        amountSubtotal: expectedTotalPence,
        amountTotal: expectedTotalPence,
        currency: product.currency,
        url: demoSuccessUrl,
        successUrl: demoSuccessUrl,
        cancelUrl,
        lineItems: lineItems.map((lineItem) => ({
          quantity: lineItem.quantity,
          priceData: {
            currency: lineItem.price_data.currency,
            unitAmount: lineItem.price_data.unit_amount,
            productData: {
              name: lineItem.price_data.product_data.name,
              description: lineItem.price_data.product_data.description,
            },
            lookupKey: product.stripeLookupKey,
          },
        })),
      },
    })
  } catch (error) {
    console.error("Failed to create checkout session:", error)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}
