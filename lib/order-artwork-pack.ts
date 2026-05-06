import { resolveFullStoryPages } from "@/lib/full-story"
import { createOrderPhotoPreviewLinks, listOrderPhotos } from "@/lib/order-photos"
import { type OrderRecord } from "@/lib/orders"
import { getStoryForCharacter, getStoryPathSummary, type StoryPathChoice } from "@/lib/stories"

const negativePrompt =
  "text, captions, speech bubbles, watermark, logo, cropped face, side profile face, hidden face, mask, helmet covering face, hands over face, props over face, dark face shadow, tiny face, extra limbs, distorted eyes, scary mood"

const csvEscape = (value: string | number | boolean | null | undefined) =>
  `"${String(value ?? "").replaceAll('"', '""')}"`

const pathTags = new Set<StoryPathChoice["pathTag"]>(["brave", "kind", "clever", "teamwork"])

const normaliseChoices = (choices: OrderRecord["choices"]): StoryPathChoice[] =>
  (choices || []).map((choice) => ({
    pageId: choice.pageId,
    choiceId: choice.choiceId,
    text: choice.text,
    pathTag: pathTags.has(choice.pathTag as StoryPathChoice["pathTag"])
      ? (choice.pathTag as StoryPathChoice["pathTag"])
      : "brave",
  }))

export const createOrderArtworkPack = async (order: OrderRecord) => {
  const story = getStoryForCharacter(order.storyId, {
    heroName: order.heroName,
    heroType: order.heroType,
  })
  const gender = order.gender || "boy"
  const choices = normaliseChoices(order.choices)
  const pages = resolveFullStoryPages(story, choices)
  const referencePhotos = await listOrderPhotos(order.id)
  const referencePhotosWithLinks = await createOrderPhotoPreviewLinks(referencePhotos)
  const pathSummary = getStoryPathSummary(choices)

  return {
    order: {
      id: order.id,
      createdAt: order.createdAt,
      product: order.product,
      status: order.status,
      fulfilmentStatus: order.fulfilmentStatus || "new",
      heroName: order.heroName,
      heroType: order.heroType,
      storyId: order.storyId,
      storyTitle: story.title,
      gender,
      customerEmail: order.email,
      photoCount: order.photoCount || 0,
      storedReferencePhotoCount: referencePhotos.length,
      pathSummary,
    },
    referencePhotos: referencePhotosWithLinks.map((photo, index) => ({
      index: index + 1,
      name: photo.name,
      mimeType: photo.mimeType,
      size: photo.size,
      storagePath: photo.storagePath,
      url: photo.url || "",
      signedUrlExpiresInSeconds: photo.url ? 60 * 60 : 0,
      source: photo.source,
      uploadedAt: photo.uploadedAt,
    })),
    pages: pages.map((page) => {
      const existingArtworkPath = page.artwork?.[gender] || ""
      const outputFileName = `${order.id}-page-${String(page.pageNumber).padStart(2, "0")}-${gender}.png`
      const prompt = [
        page.imageBrief,
        `Order: ${order.id}.`,
        `Hero: ${order.heroName} the ${order.heroType}.`,
        `Story: ${story.title}.`,
        `Page ${page.pageNumber}: ${page.title}.`,
        `Scene: ${page.scene}`,
        `Story moments: ${page.panels.join(" ")}`,
        `Chosen path: ${pathSummary}`,
        `Gender variant: ${gender}.`,
        `Use the stored customer reference photos for likeness. Reference photo count: ${referencePhotos.length}.`,
        referencePhotosWithLinks.length > 0
          ? `Reference photo links: ${referencePhotosWithLinks.map((photo) => photo.url || photo.storagePath).join(" ")}.`
          : "",
        "Final artwork requirement: premium full-page children's storybook illustration, warm magical lighting, child-friendly emotion, no text in image.",
        "Face-swap requirement: keep the child's face front-facing, unobstructed, well lit, and large enough for later replacement.",
      ]
        .filter(Boolean)
        .join(" ")

      return {
        pageNumber: page.pageNumber,
        pageId: page.id,
        pageTitle: page.title,
        artworkPhase: page.pageNumber <= story.previewPageLimit ? "preview" : "full-story",
        existingArtworkPath,
        outputFileName,
        prompt,
        negativePrompt,
      }
    }),
  }
}

export const getOrderArtworkPackCsv = (pack: Awaited<ReturnType<typeof createOrderArtworkPack>>) => {
  const headers = [
    "orderId",
    "heroName",
    "heroType",
    "storyId",
    "storyTitle",
    "gender",
    "storedReferencePhotoCount",
    "referencePhotoPaths",
    "referencePhotoUrls",
    "pageNumber",
    "pageId",
    "pageTitle",
    "artworkPhase",
    "existingArtworkPath",
    "outputFileName",
    "prompt",
    "negativePrompt",
  ]

  return [
    headers.join(","),
    ...pack.pages.map((page) =>
      [
        pack.order.id,
        pack.order.heroName,
        pack.order.heroType,
        pack.order.storyId,
        pack.order.storyTitle,
        pack.order.gender,
        pack.order.storedReferencePhotoCount,
        pack.referencePhotos.map((photo) => photo.storagePath).join(" | "),
        pack.referencePhotos.map((photo) => photo.url).filter(Boolean).join(" | "),
        page.pageNumber,
        page.pageId,
        page.pageTitle,
        page.artworkPhase,
        page.existingArtworkPath,
        page.outputFileName,
        page.prompt,
        page.negativePrompt,
      ]
        .map(csvEscape)
        .join(","),
    ),
  ].join("\n")
}
