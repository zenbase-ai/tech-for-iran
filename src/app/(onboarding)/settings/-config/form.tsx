"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { type Preloaded, useMutation, usePreloadedQuery } from "convex/react"
import { useEffectEvent } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Field, FieldContent, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import { cn, errorMessage } from "@/lib/utils"
import { ConfigSchema, type ConfigSchema as ConfigSchemaType, maxActions } from "./schema"

export type ConfigFormProps = {
  linkedin: Preloaded<typeof api.linkedin.getState>
  className?: string
}

export const ConfigForm: React.FC<ConfigFormProps> = ({ linkedin, className }) => {
  const { account } = usePreloadedQuery(linkedin)
  const updateAccount = useMutation(api.linkedin.updateAccount)

  const form = useForm<ConfigSchemaType>({
    resolver: zodResolver(ConfigSchema),
    defaultValues: {
      maxActions: account?.maxActions ?? maxActions.min,
    },
  })

  const onSubmit = useEffectEvent(async (data: ConfigSchemaType) => {
    try {
      await updateAccount(data)
      toast.success("Your LinkedIn settings has been updated.")
    } catch (error: unknown) {
      toast.error(errorMessage(error))
    }
  })

  if (!account) {
    return <Skeleton className={cn("w-full h-24", className)} />
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className={cn("w-full flex flex-col gap-4", className)}
    >
      <Controller
        name="maxActions"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Daily Like &amp; Comment Limit</FieldLabel>
            <FieldContent>
              <Input
                {...field}
                id={field.name}
                type="number"
                min={maxActions.min}
                max={maxActions.max}
                aria-invalid={fieldState.invalid}
                disabled={form.formState.isSubmitting}
                onChange={(e) => field.onChange(e.target.valueAsNumber)}
              />
            </FieldContent>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Button type="submit" disabled={form.formState.isSubmitting} className="w-fit">
        {form.formState.isSubmitting ? "Updating..." : "Update"}
      </Button>
    </form>
  )
}
