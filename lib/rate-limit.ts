type RateLimitState = {
  count: number
  resetAt: number
}

const buckets = new Map<string, RateLimitState>()

export const getClientIp = (request: Request) => {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  const realIp = request.headers.get("x-real-ip")?.trim()

  return forwardedFor || realIp || "unknown"
}

export const checkRateLimit = ({
  key,
  limit,
  windowMs,
}: {
  key: string
  limit: number
  windowMs: number
}) => {
  const now = Date.now()
  const current = buckets.get(key)

  if (!current || current.resetAt <= now) {
    const resetAt = now + windowMs
    buckets.set(key, { count: 1, resetAt })
    return { ok: true, remaining: limit - 1, resetAt }
  }

  if (current.count >= limit) {
    return { ok: false, remaining: 0, resetAt: current.resetAt }
  }

  current.count += 1
  return { ok: true, remaining: Math.max(0, limit - current.count), resetAt: current.resetAt }
}

export const rateLimitResponseHeaders = (resetAt: number) => ({
  "Retry-After": String(Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))),
})
