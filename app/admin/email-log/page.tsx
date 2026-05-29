import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { readEmailLog } from "@/lib/email"
import { AdminShell } from "../admin-shell"
import { EmailLogClient } from "./email-log-client"

export const dynamic = "force-dynamic"

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

      <EmailLogClient initialEmails={emails} />
    </AdminShell>
  )
}
