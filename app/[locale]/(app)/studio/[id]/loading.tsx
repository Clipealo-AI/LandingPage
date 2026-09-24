"use client"

import { useTranslations } from "next-intl"

import { StudioSkeleton } from "@/components/shared/panel-skeleton"

/** De cliente por el idioma, como `(app)/loading.tsx`. */
export default function StudioLoading() {
  const t = useTranslations("app.loading")
  return (
    <>
      <span className="sr-only" role="status">
        {t("studio")}
      </span>
      <StudioSkeleton />
    </>
  )
}
