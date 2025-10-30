"use client"

import Form from "next/form"
import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Field, FieldContent, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { Doc } from "@/convex/_generated/dataModel"
import { profileFormAction } from "./actions"

export type ProfileFormProps = {
  profile: Doc<"linkedinProfiles">
}

export const ProfileForm = ({ profile }: ProfileFormProps) => {
  const [state, formAction, pending] = useActionState(profileFormAction, null)

  return (
    <Form action={formAction} className="w-full flex flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="maxActions">Daily Like &amp; Comment Limit</FieldLabel>
        <FieldContent>
          <Input
            id="maxActions"
            type="number"
            min="1"
            max="50"
            defaultValue={profile.maxActions}
            required
          />
        </FieldContent>
      </Field>

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Updating..." : "Update"}
      </Button>

      {state?.error && <FieldError>{state.error}</FieldError>}
    </Form>
  )
}
