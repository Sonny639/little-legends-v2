import { NextResponse } from "next/server"

import { getArtworkManifest, getArtworkPromptPack } from "@/lib/artwork-manifest"

export const dynamic = "force-dynamic"

export function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const missingOnly = searchParams.get("missing") === "1"
  const prompts = searchParams.get("prompts") === "1"
  const storyId = searchParams.get("story")
  const launchOnly = searchParams.get("priority") === "1" || searchParams.get("launch") === "1"
  const requestedPhase = searchParams.get("phase")
  const phase = requestedPhase === "preview" || requestedPhase === "full-story" ? requestedPhase : undefined
  const items = prompts ? getArtworkPromptPack({ missingOnly, launchOnly, phase }) : getArtworkManifest()
  const filteredItems = items.filter((item) => {
    if (storyId && item.storyId !== storyId) return false
    if (!prompts && missingOnly && item.fileExists) return false
    if (!prompts && launchOnly && !item.launchPriority) return false
    if (!prompts && phase && item.artworkPhase !== phase) return false
    return true
  }).sort((first, second) => first.priorityRank - second.priorityRank)

  return NextResponse.json(filteredItems)
}
