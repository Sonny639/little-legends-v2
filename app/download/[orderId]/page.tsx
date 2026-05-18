import Link from "next/link"
import { cookies } from "next/headers"
import { Award, BookOpen, Compass, Heart, Home, Lock, Palette, Sparkles, Star } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { StoryArtPlaceholder } from "@/components/story-art-placeholder"
import { StoryPreparation } from "@/components/story-preparation"
import { adminSessionCookieName, getAdminSessionToken, isAdminAuthEnabled } from "@/lib/admin-auth"
import { artworkAssetPaths } from "@/lib/artwork-assets.generated"
import { resolveFullStoryPages } from "@/lib/full-story"
import {
  createOrderStoryArtworkLinks,
  getOrderStoryArtworkSummary,
  readOrderStoryArtworkManifest,
} from "@/lib/order-story-artwork"
import { readOrders } from "@/lib/orders"
import { getOrderAccessToken, hasValidOrderAccess } from "@/lib/order-access"
import { getStoryArtworkFallback } from "@/lib/story-artwork-fallbacks"
import { getStoryForCharacter, getStoryPathSummary, type StoryChoice, type StoryPathChoice } from "@/lib/stories"
import { PrintButton } from "./print-button"

type DownloadPageProps = {
  params: Promise<{
    orderId: string
  }>
  searchParams: Promise<{
    access?: string
  }>
}

const isPaid = (status: string) => status === "paid" || status === "paid_demo"
const pathTags: StoryChoice["pathTag"][] = ["brave", "kind", "clever", "teamwork"]
const artworkAssetPathSet = new Set<string>(artworkAssetPaths)

const publicAssetExists = (assetPath?: string) => Boolean(assetPath && artworkAssetPathSet.has(assetPath))

const resolveAvailableArtwork = (primaryPath?: string, fallbackPath?: string) => {
  if (publicAssetExists(primaryPath)) return primaryPath
  if (fallbackPath && fallbackPath !== primaryPath && publicAssetExists(fallbackPath)) return fallbackPath
  return null
}

const normaliseChoices = (choices: { pageId: string; choiceId: string; pathTag?: string; text: string }[]) =>
  choices.filter((choice): choice is StoryPathChoice =>
    Boolean(choice.pathTag && pathTags.includes(choice.pathTag as StoryChoice["pathTag"])),
  )

const getHeroInitials = (name?: string) =>
  (name || "Hero")
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

const printableTraitLabels: Record<StoryChoice["pathTag"], string> = {
  brave: "Brave",
  kind: "Kind",
  clever: "Clever",
  teamwork: "Teamwork",
}

export default async function DownloadPage({ params, searchParams }: DownloadPageProps) {
  const { orderId } = await params
  const { access } = await searchParams
  const cookieStore = await cookies()
  const hasAdminAccess =
    isAdminAuthEnabled() && cookieStore.get(adminSessionCookieName)?.value === (await getAdminSessionToken())
  const effectiveAccessToken = hasValidOrderAccess(orderId, access) ? access || "" : getOrderAccessToken(orderId)

  if (!hasValidOrderAccess(orderId, access) && !hasAdminAccess) {
    return (
      <main className="storybook-app-bg min-h-screen px-4 py-6 sm:py-8">
        <div className="mx-auto max-w-3xl">
          <Card className="border-4 border-sky-950 bg-white p-6 text-center shadow-[12px_12px_0_rgba(8,47,73,0.18)]">
            <Lock className="mx-auto h-12 w-12 text-rose-500" />
            <h1 className="mt-4 text-3xl font-black uppercase text-sky-950">Link expired</h1>
            <p className="mx-auto mt-3 max-w-lg text-sm font-bold leading-6 text-slate-700">
              This story link is missing its secure access code. Please open the latest link from your confirmation email.
            </p>
            <Button asChild className="mt-5 h-11 rounded-xl bg-sky-500 px-5 font-black text-white hover:bg-sky-600">
              <Link href="/contact">Contact support</Link>
            </Button>
          </Card>
        </div>
      </main>
    )
  }

  const ordersResult = await readOrders()
    .then((orders) => ({ orders, issue: "" }))
    .catch(() => ({
      orders: [],
      issue: "We could not load this order just now. Please try the link again shortly.",
    }))
  const orders = ordersResult.orders
  const order = orders.find((savedOrder) => savedOrder.id === orderId)

  if (ordersResult.issue) {
    return (
      <main className="storybook-app-bg min-h-screen px-4 py-6 sm:py-8">
        <div className="mx-auto max-w-3xl">
          <Card className="border-4 border-sky-950 bg-white p-6 text-center shadow-[12px_12px_0_rgba(8,47,73,0.18)]">
            <Lock className="mx-auto h-12 w-12 text-amber-600" />
            <h1 className="mt-4 text-3xl font-black uppercase text-sky-950">Story temporarily unavailable</h1>
            <p className="mx-auto mt-3 max-w-lg text-sm font-bold leading-6 text-slate-700">
              {ordersResult.issue}
            </p>
            <Button asChild className="mt-5 h-11 rounded-xl bg-sky-500 px-5 font-black text-white hover:bg-sky-600">
              <Link href="/contact">Contact support</Link>
            </Button>
          </Card>
        </div>
      </main>
    )
  }

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
              <Link href="/create">Back to app</Link>
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
              <Link href="/create">Back to app</Link>
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
  const fallbackArtworkPath = getStoryArtworkFallback(story.characterId, artworkGender)
  const rawArtworkManifest = await readOrderStoryArtworkManifest(order.id)
  const artworkManifest = rawArtworkManifest ? await createOrderStoryArtworkLinks(rawArtworkManifest) : null
  const artworkSummary = artworkManifest ? getOrderStoryArtworkSummary(artworkManifest) : null
  const personalizedArtworkByPage = new Map(
    artworkManifest?.pages
      .filter((page) => page.status === "ready" && page.imageUrl)
      .map((page) => [page.pageId, page.imageUrl]) || [],
  )
  const requiresPersonalizedArtwork = (order.photoCount || 0) > 0
  const personalizedArtworkReady = Boolean(artworkSummary?.complete)
  const coverArtworkPath = storyPages[0]?.artwork?.[artworkGender]
  const coverArtwork =
    personalizedArtworkByPage.get(storyPages[0]?.id || "") ||
    resolveAvailableArtwork(coverArtworkPath, fallbackArtworkPath)
  const heroMark = getHeroInitials(order.heroName)
  const isHardbackEdition = order.product === "hardback" || order.product === "upgrade"
  const hardbackFrontMatterPageCount = 5
  const hardbackBackMatterPageCount = 5
  const totalPrintEditionPages = isHardbackEdition
    ? 1 + hardbackFrontMatterPageCount + storyPages.length + 1 + hardbackBackMatterPageCount
    : storyPages.length + 2
  const qualityTags = isHardbackEdition
    ? ["Personalised", `${totalPrintEditionPages}-page keepsake edition`]
    : ["Personalised", story.readingAge, `${storyPages.length} story pages`]
  const selectedTraits = Array.from(
    new Set(storyChoices.map((choice) => printableTraitLabels[choice.pathTag])),
  )
  const printableTraits = selectedTraits.length > 0 ? selectedTraits : ["Brave", "Kind", "Clever"]

  if (requiresPersonalizedArtwork && !personalizedArtworkReady) {
    return (
      <main className="storybook-app-bg min-h-screen overflow-x-hidden px-4 py-6 sm:py-8">
        <div className="mx-auto max-w-3xl space-y-5">
          <StoryPreparation orderId={order.id} accessToken={effectiveAccessToken} heroName={order.heroName} />
          <Card className="border-4 border-sky-950 bg-white p-5 text-sm font-bold leading-6 text-slate-700 shadow-[8px_8px_0_rgba(8,47,73,0.14)]">
            Once every personalised page is ready, this page will refresh automatically and your full storybook will appear here.
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main id="top" className="storybook-app-bg min-h-screen overflow-x-hidden px-4 py-6 sm:py-8">
      <div className="mx-auto max-w-6xl space-y-6 full-story-print">
        <div className="no-print rounded-[2rem] border-4 border-sky-950 bg-white p-5 shadow-[8px_8px_0_rgba(8,47,73,0.18)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <Badge className="mb-2 bg-emerald-100 px-3 py-1 text-emerald-800">Your story is ready</Badge>
              <h1 className="text-3xl font-black uppercase leading-tight text-sky-950 sm:text-5xl">{story.title}</h1>
              <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-slate-700">
                {isHardbackEdition
                  ? `Read it below, or use Download PDF to save the ${totalPrintEditionPages}-page hardback print edition.`
                  : "Read it below, or use Download PDF to save a printable copy."}
              </p>
            </div>
            <div className="flex justify-start md:justify-end md:pr-4">
              <PrintButton heroName={order.heroName} />
            </div>
          </div>
        </div>

        <section className="book-page print-page overflow-hidden rounded-[2rem] border-4 border-sky-950 bg-[#fffdf5] shadow-[12px_12px_0_rgba(8,47,73,0.18)]">
          <div className="book-cover-grid grid gap-0 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="book-cover-hero relative isolate grid min-h-[360px] place-items-end overflow-hidden bg-[linear-gradient(135deg,#fef3c7_0%,#ccfbf1_50%,#dbeafe_100%)] p-5 text-center sm:min-h-[430px] sm:p-8">
              {coverArtwork && (
                <img
                  src={coverArtwork}
                  alt={`${story.title} cover artwork`}
                  className="absolute inset-0 -z-10 h-full w-full object-cover"
                />
              )}
              {!coverArtwork && (
                <div className="absolute inset-0 -z-10">
                  <StoryArtPlaceholder
                    heroType={order.heroType}
                    heroName={order.heroName}
                    initials={heroMark}
                    pageTitle={story.title}
                  />
                </div>
              )}
              <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(8,47,73,0.06)_0%,rgba(8,47,73,0.08)_42%,rgba(8,47,73,0.82)_100%)]" />
              <div className="book-cover-title-card w-full rounded-[1.5rem] border-4 border-white/80 bg-white/92 p-5 shadow-[0_18px_45px_rgba(8,47,73,0.24)] backdrop-blur-sm">
                <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full bg-amber-200 px-4 py-2 text-xs font-black uppercase text-sky-950">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                  Little Legends Story
                </div>
                <h2 className="text-3xl font-black uppercase leading-tight text-sky-950 sm:text-6xl">{story.title}</h2>
                <p className="mx-auto mt-4 max-w-md text-base font-bold leading-7 text-slate-700 sm:text-lg">{story.subtitle}</p>
              </div>
            </div>
            <div className="book-cover-copy space-y-5 border-t-4 border-sky-950 bg-white p-8 lg:border-l-4 lg:border-t-0">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-rose-500">Made especially for</p>
                <h2 className="mt-2 text-3xl font-black leading-tight text-sky-950 sm:text-4xl">{order.heroName}</h2>
                <p className="mt-2 text-lg font-bold leading-7 text-slate-700">
                  A magical adventure starring {order.heroName} the {order.heroType}.
                </p>
              </div>
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
              <div className="flex flex-wrap gap-2">
                {qualityTags.map((tag) => (
                  <span key={tag} className="rounded-full border-2 border-sky-100 bg-[#fffdf5] px-3 py-1.5 text-xs font-black uppercase tracking-wide text-sky-800">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="no-print rounded-xl border-2 border-sky-100 bg-[#fffdf5] p-4 text-sm font-semibold leading-6 text-slate-600">
                <p className="font-black text-sky-950">Order reference</p>
                <p>{order.id}</p>
              </div>
            </div>
          </div>
        </section>

        {isHardbackEdition && (
          <>
            <section className="book-page print-page keepsake-page overflow-hidden rounded-[2rem] border-4 border-sky-950 bg-[#fffdf5] p-6 shadow-[10px_10px_0_rgba(8,47,73,0.16)] sm:p-8">
              <div className="keepsake-page-inner grid min-h-[520px] place-items-center rounded-[1.5rem] border-4 border-sky-950 bg-[linear-gradient(135deg,#fef3c7_0%,#ecfeff_56%,#ffe4e6_100%)] p-6 text-center">
                <div className="mx-auto max-w-2xl">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-rose-500">This book belongs to</p>
                  <h2 className="mt-6 text-4xl font-black uppercase leading-tight text-sky-950 sm:text-6xl">{order.heroName}</h2>
                  <div className="mx-auto mt-8 h-0.5 max-w-md bg-sky-950/20" />
                  <p className="mt-8 text-lg font-bold leading-8 text-slate-700">
                    A one-of-a-kind Little Legends adventure made especially for {order.heroName}.
                  </p>
                </div>
              </div>
            </section>

            <section className="book-page print-page keepsake-page overflow-hidden rounded-[2rem] border-4 border-sky-950 bg-[#fffdf5] p-6 shadow-[10px_10px_0_rgba(8,47,73,0.16)] sm:p-8">
              <div className="keepsake-page-inner grid min-h-[520px] place-items-center rounded-[1.5rem] border-4 border-sky-950 bg-[linear-gradient(135deg,#dbeafe_0%,#fff7ed_48%,#fef3c7_100%)] p-6 text-center">
                <div className="mx-auto max-w-3xl">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-700">Little Legends presents</p>
                  <h2 className="mt-5 text-4xl font-black uppercase leading-tight text-sky-950 sm:text-6xl">{story.title}</h2>
                  <p className="mx-auto mt-5 max-w-xl text-lg font-bold leading-8 text-slate-700">{story.subtitle}</p>
                  <p className="mt-8 text-base font-black uppercase tracking-[0.18em] text-rose-500">
                    Starring {order.heroName} the {order.heroType}
                  </p>
                </div>
              </div>
            </section>

            <section className="book-page print-page keepsake-page overflow-hidden rounded-[2rem] border-4 border-sky-950 bg-[#fffdf5] p-6 shadow-[10px_10px_0_rgba(8,47,73,0.16)] sm:p-8">
              <div className="keepsake-page-inner grid min-h-[520px] place-items-center rounded-[1.5rem] border-4 border-sky-950 bg-white p-6">
                <div className="mx-auto max-w-3xl text-center">
                  <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border-4 border-sky-950 bg-amber-100 text-amber-700">
                    <Sparkles className="h-9 w-9" />
                  </div>
                  <p className="mt-5 text-xs font-black uppercase tracking-[0.24em] text-sky-700">Meet the hero</p>
                  <h2 className="mt-3 text-4xl font-black uppercase leading-tight text-sky-950 sm:text-5xl">{order.heroName}</h2>
                  <p className="mx-auto mt-5 max-w-2xl text-lg font-bold leading-8 text-slate-700">
                    {order.heroName} steps into this adventure as a {order.heroType}, ready to learn that {story.lesson.toLowerCase()}
                  </p>
                </div>
              </div>
            </section>

            <section className="book-page print-page keepsake-page overflow-hidden rounded-[2rem] border-4 border-sky-950 bg-[#fffdf5] p-6 shadow-[10px_10px_0_rgba(8,47,73,0.16)] sm:p-8">
              <div className="keepsake-page-inner certificate-page grid min-h-[520px] place-items-center rounded-[1.5rem] border-4 border-sky-950 bg-[linear-gradient(135deg,#fff7ed_0%,#fef3c7_52%,#ecfeff_100%)] p-6 text-center">
                <div className="certificate-frame relative mx-auto flex min-h-[430px] w-full max-w-4xl flex-col items-center justify-center overflow-hidden rounded-[1.25rem] border-[6px] border-double border-amber-500 bg-white/94 px-5 py-6 shadow-[inset_0_0_0_3px_rgba(8,47,73,0.92),0_16px_40px_rgba(8,47,73,0.16)] sm:px-10">
                  <div className="certificate-corner certificate-corner-top-left" />
                  <div className="certificate-corner certificate-corner-top-right" />
                  <div className="certificate-corner certificate-corner-bottom-left" />
                  <div className="certificate-corner certificate-corner-bottom-right" />

                  <div className="grid h-20 w-20 place-items-center rounded-full border-4 border-sky-950 bg-amber-100 text-amber-700 shadow-[4px_4px_0_rgba(8,47,73,0.12)]">
                    <Award className="h-10 w-10" />
                  </div>
                  <p className="mt-5 text-xs font-black uppercase tracking-[0.28em] text-rose-500">Certificate of heroism</p>
                  <p className="mt-4 text-sm font-black uppercase tracking-[0.22em] text-sky-700">This proudly certifies that</p>
                  <h2 className="mt-3 text-4xl font-black uppercase leading-tight text-sky-950 sm:text-6xl">{order.heroName}</h2>
                  <div className="mt-3 h-1 w-40 rounded-full bg-amber-400 sm:w-56" />
                  <p className="mx-auto mt-5 max-w-2xl text-lg font-bold leading-8 text-slate-700">
                    is recognised as a true Little Legend for showing heart, imagination, and hero-sized spirit throughout this adventure.
                  </p>
                  <div className="mx-auto mt-7 grid w-full max-w-2xl gap-3 sm:grid-cols-3">
                    {printableTraits.slice(0, 3).map((trait) => (
                      <div key={trait} className="rounded-2xl border-2 border-sky-100 bg-[#fffdf5] px-4 py-3 text-sm font-black text-sky-900">
                        <Star className="mx-auto mb-2 h-5 w-5 fill-amber-300 text-amber-400" />
                        {trait}
                      </div>
                    ))}
                  </div>
                  <div className="mt-7 flex w-full max-w-2xl items-end justify-between gap-6 text-left text-xs font-black uppercase tracking-[0.18em] text-sky-800">
                    <div className="flex-1 border-t-2 border-sky-950/35 pt-2">Little Legends</div>
                    <div className="flex-1 border-t-2 border-sky-950/35 pt-2 text-right">Official keepsake edition</div>
                  </div>
                </div>
              </div>
            </section>

            <section className="book-page print-page keepsake-page overflow-hidden rounded-[2rem] border-4 border-sky-950 bg-[#fffdf5] p-6 shadow-[10px_10px_0_rgba(8,47,73,0.16)] sm:p-8">
              <div className="keepsake-page-inner grid min-h-[520px] place-items-center rounded-[1.5rem] border-4 border-sky-950 bg-white p-6">
                <div className="mx-auto max-w-3xl text-center">
                  <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border-4 border-sky-950 bg-sky-100 text-sky-700">
                    <Compass className="h-9 w-9" />
                  </div>
                  <p className="mt-5 text-xs font-black uppercase tracking-[0.24em] text-sky-700">Adventure guide</p>
                  <h2 className="mt-3 text-3xl font-black uppercase leading-tight text-sky-950 sm:text-5xl">Follow the story path</h2>
                  <p className="mx-auto mt-5 max-w-2xl text-lg font-bold leading-8 text-slate-700">
                    {pathSummary}
                  </p>
                  <div className="mx-auto mt-8 flex max-w-xl flex-wrap justify-center gap-3">
                    {printableTraits.map((trait) => (
                      <span key={trait} className="rounded-full border-2 border-sky-100 bg-[#fffdf5] px-4 py-2 text-sm font-black uppercase text-sky-900">
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {storyPages.map((page) => {
          const pageArtworkPath = page.artwork?.[artworkGender]
          const pageArtwork =
            personalizedArtworkByPage.get(page.id) ||
            resolveAvailableArtwork(pageArtworkPath, fallbackArtworkPath)

          return (
            <section
              key={page.id}
              className="book-page print-page overflow-hidden rounded-[2rem] border-4 border-sky-950 bg-[#fffdf5] p-4 shadow-[10px_10px_0_rgba(8,47,73,0.16)] sm:p-5"
            >
              <div className="book-page-header mb-4 flex flex-col gap-3 border-b-4 border-sky-950 pb-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <Badge className="mb-2 bg-amber-300 px-3 py-1 text-sky-950">Page {page.pageNumber}</Badge>
                  <h2 className="text-2xl font-black uppercase leading-tight text-sky-950 sm:text-3xl">{page.title}</h2>
                </div>
                <div className="rounded-xl border-4 border-sky-950 bg-yellow-300 px-4 py-2 text-xl font-black text-sky-950 shadow-[4px_4px_0_rgba(8,47,73,0.14)] sm:text-2xl">
                  {page.sound}
                </div>
              </div>

              <div className="book-page-body grid gap-4 lg:grid-cols-[1fr_0.85fr]">
                <div className="book-art relative min-h-[360px] overflow-hidden rounded-2xl border-4 border-sky-950 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.85)_0_10%,transparent_11%),linear-gradient(135deg,#fef3c7_0%,#ffe4e6_45%,#bae6fd_100%)] bg-[length:32px_32px,auto] p-4 sm:min-h-[430px] sm:p-5">
                  {pageArtwork && (
                    <img
                      src={pageArtwork}
                      alt={`${story.title}: ${page.title}`}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )}
                  {!pageArtwork && (
                    <StoryArtPlaceholder
                      heroType={order.heroType}
                      heroName={order.heroName}
                      initials={heroMark}
                      pageTitle={page.title}
                      showFaceZone
                    />
                  )}
                  {pageArtwork && <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.18)_62%,rgba(255,255,255,0.72)_100%)]" />}
                  <div className="relative grid h-full min-h-[320px] place-items-center text-center sm:min-h-[390px]" />
                </div>

                <div className="book-copy-column grid gap-4">
                  <div className="book-scene-text rounded-2xl border-4 border-sky-950 bg-white p-5 shadow-[5px_5px_0_rgba(8,47,73,0.12)]">
                    <p className="text-base font-black leading-7 text-sky-950 sm:text-lg sm:leading-8">{page.scene}</p>
                  </div>

                  <div className="book-panels grid gap-4">
                    {page.panels.map((panel, index) => (
                      <div key={`${page.id}-${panel}`} className="book-panel rounded-2xl border-4 border-sky-950 bg-white p-4 shadow-[5px_5px_0_rgba(8,47,73,0.12)]">
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
              <div className="mt-4 flex items-center justify-between border-t-2 border-sky-100 pt-3 text-xs font-black uppercase tracking-wide text-sky-800">
                <span>Little Legends Story</span>
                <span>Page {page.pageNumber}</span>
              </div>
            </section>
          )
        })}

        <section className="book-page print-page overflow-hidden rounded-[2rem] border-4 border-sky-950 bg-[#fffdf5] p-6 text-center shadow-[10px_10px_0_rgba(8,47,73,0.16)] sm:p-8">
          <div className="book-ending-inner grid min-h-[520px] place-items-center rounded-[1.5rem] border-4 border-sky-950 bg-[linear-gradient(135deg,#fff7ed_0%,#ecfeff_52%,#fef3c7_100%)] p-6">
            <div className="mx-auto max-w-2xl">
              <div className="mx-auto grid h-24 w-24 place-items-center rounded-full border-4 border-white bg-rose-100 text-rose-500 shadow-xl">
                <Heart className="h-12 w-12 fill-rose-400" />
              </div>
              <p className="mt-6 text-xs font-black uppercase tracking-[0.24em] text-rose-500">The end</p>
              <h2 className="mt-3 text-3xl font-black uppercase leading-tight text-sky-950 sm:text-6xl">
                {order.heroName} stayed brave, kind, and full of wonder.
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-lg font-bold leading-8 text-slate-700">
                This story was made to be read aloud, kept close, and returned to whenever bedtime needs a little more magic.
              </p>
              <div className="mx-auto mt-8 grid max-w-md gap-3 sm:grid-cols-3">
                {["Brave", "Kind", "Clever"].map((word) => (
                  <div key={word} className="rounded-2xl border-2 border-sky-100 bg-white/86 px-4 py-3 text-sm font-black text-sky-900">
                    <Star className="mx-auto mb-2 h-5 w-5 fill-amber-300 text-amber-400" />
                    {word}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {isHardbackEdition && (
          <>
            <section className="book-page print-page keepsake-page overflow-hidden rounded-[2rem] border-4 border-sky-950 bg-[#fffdf5] p-6 shadow-[10px_10px_0_rgba(8,47,73,0.16)] sm:p-8">
              <div className="keepsake-page-inner grid min-h-[520px] place-items-center rounded-[1.5rem] border-4 border-sky-950 bg-white p-6 text-center">
                <div className="mx-auto max-w-2xl">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-700">A special dedication</p>
                  <h2 className="mt-4 text-3xl font-black leading-tight text-sky-950 sm:text-5xl">For {order.heroName}</h2>
                  <p className="mx-auto mt-6 max-w-xl text-lg font-bold leading-8 text-slate-700">
                    May this story remind you that courage can be gentle, kindness can be powerful, and every great adventure begins with believing in yourself.
                  </p>
                </div>
              </div>
            </section>

            <section className="book-page print-page keepsake-page overflow-hidden rounded-[2rem] border-4 border-sky-950 bg-[#fffdf5] p-6 shadow-[10px_10px_0_rgba(8,47,73,0.16)] sm:p-8">
              <div className="keepsake-page-inner grid min-h-[520px] place-items-center rounded-[1.5rem] border-4 border-sky-950 bg-white p-6 text-center">
                <div className="mx-auto max-w-3xl">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-700">What I learned</p>
                  <h2 className="mt-4 text-3xl font-black uppercase leading-tight text-sky-950 sm:text-5xl">{story.lesson}</h2>
                  <p className="mx-auto mt-6 max-w-2xl text-lg font-bold leading-8 text-slate-700">
                    Every adventure leaves a little wisdom behind. The best heroes notice what they learned and carry it into the next day.
                  </p>
                </div>
              </div>
            </section>

            <section className="book-page print-page keepsake-page overflow-hidden rounded-[2rem] border-4 border-sky-950 bg-[#fffdf5] p-6 shadow-[10px_10px_0_rgba(8,47,73,0.16)] sm:p-8">
              <div className="keepsake-page-inner grid min-h-[520px] place-items-center rounded-[1.5rem] border-4 border-sky-950 bg-[linear-gradient(135deg,#fef3c7_0%,#ecfeff_50%,#dbeafe_100%)] p-6 text-center">
                <div className="mx-auto max-w-3xl">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-rose-500">Hero strengths</p>
                  <h2 className="mt-4 text-4xl font-black uppercase leading-tight text-sky-950 sm:text-5xl">
                    {order.heroName}'s shining qualities
                  </h2>
                  <div className="mx-auto mt-8 grid max-w-2xl gap-4 sm:grid-cols-3">
                    {printableTraits.slice(0, 3).map((trait) => (
                      <div key={trait} className="rounded-2xl border-4 border-sky-950 bg-white p-5 text-lg font-black text-sky-950 shadow-[5px_5px_0_rgba(8,47,73,0.12)]">
                        <Star className="mx-auto mb-3 h-7 w-7 fill-amber-300 text-amber-400" />
                        {trait}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="book-page print-page keepsake-page overflow-hidden rounded-[2rem] border-4 border-sky-950 bg-[#fffdf5] p-6 shadow-[10px_10px_0_rgba(8,47,73,0.16)] sm:p-8">
              <div className="keepsake-page-inner draw-page flex min-h-[520px] flex-col rounded-[1.5rem] border-4 border-sky-950 bg-white p-6">
                <div className="w-full text-center">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border-4 border-sky-950 bg-rose-100 text-rose-500">
                    <Palette className="h-8 w-8" />
                  </div>
                  <p className="mt-4 text-xs font-black uppercase tracking-[0.24em] text-sky-700">Draw your own adventure</p>
                  <h2 className="mt-2 text-3xl font-black uppercase leading-tight text-sky-950 sm:text-5xl">What happens next?</h2>
                </div>
                <div className="draw-page-canvas mt-5 flex-1 rounded-[1.5rem] border-4 border-dashed border-sky-200 bg-[#fffdf5]" />
              </div>
            </section>

            <section className="book-page print-page keepsake-page overflow-hidden rounded-[2rem] border-4 border-sky-950 bg-[#fffdf5] p-6 shadow-[10px_10px_0_rgba(8,47,73,0.16)] sm:p-8">
              <div className="keepsake-page-inner grid min-h-[520px] place-items-center rounded-[1.5rem] border-4 border-sky-950 bg-white p-6 text-center">
                <div className="mx-auto max-w-3xl">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-700">A note to keep</p>
                  <h2 className="mt-4 text-3xl font-black uppercase leading-tight text-sky-950 sm:text-5xl">There is always another adventure waiting</h2>
                  <p className="mx-auto mt-6 max-w-2xl text-lg font-bold leading-8 text-slate-700">
                    Read this story again whenever you need a reminder that imagination, kindness, and courage are never far away.
                  </p>
                </div>
              </div>
            </section>
          </>
        )}

        <div className="no-print rounded-[2rem] border-4 border-sky-950 bg-white p-5 shadow-[8px_8px_0_rgba(8,47,73,0.18)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-sky-950">Finished saving your story?</h2>
              <p className="mt-1 text-sm font-bold leading-6 text-slate-700">
                You can return to the top to read again or head back to the app when you are ready.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button asChild variant="outline" className="h-11 rounded-xl border-sky-200 bg-white px-5 font-black text-sky-700">
                <a href="#top">
                  <BookOpen className="h-4 w-4" />
                  Back to story
                </a>
              </Button>
              <Button asChild className="h-11 rounded-xl bg-sky-500 px-5 font-black text-white hover:bg-sky-600">
                <Link href="/create">
                  <Home className="h-4 w-4" />
                  Home
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
