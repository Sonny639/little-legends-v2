import { NextResponse } from "next/server"
import Stripe from "stripe"

import { sendOrderConfirmationEmail } from "@/lib/email"
import { updateOrderPaymentStatus } from "@/lib/orders"
import { stripe, stripeWebhookSecret } from "@/lib/stripe"

export const runtime = "nodejs"

const paidEvents = new Set<Stripe.Event.Type>(["checkout.session.completed", "checkout.session.async_payment_succeeded"])

export async function POST(request: Request) {
  if (!stripe || !stripeWebhookSecret) {
    return NextResponse.json({ error: "Stripe webhook is not configured" }, { status: 500 })
  }

  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    const rawBody = await request.text()
    event = stripe.webhooks.constructEvent(rawBody, signature, stripeWebhookSecret)
  } catch (error) {
    console.error("Invalid Stripe webhook signature:", error)
    return NextResponse.json({ error: "Invalid Stripe webhook signature" }, { status: 400 })
  }

  if (paidEvents.has(event.type)) {
    const session = event.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.orderId || session.client_reference_id

    if (!orderId) {
      return NextResponse.json({ error: "Stripe session is missing orderId" }, { status: 400 })
    }

    const updatedOrder = await updateOrderPaymentStatus(orderId, "paid")

    if (!updatedOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (!updatedOrder.emailSentAt) {
      await sendOrderConfirmationEmail(updatedOrder)
    }
  }

  return NextResponse.json({ received: true })
}
