import { Column, Link, Row, Section, Text } from "@react-email/components"
import { RelativeTime } from "@/components/ui/relative-time"
import type { Doc } from "@/convex/_generated/dataModel"
import useTruncated from "@/hooks/use-truncated"
import pluralize from "@/lib/pluralize"
import EmailLayout from "./layout"

export type PostEngagementEmailProps = {
  post: Doc<"posts">
  t1: Doc<"stats">
  t2: Doc<"stats">
  previewCharacters?: number
}

export default function PostEngagementEmail({
  post = {
    _id: "post1" as any,
    _creationTime: Date.now(),
    userId: "user1",
    podId: "pod1" as any,
    url: "https://linkedin.com/feed/update/...",
    urn: "urn:li:activity:123",
    text: "Just launched our new AI features! 🚀 Really excited to share what we've been working on for the past few months. Our team has been pushing the boundaries of what's possible with machine learning and natural language processing. Can't wait to see how this transforms the way our users interact with the platform. Big shoutout to the entire engineering team for making this happen! #AI #Tech #Innovation #MachineLearning #ProductLaunch",
    author: {
      name: "John Doe",
      headline: "Founder @ Crackedbook",
    },
    postedAt: Date.now() - 3_600_000,
    updatedAt: Date.now(),
    status: "success",
  },
  t1 = {
    _id: "stats1" as any,
    _creationTime: Date.now() - 3_600_000,
    userId: "user1",
    postId: "post1" as any,
    commentCount: 5,
    impressionCount: 100,
    reactionCount: 10,
    repostCount: 1,
  },
  t2 = {
    _id: "stats2" as any,
    _creationTime: Date.now(),
    userId: "user1",
    postId: "post1" as any,
    commentCount: 15,
    impressionCount: 500,
    reactionCount: 45,
    repostCount: 3,
  },
  previewCharacters = 180,
}: PostEngagementEmailProps) {
  const growth = {
    impressionCount: t2.impressionCount - t1.impressionCount,
    reactionCount: t2.reactionCount - t1.reactionCount,
    commentCount: t2.commentCount - t1.commentCount,
    repostCount: t2.repostCount - t1.repostCount,
  }
  const preview = Object.entries(growth)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => `+${pluralize(value, key)}`)
    .join(", ")

  const [isTruncated, truncatedText] = useTruncated(post.text, {
    length: previewCharacters,
    overflow: "",
  })

  return (
    <EmailLayout preview={preview}>
      {/* Post Preview */}
      <Section className="p-4 rounded-md border border-border">
        <Link href={post.url}>
          <Text className="m-0 text-lg font-bold text-foreground">{post.author.name}</Text>
          <Text className="m-0 text-sm text-muted-foreground">
            {post.author.headline}
            <br />
            <RelativeTime date={post.postedAt} />
          </Text>
        </Link>

        <Text className="m-0 text-[16px] mt-2 leading-[26px]">{truncatedText}</Text>
        {isTruncated && (
          <Link className="m-0 text-base text-muted-foreground" href={post.url}>
            ... more
          </Link>
        )}
      </Section>

      {/* Stats Grid */}
      <Section className="my-8">
        <Row>
          <StatCard
            growth={growth.impressionCount}
            label="Impressions"
            value={t2.impressionCount}
          />
          <StatCard growth={growth.reactionCount} label="Reactions" value={t2.reactionCount} />
        </Row>
        <Row>
          <StatCard growth={growth.commentCount} label="Comments" value={t2.commentCount} />
          <StatCard growth={growth.repostCount} label="Reposts" value={t2.repostCount} />
        </Row>
      </Section>
    </EmailLayout>
  )
}

type StatCardProps = {
  label: string
  value: number
  growth: number
}

const StatCard: React.FC<StatCardProps> = ({ label, value, growth }) => (
  <Column className="w-1/2">
    <div className="rounded-lg bg-card p-4 text-center">
      <Text className="m-0 text-muted-foreground font-medium">{label}</Text>
      <Text className="m-0 text-3xl font-bold text-foreground">{value.toLocaleString()}</Text>
      {growth > 0 && (
        <Text className="m-0 mt-1 text-lg font-medium text-primary">
          +{growth.toLocaleString()}
        </Text>
      )}
    </div>
  </Column>
)
