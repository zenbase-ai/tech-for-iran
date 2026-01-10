# Step 8: Upvoting System

Implement sign-to-upvote functionality with optimistic updates for the Wall of Commitments.

## Overview

The upvoting system allows signatories to endorse other people's commitments. This creates social proof and helps surface the most compelling pledges. Only people who have signed the letter can upvote, which keeps the system high-quality and prevents spam.

## Rules

1. Only signatories can upvote (must have signed the letter first)
2. One upvote per person per signatory (no duplicate votes)
3. No downvotes (upvote only)
4. Optimistic UI updates (instant feedback, then sync with server)
5. Non-signatories see a prompt to sign first when attempting to upvote

## Database Requirements

### Upvote Table

Create an `upvotes` table with:
- `signatoryId` - Reference to the signatory being upvoted
- `voterId` - User ID of the person upvoting (must be a signatory themselves)
- `createdAt` - Timestamp

Add a unique constraint on `(signatoryId, voterId)` to prevent duplicate upvotes.

### Denormalized Count

The `signatories` table should have an `upvoteCount` field that gets incremented/decremented when upvotes are added/removed. This enables efficient sorting by most upvoted without aggregation queries.

## Convex Functions to Implement

### Queries

- `canUpvote` - Check if the current authenticated user is a signatory (and thus allowed to upvote)
- `hasUpvoted` - Check if the current user has upvoted a specific signatory
- `myUpvotes` - Batch query to get all upvote states for a list of signatories (reduces N+1 queries on the commitments page)

### Mutations

- `add` - Add an upvote (verifies user is a signatory, checks for existing upvote, creates upvote record, increments count)
- `remove` - Remove an upvote (for toggle behavior - finds and deletes upvote record, decrements count)

## Components to Create

### UpvoteButton

A reusable button component that displays:
- An upward arrow/chevron icon
- The current upvote count (formatted with locale separators)
- Visual state change when upvoted (filled/colored icon)
- Tooltip for disabled state ("Sign the letter to upvote")

### SignToUpvoteModal

An alert dialog shown when a non-signatory attempts to upvote:
- Title: "Sign the letter to upvote"
- Description explaining only signatories can upvote
- Cancel button to dismiss
- "Sign now" button linking to the home page sign flow

### useUpvote Hook

A custom hook that encapsulates upvote logic:
- Fetches canUpvote and hasUpvoted states
- Manages optimistic state for instant UI feedback
- Provides a toggle function that adds or removes upvotes
- Reverts optimistic state on server errors
- Returns optimisticDelta for adjusting displayed count

## Integration Points

### Commitment Cards

Each commitment card on `/commitments` needs to:
- Display the upvote button with current count
- Show filled/active state if user has upvoted
- Handle click to toggle upvote (if allowed) or show modal (if not signed)
- Apply optimistic delta to displayed count

### Batch Loading

The commitments page should fetch upvote states in a single batch query rather than making individual requests per card. Pass the list of signatory IDs to `myUpvotes` and distribute the results to cards.

## Files to Create

- `src/convex/fns/upvotes.ts` - Convex queries and mutations
- `src/components/upvote-button.tsx` - The upvote button UI component
- `src/components/sign-to-upvote-modal.tsx` - Modal for non-signatories
- `src/hooks/use-upvote.ts` - Hook for upvote state and actions

---

## UX / UI

### Visual Design

The upvote button follows the minimal, typography-forward aesthetic of the site:
- Simple upward arrow or chevron icon
- Count displayed next to icon in a readable font
- Subtle color change when upvoted (accent color that complements the clean design)
- Ghost/outline button variant to avoid visual clutter

### Interaction States

**For signatories:**
- Default: Unfilled arrow, clickable
- Hover: Slight highlight or scale effect
- Upvoted: Filled/colored arrow indicating their vote
- Click toggles between upvoted and not upvoted

**For non-signatories:**
- Button appears visually disabled or grayed out
- Hovering shows tooltip: "Sign the letter to upvote"
- Clicking opens the SignToUpvoteModal
- Modal provides clear path to sign flow

### Optimistic Feedback

- When user clicks to upvote: Count increments immediately, arrow fills instantly
- When user clicks to remove: Count decrements immediately, arrow unfills
- If server request fails: State reverts to original, optionally show error toast
- This creates a snappy, responsive feel even with network latency

### Card Layout Integration

Per the spec's card anatomy, the upvote appears in the bottom-left of each commitment card:
- Format: `[arrow] 1,234` with relative timestamp on the right (`2d ago`)
- Consistent positioning across all card types (with commitment, without commitment, pinned)

---

## How It Works

### Authorization Flow

1. When the commitments page loads, check if the current user is authenticated
2. If authenticated, query `canUpvote` to determine if they are a signatory
3. Also batch-fetch `myUpvotes` with all visible signatory IDs to know which ones they've already upvoted
4. This information determines button state: active (can vote), upvoted (already voted), or disabled (not a signatory)

### Upvote Action Flow

1. User clicks the upvote button on a commitment card
2. The `useUpvote` hook immediately sets optimistic state (hasUpvoted = true, delta = +1)
3. UI updates instantly: arrow fills, count increases by 1
4. Hook calls the `add` mutation on the server
5. Server verifies user is a signatory (query signatories table by userId)
6. Server checks no existing upvote exists (query upvotes table by signatoryId + voterId)
7. Server inserts new upvote record with signatoryId, voterId, and timestamp
8. Server increments the `upvoteCount` on the signatory document
9. Mutation returns success; optimistic state is confirmed
10. If any step fails, optimistic state reverts and error is shown

### Remove Upvote Flow

1. User clicks an already-upvoted button (toggle off)
2. Hook sets optimistic state (hasUpvoted = false, delta = -1)
3. UI updates instantly: arrow unfills, count decreases by 1
4. Hook calls the `remove` mutation
5. Server finds and deletes the upvote record
6. Server decrements the `upvoteCount` on the signatory
7. Mutation returns success; state confirmed

### Non-Signatory Flow

1. User who hasn't signed clicks an upvote button
2. `canUpvote` is false, so toggle function does nothing for server calls
3. Instead, a modal appears explaining they need to sign first
4. Modal has a "Sign now" link that takes them to the home page
5. After signing, they return and can now upvote freely

### Data Consistency

- The `upvoteCount` field on signatories is denormalized for query performance
- Sorting "Most upvoted" uses this field directly without aggregation
- The unique constraint on upvotes table prevents double-voting at the database level
- If optimistic state and server state diverge, server is source of truth

---

## Verification Plan

### Prerequisites

- Ensure the sign flow is working (from previous steps)
- Have at least 2-3 test signatories in the database
- Be able to sign in as different users for testing

### Test 1: Non-Signatory Cannot Upvote

1. Open the `/commitments` page without being signed in (or as a user who hasn't signed the letter)
2. Observe that upvote buttons appear disabled/grayed out
3. Hover over an upvote button - verify tooltip shows "Sign the letter to upvote"
4. Click the upvote button
5. Verify the SignToUpvoteModal appears with proper messaging
6. Click "Sign now" and verify it navigates to the home page

### Test 2: Signatory Can Upvote

1. Complete the sign flow to become a signatory
2. Navigate to `/commitments`
3. Verify upvote buttons are now active (not disabled)
4. Click an upvote button on any commitment card
5. Verify the count increases by 1 immediately (optimistic update)
6. Verify the arrow icon changes to filled/active state
7. Refresh the page
8. Verify the upvote persisted (count still reflects your vote, arrow still filled)

### Test 3: Toggle Upvote Off

1. As a signatory, find a card you've already upvoted
2. Click the upvote button to remove your vote
3. Verify the count decreases by 1 immediately
4. Verify the arrow icon returns to unfilled state
5. Refresh the page
6. Verify the removal persisted (your vote is gone)

### Test 4: No Duplicate Upvotes

1. As a signatory, upvote a commitment
2. Open browser dev tools, Network tab
3. Try to manually call the add mutation again for the same signatory (or simulate rapid double-click)
4. Verify no duplicate upvote is created
5. Verify the count is still only +1, not +2

### Test 5: Batch Loading Performance

1. Navigate to `/commitments` with 10+ signatories
2. Open browser dev tools, Network tab
3. Verify that upvote states are fetched in a single batch request (myUpvotes query)
4. Verify all cards display correct upvoted/not-upvoted state immediately

### Test 6: Optimistic Revert on Error

1. Temporarily break the add mutation (e.g., disconnect network after optimistic update)
2. Click to upvote a commitment
3. Observe optimistic update (count increases, arrow fills)
4. Observe that when server request fails, state reverts (count decreases, arrow unfills)
5. Verify error feedback is shown (toast or similar)

### Test 7: Sort by Most Upvoted

1. As a signatory, upvote several commitments to create varied upvote counts
2. On `/commitments`, select "Most upvoted" sort option
3. Verify commitments are ordered by upvoteCount descending
4. Verify pinned items still appear first regardless of sort

### Test 8: Cross-User Consistency

1. Open the site in two different browsers/incognito windows
2. Sign in as two different signatories
3. Have User A upvote a commitment
4. Refresh User B's page
5. Verify User B sees the updated count
6. Verify User B can still upvote the same commitment (different voter)
7. Verify the count now reflects both upvotes

---

## ASCII Mockups

### Upvote Button States

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           UPVOTE BUTTON STATES                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. DEFAULT (not upvoted, signatory user)                                   │
│                                                                             │
│     ┌─────────────┐                                                         │
│     │  △  1,234   │   ← Outline arrow, neutral text                         │
│     └─────────────┘                                                         │
│                                                                             │
│  2. HOVERED (signatory user)                                                │
│                                                                             │
│     ┌─────────────┐                                                         │
│     │  △  1,234   │   ← Slight scale up or highlight effect                 │
│     └─────────────┘   ← Background subtle hover state                       │
│           ↑                                                                 │
│        cursor                                                               │
│                                                                             │
│  3. ACTIVE/UPVOTED (user has voted)                                         │
│                                                                             │
│     ┌─────────────┐                                                         │
│     │  ▲  1,235   │   ← Filled arrow (accent color), count incremented      │
│     └─────────────┘                                                         │
│                                                                             │
│  4. DISABLED (non-signatory user)                                           │
│                                                                             │
│     ┌─────────────┐                                                         │
│     │  △  1,234   │   ← Grayed out, reduced opacity                         │
│     └─────────────┘                                                         │
│           ↑                                                                 │
│        cursor                                                               │
│     ┌──────────────────────────────┐                                        │
│     │ Sign the letter to upvote    │  ← Tooltip on hover                    │
│     └──────────────────────────────┘                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Upvote Button Placement in Commitment Card

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COMMITMENT CARD WITH UPVOTE BUTTON                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Card with commitment:                                                      │
│  ┌───────────────────────────────────────┐                                  │
│  │ ★ PINNED                              │  ← Optional badge (if pinned)    │
│  │                                       │                                  │
│  │ Dara Khosrowshahi                     │  ← Name (bold)                   │
│  │ CEO, Uber                             │  ← Title, Company (lighter)      │
│  │                                       │                                  │
│  │ "Open Uber in Tehran within 30        │                                  │
│  │ days. Hire 500 drivers in the         │  ← Commitment text (quoted)      │
│  │ first quarter."                       │                                  │
│  │                                       │                                  │
│  ├───────────────────────────────────────┤                                  │
│  │                                       │                                  │
│  │  ▲ 2,847                       12h    │  ← Upvote button | Timestamp     │
│  │  └──┬──┘                       └─┬─┘  │                                  │
│  │     │                            │    │                                  │
│  └─────│────────────────────────────│────┘                                  │
│        │                            │                                       │
│        │                            └── Relative time since signing         │
│        │                                                                    │
│        └── Upvote: [arrow icon] [count with locale separators]              │
│                                                                             │
│                                                                             │
│  Card without commitment:                                                   │
│  ┌───────────────────────────────────────┐                                  │
│  │                                       │                                  │
│  │ Jane Smith                            │                                  │
│  │ VP Engineering, Stripe                │                                  │
│  │                                       │                                  │
│  │ Signed the letter.                    │  ← Fallback text                 │
│  │                                       │                                  │
│  ├───────────────────────────────────────┤                                  │
│  │                                       │                                  │
│  │  △ 89                           5d    │  ← Lower engagement typical      │
│  │                                       │                                  │
│  └───────────────────────────────────────┘                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Sign to Upvote Modal (for non-signatories)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SIGN TO UPVOTE MODAL                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Trigger: Non-signatory clicks any upvote button                            │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐        │
│  │                                                                 │        │
│  │                                                            [×]  │        │
│  │                                                                 │        │
│  │                  Sign the letter to upvote                      │        │
│  │                                                                 │        │
│  │  ─────────────────────────────────────────────────────────────  │        │
│  │                                                                 │        │
│  │  Only signatories can upvote commitments. This keeps the        │        │
│  │  community high-quality and prevents spam.                      │        │
│  │                                                                 │        │
│  │  Sign the letter to join 1,247 founders who have pledged        │        │
│  │  to do business with a free Iran.                               │        │
│  │                                                                 │        │
│  │                                                                 │        │
│  │        ┌────────────┐          ┌────────────────────┐           │        │
│  │        │   Cancel   │          │    Sign now →      │           │        │
│  │        └────────────┘          └────────────────────┘           │        │
│  │             │                          │                        │        │
│  │             │                          └── Primary: Links to /  │        │
│  │             │                              (home page sign flow)│        │
│  │             │                                                   │        │
│  │             └── Secondary: Dismisses modal                      │        │
│  │                                                                 │        │
│  └─────────────────────────────────────────────────────────────────┘        │
│                                                                             │
│  (Backdrop dims the page content behind the modal)                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Upvote Count Display Formatting

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       UPVOTE COUNT FORMATTING                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Count formatting uses locale separators (e.g., en-US):                     │
│                                                                             │
│  ┌──────────────────┬──────────────────┐                                    │
│  │  Raw Value       │  Displayed       │                                    │
│  ├──────────────────┼──────────────────┤                                    │
│  │  0               │  △ 0             │                                    │
│  │  5               │  △ 5             │                                    │
│  │  42              │  △ 42            │                                    │
│  │  999             │  △ 999           │                                    │
│  │  1000            │  △ 1,000         │                                    │
│  │  12847           │  △ 12,847        │                                    │
│  │  1000000         │  △ 1,000,000     │                                    │
│  └──────────────────┴──────────────────┘                                    │
│                                                                             │
│  Note: Use toLocaleString() for proper formatting across locales            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Optimistic Update Flow Visualization

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      OPTIMISTIC UPDATE SEQUENCE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  T0: Initial state                                                          │
│  ┌─────────────┐                                                            │
│  │  △  1,234   │  User sees this                                            │
│  └─────────────┘                                                            │
│        │                                                                    │
│        ▼                                                                    │
│  T1: User clicks (immediate optimistic update)                              │
│  ┌─────────────┐                                                            │
│  │  ▲  1,235   │  Instant feedback: arrow fills, count +1                   │
│  └─────────────┘                                                            │
│        │                                                                    │
│        ├──────────────────────────────────────┐                             │
│        │                                      │                             │
│        ▼                                      ▼                             │
│  T2a: Server confirms success           T2b: Server returns error           │
│  ┌─────────────┐                        ┌─────────────┐                     │
│  │  ▲  1,235   │  State persists        │  △  1,234   │  State reverts      │
│  └─────────────┘                        └─────────────┘                     │
│                                               │                             │
│                                               ▼                             │
│                                         ┌─────────────────────────┐         │
│                                         │ ⚠ Could not save vote   │ Toast   │
│                                         └─────────────────────────┘         │
│                                                                             │
│                                                                             │
│  Toggle off (remove upvote) follows same pattern:                           │
│                                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                    │
│  │  ▲  1,235   │ ──▶ │  △  1,234   │ ──▶ │  △  1,234   │ (confirmed)        │
│  └─────────────┘     └─────────────┘     └─────────────┘                    │
│      click           optimistic          server success                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Full Page Context: Commitments Wall with Upvotes

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COMMITMENTS PAGE WITH UPVOTE INTEGRATION                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  TECH FOR IRAN                                          [ Sign the letter ] │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────────│
│                                                                             │
│                          The Wall of Commitments                            │
│                                                                             │
│              1,247 founders have pledged $2.4B and 12,000 jobs.             │
│                                                                             │
│   Sort: [Most upvoted ▼]    Filter: [All categories ▼]                      │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────────│
│                                                                             │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌──────────────────  │
│  │ ★ PINNED              │  │ ★ PINNED              │  │                    │
│  │                       │  │                       │  │ Sarah Chen         │
│  │ Dara Khosrowshahi     │  │ Kaz Nejatian          │  │ Partner, a16z      │
│  │ CEO, Uber             │  │ CEO, Opendoor         │  │                    │
│  │                       │  │                       │  │ "Commit $50M to    │
│  │ "Open Uber in Tehran  │  │ "Launch a $100M seed  │  │ Series A/B rounds  │
│  │ within 30 days."      │  │ fund for Iranian      │  │ in Iranian cos."   │
│  │                       │  │ founders."            │  │                    │
│  │ ▲ 2,847         12h   │  │ ▲ 1,923          2d   │  │ △ 412         1d   │
│  │ └─┬─┘                 │  │ └─┬─┘                 │  │ └─┬─┘              │
│  └───│───────────────────┘  └───│───────────────────┘  └───│───────────────  │
│      │                          │                          │                │
│      │                          │                          │                │
│      └── Filled = user voted    └── Filled = user voted    └── Outline =    │
│                                                               not voted     │
│                                                                             │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌──────────────────  │
│  │                       │  │                       │  │                    │
│  │ Ali Mohammadi         │  │ Jane Smith            │  │ ...                │
│  │ Founder, Stealth      │  │ VP Eng, Stripe        │  │                    │
│  │                       │  │                       │  │                    │
│  │ "Hire 20 engineers    │  │ Signed the letter.    │  │                    │
│  │ from Sharif."         │  │                       │  │                    │
│  │                       │  │                       │  │                    │
│  │ △ 287            3d   │  │ △ 89             5d   │  │                    │
│  │                       │  │ (smaller/grayed)      │  │                    │
│  └───────────────────────┘  └───────────────────────┘  └──────────────────  │
│                                                                             │
│                             [ Load more ]                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Icon Reference

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ICON REFERENCE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Upvote arrow icons (use Lucide or similar icon library):                   │
│                                                                             │
│  △  Outline/unfilled arrow (ChevronUp or ArrowUp outline variant)           │
│     - Used for: default state, not upvoted                                  │
│     - Color: neutral/gray (e.g., text-muted-foreground)                     │
│                                                                             │
│  ▲  Filled arrow (ChevronUp or ArrowUp filled variant)                      │
│     - Used for: active/upvoted state                                        │
│     - Color: accent color (subtle, complements clean design)                │
│     - Consider: green (Iranian flag), or site's primary accent              │
│                                                                             │
│  Implementation note:                                                       │
│  Can use same icon with different fill/stroke props, or two separate        │
│  icon variants. The filled state should feel "activated" without being      │
│  garish or distracting from the commitment text which is the star.          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```
