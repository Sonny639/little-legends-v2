import Link from "next/link"
import { BookOpen, Truck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { checkoutProducts } from "@/lib/checkout"
import { hasValidOrderAccess } from "@/lib/order-access"
import { readOrders } from "@/lib/orders"
import { UpgradeCheckoutForm } from "./upgrade-form"

type UpgradePageProps = {
  params: Promise<{
    orderId: string
  }>
  searchParams: Promise<{
    access?: string
  }>
}

const money = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" })

export default async function UpgradePage({ params, searchParams }: UpgradePageProps) {
  const { orderId } = await params
  const { access } = await searchParams
  const orders = await readOrders().catch(() => [])
  const order = orders.find((candidate) => candidate.id === orderId)
  const hasAccess = Boolean(order && hasValidOrderAccess(order.id, access))
  const isPaidDigitalOrder =
    hasAccess && order?.product === "digital" && (order.status === "paid" || order.status === "paid_demo")

  return (
    <main className="storybook-app-bg min-h-screen overflow-x-hidden px-4 py-6 sm:py-8">
      <div className="mx-auto max-w-4xl space-y-5">
        <Card className="overflow-hidden border-4 border-sky-950 bg-white shadow-[12px_12px_0_rgba(8,47,73,0.18)]">
          <div className="bg-[linear-gradient(135deg,#fee2e2_0%,#fef3c7_48%,#dbeafe_100%)] p-4 sm:p-6">
            <div className="grid min-h-[220px] place-items-center rounded-2xl border-4 border-sky-950 bg-white/78 p-4 text-center shadow-[7px_7px_0_rgba(8,47,73,0.15)] sm:min-h-[250px] sm:p-6">
              <div>
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border-4 border-sky-950 bg-rose-100 text-rose-600 shadow-[5px_5px_0_rgba(8,47,73,0.14)] sm:h-20 sm:w-20">
                  <Truck className="h-8 w-8 sm:h-10 sm:w-10" />
                </div>
                <Badge className="mt-5 bg-amber-300 px-3 py-1 text-sky-950">Digital buyer upgrade</Badge>
                <h1 className="mt-3 text-2xl font-black uppercase leading-tight text-sky-950 sm:text-5xl">Add the hardback</h1>
                <p className="mx-auto mt-3 max-w-xl text-sm font-bold leading-6 text-slate-700 sm:text-base sm:leading-7">
                  Your digital purchase still counts. Add the printed keepsake for {money.format(checkoutProducts.upgrade.price)}. UK delivery is free, with international delivery added by country.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {isPaidDigitalOrder && order ? (
          <>
            <Card className="border-4 border-sky-950 bg-white p-4 shadow-[8px_8px_0_rgba(8,47,73,0.14)] sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-sky-700">Original digital order</p>
                  <h2 className="mt-1 text-xl font-black text-sky-950">{order.storyTitle}</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {order.heroName} the {order.heroType}
                  </p>
                </div>
                <Button asChild variant="outline" className="h-11 rounded-xl border-sky-200 bg-white font-black text-sky-700">
                  <Link href={`/download/${order.id}?access=${encodeURIComponent(access || "")}`}>
                    <BookOpen className="h-4 w-4" />
                    Read digital story
                  </Link>
                </Button>
              </div>
            </Card>

            <UpgradeCheckoutForm
              sourceOrderId={order.id}
              accessToken={access || ""}
              upgradePriceLabel={money.format(checkoutProducts.upgrade.price)}
            />
          </>
        ) : (
          <Card className="border-4 border-sky-950 bg-[#fffdf5] p-5 shadow-[10px_10px_0_rgba(8,47,73,0.16)]">
            <h2 className="text-2xl font-black text-sky-950">Upgrade unavailable</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
              This secure upgrade link only works for paid digital orders. If you think this is a mistake, please contact support with your order reference.
            </p>
            <Button asChild className="mt-4 h-11 rounded-xl bg-sky-500 px-5 font-black text-white hover:bg-sky-600">
              <Link href="/contact">Contact support</Link>
            </Button>
          </Card>
        )}
      </div>
    </main>
  )
}
