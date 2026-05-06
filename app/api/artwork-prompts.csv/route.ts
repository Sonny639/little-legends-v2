import { getArtworkPromptCsv } from "@/lib/artwork-manifest"

export const dynamic = "force-dynamic"

export function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const missingOnly = searchParams.get("missing") === "1"
  const storyId = searchParams.get("story") || undefined
  const launchOnly = searchParams.get("priority") === "1" || searchParams.get("launch") === "1"
  const requestedPhase = searchParams.get("phase")
  const phase = requestedPhase === "preview" || requestedPhase === "full-story" ? requestedPhase : undefined
  const prefix = storyId ? `little-legends-${storyId}` : launchOnly ? "little-legends-launch-priority" : "little-legends"
  const phaseSuffix = phase ? `-${phase}` : ""
  const fileName = missingOnly ? `${prefix}${phaseSuffix}-missing-artwork-prompts.csv` : `${prefix}${phaseSuffix}-artwork-prompts.csv`

  return new Response(getArtworkPromptCsv({ missingOnly, storyId, launchOnly, phase }), {
    headers: {
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  })
}
