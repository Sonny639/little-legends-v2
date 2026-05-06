"use client"

import Link from "next/link"
import { BookOpen, Image, Inbox, LayoutDashboard, LogOut, Mail, PackageCheck } from "lucide-react"

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: BookOpen },
  { href: "/admin/print-queue", label: "Print queue", icon: PackageCheck },
  { href: "/artwork", label: "Artwork", icon: Image },
  { href: "/admin/enquiries", label: "Enquiries", icon: Inbox },
  { href: "/admin/email-log", label: "Email log", icon: Mail },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="storybook-app-bg min-h-screen px-3 py-5 sm:px-4 sm:py-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="storybook-panel rounded-[1.5rem] p-4 sm:rounded-[2rem]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-sky-700">Little Legends</p>
              <h1 className="text-3xl font-black text-sky-950">Admin</h1>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible">
              {navItems.map((item) => {
                const Icon = item.icon

                return (
                  <Link key={item.href} href={item.href} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border-2 border-sky-100 bg-white px-3 text-sm font-black text-sky-700 hover:bg-sky-50">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
              <form action="/api/admin/logout" method="post">
                <button className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border-2 border-rose-100 bg-white px-3 text-sm font-black text-rose-600 hover:bg-rose-50">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>

        {children}
      </div>
    </main>
  )
}
