"use client"

import { Printer } from "lucide-react"

import { Button } from "@/components/ui/button"

export function PrintButton() {
  return (
    <Button
      type="button"
      onClick={() => window.print()}
      className="h-11 w-full min-w-[12rem] rounded-xl bg-emerald-500 px-6 font-black text-white hover:bg-emerald-600"
    >
      <Printer className="h-4 w-4" />
      Print / Save PDF
    </Button>
  )
}
