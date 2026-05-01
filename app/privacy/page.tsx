import Link from "next/link"
import { ArrowLeft, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function PrivacyPage() {
  return (
    <main className="storybook-app-bg min-h-screen px-4 py-4 sm:py-5">
      <div className="mx-auto max-w-4xl">
        <Card className="storybook-panel p-4 sm:p-5">
          <Button asChild variant="outline" className="mb-4 h-9 rounded-xl border-sky-200 bg-white px-4 font-black text-sky-700">
            <Link href="/create">
              <ArrowLeft className="h-4 w-4" />
              Back to app
            </Link>
          </Button>

          <div className="mb-4 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border-4 border-sky-950 bg-sky-50 text-sky-700">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-sky-700">Little Legends</p>
              <h1 className="text-3xl font-black leading-tight text-sky-950 sm:text-4xl">Privacy</h1>
            </div>
          </div>

          <div className="space-y-4 text-sm font-semibold leading-6 text-slate-700">
            <p className="text-base leading-7">
              Little Legends only asks for the details needed to create a personalised story, process an order, send a receipt, and deliver any printed book.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <section className="rounded-2xl bg-white/70 p-4">
                <h2 className="text-lg font-black text-sky-950">Photos</h2>
                <p className="mt-1">Uploaded photos are used as references for personalised character artwork. Parents should only upload photos they have permission to use.</p>
              </section>

              <section className="rounded-2xl bg-white/70 p-4">
                <h2 className="text-lg font-black text-sky-950">Orders</h2>
                <p className="mt-1">Order details may include an email address, story choices, product choice, and postage details for printed books.</p>
              </section>

              <section className="rounded-2xl bg-white/70 p-4">
                <h2 className="text-lg font-black text-sky-950">Admin Access</h2>
                <p className="mt-1">Order management pages are protected by the admin login when an admin password is configured.</p>
              </section>

              <section className="rounded-2xl bg-white/70 p-4">
                <h2 className="text-lg font-black text-sky-950">Contact</h2>
                <p className="mt-1">For questions about an order or stored details, use the contact form and include your order reference if you have one.</p>
              </section>
            </div>
          </div>
        </Card>
      </div>
    </main>
  )
}
