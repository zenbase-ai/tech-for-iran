"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "convex/react"
import { pick } from "es-toolkit"
import { Controller, useForm } from "react-hook-form"
import { HStack, VStack } from "@/components/layout/stack"
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { HourSelect } from "@/components/ui/hour-select"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { Skeleton } from "@/components/ui/skeleton"
import { TimezoneSelect } from "@/components/ui/timezone-select"
import { api } from "@/convex/_generated/api"
import type { Doc } from "@/convex/_generated/dataModel"
import useAsyncFn from "@/hooks/use-async-fn"
import { useAuthQuery } from "@/hooks/use-auth-query"
import { cn } from "@/lib/utils"
import { SettingsConfig, settingsConfig } from "@/schemas/settings-config"

export type ConfigFormProps = {
  className?: string
}

export const ConfigForm: React.FC<ConfigFormProps> = ({ className }) => {
  const { account } = useAuthQuery(api.linkedin.query.getState) ?? {}

  if (account == null) {
    return <Skeleton className={cn("h-29 w-full", className)} />
  }

  return <ActualConfigForm account={account} className={className} />
}

type ActualConfigFormProps = ConfigFormProps & {
  account: Doc<"linkedinAccounts">
}

const ActualConfigForm: React.FC<ActualConfigFormProps> = ({ account, className }) => {
  const configure = useAsyncFn(useMutation(api.linkedin.mutate.configure))
  const form = useForm({
    resolver: zodResolver(SettingsConfig),
    defaultValues: {
      ...settingsConfig.defaultValues,
      ...pick(account, Object.keys(SettingsConfig.shape) as (keyof SettingsConfig)[]),
    },
  })
  const { formState } = form

  return (
    <VStack
      as="form"
      className={cn("gap-4", className)}
      onBlur={form.handleSubmit(configure.execute)}
    >
      <HStack
        className={cn("px-4 justify-start gap-4", "sm:justify-center", "md:gap-6")}
        items="center"
        wrap
      >
        <Controller
          control={form.control}
          name="maxActions"
          render={({ field, fieldState }) => (
            <Field className="w-[112px]" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>react up to</FieldLabel>
              <FieldContent>
                <InputGroup>
                  <InputGroupInput
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id={field.name}
                    max={settingsConfig.max.maxActions}
                    min={settingsConfig.min.maxActions}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    type="number"
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>times</InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
              </FieldContent>
              {!!fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <FieldGroup className="gap-3 w-[192px]">
          <FieldLabel htmlFor="workingHoursStart">between the hours of</FieldLabel>

          <HStack className="gap-3" items="center" wrap>
            <Controller
              control={form.control}
              name="workingHoursStart"
              render={({ field, fieldState }) => (
                <Field className="w-fit max-w-w-2/5" data-invalid={fieldState.invalid}>
                  <FieldContent>
                    <HourSelect
                      {...field}
                      aria-invalid={fieldState.invalid}
                      id={field.name}
                      max={form.watch("workingHoursEnd")}
                    />
                  </FieldContent>
                  {!!fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <FieldLabel className="w-4 text-center" htmlFor="workingHoursEnd">
              to
            </FieldLabel>

            <Controller
              control={form.control}
              name="workingHoursEnd"
              render={({ field, fieldState }) => (
                <Field className="w-fit max-w-2/5" data-invalid={fieldState.invalid}>
                  <FieldContent>
                    <HourSelect
                      {...field}
                      aria-invalid={fieldState.invalid}
                      id={field.name}
                      min={form.watch("workingHoursStart")}
                    />
                  </FieldContent>
                  {!!fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </HStack>
        </FieldGroup>

        <Controller
          control={form.control}
          name="timezone"
          render={({ field, fieldState }) => (
            <Field className="w-[192px]" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>in the timezone</FieldLabel>
              <FieldContent>
                <TimezoneSelect {...field} />
              </FieldContent>
              {!!fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </HStack>

      {!!formState.errors.root && <FieldError errors={[formState.errors.root]} />}
    </VStack>
  )
}
