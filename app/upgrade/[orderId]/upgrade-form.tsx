"use client"

import type React from "react"
import { useState } from "react"
import { CreditCard, Truck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getShippingCountryByCode, getShippingQuote, shippingCountries } from "@/lib/shipping"

type UpgradeCheckoutFormProps = {
  sourceOrderId: string
  accessToken: string
  upgradePriceLabel: string
}

export function UpgradeCheckoutForm({ sourceOrderId, accessToken, upgradePriceLabel }: UpgradeCheckoutFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    fullName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    postcode: "",
    country: "United Kingdom",
    countryCode: "GB",
    phone: "",
  })
  const shippingQuote = getShippingQuote(form.countryCode)
  const upgradeTotal = Number((Number(upgradePriceLabel.replace(/[^0-9.]/g, "")) + shippingQuote.amount).toFixed(2))

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const updateCountry = (countryCode: string) => {
    const country = getShippingCountryByCode(countryCode)
    setForm((current) => ({ ...current, country: country.name, countryCode: country.code }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return

    setError("")
    setIsSubmitting(true)

    try {
      const upgradeResponse = await fetch("/api/orders/upgrade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: sourceOrderId,
          accessToken,
          phone: form.phone,
          postage: form,
        }),
      })
      const upgradeData = await upgradeResponse.json()

      if (!upgradeResponse.ok || !upgradeData.order) {
        throw new Error(upgradeData.error || "Could not prepare the hardback upgrade.")
      }

      const checkoutResponse = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ order: upgradeData.order }),
      })
      const checkoutData = await checkoutResponse.json()
      const checkoutUrl = checkoutData.checkout?.url

      if (!checkoutResponse.ok || !checkoutUrl) {
        throw new Error(checkoutData.error || "Could not open secure checkout.")
      }

      window.location.href = checkoutUrl
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Could not prepare the hardback upgrade.")
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-4 border-sky-950 bg-[#fffdf5] p-4 shadow-[10px_10px_0_rgba(8,47,73,0.16)] sm:p-5">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <h2 className="text-2xl font-black text-sky-950">Delivery details</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
            Add the address for the hardback keepsake. UK delivery is free; international delivery is added below.
          </p>
          <div className="mt-3 rounded-2xl bg-sky-50 px-4 py-3 text-sm font-bold text-slate-700">
            <div className="flex items-center justify-between gap-3">
              <span>Hardback upgrade</span>
              <span>{upgradePriceLabel}</span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-3">
              <span>{shippingQuote.label}</span>
              <span>{shippingQuote.amountPence === 0 ? "Free" : `£${shippingQuote.amount.toFixed(2)}`}</span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 border-t border-sky-100 pt-2 text-base font-black text-sky-950">
              <span>Total today</span>
              <span>£{upgradeTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" required value={form.fullName} onChange={(event) => updateField("fullName", event.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="addressLine1">Address line 1</Label>
            <Input id="addressLine1" required value={form.addressLine1} onChange={(event) => updateField("addressLine1", event.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="addressLine2">Address line 2</Label>
            <Input id="addressLine2" value={form.addressLine2} onChange={(event) => updateField("addressLine2", event.target.value)} />
          </div>
          <div>
            <Label htmlFor="city">Town or city</Label>
            <Input id="city" required value={form.city} onChange={(event) => updateField("city", event.target.value)} />
          </div>
          <div>
            <Label htmlFor="postcode">Postcode</Label>
            <Input id="postcode" required value={form.postcode} onChange={(event) => updateField("postcode", event.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="country">Country</Label>
            <select
              id="country"
              required
              value={form.countryCode}
              onChange={(event) => updateCountry(event.target.value)}
              className="flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            >
              {shippingCountries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="phone">Telephone number</Label>
            <Input id="phone" type="tel" required value={form.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="Required for delivery" />
          </div>
        </div>

        {error && <p className="rounded-xl border-2 border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-800">{error}</p>}

        <Button disabled={isSubmitting} className="h-12 w-full rounded-xl bg-rose-500 px-6 text-base font-black text-white hover:bg-rose-600">
          {isSubmitting ? (
            "Preparing checkout..."
          ) : (
            <>
              <Truck className="h-4 w-4" />
              Upgrade to Hardback
              <CreditCard className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </Card>
  )
}
