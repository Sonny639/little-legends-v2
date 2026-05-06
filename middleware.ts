import { adminSessionCookieName, getAdminSessionToken, isAdminAuthEnabled } from "@/lib/admin-auth"
import { NextResponse, type NextRequest } from "next/server"

const protectedOrderMethods = new Set(["GET", "PATCH", "DELETE"])
const protectedEnquiryMethods = new Set(["GET", "PATCH", "DELETE"])

const isProtectedPath = (request: NextRequest) => {
  const { pathname } = request.nextUrl

  if (pathname === "/admin/login") return false
  if (pathname.startsWith("/admin")) return true
  if (pathname === "/artwork") return true
  if (pathname === "/api/admin/login" || pathname === "/api/admin/logout") return false
  if (pathname === "/api/artwork-manifest" || pathname === "/api/artwork-prompts.csv") return true
  if (pathname === "/api/order-photos" && request.method === "GET") return true
  if (pathname === "/api/orders/email") return true
  if (pathname === "/api/orders" && protectedOrderMethods.has(request.method)) return true
  if (pathname === "/api/enquiries" && protectedEnquiryMethods.has(request.method)) return true
  if (pathname === "/api/email-log") return true

  return false
}

export async function middleware(request: NextRequest) {
  const protectedPath = isProtectedPath(request)

  if (!protectedPath) {
    return NextResponse.next()
  }

  if (!isAdminAuthEnabled()) {
    if (process.env.NODE_ENV === "production") {
      if (request.nextUrl.pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Admin authentication is not configured" }, { status: 503 })
      }

      return new NextResponse("Admin authentication is not configured.", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    }

    return NextResponse.next()
  }

  const expectedToken = await getAdminSessionToken()
  const sessionToken = request.cookies.get(adminSessionCookieName)?.value

  if (sessionToken === expectedToken) {
    return NextResponse.next()
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Admin authentication required" }, { status: 401 })
  }

  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = "/admin/login"
  loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`)

  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/artwork",
    "/api/artwork-manifest",
    "/api/artwork-prompts.csv",
    "/api/order-photos",
    "/api/orders",
    "/api/orders/email",
    "/api/enquiries",
    "/api/email-log",
  ],
}
