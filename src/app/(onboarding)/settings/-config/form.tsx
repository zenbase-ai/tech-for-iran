"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery } from "convex/react"
import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { LuArrowRight } from "react-icons/lu"
import { Button } from "@/components/ui/button"
import { Field, FieldContent, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { api } from "@/convex/_generated/api"
import { useAsyncFn } from "@/hooks/use-async-fn"
import { cn } from "@/lib/utils"
import { ConfigSchema, type ConfigSchema as ConfigSchemaType, maxActions } from "./schema"

export type ConfigFormProps = {
  className?: string
}

export const ConfigForm: React.FC<ConfigFormProps> = ({ className }) => {
  const linkedin = useQuery(api.linkedin.getState)
  const mutation = useAsyncFn(useMutation(api.linkedin.updateAccount))

  const form = useForm<ConfigSchemaType>({
    resolver: zodResolver(ConfigSchema),
    defaultValues: {
      maxActions: linkedin?.account?.maxActions ?? maxActions.min,
    },
  })

  useEffect(() => {
    if (linkedin?.account?.maxActions) {
      form.setValue("maxActions", linkedin?.account.maxActions)
    }
  }, [linkedin?.account?.maxActions, form.setValue])

  if (!linkedin?.account) {
    return <Skeleton className={cn("w-full h-24", className)} />
  }

  return (
    <form
      onSubmit={form.handleSubmit(mutation.execute)}
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
