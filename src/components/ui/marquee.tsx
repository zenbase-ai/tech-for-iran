"use client"

import FastMarquee, { type MarqueeProps as FastMarqueeProps } from "react-fast-marquee"
import { Box, type BoxProps } from "@/components/layout/box"
import { cn } from "@/lib/utils"

export type MarqueeProps = BoxProps

export const Marquee: React.FC<MarqueeProps> = ({ className, ...props }) => (
  <Box className={cn("relative w-full overflow-hidden", className)} {...props} />
)

export type MarqueeContentProps = FastMarqueeProps

export const MarqueeContent: React.FC<MarqueeContentProps> = ({
  loop = 0,
  autoFill = true,
  ...props
}) => <FastMarquee autoFill={autoFill} loop={loop} {...props} />

export type MarqueeFadeProps = React.HTMLAttributes<HTMLDivElement> & {
  side: "left" | "right"
}

export const MarqueeFade: React.FC<MarqueeFadeProps> = ({ className, side, ...props }) => (
  <Box
    className={cn(
      "absolute top-0 bottom-0 z-10 h-full w-32 from-background to-transparent",
      side === "left" ? "left-0 bg-gradient-to-r" : "right-0 bg-gradient-to-l",
      className,
    )}
    {...props}
  />
)

export type MarqueeItemProps = React.HTMLAttributes<HTMLDivElement>

export const MarqueeItem: React.FC<MarqueeItemProps> = ({ className, ...props }) => (
  <Box className={cn("mx-2 flex-shrink-0 object-contain", className)} {...props} />
)
