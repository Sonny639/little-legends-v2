import Link from "next/link"
import { ArrowLeft, ClipboardList, XCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { readOrders } from "@/lib/orders"

type CheckoutCancelPageProps = {
  searchParams: Promise<{
    orderId?: string
  }>
}

export default async function CheckoutCancelPage({ searchParams }: CheckoutCancelPageProps) {
  const { orderId } = await searchParams
  const orderLookup = orderId
    ? await readOrders()
        .then((orders) => ({ orders, issue: "" }))
        .catch((error: unknown) => ({
          orders: [],
          issue: error instanceof Error ? error.message : "Order lookup is temporarily unavailable.",
        }))
    : { orders: [], issue: "" }
  const orders = orderLookup.orders
  const order = orderId ? orders.find((savedOrder) => savedOrder.id === orderId) : null

  return (
    <main className="storybook-app-bg min-h-screen px-4 py-6 sm:py-8">
      <div className="mx-auto max-w-3xl">
        <Card className="overflow-hidden border-4 border-sky-950 bg-white shadow-[12px_12px_0_rgba(8,47,73,0.18)]">
          <div className="bg-[linear-gradient(135deg,#fee2e2_0%,#fef3c7_48%,#dbeafe_100%)] p-6">
            <div className="grid min-h-[260px] place-items-center rounded-2xl border-4 border-sky-950 bg-white/78 p-6 text-center shadow-[7px_7px_0_rgba(8,47,73,0.15)]">
              <div>
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border-4 border-sky-950 bg-rose-100 text-rose-600 shadow-[5px_5px_0_rgba(8,47,73,0.14)]">
                  <XCircle className="h-10 w-10" />
                </div>
                <Badge className="mt-5 bg-rose-100 px-3 py-1 text-rose-800">Payment cancelled</Badge>
                <h1 className="mt-3 text-3xl font-black uppercase leading-tight text-sky-950 sm:text-5xl">
                  Checkout was cancelled
                </h1>
                <p className="mx-auto mt-3 max-w-lg text-base font-bold leading-7 text-slate-700">
                  Nothing has been charged. Your story details are still saved, so you can return and try again when you are ready.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 bg-[#fffdf5] p-6">
            {orderLookup.issue && (
              <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900">
                Your payment was cancelled. We could not reload the saved order details just now, but nothing has been charged.
              </div>
            )}

            {order && (
              <div className="rounded-xl border-2 border-sky-100 bg-white p-4">
                <div className="text-xs font-black uppercase tracking-widest text-sky-700">Order reference</div>
                <div className="mt-1 break-all text-xl font-black text-sky-950">{order.id}</div>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                  {order.heroName} the {order.heroType} - {order.storyTitle}
                </p>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <Button asChild className="h-11 rounded-xl bg-sky-500 px-5 font-black text-white hover:bg-sky-600">
                <Link href="/create">
                  <ArrowLeft className="h-4 w-4" />
                  Back to app
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 rounded-xl border-sky-200 bg-white px-5 font-black text-sky-700"
              >
                <Link href="/admin/orders">
                  <ClipboardList className="h-4 w-4" />
                  Order status
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </main>
  )
}
