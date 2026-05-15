import { artworkAssetPaths } from "@/lib/artwork-assets.generated"
import { getStoryForCharacter } from "@/lib/stories"

export type ArtworkManifestItem = {
  storyId: string
  storyTitle: string
  pageId: string
  pageNumber: number
  pageTitle: string
  gender: "boy" | "girl"
  imagePath: string
  fileExists: boolean
  imageBrief: string
  launchPriority: boolean
  artworkPhase: "preview" | "full-story"
  priorityRank: number
}

export type ArtworkPromptPackItem = ArtworkManifestItem & {
  outputFileName: string
  prompt: string
  negativePrompt: string
}

const artworkStories = [
  { id: "superhero", heroName: "Little Legend", heroType: "Superhero" },
  { id: "race-driver", heroName: "Little Legend", heroType: "Race Car Driver" },
  { id: "wizard", heroName: "Little Legend", heroType: "Wizard" },
  { id: "knight", heroName: "Little Legend", heroType: "Brave Knight" },
  { id: "fairy", heroName: "Little Legend", heroType: "Fairy" },
  { id: "princess", heroName: "Little Legend", heroType: "Princess" },
  { id: "footballer", heroName: "Little Legend", heroType: "Football Star" },
  { id: "dinosaur-expert", heroName: "Little Legend", heroType: "Dinosaur Expert" },
  { id: "bitcoin-hero", heroName: "Little Legend", heroType: "Bitcoin Hero" },
  { id: "starter-template", heroName: "Little Legend", heroType: "Hero" },
]

const launchPriorityStoryIds = new Set([
  "superhero",
  "race-driver",
  "wizard",
  "knight",
  "fairy",
  "princess",
  "footballer",
  "dinosaur-expert",
])
const launchStoryOrder = new Map(artworkStories.map((story, index) => [story.id, index]))

const artworkAssetPathSet = new Set<string>(artworkAssetPaths)

const fileExistsForPublicPath = (imagePath: string) => artworkAssetPathSet.has(imagePath)

export const getArtworkManifest = (): ArtworkManifestItem[] => {
  return artworkStories.flatMap((storyConfig) => {
    const story = getStoryForCharacter(
      storyConfig.id === "starter-template" ? "default" : storyConfig.id,
      {
        heroName: storyConfig.heroName,
        heroType: storyConfig.heroType,
      },
    )

    return Object.values(story.pages).flatMap((page, index) => {
      const artwork = page.artwork
      const pageNumber = index + 1

      if (!artwork) return []

      return (["boy", "girl"] as const).map((gender) => ({
        storyId: storyConfig.id,
        storyTitle: story.title,
        pageId: page.id,
        pageNumber,
        pageTitle: page.title,
        gender,
        imagePath: artwork[gender],
        fileExists: fileExistsForPublicPath(artwork[gender]),
        imageBrief: page.imageBrief || "",
        launchPriority: launchPriorityStoryIds.has(storyConfig.id),
        artworkPhase: pageNumber <= story.previewPageLimit ? "preview" : "full-story",
        priorityRank:
          (launchStoryOrder.get(storyConfig.id) || 99) * 1000 +
          (pageNumber <= story.previewPageLimit ? 0 : 500) +
          pageNumber * 10 +
          (gender === "boy" ? 0 : 1),
      }))
    })
  })
}

export const getArtworkPromptPack = (options?: {
  missingOnly?: boolean
  storyId?: string
  launchOnly?: boolean
  phase?: ArtworkManifestItem["artworkPhase"]
}): ArtworkPromptPackItem[] => {
  const manifest = getArtworkManifest()
  const filteredManifest = manifest.filter((item) => {
    if (options?.missingOnly && item.fileExists) return false
    if (options?.storyId && item.storyId !== options.storyId) return false
    if (options?.launchOnly && !item.launchPriority) return false
    if (options?.phase && item.artworkPhase !== options.phase) return false
    return true
  }).sort((first, second) => first.priorityRank - second.priorityRank)

  return filteredManifest.map((item) => ({
    ...item,
    outputFileName: item.imagePath.split("/").at(-1) || item.imagePath,
    prompt: [
      item.imageBrief,
      `Final output path: ${item.imagePath}.`,
      `Gender variant: ${item.gender}.`,
      "Composition requirement: single premium full-page illustration, no text, no captions, no watermark, no border.",
      "Story fit requirement: image must match the exact page title, setting, emotional beat, and hero role described in the brief.",
      "Reference match requirement: preserve the child's visible skin tone and facial features from the uploaded reference photo.",
      "Face-swap requirement: child face must be front-facing, unobstructed, well lit, and large enough for later replacement.",
    ].join(" "),
    negativePrompt:
      "text, captions, speech bubbles, watermark, logo, cropped face, side profile face, hidden face, mask, helmet covering face, hands over face, props over face, dark face shadow, tiny face, extra limbs, distorted eyes, scary mood",
  }))
}

const csvEscape = (value: string | number | boolean) => `"${String(value).replaceAll('"', '""')}"`

export const getArtworkPromptCsv = (options?: {
  missingOnly?: boolean
  storyId?: string
  launchOnly?: boolean
  phase?: ArtworkManifestItem["artworkPhase"]
}) => {
  const promptPack = getArtworkPromptPack(options)
  const headers = [
    "storyId",
    "storyTitle",
    "pageNumber",
    "pageId",
    "pageTitle",
    "gender",
    "imagePath",
    "fileExists",
    "launchPriority",
    "artworkPhase",
    "priorityRank",
    "outputFileName",
    "prompt",
    "negativePrompt",
  ]

  return [
    headers.join(","),
    ...promptPack.map((item) =>
      [
        item.storyId,
        item.storyTitle,
        item.pageNumber,
        item.pageId,
        item.pageTitle,
        item.gender,
        item.imagePath,
        item.fileExists,
        item.launchPriority,
        item.artworkPhase,
        item.priorityRank,
        item.outputFileName,
        item.prompt,
        item.negativePrompt,
      ]
        .map(csvEscape)
        .join(","),
    ),
  ].join("\n")
}
