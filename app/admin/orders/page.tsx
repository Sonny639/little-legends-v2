"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowUpDown, BookOpen, Camera, Download, Mail, PackageCheck, RefreshCw, Search, Trash2, Truck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { AdminShell } from "../admin-shell"

type CheckoutProduct = "digital" | "hardback" | "upgrade"
type FulfilmentStatus = "new" | "in_progress" | "ready" | "sent"
type PaymentStatus = "payment_pending" | "paid_demo" | "paid"
type OrderSort = "newest" | "oldest" | "total_desc" | "total_asc" | "hero" | "email"

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
  { value: "sent", label: "Sent", className: "bg-emerald-100 text-emerald-800" },
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
      setStatusFilter("all")
    }
  }, [])

  const filteredOrders = useMemo(() => {
    const normalisedQuery = query.trim().toLowerCase()
    const statusMatchedOrders =
      statusFilter === "all"
        ? orders
        : orders.filter((order) => (order.fulfilmentStatus || "new") === statusFilter)

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
  }, [orders, query, sortBy, statusFilter])

  const totals = useMemo(
    () => ({
      revenue: orders.reduce((sum, order) => sum + order.total, 0),
      printOrders: orders.filter((order) => order.product !== "digital").length,
      digitalOrders: orders.filter((order) => order.product === "digital").length,
      fulfilment: fulfilmentOptions.reduce(
        (counts, option) => ({
          ...counts,
          [option.value]: orders.filter((order) => (order.fulfilmentStatus || "new") === option.value).length,
        }),
        {} as Record<FulfilmentStatus, number>,
      ),
    }),
    [orders],
  )

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
    const suffix = statusFilter === "all" ? "all" : statusFilter.replace("_", "-")
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

  const updateFulfilmentStatus = async (orderId: string, fulfilmentStatus: FulfilmentStatus) => {
    setAdminMessage("")

    try {
      const response = await fetch("/api/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId, fulfilmentStatus }),
      })

      if (!response.ok) throw new Error("Failed to update order")

      const data = await response.json()
      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                fulfilmentStatus: data.order?.fulfilmentStatus || fulfilmentStatus,
                fulfilmentUpdatedAt: data.order?.fulfilmentUpdatedAt || new Date().toISOString(),
              }
            : order,
        ),
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

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-4 border-sky-950 bg-sky-50 p-5 shadow-[6px_6px_0_rgba(8,47,73,0.12)]">
            <PackageCheck className="h-6 w-6 text-sky-700" />
            <p className="text-sm font-black uppercase text-sky-700">Orders</p>
            <p className="text-4xl font-black text-sky-950">{orders.length}</p>
          </Card>
          <Card className="border-4 border-sky-950 bg-amber-50 p-5 shadow-[6px_6px_0_rgba(8,47,73,0.12)]">
            <BookOpen className="h-6 w-6 text-amber-700" />
            <p className="text-sm font-black uppercase text-amber-700">Revenue</p>
            <p className="text-4xl font-black text-sky-950">{money.format(totals.revenue)}</p>
          </Card>
          <Card className="border-4 border-sky-950 bg-emerald-50 p-5 shadow-[6px_6px_0_rgba(8,47,73,0.12)]">
            <Truck className="h-6 w-6 text-emerald-700" />
            <p className="text-sm font-black uppercase text-emerald-700">Fulfilment</p>
            <p className="text-lg font-black text-sky-950">{totals.printOrders} print / {totals.digitalOrders} digital</p>
          </Card>
        </div>

        <Card className="border-4 border-sky-950 bg-white p-5 shadow-[8px_8px_0_rgba(8,47,73,0.14)]">
          <div className="grid gap-4 xl:grid-cols-[1fr_auto_auto] xl:items-center">
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
            {filteredOrders.map((order) => (
              <Card key={order.id} className="border-4 border-sky-950 bg-[#fffdf5] p-5 shadow-[8px_8px_0_rgba(8,47,73,0.14)]">
                <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-emerald-100 px-3 py-1 text-emerald-800">{paymentLabel(order.status)}</Badge>
                      <Badge className={`${fulfilmentLabel(order.fulfilmentStatus).className} px-3 py-1`}>
                        {fulfilmentLabel(order.fulfilmentStatus).label}
                      </Badge>
                      <Badge className="bg-sky-100 px-3 py-1 text-sky-800">{productLabel[order.product]}</Badge>
                      <Badge className="bg-amber-100 px-3 py-1 text-amber-800">{money.format(order.total)}</Badge>
                      <Badge className={`${order.emailSentAt ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"} px-3 py-1`}>
                        {order.emailSentAt ? "Email sent" : "Email not sent"}
                      </Badge>
                      {order.product !== "digital" && (
                        <Badge className="bg-purple-100 px-3 py-1 text-purple-800">Print required</Badge>
                      )}
                      {(order.status === "paid" || order.status === "paid_demo") && (
                        <Link href={`/download/${order.id}`} className="rounded-full bg-white px-3 py-1 text-xs font-black text-sky-700 underline">
                          Download
                        </Link>
                      )}
                      <Link
                        href={`/api/orders/artwork-pack?orderId=${encodeURIComponent(order.id)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full bg-white px-3 py-1 text-xs font-black text-purple-700 underline"
                      >
                        Artwork JSON
                      </Link>
                      <Link
                        href={`/api/orders/artwork-pack?orderId=${encodeURIComponent(order.id)}&format=csv`}
                        className="rounded-full bg-white px-3 py-1 text-xs font-black text-purple-700 underline"
                      >
                        Artwork CSV
                      </Link>
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
                        {(order.status === "paid" || order.status === "paid_demo") && (
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
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          <Button asChild variant="outline" className="h-9 rounded-xl border-purple-100 bg-white px-3 text-xs font-black text-purple-700 hover:bg-purple-50">
                            <Link href={`/api/orders/artwork-pack?orderId=${encodeURIComponent(order.id)}`} target="_blank" rel="noreferrer">
                              <Download className="h-4 w-4" />
                              Artwork JSON
                            </Link>
                          </Button>
                          <Button asChild variant="outline" className="h-9 rounded-xl border-purple-100 bg-white px-3 text-xs font-black text-purple-700 hover:bg-purple-50">
                            <Link href={`/api/orders/artwork-pack?orderId=${encodeURIComponent(order.id)}&format=csv`}>
                              <Download className="h-4 w-4" />
                              Artwork CSV
                            </Link>
                          </Button>
                        </div>
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
                    <div className="rounded-xl border-2 border-sky-100 bg-white p-4">
                      <div className="mb-3 text-sm font-black text-sky-900">Fulfilment status</div>
                      <p className="mb-3 text-xs font-bold leading-5 text-slate-600">
                        Last updated: {formatDate(order.fulfilmentUpdatedAt || order.createdAt)}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {fulfilmentOptions.map((option) => {
                          const isSelected = (order.fulfilmentStatus || "new") === option.value

                          return (
                            <Button
                              key={`${order.id}-${option.value}`}
                              type="button"
                              onClick={() => updateFulfilmentStatus(order.id, option.value)}
                              variant={isSelected ? "default" : "outline"}
                              className={`h-10 rounded-xl text-xs font-black ${
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
                    </div>

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
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  )
}
