"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Camera, Eye, EyeOff, ImagePlus, Loader2, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AdminShell } from "../admin-shell"

type GalleryEntryStatus = "draft" | "published"

type AdminGalleryEntry = {
  id: string
  createdAt: string
  title: string
  review: string
  credit: string
  status: GalleryEntryStatus
  images: Array<{
    id: string
    src: string
    alt: string
    name: string
  }>
}

const maxGalleryFileCount = 4
const maxOptimisedImageBytes = 950 * 1024
const maxOptimisedUploadBytes = 3.8 * 1024 * 1024
const imageQualitySteps = [0.82, 0.74, 0.66, 0.58]
const imageMaxEdgeSteps = [1600, 1400, 1200, 1000]

const statusStyles: Record<GalleryEntryStatus, string> = {
  draft: "bg-amber-100 text-amber-900",
  published: "bg-emerald-100 text-emerald-800",
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))

const readJsonResponse = async (response: Response) => {
  const text = await response.text()

  if (!text) return {}

  try {
    return JSON.parse(text)
  } catch {
    return {
      error:
        response.status === 413 || /request entity too large|body exceeded|too large/i.test(text)
          ? "Those photos are too large to upload together. The admin page now optimises images first, so please select the photos again and try once more."
          : text.slice(0, 180) || "The server returned an unreadable response.",
    }
  }
}

const loadImage = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error(`Could not read ${file.name || "that image"}. Try a JPG, PNG, or WEBP file.`))
    }
    image.src = objectUrl
  })

const canvasToBlob = (canvas: HTMLCanvasElement, quality: number) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error("Could not prepare the gallery image."))
        }
      },
      "image/jpeg",
      quality,
    )
  })

const optimiseGalleryImage = async (file: File) => {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files can be added to the gallery.")
  }

  const image = await loadImage(file)
  let bestBlob: Blob | null = null

  for (const maxEdge of imageMaxEdgeSteps) {
    const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight))
    const width = Math.max(1, Math.round(image.naturalWidth * scale))
    const height = Math.max(1, Math.round(image.naturalHeight * scale))
    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d")

    if (!context) {
      throw new Error("This browser could not prepare the gallery images.")
    }

    canvas.width = width
    canvas.height = height
    context.fillStyle = "#ffffff"
    context.fillRect(0, 0, width, height)
    context.drawImage(image, 0, 0, width, height)

    for (const quality of imageQualitySteps) {
      const blob = await canvasToBlob(canvas, quality)
      bestBlob = blob

      if (blob.size <= maxOptimisedImageBytes) {
        const baseName = (file.name || "gallery-photo").replace(/\.[^.]+$/, "")
        return new File([blob], `${baseName}.jpg`, { type: "image/jpeg", lastModified: Date.now() })
      }
    }
  }

  if (!bestBlob) {
    throw new Error("Could not prepare the gallery images.")
  }

  const baseName = (file.name || "gallery-photo").replace(/\.[^.]+$/, "")
  return new File([bestBlob], `${baseName}.jpg`, { type: "image/jpeg", lastModified: Date.now() })
}

const optimiseGalleryImages = async (files: File[]) => {
  const optimisedFiles = await Promise.all(files.slice(0, maxGalleryFileCount).map(optimiseGalleryImage))
  const totalBytes = optimisedFiles.reduce((total, file) => total + file.size, 0)

  if (totalBytes > maxOptimisedUploadBytes) {
    throw new Error("Those photos are still too large together. Try uploading fewer photos, or crop them slightly before selecting them.")
  }

  return optimisedFiles
}

export default function AdminGalleryPage() {
  const [entries, setEntries] = useState<AdminGalleryEntry[]>([])
  const [title, setTitle] = useState("")
  const [review, setReview] = useState("")
  const [credit, setCredit] = useState("")
  const [publishNow, setPublishNow] = useState(true)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const previewUrls = useMemo(() => selectedFiles.map((file) => URL.createObjectURL(file)), [selectedFiles])

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [previewUrls])

  const loadEntries = async () => {
    setIsLoading(true)
    setMessage("")

    try {
      const response = await fetch("/api/gallery", { cache: "no-store" })
      if (!response.ok) throw new Error("Failed to load gallery")
      const data = await response.json()
      setEntries(Array.isArray(data.entries) ? data.entries : [])
    } catch {
      setMessage("Could not load gallery posts.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadEntries()
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    setIsSaving(true)
    setMessage("Optimising photos for upload...")

    try {
      const optimisedFiles = await optimiseGalleryImages(selectedFiles)
      const formData = new FormData()
      formData.set("title", title)
      formData.set("review", review)
      formData.set("credit", credit)
      formData.set("status", publishNow ? "published" : "draft")
      optimisedFiles.forEach((file) => formData.append("images", file))

      const response = await fetch("/api/gallery", {
        method: "POST",
        body: formData,
      })
      const data = await readJsonResponse(response)

      if (!response.ok) {
        throw new Error(data.error || "Could not save gallery post")
      }

      setEntries((current) => [data.entry, ...current])
      setTitle("")
      setReview("")
      setCredit("")
      setPublishNow(true)
      setSelectedFiles([])
      form.reset()
      setMessage(data.entry.status === "published" ? "Gallery post published." : "Gallery post saved as draft.")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save gallery post.")
    } finally {
      setIsSaving(false)
    }
  }

  const updateStatus = async (entryId: string, status: GalleryEntryStatus) => {
    setMessage("")

    try {
      const response = await fetch("/api/gallery", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId, status }),
      })
      const data = await readJsonResponse(response)

      if (!response.ok) throw new Error(data.error || "Could not update gallery post")

      setEntries((current) => current.map((entry) => (entry.id === entryId ? data.entry : entry)))
      setMessage(status === "published" ? "Gallery post is now live." : "Gallery post hidden from the public page.")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update gallery post.")
    }
  }

  const deleteEntry = async (entry: AdminGalleryEntry) => {
    if (!window.confirm(`Delete "${entry.title}" from the gallery? This cannot be undone.`)) return

    setMessage("")

    try {
      const response = await fetch(`/api/gallery?entryId=${encodeURIComponent(entry.id)}`, { method: "DELETE" })
      const data = await readJsonResponse(response)

      if (!response.ok) throw new Error(data.error || "Could not delete gallery post")

      setEntries((current) => current.filter((candidate) => candidate.id !== entry.id))
      setMessage("Gallery post deleted.")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not delete gallery post.")
    }
  }

  return (
    <AdminShell>
      <Card className="border-4 border-sky-950 bg-white p-5 shadow-[8px_8px_0_rgba(8,47,73,0.14)]">
        <Badge className="mb-2 bg-fuchsia-100 px-3 py-1 text-fuchsia-800">Approved customer photos</Badge>
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <h2 className="text-3xl font-black text-sky-950">Gallery Publisher</h2>
            <p className="mt-1 text-sm font-bold text-slate-700">
              Upload approved book photos and review text here. Parents can submit photos, but only posts saved here can appear publicly.
            </p>
          </div>
          <Button asChild variant="outline" className="h-10 rounded-xl border-sky-100 bg-white px-4 font-black text-sky-700">
            <Link href="/gallery" target="_blank">
              <Eye className="h-4 w-4" />
              View public gallery
            </Link>
          </Button>
        </div>
      </Card>

      {message && <Card className="border-4 border-amber-300 bg-amber-50 p-4 text-sm font-black text-amber-900">{message}</Card>}

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-4 border-sky-950 bg-[#fffdf5] p-5 shadow-[8px_8px_0_rgba(8,47,73,0.14)]">
          <div className="mb-4 flex items-center gap-2">
            <ImagePlus className="h-6 w-6 text-fuchsia-600" />
            <h3 className="text-2xl font-black text-sky-950">Add Gallery Post</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gallery-title" className="font-black text-sky-950">Title</Label>
              <Input
                id="gallery-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Oliver's finished hardback"
                className="h-11 rounded-xl border-2 border-sky-100 bg-white font-bold"
                maxLength={140}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gallery-review" className="font-black text-sky-950">Review or caption</Label>
              <textarea
                id="gallery-review"
                value={review}
                onChange={(event) => setReview(event.target.value)}
                placeholder="Paste the parent review or write a short caption..."
                className="min-h-32 w-full rounded-xl border-2 border-sky-100 bg-white px-3 py-2 text-sm font-semibold leading-6 text-slate-800 outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                maxLength={1200}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gallery-credit" className="font-black text-sky-950">Credit / permission line</Label>
              <Input
                id="gallery-credit"
                value={credit}
                onChange={(event) => setCredit(event.target.value)}
                placeholder="Shared with permission by Oliver's family"
                className="h-11 rounded-xl border-2 border-sky-100 bg-white font-bold"
                maxLength={140}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gallery-images" className="font-black text-sky-950">Photos</Label>
              <Input
                id="gallery-images"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(event) => {
                  const files = Array.from(event.target.files || []).slice(0, maxGalleryFileCount)
                  setSelectedFiles(files)
                  if (files.length > 0) {
                    setMessage("Photos selected. They will be optimised automatically before publishing.")
                  }
                }}
                className="h-auto rounded-xl border-2 border-sky-100 bg-white py-3 font-bold"
                required
              />
              <p className="text-xs font-bold text-slate-600">Add 1 to 4 approved JPG, PNG, or WEBP photos. Large phone photos are resized automatically before upload.</p>
            </div>

            {previewUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {previewUrls.slice(0, 4).map((url, index) => (
                  <img key={url} src={url} alt={`Selected gallery preview ${index + 1}`} className="h-32 w-full rounded-2xl object-cover" />
                ))}
              </div>
            )}

            <label className="flex items-center gap-3 rounded-2xl border-2 border-emerald-100 bg-emerald-50 p-3 text-sm font-black text-emerald-800">
              <input
                type="checkbox"
                checked={publishNow}
                onChange={(event) => setPublishNow(event.target.checked)}
                className="h-5 w-5"
              />
              Publish immediately on the public gallery
            </label>

            <Button
              type="submit"
              disabled={isSaving}
              className="h-12 w-full rounded-full bg-gradient-to-r from-fuchsia-500 to-sky-500 px-6 font-black text-white hover:from-fuchsia-600 hover:to-sky-600"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
              {publishNow ? "Publish gallery post" : "Save as draft"}
            </Button>
          </form>
        </Card>

        <div className="space-y-4">
          <Card className="border-4 border-sky-950 bg-white p-5 shadow-[8px_8px_0_rgba(8,47,73,0.14)]">
            <h3 className="text-2xl font-black text-sky-950">Current Gallery Posts</h3>
            <p className="mt-1 text-sm font-bold text-slate-700">
              Published posts are visible on /gallery. Drafts stay private here.
            </p>
          </Card>

          {isLoading ? (
            <Card className="border-4 border-sky-950 bg-white p-8 text-center shadow-[8px_8px_0_rgba(8,47,73,0.14)]">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-sky-700" />
              <h3 className="mt-3 text-2xl font-black text-sky-950">Loading gallery</h3>
            </Card>
          ) : entries.length === 0 ? (
            <Card className="border-4 border-sky-950 bg-white p-8 text-center shadow-[8px_8px_0_rgba(8,47,73,0.14)]">
              <Camera className="mx-auto h-10 w-10 text-sky-700" />
              <h3 className="mt-3 text-2xl font-black text-sky-950">No gallery posts yet</h3>
              <p className="mt-2 text-sm font-bold text-slate-700">Your first approved customer photos will appear here after saving.</p>
            </Card>
          ) : (
            entries.map((entry) => (
              <Card key={entry.id} className="border-4 border-sky-950 bg-[#fffdf5] p-4 shadow-[8px_8px_0_rgba(8,47,73,0.14)]">
                <div className="grid gap-4 lg:grid-cols-[13rem_1fr]">
                  <div className={`grid gap-1 overflow-hidden rounded-2xl bg-white ${entry.images.length > 1 ? "grid-cols-2" : ""}`}>
                    {entry.images.slice(0, 4).map((image, index) => (
                      <img
                        key={image.id}
                        src={image.src}
                        alt={image.alt}
                        className={`${entry.images.length > 1 ? "h-24" : "h-48"} w-full object-cover ${index === 0 && entry.images.length === 3 ? "col-span-2" : ""}`}
                      />
                    ))}
                  </div>
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge className={statusStyles[entry.status]}>{entry.status}</Badge>
                      <Badge className="bg-sky-100 text-sky-800">{formatDate(entry.createdAt)}</Badge>
                    </div>
                    <h4 className="text-xl font-black text-sky-950">{entry.title}</h4>
                    <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">{entry.review}</p>
                    <p className="mt-3 text-xs font-black uppercase tracking-widest text-rose-500">{entry.credit}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {entry.status === "published" ? (
                        <Button onClick={() => updateStatus(entry.id, "draft")} variant="outline" className="h-10 rounded-xl border-amber-100 bg-white px-4 font-black text-amber-700">
                          <EyeOff className="h-4 w-4" />
                          Hide
                        </Button>
                      ) : (
                        <Button onClick={() => updateStatus(entry.id, "published")} variant="outline" className="h-10 rounded-xl border-emerald-100 bg-white px-4 font-black text-emerald-700">
                          <Eye className="h-4 w-4" />
                          Publish
                        </Button>
                      )}
                      <Button onClick={() => deleteEntry(entry)} variant="outline" className="h-10 rounded-xl border-rose-100 bg-white px-4 font-black text-rose-600">
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminShell>
  )
}
