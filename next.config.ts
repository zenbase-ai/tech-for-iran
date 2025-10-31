import createBundleAnalyzer from "@next/bundle-analyzer"
import type { NextConfig } from "next"

let config: NextConfig = {
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

config = createBundleAnalyzer({
  enabled: Boolean(process.env.ANALYZE),
})(config)

export default config
