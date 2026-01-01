"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useAction } from "convex/react"
import { capitalize } from "es-toolkit/string"
import posthog from "posthog-js"
import { useEffectEvent } from "react"
import { Controller, useForm } from "react-hook-form"
import { LuThumbsUp } from "react-icons/lu"
import { HStack, Stack, VStack } from "@/components/layout/stack"
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field"
import { HoverButton } from "@/components/ui/hover-button"
import { Input } from "@/components/ui/input"
import { NumberTicker } from "@/components/ui/number-ticker"
import { Switch } from "@/components/ui/switch"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import useAsyncFn from "@/hooks/use-async-fn"
import { useAuthQuery } from "@/hooks/use-auth-query"
import { cn } from "@/lib/utils"
import { BoostPost, boostPost } from "@/schemas/boost-post"

export type BoostPostFormProps = {
  podId: Id<"pods">
  className?: string
  autoFocus?: boolean
}

export const BoostPostForm: React.FC<BoostPostFormProps> = ({ podId, className, autoFocus }) => {
  const targetCount = useAuthQuery(api.pods.query.targetCount, { podId })

  const form = useForm({
    resolver: zodResolver(BoostPost),
    defaultValues: boostPost.defaultValues,
    disabled: !targetCount,
  })
  const { isSubmitting, disabled, errors } = form.formState

  const { execute } = useAsyncFn(useAction(api.pods.action.boost))
  const onSubmit = useEffectEvent(async (data: BoostPost) => {
    const { postId } = await execute({ podId, ...data })
    if (postId) {
      posthog.capture("post:boost", { podId })
      form.reset()
    }
  })

  return (
    <VStack as="form" className={cn("gap-4", className)} onSubmit={form.handleSubmit(onSubmit)}>
      {!!errors.root && <FieldError errors={[errors.root]} />}

      <Controller
        control={form.control}
        name="url"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <Input
              {...field}
              aria-invalid={fieldState.invalid}
              autoFocus={autoFocus}
              className="h-9 sm:h-11"
              disabled={isSubmitting}
              id={field.name}
              placeholder="https://www.linkedin.com/feed/update/urn:li:activity:..."
              type="url"
            />
            {!!fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {/* <Controller
        control={form.control}
        name="comments"
        render={({ field, fieldState }) => (
          <Field className="flex-1" data-invalid={fieldState.invalid} orientation="horizontal">
            <Switch
              aria-invalid={fieldState.invalid}
              checked={field.value}
              disabled={isSubmitting}
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
      /> */}

      <HStack className="w-full gap-5" items="start" justify="between">
        <Controller
          control={form.control}
          name="reactionTypes"
          render={({ field, fieldState }) => (
            <FieldSet
              className="flex-1 min-w-56 max-w-72 md:max-w-md"
              data-invalid={fieldState.invalid}
            >
              <FieldGroup
                className="grid grid-cols-2 md:grid-cols-3 gap-2"
                data-slot="checkbox-group"
              >
                {boostPost.options.reactionTypes.map((reaction) => (
                  <Field
                    className="w-fit"
                    data-invalid={fieldState.invalid}
                    key={reaction}
                    orientation="horizontal"
                  >
                    <Switch
                      aria-invalid={fieldState.invalid}
                      checked={field.value.includes(reaction)}
                      disabled={isSubmitting}
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
              {!!fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </FieldSet>
          )}
        />

        <Stack className="flex-col gap-2 md:flex-row md:gap-4" items="center">
          <HStack className="text-muted-foreground gap-1" items="center">
            &asymp;
            <NumberTicker value={targetCount ?? 0} />
            <LuThumbsUp className="size-3" />
          </HStack>
          <HoverButton
            className="flex-1 max-w-36"
            disabled={disabled || isSubmitting}
            type="submit"
          >
            Boost
          </HoverButton>
        </Stack>
      </HStack>
    </VStack>
  )
}
