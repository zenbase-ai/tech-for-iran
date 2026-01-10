# Step 4: Phone Verification

Implement Clerk phone authentication with completely custom UI. No Clerk components should be visible to the user.

## Overview

Use Clerk's `signUp` flow with `phoneNumber` strategy. The UI is fully custom - the form should feel like a ceremony, not a standard login flow. This is the trust gate that ensures only real humans can sign the letter.

## Clerk Configuration

Ensure phone authentication is enabled in Clerk Dashboard:
- Authentication > Phone Number > Enable
- SMS configuration (Clerk handles SMS delivery)

## Flow

1. User enters phone number with country code selector
2. Call `clerk.signUp.create({ phoneNumber })` to initiate the flow
3. Call `signUp.preparePhoneNumberVerification({ strategy: 'phone_code' })` to send SMS
4. User enters 6-digit code in custom OTP input
5. Call `signUp.attemptPhoneNumberVerification({ code })` to verify
6. On success, user is authenticated via `setActive({ session: result.createdSessionId })`
7. Hash the phone number (SHA256) and store only the hash for deduplication

## Components to Build

### VerifyStep Component
Location: `src/app/_sign-flow/steps/verify-step.tsx`

Handles the phone number input and "Send Code" action. Should include:
- Country code selector (dropdown with common codes: +1, +44, +98, etc.)
- Phone number input field
- Privacy reassurance text: "We'll text you a 6-digit code to verify. Your number is never displayed or shared."
- Error display area
- "Send Code" button with loading state

### CodeStep Component
Location: `src/app/_sign-flow/steps/code-step.tsx`

Handles the verification code entry. Should include:
- Display of the phone number the code was sent to
- Custom OTP input (6 boxes)
- Resend functionality with countdown timer (60 seconds)
- Error display area
- "Verify & Sign" button with loading state

### OTPInput Component
Location: `src/components/ui/otp-input.tsx`

A custom 6-box OTP input that:
- Only accepts numeric input
- Auto-advances to next box on entry
- Handles backspace to move to previous box
- Auto-submits when all 6 digits are entered
- Supports paste from SMS autofill

### Phone Hash Utility
Location: `src/lib/phone.ts`

Utility function that:
- Normalizes phone numbers (removes spaces, dashes, parentheses)
- Generates SHA256 hash using Web Crypto API
- Returns hex-encoded hash string

## Error Handling

| Clerk Error Code         | User-Facing Message                                                                                                               |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `form_identifier_exists` | "This phone number has already signed the letter. If this is you and you need to update your information, contact us at [email]." |
| `form_code_incorrect`    | "That code didn't work. Please try again or request a new code."                                                                  |
| `too_many_requests`      | "Too many attempts. Please wait a few minutes."                                                                                   |
| Generic error            | "Something went wrong. Please try again."                                                                                         |

## Security Notes

- Phone numbers are normalized and hashed client-side before any storage
- Only the hash is stored in the database
- Clerk handles SMS delivery and rate limiting
- The hash prevents duplicate signups while protecting PII
- The hash is also used to identify who can upvote (must be a signatory)

---

## UX / UI

### Visual Design
- The phone verification step should maintain the ceremonial feel of the sign flow
- Phone input and OTP boxes should use the same typography and styling as the rest of the form
- The country code selector should be minimal and unobtrusive
- OTP boxes should be visually distinct (6 separate boxes) to communicate "enter a code" clearly

### Progressive Disclosure
- This section fades in after the user has either:
  - Typed their "100 days" commitment, OR
  - Clicked "Skip" on the commitment field
- The section replaces itself when transitioning from phone input to code entry

### Phone Input State
- Country code dropdown defaults to +1 (US)
- Include common diaspora country codes prominently: +1, +44, +98 (Iran), +49, +33, +972
- Input should accept various formats - the normalization handles cleanup
- "Send Code" button is disabled until a phone number is entered

### Code Entry State
- Shows the masked phone number the code was sent to
- OTP input auto-focuses on first box
- Digits appear in boxes as typed with no additional styling changes needed
- Resend link shows countdown: "Didn't get it? Resend (42s)"
- After countdown reaches 0, resend becomes clickable
- "Verify & Sign" is the final action - use the primary button style to convey finality

### Error States
- Errors appear inline below the relevant input
- For "already signed" errors, provide actionable next steps (contact email)
- Invalid code errors should not clear the input - let user correct it
- Rate limit errors should clearly communicate the wait time

### Mobile Considerations
- OTP boxes should be appropriately sized for touch (min 44px tap targets)
- Phone input should trigger numeric keyboard on mobile (`type="tel"`)
- OTP input should trigger numeric keyboard (`inputMode="numeric"`)
- Consider SMS autofill support on iOS/Android

---

## How It Works

### Sending the Verification Code

1. User fills in their phone number using the country code dropdown and text input
2. When they click "Send Code", the component combines the country code with the phone number
3. The app calls Clerk's `signUp.create()` with the full phone number
4. If the phone is new, Clerk creates a pending signup record
5. The app then calls `preparePhoneNumberVerification()` which triggers Clerk to send the SMS
6. If the phone already exists in Clerk (someone already signed), Clerk returns a `form_identifier_exists` error
7. The UI transitions from phone input to code entry, displaying the phone number for reference

### Verifying the Code

1. User enters the 6-digit code they received via SMS
2. The OTP input auto-advances between boxes and can auto-submit when complete
3. When verified (manually or auto), the app calls `attemptPhoneNumberVerification()` with the code
4. Clerk validates the code against their records
5. On success, the signup status becomes "complete" and includes a `createdSessionId`
6. The app calls `setActive()` to establish the user session
7. The app then hashes the phone number using SHA256 and passes control back to the parent sign flow

### Phone Number Hashing

1. The raw phone number is normalized (all non-digit characters removed)
2. The normalized string is encoded as UTF-8 bytes
3. SHA256 is computed using the Web Crypto API
4. The hash is converted to a hex string (64 characters)
5. This hash becomes the `phone_hash` stored in the signatory record
6. The same hash is used later to verify upvote eligibility (is this phone hash in the signatories table?)

### Duplicate Prevention

- When a user tries to sign with an already-used phone number, Clerk returns `form_identifier_exists` error
- The user sees the error message: "This phone number has already signed the letter..."
- No modifications are allowed - once signed, the signatory record is immutable
- Users who need to change their information must contact support

---

## Verification Plan

### Prerequisites
- Clerk Dashboard has phone authentication enabled
- Test phone numbers are configured in Clerk (for development)
- The sign flow steps 1-3 are already working (name, title, company, why, commitment)

### Test Cases

#### Happy Path - New User
1. Navigate to the home page and scroll to the sign flow
2. Fill in name, title, company (required fields)
3. Skip or fill the "Why I'm signing" field
4. Skip or fill the "100 days commitment" field
5. Verify the phone verification section appears
6. Select a country code and enter a valid phone number
7. Click "Send Code"
8. Verify the UI transitions to the code entry view
9. Verify the phone number is displayed in the code entry header
10. Enter the 6-digit code received via SMS (or use Clerk test code in development)
11. Verify the "Verify & Sign" button activates when all 6 digits are entered
12. Click "Verify & Sign" (or let auto-submit fire)
13. Verify the success state appears
14. Verify the signatory record was created in the database with the correct phone_hash

#### Duplicate Phone Number
1. Complete the sign flow with a phone number
2. Open an incognito window
3. Start a new sign flow with different name/company but same phone number
4. Enter the phone number and click "Send Code"
5. Verify the error message appears: "This phone number has already signed the letter..."
6. Verify no SMS is sent (no code to enter)

#### Invalid Verification Code
1. Start the sign flow and get to code entry
2. Enter an incorrect 6-digit code (e.g., 000000)
3. Click "Verify & Sign"
4. Verify the error message appears: "That code didn't work..."
5. Verify the code input is NOT cleared (user can correct)
6. Enter the correct code
7. Verify successful submission

#### Resend Code
1. Start the sign flow and get to code entry
2. Verify the resend countdown starts at 60 seconds
3. Wait for countdown to reach 0 (or use browser dev tools to speed up time)
4. Click "Resend"
5. Verify a new code is sent via SMS
6. Verify the countdown resets to 60 seconds
7. Enter the new code and verify success

#### OTP Input Behavior
1. Navigate to the code entry step
2. Type a digit - verify it appears in box 1 and focus moves to box 2
3. Continue typing - verify each digit appears in sequence
4. Press backspace on an empty box - verify focus moves back to previous box
5. Paste a 6-digit code - verify all boxes populate correctly
6. Verify auto-submit triggers when the 6th digit is entered (if implemented)

#### Mobile Testing
1. Open the sign flow on a mobile device or mobile emulator
2. Tap the phone number input - verify numeric keyboard appears
3. Tap an OTP box - verify numeric keyboard appears
4. Verify tap targets are large enough (no misclicks)
5. Test SMS autofill if available on the device

#### Error Recovery
1. Start the sign flow with no network connection
2. Attempt to send code
3. Verify graceful error handling (not a crash)
4. Restore network connection
5. Retry - verify it works

### Database Verification
After successful sign-up:
1. Query the signatories table for the new record
2. Verify `phone_hash` is a 64-character hex string
3. Verify `phone_hash` matches what you compute manually from the same phone number
4. Verify the `userId` field contains the Clerk user ID
5. Verify no plaintext phone number is stored anywhere in the record

---

## ASCII Mockups

The following mockups illustrate the phone verification UI states. The design maintains the ceremonial, typography-forward aesthetic established in SPEC.md.

### Phone Number Input (Initial State)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│    Verify you're human                                                      │
│                                                                             │
│    ┌──────────┬────────────────────────────────────────────────────────┐    │
│    │  +1  ▼   │  (555) 123-4567                                        │    │
│    └──────────┴────────────────────────────────────────────────────────┘    │
│                                                                             │
│    We'll text you a 6-digit code to verify.                                 │
│    Your number is never displayed or shared.                                │
│                                                                             │
│                        ┌─────────────────────┐                              │
│                        │     Send Code       │                              │
│                        └─────────────────────┘                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Country Code Selector (Expanded Dropdown)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│    Verify you're human                                                      │
│                                                                             │
│    ┌──────────┬────────────────────────────────────────────────────────┐    │
│    │  +1  ▲   │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │    │
│    ├──────────┤                                                        │    │
│    │  +1  🇺🇸  │ ◄── Common diaspora codes appear first                 │    │
│    │  +44 🇬🇧  │                                                        │    │
│    │  +98 🇮🇷  │ ◄── Iran                                               │    │
│    │  +49 🇩🇪  │                                                        │    │
│    │  +33 🇫🇷  │                                                        │    │
│    │  +972 🇮🇱 │                                                        │    │
│    │  +1  🇨🇦  │                                                        │    │
│    ├──────────┤                                                        │    │
│    │  ┌─────┐ │ ◄── Search for other codes                             │    │
│    │  │ 🔍  │ │                                                        │    │
│    │  └─────┘ │                                                        │    │
│    └──────────┴────────────────────────────────────────────────────────┘    │
│                                                                             │
│    We'll text you a 6-digit code to verify.                                 │
│    Your number is never displayed or shared.                                │
│                                                                             │
│                        ┌─────────────────────┐                              │
│                        │     Send Code       │                              │
│                        └─────────────────────┘                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Phone Input - Loading State (Sending Code)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│    Verify you're human                                                      │
│                                                                             │
│    ┌──────────┬────────────────────────────────────────────────────────┐    │
│    │  +1  ▼   │  (555) 123-4567                                        │    │
│    └──────────┴────────────────────────────────────────────────────────┘    │
│    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░      │
│    (subtle animated bar indicating progress)                                │
│                                                                             │
│    We'll text you a 6-digit code to verify.                                 │
│    Your number is never displayed or shared.                                │
│                                                                             │
│                        ┌─────────────────────┐                              │
│                        │   ◌ Sending...      │  ◄── Spinner + disabled     │
│                        └─────────────────────┘                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Phone Input - Error State (Duplicate Number)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│    Verify you're human                                                      │
│                                                                             │
│    ┌──────────┬────────────────────────────────────────────────────────┐    │
│    │  +1  ▼   │  (555) 123-4567                                        │    │
│    └──────────┴────────────────────────────────────────────────────────┘    │
│                                                                             │
│    ╔═══════════════════════════════════════════════════════════════════╗    │
│    ║  This phone number has already signed the letter.                 ║    │
│    ║                                                                   ║    │
│    ║  If this is you and you need to update your information,          ║    │
│    ║  contact us at hello@techforiran.com                              ║    │
│    ╚═══════════════════════════════════════════════════════════════════╝    │
│                                                                             │
│    We'll text you a 6-digit code to verify.                                 │
│    Your number is never displayed or shared.                                │
│                                                                             │
│                        ┌─────────────────────┐                              │
│                        │     Send Code       │                              │
│                        └─────────────────────┘                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Phone Input - Error State (Rate Limited)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│    Verify you're human                                                      │
│                                                                             │
│    ┌──────────┬────────────────────────────────────────────────────────┐    │
│    │  +1  ▼   │  (555) 123-4567                                        │    │
│    └──────────┴────────────────────────────────────────────────────────┘    │
│                                                                             │
│    ╔═══════════════════════════════════════════════════════════════════╗    │
│    ║  Too many attempts. Please wait a few minutes.                    ║    │
│    ╚═══════════════════════════════════════════════════════════════════╝    │
│                                                                             │
│    We'll text you a 6-digit code to verify.                                 │
│    Your number is never displayed or shared.                                │
│                                                                             │
│                        ┌─────────────────────┐                              │
│                        │     Send Code       │  ◄── Disabled               │
│                        └─────────────────────┘                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### OTP Code Entry (Initial State)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│    Enter the code we sent to +1 (555) 123-4567                              │
│                                                                             │
│                                                                             │
│              ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                │
│              │     │ │     │ │     │ │     │ │     │ │     │                │
│              │     │ │     │ │     │ │     │ │     │ │     │                │
│              │     │ │     │ │     │ │     │ │     │ │     │                │
│              └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                │
│                 ▲                                                            │
│                 │                                                            │
│              Focus indicator (first box auto-focused)                        │
│                                                                             │
│                                                                             │
│                    Didn't get it? Resend (60s)                              │
│                                     ^^^^                                    │
│                                 Countdown timer                              │
│                                                                             │
│                        ┌─────────────────────┐                              │
│                        │    Verify & Sign    │                              │
│                        └─────────────────────┘                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### OTP Code Entry (Partially Filled)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│    Enter the code we sent to +1 (555) 123-4567                              │
│                                                                             │
│                                                                             │
│              ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                │
│              │     │ │     │ │     │ │     │ │     │ │     │                │
│              │  4  │ │  2  │ │  8  │ │  _  │ │     │ │     │                │
│              │     │ │     │ │     │ │     │ │     │ │     │                │
│              └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                │
│                                 ▲                                           │
│                                 │                                           │
│                          Cursor position (4th box)                          │
│                                                                             │
│                                                                             │
│                    Didn't get it? Resend (42s)                              │
│                                                                             │
│                        ┌─────────────────────┐                              │
│                        │    Verify & Sign    │                              │
│                        └─────────────────────┘                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### OTP Code Entry (Complete - Ready to Submit)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│    Enter the code we sent to +1 (555) 123-4567                              │
│                                                                             │
│                                                                             │
│              ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                │
│              │     │ │     │ │     │ │     │ │     │ │     │                │
│              │  4  │ │  2  │ │  8  │ │  9  │ │  1  │ │  7  │                │
│              │     │ │     │ │     │ │     │ │     │ │     │                │
│              └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                │
│                                                                             │
│              ◄──────────── All boxes filled ──────────────►                 │
│                                                                             │
│                                                                             │
│                    Didn't get it? Resend (18s)                              │
│                                                                             │
│                        ╔═════════════════════╗                              │
│                        ║    Verify & Sign    ║  ◄── Primary button style   │
│                        ╚═════════════════════╝      (conveys finality)     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### OTP Code Entry - Loading State (Verifying)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│    Enter the code we sent to +1 (555) 123-4567                              │
│                                                                             │
│                                                                             │
│              ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                │
│              │     │ │     │ │     │ │     │ │     │ │     │                │
│              │  4  │ │  2  │ │  8  │ │  9  │ │  1  │ │  7  │                │
│              │     │ │     │ │     │ │     │ │     │ │     │                │
│              └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                │
│              ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░               │
│              (subtle animated bar indicating verification)                  │
│                                                                             │
│                                                                             │
│                    Didn't get it? Resend (18s)                              │
│                                                                             │
│                        ┌─────────────────────┐                              │
│                        │  ◌ Verifying...     │  ◄── Spinner + disabled     │
│                        └─────────────────────┘                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### OTP Code Entry - Error State (Invalid Code)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│    Enter the code we sent to +1 (555) 123-4567                              │
│                                                                             │
│                                                                             │
│              ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                │
│              │ ╳╳╳ │ │ ╳╳╳ │ │ ╳╳╳ │ │ ╳╳╳ │ │ ╳╳╳ │ │ ╳╳╳ │                │
│              │  0  │ │  0  │ │  0  │ │  0  │ │  0  │ │  0  │                │
│              │ ╳╳╳ │ │ ╳╳╳ │ │ ╳╳╳ │ │ ╳╳╳ │ │ ╳╳╳ │ │ ╳╳╳ │                │
│              └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                │
│                           ▲                                                 │
│                           │                                                 │
│                   Boxes have error border (red)                             │
│                   Input NOT cleared - user can correct                      │
│                                                                             │
│    ╔═══════════════════════════════════════════════════════════════════╗    │
│    ║  That code didn't work. Please try again or request a new code.   ║    │
│    ╚═══════════════════════════════════════════════════════════════════╝    │
│                                                                             │
│                    Didn't get it? Resend (8s)                               │
│                                                                             │
│                        ┌─────────────────────┐                              │
│                        │    Verify & Sign    │                              │
│                        └─────────────────────┘                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### OTP Code Entry - Resend Available

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│    Enter the code we sent to +1 (555) 123-4567                              │
│                                                                             │
│                                                                             │
│              ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                │
│              │     │ │     │ │     │ │     │ │     │ │     │                │
│              │     │ │     │ │     │ │     │ │     │ │     │                │
│              │     │ │     │ │     │ │     │ │     │ │     │                │
│              └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                │
│                                                                             │
│                                                                             │
│                                                                             │
│                    Didn't get it? [Resend]                                  │
│                                    ^^^^^^                                   │
│                            Clickable link (countdown reached 0)             │
│                                                                             │
│                        ┌─────────────────────┐                              │
│                        │    Verify & Sign    │                              │
│                        └─────────────────────┘                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### OTP Code Entry - Resending

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│    Enter the code we sent to +1 (555) 123-4567                              │
│                                                                             │
│                                                                             │
│              ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                │
│              │     │ │     │ │     │ │     │ │     │ │     │                │
│              │     │ │     │ │     │ │     │ │     │ │     │                │
│              │     │ │     │ │     │ │     │ │     │ │     │                │
│              └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                │
│                                                                             │
│                                                                             │
│                                                                             │
│                    ◌ Sending new code...                                    │
│                                                                             │
│                                                                             │
│                        ┌─────────────────────┐                              │
│                        │    Verify & Sign    │                              │
│                        └─────────────────────┘                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Mobile Viewport - Phone Input

```
┌───────────────────────────────┐
│                               │
│  Verify you're human          │
│                               │
│  ┌─────────┬────────────────┐ │
│  │  +1  ▼  │  (555) 123-456 │ │
│  └─────────┴────────────────┘ │
│                               │
│  We'll text you a 6-digit     │
│  code to verify. Your number  │
│  is never displayed or        │
│  shared.                      │
│                               │
│     ┌───────────────────┐     │
│     │     Send Code     │     │
│     └───────────────────┘     │
│                               │
│  ┌───────────────────────────┐│
│  │  1   2   3   4   5   6   ││
│  │  ABC DEF GHI JKL MNO PQR ││
│  │  7   8   9   .   0   ⌫   ││
│  │  STU VWX YZ              ││
│  └───────────────────────────┘│
│   ▲                           │
│   │                           │
│   Numeric keyboard appears    │
│   (type="tel" triggers this)  │
│                               │
└───────────────────────────────┘
```

### Mobile Viewport - OTP Entry

```
┌───────────────────────────────┐
│                               │
│  Enter the code we sent to    │
│  +1 (555) 123-4567            │
│                               │
│                               │
│  ┌───┐┌───┐┌───┐┌───┐┌───┐┌───┐
│  │ 4 ││ 2 ││ 8 ││   ││   ││   │
│  └───┘└───┘└───┘└───┘└───┘└───┘
│     ▲                         │
│     │                         │
│  Min 44px tap targets         │
│                               │
│  Didn't get it? Resend (42s)  │
│                               │
│     ┌───────────────────┐     │
│     │   Verify & Sign   │     │
│     └───────────────────┘     │
│                               │
│  ┌───────────────────────────┐│
│  │     1     2     3         ││
│  │     4     5     6         ││
│  │     7     8     9         ││
│  │           0     ⌫         ││
│  └───────────────────────────┘│
│   ▲                           │
│   │                           │
│   Numeric keyboard            │
│   (inputMode="numeric")       │
│                               │
└───────────────────────────────┘
```

### Component Dimensions Reference

```
OTP Input Box Specifications:
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  Desktop:                                                                   │
│  ┌────────┐                                                                 │
│  │        │  width: 56px                                                    │
│  │   4    │  height: 64px                                                   │
│  │        │  font-size: 24px                                                │
│  └────────┘  gap between boxes: 12px                                        │
│                                                                             │
│  Mobile:                                                                    │
│  ┌──────┐                                                                   │
│  │      │    width: 44px (min tap target)                                   │
│  │  4   │    height: 52px                                                   │
│  │      │    font-size: 20px                                                │
│  └──────┘    gap between boxes: 8px                                         │
│                                                                             │
│  States:                                                                    │
│  ┌────────┐  Default: border-gray-300                                       │
│  │        │                                                                 │
│  └────────┘                                                                 │
│                                                                             │
│  ┏━━━━━━━━┓  Focused: border-gray-900, ring-2 ring-gray-200                 │
│  ┃        ┃                                                                 │
│  ┗━━━━━━━━┛                                                                 │
│                                                                             │
│  ╔════════╗  Error: border-red-500                                          │
│  ║        ║                                                                 │
│  ╚════════╝                                                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Transition Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  PHONE INPUT STEP                        CODE ENTRY STEP                    │
│  ─────────────────                       ───────────────                    │
│                                                                             │
│  ┌─────────────────────┐                 ┌─────────────────────┐            │
│  │                     │                 │                     │            │
│  │  +1  │ (555) 123... │  ──────────►    │  Enter the code...  │            │
│  │                     │   Send Code     │                     │            │
│  │  [ Send Code ]      │   Success       │  ┌─┐┌─┐┌─┐┌─┐┌─┐┌─┐ │            │
│  │                     │                 │  └─┘└─┘└─┘└─┘└─┘└─┘ │            │
│  └─────────────────────┘                 │                     │            │
│           │                              │  [ Verify & Sign ]  │            │
│           │                              │                     │            │
│           ▼                              └─────────────────────┘            │
│  ┌─────────────────────┐                          │                         │
│  │  Error: Already     │                          │                         │
│  │  signed / Rate      │                          ▼                         │
│  │  limited / etc.     │                 ┌─────────────────────┐            │
│  └─────────────────────┘                 │                     │            │
│           │                              │  ✓ Success!         │            │
│           │                              │                     │            │
│           ▼                              │  You've signed the  │            │
│  ┌─────────────────────┐                 │  letter.            │            │
│  │  User can retry     │                 │                     │            │
│  │  with different     │                 └─────────────────────┘            │
│  │  number             │                                                    │
│  └─────────────────────┘                                                    │
│                                                                             │
│  Animation: fade-out old content, fade-in new content                       │
│  Duration: 200-300ms, ease-in-out                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```
