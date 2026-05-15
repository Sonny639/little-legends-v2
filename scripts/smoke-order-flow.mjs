import fs from "node:fs/promises"
import path from "node:path"
import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"

import { createClient } from "@supabase/supabase-js"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const localOrdersFile = path.join(root, "data", "orders.json")

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
const orderId = `SMOKE-ORDER-${Date.now()}`
const smokeEmail = `${orderId.toLowerCase()}@example.com`
const hasStripe = Boolean(process.env.STRIPE_SECRET_KEY)

if (!isLocalApp && !allowLiveWrites) {
  throw new Error(
    `Refusing to write smoke order data to ${appUrl}. Set SMOKE_ALLOW_LIVE_WRITES=1 if you intentionally want to test a live deployment.`,
  )
}

if (!isLocalApp && !skipCleanup && !hasSupabaseCleanup) {
  throw new Error(
    "Live smoke testing needs local Supabase env vars for cleanup. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY locally, or set SMOKE_SKIP_CLEANUP=1 to intentionally leave smoke records for manual removal.",
  )
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const requestJson = async (requestPath, options = {}) => {
  const response = await fetch(`${appUrl}${requestPath}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  })

  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
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

const cleanupSmokeOrder = async () => {
  if (skipCleanup) return "skipped"

  if (hasSupabaseCleanup) {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
    const results = await Promise.all([
      supabase.from("email_logs").delete().eq("order_id", orderId),
      supabase.from("orders").delete().eq("id", orderId),
    ])
    const error = results.find((result) => result.error)?.error

    if (error) throw new Error(`Failed to clean Supabase smoke order data: ${error.message}`)

    return "supabase"
  }

  await removeFromJsonFile(localOrdersFile, (order) => order.id === orderId)
  return "local-json"
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
  id: orderId,
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

const server = await startLocalServer()

try {
  console.log(`Smoke testing ${appUrl}`)
  console.log(`Smoke id ${orderId}`)
  console.log(`Cleanup target: ${await cleanupSmokeOrder()}`)

  await requestPage("/")
  console.log("OK homepage")

  await requestJson("/api/orders", {
    method: "POST",
    body: JSON.stringify(order),
  })
  console.log(`OK order saved: ${orderId}`)

  const checkout = await requestJson("/api/checkout", {
    method: "POST",
    body: JSON.stringify({ order }),
  })

  if (!checkout.checkout?.url) {
    throw new Error("Checkout response did not include a URL")
  }
  console.log(`OK checkout created: ${checkout.checkout.mode}`)

  if (checkout.checkout.mode === "demo" && !hasStripe) {
    await requestPage(`/checkout/success?orderId=${encodeURIComponent(orderId)}`)
    console.log("OK demo checkout success")

    await requestPage(`/download/${encodeURIComponent(orderId)}`)
    console.log("OK download page unlocked")
  } else {
    console.log("SKIP paid/download check because Stripe checkout requires external payment confirmation")
  }

  console.log("Smoke order flow passed")
  console.log(`Cleanup target: ${await cleanupSmokeOrder()}`)
} catch (error) {
  try {
    await cleanupSmokeOrder()
  } catch {
    // Keep the original error as the useful failure.
  }
  throw error
} finally {
  server?.kill()
}
