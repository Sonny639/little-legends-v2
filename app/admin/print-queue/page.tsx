import Link from "next/link"
import { Download, PackageCheck, Truck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { readOrders } from "@/lib/orders"
import { AdminShell } from "../admin-shell"

export const dynamic = "force-dynamic"

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))

export default async function AdminPrintQueuePage() {
  const ordersResult = await readOrders()
    .then((orders) => ({ orders, issue: "" }))
    .catch((error: unknown) => ({
      orders: [],
      issue: error instanceof Error ? error.message : "Unknown database error",
    }))
  const orders = ordersResult.orders
  const printOrders = orders.filter((order) => (order.status === "paid" || order.status === "paid_demo") && order.product !== "digital")

  return (
    <AdminShell>
      {ordersResult.issue && (
        <Card className="border-4 border-amber-300 bg-amber-50 p-4 text-sm font-black leading-6 text-amber-900">
          Print queue could not load orders. Check the production database tables/env vars. {ordersResult.issue}
        </Card>
      )}

      <Card className="border-4 border-sky-950 bg-white p-5 shadow-[8px_8px_0_rgba(8,47,73,0.14)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge className="mb-2 bg-amber-300 px-3 py-1 text-sky-950">Printer workflow</Badge>
            <h2 className="text-3xl font-black text-sky-950">Print queue</h2>
            <p className="mt-1 text-sm font-bold text-slate-700">Paid hardback and upgrade orders that need printing, packing, or sending.</p>
          </div>
          <Button asChild variant="outline" className="h-11 rounded-xl border-sky-200 bg-white px-5 font-black text-sky-700">
            <Link href="/admin/orders">Manage statuses</Link>
          </Button>
        </div>
      </Card>

      <div className="grid gap-4">
        {printOrders.map((order) => (
          <Card key={order.id} className="border-4 border-sky-950 bg-[#fffdf5] p-5 shadow-[8px_8px_0_rgba(8,47,73,0.14)]">
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-start">
              <div>
                <div className="mb-2 flex flex-wrap gap-2">
                  <Badge className="bg-emerald-100 text-emerald-800">{order.status}</Badge>
                  <Badge className="bg-amber-100 text-amber-800">{order.fulfilmentStatus || "new"}</Badge>
                  <Badge className="bg-sky-100 text-sky-800">{order.product}</Badge>
                </div>
                <h3 className="break-all text-xl font-black text-sky-950">{order.id}</h3>
                <p className="mt-1 text-sm font-bold text-slate-700">{order.heroName} the {order.heroType}</p>
                <p className="text-sm font-semibold text-slate-600">{order.storyTitle}</p>
                <p className="mt-2 text-xs font-black uppercase tracking-widest text-sky-700">{formatDate(order.createdAt)}</p>
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
                <Button asChild className="h-10 rounded-xl bg-sky-500 px-4 font-black text-white hover:bg-sky-600">
                  <Link href={`/download/${order.id}`}>
                    <Download className="h-4 w-4" />
                    Print PDF
                  </Link>
                </Button>
                <div className="inline-flex items-center gap-2 rounded-xl border-2 border-sky-100 bg-white px-3 py-2 text-xs font-black text-slate-700">
                  <PackageCheck className="h-4 w-4 text-sky-700" />
                  Update status in Orders
                </div>
              </div>
            </div>
          </Card>
        ))}
        {printOrders.length === 0 && (
          <Card className="border-4 border-sky-950 bg-white p-8 text-center shadow-[8px_8px_0_rgba(8,47,73,0.14)]">
            <h3 className="text-2xl font-black text-sky-950">No print orders waiting</h3>
            <p className="mt-2 text-sm font-bold text-slate-700">Hardback and upgrade orders will appear here after payment.</p>
          </Card>
        )}
      </div>
    </AdminShell>
  )
}
