import type Stripe from "stripe"

import { checkoutProducts } from "@/lib/checkout"
import type { OrderRecord } from "@/lib/orders"

export const getStripeSessionOrderIssue = (session: Stripe.Checkout.Session, order: OrderRecord) => {
  const product = checkoutProducts[order.product]
  const sessionOrderId = session.metadata?.orderId || session.client_reference_id
  const expectedSubtotal = Math.round(order.total * 100)
  const sessionSubtotal = session.amount_subtotal ?? session.amount_total

  if (!product) return "Saved order has an invalid product"
  if (sessionOrderId !== order.id) return "Stripe session order id does not match saved order"
  if (session.payment_status !== "paid") return "Stripe session is not paid"
  if (sessionSubtotal !== expectedSubtotal) return "Stripe session subtotal does not match saved order"
  if (session.currency !== product.currency) return "Stripe session currency does not match saved order"
  if (session.metadata?.product && session.metadata.product !== order.product) {
    return "Stripe session product does not match saved order"
  }
  if (session.metadata?.storyId && session.metadata.storyId !== order.storyId) {
    return "Stripe session story does not match saved order"
  }

  return ""
}
