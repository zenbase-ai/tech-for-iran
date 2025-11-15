"use client"

import Link from "next/link"
import { useEffect, useEffectEvent } from "react"
import { useCountdown } from "usehooks-ts"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import pluralize from "@/lib/pluralize"

export type ConnectDialogProps = {
  redirectURL: string
}

export const ConnectDialog: React.FC<ConnectDialogProps> = ({ redirectURL }) => {
  const [countdown, { startCountdown, stopCountdown, resetCountdown }] = useCountdown({
    countStart: 5,
  })

  const connect = useEffectEvent(async () => {
    window.location.href = redirectURL
  })

  useEffect(() => {
    resetCountdown()
    startCountdown()
    return stopCountdown
  }, [resetCountdown, startCountdown, stopCountdown])

  useEffect(() => {
    if (countdown === 0) {
      connect()
    }
  }, [countdown])

  return (
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Let's connect your LinkedIn</AlertDialogTitle>
          <AlertDialogDescription>
            This lets us handle engagements for you automatically.
          </AlertDialogDescription>
          <AlertDialogDescription className="text-muted-foreground">
            We&apos;ll redirect you in {pluralize(countdown, "second")}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Link href="/">Cancel</Link>
          </AlertDialogCancel>
          <AlertDialogAction onClick={connect} disabled={countdown <= 1}>
            Connect
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
