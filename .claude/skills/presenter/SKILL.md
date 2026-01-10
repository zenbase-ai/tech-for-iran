# Presenter Component Skill

Create presenter components in `src/components/presenters/` that display domain entities with their own data fetching.

## What Presenters Are

Presenters are **smart display components** that:
- Fetch their own data via `useQuery` hooks (or `useAuthQuery` for signed users)
- Handle loading states with `<Skeleton>`
- Handle empty/null states gracefully
- Compose UI primitives and other presenters
- Are organized by domain (signatory, commitment, stats, upvote)

## Directory Structure

```
src/components/presenters/
├── signatory/         # Signatory-related presenters
│   ├── card.tsx
│   ├── avatar.tsx
│   └── referral-count.tsx
├── commitment/        # Commitment wall presenters
│   ├── card.tsx
│   ├── wall.tsx
│   └── empty.tsx
├── stats/             # Aggregate stats presenters
│   ├── total-signatories.tsx
│   ├── pledged-capital.tsx
│   └── jobs-committed.tsx
└── upvote/            # Upvote-related presenters
    ├── button.tsx
    └── count.tsx
```

## Naming Conventions

- **File**: `[entity].tsx` or `[entity]-[variant].tsx` (kebab-case)
- **Component**: `[Entity][Variant]` (PascalCase) - e.g., `SignatoryCard`, `CommitmentWall`, `UpvoteButton`
- **Props Type**: `[ComponentName]Props` - always exported

## Component Template

```typescript
"use client"  // Only if using hooks

import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import type { Doc, Id } from "@/convex/_generated/dataModel"
import { useQuery } from "convex/react"
import { cn } from "@/lib/utils"

export type EntityPresenterProps = {
  entityId: Id<"entities">
  className?: string
}

export const EntityPresenter: React.FC<EntityPresenterProps> = ({
  entityId,
  className,
}) => {
  const data = useQuery(api.entities.query.get, { entityId })

  // Loading state
  if (data == null) {
    return <Skeleton className={cn("w-full h-8", className)} />
  }

  // Empty state (optional)
  if (!data.someField) {
    return null
  }

  return (
    <div className={className}>
      {/* Render data */}
    </div>
  )
}
```

## Props Patterns

### Extending Base Props
```typescript
import { type BadgeProps } from "@/components/ui/badge"
import { type StackProps } from "@/components/layout/stack"

// Extend layout/UI component props
export type MyPresenterProps = StackProps & {
  entityId: Id<"entities">
}

// Or omit certain props
export type MyBadgeProps = Omit<BadgeProps, "children" | "variant"> & {
  value: number
}
```

### Pick Pattern for Entity Data
```typescript
// Use Pick to specify exactly which fields are needed
export type SignatoryCardProps = {
  signatory: Pick<Doc<"signatories">, "name" | "title" | "company" | "commitmentText" | "upvoteCount">
}

// For optional fields from DB
export type CommitmentCardProps = {
  signatory: { _id?: Id<"signatories"> } & Omit<Doc<"signatories">, "_id" | "_creationTime">
}
```

## Loading State Pattern

Always show `<Skeleton>` while data is loading:

```typescript
const data = useQuery(api.signatories.get, { signatoryId })

if (data == null) {
  return <Skeleton className={cn("w-full h-8", className)} />
}
```

## Conditional Data Fetching

Use `"skip"` to conditionally skip queries:

```typescript
const referralCount = useQuery(
  api.signatories.getReferralCount,
  signatoryId ? { signatoryId } : "skip"
)
```

## Composition

Presenters compose other presenters and UI primitives:

```typescript
import { SignatoryAvatar } from "@/components/presenters/signatory/avatar"
import { UpvoteButton } from "@/components/presenters/upvote/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"

export const CommitmentCard: React.FC<CommitmentCardProps> = ({ signatory }) => (
  <Card>
    <CardContent>
      <SignatoryAvatar signatory={signatory} />
      <p className="text-lg">{signatory.commitmentText}</p>
    </CardContent>
    <CardFooter>
      <UpvoteButton signatoryId={signatory._id} />
    </CardFooter>
  </Card>
)
```

## When to Use Presenters vs UI Components

| Presenters (`/presenters/`)           | UI Components (`/ui/`)           |
|---------------------------------------|----------------------------------|
| Fetch their own data                  | Receive all data via props       |
| Domain-specific (Signatory, Upvote)   | Generic (Button, Badge, Card)    |
| May have loading/empty states         | Always render with given props   |
| Import from `@/convex/`               | No Convex imports                |

## Common Imports

```typescript
// Data fetching
import { api } from "@/convex/_generated/api"
import type { Doc, Id } from "@/convex/_generated/dataModel"
import { useQuery } from "convex/react"
import { useAuthQuery } from "@/hooks/use-auth-query" // For signed-user-only queries

// UI primitives
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { NumberTicker } from "@/components/ui/number-ticker"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

// Layout
import { HStack, VStack, Stack } from "@/components/layout/stack"
import { Box } from "@/components/layout/box"

// Utilities
import { cn } from "@/lib/utils"
```

## Examples

### Simple Presenter (no data fetching)
```typescript
// signatory/avatar.tsx
export type SignatoryAvatarProps = {
  signatory: { name: string }
  className?: string
}

export const SignatoryAvatar: React.FC<SignatoryAvatarProps> = ({ signatory, className }) => (
  <Avatar className={cn("size-9", className)}>
    <AvatarFallback>{initials(signatory.name)}</AvatarFallback>
  </Avatar>
)

const initials = (name: string) =>
  name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
```

### Signatory Card Presenter
```typescript
// signatory/card.tsx
"use client"

export type SignatoryCardProps = {
  signatory: Pick<
    Doc<"signatories">,
    "_id" | "name" | "title" | "company" | "commitmentText" | "whySigned" | "pinned" | "upvoteCount" | "_creationTime"
  >
  className?: string
}

export const SignatoryCard: React.FC<SignatoryCardProps> = ({ signatory, className }) => {
  const timeAgo = useTimeAgo(signatory._creationTime)

  return (
    <Card className={cn("relative", className)}>
      {signatory.pinned && (
        <Badge variant="secondary" className="absolute top-2 right-2">
          Pinned
        </Badge>
      )}
      <CardHeader>
        <h3 className="font-semibold">{signatory.name}</h3>
        <p className="text-muted-foreground text-sm">
          {signatory.title}, {signatory.company}
        </p>
      </CardHeader>
      <CardContent>
        {signatory.commitmentText ? (
          <blockquote className="border-l-2 pl-4 italic">
            "{signatory.commitmentText}"
          </blockquote>
        ) : (
          <p className="text-muted-foreground">Signed the letter.</p>
        )}
      </CardContent>
      <CardFooter className="justify-between">
        <UpvoteButton signatoryId={signatory._id} count={signatory.upvoteCount} />
        <span className="text-muted-foreground text-sm">{timeAgo}</span>
      </CardFooter>
    </Card>
  )
}
```

### Upvote Button Presenter (with sign-to-upvote logic)
```typescript
// upvote/button.tsx
"use client"

export type UpvoteButtonProps = {
  signatoryId: Id<"signatories">
  count: number
  className?: string
}

export const UpvoteButton: React.FC<UpvoteButtonProps> = ({
  signatoryId,
  count,
  className,
}) => {
  const currentUser = useAuthQuery(api.signatories.current, {})
  const hasUpvoted = useAuthQuery(
    api.upvotes.hasUpvoted,
    currentUser ? { signatoryId } : "skip"
  )
  const upvote = useAsyncFn(useMutation(api.upvotes.create))

  const handleUpvote = useEffectEvent(async () => {
    if (!currentUser) {
      // Show sign-to-upvote tooltip/modal
      toast.info("Sign the letter to upvote commitments")
      return
    }
    await upvote.execute({ signatoryId })
  })

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("gap-1", hasUpvoted && "text-primary", className)}
      onClick={handleUpvote}
      disabled={upvote.pending || hasUpvoted}
    >
      <ArrowUpIcon className="size-4" />
      <NumberTicker value={count} />
    </Button>
  )
}
```

### Referral Count Presenter
```typescript
// signatory/referral-count.tsx
"use client"

export type ReferralCountProps = {
  signatoryId: Id<"signatories">
  signatoryName: string
  className?: string
}

export const ReferralCount: React.FC<ReferralCountProps> = ({
  signatoryId,
  signatoryName,
  className,
}) => {
  const count = useQuery(api.signatories.getReferralCount, { signatoryId })

  if (count == null) {
    return <Skeleton className={cn("h-6 w-48", className)} />
  }

  if (count === 0) {
    return null
  }

  const firstName = signatoryName.split(" ")[0]

  return (
    <p className={cn("text-muted-foreground", className)}>
      {firstName} has inspired <NumberTicker value={count} /> {count === 1 ? "other" : "others"} to sign the letter.
    </p>
  )
}
```

### Commitment Wall Presenter
```typescript
// commitment/wall.tsx
"use client"

export type CommitmentWallProps = {
  sort?: "upvotes" | "recent"
  className?: string
}

export const CommitmentWall: React.FC<CommitmentWallProps> = ({
  sort = "upvotes",
  className,
}) => {
  const { results, status, loadMore } = usePaginatedQuery(
    api.signatories.list,
    { sort },
    { initialNumItems: 20 }
  )

  if (results == null) {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    )
  }

  if (results.length === 0) {
    return <CommitmentWallEmpty />
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map(signatory => (
          <SignatoryCard key={signatory._id} signatory={signatory} />
        ))}
      </div>
      {status === "CanLoadMore" && (
        <Button variant="outline" onClick={() => loadMore(10)} className="mt-6 mx-auto block">
          Load more
        </Button>
      )}
    </div>
  )
}
```

### Aggregate Stats Presenter
```typescript
// stats/total-signatories.tsx
"use client"

export type TotalSignatoriesProps = {
  className?: string
}

export const TotalSignatories: React.FC<TotalSignatoriesProps> = ({ className }) => {
  const count = useQuery(api.stats.totalSignatories, {})

  if (count == null) {
    return <Skeleton className={cn("h-8 w-20", className)} />
  }

  return (
    <span className={className}>
      <NumberTicker value={count} /> founders
    </span>
  )
}
```

### Stats Header (composition example)
```typescript
// stats/header.tsx
"use client"

export type StatsHeaderProps = {
  className?: string
}

export const StatsHeader: React.FC<StatsHeaderProps> = ({ className }) => {
  const stats = useQuery(api.stats.aggregate, {})

  if (stats == null) {
    return <Skeleton className={cn("h-6 w-96", className)} />
  }

  return (
    <p className={cn("text-muted-foreground", className)}>
      <NumberTicker value={stats.signatoryCount} /> founders have pledged{" "}
      {stats.pledgedCapital && (
        <>
          <NumberTicker value={stats.pledgedCapital} prefix="$" /> and{" "}
        </>
      )}
      {stats.jobsCommitted && (
        <>
          <NumberTicker value={stats.jobsCommitted} /> jobs
        </>
      )}
      .
    </p>
  )
}
```
