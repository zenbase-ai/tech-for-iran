"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "convex/react"
import { pick } from "es-toolkit"
import { parseAsBoolean, useQueryState } from "nuqs"
import type React from "react"
import { useEffectEvent } from "react"
import { Controller, useForm } from "react-hook-form"
import { LuArrowRight, LuThumbsUp } from "react-icons/lu"
import { HStack, VStack } from "@/components/layout/stack"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { api } from "@/convex/_generated/api"
import type { Doc } from "@/convex/_generated/dataModel"
import useAsyncFn from "@/hooks/use-async-fn"
import { PodSettings, podSettings } from "@/schemas/pod-settings"

export type PodSettingsDialogProps = React.PropsWithChildren<{
  pod: Doc<"pods">
}>

export const PodSettingsDialog: React.FC<PodSettingsDialogProps> = ({ children, pod }) => {
  const [showSettings, setShowSettings] = useQueryState(
    "settings",
    parseAsBoolean.withDefault(false)
  )

  const configure = useAsyncFn(useMutation(api.pods.mutate.configure), {
    onSuccess: () => setShowSettings(false),
  })

  const form = useForm({
    resolver: zodResolver(PodSettings),
    defaultValues: {
      ...podSettings.defaultValues,
      ...pick(pod, Object.keys(PodSettings.shape) as (keyof PodSettings)[]),
    },
  })
  const { isSubmitting } = form.formState

  const onSubmit = useEffectEvent(async (data: PodSettings) => {
    await configure.execute({ podId: pod._id, ...data })
  })

  return (
    <AlertDialog onOpenChange={setShowSettings} open={showSettings}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <VStack as="form" className="gap-4" onSubmit={form.handleSubmit(onSubmit)}>
          <AlertDialogHeader>
            <AlertDialogTitle>Pod Settings</AlertDialogTitle>
            <AlertDialogDescription>
              Configure engagement targeting for this pod.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <FieldGroup className="gap-4">
            <HStack className="gap-4" items="start" wrap>
              <Controller
                control={form.control}
                name="engagementTargetPercent"
                render={({ field, fieldState }) => (
                  <Field className="min-w-[140px] max-w-[160px]" data-invalid={fieldState.invalid}>
                    <FieldLabel className="line-clamp-1" htmlFor={field.name}>
                      Target Participation
                    </FieldLabel>
                    <FieldContent>
                      <InputGroup>
                        <InputGroupInput
                          {...field}
                          aria-invalid={fieldState.invalid}
                          id={field.name}
                          max={podSettings.max.engagementTargetPercent}
                          min={podSettings.min.engagementTargetPercent}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                          type="number"
                        />
                        <InputGroupAddon align="inline-end">
                          <InputGroupText>%</InputGroupText>
                        </InputGroupAddon>
                      </InputGroup>
                    </FieldContent>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="maxEngagementCap"
                render={({ field, fieldState }) => (
                  <Field className="min-w-[140px] max-w-[160px]" data-invalid={fieldState.invalid}>
                    <FieldLabel className="line-clamp-1" htmlFor={field.name}>
                      Cap Engagement
                    </FieldLabel>
                    <FieldContent>
                      <InputGroup>
                        <InputGroupInput
                          {...field}
                          aria-invalid={fieldState.invalid}
                          id={field.name}
                          max={podSettings.max.maxEngagementCap}
                          min={podSettings.min.maxEngagementCap}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                          type="number"
                        />
                        <InputGroupAddon align="inline-end">
                          <LuThumbsUp className="size-3" />
                        </InputGroupAddon>
                      </InputGroup>
                    </FieldContent>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </HStack>

            <FieldDescription className="font-mono">
              max reactions = min(members &times; target / 100, cap)
            </FieldDescription>
          </FieldGroup>
          {form.formState.errors.root && <FieldError errors={[form.formState.errors.root]} />}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting} size="sm" type="button" variant="ghost">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction disabled={isSubmitting} size="sm" type="submit">
              Save
              {isSubmitting ? <Spinner variant="ellipsis" /> : <LuArrowRight />}
            </AlertDialogAction>
          </AlertDialogFooter>
        </VStack>
      </AlertDialogContent>
    </AlertDialog>
  )
}
