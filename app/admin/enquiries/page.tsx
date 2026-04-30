"use client"

import { useEffect, useState } from "react"
import { Inbox } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AdminShell } from "../admin-shell"

type EnquiryStatus = "new" | "replied" | "closed"

type EnquiryRecord = {
  id: string
  createdAt: string
  name: string
  email: string
  subject: string
  message: string
  status: EnquiryStatus
}

const statusStyles: Record<EnquiryStatus, string> = {
  new: "bg-rose-100 text-rose-800",
  replied: "bg-sky-100 text-sky-800",
  closed: "bg-emerald-100 text-emerald-800",
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))

export default function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<EnquiryRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState("")

  const loadEnquiries = async () => {
    setIsLoading(true)
    setMessage("")

    try {
      const response = await fetch("/api/enquiries", { cache: "no-store" })
      if (!response.ok) throw new Error("Failed to load enquiries")

      const data = await response.json()
      setEnquiries(Array.isArray(data.enquiries) ? data.enquiries : [])
    } catch {
      setMessage("Could not load enquiries.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadEnquiries()
  }, [])

  const updateStatus = async (enquiryId: string, status: EnquiryStatus) => {
    try {
      const response = await fetch("/api/enquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enquiryId, status }),
      })

      if (!response.ok) throw new Error("Failed to update enquiry")
      const data = await response.json()

      setEnquiries((current) => current.map((enquiry) => (enquiry.id === enquiryId ? data.enquiry : enquiry)))
    } catch {
      setMessage("Could not update enquiry status.")
    }
  }

  return (
    <AdminShell>
      <Card className="border-4 border-sky-950 bg-white p-5 shadow-[8px_8px_0_rgba(8,47,73,0.14)]">
        <Badge className="mb-2 bg-rose-100 px-3 py-1 text-rose-800">Customer messages</Badge>
        <h2 className="text-3xl font-black text-sky-950">Enquiries</h2>
        <p className="mt-1 text-sm font-bold text-slate-700">Messages from contact forms, launch signups, and future support flows.</p>
      </Card>

      {message && <Card className="border-4 border-amber-300 bg-amber-50 p-4 text-sm font-black text-amber-900">{message}</Card>}

      {isLoading ? (
        <Card className="border-4 border-sky-950 bg-white p-8 text-center shadow-[8px_8px_0_rgba(8,47,73,0.14)]">
          <h3 className="text-2xl font-black text-sky-950">Loading enquiries</h3>
        </Card>
      ) : (
        <div className="grid gap-4">
          {enquiries.map((enquiry) => (
            <Card key={enquiry.id} className="border-4 border-sky-950 bg-[#fffdf5] p-5 shadow-[8px_8px_0_rgba(8,47,73,0.14)]">
              <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge className={statusStyles[enquiry.status]}>{enquiry.status}</Badge>
                    <Badge className="bg-sky-100 text-sky-800">{formatDate(enquiry.createdAt)}</Badge>
                  </div>
                  <h3 className="text-xl font-black text-sky-950">{enquiry.subject}</h3>
                  <p className="mt-1 text-sm font-bold text-slate-700">{enquiry.name} · {enquiry.email}</p>
                  <p className="mt-4 whitespace-pre-wrap rounded-xl border-2 border-sky-100 bg-white p-4 text-sm font-semibold leading-6 text-slate-700">{enquiry.message}</p>
                </div>
                <div className="grid content-start gap-2 sm:grid-cols-3 lg:grid-cols-1">
                  {(["new", "replied", "closed"] as const).map((status) => (
                    <Button key={status} onClick={() => updateStatus(enquiry.id, status)} variant="outline" className="h-10 rounded-xl border-sky-100 bg-white px-4 font-black text-sky-700">
                      {status}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>
          ))}
          {enquiries.length === 0 && (
            <Card className="border-4 border-sky-950 bg-white p-8 text-center shadow-[8px_8px_0_rgba(8,47,73,0.14)]">
              <Inbox className="mx-auto h-10 w-10 text-sky-700" />
              <h3 className="mt-3 text-2xl font-black text-sky-950">No enquiries yet</h3>
              <p className="mt-2 text-sm font-bold text-slate-700">When a contact form is added, messages will land here.</p>
            </Card>
          )}
        </div>
      )}
    </AdminShell>
  )
}
