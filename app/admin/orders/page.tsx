"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AlertTriangle, ArrowUpDown, BookOpen, Camera, CheckCircle2, CircleDollarSign, ClipboardCheck, Download, Mail, PackageCheck, Printer, RefreshCw, Search, Trash2, Truck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { AdminShell } from "../admin-shell"

type CheckoutProduct = "digital" | "hardback" | "upgrade"
type FulfilmentStatus = "new" | "in_progress" | "ready" | "sent"
type PaymentStatus = "payment_pending" | "paid_demo" | "paid"
type OrderSort = "newest" | "oldest" | "total_desc" | "total_asc" | "hero" | "email"
type OrderViewFilter = "all" | "needs_action" | "paid" | "unpaid" | "print" | "email_issue" | "sent"

type StoryPathChoice = {
  pageId: string
  choiceId: string
  pathTag?: string
  text: string
}

type OrderRecord = {
  id: string
  createdAt: string
  product: CheckoutProduct
  total: number
  email: string
  phone?: string
  heroName: string
  heroType: string
  storyTitle: string
  storyId: string
  gender: "boy" | "girl" | null
  photoCount?: number
  choices: StoryPathChoice[]
  postage?: {
    fullName: string
    addressLine1: string
    addressLine2: string
    city: string
    postcode: string
    country: string
  }
  status: PaymentStatus
  fulfilmentStatus?: FulfilmentStatus
  fulfilmentUpdatedAt?: string
  checkoutUrl?: string
  downloadUrl?: string
  emailSentAt?: string
}

type OrderPhoto = {
  name: string
  size: number
  mimeType: string
  storagePath: string
  uploadedAt: string
  source: "supabase" | "local"
  url?: string
}

const productLabel: Record<CheckoutProduct, string> = {
  digital: "Digital Storybook",
  hardback: "Hardback Keepsake",
  upgrade: "Hardback Upgrade",
}

const fulfilmentOptions: { value: FulfilmentStatus; label: string; className: string }[] = [
  { value: "new", label: "New", className: "bg-sky-100 text-sky-800" },
  { value: "in_progress", label: "In progress", className: "bg-amber-100 text-amber-800" },
  { value: "ready", label: "Ready", className: "bg-purple-100 text-purple-800" },
  { value: "sent", label: "Sent / complete", className: "bg-emerald-600 text-white" },
]

const orderSortOptions: { value: OrderSort; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "total_desc", label: "Highest total" },
  { value: "total_asc", label: "Lowest total" },
  { value: "hero", label: "Hero name" },
  { value: "email", label: "Email" },
]

const fulfilmentLabel = (status?: FulfilmentStatus) =>
  fulfilmentOptions.find((option) => option.value === (status || "new")) || fulfilmentOptions[0]

const paymentLabel = (status: PaymentStatus) => {
  if (status === "paid") return "Paid"
  if (status === "paid_demo") return "Paid demo"
  return "Payment pending"
}

const paymentBadgeClass = (status: PaymentStatus) => {
  if (status === "paid") return "bg-emerald-600 text-white"
  if (status === "paid_demo") return "bg-teal-100 text-teal-800"
  return "bg-rose-600 text-white"
}

const isPaidOrder = (order: Pick<OrderRecord, "status">) => order.status === "paid" || order.status === "paid_demo"
const isPrintOrder = (order: Pick<OrderRecord, "product">) => order.product !== "digital"
const isSentOrder = (order: Pick<OrderRecord, "fulfilmentStatus">) => (order.fulfilmentStatus || "new") === "sent"
const needsPrintAction = (order: Pick<OrderRecord, "product" | "status" | "fulfilmentStatus">) =>
  isPaidOrder(order) && isPrintOrder(order) && !isSentOrder(order)
const needsEmailAction = (order: Pick<OrderRecord, "status" | "emailSentAt">) => isPaidOrder(order) && !order.emailSentAt
const orderNeedsAction = (order: Pick<OrderRecord, "product" | "status" | "fulfilmentStatus" | "emailSentAt">) =>
  !isPaidOrder(order) || needsPrintAction(order) || needsEmailAction(order)

const orderCardClass = (order: Pick<OrderRecord, "status" | "fulfilmentStatus">) => {
  if (!isPaidOrder(order)) return "border-rose-700 bg-rose-50 shadow-[8px_8px_0_rgba(190,18,60,0.16)]"

  const fulfilmentStatus = order.fulfilmentStatus || "new"
  if (fulfilmentStatus === "sent") return "border-emerald-700 bg-emerald-50 shadow-[8px_8px_0_rgba(21,128,61,0.16)]"
  if (fulfilmentStatus === "ready") return "border-purple-700 bg-purple-50 shadow-[8px_8px_0_rgba(126,34,206,0.14)]"
  if (fulfilmentStatus === "in_progress") return "border-amber-600 bg-amber-50 shadow-[8px_8px_0_rgba(217,119,6,0.14)]"
  return "border-sky-700 bg-sky-50 shadow-[8px_8px_0_rgba(2,132,199,0.12)]"
}

const orderBannerClass = (order: Pick<OrderRecord, "status" | "fulfilmentStatus">) => {
  if (!isPaidOrder(order)) return "border-rose-300 bg-white text-rose-800"

  const fulfilmentStatus = order.fulfilmentStatus || "new"
  if (fulfilmentStatus === "sent") return "border-emerald-300 bg-emerald-100 text-emerald-900"
  if (fulfilmentStatus === "ready") return "border-purple-300 bg-white text-purple-900"
  if (fulfilmentStatus === "in_progress") return "border-amber-300 bg-white text-amber-900"
  return "border-sky-300 bg-white text-sky-900"
}

const orderBannerMessage = (order: Pick<OrderRecord, "product" | "status" | "fulfilmentStatus">) => {
  if (!isPaidOrder(order)) return "UNPAID ORDER - do not print, send, or fulfil until Stripe payment is confirmed."

  const fulfilmentStatus = order.fulfilmentStatus || "new"
  if (fulfilmentStatus === "sent") return "COMPLETE - this order has been sent to print/fulfilment."
  if (fulfilmentStatus === "ready") return "READY - files are ready; finish Lulu/manual fulfilment next."
  if (fulfilmentStatus === "in_progress") return "IN PROGRESS - this order is being prepared."
  if (isPrintOrder(order)) return "NEW PAID PRINT ORDER - prepare the Lulu files and fulfil manually."
  return "PAID DIGITAL ORDER - customer access is unlocked."
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))

const money = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" })
const canClearOrders = process.env.NODE_ENV !== "production"
const adminOrderLimit = 75

const csvEscape = (value: string | number | null | undefined) => `"${String(value ?? "").replaceAll('"', '""')}"`

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [query, setQuery] = useState("")
  const [viewFilter, setViewFilter] = useState<OrderViewFilter>("all")
  const [statusFilter, setStatusFilter] = useState<FulfilmentStatus | "all">("all")
  const [sortBy, setSortBy] = useState<OrderSort>("newest")
  const [isLoading, setIsLoading] = useState(true)
  const [adminMessage, setAdminMessage] = useState("")
  const [expandedPhotoOrders, setExpandedPhotoOrders] = useState<Record<string, boolean>>({})
  const [orderPhotos, setOrderPhotos] = useState<Record<string, OrderPhoto[]>>({})
  const [photoLoading, setPhotoLoading] = useState<Record<string, boolean>>({})
  const [photoErrors, setPhotoErrors] = useState<Record<string, string>>({})

  const loadOrders = async () => {
    setIsLoading(true)
    setAdminMessage("")

    try {
      const response = await fetch(`/api/orders?limit=${adminOrderLimit}`, { cache: "no-store" })
      if (!response.ok) throw new Error("Failed to load server orders")

      const data = await response.json()
      if (Array.isArray(data.orders)) {
        setOrders(data.orders)
        return
      }
    } catch {
      setOrders([])
      setAdminMessage("Could not load orders from the server data store.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const orderQuery = params.get("order") || params.get("q")

    if (orderQuery) {
      setQuery(orderQuery)
      setViewFilter("all")
      setStatusFilter("all")
    }
  }, [])

  const filteredOrders = useMemo(() => {
    const normalisedQuery = query.trim().toLowerCase()
    const viewMatchedOrders = orders.filter((order) => {
      if (viewFilter === "needs_action") return orderNeedsAction(order)
      if (viewFilter === "paid") return isPaidOrder(order)
      if (viewFilter === "unpaid") return !isPaidOrder(order)
      if (viewFilter === "print") return needsPrintAction(order)
      if (viewFilter === "email_issue") return needsEmailAction(order)
      if (viewFilter === "sent") return isSentOrder(order)
      return true
    })
    const statusMatchedOrders =
      statusFilter === "all"
        ? viewMatchedOrders
        : viewMatchedOrders.filter((order) => (order.fulfilmentStatus || "new") === statusFilter)

    const matchedOrders = normalisedQuery
      ? statusMatchedOrders.filter((order) =>
          [
            order.id,
            order.email,
            order.heroName,
            order.heroType,
            order.storyTitle,
            productLabel[order.product],
            order.postage?.fullName,
            order.postage?.postcode,
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(normalisedQuery)),
        )
      : statusMatchedOrders

    return [...matchedOrders].sort((first, second) => {
      if (sortBy === "oldest") return new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime()
      if (sortBy === "total_desc") return second.total - first.total
      if (sortBy === "total_asc") return first.total - second.total
      if (sortBy === "hero") return first.heroName.localeCompare(second.heroName)
      if (sortBy === "email") return first.email.localeCompare(second.email)
      return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
    })
  }, [orders, query, sortBy, statusFilter, viewFilter])

  const totals = useMemo(() => {
    const paidOrders = orders.filter(isPaidOrder)

    return {
      paidRevenue: paidOrders.reduce((sum, order) => sum + order.total, 0),
      paidOrders: paidOrders.length,
      unpaidOrders: orders.filter((order) => !isPaidOrder(order)).length,
      printOrders: orders.filter(isPrintOrder).length,
      digitalOrders: orders.filter((order) => order.product === "digital").length,
      needsAction: orders.filter(orderNeedsAction).length,
      needsPrint: orders.filter(needsPrintAction).length,
      emailIssues: orders.filter(needsEmailAction).length,
      sentOrders: orders.filter(isSentOrder).length,
      fulfilment: fulfilmentOptions.reduce(
        (counts, option) => ({
          ...counts,
          [option.value]: orders.filter((order) => (order.fulfilmentStatus || "new") === option.value).length,
        }),
        {} as Record<FulfilmentStatus, number>,
      ),
    }
  }, [orders])

  const exportCsv = () => {
    const headers = [
      "id",
      "createdAt",
      "status",
      "fulfilmentStatus",
      "fulfilmentUpdatedAt",
      "checkoutUrl",
      "downloadUrl",
      "emailSentAt",
      "product",
      "total",
      "email",
      "phone",
      "heroName",
      "heroType",
      "storyTitle",
      "storyId",
      "gender",
      "photoCount",
      "choices",
      "postageName",
      "addressLine1",
      "addressLine2",
      "city",
      "postcode",
      "country",
    ]

    const rows = filteredOrders.map((order) => [
      order.id,
      order.createdAt,
      order.status,
      fulfilmentLabel(order.fulfilmentStatus).label,
      order.fulfilmentUpdatedAt,
      order.checkoutUrl,
      order.downloadUrl,
      order.emailSentAt,
      productLabel[order.product],
      order.total.toFixed(2),
      order.email,
      order.phone,
      order.heroName,
      order.heroType,
      order.storyTitle,
      order.storyId,
      order.gender,
      order.photoCount ?? 0,
      order.choices.map((choice) => `${choice.pageId}: ${choice.text}`).join(" | "),
      order.postage?.fullName,
      order.postage?.addressLine1,
      order.postage?.addressLine2,
      order.postage?.city,
      order.postage?.postcode,
      order.postage?.country,
    ])

    const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
    const link = document.createElement("a")
    link.href = url
    const suffix = [viewFilter, statusFilter]
      .filter((filter) => filter !== "all")
      .map((filter) => filter.replace("_", "-"))
      .join("-") || "all"
    link.download = `little-legends-orders-${suffix}-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const clearOrders = async () => {
    const confirmed = window.confirm(
      "Clear every order from the admin data store? This is only intended for test data and cannot be undone.",
    )

    if (!confirmed) return

    setAdminMessage("")

    try {
      const response = await fetch("/api/orders", { method: "DELETE" })

      if (!response.ok) {
        throw new Error("Failed to clear orders")
      }

      setOrders([])
      setAdminMessage("Orders cleared.")
    } catch {
      setAdminMessage("Orders could not be cleared from the server data store.")
    }
  }

  const deleteSingleOrder = async (order: OrderRecord) => {
    const confirmed = window.confirm(
      `Delete order ${order.id} for ${order.email}? This removes it from admin order history and cannot be undone.`,
    )

    if (!confirmed) return

    setAdminMessage("")

    try {
      const response = await fetch(`/api/orders?orderId=${encodeURIComponent(order.id)}`, { method: "DELETE" })

      if (!response.ok) {
        throw new Error("Failed to delete order")
      }

      setOrders((currentOrders) => currentOrders.filter((savedOrder) => savedOrder.id !== order.id))
      setAdminMessage(`Deleted order ${order.id}.`)
    } catch {
      setAdminMessage("Order could not be deleted from the server data store.")
    }
  }

  const updateFulfilmentStatus = async (targetOrder: OrderRecord, fulfilmentStatus: FulfilmentStatus) => {
    const willSendPrintEmail =
      fulfilmentStatus === "sent" &&
      targetOrder.fulfilmentStatus !== "sent" &&
      isPaidOrder(targetOrder) &&
      isPrintOrder(targetOrder)

    if (willSendPrintEmail) {
      const confirmed = window.confirm(
        `Mark ${targetOrder.id} as sent/complete and email ${targetOrder.email} that the hardback has been sent for printing?`,
      )

      if (!confirmed) return
    }

    setAdminMessage("")

    try {
      const response = await fetch("/api/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId: targetOrder.id, fulfilmentStatus }),
      })

      if (!response.ok) throw new Error("Failed to update order")

      const data = await response.json()
      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === targetOrder.id
            ? {
                ...order,
                fulfilmentStatus: data.order?.fulfilmentStatus || fulfilmentStatus,
                fulfilmentUpdatedAt: data.order?.fulfilmentUpdatedAt || new Date().toISOString(),
              }
            : order,
        ),
      )
      setAdminMessage(
        data.fulfilmentEmail
          ? `Order marked complete and customer print update logged for ${data.fulfilmentEmail.to}.`
          : `Order ${targetOrder.id} updated to ${fulfilmentLabel(fulfilmentStatus).label}.`,
      )
    } catch {
      setAdminMessage("Could not update fulfilment status. Check the server order store and try again.")
    }
  }

  const resendConfirmationEmail = async (orderId: string) => {
    setAdminMessage("")

    try {
      const response = await fetch("/api/orders/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId }),
      })

      if (!response.ok) throw new Error("Failed to resend email")

      const data = await response.json()
      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                emailSentAt: data.email?.sentAt || new Date().toISOString(),
                downloadUrl: data.email?.downloadUrl || order.downloadUrl,
              }
            : order,
        ),
      )
      setAdminMessage(`Confirmation email logged for ${data.email?.to || "customer"}.`)
    } catch {
      setAdminMessage("Could not resend the confirmation email. Check the order status and try again.")
    }
  }

  const toggleOrderPhotos = async (orderId: string) => {
    const isOpen = Boolean(expandedPhotoOrders[orderId])

    setExpandedPhotoOrders((current) => ({
      ...current,
      [orderId]: !isOpen,
    }))

    if (isOpen || orderPhotos[orderId] || photoLoading[orderId]) {
      return
    }

    setPhotoLoading((current) => ({ ...current, [orderId]: true }))
    setPhotoErrors((current) => ({ ...current, [orderId]: "" }))

    try {
      const response = await fetch(`/api/order-photos?orderId=${encodeURIComponent(orderId)}`, {
        cache: "no-store",
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.error || "Failed to load order photos")
      }

      setOrderPhotos((current) => ({
        ...current,
        [orderId]: Array.isArray(data?.photos) ? data.photos : [],
      }))
    } catch (error) {
      setPhotoErrors((current) => ({
        ...current,
        [orderId]: error instanceof Error ? error.message : "Could not load order photos.",
      }))
    } finally {
      setPhotoLoading((current) => ({ ...current, [orderId]: false }))
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="rounded-[2rem] border-4 border-sky-950 bg-white p-5 shadow-[8px_8px_0_rgba(8,47,73,0.18)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Badge className="mb-3 bg-amber-300 px-3 py-1 text-sky-950">Order management</Badge>
              <h1 className="text-3xl font-black uppercase leading-tight text-sky-950 sm:text-5xl">Orders</h1>
              <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-slate-700">
                Manage the latest orders, story choices, email details, payment status, photo follow-up, and hardback delivery.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="outline" className="h-11 rounded-xl border-sky-200 bg-white px-5 font-black text-sky-700">
                <Link href="/create">Back to app</Link>
              </Button>
              <Button
                type="button"
                onClick={loadOrders}
                disabled={isLoading}
                variant="outline"
                className="h-11 rounded-xl border-sky-200 bg-white px-5 font-black text-sky-700"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                type="button"
                onClick={exportCsv}
                disabled={filteredOrders.length === 0}
                className="h-11 rounded-xl bg-sky-500 px-5 font-black text-white hover:bg-sky-600"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              {canClearOrders && (
                <Button
                  type="button"
                  onClick={clearOrders}
                  disabled={orders.length === 0}
                  variant="outline"
                  className="h-11 rounded-xl border-rose-100 bg-white px-5 font-black text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>

        {adminMessage && (
          <Card className="border-4 border-amber-300 bg-amber-50 p-4 text-sm font-black text-amber-900">
            {adminMessage}
          </Card>
        )}

        <div className="grid gap-4 lg:grid-cols-4">
          <button
            type="button"
            onClick={() => {
              setViewFilter("needs_action")
              setStatusFilter("all")
            }}
            className={`rounded-xl border-4 p-5 text-left shadow-[6px_6px_0_rgba(8,47,73,0.12)] transition hover:-translate-y-0.5 ${
              viewFilter === "needs_action" ? "border-rose-700 bg-rose-100" : "border-sky-950 bg-white"
            }`}
          >
            <AlertTriangle className="h-6 w-6 text-rose-700" />
            <p className="mt-2 text-sm font-black uppercase text-rose-700">Needs action</p>
            <p className="text-4xl font-black text-sky-950">{totals.needsAction}</p>
          </button>
          <button
            type="button"
            onClick={() => {
              setViewFilter("unpaid")
              setStatusFilter("all")
            }}
            className={`rounded-xl border-4 p-5 text-left shadow-[6px_6px_0_rgba(8,47,73,0.12)] transition hover:-translate-y-0.5 ${
              viewFilter === "unpaid" ? "border-rose-700 bg-rose-100" : "border-sky-950 bg-white"
            }`}
          >
            <CircleDollarSign className="h-6 w-6 text-rose-700" />
            <p className="mt-2 text-sm font-black uppercase text-rose-700">Unpaid</p>
            <p className="text-4xl font-black text-sky-950">{totals.unpaidOrders}</p>
          </button>
          <button
            type="button"
            onClick={() => {
              setViewFilter("print")
              setStatusFilter("all")
            }}
            className={`rounded-xl border-4 p-5 text-left shadow-[6px_6px_0_rgba(8,47,73,0.12)] transition hover:-translate-y-0.5 ${
              viewFilter === "print" ? "border-purple-700 bg-purple-100" : "border-sky-950 bg-white"
            }`}
          >
            <Printer className="h-6 w-6 text-purple-700" />
            <p className="mt-2 text-sm font-black uppercase text-purple-700">Lulu needed</p>
            <p className="text-4xl font-black text-sky-950">{totals.needsPrint}</p>
          </button>
          <button
            type="button"
            onClick={() => {
              setViewFilter("email_issue")
              setStatusFilter("all")
            }}
            className={`rounded-xl border-4 p-5 text-left shadow-[6px_6px_0_rgba(8,47,73,0.12)] transition hover:-translate-y-0.5 ${
              viewFilter === "email_issue" ? "border-amber-600 bg-amber-100" : "border-sky-950 bg-white"
            }`}
          >
            <Mail className="h-6 w-6 text-amber-700" />
            <p className="mt-2 text-sm font-black uppercase text-amber-700">Email check</p>
            <p className="text-4xl font-black text-sky-950">{totals.emailIssues}</p>
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-4 border-sky-950 bg-sky-50 p-5 shadow-[6px_6px_0_rgba(8,47,73,0.12)]">
            <PackageCheck className="h-6 w-6 text-sky-700" />
            <p className="text-sm font-black uppercase text-sky-700">Orders</p>
            <p className="text-4xl font-black text-sky-950">{orders.length}</p>
          </Card>
          <Card className="border-4 border-sky-950 bg-amber-50 p-5 shadow-[6px_6px_0_rgba(8,47,73,0.12)]">
            <BookOpen className="h-6 w-6 text-amber-700" />
            <p className="text-sm font-black uppercase text-amber-700">Paid revenue</p>
            <p className="text-4xl font-black text-sky-950">{money.format(totals.paidRevenue)}</p>
          </Card>
          <Card className="border-4 border-sky-950 bg-emerald-50 p-5 shadow-[6px_6px_0_rgba(8,47,73,0.12)]">
            <Truck className="h-6 w-6 text-emerald-700" />
            <p className="text-sm font-black uppercase text-emerald-700">Fulfilment</p>
            <p className="text-lg font-black text-sky-950">{totals.paidOrders} paid / {totals.sentOrders} sent</p>
            <p className="mt-1 text-xs font-bold text-slate-600">{totals.printOrders} print / {totals.digitalOrders} digital</p>
          </Card>
        </div>

        <Card className="border-4 border-sky-950 bg-white p-5 shadow-[8px_8px_0_rgba(8,47,73,0.14)]">
          <div className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-center">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by order, email, hero, product, or postcode..."
                  className="h-12 rounded-xl border-2 border-sky-100 bg-white pl-11 font-semibold"
                />
              </div>
              <label className="relative block">
                <ArrowUpDown className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as OrderSort)}
                  className="h-12 w-full rounded-xl border-2 border-sky-100 bg-white pl-11 pr-8 text-sm font-black text-sky-900 outline-none xl:w-48"
                  aria-label="Sort orders"
                >
                  {orderSortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "all", label: `All ${orders.length}` },
                { value: "needs_action", label: `Needs action ${totals.needsAction}` },
                { value: "paid", label: `Paid ${totals.paidOrders}` },
                { value: "unpaid", label: `Unpaid ${totals.unpaidOrders}` },
                { value: "print", label: `Lulu ${totals.needsPrint}` },
                { value: "email_issue", label: `Email check ${totals.emailIssues}` },
                { value: "sent", label: `Sent ${totals.sentOrders}` },
              ].map((option) => {
                const isSelected = viewFilter === option.value

                return (
                  <Button
                    key={`view-${option.value}`}
                    type="button"
                    onClick={() => {
                      setViewFilter(option.value as OrderViewFilter)
                      setStatusFilter("all")
                    }}
                    variant={isSelected ? "default" : "outline"}
                    className={`h-10 rounded-xl px-4 text-xs font-black ${
                      isSelected
                        ? "bg-sky-500 text-white hover:bg-sky-600"
                        : "border-sky-100 bg-white text-sky-700 hover:bg-sky-50"
                    }`}
                  >
                    {option.label}
                  </Button>
                )
              })}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => setStatusFilter("all")}
                variant={statusFilter === "all" ? "default" : "outline"}
                className={`h-10 rounded-xl px-4 text-xs font-black ${
                  statusFilter === "all"
                    ? "bg-sky-500 text-white hover:bg-sky-600"
                    : "border-sky-100 bg-white text-sky-700 hover:bg-sky-50"
                }`}
              >
                All {orders.length}
              </Button>
              {fulfilmentOptions.map((option) => {
                const isSelected = statusFilter === option.value

                return (
                  <Button
                    key={`filter-${option.value}`}
                    type="button"
                    onClick={() => setStatusFilter(option.value)}
                    variant={isSelected ? "default" : "outline"}
                    className={`h-10 rounded-xl px-4 text-xs font-black ${
                      isSelected
                        ? "bg-sky-500 text-white hover:bg-sky-600"
                        : "border-sky-100 bg-white text-sky-700 hover:bg-sky-50"
                    }`}
                  >
                    {option.label} {totals.fulfilment[option.value]}
                  </Button>
                )
              })}
            </div>
          </div>
        </Card>

        {isLoading ? (
          <Card className="border-4 border-sky-950 bg-white p-8 text-center shadow-[8px_8px_0_rgba(8,47,73,0.14)]">
            <h2 className="text-2xl font-black text-sky-950">Loading orders</h2>
          </Card>
        ) : filteredOrders.length === 0 ? (
          <Card className="border-4 border-sky-950 bg-white p-8 text-center shadow-[8px_8px_0_rgba(8,47,73,0.14)]">
            <h2 className="text-2xl font-black text-sky-950">No orders found</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm font-semibold leading-6 text-slate-700">
              Complete a checkout in the app, then return here to inspect the saved order.
            </p>
          </Card>
        ) : (
          <div className="grid gap-5">
            {filteredOrders.map((order) => {
              const paidForOrder = isPaidOrder(order)
              const completeOrder = paidForOrder && isSentOrder(order)
              const bannerMessage = orderBannerMessage(order)

              return (
                <Card
                  key={order.id}
                  className={`border-4 p-5 ${orderCardClass(order)}`}
                >
                <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
                  <div className="space-y-4">
                    <div
                      className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-sm font-black ${orderBannerClass(order)}`}
                    >
                      {paidForOrder ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertTriangle className="h-5 w-5 shrink-0" />}
                      <span>{bannerMessage}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={`${paymentBadgeClass(order.status)} px-3 py-1`}>{paymentLabel(order.status)}</Badge>
                      <Badge className={`${fulfilmentLabel(order.fulfilmentStatus).className} px-3 py-1`}>
                        {fulfilmentLabel(order.fulfilmentStatus).label}
                      </Badge>
                      {completeOrder && <Badge className="bg-emerald-700 px-3 py-1 text-white">Order complete</Badge>}
                      <Badge className="bg-sky-100 px-3 py-1 text-sky-800">{productLabel[order.product]}</Badge>
                      <Badge className="bg-amber-100 px-3 py-1 text-amber-800">{money.format(order.total)}</Badge>
                      <Badge className={`${order.emailSentAt ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"} px-3 py-1`}>
                        {order.emailSentAt ? "Email sent" : "Email not sent"}
                      </Badge>
                      {order.product !== "digital" && (
                        <Badge className="bg-purple-100 px-3 py-1 text-purple-800">
                          {needsPrintAction(order) ? "Lulu required" : "Print order"}
                        </Badge>
                      )}
                      {paidForOrder && (
                        <Link href={`/download/${order.id}`} className="rounded-full bg-white px-3 py-1 text-xs font-black text-sky-700 underline">
                          Download
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteSingleOrder(order)}
                        className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-xs font-black text-rose-700 underline"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-sky-700">{formatDate(order.createdAt)}</p>
                      <h2 className="mt-1 break-all text-2xl font-black text-sky-950">{order.id}</h2>
                      <p className="mt-2 text-lg font-black text-rose-600">{order.heroName} the {order.heroType}</p>
                      <p className="text-sm font-bold leading-6 text-slate-700">{order.storyTitle}</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border-2 border-sky-100 bg-white p-4">
                        <div className="mb-2 flex items-center gap-2 text-sm font-black text-sky-900">
                          <Mail className="h-4 w-4" />
                          Customer
                        </div>
                        <p className="break-all text-sm font-semibold text-slate-700">{order.email}</p>
                        {order.phone && <p className="mt-1 text-sm font-semibold text-slate-700">{order.phone}</p>}
                        {order.emailSentAt && (
                          <p className="mt-2 text-xs font-bold text-emerald-700">
                            Email logged: {formatDate(order.emailSentAt)}
                          </p>
                        )}
                        {paidForOrder && (
                          <Button
                            type="button"
                            onClick={() => resendConfirmationEmail(order.id)}
                            variant="outline"
                            className="mt-3 h-9 rounded-xl border-sky-100 bg-white px-3 text-xs font-black text-sky-700 hover:bg-sky-50"
                          >
                            <Mail className="h-4 w-4" />
                            Resend confirmation
                          </Button>
                        )}
                      </div>
                      <div className="rounded-xl border-2 border-sky-100 bg-white p-4">
                        <div className="mb-2 flex items-center gap-2 text-sm font-black text-sky-900">
                          <BookOpen className="h-4 w-4" />
                          Story
                        </div>
                        <p className="text-sm font-semibold text-slate-700">ID: {order.storyId}</p>
                        <p className="mt-1 text-sm font-semibold text-slate-700">Gender: {order.gender || "Not set"}</p>
                        <p className="mt-1 text-sm font-semibold text-slate-700">Reference photos selected: {order.photoCount ?? 0}</p>
                        <details className="mt-3 rounded-xl border border-purple-100 bg-purple-50 px-3 py-2">
                          <summary className="cursor-pointer text-xs font-black text-purple-800">Advanced artwork exports</summary>
                          <p className="mt-2 text-xs font-bold leading-5 text-purple-900">
                            Only use these if artwork needs manual debugging. Normal Lulu fulfilment does not need them.
                          </p>
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            <Button asChild variant="outline" className="h-9 rounded-xl border-purple-100 bg-white px-3 text-xs font-black text-purple-700 hover:bg-purple-50">
                              <Link href={`/api/orders/artwork-pack?orderId=${encodeURIComponent(order.id)}`} target="_blank" rel="noreferrer">
                                <Download className="h-4 w-4" />
                                JSON
                              </Link>
                            </Button>
                            <Button asChild variant="outline" className="h-9 rounded-xl border-purple-100 bg-white px-3 text-xs font-black text-purple-700 hover:bg-purple-50">
                              <Link href={`/api/orders/artwork-pack?orderId=${encodeURIComponent(order.id)}&format=csv`}>
                                <Download className="h-4 w-4" />
                                CSV
                              </Link>
                            </Button>
                          </div>
                        </details>
                        {(order.photoCount ?? 0) > 0 && (
                          <div className="mt-2 space-y-2">
                            <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold leading-5 text-amber-900">
                              Stored privately with the order for artwork reference.
                            </p>
                            <Button
                              type="button"
                              onClick={() => toggleOrderPhotos(order.id)}
                              variant="outline"
                              className="h-9 rounded-xl border-sky-100 bg-white px-3 text-xs font-black text-sky-700 hover:bg-sky-50"
                            >
                              <Camera className="h-4 w-4" />
                              {expandedPhotoOrders[order.id] ? "Hide photos" : `View photos (${order.photoCount ?? 0})`}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {expandedPhotoOrders[order.id] && (
                      <div className="rounded-xl border-2 border-sky-100 bg-white p-4">
                        <div className="mb-3 flex items-center gap-2 text-sm font-black text-sky-900">
                          <Camera className="h-4 w-4" />
                          Reference photos
                        </div>
                        {photoLoading[order.id] ? (
                          <p className="text-sm font-semibold text-slate-700">Loading stored reference photos...</p>
                        ) : photoErrors[order.id] ? (
                          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">{photoErrors[order.id]}</p>
                        ) : (orderPhotos[order.id] || []).length === 0 ? (
                          <p className="text-sm font-semibold text-slate-700">No stored photos were found for this order yet.</p>
                        ) : (
                          <div className="grid gap-3 sm:grid-cols-3">
                            {(orderPhotos[order.id] || []).map((photo, index) => (
                              <a
                                key={`${order.id}-${photo.storagePath}`}
                                href={photo.url}
                                target="_blank"
                                rel="noreferrer"
                                className="group overflow-hidden rounded-2xl border-2 border-sky-100 bg-sky-50 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300"
                              >
                                {photo.url ? (
                                  <img
                                    src={photo.url}
                                    alt={`Reference photo ${index + 1} for order ${order.id}`}
                                    className="h-32 w-full object-cover"
                                  />
                                ) : (
                                  <div className="grid h-32 place-items-center bg-sky-100 text-sky-700">
                                    <Camera className="h-8 w-8" />
                                  </div>
                                )}
                                <div className="space-y-1 px-3 py-2">
                                  <p className="truncate text-xs font-black text-sky-900">Photo {index + 1}</p>
                                  <p className="text-[11px] font-semibold text-slate-600">
                                    {Math.max(1, Math.round(photo.size / 1024))} KB
                                  </p>
                                </div>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className={`rounded-xl border-2 bg-white p-4 ${paidForOrder ? "border-sky-100" : "border-rose-200"}`}>
                      <div className="mb-3 text-sm font-black text-sky-900">Fulfilment status</div>
                      <p className="mb-3 text-xs font-bold leading-5 text-slate-600">
                        {paidForOrder
                          ? `Last updated: ${formatDate(order.fulfilmentUpdatedAt || order.createdAt)}`
                          : "Locked until payment is confirmed."}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {fulfilmentOptions.map((option) => {
                          const isSelected = (order.fulfilmentStatus || "new") === option.value

                          return (
                            <Button
                              key={`${order.id}-${option.value}`}
                              type="button"
                              onClick={() => updateFulfilmentStatus(order, option.value)}
                              disabled={!paidForOrder}
                              variant={isSelected ? "default" : "outline"}
                              className={`h-10 rounded-xl text-xs font-black ${
                                isSelected
                                  ? option.value === "sent"
                                    ? "bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-rose-200 disabled:text-rose-800"
                                    : "bg-sky-500 text-white hover:bg-sky-600 disabled:bg-rose-200 disabled:text-rose-800"
                                  : "border-sky-100 bg-white text-sky-700 hover:bg-sky-50 disabled:border-rose-100 disabled:bg-rose-50 disabled:text-rose-400"
                              }`}
                            >
                              {option.label}
                            </Button>
                          )
                        })}
                      </div>
                    </div>

                    {isPrintOrder(order) && (
                      <div className={`rounded-xl border-2 bg-white p-4 ${paidForOrder ? "border-purple-200" : "border-rose-200"}`}>
                        <div className="mb-3 flex items-center gap-2 text-sm font-black text-purple-900">
                          <ClipboardCheck className="h-4 w-4" />
                          Lulu print checklist
                        </div>
                        <div className="grid gap-2 text-xs font-black text-slate-700">
                          <div className={`rounded-lg px-3 py-2 ${paidForOrder ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>
                            1. Confirm Stripe payment
                          </div>
                          <div className="rounded-lg bg-purple-50 px-3 py-2 text-purple-800">2. Download Lulu interior PDF</div>
                          <div className="rounded-lg bg-purple-50 px-3 py-2 text-purple-800">3. Upload interior and cover to Lulu</div>
                          <div className="rounded-lg bg-sky-50 px-3 py-2 text-sky-800">4. Order print, then mark Sent / complete</div>
                        </div>
                        {paidForOrder ? (
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            <Button asChild variant="outline" className="h-9 rounded-xl border-purple-100 bg-white px-3 text-xs font-black text-purple-700 hover:bg-purple-50">
                              <Link href={`/download/${order.id}?format=lulu`}>
                                <Printer className="h-4 w-4" />
                                Lulu interior
                              </Link>
                            </Button>
                            <Button asChild variant="outline" className="h-9 rounded-xl border-sky-100 bg-white px-3 text-xs font-black text-sky-700 hover:bg-sky-50">
                              <Link href={`/download/${order.id}`}>
                                <Download className="h-4 w-4" />
                                Customer PDF
                              </Link>
                            </Button>
                          </div>
                        ) : (
                          <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold leading-5 text-rose-800">
                            Print links stay hidden until this order is paid.
                          </p>
                        )}
                      </div>
                    )}

                    {order.postage && (
                      <div className="rounded-xl border-2 border-sky-100 bg-white p-4">
                        <div className="mb-2 flex items-center gap-2 text-sm font-black text-sky-900">
                          <Truck className="h-4 w-4" />
                          Postage
                        </div>
                        <div className="space-y-1 text-sm font-semibold leading-6 text-slate-700">
                          <p>{order.postage.fullName}</p>
                          <p>{order.postage.addressLine1}</p>
                          {order.postage.addressLine2 && <p>{order.postage.addressLine2}</p>}
                          <p>{order.postage.city}</p>
                          <p>{order.postage.postcode}</p>
                          <p>{order.postage.country}</p>
                        </div>
                      </div>
                    )}

                    <div className="rounded-xl border-2 border-sky-100 bg-white p-4">
                      <div className="mb-2 text-sm font-black text-sky-900">Story choices</div>
                      {order.choices.length === 0 ? (
                        <p className="text-sm font-semibold text-slate-700">No choices recorded.</p>
                      ) : (
                        <div className="space-y-2">
                          {order.choices.map((choice) => (
                            <div key={`${order.id}-${choice.pageId}-${choice.choiceId}`} className="rounded-lg bg-sky-50 px-3 py-2 text-sm font-semibold leading-6 text-slate-700">
                              <span className="font-black text-sky-900">{choice.pageId}:</span> {choice.text}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </AdminShell>
  )
}
