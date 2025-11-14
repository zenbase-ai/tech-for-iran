import TimeAgo, { type Props } from "react-timeago"
import { makeIntlFormatter } from "react-timeago/defaultFormatter"

const formatter = makeIntlFormatter({
  style: "short",
})

export type RelativeTimeProps = Omit<Props, "live">

export const LiveRelativeTime: React.FC<RelativeTimeProps> = (props) => (
  <TimeAgo formatter={formatter} live {...props} />
)

export const RelativeTime: React.FC<RelativeTimeProps> = (props) => (
  <TimeAgo formatter={formatter} live={false} {...props} />
)
