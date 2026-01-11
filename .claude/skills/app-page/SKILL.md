# App Page Structure Skill

Use this skill when creating new pages, routes, or layouts in the Next.js App Router.

## Site Structure

```
/                       → Home: Manifesto + Sign Flow + Signature Wall
/sig/[signatureId]      → Share page (redirects to home with referral)
```

## File Naming Conventions

| Pattern | Purpose |
|---------|---------|
| `page.tsx` | Server component page |
| `page.client.tsx` | Client component (imported by server page) |
| `layout.tsx` | Server layout |
| `layout.client.tsx` | Client layout |

## Server Component Pattern

```typescript
// page.tsx (Server Component)
import type { Metadata } from "next"
import { SomePresenter } from "@/components/presenters/some/presenter"

export const metadata: Metadata = {
  title: "Tech for Iran",
  description: "An open letter from founders, investors, and operators.",
}

export default function HomePage() {
  "use memo"  // React Compiler optimization

  return (
    <Stack as="main">
      {/* Server components and presenters */}
      <SomePresenter />
    </Stack>
  )
}
```

## Dynamic Routes with Server-Side Data

```typescript
// sig/[signatureId]/page.tsx
import { fetchQuery } from "convex/nextjs"
import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { truncate, url } from "@/lib/utils"

export type SignaturePageParams = {
  signatureId: Id<"signatures">
}

export type SignaturePageProps = {
  params: Promise<SignaturePageParams>
}

export async function generateMetadata({ params }: SignaturePageProps): Promise<Metadata> {
  const { signatureId } = await params

  try {
    const signature = await fetchQuery(api.signatures.query.get, { signatureId })

    if (!signature) {
      return {
        title: "Signature Not Found | Tech for Iran",
        description: "This signature could not be found.",
      }
    }

    const title = `${signature.name} signed Tech for Iran`
    const description = signature.commitment
      ? truncate(signature.commitment, { length: 160 })
      : `${signature.name} pledged to do business with a free Iran.`

    const shareURL = url(`/sig/${signatureId}`)

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: shareURL,
        type: "website",
        siteName: "Tech for Iran",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
    }
  } catch {
    return {
      title: "Signature Not Found | Tech for Iran",
      description: "This signature could not be found.",
    }
  }
}

export default async function SignaturePage({ params }: SignaturePageProps) {
  const { signatureId } = await params

  const signature = await fetchQuery(api.signatures.query.get, { signatureId })

  if (!signature) {
    return notFound()
  }

  // Redirect to home with referral tracking
  const successMessage = `${signature.name} encourages you to sign!`
  return redirect(`/?referredBy=${signatureId}&success=${encodeURIComponent(successMessage)}`)
}
```

## Server-Side Data Fetching

Use `fetchQuery` from `convex/nextjs` for server components:

```typescript
import { fetchQuery } from "convex/nextjs"
import { api } from "@/convex/_generated/api"

// In generateMetadata or page component
const signature = await fetchQuery(api.signatures.query.get, { signatureId })
```

## Example Directory Structure

```
src/app/
├── layout.tsx                    # Root layout with providers
├── page.tsx                      # Home: Manifesto + Sign Flow + Wall
├── globals.css                   # Global styles (Tailwind)
└── sig/
    └── [signatureId]/
        ├── page.tsx              # Share page with redirect
        └── not-found.tsx         # 404 handling (optional)
```

## Home Page Example

```typescript
// page.tsx
import type { Metadata } from "next"
import { Logo } from "@/components/assets/logo"
import { RisingLion } from "@/components/assets/rising-lion"
import { Prose } from "@/components/layout/prose"
import { HStack, Stack, VStack } from "@/components/layout/stack"
import { PageDescription, PageTitle } from "@/components/layout/text"
import Manifesto from "@/components/presenters/manifesto.mdx"
import { SignatureForm } from "@/components/presenters/signature/form"
import { SignatureWall } from "@/components/presenters/signature/wall"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Tech for Iran",
  description: "An open letter from founders, investors, and operators.",
}

export default function HomePage() {
  "use memo"

  return (
    <Stack as="main" className={cn("flex-col md:flex-row", "gap-12 lg:gap-16 xl:gap-24")}>
      <VStack className="gap-8 flex-1 lg:flex-2/5 xl:flex-1/3 max-w-xl mt-14 lg:mt-16 xl:mt-20">
        <RisingLion className="w-full" />

        <HStack className="gap-4 lg:gap-6" justify="between">
          <VStack className="gap-2">
            <PageTitle>Tech for Iran</PageTitle>
            <PageDescription>
              An open letter from founders, investors, and operators.
            </PageDescription>
          </VStack>
          <Logo className="size-20" />
        </HStack>

        <Prose>
          <Manifesto />
        </Prose>

        <SignatureForm />
      </VStack>

      <SignatureWall
        className="flex-1 lg:flex-3/5 xl:flex-2/3"
        gridClassName="grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3"
      />
    </Stack>
  )
}
```

## Referral Tracking Pattern

Share pages redirect with referral info in URL params:

```typescript
// In share page (sig/[signatureId]/page.tsx)
const successMessage = `${signature.name} encourages you to sign!`
return redirect(`/?referredBy=${signatureId}&success=${encodeURIComponent(successMessage)}`)
```

## MDX Content

Import MDX files directly as components:

```typescript
import Manifesto from "@/components/presenters/manifesto.mdx"

<Prose>
  <Manifesto />
</Prose>
```

## Layout Components

Use layout components from `@/components/layout/`:

```typescript
import { Stack, HStack, VStack } from "@/components/layout/stack"
import { Prose } from "@/components/layout/prose"
import { PageTitle, PageDescription } from "@/components/layout/text"

<Stack as="main" className="gap-12">
  <VStack className="gap-8">
    <PageTitle>Title</PageTitle>
    <PageDescription>Description text.</PageDescription>
  </VStack>
</Stack>
```

## Checklist

- [ ] Server component uses `"use memo"` directive
- [ ] `Metadata` exported for SEO
- [ ] Dynamic routes have typed params (`SignaturePageParams`)
- [ ] Props type includes `params: Promise<Params>`
- [ ] Use `fetchQuery` for server-side Convex queries
- [ ] Handle `notFound()` for missing data
- [ ] Share pages redirect with referral tracking
- [ ] Use `url()` helper for absolute URLs
- [ ] MDX content wrapped in `<Prose>`
- [ ] Responsive layout with `Stack` + `flex-col md:flex-row`
