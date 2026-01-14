# PATTERNS.md

Quick-reference guide for common code patterns. Copy-paste and adapt.

---

## Component Patterns

### CVA (Class Variance Authority)

```tsx
import { cva, type VariantProps } from "class-variance-authority"

export const buttonVariants = cva(
  "inline-flex items-center justify-center", // base
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
      },
      size: {
        default: "h-9 px-4",
        sm: "h-8 px-3",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }

export const Button: React.FC<ButtonProps> = ({
  className,
  variant,
  size,
  asChild = false,
  ...props
}) => {
  const Comp = asChild ? Slot : "button"
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
}
```
→ `src/components/ui/button.tsx`

### Polymorphic Layout Component

```tsx
export type StackProps<T extends React.ElementType = "div"> = React.ComponentProps<T> &
  VariantProps<typeof stackVariants> & { as?: T }

export const Stack = <T extends React.ElementType = "div">({
  as: Component = "div" as T,
  className,
  direction,
  ...props
}: StackProps<T>) => (
  <Component className={cn(stackVariants({ direction, className }))} {...props} />
)

export const HStack = <T extends React.ElementType = "div">(props: StackProps<T>) => (
  <Stack direction="horizontal" {...props} />
)
```
→ `src/components/layout/stack.tsx`

### Data Attributes for State

```tsx
<div data-slot="field" data-invalid={fieldState.invalid} data-orientation={orientation}>
  <input data-slot="input" aria-invalid={fieldState.invalid} />
</div>
```

---

## Hook Patterns

### useAsyncFn for Mutations

```tsx
const mutate = useAsyncFn(useMutation(api.fns.resource.create))

const handleSubmit = useEffectEvent(async (data: Schema) => {
  const result = await mutate.execute(data)
  if (result?.success) form.reset()
})

// Access state
{mutate.pending && <Spinner />}
{mutate.error && <Error message={mutate.error} />}
```
→ `src/hooks/use-async-fn.ts`

### useEffectEvent for Stable Callbacks

```tsx
import { useEffectEvent } from "react"

const handleClick = useEffectEvent(async (data: FormData) => {
  // Stable reference, captures latest closure values
  await submit(data)
})
```

---

## Form Patterns

### Schema Configuration Object

```tsx
// 1. Config with constraints
export const createResource = {
  min: { name: 1 },
  max: { name: 80 },
  defaultValues: { name: "" },
}

// 2. Zod schema referencing config
export const CreateResource = z.object({
  name: z.string()
    .trim()
    .min(createResource.min.name)
    .max(createResource.max.name),
})

// 3. TypeScript type
export type CreateResource = z.infer<typeof CreateResource>
```
→ `src/schemas/signature.ts`

### React Hook Form + Controller

```tsx
const form = useForm<Schema>({
  resolver: zodResolver(Schema),
  defaultValues: config.defaultValues,
})

<Controller
  control={form.control}
  name="fieldName"
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel>Label</FieldLabel>
      <FieldContent>
        <Input {...field} aria-invalid={fieldState.invalid} />
      </FieldContent>
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>
```

### Zod Transform with Pipe

```tsx
xUsername: z.string()
  .trim()
  .transform((v) => (v.startsWith("@") ? v.slice(1) : v))
  .pipe(
    z.string()
      .min(1)
      .regex(/^[a-zA-Z0-9_]+$/, "Invalid format")
  )
```

---

## Convex Patterns

### Discriminated Union Returns

```tsx
type CreateResult =
  | { data: { id: Id<"resources"> }; success: string }
  | { data: null; error: string }

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args): Promise<CreateResult> => {
    const { data, success, error } = Schema.safeParse(args)
    if (!success) {
      return { data: null, error: errorMessage(error) }
    }

    const id = await ctx.db.insert("resources", data)
    return { data: { id }, success: "Created!" }
  },
})
```
→ `src/convex/signatures/mutate.ts`

### Paginated Query with Conditional Index

```tsx
export const list = query({
  args: { category: v.optional(v.string()), paginationOpts: paginationOptsValidator },
  handler: async (ctx, { category, paginationOpts }) => {
    const query = Category.safeParse(category).success
      ? ctx.db.query("items").withIndex("by_category", (q) => q.eq("category", category))
      : ctx.db.query("items").withIndex("by_createdAt")

    return await query.order("desc").paginate(paginationOpts)
  },
})
```
→ `src/convex/signatures/query.ts`

### Update Helper with Timestamp

```tsx
export const update = <T extends Record<string, unknown>>(
  data: T
): T & { updatedAt: number } => ({
  ...data,
  updatedAt: Date.now(),
})

// Usage
await ctx.db.patch(id, update({ status: "completed" }))
```
→ `src/convex/_helpers/server.ts`

---

## Error Handling

### Custom Error Classes

```tsx
import { ConvexError } from "convex/values"

type ErrorData = { message: string; cause?: Value }

export class NotFoundError extends ConvexError<ErrorData> {
  readonly type = "NotFoundError"
  constructor(message = "Not found") {
    super({ message, cause: null })
  }
}

export class UnauthorizedError extends ConvexError<ErrorData> { ... }
export class BadRequestError extends ConvexError<ErrorData> { ... }
```
→ `src/convex/_helpers/errors.ts`

### Error Message Extraction

```tsx
export const errorMessage = (error: unknown): string => {
  if (error instanceof z.ZodError) return z.prettifyError(error)
  if (error instanceof ConvexError) return error.data?.message ?? String(error)
  if (error instanceof Error) return error.message
  return String(error)
}
```

---

## Utility Patterns

### Tailwind Merge

```tsx
import { cn } from "@/lib/utils"

<div className={cn("base-class", conditional && "conditional-class", className)} />
```

### Typed CSS Variables

```tsx
export type CSS = React.CSSProperties & {
  [variable: `--${string}`]: string | number
}

export const css = (styles: CSS) => styles as React.CSSProperties

// Usage
<div style={css({ "--custom-color": "#ff0000", "--size": 42 })} />
```
→ `src/lib/utils.ts`

### Parallel Operations

```tsx
import { pmap, pflatMap, pfilter } from "@/lib/utils"

// Map in parallel (default concurrency: 5)
const results = await pmap(items, async (item) => process(item))

// FlatMap in parallel
const flattened = await pflatMap(items, async (item) => item.children)

// Filter in parallel
const filtered = await pfilter(items, async (item) => isValid(item))
```

### Link Utilities

```tsx
export const isInternalLink = (href: string) => href.startsWith("/") || href.startsWith("#")

export const linkProps = (href: string) =>
  isInternalLink(href) ? { href } : { href, target: "_blank" }

// Usage
<Link {...linkProps(url)}>{label}</Link>
```

---

## Page Patterns

### Server Component with use memo

```tsx
export default function Page() {
  "use memo"
  return <ClientPage />
}
```

### Server-Side Data Fetching

```tsx
export default async function Page(props: PageProps) {
  const [{ token }, { id }] = await Promise.all([
    tokenAuth(),
    props.params,
  ])

  const data = await fetchQuery(api.fns.resource.get, { id }, { token })

  return <Content data={data} />
}
```

### Client Component with Auth Query

```tsx
"use client"

export function ClientPage({ id }: Props) {
  const data = useAuthQuery(api.fns.resource.get, { id })

  if (!data) return <Skeleton />

  return <Content data={data} />
}
```

---

## Presenter Pattern

Self-contained components that fetch their own data:

```tsx
// src/components/presenters/resource/item.tsx
export type ResourceItemProps = { resourceId: Id<"resources"> } & StackProps

export const ResourceItem: React.FC<ResourceItemProps> = ({ resourceId, ...props }) => {
  const resource = useQuery(api.fns.resources.get, { resourceId })

  if (!resource) return <ResourceItemSkeleton {...props} />

  return (
    <HStack {...props}>
      <span>{resource.name}</span>
    </HStack>
  )
}

export const ResourceItemSkeleton: React.FC<StackProps> = (props) => (
  <HStack {...props}>
    <Skeleton className="h-4 w-24" />
  </HStack>
)
```

---

## Infinite Scroll Pattern

```tsx
const { results, status, loadMore } = useAuthPaginatedQuery(
  api.fns.items.list,
  { filter },
  { initialNumItems: 20 }
)

const { ref } = useInfiniteScroll({
  loading: status === "LoadingMore",
  hasMore: status === "CanLoadMore",
  onLoadMore: () => loadMore(10),
})

return (
  <>
    {results.map((item) => <Item key={item._id} {...item} />)}
    {status === "CanLoadMore" && <div ref={ref} />}
  </>
)
```
