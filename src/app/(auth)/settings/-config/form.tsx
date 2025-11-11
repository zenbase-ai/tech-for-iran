"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "convex/react"
import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { LuArrowRight } from "react-icons/lu"
import { Button } from "@/components/ui/button"
import { Field, FieldContent, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { api } from "@/convex/_generated/api"
import useAsyncFn from "@/hooks/use-async-fn"
import useAuthQuery from "@/hooks/use-auth-query"
import { cn } from "@/lib/utils"
import { ConfigSchema, type ConfigSchema as ConfigSchemaType, configSchema } from "./schema"

export type ConfigFormProps = {
  className?: string
}

export const ConfigForm: React.FC<ConfigFormProps> = ({ className }) => {
  const mutate = useAsyncFn(useMutation(api.fns.linkedin.updateAccount))
  const linkedin = useAuthQuery(api.fns.linkedin.getState)

  const form = useForm<ConfigSchemaType>({
    resolver: zodResolver(ConfigSchema),
    defaultValues: configSchema.defaultValues,
  })

  const maxActions = linkedin?.account?.maxActions
  useEffect(() => {
    if (maxActions != null) {
      form.setValue("maxActions", maxActions)
    }
  }, [maxActions, form.setValue])

  const isLoading = maxActions == null
  if (isLoading) {
    return <Skeleton className={cn("w-full h-29", className)} />
  }

  return (
    <form
      onSubmit={form.handleSubmit(mutate.execute)}
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
                min={configSchema.min.maxActions}
                max={configSchema.max.maxActions}
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
        Update
        {form.formState.isSubmitting ? (
          <Spinner variant="ellipsis" />
        ) : (
          <LuArrowRight className="size-4" />
        )}
      </Button>
    </form>
  )
}
