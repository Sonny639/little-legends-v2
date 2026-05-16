import { type NextRequest, NextResponse } from "next/server"

import { generateCharacterPreview, isFacePersonalizationConfigured, validatePhotos } from "@/lib/ai-character-generator"
import { checkRateLimit, getClientIp, rateLimitResponseHeaders } from "@/lib/rate-limit"

const styles = ["storybook", "realistic"] as const

const getGenerationErrorMessage = (error: unknown) => {
  const body = typeof error === "object" && error && "body" in error ? (error as { body?: unknown }).body : null
  const detail =
    typeof body === "object" && body && "detail" in body
      ? (body as { detail?: unknown }).detail
      : null
  const detailText =
    typeof detail === "string"
      ? detail
      : Array.isArray(detail)
        ? detail.map((item) => (typeof item === "object" && item && "msg" in item ? String(item.msg) : "")).join(" ")
        : ""

  if (/no face detected/i.test(detailText)) {
    return "We could not find a clear face in that photo. Please try a front-facing photo in bright light."
  }

  if (/unprocessable entity/i.test(error instanceof Error ? error.message : "")) {
    return "That photo format could not be used for the preview. Please try a clear JPG or PNG photo."
  }

  return error instanceof Error ? error.message : "Failed to generate character"
}

export async function POST(request: NextRequest) {
  try {
    const { photos, characterType, style } = await request.json()

    if (!Array.isArray(photos) || !validatePhotos(photos)) {
      return NextResponse.json({ error: "At least one valid image is required." }, { status: 400 })
    }

    if (typeof characterType !== "string" || !characterType.trim()) {
      return NextResponse.json({ error: "Character type is required." }, { status: 400 })
    }

    const clientIp = getClientIp(request)
    const rateLimit = checkRateLimit({
      key: `face-preview:${clientIp}`,
      limit: 3,
      windowMs: 60 * 60 * 1000,
    })

    if (!rateLimit.ok) {
      return NextResponse.json(
        { error: "Preview limit reached. Please try again later." },
        { status: 429, headers: rateLimitResponseHeaders(rateLimit.resetAt) },
      )
    }

    if (!isFacePersonalizationConfigured()) {
      return NextResponse.json({ error: "Face personalization is not configured yet." }, { status: 503 })
    }

    const requestedStyle = styles.includes(style) ? style : "storybook"
    const character = await generateCharacterPreview({
      referencePhotos: photos,
      characterType: characterType.trim(),
      style: requestedStyle,
      poses: ["standing proudly"],
    })

    return NextResponse.json({ character })
  } catch (error) {
    console.error(
      "Character generation error:",
      error instanceof Error ? error.message : error,
      typeof error === "object" && error && "body" in error ? (error as { body?: unknown }).body : "",
    )
    return NextResponse.json(
      { error: getGenerationErrorMessage(error) },
      { status: 500 },
    )
  }
}
