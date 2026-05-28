import Link from "next/link"
import { ArrowLeft, Camera, LockKeyhole, Mail, PackageCheck, ShieldCheck, Sparkles, UserCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const privacySections = [
  {
    title: "What We Collect",
    icon: UserCheck,
    text: "We collect the details needed to create and deliver your story: your email address, child or hero name, story choices, selected product, and postage details if you order a printed book.",
  },
  {
    title: "Photos",
    icon: Camera,
    text: "Uploaded photos are used as private reference images for personalised storybook artwork. Please only upload photos you are allowed to use, especially when the photo includes a child.",
  },
  {
    title: "AI Artwork",
    icon: Sparkles,
    text: "When you ask for personalised artwork, selected photos and story details may be sent to our artwork provider so the image can be created. We use them to produce your order, not to sell your child's photo.",
  },
  {
    title: "Payments And Printing",
    icon: PackageCheck,
    text: "Payments are handled by Stripe. Printed book details may be shared with our print and delivery partners so your hardback can be produced and posted.",
  },
  {
    title: "Emails",
    icon: Mail,
    text: "We use your email to send order confirmations, download links, support replies, and important updates about your order. We do not send unrelated marketing unless you choose to hear from us.",
  },
  {
    title: "Keeping Data Safe",
    icon: LockKeyhole,
    text: "Order information and photos are kept in protected systems and only used by the people and services needed to create, support, print, or deliver your order.",
  },
]

export default function PrivacyPage() {
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
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-4 border-sky-950 bg-sky-50 text-sky-700">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-sky-700">Little Legends Story</p>
              <h1 className="text-3xl font-black leading-tight text-sky-950 sm:text-4xl">Privacy</h1>
              <p className="mt-1 text-sm font-bold text-slate-600">Last updated: 28 May 2026</p>
            </div>
          </div>

          <div className="space-y-5 text-sm font-semibold leading-6 text-slate-700">
            <section className="rounded-3xl border-2 border-sky-100 bg-white/80 p-4 sm:p-5">
              <h2 className="text-xl font-black text-sky-950">Our Promise</h2>
              <p className="mt-2 text-base leading-7">
                Little Legends Story is built for parents and guardians. We only ask for information that helps us create the story, process payment, send the download, support the order, and deliver a printed book when requested.
              </p>
              <p className="mt-2 text-base leading-7">
                We do not publish customer photos, sell personal information, or use your child&apos;s photo in adverts without asking you first.
              </p>
            </section>

            <div className="grid gap-4 md:grid-cols-2">
              {privacySections.map(({ title, icon: Icon, text }) => (
                <section key={title} className="rounded-3xl bg-white/75 p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-700">
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

            <section className="rounded-3xl border-2 border-emerald-100 bg-emerald-50/80 p-4 sm:p-5">
              <h2 className="text-xl font-black text-emerald-950">Your Choices</h2>
              <p className="mt-2">
                You can contact us to ask what we hold about your order, correct details, request deletion where possible, or ask a question about how photos are used. Some order records may need to be kept for payment, tax, fraud prevention, or customer service reasons.
              </p>
              <p className="mt-2">
                Email us at <a href="mailto:hello@littlelegendsstory.com" className="font-black text-sky-700 underline-offset-4 hover:underline">hello@littlelegendsstory.com</a> and include your order reference if you have one.
              </p>
            </section>
          </div>
        </Card>
      </div>
    </main>
  )
}
