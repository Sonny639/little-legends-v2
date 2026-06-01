const productionFallbackUrl = "https://www.littlelegendsstory.com"

const trimTrailingSlash = (value: string) => value.replace(/\/$/, "")

const isLocalUrl = (value: string) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(value)

const isTrustedDevelopmentOrigin = (value: string) => {
  if (isLocalUrl(value)) return true

  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL
  return Boolean(configuredUrl && trimTrailingSlash(value) === trimTrailingSlash(configuredUrl))
}

export const getTrustedAppUrl = (request?: Request) => {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL

  if (configuredUrl && !(process.env.NODE_ENV === "production" && isLocalUrl(configuredUrl))) {
    return trimTrailingSlash(configuredUrl)
  }

  if (process.env.NODE_ENV === "production") {
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
    return productionFallbackUrl
  }

  const origin = request?.headers.get("origin")
  if (origin && origin !== "null" && isTrustedDevelopmentOrigin(origin)) {
    return trimTrailingSlash(origin)
  }

  const forwardedHost = request?.headers.get("x-forwarded-host")
  const forwardedProto = request?.headers.get("x-forwarded-proto") || "https"
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`

  return "http://localhost:3003"
}
