"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { LoaderCircle, Sparkles } from "lucide-react"

import { Card } from "@/components/ui/card"

type ArtworkSummary = {
  totalPages: number
  readyCount: number
  failedCount: number
  complete: boolean
}

type StoryPreparationProps = {
  orderId: string
  accessToken: string
  heroName: string
  onReady?: "refresh"
}

const readJsonResponse = async (response: Response) => {
  const text = await response.text()

  try {
    return text ? JSON.parse(text) : {}
  } catch {
    throw new Error("The story preparation service returned an unreadable response.")
  }
}

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds))

export function StoryPreparation({ orderId, accessToken, heroName, onReady = "refresh" }: StoryPreparationProps) {
  const router = useRouter()
  const startedRef = useRef(false)
  const [summary, setSummary] = useState<ArtworkSummary>({
    totalPages: 0,
    readyCount: 0,
    failedCount: 0,
    complete: false,
  })
  const [message, setMessage] = useState(
    `We are getting ${heroName} ready for the full adventure. This can take around 10 to 20 minutes. Please keep this page open and do not refresh.`,
  )

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      try {
        if (!startedRef.current) {
          startedRef.current = true
          const startResponse = await fetch("/api/orders/story-artwork", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ orderId, accessToken }),
          })
          const startResult = await readJsonResponse(startResponse)

          if (!startResponse.ok) {
            throw new Error(startResult.error || "Could not start the personalised story.")
          }
        }

        while (!cancelled) {
          const statusResponse = await fetch(
            `/api/orders/story-artwork?orderId=${encodeURIComponent(orderId)}&access=${encodeURIComponent(accessToken)}`,
            {
            cache: "no-store",
            },
          )
          const statusResult = await readJsonResponse(statusResponse)

          if (!statusResponse.ok) {
            throw new Error(statusResult.error || "Could not read story preparation progress.")
          }

          const nextSummary = statusResult.artwork as ArtworkSummary
          setSummary(nextSummary)

          if (nextSummary.failedCount > 0) {
            setMessage("One of the personalised pages needs another try. Please contact support with your order reference.")
            return
          }

          if (nextSummary.complete) {
            setMessage("Your personalised story is ready.")
            if (onReady === "refresh") router.refresh()
            return
          }

          await wait(5000)
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : "Could not prepare the personalised story.")
        }
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [accessToken, heroName, onReady, orderId, router])

  return (
    <Card className="border-4 border-sky-950 bg-amber-50 p-5 shadow-[8px_8px_0_rgba(8,47,73,0.14)]">
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border-4 border-sky-950 bg-white text-amber-600">
          {summary.complete ? <Sparkles className="h-6 w-6" /> : <LoaderCircle className="h-6 w-6 animate-spin" />}
        </div>
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-widest text-sky-700">Preparing personalised story</p>
          <h2 className="text-xl font-black text-sky-950">{heroName}'s full storybook is being created</h2>
          <p className="text-sm font-bold leading-6 text-slate-700">{message}</p>
          {summary.totalPages > 0 && (
            <p className="text-sm font-black text-sky-900">
              {summary.readyCount} of {summary.totalPages} personalised pages ready
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}
