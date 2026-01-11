"use client"
import { motion, type TargetAndTransition, type Transition } from "motion/react"
import { cn, css } from "@/lib/utils"

export type GlowEffectProps = {
  className?: string
  style?: React.CSSProperties
  colors?: string[]
  mode?: "rotate" | "pulse" | "breathe" | "static"
  blur?: number | "softest" | "soft" | "medium" | "strong" | "stronger" | "strongest" | "none"
  transition?: Transition
  scale?: number
  duration?: number
}

export const GlowEffect: React.FC<GlowEffectProps> = ({
  className,
  style,
  colors = [
    "oklch(0.83291 0.14388 83.366)", // yellow
    "oklch(0.62822 0.14389 142.999)", // green
    "oklch(0.53678 0.2199 28.694)", // red
  ],
  mode = "breathe",
  blur = "strongest",
  transition,
  scale = 1.025,
  duration = 5,
}) => {
  const BASE_TRANSITION = {
    repeat: Number.POSITIVE_INFINITY,
    duration,
    ease: "linear",
  }

  const animations = {
    rotate: {
      background: [
        `conic-gradient(from 0deg at 50% 50%, ${colors.join(", ")})`,
        `conic-gradient(from 360deg at 50% 50%, ${colors.join(", ")})`,
      ],
      transition: {
        ...(transition ?? BASE_TRANSITION),
      },
    },
    pulse: {
      background: colors.map(
        (color) => `radial-gradient(circle at 50% 50%, ${color} 0%, transparent 100%)`
      ),
      scale: [1 * scale, 1.1 * scale, 1 * scale],
      opacity: [0.5, 0.8, 0.5],
      transition: {
        ...(transition ?? {
          ...BASE_TRANSITION,
          repeatType: "mirror",
        }),
      },
    },
    breathe: {
      background: [
        ...colors.map(
          (color) => `radial-gradient(circle at 50% 50%, ${color} 0%, transparent 100%)`
        ),
      ],
      scale: [1 * scale, 1.05 * scale, 1 * scale],
      transition: {
        ...(transition ?? {
          ...BASE_TRANSITION,
          repeatType: "mirror",
        }),
      },
    },
    static: {
      background: `linear-gradient(to right, ${colors.join(", ")})`,
    },
  }

  const getBlurClass = (blur: GlowEffectProps["blur"]) => {
    if (typeof blur === "number") {
      return `blur-[${blur}px]`
    }

    const presets = {
      softest: "blur-xs",
      soft: "blur-sm",
      medium: "blur-md",
      strong: "blur-lg",
      stronger: "blur-xl",
      strongest: "blur-xl",
      none: "blur-none",
    }

    return presets[blur as keyof typeof presets]
  }

  return (
    <motion.div
      animate={animations[mode] as TargetAndTransition}
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full",
        "scale-(--scale) transform-gpu",
        getBlurClass(blur),
        className
      )}
      style={css({
        ...style,
        "--scale": scale,
        willChange: "transform",
        backfaceVisibility: "hidden",
      })}
    />
  )
}
