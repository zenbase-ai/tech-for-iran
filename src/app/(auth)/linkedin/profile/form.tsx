"use client"

import { useQuery } from "convex/react"
import Form from "next/form"
import { useActionState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Field, FieldContent, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Loading } from "@/components/ui/loading"
import { api } from "@/convex/_generated/api"
import { profileFormAction } from "./actions"
import { maxActions } from "./schema"

export const ProfileForm: React.FC = () => {
  const { profile } = useQuery(api.linkedin.getState, {}) ?? {}
  const [formState, formAction, formLoading] = useActionState(profileFormAction, {})

  useEffect(() => {
    if (!formLoading && formState.message) {
      toast.success(formState.message)
    }
  }, [formState.message, formLoading])

  if (!profile) {
    return <Loading />
  }

  return (
    <Form action={formAction} className="w-full flex flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="maxActions">Daily Like &amp; Comment Limit</FieldLabel>
        <FieldContent>
          <Input
            disabled={formLoading}
            name="maxActions"
            type="number"
            min={maxActions.min}
            max={maxActions.max}
            defaultValue={profile.maxActions}
            required
          />
        </FieldContent>
      </Field>

      <Button type="submit" disabled={formLoading} className="w-fit">
        {formLoading ? "Updating..." : "Update"}
      </Button>

      {formState?.error && <FieldError>{formState.error}</FieldError>}
    </Form>
  )
}
