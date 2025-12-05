import { useMediaQuery } from "usehooks-ts"

export const SCREEN_SIZES = {
  sm: "40rem",
  md: "48rem",
  lg: "64rem",
  xl: "80rem",
  "2xl": "96rem",
} as const

export type ScreenSize = keyof typeof SCREEN_SIZES

export default function useScreenSize(size: ScreenSize): boolean {
  return useMediaQuery(`(min-width: ${SCREEN_SIZES[size]})`)
}
