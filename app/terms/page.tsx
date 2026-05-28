import Link from "next/link"
import { ArrowLeft, BookOpen, Camera, CreditCard, Download, Mail, PackageCheck, Sparkles, Truck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const termSections = [
  {
    title: "Who Can Order",
    icon: BookOpen,
    text: "Little Legends Story is intended for parents, guardians, and gift buyers. If a child is featured in a story or uploaded photo, you confirm you have permission to use their details and image.",
  },
  {
    title: "Personalised Stories",
    icon: Sparkles,
    text: "Stories are created from the names, character choices, story decisions, and reference photos provided during the order journey. Please check names, email addresses, and postage details carefully before checkout.",
  },
  {
    title: "Photos And Likeness",
    icon: Camera,
    text: "Personalised artwork is storybook styled. We aim for a warm, recognisable result, but exact facial features, hair, clothing, pose, skin tone, and other details may vary.",
  },
  {
    title: "Digital Downloads",
    icon: Download,
    text: "Digital orders are available after payment is confirmed. The download link is for personal family use and should not be resold, copied into another product, or used commercially.",
  },
  {
    title: "Hardback Books",
    icon: Truck,
    text: "Printed books are produced through a print partner and posted to the delivery address supplied at checkout. Delivery timings are estimates and may vary during busy periods.",
  },
  {
    title: "Payments",
    icon: CreditCard,
    text: "Checkout is handled securely by Stripe. Prices are shown before payment, and promo codes are applied through Stripe Checkout when available.",
  },
  {
    title: "Problems With An Order",
    icon: Mail,
    text: "If something arrives damaged, is missing, or looks wrong, contact us with your order reference and photos where helpful. We will review it and work with you on the next step.",
  },
  {
    title: "Custom Products",
    icon: PackageCheck,
    text: "Because each story is personalised, changes or cancellations may not be possible once artwork, printing, or fulfilment has started. Contact us quickly if you spot a mistake.",
  },
]

export default function TermsPage() {
  return (
    <main className="storybook-app-bg min-h-screen px-4 py-4 sm:py-6">
      <div className="mx-auto max-w-5xl">
        <Card className="storybook-panel p-4 sm:p-6">
          <Button asChild variant="outline" className="mb-5 h-9 rounded-xl border-sky-200 bg-white px-4 font-black text-sky-700">
            <Link href="/create">
              <ArrowLeft className="h-4 w-4" />
              Back to app
            </Link>
          </Button>

          <div className="mb-6 flex items-start gap-3 sm:items-center">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-4 border-sky-950 bg-amber-50 text-amber-700">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-sky-700">Little Legends Story</p>
              <h1 className="text-3xl font-black leading-tight text-sky-950 sm:text-4xl">Terms</h1>
              <p className="mt-1 text-sm font-bold text-slate-600">Last updated: 28 May 2026</p>
            </div>
          </div>

          <div className="space-y-5 text-sm font-semibold leading-6 text-slate-700">
            <section className="rounded-3xl border-2 border-amber-100 bg-white/80 p-4 sm:p-5">
              <h2 className="text-xl font-black text-sky-950">In Plain English</h2>
              <p className="mt-2 text-base leading-7">
                Little Legends Story creates personalised children&apos;s storybooks as digital downloads and optional printed hardbacks. These terms explain what to expect when you use the app, upload photos, buy a story, or contact us for support.
              </p>
              <p className="mt-2 text-base leading-7">
                We want the experience to feel magical, but also clear: personalised artwork is creative and stylised, printed books depend on production partners, and support works best when you contact us quickly with your order reference.
              </p>
            </section>

            <div className="grid gap-4 md:grid-cols-2">
              {termSections.map(({ title, icon: Icon, text }) => (
                <section key={title} className="rounded-3xl bg-white/75 p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-sky-100 text-sky-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-sky-950">{title}</h2>
                      <p className="mt-1">{text}</p>
                    </div>
                  </div>
                </section>
              ))}
            </div>

            <section className="rounded-3xl border-2 border-sky-100 bg-sky-50/80 p-4 sm:p-5">
              <h2 className="text-xl font-black text-sky-950">Need Help?</h2>
              <p className="mt-2">
                For order questions, corrections, download help, or print concerns, email <a href="mailto:hello@littlelegendsstory.com" className="font-black text-sky-700 underline-offset-4 hover:underline">hello@littlelegendsstory.com</a>. Include your order reference so we can find the right story quickly.
              </p>
            </section>
          </div>
        </Card>
      </div>
    </main>
  )
}
