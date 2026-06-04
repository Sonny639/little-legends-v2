"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react"

type GalleryEntry = {
  title: string
  images: Array<{
    src: string
    alt: string
  }>
  review: string
  credit: string
}

type LightboxImage = {
  src: string
  alt: string
  title: string
}

export function GalleryEntryGrid({ entries }: { entries: GalleryEntry[] }) {
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null)
  const lightboxImages = useMemo<LightboxImage[]>(
    () =>
      entries.flatMap((entry) =>
        entry.images.slice(0, 4).map((image) => ({
          src: image.src,
          alt: image.alt,
          title: entry.title,
        })),
      ),
    [entries],
  )
  const activeImage = activeImageIndex === null ? null : lightboxImages[activeImageIndex] || null

  useEffect(() => {
    if (!activeImage) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveImageIndex(null)
      }

      if (event.key === "ArrowLeft") {
        setActiveImageIndex((current) =>
          current === null ? current : (current - 1 + lightboxImages.length) % lightboxImages.length,
        )
      }

      if (event.key === "ArrowRight") {
        setActiveImageIndex((current) =>
          current === null ? current : (current + 1) % lightboxImages.length,
        )
      }
    }

    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [activeImage, lightboxImages.length])

  const openImage = (src: string) => {
    const nextIndex = lightboxImages.findIndex((image) => image.src === src)
    if (nextIndex >= 0) {
      setActiveImageIndex(nextIndex)
    }
  }

  const showPrevious = () => {
    setActiveImageIndex((current) =>
      current === null ? current : (current - 1 + lightboxImages.length) % lightboxImages.length,
    )
  }

  const showNext = () => {
    setActiveImageIndex((current) =>
      current === null ? current : (current + 1) % lightboxImages.length,
    )
  }

  return (
    <>
      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {entries.map((entry) => (
          <article key={entry.title} className="overflow-hidden rounded-3xl bg-white/85 shadow-sm">
            <div className={`grid gap-1 ${entry.images.length > 1 ? "grid-cols-2" : ""}`}>
              {entry.images.slice(0, 4).map((image, index) => (
                <button
                  key={image.src}
                  type="button"
                  onClick={() => openImage(image.src)}
                  className={`group relative block overflow-hidden bg-sky-950 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300 ${index === 0 && entry.images.length === 3 ? "col-span-2" : ""}`}
                  aria-label={`Enlarge ${image.alt}`}
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    className={`${entry.images.length > 1 ? "h-40" : "h-72"} w-full object-cover transition duration-200 group-hover:scale-[1.03] group-hover:opacity-90`}
                  />
                  <span className="absolute bottom-2 right-2 grid h-9 w-9 place-items-center rounded-full bg-white/92 text-sky-900 opacity-0 shadow-md transition group-hover:opacity-100 group-focus-visible:opacity-100">
                    <ZoomIn className="h-4 w-4" />
                  </span>
                </button>
              ))}
            </div>
            <div className="p-4">
              <h2 className="text-lg font-black text-sky-950">{entry.title}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{entry.review}</p>
              <p className="mt-3 text-xs font-black uppercase tracking-widest text-rose-500">{entry.credit}</p>
            </div>
          </article>
        ))}
      </section>

      {activeImage && activeImageIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-sky-950/86 px-3 py-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Enlarged gallery photo">
          <button
            type="button"
            onClick={() => setActiveImageIndex(null)}
            className="absolute inset-0 cursor-zoom-out"
            aria-label="Close enlarged photo"
          />

          <div className="relative z-10 flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-[1.5rem] border-4 border-white bg-white shadow-[0_22px_80px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between gap-3 border-b border-sky-100 px-3 py-3 sm:px-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-sky-950">{activeImage.title}</p>
                <p className="text-xs font-bold text-slate-500">
                  Photo {activeImageIndex + 1} of {lightboxImages.length}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveImageIndex(null)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-sky-100 bg-white text-sky-900 transition hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200"
                aria-label="Close enlarged photo"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative grid min-h-0 flex-1 place-items-center bg-sky-950">
              <img
                src={activeImage.src}
                alt={activeImage.alt}
                className="max-h-[78svh] w-full object-contain"
              />

              {lightboxImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={showPrevious}
                    className="absolute left-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/92 text-sky-900 shadow-lg transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 sm:left-4"
                    aria-label="Previous gallery photo"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={showNext}
                    className="absolute right-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/92 text-sky-900 shadow-lg transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 sm:right-4"
                    aria-label="Next gallery photo"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
