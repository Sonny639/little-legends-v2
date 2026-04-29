import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Create",
  robots: {
    index: false,
    follow: false,
  },
}

export default function CreateLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
