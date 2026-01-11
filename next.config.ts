import createMDX from "@next/mdx"
import type { NextConfig } from "next"
import "remark-frontmatter"
import "remark-gfm"
import "remark-mdx-frontmatter"
import "rehype-slugs"

let config: NextConfig = {
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
  typedRoutes: true,
  reactCompiler: {
    compilationMode: "annotation",
  },
  images: {
    qualities: [60, 75, 95],
  },
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
}

config = createMDX({
  options: {
    remarkPlugins: ["remark-gfm", "remark-mdx-frontmatter", "remark-frontmatter"],
    rehypePlugins: ["rehype-slugs"],
  },
})(config)

export default config
