"use client"

import { cva, type VariantProps } from "class-variance-authority"
import { AnimatePresence, type HTMLMotionProps, motion } from "motion/react"
import { useEffect, useEffectEvent, useState } from "react"
import { LuCheck, LuCopy } from "react-icons/lu"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export const buttonVariants = cva(
  "inline-flex items-center justify-center cursor-pointer rounded-full transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive text-base",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        muted: "bg-muted text-muted-foreground",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
      },
      size: {
        default: "h-9 gap-2 px-4 py-2 has-[>svg]:px-3 [&_svg]:size-4",
        sm: "h-8 gap-1.5 px-3 [&_svg]:size-3 text-sm",
        lg: "h-[47px] gap-3 p-3 [&_svg]:size-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export type CopyButtonProps = Omit<HTMLMotionProps<"button">, "children" | "onCopy"> &
  VariantProps<typeof buttonVariants> & {
    icon?: React.FC
    content?: string
    delay?: number
    onCopy?: (content: string) => void
    isCopied?: boolean
    onCopyChange?: (isCopied: boolean) => void
  }

export const CopyButton: React.FC<React.PropsWithChildren<CopyButtonProps>> = ({
  content,
  className,
  size,
  variant,
  icon: CopyIcon = LuCopy,
  delay = 2000,
  onClick,
  onCopy,
  isCopied,
  onCopyChange,
  children,
  ...props
}) => {
  const [localIsCopied, setLocalIsCopied] = useState(isCopied ?? false)
  const Icon = localIsCopied ? LuCheck : CopyIcon

  useEffect(() => {
    setLocalIsCopied(isCopied ?? false)
  }, [isCopied])

  const handleIsCopied = useEffectEvent((newValue: boolean) => {
    setLocalIsCopied(newValue)
    onCopyChange?.(newValue)
  })

  const handleCopy = useEffectEvent(async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isCopied) {
      return
    }
    if (content) {
      try {
        await navigator.clipboard.writeText(content)
        handleIsCopied(true)
        setTimeout(() => handleIsCopied(false), delay)
        onCopy?.(content)
      } catch (error) {
        console.error("Error copying command", error)
        toast.error("Failed to copy.")
      }
    }
    onClick?.(e)
  })

  return (
    <motion.button
      className={cn(
        buttonVariants({ variant, size }),
        !localIsCopied || "pointer-events-none",
        className
      )}
      layout
      onClick={handleCopy}
      {...props}
    >
      {children}
      <AnimatePresence mode="wait">
        <motion.span
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          initial={{ scale: 0 }}
          key={localIsCopied ? "check" : "copy"}
          transition={{ duration: 0.15 }}
        >
          <Icon className="inline" />
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}
