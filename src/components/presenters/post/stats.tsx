"use client"

import type React from "react"
import type { IconBaseProps } from "react-icons/lib"
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
    return <Skeleton className={cn("w-full h-14", className)} />
  }

  const [first, last] = stats
  if (first == null || last == null) {
    return null
  }

  return (
    <HStack className={cn("gap-3", className)} items="center" wrap {...props}>
      <StatBadge field="reactionCount" first={first} last={last} />
      <StatBadge field="commentCount" first={first} last={last} />
      <StatBadge field="repostCount" first={first} last={last} />
      <StatBadge field="impressionCount" first={first} last={last} />
    </HStack>
  )
}

type StatBadgeProps = BadgeProps & {
  field: "reactionCount" | "commentCount" | "repostCount" | "impressionCount"
  first: Doc<"stats">
  last: Doc<"stats">
}

const StatBadge: React.FC<StatBadgeProps> = ({ field, first, last, ...props }) =>
  last[field] === 0 ? null : (
    <Badge size="sm" variant="ghost" {...props}>
      <span className="inline-flex gap-0.5">
        <NumberTicker className="text-muted-foreground" value={first[field]} />
        {first._id !== last._id && (
          <>
            +<NumberTicker value={last[field] - first[field]} />
          </>
        )}
      </span>
      <StatBadgeIcon className="text-muted-foreground" field={field} />
    </Badge>
  )

type StatBadgeIcon = IconBaseProps & Pick<StatBadgeProps, "field">

const StatBadgeIcon: React.FC<StatBadgeIcon> = ({ field, ...props }) => {
  switch (field) {
    case "reactionCount":
      return <LuThumbsUp {...props} />
    case "commentCount":
      return <LuMessageCircle {...props} />
    case "repostCount":
      return <LuRepeat {...props} />
    case "impressionCount":
      return <LuEye {...props} />
  }
}
