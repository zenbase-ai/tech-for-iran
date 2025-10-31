"use server"

import { fetchMutation, fetchQuery } from "convex/nextjs"
import * as z from "zod"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { tokenAuth } from "@/lib/clerk"
import { errorMessage } from "@/lib/utils"
import { SubmitPostSchema } from "./schema"

type SubmitPostState = {
  message?: string
  error?: string
}

export const submitPost = async (
  _prevState: SubmitPostState,
  formData: FormData,
): Promise<SubmitPostState> => {
  const { token } = await tokenAuth()

  const { data, success, error } = SubmitPostSchema.safeParse(Object.fromEntries(formData))
  if (!success) {
    return { error: z.prettifyError(error) }
  }

  const podId = data.podId as Id<"pods">

  try {
    // Verify user is a member of this pod
    const [membership, { account, profile, needsReconnection }] = await Promise.all([
      fetchQuery(api.pods.get, { podId }, { token }),
      fetchQuery(api.linkedin.getState, {}, { token }),
    ])

    if (!membership) {
      return { error: "You are not a member of this pod." }
    }
    if (!profile || !account) {
      return { error: "You must connect your LinkedIn account first." }
    }
    if (needsReconnection) {
      return { error: "Your LinkedIn connection needs to be refreshed. Please reconnect." }
    }

    // Submit the post with all configuration parameters
    await fetchMutation(api.posts.submit, { ...data, podId }, { token })

    // Redirect to post detail page
    return { message: "Post submitted!" }
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error
    }
    return { error: errorMessage(error) }
  }
}
