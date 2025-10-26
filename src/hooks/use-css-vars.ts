import { useLayoutEffect, useMemo, useRef, useState } from "react"

export type UseCSSVarsOptions = {
  root?: Element | null
  darkClass?: string
  lightClass?: string
}

export const useCSSVars = (
  keys: string[],
  { root, darkClass = "dark", lightClass = "light" }: UseCSSVarsOptions = {},
) => {
  const el = root ?? (typeof document !== "undefined" ? document.documentElement : null)
  const [vals, setVals] = useState<string[]>(Array(keys.length).fill(""))
  const rafId = useRef<number | null>(null)
  // biome-ignore lint: intentional serialization for stable deps
  const keysDep = useMemo(() => keys, [keys.toSorted().join(",")])

  useLayoutEffect(() => {
    if (!el) return

    const read = () => {
      const cs = getComputedStyle(el)
      setVals(keysDep.map((k) => cs.getPropertyValue(`--${k}`).trim()))
    }
    const schedule = () => {
      if (rafId.current != null) cancelAnimationFrame(rafId.current)
      rafId.current = requestAnimationFrame(read)
    }

    schedule()

    const mo = new MutationObserver((muts) => {
      for (const m of muts) {
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
    const onMQ = () => schedule()
    mq.addEventListener("change", onMQ)

    return () => {
      mo.disconnect()
      mq.removeEventListener("change", onMQ)
      if (rafId.current) cancelAnimationFrame(rafId.current)
    }
  }, [darkClass, el, keysDep, lightClass])

  return vals
}
