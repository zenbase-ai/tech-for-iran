"use client"

import { type MotionProps, motion, type Transition } from "motion/react"
import { useMemo } from "react"
import { onlyText } from "react-children-utilities"

import useReducedMotion from "@/hooks/use-reduced-motion"
import { cn, css } from "@/lib/utils"

export type TextShimmerProps = {
  children: React.ReactNode
  as?: React.ElementType
  className?: string
  duration?: number
  spread?: number
  initial?: MotionProps["initial"]
  animate?: MotionProps["animate"]
}

export const TextShimmer: React.FC<TextShimmerProps> = ({
  children,
  as: Component = "p",
  className,
  duration = 2,
  spread = 2,
  initial = { backgroundPosition: "100% center" },
  animate = { backgroundPosition: "0% center" },
}) => {
  const MotionComponent = motion.create(Component as keyof React.JSX.IntrinsicElements)
  const reducedMotion = useReducedMotion()

  const transition: Transition = useMemo(
    () =>
      reducedMotion ? { duration } : { duration, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
    [reducedMotion, duration]
  )

  const dynamicSpread = useMemo(() => onlyText(children).length * spread * 0.25, [children, spread])

  const style = useMemo(
    () =>
      css({
        "--spread": `${dynamicSpread}px`,
        backgroundImage: "var(--bg), linear-gradient(var(--base-color), var(--base-color))",
      }),
    [dynamicSpread]
  )

  return (
    <MotionComponent
      animate={animate}
      className={cn(
        "relative inline-block bg-size-[250%_100%,auto] bg-clip-text",
        "text-transparent [--base-color:#91918d] [--base-gradient-color:#191919]",
        "[background-repeat:no-repeat,padding-box] [--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--base-gradient-color),#0000_calc(50%+var(--spread)))]",
        "dark:[--base-color:#91918d] dark:[--base-gradient-color:#fafaf7] dark:[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--base-gradient-color),#0000_calc(50%+var(--spread)))]",
        className
      )}
      initial={initial}
      style={style}
      transition={transition}
    >
      {children}
    </MotionComponent>
  )
}
