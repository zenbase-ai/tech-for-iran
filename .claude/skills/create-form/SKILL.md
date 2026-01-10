# Create Form Skill

Use this skill when creating forms with validation that coordinate between frontend and Convex backend.

## Schema Definition (`src/schemas/`)

```typescript
// src/schemas/sign-letter.ts
import * as z from "zod"

// Part 1: Config object with constraints and defaults
export const signLetter = {
  max: { whySigned: 280 },
  defaultValues: {
    name: "",
    title: "",
    company: "",
    whySigned: "",
    commitment: "",
  },
}

// Part 2: Zod schema with validation
export const SignLetter = z.object({
  name: z.string().min(1, "Name is required"),
  title: z.string().min(1, "Title is required"),
  company: z.string().min(1, "Company is required"),
  whySigned: z.string().max(signLetter.max.whySigned).optional(),
  commitment: z.string().optional(),
})

// Part 3: TypeScript type
export type SignLetter = z.infer<typeof SignLetter>
```

## Client Component Setup

```typescript
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller } from "react-hook-form"
import { useMutation } from "convex/react"
import { useAsyncFn } from "@/hooks/use-async-fn"
import { useEffectEvent } from "react"
import { SignLetter, signLetter } from "@/schemas/sign-letter"
import { api } from "@/convex/_generated/api"

export const SignLetterForm: React.FC = () => {
  const form = useForm({
    resolver: zodResolver(SignLetter),
    defaultValues: signLetter.defaultValues,
  })

  const mutate = useAsyncFn(useMutation(api.fns.signatories.sign))

  const onSubmit = useEffectEvent(async (data: SignLetter) => {
    const result = await mutate.execute(data)
    if (result?.signatoryId) {
      // Navigate to success state or show share page
    }
  })

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Fields */}
      <Button type="submit" disabled={mutate.pending}>
        {mutate.pending ? "Signing..." : "Sign the Letter"}
      </Button>
    </form>
  )
}
```

## Field Component Pattern

```typescript
import { Field, FieldLabel, FieldContent, FieldError, FieldDescription } from "@/components/ui/field"

<Controller
  control={form.control}
  name="name"
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor={field.name}>Your full name</FieldLabel>
      <FieldContent>
        <Input
          {...field}
          id={field.name}
          aria-invalid={fieldState.invalid}
          placeholder="Dara Khosrowshahi"
        />
      </FieldContent>
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>
```

## Text Input Fields (Name, Title, Company)

```typescript
<Controller
  control={form.control}
  name="title"
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel>Your title</FieldLabel>
      <FieldContent>
        <Input
          {...field}
          placeholder="CEO"
          aria-invalid={fieldState.invalid}
        />
      </FieldContent>
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>

<Controller
  control={form.control}
  name="company"
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel>Your company</FieldLabel>
      <FieldContent>
        <Input
          {...field}
          placeholder="Uber"
          aria-invalid={fieldState.invalid}
        />
      </FieldContent>
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>
```

## Textarea with Character Count

```typescript
<Controller
  control={form.control}
  name="whySigned"
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel>Why I'm signing (optional)</FieldLabel>
      <FieldContent>
        <Textarea
          {...field}
          rows={3}
          maxLength={signLetter.max.whySigned}
          aria-invalid={fieldState.invalid}
          placeholder="My parents left Iran in 1979..."
        />
      </FieldContent>
      <FieldDescription className="text-right">
        {field.value?.length ?? 0} / {signLetter.max.whySigned} characters
      </FieldDescription>
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>
```

## Free Text Commitment Field

```typescript
<Controller
  control={form.control}
  name="commitment"
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel>In the first 100 days of a free Iran, I commit to:</FieldLabel>
      <FieldContent>
        <Textarea
          {...field}
          rows={4}
          aria-invalid={fieldState.invalid}
          placeholder="Investing $10M in Iranian startups"
        />
      </FieldContent>
      <FieldDescription>
        Examples: "Hiring 50 engineers from Tehran", "Opening our first Middle East office in Iran"
      </FieldDescription>
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>
```

## Progressive Disclosure Pattern

For the sign flow, sections fade in progressively as previous sections are completed:

```typescript
const { watch } = form
const name = watch("name")
const title = watch("title")
const company = watch("company")
const whySigned = watch("whySigned")
const commitment = watch("commitment")

// Section visibility based on completion
const showWhySection = name && title && company
const showCommitmentSection = showWhySection && (whySigned || skippedWhy)
const showVerificationSection = showCommitmentSection && (commitment || skippedCommitment)

return (
  <form>
    {/* Identity section - always visible */}
    <IdentityFields />

    {/* Why section - fades in after identity */}
    {showWhySection && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <WhySigningField />
        <Button variant="link" onClick={() => setSkippedWhy(true)}>Skip</Button>
      </motion.div>
    )}

    {/* Commitment section - fades in after why */}
    {showCommitmentSection && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <CommitmentField />
        <Button variant="link" onClick={() => setSkippedCommitment(true)}>Skip</Button>
      </motion.div>
    )}

    {/* Phone verification - fades in last */}
    {showVerificationSection && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <PhoneVerification />
      </motion.div>
    )}
  </form>
)
```

## Phone Verification Flow

```typescript
const [verificationStep, setVerificationStep] = useState<"phone" | "code">("phone")
const [phoneNumber, setPhoneNumber] = useState("")

const sendCode = useAsyncFn(useAction(api.fns.verification.sendCode))
const verifyCode = useAsyncFn(useAction(api.fns.verification.verify))

const handleSendCode = useEffectEvent(async () => {
  const result = await sendCode.execute({ phone: phoneNumber })
  if (result?.success) {
    setVerificationStep("code")
  }
})

const handleVerify = useEffectEvent(async (code: string) => {
  const result = await verifyCode.execute({ phone: phoneNumber, code })
  if (result?.phoneHash) {
    // Phone verified, submit the full form
    await onSubmit({ ...form.getValues(), phoneHash: result.phoneHash })
  }
})
```

## Convex Mutation with Validation

```typescript
// src/convex/fns/signatories.ts
import { SignLetter } from "@/schemas/sign-letter"
import { errorMessage } from "@/convex/helpers/server"

type Sign =
  | { signatoryId: Id<"signatories">; success: string }
  | { signatoryId: null; error: string }

export const sign = mutation({
  args: {
    name: v.string(),
    title: v.string(),
    company: v.string(),
    whySigned: v.optional(v.string()),
    commitment: v.optional(v.string()),
    phoneHash: v.string(),
    referredBy: v.optional(v.id("signatories")),
  },
  handler: async (ctx, args): Promise<Sign> => {
    // Re-validate on server (schema imported from shared location)
    const { data, success, error } = SignLetter.safeParse(args)
    if (!success) {
      return { signatoryId: null, error: errorMessage(error) }
    }

    // Check for duplicate phone hash
    const existing = await ctx.db
      .query("signatories")
      .withIndex("by_phoneHash", (q) => q.eq("phoneHash", args.phoneHash))
      .first()

    if (existing) {
      return {
        signatoryId: null,
        error: "This phone number has already signed the letter.",
      }
    }

    // Create signatory
    const signatoryId = await ctx.db.insert("signatories", {
      name: data.name,
      title: data.title,
      company: data.company,
      phoneHash: args.phoneHash,
      whySigned: data.whySigned ?? null,
      commitment: data.commitment ?? null,
      referredBy: args.referredBy ?? null,
      pinned: false,
      upvoteCount: 0,
      createdAt: Date.now(),
    })

    return { signatoryId, success: "You've signed the letter!" }
  }
})
```

## Loading States

```typescript
if (!serverData) {
  return <Skeleton className="h-29 w-full" />
}

return <ActualForm data={serverData} />
```

## useAsyncFn Hook

Returns `{ execute, pending, error, data }` with automatic toast notifications:

```typescript
const mutate = useAsyncFn(useMutation(api.fns.signatories.sign))

// Execute returns the mutation result
const result = await mutate.execute({ ...data })

// Check states
{mutate.pending && <Spinner />}
{mutate.error && <ErrorMessage>{mutate.error}</ErrorMessage>}
```

## Data Flow

```
Schema Definition (src/schemas/)
    |
Client Form Setup (useForm + zodResolver)
    |
Field Components (Controller + Field system)
    |
Progressive Disclosure (watch + conditional rendering)
    |
Phone Verification (Clerk SMS flow with custom UI)
    |
Form Submit (useAsyncFn + useEffectEvent)
    |
Convex Mutation (re-validates with same Zod schema)
    |
Discriminated Union Return ({ success } | { error })
    |
Toast Notifications (automatic via useAsyncFn)
    |
Success State (share page with referral link)
```

## Checklist

- [ ] Schema in `src/schemas/` with config + Zod + type
- [ ] Form setup with `zodResolver(Schema)`
- [ ] Default values from schema config
- [ ] Controller pattern for all fields
- [ ] Field components with `data-invalid` attribute
- [ ] Character count for limited text fields (e.g., whySigned max 280)
- [ ] Progressive disclosure for multi-step flows
- [ ] Skip buttons for optional sections
- [ ] Phone verification with custom UI (not Clerk components)
- [ ] `useAsyncFn` wraps mutation
- [ ] `useEffectEvent` for stable submit handler
- [ ] Server re-validates with same Zod schema
- [ ] Discriminated union return type
- [ ] Duplicate phone hash check
- [ ] Success state with share/referral link
