"use client"

import { useEffectEvent, useLayoutEffect, useRef, useState } from "react"
import { flushSync } from "react-dom"
import { LuMoon, LuSun } from "react-icons/lu"

import useReducedMotion from "@/hooks/use-reduced-motion"
import { cn } from "@/lib/utils"

export type ThemeTogglerProps = React.ComponentPropsWithoutRef<"button"> & {
  duration: number
}

export const ThemeToggler: React.FC<ThemeTogglerProps> = ({ className, duration, ...props }) => {
  const reducedMotion = useReducedMotion()
  const [isDark, setDark] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useLayoutEffect(() => {
    const updateTheme = () => setDark(document.documentElement.classList.contains("dark"))

    updateTheme()

    const observer = new MutationObserver(updateTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return observer.disconnect
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
      {
        duration: duration * 1000,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      }
    )
  })

  return (
    <button
      className={cn("border rounded-full p-2 backdrop-blur-md", className)}
      onClick={toggleTheme}
      ref={buttonRef}
      {...props}
    >
      {isDark ? <LuSun /> : <LuMoon />}
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}
