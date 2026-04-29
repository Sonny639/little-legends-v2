import { NextResponse } from "next/server"

import { getArtworkManifest, getArtworkPromptPack } from "@/lib/artwork-manifest"

export const dynamic = "force-dynamic"

export function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const missingOnly = searchParams.get("missing") === "1"
  const prompts = searchParams.get("prompts") === "1"
  const storyId = searchParams.get("story")
  const items = prompts ? getArtworkPromptPack({ missingOnly }) : getArtworkManifest()
  const filteredItems = storyId ? items.filter((item) => item.storyId === storyId) : items

  return NextResponse.json(filteredItems)
}
