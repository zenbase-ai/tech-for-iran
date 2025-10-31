"use client"

import { type Preloaded, usePreloadedQuery } from "convex/react"
import Form from "next/form"
import { useActionState, useEffect } from "react"
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
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import type { api } from "@/convex/_generated/api"
import { disconnectAccount } from "./actions"

export type DisconnectFormProps = {
  linkedin: Preloaded<typeof api.linkedin.getState>
}

export const DisconnectForm: React.FC<DisconnectFormProps> = ({ linkedin }) => {
  const { profile } = usePreloadedQuery(linkedin)
  const [formState, formAction, formLoading] = useActionState(disconnectAccount, {})

  useEffect(() => {
    if (!formLoading && formState.message) {
      toast.success(formState.message)
    }
  }, [formLoading, formState.message])

  if (!profile) {
    return null
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-fit">
          Disconnect
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <Form action={formAction}>
          {formState?.error && <FieldError>{formState.error}</FieldError>}
          <input type="hidden" name="unipileId" value={profile.unipileId} />
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
