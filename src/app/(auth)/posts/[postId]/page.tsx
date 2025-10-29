import { RedirectToSignIn } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import { fetchQuery } from "convex/nextjs"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { PostDetail } from "./post-detail"

type Props = {
  params: Promise<{ postId: Id<"posts"> }>
}

export default async function PostPage({ params }: Props) {
  const { userId } = await auth()
  if (!userId) {
    return <RedirectToSignIn />
  }

  const { postId } = await params

  // Fetch all data in parallel
  const [post, engagements] = await Promise.all([
    fetchQuery(api.posts.get, { postId }),
    fetchQuery(api.posts.engagements, { postId }),
  ])

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <h1 className="text-2xl font-bold mb-2">Post Not Found</h1>
        <p className="text-muted-foreground">
          The post you're looking for doesn't exist or has been removed.
        </p>
      </div>
    )
  }

  // Fetch pod and members data
  const [pod, membersResponse] = await Promise.all([
    fetchQuery(api.pods.get, { podId: post.podId }),
    fetchQuery(api.pods.members, {
      podId: post.podId,
      paginationOpts: { numItems: 100, cursor: null },
    }),
  ])

  if (!pod) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <h1 className="text-2xl font-bold mb-2">Pod Not Found</h1>
        <p className="text-muted-foreground">The pod associated with this post doesn't exist.</p>
      </div>
    )
  }

  // Members already include profile data (firstName, lastName, picture, url)
  const members = membersResponse.page

  return (
    <PostDetail
      initialPost={post}
      initialEngagements={engagements}
      pod={pod}
      members={members}
      postId={postId}
      currentUserId={userId}
    />
  )
}
