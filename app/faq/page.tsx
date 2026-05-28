import Link from "next/link"
import { ArrowLeft, BookOpen, Camera, Clock, CreditCard, HelpCircle, PackageCheck, ShieldCheck, Sparkles, Truck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const faqs = [
  {
    question: "Why does the hardback book cost more than a normal book?",
    icon: PackageCheck,
    answer:
      "Each hardback is a personalised keepsake, not a mass-printed book. The price includes custom story creation, personalised artwork, digital access, premium colour printing, hardback case wrap production, and UK delivery.",
  },
  {
    question: "How long does the hardback take to arrive?",
    icon: Truck,
    answer:
      "Hardbacks are printed on demand after your order is placed. UK delivery is usually estimated around 5-10 working days, but timing can vary during busy periods or for international delivery.",
  },
  {
    question: "How do I get the best face match for my child?",
    icon: Camera,
    answer:
      "Upload a clear, front-facing photo with bright natural light. If possible, crop the first image close to your child's face. Avoid sunglasses, heavy filters, side profiles, hats covering the face, or group photos.",
  },
  {
    question: "Will the artwork look exactly like my child?",
    icon: Sparkles,
    answer:
      "The artwork is storybook styled, so it is designed to feel warm, recognisable, and magical rather than like an exact photograph. Features such as hair, skin tone, clothing, pose, and expression may vary.",
  },
  {
    question: "What age range is Little Legends best for?",
    icon: BookOpen,
    answer:
      "The stories are designed mainly for young children, roughly ages 3-8, with parent-led bedtime reading in mind. Older children may still enjoy seeing themselves as the hero in a personalised adventure.",
  },
  {
    question: "When will more story worlds be available?",
    icon: Clock,
    answer:
      "More hero worlds are planned after launch. The first stories are being kept focused so we can keep the quality high, test print results properly, and improve the experience before adding more adventures.",
  },
  {
    question: "Is my child's photo private?",
    icon: ShieldCheck,
    answer:
      "Photos are used as private reference images for your personalised artwork and order support. We do not publish customer photos, sell personal information, or use your child's photo in adverts without asking first.",
  },
  {
    question: "Do I get a digital copy with the hardback?",
    icon: CreditCard,
    answer:
      "Yes. Hardback orders include digital access too, so you can read the story online and save the PDF while the printed keepsake is being prepared.",
  },
]

export default function FaqPage() {
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
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-4 border-sky-950 bg-rose-50 text-rose-600">
              <HelpCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-sky-700">Little Legends Story</p>
              <h1 className="text-3xl font-black leading-tight text-sky-950 sm:text-4xl">Questions And Answers</h1>
              <p className="mt-1 text-sm font-bold text-slate-600">Helpful answers before you order.</p>
            </div>
          </div>

          <section className="rounded-3xl border-2 border-amber-100 bg-white/80 p-4 sm:p-5">
            <h2 className="text-xl font-black text-sky-950">Quick Reassurance</h2>
            <p className="mt-2 text-base font-semibold leading-7 text-slate-700">
              Little Legends Story is designed to feel special, safe, and easy for parents. These answers cover the common things families usually want to know before creating a personalised book.
            </p>
          </section>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {faqs.map(({ question, answer, icon: Icon }) => (
              <section key={question} className="rounded-3xl bg-white/75 p-4 text-left shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-sky-100 text-sky-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black leading-6 text-sky-950">{question}</h2>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{answer}</p>
                  </div>
                </div>
              </section>
            ))}
          </div>

          <section className="mt-5 rounded-3xl border-2 border-sky-100 bg-sky-50/80 p-4 text-sm font-semibold leading-6 text-slate-700 sm:p-5">
            <h2 className="text-xl font-black text-sky-950">Still Unsure?</h2>
            <p className="mt-2">
              Email <a href="mailto:hello@littlelegendsstory.com" className="font-black text-sky-700 underline-offset-4 hover:underline">hello@littlelegendsstory.com</a> and we will help before you order.
            </p>
          </section>
        </Card>
      </div>
    </main>
  )
}
