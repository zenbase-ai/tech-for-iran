"use client"

import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"
import type { VariantProps } from "class-variance-authority"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type AlertDialogProps = React.ComponentProps<typeof AlertDialogPrimitive.Root>

export const AlertDialog: React.FC<AlertDialogProps> = ({ ...props }) => (
  <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
)

export const AlertDialogTrigger: React.FC<
  React.ComponentProps<typeof AlertDialogPrimitive.Trigger>
> = ({ ...props }) => <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />

export const AlertDialogPortal: React.FC<
  React.ComponentProps<typeof AlertDialogPrimitive.Portal>
> = ({ ...props }) => <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />

export const AlertDialogOverlay: React.FC<
  React.ComponentProps<typeof AlertDialogPrimitive.Overlay>
> = ({ className, ...props }) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
      className
    )}
    data-slot="alert-dialog-overlay"
    {...props}
  />
)

export const AlertDialogContent: React.FC<
  React.ComponentProps<typeof AlertDialogPrimitive.Content>
> = ({ className, ...props }) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      className={cn(
        "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
        className
      )}
      data-slot="alert-dialog-content"
      {...props}
    />
  </AlertDialogPortal>
)

export const AlertDialogHeader: React.FC<React.ComponentProps<"div">> = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
    data-slot="alert-dialog-header"
    {...props}
  />
)

export const AlertDialogFooter: React.FC<React.ComponentProps<"div">> = ({
  className,
  ...props
}) => (
  <div
    className={cn("mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
    data-slot="alert-dialog-footer"
    {...props}
  />
)

export const AlertDialogTitle: React.FC<
  React.ComponentProps<typeof AlertDialogPrimitive.Title>
> = ({ className, ...props }) => (
  <AlertDialogPrimitive.Title
    className={cn("text-xl font-semibold font-serif italic", className)}
    data-slot="alert-dialog-title"
    {...props}
  />
)

export const AlertDialogDescription: React.FC<
  React.ComponentProps<typeof AlertDialogPrimitive.Description>
> = ({ className, ...props }) => (
  <AlertDialogPrimitive.Description
    className={cn("text-muted-foreground", className)}
    data-slot="alert-dialog-description"
    {...props}
  />
)

export const AlertDialogAction: React.FC<
  React.ComponentProps<typeof AlertDialogPrimitive.Action> & VariantProps<typeof buttonVariants>
> = ({ className, variant = "default", size, ...props }) => (
  <AlertDialogPrimitive.Action
    className={cn(buttonVariants({ variant, size, className }))}
    {...props}
  />
)

export const AlertDialogCancel: React.FC<
  React.ComponentProps<typeof AlertDialogPrimitive.Cancel> & VariantProps<typeof buttonVariants>
> = ({ className, variant = "ghost", size, ...props }) => (
  <AlertDialogPrimitive.Cancel
    className={cn(buttonVariants({ variant, size, className }))}
    {...props}
  />
)
