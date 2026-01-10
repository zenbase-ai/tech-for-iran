# Step 10: Dynamic OG Image Generation

Generate personalized Open Graph images for each signatory using `@vercel/og`. These images appear when someone shares their unique signatory URL (`/s/[signatory_id]`) on social media platforms like Twitter/X, LinkedIn, and Facebook.

## Overview

When a signatory shares their pledge, the shared link should display a visually compelling preview image that showcases their name, title, company, and their "100 days" commitment. This personalization increases shareability and social proof.

## OG Image Design

The OG image follows the manifesto aesthetic: clean, typographic, and weighty.

**Layout Structure:**
- Header: "TECH FOR IRAN" branding at the top with letter spacing
- Horizontal divider line
- Content area: Signatory's name (large, bold), title and company (smaller, gray), and their commitment text in quotes
- Footer divider line
- Footer: "techforiran.com" URL

**Specifications:**
- Size: 1200x630 pixels (standard OG image dimensions)
- Style: Matches the manifesto aesthetic - clean, typographic, weighty
- Content hierarchy: Name is the largest element, followed by title/company, then commitment
- Branding: "TECH FOR IRAN" at top, URL at bottom
- Color scheme: Clean white background with black text and gray accents

**Content Variations:**
- If the signatory has a commitment: Display their commitment text in quotes
- If the signatory skipped the commitment: Display "Signed the letter."
- Long commitments should be truncated with ellipsis (around 200 characters max)

## Files to Create

- `src/app/s/[id]/opengraph-image.tsx` - Dynamic per-signatory OG image
- `src/app/opengraph-image.tsx` - Site-wide default OG image for home and commitments pages
- `src/app/s/[id]/_default-og.tsx` - Fallback component for invalid signatory IDs

## Default OG Images

**Site-wide default** (for `/` and `/commitments`):
- Large "TECH FOR IRAN" heading
- Subtitle: "An open letter from founders, investors, and operators pledging to do business with a free Iran."
- URL at bottom

**Signatory fallback** (for invalid signatory IDs):
- Same as site-wide default
- Prevents broken preview images when a signatory is not found

## Twitter Card Support

The signatory share page metadata should include Twitter card configuration:
- Card type: "summary_large_image"
- Title: "[Name] signed Tech for Iran"
- Description: First 200 characters of their commitment, or "Signed the letter."
- The OG image is automatically used by Next.js for the Twitter card image

## Custom Fonts

For visual consistency with the main site, load the same fonts used in the manifesto:
- Bold weight for headings and names
- Regular weight for body text
- Fonts should be bundled with the app (not fetched from CDN on each request) for performance

## Performance Considerations

- Use Edge runtime for fast image generation
- Images are automatically cached by Vercel CDN
- Bundle font files to avoid per-request fetches
- Truncate long text to prevent layout overflow and ensure consistent appearance

---

## UX / UI

**User Experience Goals:**
- When a signatory shares their unique URL on social media, the preview should immediately communicate who they are and what they committed to
- The image should be visually appealing enough that people want to click through
- The design should feel consistent with the main site's serious, typographic aesthetic

**Visual Hierarchy:**
1. The signatory's name should be the most prominent element
2. Their title and company provide credibility context
3. Their commitment (the "star" content) is the call to action
4. Branding is present but not overwhelming

**Shareability Considerations:**
- The image should be "screenshot-able" - clean enough that people might screenshot and share just the image
- Text should be large enough to read on mobile feeds
- Adequate whitespace ensures the content doesn't feel cramped in social media cards

**Consistency:**
- The OG image typography and spacing should echo the manifesto page aesthetic
- Same color palette (black, white, grays) as the main site
- The "TECH FOR IRAN" branding should match the site header treatment

---

## How It Works

1. **Route Setup**: Next.js App Router's special `opengraph-image.tsx` file convention automatically handles OG image generation for a route.

2. **Image Request Flow**: When a social media platform or browser requests the OG image for `/s/knejatian`, Next.js routes the request to `src/app/s/[id]/opengraph-image.tsx`.

3. **Data Fetching**: The OG image handler extracts the signatory ID from the URL params, then fetches the signatory's data (name, title, company, commitment) from Convex.

4. **Fallback Handling**: If the signatory is not found (invalid ID), the handler returns a generic "Tech for Iran" default image instead of an error.

5. **Image Generation**: Using `@vercel/og`'s `ImageResponse`, the handler renders JSX-to-PNG using Satori. The JSX defines the layout with inline styles (CSS-in-JS, similar to React Native styling).

6. **Font Loading**: Custom fonts are loaded as array buffers and passed to the ImageResponse options to ensure typography matches the site.

7. **Text Truncation**: Long commitment text is truncated with ellipsis to prevent overflow and maintain visual balance.

8. **Edge Runtime**: The function runs on Vercel's Edge Runtime for fast cold starts and global distribution.

9. **Caching**: Vercel CDN caches the generated images. The image only regenerates if the signatory data changes or cache is invalidated.

10. **Social Media Integration**: When platforms like Twitter, LinkedIn, or Facebook scrape the signatory page, they request the OG image URL from the page's meta tags. Next.js automatically includes the correct meta tags pointing to the generated image.

---

## Verification Plan

### Local Development Testing

1. **Direct Image Access**: Navigate directly to `/s/[valid-id]/opengraph-image` in the browser to see the generated PNG image. Verify:
   - The image renders without errors
   - The signatory's name, title, company, and commitment are displayed correctly
   - Typography and spacing look correct
   - Text truncation works for long commitments

2. **Invalid ID Fallback**: Navigate to `/s/invalid-id-12345/opengraph-image` and verify the default fallback image renders.

3. **Site Default OG**: Navigate to `/opengraph-image` to verify the site-wide default image renders correctly.

### Social Media Preview Testing

4. **OpenGraph Preview Tool**: Use https://www.opengraph.xyz/ to test the deployed URLs:
   - Test `/` for the default site OG image
   - Test `/s/[signatory-id]` for a personalized OG image
   - Verify image dimensions are 1200x630

5. **Twitter Card Validator**: Use Twitter's Card Validator (https://cards-dev.twitter.com/validator) to verify:
   - Card type is "summary_large_image"
   - Title, description, and image appear correctly

6. **LinkedIn Post Inspector**: Use LinkedIn's Post Inspector (https://www.linkedin.com/post-inspector/) to verify the OG image appears correctly for LinkedIn shares.

### Edge Cases

7. **Signatory Without Commitment**: Create or find a signatory who skipped the commitment step. Verify their OG image shows "Signed the letter." instead of a commitment.

8. **Long Commitment Text**: Create or find a signatory with a very long commitment (300+ characters). Verify the text is truncated with ellipsis and doesn't overflow.

9. **Special Characters**: Test with signatory names/commitments containing special characters, quotes, and non-ASCII characters (e.g., Persian text).

### Performance Verification

10. **Response Time**: Check that the OG image generation completes quickly (under 500ms for cached, under 2s for uncached).

11. **Cache Behavior**: Request the same OG image twice and verify the second request is served from cache (check response headers for cache hit indicators).

---

## ASCII Mockups

### Signatory OG Image with Commitment (1200x630)

This is the primary OG image shown when a signatory shares their unique URL and has provided a "100 days" commitment.

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                    1200px          │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                              │  │
│  │                                                                                              │  │
│  │                                    T E C H   F O R   I R A N                                 │  │
│  │                                         (tracked caps)                                       │  │
│  │                                                                                              │  │
│  │  ────────────────────────────────────────────────────────────────────────────────────────── │  │
│  │                                                                                              │  │
│  │                                                                                              │  │
│  │                                                                                              │  │
│  │                                      Kaz Nejatian                                            │  │
│  │                                  (36px bold, black)                                          │  │
│  │                                                                                              │  │
│  │                                      CEO, Opendoor                                           │  │
│  │                                   (20px regular, gray)                                       │  │
│  │                                                                                              │  │
│  │                                                                                              │  │ 630px
│  │                    "In the first 100 days, I commit to launching                             │  │
│  │                     a $100M seed fund focused on Iranian founders."                          │  │
│  │                                                                                              │  │
│  │                                 (24px regular, dark gray, quoted)                            │  │
│  │                                                                                              │  │
│  │                                                                                              │  │
│  │                                                                                              │  │
│  │  ────────────────────────────────────────────────────────────────────────────────────────── │  │
│  │                                                                                              │  │
│  │                                      techforiran.com                                         │  │
│  │                                     (16px, medium gray)                                      │  │
│  │                                                                                              │  │
│  └──────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                    │
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Visual Hierarchy:**
1. **Branding** (top): "TECH FOR IRAN" - letter-spaced, uppercase, medium weight
2. **Name** (center-top): Largest element, bold weight
3. **Title & Company** (below name): Smaller, gray color for secondary information
4. **Commitment** (center): In quotes, comfortable reading size
5. **URL** (footer): Subtle but present for attribution

---

### Signatory OG Image without Commitment (1200x630)

When a signatory signed but skipped the commitment step.

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                    1200px          │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                              │  │
│  │                                                                                              │  │
│  │                                    T E C H   F O R   I R A N                                 │  │
│  │                                         (tracked caps)                                       │  │
│  │                                                                                              │  │
│  │  ────────────────────────────────────────────────────────────────────────────────────────── │  │
│  │                                                                                              │  │
│  │                                                                                              │  │
│  │                                                                                              │  │
│  │                                                                                              │  │
│  │                                      Jane Smith                                              │  │
│  │                                  (36px bold, black)                                          │  │
│  │                                                                                              │  │
│  │                                  VP Engineering, Stripe                                      │  │
│  │                                   (20px regular, gray)                                       │  │
│  │                                                                                              │  │ 630px
│  │                                                                                              │  │
│  │                                    Signed the letter.                                        │  │
│  │                                   (24px regular, gray)                                       │  │
│  │                                                                                              │  │
│  │                                                                                              │  │
│  │                                                                                              │  │
│  │                                                                                              │  │
│  │  ────────────────────────────────────────────────────────────────────────────────────────── │  │
│  │                                                                                              │  │
│  │                                      techforiran.com                                         │  │
│  │                                     (16px, medium gray)                                      │  │
│  │                                                                                              │  │
│  └──────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                    │
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Differences from commitment version:**
- No quoted text block
- Simple "Signed the letter." message in place of commitment
- Slightly more vertical whitespace around name/title area
- Less visual weight overall (intentional - we want to incentivize commitments)

---

### Default/Fallback OG Image (1200x630)

Used for the home page (`/`), commitments page (`/commitments`), and as fallback for invalid signatory IDs.

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                    1200px          │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                              │  │
│  │                                                                                              │  │
│  │                                                                                              │  │
│  │                                                                                              │  │
│  │                                                                                              │  │
│  │                                                                                              │  │
│  │                                                                                              │  │
│  │                                    T E C H   F O R   I R A N                                 │  │
│  │                                       (48px, bold, tracked)                                  │  │
│  │                                                                                              │  │
│  │                                                                                              │  │
│  │                         An open letter from founders, investors,                             │  │ 630px
│  │                       and operators pledging to do business with                             │  │
│  │                                       a free Iran.                                           │  │
│  │                                                                                              │  │
│  │                                   (24px regular, dark gray)                                  │  │
│  │                                                                                              │  │
│  │                                                                                              │  │
│  │                                                                                              │  │
│  │                                                                                              │  │
│  │  ────────────────────────────────────────────────────────────────────────────────────────── │  │
│  │                                                                                              │  │
│  │                                      techforiran.com                                         │  │
│  │                                     (16px, medium gray)                                      │  │
│  │                                                                                              │  │
│  └──────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                    │
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Design notes:**
- Headline "TECH FOR IRAN" is the hero element - larger than on signatory images
- No horizontal dividers above headline (cleaner for hero treatment)
- Subtitle explains the purpose succinctly
- Single footer divider + URL
- Vertically centered content area

---

### Long Commitment Truncation Example (1200x630)

When a signatory's commitment exceeds ~200 characters, truncate with ellipsis.

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                    1200px          │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                              │  │
│  │                                                                                              │  │
│  │                                    T E C H   F O R   I R A N                                 │  │
│  │                                                                                              │  │
│  │  ────────────────────────────────────────────────────────────────────────────────────────── │  │
│  │                                                                                              │  │
│  │                                                                                              │  │
│  │                                      Ali Mohammadi                                           │  │
│  │                                                                                              │  │
│  │                                    Founder, TechCorp                                         │  │
│  │                                                                                              │  │
│  │                                                                                              │  │
│  │                   "I commit to opening our first Middle East office in                       │  │ 630px
│  │                    Tehran within 60 days, hiring a team of 50 engineers                      │  │
│  │                    from Sharif University, and establishing partnerships                     │  │
│  │                    with local tech accelerators to mentor..."                                │  │
│  │                                                                                 ↑            │  │
│  │                                                              (truncated at ~200 chars)       │  │
│  │                                                                                              │  │
│  │  ────────────────────────────────────────────────────────────────────────────────────────── │  │
│  │                                                                                              │  │
│  │                                      techforiran.com                                         │  │
│  │                                                                                              │  │
│  └──────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                    │
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Truncation rules:**
- Maximum ~200 characters of commitment text
- Truncate at word boundary when possible
- Always end with ellipsis ("...")
- Commitment is still in quotes, ellipsis inside the closing quote

---

### Spacing & Layout Grid

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ←─────────────────────────────────── 1200px ───────────────────────────────────→                   │
│                                                                                                    │
│ ↑ 48px padding                                                                                     │
│                                                                                                    │
│ ├────────────────────────────────────────────────────────────────────────────────────────────────┤ │
│ │                           TECH FOR IRAN (branding zone)                                        │ │
│ ├────────────────────────────────────────────────────────────────────────────────────────────────┤ │
│                                                                                                    │
│ ↕ 24px gap                                                                                         │
│                                                                                                    │
│ ══════════════════════════════════════════════════════════════════════════════════════════════════ │
│ (horizontal rule - 1px, gray-300)                                                                  │
│                                                                                                    │
│ ↕ 40px gap                                                                                         │
│                                                                                                    │
│ ├────────────────────────────────────────────────────────────────────────────────────────────────┤ │
│ │                              CONTENT ZONE                                                      │ │
│ │                                                                                                │ │  630px
│ │     Name (36px, bold, line-height: 1.2)                                                        │ │  total
│ │     ↕ 8px                                                                                      │ │  height
│ │     Title, Company (20px, gray-500, line-height: 1.4)                                          │ │
│ │     ↕ 32px                                                                                     │ │
│ │     "Commitment text here..." (24px, gray-700, line-height: 1.5, max-width: 900px)             │ │
│ │                                                                                                │ │
│ ├────────────────────────────────────────────────────────────────────────────────────────────────┤ │
│                                                                                                    │
│ ↕ 40px gap                                                                                         │
│                                                                                                    │
│ ══════════════════════════════════════════════════════════════════════════════════════════════════ │
│ (horizontal rule - 1px, gray-300)                                                                  │
│                                                                                                    │
│ ↕ 24px gap                                                                                         │
│                                                                                                    │
│ ├────────────────────────────────────────────────────────────────────────────────────────────────┤ │
│ │                           techforiran.com (footer zone)                                        │ │
│ ├────────────────────────────────────────────────────────────────────────────────────────────────┤ │
│                                                                                                    │
│ ↓ 48px padding                                                                                     │
│                                                                                                    │
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Typography specs:**
- Branding: 18px, letter-spacing: 0.2em, font-weight: 600
- Name: 36px, font-weight: 700, color: black
- Title/Company: 20px, font-weight: 400, color: gray-500
- Commitment: 24px, font-weight: 400, color: gray-700, italic style for quotes
- URL: 16px, font-weight: 500, color: gray-400

**Color palette:**
- Background: white (#FFFFFF)
- Text primary: black (#000000)
- Text secondary: gray-500 (#6B7280)
- Text tertiary: gray-400 (#9CA3AF)
- Divider lines: gray-300 (#D1D5DB)

---

### Component Structure

```
src/app/
├── opengraph-image.tsx              ← Default OG (home, commitments)
│   └── Renders: DefaultOGImage
│
└── s/[id]/
    ├── opengraph-image.tsx          ← Signatory OG
    │   ├── Fetches signatory data
    │   ├── If found → SignatoryOGImage
    │   └── If not found → DefaultOGImage (fallback)
    │
    └── _default-og.tsx              ← Shared DefaultOGImage component
```

**Rendering flow:**
```
Request: /s/knejatian/opengraph-image
                │
                ▼
    Extract ID from params
                │
                ▼
    Fetch signatory from Convex
                │
        ┌───────┴───────┐
        │               │
        ▼               ▼
    Found?           Not found?
        │               │
        ▼               ▼
  Render with       Render default
  signatory data    fallback image
        │               │
        └───────┬───────┘
                │
                ▼
    Return ImageResponse (PNG)
```
