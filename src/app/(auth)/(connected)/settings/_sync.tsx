"use client"

import { useAction } from "convex/react"
import { LuRefreshCcw } from "react-icons/lu"
import { Button, type ButtonProps } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { api } from "@/convex/_generated/api"
import useAsyncFn from "@/hooks/use-async-fn"

export type SyncButtonProps = ButtonProps

export const SyncButton: React.FC<SyncButtonProps> = ({ variant, children, ...props }) => {
  const sync = useAsyncFn(useAction(api.linkedin.action.syncOwn))

  return (
    <Button
      disabled={sync.pending}
      onClick={() => sync.execute()}
      type="button"
      variant={variant}
      {...props}
    >
      {sync.pending ? <Spinner variant="ellipsis" /> : <LuRefreshCcw className="size-3" />}
      {children}
    </Button>
  )
}
