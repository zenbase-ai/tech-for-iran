"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "convex/react"
import { useRouter } from "next/navigation"
import { useEffectEvent } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { HStack } from "@/components/layout/stack"
import { Field } from "@/components/ui/field"
import { HoverButton } from "@/components/ui/hover-button"
import { Input } from "@/components/ui/input"
import { api } from "@/convex/_generated/api"
import { toastResult } from "@/hooks/use-action-state-toasts"
import { cn, errorMessage } from "@/lib/utils"
import type { CreatePodData } from "./schema"
import { CreatePodSchema } from "./schema"

export type CreatePodFormProps = {
  className?: string
}

export const CreatePodForm: React.FC<CreatePodFormProps> = ({ className }) => {
  const router = useRouter()
  const mutation = useMutation(api.pods.create)

  const form = useForm<CreatePodData>({
    resolver: zodResolver(CreatePodSchema),
    defaultValues: {
      name: "",
      inviteCode: "",
    },
  })

  const onSubmit = useEffectEvent(async (data: CreatePodData) => {
    try {
      const result = await mutation(data)
      toastResult(result)
      if (!("error" in result)) {
        router.push(`/pods/${result.pod._id}`)
      }
    } catch (error: unknown) {
      toast.error(errorMessage(error))
    }
  })

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className={cn("flex flex-col gap-6 w-full", className)}
    >
      <HStack wrap justify="between" items="center" className="gap-6">
        <Field className="flex-1">
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Input
                {...field}
                id={field.name}
                type="text"
                placeholder="My Awesome Pod Name"
                aria-invalid={fieldState.invalid}
                disabled={form.formState.isSubmitting}
                autoFocus
              />
            )}
          />
        </Field>

        <Field className="flex-1">
          <Controller
            name="inviteCode"
            control={form.control}
            render={({ field, fieldState }) => (
              <Input
                {...field}
                id={field.name}
                type="text"
                placeholder="your-invite-code"
                aria-invalid={fieldState.invalid}
                disabled={form.formState.isSubmitting}
              />
            )}
          />
        </Field>
      </HStack>

      <HoverButton type="submit" disabled={form.formState.isSubmitting} className="max-w-fit">
        {form.formState.isSubmitting ? "Creating..." : "Create"}
      </HoverButton>
    </form>
  )
}
