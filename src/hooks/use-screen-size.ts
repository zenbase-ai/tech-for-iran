import { useMediaQuery } from "usehooks-ts"

export const SCREEN_SIZES = {
  sm: "40rem",
  md: "48rem",
  lg: "64rem",
  xl: "80rem",
  "2xl": "96rem",
} as const

export type ScreenSize = keyof typeof SCREEN_SIZES

export default function useScreenSize() {
  return {
    sm: useMediaQuery(`(min-width: ${SCREEN_SIZES.sm})`),
    md: useMediaQuery(`(min-width: ${SCREEN_SIZES.md})`),
    lg: useMediaQuery(`(min-width: ${SCREEN_SIZES.lg})`),
    xl: useMediaQuery(`(min-width: ${SCREEN_SIZES.xl})`),
    "2xl": useMediaQuery(`(min-width: ${SCREEN_SIZES["2xl"]})`),
  }
}
