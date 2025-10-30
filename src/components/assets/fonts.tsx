import { Crimson_Pro, Inter } from "next/font/google"

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
