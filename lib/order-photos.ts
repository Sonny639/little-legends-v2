import fs from "fs/promises"
import path from "path"

import { getSupabaseAdmin, hasSupabaseAdmin } from "@/lib/supabase-admin"

export type StoredOrderPhoto = {
  name: string
  size: number
  mimeType: string
  storagePath: string
  uploadedAt: string
  source: "supabase" | "local"
}

export type ListedOrderPhoto = StoredOrderPhoto & {
  url?: string
}

const localPhotoDirectory = path.join(process.cwd(), "data", "order-photos")
const maxPhotoCount = 3
const maxPhotoSizeBytes = 8 * 1024 * 1024
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"])

const sanitizeFileName = (fileName: string) =>
  fileName
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^\.+/, "")
    .slice(0, 120) || "photo"

const ensureLocalOrderDirectory = async (orderId: string) => {
  const orderDirectory = path.join(localPhotoDirectory, orderId)
  await fs.mkdir(orderDirectory, { recursive: true })
  return orderDirectory
}

const getStorageBucket = () => process.env.SUPABASE_STORAGE_BUCKET || "order-photos"

const getMimeTypeFromName = (fileName: string) => {
  const extension = path.extname(fileName).toLowerCase()

  if (extension === ".png") return "image/png"
  if (extension === ".webp") return "image/webp"
  if (extension === ".heic") return "image/heic"
  if (extension === ".heif") return "image/heif"
  return "image/jpeg"
}

export const isPhotoStorageConfigured = () => hasSupabaseAdmin() || process.env.NODE_ENV !== "production"

export const validateOrderPhotos = (files: File[]) => {
  if (files.length === 0) {
    throw new Error("At least one photo is required")
  }

  if (files.length > maxPhotoCount) {
    throw new Error(`You can upload up to ${maxPhotoCount} photos`)
  }

  for (const file of files) {
    if (!allowedMimeTypes.has(file.type)) {
      throw new Error("Only JPG, PNG, WEBP, and HEIC photos are supported")
    }

    if (file.size > maxPhotoSizeBytes) {
      throw new Error("Each photo must be 8MB or smaller")
    }
  }
}

export const saveOrderPhotos = async (orderId: string, files: File[]): Promise<StoredOrderPhoto[]> => {
  validateOrderPhotos(files)

  if (hasSupabaseAdmin()) {
    const bucket = getStorageBucket()
    const client = getSupabaseAdmin()
    const uploadedAt = new Date().toISOString()
    const storedPhotos: StoredOrderPhoto[] = []

    for (const [index, file] of files.entries()) {
      const extension = path.extname(file.name || "").toLowerCase()
      const safeName = sanitizeFileName(file.name || `photo-${index + 1}${extension || ".jpg"}`)
      const storagePath = `${orderId}/${String(index + 1).padStart(2, "0")}-${Date.now()}-${safeName}`
      const buffer = Buffer.from(await file.arrayBuffer())

      const { error } = await client.storage.from(bucket).upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

      if (error) {
        throw new Error(`Failed to upload order photo: ${error.message}`)
      }

      storedPhotos.push({
        name: file.name,
        size: file.size,
        mimeType: file.type,
        storagePath,
        uploadedAt,
        source: "supabase",
      })
    }

    return storedPhotos
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Photo storage is not configured for production")
  }

  const orderDirectory = await ensureLocalOrderDirectory(orderId)
  const uploadedAt = new Date().toISOString()

  return Promise.all(
    files.map(async (file, index) => {
      const extension = path.extname(file.name || "").toLowerCase()
      const safeName = sanitizeFileName(file.name || `photo-${index + 1}${extension || ".jpg"}`)
      const storagePath = path.join(orderDirectory, `${String(index + 1).padStart(2, "0")}-${safeName}`)
      const buffer = Buffer.from(await file.arrayBuffer())

      await fs.writeFile(storagePath, buffer)

      return {
        name: file.name,
        size: file.size,
        mimeType: file.type,
        storagePath,
        uploadedAt,
        source: "local" as const,
      }
    }),
  )
}

export const listOrderPhotos = async (orderId: string): Promise<StoredOrderPhoto[]> => {
  if (hasSupabaseAdmin()) {
    const bucket = getStorageBucket()
    const client = getSupabaseAdmin()
    const { data, error } = await client.storage.from(bucket).list(orderId, {
      limit: maxPhotoCount,
      sortBy: { column: "name", order: "asc" },
    })

    if (error) {
      throw new Error(`Failed to read order photos: ${error.message}`)
    }

    return (data || [])
      .filter((item) => item.name)
      .map((item) => ({
        name: item.name,
        size: item.metadata?.size || 0,
        mimeType: item.metadata?.mimetype || getMimeTypeFromName(item.name),
        storagePath: `${orderId}/${item.name}`,
        uploadedAt: item.created_at || new Date().toISOString(),
        source: "supabase" as const,
      }))
  }

  if (process.env.NODE_ENV === "production") {
    return []
  }

  const orderDirectory = path.join(localPhotoDirectory, orderId)

  try {
    const entries = await fs.readdir(orderDirectory)
    const imageEntries = entries
      .filter((entry) => /\.(jpe?g|png|webp|heic|heif)$/i.test(entry))
      .sort((a, b) => a.localeCompare(b))
      .slice(0, maxPhotoCount)

    return Promise.all(
      imageEntries.map(async (entry) => {
        const storagePath = path.join(orderDirectory, entry)
        const stats = await fs.stat(storagePath)

        return {
          name: entry,
          size: stats.size,
          mimeType: getMimeTypeFromName(entry),
          storagePath,
          uploadedAt: stats.birthtime.toISOString(),
          source: "local" as const,
        }
      }),
    )
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code
    if (code === "ENOENT") {
      return []
    }

    throw error
  }
}

export const createOrderPhotoPreviewLinks = async (
  photos: StoredOrderPhoto[],
  expiresInSeconds = 60 * 60,
): Promise<ListedOrderPhoto[]> => {
  if (photos.length === 0) {
    return []
  }

  if (hasSupabaseAdmin()) {
    const bucket = getStorageBucket()
    const client = getSupabaseAdmin()
    const { data, error } = await client.storage
      .from(bucket)
      .createSignedUrls(
        photos.map((photo) => photo.storagePath),
        expiresInSeconds,
      )

    if (error) {
      throw new Error(`Failed to create photo preview links: ${error.message}`)
    }

    return photos.map((photo, index) => ({
      ...photo,
      url: data?.[index]?.signedUrl || "",
    }))
  }

  if (process.env.NODE_ENV === "production") {
    return photos
  }

  return Promise.all(
    photos.map(async (photo) => {
      const buffer = await fs.readFile(photo.storagePath)

      return {
        ...photo,
        url: `data:${photo.mimeType};base64,${buffer.toString("base64")}`,
      }
    }),
  )
}
