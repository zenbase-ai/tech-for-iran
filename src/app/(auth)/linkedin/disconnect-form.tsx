"use client"

import Form from "next/form"
import { useActionState } from "react"
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
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { disconnectFormAction } from "./actions"

export type DisconnectFormProps = {
  profile: {
    unipileId: string
  }
}

export const DisconnectForm: React.FC<DisconnectFormProps> = ({ profile: { unipileId } }) => {
  const [state, formAction, pending] = useActionState(disconnectFormAction, null)

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-fit">
          Disconnect
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <Form action={formAction}>
          {state?.error && <FieldError>{state.error}</FieldError>}
          <input type="hidden" name="unipileId" value={unipileId} />
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>Your fellow alumni are counting on you!</AlertDialogDescription>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently delete your account and remove your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={pending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction type="submit" disabled={pending} variant="destructive">
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
