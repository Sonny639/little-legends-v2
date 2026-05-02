import fs from "node:fs/promises"
import path from "node:path"
import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"

import { createClient } from "@supabase/supabase-js"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

const loadLocalEnv = async () => {
  const envFile = path.join(root, ".env.local")

  try {
    const contents = await fs.readFile(envFile, "utf8")

    for (const line of contents.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
      if (!match || process.env[match[1]]) continue

      process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "").trim()
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error
  }
}

await loadLocalEnv()

const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3003").replace(/\/$/, "")
const isLocalApp = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(appUrl)
const allowLiveWrites = process.env.SMOKE_ALLOW_LIVE_WRITES === "1"
const skipCleanup = process.env.SMOKE_SKIP_CLEANUP === "1"
const hasSupabaseCleanup = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
const smokeId = `SMOKE-ADMIN-${Date.now()}`
const smokeEmail = `${smokeId.toLowerCase()}@example.com`

if (!isLocalApp && !allowLiveWrites) {
  throw new Error(
    `Refusing to write admin smoke test data to ${appUrl}. Set SMOKE_ALLOW_LIVE_WRITES=1 if you intentionally want to test a live deployment.`,
  )
}

if (!hasSupabaseCleanup) {
  throw new Error("Admin smoke testing needs NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY for cleanup.")
}

if (!process.env.ADMIN_PASSWORD) {
  throw new Error("Admin smoke testing needs ADMIN_PASSWORD in the environment.")
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const cleanupSmokeData = async () => {
  if (skipCleanup) return "skipped"

  const results = await Promise.all([
    supabase.from("email_logs").delete().eq("order_id", smokeId),
    supabase.from("orders").delete().eq("id", smokeId),
    supabase.from("enquiries").delete().eq("email", smokeEmail),
  ])
  const error = results.find((result) => result.error)?.error

  if (error) throw new Error(`Failed to clean Supabase admin smoke data: ${error.message}`)

  return "supabase"
}

const requestJson = async (requestPath, options = {}, acceptedStatuses = [200, 201]) => {
  const response = await fetch(`${appUrl}${requestPath}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    redirect: "manual",
  })

  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!acceptedStatuses.includes(response.status)) {
    throw new Error(`${options.method || "GET"} ${requestPath} failed with ${response.status}: ${text}`)
  }

  return { response, data, text }
}

const requestPage = async (requestPath, cookie = "") => {
  const response = await fetch(`${appUrl}${requestPath}`, {
    headers: cookie ? { Cookie: cookie } : {},
    redirect: "manual",
  })
  const text = await response.text()

  return {
    path: requestPath,
    status: response.status,
    location: response.headers.get("location"),
    text,
  }
}

const startLocalServer = async () => {
  if (!isLocalApp || process.env.SMOKE_SKIP_SERVER === "1") return null

  try {
    const response = await fetch(`${appUrl}/`, { signal: AbortSignal.timeout(1000) })
    if (response.ok) return null
  } catch {
    // Start a local server below.
  }

  const url = new URL(appUrl)
  const port = url.port || "3003"
  const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--turbo", "-p", port], {
    cwd: root,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  })
  let logs = ""

  server.stdout.on("data", (data) => {
    logs += data.toString()
  })
  server.stderr.on("data", (data) => {
    logs += data.toString()
  })

  for (let attempt = 0; attempt < 90; attempt += 1) {
    try {
      const response = await fetch(`${appUrl}/`, { signal: AbortSignal.timeout(1000) })
      if (response.ok) return server
    } catch {
      await wait(500)
    }
  }

  server.kill()
  throw new Error(`Local server did not become ready. ${logs}`)
}

const order = {
  id: smokeId,
  createdAt: new Date().toISOString(),
  product: "hardback",
  total: 19.99,
  email: smokeEmail,
  phone: "07000000000",
  heroName: "Admin Smoke",
  heroType: "Wizard",
  storyTitle: "Admin Smoke and the Moonbeam Spell",
  storyId: "wizard",
  gender: "girl",
  photoCount: 2,
  choices: [
    {
      pageId: "start",
      choiceId: "go-boldly",
      pathTag: "brave",
      text: "Follow the comet bravely",
    },
  ],
  postage: {
    fullName: "Smoke Test",
    addressLine1: "1 Test Street",
    addressLine2: "",
    city: "Testville",
    postcode: "TE1 1ST",
    country: "United Kingdom",
  },
  status: "paid_demo",
  fulfilmentStatus: "new",
  fulfilmentUpdatedAt: new Date().toISOString(),
}

const server = await startLocalServer()

try {
  console.log(`Admin smoke testing ${appUrl}`)
  console.log(`Smoke id ${smokeId}`)
  console.log(`Cleanup target: ${await cleanupSmokeData()}`)

  await requestJson("/api/enquiries", {
    method: "POST",
    body: JSON.stringify({
      name: "Admin Smoke",
      email: smokeEmail,
      subject: "Admin smoke enquiry",
      message: "Temporary admin smoke enquiry",
    }),
  })
  console.log("OK smoke enquiry saved")

  await requestJson("/api/orders", {
    method: "POST",
    body: JSON.stringify(order),
  })
  console.log("OK smoke hardback order saved")

  const login = await fetch(`${appUrl}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: process.env.ADMIN_USERNAME || "admin",
      password: process.env.ADMIN_PASSWORD,
    }),
    redirect: "manual",
  })

  if (!login.ok) {
    throw new Error(`Admin login failed with ${login.status}: ${await login.text()}`)
  }

  const sessionCookie = login.headers.get("set-cookie")?.split(";")[0]
  if (!sessionCookie) throw new Error("Admin login did not set a session cookie.")
  console.log("OK admin login")

  await requestJson("/api/orders", {
    method: "PATCH",
    headers: { Cookie: sessionCookie },
    body: JSON.stringify({ orderId: smokeId, status: "paid_demo" }),
  })
  console.log("OK smoke confirmation email logged")

  const checks = []

  for (const pagePath of ["/admin", "/admin/orders", "/admin/enquiries", "/admin/email-log", "/admin/print-queue"]) {
    const page = await requestPage(pagePath, sessionCookie)
    const hasSmoke = page.text.includes(smokeId) || page.text.includes("Admin Smoke") || page.text.includes(smokeEmail)
    const hasDataIssue = page.text.includes("could not load") || page.text.includes("not fully connected")

    if (page.status !== 200 || hasDataIssue) {
      throw new Error(`${pagePath} failed admin check. Status ${page.status}. Data issue: ${hasDataIssue}`)
    }

    checks.push({ path: pagePath, status: page.status, hasSmoke })
  }

  const apiOrders = await requestJson("/api/orders", { headers: { Cookie: sessionCookie } })
  const apiEnquiries = await requestJson("/api/enquiries", { headers: { Cookie: sessionCookie } })
  const apiEmailLog = await requestJson("/api/email-log", { headers: { Cookie: sessionCookie } })

  const apiChecks = {
    orders: apiOrders.data.orders?.some((savedOrder) => savedOrder.id === smokeId),
    enquiries: apiEnquiries.data.enquiries?.some((enquiry) => enquiry.email === smokeEmail),
    emailLogs: apiEmailLog.data.emails?.some((email) => email.orderId === smokeId),
  }

  if (!apiChecks.orders || !apiChecks.enquiries || !apiChecks.emailLogs) {
    throw new Error(`Admin API smoke records missing: ${JSON.stringify(apiChecks)}`)
  }

  console.log(`OK admin pages: ${checks.map((check) => `${check.path}${check.hasSmoke ? " found smoke" : ""}`).join(", ")}`)
  console.log("OK admin APIs read Supabase smoke records")
  console.log(`Cleanup target: ${await cleanupSmokeData()}`)
  console.log("Admin smoke flow passed")
} catch (error) {
  try {
    await cleanupSmokeData()
  } catch {
    // Keep the original error as the useful failure.
  }
  throw error
} finally {
  server?.kill()
}
