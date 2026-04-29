import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3003"
const orderId = `SMOKE-${Date.now()}`
const hasStripe = Boolean(process.env.STRIPE_SECRET_KEY)
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const localOrdersFile = path.join(root, "data", "orders.json")

const requestJson = async (path, options = {}) => {
  const response = await fetch(`${appUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  })

  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new Error(`${options.method || "GET"} ${path} failed with ${response.status}: ${text}`)
  }

  return data
}

const requestPage = async (path) => {
  const response = await fetch(`${appUrl}${path}`)

  if (!response.ok) {
    throw new Error(`GET ${path} failed with ${response.status}`)
  }

  return response.status
}

const cleanupSmokeOrder = async () => {
  if (process.env.DATABASE_URL) {
    return
  }

  try {
    const fileContents = await fs.readFile(localOrdersFile, "utf8")
    const parsedOrders = JSON.parse(fileContents.replace(/^\uFEFF/, ""))
    const orders = Array.isArray(parsedOrders) ? parsedOrders : []
    const remainingOrders = orders.filter((order) => !String(order.id || "").startsWith("SMOKE-"))

    if (remainingOrders.length !== orders.length) {
      await fs.writeFile(localOrdersFile, JSON.stringify(remainingOrders, null, 2), "utf8")
    }
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error
    }
  }
}

const order = {
  id: orderId,
  createdAt: new Date().toISOString(),
  product: "digital",
  total: 4.99,
  email: "smoke-test@example.com",
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
await cleanupSmokeOrder()
console.log("OK old smoke orders cleaned")

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
await cleanupSmokeOrder()
console.log("OK smoke order cleaned")
