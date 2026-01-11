"use client"

import { useState } from "react"
import { motion, type Variants } from "motion/react"
import { Box, type BoxProps } from "@/components/layout/box"
import { GlowEffect } from "@/components/ui/glow-effect"
import { cn } from "@/lib/utils"
import { IslamicRepublicFlag } from "./islamic-republic-flag"
import { LionFlag } from "./lion-flag"
import { Lion } from "./lion"
import { Logo } from "./logo"

const duration = 1.3

const islamicRepublicVariants: Variants = {
  initial: { opacity: 0, filter: "grayscale(0.1) blur(0px)" },
  animate: {
    filter: [
      "grayscale(0.1) blur(0px)",
      "grayscale(1) blur(0px)",
      "grayscale(1) blur(20px)",
      "grayscale(1) blur(20px)",
    ],
    opacity: [0, 1, 1, 0, 0],
    transition: {
      duration: duration * 8,
      times: [0, 0.5 / 8, 1 / 8, 4 / 8, 1],
      ease: "easeInOut",
    },
  },
}

const logoVariants: Variants = {
  initial: { opacity: 0, scale: 0.8, filter: "blur(10px)", rotate: 0 },
  animate: {
    opacity: [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
    scale: [0.8, 0.8, 1, 1, 1, 1, 1, 1, 1.1, 1.1],
    rotate: [0, 0, 0, 5, -5, 5, -5, 0, 0, 0],
    filter: [
      "blur(10px)",
      "blur(10px)",
      "blur(0px)",
      "blur(0px)",
      "blur(0px)",
      "blur(0px)",
      "blur(0px)",
      "blur(0px)",
      "blur(10px)",
      "blur(10px)",
    ],
    transition: {
      duration: duration * 8,
      times: [0, 1.5 / 8, 2.5 / 8, 3.5 / 8, 4.25 / 8, 5 / 8, 5.75 / 8, 6.5 / 8, 7.5 / 8, 1],
      ease: "easeInOut",
    },
  },
}

const lionElementVariants: Variants = {
  initial: { opacity: 0, filter: "blur(10px)", scale: 0.5 },
  animate: {
    opacity: 1,
    filter: "blur(0px)",
    scale: 1,
    transition: {
      duration: duration * 1.5,
      delay: duration * 7,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    filter: "blur(10px)",
    scale: 0.5,
    transition: {
      duration: 0.5,
      ease: "easeIn",
    },
  },
}

const lionFlagVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: duration,
      delay: duration * 8.5,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.5,
      ease: "easeIn",
    },
  },
}

export const RisingLion: React.FC<BoxProps> = ({ className, ...props }) => {
  const [restartKey, setRestartKey] = useState(0)
  const [isExiting, setIsExiting] = useState(false)
  const [isIdle, setIsIdle] = useState(false)

  const handleAnimationComplete = (definition: unknown) => {
    if (definition === "animate") {
      setIsIdle(true)
    } else if (definition === "exit") {
      setIsExiting(false)
      setIsIdle(false)
      setRestartKey((prev) => prev + 1)
    }
  }

  const handleClick = () => {
    if (isIdle && !isExiting) {
      setIsExiting(true)
    }
  }

  return (
    <Box
      className={cn("relative aspect-7/4 w-full", isIdle && "cursor-pointer", className)}
      onClick={handleClick}
      {...props}
    >
      <motion.div
        animate="animate"
        className="absolute inset-0 z-1"
        initial="initial"
        key={`ir-${restartKey}`}
        variants={islamicRepublicVariants}
      >
        <IslamicRepublicFlag className="size-full" />
      </motion.div>

      <motion.div
        animate={isExiting ? "exit" : "animate"}
        className="absolute inset-0 z-2"
        initial="initial"
        key={`lion-flag-${restartKey}`}
        onAnimationComplete={handleAnimationComplete}
        variants={lionFlagVariants}
      >
        <LionFlag className="size-full" />
      </motion.div>

      <motion.div
        animate={isExiting ? "exit" : "animate"}
        className="absolute z-3"
        initial="initial"
        key={`lion-element-${restartKey}`}
        style={{
          left: "36.26%",
          top: "28.94%",
          width: "27.46%",
        }}
        variants={lionElementVariants}
      >
        <GlowEffect />
        <Lion className="size-full relative" />
      </motion.div>

      <motion.div
        animate="animate"
        className="absolute inset-0 z-4 flex items-center justify-center"
        initial="initial"
        key={`logo-${restartKey}`}
        variants={logoVariants}
      >
        <Logo className="h-2/3 w-auto" />
      </motion.div>
    </Box>
  )
}
