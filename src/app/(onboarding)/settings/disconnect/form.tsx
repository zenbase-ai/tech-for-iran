"use client"

import Form from "next/form"
import { useActionState } from "react"
import { LuUnplug } from "react-icons/lu"
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
import { useActionToastState } from "@/hooks/use-action-state-toasts"
import { cn } from "@/lib/utils"
import { disconnectAccount } from "./actions"

export type DisconnectFormProps = ButtonProps

export const DisconnectForm: React.FC<DisconnectFormProps> = ({
  variant = "ghost",
  className,
  ...props
}) => {
  const [formState, formAction, formLoading] = useActionState(disconnectAccount, {})
  useActionToastState(formState, formLoading)

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={variant} className={cn("w-fit", className)} {...props}>
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
