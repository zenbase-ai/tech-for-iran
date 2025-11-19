import { cva, type VariantProps } from "class-variance-authority"
import type React from "react"
import { LuArrowRight } from "react-icons/lu"
import { Box } from "@/components/layout/box"
import { cn } from "@/lib/utils"

const hoverButtonVariants = cva(
  "group relative w-auto cursor-pointer overflow-hidden border border-transparent border-2 rounded-lg p-2 px-4 sm:px-6 text-center text-sm sm:text-base font-semibold disabled:pointer-events-none disabled:opacity-50 ",
  {
    variants: {
      variant: {
        primary: "bg-primary text-background hover:text-primary-foreground",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  }
)

const dotVariants = cva(
  "h-2 w-2 rounded-lg transition-all duration-300 group-hover:scale-[100.8]",
  {
    variants: {
      variant: {
        primary: "bg-background border-primary",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  }
)

const overlayVariants = cva(
  "absolute top-0 z-10 flex h-full w-full translate-x-12 items-center justify-center gap-2 opacity-0 transition-all duration-300 group-hover:-translate-x-5 group-hover:opacity-100",
  {
    variants: {
      variant: {
        primary: "text-primary",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  }
)

export type HoverButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof hoverButtonVariants> & {
    ref?: React.RefObject<HTMLButtonElement>
    hoverChildren?: React.ReactNode
  }

export const HoverButton: React.FC<HoverButtonProps> = ({
  ref,
  children,
  className,
  variant,
  hoverChildren,
  ...props
}) => (
  <button className={cn(hoverButtonVariants({ variant }), className)} ref={ref} {...props}>
    <Box className="flex items-center gap-2">
      <Box className={cn(dotVariants({ variant }))} />
      <span className="inline-block transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0">
        {children}
      </span>
    </Box>
    <Box className={cn(overlayVariants({ variant }))}>
      <span>{hoverChildren ?? children}</span>
      <LuArrowRight className="size-4" />
    </Box>
  </button>
)
