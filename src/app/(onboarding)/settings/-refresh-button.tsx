"use client"

import { useAction } from "convex/react"
import { LuRefreshCcw } from "react-icons/lu"
import { Button, type ButtonProps } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { api } from "@/convex/_generated/api"
import { useAsyncFn } from "@/hooks/use-async-fn"
import { cn } from "@/lib/utils"

export type RefreshButtonProps = ButtonProps

export const RefreshButton: React.FC<RefreshButtonProps> = ({
  className,
  variant = "outline",
  ...props
}) => {
  const action = useAsyncFn(useAction(api.linkedin.refreshState))

  return (
    <Button
      type="button"
      disabled={action.pending}
      className={cn("w-fit", className)}
      variant={variant}
      onClick={() => action.execute()}
      {...props}
    >
      {action.pending ? <Spinner variant="ellipsis" /> : <LuRefreshCcw className="size-4" />}
      Refresh LinkedIn
    </Button>
  )
}
