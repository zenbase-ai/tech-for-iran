"use client"

import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

export type TooltipProviderProps = React.ComponentProps<typeof TooltipPrimitive.Provider>

export const TooltipProvider: React.FC<TooltipProviderProps> = ({
  delayDuration = 0,
  ...props
}) => (
  <TooltipPrimitive.Provider
    data-slot="tooltip-provider"
    delayDuration={delayDuration}
    {...props}
  />
)

export type TooltipProps = React.ComponentProps<typeof TooltipPrimitive.Root>

export const Tooltip: React.FC<TooltipProps> = ({ ...props }) => (
  <TooltipPrimitive.Root data-slot="tooltip" {...props} />
)

export type TooltipTriggerProps = React.ComponentProps<typeof TooltipPrimitive.Trigger>

export const TooltipTrigger: React.FC<TooltipTriggerProps> = ({ ...props }) => (
  <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
)

export type TooltipContentProps = React.ComponentProps<typeof TooltipPrimitive.Content> & {
  arrow?: boolean
}

export const TooltipContent: React.FC<TooltipContentProps> = ({
  className,
  sideOffset = 0,
  arrow = true,
  children,
  ...props
}) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      className={cn(
        "bg-foreground text-background animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-full px-3 py-1.5 text-sm text-balance",
        className
      )}
      data-slot="tooltip-content"
      sideOffset={sideOffset}
      {...props}
    >
      {children}
      {arrow && (
        <TooltipPrimitive.Arrow className="bg-foreground fill-foreground z-50 size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-[2px]" />
      )}
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
)
