import { randomUUID } from "crypto"
import fs from "fs/promises"
import path from "path"

import { getSupabaseAdmin, hasSupabaseAdmin } from "@/lib/supabase-admin"

export type GalleryEntryStatus = "draft" | "published"

export type GalleryImage = {
  id: string
  name: string
  alt: string
  mimeType: string
  size: number
  storagePath: string
}

export type GalleryEntry = {
  id: string
  createdAt: string
  updatedAt: string
  title: string
  review: string
  credit: string
  status: GalleryEntryStatus
  images: GalleryImage[]
}

export type GalleryEntryWithUrls = Omit<GalleryEntry, "images"> & {
  images: Array<GalleryImage & { url: string; src: string }>
}

const dataDirectory = path.join(process.cwd(), "data")
const localGalleryDirectory = path.join(dataDirectory, "gallery")
const localGalleryImagesDirectory = path.join(dataDirectory, "gallery-images")
const localGalleryFile = path.join(localGalleryDirectory, "entries.json")

const galleryManifestPath = "gallery/entries.json"
const galleryImagePrefix = "gallery/images"
const maxGalleryImages = 4
const maxGalleryImageSizeBytes = 6 * 1024 * 1024
const allowedGalleryMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"])

const getGalleryBucket = () => process.env.SUPABASE_GALLERY_STORAGE_BUCKET || process.env.SUPABASE_STORAGE_BUCKET || "order-photos"

const sanitizeFileName = (fileName: string) =>
  fileName
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^\.+/, "")
    .slice(0, 120) || "photo"

const cleanSingleLine = (value: string, maxLength: number) => value.trim().replace(/\s+/g, " ").slice(0, maxLength)
const cleanLongText = (value: string, maxLength: number) => value.trim().replace(/\r\n/g, "\n").slice(0, maxLength)

const ensureLocalGalleryFile = async () => {
  await fs.mkdir(localGalleryDirectory, { recursive: true })

  try {
    await fs.access(localGalleryFile)
  } catch {
    await fs.writeFile(localGalleryFile, "[]", "utf8")
  }
}

const readLocalGalleryEntries = async (): Promise<GalleryEntry[]> => {
  await ensureLocalGalleryFile()
  const fileContents = await fs.readFile(localGalleryFile, "utf8")
  const parsedEntries = JSON.parse(fileContents.replace(/^\uFEFF/, ""))
  return Array.isArray(parsedEntries) ? parsedEntries : []
}

const writeLocalGalleryEntries = async (entries: GalleryEntry[]) => {
  await fs.mkdir(localGalleryDirectory, { recursive: true })
  await fs.writeFile(localGalleryFile, JSON.stringify(entries, null, 2), "utf8")
}

const isMissingStorageObject = (error: unknown) => {
  const message = error instanceof Error ? error.message : typeof error === "object" && error ? String((error as { message?: unknown }).message || "") : ""
  const statusCode = typeof error === "object" && error ? String((error as { statusCode?: unknown }).statusCode || "") : ""
  return statusCode === "404" || /not found|does not exist/i.test(message)
}

export const readGalleryEntries = async (): Promise<GalleryEntry[]> => {
  if (hasSupabaseAdmin()) {
    const client = getSupabaseAdmin()
    const { data, error } = await client.storage.from(getGalleryBucket()).download(galleryManifestPath)

    if (error) {
      if (isMissingStorageObject(error)) return []
      throw new Error(`Failed to read gallery entries: ${error.message}`)
    }

    const parsedEntries = JSON.parse(await data.text())
    return Array.isArray(parsedEntries) ? parsedEntries : []
  }

  return readLocalGalleryEntries()
}

const writeGalleryEntries = async (entries: GalleryEntry[]) => {
  if (hasSupabaseAdmin()) {
    const client = getSupabaseAdmin()
    const body = JSON.stringify(entries, null, 2)
    const { error } = await client.storage.from(getGalleryBucket()).upload(galleryManifestPath, body, {
      contentType: "application/json; charset=utf-8",
      upsert: true,
    })

    if (error) {
      throw new Error(`Failed to save gallery entries: ${error.message}`)
    }

    return
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Gallery storage is not configured for production")
  }

  await writeLocalGalleryEntries(entries)
}

const hasBytes = (buffer: Buffer, expected: number[], offset = 0) =>
  expected.every((byte, index) => buffer[offset + index] === byte)

const getDetectedMimeType = (buffer: Buffer) => {
  if (hasBytes(buffer, [0xff, 0xd8, 0xff])) return "image/jpeg"
  if (hasBytes(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png"
  if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return "image/webp"
  return ""
}

const validateGalleryImage = (file: File, buffer: Buffer) => {
  if (!allowedGalleryMimeTypes.has(file.type)) {
    throw new Error("Only JPG, PNG, and WEBP images are supported")
  }

  if (file.size > maxGalleryImageSizeBytes) {
    throw new Error("Each gallery image must be 6MB or smaller")
  }

  if (getDetectedMimeType(buffer) !== file.type) {
    throw new Error("Uploaded gallery images must be valid JPG, PNG, or WEBP files")
  }
}

const saveGalleryImages = async (entryId: string, files: File[]): Promise<GalleryImage[]> => {
  if (files.length === 0) {
    throw new Error("Add at least one gallery image")
  }

  if (files.length > maxGalleryImages) {
    throw new Error(`You can add up to ${maxGalleryImages} images per gallery post`)
  }

  const uploadedImages: GalleryImage[] = []

  for (const [index, file] of files.entries()) {
    const buffer = Buffer.from(await file.arrayBuffer())
    validateGalleryImage(file, buffer)

    const safeName = sanitizeFileName(file.name || `gallery-${index + 1}.jpg`)
    const imageId = randomUUID()
    const storagePath = hasSupabaseAdmin()
      ? `${galleryImagePrefix}/${entryId}/${String(index + 1).padStart(2, "0")}-${Date.now()}-${safeName}`
      : path.join(localGalleryImagesDirectory, entryId, `${String(index + 1).padStart(2, "0")}-${safeName}`)

    if (hasSupabaseAdmin()) {
      const { error } = await getSupabaseAdmin().storage.from(getGalleryBucket()).upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

      if (error) {
        throw new Error(`Failed to upload gallery image: ${error.message}`)
      }
    } else {
      if (process.env.NODE_ENV === "production") {
        throw new Error("Gallery storage is not configured for production")
      }

      await fs.mkdir(path.dirname(storagePath), { recursive: true })
      await fs.writeFile(storagePath, buffer)
    }

    uploadedImages.push({
      id: imageId,
      name: file.name || safeName,
      alt: "",
      mimeType: file.type,
      size: file.size,
      storagePath,
    })
  }

  return uploadedImages
}

const createGalleryImageUrls = async (entry: GalleryEntry): Promise<GalleryEntryWithUrls> => {
  if (entry.images.length === 0) {
    return { ...entry, images: [] }
  }

  if (hasSupabaseAdmin()) {
    const { data, error } = await getSupabaseAdmin()
      .storage
      .from(getGalleryBucket())
      .createSignedUrls(
        entry.images.map((image) => image.storagePath),
        60 * 60 * 24,
      )

    if (error) {
      throw new Error(`Failed to create gallery image links: ${error.message}`)
    }

    return {
      ...entry,
      images: entry.images.map((image, index) => {
        const url = data?.[index]?.signedUrl || ""
        return {
          ...image,
          alt: image.alt || entry.title,
          src: url,
          url,
        }
      }),
    }
  }

  if (process.env.NODE_ENV === "production") {
    return {
      ...entry,
      images: entry.images.map((image) => ({ ...image, alt: image.alt || entry.title, src: "", url: "" })),
    }
  }

  const images = await Promise.all(
    entry.images.map(async (image) => {
      const buffer = await fs.readFile(image.storagePath)
      const url = `data:${image.mimeType};base64,${buffer.toString("base64")}`
      return {
        ...image,
        alt: image.alt || entry.title,
        src: url,
        url,
      }
    }),
  )

  return { ...entry, images }
}

export const readGalleryEntriesWithUrls = async () => {
  const entries = await readGalleryEntries()
  return Promise.all(entries.map(createGalleryImageUrls))
}

export const readPublishedGalleryEntries = async () => {
  const entries = await readGalleryEntries()
  const publishedEntries = entries.filter((entry) => entry.status === "published")
  return Promise.all(publishedEntries.map(createGalleryImageUrls))
}

export const createGalleryEntry = async ({
  title,
  review,
  credit,
  status,
  files,
}: {
  title: string
  review: string
  credit: string
  status: GalleryEntryStatus
  files: File[]
}) => {
  const cleanedTitle = cleanSingleLine(title, 140)
  const cleanedReview = cleanLongText(review, 1200)
  const cleanedCredit = cleanSingleLine(credit, 140)

  if (!cleanedTitle || cleanedReview.length < 2 || !cleanedCredit) {
    throw new Error("Add a title, review, and credit before saving")
  }

  const now = new Date().toISOString()
  const entryId = `gallery_${Date.now()}_${randomUUID().slice(0, 8)}`
  const images = await saveGalleryImages(entryId, files)
  const entry: GalleryEntry = {
    id: entryId,
    createdAt: now,
    updatedAt: now,
    title: cleanedTitle,
    review: cleanedReview,
    credit: cleanedCredit,
    status,
    images: images.map((image, index) => ({
      ...image,
      alt: `${cleanedTitle}${images.length > 1 ? ` photo ${index + 1}` : ""}`,
    })),
  }

  const entries = await readGalleryEntries()
  await writeGalleryEntries([entry, ...entries])

  return createGalleryImageUrls(entry)
}

export const updateGalleryEntryStatus = async (entryId: string, status: GalleryEntryStatus) => {
  const entries = await readGalleryEntries()
  const existingEntry = entries.find((entry) => entry.id === entryId)

  if (!existingEntry) return null

  const updatedEntry = { ...existingEntry, status, updatedAt: new Date().toISOString() }
  await writeGalleryEntries(entries.map((entry) => (entry.id === entryId ? updatedEntry : entry)))

  return createGalleryImageUrls(updatedEntry)
}

export const deleteGalleryEntry = async (entryId: string) => {
  const entries = await readGalleryEntries()
  const existingEntry = entries.find((entry) => entry.id === entryId)

  if (!existingEntry) return false

  if (hasSupabaseAdmin() && existingEntry.images.length > 0) {
    const { error } = await getSupabaseAdmin()
      .storage
      .from(getGalleryBucket())
      .remove(existingEntry.images.map((image) => image.storagePath))

    if (error) {
      throw new Error(`Failed to delete gallery images: ${error.message}`)
    }
  } else if (process.env.NODE_ENV !== "production") {
    await Promise.all(
      existingEntry.images.map((image) =>
        fs.unlink(image.storagePath).catch((error: NodeJS.ErrnoException) => {
          if (error.code !== "ENOENT") throw error
        }),
      ),
    )
  }

  await writeGalleryEntries(entries.filter((entry) => entry.id !== entryId))
  return true
}
