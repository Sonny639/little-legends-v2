import { Mail, Sparkles } from "lucide-react"

export default function ComingSoonPage() {
  return (
    <main className="h-screen w-screen overflow-hidden bg-[#070820]">
      <h1 className="sr-only">Little Legends Story</h1>
      <p className="sr-only">
        Coming soon. Your child becomes the hero in personalised magical bedtime storybooks.
      </p>

      <section className="relative h-screen w-screen overflow-hidden sm:hidden">
        <img
          src="/inspiration/magic-reference.png"
          alt="Little Legends Story coming soon: your child becomes the hero in personalised magical bedtime storybooks"
          className="absolute inset-0 h-full w-full object-cover object-left"
          draggable={false}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,8,32,0)_0%,rgba(7,8,32,0.08)_42%,rgba(7,8,32,0.82)_100%)]" />

        <div className="absolute left-4 top-4 z-10 flex items-center gap-3 rounded-full bg-[#070820]/74 py-2 pr-4 backdrop-blur-md">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-amber-200 text-xl shadow-[0_0_24px_rgba(251,191,36,0.45)]">
            <span aria-hidden="true">💛</span>
          </div>
          <span className="text-lg font-black text-white drop-shadow-[0_3px_12px_rgba(0,0,0,0.6)]">
            Little Legends Story
          </span>
        </div>

        <div className="absolute right-4 top-18 z-10 inline-flex items-center gap-2 rounded-full border border-amber-200/35 bg-[#120d2f]/78 px-4 py-2 text-sm font-black text-amber-100 shadow-[0_0_28px_rgba(251,191,36,0.24)] backdrop-blur-md">
          <Sparkles className="h-4 w-4 text-amber-200" />
          Coming Soon
        </div>

        <form
          className="absolute inset-x-5 bottom-7 z-10 rounded-[1.75rem] border border-white/18 bg-[#12142f]/92 p-2 shadow-[0_18px_48px_rgba(0,0,0,0.42)] backdrop-blur-md"
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
            className="absolute left-[4%] top-[75.4%] flex h-[8.2%] w-[37.6%] items-center rounded-full"
            aria-label="Join the Little Legends Story launch list"
          >
            <label htmlFor="launch-email" className="sr-only">
              Email address
            </label>
            <Mail className="pointer-events-none absolute left-[6%] h-[34%] w-auto text-violet-200/70" />
            <input
              id="launch-email"
              type="email"
              placeholder="Enter your email"
              className="h-full min-w-0 flex-1 rounded-l-full border-0 bg-transparent pl-[15%] pr-[3%] text-[clamp(0.85rem,1.25vw,1.25rem)] font-semibold text-white outline-none placeholder:text-violet-100/68"
            />
            <button
              type="submit"
              className="h-[82%] w-[37%] rounded-full text-[clamp(0.78rem,1.22vw,1.18rem)] font-black text-[#35165f] outline-none transition focus-visible:ring-4 focus-visible:ring-amber-200/45"
            >
              <span className="sr-only">Join the list</span>
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
