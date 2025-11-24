"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useAction } from "convex/react"
import { capitalize } from "es-toolkit/string"
import { useParams } from "next/navigation"
import { useEffectEvent } from "react"
import { Controller, useForm } from "react-hook-form"
import { Box } from "@/components/layout/box"
import { Stack, VStack } from "@/components/layout/stack"
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
import { BoostPost, boostPost } from "@/schemas/boost-post"
import type { PodPageParams } from "./_types"

export type BoostPostFormProps = {
  className?: string
}

export const BoostPostForm: React.FC<BoostPostFormProps> = ({ className }) => {
  const { podId } = useParams<PodPageParams>()
  const form = useForm({
    resolver: zodResolver(BoostPost),
    defaultValues: boostPost.defaultValues,
  })
  const { isSubmitting } = form.formState

  const boost = useAsyncFn(useAction(api.pods.action.boost), {
    onSuccess: useEffectEvent(() => form.reset()),
  })
  const onSubmit = useEffectEvent(
    async (data: BoostPost) => await boost.execute({ podId, ...data })
  )

  return (
    <form className={className} onSubmit={form.handleSubmit(onSubmit)}>
      <VStack className="gap-4">
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
                  disabled={isSubmitting}
                  id={field.name}
                  placeholder="https://www.linkedin.com/feed/update/urn:li:activity:..."
                  type="url"
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Box className="max-w-fit">
            <HoverButton disabled={isSubmitting} type="submit">
              Boost
            </HoverButton>
          </Box>
        </Stack>

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

        <Controller
          control={form.control}
          name="reactionTypes"
          render={({ field, fieldState }) => (
            <FieldSet className="w-fit" data-invalid={fieldState.invalid}>
              <FieldLegend variant="legend">Which reactions do you want?</FieldLegend>
              <FieldGroup className="grid grid-cols-2 gap-2" data-slot="checkbox-group">
                {boostPost.options.reactionTypes.map((reaction) => (
                  <Field data-invalid={fieldState.invalid} key={reaction} orientation="horizontal">
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
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </FieldSet>
          )}
        />
      </VStack>
    </form>
  )
}
