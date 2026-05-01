"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ContactPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setStatus("")

    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message, source: "contact" }),
      })

      if (!response.ok) throw new Error("Could not send enquiry")

      setName("")
      setEmail("")
      setSubject("")
      setMessage("")
      setStatus("Thanks, your enquiry has been sent.")
    } catch {
      setStatus("Could not send your enquiry. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="storybook-app-bg min-h-screen px-4 py-4 sm:py-5">
      <div className="mx-auto max-w-2xl">
        <Card className="storybook-panel p-4 sm:p-5">
          <Button asChild variant="outline" className="mb-4 h-9 rounded-xl border-sky-200 bg-white px-4 font-black text-sky-700">
            <Link href="/create">
              <ArrowLeft className="h-4 w-4" />
              Back to app
            </Link>
          </Button>

          <h1 className="text-3xl font-black leading-tight text-sky-950 sm:text-4xl">Contact Little Legends</h1>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
            Need help with an order, delivery, or a story idea? Send a note and we will come back to you.
          </p>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-black text-sky-950">Name</Label>
                <Input id="name" required value={name} onChange={(event) => setName(event.target.value)} className="h-11 rounded-xl border-2 border-sky-100 bg-white font-semibold" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="font-black text-sky-950">Email</Label>
                <Input id="email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-11 rounded-xl border-2 border-sky-100 bg-white font-semibold" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject" className="font-black text-sky-950">Subject</Label>
              <Input id="subject" required value={subject} onChange={(event) => setSubject(event.target.value)} className="h-11 rounded-xl border-2 border-sky-100 bg-white font-semibold" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message" className="font-black text-sky-950">Message</Label>
              <textarea
                id="message"
                required
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="min-h-24 w-full rounded-xl border-2 border-sky-100 bg-white px-3 py-3 text-base font-semibold outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:min-h-28"
              />
            </div>

            {status && <div className="rounded-xl border-2 border-sky-100 bg-sky-50 p-3 text-sm font-black text-sky-900" role="status">{status}</div>}

            <Button disabled={isSubmitting} className="h-11 w-full rounded-xl bg-gradient-to-r from-sky-500 to-teal-500 font-black text-white hover:from-sky-600 hover:to-teal-600">
              <Send className="h-4 w-4" />
              {isSubmitting ? "Sending your message..." : "Send enquiry"}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  )
}
