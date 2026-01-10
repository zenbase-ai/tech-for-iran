# App Page Structure Skill

Use this skill when creating new pages, routes, or layouts in the Next.js App Router.

## Site Structure

```
/                   → Manifesto + Sign Flow (home)
/commitments        → Wall of Commitments (browsable grid)
/s/[signatory_id]   → Individual signatory share page (dynamic OG image)
```

## Route Groups

**`(clerk)`** - Clerk authentication pages (sign-in, sign-up) - used for admin access only
**Public routes** - Most routes are public; phone verification happens inline in the sign flow

## File Naming Conventions

| Pattern | Purpose |
|---------|---------|
| `page.tsx` | Server component page |
| `page.client.tsx` | Client component (imported by server page) |
| `layout.tsx` | Server layout |
| `layout.client.tsx` | Client layout |
| `_filename.tsx` | Private/co-located component (route-specific) |
| `_types.ts` | Type definitions for route params |

## Server vs Client Component Pattern

```typescript
// page.tsx (Server Component)
"use memo"  // React Compiler optimization

export const metadata = { title: "Page Title" }

export default function MyPage() {
  "use memo"
  return <MyPageClient />
}

// page.client.tsx (Client Component)
"use client"

export function MyPageClient() {
  const form = useForm(...)
  // Client-side hooks and interactivity
}
```

## Dynamic Routes

```typescript
// s/[signatory_id]/_types.ts
export type SignatoryPageParams = {
  signatory_id: string  // UUID or slug like "knejatian"
}

// s/[signatory_id]/page.tsx
export type SignatoryPageProps = {
  params: Promise<SignatoryPageParams>
}

// s/[signatory_id]/page.client.tsx
const { signatory_id } = useParams<SignatoryPageParams>()
```

## Private Components

Prefix with `_` for route-specific components:
- `_manifesto.tsx`, `_sign-flow.tsx`, `_success.tsx`
- `_card.tsx`, `_filters.tsx`, `_stats.tsx`
- Never exported to other routes
- Always mark with `"use client"` if using hooks

## Data Fetching

**Server-side (page.tsx):**
```typescript
import { fetchQuery } from "convex/nextjs"

export const generateMetadata = async (props: SignatoryPageProps): Promise<Metadata> => {
  const { signatory_id } = await props.params
  const signatory = await fetchQuery(api.fns.signatories.get, { id: signatory_id })
  return {
    title: `${signatory.name} - Tech for Iran`,
    openGraph: {
      images: [`/api/og/${signatory_id}`],  // Dynamic OG image
    },
  }
}
```

**Client-side (page.client.tsx):**
```typescript
import { useQuery } from "convex/react"

const signatory = useQuery(api.fns.signatories.get, { id: signatory_id })
const commitments = useQuery(api.fns.commitments.list, { sort, limit: 20 })
```

## Example Directory Structure

```
src/app/
├── layout.tsx                    # Root layout with providers
├── page.tsx                      # Home: Manifesto + Sign Flow
├── page.client.tsx
├── _manifesto.tsx                # Manifesto section
├── _sign-flow/                   # Sign flow (progressive disclosure)
│   ├── index.tsx
│   ├── _identity.tsx             # Name, title, company step
│   ├── _why.tsx                  # "Why I'm signing" step (optional)
│   ├── _commitment.tsx           # "100 days" commitment step (optional)
│   ├── _verify.tsx               # Phone verification step
│   └── _success.tsx              # Post-sign success + share
├── commitments/
│   ├── page.tsx                  # Wall of Commitments
│   ├── page.client.tsx
│   ├── _card.tsx                 # Commitment card component
│   ├── _filters.tsx              # Sort/filter controls
│   └── _stats.tsx                # Aggregate stats header
├── s/
│   └── [signatory_id]/
│       ├── page.tsx              # Individual share page
│       ├── page.client.tsx
│       ├── _types.ts
│       └── _referral-cta.tsx     # "Add your name" CTA
├── api/
│   └── og/
│       └── [signatory_id]/
│           └── route.tsx         # Dynamic OG image generation
└── (clerk)/
    ├── sign-in/[[...sign-in]]/page.tsx
    └── sign-up/[[...sign-up]]/page.tsx
```

## Component Props Pattern

```typescript
export type CommitmentCardProps = {
  signatory: Doc<"signatories">
  onUpvote?: () => void
  className?: string
}

export const CommitmentCard: React.FC<CommitmentCardProps> = ({
  signatory,
  onUpvote,
  className,
}) => {
  // ...
}
```

## Phone Verification Flow

Phone verification uses Clerk API but with **completely custom UI**:

```typescript
// _verify.tsx
"use client"

export const VerifyStep: React.FC<VerifyStepProps> = ({ phoneNumber, onVerified }) => {
  const [code, setCode] = useState("")

  const sendCode = useEffectEvent(async () => {
    // Call Clerk API to send verification code
    await clerk.sendVerificationCode({ phoneNumber })
  })

  const verifyCode = useEffectEvent(async () => {
    // Call Clerk API to verify code
    const result = await clerk.verifyCode({ phoneNumber, code })
    if (result.success) {
      onVerified(hashPhoneNumber(phoneNumber))
    }
  })

  // Render custom OTP input, never Clerk components
}
```

## Referral Tracking

Track referrals via URL parameter stored in cookie/localStorage:

```typescript
// s/[signatory_id]/page.client.tsx
"use client"

import { useEffect } from "react"
import { useLocalStorage } from "usehooks-ts"

export function SignatoryPageClient({ signatory_id }: { signatory_id: string }) {
  const [referredBy, setReferredBy] = useLocalStorage<string | null>("referred_by", null)

  useEffect(() => {
    // Store referrer when visiting share page
    setReferredBy(signatory_id)
  }, [signatory_id, setReferredBy])

  // ...
}
```

## Checklist

- [ ] Server component uses `"use memo"` directive
- [ ] Client component has `"use client"` at top
- [ ] Dynamic routes have `_types.ts` file
- [ ] Private components prefixed with `_`
- [ ] Parallel data fetching with `Promise.all()`
- [ ] Props type named `ComponentNameProps`
- [ ] Share pages generate dynamic OG images
- [ ] Phone verification uses custom UI (no Clerk components)
- [ ] Referral tracking stored client-side before sign flow
