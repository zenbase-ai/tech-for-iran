"use client"

import Form from "next/form"
import { useActionState } from "react"
import { LuRefreshCcw } from "react-icons/lu"
import { Button, type ButtonProps } from "@/components/ui/button"
import { useActionToastState } from "@/hooks/use-action-state-toasts"
import { cn } from "@/lib/utils"
import { refreshAccount } from "./actions"

export type RefreshFormProps = ButtonProps

export const RefreshForm: React.FC<RefreshFormProps> = ({
  className,
  variant = "outline",
  ...props
}) => {
  const [formState, formAction, formLoading] = useActionState(refreshAccount, {})
  useActionToastState(formState, formLoading)

  return (
    <Form action={formAction} className={className}>
      <Button
        type="submit"
        disabled={formLoading}
        className={cn("w-fit", className)}
        variant={variant}
        {...props}
      >
        <LuRefreshCcw className={cn("size-4", formLoading && "animate-spin")} />
        {formLoading ? "Refreshing..." : "Refresh LinkedIn"}
      </Button>
    </Form>
  )
}
