"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useEffectEvent } from "react"
import { Controller, useForm } from "react-hook-form"
import { LuArrowRight } from "react-icons/lu"
import { useSessionStorage } from "usehooks-ts"
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
import { validateAccessCode } from "./-actions"

const SignUpGateSchema = z.object({
  code: z.string().min(1, "Access code is required"),
})

type SignUpGateSchema = z.infer<typeof SignUpGateSchema>

export const SignUpGate: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [isValidated, setValidated] = useSessionStorage("accessCodeValidated", false)

  const form = useForm({
    resolver: zodResolver(SignUpGateSchema),
    defaultValues: { code: "" },
  })

  const onSubmit = useEffectEvent(async (data: SignUpGateSchema) => {
    try {
      if (await validateAccessCode(data.code)) {
        setValidated(true)
      } else {
        form.setError("code", { message: "Invalid access code." })
      }
    } catch {
      form.setError("code", { message: "An error occurred. Please try again." })
    }
  })

  if (isValidated) {
    return <>{children}</>
  }

  return (
    <AlertDialog open>
      <AlertDialogContent className="max-w-md">
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Enter access code</AlertDialogTitle>
          </AlertDialogHeader>

          <Controller
            name="code"
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
            <AlertDialogCancel
              type="button"
              disabled={form.formState.isSubmitting}
              variant="outline"
              asChild
            >
              <Link href="/">Cancel</Link>
            </AlertDialogCancel>
            <AlertDialogAction type="submit" disabled={form.formState.isSubmitting}>
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
