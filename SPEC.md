# Tech for Iran — Product & Design Specification

## What This Is

A viral pledge website where tech founders, investors, and operators sign an open letter committing to do business with a free Iran. The site has two core experiences:

1. **The Manifesto + Sign Flow** — Read the letter, sign it, optionally add your "100 days" commitment
2. **The Wall of Commitments** — Browse, upvote, and share what others have pledged to do

The goal is to create social proof that serious capital and talent is waiting for a post-Islamic Republic Iran. This is both a political signal and a future-facing Schelling point for the diaspora business community.

---

## Site Structure

```
/                   → Manifesto + Sign Flow (home)
/commitments        → Wall of Commitments (browsable grid)
/s/[signatory_id]   → Individual signatory share page (dynamic OG image)
```

---

## Page 1: The Manifesto + Sign Flow

### URL: `/`

This is a single long-scroll page with two sections: the manifesto (read) and the sign flow (act).

---

### Section 1: The Manifesto

**Visual Design:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                                                                             │
│                            TECH FOR IRAN                                    │
│                                                                             │
│                   An open letter from founders,                             │
│                      investors, and operators.                              │
│                                                                             │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    We are builders.                                                         │
│                                                                             │
│    Many of us were born in Iran, or are children of those who fled.        │
│    We've seen what Iranians create when barriers fall — in Silicon         │
│    Valley, in Toronto, in London, in Berlin, in Tel Aviv.                  │
│                                                                             │
│    Iran has 90 million people. A median age of 32. One of the highest      │
│    rates of engineering graduates on Earth. A civilization that has        │
│    been inventing things for three thousand years.                         │
│                                                                             │
│    We believe a free Iran will be one of the great economic stories        │
│    of our lifetime.                                                         │
│                                                                             │
│    So we are making a promise:                                              │
│                                                                             │
│    When sanctions lift and Iranians are free to build, trade, and          │
│    connect with the world — we will be ready. To invest. To hire.          │
│    To partner. To build.                                                    │
│                                                                             │
│    We pledge to do business with a free Iran.                              │
│                                                                             │
│                                                                             │
│                         ↓ Sign the letter ↓                                 │
│                                                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Design Notes:**

- Typography-forward. Think: legal document meets Medium post meets manifesto.
- Generous whitespace. Let the words breathe.
- The title "TECH FOR IRAN" should feel weighty — large, maybe all caps, tracked out slightly.
- The manifesto text itself should be in a readable serif or elegant sans-serif. Centered or left-aligned, narrow max-width (600-700px).
- The "Sign the letter" CTA should be subtle but clear — an arrow or gentle scroll prompt.
- No navbar clutter. Maybe a minimal wordmark top-left, that's it.

**Copy Notes:**

- The manifesto above is a draft. It should feel earnest but not saccharine. Confident but not arrogant.
- It should be screenshot-able. Imagine this as the image that gets shared on Twitter/X.
- Keep it short. 150-200 words max. People should be able to read it in 30 seconds.

---

### Section 2: The Sign Flow

The sign flow appears below the manifesto, OR as a smooth scroll-to section when they click "Sign the letter."

**Progressive Disclosure Flow:**

The form reveals itself step by step. Each step slides/fades in after the previous one is engaged with.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                            Sign the Letter                                  │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    I, ___________________________                                           │
│              [Your full name]                                               │
│                                                                             │
│    ______________________________ at ______________________________         │
│           [Your title]                     [Your company]                   │
│                                                                             │
│    sign this letter.                                                        │
│                                                                             │
│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
│    (this section fades in after name/title/company are filled)              │
│                                                                             │
│    Why I'm signing (optional)                                               │
│    ┌────────────────────────────────────────────────────────────────────┐   │
│    │                                                                    │   │
│    │  [Free text, 280 characters max]                                   │   │
│    │                                                                    │   │
│    └────────────────────────────────────────────────────────────────────┘   │
│                                                         0 / 280 characters  │
│                                                                             │
│                                                  [ Skip ] (subtle link)     │
│                                                                             │
│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
│    (this section fades in after they type in "why" OR click skip)           │
│                                                                             │
│    In the first 100 days of a free Iran, I commit to:                       │
│    ┌────────────────────────────────────────────────────────────────────┐   │
│    │                                                                    │   │
│    │  [Free text, no character limit]                                   │   │
│    │                                                                    │   │
│    │  Examples:                                                         │   │
│    │  • "Investing $10M in Iranian startups"                            │   │
│    │  • "Hiring 50 engineers from Tehran"                               │   │
│    │  • "Opening our first Middle East office in Iran"                  │   │
│    │  • "Mentoring 10 first-time founders"                              │   │
│    │                                                                    │   │
│    └────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│                                                  [ Skip ] (subtle link)     │
│                                                                             │
│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
│    (this section fades in after they type commitment OR click skip)         │
│                                                                             │
│    Verify you're human                                                      │
│                                                                             │
│    ┌────────────────────────────────────────────────────────────────────┐   │
│    │  +1  │  (555) 123-4567                                             │   │
│    └────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│    We'll text you a 6-digit code to verify.                                 │
│    Your number is never displayed or shared.                                │
│                                                                             │
│                              [ Send Code ]                                  │
│                                                                             │
│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
│    (this section replaces phone input after they click Send Code)           │
│                                                                             │
│    Enter the code we sent to (555) 123-4567                                 │
│                                                                             │
│           ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐                               │
│           │   │ │   │ │   │ │   │ │   │ │   │                               │
│           └───┘ └───┘ └───┘ └───┘ └───┘ └───┘                               │
│                                                                             │
│                      Didn't get it? Resend (42s)                            │
│                                                                             │
│                           [ Verify & Sign ]                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**UX Notes:**

- The form should feel like a *ceremony*, not a chore. Each reveal is a small moment.
- The "I, [name], sign this letter" framing makes it feel like signing an actual document.
- The placeholder examples in the "100 days" field help people understand what's expected without being prescriptive.
- Phone verification is the trust gate. We use Clerk for the SMS flow but the UI is completely custom (no Clerk components visible).
- After successful verification, the form submits and they see the success state.

---

### Section 3: Success State (after signing)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                                   ✓                                         │
│                                                                             │
│                          You've signed the letter.                          │
│                                                                             │
│                     Join 1,247 founders ready for a free Iran.              │
│                                                                             │
│                                                                             │
│    ┌────────────────────────────────────────────────────────────────────┐   │
│    │                                                                    │   │
│    │  Share your pledge                                                 │   │
│    │                                                                    │   │
│    │  techforiran.com/s/knejatian                                       │ □ │
│    │                                      [Copy Link]                   │   │
│    │                                                                    │   │
│    └────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│        [ Share on 𝕏 ]      [ Share on LinkedIn ]      [ Share on ... ]     │
│                                                                             │
│                                                                             │
│    ───────────────────────────────────────────────────────────────────────  │
│                                                                             │
│                        [ See all commitments → ]                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**UX Notes:**

- The share URL is unique to them: `/s/[signatory_id]` (can be a slug based on name or a short UUID).
- This URL has a dynamically generated OG image (see below).
- The share buttons should have pre-filled copy. Something like:
  - Twitter/X: "I just signed Tech for Iran — pledging to invest, hire, and build when Iranians are free. Join me: [link]"
  - LinkedIn: Similar but slightly more professional tone.
- We track referrals: anyone who signs via this URL is attributed to this signatory.

---

## Page 2: The Wall of Commitments

### URL: `/commitments`

A browsable, filterable, upvotable grid of everyone who has signed — with their "100 days" commitment as the star of each card.

---

### Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  TECH FOR IRAN                                           [ Sign the letter ]│
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                         The Wall of Commitments                             │
│                                                                             │
│           1,247 founders have pledged $2.4B and 12,000 jobs.                │
│                                                                             │
│                                                                             │
│   Sort: [Most upvoted ▼]    Filter: [All categories ▼]                      │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌──────────────  │
│  │ ★ PINNED               │  │ ★ PINNED               │  │               │
│  │                         │  │                         │  │               │
│  │ Dara Khosrowshahi       │  │ Kaz Nejatian            │  │ ...           │
│  │ CEO, Uber               │  │ CEO, Opendoor           │  │               │
│  │                         │  │                         │  │               │
│  │ "Open Uber in Tehran    │  │ "Launch a $100M seed    │  │               │
│  │ within 30 days. Hire    │  │ fund focused on         │  │               │
│  │ 500 drivers in the      │  │ Iranian founders."      │  │               │
│  │ first quarter."         │  │                         │  │               │
│  │                         │  │                         │  │               │
│  │ ▲ 2,847           12h   │  │ ▲ 1,923            2d   │  │               │
│  │                         │  │                         │  │               │
│  └─────────────────────────┘  └─────────────────────────┘  └──────────────  │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌──────────────  │
│  │                         │  │                         │  │               │
│  │ Sarah Chen              │  │ Ali Mohammadi           │  │ ...           │
│  │ Partner, a16z           │  │ Founder, Stealth        │  │               │
│  │                         │  │                         │  │               │
│  │ "Commit $50M to Series  │  │ "Hire 20 engineers      │  │               │
│  │ A/B rounds in Iranian   │  │ from Sharif and         │  │               │
│  │ companies."             │  │ Tehran University."     │  │               │
│  │                         │  │                         │  │               │
│  │ ▲ 412             1d    │  │ ▲ 287              3d   │  │               │
│  │                         │  │                         │  │               │
│  └─────────────────────────┘  └─────────────────────────┘  └──────────────  │
│                                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌──────────────  │
│  │                         │  │                         │  │               │
│  │ ...                     │  │ ...                     │  │ ...           │
│  │                         │  │                         │  │               │
│  └─────────────────────────┘  └─────────────────────────┘  └──────────────  │
│                                                                             │
│                                                                             │
│                            [ Load more ]                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Card Anatomy

Each commitment card shows:

```
┌───────────────────────────────────────┐
│ ★ PINNED (if pinned: true)           │  ← Only for featured signatories
│                                       │
│ Name                                  │
│ Title, Company                        │
│                                       │
│ "Their 100 days commitment text       │
│ goes here, displayed prominently.     │
│ This is the star of the card."        │
│                                       │
│ (optional, collapsed by default)      │
│ Why I signed: "..." [expand]          │
│                                       │
│ ▲ 1,234                       2d ago  │  ← Upvote button + count + timestamp
│                                       │
└───────────────────────────────────────┘
```

**Card States:**

- **Default**: Shows name, title, company, commitment, upvote count.
- **Expanded**: If they have a "why I signed", show a subtle "Why I signed →" link that expands to show the text.
- **Upvoted**: The ▲ arrow fills in or changes color. User can't upvote again.
- **Pinned**: A small "★ PINNED" badge at the top. Pinned cards always appear first, regardless of sort.

**Cards for signatories who skipped the commitment:**

If someone signed but didn't add a "100 days" commitment, their card is simpler:

```
┌───────────────────────────────────────┐
│                                       │
│ Jane Smith                            │
│ VP Engineering, Stripe                │
│                                       │
│ Signed the letter.                    │
│                                       │
│ ▲ 89                          5d ago  │
│                                       │
└───────────────────────────────────────┘
```

These cards are less prominent — maybe slightly smaller or grayed out compared to cards with commitments. We want to incentivize people to add a real commitment.

---

### Sorting & Filtering

**Sort options:**
- Most upvoted (default)
- Most recent

**Filter options:**
- All (only option for MVP)
- (Future: By category — Investment, Hiring, Mentorship, etc. — requires LLM tagging)

For MVP, just implement "Most upvoted" and "Most recent" sorting. Filtering is future roadmap once we have LLM-parsed tags.

---

### Upvoting

- Click the ▲ to upvote.
- One upvote per person per card.
- **Only people who have signed the letter can upvote.** This keeps it high-quality and prevents spam.
- Show a tooltip or modal "Sign the letter to upvote" for non-signatories.
- No downvotes.
- Upvote count updates optimistically (instant UI feedback, then sync with server).

---

## Page 3: Individual Signatory Share Page

### URL: `/s/[signatory_id]`

This is the page that gets shared on social media. It exists primarily to serve a dynamic OG image.

---

### OG Image (dynamically generated)

When someone shares `techforiran.com/s/knejatian`, the OG image should be auto-generated and look something like:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                            TECH FOR IRAN                                    │
│                                                                             │
│─────────────────────────────────────────────────────────────────────────────│
│                                                                             │
│                                                                             │
│                         Kaz Nejatian                                        │
│                        CEO, Opendoor                                        │
│                                                                             │
│                                                                             │
│           "In the first 100 days, I commit to launching                     │
│            a $100M seed fund focused on Iranian founders."                  │
│                                                                             │
│                                                                             │
│─────────────────────────────────────────────────────────────────────────────│
│                                                                             │
│                      techforiran.com                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**OG Image Specs:**
- Size: 1200x630 (standard OG image)
- Style: Matches the manifesto aesthetic. Clean, typographic, weighty.
- Content: Name, title/company, their commitment (or "Signed the letter" if no commitment).
- Branding: "TECH FOR IRAN" at top, URL at bottom.

---

### Page Content

The actual page content (for when someone clicks through, not just sees the preview) should be:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  TECH FOR IRAN                                           [ Sign the letter ]│
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                                                                             │
│                            Kaz Nejatian                                     │
│                           CEO, Opendoor                                     │
│                                                                             │
│                                                                             │
│      "In the first 100 days, I commit to launching a $100M seed fund        │
│       focused on Iranian founders."                                         │
│                                                                             │
│                                                                             │
│      Why I signed:                                                          │
│      "My parents left Iran in 1979. I've spent my whole life wondering      │
│       what could have been. I want to help build what will be."             │
│                                                                             │
│                                                                             │
│                             ▲ 1,923 upvotes                                 │
│                                                                             │
│                                                                             │
│   ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│            Kaz has inspired 47 others to sign the letter.                   │
│                                                                             │
│                        [ Add your name → ]                                  │
│                                                                             │
│                                                                             │
│   ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│                 1,247 founders have signed the letter.                      │
│                       [ See all commitments → ]                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key element: Referral tracking.**

"Kaz has inspired 47 others to sign the letter." — This is the referral count. When someone visits `/s/knejatian` and then signs, we attribute that signup to Kaz.

**How referral tracking works:**
1. When someone visits `/s/[signatory_id]`, store that signatory_id in a cookie or localStorage as `referred_by`.
2. When they complete the sign flow, save `referred_by` on their signatory record.
3. Count how many signatories have `referred_by = [that signatory's id]`.

---

## Data Model

Here's the conceptual data model. Implement in whatever database makes sense.

### Signatory

```
signatory {
  id: string (UUID or short slug like "knejatian")

  // Identity
  name: string
  title: string
  company: string
  phone_hash: string (SHA256 of phone number, for deduping)

  // Content
  why_signed: string | null (max 280 chars)
  commitment_text: string | null

  // Metadata
  pinned: boolean (default false)
  upvote_count: integer (denormalized for fast reads)
  referred_by: string | null (signatory_id of who referred them)

  // Timestamps
  created_at: timestamp

  // Future: LLM-parsed tags (leave as nullable JSON field for now)
  tags: json | null
  // Example structure when populated:
  // { capital_amount: 50000000, capital_currency: "USD", jobs_count: null, category: "investment" }
}
```

### Upvote

```
upvote {
  id: string
  signatory_id: string (who is being upvoted)
  voter_phone_hash: string (who is upvoting — must be a signatory)
  created_at: timestamp

  // Unique constraint on (signatory_id, voter_phone_hash)
}
```

---

## Clerk Integration (Phone Verification)

We use Clerk for phone verification, but with **completely custom UI**. No Clerk components.

**Flow:**

1. User enters phone number in our custom input.
2. We call Clerk's API to send a verification code.
3. User enters the 6-digit code in our custom input.
4. We call Clerk's API to verify the code.
5. On success, we get a user identifier. We hash the phone number (SHA256) and use that as `phone_hash`.

**Important:** The phone number is never stored in plaintext. Only the hash, which is used for:
- Deduplication (prevent same person signing twice)
- Identifying who can upvote (check if voter's phone_hash exists in signatories table)

---

## Visual Design Direction

### Overall Aesthetic

- **Clean and serious.** This is a political statement, not a startup landing page.
- **Typography-forward.** The words matter. Let them breathe.
- **Minimal color.** Black, white, maybe one accent color (could be green — Iranian flag — but subtle).
- **No stock photos.** No illustrations. Just type and space.
- **Mobile-first.** Many people will see this on Twitter/X on their phones.

### Typography

- **Headlines:** A strong, slightly condensed sans-serif. Or a classic serif for gravitas.
- **Body:** Highly readable. 18-20px base size. Generous line height.
- **The manifesto** should feel like something you'd print and hang on a wall.

### Inspiration

- The aesthetic of open letters in newspapers (full-page ads in NYT, etc.)
- gov.uk design system (clean, authoritative, no bullshit)
- Stripe's typography (clear hierarchy, generous spacing)
- Legal documents (the "I, [name], sign this letter" framing)

---

## Edge Cases & Error States

### Duplicate Phone Number

If someone tries to sign with a phone number that's already been used:

> "This phone number has already signed the letter. If this is you and you need to update your information, contact us at [email]."

### Verification Code Expired/Invalid

> "That code didn't work. Please try again or request a new code."

### Empty Commitment Wall

If somehow there are no signatories yet (shouldn't happen after seeding):

> "Be the first to sign the letter."
> [ Sign now → ]

### Failed to Load Commitments

> "Couldn't load commitments. [Try again]"

### Non-signatory tries to upvote

Show tooltip or small modal:

> "Sign the letter to upvote commitments."
> [ Sign now → ]

---

## Aggregate Stats

Display these on the `/commitments` page header (and optionally on home page):

**For MVP:**
- Total signatories count

**Future (after LLM tagging):**
- Total capital pledged (sum of tags.capital_amount in USD)
- Total jobs committed (sum of tags.jobs_count)

---

## Future Roadmap (NOT in MVP)

These are explicitly out of scope for initial build, but the data model should support them:

1. **LLM-parsed tags**: Pass commitment_text to an LLM to extract structured data (capital amount, job count, category). Store in `tags` JSON field.

2. **Interactive timeline**: A `/timeline` page that visualizes commitments on a Day 1 → Day 100 timeline.

3. **Filtering by category**: Once tags are populated, allow filtering the wall by category (Investment, Hiring, Mentorship, etc.).

4. **Admin dashboard**: A simple admin view to:
   - Pin/unpin signatories
   - Edit/remove spam entries
   - View aggregate stats
   - Trigger LLM tagging

5. **Email collection**: Optionally collect email for updates.

---

## Pre-Launch Seeding

Before going live, seed the database with 5-10 "pinned" signatories. These are the marquee names that provide instant credibility. Their cards will always appear first on the wall.

Need: Name, title, company, commitment_text, why_signed (optional) for each.

---

## Summary

Build a two-page site:

1. **Home (/)**: Manifesto + progressive sign flow with phone verification via Clerk (custom UI)
2. **Commitments (/commitments)**: Upvotable wall of commitment cards (sign-to-upvote)

Plus:

3. **Share page (/s/[id])**: Dynamic OG image per signatory + referral tracking

Keep it clean, serious, and typography-forward. Make signing feel like a ceremony. Make the wall feel like social proof that serious people are paying attention.

The vibe: "This is real. These people are ready. Are you?"
