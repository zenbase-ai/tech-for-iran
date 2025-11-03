"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery } from "convex/react"
import { capitalize } from "es-toolkit/string"
import { useEffect, useEffectEvent } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
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
import { toastResult } from "@/hooks/use-action-state-toasts"
import { cn, errorMessage } from "@/lib/utils"
import {
  maxDelay,
  minDelay,
  reactionTypes,
  type SubmitPostFormData,
  SubmitPostFormSchema,
  targetCount,
} from "./schema"

export type SubmitPostFormProps = {
  podId: Id<"pods">
  className?: string
}

export const SubmitPostForm: React.FC<SubmitPostFormProps> = ({ podId, className }) => {
  const pod = useQuery(api.pods.get, { podId })
  const submitPostMutation = useMutation(api.posts.submit)

  const minTargetCount = pod ? Math.min(1, pod.memberCount - 1) : targetCount.min
  const maxTargetCount = pod ? Math.min(pod.memberCount - 1, targetCount.max) : targetCount.max
  const defaultTargetCount = Math.min(25, maxTargetCount)

  const form = useForm<SubmitPostFormData>({
    resolver: zodResolver(SubmitPostFormSchema),
    defaultValues: {
      url: "",
      reactionTypes: reactionTypes.default,
      targetCount: defaultTargetCount,
      minDelay: minDelay.default,
      maxDelay: maxDelay.default,
    },
  })

  useEffect(() => {
    form.setValue("targetCount", defaultTargetCount)
  }, [form.setValue, defaultTargetCount])

  const onSubmit = useEffectEvent(async (data: SubmitPostFormData) => {
    try {
      const result = await submitPostMutation({
        podId,
        ...data,
      })
      toastResult(result)
      form.reset()
    } catch (error: unknown) {
      toast.error(errorMessage(error))
    }
  })

  if (!pod) {
    return <Skeleton className={cn("w-full h-84 mt-1", className)} />
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className={cn("flex flex-col gap-6", className)}>
      <h2 className="text-lg font-semibold">New Post</h2>

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
          {form.formState.isSubmitting ? "Submitting..." : "Submit"}
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
              {reactionTypes.options.map((reaction) => (
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
              min={minTargetCount}
              max={maxTargetCount}
              aria-invalid={fieldState.invalid}
              disabled={form.formState.isSubmitting}
              onChange={(e) => field.onChange(e.target.valueAsNumber)}
            />
            <FieldDescription>
              Default: {defaultTargetCount}, Max: {maxTargetCount}
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
                min={minDelay.min}
                max={minDelay.max}
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
                min={maxDelay.min}
                max={maxDelay.max}
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
