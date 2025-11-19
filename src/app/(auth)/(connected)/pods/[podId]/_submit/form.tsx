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
      className={cn("w-full flex flex-col gap-6", className)}
      onSubmit={form.handleSubmit(handleSubmit)}
    >
      {form.formState.errors.root && <FieldError errors={[form.formState.errors.root]} />}

      <Stack className="gap-4 flex-col md:flex-row" items="start" justify="center">
        <Controller
          control={form.control}
          name="url"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                autoFocus
                className="h-9 sm:h-11"
                disabled={form.formState.isSubmitting}
                id={field.name}
                placeholder="https://www.linkedin.com/feed/update/urn:li:activity:..."
                type="url"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Box className="max-w-fit">
          <HoverButton disabled={form.formState.isSubmitting} type="submit">
            Submit
          </HoverButton>
        </Box>
      </Stack>

      <Controller
        control={form.control}
        name="comments"
        render={({ field, fieldState }) => (
          <Field className="flex-1" data-invalid={fieldState.invalid} orientation="horizontal">
            <Switch
              aria-invalid={fieldState.invalid}
              checked={field.value}
              disabled={form.formState.isSubmitting}
              id={field.name}
              name={field.name}
              onCheckedChange={field.onChange}
            />
            <FieldLabel
              className={cn(!field.value && "line-through text-muted-foreground")}
              htmlFor={field.name}
            >
              Generate comments
            </FieldLabel>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        control={form.control}
        name="reactionTypes"
        render={({ field, fieldState }) => (
          <FieldSet className="w-full" data-invalid={fieldState.invalid}>
            <FieldLegend variant="legend">Which reactions do you want?</FieldLegend>
            <FieldGroup
              className="grid grid-cols-2 sm:grid-cols-3 gap-2"
              data-slot="checkbox-group"
            >
              {submitPost.options.reactionTypes.map((reaction) => (
                <Field data-invalid={fieldState.invalid} key={reaction} orientation="horizontal">
                  <Switch
                    aria-invalid={fieldState.invalid}
                    checked={field.value.includes(reaction)}
                    disabled={form.formState.isSubmitting}
                    id={`reaction-${reaction}`}
                    name={field.name}
                    onCheckedChange={(checked) => {
                      const newValue = checked
                        ? [...field.value, reaction]
                        : field.value.filter((value) => value !== reaction)
                      field.onChange(newValue)
                    }}
                  />
                  <FieldLabel
                    className={cn(
                      !field.value.includes(reaction) && "line-through text-muted-foreground"
                    )}
                    htmlFor={`reaction-${reaction}`}
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
