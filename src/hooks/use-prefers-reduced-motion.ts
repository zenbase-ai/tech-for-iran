import { useMediaQuery } from "usehooks-ts"

export default function usePrefersReducedMotion() {
  return !useMediaQuery("(prefers-reduced-motion: no-preference)")
}
