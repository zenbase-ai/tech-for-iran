"use client"

import { useAction } from "convex/react"
import { useRouter } from "next/navigation"
import { useEffect, useEffectEvent, useState } from "react"
import { LuNewspaper, LuRocket } from "react-icons/lu"
import { Box } from "@/components/layout/box"
import { Grid } from "@/components/layout/grid"
import { HStack, VStack } from "@/components/layout/stack"
import { PageDescription, PageTitle, SectionTitle } from "@/components/layout/text"
import { PostAttachment } from "@/components/presenters/post/attachment"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Delay } from "@/components/ui/delay"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup } from "@/components/ui/item"
import { RelativeTime } from "@/components/ui/relative-time"
import { Repeat } from "@/components/ui/repeat"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { usePodId } from "@/hooks/use-pod-id"
import { cn } from "@/lib/utils"
import type { BoostPost } from "@/schemas/boost-post"
import type { Post } from "@/schemas/unipile"
import { BoostPostForm } from "../_boost"

export default function WelcomePageClient() {
  const podId = usePodId()
  const router = useRouter()

  const [posts, setPosts] = useState<Post[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null)
  const [boostResult, setBoostResult] = useState<{ postId: Id<"posts">; url: string } | null>(null)

  const getOwnPosts = useAction(api.linkedin.action.getOwnPosts)

  useEffect(() => {
    getOwnPosts({})
      .then((result) => {
        if (result.error) {
          setError(result.error)
        } else if (result.data) {
          setPosts(result.data.items)
        }
      })
      .catch((err) => setError(err.message))
  }, [getOwnPosts])

  const handleSelectPost = useEffectEvent((post: Post) => {
    setSelectedUrl(post.share_url)
  })

  const handleBoostSuccess = useEffectEvent((postId: Id<"posts">, data: BoostPost) => {
    setBoostResult({ postId, url: data.url })
  })

  const handleViewOnLinkedIn = useEffectEvent(() => {
    if (boostResult) {
      window.open(boostResult.url, "_blank")
      router.push(`/pods/${podId}`)
    }
  })

  return (
    <VStack as="main" className={cn("w-full gap-6 md:gap-8", "items-center sm:items-start")}>
      <VStack className="gap-2">
        <PageTitle>Welcome!</PageTitle>
        <PageDescription>Pick a post to boost and watch the reactions roll in.</PageDescription>
      </VStack>

      <VStack className="w-full gap-4">
        <SectionTitle>Your recent posts</SectionTitle>

        {posts === null && !error ? (
          <Grid className="gap-3 grid-cols-1 md:grid-cols-2">
            <Repeat count={4}>
              <Skeleton className="w-full h-32" />
            </Repeat>
          </Grid>
        ) : error ? (
          <Delay timeout={500}>
            <Empty className="text-muted-foreground">
              <EmptyHeader>
                <EmptyMedia>
                  <LuNewspaper className="size-8" />
                </EmptyMedia>
                <EmptyTitle>{error}</EmptyTitle>
              </EmptyHeader>
            </Empty>
          </Delay>
        ) : posts?.length === 0 ? (
          <Delay timeout={500}>
            <Empty className="text-muted-foreground">
              <EmptyHeader>
                <EmptyMedia>
                  <LuNewspaper className="size-8" />
                </EmptyMedia>
                <EmptyTitle>No recent posts found</EmptyTitle>
              </EmptyHeader>
            </Empty>
          </Delay>
        ) : (
          <Grid className="gap-3 grid-cols-1 md:grid-cols-2">
            <ItemGroup className="contents">
              {posts?.map((post) => (
                <Item
                  className={cn(selectedUrl === post.share_url && "ring-2 ring-primary")}
                  key={post.id}
                >
                  <ItemContent className="gap-2">
                    <HStack className="gap-2" items="center" justify="between">
                      <span className="text-sm text-muted-foreground">
                        <RelativeTime date={post.parsed_datetime} />
                      </span>
                      <ItemActions>
                        <Button
                          onClick={() => handleSelectPost(post)}
                          size="sm"
                          variant={selectedUrl === post.share_url ? "default" : "outline"}
                        >
                          <LuRocket className="size-3" />
                          {selectedUrl === post.share_url ? "Selected" : "Boost this"}
                        </Button>
                      </ItemActions>
                    </HStack>
                    <ItemDescription className="line-clamp-3">{post.text}</ItemDescription>
                    {post.attachments && post.attachments.length > 0 && (
                      <HStack className="gap-2" items="center" wrap>
                        {post.attachments.slice(0, 2).map((attachment) => (
                          <Box
                            className="rounded-md overflow-hidden w-2/5 bg-muted"
                            key={attachment.id}
                          >
                            <PostAttachment attachment={attachment} />
                          </Box>
                        ))}
                      </HStack>
                    )}
                  </ItemContent>
                </Item>
              ))}
            </ItemGroup>
          </Grid>
        )}
      </VStack>

      <VStack className="w-full gap-4">
        <SectionTitle>Boost your post</SectionTitle>
        <BoostPostForm
          autoFocus={false}
          className="w-full"
          defaultValues={selectedUrl ? { url: selectedUrl } : undefined}
          onSuccess={handleBoostSuccess}
          podId={podId}
        />
      </VStack>

      <AlertDialog open={!!boostResult}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Your post is being boosted!</AlertDialogTitle>
            <AlertDialogDescription>
              Reactions are on their way. Click below to see them roll in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleViewOnLinkedIn}>View on LinkedIn</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </VStack>
  )
}
