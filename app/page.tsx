import { Heart, Mail, Sparkles } from "lucide-react"

export default function ComingSoonPage() {
  return (
    <main className="h-screen w-full overflow-hidden bg-[#070820]">
      <h1 className="sr-only">Little Legends Story</h1>
      <p className="sr-only">
        Coming soon. Your child becomes the hero in personalised magical bedtime storybooks.
      </p>

      <section className="relative h-[100svh] w-full overflow-hidden sm:hidden">
        <img
          src="/inspiration/magic-reference.png"
          alt="Little Legends Story coming soon: your child becomes the hero in personalised magical bedtime storybooks"
          className="absolute inset-0 h-full w-full object-cover object-[58%_center]"
          draggable={false}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,8,32,0.94)_0%,rgba(20,12,48,0.74)_48%,rgba(7,8,32,0.18)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,8,32,0.2)_0%,rgba(7,8,32,0.04)_36%,rgba(7,8,32,0.92)_100%)]" />

        <div className="relative z-10 flex h-full w-full flex-col px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-1.5 rounded-full bg-[#070820]/58 py-1.5 pr-2 backdrop-blur-md min-[360px]:gap-2 min-[390px]:pr-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber-200 text-rose-500 shadow-[0_0_24px_rgba(251,191,36,0.45)] min-[390px]:h-10 min-[390px]:w-10">
                <Heart className="h-4.5 w-4.5 fill-rose-400 text-rose-500 min-[390px]:h-6 min-[390px]:w-6" />
              </div>
              <span className="whitespace-nowrap text-[11px] font-black text-white drop-shadow-[0_3px_12px_rgba(0,0,0,0.6)] min-[360px]:text-sm min-[390px]:text-base">
                Little Legends Story
              </span>
            </div>

            <div className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-200/35 bg-[#120d2f]/78 px-2 py-2 text-[11px] font-black text-amber-100 shadow-[0_0_28px_rgba(251,191,36,0.24)] backdrop-blur-md min-[360px]:px-2.5 min-[360px]:text-xs min-[390px]:gap-1.5 min-[390px]:px-3">
              <Sparkles className="h-3.5 w-3.5 text-amber-200" />
              Coming Soon
            </div>
          </div>

          <div className="mt-11 max-w-[21.5rem]">
            <h2 className="font-serif text-[3.35rem] font-black leading-[0.86] tracking-normal text-white drop-shadow-[0_8px_24px_rgba(0,0,0,0.58)] min-[390px]:text-[3.65rem]">
              Your child.
              <span className="mt-1 block bg-[linear-gradient(90deg,#ffe7a2_0%,#ff9edc_45%,#d9a5ff_100%)] bg-clip-text text-transparent">
                The hero.
              </span>
            </h2>
            <p className="mt-4 max-w-[18rem] font-serif text-xl leading-7 text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.55)]">
              Personalised storybooks for magical bedtime moments.
            </p>
          </div>

          <form
            className="mt-6 w-full rounded-[1.75rem] border border-white/18 bg-[#12142f]/92 p-2 shadow-[0_18px_48px_rgba(0,0,0,0.42)] backdrop-blur-md"
            aria-label="Join the Little Legends Story launch list"
          >
            <label htmlFor="launch-email-mobile" className="sr-only">
              Email address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-violet-200/75" />
              <input
                id="launch-email-mobile"
                type="email"
                placeholder="Enter your email"
                className="h-12 w-full rounded-full border border-white/10 bg-white/8 pl-13 pr-4 text-base font-bold text-white outline-none placeholder:text-violet-100/70 focus:border-amber-200/50"
              />
            </div>
            <button
              type="submit"
              className="mt-2 h-12 w-full rounded-full bg-amber-200 text-base font-black text-[#35165f] shadow-[0_0_30px_rgba(251,191,36,0.28)]"
            >
              Join the list
            </button>
          </form>

          <div className="mt-auto rounded-[1.35rem] border border-white/14 bg-white/10 px-4 py-3 text-sm font-black text-white shadow-[0_16px_44px_rgba(0,0,0,0.32)] backdrop-blur-md">
            Made with love. Approved by parents.
          </div>
        </div>
      </section>

      <section className="relative hidden h-screen w-screen place-items-center overflow-hidden sm:grid">
        <div className="relative aspect-[1600/980] max-h-screen w-screen max-w-[calc(100vh*1600/980)]">
          <img
            src="/inspiration/magic-reference.png"
            alt="Little Legends Story coming soon: your child becomes the hero in personalised magical bedtime storybooks"
            className="absolute inset-0 h-full w-full select-none object-contain"
            draggable={false}
          />

          <div className="absolute left-[45%] top-[8%] -translate-x-1/2 items-center gap-2 rounded-full border border-amber-200/35 bg-[#120d2f]/70 px-[1.4%] py-[0.55%] text-[clamp(0.7rem,1.15vw,1.05rem)] font-black text-amber-100 shadow-[0_0_28px_rgba(251,191,36,0.24)] backdrop-blur-md sm:inline-flex">
            <Sparkles className="h-[1em] w-[1em] text-amber-200" />
            Coming Soon
          </div>

          <form
            className="absolute left-[4%] top-[75.4%] flex h-[8.2%] w-[37.6%] items-center gap-[1.5%] rounded-full border border-white/14 bg-[#17182f]/96 p-[0.55%] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_18px_48px_rgba(0,0,0,0.32)] backdrop-blur-md"
            aria-label="Join the Little Legends Story launch list"
          >
            <label htmlFor="launch-email" className="sr-only">
              Email address
            </label>
            <div className="relative h-full min-w-0 flex-1">
              <Mail className="pointer-events-none absolute left-[7%] top-1/2 h-[34%] w-auto -translate-y-1/2 text-violet-200/70" />
              <input
                id="launch-email"
                type="email"
                placeholder="Enter your email"
                className="h-full w-full rounded-full border border-white/10 bg-[#24253f] pl-[18%] pr-[5%] text-[clamp(0.85rem,1.25vw,1.25rem)] font-semibold text-white outline-none placeholder:text-violet-100/68 focus:border-amber-200/45"
              />
            </div>
            <button
              type="submit"
              className="h-full w-[35%] rounded-full bg-amber-200 text-[clamp(0.78rem,1.22vw,1.18rem)] font-black text-[#35165f] shadow-[0_0_28px_rgba(251,191,36,0.28)] outline-none transition hover:bg-amber-100 focus-visible:ring-4 focus-visible:ring-amber-200/45"
            >
              Join the list
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
