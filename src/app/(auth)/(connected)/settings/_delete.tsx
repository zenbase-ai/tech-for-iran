"use client"

import { useClerk } from "@clerk/nextjs"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAction } from "convex/react"
import { RedirectType, redirect } from "next/navigation"
import { useEffect, useEffectEvent, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { LuEraser, LuX } from "react-icons/lu"
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Field, FieldContent, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Kbd } from "@/components/ui/kbd"
import { Spinner } from "@/components/ui/spinner"
import { api } from "@/convex/_generated/api"
import useAsyncFn from "@/hooks/use-async-fn"

const DeleteAccountSchema = z.object({
  confirmation: z
    .string()
    .trim()
    .refine((conf) => conf === "sudo delete", { message: "Invalid confirmation." }),
})

type DeleteAccountSchema = z.infer<typeof DeleteAccountSchema>

export const DeleteAccountDialog: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [isOpen, setOpen] = useState(false)
  const { signOut } = useClerk()

  const form = useForm({
    resolver: zodResolver(DeleteAccountSchema),
    defaultValues: { confirmation: "" },
  })
  const { isSubmitting } = form.formState

  const deleteAccount = useAsyncFn(useAction(api.user.action.deleteAccount), {
    onSuccess: useEffectEvent(async () => await signOut(() => redirect("/", RedirectType.replace))),
  })
  const onSubmit = useEffectEvent(async (_: DeleteAccountSchema) => await deleteAccount.execute())

  useEffect(() => {
    if (!isOpen) {
      form.reset()
    }
  }, [form.reset, isOpen])

  return (
    <AlertDialog onOpenChange={setOpen} open={isOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <VStack className="gap-4">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                Your fellow alumni are counting on you!
              </AlertDialogDescription>
              <AlertDialogDescription className="text-sm text-muted-foreground">
                This will permanently delete your account and remove your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <Controller
              control={form.control}
              name="confirmation"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>
                    Type <Kbd>sudo delete</Kbd> to confirm.
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      {...field}
                      autoComplete="off"
                      autoFocus
                      className="font-mono font-bold"
                      disabled={isSubmitting}
                      id={field.name}
                      required
                    />
                  </FieldContent>
                </Field>
              )}
            />

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSubmitting} size="sm" type="button" variant="default">
                <LuX />
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={!form.formState.isValid || isSubmitting}
                size="sm"
                type="submit"
              >
                Delete
                {isSubmitting ? (
                  <Spinner className="size-3" variant="ellipsis" />
                ) : (
                  <LuEraser className="size-3" />
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </VStack>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
