"use client"

import { useQuery } from "convex/react"
import { capitalize } from "es-toolkit/string"
import Form from "next/form"
import { useActionState, useEffectEvent, useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { HoverButton } from "@/components/ui/hover-button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { useActionToastState } from "@/hooks/use-action-state-toasts"
import { cn } from "@/lib/utils"
import { submitPost } from "./actions"
import { type LinkedInReactionType, maxDelay, minDelay, reactionTypes, targetCount } from "./schema"

export type SubmitPostFormProps = {
  podId: Id<"pods">
  className?: string
}

export const SubmitPostForm: React.FC<SubmitPostFormProps> = ({ podId, className }) => {
  const [formState, formAction, formLoading] = useActionState(submitPost, {})
  useActionToastState(formState, formLoading)

  const [selectedReactions, setSelectedReactions] = useState<LinkedInReactionType[]>(
    reactionTypes.default,
  )

  const handleReactionChange = useEffectEvent((value: LinkedInReactionType, checked: boolean) => {
    setSelectedReactions((prev) => (checked ? [...prev, value] : prev.filter((v) => v !== value)))
  })

  const pod = useQuery(api.pods.get, { podId })
  if (!pod) {
    return <Skeleton className={cn("w-full h-72", className)} />
  }

  const minTargetCount = Math.min(1, pod.memberCount - 1)
  const maxTargetCount = Math.min(pod.memberCount - 1, targetCount.max)
  const defaultTargetCount = Math.min(25, maxTargetCount)

  return (
    <Form action={formAction} className={cn("flex flex-col gap-6", className)}>
      <p className="text-muted-foreground">
        Submit a LinkedIn post and watch the engagements roll in.
      </p>

      <input type="hidden" name="podId" value={podId} />

      <Field className="flex-row">
        <Input
          id="url"
          name="url"
          type="url"
          className="h-12"
          placeholder="https://www.linkedin.com/feed/update/urn:li:activity:..."
          required
          autoFocus
        />

        <HoverButton type="submit" disabled={formLoading} className="max-w-fit">
          Submit
        </HoverButton>
      </Field>

      <FieldSet className="w-full">
        <FieldLegend variant="label">Reaction types</FieldLegend>
        <FieldGroup className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {reactionTypes.options.map((reaction) => (
            <Field key={reaction} orientation="horizontal">
              <Checkbox
                id={`reaction-${reaction}`}
                checked={selectedReactions.includes(reaction)}
                onCheckedChange={(checked) => handleReactionChange(reaction, checked === true)}
              />
              <FieldLabel htmlFor={`reaction-${reaction}`} className="font-normal">
                {capitalize(reaction)}
              </FieldLabel>
            </Field>
          ))}
        </FieldGroup>
        {/* Hidden inputs for form submission */}
        {selectedReactions.map((reaction) => (
          <input key={reaction} type="hidden" name="reactionTypes" value={reaction} />
        ))}
      </FieldSet>

      <Field>
        <FieldLabel htmlFor="targetCount">Target engagement count</FieldLabel>
        <Input
          id="targetCount"
          name="targetCount"
          type="number"
          min={minTargetCount}
          max={maxTargetCount}
          defaultValue={defaultTargetCount}
        />
        <FieldDescription>
          Default: {defaultTargetCount}, Max: {maxTargetCount}
        </FieldDescription>
      </Field>

      <FieldGroup className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor="minDelay">Min delay between reactions in seconds</FieldLabel>
          <Input
            id="minDelay"
            name="minDelay"
            type="number"
            min={minDelay.min}
            max={minDelay.max}
            defaultValue={minDelay.default}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="maxDelay">Max delay between reactions in seconds</FieldLabel>
          <Input
            id="maxDelay"
            name="maxDelay"
            type="number"
            min={maxDelay.min}
            max={maxDelay.max}
            defaultValue={maxDelay.default}
          />
        </Field>
      </FieldGroup>
    </Form>
  )
}
