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

        <div aria-hidden className="absolute right-[5.8%] top-[2.55%] h-[4.95%] w-[31%] rounded-full bg-[#17182f]" />

        <div className="absolute left-[5.4%] top-[71.5%] z-10 flex h-[15.8%] w-[89.2%] flex-col justify-center rounded-[2rem] border border-white/14 bg-[#17182f]/96 p-[3.3%] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_18px_48px_rgba(0,0,0,0.32)] backdrop-blur-md">
          <Link
            href="/create"
            className="flex h-[52%] items-center justify-center gap-3 rounded-full bg-amber-200 text-[clamp(1rem,4.7vw,1.35rem)] font-black text-[#35165f] shadow-[0_0_28px_rgba(251,191,36,0.28)] transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200/45"
          >
            <Sparkles className="h-[1em] w-[1em]" />
            Enter the Story
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

          <div aria-hidden className="absolute left-[4%] top-[75.4%] h-[15.2%] w-[38%] rounded-[2rem] bg-[#10132d]" />

          <Link
            href="/create"
            className="absolute left-[4%] top-[75.4%] flex h-[8.2%] w-[37.6%] items-center justify-center gap-[1.4%] rounded-full bg-amber-200 text-[clamp(0.9rem,1.45vw,1.28rem)] font-black text-[#35165f] shadow-[0_0_28px_rgba(251,191,36,0.28)] transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200/45"
          >
            <Sparkles className="h-[1em] w-[1em]" />
            Enter the Story
          </Link>
        </div>
      </section>
    </main>
  )
}
