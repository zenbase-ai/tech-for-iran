"use client"

import { useQuery } from "convex/react"
import { useActionState, useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { HoverButton } from "@/components/ui/hover-button"
import { Input } from "@/components/ui/input"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { submitPostAction } from "./actions"

export type SubmitPostFormProps = {
  podId: Id<"pods">
}

const REACTION_TYPES = [
  { value: "like", label: "Like" },
  { value: "celebrate", label: "Celebrate" },
  { value: "support", label: "Support" },
  { value: "love", label: "Love" },
  { value: "insightful", label: "Insightful" },
  { value: "funny", label: "Funny" },
] as const

const DEFAULT_REACTIONS = ["like", "celebrate", "support", "love", "insightful"]

export const SubmitPostForm: React.FC<SubmitPostFormProps> = ({ podId }) => {
  const [state, formAction, pending] = useActionState(submitPostAction.bind(null, podId), null)

  // Track selected reaction types for form submission
  const [selectedReactions, setSelectedReactions] = useState<string[]>(DEFAULT_REACTIONS)

  // Fetch pod members to calculate intelligent defaults
  const pod = useQuery(api.pods.get, { podId })
  const defaultTargetCount = Math.min(25, pod?.memberCount ?? 0)

  const handleReactionChange = (value: string, checked: boolean) => {
    setSelectedReactions((prev) => (checked ? [...prev, value] : prev.filter((v) => v !== value)))
  }

  return (
    <form action={formAction} className="flex flex-col items-center gap-6">
      {/* Form-level Error */}
      {state?.error && <FieldError>{state.error}</FieldError>}

      {/* Post URL Input */}
      <Field>
        <Input
          id="post-url"
          name="url"
          type="url"
          placeholder="https://www.linkedin.com/feed/update/urn:li:activity:..."
          required
          autoFocus
        />
      </Field>

      {/* Reaction Types */}
      <FieldSet className="w-full">
        <FieldLegend variant="label">Reaction Types</FieldLegend>
        <FieldGroup className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {REACTION_TYPES.map((reaction) => (
            <Field key={reaction.value} orientation="horizontal">
              <Checkbox
                id={`reaction-${reaction.value}`}
                checked={selectedReactions.includes(reaction.value)}
                onCheckedChange={(checked) =>
                  handleReactionChange(reaction.value, checked === true)
                }
              />
              <FieldLabel htmlFor={`reaction-${reaction.value}`}>{reaction.label}</FieldLabel>
            </Field>
          ))}
        </FieldGroup>
        {/* Hidden inputs for form submission */}
        {selectedReactions.map((reaction) => (
          <input key={reaction} type="hidden" name="reactionTypes" value={reaction} />
        ))}
      </FieldSet>

      {/* Target Count */}
      <Field>
        <FieldLabel htmlFor="targetCount">Target Engagement Count</FieldLabel>
        <Input
          id="targetCount"
          name="targetCount"
          type="number"
          min={1}
          max={pod?.memberCount}
          defaultValue={defaultTargetCount}
        />
        <FieldDescription>
          Default: {defaultTargetCount}, Max: {pod?.memberCount}
        </FieldDescription>
      </Field>

      {/* Delay Range */}
      <FieldGroup className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor="minDelay">Min Delay (seconds)</FieldLabel>
          <Input id="minDelay" name="minDelay" type="number" min={1} max={300} defaultValue={5} />
        </Field>
        <Field>
          <FieldLabel htmlFor="maxDelay">Max Delay (seconds)</FieldLabel>
          <Input id="maxDelay" name="maxDelay" type="number" min={1} max={300} defaultValue={15} />
        </Field>
      </FieldGroup>

      {/* Submit Button */}
      <HoverButton type="submit" disabled={pending} className="max-w-fit">
        Submit
      </HoverButton>
    </form>
  )
}
