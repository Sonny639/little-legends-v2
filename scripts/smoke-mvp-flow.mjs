import fs from "node:fs/promises"
import path from "node:path"
import { spawn } from "node:child_process"
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
const supabaseCleanupKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const hasSupabaseCleanup = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && supabaseCleanupKey)
const smokeId = `SMOKE-${Date.now()}`
const tamperedSmokeId = `${smokeId}-TAMPER`
const smokeOrderIds = [smokeId, tamperedSmokeId]
const smokeEmail = `${smokeId.toLowerCase()}@example.com`
const hasStripe = Boolean(process.env.STRIPE_SECRET_KEY)

if (!isLocalApp && !allowLiveWrites) {
  throw new Error(
    `Refusing to write smoke test data to ${appUrl}. Set SMOKE_ALLOW_LIVE_WRITES=1 if you intentionally want to test a live deployment.`,
  )
}

if (!isLocalApp && !skipCleanup && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "Live smoke testing needs SUPABASE_SERVICE_ROLE_KEY for cleanup. Add it locally, or set SMOKE_SKIP_CLEANUP=1 to intentionally leave smoke records for manual removal.",
  )
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

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

const getAdminCookie = async () => {
  if (!process.env.ADMIN_PASSWORD) return ""

  const response = await fetch(`${appUrl}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: process.env.ADMIN_USERNAME || "admin",
      password: process.env.ADMIN_PASSWORD,
    }),
    redirect: "manual",
  })

  if (!response.ok) {
    throw new Error(`Admin login failed with ${response.status}: ${await response.text()}`)
  }

  return response.headers.get("set-cookie")?.split(";")[0] || ""
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
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, supabaseCleanupKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const results = await Promise.all([
      supabase.from("email_logs").delete().in("order_id", smokeOrderIds),
      supabase.from("orders").delete().in("id", smokeOrderIds),
      supabase.from("enquiries").delete().eq("email", smokeEmail),
    ])
    const error = results.find((result) => result.error)?.error

    if (error) throw new Error(`Failed to clean Supabase smoke data: ${error.message}`)

    return "supabase"
  }

  await removeFromJsonFile(localOrdersFile, (order) => smokeOrderIds.includes(order.id))
  await removeFromJsonFile(localEnquiriesFile, (enquiry) => enquiry.email === smokeEmail)

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
  id: smokeId,
  createdAt: new Date().toISOString(),
  product: "digital",
  total: 7.99,
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
  console.log(`Smoke id ${smokeId}`)
  console.log(`Cleanup target: ${await cleanupSmokeData()}`)

  await requestPage("/")
  console.log("OK homepage")

  await requestPage("/create")
  console.log("OK create page")

  await requestPage("/contact")
  console.log("OK contact page")

  const adminCookie = await getAdminCookie()
  const adminHeaders = adminCookie ? { Cookie: adminCookie } : {}

  const artworkPrompts = await requestJson("/api/artwork-manifest?prompts=1&story=race-driver", {
    headers: adminHeaders,
  })
  const raceDriverPrompt = Array.isArray(artworkPrompts)
    ? artworkPrompts.find((item) => item.storyId === "race-driver" && item.prompt?.includes("child-safe racing circuit"))
    : null

  if (!raceDriverPrompt) {
    throw new Error("Artwork prompt pack did not include the race driver visual direction.")
  }
  console.log("OK artwork prompt pack includes priority hero visual direction")

  const priorityPrompts = await requestJson("/api/artwork-manifest?prompts=1&priority=1", {
    headers: adminHeaders,
  })
  const priorityStoryIds = new Set(Array.isArray(priorityPrompts) ? priorityPrompts.map((item) => item.storyId) : [])

  for (const storyId of ["race-driver", "wizard", "knight", "fairy", "princess", "dinosaur-expert"]) {
    if (!priorityStoryIds.has(storyId)) {
      throw new Error(`Launch-priority artwork prompts did not include ${storyId}.`)
    }
  }

  if (!Array.isArray(priorityPrompts) || priorityPrompts.some((item) => !item.launchPriority || item.storyId === "bitcoin-hero")) {
    throw new Error("Launch-priority artwork prompt filter returned a non-priority story.")
  }
  console.log("OK artwork prompt pack filters to launch-priority stories")

  const missingPriorityPrompts = await requestJson("/api/artwork-manifest?prompts=1&missing=1&priority=1", {
    headers: adminHeaders,
  })
  const missingSuperheroArtwork = Array.isArray(missingPriorityPrompts)
    ? missingPriorityPrompts.filter((item) => item.storyId === "superhero")
    : []

  if (missingSuperheroArtwork.length > 0) {
    throw new Error(`Completed superhero artwork still reported as missing: ${JSON.stringify(missingSuperheroArtwork)}`)
  }
  console.log("OK completed superhero artwork is no longer listed as missing")

  const previewPriorityManifest = await requestJson("/api/artwork-manifest?priority=1&phase=preview", {
    headers: adminHeaders,
  })

  if (
    !Array.isArray(previewPriorityManifest) ||
    previewPriorityManifest.length === 0 ||
    previewPriorityManifest.some((item) => !item.launchPriority || item.artworkPhase !== "preview" || item.pageNumber > 3)
  ) {
    throw new Error("Preview artwork manifest did not return only launch preview pages.")
  }

  if (previewPriorityManifest.some((item) => !item.fileExists)) {
    throw new Error("Launch preview artwork is missing for one or more priority preview pages.")
  }
  console.log("OK launch preview artwork is complete")

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

  const tamperedOrder = {
    ...order,
    id: tamperedSmokeId,
    total: 0,
    status: "paid",
    fulfilmentStatus: "sent",
    emailSentAt: new Date().toISOString(),
  }
  const tamperedSave = await requestJson("/api/orders", {
    method: "POST",
    body: JSON.stringify(tamperedOrder),
  })

  if (
    tamperedSave.order?.total !== 7.99 ||
    tamperedSave.order?.status !== "payment_pending" ||
    tamperedSave.order?.fulfilmentStatus !== "new" ||
    tamperedSave.order?.emailSentAt
  ) {
    throw new Error(`Order creation did not normalise tampered payment fields: ${JSON.stringify(tamperedSave.order)}`)
  }
  console.log("OK order creation normalises payment fields")

  const savedOrder = await requestJson("/api/orders", {
    method: "POST",
    body: JSON.stringify(order),
  })
  const orderAccessToken = savedOrder.accessToken
  console.log("OK order saved")

  await requestJson(
    "/api/orders",
    {
      method: "POST",
      body: JSON.stringify({
        ...order,
        email: "replacement@example.com",
        heroName: "Replacement Hero",
      }),
    },
    [409],
  )
  console.log("OK duplicate order creation is rejected")

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

    await requestPage(`/download/${encodeURIComponent(smokeId)}?access=${encodeURIComponent(orderAccessToken)}`)
    console.log("OK download page unlocked")
  } else {
    console.log("SKIP paid/download check because Stripe checkout requires external payment confirmation")
  }

  console.log(`Cleanup target: ${await cleanupSmokeData()}`)
  console.log("MVP smoke flow passed")
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
