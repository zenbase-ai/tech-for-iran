"use client"

import type { IconBaseProps } from "react-icons/lib"
import { LuArrowRight, LuEye, LuMessageCircle, LuRepeat, LuThumbsUp } from "react-icons/lu"
import { Stack, type StackProps } from "@/components/layout/stack"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import { NumberTicker } from "@/components/ui/number-ticker"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { api } from "@/convex/_generated/api"
import type { Doc, Id } from "@/convex/_generated/dataModel"
import { useAuthQuery } from "@/hooks/use-auth-query"
import useScreenSize from "@/hooks/use-screen-size"
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
  const { stats, engagementCount } = useAuthQuery(api.posts.query.stats, { podId, postId }) ?? {}
  const sm = useScreenSize("sm")

  if (stats == null) {
    return <Skeleton className={cn("w-full h-8 bg-transparent", className)} />
  }

  const [first, last] = stats ?? []
  if (first == null || last == null) {
    return null
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Stack className={cn("w-fit gap-1", className)} items="center" wrap {...props}>
          <PostStatBadge field="reactionCount" first={first} last={last} />
          <PostStatBadge field="commentCount" first={first} last={last} />
          <PostStatBadge field="repostCount" first={first} last={last} />
          <PostStatBadge field="impressionCount" first={first} last={last} />
        </Stack>
      </TooltipTrigger>
      <TooltipContent arrow={false} side={sm ? "right" : "bottom"}>
        {pluralize(engagementCount ?? 0, "engagement")} from Crackedbook
      </TooltipContent>
    </Tooltip>
  )
}

export type PostStatBadgeProps = BadgeProps & {
  field: "reactionCount" | "commentCount" | "repostCount" | "impressionCount"
  first: Doc<"stats">
  last: Doc<"stats">
}

export const PostStatBadge: React.FC<PostStatBadgeProps> = ({
  field,
  first,
  last,
  className,
  ...props
}) => {
  const startingValue = first[field]
  const endingValue = last[field]

  if (endingValue === 0) {
    return null
  }

  return (
    <Badge className={cn("text-muted-foreground", className)} size="sm" variant="ghost" {...props}>
      <span className="inline-flex gap-0.5 items-center">
        {startingValue !== endingValue && (
          <>
            {startingValue}
            <LuArrowRight className="size-3" />
          </>
        )}
        <NumberTicker className="text-foreground" value={endingValue} />
      </span>
      <PostStatIcon className="text-foreground" field={field} />
    </Badge>
  )
}

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
