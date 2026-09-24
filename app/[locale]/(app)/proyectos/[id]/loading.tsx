"use client"

import { useTranslations } from "next-intl"

import { GridSkeleton } from "@/components/shared/panel-skeleton"

/** De cliente por el idioma, como `(app)/loading.tsx`. */
export default function ProyectoLoading() {
  const t = useTranslations("app.loading")
  return (
    <div className="container-app py-6">
      <span className="sr-only" role="status">
        {t("clips")}
      </span>
      <GridSkeleton />
    </div>
  )
}
