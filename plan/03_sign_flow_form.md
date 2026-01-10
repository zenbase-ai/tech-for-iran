# Step 3: Sign Flow Form

Build the progressive disclosure sign flow - the "act" experience that appears below the manifesto.

## Design Philosophy

The form should feel like a **ceremony**, not a chore. Each step reveals after the previous is complete, creating small moments of progression. The "I, [name], sign this letter" framing makes it feel like signing an actual legal document.

## Flow States

The sign flow progresses through six sequential states:

1. **IDENTITY** - Name, Title, Company (all required)
2. **WHY_SIGNED** - "Why I'm signing" (optional, 280 characters max)
3. **COMMITMENT** - "In the first 100 days..." commitment (optional, free text)
4. **VERIFY** - Phone number input
5. **CODE** - 6-digit verification code entry
6. **SUCCESS** - Confirmation + share options (covered in Step 4)

## Component Structure

Create the sign flow components under `src/app/_sign-flow/`:

- `index.tsx` - SignFlow container with state machine
- `schema.ts` - Zod schemas and form configuration (max lengths, etc.)
- `hooks/use-sign-flow.ts` - State machine hook managing step transitions
- `steps/identity-step.tsx` - Name, title, company inputs
- `steps/why-step.tsx` - Optional "why I'm signing" textarea
- `steps/commitment-step.tsx` - Optional "100 days" commitment textarea
- `steps/verify-step.tsx` - Phone number input with country code
- `steps/code-step.tsx` - 6-digit OTP input

## State Machine Transitions

The state machine manages accumulated form data and step progression:

- IDENTITY_COMPLETE transitions to WHY
- WHY_COMPLETE or WHY_SKIP transitions to COMMITMENT
- COMMITMENT_COMPLETE or COMMITMENT_SKIP transitions to VERIFY
- VERIFY_CODE_SENT transitions to CODE
- CODE_VERIFIED transitions to SUCCESS

## Form Validation

Define constraints in the schema configuration:

- Name: required, max 100 characters
- Title: required, max 100 characters
- Company: required, max 100 characters
- Why Signed: optional, max 280 characters (Twitter-length)
- Commitment Text: optional, max 2000 characters

## Accessibility Requirements

- Proper focus management when steps reveal (auto-focus first field of new step)
- Clear error messages with aria-describedby
- Keyboard navigation between fields
- Screen reader announcements for step transitions

---

## UX / UI

### Visual Design

- **Progressive Disclosure**: Only one step is active at a time. Completed steps remain visible but collapsed/dimmed above. New steps fade and slide in from below.
- **Document-like Framing**: The identity step uses inline inputs within a sentence: "I, [___], [___] at [___], sign this letter." This creates a legal/ceremonial feel.
- **Generous Whitespace**: Each section has breathing room. The form should not feel cramped or rushed.
- **Subtle Animations**: Each new step fades in and slides up (approximately 500ms ease-out). This creates "small moments" as mentioned in the spec.
- **Skip Links**: Optional steps (Why and Commitment) show a subtle "Skip" link that advances without requiring input.

### Step-by-Step UI Details

**Identity Step:**
- Inputs are styled as underlined inline fields (border-bottom only) to maintain the document aesthetic
- The sentence structure: "I, [name input], [title input] at [company input], sign this letter."
- All three fields must be filled before the next step reveals

**Why Step:**
- Appears with fade/slide animation after identity is complete
- Textarea with placeholder text guiding the user
- Character counter showing "0 / 280 characters"
- Both "Continue" (if text entered) and "Skip" options

**Commitment Step:**
- Appears after Why step is completed or skipped
- Textarea with example placeholder text showing the types of commitments:
  - "Investing $10M in Iranian startups"
  - "Hiring 50 engineers from Tehran"
  - "Opening our first Middle East office in Iran"
  - "Mentoring 10 first-time founders"
- "Skip" option for users who just want to sign without a specific commitment

**Verify Step:**
- Phone input with country code selector (default to +1)
- Clear messaging: "We'll text you a 6-digit code to verify."
- Privacy reassurance: "Your number is never displayed or shared."
- "Send Code" primary button

**Code Step:**
- 6 individual digit boxes for the OTP code
- Shows which number the code was sent to
- "Didn't get it? Resend (42s)" with countdown timer
- "Verify & Sign" primary button

### Mobile Considerations

- Form must work well on mobile devices (many users will arrive from Twitter/X)
- Touch-friendly input sizing
- Inputs should not cause layout shifts when focused

---

## How It Works

### State Machine Pattern

The sign flow uses a state machine hook (`use-sign-flow.ts`) that:

1. **Tracks Current Step**: Maintains which of the six steps is currently active
2. **Accumulates Data**: Stores all entered data across steps in a single state object
3. **Handles Transitions**: Provides functions for completing or skipping each step
4. **Validates Per-Step**: Each step has its own Zod schema for validation

### Data Flow

1. User lands on the home page and scrolls to (or clicks) "Sign the letter"
2. The sign flow component mounts with step set to IDENTITY
3. As the user fills required fields, the form validates in real-time
4. When identity fields are valid and user submits, the state machine transitions to WHY
5. The WHY step fades in. User can type and continue, or click Skip
6. Same pattern for COMMITMENT step
7. VERIFY step collects phone number and triggers Clerk API (covered in Step 5)
8. CODE step verifies the OTP (covered in Step 5)
9. On success, signatory is created and SUCCESS state renders (covered in Step 4)

### Form State Management

- Use React Hook Form with Zod resolver for each step
- The state machine hook holds accumulated data across all steps
- Each step component receives its portion of the data and update callbacks
- Completed steps can be displayed in a read-only/summary format above the active step

### Animation Implementation

- Use Tailwind's animate-in utilities or CSS keyframes
- Each step container has conditional classes based on its state (entering, active, completed)
- Transitions should be smooth and not jarring

---

## ASCII Mockups

The following mockups illustrate the progressive disclosure flow from start to finish.

### Step 1: Identity (Initial State)

The user sees only the identity step. Inputs are inline within the sentence structure.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                            Sign the Letter                                  │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                                                                             │
│    I, ___________________________________________                           │
│                      Your full name                                         │
│                                                                             │
│    ___________________________ at ___________________________               │
│           Your title                    Your company                        │
│                                                                             │
│    sign this letter.                                                        │
│                                                                             │
│                                                                             │
│                                                                             │
│                                                                             │
│                                                                             │
│                                                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Step 1: Identity (Filled - Transitioning)

Once all three fields are valid, the form auto-advances to the next step.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                            Sign the Letter                                  │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                                                                             │
│    I, Sarah Chen___________________________________                         │
│                      Your full name                                         │
│                                                                             │
│    Partner_______________________ at a]6z___________________________        │
│           Your title                    Your company                        │
│                                                                             │
│    sign this letter.                                                        │
│                                                                             │
│                                                                             │
│                                                                             │
│    ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐    │
│      (next section fading in...)                                           │
│    └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘    │
│                                                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Step 2: Why I'm Signing (Active)

The "Why" step has faded in. Identity remains visible but dimmed above.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                            Sign the Letter                                  │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    ┌───────────────────────────────────────────────────────────────────┐    │
│    │  ✓  I, Sarah Chen, Partner at a16z, sign this letter.            │    │
│    └───────────────────────────────────────────────────────────────────┘    │
│                                                          (completed, dimmed)│
│                                                                             │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│                                                                             │
│    Why I'm signing (optional)                                               │
│                                                                             │
│    ┌───────────────────────────────────────────────────────────────────┐    │
│    │                                                                   │    │
│    │  My parents left Iran in 1979. I've always wondered what         │    │
│    │  could have been...                                              │    │
│    │                                                                   │    │
│    │                                                                   │    │
│    └───────────────────────────────────────────────────────────────────┘    │
│                                                        67 / 280 characters  │
│                                                                             │
│                                      [ Continue ]          [ Skip ]         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Step 2: Why I'm Signing (Empty - Skip Option)

If the user hasn't typed anything, only "Skip" is shown.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                            Sign the Letter                                  │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    ┌───────────────────────────────────────────────────────────────────┐    │
│    │  ✓  I, Sarah Chen, Partner at a16z, sign this letter.            │    │
│    └───────────────────────────────────────────────────────────────────┘    │
│                                                          (completed, dimmed)│
│                                                                             │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│                                                                             │
│    Why I'm signing (optional)                                               │
│                                                                             │
│    ┌───────────────────────────────────────────────────────────────────┐    │
│    │                                                                   │    │
│    │  Share why this matters to you...                                │    │
│    │                                                  (placeholder)    │    │
│    │                                                                   │    │
│    │                                                                   │    │
│    └───────────────────────────────────────────────────────────────────┘    │
│                                                         0 / 280 characters  │
│                                                                             │
│                                                              [ Skip ]       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Step 3: Commitment (Active)

The "100 days" commitment step with example placeholder text.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                            Sign the Letter                                  │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    ┌───────────────────────────────────────────────────────────────────┐    │
│    │  ✓  I, Sarah Chen, Partner at a16z, sign this letter.            │    │
│    └───────────────────────────────────────────────────────────────────┘    │
│    ┌───────────────────────────────────────────────────────────────────┐    │
│    │  ✓  "My parents left Iran in 1979..."                            │    │
│    └───────────────────────────────────────────────────────────────────┘    │
│                                                        (completed, dimmed)  │
│                                                                             │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│                                                                             │
│    In the first 100 days of a free Iran, I commit to:                       │
│                                                                             │
│    ┌───────────────────────────────────────────────────────────────────┐    │
│    │                                                                   │    │
│    │  Commit $50M to Series A/B rounds in Iranian companies.          │    │
│    │                                                                   │    │
│    │                                                                   │    │
│    │  Examples:                                                        │    │
│    │  - "Investing $10M in Iranian startups"                          │    │
│    │  - "Hiring 50 engineers from Tehran"                             │    │
│    │  - "Opening our first Middle East office in Iran"                │    │
│    │                                                  (placeholder)    │    │
│    └───────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│                                      [ Continue ]          [ Skip ]         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Step 4: Verify (Phone Input)

Phone verification step with country code selector.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                            Sign the Letter                                  │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    ┌───────────────────────────────────────────────────────────────────┐    │
│    │  ✓  I, Sarah Chen, Partner at a16z, sign this letter.            │    │
│    └───────────────────────────────────────────────────────────────────┘    │
│    ┌───────────────────────────────────────────────────────────────────┐    │
│    │  ✓  "My parents left Iran in 1979..."                            │    │
│    └───────────────────────────────────────────────────────────────────┘    │
│    ┌───────────────────────────────────────────────────────────────────┐    │
│    │  ✓  "Commit $50M to Series A/B rounds..."                        │    │
│    └───────────────────────────────────────────────────────────────────┘    │
│                                                        (completed, dimmed)  │
│                                                                             │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│                                                                             │
│    Verify you're human                                                      │
│                                                                             │
│    ┌───────────────────────────────────────────────────────────────────┐    │
│    │  +1  v │  (555) 123-4567                                         │    │
│    └────────┴──────────────────────────────────────────────────────────┘    │
│                                                                             │
│    We'll text you a 6-digit code to verify.                                 │
│    Your number is never displayed or shared.                                │
│                                                                             │
│                              [ Send Code ]                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Step 4: Verify (Loading State)

After clicking "Send Code", show loading state.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                            Sign the Letter                                  │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    ┌───────────────────────────────────────────────────────────────────┐    │
│    │  ✓  I, Sarah Chen, Partner at a16z, sign this letter.            │    │
│    │  ✓  "My parents left Iran in 1979..."                            │    │
│    │  ✓  "Commit $50M to Series A/B rounds..."                        │    │
│    └───────────────────────────────────────────────────────────────────┘    │
│                                                        (completed, dimmed)  │
│                                                                             │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│                                                                             │
│    Verify you're human                                                      │
│                                                                             │
│    ┌───────────────────────────────────────────────────────────────────┐    │
│    │  +1    │  (555) 123-4567                                         │    │
│    └────────┴──────────────────────────────────────────────────────────┘    │
│                                                                             │
│    We'll text you a 6-digit code to verify.                                 │
│    Your number is never displayed or shared.                                │
│                                                                             │
│                           [ Sending... ◌ ]                                  │
│                              (disabled)                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Step 5: Code Entry (Initial)

6-digit OTP input boxes with resend countdown.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                            Sign the Letter                                  │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    ┌───────────────────────────────────────────────────────────────────┐    │
│    │  ✓  I, Sarah Chen, Partner at a16z, sign this letter.            │    │
│    │  ✓  "My parents left Iran in 1979..."                            │    │
│    │  ✓  "Commit $50M to Series A/B rounds..."                        │    │
│    └───────────────────────────────────────────────────────────────────┘    │
│                                                        (completed, dimmed)  │
│                                                                             │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│                                                                             │
│    Enter the code we sent to (555) 123-4567                                 │
│                                                                             │
│                  ┌───┐ ┌───┐ ┌───┐   ┌───┐ ┌───┐ ┌───┐                      │
│                  │   │ │   │ │   │   │   │ │   │ │   │                      │
│                  └───┘ └───┘ └───┘   └───┘ └───┘ └───┘                      │
│                                                                             │
│                    Didn't get it? Resend (42s)                              │
│                                       ^                                     │
│                               (countdown timer)                             │
│                                                                             │
│                           [ Verify & Sign ]                                 │
│                              (disabled)                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Step 5: Code Entry (Partial Input)

User is entering the code, auto-advancing between boxes.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                            Sign the Letter                                  │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    ┌───────────────────────────────────────────────────────────────────┐    │
│    │  ✓  I, Sarah Chen, Partner at a16z, sign this letter.            │    │
│    │  ✓  "My parents left Iran in 1979..."                            │    │
│    │  ✓  "Commit $50M to Series A/B rounds..."                        │    │
│    └───────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│                                                                             │
│    Enter the code we sent to (555) 123-4567                                 │
│                                                                             │
│                  ┌───┐ ┌───┐ ┌───┐   ┌───┐ ┌───┐ ┌───┐                      │
│                  │ 8 │ │ 4 │ │ 2 │   │ _ │ │   │ │   │                      │
│                  └───┘ └───┘ └───┘   └───┘ └───┘ └───┘                      │
│                              ^                                              │
│                           (cursor)                                          │
│                                                                             │
│                    Didn't get it? Resend (31s)                              │
│                                                                             │
│                           [ Verify & Sign ]                                 │
│                              (disabled)                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Step 5: Code Entry (Complete - Ready to Submit)

All 6 digits entered, button becomes active.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                            Sign the Letter                                  │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    ┌───────────────────────────────────────────────────────────────────┐    │
│    │  ✓  I, Sarah Chen, Partner at a16z, sign this letter.            │    │
│    │  ✓  "My parents left Iran in 1979..."                            │    │
│    │  ✓  "Commit $50M to Series A/B rounds..."                        │    │
│    └───────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│                                                                             │
│    Enter the code we sent to (555) 123-4567                                 │
│                                                                             │
│                  ┌───┐ ┌───┐ ┌───┐   ┌───┐ ┌───┐ ┌───┐                      │
│                  │ 8 │ │ 4 │ │ 2 │   │ 9 │ │ 1 │ │ 7 │                      │
│                  └───┘ └───┘ └───┘   └───┘ └───┘ └───┘                      │
│                                                                             │
│                    Didn't get it? Resend (12s)                              │
│                                                                             │
│                          [ Verify & Sign ]                                  │
│                             (enabled)                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Step 5: Code Entry (Error State)

Invalid code shows error message, allows retry.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                            Sign the Letter                                  │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    ┌───────────────────────────────────────────────────────────────────┐    │
│    │  ✓  I, Sarah Chen, Partner at a16z, sign this letter.            │    │
│    │  ✓  "My parents left Iran in 1979..."                            │    │
│    │  ✓  "Commit $50M to Series A/B rounds..."                        │    │
│    └───────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│                                                                             │
│    Enter the code we sent to (555) 123-4567                                 │
│                                                                             │
│                  ┌───┐ ┌───┐ ┌───┐   ┌───┐ ┌───┐ ┌───┐                      │
│                  │ 8 │ │ 4 │ │ 2 │   │ 9 │ │ 1 │ │ 7 │  <-- highlighted red │
│                  └───┘ └───┘ └───┘   └───┘ └───┘ └───┘                      │
│                                                                             │
│        That code didn't work. Please try again or request a new code.       │
│                              (error message)                                │
│                                                                             │
│                    Didn't get it? [ Resend ]                                │
│                                 (timer elapsed)                             │
│                                                                             │
│                           [ Verify & Sign ]                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Step 5: Code Entry (Resend Available)

Timer has elapsed, resend link is active.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                            Sign the Letter                                  │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    ┌───────────────────────────────────────────────────────────────────┐    │
│    │  ✓  I, Sarah Chen, Partner at a16z, sign this letter.            │    │
│    │  ✓  "My parents left Iran in 1979..."                            │    │
│    │  ✓  "Commit $50M to Series A/B rounds..."                        │    │
│    └───────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│                                                                             │
│    Enter the code we sent to (555) 123-4567                                 │
│                                                                             │
│                  ┌───┐ ┌───┐ ┌───┐   ┌───┐ ┌───┐ ┌───┐                      │
│                  │   │ │   │ │   │   │   │ │   │ │   │                      │
│                  └───┘ └───┘ └───┘   └───┘ └───┘ └───┘                      │
│                                                                             │
│                    Didn't get it? [ Resend ]                                │
│                                  (clickable)                                │
│                                                                             │
│                           [ Verify & Sign ]                                 │
│                              (disabled)                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Mobile Layout: Identity Step

On mobile, the inline sentence structure adapts to a stacked layout.

```
┌─────────────────────────────┐
│                             │
│    Sign the Letter          │
│                             │
├─────────────────────────────┤
│                             │
│  I,                         │
│                             │
│  ┌───────────────────────┐  │
│  │ Sarah Chen            │  │
│  └───────────────────────┘  │
│  Your full name             │
│                             │
│  ┌───────────────────────┐  │
│  │ Partner               │  │
│  └───────────────────────┘  │
│  Your title                 │
│                             │
│  at                         │
│                             │
│  ┌───────────────────────┐  │
│  │ a16z                  │  │
│  └───────────────────────┘  │
│  Your company               │
│                             │
│  sign this letter.          │
│                             │
└─────────────────────────────┘
```

### Mobile Layout: Code Entry Step

OTP boxes sized appropriately for touch.

```
┌─────────────────────────────┐
│                             │
│    Sign the Letter          │
│                             │
├─────────────────────────────┤
│                             │
│  ┌───────────────────────┐  │
│  │ ✓ Sarah Chen          │  │
│  │   Partner at a16z     │  │
│  │ ✓ "My parents..."     │  │
│  │ ✓ "Commit $50M..."    │  │
│  └───────────────────────┘  │
│                             │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
│                             │
│  Enter the code we sent to  │
│  (555) 123-4567             │
│                             │
│  ┌────┐┌────┐┌────┐         │
│  │ 8  ││ 4  ││ 2  │         │
│  └────┘└────┘└────┘         │
│                             │
│  ┌────┐┌────┐┌────┐         │
│  │ 9  ││ 1  ││ 7  │         │
│  └────┘└────┘└────┘         │
│                             │
│  Didn't get it?             │
│  Resend (42s)               │
│                             │
│  ┌───────────────────────┐  │
│  │    Verify & Sign      │  │
│  └───────────────────────┘  │
│                             │
└─────────────────────────────┘
```

### Full Flow Summary (Collapsed View)

A visual summary of all steps in sequence:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  STEP 1: IDENTITY                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  I, [_______], [_______] at [_______], sign this letter.           │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                          │                                                  │
│                          │  (auto-advances when all fields valid)           │
│                          v                                                  │
│  STEP 2: WHY (optional)                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Why I'm signing (280 chars)  [Continue] or [Skip]                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                          │                                                  │
│                          v                                                  │
│  STEP 3: COMMITMENT (optional)                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  In the first 100 days...     [Continue] or [Skip]                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                          │                                                  │
│                          v                                                  │
│  STEP 4: VERIFY                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  [+1 v] (555) 123-4567        [Send Code]                          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                          │                                                  │
│                          v                                                  │
│  STEP 5: CODE                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  [ ][ ][ ] [ ][ ][ ]          [Verify & Sign]                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                          │                                                  │
│                          v                                                  │
│  STEP 6: SUCCESS (covered in Step 4 plan)                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  ✓ You've signed the letter.  [Share] [View Commitments]           │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```
