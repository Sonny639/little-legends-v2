"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowUpDown, Mail, Search, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type EmailLogEntry = {
  id: string
  createdAt: string
  to: string
  subject: string
  body: string
  orderId: string
  provider: "log" | "smtp"
}

type EmailSort = "newest" | "oldest" | "recipient" | "subject" | "provider"

const emailSortOptions: { value: EmailSort; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "recipient", label: "Recipient" },
  { value: "subject", label: "Subject" },
  { value: "provider", label: "Provider" },
]

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))

export function EmailLogClient({ initialEmails }: { initialEmails: EmailLogEntry[] }) {
  const [emails, setEmails] = useState(initialEmails)
  const [query, setQuery] = useState("")
  const [sortBy, setSortBy] = useState<EmailSort>("newest")
  const [message, setMessage] = useState("")

  const filteredEmails = useMemo(() => {
    const normalisedQuery = query.trim().toLowerCase()
    const matchedEmails = normalisedQuery
      ? emails.filter((email) =>
          [email.id, email.to, email.subject, email.orderId, email.provider, email.body]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(normalisedQuery)),
        )
      : emails

    return [...matchedEmails].sort((first, second) => {
      if (sortBy === "oldest") return new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime()
      if (sortBy === "recipient") return first.to.localeCompare(second.to)
      if (sortBy === "subject") return first.subject.localeCompare(second.subject)
      if (sortBy === "provider") return first.provider.localeCompare(second.provider)
      return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
    })
  }, [emails, query, sortBy])

  const deleteEmail = async (email: EmailLogEntry) => {
    const confirmed = window.confirm(`Delete email log for ${email.to}? This cannot be undone.`)

    if (!confirmed) return

    setMessage("")

    try {
      const response = await fetch(`/api/email-log?emailId=${encodeURIComponent(email.id)}`, { method: "DELETE" })

      if (!response.ok) {
        throw new Error("Failed to delete email log")
      }

      setEmails((currentEmails) => currentEmails.filter((savedEmail) => savedEmail.id !== email.id))
      setMessage(`Deleted email log for ${email.to}.`)
    } catch {
      setMessage("Email log could not be deleted from the server data store.")
    }
  }

  return (
    <div className="space-y-4">
      {message && (
        <Card className="border-4 border-amber-300 bg-amber-50 p-4 text-sm font-black text-amber-900">
          {message}
        </Card>
      )}

      <Card className="border-4 border-sky-950 bg-white p-5 shadow-[8px_8px_0_rgba(8,47,73,0.14)]">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by email, subject, order, provider, or message..."
              className="h-12 rounded-xl border-2 border-sky-100 bg-white pl-11 font-semibold"
            />
          </div>
          <label className="relative block">
            <ArrowUpDown className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as EmailSort)}
              className="h-12 w-full rounded-xl border-2 border-sky-100 bg-white pl-11 pr-8 text-sm font-black text-sky-900 outline-none lg:w-48"
              aria-label="Sort email logs"
            >
              {emailSortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      <div className="grid gap-4">
        {filteredEmails.map((email) => (
          <Card key={email.id} className="border-4 border-sky-950 bg-[#fffdf5] p-5 shadow-[8px_8px_0_rgba(8,47,73,0.14)]">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge className="bg-emerald-100 text-emerald-800">{email.provider}</Badge>
              <Badge className="bg-sky-100 text-sky-800">{formatDate(email.createdAt)}</Badge>
              {email.orderId && (
                <Link
                  href={`/admin/orders?order=${encodeURIComponent(email.orderId)}`}
                  className="rounded-full bg-white px-3 py-1 text-xs font-black text-sky-700 underline"
                >
                  View order
                </Link>
              )}
              <button
                type="button"
                onClick={() => deleteEmail(email)}
                className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-xs font-black text-rose-700 underline"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="mt-1 h-5 w-5 shrink-0 text-sky-700" />
              <div>
                <h3 className="text-xl font-black text-sky-950">{email.subject}</h3>
                <p className="mt-1 break-all text-sm font-bold text-slate-700">To: {email.to}</p>
                <p className="break-all text-sm font-bold text-slate-700">Order: {email.orderId || "Not linked"}</p>
              </div>
            </div>
            <details className="mt-4 rounded-xl border-2 border-sky-100 bg-white p-4">
              <summary className="cursor-pointer text-sm font-black text-sky-900">View email body</summary>
              <pre className="mt-4 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">{email.body}</pre>
            </details>
          </Card>
        ))}
        {filteredEmails.length === 0 && (
          <Card className="border-4 border-sky-950 bg-white p-8 text-center shadow-[8px_8px_0_rgba(8,47,73,0.14)]">
            <h3 className="text-2xl font-black text-sky-950">No emails found</h3>
            <p className="mt-2 text-sm font-bold text-slate-700">
              Try a different search, or wait for paid order confirmations to appear.
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
