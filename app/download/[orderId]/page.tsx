import Link from "next/link"
import { ArrowLeft, BookOpen, Download, Lock, Mail, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { resolveFullStoryPages } from "@/lib/full-story"
import { readOrders } from "@/lib/orders"
import { getStoryForCharacter, getStoryPathSummary, type StoryChoice, type StoryPathChoice } from "@/lib/stories"
import { PrintButton } from "./print-button"

type DownloadPageProps = {
  params: Promise<{
    orderId: string
  }>
}

const isPaid = (status: string) => status === "paid" || status === "paid_demo"
const pathTags: StoryChoice["pathTag"][] = ["brave", "kind", "clever", "teamwork"]

const normaliseChoices = (choices: { pageId: string; choiceId: string; pathTag?: string; text: string }[]) =>
  choices.filter((choice): choice is StoryPathChoice =>
    Boolean(choice.pathTag && pathTags.includes(choice.pathTag as StoryChoice["pathTag"])),
  )

export default async function DownloadPage({ params }: DownloadPageProps) {
  const { orderId } = await params
  const orders = await readOrders()
  const order = orders.find((savedOrder) => savedOrder.id === orderId)

  if (!order) {
    return (
      <main className="storybook-app-bg min-h-screen px-4 py-6 sm:py-8">
        <div className="mx-auto max-w-3xl">
          <Card className="border-4 border-sky-950 bg-white p-6 text-center shadow-[12px_12px_0_rgba(8,47,73,0.18)]">
            <Lock className="mx-auto h-12 w-12 text-rose-500" />
            <h1 className="mt-4 text-3xl font-black uppercase text-sky-950">Order not found</h1>
            <p className="mx-auto mt-3 max-w-lg text-sm font-bold leading-6 text-slate-700">
              This download link does not match an order. Please check the link in your confirmation email.
            </p>
            <Button asChild className="mt-5 h-11 rounded-xl bg-sky-500 px-5 font-black text-white hover:bg-sky-600">
              <Link href="/">Back to app</Link>
            </Button>
          </Card>
        </div>
      </main>
    )
  }

  if (!isPaid(order.status)) {
    return (
      <main className="storybook-app-bg min-h-screen px-4 py-6 sm:py-8">
        <div className="mx-auto max-w-3xl">
          <Card className="border-4 border-sky-950 bg-white p-6 text-center shadow-[12px_12px_0_rgba(8,47,73,0.18)]">
            <Lock className="mx-auto h-12 w-12 text-amber-600" />
            <Badge className="mt-4 bg-amber-100 px-3 py-1 text-amber-800">Payment pending</Badge>
            <h1 className="mt-4 text-3xl font-black uppercase text-sky-950">Download locked</h1>
            <p className="mx-auto mt-3 max-w-lg text-sm font-bold leading-6 text-slate-700">
              This story unlocks after payment is confirmed.
            </p>
            <Button
              asChild
              variant="outline"
              className="mt-5 h-11 rounded-xl border-sky-200 bg-white px-5 font-black text-sky-700"
            >
              <Link href="/checkout/cancel">Back to checkout help</Link>
            </Button>
          </Card>
        </div>
      </main>
    )
  }

  const story = getStoryForCharacter(order.storyId, {
    heroName: order.heroName,
    heroType: order.heroType,
  })
  const storyChoices = normaliseChoices(order.choices)
  const storyPages = resolveFullStoryPages(story, storyChoices)
  const artworkGender = order.gender === "girl" ? "girl" : "boy"
  const pathSummary = getStoryPathSummary(storyChoices)

  return (
    <main className="storybook-app-bg min-h-screen px-4 py-6 sm:py-8">
      <div className="mx-auto max-w-6xl space-y-6 full-story-print">
        <div className="no-print rounded-[2rem] border-4 border-sky-950 bg-white p-5 shadow-[8px_8px_0_rgba(8,47,73,0.18)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <Badge className="mb-2 bg-emerald-100 px-3 py-1 text-emerald-800">Your story is ready</Badge>
              <h1 className="text-3xl font-black uppercase leading-tight text-sky-950 sm:text-5xl">{story.title}</h1>
              <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-slate-700">
                Read it below, or use Download PDF to save a printable copy.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button asChild variant="outline" className="h-11 rounded-xl border-sky-200 bg-white px-5 font-black text-sky-700">
                <Link href="/">
                  <ArrowLeft className="h-4 w-4" />
                  App
                </Link>
              </Button>
              <PrintButton />
            </div>
          </div>
        </div>

        <section className="book-page print-page overflow-hidden rounded-[2rem] border-4 border-sky-950 bg-[#fffdf5] shadow-[12px_12px_0_rgba(8,47,73,0.18)]">
          <div className="book-cover-grid grid gap-0 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="grid min-h-[420px] place-items-center bg-[linear-gradient(135deg,#fef3c7_0%,#ccfbf1_50%,#dbeafe_100%)] p-8 text-center">
              <div>
                <div className="mx-auto grid h-28 w-28 place-items-center rounded-full bg-sky-400 text-6xl shadow-xl ring-4 ring-white">
                  <Download className="h-14 w-14 text-white" />
                </div>
                <h2 className="mt-6 text-4xl font-black uppercase leading-tight text-sky-950 sm:text-6xl">{story.title}</h2>
                <p className="mx-auto mt-4 max-w-md text-lg font-bold leading-7 text-slate-700">{story.subtitle}</p>
              </div>
            </div>
            <div className="space-y-4 border-t-4 border-sky-950 bg-white p-8 lg:border-l-4 lg:border-t-0">
              <h2 className="text-2xl font-black text-sky-950">Created for {order.heroName}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border-2 border-sky-100 bg-sky-50 p-4 text-sm font-bold leading-6 text-slate-700">
                  <Sparkles className="mb-2 h-5 w-5 text-sky-700" />
                  {story.lesson}
                </div>
                <div className="rounded-xl border-2 border-sky-100 bg-amber-50 p-4 text-sm font-bold leading-6 text-slate-700">
                  <BookOpen className="mb-2 h-5 w-5 text-amber-700" />
                  {pathSummary}
                </div>
              </div>
              <div className="rounded-xl border-2 border-sky-100 bg-[#fffdf5] p-4 text-sm font-semibold leading-6 text-slate-600">
                <div className="mb-2 flex items-center gap-2 font-black text-sky-950">
                  <Mail className="h-4 w-4" />
                  Order details
                </div>
                <p>Email: {order.email}</p>
                <p>Reference: {order.id}</p>
              </div>
            </div>
          </div>
        </section>

        {storyPages.map((page) => {
          const pageArtwork = page.artwork?.[artworkGender]

          return (
            <section
              key={page.id}
              className="book-page print-page overflow-hidden rounded-[2rem] border-4 border-sky-950 bg-[#fffdf5] p-4 shadow-[10px_10px_0_rgba(8,47,73,0.16)] sm:p-5"
            >
              <div className="mb-4 flex flex-col gap-3 border-b-4 border-sky-950 pb-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <Badge className="mb-2 bg-amber-300 px-3 py-1 text-sky-950">Page {page.pageNumber}</Badge>
                  <h2 className="text-3xl font-black uppercase leading-tight text-sky-950">{page.title}</h2>
                </div>
                <div className="rounded-xl border-4 border-sky-950 bg-yellow-300 px-4 py-2 text-2xl font-black text-sky-950 shadow-[4px_4px_0_rgba(8,47,73,0.14)]">
                  {page.sound}
                </div>
              </div>

              <div className="book-page-body grid gap-4 lg:grid-cols-[1fr_0.85fr]">
                <div className="book-art relative min-h-[430px] overflow-hidden rounded-2xl border-4 border-sky-950 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.85)_0_10%,transparent_11%),linear-gradient(135deg,#fef3c7_0%,#ffe4e6_45%,#bae6fd_100%)] bg-[length:32px_32px,auto] p-5">
                  {pageArtwork && (
                    <img
                      src={pageArtwork}
                      alt={`${story.title}: ${page.title}`}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )}
                  {pageArtwork && <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.18)_62%,rgba(255,255,255,0.72)_100%)]" />}
                  <div className="relative grid h-full min-h-[390px] place-items-center text-center" />
                </div>

                <div className="book-copy-column grid gap-4">
                  <div className="book-scene-text rounded-2xl border-4 border-sky-950 bg-white p-5 shadow-[5px_5px_0_rgba(8,47,73,0.12)]">
                    <div className="mb-2 inline-flex border-2 border-sky-950 bg-sky-100 px-3 py-1 text-xs font-black uppercase text-sky-950">
                      Story
                    </div>
                    <p className="text-lg font-black leading-8 text-sky-950">{page.scene}</p>
                  </div>

                  <div className="book-panels grid gap-4">
                    {page.panels.map((panel, index) => (
                      <div key={`${page.id}-${panel}`} className="book-panel rounded-2xl border-4 border-sky-950 bg-white p-4 shadow-[5px_5px_0_rgba(8,47,73,0.12)]">
                        <div className="mb-2 inline-flex border-2 border-sky-950 bg-amber-200 px-3 py-1 text-xs font-black uppercase text-sky-950">
                          Beat {index + 1}
                        </div>
                        <p className="text-base font-bold leading-7 text-slate-700">{panel}</p>
                        {page.speech[index] && (
                          <div className="mt-3 rounded-[1.5rem] rounded-bl-sm border-2 border-sky-900 bg-amber-50 px-4 py-3 text-base font-black text-sky-950">
                            "{page.speech[index]}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )
        })}
      </div>
    </main>
  )
}
