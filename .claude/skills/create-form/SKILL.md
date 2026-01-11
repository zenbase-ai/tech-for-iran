# Create Form Skill

Use this skill when creating forms with validation that coordinate between frontend and Convex backend.

## Schema Definition (`src/schemas/`)

```typescript
// src/schemas/signature.ts
import * as z from "zod"

// Part 1: Config object with constraints and defaults (camelCase)
export const createSignature = {
  min: { name: 1, title: 1, company: 1, xUsername: 1 },
  max: {
    name: 80,
    title: 80,
    company: 80,
    because: 160,
    commitment: 160,
    xUsername: 24,
  },
  defaultValues:
    process.env.NODE_ENV === "development"
      ? { name: "Dev User", title: "Engineer", company: "Acme", xUsername: "", because: "", commitment: "" }
      : { name: "", title: "", company: "", xUsername: "", because: "", commitment: "" },
}

// Part 2: Zod schema with validation (PascalCase)
export const CreateSignature = z.object({
  name: z.string().trim()
    .min(createSignature.min.name, "Name is required")
    .max(createSignature.max.name),
  title: z.string().trim()
    .min(createSignature.min.title, "Title is required")
    .max(createSignature.max.title),
  company: z.string().trim()
    .min(createSignature.min.company, "Company is required")
    .max(createSignature.max.company),
  xUsername: z.string().trim()
    .transform((v) => (v.startsWith("@") ? v.slice(1) : v))
    .pipe(
      z.string()
        .min(createSignature.min.xUsername, "X username is required")
        .max(createSignature.max.xUsername)
        .regex(/^[a-zA-Z0-9_]+$/, "Invalid X username format")
    ),
  because: z.string().trim()
    .max(createSignature.max.because)
    .transform((v) => (v.endsWith(".") ? v.slice(0, -1) : v)),
  commitment: z.string().trim()
    .max(createSignature.max.commitment)
    .transform((v) => (v.endsWith(".") ? v.slice(0, -1) : v)),
  referredBy: z.string().optional(),
})

// Part 3: TypeScript type (same name as schema)
export type CreateSignature = z.infer<typeof CreateSignature>
```

## Client Component Setup

```typescript
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery } from "convex/react"
import { AnimatePresence, motion } from "motion/react"
import { useEffect, useEffectEvent, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { api } from "@/convex/_generated/api"
import useAsyncFn from "@/hooks/use-async-fn"
import { clearReferredBy, getReferredBy } from "@/lib/cookies"
import { CreateSignature, createSignature } from "@/schemas/signature"

export const SignatureForm: React.FC<{ className?: string }> = ({ className }) => {
  // Skip state for optional sections
  const [skippedBecause, setSkippedBecause] = useState(false)
  const [skippedCommitment, setSkippedCommitment] = useState(false)

  // Mutation with useAsyncFn
  const create = useAsyncFn(useMutation(api.signatures.mutate.create))
  const signatureId = create.data?.data?.signatureId

  // Form setup with referral tracking
  const form = useForm({
    resolver: zodResolver(CreateSignature),
    defaultValues: {
      ...createSignature.defaultValues,
      referredBy: getReferredBy(),
    },
    mode: "onBlur",
  })

  // Section visibility logic
  const { name, title, company, because, commitment } = form.watch()
  const showWhy = name.length > 0 && title.length > 0 && company.length > 0
  const showCommitment = showWhy && (because.length > 0 || skippedBecause)
  const showXUsername = showCommitment && (commitment.length > 0 || skippedCommitment)

  // Submit handler
  const handleSign = useEffectEvent(async (formData: CreateSignature) => {
    await create.execute(formData)
  })

  // Clear referral on success
  useEffect(() => {
    if (signatureId) clearReferredBy()
  }, [signatureId])

  return (
    <form onSubmit={form.handleSubmit(handleSign)}>
      {/* Hidden referral input */}
      <input type="hidden" {...form.register("referredBy")} />
      {/* Form fields... */}
    </form>
  )
}
```

## Animation Pattern

Define a reusable animation config for progressive disclosure:

```typescript
const revealAnimation = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: { duration: 0.4, ease: "easeOut" },
} as const

// Usage with AnimatePresence
<AnimatePresence>
  {showSection && (
    <motion.div {...revealAnimation}>
      {/* Section content */}
    </motion.div>
  )}
</AnimatePresence>
```

## Skip Button Pattern

For optional sections that users can skip:

```typescript
type SkipButtonProps = {
  setState: React.Dispatch<React.SetStateAction<boolean>>
}

const SkipButton: React.FC<SkipButtonProps> = ({ setState }) => (
  <Button onClick={() => setState(true)} size="sm" type="button" variant="outline">
    Skip
  </Button>
)

// Usage
{!fieldValue && <SkipButton setState={setSkippedSection} />}
```

## Inline Form Pattern (Sentence-Style)

For forms embedded in prose using `InlineField` and `LetterInput`:

```typescript
import { InlineField } from "@/components/ui/inline-field"
import { LetterInput } from "@/components/ui/letter-input"
import { HStack } from "@/components/layout/stack"

<HStack className="gap-y-0.5" items="baseline" wrap>
  I,&nbsp;
  <Controller
    control={form.control}
    name="name"
    render={({ field, fieldState }) => (
      <InlineField>
        <LetterInput
          {...field}
          aria-invalid={fieldState.invalid}
          autoComplete="name"
          disabled={formState.isSubmitted}
          maxLength={createSignature.max.name}
          placeholder="Full Name"
        />
      </InlineField>
    )}
  />
  ,&nbsp;
  <Controller
    control={form.control}
    name="title"
    render={({ field, fieldState }) => (
      <InlineField>
        <LetterInput
          {...field}
          aria-invalid={fieldState.invalid}
          maxLength={createSignature.max.title}
          placeholder="Title"
        />
      </InlineField>
    )}
  />
  &nbsp;at&nbsp;
  <Controller
    control={form.control}
    name="company"
    render={({ field, fieldState }) => (
      <InlineField>
        <LetterInput
          {...field}
          aria-invalid={fieldState.invalid}
          autoComplete="organization"
          maxLength={createSignature.max.company}
          placeholder="Company"
        />
      </InlineField>
    )}
  />
</HStack>
```

## X Username Input Pattern

Using InputGroup for prefixed/suffixed inputs:

```typescript
import { FaXTwitter } from "react-icons/fa6"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"

<Controller
  control={form.control}
  name="xUsername"
  render={({ field, fieldState }) => (
    <InputGroup className="w-fit">
      <InputGroupAddon align="inline-start">
        <InputGroupText>@</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput
        {...field}
        aria-invalid={fieldState.invalid}
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect="off"
        maxLength={createSignature.max.xUsername}
        placeholder="username"
      />
      <InputGroupAddon align="inline-end">
        <InputGroupText>
          <FaXTwitter />
        </InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  )}
/>
```

## Block Field Pattern

For traditional form fields using the Field component system:

```typescript
import { Field, FieldLabel, FieldContent, FieldError, FieldDescription } from "@/components/ui/field"

<Controller
  control={form.control}
  name="because"
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor={field.name}>Why I'm signing (optional)</FieldLabel>
      <FieldContent>
        <Textarea
          {...field}
          id={field.name}
          rows={3}
          maxLength={createSignature.max.because}
          aria-invalid={fieldState.invalid}
          placeholder="My parents left Iran in 1979..."
        />
      </FieldContent>
      <FieldDescription className="text-right">
        {field.value?.length ?? 0} / {createSignature.max.because} characters
      </FieldDescription>
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>
```

## Success Section Pattern

After successful form submission:

```typescript
import { LuCheck, LuCopy, LuArrowRight } from "react-icons/lu"
import { NumberTicker } from "@/components/ui/number-ticker"
import { CopyButton } from "@/components/ui/copy-button"
import { SocialShareButtons } from "@/components/social-share-buttons"
import { Separator } from "@/components/ui/separator"
import { url } from "@/lib/utils"

type SuccessSectionProps = { signatureId: Id<"signatures"> }

const SuccessSection: React.FC<SuccessSectionProps> = ({ signatureId }) => {
  const totalCount = useQuery(api.signatures.query.count, signatureId ? {} : "skip")
  const shareURL = signatureId ? url(`/sig/${signatureId}`) : ""

  return (
    <VStack className="gap-8 items-center text-center">
      {/* Success icon */}
      <div className="flex size-16 items-center justify-center rounded-full bg-green-500/10">
        <LuCheck className="size-8 text-green-500" />
      </div>

      {/* Confirmation message */}
      <VStack className="gap-2 items-center">
        <h2 className="text-2xl font-semibold sm:text-3xl">You've signed the letter.</h2>
        <p className="text-muted-foreground">
          Join <NumberTicker className="font-medium tabular-nums" value={totalCount ?? 0} />{" "}
          founders ready for a free Iran.
        </p>
      </VStack>

      {/* Share URL */}
      <VStack className="gap-3">
        <span className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Share your pledge
        </span>
        <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-4 py-3">
          <code className="flex-1 truncate font-mono text-sm">
            {shareURL.replace(/^https?:\/\//, "")}
          </code>
          <CopyButton content={shareURL} leftIcon={LuCopy} size="sm" variant="ghost">
            Copy Link
          </CopyButton>
        </div>
      </VStack>

      <SocialShareButtons className="w-full" url={shareURL} />

      <Separator className="max-w-md opacity-30" />

      <Button asChild variant="link">
        <Link href="/">
          See all commitments
          <LuArrowRight className="size-4" />
        </Link>
      </Button>
    </VStack>
  )
}

// Usage in form
<AnimatePresence>
  {!!signatureId && (
    <motion.div {...revealAnimation}>
      <Separator className="opacity-30 mb-8" />
      <SuccessSection signatureId={signatureId} />
    </motion.div>
  )}
</AnimatePresence>
```

## Convex Mutation with Validation

```typescript
// src/convex/signatures/mutate.ts
import { CreateSignature } from "@/schemas/signature"
import { errorMessage, mutation } from "@/convex/helpers/server"

type Create =
  | { signatureId: Id<"signatures">; success: string }
  | { signatureId: null; error: string }

export const create = mutation({
  args: {
    name: v.string(),
    title: v.string(),
    company: v.string(),
    xUsername: v.string(),
    because: v.string(),
    commitment: v.string(),
    referredBy: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Create> => {
    // Server-side validation with shared schema
    const { data, success, error } = CreateSignature.safeParse(args)
    if (!success) {
      return { signatureId: null, error: errorMessage(error) }
    }

    // Check for duplicate xUsername
    const existing = await ctx.db
      .query("signatures")
      .withIndex("by_xUsername", (q) => q.eq("xUsername", data.xUsername))
      .first()

    if (existing) {
      return { signatureId: null, error: "This X username has already signed." }
    }

    // Create signature
    const signatureId = await ctx.db.insert("signatures", {
      ...data,
      referredBy: args.referredBy ?? null,
      pinned: false,
      upvoteCount: 0,
    })

    return { signatureId, success: "You've signed the letter!" }
  },
})
```

## Data Flow

```
Schema Definition (src/schemas/)
    |
Client Form Setup (useForm + zodResolver)
    |
Referral Tracking (getReferredBy in defaultValues)
    |
Section Visibility (form.watch + boolean conditions)
    |
Field Components (Controller + InlineField/LetterInput or Field system)
    |
Progressive Disclosure (AnimatePresence + motion + revealAnimation)
    |
Skip Buttons (optional sections)
    |
Form Submit (useAsyncFn + useEffectEvent)
    |
Convex Mutation (re-validates with same Zod schema)
    |
Discriminated Union Return ({ success } | { error })
    |
Success State (SuccessSection with share URL)
    |
Clear Referral (clearReferredBy on success)
```

## Checklist

- [ ] Schema in `src/schemas/` with config (camelCase) + Zod (PascalCase) + type
- [ ] Config includes `min`, `max`, and `defaultValues`
- [ ] Dev defaults for faster testing
- [ ] Form setup with `zodResolver(Schema)` and `mode: "onBlur"`
- [ ] Referral tracking in `defaultValues` via `getReferredBy()`
- [ ] Hidden input for `referredBy`
- [ ] Section visibility via `form.watch()` destructuring
- [ ] Skip state for optional sections (`useState(false)`)
- [ ] `revealAnimation` const for consistent animations
- [ ] `AnimatePresence` wrapper for conditional sections
- [ ] `InlineField` + `LetterInput` for sentence-style forms
- [ ] `InputGroup` pattern for prefixed inputs (X username)
- [ ] `useAsyncFn` wraps mutation
- [ ] `useEffectEvent` for stable submit handler
- [ ] Clear referral on success with `clearReferredBy()`
- [ ] Server re-validates with same Zod schema
- [ ] Discriminated union return type
- [ ] Success section with share URL and social buttons
