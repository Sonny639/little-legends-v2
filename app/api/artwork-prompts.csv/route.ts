import { getArtworkPromptCsv } from "@/lib/artwork-manifest"

export const dynamic = "force-dynamic"

export function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const missingOnly = searchParams.get("missing") === "1"
  const storyId = searchParams.get("story") || undefined
  const prefix = storyId ? `little-legends-${storyId}` : "little-legends"
  const fileName = missingOnly ? `${prefix}-missing-artwork-prompts.csv` : `${prefix}-artwork-prompts.csv`

  return new Response(getArtworkPromptCsv({ missingOnly, storyId }), {
    headers: {
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  })
}
