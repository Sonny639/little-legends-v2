import { type NextRequest, NextResponse } from "next/server"

import { generateCharacterWithHuggingFace, validatePhotos } from "@/lib/ai-character-generator"

const styles = ["realistic", "animated", "cartoon"] as const

export async function POST(request: NextRequest) {
  try {
    const { photos, characterType, style } = await request.json()

    if (!Array.isArray(photos) || !validatePhotos(photos)) {
      return NextResponse.json({ error: "At least one valid image is required." }, { status: 400 })
    }

    if (typeof characterType !== "string" || !characterType.trim()) {
      return NextResponse.json({ error: "Character type is required." }, { status: 400 })
    }

    const requestedStyle = styles.includes(style) ? style : "realistic"
    const characters = await generateCharacterWithHuggingFace({
      referencePhotos: photos,
      characterType: characterType.trim(),
      style: requestedStyle,
      poses: ["standing", "action", "smiling", "heroic", "celebrating"],
    })

    return NextResponse.json({ character: characters[0], characters })
  } catch (error) {
    console.error("Character generation error:", error)
    return NextResponse.json({ error: "Failed to generate character" }, { status: 500 })
  }
}
