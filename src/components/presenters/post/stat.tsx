import type { IconBaseProps } from "react-icons/lib"
import { LuEye, LuMessageCircle, LuRepeat, LuThumbsUp } from "react-icons/lu"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import { NumberTicker } from "@/components/ui/number-ticker"
import type { Doc } from "@/convex/_generated/dataModel"

export type PostStatProps = BadgeProps & {
  field: "reactionCount" | "commentCount" | "repostCount" | "impressionCount"
  first: Doc<"stats">
  last: Doc<"stats">
}

export const PostStat: React.FC<PostStatProps> = ({ field, first, last, ...props }) =>
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

export type PostStatIcon = IconBaseProps & Pick<PostStatProps, "field">

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
