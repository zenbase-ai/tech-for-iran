"use server"

import { auth } from "@clerk/nextjs/server"
import { fetchMutation, fetchQuery } from "convex/nextjs"
import { redirect } from "next/navigation"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"

export interface SubmitPostState {
  error?: string
}

export async function submitPostAction(
  podId: Id<"pods">,
  _prevState: SubmitPostState | null,
  formData: FormData,
): Promise<SubmitPostState> {
  const { userId } = await auth()

  if (!userId) {
    return { error: "You must be signed in to submit a post" }
  }

  const url = formData.get("url")?.toString()?.trim()

  if (!url) {
    return { error: "Please enter a LinkedIn post URL" }
  }

  // Extract URN from LinkedIn URL
  // Format: https://www.linkedin.com/feed/update/urn:li:activity:1234567890/
  const urnMatch = url.match(/urn:li:activity:(\d+)/)
  if (!urnMatch) {
    return { error: "Invalid LinkedIn post URL. Please provide a valid post URL." }
  }

  const urn = `urn:li:activity:${urnMatch[1]}`

  try {
    // Verify user is a member of this pod
    const membership = await fetchQuery(api.pods.get, { podId })
    if (!membership) {
      return { error: "Pod not found" }
    }

    // Check LinkedIn connection exists
    const linkedInState = await fetchQuery(api.linkedin.getState, { userId })
    if (!linkedInState.account) {
      return { error: "You must connect your LinkedIn account first" }
    }

    if (linkedInState.needsReconnection || !linkedInState.isHealthy) {
      return { error: "Your LinkedIn connection needs to be refreshed. Please reconnect." }
    }

    // Submit the post
    const postId = await fetchMutation(api.posts.submit, {
      userId,
      podId,
      url,
      urn,
    })

    // Redirect to post detail page
    redirect(`/posts/${postId}`)
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error
    }
    return { error: error instanceof Error ? error.message : "Failed to submit post" }
  }
}
