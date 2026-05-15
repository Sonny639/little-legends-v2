import { createHash } from "node:crypto"

import { NextResponse } from "next/server"

const describeSecret = (value: string | undefined) => ({
  configured: Boolean(value),
  prefix: value ? value.slice(0, 12) : null,
  sha256: value ? createHash("sha256").update(value).digest("hex") : null,
})

export async function GET() {
  return NextResponse.json({
    stripeWebhookSecret: describeSecret(process.env.STRIPE_WEBHOOK_SECRET),
  })
}
