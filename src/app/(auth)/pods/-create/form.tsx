"use client"

import Form from "next/form"
import { useActionState } from "react"
import { HStack } from "@/components/layout/stack"
import { Field } from "@/components/ui/field"
import { HoverButton } from "@/components/ui/hover-button"
import { Input } from "@/components/ui/input"
import { useActionToastState } from "@/hooks/use-action-state-toasts"
import { cn } from "@/lib/utils"
import { createPod } from "./actions"

export type CreatePodFormProps = {
  className?: string
}

export const CreatePodForm: React.FC<CreatePodFormProps> = ({ className }) => {
  const [formState, formAction, formLoading] = useActionState(createPod, {})
  useActionToastState(formState, formLoading)

  return (
    <Form action={formAction} className={cn("flex flex-col gap-6 w-full", className)}>
      <HStack wrap justify="between" items="center" className="gap-6">
        <Field className="flex-1">
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="My Awesome Pod Name"
            required
            autoFocus
          />
        </Field>

        <Field className="flex-1">
          <Input
            id="inviteCode"
            name="inviteCode"
            type="text"
            placeholder="your-invite-code"
            required
          />
        </Field>
      </HStack>

      <HoverButton type="submit" disabled={formLoading} className="max-w-fit">
        {formLoading ? "Creating..." : "Create"}
      </HoverButton>
    </Form>
  )
}
