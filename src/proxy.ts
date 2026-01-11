import { clerkMiddleware } from "@clerk/nextjs/server"
import KSUID from "ksuid"
import { NextResponse } from "next/server"
import { ANON_ID_COOKIE, COOKIE_EXPIRY_DAYS } from "./lib/cookies"

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}

export default clerkMiddleware(async (_auth, request) => {
  const response = NextResponse.next()

  if (!request.cookies.has(ANON_ID_COOKIE)) {
    const ksuid = await KSUID.random()
    const anonId = `anon_${ksuid.string}`
    response.cookies.set(ANON_ID_COOKIE, anonId, {
      maxAge: COOKIE_EXPIRY_DAYS * 24 * 60 * 60,
      path: "/",
      sameSite: "lax",
    })
  }

  return response
})
