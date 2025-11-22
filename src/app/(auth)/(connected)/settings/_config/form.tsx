"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "convex/react"
import { Controller, useForm } from "react-hook-form"
import { LuArrowRight } from "react-icons/lu"
import { SectionTitle } from "@/components/layout/text"
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

  if (account == null) {
    return <Skeleton className={cn("w-full h-29", className)} />
  }

  return (
    <ActualConfigForm
      className={className}
      commentPrompt={account.commentPrompt ?? ""}
      maxActions={account.maxActions}
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
  const { isSubmitting } = form.formState

  return (
    <form
      className={cn("w-full flex flex-col gap-4", className)}
      onSubmit={form.handleSubmit(configure)}
    >
      <SectionTitle>Configuration</SectionTitle>

      <Controller
        control={form.control}
        name="maxActions"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Daily Like &amp; Comment Limit</FieldLabel>
            <FieldContent>
              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                disabled={isSubmitting}
                id={field.name}
                max={config.max.maxActions}
                min={config.min.maxActions}
                onChange={(e) => field.onChange(e.target.valueAsNumber)}
                type="number"
              />
            </FieldContent>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        control={form.control}
        name="commentPrompt"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Comment Prompt</FieldLabel>
            <FieldContent>
              <Textarea
                {...field}
                aria-invalid={fieldState.invalid}
                disabled={isSubmitting}
                id={field.name}
                maxLength={config.max.commentPrompt}
              />
            </FieldContent>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Button className="w-fit" disabled={isSubmitting} type="submit" variant="outline">
        Save
        {isSubmitting ? <Spinner variant="ellipsis" /> : <LuArrowRight />}
      </Button>
    </form>
  )
}
