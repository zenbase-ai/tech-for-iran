"use client"

import { useAction } from "convex/react"
import { useEffectEvent, useState } from "react"
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
import { api } from "@/convex/_generated/api"
import { cn, errorMessage } from "@/lib/utils"

export type DisconnectFormProps = ButtonProps

export const DisconnectForm: React.FC<DisconnectFormProps> = ({
  variant = "ghost",
  className,
  ...props
}) => {
  const disconnectAccount = useAction(api.linkedin.disconnectAccount)
  const [isLoading, setLoading] = useState(false)
  const [isDialogOpen, setDialogOpen] = useState(false)

  const handleDisconnect = useEffectEvent(async () => {
    setLoading(true)
    try {
      const result = await disconnectAccount()
      if (result.success) {
        toast.success(result.success)
        setDialogOpen(false)
      } else if (result.error) {
        toast.error(result.error)
      }
    } catch (error: unknown) {
      toast.error(errorMessage(error))
    } finally {
      setLoading(false)
    }
  })

  return (
    <AlertDialog open={isDialogOpen} onOpenChange={setDialogOpen}>
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
          <AlertDialogCancel type="button" disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            type="button"
            disabled={isLoading}
            variant="destructive"
            onClick={handleDisconnect}
          >
            Disconnect
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
