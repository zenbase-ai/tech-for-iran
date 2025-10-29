"use client"

import { useQuery } from "convex/react"
import Image from "next/image"
import { LuCheck, LuClock, LuExternalLink, LuUsers } from "react-icons/lu"
import { Box } from "@/components/layout/box"
import { HStack, VStack } from "@/components/layout/stack"
import { Badge } from "@/components/ui/badge"
import { api } from "@/convex/_generated/api"
import type { Doc, Id } from "@/convex/_generated/dataModel"

type PostWithStatus = Doc<"posts"> & { status: string }

type Member = {
  userId: string
  firstName: string
  lastName: string
  picture: string
  url: string
  joinedAt: number
}

type Props = {
  initialPost: PostWithStatus
  initialEngagements: Doc<"engagements">[]
  pod: Doc<"pods">
  members: Member[]
  postId: Id<"posts">
  currentUserId: string
}

export function PostDetail({
  initialPost,
  initialEngagements,
  pod,
  members,
  postId,
  currentUserId,
}: Props) {
  // Use live queries for real-time updates
  const post = useQuery(api.posts.get, { postId }) ?? initialPost
  const engagements = useQuery(api.posts.engagements, { postId }) ?? initialEngagements

  // Create a map of userId to engagement for quick lookup
  const engagementMap = new Map(engagements.map((e) => [e.userId, e]))

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default">Completed</Badge>
      case "processing":
        return <Badge variant="secondary">Processing</Badge>
      case "pending":
        return <Badge variant="outline">Pending</Badge>
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Get reaction emoji
  const getReactionEmoji = (type: string) => {
    switch (type) {
      case "LIKE":
        return "👍"
      case "CELEBRATE":
        return "🎉"
      case "SUPPORT":
        return "💪"
      case "LOVE":
        return "❤️"
      case "INSIGHTFUL":
        return "💡"
      case "FUNNY":
        return "😄"
      default:
        return type
    }
  }

  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (seconds < 60) return "just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  const engagedCount = engagements.length
  const totalMembers = members.length

  return (
    <VStack className="gap-8 max-w-4xl mx-auto">
      {/* Header Section */}
      <Box>
        <h1 className="text-3xl font-bold mb-2 font-serif italic">Post Engagement</h1>
        <HStack className="gap-6 text-sm text-muted-foreground">
          <HStack items="center" className="gap-1">
            <LuUsers className="size-4" />
            <span>{pod.name}</span>
          </HStack>
          <span>•</span>
          <span>Submitted {formatTimestamp(post.submittedAt)}</span>
        </HStack>
      </Box>

      {/* Post Info Section */}
      <VStack className="gap-4 border rounded-lg p-6">
        <HStack items="center" justify="between">
          <Box>
            <p className="text-sm text-muted-foreground mb-2">LinkedIn Post</p>
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline inline-flex items-center gap-2"
            >
              View on LinkedIn
              <LuExternalLink className="size-4" />
            </a>
          </Box>
          {getStatusBadge(post.status)}
        </HStack>

        {/* Stats */}
        <HStack className="gap-8 pt-4 border-t">
          <Box>
            <p className="text-2xl font-bold">{engagedCount}</p>
            <p className="text-sm text-muted-foreground">Engagements</p>
          </Box>
          <Box>
            <p className="text-2xl font-bold">{totalMembers}</p>
            <p className="text-sm text-muted-foreground">Total Members</p>
          </Box>
          <Box>
            <p className="text-2xl font-bold">
              {totalMembers > 0 ? Math.round((engagedCount / totalMembers) * 100) : 0}%
            </p>
            <p className="text-sm text-muted-foreground">Progress</p>
          </Box>
        </HStack>
      </VStack>

      {/* Engagement Status Section */}
      <VStack className="gap-3">
        <h2 className="text-xl font-semibold">Engagement Status</h2>
        <VStack className="gap-2">
          {members.map((member) => {
            const engagement = engagementMap.get(member.userId)
            const isEngaged = !!engagement
            const isCurrentUser = member.userId === currentUserId

            return (
              <Box
                key={member.userId}
                className={`border rounded-lg p-4 transition-colors ${
                  isEngaged
                    ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
                    : "bg-background"
                }`}
              >
                <HStack items="center" justify="between">
                  <HStack items="center" className="gap-3">
                    {/* Avatar */}
                    {member.picture ? (
                      <Image
                        src={member.picture}
                        alt={`${member.firstName} ${member.lastName}`}
                        className="rounded-full"
                        width={40}
                        height={40}
                      />
                    ) : (
                      <Box className="size-10 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-sm font-semibold">
                          {member.firstName?.[0]}
                          {member.lastName?.[0]}
                        </span>
                      </Box>
                    )}

                    {/* Name and Status */}
                    <Box>
                      <p className="font-medium">
                        {member.firstName} {member.lastName}
                        {isCurrentUser && (
                          <span className="text-xs text-muted-foreground ml-2">(you)</span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {isEngaged ? (
                          <HStack items="center" className="gap-1">
                            <LuCheck className="size-3 text-green-600" />
                            <span>
                              Reacted {getReactionEmoji(engagement.reactionType)}{" "}
                              {formatTimestamp(engagement.createdAt)}
                            </span>
                          </HStack>
                        ) : (
                          <HStack items="center" className="gap-1">
                            <LuClock className="size-3" />
                            <span>Pending</span>
                          </HStack>
                        )}
                      </p>
                    </Box>
                  </HStack>

                  {/* Reaction Badge */}
                  {isEngaged && <Badge variant="secondary">{engagement.reactionType}</Badge>}
                </HStack>
              </Box>
            )
          })}
        </VStack>

        {members.length === 0 && (
          <Box className="border border-dashed rounded-lg p-8 text-center">
            <LuUsers className="mx-auto size-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No members in this pod</p>
            <p className="text-sm text-muted-foreground mt-1">
              Invite members to start engaging with posts.
            </p>
          </Box>
        )}
      </VStack>
    </VStack>
  )
}
