"use client"

import Form from "next/form"
import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useActionToastState } from "@/hooks/use-action-state-toasts"
import { cn } from "@/lib/utils"
import { joinPod } from "./action"

export type JoinPodFormProps = {
  autoFocus?: boolean
  className?: string
}

export const JoinPodForm: React.FC<JoinPodFormProps> = ({ autoFocus, className }) => {
  const [formState, formAction, formLoading] = useActionState(joinPod, {})
  useActionToastState(formState, formLoading)

  return (
    <Form action={formAction} className={cn("flex flex-row items-center gap-3", className)}>
      <Input
        name="inviteCode"
        type="text"
        placeholder="Enter an invite code"
        required
        autoFocus={autoFocus}
      />
      <Button type="submit" disabled={formLoading} variant="outline">
        {formLoading ? "Joining..." : "Join"}
      </Button>
    </Form>
  )
}
