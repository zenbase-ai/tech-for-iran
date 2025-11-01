"use client"

import Form from "next/form"
import { useActionState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { joinPod } from "./action"

export type JoinPodFormProps = {
  className?: string
}

export const JoinPodForm: React.FC<JoinPodFormProps> = ({ className }) => {
  const [formState, formAction, formLoading] = useActionState(joinPod, {})

  useEffect(() => {
    if (!formLoading && formState?.message) {
      toast.success(formState.message)
    }
  }, [formState?.message, formLoading])

  useEffect(() => {
    if (!formLoading && formState?.error) {
      toast.error(formState.error)
    }
  }, [formState?.error, formLoading])

  return (
    <Form action={formAction} className={cn("flex flex-row items-center gap-3", className)}>
      <Input name="inviteCode" type="text" placeholder="Enter an invite code" required />
      <Button type="submit" disabled={formLoading} variant="outline">
        {formLoading ? "Joining..." : "Join"}
      </Button>
    </Form>
  )
}
