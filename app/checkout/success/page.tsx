import Link from "next/link"
import { CheckCircle2, ClipboardList, Download } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { sendOrderConfirmationEmail } from "@/lib/email"
import { readOrders, updateOrderPaymentStatus } from "@/lib/orders"
import { stripe } from "@/lib/stripe"

type CheckoutSuccessPageProps = {
  searchParams: Promise<{
    orderId?: string
    session_id?: string
  }>
}

export default async function CheckoutSuccessPage({ searchParams }: CheckoutSuccessPageProps) {
  const { orderId, session_id: sessionId } = await searchParams
  let order: Awaited<ReturnType<typeof updateOrderPaymentStatus>> = null
  let orderIssue = ""

  if (orderId && !stripe) {
    try {
      order = await updateOrderPaymentStatus(orderId, "paid_demo")
    } catch (error) {
      orderIssue = error instanceof Error ? error.message : "Payment confirmation is temporarily unavailable."
    }
  }

  if (orderId && sessionId && stripe) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      const sessionOrderId = session.metadata?.orderId || session.client_reference_id

      if (sessionOrderId === orderId && session.payment_status === "paid") {
        order = await updateOrderPaymentStatus(orderId, "paid")
      }
    } catch (error) {
      orderIssue = error instanceof Error ? error.message : "Payment confirmation is temporarily unavailable."
      console.error("Failed to verify Stripe checkout session:", error)
    }
  }

  if (order && !order.emailSentAt) {
    try {
      await sendOrderConfirmationEmail(order)
    } catch (error) {
      console.error("Failed to send/log order confirmation:", error)
    }
  }
  const orders = order
    ? []
    : await readOrders().catch((error: unknown) => {
        orderIssue = error instanceof Error ? error.message : "Order lookup is temporarily unavailable."
        return []
      })
  const fallbackOrder = orderId ? orders.find((savedOrder) => savedOrder.id === orderId) : null
  const visibleOrder = order || fallbackOrder || null
  const isPaid = visibleOrder?.status === "paid" || visibleOrder?.status === "paid_demo"

  return (
    <main className="storybook-app-bg min-h-screen px-4 py-6 sm:py-8">
      <div className="mx-auto max-w-3xl">
        <Card className="overflow-hidden border-4 border-sky-950 bg-white shadow-[12px_12px_0_rgba(8,47,73,0.18)]">
          <div className="bg-[linear-gradient(135deg,#dcfce7_0%,#dbeafe_58%,#fef3c7_100%)] p-6">
            <div className="grid min-h-[260px] place-items-center rounded-2xl border-4 border-sky-950 bg-white/78 p-6 text-center shadow-[7px_7px_0_rgba(8,47,73,0.15)]">
              <div>
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border-4 border-sky-950 bg-emerald-100 text-emerald-600 shadow-[5px_5px_0_rgba(8,47,73,0.14)]">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <Badge className={`mt-5 px-3 py-1 ${isPaid ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                  {isPaid ? "Payment confirmed" : "Payment pending"}
                </Badge>
                <h1 className="mt-3 text-3xl font-black uppercase leading-tight text-sky-950 sm:text-5xl">
                  {isPaid ? "Payment confirmed" : "Waiting for confirmation"}
                </h1>
                <p className="mx-auto mt-3 max-w-lg text-base font-bold leading-7 text-slate-700">
                  {isPaid
                    ? "Your personalised story is unlocked. You can download it now, and we have logged the order for any print follow-up."
                    : "We are waiting for payment confirmation. This page will show the download once the order is marked as paid."}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 bg-[#fffdf5] p-6">
            {orderIssue && (
              <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900">
                Payment returned successfully, but we could not reload the saved order details just now. Please check again shortly.
              </div>
            )}

            {visibleOrder ? (
              <div className="rounded-xl border-2 border-sky-100 bg-white p-4">
                <div className="text-xs font-black uppercase tracking-widest text-sky-700">Order reference</div>
                <div className="mt-1 break-all text-xl font-black text-sky-950">{visibleOrder.id}</div>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                  {visibleOrder.heroName} the {visibleOrder.heroType} - {visibleOrder.storyTitle}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900">
                No matching order was found for this checkout session.
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              <Button asChild className="h-11 rounded-xl bg-sky-500 px-5 font-black text-white hover:bg-sky-600">
                <Link href="/create">
                  <CheckCircle2 className="h-4 w-4" />
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
              {visibleOrder && isPaid && (
                <Button asChild className="h-11 rounded-xl bg-emerald-500 px-5 font-black text-white hover:bg-emerald-600">
                  <Link href={`/download/${visibleOrder.id}`}>
                    <Download className="h-4 w-4" />
                    Download
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </main>
  )
}
