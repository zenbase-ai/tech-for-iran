"use client"

import { useAction } from "convex/react"
import { useState } from "react"
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
import { api } from "@/convex/_generated/api"
import { useAsyncFn } from "@/hooks/use-async-fn"
import { cn } from "@/lib/utils"

export type DisconnectButtonProps = ButtonProps

export const DisconnectButton: React.FC<DisconnectButtonProps> = ({
  variant = "ghost",
  className,
  ...props
}) => {
  const action = useAsyncFn(useAction(api.linkedin.disconnectAccount))
  const [isOpen, setOpen] = useState(false)

  return (
    <AlertDialog open={isOpen} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant={variant} className={cn("w-fit", className)} {...props}>
          Disconnect
          <LuUnplug className="size-4" />
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
          <AlertDialogCancel type="button" disabled={action.pending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            type="button"
            disabled={action.pending}
            variant="destructive"
            onClick={() => action.execute()}
          >
            Disconnect
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
