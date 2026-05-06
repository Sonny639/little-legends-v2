import { BookOpen, Crown, Heart, Search, Sparkles, Star, Trophy, Wand2 } from "lucide-react"

type StoryArtPlaceholderProps = {
  heroType: string
  heroName: string
  initials: string
  pageTitle?: string
  showFaceZone?: boolean
  compact?: boolean
  variant?: "customer" | "internal"
}

const getTheme = (heroType: string) => {
  const normalised = heroType.toLowerCase()

  if (normalised.includes("wizard")) {
    return {
      Icon: Wand2,
      label: "Moonbeam magic",
      glow: "from-violet-500 via-sky-500 to-amber-300",
      bg: "from-indigo-950 via-violet-900 to-sky-800",
    }
  }

  if (normalised.includes("fairy")) {
    return {
      Icon: Sparkles,
      label: "Glow garden",
      glow: "from-pink-300 via-amber-200 to-emerald-300",
      bg: "from-emerald-950 via-teal-800 to-pink-700",
    }
  }

  if (normalised.includes("princess")) {
    return {
      Icon: Crown,
      label: "Starlight castle",
      glow: "from-amber-200 via-pink-200 to-violet-300",
      bg: "from-violet-950 via-fuchsia-900 to-rose-700",
    }
  }

  if (normalised.includes("football")) {
    return {
      Icon: Trophy,
      label: "Wonder stadium",
      glow: "from-lime-300 via-amber-200 to-sky-300",
      bg: "from-emerald-950 via-sky-900 to-lime-700",
    }
  }

  if (normalised.includes("dinosaur")) {
    return {
      Icon: Search,
      label: "Fossil valley",
      glow: "from-amber-200 via-lime-300 to-teal-300",
      bg: "from-stone-950 via-emerald-900 to-amber-800",
    }
  }

  return {
    Icon: Star,
    label: "Storybook adventure",
    glow: "from-amber-200 via-rose-200 to-sky-300",
    bg: "from-sky-950 via-violet-900 to-rose-800",
  }
}

export function StoryArtPlaceholder({
  heroType,
  heroName,
  initials,
  pageTitle,
  showFaceZone = false,
  compact = false,
  variant = "customer",
}: StoryArtPlaceholderProps) {
  const theme = getTheme(heroType)
  const Icon = theme.Icon
  const isInternal = variant === "internal"

  return (
    <div className={`absolute inset-0 overflow-hidden bg-gradient-to-br ${theme.bg}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_36%,rgba(255,255,255,0.34)_0_8%,transparent_30%),radial-gradient(circle_at_72%_18%,rgba(253,224,71,0.32)_0_4%,transparent_18%),radial-gradient(circle_at_18%_24%,rgba(244,114,182,0.28)_0_3%,transparent_16%)]" />
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-[linear-gradient(180deg,transparent_0%,rgba(15,23,42,0.5)_100%)]" />
      <div className="absolute left-[12%] top-[16%] h-2 w-2 rounded-full bg-amber-200 shadow-[0_0_18px_rgba(253,224,71,0.95)]" />
      <div className="absolute right-[18%] top-[24%] h-3 w-3 rotate-45 bg-white shadow-[0_0_18px_rgba(255,255,255,0.9)]" />
      <div className="absolute bottom-[18%] left-[22%] h-2 w-2 rounded-full bg-pink-200 shadow-[0_0_16px_rgba(251,207,232,0.9)]" />
      <div className={`absolute left-1/2 top-[42%] grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-gradient-to-br ${theme.glow} p-1 shadow-[0_0_55px_rgba(253,224,71,0.46)]`}>
        <div className={`${compact ? "h-24 w-24" : "h-32 w-32"} grid place-items-center rounded-full border-4 border-white/90 bg-white/92 text-center shadow-2xl`}>
          <div>
            <Icon className="mx-auto mb-1 h-7 w-7 text-sky-950" />
            <div className={`${compact ? "text-3xl" : "text-5xl"} font-black text-sky-950`}>{initials}</div>
          </div>
        </div>
      </div>
      {showFaceZone && isInternal ? (
        <div className="absolute inset-x-[24%] top-[8%] h-[34%] rounded-[999px] border-4 border-white/60 bg-white/10" />
      ) : null}
      <div className="absolute inset-x-4 bottom-4 rounded-2xl border-2 border-white/70 bg-white/88 px-4 py-3 text-center shadow-[0_14px_35px_rgba(15,23,42,0.26)] backdrop-blur-sm">
        <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wide text-rose-600">
          <Heart className="h-3.5 w-3.5 fill-rose-400" />
          {theme.label}
        </div>
        <p className="mt-1 text-sm font-black leading-5 text-sky-950">
          {pageTitle || `${heroName}'s magical story`}
        </p>
        <div className="mt-2 flex items-center justify-center gap-1 text-[11px] font-black uppercase tracking-wide text-sky-800">
          <BookOpen className="h-3.5 w-3.5" />
          {isInternal ? "Final artwork slot" : `Made for ${heroName}`}
        </div>
      </div>
    </div>
  )
}
