"use client"

import { SignOutButton } from "@clerk/nextjs"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useEffectEvent } from "react"
import { Controller, useForm } from "react-hook-form"
import { LuArrowRight } from "react-icons/lu"
import * as z from "zod"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Field, FieldContent, FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { queryString } from "@/lib/utils"

const ConnectGateSchema = z.object({
  inviteCode: z.string().min(1, "Access code is required"),
})

type ConnectGateSchema = z.infer<typeof ConnectGateSchema>

type ConnectGateProps = {
  inviteCode?: string
  validInviteCode?: boolean
}

export const ConnectGate: React.FC<ConnectGateProps> = ({ inviteCode = "", validInviteCode }) => {
  const form = useForm({
    resolver: zodResolver(ConnectGateSchema),
    defaultValues: { inviteCode },
    errors:
      validInviteCode === false
        ? { inviteCode: { message: "Invalid invite code.", type: "value" } }
        : undefined,
  })

  const router = useRouter()
  const onSubmit = useEffectEvent((data: ConnectGateSchema) => {
    form.clearErrors("inviteCode")
    router.replace(`/connect?${queryString(data)}`)
  })

  return (
    <AlertDialog open>
      <AlertDialogContent className="max-w-md">
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Enter invite code</AlertDialogTitle>
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
                    placeholder="super secret"
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
            <SignOutButton>
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
