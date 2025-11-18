"use client"

import { SignOutButton } from "@clerk/nextjs"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAction } from "convex/react"
import { RedirectType, redirect } from "next/navigation"
import { useEffectEvent } from "react"
import { Controller, useForm } from "react-hook-form"
import { LuArrowRight } from "react-icons/lu"
import * as z from "zod"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Field, FieldContent, FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { api } from "@/convex/_generated/api"
import { queryString } from "@/lib/utils"

const ConnectGateSchema = z.object({
  inviteCode: z.string().min(1, "Access code is required"),
})

type ConnectGateSchema = z.infer<typeof ConnectGateSchema>

export const ConnectGate: React.FC<ConnectGateSchema> = ({ inviteCode }) => {
  const validate = useAction(api.pods.action.validate)

  const form = useForm({
    resolver: zodResolver(ConnectGateSchema),
    defaultValues: { inviteCode },
  })

  const onSubmit = useEffectEvent(async (data: ConnectGateSchema) => {
    form.clearErrors("inviteCode")

    if (await validate(data)) {
      redirect(`/connect/dialog?${queryString(data)}`, RedirectType.replace)
    } else {
      form.setError("inviteCode", { message: "Invalid invite code.", type: "value" })
    }
  })

  return (
    <AlertDialog open>
      <AlertDialogContent className="max-w-md">
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Crackedbook is invite-only.</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Please enter your invite code.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Controller
            name="inviteCode"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldContent>
                  <Input
                    {...field}
                    id={field.name}
                    type="text"
                    placeholder="your super secret invite code"
                    disabled={form.formState.isSubmitting}
                    required
                    autoFocus
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </FieldContent>
              </Field>
            )}
          />

          <AlertDialogFooter>
            <SignOutButton redirectUrl="/">
              <AlertDialogCancel
                type="button"
                disabled={form.formState.isSubmitting}
                variant="ghost"
              >
                Sign out
              </AlertDialogCancel>
            </SignOutButton>
            <AlertDialogAction type="submit" disabled={form.formState.isSubmitting} size="default">
              Continue
              {form.formState.isSubmitting ? (
                <Spinner variant="ellipsis" />
              ) : (
                <LuArrowRight className="size-4" />
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
