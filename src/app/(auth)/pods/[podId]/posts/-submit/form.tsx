"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery } from "convex/react"
import { capitalize } from "es-toolkit/string"
import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { HoverButton } from "@/components/ui/hover-button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { useAsyncFn } from "@/hooks/use-async-fn"
import { cn } from "@/lib/utils"
import { calculateSchemaTargetCount, SubmitPostSchema, submitPostSchema } from "./schema"

export type SubmitPostFormProps = {
  podId: Id<"pods">
  className?: string
}

export const SubmitPostForm: React.FC<SubmitPostFormProps> = ({ podId, className }) => {
  const form = useForm<SubmitPostSchema>({
    resolver: zodResolver(SubmitPostSchema),
    defaultValues: submitPostSchema.defaultValues,
  })

  const mutation = useAsyncFn(useMutation(api.posts.submit))
  useEffect(() => {
    if (mutation.complete) form.reset()
  }, [mutation.complete, form.reset])

  const stats = useQuery(api.pods.stats, { podId })
  const submitPostSchemaTargetCount = calculateSchemaTargetCount(stats?.memberCount)
  useEffect(() => {
    form.setValue("targetCount", submitPostSchemaTargetCount.defaultValue)
  }, [form.setValue, submitPostSchemaTargetCount.defaultValue])

  if (!stats) {
    return <Skeleton className={cn("w-full h-84 mt-1", className)} />
  }

  return (
    <form
      onSubmit={form.handleSubmit((data) => mutation.execute({ podId, ...data }))}
      className={cn("w-full flex flex-col gap-6", className)}
    >
      <Field className="flex-row">
        <Controller
          name="url"
          control={form.control}
          render={({ field, fieldState }) => (
            <Input
              {...field}
              id={field.name}
              type="url"
              className="h-12"
              placeholder="https://www.linkedin.com/feed/update/urn:li:activity:..."
              aria-invalid={fieldState.invalid}
              disabled={form.formState.isSubmitting}
              autoFocus
            />
          )}
        />

        <HoverButton type="submit" disabled={form.formState.isSubmitting} className="max-w-fit">
          Submit
        </HoverButton>
      </Field>

      <Controller
        name="reactionTypes"
        control={form.control}
        render={({ field, fieldState }) => (
          <FieldSet className="w-full" data-invalid={fieldState.invalid}>
            <FieldLegend variant="label">Reaction types</FieldLegend>
            <FieldGroup
              className="grid grid-cols-2 sm:grid-cols-3 gap-2"
              data-slot="checkbox-group"
            >
              {submitPostSchema.options.reactionTypes.map((reaction) => (
                <Field key={reaction} orientation="horizontal" data-invalid={fieldState.invalid}>
                  <Checkbox
                    id={`reaction-${reaction}`}
                    name={field.name}
                    checked={field.value.includes(reaction)}
                    onCheckedChange={(checked) => {
                      const newValue = checked
                        ? [...field.value, reaction]
                        : field.value.filter((value) => value !== reaction)
                      field.onChange(newValue)
                    }}
                    aria-invalid={fieldState.invalid}
                    disabled={form.formState.isSubmitting}
                  />
                  <FieldLabel htmlFor={`reaction-${reaction}`} className="font-normal">
                    {capitalize(reaction)}
                  </FieldLabel>
                </Field>
              ))}
            </FieldGroup>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </FieldSet>
        )}
      />

      <Controller
        name="targetCount"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Target engagement count</FieldLabel>
            <Input
              {...field}
              id={field.name}
              type="number"
              min={submitPostSchemaTargetCount.min}
              max={submitPostSchemaTargetCount.max}
              aria-invalid={fieldState.invalid}
              disabled={form.formState.isSubmitting}
              onChange={(e) => field.onChange(e.target.valueAsNumber)}
            />
            <FieldDescription>
              Default: {submitPostSchemaTargetCount.defaultValue}, Min:{" "}
              {submitPostSchemaTargetCount.min}, Max: {submitPostSchemaTargetCount.max}
            </FieldDescription>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <FieldGroup className="grid grid-cols-2 gap-4">
        <Controller
          name="minDelay"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Min delay between reactions in seconds</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="number"
                min={submitPostSchema.min.minDelay}
                max={submitPostSchema.max.minDelay}
                aria-invalid={fieldState.invalid}
                disabled={form.formState.isSubmitting}
                onChange={(e) => field.onChange(e.target.valueAsNumber)}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="maxDelay"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Max delay between reactions in seconds</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="number"
                min={submitPostSchema.min.maxDelay}
                max={submitPostSchema.max.maxDelay}
                aria-invalid={fieldState.invalid}
                disabled={form.formState.isSubmitting}
                onChange={(e) => field.onChange(e.target.valueAsNumber)}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
    </form>
  )
}
