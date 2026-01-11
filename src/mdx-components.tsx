import { cva } from "class-variance-authority"
import type { MDXComponents } from "mdx/types"

import { cn, linkProps } from "@/lib/utils"

const headingVariants = cva(
  "mt-[2rem] mb-[1.5rem] letter-spacing-[-0.022em] text-box-trim-both first-child:mt-0 scroll-margin-20",
  {
    variants: {
      variant: {
        serif: "font-serif italic leading-[0.95] pb-2 border-b-1 border-border",
        sans: "font-sans leading-[1.2] pb-2 border-b-1 border-border",
      },
      size: {
        h1: "text-3xl font-[200]",
        h2: "text-lg font-[500]",
        h3: "text-lg font-[600]",
        h4: "text-md font-[700]",
        h5: "text-md font-[600]",
        h6: "text-md font-[500]",
      },
    },
  }
)

const components: MDXComponents = {
  h1: ({ children, className, ...props }) => (
    <h1 className={headingVariants({ variant: "serif", size: "h1", className })} {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, className, ...props }) => (
    <h2 className={headingVariants({ variant: "sans", size: "h2", className })} {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, className, ...props }) => (
    <h3 className={headingVariants({ variant: "sans", size: "h3", className })} {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, className, ...props }) => (
    <h4 className={headingVariants({ variant: "sans", size: "h4", className })} {...props}>
      {children}
    </h4>
  ),
  h5: ({ children, className, ...props }) => (
    <h5 className={headingVariants({ variant: "sans", size: "h5", className })} {...props}>
      {children}
    </h5>
  ),
  h6: ({ children, className, ...props }) => (
    <h6 className={headingVariants({ variant: "sans", size: "h6", className })} {...props}>
      {children}
    </h6>
  ),
  blockquote: ({ children, ...props }) => <blockquote {...props}>{children}</blockquote>,
  p: ({ children, className, ...props }) => (
    <p className={cn("font-sans line-height-[1.618] my-4", className)} {...props}>
      {children}
    </p>
  ),
  a: ({ children, href, className, ...props }) => (
    <a
      {...linkProps(href)}
      {...props}
      className={cn(
        "transition-all duration-100",
        "underline underline-offset-2 hover:underline-offset-4",
        // "rounded-full bg-muted px-2 -mx-2 py-1 -my-1 hover:px-3 hover:-mx-3 hover:bg-muted",
        className
      )}
    >
      {children}
    </a>
  ),
}

export const useMDXComponents = () => components
