# Step 7: Commitments Wall

Build the `/commitments` page - a browsable, sortable grid of signatory cards displaying everyone who has signed the letter.

## Overview

The Wall of Commitments is the social proof page. It showcases all signatories in a grid layout, with their "100 days" commitments as the star of each card. Pinned (featured) signatories always appear first, followed by the rest sorted by upvotes or recency.

## Page Structure

The page consists of:
- A minimal header with the "TECH FOR IRAN" wordmark and a "Sign the letter" CTA button
- A title section: "The Wall of Commitments" with the total signatory count
- A sort dropdown (Most upvoted / Most recent)
- A responsive grid of commitment cards
- Pinned cards appear first, separated by a visual divider from regular cards
- A "Load more" button for pagination
- An empty state with a CTA if no signatories exist

## Route Structure

Create the following files under `src/app/commitments/`:
- `page.tsx` - Server component entry point
- `page.client.tsx` - Client component with queries and state
- `_header.tsx` - Page header with stats
- `_sort-select.tsx` - Sort dropdown component
- `_card.tsx` - Individual commitment card component
- `_grid.tsx` - Card grid layout (uses `Grid` from `@/components/layout/grid`)

Use existing components:
- `Grid` from `@/components/layout/grid` - For responsive grid layout with `cols` prop
- `RelativeTime` from `@/components/ui/relative-time` - For timestamp formatting (uses `react-timeago`)

## Card Anatomy

Each commitment card displays:
- **Pinned badge** (if applicable): "PINNED" with a star icon at the top
- **Name**: The signatory's full name
- **Title and Company**: Displayed below the name in muted text
- **Commitment text**: The "100 days" commitment in a blockquote style, italicized
- **Fallback**: If no commitment, show "Signed the letter." in muted text
- **Why I signed**: If present, show as an expandable/collapsible section
- **Footer**: Upvote button with count on the left, relative timestamp on the right

Cards without commitments should be visually less prominent (slightly reduced opacity).

## Convex Query Requirements

Create a paginated `list` query in `src/convex/fns/signatories.ts` that:
- Accepts a `sort` parameter: either `'upvotes'` or `'recent'`
- Always returns pinned signatories first (only on the first page)
- Sorts remaining signatories by upvote count (descending) or creation time (descending)
- Uses pagination with a default of 20 items per page

Create a `count` query that returns the total number of signatories for the header stats.

## Index Requirements

Add these indexes to the signatories table in the Convex schema:
- `by_upvoteCount` on the `upvoteCount` field for sorting by upvotes
- `by_pinned_upvoteCount` on `["pinned", "upvoteCount"]` for efficient queries

## Relative Time Formatting

Use the existing `RelativeTime` component from `@/components/ui/relative-time`:
- Wraps `react-timeago` with `style: "short"` formatting
- `<RelativeTime date={_creationTime} />` for static timestamps
- `<LiveRelativeTime date={_creationTime} />` if live updates are needed

---

## UX / UI

### Visual Design
- Typography-forward, clean aesthetic matching the manifesto page
- Cards should have subtle hover effects (shadow increase)
- Use `Grid` component with responsive classes: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Generous spacing between cards (`gap-4`)
- Pinned section is visually separated from regular cards by a horizontal divider

### Card Hierarchy
- Pinned cards appear at the top and should feel special but not overwhelming
- Cards with commitments are more prominent than those without
- The commitment text is the star - use a blockquote style with left border
- "Why I signed" is secondary information, hidden by default

### Interactions
- Sort dropdown allows switching between "Most upvoted" and "Most recent"
- Changing sort should feel instant (optimistic UI)
- "Load more" button loads the next batch of 20 cards
- Cards link to the individual share page (`/s/[signatory_id]`)

### Empty State
- If no signatories exist, show an encouraging message: "Be the first to sign the letter."
- Include a prominent CTA button linking to the home page sign flow

### Loading States
- Show skeleton cards while data is loading
- The "Load more" button should show a loading spinner when fetching

### Upvote Button (Placeholder)
- Show the upvote count and an arrow icon
- The actual upvote functionality is implemented in Step 8
- For now, the button is present but non-functional (disabled state)

---

## How It Works

1. **Page Load**: The server component renders the page shell. The client component mounts and immediately fetches the first page of signatories using Convex's paginated query.

2. **Data Fetching**: The query first collects all pinned signatories, then paginates through the rest based on the selected sort order. On the first page, pinned signatories are prepended to the results.

3. **Sorting**: When the user changes the sort option, the client component updates the query parameters. Convex automatically refetches with the new sort order. The upvote sort uses the `by_upvoteCount` index for efficient descending order retrieval.

4. **Pagination**: The `usePaginatedQuery` hook tracks pagination state. When "Load more" is clicked, it fetches the next 20 signatories and appends them to the existing list. Pinned signatories only appear on the first page to avoid duplication.

5. **Card Rendering**: The grid component separates pinned from regular signatories and renders them in two sections with a divider. Each card displays the signatory's information with appropriate visual hierarchy.

6. **Relative Timestamps**: Each card shows when the person signed using the `RelativeTime` component (e.g., "2d ago"), which formats the `_creationTime` field using `react-timeago`.

7. **Performance**: The denormalized `upvoteCount` field on each signatory enables sorting without expensive join operations. Pagination keeps initial load fast by only fetching 20 items at a time.

---

## Verification Plan

### Initial Page Load
1. Navigate to `/commitments`
2. Verify the page title "The Wall of Commitments" is visible
3. Verify the total signatory count is displayed and matches the database count
4. Verify the sort dropdown defaults to "Most upvoted"

### Card Display
1. Verify pinned signatories appear first with a "PINNED" badge
2. Verify there is a visual separator between pinned and regular cards
3. Verify each card shows: name, title, company, commitment (or "Signed the letter")
4. Verify cards with commitments show the text in blockquote style
5. Verify the relative timestamp is displayed (e.g., "2d ago")
6. Verify the upvote count is visible on each card

### Expandable "Why I signed"
1. Find a card with a "Why I signed" section
2. Verify it is collapsed by default, showing only "Why I signed" as a clickable link
3. Click to expand and verify the full text appears
4. Click again to collapse

### Sorting
1. With "Most upvoted" selected, verify cards are ordered by upvote count (highest first)
2. Switch to "Most recent" and verify cards reorder by sign date (newest first)
3. Verify pinned cards remain at the top regardless of sort order

### Pagination
1. Verify only ~20 cards load initially (plus pinned)
2. Scroll down and click "Load more"
3. Verify additional cards append to the list
4. Verify pinned cards do not repeat on subsequent pages
5. Continue loading until all cards are displayed
6. Verify "Load more" button disappears when no more results

### Responsive Layout
1. On desktop (1200px+), verify 3-column grid layout
2. On tablet (~768px), verify 2-column grid layout
3. On mobile (<640px), verify single-column layout

### Empty State
1. If testing with an empty database, verify the empty state message appears
2. Verify "Sign now" button links to the home page

### Cards Without Commitments
1. Find a signatory who signed without a commitment
2. Verify their card shows "Signed the letter." instead of a commitment quote
3. Verify the card appears slightly less prominent (reduced opacity)

### Navigation
1. Click on the "TECH FOR IRAN" wordmark, verify it navigates to home
2. Click "Sign the letter" button in header, verify it navigates to home
3. Click on a commitment card, verify it navigates to `/s/[signatory_id]`

---

## ASCII Mockups

### Desktop Layout (3-column grid)

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                              │
│  TECH FOR IRAN                                                      [ Sign the letter ]     │
│                                                                                              │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                              │
│                              The Wall of Commitments                                         │
│                                                                                              │
│                       1,247 founders have signed the letter.                                 │
│                                                                                              │
│  Sort: [Most upvoted ▼]                                                                      │
│                                                                                              │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│  PINNED                                                                                      │
│  ┌────────────────────────────┐  ┌────────────────────────────┐  ┌────────────────────────┐  │
│  │ ★ PINNED                   │  │ ★ PINNED                   │  │ ★ PINNED               │  │
│  │                            │  │                            │  │                        │  │
│  │ Dara Khosrowshahi          │  │ Kaz Nejatian               │  │ Sarah Chen             │  │
│  │ CEO, Uber                  │  │ CEO, Opendoor              │  │ Partner, a16z          │  │
│  │                            │  │                            │  │                        │  │
│  │ ┃ "Open Uber in Tehran     │  │ ┃ "Launch a $100M seed     │  │ ┃ "Commit $50M to      │  │
│  │ ┃ within 30 days. Hire     │  │ ┃ fund focused on          │  │ ┃ Series A/B rounds    │  │
│  │ ┃ 500 drivers in the       │  │ ┃ Iranian founders."       │  │ ┃ in Iranian           │  │
│  │ ┃ first quarter."          │  │                            │  │ ┃ companies."          │  │
│  │                            │  │ Why I signed ▶             │  │                        │  │
│  │ ▲ 2,847              12h   │  │ ▲ 1,923              2d    │  │ ▲ 1,456           3d   │  │
│  └────────────────────────────┘  └────────────────────────────┘  └────────────────────────┘  │
│                                                                                              │
│  ──────────────────────────────────────────────────────────────────────────────────────────  │
│                                                                                              │
│  ┌────────────────────────────┐  ┌────────────────────────────┐  ┌────────────────────────┐  │
│  │                            │  │                            │  │                        │  │
│  │ Ali Mohammadi              │  │ Maryam Tehrani             │  │ John Smith             │  │
│  │ Founder, Stealth           │  │ VP Eng, Google             │  │ CTO, Startup           │  │
│  │                            │  │                            │  │                        │  │
│  │ ┃ "Hire 20 engineers       │  │ ┃ "Mentor 10 first-time    │  │                        │  │
│  │ ┃ from Sharif and          │  │ ┃ founders in Tehran."     │  │ Signed the letter.     │  │
│  │ ┃ Tehran University."      │  │                            │  │                        │  │
│  │                            │  │                            │  │        (opacity: 70%)  │  │
│  │ ▲ 412               1d     │  │ ▲ 287               3d     │  │ ▲ 89              5d   │  │
│  └────────────────────────────┘  └────────────────────────────┘  └────────────────────────┘  │
│                                                                                              │
│  ┌────────────────────────────┐  ┌────────────────────────────┐  ┌────────────────────────┐  │
│  │                            │  │                            │  │                        │  │
│  │ ...                        │  │ ...                        │  │ ...                    │  │
│  │                            │  │                            │  │                        │  │
│  └────────────────────────────┘  └────────────────────────────┘  └────────────────────────┘  │
│                                                                                              │
│                                                                                              │
│                                     [ Load more ]                                            │
│                                                                                              │
│                                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Mobile Layout (1-column)

```
┌────────────────────────────────────┐
│                                    │
│  TECH FOR IRAN                     │
│                   [Sign the letter]│
│                                    │
├────────────────────────────────────┤
│                                    │
│     The Wall of Commitments        │
│                                    │
│   1,247 founders have signed       │
│         the letter.                │
│                                    │
│  Sort: [Most upvoted ▼]            │
│                                    │
├────────────────────────────────────┤
│  PINNED                            │
│  ┌──────────────────────────────┐  │
│  │ ★ PINNED                     │  │
│  │                              │  │
│  │ Dara Khosrowshahi            │  │
│  │ CEO, Uber                    │  │
│  │                              │  │
│  │ ┃ "Open Uber in Tehran       │  │
│  │ ┃ within 30 days. Hire 500   │  │
│  │ ┃ drivers in the first       │  │
│  │ ┃ quarter."                  │  │
│  │                              │  │
│  │ ▲ 2,847                 12h  │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ ★ PINNED                     │  │
│  │                              │  │
│  │ Kaz Nejatian                 │  │
│  │ CEO, Opendoor                │  │
│  │                              │  │
│  │ ┃ "Launch a $100M seed fund  │  │
│  │ ┃ focused on Iranian         │  │
│  │ ┃ founders."                 │  │
│  │                              │  │
│  │ Why I signed ▶               │  │
│  │                              │  │
│  │ ▲ 1,923                  2d  │  │
│  └──────────────────────────────┘  │
│                                    │
│  ────────────────────────────────  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │                              │  │
│  │ Ali Mohammadi                │  │
│  │ Founder, Stealth             │  │
│  │                              │  │
│  │ ┃ "Hire 20 engineers from    │  │
│  │ ┃ Sharif and Tehran          │  │
│  │ ┃ University."               │  │
│  │                              │  │
│  │ ▲ 412                   1d   │  │
│  └──────────────────────────────┘  │
│                                    │
│       [ Load more ]                │
│                                    │
└────────────────────────────────────┘
```

### Card Anatomy Detail

**Card with commitment (full-featured):**
```
┌────────────────────────────────────────────────┐
│ ★ PINNED                    ← Badge (if pinned)│
│                                                │
│ Kaz Nejatian                ← Name (bold)      │
│ CEO, Opendoor               ← Title, Company   │
│                                (muted text)    │
│                                                │
│ ┃ "Launch a $100M seed      ← Commitment text  │
│ ┃ fund focused on             (blockquote      │
│ ┃ Iranian founders."           style, italic,  │
│                                left border)    │
│                                                │
│ Why I signed ▶              ← Expandable       │
│                                (collapsed)     │
│                                                │
│ ▲ 1,923                2d   ← Footer: upvote   │
│                                button + count  │
│                                on left,        │
│                                timestamp right │
└────────────────────────────────────────────────┘
```

**Card with "Why I signed" expanded:**
```
┌────────────────────────────────────────────────┐
│ ★ PINNED                                       │
│                                                │
│ Kaz Nejatian                                   │
│ CEO, Opendoor                                  │
│                                                │
│ ┃ "Launch a $100M seed fund focused on         │
│ ┃ Iranian founders."                           │
│                                                │
│ Why I signed ▼                                 │
│ ┌────────────────────────────────────────────┐ │
│ │ "My parents left Iran in 1979. I've spent  │ │
│ │ my whole life wondering what could have    │ │
│ │ been. I want to help build what will be."  │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ ▲ 1,923                                   2d   │
└────────────────────────────────────────────────┘
```

**Card WITHOUT commitment (less prominent):**
```
┌────────────────────────────────────────────────┐
│                              (no pinned badge) │
│                                                │
│ Jane Smith                                     │
│ VP Engineering, Stripe                         │
│                                                │
│ Signed the letter.          ← Fallback text    │
│                                (muted, not     │
│                                 italic)        │
│                                                │
│ ▲ 89                                      5d   │
│                                                │
├────────────────────────────────────────────────┤
│ Note: Card has opacity: 0.7 or similar         │
│ to appear less prominent than cards with       │
│ commitments                                    │
└────────────────────────────────────────────────┘
```

### Sort Dropdown States

**Closed state:**
```
┌──────────────────────────────────┐
│ Sort: [Most upvoted         ▼]  │
└──────────────────────────────────┘
```

**Open state:**
```
┌──────────────────────────────────┐
│ Sort: [Most upvoted         ▼]  │
│       ┌─────────────────────┐   │
│       │ ✓ Most upvoted      │   │
│       │   Most recent       │   │
│       └─────────────────────┘   │
└──────────────────────────────────┘
```

### Pinned vs Regular Section Divider

```
  ┌────────────────────┐  ┌────────────────────┐
  │ ★ PINNED           │  │ ★ PINNED           │
  │ ...                │  │ ...                │
  └────────────────────┘  └────────────────────┘

  ─────────────────────────────────────────────────  ← Visual divider (hr)

  ┌────────────────────┐  ┌────────────────────┐
  │                    │  │                    │
  │ ...                │  │ ...                │
  └────────────────────┘  └────────────────────┘
```

### Loading State (Skeleton Cards)

```
┌────────────────────────────────────────────────┐
│ ████████████                                   │
│                                                │
│ ██████████████████                             │  ← Animated skeleton
│ ████████████████████████                       │    pulse effect
│                                                │
│ ┃ ████████████████████████████████████████     │
│ ┃ ██████████████████████████████               │
│ ┃ ████████████████████                         │
│                                                │
│ ████████                             ████      │
└────────────────────────────────────────────────┘
```

### Empty State

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  TECH FOR IRAN                                          [ Sign the letter ] │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                           The Wall of Commitments                            │
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
│                       Be the first to sign the letter.                       │
│                                                                              │
│                             [ Sign now ]                                     │
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Load More Button States

**Default:**
```
                    ┌─────────────────────┐
                    │     Load more       │
                    └─────────────────────┘
```

**Loading:**
```
                    ┌─────────────────────┐
                    │   ◠ Loading...      │
                    └─────────────────────┘
```

**No more results (button hidden):**
```
                    (button not rendered)
```

### Upvote Button States

**Default (not upvoted):**
```
┌────────┐
│ ▲ 412  │   ← Hollow/outline arrow
└────────┘
```

**Upvoted:**
```
┌────────┐
│ ▲ 413  │   ← Filled arrow, accent color
└────────┘
```

**Disabled (for non-signatories):**
```
┌────────┐
│ ▲ 412  │   ← Grayed out, shows tooltip on hover:
└────────┘     "Sign the letter to upvote"
```