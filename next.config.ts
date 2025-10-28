import createBundleAnalyzer from "@next/bundle-analyzer"
import type { NextConfig } from "next"

// import { withWorkflow } from "workflow/next"

let config: NextConfig = {
  typedRoutes: true,
  reactCompiler: {
    compilationMode: "annotation",
  },
  images: {
    qualities: [60, 75, 95],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.licdn.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
}

config = createBundleAnalyzer({
  enabled: Boolean(process.env.ANALYZE),
})(config)

export default config
