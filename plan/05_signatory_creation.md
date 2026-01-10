# Step 5: Signatory Creation

Backend logic to create signatory records after phone verification.

## Overview

This step handles the final stage of the sign flow: after a user successfully verifies their phone number, their signatory record is created in the database. This mutation captures their identity (name, title, company), their optional content (why they signed, 100-day commitment), and tracks referrals if they arrived via another signatory's share link.

## Requirements

### Create Signatory Mutation

Create an authenticated mutation in `src/convex/fns/signatories.ts` that:

**Arguments:**
- `name` (string, required) - Full name, max 100 characters
- `title` (string, required) - Job title, max 100 characters
- `company` (string, required) - Company name, max 100 characters
- `phoneHash` (string, required) - SHA256 hash of verified phone number, exactly 64 hex characters
- `whySigned` (string, optional) - Why they're signing, max 280 characters
- `commitmentText` (string, optional) - Their "100 days" commitment, max 2000 characters
- `referredBy` (signatory ID, optional) - ID of the signatory who referred them

**Validation:**
- Validate the `referredBy` ID actually exists if provided; silently ignore if invalid

**Behavior:**

*New Signatory (phone hash not found):*
- Create a new signatory record
- Set `pinned` to false
- Set `upvoteCount` to 0
- Store the referredBy ID if valid
- Associate the signatory with the authenticated user
- Return `{ signatoryId, isUpdate: false }`

*Returning Signatory (phone hash already exists):*
- Find the existing signatory by `phoneHash`
- Update their profile fields (name, title, company)
- Update their content fields (whySigned, commitmentText) if provided
- Associate the signatory with the authenticated user (update `userId` field)
- Do NOT update referredBy (preserve original attribution)
- Do NOT reset pinned or upvoteCount
- Return `{ signatoryId, isUpdate: true }`

### Query: Get Current User's Signatory

Create an authenticated query `mine` that returns the current user's signatory record if it exists, or null if they haven't signed yet.

### Query: Get Signatory by Phone

Create a public query `getByPhoneHash` that takes a `phoneHash` and returns the signatory record if one exists with that hash, or null otherwise. This can be used to:
- Pre-populate form fields for returning signatories
- Show personalized messaging (e.g., "Welcome back, [name]!")
- Indicate to the UI that this will be an update rather than a new signup

### Query: Get Referral Count

Create a query `referralCount` that takes a `signatoryId` and returns the count of signatories who have that ID in their `referredBy` field. This powers the "X has inspired Y others to sign" display on share pages.

### Referral Tracking Utilities

Create client-side utilities in `src/lib/referral.ts` for managing the referral cookie:

- `setReferralId(signatoryId)` - Store the referring signatory's ID when visiting a share page. Use both a cookie (7-day expiry) and localStorage as backup.
- `getReferralId()` - Retrieve the stored referral ID, checking cookie first, then localStorage.
- `clearReferralId()` - Clear the referral data after successful signup.

## Error Cases

| Scenario | Behavior |
|----------|----------|
| Duplicate phone hash | Update existing signatory and associate with current user (not an error) |
| Duplicate userId | Return existing signatory (idempotent) |
| Invalid referredBy | Silently ignore, create without referral |
| Validation failure | Return specific field errors |

## Files to Create/Modify

- `src/convex/fns/signatories.ts` - Add create mutation and queries
- `src/lib/referral.ts` - Referral tracking utilities
- Ensure `src/convex/schema.ts` has the required indexes (`by_phoneHash`, `by_userId`)

---

## UX / UI

### User Experience

The signatory creation happens automatically and invisibly after phone verification. The user never sees a "creating your record" step - they simply enter their verification code, and upon success, they're smoothly transitioned to the success state.

**Critical UX Considerations:**

1. **Seamless Transition**: After the 6-digit code is verified, there should be no visible loading or intermediate state. The success screen should appear immediately (optimistic UI with the mutation happening in the background).

2. **Returning Signatories**: If a user verifies a phone number that already has a signatory record, they are seamlessly "signed in" to that record. Their profile can be updated with the new form data they entered. The user sees the same success state as a new signatory - no special messaging needed.

3. **Referral Attribution**: Users who arrive via a share link (`/s/[signatory_id]`) should have their referral tracked silently. They should never be aware of or have to interact with referral tracking.

4. **Form Data Preservation**: All the data the user entered in the progressive sign flow (name, title, company, why signed, commitment) must be preserved through the verification step and submitted together when creating the signatory.

### Interface Elements

- The success state displays the new signatory's unique share URL (`/s/[signatory_id]`)
- "Join X founders ready for a free Iran" shows the real-time count
- Share buttons have pre-filled copy for Twitter/X and LinkedIn
- "Copy Link" button for easy sharing

---

## How It Works

### Technical Flow

1. **Phone Verification Completes**: After Clerk verifies the 6-digit SMS code successfully, the client receives confirmation.

2. **Phone Hashing**: The client computes a SHA256 hash of the verified phone number. This hash is what gets stored - never the actual phone number.

3. **Referral Check**: Before creating the signatory, the client checks localStorage/cookies for a `referred_by` value that was set when the user first visited a share page.

4. **Mutation Call**: The client calls the `signatories.create` mutation with:
   - All form data collected during the progressive sign flow
   - The phone hash
   - The referral ID (if present)

5. **Server Processing**: The Convex mutation:
   - Validates all input fields with Zod
   - Queries the `by_phoneHash` index to check for existing signatory
   - **If existing signatory found:**
     - Updates their profile fields (name, title, company)
     - Updates content fields (whySigned, commitmentText) if provided
     - Associates the signatory with the current authenticated user
     - Preserves original referredBy, pinned, and upvoteCount
     - Returns `{ signatoryId, isUpdate: true }`
   - **If no existing signatory:**
     - If `referredBy` is provided, validates that signatory exists
     - Creates new signatory record with default values for `pinned` (false) and `upvoteCount` (0)
     - Returns `{ signatoryId, isUpdate: false }`

6. **Success Response**: The mutation returns `{ signatoryId, isUpdate }`, which the client uses to:
   - Clear the referral cookie
   - Generate the share URL (`/s/[signatoryId]`)
   - Transition to the success state (same UX for both new and returning signatories)

### Referral Attribution Flow

1. User A signs and shares their link: `techforiran.com/s/abc123`
2. User B clicks the link and lands on User A's share page
3. The share page sets a cookie: `referred_by=abc123`
4. User B decides to sign and goes through the flow
5. When User B's signatory is created, `abc123` is stored in their `referredBy` field
6. User A's share page now shows "inspired X+1 others to sign"

---

## Verification Plan

### Prerequisites
- Complete Steps 1-4 (schema, Clerk setup, sign flow UI, phone verification)
- Have a browser with developer tools available
- Have access to a phone that can receive SMS

### Test Cases

**1. Basic Signatory Creation**
- Navigate to the home page `/`
- Complete the sign flow with valid test data:
  - Name: "Test User"
  - Title: "Engineer"
  - Company: "Test Corp"
  - Why signed: "Testing the flow"
  - Commitment: "Will mentor 5 founders"
- Complete phone verification with a real phone number
- Verify you see the success state with your share URL
- Open Convex dashboard and confirm the signatory record was created with all fields

**2. Returning Signatory (Same Phone)**
- Log out or use a different browser session
- Using the same phone number from Test Case 1, go through the sign flow again with different form data:
  - Name: "Updated Name"
  - Title: "New Title"
  - Company: "New Corp"
- Complete phone verification
- Verify you see the success state with the same share URL as before
- Open Convex dashboard and confirm:
  - The signatory record was updated (not duplicated)
  - Name, title, company reflect the new values
  - Original referredBy, pinned, and upvoteCount are preserved
  - The mutation returned `isUpdate: true`

**3. Optional Fields**
- Start a new sign flow (use incognito or different phone)
- Skip the "Why I'm signing" section
- Skip the "100 days commitment" section
- Complete verification
- Verify the signatory was created with `whySigned: null` and `commitmentText: null`

**4. Referral Tracking**
- Get the share URL from Test Case 1 (e.g., `/s/abc123`)
- Open an incognito browser and navigate to that share page
- Check Application > Cookies in dev tools for `referred_by=abc123`
- Complete the full sign flow with a different phone number
- Verify the new signatory has `referredBy: abc123` in the database
- Visit the original share page and verify the referral count increased

**5. Invalid Referral Handling**
- Manually set a cookie: `referred_by=invalid_id_12345`
- Complete the sign flow with a new phone number
- Verify the signatory was created successfully with `referredBy: null` (not the invalid ID)
- No error should be shown to the user

**6. Query Verification**
- After signing, refresh the page
- The app should recognize you've already signed (via the `mine` query)
- You should not see the sign flow again, or should see an "already signed" state

**7. Referral Count Query**
- Visit `/s/[your_signatory_id]`
- Verify the "has inspired X others to sign" text shows the correct count
- Have another test user sign via your link
- Refresh and verify the count increased by 1
