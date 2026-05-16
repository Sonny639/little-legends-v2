import Link from "next/link"
import { Sparkles } from "lucide-react"

export default function HomePage() {
  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#070820]">
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
            Begin the Magic
          </Link>
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
              Begin the Magic
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
