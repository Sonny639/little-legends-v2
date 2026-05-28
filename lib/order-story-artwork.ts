import fs from "fs/promises"
import path from "path"

import { fal } from "@fal-ai/client"

import { resolveFullStoryPages } from "@/lib/full-story"
import { createOrderPhotoPreviewLinks, listOrderPhotos } from "@/lib/order-photos"
import { type OrderRecord } from "@/lib/orders"
import { getStoryForCharacter, type StoryPathChoice } from "@/lib/stories"
import { getSupabaseAdmin, hasSupabaseAdmin } from "@/lib/supabase-admin"

type ArtworkPageStatus = "queued" | "in_progress" | "ready" | "failed"

type OrderStoryArtworkPage = {
  pageNumber: number
  pageId: string
  pageTitle: string
  baseArtworkPath: string
  requestId: string
  status: ArtworkPageStatus
  storagePath?: string
  imageUrl?: string
  error?: string
}

export type OrderStoryArtworkManifest = {
  orderId: string
  storyId: string
  gender: "boy" | "girl"
  createdAt: string
  updatedAt: string
  pages: OrderStoryArtworkPage[]
}

type FalEditResult = {
  images?: Array<{
    url?: string
  }>
}

const artworkEndpoint = "fal-ai/hy-wu-edit"
const printArtworkImageSize = {
  width: 1536,
  height: 1024,
} as const
const localArtworkDirectory = path.join(process.cwd(), "data", "order-story-artwork")
const storageBucket = () => process.env.SUPABASE_STORAGE_BUCKET || "order-photos"
const manifestStoragePath = (orderId: string) => `generated/${orderId}/manifest.json`
const pageStoragePath = (orderId: string, pageNumber: number) =>
  `generated/${orderId}/page-${String(pageNumber).padStart(2, "0")}.png`
const localManifestPath = (orderId: string) => path.join(localArtworkDirectory, orderId, "manifest.json")

const getFalKey = () => process.env.FAL_KEY || process.env.FAL_API_KEY || ""

const normaliseChoices = (choices: OrderRecord["choices"]): StoryPathChoice[] =>
  (choices || []).map((choice) => ({
    pageId: choice.pageId,
    choiceId: choice.choiceId,
    text: choice.text,
    pathTag:
      choice.pathTag === "kind" ||
      choice.pathTag === "clever" ||
      choice.pathTag === "teamwork"
        ? choice.pathTag
        : "brave",
  }))

const getPrompt = (pageTitle: string, storyId: string) =>
  [
    "Use image 1 as the exact base storybook illustration.",
    "Use image 2 only as the child's likeness reference.",
    `Replace the face, hairline, visible hairstyle, and visible hair silhouette of the main hero child in image 1 for the page "${pageTitle}" with the child likeness from image 2.`,
    "Remove any original hero hair that conflicts with the child's hairstyle from image 2, including spikes, tufts, or extra strands that would show through behind the new hair.",
    "Keep the original pose, body, costume, background, composition, lighting, framing, and storybook art style from image 1 unchanged.",
    "Preserve the child likeness from image 2: face shape, exact skin tone and complexion, undertone, eyes, nose, mouth, expression, hairline, hair colour, and visible hairstyle.",
    "Match every visible area of the main hero child's skin to the child's complexion from image 2, including face, ears, neck, arms, elbows, hands, fingers, knees, legs, ankles, and feet where visible.",
    "Do not leave the original lighter or darker base-art skin on the hero's body; the face and all visible body skin must look like one naturally consistent child under the scene lighting.",
    "Keep the finished artwork bright, colourful, and print-safe, with lifted midtones and clear child-friendly detail even in night or shadow scenes.",
    storyId === "footballer"
      ? "Football kit continuity requirement: keep the hero and their teammates in the same red-and-blue kit colours used throughout the football story; do not recolour them green."
      : "",
    "Do not add text, speech bubbles, extra people, extra limbs, new props, or a new scene.",
  ]
    .filter(Boolean)
    .join(" ")

const getPreviewInput = (baseArtworkUrl: string, referencePhoto: string, pageTitle: string, storyId: string) => ({
  prompt: getPrompt(pageTitle, storyId),
  image_urls: [baseArtworkUrl, referencePhoto],
  image_size: printArtworkImageSize,
  num_inference_steps: 20,
  num_images: 1,
  enable_thinking: false,
  enable_safety_checker: true,
  output_format: "png" as const,
})

const ensureLocalManifestDirectory = async (orderId: string) => {
  const directory = path.dirname(localManifestPath(orderId))
  await fs.mkdir(directory, { recursive: true })
}

export const readOrderStoryArtworkManifest = async (orderId: string): Promise<OrderStoryArtworkManifest | null> => {
  if (hasSupabaseAdmin()) {
    const { data, error } = await getSupabaseAdmin().storage.from(storageBucket()).download(manifestStoragePath(orderId))

    if (error) {
      if (/not found|object not found/i.test(error.message)) return null
      throw new Error(`Failed to read story artwork manifest: ${error.message}`)
    }

    return JSON.parse(await data.text()) as OrderStoryArtworkManifest
  }

  try {
    const contents = await fs.readFile(localManifestPath(orderId), "utf8")
    return JSON.parse(contents) as OrderStoryArtworkManifest
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code
    if (code === "ENOENT") return null
    throw error
  }
}

const saveOrderStoryArtworkManifest = async (manifest: OrderStoryArtworkManifest) => {
  const nextManifest = {
    ...manifest,
    updatedAt: new Date().toISOString(),
  }

  if (hasSupabaseAdmin()) {
    const { error } = await getSupabaseAdmin().storage.from(storageBucket()).upload(
      manifestStoragePath(manifest.orderId),
      Buffer.from(JSON.stringify(nextManifest, null, 2)),
      {
        contentType: "application/json",
        upsert: true,
      },
    )

    if (error) {
      throw new Error(`Failed to save story artwork manifest: ${error.message}`)
    }

    return nextManifest
  }

  await ensureLocalManifestDirectory(manifest.orderId)
  await fs.writeFile(localManifestPath(manifest.orderId), JSON.stringify(nextManifest, null, 2), "utf8")
  return nextManifest
}

export const startOrderStoryArtwork = async (order: OrderRecord, appUrl: string) => {
  const existingManifest = await readOrderStoryArtworkManifest(order.id)
  if (existingManifest) return existingManifest

  if (!getFalKey()) {
    throw new Error("Full-story personalization is not configured yet.")
  }

  const photos = await listOrderPhotos(order.id)
  const signedPhotos = await createOrderPhotoPreviewLinks(photos, 60 * 60 * 6)
  const referencePhoto = signedPhotos.find((photo) => photo.url)?.url

  if (!referencePhoto) {
    throw new Error("A stored reference photo is required for full-story personalization.")
  }

  fal.config({ credentials: getFalKey() })

  const story = getStoryForCharacter(order.storyId, {
    heroName: order.heroName,
    heroType: order.heroType,
  })
  const gender = order.gender === "girl" ? "girl" : "boy"
  const pages = resolveFullStoryPages(story, normaliseChoices(order.choices))
  const queuedPages = await Promise.all(
    pages.map(async (page) => {
      const baseArtworkPath = page.artwork?.[gender]

      if (!baseArtworkPath) {
        throw new Error(`Page ${page.pageNumber} is missing base artwork.`)
      }

      const queuedRequest = await fal.queue.submit(artworkEndpoint, {
        input: getPreviewInput(`${appUrl.replace(/\/$/, "")}${baseArtworkPath}`, referencePhoto, page.title, order.storyId),
      })

      return {
        pageNumber: page.pageNumber,
        pageId: page.id,
        pageTitle: page.title,
        baseArtworkPath,
        requestId: queuedRequest.request_id,
        status: "queued" as const,
      }
    }),
  )

  return saveOrderStoryArtworkManifest({
    orderId: order.id,
    storyId: order.storyId,
    gender,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pages: queuedPages,
  })
}

const persistGeneratedPage = async (manifest: OrderStoryArtworkManifest, page: OrderStoryArtworkPage, imageUrl: string) => {
  if (!hasSupabaseAdmin()) {
    return {
      ...page,
      status: "ready" as const,
      imageUrl,
    }
  }

  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error(`Failed to download generated artwork for page ${page.pageNumber}.`)
  }

  const storagePath = pageStoragePath(manifest.orderId, page.pageNumber)
  const { error } = await getSupabaseAdmin().storage.from(storageBucket()).upload(
    storagePath,
    Buffer.from(await response.arrayBuffer()),
    {
      contentType: "image/png",
      upsert: true,
    },
  )

  if (error) {
    throw new Error(`Failed to save generated artwork for page ${page.pageNumber}: ${error.message}`)
  }

  return {
    ...page,
    status: "ready" as const,
    storagePath,
  }
}

export const syncOrderStoryArtwork = async (manifest: OrderStoryArtworkManifest) => {
  fal.config({ credentials: getFalKey() })

  const nextPages = await Promise.all(
    manifest.pages.map(async (page) => {
      if (page.status === "ready" || page.status === "failed") return page

      try {
        const status = await fal.queue.status(artworkEndpoint, {
          requestId: page.requestId,
          logs: false,
        })

        if (status.status === "IN_QUEUE") {
          return { ...page, status: "queued" as const }
        }

        if (status.status === "IN_PROGRESS") {
          return { ...page, status: "in_progress" as const }
        }

        const result = await fal.queue.result(artworkEndpoint, {
          requestId: page.requestId,
        })
        const data = result.data as FalEditResult
        const imageUrl = data.images?.[0]?.url || ""

        if (!imageUrl) {
          throw new Error(`Page ${page.pageNumber} did not return an image.`)
        }

        return persistGeneratedPage(manifest, page, imageUrl)
      } catch (error) {
        return {
          ...page,
          status: "failed" as const,
          error: error instanceof Error ? error.message : `Page ${page.pageNumber} failed.`,
        }
      }
    }),
  )

  return saveOrderStoryArtworkManifest({
    ...manifest,
    pages: nextPages,
  })
}

export const createOrderStoryArtworkLinks = async (manifest: OrderStoryArtworkManifest) => {
  if (!hasSupabaseAdmin()) return manifest

  const readyPages = manifest.pages.filter((page) => page.storagePath)
  if (readyPages.length === 0) return manifest

  const { data, error } = await getSupabaseAdmin().storage.from(storageBucket()).createSignedUrls(
    readyPages.map((page) => page.storagePath as string),
    60 * 60,
  )

  if (error) {
    throw new Error(`Failed to create generated artwork links: ${error.message}`)
  }

  const urlsByStoragePath = new Map(
    readyPages.map((page, index) => [page.storagePath, data?.[index]?.signedUrl || ""]),
  )

  return {
    ...manifest,
    pages: manifest.pages.map((page) => ({
      ...page,
      imageUrl: page.storagePath ? urlsByStoragePath.get(page.storagePath) || "" : page.imageUrl,
    })),
  }
}

export const getOrderStoryArtworkSummary = (manifest: OrderStoryArtworkManifest) => {
  const readyCount = manifest.pages.filter((page) => page.status === "ready").length
  const failedCount = manifest.pages.filter((page) => page.status === "failed").length

  return {
    totalPages: manifest.pages.length,
    readyCount,
    failedCount,
    complete: manifest.pages.length > 0 && readyCount === manifest.pages.length,
  }
}
