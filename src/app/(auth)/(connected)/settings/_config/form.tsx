"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "convex/react"
import { Controller, useForm } from "react-hook-form"
import { LuArrowRight } from "react-icons/lu"
import { Button } from "@/components/ui/button"
import { Field, FieldContent, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/convex/_generated/api"
import useAuthQuery from "@/hooks/use-auth-query"
import { cn } from "@/lib/utils"
import { Config, config } from "./schema"

export type ConfigFormProps = {
  className?: string
}

export const ConfigForm: React.FC<ConfigFormProps> = ({ className }) => {
  const { account } = useAuthQuery(api.linkedin.query.getState) ?? {}

  return account == null ? (
    <Skeleton className={cn("w-full h-29", className)} />
  ) : (
    <ActualConfigForm
      className={className}
      maxActions={account.maxActions}
      commentPrompt={account.commentPrompt ?? ""}
    />
  )
}

type ActualConfigFormProps = ConfigFormProps & {
  maxActions: number
  commentPrompt: string
}

const ActualConfigForm: React.FC<ActualConfigFormProps> = ({
  maxActions,
  commentPrompt,
  className,
}) => {
  const configure = useMutation(api.linkedin.mutate.configure)
  const form = useForm({
    resolver: zodResolver(Config),
    defaultValues: { maxActions, commentPrompt },
  })

  return (
    <form
      onSubmit={form.handleSubmit(configure)}
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
                min={config.min.maxActions}
                max={config.max.maxActions}
                aria-invalid={fieldState.invalid}
                disabled={form.formState.isSubmitting}
                onChange={(e) => field.onChange(e.target.valueAsNumber)}
              />
            </FieldContent>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="commentPrompt"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Comment Prompt</FieldLabel>
            <FieldContent>
              <Textarea
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                disabled={form.formState.isSubmitting}
                maxLength={config.max.commentPrompt}
              />
            </FieldContent>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Button type="submit" disabled={form.formState.isSubmitting} className="w-fit">
        Save
        {form.formState.isSubmitting ? (
          <Spinner variant="ellipsis" />
        ) : (
          <LuArrowRight className="size-4" />
        )}
      </Button>
    </form>
  )
}
