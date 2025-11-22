"use client"

import { useTheme } from "next-themes"
import { useEffectEvent, useRef } from "react"
import { flushSync } from "react-dom"
import { LuMoon, LuSun } from "react-icons/lu"
import { Button, type ButtonProps } from "@/components/ui/button"
import usePrefersReducedMotion from "@/hooks/use-prefers-reduced-motion"

export type ThemeTogglerProps = Omit<ButtonProps, "size"> & {
  duration?: number
}

export const ThemeToggler: React.FC<ThemeTogglerProps> = ({
  className,
  duration = 500,
  variant = "ghost",
  ...props
}) => {
  const { resolvedTheme, setTheme } = useTheme()
  const toggleTheme = useEffectEvent(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"))

  const ref = useRef<HTMLButtonElement>(null)
  const prefersReducedMotion = usePrefersReducedMotion()

  const transitionTheme = useEffectEvent(() => {
    const boundingRect = ref.current?.getBoundingClientRect()
    if (boundingRect) {
      const { top, left, width, height } = boundingRect
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
    }
  })

  const onClick = useEffectEvent(() => {
    if (prefersReducedMotion) {
      toggleTheme()
    } else {
      document.startViewTransition(() => flushSync(toggleTheme)).ready.then(transitionTheme)
    }
  })

  return (
    <Button
      className={className}
      onClick={onClick}
      ref={ref}
      size="icon"
      variant={variant}
      {...props}
    >
      {resolvedTheme === "dark" ? <LuSun /> : <LuMoon />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
