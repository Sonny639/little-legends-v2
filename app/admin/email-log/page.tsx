import { Mail } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { readEmailLog } from "@/lib/email"
import { AdminShell } from "../admin-shell"

export const dynamic = "force-dynamic"

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))

export default async function AdminEmailLogPage() {
  const emailsResult = await readEmailLog()
    .then((emails) => ({ emails, issue: "" }))
    .catch((error: unknown) => ({
      emails: [],
      issue: error instanceof Error ? error.message : "Unknown database error",
    }))
  const emails = emailsResult.emails

  return (
    <AdminShell>
      {emailsResult.issue && (
        <Card className="border-4 border-amber-300 bg-amber-50 p-4 text-sm font-black leading-6 text-amber-900">
          Email log could not load. Check the production database tables/env vars. {emailsResult.issue}
        </Card>
      )}

      <Card className="border-4 border-sky-950 bg-white p-5 shadow-[8px_8px_0_rgba(8,47,73,0.14)]">
        <Badge className="mb-2 bg-sky-100 px-3 py-1 text-sky-800">Email log</Badge>
        <h2 className="text-3xl font-black text-sky-950">Email log</h2>
        <p className="mt-1 text-sm font-bold text-slate-700">
          Confirmation emails are sent by SMTP when configured, and every attempt is kept here for support and fulfilment checks.
        </p>
      </Card>

      <div className="grid gap-4">
        {emails.map((email) => (
          <Card key={email.id} className="border-4 border-sky-950 bg-[#fffdf5] p-5 shadow-[8px_8px_0_rgba(8,47,73,0.14)]">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge className="bg-emerald-100 text-emerald-800">{email.provider}</Badge>
              <Badge className="bg-sky-100 text-sky-800">{formatDate(email.createdAt)}</Badge>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="mt-1 h-5 w-5 shrink-0 text-sky-700" />
              <div>
                <h3 className="text-xl font-black text-sky-950">{email.subject}</h3>
                <p className="mt-1 break-all text-sm font-bold text-slate-700">To: {email.to}</p>
                <p className="break-all text-sm font-bold text-slate-700">Order: {email.orderId}</p>
              </div>
            </div>
            <pre className="mt-4 whitespace-pre-wrap rounded-xl border-2 border-sky-100 bg-white p-4 text-sm font-semibold leading-6 text-slate-700">{email.body}</pre>
          </Card>
        ))}
        {emails.length === 0 && (
          <Card className="border-4 border-sky-950 bg-white p-8 text-center shadow-[8px_8px_0_rgba(8,47,73,0.14)]">
            <h3 className="text-2xl font-black text-sky-950">No emails logged yet</h3>
            <p className="mt-2 text-sm font-bold text-slate-700">Paid order confirmations will appear here.</p>
          </Card>
        )}
      </div>
    </AdminShell>
  )
}
