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
    <AlertDialog onOpenChange={setOpen} open={isOpen}>
      <AlertDialogTrigger asChild>
        <Button className={cn("w-fit", className)} variant={variant} {...props}>
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
          <AlertDialogCancel disabled={disconnect.pending} type="button">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={disconnect.pending}
            onClick={() => disconnect.execute()}
            type="button"
            variant="destructive"
          >
            Disconnect
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
