import type { NextConfig } from "next"

const config: NextConfig = {
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

export default config
