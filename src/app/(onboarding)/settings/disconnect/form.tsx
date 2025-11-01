"use client"

import Form from "next/form"
import { useActionState, useEffect } from "react"
import { LuUnplug } from "react-icons/lu"
import { toast } from "sonner"
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
import { Button, type ButtonProps } from "@/components/ui/button"
import { disconnectAccount } from "./actions"

export type DisconnectFormProps = {
  variant?: ButtonProps["variant"]
}

export const DisconnectForm: React.FC<DisconnectFormProps> = ({ variant = "ghost" }) => {
  const [formState, formAction, formLoading] = useActionState(disconnectAccount, {})

  useEffect(() => {
    if (!formLoading && formState.message) {
      toast.success(formState.message)
    }
  }, [formLoading, formState.message])

  useEffect(() => {
    if (!formLoading && formState?.error) {
      toast.error(formState.error)
    }
  }, [formLoading, formState?.error])

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={variant} className="w-fit">
          Disconnect
          <LuUnplug className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <Form action={formAction}>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>Your fellow alumni are counting on you!</AlertDialogDescription>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently delete your account and remove your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={formLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction type="submit" disabled={formLoading} variant="destructive">
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
