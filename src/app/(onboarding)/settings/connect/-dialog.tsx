"use client"

import { useRouter } from "next/navigation"
import plur from "plur"
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

export type ConnectDialogProps = {
  authLink: string
}

export const ConnectDialog: React.FC<ConnectDialogProps> = ({ authLink }) => {
  const router = useRouter()
  const [countdown, { startCountdown, stopCountdown, resetCountdown }] = useCountdown({
    countStart: 5,
  })

  const connect = useEffectEvent(() => {
    window.location.href = authLink
  })

  // biome-ignore lint/correctness/useExhaustiveDependencies: we want to reset the countdown when the auth link changes
  useEffect(() => {
    resetCountdown()
    startCountdown()
    return stopCountdown
  }, [resetCountdown, startCountdown, stopCountdown, authLink])

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
            <br />
            We&apos;ll redirect you in {countdown} {plur("second", countdown)}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={router.back}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={connect} disabled={countdown <= 1}>
            Connect
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
