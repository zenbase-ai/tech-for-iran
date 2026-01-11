# Presenter Component Skill

Create presenter components in `src/components/presenters/` that display domain entities with their own data fetching.

## What Presenters Are

Presenters are **smart display components** that:
- Fetch their own data via `useQuery` hooks
- Handle loading states with `<Skeleton>`
- Handle empty/null states gracefully
- Compose UI primitives and other presenters
- Are organized by domain (signature, upvote, etc.)

## Directory Structure

```
src/components/presenters/
├── manifesto.mdx          # MDX content for manifesto section
└── signature/             # Signature-related presenters
    ├── form.tsx           # Sign letter form with progressive disclosure
    ├── item.tsx           # Single signature display (letter format)
    ├── upvote.tsx         # Upvote button with count
    └── wall.tsx           # Paginated grid of signatures
```

## Naming Conventions

- **File**: `[entity].tsx` or `[entity]-[variant].tsx` (kebab-case)
- **Component**: `[Entity][Variant]` (PascalCase) - e.g., `SignatureItem`, `SignatureWall`, `UpvoteButton`
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

## Sub-Component Pattern

Define private sub-components within the same file using explicit type definitions:

```typescript
// Private sub-component for letter field styling
const LetterField: React.FC<React.PropsWithChildren> = ({ children }) => (
  <span className="border-b font-medium text-foreground">{children}</span>
)

// Main component uses it
export const SignatureItem: React.FC<SignatureCardProps> = ({ signature }) => (
  <Item variant="outline">
    <ItemContent>
      I, <LetterField>{signature.name}</LetterField>, ...
    </ItemContent>
  </Item>
)
```

## Skeleton Pattern

Always provide a skeleton component alongside presenters:

```typescript
export const SignatureItem: React.FC<SignatureCardProps> = ({ signature }) => (
  // ... main component
)

export const SignatureItemSkeleton: React.FC = () => (
  <Item className="h-full" variant="outline">
    <ItemContent className="pt-6 flex-1 space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-3/5" />
    </ItemContent>
    <ItemFooter className="justify-between">
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-4 w-12" />
    </ItemFooter>
  </Item>
)
```

## Props Patterns

### Using Doc Type Directly
```typescript
export type SignatureCardProps = {
  signature: Doc<"signatures">
}

export const SignatureItem: React.FC<SignatureCardProps> = ({ signature }) => {
  // Full access to all Doc fields
}
```

### Extending Layout Props
```typescript
import { type BoxProps } from "@/components/layout/box"

export type SignatureWallProps = BoxProps & {
  gridClassName?: string
}

export const SignatureWall: React.FC<SignatureWallProps> = ({ gridClassName, ...props }) => (
  <Box {...props}>
    {/* ... */}
  </Box>
)
```

## Loading State Pattern

Always show `<Skeleton>` while data is loading:

```typescript
const data = useQuery(api.signatures.query.get, { signatureId })

if (data == null) {
  return <Skeleton className={cn("w-full h-8", className)} />
}
```

## Conditional Data Fetching

Use `"skip"` to conditionally skip queries:

```typescript
const voterId = getVoterId()
const hasUpvoted = useQuery(
  api.upvotes.query.hasUpvoted,
  voterId ? { signatureId, voterId } : "skip"
) ?? false
```

## Examples

### Signature Item (Letter Format)
```typescript
// signature/item.tsx
"use client"

import { HStack } from "@/components/layout/stack"
import { UpvoteButton } from "@/components/presenters/signature/upvote"
import { Button } from "@/components/ui/button"
import { Item, ItemContent, ItemDescription, ItemFooter } from "@/components/ui/item"
import { RelativeTime } from "@/components/ui/relative-time"
import type { Doc } from "@/convex/_generated/dataModel"
import { xProfileURL } from "@/lib/utils"

export type SignatureCardProps = {
  signature: Doc<"signatures">
}

const LetterField: React.FC<React.PropsWithChildren> = ({ children }) => (
  <span className="border-b font-medium text-foreground">{children}</span>
)

export const SignatureItem: React.FC<SignatureCardProps> = ({ signature }) => (
  <Item className="bg-background" variant="outline">
    <ItemContent>
      <ItemDescription className="leading-relaxed text-base line-clamp-none">
        I, <LetterField>{signature.name}</LetterField>, <LetterField>{signature.title}</LetterField>{" "}
        at <LetterField>{signature.company}</LetterField>, sign this letter
        {signature.because && (
          <>
            {" "}
            because <LetterField>{signature.because}</LetterField>
          </>
        )}
        .
        {signature.commitment && (
          <>
            {" "}
            In the first 100 days of a free Iran, I commit to{" "}
            <LetterField>{signature.commitment}</LetterField>.
          </>
        )}
      </ItemDescription>
    </ItemContent>

    <ItemFooter className="justify-between">
      <HStack className="gap-3 text-muted-foreground text-sm" items="center">
        <Button asChild variant="outline">
          <a href={xProfileURL(signature.xUsername)} rel="noopener noreferrer" target="_blank">
            @{signature.xUsername}
          </a>
        </Button>
        <RelativeTime date={signature._creationTime} />
      </HStack>
      <UpvoteButton signatureId={signature._id} />
    </ItemFooter>
  </Item>
)
```

### Upvote Button
```typescript
// signature/upvote.tsx
"use client"

import { useMutation, useQuery } from "convex/react"
import { useEffectEvent } from "react"
import { LuThumbsUp } from "react-icons/lu"
import { Button } from "@/components/ui/button"
import { NumberTicker } from "@/components/ui/number-ticker"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { cn } from "@/lib/utils"

export type UpvoteButtonProps = {
  signatureId: Id<"signatures">
  className?: string
}

export const UpvoteButton: React.FC<UpvoteButtonProps> = ({ signatureId, className }) => {
  const signature = useQuery(api.signatures.query.get, { signatureId })

  const voterId = getVoterId()
  const hasUpvoted =
    useQuery(api.upvotes.query.hasUpvoted, voterId ? { signatureId, voterId } : "skip") ?? false

  const toggle = useMutation(api.upvotes.mutate.toggle)

  const handleClick = useEffectEvent(async () => {
    if (!voterId) return
    await toggle({ signatureId, voterId })
  })

  return (
    <Button
      className={cn("gap-1", hasUpvoted && "text-primary", className)}
      disabled={!voterId}
      onClick={handleClick}
      size="sm"
      variant="ghost"
    >
      <LuThumbsUp
        className={cn("transition-colors", hasUpvoted && "fill-current stroke-current")}
      />
      <NumberTicker value={signature?.upvoteCount ?? 0} />
    </Button>
  )
}
```

### Signature Wall with Infinite Scroll
```typescript
// signature/wall.tsx
"use client"

import { usePaginatedQuery } from "convex/react"
import { Box, type BoxProps } from "@/components/layout/box"
import { Grid } from "@/components/layout/grid"
import { SignatureItem, SignatureItemSkeleton } from "@/components/presenters/signature/item"
import { Repeat } from "@/components/ui/repeat"
import { api } from "@/convex/_generated/api"
import useInfiniteScroll from "@/hooks/use-infinite-scroll"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 20

export type SignatureWallProps = BoxProps & {
  gridClassName?: string
}

export const SignatureWall: React.FC<SignatureWallProps> = ({ gridClassName, ...props }) => {
  const { results, status, loadMore, isLoading } = usePaginatedQuery(
    api.signatures.query.list,
    { sort: "upvotes" },
    { initialNumItems: PAGE_SIZE }
  )

  const pinned = results.filter((s) => s.pinned)
  const regular = results.filter((s) => !s.pinned)

  const isLoadingInitial = isLoading && results.length === 0
  const canLoadMore = status === "CanLoadMore"

  const { ref: sentinelRef } = useInfiniteScroll({
    threshold: 0.5,
    loadMore: () => canLoadMore && loadMore(PAGE_SIZE),
  })

  const gridcn = cn("w-full gap-6", gridClassName)

  return (
    <Box {...props}>
      {isLoadingInitial && (
        <Grid className={gridcn}>
          <Repeat count={12}>
            <SignatureItemSkeleton />
          </Repeat>
        </Grid>
      )}

      {pinned.length > 0 && (
        <Grid className={gridcn}>
          {pinned.map((signature) => (
            <SignatureItem key={signature._id} signature={signature} />
          ))}
        </Grid>
      )}

      {regular.length > 0 && (
        <Grid className={gridcn}>
          {regular.map((signature) => (
            <SignatureItem key={signature._id} signature={signature} />
          ))}
        </Grid>
      )}

      {/* Sentinel element for infinite scroll */}
      <div className="h-1" ref={sentinelRef} />
    </Box>
  )
}
```

## When to Use Presenters vs UI Components

| Presenters (`/presenters/`)           | UI Components (`/ui/`)           |
|---------------------------------------|----------------------------------|
| Fetch their own data                  | Receive all data via props       |
| Domain-specific (Signature, Upvote)   | Generic (Button, Badge, Item)    |
| May have loading/empty states         | Always render with given props   |
| Import from `@/convex/`               | No Convex imports                |

## Common Imports

```typescript
// Data fetching
import { api } from "@/convex/_generated/api"
import type { Doc, Id } from "@/convex/_generated/dataModel"
import { useQuery, useMutation, usePaginatedQuery } from "convex/react"

// UI primitives
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { NumberTicker } from "@/components/ui/number-ticker"
import { Item, ItemContent, ItemDescription, ItemFooter } from "@/components/ui/item"
import { RelativeTime } from "@/components/ui/relative-time"
import { Repeat } from "@/components/ui/repeat"

// Layout
import { HStack, VStack, Stack } from "@/components/layout/stack"
import { Box, type BoxProps } from "@/components/layout/box"
import { Grid } from "@/components/layout/grid"

// Utilities
import { cn } from "@/lib/utils"
import { useEffectEvent } from "react"
```

## Checklist

- [ ] Component fetches its own data with `useQuery` or `usePaginatedQuery`
- [ ] Loading state renders `<Skeleton>` component
- [ ] Skeleton component exported alongside main component
- [ ] Props type exported with `Props` suffix
- [ ] Uses `"skip"` for conditional queries
- [ ] Uses `useEffectEvent` for mutation handlers
- [ ] Sub-components have explicit `React.FC<Props>` types
- [ ] Uses `Doc<"tableName">` for full entity props
- [ ] Infinite scroll uses sentinel element pattern
- [ ] Pinned items rendered separately from regular items
