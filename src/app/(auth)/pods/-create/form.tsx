"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "convex/react"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { LuArrowRight, LuPlus } from "react-icons/lu"
import { useTimeout } from "usehooks-ts"
import { HStack } from "@/components/layout/stack"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field } from "@/components/ui/field"
import { HoverButton } from "@/components/ui/hover-button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { api } from "@/convex/_generated/api"
import useAsyncFn from "@/hooks/use-async-fn"
import { cn } from "@/lib/utils"
import type { CreatePodData } from "./schema"
import { CreatePodSchema } from "./schema"

export type CreatePodFormProps = {
  className?: string
}

export const CreatePodForm: React.FC<CreatePodFormProps> = ({ className }) => {
  const form = useForm<CreatePodData>({
    resolver: zodResolver(CreatePodSchema),
    defaultValues: { name: "", inviteCode: "" },
  })

  const router = useRouter()
  const mutation = useAsyncFn(useMutation(api.pods.create))
  const podId = mutation.data && "pod" in mutation.data ? mutation.data.pod._id : null
  useTimeout(
    () => {
      if (podId) {
        router.push(`/pods/${podId}`)
      }
    },
    podId ? 1000 : null,
  )

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" disabled>
          <LuPlus className="size-4" />
          New
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Start an engagement pod</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(mutation.execute)}
          className={cn("flex flex-col gap-6 w-full mt-2", className)}
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
            Create
            {form.formState.isSubmitting ? (
              <Spinner variant="ellipsis" />
            ) : (
              <LuArrowRight className="size-4" />
            )}
          </HoverButton>
        </form>
      </DialogContent>
    </Dialog>
  )
}
