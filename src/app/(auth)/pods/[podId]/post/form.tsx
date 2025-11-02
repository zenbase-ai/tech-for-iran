"use client"

import { useQuery } from "convex/react"
import { capitalize } from "es-toolkit/string"
import Form from "next/form"
import { useActionState, useEffect, useEffectEvent, useState } from "react"
import { LuChevronDown } from "react-icons/lu"
import { toast } from "sonner"
import { useBoolean } from "usehooks-ts"
import Loading from "@/app/loading"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
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
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { LINKEDIN_REACTION_TYPES, type LinkedInReactionType } from "@/convex/helpers/linkedin"
import { cn } from "@/lib/utils"
import { submitPost } from "./actions"
import { maxDelay, minDelay, targetCount } from "./schema"

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
  const [formState, formAction, formLoading] = useActionState(submitPost, {})

  useEffect(() => {
    if (!formLoading && formState?.message) {
      toast.success(formState.message)
    }
  }, [formState?.message, formLoading])

  useEffect(() => {
    if (!formLoading && formState?.error) {
      toast.error(formState.error)
    }
  }, [formState?.error, formLoading])

  const { value: showOptions, setValue: setShowOptions } = useBoolean(false)
  const [selectedReactions, setSelectedReactions] =
    useState<LinkedInReactionType[]>(DEFAULT_REACTIONS)

  const handleReactionChange = useEffectEvent((value: LinkedInReactionType, checked: boolean) => {
    setSelectedReactions((prev) => (checked ? [...prev, value] : prev.filter((v) => v !== value)))
  })

  const pod = useQuery(api.pods.get, { podId })
  if (!pod) {
    return <Loading />
  }

  const maxTargetCount = Math.min(pod.memberCount - 1, targetCount.max)
  const defaultTargetCount = Math.min(25, maxTargetCount)

  return (
    <Form action={formAction} className="flex flex-col items-center gap-4">
      <input type="hidden" name="podId" value={podId} />

      {/* Post URL Input */}
      <Field className="flex-row">
        <Input
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
              min={targetCount.min}
              max={maxTargetCount}
              defaultValue={defaultTargetCount}
            />
            <FieldDescription>
              Default: {defaultTargetCount}, Max: {maxTargetCount}
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
                min={minDelay.min}
                max={minDelay.max}
                defaultValue={5}
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
    </Form>
  )
}
