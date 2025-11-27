"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "convex/react"
import { pick } from "es-toolkit"
import { Controller, useForm } from "react-hook-form"
import { LuArrowRight } from "react-icons/lu"
import { HStack, VStack } from "@/components/layout/stack"
import { SectionTitle } from "@/components/layout/text"
import { Button } from "@/components/ui/button"
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { TimezoneSelect } from "@/components/ui/timezone-select"
import { api } from "@/convex/_generated/api"
import useAuthQuery from "@/hooks/use-auth-query"
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

  const config = pick(account, Object.keys(SettingsConfig.shape) as (keyof SettingsConfig)[])
  return <ActualConfigForm className={className} config={config} />
}

type ActualConfigFormProps = ConfigFormProps & {
  config: Partial<SettingsConfig>
}

const ActualConfigForm: React.FC<ActualConfigFormProps> = ({ config, className }) => {
  const configure = useMutation(api.linkedin.mutate.configure)
  const form = useForm({
    resolver: zodResolver(SettingsConfig),
    defaultValues: {
      ...settingsConfig.defaultValues,
      ...config,
    },
  })

  return (
    <form className={className} onSubmit={form.handleSubmit(configure)}>
      <VStack className="gap-4">
        <SectionTitle>Configuration</SectionTitle>

        <HStack className="gap-4" items="start" wrap>
          <Controller
            control={form.control}
            name="maxActions"
            render={({ field, fieldState }) => (
              <Field className="w-[128px]" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Daily Engagements</FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id={field.name}
                    max={settingsConfig.max.maxActions}
                    min={settingsConfig.min.maxActions}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    type="number"
                  />
                </FieldContent>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <FieldGroup className="gap-3 w-[192px]">
            <FieldLabel htmlFor="workingHoursStart">Working Hours</FieldLabel>

            <HStack className="gap-3" items="center" wrap>
              <Controller
                control={form.control}
                name="workingHoursStart"
                render={({ field, fieldState }) => (
                  <Field className="w-fit max-w-w-2/5" data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <NativeSelect
                        {...field}
                        aria-invalid={fieldState.invalid}
                        id={field.name}
                        onChange={(e) => field.onChange(Number.parseInt(e.target.value, 10))}
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          // biome-ignore lint/suspicious/noArrayIndexKey: it's a valid key
                          <NativeSelectOption key={i} value={i.toString()}>
                            {i.toString().padStart(2, "0")}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </FieldContent>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
                      <NativeSelect
                        {...field}
                        aria-invalid={fieldState.invalid}
                        id={field.name}
                        onChange={(e) => field.onChange(Number.parseInt(e.target.value, 10))}
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          // biome-ignore lint/suspicious/noArrayIndexKey: it's a valid key
                          <NativeSelectOption key={i} value={i.toString()}>
                            {i.toString().padStart(2, "0")}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </FieldContent>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </HStack>

            <Controller
              control={form.control}
              name="timezone"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldContent>
                    <TimezoneSelect {...field} id={field.name} />
                  </FieldContent>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </HStack>

        <Button
          className="w-fit"
          disabled={form.formState.isSubmitting}
          type="submit"
          variant="outline"
        >
          Save
          {form.formState.isSubmitting ? <Spinner variant="ellipsis" /> : <LuArrowRight />}
        </Button>

        {form.formState.errors.root && <FieldError errors={[form.formState.errors.root]} />}
      </VStack>
    </form>
  )
}
