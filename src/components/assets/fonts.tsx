import { Crimson_Pro, Geist_Mono, Inter } from "next/font/google"

export const geistMono = Geist_Mono({
  weight: ["400", "600"],
  style: ["normal"],
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
})

export const inter = Inter({
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
})

export const crimsonPro = Crimson_Pro({
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
})
