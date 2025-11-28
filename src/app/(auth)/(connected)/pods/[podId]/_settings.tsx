"use client"

import { useAuth } from "@clerk/nextjs"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "convex/react"
import { parseAsBoolean, useQueryState } from "nuqs"
import type React from "react"
import { useEffect, useEffectEvent } from "react"
import { Controller, useForm } from "react-hook-form"
import { LuArrowRight, LuSettings, LuThumbsUp } from "react-icons/lu"
import { HStack, VStack } from "@/components/layout/stack"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  type AlertDialogProps,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
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

export type PodSettingsDialogProps = {
  pod: Doc<"pods">
}

export const PodSettingsDialog: React.FC<PodSettingsDialogProps> = ({ pod }) => {
  const { userId } = useAuth()
  const [showSettings, setShowSettings] = useQueryState(
    "settings",
    parseAsBoolean.withDefault(false)
  )
  const isCreator = userId === pod.createdBy

  useEffect(() => {
    if (!isCreator && showSettings) {
      setShowSettings(false)
    }
  }, [isCreator, showSettings, setShowSettings])

  return (
    <>
      <Button
        className="rounded-full"
        disabled={!isCreator}
        onClick={() => setShowSettings(true)}
        size="sm"
        variant="ghost"
      >
        <LuSettings />
      </Button>

      <ActualSettingsDialog onOpenChange={setShowSettings} open={showSettings} pod={pod} />
    </>
  )
}

type ActualSettingsDialogProps = AlertDialogProps & {
  pod: Doc<"pods">
}

const ActualSettingsDialog: React.FC<ActualSettingsDialogProps> = ({ pod, ...props }) => {
  const configure = useAsyncFn(useMutation(api.pods.mutate.configure), {
    onSuccess: useEffectEvent(() => {
      props.onOpenChange?.(false)
    }),
  })

  const form = useForm({
    resolver: zodResolver(PodSettings),
    defaultValues: podSettings.defaultValues,
  })
  const { isSubmitting } = form.formState

  // Sync pod values to form
  useEffect(() => {
    if (pod.engagementTargetPercent != null) {
      form.setValue("engagementTargetPercent", pod.engagementTargetPercent)
    }
    if (pod.maxEngagementCap != null) {
      form.setValue("maxEngagementCap", pod.maxEngagementCap)
    }
  }, [pod.engagementTargetPercent, pod.maxEngagementCap, form.setValue])

  const onSubmit = useEffectEvent(async (data: PodSettings) => {
    await configure.execute({ podId: pod._id, ...data })
  })

  return (
    <AlertDialog {...props}>
      <AlertDialogContent className="max-w-md">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <VStack className="gap-4">
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
                    <Field
                      className="min-w-[140px] max-w-[160px]"
                      data-invalid={fieldState.invalid}
                    >
                      <FieldLabel className="line-clamp-1" htmlFor={field.name}>
                        Target Participation
                      </FieldLabel>
                      <FieldContent>
                        <InputGroup>
                          <InputGroupInput
                            {...field}
                            aria-invalid={fieldState.invalid}
                            disabled={isSubmitting}
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
                    <Field
                      className="min-w-[140px] max-w-[160px]"
                      data-invalid={fieldState.invalid}
                    >
                      <FieldLabel className="line-clamp-1" htmlFor={field.name}>
                        Cap Engagement
                      </FieldLabel>
                      <FieldContent>
                        <InputGroup>
                          <InputGroupInput
                            {...field}
                            aria-invalid={fieldState.invalid}
                            disabled={isSubmitting}
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
                reactions = min(members &times; target / 100, cap)
              </FieldDescription>
            </FieldGroup>

            {form.formState.errors.root && <FieldError errors={[form.formState.errors.root]} />}

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSubmitting} size="sm" type="button">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction disabled={isSubmitting} size="sm" type="submit">
                Save
                {isSubmitting ? (
                  <Spinner className="size-3" variant="ellipsis" />
                ) : (
                  <LuArrowRight className="size-3" />
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </VStack>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
