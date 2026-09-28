"use client"

import { useLayoutEffect } from "react"

import { usePathname } from "@/i18n/navigation"

/** Reset scroll on every marketing route transition, including sibling details. */
export function RouteScrollRestorer() {
  const pathname = usePathname()

  useLayoutEffect(() => {
    // Keep native in-page navigation (for example /#faq) intact.
    if (window.location.hash) return
    window.scrollTo({ top: 0, left: 0, behavior: "instant" })
  }, [pathname])

  return null
}
