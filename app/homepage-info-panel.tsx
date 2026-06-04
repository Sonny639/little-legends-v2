"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowRight, BookOpen, CircleHelp, Gift, Heart, Images, ShieldCheck, Sparkles, Tags, TicketPercent, X } from "lucide-react"

import { checkoutProducts } from "@/lib/checkout"
import { launchOffer } from "@/lib/launch-offer"

type InfoTopicId = "parents" | "included" | "pricing" | "privacy" | "faq" | "share"

type InfoTopic = {
  id: InfoTopicId
  label: string
  title: string
  eyebrow: string
  summary: string
  icon: typeof Heart
  bullets: string[]
  cta?: {
    label: string
    href: string
  }
}

const money = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" })

const productOptionSummaries = [
  {
    title: "Digital Storybook",
    price: money.format(checkoutProducts.digital.price),
    text: "Fast access after order confirmation.",
  },
  {
    title: "Hardback Keepsake",
    price: money.format(checkoutProducts.hardback.price),
    text: "Printed on demand. UK delivery usually estimated around 5-10 working days.",
  },
]

const infoTopics: InfoTopic[] = [
  {
    id: "parents",
    label: "Why parents love it",
    title: "A bedtime story that feels made for them",
    eyebrow: "Why parents love it",
    summary: "Little Legends is built around the moment a child sees themselves as the hero.",
    icon: Heart,
    bullets: [
      "Personalised around your child's name, hero style, and adventure choices.",
      "Designed as a keepsake gift, not just a quick disposable story.",
      "Made to feel magical for children and reassuringly simple for parents.",
    ],
  },
  {
    id: "included",
    label: "What's included",
    title: "What your order includes",
    eyebrow: "What's included",
    summary: "You can choose digital-only or the premium hardback keepsake.",
    icon: Gift,
    bullets: [
      "A personalised story adventure starring your child.",
      "Digital PDF access after payment is confirmed.",
      "Hardback orders include the digital version too.",
      "Optional child photos help guide the personalised artwork.",
    ],
  },
  {
    id: "pricing",
    label: "Pricing / options",
    title: "Simple product options",
    eyebrow: "Pricing",
    summary: "Start with digital, or choose the printed keepsake straight away.",
    icon: Tags,
    bullets: [
      `${checkoutProducts.digital.label}: ${money.format(checkoutProducts.digital.price)}. Fast access after order confirmation.`,
      `${checkoutProducts.hardback.label}: ${money.format(checkoutProducts.hardback.price)} including digital access. Printed on demand, with UK delivery usually estimated around 5-10 working days.`,
      `${checkoutProducts.upgrade.label}: ${money.format(checkoutProducts.upgrade.price)} if you buy digital first.`,
      "Stripe checkout is used for secure payment.",
    ],
  },
  {
    id: "privacy",
    label: "Photo privacy",
    title: "Your child's photos are handled carefully",
    eyebrow: "Privacy reassurance",
    summary: "Photos are used to prepare your personalised story experience and are not posted publicly by default.",
    icon: ShieldCheck,
    bullets: [
      "Photo upload is optional.",
      "Photos are used for personalisation and order preparation.",
      "Gallery photos are only published when you clearly give permission.",
      "Payments are handled securely by Stripe.",
    ],
    cta: {
      label: "Read privacy notes",
      href: "/privacy",
    },
  },
  {
    id: "faq",
    label: "FAQ preview",
    title: "Quick answers before you order",
    eyebrow: "FAQ preview",
    summary: "The most common questions are answered before checkout.",
    icon: CircleHelp,
    bullets: [
      "Digital stories are available after payment is confirmed.",
      "Hardback orders include digital access.",
      "Hardbacks are premium personalised keepsakes, prepared for print after ordering.",
      "For order help, you can contact Little Legends directly.",
    ],
    cta: {
      label: "Open Q&A",
      href: "/faq",
    },
  },
  {
    id: "share",
    label: "Share your story",
    title: "Share a finished book moment",
    eyebrow: "Share your story",
    summary: "Families can send book photos or a short review for possible feature.",
    icon: Images,
    bullets: [
      "You can submit up to four photos and a short review.",
      "Nothing is published unless it is reviewed and approved first.",
      "You can also email photos and wording directly.",
    ],
    cta: {
      label: "Share your story",
      href: "/gallery",
    },
  },
]

const buttonBase =
  "group flex w-full items-center justify-between gap-3 rounded-2xl border border-white/12 bg-white/9 px-3 py-2.5 text-left text-sm font-black text-white shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-amber-200/50 hover:bg-white/16 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200/30"

const ProductOptionsMini = ({ compact = false }: { compact?: boolean }) => (
  <div className={`grid gap-2 ${compact ? "" : "sm:grid-cols-2"}`}>
    {productOptionSummaries.map((option) => (
      <div key={option.title} className="rounded-2xl border border-amber-200/25 bg-amber-50/10 px-3 py-2.5 text-left">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-black uppercase tracking-wide text-amber-100">{option.title}</p>
          <p className="shrink-0 text-xs font-black text-white">{option.price}</p>
        </div>
        <p className="mt-1 text-xs font-bold leading-5 text-white/82">{option.text}</p>
      </div>
    ))}
  </div>
)

const LaunchOfferMini = () => (
  <div className="rounded-2xl border border-amber-200/35 bg-amber-100/12 px-3 py-2.5 text-left">
    <div className="flex items-center gap-2">
      <TicketPercent className="h-4 w-4 text-amber-200" />
      <p className="text-xs font-black uppercase tracking-widest text-amber-100">{launchOffer.headline}</p>
    </div>
    <p className="mt-1 text-xs font-bold leading-5 text-white/84">
      Use code <span className="font-black text-white">{launchOffer.code}</span> for {launchOffer.discount}. Limited to the {launchOffer.limit}.
    </p>
  </div>
)

export function HomepageInfoPanel() {
  const [activeTopicId, setActiveTopicId] = useState<InfoTopicId | null>(null)
  const activeTopic = infoTopics.find((topic) => topic.id === activeTopicId) || null

  return (
    <>
      <section className="bg-[#070820] px-4 pb-6 pt-3 sm:px-6 lg:hidden">
        <div className="mx-auto max-w-4xl rounded-[1.5rem] border border-white/12 bg-white/7 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-amber-200">Need a little more detail?</p>
              <h2 className="text-lg font-black text-white">Trust, pricing, privacy, and FAQs</h2>
            </div>
            <Sparkles className="h-5 w-5 shrink-0 text-amber-200" />
          </div>
          <div className="mb-3">
            <LaunchOfferMini />
          </div>
          <div className="mb-3">
            <ProductOptionsMini />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {infoTopics.map((topic) => {
              const Icon = topic.icon

              return (
                <button key={topic.id} type="button" onClick={() => setActiveTopicId(topic.id)} className={buttonBase}>
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-amber-200" />
                    {topic.label}
                  </span>
                  <ArrowRight className="h-4 w-4 text-amber-200 transition group-hover:translate-x-0.5" />
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <aside className="fixed right-4 top-1/2 z-20 hidden max-h-[calc(100svh-2rem)] w-56 -translate-y-1/2 overflow-y-auto rounded-[1.35rem] border border-white/12 bg-[#070820]/78 p-3 shadow-[0_18px_60px_rgba(0,0,0,0.34)] backdrop-blur-xl lg:block xl:right-6">
        <div className="mb-3 flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-amber-200 text-[#35165f]">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[0.62rem] font-black uppercase tracking-widest text-amber-200">Before you order</p>
            <h2 className="text-sm font-black text-white">Helpful details</h2>
          </div>
        </div>
        <div className="mb-3">
          <LaunchOfferMini />
        </div>
        <div className="mb-3">
          <ProductOptionsMini compact />
        </div>
        <div className="space-y-2">
          {infoTopics.map((topic) => {
            const Icon = topic.icon

            return (
              <button key={topic.id} type="button" onClick={() => setActiveTopicId(topic.id)} className={buttonBase}>
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-amber-200" />
                  {topic.label}
                </span>
                <ArrowRight className="h-4 w-4 text-amber-200 transition group-hover:translate-x-0.5" />
              </button>
            )
          })}
        </div>
      </aside>

      {activeTopic && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-sky-950/62 px-3 py-4 backdrop-blur-sm sm:items-center sm:px-4" role="dialog" aria-modal="true" aria-labelledby="homepage-info-title">
          <div className="w-full max-w-xl overflow-hidden rounded-[1.5rem] border-4 border-sky-950 bg-[#fffdf5] shadow-[10px_10px_0_rgba(8,47,73,0.22)]">
            <div className="flex items-start justify-between gap-4 border-b-2 border-sky-100 bg-white px-4 py-4 sm:px-5">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-sky-700">{activeTopic.eyebrow}</p>
                <h2 id="homepage-info-title" className="mt-1 text-2xl font-black leading-tight text-sky-950 sm:text-3xl">
                  {activeTopic.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveTopicId(null)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-sky-100 bg-white text-sky-800 transition hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200"
                aria-label="Close details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-4 py-5 sm:px-5">
              <p className="text-base font-semibold leading-7 text-slate-700">{activeTopic.summary}</p>
              <div className="grid gap-3">
                {activeTopic.bullets.map((bullet) => (
                  <div key={bullet} className="flex gap-3 rounded-2xl border-2 border-sky-100 bg-white p-3">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-500" />
                    <p className="text-sm font-bold leading-6 text-slate-700">{bullet}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Link
                  href="/create"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-sky-500 px-5 text-sm font-black text-white transition hover:from-fuchsia-600 hover:to-sky-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200"
                >
                  Create Your Child&apos;s Story
                </Link>
                {activeTopic.cta && (
                  <Link
                    href={activeTopic.cta.href}
                    className="inline-flex h-11 items-center justify-center rounded-full border-2 border-sky-100 bg-white px-5 text-sm font-black text-sky-700 transition hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200"
                  >
                    {activeTopic.cta.label}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
