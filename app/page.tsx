import { Mail, Sparkles } from "lucide-react"

export default function ComingSoonPage() {
  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#070820]">
      <h1 className="sr-only">Little Legends Story</h1>
      <p className="sr-only">
        Coming soon. Your child becomes the hero in personalised magical bedtime storybooks.
      </p>

      <section className="relative w-full overflow-hidden sm:hidden">
        <img
          src="/inspiration/mobile-homepage.png"
          alt="Little Legends Story coming soon: your child becomes the hero in personalised magical bedtime storybooks"
          className="block h-auto w-full select-none"
          draggable={false}
        />

        <form
          className="absolute left-[5.4%] top-[71.5%] z-10 flex h-[15.8%] w-[89.2%] flex-col p-[3.3%]"
          aria-label="Join the Little Legends Story launch list"
        >
          <label htmlFor="launch-email-mobile" className="sr-only">
            Email address
          </label>
          <div className="group relative h-[39%]">
            <Mail className="pointer-events-none absolute left-[5.5%] top-1/2 h-[34%] w-auto -translate-y-1/2 text-violet-200/0 group-focus-within:text-violet-200/80" />
            <input
              id="launch-email-mobile"
              type="email"
              placeholder=" "
              className="peer h-full w-full rounded-full border border-transparent bg-transparent pl-[15%] pr-[5%] text-[clamp(1rem,4.7vw,1.45rem)] font-black text-white outline-none placeholder:text-transparent focus:border-amber-200/50 focus:bg-[#292a45]/95 [&:not(:placeholder-shown)]:bg-[#292a45]/95"
            />
          </div>
          <button
            type="submit"
            className="mt-[4%] h-[39%] rounded-full text-transparent outline-none focus-visible:ring-4 focus-visible:ring-amber-200/45"
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
