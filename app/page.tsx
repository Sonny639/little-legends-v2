import Link from "next/link"
import { ShieldCheck, Sparkles, TicketPercent } from "lucide-react"

import { SocialFollowStrip } from "@/components/social-follow-strip"
import { HomepageInfoPanel } from "@/app/homepage-info-panel"
import { launchOffer } from "@/lib/launch-offer"

export default function HomePage() {
  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#070820]">
      <SocialFollowStrip tone="dark" />
      <h1 className="sr-only">Little Legends Story</h1>
      <p className="sr-only">
        Your child becomes the hero in personalised magical bedtime storybooks.
      </p>

      <section className="relative w-full overflow-hidden sm:hidden">
        <img
          src="/inspiration/mobile-homepage.png"
          alt="Little Legends Story: your child becomes the hero in personalised magical bedtime storybooks"
          className="block h-auto w-full select-none max-[380px]:h-[100svh] max-[380px]:object-fill"
          draggable={false}
        />

        <div className="absolute left-[7.5%] top-[77.4%] z-10 w-[85%] max-[380px]:top-[77%]">
          <div aria-hidden className="absolute inset-x-[8%] -inset-y-[18%] rounded-full bg-amber-200/20 blur-2xl" />
          <Link
            href="/create"
            className="hero-cta relative flex min-h-[4.45rem] items-center justify-center gap-3 rounded-full bg-[linear-gradient(135deg,#fff5cb_0%,#ffe08a_48%,#ffd56b_100%)] px-5 text-[clamp(1.15rem,5vw,1.5rem)] font-black tracking-normal text-[#35165f] transition hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200/45 max-[380px]:min-h-[4rem]"
          >
            <Sparkles className="h-[1.08em] w-[1.08em]" />
            Create Your Child's Story
          </Link>
          <Link
            href="/create?how=1"
            className="relative mx-auto mt-2 flex h-11 w-[78%] items-center justify-center rounded-full border border-white/70 bg-white/86 px-4 text-sm font-black text-[#35165f] shadow-[0_10px_25px_rgba(18,8,54,0.16)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200/45 max-[380px]:h-10"
          >
            See How It Works
          </Link>
        </div>
      </section>

      <section className="bg-[#070820] px-4 pb-3 pt-2 sm:hidden">
        <div className="mx-auto mb-2 max-w-md rounded-2xl border border-amber-200/40 bg-amber-100/12 px-3 py-3 text-left shadow-[0_12px_32px_rgba(0,0,0,0.22)] backdrop-blur">
          <div className="flex items-center gap-2">
            <TicketPercent className="h-5 w-5 shrink-0 text-amber-200" />
            <p className="text-xs font-black uppercase tracking-widest text-amber-100">{launchOffer.headline}</p>
          </div>
          <p className="mt-1 text-sm font-black leading-5 text-white">
            Use code <span className="rounded-md bg-white px-1.5 py-0.5 text-[#35165f]">{launchOffer.code}</span> for {launchOffer.discount} - {launchOffer.limit}.
          </p>
        </div>
        <div className="mx-auto flex max-w-md gap-3 rounded-2xl border border-emerald-200/30 bg-emerald-50/10 px-3 py-3 text-left shadow-[0_12px_32px_rgba(0,0,0,0.22)] backdrop-blur">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-200" />
          <p className="text-xs font-bold leading-5 text-white/92">
            Your child's photo is used only to create their personalised storybook artwork. We never sell personal information or use your child's image in adverts without permission.
          </p>
        </div>
      </section>

      <section className="relative hidden h-screen w-screen place-items-center overflow-hidden sm:grid">
        <div className="relative aspect-[1600/980] max-h-screen w-screen max-w-[calc(100vh*1600/980)]">
          <img
            src="/inspiration/magic-reference.png"
            alt="Little Legends Story: your child becomes the hero in personalised magical bedtime storybooks"
            className="absolute inset-0 h-full w-full select-none object-contain"
            draggable={false}
          />

          <div className="absolute left-[4%] top-[75.05%] w-[37.6%]">
            <div aria-hidden className="absolute inset-x-[10%] -inset-y-[34%] rounded-full bg-amber-200/18 blur-2xl" />
            <Link
              href="/create"
              className="hero-cta relative flex h-[9.1%] min-h-[4.7rem] items-center justify-center gap-[1.8%] rounded-full bg-[linear-gradient(135deg,#fff5cb_0%,#ffe08a_48%,#ffd56b_100%)] px-[4%] text-[clamp(1rem,1.7vw,1.52rem)] font-black tracking-normal text-[#35165f] transition hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200/45"
            >
              <Sparkles className="h-[1.08em] w-[1.08em]" />
              Create Your Child's Story
            </Link>
            <Link
              href="/create?how=1"
              className="relative mx-auto mt-[2.2%] flex min-h-[2.8rem] w-[66%] items-center justify-center rounded-full border border-white/70 bg-white/86 px-[4%] text-[clamp(0.82rem,1vw,1rem)] font-black text-[#35165f] shadow-[0_10px_25px_rgba(18,8,54,0.15)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200/45"
            >
              See How It Works
            </Link>
            <div className="relative mx-auto mt-[2%] w-[78%] rounded-2xl border border-amber-200/40 bg-amber-100/14 px-3 py-2.5 text-left shadow-[0_12px_34px_rgba(0,0,0,0.2)] backdrop-blur">
              <div className="flex items-center gap-2">
                <TicketPercent className="h-[1rem] w-[1rem] shrink-0 text-amber-200" />
                <p className="text-[clamp(0.62rem,0.72vw,0.78rem)] font-black uppercase tracking-widest text-amber-100">{launchOffer.headline}</p>
              </div>
              <p className="mt-1 text-[clamp(0.72rem,0.82vw,0.9rem)] font-black leading-[1.3] text-white">
                Use code <span className="rounded bg-white px-1.5 py-0.5 text-[#35165f]">{launchOffer.code}</span> for {launchOffer.discount} - {launchOffer.limit}.
              </p>
            </div>
            <div className="relative mx-auto mt-[2%] flex w-[84%] gap-2 rounded-2xl border border-emerald-200/30 bg-[#071428]/66 px-3 py-2.5 text-left shadow-[0_12px_34px_rgba(0,0,0,0.22)] backdrop-blur">
              <ShieldCheck className="mt-0.5 h-[1rem] w-[1rem] shrink-0 text-emerald-200" />
              <p className="text-[clamp(0.68rem,0.78vw,0.82rem)] font-bold leading-[1.35] text-white/92">
                Your child's photo is used only to create their personalised storybook artwork. We never sell personal information or use your child's image in adverts without permission.
              </p>
            </div>
          </div>
        </div>
      </section>

      <HomepageInfoPanel />
    </main>
  )
}
