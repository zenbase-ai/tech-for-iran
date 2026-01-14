# Tech for Iran

**A pledge site for the Iranian freedom movement.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Convex](https://img.shields.io/badge/Convex-Real--time-F97316?logo=convex)](https://convex.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript)](https://typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

We are Iranian founders, engineers, investors, leaders and scientists in tech. We stand with the people of Iran and call for the end of the Islamic regime.

**[Add your name →](https://techforiran.com)**

> **Building for another cause?** This codebase is designed to be forked. See [Fork as a Template](#fork-as-a-template) to launch your own pledge site.

---

## Features

### Signature Collection

A beautiful, multi-step form that progressively reveals fields as users complete them:

```
Name → Title → Company → Why I'm signing (optional) → My commitment (optional) → X handle
```

- **Real-time validation** with Zod schemas and instant feedback
- **Deduplication** by X username to prevent duplicate signatures
- **Confetti celebration** on successful submission
- **Referral tracking** — know who brought each signer

### Wall of Commitments

An infinite-scroll gallery showcasing everyone who signed:

- **Category filtering** — Tech, Policymakers, Academics (fully customizable)
- **Pinned signatures** — Feature key supporters at the top
- **Expert curation** — Admin approval workflow before public display
- **Responsive grid** — Beautiful on mobile, tablet, and desktop

### Viral Mechanics

Built-in features to help your movement spread:

- **Upvoting** — Anonymous, cookie-based voting system
- **Referral attribution** — "X people joined because of you"
- **Social sharing** — One-click share to X, LinkedIn, SMS, Email
- **Share pages** — Individual URLs with Open Graph metadata for each signature

### Beautiful UI

- **Dark/light theme** with smooth View Transition animations
- **Typography-forward** design that feels serious and professional
- **Fully responsive** and mobile-first
- **Accessible** — ARIA labels, keyboard navigation, reduced motion support

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| UI | [React 19](https://react.dev/) with React Compiler |
| Database | [Convex](https://convex.dev/) (real-time, type-safe) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) + [Radix UI](https://radix-ui.com/) |
| Validation | [Zod](https://zod.dev/) |
| Forms | [React Hook Form](https://react-hook-form.com/) |
| Runtime | [Bun](https://bun.sh/) |
| Formatting | [Biome](https://biomejs.dev/) |
| Analytics | [PostHog](https://posthog.com/) |

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/CyrusNuevoDia/tech-for-iran.git
cd tech-for-iran

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Convex and PostHog keys

# Start development servers (Next.js + Convex)
just dev
```

Visit `http://localhost:3000` to see your site.

### Environment Variables

```bash
# Convex (required)
CONVEX_DEPLOYMENT=your-deployment
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# PostHog (optional, for analytics)
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

---

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Home: manifesto + signature form
│   └── sig/[signatureId]/        # Individual share pages
├── components/
│   ├── presenters/
│   │   ├── signature/            # Form, Wall, Item, Share, Upvote
│   │   └── manifesto.mdx         # Your message to the world
│   ├── ui/                       # 55+ reusable UI primitives
│   └── layout/                   # Stack, Grid, Box components
├── convex/
│   ├── signatures/               # Signature queries & mutations
│   ├── upvotes/                  # Upvote queries & mutations
│   └── schema.ts                 # Database schema
├── schemas/
│   └── signature.ts              # Zod validation schemas
└── hooks/                        # Custom React hooks
```

---

## Customization

### Your Manifesto

Edit `src/components/presenters/manifesto.mdx` — this is the heart of your movement:

```mdx
# For a free Iran.

We are Iranian founders, engineers, investors, leaders and scientists in tech.

We stand with the people of Iran and call for the end of the Islamic regime.

**Add your name.**
```

### Categories

Update the category options in `src/convex/schema.ts`:

```typescript
category: v.optional(v.union(
  v.literal("tech"),
  v.literal("policymakers"),
  v.literal("academics"),
  // Add your own categories
)),
```

### Branding

- **Colors** — Edit CSS variables in `src/app/globals.css`
- **Logo/favicon** — Replace files in `public/`
- **Fonts** — Configure in `src/app/layout.tsx`

### Form Fields

Customize the signature form in:
- `src/schemas/signature.ts` — Validation rules
- `src/components/presenters/signature/form.tsx` — Form UI

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

Build command (already configured):
```bash
npx convex deploy -y --cmd 'NODE_ENV=production bun run --bun next build'
```

### Manual

```bash
# Deploy Convex functions
npx convex deploy

# Build Next.js
bun run build

# Start production server
bun run start
```

---

## Fork as a Template

This codebase is designed to power pledge sites for any movement. Here's how to make it yours:

### 1. Fork & Clone

```bash
gh repo fork CyrusNuevoDia/tech-for-iran --clone
cd tech-for-iran
```

### 2. Update the Manifesto

Replace `src/components/presenters/manifesto.mdx` with your message.

### 3. Customize Categories

Edit `src/convex/schema.ts` to reflect your audience segments.

### 4. Brand It

- Update colors in `src/app/globals.css`
- Replace logo and favicon in `public/`
- Update metadata in `src/app/layout.tsx`

### 5. Deploy

Push to GitHub and deploy to Vercel. Done.

### Use Cases

- **Social movements** — Rally supporters around a cause
- **Open letters** — Collect signatures from industry leaders
- **Petitions** — Build momentum for policy change
- **Corporate pledges** — Track commitments from organizations
- **Community organizing** — Unite people around shared values

---

## Development

```bash
# Run development servers
just dev

# Format code
just fmt

# Lint
just lint

# Build for production
just build
```

---

## Contributing

We welcome contributions to Tech for Iran. Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

For bugs and feature requests, [open an issue](https://github.com/CyrusNuevoDia/tech-for-iran/issues).

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

**For a free Iran.**
