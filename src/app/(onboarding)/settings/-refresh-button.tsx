"use client"

import { useAction } from "convex/react"
import { useEffectEvent, useState } from "react"
import { LuRefreshCcw } from "react-icons/lu"
import { toast } from "sonner"
import { Button, type ButtonProps } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { api } from "@/convex/_generated/api"
import { toastResult } from "@/hooks/use-action-state-toasts"
import { cn, errorMessage } from "@/lib/utils"

export type RefreshButtonProps = ButtonProps

export const RefreshButton: React.FC<RefreshButtonProps> = ({
  className,
  variant = "outline",
  ...props
}) => {
  const action = useAction(api.linkedin.refreshState)
  const [isLoading, setLoading] = useState(false)

  const handleRefresh = useEffectEvent(async () => {
    setLoading(true)
    try {
      const result = await action()
      toastResult(result)
    } catch (error: unknown) {
      toast.error(errorMessage(error))
    } finally {
      setLoading(false)
    }
  })

  return (
    <Button
      type="button"
      disabled={isLoading}
      className={cn("w-fit", className)}
      variant={variant}
      onClick={handleRefresh}
      {...props}
    >
      {isLoading ? <Spinner variant="ellipsis" /> : <LuRefreshCcw className="size-4" />}
      Refresh LinkedIn
    </Button>
  )
}
