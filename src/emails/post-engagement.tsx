import { Column, Heading, Img, Link, Row, Section, Text } from "@react-email/components"
import type { Doc } from "@/convex/_generated/dataModel"
import { env } from "@/lib/env.mjs"
import pluralize from "@/lib/pluralize"
import EmailLayout from "./layout"

export type PostEngagementEmailProps = {
  post: Doc<"posts">
  t1: Doc<"stats">
  t2: Doc<"stats">
}

export default function PostEngagementEmail({
  post = {
    _id: "post1" as any,
    _creationTime: Date.now(),
    userId: "user1",
    podId: "pod1" as any,
    url: "https://linkedin.com/feed/update/...",
    urn: "urn:li:activity:123",
    text: "Just launched our new AI features! 🚀 #AI #Tech",
    author: {
      name: "John Doe",
      headline: "Founder @ Crackedbook",
    },
    postedAt: Date.now(),
    updatedAt: Date.now(),
    status: "success",
  },
  t1 = {
    _id: "stats1" as any,
    _creationTime: Date.now(),
    userId: "user1",
    postId: "post1" as any,
    commentCount: 5,
    impressionCount: 100,
    reactionCount: 10,
    repostCount: 1,
  },
  t2 = {
    _id: "stats2" as any,
    _creationTime: Date.now() + 3_600_000,
    userId: "user1",
    postId: "post1" as any,
    commentCount: 15,
    impressionCount: 500,
    reactionCount: 45,
    repostCount: 3,
  },
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

  return (
    <EmailLayout preview={preview}>
      {/* Header */}
      <Section className="mt-[20px]">
        <Row>
          <Column align="center">
            <Img
              alt="Crackedbook"
              className="rounded-lg"
              height="48"
              src={`${env.NEXT_PUBLIC_APP_URL}/web-app-manifest-192x192.png`}
              width="48"
            />
          </Column>
        </Row>
      </Section>

      <Heading className="mx-0 my-[30px] p-0 text-center text-[24px] font-bold font-serif italic text-foreground">
        Crackedbook
      </Heading>

      <Text className="text-[16px] leading-[24px] text-foreground text-center mb-8">
        Your post stats are in. Here's how it performed.
      </Text>

      {/* Post Preview */}
      <Section className="mx-2 p-4 rounded-md border border-border">
        <Row>
          <Column className="text-sm text-muted-foreground">
            {post.author.name} on {new Date(post.postedAt).toLocaleDateString()}
          </Column>
          <Column className="text-sm text-right">
            <Link className="m-0 font-serif text-primary italic" href={post.url}>
              View on LinkedIn
            </Link>
          </Column>
        </Row>
        <Text className="m-0 mt-2 line-clamp-3">
          {post.text.length > 200 ? `${post.text.slice(0, 200)}...` : post.text}
        </Text>
      </Section>

      {/* Stats Grid */}
      <Section className="my-[20px]">
        <Row>
          <StatCard
            growth={growth.impressionCount}
            label="Impressions"
            value={t2.impressionCount}
          />
          <StatCard growth={growth.reactionCount} label="Reactions" value={t2.reactionCount} />
        </Row>
        <Row className="mt-2">
          <StatCard growth={growth.commentCount} label="Comments" value={t2.commentCount} />
          <StatCard growth={growth.repostCount} label="Reposts" value={t2.repostCount} />
        </Row>
      </Section>

      <Text className="text-sm text-muted-foreground text-center">
        Powered by{" "}
        <Link className="text-foreground font-medium" href={env.NEXT_PUBLIC_APP_URL}>
          Crackedbook
        </Link>
      </Text>
    </EmailLayout>
  )
}

type StatCardProps = {
  label: string
  value: number
  growth: number
}

const StatCard: React.FC<StatCardProps> = ({ label, value, growth }) => (
  <Column className="w-1/2 p-2">
    <div className="rounded-lg border border-border bg-card p-4 text-center">
      <Text className="m-0 text-lg text-muted-foreground font-serif italic font-medium">
        {label}
      </Text>
      <Text className="m-0 text-3xl font-bold text-foreground">{value.toLocaleString()}</Text>
      {growth > 0 && (
        <Text className="m-0 mt-1 text-lg font-medium text-primary">
          +{growth.toLocaleString()}
        </Text>
      )}
    </div>
  </Column>
)
