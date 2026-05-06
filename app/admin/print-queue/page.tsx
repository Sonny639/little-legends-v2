import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { readOrders } from "@/lib/orders"
import { AdminShell } from "../admin-shell"
import { PrintQueueClient } from "./print-queue-client"

export const dynamic = "force-dynamic"

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

      <PrintQueueClient initialOrders={printOrders} />
    </AdminShell>
  )
}
