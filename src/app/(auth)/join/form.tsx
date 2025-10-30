"use client"

import { useActionState } from "react"
import { HStack, VStack } from "@/components/layout/stack"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { joinPodAction } from "./action"

export const JoinPodForm = () => {
  const [state, action, isPending] = useActionState(joinPodAction, null)

  return (
    <form action={action}>
      <HStack wrap items="center" className="gap-3">
        <VStack className="gap-3 flex-1">
          <Input
            id="invite-code"
            name="inviteCode"
            type="text"
            placeholder="Enter an invite code"
            required
          />
        </VStack>
        <Button type="submit" disabled={isPending} variant="outline">
          {isPending ? "Joining..." : "Join"}
        </Button>
      </HStack>
      {state?.error && <p className="text-sm text-destructive mt-1">{state.error}</p>}
    </form>
  )
}
