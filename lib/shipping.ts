export type ShippingZone = "uk" | "europe" | "northAmerica" | "oceania" | "world"

export type ShippingCountry = {
  code: string
  name: string
  zone: ShippingZone
}

export type ShippingQuote = {
  countryCode: string
  countryName: string
  zone: ShippingZone
  label: string
  amountPence: number
  amount: number
}

const zoneRates: Record<ShippingZone, { label: string; amountPence: number }> = {
  uk: { label: "Free UK delivery", amountPence: 0 },
  europe: { label: "Europe delivery", amountPence: 899 },
  northAmerica: { label: "US and Canada delivery", amountPence: 1099 },
  oceania: { label: "Australia and New Zealand delivery", amountPence: 1299 },
  world: { label: "International delivery", amountPence: 1699 },
}

export const shippingCountries: ShippingCountry[] = [
  { code: "GB", name: "United Kingdom", zone: "uk" },
  { code: "IE", name: "Ireland", zone: "europe" },
  { code: "US", name: "United States", zone: "northAmerica" },
  { code: "CA", name: "Canada", zone: "northAmerica" },
  { code: "AU", name: "Australia", zone: "oceania" },
  { code: "NZ", name: "New Zealand", zone: "oceania" },
  { code: "AT", name: "Austria", zone: "europe" },
  { code: "BE", name: "Belgium", zone: "europe" },
  { code: "BG", name: "Bulgaria", zone: "europe" },
  { code: "HR", name: "Croatia", zone: "europe" },
  { code: "CY", name: "Cyprus", zone: "europe" },
  { code: "CZ", name: "Czech Republic", zone: "europe" },
  { code: "DK", name: "Denmark", zone: "europe" },
  { code: "EE", name: "Estonia", zone: "europe" },
  { code: "FI", name: "Finland", zone: "europe" },
  { code: "FR", name: "France", zone: "europe" },
  { code: "DE", name: "Germany", zone: "europe" },
  { code: "GR", name: "Greece", zone: "europe" },
  { code: "HU", name: "Hungary", zone: "europe" },
  { code: "IT", name: "Italy", zone: "europe" },
  { code: "LV", name: "Latvia", zone: "europe" },
  { code: "LT", name: "Lithuania", zone: "europe" },
  { code: "LU", name: "Luxembourg", zone: "europe" },
  { code: "MT", name: "Malta", zone: "europe" },
  { code: "NL", name: "Netherlands", zone: "europe" },
  { code: "NO", name: "Norway", zone: "europe" },
  { code: "PL", name: "Poland", zone: "europe" },
  { code: "PT", name: "Portugal", zone: "europe" },
  { code: "RO", name: "Romania", zone: "europe" },
  { code: "SK", name: "Slovakia", zone: "europe" },
  { code: "SI", name: "Slovenia", zone: "europe" },
  { code: "ES", name: "Spain", zone: "europe" },
  { code: "SE", name: "Sweden", zone: "europe" },
  { code: "CH", name: "Switzerland", zone: "europe" },
  { code: "AE", name: "United Arab Emirates", zone: "world" },
  { code: "BR", name: "Brazil", zone: "world" },
  { code: "CN", name: "China", zone: "world" },
  { code: "HK", name: "Hong Kong", zone: "world" },
  { code: "IN", name: "India", zone: "world" },
  { code: "IL", name: "Israel", zone: "world" },
  { code: "JP", name: "Japan", zone: "world" },
  { code: "MY", name: "Malaysia", zone: "world" },
  { code: "MX", name: "Mexico", zone: "world" },
  { code: "PH", name: "Philippines", zone: "world" },
  { code: "QA", name: "Qatar", zone: "world" },
  { code: "SA", name: "Saudi Arabia", zone: "world" },
  { code: "SG", name: "Singapore", zone: "world" },
  { code: "ZA", name: "South Africa", zone: "world" },
  { code: "KR", name: "South Korea", zone: "world" },
  { code: "TH", name: "Thailand", zone: "world" },
  { code: "TR", name: "Turkey", zone: "world" },
]

const normaliseCountry = (value: string) => value.trim().toLowerCase()

export const getShippingCountryByCode = (countryCode: string) =>
  shippingCountries.find((country) => country.code === countryCode.toUpperCase()) || shippingCountries[0]

export const getShippingCountryByName = (countryName: string) => {
  const normalisedName = normaliseCountry(countryName)
  return (
    shippingCountries.find((country) => normaliseCountry(country.name) === normalisedName) ||
    shippingCountries.find((country) => country.code.toLowerCase() === normalisedName) ||
    shippingCountries[0]
  )
}

export const getShippingQuote = (countryCode: string): ShippingQuote => {
  const country = getShippingCountryByCode(countryCode)
  const rate = zoneRates[country.zone]

  return {
    countryCode: country.code,
    countryName: country.name,
    zone: country.zone,
    label: rate.label,
    amountPence: rate.amountPence,
    amount: rate.amountPence / 100,
  }
}

export const getShippingQuoteForAddress = (countryName: string, countryCode?: string) =>
  getShippingQuote(countryCode || getShippingCountryByName(countryName).code)
