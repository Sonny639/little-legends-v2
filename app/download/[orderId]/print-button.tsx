"use client"

import { Printer } from "lucide-react"

import { Button } from "@/components/ui/button"

const getSafeFileNamePart = (value: string) =>
  value
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "")

export function PrintButton({ heroName }: { heroName: string }) {
  const printStory = () => {
    const originalTitle = document.title
    const safeHeroName = getSafeFileNamePart(heroName)
    document.title = safeHeroName
      ? `Little Legends Story _ Personalised Magical Storybooks_${safeHeroName}`
      : "Little Legends Story _ Personalised Magical Storybooks"
    window.print()
    window.setTimeout(() => {
      document.title = originalTitle
    }, 0)
  }

  return (
    <Button
      type="button"
      onClick={printStory}
      className="h-11 w-full min-w-[12rem] rounded-xl bg-emerald-500 px-6 font-black text-white hover:bg-emerald-600"
    >
      <Printer className="h-4 w-4" />
      Print / Save PDF
    </Button>
  )
}
