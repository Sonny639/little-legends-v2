import { NextResponse } from "next/server"

import { adminSessionCookieName, getAdminSessionToken, isAdminAuthEnabled, verifyAdminCredentials } from "@/lib/admin-auth"
import { checkRateLimit, getClientIp, rateLimitResponseHeaders } from "@/lib/rate-limit"

export async function POST(request: Request) {
  const { username, password } = await request.json()

  if (!isAdminAuthEnabled()) {
    return NextResponse.json({ error: "Admin password is not configured" }, { status: 400 })
  }

  const rateLimit = checkRateLimit({
    key: `admin-login:${getClientIp(request)}`,
    limit: 10,
    windowMs: 15 * 60 * 1000,
  })

  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429, headers: rateLimitResponseHeaders(rateLimit.resetAt) },
    )
  }

  if (typeof username !== "string" || typeof password !== "string" || !verifyAdminCredentials(username, password)) {
    return NextResponse.json({ error: "Invalid admin login" }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(adminSessionCookieName, await getAdminSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  })

  return response
}
