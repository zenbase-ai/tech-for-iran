"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "convex/react"
import { redirect } from "next/navigation"
import { useEffectEvent } from "react"
import { Controller, useForm } from "react-hook-form"
import { LuArrowRight } from "react-icons/lu"
import * as z from "zod"
import { HStack } from "@/components/layout/stack"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { api } from "@/convex/_generated/api"
import useAsyncFn from "@/hooks/use-async-fn"
import { useAuthQuery } from "@/hooks/use-auth-query"
import { needsReconnection } from "@/lib/linkedin"
import { cn, queryString } from "@/lib/utils"

export type PodJoinFormProps = {
  autoFocus?: boolean
  className?: string
}

const PodJoinSchema = z.object({
  inviteCode: z.string().trim().min(1, "Invite code is required"),
})
type PodJoinSchema = z.infer<typeof PodJoinSchema>

export const PodJoinForm: React.FC<PodJoinFormProps> = ({ autoFocus, className }) => {
  const state = useAuthQuery(api.linkedin.query.getState)
  const join = useAsyncFn(useMutation(api.pods.mutate.join))

  const form = useForm({
    resolver: zodResolver(PodJoinSchema),
    defaultValues: { inviteCode: "" },
    disabled: state == null,
  })
  const { disabled, isSubmitting } = form.formState

  const onSubmit = useEffectEvent(async (data: PodJoinSchema) => {
    if (needsReconnection(state?.account?.status)) {
      return redirect(`/connect/dialog?${queryString(data)}`)
    }

    return await join.execute(data)
  })

  return (
    <HStack
      as="form"
      className={cn("gap-3", className)}
      items="center"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <Controller
        control={form.control}
        name="inviteCode"
        render={({ field, fieldState }) => (
          <Input
            {...field}
            aria-invalid={fieldState.invalid}
            autoFocus={autoFocus}
            id={field.name}
            placeholder="Enter an invite code"
            type="text"
          />
        )}
      />
      <Button disabled={disabled || isSubmitting} type="submit" variant="outline">
        Join
        {isSubmitting ? <Spinner variant="ellipsis" /> : <LuArrowRight />}
      </Button>
    </HStack>
  )
}
