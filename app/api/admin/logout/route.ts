import { NextResponse } from "next/server"

import { adminSessionCookieName } from "@/lib/admin-auth"

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/admin/login", request.url))
  response.cookies.set(adminSessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  })

  return response
}
