import type React from "react"
import type { IconType } from "react-icons/lib"
import { LuEye, LuMessageCircle, LuRepeat, LuThumbsUp } from "react-icons/lu"
import { HStack, type StackProps } from "@/components/layout/stack"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import { NumberTicker } from "@/components/ui/number-ticker"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import type { Doc, Id } from "@/convex/_generated/dataModel"
import useAuthQuery from "@/hooks/use-auth-query"
import { cn } from "@/lib/utils"

export type PostStatsProps = StackProps & {
  podId: Id<"pods">
  postId: Id<"posts">
}

export const PostStats: React.FC<PostStatsProps> = ({ podId, postId, className, ...props }) => {
  const stats = useAuthQuery(api.posts.query.stats, { podId, postId })
  if (stats == null) {
    return <Skeleton className={cn("w-full h-8", className)} />
  }

  const [first, last] = stats
  if (first == null || last == null) {
    return null
  }

  return (
    <HStack className={cn("gap-3", className)} {...props}>
      <StatBadge field="reactionCount" first={first} icon={LuThumbsUp} last={last} />
      <StatBadge field="commentCount" first={first} icon={LuMessageCircle} last={last} />
      <StatBadge field="repostCount" first={first} icon={LuRepeat} last={last} />
      <StatBadge field="impressionCount" first={first} icon={LuEye} last={last} />
    </HStack>
  )
}

type StatBadgeProps = BadgeProps & {
  field: "reactionCount" | "commentCount" | "repostCount" | "impressionCount"
  first: Doc<"stats">
  last: Doc<"stats">
  icon: IconType
}

const StatBadge: React.FC<StatBadgeProps> = ({ field, first, last, icon: Icon, ...props }) =>
  last[field] !== 0 && (
    <Badge size="sm" variant="ghost" {...props}>
      <span className="inline-flex gap-0.5">
        <NumberTicker className="text-muted-foreground" value={first[field]} />
        {first._id !== last._id && (
          <>
            +<NumberTicker value={last[field] - first[field]} />
          </>
        )}
      </span>
      <Icon className="text-muted-foreground" />
    </Badge>
  )
