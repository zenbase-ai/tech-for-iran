"use client"

import { useQuery } from "convex/react"
import { capitalize } from "es-toolkit/string"
import { useActionState, useEffectEvent, useState } from "react"
import { LuChevronDown } from "react-icons/lu"
import { useBoolean } from "usehooks-ts"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
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
import { LINKEDIN_REACTION_TYPES, type LinkedInReactionType } from "@/convex/helpers/linkedin"
import { cn } from "@/lib/utils"
import { submitPostAction } from "./actions"

export type PostFormProps = {
  podId: Id<"pods">
}

const DEFAULT_REACTIONS: LinkedInReactionType[] = [
  "like",
  "celebrate",
  "support",
  "love",
  "insightful",
]

export const PostForm: React.FC<PostFormProps> = ({ podId }) => {
  const [state, formAction, pending] = useActionState(submitPostAction.bind(null, podId), null)

  // Track selected reaction types for form submission
  const [selectedReactions, setSelectedReactions] =
    useState<LinkedInReactionType[]>(DEFAULT_REACTIONS)

  // Fetch pod members to calculate intelligent defaults
  const pod = useQuery(api.pods.get, { podId })
  const defaultTargetCount = Math.min(25, pod?.memberCount ?? 0)

  const handleReactionChange = useEffectEvent((value: LinkedInReactionType, checked: boolean) => {
    setSelectedReactions((prev) => (checked ? [...prev, value] : prev.filter((v) => v !== value)))
  })

  const { value: showOptions, setValue: setShowOptions } = useBoolean(false)

  return (
    <form action={formAction} className="flex flex-col items-center gap-4">
      {/* Form-level Error */}
      {state?.error && <FieldError>{state.error}</FieldError>}

      {/* Post URL Input */}
      <Field className="flex-row">
        <Input
          id="post-url"
          name="url"
          type="url"
          className="h-12"
          placeholder="https://www.linkedin.com/feed/update/urn:li:activity:..."
          required
          autoFocus
        />

        <HoverButton type="submit" disabled={pending} className="max-w-fit">
          Submit
        </HoverButton>
      </Field>

      {/* Reaction Types */}
      <FieldSet className="w-full">
        <FieldLegend variant="label">Reaction types</FieldLegend>
        <FieldGroup className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {LINKEDIN_REACTION_TYPES.map((reaction) => (
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

      <Collapsible
        className="w-full flex flex-col gap-4"
        open={showOptions}
        onOpenChange={setShowOptions}
      >
        <CollapsibleContent className="flex flex-col gap-4">
          {/* Target Count */}
          <Field>
            <FieldLabel htmlFor="targetCount">Target engagement count</FieldLabel>
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
              <FieldLabel htmlFor="minDelay">Min delay between reactions in seconds</FieldLabel>
              <Input
                id="minDelay"
                name="minDelay"
                type="number"
                min={1}
                max={300}
                defaultValue={5}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="maxDelay">Max delay between reactions in seconds</FieldLabel>
              <Input
                id="maxDelay"
                name="maxDelay"
                type="number"
                min={1}
                max={300}
                defaultValue={15}
              />
            </Field>
          </FieldGroup>
        </CollapsibleContent>

        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="w-fit">
            <LuChevronDown
              className={cn("size-3 transition-transform", showOptions && "-rotate-180")}
            />
            Advanced
          </Button>
        </CollapsibleTrigger>
      </Collapsible>
    </form>
  )
}
