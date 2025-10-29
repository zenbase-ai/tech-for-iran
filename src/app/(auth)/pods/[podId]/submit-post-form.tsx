"use client"

import { useFormState, useFormStatus } from "react-dom"
import { LuLoader, LuSend } from "react-icons/lu"
import { Box } from "@/components/layout/box"
import { HStack, VStack } from "@/components/layout/stack"
import type { Id } from "@/convex/_generated/dataModel"
import { submitPostAction } from "./actions"

interface SubmitPostFormProps {
  podId: Id<"pods">
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {pending ? (
        <>
          <LuLoader className="size-4 animate-spin" />
          Submitting...
        </>
      ) : (
        <>
          <LuSend className="size-4" />
          Submit Post
        </>
      )}
    </button>
  )
}

export function SubmitPostForm({ podId }: SubmitPostFormProps) {
  const [state, formAction] = useFormState(submitPostAction.bind(null, podId), null)

  return (
    <Box className="border rounded-lg p-4">
      <form action={formAction}>
        <VStack className="gap-4">
          <VStack className="gap-2">
            <label htmlFor="post-url" className="text-sm font-medium">
              LinkedIn Post URL
            </label>
            <input
              id="post-url"
              name="url"
              type="url"
              placeholder="https://www.linkedin.com/feed/update/urn:li:activity:..."
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-muted-foreground">
              Paste the full URL of your LinkedIn post (e.g., from the share button)
            </p>
          </VStack>

          {state?.error && (
            <Box className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
              {state.error}
            </Box>
          )}

          <HStack justify="end">
            <SubmitButton />
          </HStack>
        </VStack>
      </form>
    </Box>
  )
}
