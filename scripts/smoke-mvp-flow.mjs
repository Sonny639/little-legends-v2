import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { createClient } from "@supabase/supabase-js"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const localOrdersFile = path.join(root, "data", "orders.json")
const localEnquiriesFile = path.join(root, "data", "enquiries.json")

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
const smokeId = `SMOKE-${Date.now()}`
const smokeEmail = `${smokeId.toLowerCase()}@example.com`
const hasStripe = Boolean(process.env.STRIPE_SECRET_KEY)

if (!isLocalApp && !allowLiveWrites) {
  throw new Error(
    `Refusing to write smoke test data to ${appUrl}. Set SMOKE_ALLOW_LIVE_WRITES=1 if you intentionally want to test a live deployment.`,
  )
}

if (!isLocalApp && !skipCleanup && !hasSupabaseCleanup) {
  throw new Error(
    "Live smoke testing needs local Supabase env vars for cleanup. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY locally, or set SMOKE_SKIP_CLEANUP=1 to intentionally leave smoke records for manual removal.",
  )
}

const requestJson = async (requestPath, options = {}, acceptedStatuses = [200, 201]) => {
  const response = await fetch(`${appUrl}${requestPath}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  })

  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!acceptedStatuses.includes(response.status)) {
    throw new Error(`${options.method || "GET"} ${requestPath} failed with ${response.status}: ${text}`)
  }

  return data
}

const requestPage = async (requestPath) => {
  const response = await fetch(`${appUrl}${requestPath}`)

  if (!response.ok) {
    throw new Error(`GET ${requestPath} failed with ${response.status}`)
  }

  return response.status
}

const removeFromJsonFile = async (filePath, predicate) => {
  try {
    const fileContents = await fs.readFile(filePath, "utf8")
    const parsedItems = JSON.parse(fileContents.replace(/^\uFEFF/, ""))
    const items = Array.isArray(parsedItems) ? parsedItems : []
    const remainingItems = items.filter((item) => !predicate(item))

    if (remainingItems.length !== items.length) {
      await fs.writeFile(filePath, JSON.stringify(remainingItems, null, 2), "utf8")
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error
  }
}

const cleanupSmokeData = async () => {
  if (skipCleanup) return "skipped"

  if (hasSupabaseCleanup) {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const results = await Promise.all([
      supabase.from("email_logs").delete().eq("order_id", smokeId),
      supabase.from("orders").delete().eq("id", smokeId),
      supabase.from("enquiries").delete().eq("email", smokeEmail),
    ])
    const error = results.find((result) => result.error)?.error

    if (error) throw new Error(`Failed to clean Supabase smoke data: ${error.message}`)

    return "supabase"
  }

  await removeFromJsonFile(localOrdersFile, (order) => order.id === smokeId)
  await removeFromJsonFile(localEnquiriesFile, (enquiry) => enquiry.email === smokeEmail)

  return "local-json"
}

const order = {
  id: smokeId,
  createdAt: new Date().toISOString(),
  product: "digital",
  total: 4.99,
  email: smokeEmail,
  heroName: "Smoke Star",
  heroType: "Wizard",
  storyTitle: "Smoke Star and the Moonbeam Spell",
  storyId: "wizard",
  gender: "girl",
  photoCount: 1,
  choices: [
    {
      pageId: "start",
      choiceId: "go-boldly",
      pathTag: "brave",
      text: "Follow the comet bravely",
    },
  ],
  status: "payment_pending",
  fulfilmentStatus: "new",
  fulfilmentUpdatedAt: new Date().toISOString(),
}

console.log(`Smoke testing ${appUrl}`)
console.log(`Smoke id ${smokeId}`)
console.log(`Cleanup target: ${await cleanupSmokeData()}`)

await requestPage("/")
console.log("OK homepage")

await requestPage("/create")
console.log("OK create page")

await requestPage("/contact")
console.log("OK contact page")

await requestJson("/api/enquiries", {
  method: "POST",
  body: JSON.stringify({
    name: "Smoke launch signup",
    email: smokeEmail,
    subject: "Smoke launch list",
    message: `Smoke launch signup ${smokeId}`,
  }),
})
console.log("OK launch signup saved")

await requestJson(
  "/api/enquiries",
  {
    method: "POST",
    body: JSON.stringify({
      name: "Smoke Contact",
      email: smokeEmail,
      subject: "Smoke contact form",
      message: `Smoke contact enquiry ${smokeId}`,
      source: "contact",
    }),
  },
  [201, 202],
)
console.log("OK contact enquiry saved")

await requestJson("/api/orders", {
  method: "POST",
  body: JSON.stringify(order),
})
console.log("OK order saved")

const checkout = await requestJson("/api/checkout", {
  method: "POST",
  body: JSON.stringify({ order }),
})

if (!checkout.checkout?.url) {
  throw new Error("Checkout response did not include a URL")
}
console.log(`OK checkout created: ${checkout.checkout.mode}`)

if (checkout.checkout.mode === "demo" && !hasStripe) {
  await requestPage(`/checkout/success?orderId=${encodeURIComponent(smokeId)}`)
  console.log("OK demo checkout success")

  await requestPage(`/download/${encodeURIComponent(smokeId)}`)
  console.log("OK download page unlocked")
} else {
  console.log("SKIP paid/download check because Stripe checkout requires external payment confirmation")
}

console.log(`Cleanup target: ${await cleanupSmokeData()}`)
console.log("MVP smoke flow passed")
