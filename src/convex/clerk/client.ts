import ky from "ky"
import { FetchError } from "@/convex/_helpers/errors"
import { env } from "@/lib/env.mjs"

export const clerk = ky.create({
  headers: { Authorization: `Bearer ${env.CLERK_SECRET_KEY}`, "Content-Type": "application/json" },
  prefixUrl: "https://api.clerk.com/v1",
  hooks: {
    afterResponse: [
      async (request, _options, response) => {
        if (!response.ok) {
          throw new FetchError({
            method: request.method,
            path: request.url,
            status: response.status,
            body: await response.text(),
          })
        }
      },
    ],
  },
})
