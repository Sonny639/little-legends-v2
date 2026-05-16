import { fal } from "@fal-ai/client"

import { getStoryForCharacter } from "@/lib/stories"

type StoryPreviewOptions = {
  referencePhotos: string[]
  storyId: string
  heroName: string
  heroType: string
  gender: "boy" | "girl"
  appUrl: string
}

type FalEditResult = {
  images?: Array<{
    url?: string
  }>
}

const getFalKey = () => process.env.FAL_KEY || process.env.FAL_API_KEY || ""

export const isStoryPreviewConfigured = () => Boolean(getFalKey())

const trimTrailingSlash = (value: string) => value.replace(/\/$/, "")

const getPrompt = () =>
  [
    "Use image 1 as the exact base storybook illustration.",
    "Use image 2 only as the child's facial reference.",
    "Replace only the face of the main hero child in image 1 with the child likeness from image 2.",
    "Keep the original pose, body, hairstyle silhouette, costume, background, composition, lighting, framing, and storybook art style from image 1 unchanged.",
    "Preserve the child likeness from image 2: face shape, skin tone, eyes, nose, mouth, and expression.",
    "Do not add text, speech bubbles, extra people, extra limbs, new props, or a new scene.",
  ].join(" ")

export async function generateStoryPreview(options: StoryPreviewOptions) {
  const apiKey = getFalKey()

  if (!apiKey) {
    throw new Error("Story preview personalization is not configured yet.")
  }

  const story = getStoryForCharacter(options.storyId, {
    heroName: options.heroName,
    heroType: options.heroType,
  })
  const baseArtworkPath = story.pages.start.artwork?.[options.gender]

  if (!baseArtworkPath) {
    throw new Error("This story does not have a preview artwork image yet.")
  }

  fal.config({ credentials: apiKey })

  const baseArtworkUrl = `${trimTrailingSlash(options.appUrl)}${baseArtworkPath}`
  let imageUrl = ""
  let lastError: unknown

  for (const referencePhoto of options.referencePhotos) {
    try {
      const result = await fal.subscribe("fal-ai/hy-wu-edit", {
        input: {
          prompt: getPrompt(),
          image_urls: [baseArtworkUrl, referencePhoto],
          image_size: "auto",
          num_inference_steps: 20,
          num_images: 1,
          enable_thinking: false,
          enable_safety_checker: true,
          output_format: "png",
        },
      })
      const data = result.data as FalEditResult
      imageUrl = data.images?.[0]?.url || ""

      if (imageUrl) break
    } catch (error) {
      lastError = error
    }
  }

  if (!imageUrl) {
    if (lastError) throw lastError
    throw new Error("Story preview personalization did not return an image.")
  }

  return {
    id: `story-preview-${Date.now()}`,
    imageUrl,
    baseArtworkPath,
  }
}
