import { createHmac, timingSafeEqual } from "crypto"

const getOrderAccessSecret = () => {
  if (process.env.NODE_ENV === "production") {
    const productionSecret = process.env.ORDER_ACCESS_SECRET || ""

    if (productionSecret.length < 32) {
      throw new Error("ORDER_ACCESS_SECRET must be set to a strong unique value in production")
    }

    return productionSecret
  }

  return (
    process.env.ORDER_ACCESS_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "little-legends-local-order-access"
  )
}

export const getOrderAccessToken = (orderId: string) =>
  createHmac("sha256", getOrderAccessSecret()).update(orderId).digest("hex")

export const hasValidOrderAccess = (orderId: string, token?: string | null) => {
  if (!token) return false

  const expected = Buffer.from(getOrderAccessToken(orderId), "hex")
  const received = Buffer.from(token, "hex")

  return received.length === expected.length && timingSafeEqual(received, expected)
}
