"use client"

import { useEffectEvent, useLayoutEffect, useRef, useState } from "react"
import { flushSync } from "react-dom"
import { LuMoon, LuSun } from "react-icons/lu"
import { Button, type ButtonProps } from "@/components/ui/button"
import useReducedMotion from "@/hooks/use-reduced-motion"

export type ThemeTogglerProps = Omit<ButtonProps, "size"> & {
  duration?: number
}

export const ThemeToggler: React.FC<ThemeTogglerProps> = ({
  className,
  duration = 500,
  variant = "ghost",
  ...props
}) => {
  const reducedMotion = useReducedMotion()
  const [isDark, setDark] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const syncDark = useEffectEvent(() =>
    setDark(document.documentElement.classList.contains("dark"))
  )

  useLayoutEffect(syncDark, [])
  useLayoutEffect(() => {
    const observer = new MutationObserver(syncDark)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return observer.disconnect.bind(observer)
  }, [])

  const toggleTheme = useEffectEvent(async () => {
    if (!buttonRef.current) {
      return
    }

    await document.startViewTransition(() => {
      flushSync(() => {
        const newTheme = !isDark
        setDark(newTheme)
        document.documentElement.classList.toggle("dark")
        localStorage.setItem("theme", newTheme ? "dark" : "light")
      })
    }).ready

    if (reducedMotion) {
      return
    }

    const { top, left, width, height } = buttonRef.current.getBoundingClientRect()
    const x = left + width / 2
    const y = top + height / 2
    const maxRadius = Math.hypot(
      Math.max(left, window.innerWidth - left),
      Math.max(top, window.innerHeight - top)
    )

    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${maxRadius}px at ${x}px ${y}px)`] },
      { duration, easing: "ease-in-out", pseudoElement: "::view-transition-new(root)" }
    )
  })

  return (
    <Button
      className={className}
      onClick={toggleTheme}
      ref={buttonRef}
      size="icon"
      variant={variant}
      {...props}
    >
      {isDark ? <LuSun /> : <LuMoon />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
