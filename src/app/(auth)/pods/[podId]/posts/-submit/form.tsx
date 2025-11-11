"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useAction, useMutation } from "convex/react"
import { capitalize } from "es-toolkit/string"
import { useEffect, useEffectEvent } from "react"
import { Controller, useForm } from "react-hook-form"
import { Box } from "@/components/layout/box"
import { HStack } from "@/components/layout/stack"
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
import useAsyncFn from "@/hooks/use-async-fn"
import useAuthQuery from "@/hooks/use-auth-query"
import { cn } from "@/lib/utils"
import { calculateSchemaTargetCount, SubmitPostSchema, submitPostSchema } from "./schema"

export type SubmitPostFormProps = {
  podId: Id<"pods">
  className?: string
}

export const SubmitPostForm: React.FC<SubmitPostFormProps> = ({ podId, className }) => {
  const validate = useAsyncFn(useAction(api.fns.posts.validateURL))
  const mutate = useAsyncFn(useMutation(api.fns.posts.submit))
  const form = useForm<SubmitPostSchema>({
    resolver: zodResolver(SubmitPostSchema),
    defaultValues: submitPostSchema.defaultValues,
  })

  const handleSubmit = useEffectEvent(async (data: SubmitPostSchema) => {
    const validation = await validate.execute({ url: data.url })
    if (validation?.error) {
      form.setError("url", { message: validation.error })
    } else {
      const mutation = await mutate.execute({ podId, ...data })
      if (mutation?.success) {
        form.reset()
      }
    }
  })

  const stats = useAuthQuery(api.fns.pods.stats, { podId })
  const submitPostTargetCount = calculateSchemaTargetCount(stats?.memberCount)
  useEffect(() => {
    form.setValue("targetCount", submitPostTargetCount.defaultValue)
  }, [form.setValue, submitPostTargetCount.defaultValue])

  if (!stats) {
    return <Skeleton className={cn("w-full h-84 mt-1", className)} />
  }

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className={cn("w-full flex flex-col gap-6", className)}
    >
      <HStack className="gap-4">
        <Controller
          name="url"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <Input
                {...field}
                id={field.name}
                type="url"
                className="h-11"
                placeholder="https://www.linkedin.com/feed/update/urn:li:activity:..."
                aria-invalid={fieldState.invalid}
                disabled={form.formState.isSubmitting}
                autoFocus
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Box>
          <HoverButton type="submit" disabled={form.formState.isSubmitting} className="max-w-fit">
            Submit
          </HoverButton>
        </Box>
      </HStack>

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
              min={submitPostTargetCount.min}
              max={submitPostTargetCount.max}
              aria-invalid={fieldState.invalid}
              disabled={form.formState.isSubmitting}
              onChange={(e) => field.onChange(e.target.valueAsNumber)}
            />
            <FieldDescription>
              Default: {submitPostTargetCount.defaultValue}, Min: {submitPostTargetCount.min}, Max:{" "}
              {submitPostTargetCount.max}
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
