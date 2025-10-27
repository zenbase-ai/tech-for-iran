"use client"

import Link from "next/link"
import { Box } from "@/components/layout/box"

export default function OnboardingErrorPage() {
  return (
    <Box as="main" className="flex items-center justify-center min-h-[60vh]">
      <Box as="section" className="max-w-md w-full px-6 py-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Connection Failed</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          We were unable to connect your LinkedIn account. This could be due to:
        </p>

        <ul className="text-left text-sm text-gray-600 dark:text-gray-300 mb-8 space-y-2">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>The connection was cancelled or interrupted</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>LinkedIn authentication failed</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Network connectivity issues</span>
          </li>
        </ul>

        <Box className="flex flex-col gap-3">
          <Link
            href="/onboarding/connect"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 inline-block"
          >
            Try Again
          </Link>

          <Link
            href="/sign-in"
            className="w-full text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 font-semibold py-3 px-6 rounded-lg border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors duration-200 inline-block"
          >
            Back to Sign In
          </Link>
        </Box>
      </Box>
    </Box>
  )
}
