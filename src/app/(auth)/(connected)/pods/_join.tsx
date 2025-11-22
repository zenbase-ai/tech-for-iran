"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "convex/react"
import { Controller, useForm } from "react-hook-form"
import { LuArrowRight } from "react-icons/lu"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { api } from "@/convex/_generated/api"
import useAsyncFn from "@/hooks/use-async-fn"
import { cn } from "@/lib/utils"

export const PodJoinSchema = z.object({
  inviteCode: z.string().trim().min(1),
})

export type PodJoinSchema = z.infer<typeof PodJoinSchema>

export type PodJoinFormProps = {
  autoFocus?: boolean
  className?: string
}

export const PodJoinForm: React.FC<PodJoinFormProps> = ({ autoFocus, className }) => {
  const join = useAsyncFn(useMutation(api.pods.mutate.join))
  const form = useForm({
    resolver: zodResolver(PodJoinSchema),
    defaultValues: { inviteCode: "" },
  })
  const { isSubmitting } = form.formState

  return (
    <form
      className={cn("flex flex-row items-center gap-3", className)}
      onSubmit={form.handleSubmit(join.execute)}
    >
      <Controller
        control={form.control}
        name="inviteCode"
        render={({ field, fieldState }) => (
          <Input
            {...field}
            aria-invalid={fieldState.invalid}
            autoFocus={autoFocus}
            disabled={isSubmitting}
            id={field.name}
            placeholder="Enter an invite code"
            type="text"
          />
        )}
      />
      <Button disabled={isSubmitting} type="submit" variant="outline">
        Join
        {isSubmitting ? <Spinner variant="ellipsis" /> : <LuArrowRight className="size-4" />}
      </Button>
    </form>
  )
}
