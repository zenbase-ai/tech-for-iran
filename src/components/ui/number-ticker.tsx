"use client"

import { useInView, useMotionValue, useSpring } from "motion/react"
import { type ComponentPropsWithoutRef, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

export type NumberTickerProps = ComponentPropsWithoutRef<"span"> & {
  value: number
  options?: Intl.NumberFormatOptions
  startValue?: number
  direction?: "up" | "down"
  delay?: number
  decimalPlaces?: number
}

export const NumberTicker: React.FC<NumberTickerProps> = ({
  value,
  options,
  startValue = 0,
  direction = "up",
  delay = 0,
  className,
  decimalPlaces = 0,
  ...props
}) => {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(direction === "down" ? value : startValue)
  const springValue = useSpring(motionValue, {
    damping: 60,
    stiffness: 100,
  })
  const isInView = useInView(ref, { once: true, margin: "0px" })

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(
        () => motionValue.set(direction === "down" ? startValue : value),
        delay
      )
      return () => clearTimeout(timer)
    }
  }, [motionValue, isInView, delay, value, direction, startValue])

  useEffect(
    () =>
      springValue.on("change", (latest) => {
        if (ref.current) {
          ref.current.textContent = Intl.NumberFormat("en-US", {
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces,
            ...options,
          }).format(Number(latest.toFixed(decimalPlaces)))
        }
      }),
    [springValue, decimalPlaces, options]
  )

  return (
    <span className={cn("inline-block", className)} ref={ref} {...props}>
      {startValue}
    </span>
  )
}
