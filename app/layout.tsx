import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3003"),
  title: {
    default: "Little Legends Story | Personalised Magical Storybooks",
    template: "%s | Little Legends Story",
  },
  description:
    "Launching soon: personalised magical storybooks where your child becomes the hero of a bedtime adventure.",
  openGraph: {
    title: "Little Legends Story",
    description: "Personalised magical storybooks where your child becomes the hero.",
    images: ["/inspiration/magic-reference.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Little Legends Story",
    description: "Personalised magical storybooks where your child becomes the hero.",
    images: ["/inspiration/magic-reference.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
