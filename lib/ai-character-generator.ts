import { fal } from "@fal-ai/client"

export type CharacterStyle = "storybook" | "realistic"

export interface CharacterGenerationOptions {
  referencePhotos: string[]
  characterType: string
  style: CharacterStyle
  poses: string[]
}

export interface GeneratedCharacter {
  id: string
  style: CharacterStyle
  provider: "fal-flux-pulid"
  images: {
    pose: string
    imageUrl: string
  }[]
}

type FalFluxPulidResult = {
  images?: Array<{
    url?: string
  }>
}

const isNoFaceDetectedError = (error: unknown) => {
  const body = typeof error === "object" && error && "body" in error ? (error as { body?: unknown }).body : null
  const detail =
    typeof body === "object" && body && "detail" in body
      ? (body as { detail?: unknown }).detail
      : null

  return typeof detail === "string" && /no face detected/i.test(detail)
}

const previewNegativePrompt =
  "text, captions, logo, watermark, deformed face, distorted eyes, extra limbs, duplicate person, side profile, face hidden, face covered, mask, helmet, scary mood, adult proportions"

const getFalKey = () => process.env.FAL_KEY || process.env.FAL_API_KEY || ""
const maxReferencePhotos = 3
const maxReferencePhotoBytes = 6 * 1024 * 1024
const allowedReferencePhotoTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"])

export const isFacePersonalizationConfigured = () => Boolean(getFalKey())

const getPrompt = ({ characterType, style, pose }: { characterType: string; style: CharacterStyle; pose: string }) => {
  if (style === "realistic") {
    return [
      `A child dressed as a ${characterType}, ${pose}.`,
      "Bright premium portrait photography, warm natural light, front-facing expressive face, age-appropriate child proportions.",
      "Preserve the child's visible facial identity, skin tone, eye shape, nose, mouth, and hair from the reference photo.",
      "Clean background, face unobstructed, shoulders visible, polished family portrait quality.",
    ].join(" ")
  }

  return [
    `A child hero dressed as a ${characterType}, ${pose}.`,
    "Premium children's storybook illustration, magical warm light, rich colour, polished painterly detail, front-facing expressive face.",
    "Preserve the child's visible facial identity, skin tone, eye shape, nose, mouth, and hair from the reference photo.",
    "Single child only, face clear and unobstructed, shoulders visible, child-safe joyful tone.",
  ].join(" ")
}

const getPreviewPose = (poses: string[]) => poses[0] || "standing proudly"

export async function generateCharacterPreview(options: CharacterGenerationOptions): Promise<GeneratedCharacter> {
  if (!validatePhotos(options.referencePhotos)) {
    throw new Error("At least one valid reference photo is required.")
  }

  const apiKey = getFalKey()

  if (!apiKey) {
    throw new Error("Face personalization is not configured yet.")
  }

  fal.config({ credentials: apiKey })

  const pose = getPreviewPose(options.poses)
  let imageUrl = ""
  let lastError: unknown

  for (const referencePhoto of options.referencePhotos) {
    try {
      const result = await fal.subscribe("fal-ai/flux-pulid", {
        input: {
          prompt: getPrompt({
            characterType: options.characterType,
            style: options.style,
            pose,
          }),
          reference_image_url: referencePhoto,
          image_size: "portrait_4_3",
          negative_prompt: previewNegativePrompt,
          guidance_scale: 4,
          id_weight: 1,
          enable_safety_checker: true,
          max_sequence_length: "256",
        },
      })
      const data = result.data as FalFluxPulidResult
      imageUrl = data.images?.[0]?.url || ""

      if (imageUrl) break
    } catch (error) {
      lastError = error

      if (!isNoFaceDetectedError(error)) {
        throw error
      }
    }
  }

  if (!imageUrl) {
    if (lastError) {
      throw lastError
    }

    throw new Error("Face personalization did not return an image.")
  }

  return {
    id: `preview-${Date.now()}`,
    style: options.style,
    provider: "fal-flux-pulid",
    images: [
      {
        pose,
        imageUrl,
      },
    ],
  }
}

export function processUploadedPhotos(photos: File[]): Promise<string[]> {
  return Promise.all(
    photos.map((photo) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = (event) => resolve(event.target?.result as string)
        reader.readAsDataURL(photo)
      })
    }),
  )
}

export function validatePhotos(photos: string[]): boolean {
  if (photos.length === 0 || photos.length > maxReferencePhotos) return false

  return photos.every((photo) => {
    const match = /^data:([^;,]+);base64,([a-zA-Z0-9+/]+={0,2})$/.exec(photo)
    if (!match) return false

    const [, mimeType, base64Data] = match
    if (!allowedReferencePhotoTypes.has(mimeType)) return false

    const padding = base64Data.endsWith("==") ? 2 : base64Data.endsWith("=") ? 1 : 0
    const byteLength = Math.floor((base64Data.length * 3) / 4) - padding

    return byteLength > 0 && byteLength <= maxReferencePhotoBytes
  })
}
