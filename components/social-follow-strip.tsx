import type { ComponentType, SVGProps } from "react"
import { Facebook, Instagram } from "lucide-react"

const iconClass = "h-[18px] w-[18px]"
type SocialIcon = ComponentType<SVGProps<SVGSVGElement>>

const TikTokLogo = ({ className = iconClass, ...props }: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" {...props}>
    <path d="M16.6 3c.4 2.5 1.8 4 4.1 4.3v3.2c-1.5 0-2.9-.4-4.1-1.2v5.8c0 3.4-2.3 5.9-5.8 5.9-3.1 0-5.5-2.2-5.5-5.2 0-3.3 2.7-5.5 6.4-5.2v3.3c-1.7-.3-3 .5-3 1.9 0 1.1.9 1.9 2.1 1.9 1.4 0 2.3-.8 2.3-2.5V3h3.5Z" />
  </svg>
)

const XLogo = ({ className = iconClass, ...props }: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" {...props}>
    <path d="M17.7 3h3.1l-6.8 7.8 8 10.2h-6.3l-4.9-6.3L5.2 21H2.1l7.3-8.3L1.7 3h6.4l4.4 5.7L17.7 3Zm-1.1 16.2h1.7L7.1 4.7H5.3l11.3 14.5Z" />
  </svg>
)

const socialLinks: Array<{
  label: string
  Icon: SocialIcon
  href: string
  className: string
}> = [
  {
    label: "Facebook",
    Icon: Facebook,
    href: "https://www.facebook.com/share/18g2HD3NFj/?mibextid=wwXIfr",
    className: "bg-[#1877f2] text-white",
  },
  {
    label: "Instagram",
    Icon: Instagram,
    href: "https://www.instagram.com/littlelegendsstory/",
    className: "bg-[#e1306c] text-white",
  },
  {
    label: "TikTok",
    Icon: TikTokLogo,
    href: "https://www.tiktok.com/@littlelegendsstory",
    className: "bg-[#111111] text-white",
  },
  {
    label: "X",
    Icon: XLogo,
    href: "https://x.com/thelegendsstory",
    className: "bg-[#0f172a] text-white",
  },
]

type SocialFollowStripProps = {
  tone?: "light" | "dark"
}

export function SocialFollowStrip({ tone = "light" }: SocialFollowStripProps) {
  const shellClass =
    tone === "dark"
      ? "border-white/20 bg-sky-950/72 text-white shadow-[0_12px_32px_rgba(0,0,0,0.28)]"
      : "border-sky-950/15 bg-white/92 text-sky-950 shadow-[0_12px_32px_rgba(8,47,73,0.16)]"

  const renderLinks = (buttonClass: string) =>
    socialLinks.map(({ Icon, ...social }) => (
      <a
        key={social.label}
        href={social.href}
        target="_blank"
        rel="noreferrer"
        aria-label={`Follow Little Legends Story on ${social.label}`}
        title={social.label}
        className={`${buttonClass} ${social.className}`}
      >
        <Icon aria-hidden="true" className={iconClass} />
      </a>
    ))

  return (
    <>
      <aside
        aria-label="Follow Little Legends Story"
        className={`fixed bottom-3 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border px-2.5 py-2 backdrop-blur md:hidden ${shellClass}`}
      >
        <p className="whitespace-nowrap text-[0.68rem] font-black uppercase tracking-[0.14em]">Follow</p>
        <div className="flex gap-1.5">
          {renderLinks(
            "grid h-9 w-9 place-items-center rounded-full transition active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200/60",
          )}
        </div>
      </aside>

      <aside
        aria-label="Follow Little Legends Story"
        className={`fixed right-3 top-1/2 z-40 hidden -translate-y-1/2 rounded-2xl border px-2.5 py-3 backdrop-blur md:block lg:hidden ${shellClass}`}
      >
        <p className="[writing-mode:vertical-rl] rotate-180 text-[0.68rem] font-black uppercase tracking-[0.18em]">
          Follow the magic
        </p>
        <div className="mt-3 grid gap-2">
          {renderLinks(
            "grid h-9 w-9 place-items-center rounded-full transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200/60",
          )}
        </div>
      </aside>

      <aside
        aria-label="Follow Little Legends Story"
        className={`fixed left-3 top-1/2 z-40 hidden -translate-y-1/2 rounded-2xl border px-2.5 py-3 backdrop-blur lg:block ${shellClass}`}
      >
        <p className="[writing-mode:vertical-rl] rotate-180 text-[0.68rem] font-black uppercase tracking-[0.18em]">
          Follow the magic
        </p>
        <div className="mt-3 grid gap-2">
          {renderLinks(
            "grid h-9 w-9 place-items-center rounded-full transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200/60",
          )}
        </div>
      </aside>
    </>
  )
}
