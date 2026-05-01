import Link from "next/link"
import { ArrowLeft, BookOpen } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function TermsPage() {
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
            <div className="grid h-12 w-12 place-items-center rounded-2xl border-4 border-sky-950 bg-amber-50 text-amber-700">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-sky-700">Little Legends</p>
              <h1 className="text-3xl font-black leading-tight text-sky-950 sm:text-4xl">Terms</h1>
            </div>
          </div>

          <div className="space-y-4 text-sm font-semibold leading-6 text-slate-700">
            <p className="text-base leading-7">
              Little Legends creates personalised children's story previews, digital downloads, and optional printed keepsakes.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <section className="rounded-2xl bg-white/70 p-4">
                <h2 className="text-lg font-black text-sky-950">Personalisation</h2>
                <p className="mt-1">Story names, character choices, photos, and story decisions are provided by the parent or guardian using the app.</p>
              </section>

              <section className="rounded-2xl bg-white/70 p-4">
                <h2 className="text-lg font-black text-sky-950">Payments</h2>
                <p className="mt-1">Paid downloads unlock after payment is confirmed. Printed book orders require accurate postage details.</p>
              </section>

              <section className="rounded-2xl bg-white/70 p-4">
                <h2 className="text-lg font-black text-sky-950">Artwork</h2>
                <p className="mt-1">Personalised artwork is illustrative and storybook styled, designed to feel recognisable and magical.</p>
              </section>

              <section className="rounded-2xl bg-white/70 p-4">
                <h2 className="text-lg font-black text-sky-950">Support</h2>
                <p className="mt-1">If something looks wrong with an order, contact support with the order reference so it can be reviewed.</p>
              </section>
            </div>
          </div>
        </Card>
      </div>
    </main>
  )
}
