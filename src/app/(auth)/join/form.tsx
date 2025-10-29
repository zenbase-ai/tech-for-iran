"use client"

import { useActionState } from "react"
import { LuArrowRight } from "react-icons/lu"
import { HStack, VStack } from "@/components/layout/stack"
import { Button } from "@/components/ui/button"
import { joinPodAction } from "./action"

export const JoinPodForm = () => {
  const [state, action, isPending] = useActionState(joinPodAction, null)

  return (
    <form action={action}>
      <HStack wrap items="center" className="gap-3">
        <VStack className="gap-3 flex-1">
          <input
            id="invite-code"
            name="inviteCode"
            type="text"
            placeholder="Enter an invite code"
            required
            className="w-full px-4 py-2 border rounded-full bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </VStack>
        <Button type="submit" disabled={isPending} size="lg">
          {isPending ? "Joining..." : "Join Pod"}
          <LuArrowRight />
        </Button>
      </HStack>
      {state?.error && <p className="text-sm text-destructive mt-1">{state.error}</p>}
    </form>
  )
}
