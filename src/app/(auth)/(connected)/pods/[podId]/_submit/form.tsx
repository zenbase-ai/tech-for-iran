"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useAction } from "convex/react"
import { capitalize } from "es-toolkit/string"
import { useEffectEvent } from "react"
import { Controller, useForm } from "react-hook-form"
import { Box } from "@/components/layout/box"
import { Stack } from "@/components/layout/stack"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { HoverButton } from "@/components/ui/hover-button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { api } from "@/convex/_generated/api"
import useAsyncFn from "@/hooks/use-async-fn"
import { cn } from "@/lib/utils"
import type { PodId } from "../_types"
import { SubmitPost, submitPost } from "./schema"

export type SubmitPostFormProps = {
  podId: PodId
  className?: string
}

export const SubmitPostForm: React.FC<SubmitPostFormProps> = ({ podId, className }) => {
  const form = useForm({
    resolver: zodResolver(SubmitPost),
    defaultValues: submitPost.defaultValues,
  })

  const submit = useAsyncFn(useAction(api.posts.action.submit))
  const handleSubmit = useEffectEvent(async (data: SubmitPost) => {
    if (await submit.execute({ podId, ...data })) {
      form.reset()
    } else {
      form.setError("root", { message: "Something went really wrong." })
    }
  })

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className={cn("w-full flex flex-col gap-6", className)}
    >
      {form.formState.errors.root && <FieldError errors={[form.formState.errors.root]} />}

      <Stack items="start" justify="center" className="gap-4 flex-col md:flex-row">
        <Controller
          name="url"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <Input
                {...field}
                id={field.name}
                type="url"
                className="h-9 sm:h-11"
                placeholder="https://www.linkedin.com/feed/update/urn:li:activity:..."
                aria-invalid={fieldState.invalid}
                disabled={form.formState.isSubmitting}
                autoFocus
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Box className="max-w-fit">
          <HoverButton type="submit" disabled={form.formState.isSubmitting}>
            Submit
          </HoverButton>
        </Box>
      </Stack>

      <Controller
        name="comments"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} orientation="horizontal" className="flex-1">
            <Switch
              id={field.name}
              name={field.name}
              checked={field.value}
              onCheckedChange={field.onChange}
              aria-invalid={fieldState.invalid}
              disabled={form.formState.isSubmitting}
            />
            <FieldLabel
              htmlFor={field.name}
              className={cn(!field.value && "line-through text-muted-foreground")}
            >
              Generate comments
            </FieldLabel>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="reactionTypes"
        control={form.control}
        render={({ field, fieldState }) => (
          <FieldSet className="w-full" data-invalid={fieldState.invalid}>
            <FieldLegend variant="legend">Which reactions do you want?</FieldLegend>
            <FieldGroup
              className="grid grid-cols-2 sm:grid-cols-3 gap-2"
              data-slot="checkbox-group"
            >
              {submitPost.options.reactionTypes.map((reaction) => (
                <Field key={reaction} orientation="horizontal" data-invalid={fieldState.invalid}>
                  <Switch
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
                  <FieldLabel
                    htmlFor={`reaction-${reaction}`}
                    className={cn(
                      !field.value.includes(reaction) && "line-through text-muted-foreground",
                    )}
                  >
                    {capitalize(reaction)}
                  </FieldLabel>
                </Field>
              ))}
            </FieldGroup>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </FieldSet>
        )}
      />
    </form>
  )
}
