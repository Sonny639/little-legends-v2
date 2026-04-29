export const adminSessionCookieName = "ll_admin_session"

const encoder = new TextEncoder()

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")

export const getAdminSessionToken = async () => {
  const password = process.env.ADMIN_PASSWORD || ""
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "little-legends-local-admin"
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(`${secret}:${password}`))

  return toHex(digest)
}

export const isAdminAuthEnabled = () => Boolean(process.env.ADMIN_PASSWORD)

export const verifyAdminCredentials = (username: string, password: string) => {
  if (!isAdminAuthEnabled()) return true

  const expectedUsername = process.env.ADMIN_USERNAME || "admin"
  const expectedPassword = process.env.ADMIN_PASSWORD || ""

  return username === expectedUsername && password === expectedPassword
}
