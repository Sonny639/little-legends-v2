const socialLinks = [
  {
    label: "Facebook",
    mark: "f",
    href: "https://www.facebook.com/share/18g2HD3NFj/?mibextid=wwXIfr",
    className: "bg-[#1877f2] text-white",
  },
  {
    label: "Instagram",
    mark: "ig",
    href: "https://www.instagram.com/littlelegendsstory/",
    className: "bg-[#e1306c] text-white",
  },
  {
    label: "TikTok",
    mark: "tk",
    href: "https://www.tiktok.com/@littlelegendsstory",
    className: "bg-[#111111] text-white",
  },
  {
    label: "X",
    mark: "x",
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

  return (
    <aside
      aria-label="Follow Little Legends Story"
      className={`fixed left-3 top-1/2 z-40 hidden -translate-y-1/2 rounded-2xl border px-2.5 py-3 backdrop-blur md:block ${shellClass}`}
    >
      <p className="[writing-mode:vertical-rl] rotate-180 text-[0.68rem] font-black uppercase tracking-[0.18em]">
        Follow the magic
      </p>
      <div className="mt-3 grid gap-2">
        {socialLinks.map((social) => (
          <a
            key={social.label}
            href={social.href}
            target="_blank"
            rel="noreferrer"
            aria-label={`Follow Little Legends Story on ${social.label}`}
            title={social.label}
            className={`grid h-9 w-9 place-items-center rounded-full text-[0.68rem] font-black uppercase transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200/60 ${social.className}`}
          >
            {social.mark}
          </a>
        ))}
      </div>
    </aside>
  )
}
