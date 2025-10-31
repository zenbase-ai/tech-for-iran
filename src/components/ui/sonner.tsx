"use client"

import { useTheme } from "next-themes"
import { LuCircleCheck, LuInfo, LuLoader, LuOctagonX, LuTriangleAlert } from "react-icons/lu"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { css } from "@/lib/utils"

export const Toaster: React.FC<ToasterProps> = ({ ...props }) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <LuCircleCheck className="size-4" />,
        info: <LuInfo className="size-4" />,
        warning: <LuTriangleAlert className="size-4" />,
        error: <LuOctagonX className="size-4" />,
        loading: <LuLoader className="size-4 animate-spin" />,
      }}
      style={css({
        "--normal-bg": "var(--popover)",
        "--normal-text": "var(--popover-foreground)",
        "--normal-border": "var(--border)",
        "--border-radius": "var(--radius)",
      })}
      {...props}
    />
  )
}
