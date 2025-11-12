"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "convex/react"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { LuArrowRight } from "react-icons/lu"
import { useTimeout } from "usehooks-ts"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { api } from "@/convex/_generated/api"
import useAsyncFn from "@/hooks/use-async-fn"
import { cn } from "@/lib/utils"

export const PodJoinSchema = z.object({
  inviteCode: z.string().min(1),
})

export type PodJoinSchema = z.infer<typeof PodJoinSchema>

export type PodJoinFormProps = {
  autoFocus?: boolean
  className?: string
}

export const PodJoinForm: React.FC<PodJoinFormProps> = ({ autoFocus, className }) => {
  const form = useForm<PodJoinSchema>({
    resolver: zodResolver(PodJoinSchema),
    defaultValues: { inviteCode: "" },
  })

  const router = useRouter()
  const mutate = useAsyncFn(useMutation(api.pods.mutate.join))

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
