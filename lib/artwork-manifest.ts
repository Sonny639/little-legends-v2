import fs from "fs"
import path from "path"

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
}

export type ArtworkPromptPackItem = ArtworkManifestItem & {
  outputFileName: string
  prompt: string
  negativePrompt: string
}

const artworkStories = [
  { id: "superhero", heroName: "Little Legend", heroType: "Superhero" },
  { id: "footballer", heroName: "Little Legend", heroType: "Football Star" },
  { id: "bitcoin-hero", heroName: "Little Legend", heroType: "Bitcoin Hero" },
  { id: "starter-template", heroName: "Little Legend", heroType: "Hero" },
]

const publicDirectory = path.join(process.cwd(), "public")

const fileExistsForPublicPath = (imagePath: string) => {
  const normalisedPath = imagePath.replace(/^\//, "")
  return fs.existsSync(path.join(publicDirectory, normalisedPath))
}

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

      if (!artwork) return []

      return (["boy", "girl"] as const).map((gender) => ({
        storyId: storyConfig.id,
        storyTitle: story.title,
        pageId: page.id,
        pageNumber: index + 1,
        pageTitle: page.title,
        gender,
        imagePath: artwork[gender],
        fileExists: fileExistsForPublicPath(artwork[gender]),
        imageBrief: page.imageBrief || "",
      }))
    })
  })
}

export const getArtworkPromptPack = (options?: { missingOnly?: boolean; storyId?: string }): ArtworkPromptPackItem[] => {
  const manifest = getArtworkManifest()
  const filteredManifest = manifest.filter((item) => {
    if (options?.missingOnly && item.fileExists) return false
    if (options?.storyId && item.storyId !== options.storyId) return false
    return true
  })

  return filteredManifest.map((item) => ({
    ...item,
    outputFileName: item.imagePath.split("/").at(-1) || item.imagePath,
    prompt: [
      item.imageBrief,
      `Final output path: ${item.imagePath}.`,
      `Gender variant: ${item.gender}.`,
      "Composition requirement: single premium full-page illustration, no text, no captions, no watermark, no border.",
      "Reference match requirement: preserve the child's visible skin tone and facial features from the uploaded reference photo.",
      "Face-swap requirement: child face must be front-facing, unobstructed, well lit, and large enough for later replacement.",
    ].join(" "),
    negativePrompt:
      "text, captions, speech bubbles, watermark, logo, cropped face, side profile face, hidden face, mask, helmet covering face, hands over face, props over face, dark face shadow, tiny face, extra limbs, distorted eyes, scary mood",
  }))
}

const csvEscape = (value: string | number | boolean) => `"${String(value).replaceAll('"', '""')}"`

export const getArtworkPromptCsv = (options?: { missingOnly?: boolean; storyId?: string }) => {
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
        item.outputFileName,
        item.prompt,
        item.negativePrompt,
      ]
        .map(csvEscape)
        .join(","),
    ),
  ].join("\n")
}
