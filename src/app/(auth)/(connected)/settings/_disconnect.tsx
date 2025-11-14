"use client"

import { useAction } from "convex/react"
import { useState } from "react"
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
import { api } from "@/convex/_generated/api"
import useAsyncFn from "@/hooks/use-async-fn"
import { cn } from "@/lib/utils"

export type DisconnectButtonProps = ButtonProps

export const DisconnectButton: React.FC<DisconnectButtonProps> = ({
  variant,
  className,
  children,
  ...props
}) => {
  const disconnect = useAsyncFn(useAction(api.linkedin.action.disconnectOwn))
  const [isOpen, setOpen] = useState(false)

  return (
    <AlertDialog open={isOpen} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant={variant} className={cn("w-fit", className)} {...props}>
          {children}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>Your fellow alumni are counting on you!</AlertDialogDescription>
          <AlertDialogDescription className="text-muted-foreground">
            This will permanently delete your account and remove your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel type="button" disabled={disconnect.pending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            type="button"
            disabled={disconnect.pending}
            variant="destructive"
            onClick={() => disconnect.execute()}
          >
            Disconnect
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
