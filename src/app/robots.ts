import type { MetadataRoute } from "next"

export default (): MetadataRoute.Robots => ({
  rules: {
    userAgent: "*",
    disallow: "/",
  },
})
