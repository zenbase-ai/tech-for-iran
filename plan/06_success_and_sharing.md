# Step 6: Success State & Sharing

Build the post-sign success experience with share functionality.

## Overview

After a user successfully verifies their phone and signs the letter, they see a celebratory success state that encourages sharing. This is a critical moment for viral growth - the user has just made a commitment and is most likely to share it now.

## Success State Layout

The success screen displays:

1. A checkmark icon confirming successful signing
2. Message: "You've signed the letter."
3. Social proof: "Join X founders ready for a free Iran." (live count)
4. A "Share your pledge" card with their unique URL and copy button
5. Social share buttons for Twitter/X and LinkedIn with pre-filled text
6. A separator followed by a "See all commitments" CTA linking to `/commitments`

## Components to Build

### SuccessStep Component

The main success step component that appears after phone verification completes. It:

- Fetches the newly created signatory data to personalize the share text
- Fetches the total signatory count for social proof
- Constructs the unique share URL using the signatory ID
- Renders the celebratory UI with share options

### ShareUrlCard Component

A card component displaying the shareable URL with a copy-to-clipboard button:

- Shows the full share URL (e.g., `techforiran.com/s/abc123`)
- Copy button that copies URL to clipboard
- Visual feedback when copied (button text changes to checkmark briefly)

### SocialShareButtons Component

Share buttons for Twitter/X and LinkedIn with contextual pre-filled text:

- Twitter/X: Opens intent URL with pre-filled tweet text
- LinkedIn: Opens share dialog with the URL

## Share Text Variations

### Twitter/X

- **With commitment**: "I just signed Tech for Iran - committing to "{commitment truncated to 100 chars}" when Iranians are free. Join me: {url}"
- **Without commitment**: "I just signed Tech for Iran - pledging to invest, hire, and build when Iranians are free. Join me: {url}"

### LinkedIn

- More professional tone
- Include brief description of the movement
- Mention the specific commitment if present (truncated to 200 chars)

## Backend: Aggregate Query for Total Count

Create a `count` query in the signatories functions that returns the total number of signatories. Use a Convex aggregate for O(1) reads rather than counting documents on each request.

Set up:

- A `signatoryCount` aggregate in `src/convex/aggregates.ts`
- A corresponding trigger in `src/convex/triggers.ts` that updates the count when signatories are added/removed

## Files to Create/Modify

- `src/app/_sign-flow/steps/success-step.tsx` - Main success step component
- `src/components/share-url-card.tsx` - URL display with copy button
- `src/components/social-share-buttons.tsx` - Twitter/X and LinkedIn share buttons
- Update `src/convex/aggregates.ts` with signatory count aggregate
- Update `src/convex/triggers.ts` with signatory count trigger
- Update `src/convex/fns/signatories.ts` with count query

## Analytics (Optional)

Track share button clicks via PostHog to understand which platforms drive the most referrals:

- Event: `share_clicked`
- Properties: `platform`, `signatoryId`, `hasCommitment`

---

## UX / UI

### Visual Design

- **Celebratory but restrained**: The success state should feel like a meaningful moment without being over-the-top. A simple checkmark in a subtle green circle conveys success without fireworks.
- **Animation**: Use a gentle fade-in animation (around 700ms) to make the transition feel smooth and intentional.
- **Typography hierarchy**: The "You've signed the letter" message should be prominent (larger heading), with the social proof count as secondary text in a muted color.
- **Centered layout**: All content is center-aligned to create a focused, ceremonial feel.

### Share URL Card

- The URL should be displayed in a monospace/code font to look like a technical link
- Truncate the URL visually if needed, but copy the full URL
- The copy button should be clearly clickable and provide immediate feedback
- Consider showing "Copied!" text or a checkmark icon for 2 seconds after copying

### Social Share Buttons

- Use outline variant buttons to keep them secondary to the main success message
- Include platform icons (X logo, LinkedIn logo) alongside text labels
- Buttons should open in new tabs (`target="_blank"`)
- Equal sizing and spacing between buttons

### Mobile Considerations

- Stack share buttons vertically on narrow screens
- Ensure the share URL is readable but can truncate with ellipsis
- Touch targets should be at least 44px for easy tapping

### Emotional Journey

The user just completed a meaningful action. The UI should:

1. Validate their decision ("You've signed the letter.")
2. Connect them to community ("Join X founders...")
3. Empower them to spread the message (share tools)
4. Provide a clear next step ("See all commitments")

---

## How It Works

### User Flow

1. User completes phone verification in the sign flow
2. The sign flow component transitions to the success step, passing the newly created `signatoryId`
3. SuccessStep component mounts and initiates two queries:
   - Fetch the signatory's data (name, commitment text) for personalized share text
   - Fetch the total signatory count for the social proof message
4. The share URL is constructed client-side using the environment variable for the app URL combined with the signatory ID
5. User can copy their unique URL or click social share buttons
6. Social share buttons construct platform-specific URLs with pre-encoded share text and open in new tabs

### Technical Flow

1. **State Transition**: The parent sign flow component manages step state. Upon successful phone verification, it receives the new signatory ID and transitions to rendering SuccessStep.

2. **Data Fetching**: SuccessStep uses Convex `useQuery` hooks to fetch:
   - `api.fns.signatories.get` with the signatory ID
   - `api.fns.signatories.count` for the total count

3. **Aggregate Counter**: The total count uses a Convex aggregate for performance:
   - TableAggregate tracks signatory count with O(1) reads
   - A trigger automatically increments/decrements when signatories are added/removed
   - This avoids scanning the entire table on every page load

4. **Clipboard API**: The copy button uses `navigator.clipboard.writeText()` to copy the URL, with a local state flag to show "Copied" feedback temporarily.

5. **Share URLs**:
   - Twitter: `https://twitter.com/intent/tweet?text={encodedText}&url={encodedUrl}`
   - LinkedIn: `https://www.linkedin.com/sharing/share-offsite/?url={encodedUrl}`

### Data Dependencies

- `signatoryId`: Required prop passed from the sign flow upon successful verification
- `signatory.name`: Used to personalize share text (optional fallback if loading)
- `signatory.commitmentText`: Used to customize share message (handled gracefully if null)
- `totalCount`: Displayed in social proof message

---

## Verification Plan

### Prerequisites

- Complete Steps 1-5 (manifesto, sign flow, phone verification, signatory creation)
- Have a test phone number that can receive SMS
- Have access to Twitter and LinkedIn accounts for share testing

### Manual Testing Steps

1. **Complete the Sign Flow**
   - Navigate to the home page
   - Fill out all sign flow fields (name, title, company, optional why/commitment)
   - Enter phone number and verify with SMS code
   - Confirm the success state appears after verification

2. **Verify Success State Content**
   - Checkmark icon is visible and styled correctly (green circle background)
   - "You've signed the letter." heading is displayed
   - Social proof message shows the correct count ("Join X founders...")
   - The count should be a real number from the database, not a placeholder

3. **Test Share URL Card**
   - Verify your unique URL is displayed (format: `{APP_URL}/s/{signatoryId}`)
   - Click the "Copy" button
   - Verify the button shows feedback (checkmark or "Copied!" text)
   - Paste somewhere to confirm the full URL was copied correctly
   - Verify the URL works by opening it in a new tab (should show the signatory share page)

4. **Test Twitter/X Share**
   - Click the "Share on X" button
   - Verify it opens Twitter's compose tweet page in a new tab
   - Verify the pre-filled text includes your commitment (if you entered one)
   - Verify the share URL is included in the tweet
   - Optionally post the tweet and verify the link works

5. **Test LinkedIn Share**
   - Click the "Share on LinkedIn" button
   - Verify it opens LinkedIn's share dialog in a new tab
   - Verify the URL is pre-filled
   - Optionally share and verify the post

6. **Test "See all commitments" Link**
   - Click the "See all commitments" button
   - Verify it navigates to `/commitments`

7. **Test Variations**
   - Sign again with a different phone number, this time skipping the commitment
   - Verify the share text variation for "without commitment" is used
   - Verify the success state still works correctly

8. **Verify Aggregate Count**
   - Note the count shown after first signing
   - Sign with another phone number
   - Verify the count has incremented by 1 on the new success screen

### Edge Cases to Test

- **Slow network**: Verify loading states while signatory data and count are fetching
- **Copy fails**: Test behavior if clipboard API is unavailable (older browsers)
- **Very long commitment**: Verify share text truncation works correctly
- **Mobile viewport**: Verify layout is responsive and buttons are easily tappable

### Automated Testing Suggestions

- Unit test ShareUrlCard copy functionality with mocked clipboard API
- Unit test SocialShareButtons URL construction with various commitment lengths
- Integration test the signatory count aggregate increments correctly

---

## ASCII Mockups

### Full Success State Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                                                                             │
│                              ┌─────────┐                                    │
│                              │         │                                    │
│                              │    ✓    │  ← Green circle with               │
│                              │         │    white checkmark                 │
│                              └─────────┘                                    │
│                                                                             │
│                                                                             │
│                       You've signed the letter.                             │
│                                                                             │
│                  Join 1,247 founders ready for a free Iran.                 │
│                              ↑                                              │
│                         (live count from aggregate)                         │
│                                                                             │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                                                                     │   │
│   │  Share your pledge                                                  │   │
│   │                                                                     │   │
│   │  ┌───────────────────────────────────────────────┬─────────────┐    │   │
│   │  │                                               │             │    │   │
│   │  │  techforiran.com/s/abc123                     │  Copy Link  │    │   │
│   │  │         ↑                                     │             │    │   │
│   │  │   (monospace font, truncate if long)          └─────────────┘    │   │
│   │  │                                                                  │   │
│   │  └──────────────────────────────────────────────────────────────────┘   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│                                                                             │
│   ┌───────────────────────┐       ┌───────────────────────┐                 │
│   │                       │       │                       │                 │
│   │   𝕏  Share on X       │       │  in  Share on LinkedIn │                 │
│   │                       │       │                       │                 │
│   └───────────────────────┘       └───────────────────────┘                 │
│          ↑                                    ↑                             │
│     (outline variant)                   (outline variant)                   │
│                                                                             │
│                                                                             │
│   ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│                                                                             │
│                       [ See all commitments → ]                             │
│                                                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Success Confirmation Header (Zoomed)

```
                              ┌─────────────────┐
                              │                 │
                              │    ╭─────────╮  │
                              │    │         │  │
                              │    │    ✓    │  │  ← Subtle green (#22c55e)
                              │    │         │  │    background circle
                              │    ╰─────────╯  │    with white checkmark
                              │                 │
                              └─────────────────┘

                         You've signed the letter.
                                    │
                                    ▼
                    ┌─────────────────────────────────┐
                    │   (text-2xl or text-3xl)        │
                    │   (font-semibold)               │
                    │   (centered)                    │
                    └─────────────────────────────────┘

                Join 1,247 founders ready for a free Iran.
                                    │
                                    ▼
                    ┌─────────────────────────────────┐
                    │   (text-muted-foreground)       │
                    │   (text-base or text-lg)        │
                    │   (centered)                    │
                    └─────────────────────────────────┘
```

### Share URL Card (Zoomed)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   Share your pledge                                                         │
│        │                                                                    │
│        └─► (text-sm, text-muted-foreground, uppercase tracking-wide)        │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                                                                     │   │
│   │   techforiran.com/s/knejatian                          ┌─────────┐  │   │
│   │            │                                           │  Copy   │  │   │
│   │            │                                           │  Link   │  │   │
│   │            │                                           └─────────┘  │   │
│   │            │                                                 │      │   │
│   │            └─► (font-mono, text-sm)                          │      │   │
│   │                                                              │      │   │
│   │                                                              ▼      │   │
│   │                                              (button variant="ghost")   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   Border: border rounded-lg                                                 │
│   Background: bg-muted/50 or bg-card                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Copy Button States

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   STATE: Default                                                            │
│   ┌─────────────────┐                                                       │
│   │                 │                                                       │
│   │   📋  Copy Link │  ← Clipboard icon + "Copy Link" text                  │
│   │                 │                                                       │
│   └─────────────────┘                                                       │
│                                                                             │
│   ─────────────────────────────────────────────────────────────────────     │
│                                                                             │
│   STATE: Copied (show for ~2 seconds)                                       │
│   ┌─────────────────┐                                                       │
│   │                 │                                                       │
│   │   ✓   Copied!   │  ← Green checkmark + "Copied!" text                   │
│   │                 │     (text-green-600)                                  │
│   └─────────────────┘                                                       │
│                                                                             │
│   ─────────────────────────────────────────────────────────────────────     │
│                                                                             │
│   STATE: Hover                                                              │
│   ┌─────────────────┐                                                       │
│   │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  ← bg-accent                                         │
│   │▓  📋  Copy Link ▓│                                                       │
│   │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│                                                       │
│   └─────────────────┘                                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Social Share Buttons (Zoomed)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   Desktop Layout (side by side)                                             │
│                                                                             │
│   ┌─────────────────────────┐   ┌─────────────────────────┐                 │
│   │                         │   │                         │                 │
│   │   𝕏   Share on X        │   │  in   Share on LinkedIn │                 │
│   │   │                     │   │   │                     │                 │
│   │   └─► X/Twitter icon    │   │   └─► LinkedIn icon     │                 │
│   │                         │   │                         │                 │
│   └─────────────────────────┘   └─────────────────────────┘                 │
│                                                                             │
│   Button specs:                                                             │
│   - variant="outline"                                                       │
│   - Equal widths (flex-1 in a flex container)                               │
│   - gap-2 or gap-3 between icon and text                                    │
│   - Opens in new tab (target="_blank")                                      │
│                                                                             │
│   ─────────────────────────────────────────────────────────────────────     │
│                                                                             │
│   Mobile Layout (stacked vertically)                                        │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────┐               │
│   │                                                         │               │
│   │              𝕏   Share on X                              │               │
│   │                                                         │               │
│   └─────────────────────────────────────────────────────────┘               │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────┐               │
│   │                                                         │               │
│   │             in   Share on LinkedIn                      │               │
│   │                                                         │               │
│   └─────────────────────────────────────────────────────────┘               │
│                                                                             │
│   Responsive: flex-col on mobile, flex-row on sm:                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Mobile Viewport (Complete Success State)

```
┌─────────────────────────────────┐
│                                 │
│         ┌─────────┐             │
│         │    ✓    │             │
│         └─────────┘             │
│                                 │
│   You've signed the letter.     │
│                                 │
│   Join 1,247 founders ready     │
│        for a free Iran.         │
│                                 │
│                                 │
│  ┌───────────────────────────┐  │
│  │                           │  │
│  │  Share your pledge        │  │
│  │                           │  │
│  │  ┌─────────────────────┐  │  │
│  │  │ techforiran.com/s/  │  │  │
│  │  │ abc123...           │  │  │
│  │  └─────────────────────┘  │  │
│  │                           │  │
│  │    ┌─────────────────┐    │  │
│  │    │    Copy Link    │    │  │
│  │    └─────────────────┘    │  │
│  │                           │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │     𝕏   Share on X        │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │    in  Share on LinkedIn  │  │
│  └───────────────────────────┘  │
│                                 │
│  ─────────────────────────────  │
│                                 │
│    [ See all commitments → ]    │
│                                 │
│                                 │
└─────────────────────────────────┘
```

### Animation Sequence

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   T=0ms: Component mounts                                                   │
│   ┌───────────────────────────────────────────────────────────┐             │
│   │                                                           │             │
│   │                    (empty / loading)                      │             │
│   │                                                           │             │
│   └───────────────────────────────────────────────────────────┘             │
│                                                                             │
│   T=100ms: Fade in begins (opacity: 0 → 1, duration: 700ms)                 │
│   ┌───────────────────────────────────────────────────────────┐             │
│   │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│             │
│   │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│             │
│   │░░░░░░░░░░░░░░░░░░░░  ✓  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│             │
│   │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│             │
│   │░░░░░░░░░░░ You've signed the letter. ░░░░░░░░░░░░░░░░░░░░░│             │
│   │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│             │
│   └───────────────────────────────────────────────────────────┘             │
│                                                                             │
│   T=800ms: Fully visible                                                    │
│   ┌───────────────────────────────────────────────────────────┐             │
│   │                           ✓                               │             │
│   │                                                           │             │
│   │                 You've signed the letter.                 │             │
│   │                                                           │             │
│   │           Join 1,247 founders ready for a free Iran.      │             │
│   │                                                           │             │
│   │              [Share URL Card + Buttons]                   │             │
│   └───────────────────────────────────────────────────────────┘             │
│                                                                             │
│   CSS: transition-opacity duration-700 ease-out                             │
│   Or: motion/framer-motion with { opacity: 0 } → { opacity: 1 }             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
SuccessStep
│
├── <div> (container, text-center)
│   │
│   ├── <CheckCircle2 /> (lucide-react icon)
│   │   └── size: 64px, color: green-500
│   │
│   ├── <h2> "You've signed the letter."
│   │
│   └── <p> "Join {count} founders ready for a free Iran."
│
├── <ShareUrlCard signatoryId={id} />
│   │
│   ├── <span> "Share your pledge"
│   │
│   └── <div> (URL display container)
│       ├── <code> "{APP_URL}/s/{signatoryId}"
│       └── <Button> Copy Link (variant="ghost")
│
├── <SocialShareButtons signatory={signatory} />
│   │
│   ├── <Button> Share on X (variant="outline")
│   │   └── Opens: twitter.com/intent/tweet?text=...&url=...
│   │
│   └── <Button> Share on LinkedIn (variant="outline")
│       └── Opens: linkedin.com/sharing/share-offsite/?url=...
│
├── <Separator />
│
└── <Link href="/commitments">
    └── <Button> See all commitments (variant="link")
```
