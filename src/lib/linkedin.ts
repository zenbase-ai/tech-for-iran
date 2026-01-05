import { pick } from "es-toolkit"
import * as z from "zod"
import type { Doc } from "@/convex/_generated/dataModel"
import type { Post } from "@/schemas/unipile"

export const SubscriptionPlan = z
  .enum(["member", "silver_member", "gold_member"])
  .optional()
  .default("member")
export type SubscriptionPlan = z.infer<typeof SubscriptionPlan>

export const subscriptionPlan = (slug?: string | null) => SubscriptionPlan.parse(slug)

/**
 * LinkedIn account statuses from Unipile webhook
 * @see https://docs.unipile.com/api-reference/webhooks/account-status
 */
export const ConnectionStatus = z.enum([
  "OK", // Account is healthy and syncing
  "SYNC_SUCCESS", // Synchronization completed successfully
  "CREATION_SUCCESS", // Account was successfully created
  "RECONNECTED", // Account was successfully reconnected
  "CONNECTING", // Account is attempting to connect
  "CREDENTIALS", // Invalid credentials, needs reconnection
  "ERROR", // Unexpected error during sync
  "STOPPED", // Synchronization has stopped
  "DELETED", // Account was deleted
])

export type ConnectionStatus = z.infer<typeof ConnectionStatus>

export const CONNECTED_STATUSES = new Set<ConnectionStatus>([
  "OK",
  "RECONNECTED",
  "CREATION_SUCCESS",
  "SYNC_SUCCESS",
])
export const RECONNECT_STATUSES = new Set<ConnectionStatus>(["CREDENTIALS", "ERROR", "STOPPED"])
export const DISCONNECTED_STATUSES = new Set<ConnectionStatus>([...RECONNECT_STATUSES, "DELETED"])

export const isConnected = (status?: string | null): boolean =>
  !!status && !DISCONNECTED_STATUSES.has(status as ConnectionStatus)

export const needsReconnection = (status?: string | null): boolean =>
  !!status && RECONNECT_STATUSES.has(status as ConnectionStatus)

export const ReactionType = z.enum(["like", "love", "celebrate", "insightful", "funny", "support"])

export type ReactionType = z.infer<typeof ReactionType>

type ProfileURL = { url: string } | { public_profile_url?: string; public_identifier: string }

export const profileURL = (p: ProfileURL): string =>
  "url" in p ? p.url : p.public_profile_url || `https://www.linkedin.com/in/${p.public_identifier}`

type ProfileName = { firstName: string; lastName: string }

export const fullName = (p: ProfileName): string => `${p.firstName} ${p.lastName}`.trim()

export const initials = (p: ProfileName): string =>
  [p.firstName[0], p.lastName[0]].filter(Boolean).join("").trim()

export type PostProfile = {
  firstName: string
  lastName: string
  picture: string
  headline: string
  url: string
}

export const postProfile = (
  profile: Doc<"linkedinProfiles"> | null,
  author: Doc<"posts">["author"]
): PostProfile | null => {
  if (!profile) {
    const { name, headline, url } = author
    if (!url) {
      return null
    }
    const [firstName = "LinkedIn", lastName = ""] = name.split(" ", 2)
    return {
      firstName,
      lastName,
      headline,
      url,
      picture: "",
    }
  }

  return pick(profile, ["firstName", "lastName", "picture", "headline", "url"])
}

export const postModel = (data: Post) =>
  ({
    socialId: data.social_id,
    text: data.text,
    attachments: data.attachments,
    url: data.share_url,
    author: {
      name: data.author.name,
      headline: data.author.headline ?? "Company",
      url: profileURL(data.author),
    },
    postedAt: data.parsed_datetime,
  }) as const

export const statsModel = (data: Post) =>
  ({
    commentCount: data.comment_counter,
    impressionCount: data.impressions_counter,
    reactionCount: data.reaction_counter,
    repostCount: data.repost_counter,
  }) as const
