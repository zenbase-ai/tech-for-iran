"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "convex/react"
import { useRouter } from "next/navigation"
import { useEffectEvent } from "react"
import { Controller, useForm } from "react-hook-form"
import { LuArrowRight } from "react-icons/lu"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { api } from "@/convex/_generated/api"
import { toastResult } from "@/hooks/use-action-state-toasts"
import { cn, errorMessage } from "@/lib/utils"
import { JoinPodSchema, type JoinPodSchema as JoinPodSchemaType } from "./schema"

export type JoinPodFormProps = {
  autoFocus?: boolean
  className?: string
}

export const JoinPodForm: React.FC<JoinPodFormProps> = ({ autoFocus, className }) => {
  const router = useRouter()
  const mutation = useMutation(api.pods.join)

  const form = useForm<JoinPodSchemaType>({
    resolver: zodResolver(JoinPodSchema),
    defaultValues: {
      inviteCode: "",
    },
  })

  const onSubmit = useEffectEvent(async (data: JoinPodSchemaType) => {
    try {
      const result = await mutation(data)
      toastResult(result)
      if ("pod" in result) {
        setTimeout(() => {
          router.push(`/pods/${result.pod._id}`)
        }, 500)
      }
    } catch (error: unknown) {
      toast.error(errorMessage(error))
    }
  })

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className={cn("flex flex-row items-center gap-3", className)}
    >
      <Controller
        name="inviteCode"
        control={form.control}
        render={({ field, fieldState }) => (
          <Input
            {...field}
            id={field.name}
            type="text"
            placeholder="Enter an invite code"
            aria-invalid={fieldState.invalid}
            disabled={form.formState.isSubmitting}
            autoFocus={autoFocus}
          />
        )}
      />
      <Button type="submit" disabled={form.formState.isSubmitting} variant="outline">
        Join
        {form.formState.isSubmitting ? (
          <Spinner variant="ellipsis" />
        ) : (
          <LuArrowRight className="size-4" />
        )}
      </Button>
    </form>
  )
}
