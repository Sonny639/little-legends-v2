import { type NextRequest, NextResponse } from "next/server"

import { validatePhotos } from "@/lib/ai-character-generator"
import { getTrustedAppUrl } from "@/lib/app-url"
import { checkRateLimit, getClientIp, rateLimitResponseHeaders } from "@/lib/rate-limit"
import {
  getStoryPreviewResult,
  getStoryPreviewStatus,
  isStoryPreviewConfigured,
  submitStoryPreview,
} from "@/lib/story-preview-generator"

const genders = ["boy", "girl"] as const

export const maxDuration = 300

const getPreviewErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) {
    return error.message
  }

  if (typeof error === "object" && error && "body" in error) {
    const body = (error as { body?: unknown }).body

    if (typeof body === "object" && body && "detail" in body) {
      return String((body as { detail?: unknown }).detail || "Failed to create story preview")
    }
  }

  return "Failed to create story preview"
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

    const preview = await submitStoryPreview({
      referencePhotos: photos,
      storyId: storyId.trim(),
      heroName: heroName.trim(),
      heroType: heroType.trim(),
      gender,
      appUrl: getTrustedAppUrl(request),
    })

    return NextResponse.json({ preview })
  } catch (error) {
    console.error("Story preview generation error:", error)
    return NextResponse.json(
      { error: getPreviewErrorMessage(error) },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const requestId = request.nextUrl.searchParams.get("requestId")?.trim()

    if (!requestId) {
      return NextResponse.json({ error: "Missing preview request id." }, { status: 400 })
    }

    if (!isStoryPreviewConfigured()) {
      return NextResponse.json({ error: "Story preview personalization is not configured yet." }, { status: 503 })
    }

    const status = await getStoryPreviewStatus(requestId)

    if (status.status !== "COMPLETED") {
      return NextResponse.json({
        preview: {
          requestId,
          status: status.status,
          queuePosition: status.status === "IN_QUEUE" ? status.queue_position : undefined,
        },
      })
    }

    const preview = await getStoryPreviewResult(requestId)
    return NextResponse.json({
      preview: {
        ...preview,
        status: status.status,
      },
    })
  } catch (error) {
    console.error("Story preview status error:", error)
    return NextResponse.json(
      { error: getPreviewErrorMessage(error) },
      { status: 500 },
    )
  }
}
