# Step 9: Share Page

Build `/s/[id]` - the individual signatory share page with referral tracking. This is the page that gets shared on social media and enables viral growth through personal referral links.

## Overview

Each signatory gets a unique share page at `/s/[signatory_id]`. This page displays their pledge information prominently and tracks when new signatories arrive through their link. The page exists primarily to:

1. Serve a dynamic OG image (implemented in Step 10) for rich social previews
2. Display the signatory's full pledge with their commitment and "why I signed" text
3. Track referrals when visitors who arrive at this page later sign the letter
4. Encourage visitors to add their own name to the letter

## Page Layout

The share page follows a single-column, centered layout with clear visual hierarchy:

- Header with site wordmark and "Sign the letter" CTA button
- Signatory profile section (name, title, company)
- Their commitment text displayed as a prominent blockquote
- Their "Why I signed" text (if provided)
- Upvote count
- Referral stats showing how many others this person has inspired to sign
- "Add your name" CTA button
- Footer showing total signatory count with link to commitments page

## Route Structure

Create the following files under `src/app/s/[id]/`:

- `page.tsx` - Server component that fetches signatory data and generates metadata
- `page.client.tsx` - Client component that handles real-time queries and sets referral cookie
- `not-found.tsx` - Custom 404 page for invalid signatory IDs
- `_skeleton.tsx` - Loading skeleton component

## Convex Queries Needed

The page requires two new queries in `src/convex/fns/signatories.ts`:

1. `get` - Fetch a single signatory by ID (returns null if not found)
2. `referralCount` - Count how many signatories have this signatory as their `referredBy` value

## Referral Tracking

When a user visits `/s/[id]`:

1. Store the signatory ID in both a cookie and localStorage as `referred_by`
2. Cookie should have 7-day expiry
3. When the visitor later completes the sign flow (from any page), check for this stored referral and save it on their signatory record

The referral utility functions should be in `src/lib/referral.ts` and reuse the implementation from Step 5.

## Metadata Generation

Use `generateMetadata` in the server component to create dynamic SEO metadata:

- Title: "[Name] signed Tech for Iran"
- Description: Their commitment text (truncated) or fallback text about pledging to do business with a free Iran
- OpenGraph and Twitter card metadata for rich previews
- The OG image will be handled by the `opengraph-image.tsx` file in Step 10

## Error Handling

- If the signatory ID is invalid or not found, call `notFound()` to render the custom 404 page
- The not-found page should explain the link may be invalid and offer a CTA to sign the letter

---

## UX / UI

### Visual Design

The share page follows the same typography-forward, minimal aesthetic as the rest of the site:

- Clean, centered layout with generous whitespace
- Maximum content width of ~600-700px for readability
- The signatory's name and title are prominently displayed at the top
- Their commitment text is styled as a blockquote, making it the visual centerpiece
- Muted colors for secondary text (title/company, "why I signed")
- Clear visual separators between sections

### User Journey

1. **Social Discovery**: A user sees a shared link on Twitter/LinkedIn with an OG image preview showing a signatory's pledge
2. **Click Through**: They click and land on this page, immediately seeing who signed and what they committed to
3. **Social Proof**: The referral count ("Kaz has inspired 47 others") and total signatory count provide credibility
4. **Call to Action**: Two prominent CTAs encourage signing - one in the referral section and one in the header
5. **Exploration**: Link to view all commitments for those who want to browse before signing

### Mobile Considerations

- Single-column layout works well on all screen sizes
- Touch-friendly button sizes for CTAs
- Readable text sizes on mobile (the manifesto aesthetic should scale down gracefully)

### Loading States

A skeleton loader maintains layout stability while data loads, showing placeholder shapes for:
- Header elements
- Name and title
- Commitment text block
- Stats and buttons

---

## How It Works

### Page Load Flow

1. Next.js receives a request for `/s/[some-id]`
2. The server component runs `generateMetadata` first to prepare SEO tags
3. Server component fetches the signatory via `fetchQuery` to verify they exist
4. If signatory doesn't exist, `notFound()` triggers the 404 page
5. If found, the server component renders `SharePageClient` passing the signatory ID
6. Client component mounts and:
   - Sets up real-time Convex queries for signatory data, referral count, and total count
   - Immediately stores the signatory ID as a referral in cookie + localStorage
   - Renders the profile, stats, and CTAs

### Referral Attribution Flow

1. Visitor arrives at `/s/kaz123`
2. Client component calls `setReferralId("kaz123")` on mount
3. This stores `referred_by=kaz123` in both cookie (7-day expiry) and localStorage
4. Visitor browses the site, maybe reads the manifesto
5. Eventually they complete the sign flow on any page
6. The sign flow reads the `referred_by` value and includes it in the signatory creation
7. Kaz's referral count increments

### Data Dependencies

- The signatory record contains: name, title, company, commitmentText, whySigned, upvoteCount
- Referral count is computed by querying signatories where `referredBy` equals this signatory's ID
- Total signatory count comes from a simple count query or aggregate

---

## Verification Plan

### Setup

1. Ensure you have at least one signatory in the database (from previous steps or seed data)
2. Note a valid signatory ID to test with

### Test Cases

#### 1. Valid Signatory Page

- Navigate to `/s/[valid-id]` in the browser
- Verify the page loads without errors
- Confirm the signatory's name, title, and company are displayed
- Confirm the commitment text appears in a blockquote (if they have one)
- Confirm the "why I signed" text appears (if they have one)
- Confirm the upvote count is displayed
- Verify the referral count shows (may be 0 for new signatories)
- Verify the total signatory count is displayed

#### 2. Invalid Signatory Page (404)

- Navigate to `/s/invalid-id-that-does-not-exist`
- Verify the custom not-found page appears
- Confirm it shows the "Signatory not found" message
- Verify the "Sign the letter" CTA button works and navigates to home

#### 3. Referral Cookie

- Open browser developer tools to the Application/Storage tab
- Navigate to `/s/[valid-id]`
- Check that a `referred_by` cookie is set with the signatory ID
- Check localStorage also contains the `referred_by` key with the same value

#### 4. Navigation Links

- On the share page, click "TECH FOR IRAN" wordmark - should navigate to home
- Click "Sign the letter" button in header - should navigate to home (sign flow)
- Click "Add your name" button - should navigate to home (sign flow)
- Click "See all commitments" button - should navigate to /commitments

#### 5. Metadata / SEO

- View page source or use browser dev tools Network tab to inspect the HTML
- Verify the page title contains the signatory's name
- Verify og:title, og:description meta tags are present
- Verify twitter:card meta tag is set to "summary_large_image"

#### 6. Loading State

- Throttle network in dev tools to see the skeleton loader
- Verify skeleton displays properly shaped placeholders during load
- Verify content replaces skeleton smoothly once data arrives

#### 7. Signatory Without Commitment

- Find or create a signatory who skipped the commitment text
- Navigate to their share page
- Verify the page still displays correctly without the commitment blockquote
- Verify fallback description text is used in metadata

#### 8. Mobile Responsiveness

- View the share page at various viewport widths (375px, 768px, 1024px)
- Verify layout remains readable and usable at all sizes
- Verify buttons are tap-friendly on mobile sizes

---

## ASCII Mockups

### Desktop Layout - Share Page with Commitment

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│  TECH FOR IRAN                                            [ Sign the letter ]   │
│                                                                                  │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│                                                                                  │
│                                                                                  │
│                              Kaz Nejatian                                        │
│                             CEO, Opendoor                                        │
│                                                                                  │
│                                                                                  │
│        ┌────────────────────────────────────────────────────────────────┐        │
│        │                                                                │        │
│        │  "In the first 100 days, I commit to launching a $100M seed   │        │
│        │   fund focused on Iranian founders."                          │        │
│        │                                                                │        │
│        └────────────────────────────────────────────────────────────────┘        │
│                                                                                  │
│                                                                                  │
│        Why I signed:                                                             │
│        "My parents left Iran in 1979. I've spent my whole life wondering         │
│         what could have been. I want to help build what will be."                │
│                                                                                  │
│                                                                                  │
│                               ▲ 1,923 upvotes                                    │
│                                                                                  │
│                                                                                  │
│   ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                  │
│                                                                                  │
│              Kaz has inspired 47 others to sign the letter.                      │
│                                                                                  │
│                          [ Add your name ]                                       │
│                                                                                  │
│                                                                                  │
│   ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                  │
│                                                                                  │
│                   1,247 founders have signed the letter.                         │
│                                                                                  │
│                        [ See all commitments ]                                   │
│                                                                                  │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Desktop Layout - Share Page without Commitment

When a signatory has no commitment text:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│  TECH FOR IRAN                                            [ Sign the letter ]   │
│                                                                                  │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│                                                                                  │
│                                                                                  │
│                              Jane Smith                                          │
│                         VP Engineering, Stripe                                   │
│                                                                                  │
│                                                                                  │
│                          Signed the letter.                                      │
│                                                                                  │
│                                                                                  │
│                               ▲ 89 upvotes                                       │
│                                                                                  │
│                                                                                  │
│   ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                  │
│                                                                                  │
│              Jane has inspired 12 others to sign the letter.                     │
│                                                                                  │
│                          [ Add your name ]                                       │
│                                                                                  │
│                                                                                  │
│   ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                  │
│                                                                                  │
│                   1,247 founders have signed the letter.                         │
│                                                                                  │
│                        [ See all commitments ]                                   │
│                                                                                  │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Desktop Layout - Share Page with Zero Referrals

When a signatory hasn't referred anyone yet:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│  TECH FOR IRAN                                            [ Sign the letter ]   │
│                                                                                  │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│                                                                                  │
│                                                                                  │
│                              Ali Mohammadi                                       │
│                            Founder, Stealth                                      │
│                                                                                  │
│                                                                                  │
│        ┌────────────────────────────────────────────────────────────────┐        │
│        │                                                                │        │
│        │  "Hire 20 engineers from Sharif and Tehran University."       │        │
│        │                                                                │        │
│        └────────────────────────────────────────────────────────────────┘        │
│                                                                                  │
│                                                                                  │
│                               ▲ 287 upvotes                                      │
│                                                                                  │
│                                                                                  │
│   ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                  │
│                                                                                  │
│                  Be the first to join Ali in signing.                            │
│                                                                                  │
│                          [ Add your name ]                                       │
│                                                                                  │
│                                                                                  │
│   ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                  │
│                                                                                  │
│                   1,247 founders have signed the letter.                         │
│                                                                                  │
│                        [ See all commitments ]                                   │
│                                                                                  │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Mobile Layout - Share Page

```
┌────────────────────────────────┐
│                                │
│  TECH FOR IRAN                 │
│                                │
│         [ Sign the letter ]    │
│                                │
├────────────────────────────────┤
│                                │
│                                │
│        Kaz Nejatian            │
│       CEO, Opendoor            │
│                                │
│                                │
│  ┌──────────────────────────┐  │
│  │                          │  │
│  │ "In the first 100 days,  │  │
│  │  I commit to launching a │  │
│  │  $100M seed fund focused │  │
│  │  on Iranian founders."   │  │
│  │                          │  │
│  └──────────────────────────┘  │
│                                │
│                                │
│  Why I signed:                 │
│  "My parents left Iran in      │
│   1979. I've spent my whole    │
│   life wondering what could    │
│   have been. I want to help    │
│   build what will be."         │
│                                │
│                                │
│       ▲ 1,923 upvotes          │
│                                │
│                                │
│  ────────────────────────────  │
│                                │
│                                │
│  Kaz has inspired 47 others    │
│  to sign the letter.           │
│                                │
│      [ Add your name ]         │
│                                │
│                                │
│  ────────────────────────────  │
│                                │
│                                │
│  1,247 founders have signed    │
│  the letter.                   │
│                                │
│    [ See all commitments ]     │
│                                │
│                                │
└────────────────────────────────┘
```

### 404 Not Found State

When the signatory ID is invalid or does not exist:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│  TECH FOR IRAN                                            [ Sign the letter ]   │
│                                                                                  │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│                                                                                  │
│                                                                                  │
│                                                                                  │
│                                                                                  │
│                                                                                  │
│                          Signatory not found                                     │
│                                                                                  │
│                                                                                  │
│             This link may be invalid or the signatory may have been              │
│                           removed from the letter.                               │
│                                                                                  │
│                                                                                  │
│                                                                                  │
│                                                                                  │
│   ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                  │
│                                                                                  │
│             Join 1,247 founders who have signed Tech for Iran.                   │
│                                                                                  │
│                          [ Sign the letter ]                                     │
│                                                                                  │
│                                                                                  │
│                                                                                  │
│                                                                                  │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Loading Skeleton State

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│  TECH FOR IRAN                                            [ Sign the letter ]   │
│                                                                                  │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│                                                                                  │
│                                                                                  │
│                          ████████████████████                                    │  <- Name skeleton
│                            ██████████████                                        │  <- Title skeleton
│                                                                                  │
│                                                                                  │
│        ┌────────────────────────────────────────────────────────────────┐        │
│        │                                                                │        │
│        │  ████████████████████████████████████████████████████████████  │        │
│        │  ██████████████████████████████████████████                    │        │  <- Commitment skeleton
│        │                                                                │        │
│        └────────────────────────────────────────────────────────────────┘        │
│                                                                                  │
│                                                                                  │
│        ████████████                                                              │  <- "Why I signed:" label
│        ██████████████████████████████████████████████████████████████████        │
│        ██████████████████████████████████████████████████                        │  <- Why signed skeleton
│                                                                                  │
│                                                                                  │
│                               ██████████████                                     │  <- Upvote skeleton
│                                                                                  │
│                                                                                  │
│   ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                  │
│                                                                                  │
│              ████████████████████████████████████████████                        │  <- Referral text skeleton
│                                                                                  │
│                          [ Add your name ]                                       │
│                                                                                  │
│                                                                                  │
│   ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                  │
│                                                                                  │
│                   ████████████████████████████████████                           │  <- Total count skeleton
│                                                                                  │
│                        [ See all commitments ]                                   │
│                                                                                  │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ HEADER                                                                           │
│ ┌──────────────────────────────────────────────────────────────────────────────┐ │
│ │  TECH FOR IRAN                                        [ Sign the letter ]   │ │
│ └──────────────────────────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│ SIGNATORY PROFILE                                                                │
│ ┌──────────────────────────────────────────────────────────────────────────────┐ │
│ │                                                                              │ │
│ │                            {name}                                            │ │
│ │                       {title}, {company}                                     │ │
│ │                                                                              │ │
│ └──────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│ COMMITMENT BLOCKQUOTE (if commitmentText exists)                                 │
│ ┌──────────────────────────────────────────────────────────────────────────────┐ │
│ │     ┌────────────────────────────────────────────────────────────────┐       │ │
│ │     │  "{commitmentText}"                                            │       │ │
│ │     └────────────────────────────────────────────────────────────────┘       │ │
│ └──────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│ WHY SIGNED (if whySigned exists)                                                 │
│ ┌──────────────────────────────────────────────────────────────────────────────┐ │
│ │     Why I signed:                                                            │ │
│ │     "{whySigned}"                                                            │ │
│ └──────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│ UPVOTE COUNT                                                                     │
│ ┌──────────────────────────────────────────────────────────────────────────────┐ │
│ │                            ▲ {upvoteCount} upvotes                           │ │
│ └──────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│ ─────────────────────────────────────────────────────────────────────────────── │
│                                                                                  │
│ REFERRAL SECTION                                                                 │
│ ┌──────────────────────────────────────────────────────────────────────────────┐ │
│ │                                                                              │ │
│ │     {referralCount > 0}:                                                     │ │
│ │       "{firstName} has inspired {referralCount} others to sign."             │ │
│ │                                                                              │ │
│ │     {referralCount === 0}:                                                   │ │
│ │       "Be the first to join {firstName} in signing."                         │ │
│ │                                                                              │ │
│ │                         [ Add your name ]                                    │ │
│ │                                                                              │ │
│ └──────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│ ─────────────────────────────────────────────────────────────────────────────── │
│                                                                                  │
│ FOOTER CTA                                                                       │
│ ┌──────────────────────────────────────────────────────────────────────────────┐ │
│ │                                                                              │ │
│ │                {totalCount} founders have signed the letter.                 │ │
│ │                                                                              │ │
│ │                       [ See all commitments ]                                │ │
│ │                                                                              │ │
│ └──────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Key Visual Notes

1. **Header**: Minimal wordmark top-left, single CTA button top-right
2. **Profile**: Centered name (large, bold) with title/company below (muted)
3. **Commitment**: Styled as a prominent blockquote - the visual centerpiece
4. **Why Signed**: Secondary text, slightly muted, shown only if provided
5. **Upvote Count**: Displayed as "▲ X upvotes" - not interactive on this page
6. **Referral Section**: Dynamic text based on referral count, with prominent CTA
7. **Footer**: Total signatory count with link to commitments page
8. **Separators**: Subtle horizontal rules between sections
9. **Whitespace**: Generous padding throughout for the manifesto aesthetic
