"use client"

import { useAction } from "convex/react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
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
import { api } from "@/convex/_generated/api"
import useAsyncEffect from "@/hooks/use-async-effect"
import { pluralize } from "@/lib/utils"

export default function ConnectDialogPage() {
  const inviteCode = useSearchParams().get("inviteCode") ?? ""
  const [countdown, { startCountdown, stopCountdown, resetCountdown }] = useCountdown({
    countStart: 5,
  })

  const generateHostedAuthURL = useAction(api.linkedin.action.generateHostedAuthURL)
  const connect = useEffectEvent(async () => {
    const { url } = await generateHostedAuthURL({ inviteCode })
    window.location.href = url
  })

  useAsyncEffect(async () => {
    if (countdown === 0) {
      await connect()
    }
  }, [countdown])

  useEffect(() => {
    resetCountdown()
    startCountdown()
    return stopCountdown
  }, [resetCountdown, startCountdown, stopCountdown])

  return (
    <AlertDialog open>
      <AlertDialogContent className="max-w-md">
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
          <AlertDialogAction autoFocus disabled={countdown <= 1} onClick={connect}>
            Connect
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
