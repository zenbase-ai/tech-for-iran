# Step 2: Manifesto Section

Build the homepage manifesto - the typography-forward "read" experience that serves as the first half of the single-page home experience.

## Design Goals

- **Typography-forward**: Let the words breathe with generous whitespace
- **Screenshot-able**: The manifesto should look good when shared as an image on social media
- **Minimal UI**: No navbar clutter, just a wordmark top-left (if anything)
- **Narrow content**: 600-700px max-width for optimal readability (~60-70 characters per line)
- **Weighty title**: "TECH FOR IRAN" should feel substantial - large, possibly all caps, with slight letter-spacing

## Component Structure

Create the following file structure:

- `src/app/page.tsx` - Server component that renders the client page
- `src/app/page.client.tsx` - Client component with scroll behavior and refs
- `src/app/_manifesto/index.tsx` - ManifestoSection component (the full section)
- `src/app/_manifesto/manifesto-content.tsx` - The actual manifesto text, isolated for easy editing

## Content Requirements

The manifesto section has three parts:

### 1. Header
- Title: "TECH FOR IRAN" - large, weighty, tracked out
- Subtitle: "An open letter from founders, investors, and operators."

### 2. Manifesto Body
The manifesto text from the spec (approximately 150-200 words):
- Opens with "We are builders."
- References the Iranian diaspora and what they've built globally
- Stats about Iran: 90 million people, median age 32, high engineering graduation rate
- Expression of belief in a free Iran's economic potential
- The promise: when sanctions lift, we'll be ready to invest, hire, partner, build
- Closes with: "We pledge to do business with a free Iran."

The body should use a readable serif or elegant sans-serif. Consider using Crimson Pro (already available in the codebase) for gravitas.

### 3. Scroll CTA
- A subtle "Sign the letter" prompt with a downward arrow
- Should feel like an invitation, not a hard sell
- Animated bounce on the arrow to draw attention
- Clicking smoothly scrolls to the sign flow section below

## Typography Notes

- **Title**: Use Inter (existing) at large size with tracking, or another strong sans-serif
- **Subtitle**: Muted color, slightly smaller than body text
- **Body**: Serif font (Crimson Pro) at 18-20px base size with generous line height
- Use Tailwind's `prose` classes for consistent paragraph styling
- Center-aligned or left-aligned body text - either works, but be consistent

## Mobile Considerations

- Text size scales down gracefully on smaller screens (use responsive typography)
- Full viewport height on mobile with scroll prompt visible
- Touch-friendly CTA area (adequate padding around scroll button)
- Maintain generous whitespace even on mobile

---

## UX / UI

### Visual Hierarchy
The manifesto section should dominate the viewport when users first land on the page. It needs to feel like a statement - something worthy of signing. The visual design should evoke:
- Open letters published as full-page ads in newspapers (NYT, etc.)
- gov.uk design system: clean, authoritative, no bullshit
- Legal documents: the gravitas of signing something important

### Reading Experience
Users should be able to read the entire manifesto in about 30 seconds. The text is short and impactful. The design should:
- Not distract from the words
- Make the content feel "screenshot-able" - users should want to share the manifesto itself
- Create a moment of reflection before the sign flow appears

### Scroll Behavior
The scroll prompt is the bridge between reading and acting. It should:
- Be visible without being pushy
- Use smooth scrolling when clicked to create a seamless transition
- Animate subtly (bouncing arrow) to indicate there's more below

### Accessibility
- Ensure sufficient color contrast for all text
- Use semantic HTML (header, article, section)
- Make the scroll button keyboard accessible
- Support reduced motion preferences for the bounce animation

---

## How It Works

1. **Page Load**: User lands on the homepage. The manifesto section fills the viewport (min-height: 100vh). The title, subtitle, and manifesto body are immediately visible, centered vertically.

2. **Reading**: User reads the manifesto. The typography is large and comfortable. No distractions. The narrow max-width keeps line length readable.

3. **Scroll Prompt**: At the bottom of the manifesto section, a "Sign the letter" prompt with a bouncing down arrow indicates more content below.

4. **Transition to Sign Flow**: When the user clicks the scroll prompt (or scrolls naturally), the page smoothly scrolls to the sign flow section (built in Step 3). A ref on the sign flow section allows the scroll prompt to target it programmatically.

5. **Client-Side Interactivity**: The page.client.tsx component holds:
   - A ref to the sign flow section for smooth scroll targeting
   - Any state needed for the scroll prompt interaction

---

## ASCII Mockups

### Desktop Viewport (1440px+)

Full viewport manifesto section with centered, narrow content column:

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                              [1440px+]  │
│                                                                                         │
│                                                                                         │
│                                                                                         │
│                                                                                         │
│                                                                                         │
│                                                                                         │
│                      ┌───────────────────────────────────────────┐                      │
│                      │                                           │                      │
│                      │          T E C H  F O R  I R A N          │                      │
│                      │         (Inter, ~72px, tracked)           │                      │
│                      │                                           │                      │
│                      │      An open letter from founders,        │                      │
│                      │        investors, and operators.          │                      │
│                      │       (muted, ~16px, Inter)               │                      │
│                      │                                           │                      │
│                      ├───────────────────────────────────────────┤                      │
│                      │                                           │                      │
│                      │  We are builders.                         │                      │
│                      │                                           │                      │
│                      │  Many of us were born in Iran, or are     │                      │
│                      │  children of those who fled. We've seen   │                      │
│                      │  what Iranians create when barriers       │                      │
│                      │  fall — in Silicon Valley, in Toronto,    │                      │
│                      │  in London, in Berlin, in Tel Aviv.       │                      │
│                      │                                           │                      │
│                      │  Iran has 90 million people. A median     │                      │
│                      │  age of 32. One of the highest rates of   │                      │
│                      │  engineering graduates on Earth. A        │                      │
│                      │  civilization that has been inventing     │                      │
│                      │  things for three thousand years.         │                      │
│                      │                                           │                      │
│                      │  We believe a free Iran will be one of    │                      │
│                      │  the great economic stories of our        │                      │
│                      │  lifetime.                                │                      │
│                      │                                           │                      │
│                      │  So we are making a promise:              │                      │
│                      │                                           │                      │
│                      │  When sanctions lift and Iranians are     │                      │
│                      │  free to build, trade, and connect with   │                      │
│                      │  the world — we will be ready. To invest. │                      │
│                      │  To hire. To partner. To build.           │                      │
│                      │                                           │                      │
│                      │  We pledge to do business with a free     │                      │
│                      │  Iran.                                    │                      │
│                      │                                           │                      │
│                      │     (Crimson Pro, 18-20px, 1.7 lh)        │                      │
│                      │          max-width: 650px                 │                      │
│                      │                                           │                      │
│                      └───────────────────────────────────────────┘                      │
│                                                                                         │
│                                                                                         │
│                                Sign the letter                                          │
│                                     ↓                                                   │
│                              (bouncing arrow)                                           │
│                                                                                         │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
 ↑ min-height: 100vh, flexbox centered vertically and horizontally
```

### Desktop - Component Breakdown

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  <ManifestoSection>                                                                     │
│  min-h-screen flex flex-col items-center justify-center px-6                            │
│                                                                                         │
│     ┌─────────────────────────────────────────────────────────────────────────────┐     │
│     │  <header>                                                                   │     │
│     │                                                                             │     │
│     │     <h1 className="text-6xl font-bold tracking-widest uppercase">          │     │
│     │         TECH FOR IRAN                                                       │     │
│     │     </h1>                                                                   │     │
│     │                                                                             │     │
│     │     <p className="text-muted-foreground mt-4 text-lg">                      │     │
│     │         An open letter from founders, investors, and operators.             │     │
│     │     </p>                                                                    │     │
│     │                                                                             │     │
│     └─────────────────────────────────────────────────────────────────────────────┘     │
│                                                                                         │
│     ┌─────────────────────────────────────────────────────────────────────────────┐     │
│     │  <article className="prose prose-lg max-w-[650px] mt-12">                   │     │
│     │                                                                             │     │
│     │     <ManifestoContent />   (Crimson Pro serif)                              │     │
│     │                                                                             │     │
│     │     - Multiple <p> tags with manifesto text                                 │     │
│     │     - font-serif (Crimson Pro)                                              │     │
│     │     - text-lg or text-xl                                                    │     │
│     │     - leading-relaxed or leading-loose                                      │     │
│     │                                                                             │     │
│     └─────────────────────────────────────────────────────────────────────────────┘     │
│                                                                                         │
│     ┌─────────────────────────────────────────────────────────────────────────────┐     │
│     │  <button onClick={scrollToSignFlow} className="mt-16 group">                │     │
│     │                                                                             │     │
│     │     <span>Sign the letter</span>                                            │     │
│     │     <ChevronDown className="animate-bounce" />                              │     │
│     │                                                                             │     │
│     │  </button>                                                                  │     │
│     │                                                                             │     │
│     │  - Uses prefers-reduced-motion for accessibility                            │     │
│     │  - Keyboard accessible (button element)                                     │     │
│     │  - Hover/focus states                                                       │     │
│     │                                                                             │     │
│     └─────────────────────────────────────────────────────────────────────────────┘     │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### Mobile Viewport (< 768px)

```
┌───────────────────────────────┐
│                    [375px]    │
│                               │
│                               │
│                               │
│   T E C H  F O R  I R A N     │
│      (36-48px, tracked)       │
│                               │
│    An open letter from        │
│   founders, investors,        │
│       and operators.          │
│      (muted, 14px)            │
│                               │
├───────────────────────────────┤
│                               │
│  We are builders.             │
│                               │
│  Many of us were born in      │
│  Iran, or are children of     │
│  those who fled. We've seen   │
│  what Iranians create when    │
│  barriers fall — in Silicon   │
│  Valley, in Toronto, in       │
│  London, in Berlin, in Tel    │
│  Aviv.                        │
│                               │
│  Iran has 90 million people.  │
│  A median age of 32. One of   │
│  the highest rates of         │
│  engineering graduates on     │
│  Earth. A civilization that   │
│  has been inventing things    │
│  for three thousand years.    │
│                               │
│  We believe a free Iran will  │
│  be one of the great economic │
│  stories of our lifetime.     │
│                               │
│  So we are making a promise:  │
│                               │
│  When sanctions lift and      │
│  Iranians are free to build,  │
│  trade, and connect with the  │
│  world — we will be ready.    │
│  To invest. To hire. To       │
│  partner. To build.           │
│                               │
│  We pledge to do business     │
│  with a free Iran.            │
│                               │
│   (Crimson Pro, 16-18px)      │
│     px-4 for side padding     │
│                               │
├───────────────────────────────┤
│                               │
│       Sign the letter         │
│             ↓                 │
│       (bouncing arrow)        │
│                               │
│  - Larger tap target (44px+)  │
│  - Adequate bottom padding    │
│                               │
└───────────────────────────────┘
 ↑ min-height: 100svh (small viewport height for mobile)
```

### Scroll Prompt Detail

The scroll CTA deserves special attention as it bridges reading and action:

```
Default State:                    Hover/Focus State:
┌─────────────────────────┐      ┌─────────────────────────┐
│                         │      │                         │
│    Sign the letter      │      │    Sign the letter      │
│          ↓              │      │          ↓              │
│    (subtle gray)        │      │    (darker, underline)  │
│                         │      │                         │
│  opacity-60             │      │  opacity-100            │
│  text-sm or text-base   │      │  cursor-pointer         │
│  animate-bounce on ↓    │      │  transition-colors      │
│                         │      │                         │
└─────────────────────────┘      └─────────────────────────┘

Arrow Animation (CSS):
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(4px); }
}

Reduced Motion:
- animation: none
- or fade pulse instead
```

### Typography Scale Reference

```
Desktop (md:)                          Mobile
─────────────────────────────────────────────────────────
Title:     text-6xl (60px)             text-4xl (36px)
           tracking-[0.15em]           tracking-[0.1em]
           font-bold                   font-bold

Subtitle:  text-lg (18px)              text-base (16px)
           text-muted-foreground       text-muted-foreground

Body:      text-xl (20px)              text-lg (18px)
           leading-relaxed (1.625)     leading-relaxed
           font-serif (Crimson Pro)    font-serif

CTA:       text-base (16px)            text-sm (14px)
           text-muted-foreground       text-muted-foreground
─────────────────────────────────────────────────────────
```

### Screenshot-able Layout

When users take a screenshot of the manifesto for social sharing:

```
┌───────────────────────────────────────────────────────┐
│                                                       │
│                                                       │
│               T E C H  F O R  I R A N                 │
│                                                       │
│          An open letter from founders,                │
│            investors, and operators.                  │
│                                                       │
│   ─────────────────────────────────────────────────   │
│                                                       │
│   We are builders.                                    │
│                                                       │
│   Many of us were born in Iran, or are children of    │
│   those who fled...                                   │
│                                                       │
│   ...We pledge to do business with a free Iran.       │
│                                                       │
│                                                       │
└───────────────────────────────────────────────────────┘

Key properties for screenshot-ability:
- Clean background (no gradients, no noise)
- High contrast text
- Generous whitespace
- Complete message visible in viewport
- No UI chrome interfering with content
```