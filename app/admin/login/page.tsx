"use client"

import { FormEvent, Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { LockKeyhole } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function AdminLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = searchParams.get("next") || "/admin"
  const [username, setUsername] = useState("admin")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage("")

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Could not sign in")
      }

      router.push(nextPath)
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not sign in")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f6efe9] px-4 py-10">
      <div className="mx-auto max-w-md">
        <Card className="border-4 border-sky-950 bg-white p-6 shadow-[12px_12px_0_rgba(8,47,73,0.18)]">
          <div className="mb-6 flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-xl border-4 border-sky-950 bg-amber-300 text-sky-950 shadow-[4px_4px_0_rgba(8,47,73,0.16)]">
              <LockKeyhole className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-sky-950">Admin login</h1>
              <p className="text-sm font-semibold text-slate-600">Orders, print queue, emails, and enquiries.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="font-black text-sky-950">Username</Label>
              <Input id="username" value={username} onChange={(event) => setUsername(event.target.value)} className="h-12 rounded-xl border-2 border-sky-100 bg-white font-semibold" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="font-black text-sky-950">Password</Label>
              <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 rounded-xl border-2 border-sky-100 bg-white font-semibold" />
            </div>

            {message && <div className="rounded-xl border-2 border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">{message}</div>}

            <Button disabled={isSubmitting} className="h-12 w-full rounded-xl bg-sky-500 font-black text-white hover:bg-sky-600">
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#f6efe9] px-4 py-10" />}>
      <AdminLoginForm />
    </Suspense>
  )
}
