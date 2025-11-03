"use client"

import { useAction } from "convex/react"
import { useEffectEvent, useState } from "react"
import { LuRefreshCcw } from "react-icons/lu"
import { toast } from "sonner"
import { Button, type ButtonProps } from "@/components/ui/button"
import { api } from "@/convex/_generated/api"
import { cn, errorMessage } from "@/lib/utils"

export type RefreshFormProps = ButtonProps

export const RefreshForm: React.FC<RefreshFormProps> = ({
  className,
  variant = "outline",
  ...props
}) => {
  const refreshState = useAction(api.linkedin.refreshState)
  const [isLoading, setIsLoading] = useState(false)

  const handleRefresh = useEffectEvent(async () => {
    setIsLoading(true)
    try {
      const result = await refreshState()
      if (result.success) {
        toast.success(result.success)
      } else if (result.error) {
        toast.error(result.error)
      }
    } catch (error: unknown) {
      toast.error(errorMessage(error))
    } finally {
      setIsLoading(false)
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
