"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "convex/react"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { LuArrowRight } from "react-icons/lu"
import { useTimeout } from "usehooks-ts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { api } from "@/convex/_generated/api"
import useAsyncFn from "@/hooks/use-async-fn"
import { cn } from "@/lib/utils"
import { JoinPodSchema, type JoinPodSchema as JoinPodSchemaType } from "./schema"

export type JoinPodFormProps = {
  autoFocus?: boolean
  className?: string
}

export const JoinPodForm: React.FC<JoinPodFormProps> = ({ autoFocus, className }) => {
  const form = useForm<JoinPodSchemaType>({
    resolver: zodResolver(JoinPodSchema),
    defaultValues: { inviteCode: "" },
  })

  const router = useRouter()
  const mutate = useAsyncFn(useMutation(api.fns.pods.join))

  const podId = mutate.data?.pod?._id
  useTimeout(() => podId && router.push(`/pods/${podId}`), podId ? 1000 : null)

  return (
    <form
      onSubmit={form.handleSubmit(mutate.execute)}
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
