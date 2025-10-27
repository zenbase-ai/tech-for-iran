"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

/**
 * Invite Page - Fallback Component
 *
 * This page serves as a fallback. In most cases, the server-side route handler
 * at /app/invite/[code]/route.ts will intercept the request and redirect appropriately.
 *
 * This component only renders if:
 * - JavaScript is disabled
 * - The route handler fails for some reason
 * - Direct client-side navigation occurs
 *
 * In those cases, we trigger a page reload to ensure the route handler runs.
 */
export default function InvitePage({ params }: { params: { code: string } }) {
  const router = useRouter()

  useEffect(() => {
    // Force a full page reload to trigger the route handler
    // This ensures the server-side redirect logic runs
    window.location.href = `/invite/${params.code}`
  }, [params.code])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-4" />
        <p className="text-lg">Processing invite...</p>
      </div>
    </div>
  )
}
