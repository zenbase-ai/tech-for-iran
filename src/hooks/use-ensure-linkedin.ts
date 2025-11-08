import { redirect, usePathname } from "next/navigation"
import { useEffect } from "react"
import { toast } from "sonner"
import { api } from "@/convex/_generated/api"
import useAuthQuery from "./use-auth-query"

export default function useEnsureLinkedin() {
  const isConnectPage = usePathname() === "/settings/connect"
  const linkedin = useAuthQuery(api.linkedin.getState)

  useEffect(() => {
    if (!isConnectPage && linkedin?.needsReconnection) {
      toast.info("Please connect your LinkedIn.")
      const timeout = setTimeout(() => {
        redirect("/settings/connect")
      }, 1000)
      return () => clearTimeout(timeout)
    }
  }, [isConnectPage, linkedin?.needsReconnection])

  const isLoaded = linkedin != null

  return { isLoaded, isConnectPage, linkedin }
}
