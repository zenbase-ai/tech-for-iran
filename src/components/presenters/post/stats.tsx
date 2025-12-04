"use client"

import type { IconBaseProps } from "react-icons/lib"
import { LuEye, LuMessageCircle, LuRepeat, LuThumbsUp } from "react-icons/lu"
import { Stack, type StackProps } from "@/components/layout/stack"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import { NumberTicker } from "@/components/ui/number-ticker"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { api } from "@/convex/_generated/api"
import type { Doc, Id } from "@/convex/_generated/dataModel"
import useAuthQuery from "@/hooks/use-auth-query"
import { cn, pluralize } from "@/lib/utils"

export type PostStatsStackProps = StackProps & {
  podId: Id<"pods">
  postId: Id<"posts">
}

export const PostStatsStack: React.FC<PostStatsStackProps> = ({
  podId,
  postId,
  className,
  ...props
}) => {
  const stats = useAuthQuery(api.posts.query.stats, { podId, postId })
  const engagementCount = useAuthQuery(api.posts.query.engagementCount, { podId, postId })

  if (stats == null) {
    return <Skeleton className={cn("w-full h-14", className)} />
  }

  const [first, last] = stats
  if (first == null || last == null) {
    return null
  }

  return (
    <Stack className={cn("gap-1", className)} items="center" wrap {...props}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PostStatBadge field="reactionCount" first={first} last={last} />
        </TooltipTrigger>
        <TooltipContent>{pluralize(engagementCount ?? 0, "engagement")} Crackedbook</TooltipContent>
      </Tooltip>
      <PostStatBadge field="commentCount" first={first} last={last} />
      <PostStatBadge field="repostCount" first={first} last={last} />
      <PostStatBadge field="impressionCount" first={first} last={last} />
    </Stack>
  )
}

export type PostStatBadgeProps = BadgeProps & {
  field: "reactionCount" | "commentCount" | "repostCount" | "impressionCount"
  first: Doc<"stats">
  last: Doc<"stats">
}

export const PostStatBadge: React.FC<PostStatBadgeProps> = ({ field, first, last, ...props }) =>
  last[field] === 0 ? null : (
    <Badge size="sm" variant="ghost" {...props}>
      <span className="inline-flex gap-0.5">
        <span className="text-muted-foreground">{first[field]}</span>
        {first._id !== last._id && (
          <>
            +<NumberTicker value={last[field] - first[field]} />
          </>
        )}
      </span>
      <PostStatIcon className="text-muted-foreground" field={field} />
    </Badge>
  )

export type PostStatIcon = IconBaseProps & Pick<PostStatBadgeProps, "field">

export const PostStatIcon: React.FC<PostStatIcon> = ({ field, ...props }) => {
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
