import fs from "node:fs/promises"
import path from "node:path"
import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"

import { createClient } from "@supabase/supabase-js"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const localOrderPhotosRoot = path.join(root, "data", "order-photos")

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
const photoBucket = process.env.SUPABASE_STORAGE_BUCKET || "order-photos"

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

const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null

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

  if (supabaseAdmin) {
    const { data, error: listError } = await supabaseAdmin.storage.from(photoBucket).list(smokeId)

    if (listError && listError.message !== "The resource was not found") {
      throw new Error(`Failed to list smoke photo storage: ${listError.message}`)
    }

    const storagePaths = (data || []).map((item) => `${smokeId}/${item.name}`)

    if (storagePaths.length > 0) {
      const { error: removeError } = await supabaseAdmin.storage.from(photoBucket).remove(storagePaths)
      if (removeError) throw new Error(`Failed to clean smoke photo storage: ${removeError.message}`)
    }
  }

  await fs.rm(path.join(localOrderPhotosRoot, smokeId), { recursive: true, force: true })

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

const requestMultipart = async (requestPath, formData, options = {}, acceptedStatuses = [200]) => {
  const response = await fetch(`${appUrl}${requestPath}`, {
    ...options,
    method: options.method || "POST",
    body: formData,
    redirect: "manual",
  })

  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!acceptedStatuses.includes(response.status)) {
    throw new Error(`${options.method || "POST"} ${requestPath} failed with ${response.status}: ${text}`)
  }

  return { response, data, text }
}

const createSmokePng = () =>
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
    "base64",
  )

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

  const unauthArtworkPage = await requestPage("/artwork")
  if (unauthArtworkPage.status !== 307 && unauthArtworkPage.status !== 302) {
    throw new Error(`/artwork should redirect without admin auth, got ${unauthArtworkPage.status}.`)
  }

  await requestJson("/api/artwork-manifest?prompts=1&missing=1&priority=1", {}, [401])
  console.log("OK artwork tools require admin auth")

  await requestJson(`/api/order-photos?orderId=${encodeURIComponent(smokeId)}`, {}, [401])
  console.log("OK photo preview API requires admin auth")

  await requestJson(`/api/orders/artwork-pack?orderId=${encodeURIComponent(smokeId)}`, {}, [401])
  console.log("OK order artwork pack requires admin auth")

  const photoForm = new FormData()
  photoForm.set("orderId", smokeId)
  photoForm.append("photos", new File([createSmokePng()], `${smokeId}.png`, { type: "image/png" }))

  const photoUpload = await requestMultipart("/api/order-photos", photoForm, { method: "POST" }, [200])
  if (!photoUpload.data.photos?.length) {
    throw new Error("Smoke photo upload did not return stored photo metadata.")
  }
  console.log("OK smoke reference photo uploaded")

  const photoRead = await requestJson(`/api/order-photos?orderId=${encodeURIComponent(smokeId)}`, {
    headers: { Cookie: sessionCookie },
  })
  const savedPhoto = photoRead.data.photos?.[0]
  if (!savedPhoto?.url || savedPhoto.name.length === 0) {
    throw new Error(`Admin photo read did not return a preview URL: ${JSON.stringify(photoRead.data)}`)
  }
  console.log("OK admin photo API returned smoke reference photo")

  await requestJson("/api/orders", {
    method: "PATCH",
    headers: { Cookie: sessionCookie },
    body: JSON.stringify({ orderId: smokeId, status: "paid_demo" }),
  })
  console.log("OK smoke confirmation email logged")

  const fulfilmentUpdate = await requestJson("/api/orders", {
    method: "PATCH",
    headers: { Cookie: sessionCookie },
    body: JSON.stringify({ orderId: smokeId, fulfilmentStatus: "in_progress" }),
  })

  if (fulfilmentUpdate.data.order?.fulfilmentStatus !== "in_progress") {
    throw new Error(`Fulfilment update did not persist: ${JSON.stringify(fulfilmentUpdate.data)}`)
  }
  console.log("OK smoke fulfilment status updated")

  const artworkPack = await requestJson(`/api/orders/artwork-pack?orderId=${encodeURIComponent(smokeId)}`, {
    headers: { Cookie: sessionCookie },
  })
  const artworkCsv = await requestPage(`/api/orders/artwork-pack?orderId=${encodeURIComponent(smokeId)}&format=csv`, sessionCookie)

  if (
    artworkPack.data.order?.id !== smokeId ||
    artworkPack.data.order?.storyId !== "wizard" ||
    artworkPack.data.order?.storedReferencePhotoCount < 1 ||
    !artworkPack.data.referencePhotos?.[0]?.url ||
    !Array.isArray(artworkPack.data.pages) ||
    artworkPack.data.pages.length === 0 ||
    !artworkPack.data.pages[0]?.prompt?.includes("Admin Smoke")
  ) {
    throw new Error(`Order artwork pack did not include smoke story prompts: ${JSON.stringify(artworkPack.data)}`)
  }

  if (
    artworkCsv.status !== 200 ||
    !artworkCsv.text.includes("outputFileName") ||
    !artworkCsv.text.includes("referencePhotoUrls") ||
    !artworkCsv.text.includes(smokeId)
  ) {
    throw new Error("Order artwork CSV did not render the smoke prompt pack.")
  }
  console.log("OK order artwork pack exports JSON and CSV")

  const checks = []

  for (const pagePath of ["/admin", "/admin/orders", "/admin/enquiries", "/admin/email-log", "/admin/print-queue", "/artwork"]) {
    const page = await requestPage(pagePath, sessionCookie)
    const hasSmoke = page.text.includes(smokeId) || page.text.includes("Admin Smoke") || page.text.includes(smokeEmail)
    const hasDataIssue = page.text.includes("could not load") || page.text.includes("not fully connected")

    if (page.status !== 200 || hasDataIssue) {
      throw new Error(`${pagePath} failed admin check. Status ${page.status}. Data issue: ${hasDataIssue}`)
    }

    if (pagePath === "/admin/print-queue" && !page.text.includes("In progress")) {
      throw new Error("/admin/print-queue did not render updated fulfilment status.")
    }

    if (pagePath === "/admin/print-queue" && !page.text.includes("customer reference photo")) {
      throw new Error("/admin/print-queue did not render reference photo readiness.")
    }

    if (pagePath === "/admin/print-queue" && !page.text.includes("Production checklist")) {
      throw new Error("/admin/print-queue did not render the production checklist.")
    }

    if (pagePath === "/admin/print-queue" && !page.text.includes(`/api/orders/artwork-pack?orderId=${encodeURIComponent(smokeId)}&amp;format=csv`)) {
      throw new Error("/admin/print-queue did not link directly to the artwork CSV.")
    }

    if (pagePath === "/admin/print-queue" && !page.text.includes(`/admin/orders?order=${encodeURIComponent(smokeId)}`)) {
      throw new Error("/admin/print-queue did not link directly to the full smoke order.")
    }

    if (pagePath === "/artwork" && !page.text.includes("Preview CSV")) {
      throw new Error("/artwork did not render the protected artwork review tools.")
    }

    checks.push({ path: pagePath, status: page.status, hasSmoke })
  }

  const apiOrders = await requestJson("/api/orders", { headers: { Cookie: sessionCookie } })
  const apiEnquiries = await requestJson("/api/enquiries", { headers: { Cookie: sessionCookie } })
  const apiEmailLog = await requestJson("/api/email-log", { headers: { Cookie: sessionCookie } })
  const apiArtwork = await requestJson("/api/artwork-manifest?prompts=1&missing=1&priority=1&phase=preview", {
    headers: { Cookie: sessionCookie },
  })

  const apiChecks = {
    orders: apiOrders.data.orders?.some((savedOrder) => savedOrder.id === smokeId),
    enquiries: apiEnquiries.data.enquiries?.some((enquiry) => enquiry.email === smokeEmail),
    emailLogs: apiEmailLog.data.emails?.some((email) => email.orderId === smokeId),
    artwork: Array.isArray(apiArtwork.data) && apiArtwork.data.every((item) => item.launchPriority && item.artworkPhase === "preview"),
  }

  if (!apiChecks.orders || !apiChecks.enquiries || !apiChecks.emailLogs || !apiChecks.artwork) {
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
