import { type CheckoutProduct } from "@/lib/orders"

export const checkoutProducts: Record<
  CheckoutProduct,
  {
    label: string
    price: number
    unitAmountPence: number
    currency: "gbp"
    summary: string
    button: string
    stripeLookupKey: string
  }
> = {
  digital: {
    label: "Digital Storybook",
    price: 7.99,
    unitAmountPence: 799,
    currency: "gbp",
    summary: "Instant personalised storybook download.",
    button: "Buy Digital",
    stripeLookupKey: "little_legends_digital_pdf",
  },
  hardback: {
    label: "Hardback Keepsake",
    price: 34.99,
    unitAmountPence: 3499,
    currency: "gbp",
    summary: "Printed copy posted to you, with a digital copy included.",
    button: "Order Hardback",
    stripeLookupKey: "little_legends_hardback_book",
  },
  upgrade: {
    label: "Hardback Upgrade",
    price: 27,
    unitAmountPence: 2700,
    currency: "gbp",
    summary: "Add the hardback keepsake after buying the digital storybook.",
    button: "Upgrade to Hardback",
    stripeLookupKey: "little_legends_hard_copy_upgrade",
  },
}
