import fs from "node:fs/promises"
import path from "node:path"
import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"

import { createClient } from "@supabase/supabase-js"
import Stripe from "stripe"

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
const supabaseDataKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const smokeId = `SMOKE-STRIPE-${Date.now()}`
const smokeEmail = `${smokeId.toLowerCase()}@example.com`
let upgradeSmokeId = ""

if (!isLocalApp && !allowLiveWrites) {
  throw new Error(
    `Refusing to write Stripe smoke test data to ${appUrl}. Set SMOKE_ALLOW_LIVE_WRITES=1 if you intentionally want to test a live deployment.`,
  )
}

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Stripe smoke testing needs STRIPE_SECRET_KEY.")
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error("Stripe smoke testing needs STRIPE_WEBHOOK_SECRET.")
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !supabaseDataKey) {
  throw new Error("Stripe smoke testing needs Supabase env vars for verification and cleanup.")
}

if (!isLocalApp && !skipCleanup && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "Live Stripe smoke testing needs SUPABASE_SERVICE_ROLE_KEY for verification and cleanup. Add it locally, or set SMOKE_SKIP_CLEANUP=1 to intentionally leave smoke records for manual removal.",
  )
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  appInfo: {
    name: "Little Legends Smoke Test",
  },
})

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, supabaseDataKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const cleanupSmokeData = async () => {
  if (skipCleanup) return "skipped"
  const smokeOrderIds = [smokeId, upgradeSmokeId].filter(Boolean)

  const results = await Promise.all([
    supabase.from("email_logs").delete().in("order_id", smokeOrderIds),
    supabase.from("orders").delete().in("id", smokeOrderIds),
    supabase.from("enquiries").delete().eq("email", smokeEmail),
  ])
  const error = results.find((result) => result.error)?.error

  if (error) throw new Error(`Failed to clean Supabase Stripe smoke data: ${error.message}`)

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

const requestPage = async (requestPath) => {
  const response = await fetch(`${appUrl}${requestPath}`, { redirect: "manual" })
  const text = await response.text()

  if (!response.ok && response.status < 300) {
    throw new Error(`GET ${requestPath} failed with ${response.status}`)
  }

  return { response, text }
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
  heroName: "Stripe Smoke",
  heroType: "Wizard",
  storyTitle: "Stripe Smoke and the Moonbeam Spell",
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
  console.log(`Stripe smoke testing ${appUrl}`)
  console.log(`Smoke id ${smokeId}`)
  console.log(`Cleanup target: ${await cleanupSmokeData()}`)

  const savedOrderResponse = await requestJson("/api/orders", {
    method: "POST",
    body: JSON.stringify(order),
  })
  const orderAccessToken = savedOrderResponse.data.accessToken
  console.log("OK smoke order saved")

  await requestJson(
    "/api/checkout",
    {
      method: "POST",
      body: JSON.stringify({ order: { ...order, id: `${smokeId}-missing` }, accessToken: orderAccessToken }),
    },
    [404],
  )
  console.log("OK checkout requires a saved order")

  const tamperedCheckout = await requestJson("/api/checkout", {
    method: "POST",
    body: JSON.stringify({
      order: {
        ...order,
        product: "hardback",
        total: 34.99,
        email: "tampered@example.com",
        storyId: "tampered-story",
      },
      accessToken: orderAccessToken,
    }),
  })
  const tamperedCheckoutData = tamperedCheckout.data.checkout
  const tamperedSession = await stripe.checkout.sessions.retrieve(tamperedCheckoutData.sessionId)

  if (
    tamperedSession.amount_total !== 799 ||
    tamperedSession.customer_email !== smokeEmail ||
    tamperedSession.metadata?.product !== "digital" ||
    tamperedSession.metadata?.storyId !== "wizard"
  ) {
    throw new Error("Checkout did not use the saved server-side order for tampered request data.")
  }
  console.log("OK checkout uses saved order details")

  const checkout = await requestJson("/api/checkout", {
    method: "POST",
    body: JSON.stringify({ order, accessToken: orderAccessToken }),
  })
  const checkoutData = checkout.data.checkout

  if (checkoutData?.mode !== "stripe" || !checkoutData.url || !checkoutData.sessionId) {
    throw new Error(`Expected Stripe checkout session, got: ${JSON.stringify(checkoutData)}`)
  }

  if (!checkoutData.cancelUrl.includes(`/checkout/cancel?orderId=${encodeURIComponent(smokeId)}`)) {
    throw new Error(`Checkout cancel URL is wrong: ${checkoutData.cancelUrl}`)
  }

  if (!checkoutData.successUrl.includes(`/checkout/success?orderId=${encodeURIComponent(smokeId)}`)) {
    throw new Error(`Checkout success URL is wrong: ${checkoutData.successUrl}`)
  }

  console.log("OK Stripe checkout session created")

  const stripeSession = await stripe.checkout.sessions.retrieve(checkoutData.sessionId)

  if (stripeSession.client_reference_id !== smokeId || stripeSession.metadata?.orderId !== smokeId) {
    throw new Error("Stripe session metadata/client reference did not preserve the order id.")
  }

  if (stripeSession.amount_total !== 799 || stripeSession.currency !== "gbp") {
    throw new Error(`Stripe amount/currency mismatch: ${stripeSession.amount_total} ${stripeSession.currency}`)
  }

  console.log("OK Stripe session metadata and amount")

  const cancelPage = await requestPage(`/checkout/cancel?orderId=${encodeURIComponent(smokeId)}`)
  if (cancelPage.response.status !== 200 || !cancelPage.text.includes(smokeId)) {
    throw new Error("Cancel page did not load the smoke order.")
  }
  console.log("OK cancel page can show saved order")

  const mismatchedEvent = {
    id: `evt_${smokeId}_mismatch`,
    object: "event",
    api_version: "2025-02-24.acacia",
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    pending_webhooks: 1,
    request: null,
    type: "checkout.session.completed",
    data: {
      object: {
        id: checkoutData.sessionId,
        object: "checkout.session",
        client_reference_id: smokeId,
        metadata: {
          orderId: smokeId,
          product: "hardback",
          storyId: "wizard",
        },
        payment_status: "paid",
        amount_total: 100,
        currency: "gbp",
      },
    },
  }
  const mismatchedPayload = JSON.stringify(mismatchedEvent)
  const mismatchedSignature = Stripe.webhooks.generateTestHeaderString({
    payload: mismatchedPayload,
    secret: process.env.STRIPE_WEBHOOK_SECRET,
  })

  await requestJson(
    "/api/stripe/webhook",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": mismatchedSignature,
      },
      body: mismatchedPayload,
    },
    [400],
  )
  const { data: pendingOrder, error: pendingOrderError } = await supabase.from("orders").select("*").eq("id", smokeId).maybeSingle()
  if (pendingOrderError) throw new Error(`Could not verify mismatched webhook result: ${pendingOrderError.message}`)
  if (pendingOrder?.status !== "payment_pending") {
    throw new Error(`Mismatched webhook should not mark order paid, got ${pendingOrder?.status}`)
  }
  console.log("OK Stripe webhook rejects mismatched session")

  const event = {
    id: `evt_${smokeId}`,
    object: "event",
    api_version: "2025-02-24.acacia",
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    pending_webhooks: 1,
    request: null,
    type: "checkout.session.completed",
    data: {
      object: {
        id: checkoutData.sessionId,
        object: "checkout.session",
        client_reference_id: smokeId,
        metadata: {
          orderId: smokeId,
          product: "digital",
          storyId: "wizard",
        },
        payment_status: "paid",
        amount_total: 799,
        currency: "gbp",
      },
    },
  }
  const payload = JSON.stringify(event)
  const signature = Stripe.webhooks.generateTestHeaderString({
    payload,
    secret: process.env.STRIPE_WEBHOOK_SECRET,
  })

  await requestJson("/api/stripe/webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "stripe-signature": signature,
    },
    body: payload,
  })
  console.log("OK Stripe webhook accepted")

  const { data: savedOrder, error: orderError } = await supabase.from("orders").select("*").eq("id", smokeId).maybeSingle()
  if (orderError) throw new Error(`Could not verify paid order: ${orderError.message}`)
  if (savedOrder?.status !== "paid") throw new Error(`Expected order status paid, got ${savedOrder?.status}`)

  const { data: emailLogs, error: emailError } = await supabase.from("email_logs").select("*").eq("order_id", smokeId)
  if (emailError) throw new Error(`Could not verify email log: ${emailError.message}`)
  if (!emailLogs?.length) throw new Error("Expected a confirmation email log for the paid order.")
  console.log("OK order marked paid and confirmation email logged")

  const upgradePage = await requestPage(
    `/upgrade/${encodeURIComponent(smokeId)}?access=${encodeURIComponent(orderAccessToken)}`,
  )
  if (upgradePage.response.status !== 200 || !upgradePage.text.includes("Add the hardback")) {
    throw new Error("Paid digital order did not expose the hardback upgrade page.")
  }
  console.log("OK paid digital order exposes hardback upgrade page")

  const upgrade = await requestJson("/api/orders/upgrade", {
      method: "POST",
      body: JSON.stringify({
        orderId: smokeId,
        accessToken: orderAccessToken,
        phone: "07000000000",
        postage: {
        fullName: "Stripe Upgrade",
        addressLine1: "2 Test Street",
        addressLine2: "",
        city: "Testville",
        postcode: "TE1 2ST",
        country: "United Kingdom",
      },
    }),
  })
  upgradeSmokeId = upgrade.data.order?.id || ""

  if (upgrade.data.order?.product !== "upgrade" || upgrade.data.order?.total !== 27) {
    throw new Error(`Hardback upgrade order was not created correctly: ${JSON.stringify(upgrade.data.order)}`)
  }
  console.log("OK paid digital order can create hardback upgrade")

  const upgradeCheckout = await requestJson("/api/checkout", {
    method: "POST",
    body: JSON.stringify({ order: upgrade.data.order, accessToken: upgrade.data.accessToken }),
  })
  const upgradeSession = await stripe.checkout.sessions.retrieve(upgradeCheckout.data.checkout.sessionId)

  if (upgradeSession.amount_total !== 2700 || upgradeSession.metadata?.product !== "upgrade") {
    throw new Error(`Hardback upgrade checkout mismatch: ${upgradeSession.amount_total} ${upgradeSession.metadata?.product}`)
  }
  console.log("OK hardback upgrade checkout uses the price difference")

  const successPage = await requestPage(`/checkout/success?orderId=${encodeURIComponent(smokeId)}`)
  if (successPage.response.status !== 200 || !successPage.text.includes("Payment confirmed")) {
    throw new Error("Success page did not show confirmed payment after webhook.")
  }
  console.log("OK success page shows paid order")

  const downloadPage = await requestPage(
    `/download/${encodeURIComponent(smokeId)}?access=${encodeURIComponent(orderAccessToken)}`,
  )
  if (
    downloadPage.response.status !== 200 ||
    !downloadPage.text.includes("Little Legends Story") ||
    !downloadPage.text.includes("Stripe Smoke")
  ) {
    throw new Error("Paid download page did not render the smoke story.")
  }
  console.log("OK paid download page renders story")

  console.log(`Cleanup target: ${await cleanupSmokeData()}`)
  console.log("Stripe smoke flow passed")
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
