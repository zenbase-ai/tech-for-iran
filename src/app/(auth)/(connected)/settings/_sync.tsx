"use client"

import { useAction } from "convex/react"
import { LuRefreshCcw } from "react-icons/lu"
import { Button, type ButtonProps } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { api } from "@/convex/_generated/api"
import useAsyncFn from "@/hooks/use-async-fn"
import { cn } from "@/lib/utils"

export type SyncButtonProps = ButtonProps

export const SyncButton: React.FC<SyncButtonProps> = ({
  className,
  variant,
  children,
  ...props
}) => {
  const sync = useAsyncFn(useAction(api.linkedin.action.syncOwn))

  return (
    <Button
      type="button"
      disabled={sync.pending}
      className={cn("w-fit", className)}
      variant={variant}
      onClick={() => sync.execute()}
      {...props}
    >
      {children}
      {sync.pending ? <Spinner variant="ellipsis" /> : <LuRefreshCcw className="size-4" />}
    </Button>
  )
}
