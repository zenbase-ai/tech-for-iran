"use client"

import { useActionState } from "react"
import { LuLoader, LuSend } from "react-icons/lu"
import { HStack } from "@/components/layout/stack"
import { Button } from "@/components/ui/button"
import type { Id } from "@/convex/_generated/dataModel"
import { submitPostAction } from "./actions"

export type SubmitPostFormProps = {
  podId: Id<"pods">
}

export const SubmitPostForm: React.FC<SubmitPostFormProps> = ({ podId }) => {
  const [_state, formAction, pending] = useActionState(submitPostAction.bind(null, podId), null)

  return (
    <form action={formAction}>
      <HStack className="gap-4">
        <input
          id="post-url"
          name="url"
          type="url"
          placeholder="https://www.linkedin.com/feed/update/urn:li:activity:..."
          required
          className="w-full px-3 py-1 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
        />

        <Button type="submit" disabled={pending} size="lg">
          {pending ? (
            <>
              <LuLoader className="size-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <LuSend className="size-4" />
              Submit
            </>
          )}
        </Button>
      </HStack>
    </form>
  )
}
