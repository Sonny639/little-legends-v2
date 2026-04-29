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
    label: "Digital PDF",
    price: 4.99,
    unitAmountPence: 499,
    currency: "gbp",
    summary: "Email confirmation plus instant download access.",
    button: "Buy Digital",
    stripeLookupKey: "little_legends_digital_pdf",
  },
  hardback: {
    label: "Hardback Book",
    price: 14.99,
    unitAmountPence: 1499,
    currency: "gbp",
    summary: "Printed copy posted to you, with a digital copy included.",
    button: "Order Hardback",
    stripeLookupKey: "little_legends_hardback_book",
  },
  upgrade: {
    label: "Hard Copy Upgrade",
    price: 10,
    unitAmountPence: 1000,
    currency: "gbp",
    summary: "Add the printed copy after buying the digital version.",
    button: "Upgrade to Hard Copy",
    stripeLookupKey: "little_legends_hard_copy_upgrade",
  },
}
