"use client"

import type { IconBaseProps } from "react-icons/lib"
import { LuArrowRight, LuEye, LuMessageCircle, LuRepeat, LuThumbsUp } from "react-icons/lu"
import { Logo } from "@/components/assets/logo"
import { Stack, type StackProps } from "@/components/layout/stack"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import { NumberTicker } from "@/components/ui/number-ticker"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import type { Doc, Id } from "@/convex/_generated/dataModel"
import { useAuthQuery } from "@/hooks/use-auth-query"
import { cn } from "@/lib/utils"

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

  if (stats == null) {
    return <Skeleton className={cn("w-full h-8 bg-transparent", className)} />
  }

  const [first, last] = stats ?? []
  if (first == null || last == null) {
    return null
  }

  return (
    <Stack className={cn("w-full gap-6", className)} items="center" wrap {...props}>
      <PostStatBadge field="reactionCount" first={first} last={last}>
        {engagementCount} from <Logo className="gap-0.5" size="size-3" stroke="stroke-px" />
      </PostStatBadge>
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

export const PostStatBadge: React.FC<PostStatBadgeProps> = ({
  field,
  first,
  last,
  className,
  children,
  variant = "ghost",
  ...props
}) => {
  const startingValue = first[field]
  const endingValue = last[field]

  if (endingValue === 0) {
    return null
  }

  return (
    <Badge
      className={cn("text-muted-foreground", className, variant === "ghost" && "px-0")}
      size="sm"
      variant={variant}
      {...props}
    >
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
      {children}
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
