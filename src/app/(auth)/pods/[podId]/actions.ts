"use server"

import { fetchMutation, fetchQuery } from "convex/nextjs"
import { redirect } from "next/navigation"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { parsePostURN } from "@/convex/helpers/linkedin"
import { tokenAuth } from "@/lib/clerk"

type SubmitPostState = {
  error?: string
}

export const submitPostAction = async (
  podId: Id<"pods">,
  _prevState: SubmitPostState | null,
  formData: FormData,
): Promise<SubmitPostState> => {
  const { token } = await tokenAuth()

  const url = formData.get("url")?.toString()?.trim()

  if (!url) {
    return { error: "Please enter a LinkedIn post URL" }
  }

  // Extract URN from LinkedIn URL using the utility function
  const urn = parsePostURN(url)
  if (!urn) {
    return { error: "Invalid LinkedIn post URL. Please provide a valid post URL." }
  }

  // Parse reaction types from checkboxes (FormData.getAll returns array)
  const reactionTypesRaw = formData.getAll("reactionTypes")
  const reactionTypes =
    reactionTypesRaw.length > 0 ? reactionTypesRaw.map((v) => v.toString()) : undefined

  // Parse target count
  const targetCountRaw = formData.get("targetCount")?.toString()
  const targetCount = targetCountRaw ? Number.parseInt(targetCountRaw, 10) : undefined

  // Parse delays
  const minDelayRaw = formData.get("minDelay")?.toString()
  const minDelay = minDelayRaw ? Number.parseInt(minDelayRaw, 10) : undefined

  const maxDelayRaw = formData.get("maxDelay")?.toString()
  const maxDelay = maxDelayRaw ? Number.parseInt(maxDelayRaw, 10) : undefined

  try {
    // Verify user is a member of this pod
    const [membership, linkedInState] = await Promise.all([
      fetchQuery(api.pods.get, { podId }, { token }),
      fetchQuery(api.linkedin.getState, {}, { token }),
    ])

    if (!membership) {
      return { error: "Pod not found" }
    }
    if (!linkedInState.profile) {
      return { error: "You must connect your LinkedIn account first" }
    }
    if (linkedInState.needsReconnection || !linkedInState.isHealthy) {
      return { error: "Your LinkedIn connection needs to be refreshed. Please reconnect." }
    }

    // Submit the post with all configuration parameters
    const postId = await fetchMutation(
      api.posts.submit,
      { podId, url, reactionTypes, targetCount, minDelay, maxDelay },
      { token },
    )

    // Redirect to post detail page
    return redirect(`/posts/${postId}`)
  } catch (error: unknown) {
    if (!(error instanceof Error)) {
      return { error: String(error) }
    }
    if (error.message.includes("NEXT_REDIRECT")) {
      throw error
    }
    return { error: error.message }
  }
}
