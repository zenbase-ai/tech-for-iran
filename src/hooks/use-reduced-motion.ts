import { useMediaQuery } from "usehooks-ts"

export default function useReducedMotion() {
  return !useMediaQuery("(prefers-reduced-motion: no-preference)")
}
