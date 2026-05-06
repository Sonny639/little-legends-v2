"use client"

import { useState } from "react"
import Link from "next/link"
import { Camera, Download, Eye, Loader2, Mail, PackageCheck, Truck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type CheckoutProduct = "digital" | "hardback" | "upgrade"
type FulfilmentStatus = "new" | "in_progress" | "ready" | "sent"
type PaymentStatus = "payment_pending" | "paid_demo" | "paid"

type PrintQueueOrder = {
  id: string
  createdAt: string
  product: CheckoutProduct
  email: string
  heroName: string
  heroType: string
  storyTitle: string
  photoCount?: number
  status: PaymentStatus
  fulfilmentStatus?: FulfilmentStatus
  fulfilmentUpdatedAt?: string
  postage?: {
    fullName: string
    addressLine1: string
    addressLine2: string
    city: string
    postcode: string
    country: string
  }
}

const fulfilmentOptions: { value: FulfilmentStatus; label: string; className: string }[] = [
  { value: "new", label: "New", className: "bg-sky-100 text-sky-800" },
  { value: "in_progress", label: "In progress", className: "bg-amber-100 text-amber-800" },
  { value: "ready", label: "Ready", className: "bg-purple-100 text-purple-800" },
  { value: "sent", label: "Sent", className: "bg-emerald-100 text-emerald-800" },
]

const productLabel: Record<CheckoutProduct, string> = {
  digital: "Digital PDF",
  hardback: "Hardback Book",
  upgrade: "Hard Copy Upgrade",
}

const fulfilmentLabel = (status?: FulfilmentStatus) =>
  fulfilmentOptions.find((option) => option.value === (status || "new")) || fulfilmentOptions[0]

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))

const getProductionChecklist = (order: PrintQueueOrder) => [
  {
    label: order.status === "payment_pending" ? "Payment pending" : "Payment confirmed",
    done: order.status === "paid" || order.status === "paid_demo",
  },
  {
    label: "Artwork pack ready",
    done: true,
  },
  {
    label: (order.photoCount ?? 0) > 0 ? `${order.photoCount} reference photo${order.photoCount === 1 ? "" : "s"}` : "No reference photos",
    done: (order.photoCount ?? 0) > 0,
  },
  {
    label: "Print PDF ready",
    done: order.status === "paid" || order.status === "paid_demo",
  },
  {
    label: order.postage ? "Delivery address ready" : "Delivery address missing",
    done: Boolean(order.postage),
  },
]

export function PrintQueueClient({ initialOrders }: { initialOrders: PrintQueueOrder[] }) {
  const [orders, setOrders] = useState(initialOrders)
  const [updatingOrderId, setUpdatingOrderId] = useState("")
  const [message, setMessage] = useState("")

  const updateFulfilmentStatus = async (orderId: string, fulfilmentStatus: FulfilmentStatus) => {
    setUpdatingOrderId(orderId)
    setMessage("")

    try {
      const response = await fetch("/api/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId, fulfilmentStatus }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.error || "Could not update print status.")
      }

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
      setMessage(`Updated ${orderId} to ${fulfilmentLabel(fulfilmentStatus).label}.`)
    } catch {
      setMessage("Could not update the print order. Please refresh and try again.")
    } finally {
      setUpdatingOrderId("")
    }
  }

  return (
    <div className="space-y-4">
      {message ? (
        <Card className="border-4 border-amber-300 bg-amber-50 p-4 text-sm font-black leading-6 text-amber-900">
          {message}
        </Card>
      ) : null}

      {orders.map((order) => {
        const fulfilment = fulfilmentLabel(order.fulfilmentStatus)
        const isUpdating = updatingOrderId === order.id

        return (
          <Card key={order.id} className="border-4 border-sky-950 bg-[#fffdf5] p-5 shadow-[8px_8px_0_rgba(8,47,73,0.14)]">
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-start">
              <div>
                <div className="mb-2 flex flex-wrap gap-2">
                  <Badge className="bg-emerald-100 text-emerald-800">{order.status}</Badge>
                  <Badge className={fulfilment.className}>{fulfilment.label}</Badge>
                  <Badge className="bg-sky-100 text-sky-800">{productLabel[order.product]}</Badge>
                  {(order.photoCount ?? 0) > 0 ? (
                    <Badge className="bg-amber-100 text-amber-900">{order.photoCount} reference photo{order.photoCount === 1 ? "" : "s"}</Badge>
                  ) : (
                    <Badge className="bg-slate-100 text-slate-700">No photos</Badge>
                  )}
                </div>
                <h3 className="break-all text-xl font-black text-sky-950">{order.id}</h3>
                <p className="mt-1 text-sm font-bold text-slate-700">{order.heroName} the {order.heroType}</p>
                <p className="text-sm font-semibold text-slate-600">{order.storyTitle}</p>
                <p className="mt-2 flex items-center gap-2 break-all text-xs font-bold text-slate-500">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-sky-700" />
                  {order.email}
                </p>
                <p className="mt-2 text-xs font-black uppercase tracking-widest text-sky-700">{formatDate(order.createdAt)}</p>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  Status updated: {formatDate(order.fulfilmentUpdatedAt || order.createdAt)}
                </p>
              </div>

              <div className="rounded-xl border-2 border-sky-100 bg-white p-4 text-sm font-semibold leading-6 text-slate-700">
                <div className="mb-2 flex items-center gap-2 font-black text-sky-950">
                  <Truck className="h-4 w-4" />
                  Delivery
                </div>
                {order.postage ? (
                  <>
                    <p>{order.postage.fullName}</p>
                    <p>{order.postage.addressLine1}</p>
                    {order.postage.addressLine2 && <p>{order.postage.addressLine2}</p>}
                    <p>{order.postage.city}</p>
                    <p>{order.postage.postcode}</p>
                    <p>{order.postage.country}</p>
                  </>
                ) : (
                  <p>No postage details on this order.</p>
                )}
              </div>

              <div className="grid gap-2">
                <div className="rounded-xl border-2 border-sky-100 bg-white p-3 text-xs font-bold leading-5 text-slate-700">
                  <div className="mb-1 flex items-center gap-2 font-black text-sky-950">
                    <Camera className="h-4 w-4" />
                    Artwork reference
                  </div>
                  {(order.photoCount ?? 0) > 0
                    ? `${order.photoCount} customer reference photo${order.photoCount === 1 ? " is" : "s are"} attached for the final artwork pass.`
                    : "No reference photos were attached to this order."}
                </div>
                <Button asChild variant="outline" className="h-10 rounded-xl border-sky-200 bg-white px-4 font-black text-sky-700 hover:bg-sky-50">
                  <Link href={`/admin/orders?order=${encodeURIComponent(order.id)}`}>
                    <Eye className="h-4 w-4" />
                    Full order
                  </Link>
                </Button>
                <Button asChild className="h-10 rounded-xl bg-sky-500 px-4 font-black text-white hover:bg-sky-600">
                  <Link href={`/download/${order.id}`}>
                    <Download className="h-4 w-4" />
                    Print PDF
                  </Link>
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button asChild variant="outline" className="h-10 rounded-xl border-purple-100 bg-white px-3 text-xs font-black text-purple-700 hover:bg-purple-50">
                    <Link href={`/api/orders/artwork-pack?orderId=${encodeURIComponent(order.id)}`} target="_blank" rel="noreferrer">
                      <Download className="h-4 w-4" />
                      JSON
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-10 rounded-xl border-purple-100 bg-white px-3 text-xs font-black text-purple-700 hover:bg-purple-50">
                    <Link href={`/api/orders/artwork-pack?orderId=${encodeURIComponent(order.id)}&format=csv`}>
                      <Download className="h-4 w-4" />
                      CSV
                    </Link>
                  </Button>
                </div>
                <div className="rounded-xl border-2 border-sky-100 bg-white p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase text-slate-700">
                    <PackageCheck className="h-4 w-4 text-sky-700" />
                    Production checklist
                  </div>
                  <div className="grid gap-1.5">
                    {getProductionChecklist(order).map((item) => (
                      <div key={item.label} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-2.5 py-2 text-xs font-black">
                        <span className="text-slate-700">{item.label}</span>
                        <span className={item.done ? "text-emerald-700" : "text-amber-700"}>{item.done ? "Ready" : "Check"}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border-2 border-sky-100 bg-white p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase text-slate-700">
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin text-sky-700" /> : <PackageCheck className="h-4 w-4 text-sky-700" />}
                    Quick status
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {fulfilmentOptions.map((option) => {
                      const isSelected = (order.fulfilmentStatus || "new") === option.value

                      return (
                        <Button
                          key={`${order.id}-${option.value}`}
                          type="button"
                          onClick={() => updateFulfilmentStatus(order.id, option.value)}
                          disabled={isUpdating}
                          variant={isSelected ? "default" : "outline"}
                          className={`h-9 rounded-xl px-3 text-xs font-black ${
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
              </div>
            </div>
          </Card>
        )
      })}

      {orders.length === 0 && (
        <Card className="border-4 border-sky-950 bg-white p-8 text-center shadow-[8px_8px_0_rgba(8,47,73,0.14)]">
          <h3 className="text-2xl font-black text-sky-950">No print orders waiting</h3>
          <p className="mt-2 text-sm font-bold text-slate-700">Hardback and upgrade orders will appear here after payment.</p>
        </Card>
      )}
    </div>
  )
}
