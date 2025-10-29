"use client"

import { useAuth } from "@clerk/nextjs"
import { usePaginatedQuery, useQuery } from "convex/react"
import { notFound, useParams } from "next/navigation"
import { LuExternalLink, LuUsers } from "react-icons/lu"
import { Box } from "@/components/layout/box"
import { HStack, VStack } from "@/components/layout/stack"
import { Loading } from "@/components/ui/loading"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { PodMembers } from "./pod-members"
import { SubmitPostForm } from "./submit-post-form"

export default function PodPage() {
  const auth = useAuth()
  const params = useParams()
  const podId = params.podId as Id<"pods">

  // Fetch pod data and stats
  const pod = useQuery(api.pods.get, { podId })
  const stats = useQuery(api.pods.stats, { podId })
  const recentPosts = usePaginatedQuery(api.pods.posts, { podId }, { initialNumItems: 10 })

  // Show loading state while user or initial data is loading
  if (!auth.isLoaded || pod === undefined || stats === undefined || recentPosts.isLoading) {
    return <Loading />
  }

  // Show 404 if pod doesn't exist
  if (!pod) {
    return notFound()
  }

  return (
    <VStack className="gap-8 max-w-4xl mx-auto">
      {/* Pod Header */}
      <Box>
        <h1 className="text-3xl font-bold mb-2 font-serif italic">{pod.name}</h1>
        <HStack className="gap-6 text-sm text-muted-foreground">
          <HStack items="center" className="gap-1">
            <LuUsers className="size-4" />
            <span>
              {stats.memberCount} {stats.memberCount === 1 ? "member" : "members"}
            </span>
          </HStack>
          <span>{stats.postCount} posts submitted</span>
        </HStack>
      </Box>

      {/* Members Section */}
      <VStack className="gap-3">
        <h2 className="text-xl font-semibold">Members</h2>
        <PodMembers podId={podId} />
      </VStack>

      {/* Post Submission Section */}
      <VStack className="gap-3">
        <h2 className="text-xl font-semibold">Submit Post</h2>
        <SubmitPostForm podId={podId} />
      </VStack>

      {/* Recent Posts */}
      {recentPosts.results.length > 0 && (
        <VStack className="gap-3">
          <h2 className="text-xl font-semibold">Recent Posts</h2>
          <VStack className="gap-2">
            {recentPosts.results.map((post) => (
              <Box
                key={post._id}
                className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
              >
                <HStack items="center" justify="between">
                  <Box>
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      LinkedIn Post
                      <LuExternalLink className="size-3" />
                    </a>
                    <p className="text-sm text-muted-foreground mt-1">
                      Submitted {new Date(post.submittedAt).toLocaleDateString()} •{" "}
                      {post.engagements.length} engagement{post.engagements.length !== 1 ? "s" : ""}
                    </p>
                  </Box>
                </HStack>
              </Box>
            ))}
          </VStack>
        </VStack>
      )}
    </VStack>
  )
}
