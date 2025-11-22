"use client"

import { useTheme } from "next-themes"
import { LuCircleCheck, LuInfo, LuOctagonX, LuTriangleAlert } from "react-icons/lu"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { cn, css } from "@/lib/utils"
import { Spinner } from "./spinner"

export const Toaster: React.FC<ToasterProps> = ({ className, ...props }) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      className={cn("toaster group", className)}
      icons={{
        success: <LuCircleCheck />,
        info: <LuInfo />,
        warning: <LuTriangleAlert />,
        error: <LuOctagonX />,
        loading: <Spinner variant="circle" />,
      }}
      style={css({
        "--normal-bg": "var(--popover)",
        "--normal-text": "var(--popover-foreground)",
        "--normal-border": "var(--border)",
        "--border-radius": "var(--radius)",
      })}
      theme={theme as ToasterProps["theme"]}
      toastOptions={{
        unstyled: true,
        className: cn(
          "w-full p-3 rounded-full flex flex-row items-center justify-between gap-2",
          "bg-background/50 backdrop-blur-md border-1 border-muted"
        ),
        classNames: {
          icon: "size-4",
          loader: "!left-[20%]",
          content: "leading-[1.2] w-full",
          title: "text-sm font-medium",
          description: "text-xs font-medium",
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
