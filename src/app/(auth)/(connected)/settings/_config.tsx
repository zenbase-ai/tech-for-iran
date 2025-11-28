"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "convex/react"
import { pick } from "es-toolkit"
import { Controller, useForm } from "react-hook-form"
import { LuArrowRight, LuThumbsUp } from "react-icons/lu"
import { HStack, VStack } from "@/components/layout/stack"
import { SectionTitle } from "@/components/layout/text"
import { AccountTimezone } from "@/components/presenters/account/timezone"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { HourSelect } from "@/components/ui/hour-select"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { api } from "@/convex/_generated/api"
import type { Doc } from "@/convex/_generated/dataModel"
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

  return <ActualConfigForm account={account} className={className} />
}

type ActualConfigFormProps = ConfigFormProps & {
  account: Doc<"linkedinAccounts">
}

const ActualConfigForm: React.FC<ActualConfigFormProps> = ({ account, className }) => {
  const configure = useMutation(api.linkedin.mutate.configure)
  const form = useForm({
    resolver: zodResolver(SettingsConfig),
    defaultValues: {
      ...settingsConfig.defaultValues,
      ...pick(account, Object.keys(SettingsConfig.shape) as (keyof SettingsConfig)[]),
    },
  })
  const { formState } = form

  return (
    <form className={className} onSubmit={form.handleSubmit(configure)}>
      <VStack className="gap-4">
        <SectionTitle>Configuration</SectionTitle>

        <HStack className="gap-4 md:gap-6" items="start" wrap>
          <Controller
            control={form.control}
            name="maxActions"
            render={({ field, fieldState }) => (
              <Field className="w-[160px]" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Send up to N reactions</FieldLabel>
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
                      <LuThumbsUp />
                    </InputGroupAddon>
                  </InputGroup>
                </FieldContent>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <FieldGroup className="gap-3 w-[192px]">
            <FieldLabel htmlFor="workingHoursStart">Between the hours of</FieldLabel>

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
                      <HourSelect
                        {...field}
                        aria-invalid={fieldState.invalid}
                        id={field.name}
                        min={form.watch("workingHoursStart")}
                      />
                    </FieldContent>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </HStack>

            <FieldDescription>
              <AccountTimezone timezone={account.timezone} />
            </FieldDescription>
          </FieldGroup>
        </HStack>

        <Button className="w-fit" disabled={formState.isSubmitting} size="sm" type="submit">
          Save
          {formState.isSubmitting ? <Spinner variant="ellipsis" /> : <LuArrowRight />}
        </Button>

        {formState.errors.root && <FieldError errors={[formState.errors.root]} />}
      </VStack>
    </form>
  )
}
