"use client"

import { useEffectEvent, useMemo, useRef, useState } from "react"
import { useIsomorphicLayoutEffect } from "usehooks-ts"

export type UseCSSVarsOptions = {
  root?: Element | null
  darkClass?: string
  lightClass?: string
}

export const useCSSVars = (
  keys: string[],
  { root, darkClass = "dark", lightClass = "light" }: UseCSSVarsOptions = {}
) => {
  const el = root ?? (typeof document !== "undefined" ? document.documentElement : null)
  const [vals, setVals] = useState<string[]>(new Array(keys.length).fill(""))
  const animationFrame = useRef<number | null>(null)
  // biome-ignore lint: intentional serialization for stable deps
  const keysDep = useMemo(() => keys, [keys.toSorted().join(",")])

  const read = useEffectEvent(() => {
    if (el) {
      const cs = getComputedStyle(el)
      setVals(keysDep.map((k) => cs.getPropertyValue(`--${k}`).trim()))
    }
  })

  const schedule = useEffectEvent(() => {
    if (animationFrame.current != null) {
      cancelAnimationFrame(animationFrame.current)
    }
    animationFrame.current = requestAnimationFrame(read)
  })

  const cancel = useEffectEvent(() => {
    if (animationFrame.current != null) {
      cancelAnimationFrame(animationFrame.current)
    }
  })

  useIsomorphicLayoutEffect(() => {
    if (!el) {
      return
    }

    schedule()

    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: intentional complexity
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === "class") {
          const cls = (m.target as Element).classList
          // Only re-read if dark/light presence changed; handles ".light" + ".dark" coexisting.
          if (m.oldValue !== cls.value && (cls.contains(darkClass) || cls.contains(lightClass))) {
            schedule()
            break
          }
        } else if (m.attributeName === "data-theme" || m.attributeName === "style") {
          schedule()
          break
        }
      }
    })
    mo.observe(el, {
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ["class", "data-theme", "style"],
    })

    const mq = matchMedia("(prefers-color-scheme: dark)")
    mq.addEventListener("change", schedule)

    return () => {
      mo.disconnect()
      mq.removeEventListener("change", schedule)
      cancel()
    }
  }, [darkClass, el, keysDep, lightClass])

  return vals
}
