import { NextResponse } from "next/server"

import { adminSessionCookieName, getAdminSessionToken, isAdminAuthEnabled, verifyAdminCredentials } from "@/lib/admin-auth"

export async function POST(request: Request) {
  const { username, password } = await request.json()

  if (!isAdminAuthEnabled()) {
    return NextResponse.json({ error: "Admin password is not configured" }, { status: 400 })
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
