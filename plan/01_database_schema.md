# Step 1: Database Schema

Set up the Convex schema for signatories and upvotes.

## Tables

### `signatories`

The signatories table stores everyone who has signed the letter. Each record contains:

**Identity fields:**
- `userId` - Linked to Clerk user for authentication
- `name` - Full name of the signatory
- `title` - Job title (e.g., "CEO", "Partner", "Founder")
- `company` - Company or organization name
- `phoneHash` - SHA256 hash of phone number for deduplication without storing PII

**Content fields:**
- `whySigned` - Optional "Why I'm signing" text, max 280 characters
- `commitmentText` - Optional "100 days" commitment text, no character limit

**Metadata fields:**
- `pinned` - Boolean flag for featured signatories (defaults to false)
- `upvoteCount` - Denormalized count for fast reads on the wall
- `referredBy` - Reference to the signatory who referred this person

**Future fields:**
- `tags` - JSON field for LLM-parsed data (capital amount, currency, jobs count, category)

**Indexes:**
- `by_userId` - Look up signatory by Clerk user ID
- `by_phoneHash` - Check for duplicate phone numbers
- `by_pinned_upvoteCount` - Sort by pinned status and upvote count for the wall
- `by_creationTime` - Sort by when they signed (most recent)

### `upvotes`

The upvotes table tracks who has upvoted whom on the Wall of Commitments.

**Fields:**
- `signatoryId` - Reference to the signatory being upvoted
- `voterId` - Clerk userId of the person upvoting (must be a signatory themselves)

**Indexes:**
- `by_signatoryId` - Get all upvotes for a signatory
- `by_signatoryId_voterId` - Enforce one upvote per person per signatory (deduplication)
- `by_voterId` - Get all upvotes cast by a user

## Aggregates

Define aggregates to efficiently compute:

- `signatoryCount` - Total number of signatories (displayed on success state and wall header)
- `signatoryUpvotes` - Count of upvotes per signatory (keeps `upvoteCount` in sync)

## Validation Schemas

Create validation schemas with Zod:

- `name` - Required, 1-100 characters
- `title` - Required, 1-100 characters
- `company` - Required, 1-100 characters
- `whySigned` - Optional, max 280 characters
- `commitmentText` - Optional, max 2000 characters

## Files to Create/Modify

- `src/convex/schema.ts` - Add signatories and upvotes tables
- `src/convex/aggregates.ts` - Add signatory aggregates
- `src/convex/triggers.ts` - Add triggers for upvote count sync
- `src/lib/signatory.ts` - Validation schemas

## Notes

- Use `phoneHash` as SHA256 to prevent duplicate signups while not storing PII
- `upvoteCount` is denormalized for fast reads on the wall; sync via triggers
- `pinned` signatories always sort first regardless of other sort criteria
- `referredBy` enables the "Kaz has inspired 47 others" referral tracking feature

---

## UX / UI

The database schema directly supports the following user-facing experiences:

**Sign Flow:**
- The `name`, `title`, and `company` fields populate the "I, [name], [title] at [company], sign this letter" form
- `whySigned` corresponds to the optional "Why I'm signing" textarea (280 char limit matches Twitter for easy sharing)
- `commitmentText` stores the "In the first 100 days, I commit to..." free-form text
- `phoneHash` enables the phone verification deduplication check - users see an error if they try to sign twice

**Wall of Commitments:**
- Cards display `name`, `title`, `company`, `commitmentText`, and `upvoteCount`
- The "Why I signed" appears as an expandable section on cards when present
- `pinned` signatories show a "PINNED" badge and always appear at the top of the wall
- Sort by "Most upvoted" uses the `by_pinned_upvoteCount` index
- Sort by "Most recent" uses the `by_creationTime` index
- Cards without `commitmentText` show "Signed the letter." and appear less prominent

**Share Page:**
- `referredBy` tracks attribution when someone signs via another person's share link
- The referral count ("Kaz has inspired 47 others") is computed by counting signatories with `referredBy` pointing to that user

**Upvoting:**
- Only signatories can upvote (enforced by checking if `voterId` exists in signatories table)
- One upvote per person per signatory (enforced by `by_signatoryId_voterId` unique index)
- `upvoteCount` updates optimistically in the UI for instant feedback

---

## How It Works

**Creating a Signatory:**
1. User completes the sign flow with name, title, company, and optional why/commitment text
2. Phone number is verified via Clerk, then hashed with SHA256
3. System checks if `phoneHash` already exists in signatories - if so, reject with duplicate error
4. New signatory record is created with `upvoteCount: 0`, `pinned: false`
5. If user arrived via a share link, `referredBy` is set to that signatory's ID
6. `signatoryCount` aggregate increments automatically via trigger

**Upvoting a Signatory:**
1. User clicks the upvote arrow on a commitment card
2. System verifies the voter is a signatory (by checking their `userId` exists in signatories)
3. System checks if an upvote record already exists for this `(signatoryId, voterId)` pair
4. If no duplicate, create the upvote record
5. Trigger automatically increments the signatory's `upvoteCount`
6. UI updates optimistically for instant feedback

**Loading the Wall:**
1. Query signatories sorted by `pinned: true` first, then by `upvoteCount` descending (or `_creationTime` for recent)
2. Paginate results for infinite scroll / "Load more" functionality
3. For each card, display the denormalized `upvoteCount` directly (no joins needed)

**Referral Tracking:**
1. When user visits `/s/[signatory_id]`, store that signatory ID in localStorage as `referred_by`
2. When completing the sign flow, save `referred_by` value to the new signatory's `referredBy` field
3. Count query on `referredBy` index gives "Kaz has inspired N others" stat
