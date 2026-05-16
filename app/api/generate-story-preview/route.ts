import { type NextRequest, NextResponse } from "next/server"

import { validatePhotos } from "@/lib/ai-character-generator"
import { checkRateLimit, getClientIp, rateLimitResponseHeaders } from "@/lib/rate-limit"
import { generateStoryPreview, isStoryPreviewConfigured } from "@/lib/story-preview-generator"

const genders = ["boy", "girl"] as const

export const maxDuration = 300

const getAppUrl = (request: Request) => {
  const origin = request.headers.get("origin")

  if (origin && origin !== "null") {
    return origin.replace(/\/$/, "")
  }

  const forwardedHost = request.headers.get("x-forwarded-host")
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https"

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  return "http://localhost:3003"
}

export async function POST(request: NextRequest) {
  try {
    const { photos, storyId, heroName, heroType, gender } = await request.json()

    if (!Array.isArray(photos) || !validatePhotos(photos)) {
      return NextResponse.json({ error: "At least one valid image is required." }, { status: 400 })
    }

    if (
      typeof storyId !== "string" ||
      !storyId.trim() ||
      typeof heroName !== "string" ||
      !heroName.trim() ||
      typeof heroType !== "string" ||
      !heroType.trim() ||
      !genders.includes(gender)
    ) {
      return NextResponse.json({ error: "Invalid story preview request." }, { status: 400 })
    }

    const clientIp = getClientIp(request)
    const rateLimit = checkRateLimit({
      key: `story-preview:${clientIp}`,
      limit: 3,
      windowMs: 60 * 60 * 1000,
    })

    if (!rateLimit.ok) {
      return NextResponse.json(
        { error: "Preview limit reached. Please try again later." },
        { status: 429, headers: rateLimitResponseHeaders(rateLimit.resetAt) },
      )
    }

    if (!isStoryPreviewConfigured()) {
      return NextResponse.json({ error: "Story preview personalization is not configured yet." }, { status: 503 })
    }

    const preview = await generateStoryPreview({
      referencePhotos: photos,
      storyId: storyId.trim(),
      heroName: heroName.trim(),
      heroType: heroType.trim(),
      gender,
      appUrl: getAppUrl(request),
    })

    return NextResponse.json({ preview })
  } catch (error) {
    console.error("Story preview generation error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate story preview" },
      { status: 500 },
    )
  }
}
