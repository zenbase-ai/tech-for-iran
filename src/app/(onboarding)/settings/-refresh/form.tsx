"use client"

import { useAction } from "convex/react"
import { useEffectEvent, useState } from "react"
import { LuRefreshCcw } from "react-icons/lu"
import { toast } from "sonner"
import { Button, type ButtonProps } from "@/components/ui/button"
import { api } from "@/convex/_generated/api"
import { toastResult } from "@/hooks/use-action-state-toasts"
import { cn, errorMessage } from "@/lib/utils"

export type RefreshFormProps = ButtonProps

export const RefreshForm: React.FC<RefreshFormProps> = ({
  className,
  variant = "outline",
  ...props
}) => {
  const refreshState = useAction(api.linkedin.refreshState)
  const [isLoading, setLoading] = useState(false)

  const handleRefresh = useEffectEvent(async () => {
    setLoading(true)
    try {
      const result = await refreshState()
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
      <LuRefreshCcw className={cn("size-4", isLoading && "animate-spin")} />
      {isLoading ? "Refreshing..." : "Refresh LinkedIn"}
    </Button>
  )
}
