"use client"

import { FormEvent, useMemo, useState } from "react"
import { Camera, CheckCircle2, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const maxPhotos = 4

export function GallerySubmissionForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [orderReference, setOrderReference] = useState("")
  const [review, setReview] = useState("")
  const [permission, setPermission] = useState(false)
  const [photos, setPhotos] = useState<File[]>([])
  const [status, setStatus] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const photoLabel = useMemo(() => {
    if (!photos.length) return "No photos selected yet"
    return photos.map((photo) => photo.name).join(", ")
  }, [photos])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setStatus("")

    try {
      const payload = new FormData()
      payload.set("name", name)
      payload.set("email", email)
      payload.set("orderReference", orderReference)
      payload.set("review", review)
      payload.set("permission", permission ? "yes" : "no")
      photos.forEach((photo) => payload.append("photos", photo))

      const response = await fetch("/api/gallery-submissions", {
        method: "POST",
        body: payload,
      })
      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(typeof result.error === "string" ? result.error : "Could not send gallery submission")
      }

      setName("")
      setEmail("")
      setOrderReference("")
      setReview("")
      setPermission(false)
      setPhotos([])
      event.currentTarget.reset()
      setStatus("Thanks, your photos and review have been sent for approval.")
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not send gallery submission. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 rounded-[2rem] border-2 border-amber-100 bg-white/88 p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <Camera className="h-5 w-5 text-rose-500" />
        <h2 className="text-2xl font-black text-sky-950">Send Photos & A Review</h2>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="gallery-name" className="font-black text-sky-950">Name</Label>
          <Input
            id="gallery-name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-11 rounded-xl border-2 border-sky-100 bg-white font-semibold"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gallery-email" className="font-black text-sky-950">Email</Label>
          <Input
            id="gallery-email"
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-11 rounded-xl border-2 border-sky-100 bg-white font-semibold"
          />
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <Label htmlFor="gallery-reference" className="font-black text-sky-950">Order number, if applicable</Label>
        <Input
          id="gallery-reference"
          value={orderReference}
          onChange={(event) => setOrderReference(event.target.value)}
          placeholder="e.g. order_123 or Stripe reference"
          className="h-11 rounded-xl border-2 border-sky-100 bg-white font-semibold"
        />
      </div>

      <div className="mt-3 space-y-2">
        <Label htmlFor="gallery-review" className="font-black text-sky-950">Review or caption</Label>
        <textarea
          id="gallery-review"
          required
          value={review}
          onChange={(event) => setReview(event.target.value)}
          placeholder="Tell us what you thought of your book, or what moment the photo shows."
          className="min-h-28 w-full rounded-xl border-2 border-sky-100 bg-white px-3 py-3 text-base font-semibold outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
      </div>

      <div className="mt-3 space-y-2">
        <Label htmlFor="gallery-photos" className="font-black text-sky-950">Photos</Label>
        <Input
          id="gallery-photos"
          required
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          onChange={(event) => {
            const selectedPhotos = Array.from(event.target.files || []).slice(0, maxPhotos)
            setPhotos(selectedPhotos)
          }}
          className="h-auto rounded-xl border-2 border-sky-100 bg-white py-3 font-semibold"
        />
        <p className="text-xs font-bold leading-5 text-slate-600">Upload up to {maxPhotos} JPG, PNG, or WebP photos. Each photo must be 2MB or smaller.</p>
        <p className="rounded-xl bg-sky-50 px-3 py-2 text-xs font-bold leading-5 text-sky-900">{photoLabel}</p>
      </div>

      <label className="mt-4 flex items-start gap-3 rounded-2xl border-2 border-rose-100 bg-rose-50/80 p-3 text-sm font-bold leading-6 text-rose-950">
        <input
          type="checkbox"
          required
          checked={permission}
          onChange={(event) => setPermission(event.target.checked)}
          className="mt-1 h-5 w-5 shrink-0 rounded border-rose-200"
        />
        <span>
          I am happy for Little Legends Story to review these photos and words for possible publication. I understand nothing will be posted publicly unless approved first.
        </span>
      </label>

      <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      {status && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border-2 border-sky-100 bg-sky-50 p-3 text-sm font-black leading-6 text-sky-900" role="status">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {status}
        </div>
      )}

      <Button disabled={isSubmitting || photos.length === 0} className="mt-4 h-11 w-full rounded-full bg-gradient-to-r from-fuchsia-500 to-sky-500 px-6 font-black text-white hover:from-fuchsia-600 hover:to-sky-600">
        <Send className="h-4 w-4" />
        {isSubmitting ? "Sending submission..." : "Send for approval"}
      </Button>
    </form>
  )
}
