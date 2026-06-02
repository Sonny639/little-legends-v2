import Link from "next/link"
import { ArrowLeft, Camera, Heart, Mail, ShieldCheck, Sparkles, Star } from "lucide-react"

import { SocialFollowStrip } from "@/components/social-follow-strip"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { GallerySubmissionForm } from "@/app/gallery/gallery-submission-form"
import { readPublishedGalleryEntries } from "@/lib/gallery"

export const dynamic = "force-dynamic"

const shareSteps = [
  {
    title: "Upload your photos",
    text: "Send up to four book photos with a short review and your order reference if you have it.",
    icon: Mail,
  },
  {
    title: "We check permission",
    text: "We will only share photos or names you clearly say are okay to publish.",
    icon: ShieldCheck,
  },
  {
    title: "Approved stories appear here",
    text: "Once approved, we can add your review and book photos to this page.",
    icon: Heart,
  },
]

const galleryPlaceholders = [
  {
    title: "Finished hardback photos",
    text: "Real customer book photos can be added here once parents send them in and approve sharing.",
  },
  {
    title: "Bedtime smiles",
    text: "Parents can share a favourite reading moment, first reaction, or gift-opening photo.",
  },
  {
    title: "Kind words",
    text: "Short reviews help other families see what the finished Little Legends experience feels like.",
  },
]

export default async function GalleryPage() {
  const galleryEntries = await readPublishedGalleryEntries().catch((error) => {
    console.error("Failed to load published gallery entries:", error)
    return []
  })

  return (
    <main className="storybook-app-bg min-h-screen px-4 pb-24 pt-4 md:py-6">
      <SocialFollowStrip />
      <div className="mx-auto max-w-6xl">
        <Card className="storybook-panel overflow-hidden p-4 sm:p-6">
          <Button asChild variant="outline" className="mb-5 h-9 rounded-xl border-sky-200 bg-white px-4 font-black text-sky-700">
            <Link href="/create">
              <ArrowLeft className="h-4 w-4" />
              Back to app
            </Link>
          </Button>

          <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-sky-700">Little Legends Story</p>
              <h1 className="mt-2 text-4xl font-black leading-tight text-sky-950 sm:text-5xl">
                Gallery & Reviews
              </h1>
              <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-slate-700 sm:text-lg">
                A little home for finished books, parent reviews, and magical reading moments shared by Little Legends families.
              </p>
              <div className="mt-5 rounded-3xl border-2 border-amber-100 bg-amber-50/90 p-4 text-sm font-bold leading-6 text-amber-950 sm:p-5">
                Want to share yours? Use the upload form below, or email photos and a short review to{" "}
                <a href="mailto:hello@littlelegendsstory.com?subject=Little%20Legends%20gallery%20submission" className="font-black text-sky-700 underline-offset-4 hover:underline">
                  hello@littlelegendsstory.com
                </a>
                . Please only send images you are happy for us to review, and tell us exactly what we may publish.
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] border-4 border-white bg-white shadow-[0_22px_65px_rgba(8,47,73,0.16)]">
              <img
                src="/little-legends-reading-hero-family.png"
                alt="A family reading a Little Legends storybook together"
                className="h-72 w-full object-cover sm:h-96"
              />
              <div className="absolute inset-x-4 bottom-4 rounded-3xl border border-white/70 bg-white/90 p-4 shadow-lg backdrop-blur">
                <div className="flex items-center gap-2 text-sm font-black text-sky-950">
                  <Star className="h-5 w-5 fill-amber-300 text-amber-400" />
                  Real customer photos and reviews
                </div>
                <p className="mt-1 text-sm font-semibold leading-5 text-slate-700">
                  Approved family photos and reviews can be added here whenever you are ready.
                </p>
              </div>
            </div>
          </section>

          {galleryEntries.length > 0 && (
            <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {galleryEntries.map((entry) => (
                <article key={entry.title} className="overflow-hidden rounded-3xl bg-white/85 shadow-sm">
                  <div className={`grid gap-1 ${entry.images.length > 1 ? "grid-cols-2" : ""}`}>
                    {entry.images.slice(0, 4).map((image, index) => (
                      <img
                        key={image.src}
                        src={image.src}
                        alt={image.alt}
                        className={`${entry.images.length > 1 ? "h-40" : "h-72"} w-full object-cover ${index === 0 && entry.images.length === 3 ? "col-span-2" : ""}`}
                      />
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
          )}

          <section className="mt-6 grid gap-4 md:grid-cols-3">
            {galleryPlaceholders.map(({ title, text }) => (
              <div key={title} className="rounded-3xl bg-white/80 p-4 shadow-sm">
                <div className="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-rose-100 text-rose-600">
                  <Camera className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-black text-sky-950">{title}</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{text}</p>
              </div>
            ))}
          </section>

          <GallerySubmissionForm />

          <section className="mt-6 rounded-[2rem] border-2 border-sky-100 bg-sky-50/80 p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-fuchsia-500" />
              <h2 className="text-2xl font-black text-sky-950">How Sharing Works</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {shareSteps.map(({ title, text, icon: Icon }) => (
                <div key={title} className="rounded-3xl bg-white/85 p-4">
                  <Icon className="h-6 w-6 text-sky-700" />
                  <h3 className="mt-3 text-base font-black text-sky-950">{title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-6 flex flex-col gap-3 rounded-[2rem] border-2 border-rose-100 bg-white/85 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <h2 className="text-xl font-black text-sky-950">Share your Little Legend</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
                Prefer email? A book photo, a happy reaction, or a short review is perfect.
              </p>
            </div>
            <Button asChild className="h-11 rounded-full bg-gradient-to-r from-fuchsia-500 to-sky-500 px-6 font-black text-white hover:from-fuchsia-600 hover:to-sky-600">
              <a href="mailto:hello@littlelegendsstory.com?subject=Little%20Legends%20gallery%20submission">
                <Mail className="h-4 w-4" />
                Email your story
              </a>
            </Button>
          </section>
        </Card>
      </div>
    </main>
  )
}
