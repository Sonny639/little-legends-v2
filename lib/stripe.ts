import Stripe from "stripe"

export const stripeSecretKey = process.env.STRIPE_SECRET_KEY || ""
export const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ""

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      appInfo: {
        name: "Little Legends",
      },
    })
  : null
