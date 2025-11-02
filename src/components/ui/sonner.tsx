"use client"

import { useTheme } from "next-themes"
import { LuCircleCheck, LuInfo, LuLoader, LuOctagonX, LuTriangleAlert } from "react-icons/lu"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { cn, css } from "@/lib/utils"

export const Toaster: React.FC<ToasterProps> = ({ className, ...props }) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className={cn("toaster group", className)}
      icons={{
        success: <LuCircleCheck className="size-5" />,
        info: <LuInfo className="size-5" />,
        warning: <LuTriangleAlert className="size-5" />,
        error: <LuOctagonX className="size-5" />,
        loading: <LuLoader className="size-5 animate-spin" />,
      }}
      style={css({
        "--normal-bg": "var(--popover)",
        "--normal-text": "var(--popover-foreground)",
        "--normal-border": "var(--border)",
        "--border-radius": "var(--radius)",
      })}
      toastOptions={{
        unstyled: true,
        className:
          "py-3 px-6 rounded-full flex flex-row items-center gap-4 bg-muted/80 backdrop-blur-md border-1 border-muted",
        classNames: {
          icon: "size-5",
          loader: "!left-[20%]",
          content: "leading-[1.2]",
          title: "text-base font-medium",
          description: "text-sm font-normal",
          success: "!bg-green-500 text-white",
          info: "!bg-blue-500 text-white",
          warning: "!bg-yellow-500 text-white",
          error: "!bg-red-500 text-white",
          loading: "!bg-purple-500 text-white",
        },
      }}
      {...props}
    />
  )
}
