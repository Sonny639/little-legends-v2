import Link from "next/link"
import { ArrowRight, BookOpen, Inbox, Mail, PackageCheck, PoundSterling } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { readEmailLog } from "@/lib/email"
import { readEnquiries } from "@/lib/enquiries"
import { readOrders } from "@/lib/orders"
import { AdminShell } from "./admin-shell"

export const dynamic = "force-dynamic"

const money = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" })

const getDataIssueMessage = (label: string, reason: unknown) => {
  const detail = reason instanceof Error ? reason.message : "Unknown error"

  return `${label} could not be loaded. Check the production database tables/env vars. ${detail}`
}

export default async function AdminDashboardPage() {
  const [ordersResult, enquiriesResult, emailsResult] = await Promise.allSettled([readOrders(), readEnquiries(), readEmailLog()])
  const orders = ordersResult.status === "fulfilled" ? ordersResult.value : []
  const enquiries = enquiriesResult.status === "fulfilled" ? enquiriesResult.value : []
  const emails = emailsResult.status === "fulfilled" ? emailsResult.value : []
  const dataIssues = [
    ordersResult.status === "rejected" ? getDataIssueMessage("Orders", ordersResult.reason) : null,
    enquiriesResult.status === "rejected" ? getDataIssueMessage("Enquiries", enquiriesResult.reason) : null,
    emailsResult.status === "rejected" ? getDataIssueMessage("Email log", emailsResult.reason) : null,
  ].filter(Boolean)

  const paidOrders = orders.filter((order) => order.status === "paid" || order.status === "paid_demo")
  const printOrders = paidOrders.filter((order) => order.product !== "digital")
  const openPrintOrders = printOrders.filter((order) => (order.fulfilmentStatus || "new") !== "sent")
  const newEnquiries = enquiries.filter((enquiry) => enquiry.status === "new")
  const revenue = paidOrders.reduce((sum, order) => sum + order.total, 0)

  const stats = [
    { label: "Paid orders", value: paidOrders.length, icon: BookOpen, tone: "bg-sky-50 text-sky-800" },
    { label: "Revenue", value: money.format(revenue), icon: PoundSterling, tone: "bg-emerald-50 text-emerald-800" },
    { label: "Print queue", value: openPrintOrders.length, icon: PackageCheck, tone: "bg-amber-50 text-amber-800" },
    { label: "New enquiries", value: newEnquiries.length, icon: Inbox, tone: "bg-rose-50 text-rose-800" },
  ]

  return (
    <AdminShell>
      {dataIssues.length > 0 && (
        <Card className="border-4 border-amber-300 bg-amber-50 p-4 text-sm font-black leading-6 text-amber-900">
          <p>Admin data is not fully connected yet.</p>
          {dataIssues.map((issue) => (
            <p key={issue}>{issue}</p>
          ))}
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon

          return (
            <Card key={stat.label} className={`border-4 border-sky-950 p-5 shadow-[6px_6px_0_rgba(8,47,73,0.12)] ${stat.tone}`}>
              <Icon className="h-6 w-6" />
              <p className="mt-3 text-sm font-black uppercase tracking-widest">{stat.label}</p>
              <p className="mt-1 text-3xl font-black">{stat.value}</p>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-4 border-sky-950 bg-white p-5 shadow-[8px_8px_0_rgba(8,47,73,0.14)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-black text-sky-950">Recent orders</h2>
            <Link href="/admin/orders" className="inline-flex items-center gap-2 text-sm font-black text-sky-700">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="rounded-xl border-2 border-sky-100 bg-[#fffdf5] p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={order.status === "payment_pending" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}>{order.status}</Badge>
                  <Badge className="bg-sky-100 text-sky-800">{order.product}</Badge>
                </div>
                <p className="mt-2 break-all text-sm font-black text-sky-950">{order.id}</p>
                <p className="text-sm font-semibold text-slate-700">{order.heroName} the {order.heroType}</p>
              </div>
            ))}
            {orders.length === 0 && <p className="text-sm font-bold text-slate-600">No orders yet.</p>}
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="border-4 border-sky-950 bg-white p-5 shadow-[8px_8px_0_rgba(8,47,73,0.14)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-black text-sky-950">Enquiries</h2>
              <Link href="/admin/enquiries" className="inline-flex items-center gap-2 text-sm font-black text-sky-700">
                Open <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <p className="text-sm font-bold text-slate-700">{newEnquiries.length} new, {enquiries.length} total.</p>
          </Card>

          <Card className="border-4 border-sky-950 bg-white p-5 shadow-[8px_8px_0_rgba(8,47,73,0.14)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-black text-sky-950">Email log</h2>
              <Link href="/admin/email-log" className="inline-flex items-center gap-2 text-sm font-black text-sky-700">
                View <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
              <Mail className="h-5 w-5 text-sky-700" />
              {emails.length} confirmation emails logged.
            </div>
          </Card>
        </div>
      </div>
    </AdminShell>
  )
}
