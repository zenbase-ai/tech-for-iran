"use client"

import { SignOutButton } from "@clerk/nextjs"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAction } from "convex/react"
import { RedirectType, redirect } from "next/navigation"
import { useEffectEvent } from "react"
import { Controller, useForm } from "react-hook-form"
import { LuArrowRight } from "react-icons/lu"
import * as z from "zod"
import { VStack } from "@/components/layout/stack"
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
  inviteCode: z.string().trim().min(1, "Access code is required"),
})

type ConnectGateSchema = z.infer<typeof ConnectGateSchema>

export const ConnectGateDialog: React.FC<ConnectGateSchema> = ({ inviteCode }) => {
  const validate = useAction(api.pods.action.validate)
  const form = useForm({
    resolver: zodResolver(ConnectGateSchema),
    defaultValues: { inviteCode },
  })
  const { isSubmitting } = form.formState

  const onSubmit = useEffectEvent(async (data: ConnectGateSchema) => {
    form.clearErrors("inviteCode")
    console.log("data", data)

    if (await validate(data)) {
      console.log("valid")
      redirect(`/connect/dialog?${queryString(data)}`, RedirectType.replace)
    } else {
      console.log("invalid")
      form.setError("inviteCode", { message: "Invalid invite code.", type: "value" })
    }
  })

  return (
    <AlertDialog open>
      <AlertDialogContent className="max-w-md">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <VStack className="gap-4">
            <AlertDialogHeader>
              <AlertDialogTitle>Crackedbook is invite-only.</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Please enter your invite code.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <Controller
              control={form.control}
              name="inviteCode"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldContent>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      autoFocus
                      disabled={isSubmitting}
                      id={field.name}
                      placeholder="your super secret invite code"
                      required
                      type="text"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </FieldContent>
                </Field>
              )}
            />

            <AlertDialogFooter>
              <SignOutButton redirectUrl="/">
                <AlertDialogCancel disabled={isSubmitting} type="button" variant="ghost">
                  Sign out
                </AlertDialogCancel>
              </SignOutButton>
              <AlertDialogAction disabled={isSubmitting} size="default" type="submit">
                Continue
                {isSubmitting ? <Spinner variant="ellipsis" /> : <LuArrowRight />}
              </AlertDialogAction>
            </AlertDialogFooter>
          </VStack>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
