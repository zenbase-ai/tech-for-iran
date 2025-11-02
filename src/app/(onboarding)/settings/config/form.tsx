"use client"

import { type Preloaded, usePreloadedQuery } from "convex/react"
import Form from "next/form"
import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Field, FieldContent, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import type { api } from "@/convex/_generated/api"
import { useActionToastState } from "@/hooks/use-action-state-toasts"
import { cn } from "@/lib/utils"
import { updateConfig } from "./actions"
import { maxActions } from "./schema"

export type ConfigFormProps = {
  linkedin: Preloaded<typeof api.linkedin.getState>
  className?: string
}

export const ConfigForm: React.FC<ConfigFormProps> = ({ linkedin, className }) => {
  const { account } = usePreloadedQuery(linkedin)
  const [formState, formAction, formLoading] = useActionState(updateConfig, {})
  useActionToastState(formState, formLoading)

  if (!account) {
    return <Skeleton className={cn("w-full h-24", className)} />
  }

  return (
    <Form action={formAction} className={cn("w-full flex flex-col gap-4", className)}>
      <Field>
        <FieldLabel htmlFor="maxActions">Daily Like &amp; Comment Limit</FieldLabel>
        <FieldContent>
          <Input
            disabled={formLoading}
            id="maxActions"
            name="maxActions"
            type="number"
            min={maxActions.min}
            max={maxActions.max}
            defaultValue={account.maxActions}
            required
          />
        </FieldContent>
      </Field>

      <Button type="submit" disabled={formLoading} className="w-fit">
        {formLoading ? "Updating..." : "Update"}
      </Button>

      {formState?.error && <FieldError>{formState.error}</FieldError>}
    </Form>
  )
}
