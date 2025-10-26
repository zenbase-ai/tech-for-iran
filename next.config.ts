import createBundleAnalyzer from "@next/bundle-analyzer"
import type { NextConfig } from "next"

// import { withWorkflow } from "workflow/next"

let config: NextConfig = {
  typedRoutes: true,
  reactCompiler: true,
  images: {
    qualities: [60, 75, 95],
  },
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
}

config = createBundleAnalyzer({
  enabled: Boolean(process.env.ANALYZE),
})(config)

// TODO: Re-enable once workflow package native binding issue is resolved
// config = withWorkflow(config)

export default config
