import Link from "next/link"
import { CheckCircle2, Download, Image, Sparkles, XCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getArtworkManifest } from "@/lib/artwork-manifest"

export default function ArtworkReviewPage() {
  const manifest = getArtworkManifest()
  const existingCount = manifest.filter((item) => item.fileExists).length
  const missingCount = manifest.length - existingCount
  const launchItems = manifest.filter((item) => item.launchPriority)
  const launchExistingCount = launchItems.filter((item) => item.fileExists).length
  const launchMissingCount = launchItems.length - launchExistingCount
  const launchPreviewItems = launchItems.filter((item) => item.artworkPhase === "preview")
  const launchPreviewExistingCount = launchPreviewItems.filter((item) => item.fileExists).length
  const launchPreviewMissingCount = launchPreviewItems.length - launchPreviewExistingCount
  const groupedItems = Object.entries(
    manifest.reduce<Record<string, typeof manifest>>((groups, item) => {
      groups[item.storyTitle] = groups[item.storyTitle] || []
      groups[item.storyTitle].push(item)
      return groups
    }, {}),
  ).sort(([, firstItems], [, secondItems]) => {
    const firstPriority = firstItems[0]?.launchPriority ? 1 : 0
    const secondPriority = secondItems[0]?.launchPriority ? 1 : 0
    return secondPriority - firstPriority
  })

  return (
    <main className="min-h-screen bg-[#f6efe9] px-4 py-6 text-sky-950 sm:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-[2rem] border-4 border-sky-950 bg-white p-5 shadow-[8px_8px_0_rgba(8,47,73,0.18)] md:flex-row md:items-center md:justify-between">
          <div>
            <Badge className="mb-2 bg-amber-300 px-3 py-1 text-sky-950">Internal checklist</Badge>
            <h1 className="text-4xl font-black uppercase leading-tight sm:text-5xl">Artwork Review</h1>
            <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-slate-700">
              Track every final boy/girl story image, confirm which files exist, and use the briefs to create face-swap-ready artwork.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap md:justify-end">
            <Button asChild className="h-11 rounded-xl bg-amber-300 px-5 font-black text-sky-950 hover:bg-amber-200">
              <a href="/api/artwork-prompts.csv?missing=1&priority=1&phase=preview">
                <Sparkles className="h-4 w-4" />
                Preview CSV
              </a>
            </Button>
            <Button asChild className="h-11 rounded-xl bg-sky-500 px-5 font-black text-white hover:bg-sky-600">
              <a href="/api/artwork-prompts.csv?missing=1&priority=1">
                <Sparkles className="h-4 w-4" />
                Launch CSV
              </a>
            </Button>
            <Button asChild className="h-11 rounded-xl bg-rose-500 px-5 font-black text-white hover:bg-rose-600">
              <a href="/api/artwork-prompts.csv?missing=1">
                <Download className="h-4 w-4" />
                All Missing CSV
              </a>
            </Button>
            <Button asChild variant="outline" className="h-11 rounded-xl border-sky-200 bg-white px-5 font-black text-sky-700">
              <a href="/api/artwork-manifest?prompts=1&missing=1&priority=1&phase=preview">Preview JSON</a>
            </Button>
            <Button asChild variant="outline" className="h-11 rounded-xl border-sky-200 bg-white px-5 font-black text-sky-700">
              <Link href="/">Back to App</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <Card className="border-4 border-sky-950 bg-white p-5 shadow-[6px_6px_0_rgba(8,47,73,0.14)]">
            <div className="text-sm font-black uppercase tracking-widest text-sky-700">Total slots</div>
            <div className="mt-2 text-4xl font-black">{manifest.length}</div>
          </Card>
          <Card className="border-4 border-sky-950 bg-sky-50 p-5 shadow-[6px_6px_0_rgba(8,47,73,0.14)]">
            <div className="text-sm font-black uppercase tracking-widest text-sky-700">Preview missing</div>
            <div className="mt-2 text-4xl font-black text-sky-700">{launchPreviewMissingCount}</div>
            <p className="mt-1 text-xs font-black uppercase tracking-wide text-sky-700">
              {launchPreviewExistingCount} of {launchPreviewItems.length} found
            </p>
          </Card>
          <Card className="border-4 border-sky-950 bg-amber-50 p-5 shadow-[6px_6px_0_rgba(8,47,73,0.14)]">
            <div className="text-sm font-black uppercase tracking-widest text-amber-700">Launch missing</div>
            <div className="mt-2 text-4xl font-black text-amber-700">{launchMissingCount}</div>
            <p className="mt-1 text-xs font-black uppercase tracking-wide text-amber-700">
              {launchExistingCount} of {launchItems.length} found
            </p>
          </Card>
          <Card className="border-4 border-sky-950 bg-emerald-50 p-5 shadow-[6px_6px_0_rgba(8,47,73,0.14)]">
            <div className="text-sm font-black uppercase tracking-widest text-emerald-700">Files found</div>
            <div className="mt-2 text-4xl font-black text-emerald-700">{existingCount}</div>
          </Card>
          <Card className="border-4 border-sky-950 bg-rose-50 p-5 shadow-[6px_6px_0_rgba(8,47,73,0.14)]">
            <div className="text-sm font-black uppercase tracking-widest text-rose-700">Missing art</div>
            <div className="mt-2 text-4xl font-black text-rose-700">{missingCount}</div>
          </Card>
        </div>

        <div className="space-y-8">
          {groupedItems.map(([storyTitle, items]) => {
            const storyExistingCount = items.filter((item) => item.fileExists).length

            return (
              <section key={storyTitle} className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-black text-sky-950">{storyTitle}</h2>
                      {items[0]?.launchPriority ? (
                        <Badge className="bg-amber-300 text-sky-950">
                          <Sparkles className="h-3 w-3" />
                          Launch priority
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-sm font-bold text-slate-600">
                      {storyExistingCount} of {items.length} files found
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button asChild variant="outline" className="h-9 rounded-xl border-sky-200 bg-white px-4 font-black text-sky-700">
                      <a href={`/api/artwork-prompts.csv?missing=1&story=${items[0]?.storyId}`}>Story CSV</a>
                    </Button>
                    <Badge className={storyExistingCount === items.length ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}>
                      {storyExistingCount === items.length ? "Complete" : "Needs artwork"}
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {items.map((item) => (
                    <Card
                      key={`${item.storyId}-${item.pageId}-${item.gender}`}
                      className={`overflow-hidden border-4 p-0 shadow-[6px_6px_0_rgba(8,47,73,0.12)] ${
                        item.fileExists ? "border-sky-950 bg-white" : "border-rose-300 bg-rose-50"
                      }`}
                    >
                      <div className="relative aspect-[4/3] overflow-hidden border-b-4 border-sky-950 bg-[linear-gradient(135deg,#fef3c7_0%,#ccfbf1_50%,#dbeafe_100%)]">
                        {item.fileExists ? (
                          <img src={item.imagePath} alt={`${item.pageTitle} ${item.gender}`} className="h-full w-full object-cover" />
                        ) : (
                          <div className="grid h-full place-items-center p-5 text-center">
                            <div>
                              <Image className="mx-auto h-12 w-12 text-rose-500" />
                              <p className="mt-3 text-sm font-black uppercase tracking-wide text-rose-700">Missing image file</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3 p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="bg-amber-300 text-sky-950">Page {item.pageNumber}</Badge>
                          <Badge className={item.artworkPhase === "preview" ? "bg-sky-100 text-sky-800" : "bg-slate-100 text-slate-700"}>
                            {item.artworkPhase === "preview" ? "Preview" : "Full story"}
                          </Badge>
                          <Badge className={item.gender === "boy" ? "bg-sky-100 text-sky-800" : "bg-pink-100 text-pink-800"}>
                            {item.gender}
                          </Badge>
                          <Badge className={item.fileExists ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}>
                            {item.fileExists ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            {item.fileExists ? "Found" : "Missing"}
                          </Badge>
                        </div>

                        <div>
                          <h3 className="text-lg font-black text-sky-950">{item.pageTitle}</h3>
                          <p className="mt-1 break-all rounded-xl bg-white px-3 py-2 text-xs font-bold leading-5 text-slate-600">
                            {item.imagePath}
                          </p>
                        </div>

                        <details className="rounded-xl border-2 border-sky-100 bg-white p-3">
                          <summary className="cursor-pointer text-sm font-black text-sky-900">Generation brief</summary>
                          <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{item.imageBrief}</p>
                        </details>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </main>
  )
}
