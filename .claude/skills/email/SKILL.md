# Email Template Skill

Create email templates in `src/emails/` using `@react-email/components` with Tailwind CSS styling.

## Directory Structure

```
src/emails/
├── layout.tsx           # Shared email layout wrapper
├── post-engagement.tsx  # Example: Post stats email
├── reconnect-account.tsx # Example: Account reconnection email
└── [new-template].tsx   # Your new email template
```

## Shared Layout

All emails should use the shared `EmailLayout` component from `./layout`:

```typescript
import EmailLayout from "./layout"

export default function MyEmail({ name }: MyEmailProps) {
  return (
    <EmailLayout preview="Short preview text for email clients">
      {/* Email content goes here */}
    </EmailLayout>
  )
}
```

The layout provides:
- HTML/Body wrapper with Tailwind config
- Custom fonts (Crimson Pro, Inter)
- Color theme matching the app
- Header with logo and branding
- Consistent container width (600px max)
- Footer with branding

## Component Template

```typescript
import { Button, Section, Text, Link } from "@react-email/components"
import EmailLayout from "./layout"

export type MyEmailProps = {
  name: string
  // ... other props with defaults for preview
}

export default function MyEmail({
  name = "John",  // Default for email preview
}: MyEmailProps) {
  return (
    <EmailLayout preview="Preview text shown in email clients">
      <Text className="m-0 text-[16px] leading-[24px] text-foreground">
        Hi {name},
      </Text>

      <Text className="m-0 mt-4 text-[16px] leading-[24px] text-foreground">
        Your email body content here.
      </Text>

      {/* CTA Button */}
      <Button
        className="rounded-md bg-primary px-6 py-3 text-center text-[16px] font-semibold text-primary-foreground no-underline"
        href="https://example.com"
      >
        Call to Action
      </Button>

      <Text className="m-0 mt-4 text-[14px] leading-[22px] text-muted-foreground">
        Footer text or additional info.
      </Text>
    </EmailLayout>
  )
}
```

## Available Components

Import from `@react-email/components`:

### Layout Components
- `Section` - Container for grouping content
- `Row` - Horizontal row (use with Column)
- `Column` - Column within a Row
- `Container` - Max-width container (already in layout)

### Content Components
- `Text` - Paragraph text
- `Heading` - Headings (h1-h6)
- `Link` - Hyperlinks
- `Button` - CTA buttons
- `Img` - Images

### Example Usage

```typescript
import {
  Button,
  Column,
  Heading,
  Img,
  Link,
  Row,
  Section,
  Text,
} from "@react-email/components"
```

## Styling with Tailwind

The layout includes a Tailwind config with these theme colors:

| Color | Usage |
|-------|-------|
| `background` | Email background |
| `foreground` | Primary text |
| `card` | Card backgrounds |
| `card-foreground` | Card text |
| `primary` | CTA buttons, highlights |
| `primary-foreground` | Text on primary |
| `muted` | Muted backgrounds |
| `muted-foreground` | Secondary text |
| `border` | Borders |

### Common Patterns

```typescript
// Primary text
<Text className="text-[16px] leading-[24px] text-foreground">

// Secondary/muted text
<Text className="text-[14px] leading-[22px] text-muted-foreground">

// Headings
<Heading className="text-[24px] font-bold text-foreground">

// Primary button
<Button className="rounded-md bg-primary px-6 py-3 text-[16px] font-semibold text-primary-foreground no-underline">

// Secondary/ghost button
<Button className="rounded-md border border-border px-6 py-3 text-[16px] font-semibold text-foreground no-underline">

// Card/box
<Section className="p-4 rounded-md border border-border">

// Spacing (use margin classes)
<Text className="m-0 mt-4">  // Reset margin, add top margin
```

## Props Pattern

Always provide default values for props to enable email preview:

```typescript
export type WelcomeEmailProps = {
  name: string
  signupDate: number
  referralCount?: number
}

export default function WelcomeEmail({
  name = "John Doe",
  signupDate = Date.now(),
  referralCount = 0,
}: WelcomeEmailProps) {
  // ...
}
```

## Two-Column Stats Grid

For displaying stats in a grid:

```typescript
<Section className="my-8">
  <Row>
    <Column className="w-1/2">
      <div className="rounded-lg bg-card p-4 text-center">
        <Text className="m-0 text-muted-foreground font-medium">Label</Text>
        <Text className="m-0 text-3xl font-bold text-foreground">123</Text>
      </div>
    </Column>
    <Column className="w-1/2">
      <div className="rounded-lg bg-card p-4 text-center">
        <Text className="m-0 text-muted-foreground font-medium">Label 2</Text>
        <Text className="m-0 text-3xl font-bold text-foreground">456</Text>
      </div>
    </Column>
  </Row>
</Section>
```

## Bullet Lists

```typescript
<Section className="mx-4">
  <Text className="text-[14px] leading-[22px] my-2">
    • First item
  </Text>
  <Text className="text-[14px] leading-[22px] my-2">
    • Second item
  </Text>
  <Text className="text-[14px] leading-[22px] my-2">
    • Third item
  </Text>
</Section>
```

## Preview & Development

Run the email preview server:

```bash
bun email:dev
```

This opens a browser preview where you can see all email templates with their default props.

## Using Convex Types

You can import Convex types for type safety:

```typescript
import type { Doc } from "@/convex/_generated/dataModel"

export type MyEmailProps = {
  user: Pick<Doc<"users">, "name" | "email">
  post: Doc<"posts">
}
```

## Using App Utilities

You can import from the app's lib:

```typescript
import { pluralize } from "@/lib/utils"
import { env } from "@/lib/env.mjs"

// Use env for URLs
<Link href={`${env.NEXT_PUBLIC_APP_URL}/dashboard`}>

// Use pluralize for text
<Text>{pluralize(count, "item")}</Text>
```

## Full Example: Notification Email

```typescript
import { Button, Section, Text } from "@react-email/components"
import { env } from "@/lib/env.mjs"
import EmailLayout from "./layout"

export type NotificationEmailProps = {
  recipientName: string
  message: string
  actionUrl?: string
  actionLabel?: string
}

export default function NotificationEmail({
  recipientName = "John",
  message = "You have a new notification.",
  actionUrl = "https://example.com",
  actionLabel = "View Details",
}: NotificationEmailProps) {
  return (
    <EmailLayout preview={message.slice(0, 100)}>
      <Text className="m-0 text-[16px] leading-[24px] text-foreground">
        Hi {recipientName},
      </Text>

      <Text className="m-0 mt-4 text-[16px] leading-[24px] text-foreground">
        {message}
      </Text>

      {actionUrl && (
        <Section className="mt-6">
          <Button
            className="rounded-md bg-primary px-6 py-3 text-center text-[16px] font-semibold text-primary-foreground no-underline"
            href={actionUrl}
          >
            {actionLabel}
          </Button>
        </Section>
      )}

      <Text className="m-0 mt-6 text-[14px] leading-[22px] text-muted-foreground">
        If you have any questions, feel free to reply to this email.
      </Text>
    </EmailLayout>
  )
}
```

## Naming Conventions

- **File**: `kebab-case.tsx` (e.g., `welcome-email.tsx`, `password-reset.tsx`)
- **Component**: `PascalCase` matching the file (e.g., `WelcomeEmail`, `PasswordReset`)
- **Props Type**: `ComponentNameProps` (e.g., `WelcomeEmailProps`)
