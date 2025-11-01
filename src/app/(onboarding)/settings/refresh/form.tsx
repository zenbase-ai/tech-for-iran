"use client"

import Form from "next/form"
import { useActionState, useEffect } from "react"
import { LuRefreshCcw } from "react-icons/lu"
import { toast } from "sonner"
import { Button, type ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { refreshAccount } from "./actions"

export type RefreshFormProps = {
  className?: string
  variant?: ButtonProps["variant"]
}

export const RefreshForm: React.FC<RefreshFormProps> = ({ className, variant = "outline" }) => {
  const [formState, formAction, formLoading] = useActionState(refreshAccount, {})

  useEffect(() => {
    if (!formLoading && formState.message) {
      toast.success(formState.message)
    }
  }, [formLoading, formState.message])

  useEffect(() => {
    if (!formLoading && formState?.error) {
      toast.error(formState.error)
    }
  }, [formLoading, formState?.error])

  return (
    <Form action={formAction} className={className}>
      <Button type="submit" disabled={formLoading} className="w-fit" variant={variant}>
        <LuRefreshCcw className={cn("size-4", formLoading && "animate-spin")} />
        {formLoading ? "Refreshing..." : "Refresh LinkedIn"}
      </Button>
    </Form>
  )
}
