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

const storyPreviewEndpoint = "fal-ai/hy-wu-edit"

const getFalKey = () => process.env.FAL_KEY || process.env.FAL_API_KEY || ""

export const isStoryPreviewConfigured = () => Boolean(getFalKey())

const trimTrailingSlash = (value: string) => value.replace(/\/$/, "")

const getPrompt = () =>
  [
    "Use image 1 as the exact base storybook illustration.",
    "Use image 2 only as the child's likeness reference.",
    "Replace the face, hairline, visible hairstyle, and visible hair silhouette of the main hero child in image 1 with the child likeness from image 2.",
    "Remove any original hero hair that conflicts with the child's hairstyle from image 2, including spikes, tufts, or extra strands that would show through behind the new hair.",
    "Keep the original pose, body, costume, background, composition, lighting, framing, and storybook art style from image 1 unchanged.",
    "Preserve the child likeness from image 2: face shape, exact skin tone and complexion, undertone, eyes, nose, mouth, expression, hairline, hair colour, and visible hairstyle.",
    "Match every visible area of the main hero child's skin to the child's complexion from image 2, including face, ears, neck, arms, elbows, hands, fingers, knees, legs, ankles, and feet where visible.",
    "Do not leave the original lighter or darker base-art skin on the hero's body; the face and all visible body skin must look like one naturally consistent child under the scene lighting.",
    "Do not add text, speech bubbles, extra people, extra limbs, new props, or a new scene.",
  ].join(" ")

const getBaseArtwork = (options: StoryPreviewOptions) => {
  const story = getStoryForCharacter(options.storyId, {
    heroName: options.heroName,
    heroType: options.heroType,
  })
  const baseArtworkPath = story.pages.start.artwork?.[options.gender]

  if (!baseArtworkPath) {
    throw new Error("This story does not have a preview artwork image yet.")
  }

  return {
    baseArtworkPath,
    baseArtworkUrl: `${trimTrailingSlash(options.appUrl)}${baseArtworkPath}`,
  }
}

const getPreviewInput = (baseArtworkUrl: string, referencePhoto: string) => ({
  prompt: getPrompt(),
  image_urls: [baseArtworkUrl, referencePhoto],
  image_size: "auto" as const,
  num_inference_steps: 20,
  num_images: 1,
  enable_thinking: false,
  enable_safety_checker: true,
  output_format: "png" as const,
})

export async function submitStoryPreview(options: StoryPreviewOptions) {
  const apiKey = getFalKey()

  if (!apiKey) {
    throw new Error("Story preview personalization is not configured yet.")
  }

  fal.config({ credentials: apiKey })

  const { baseArtworkPath, baseArtworkUrl } = getBaseArtwork(options)
  const referencePhoto = options.referencePhotos[0]
  const queuedRequest = await fal.queue.submit(storyPreviewEndpoint, {
    input: getPreviewInput(baseArtworkUrl, referencePhoto),
  })

  return {
    requestId: queuedRequest.request_id,
    baseArtworkPath,
  }
}

export async function getStoryPreviewStatus(requestId: string) {
  fal.config({ credentials: getFalKey() })
  return fal.queue.status(storyPreviewEndpoint, {
    requestId,
    logs: false,
  })
}

export async function getStoryPreviewResult(requestId: string) {
  fal.config({ credentials: getFalKey() })
  const result = await fal.queue.result(storyPreviewEndpoint, { requestId })
  const data = result.data as FalEditResult
  const imageUrl = data.images?.[0]?.url || ""

  if (!imageUrl) {
    throw new Error("Story preview personalization did not return an image.")
  }

  return {
    requestId,
    imageUrl,
  }
}
