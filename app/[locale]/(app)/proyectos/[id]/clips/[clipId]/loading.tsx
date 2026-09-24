"use client"

import { useTranslations } from "next-intl"

import { Skeleton } from "@/components/ui/skeleton"

/** De cliente por el idioma, como `(app)/loading.tsx`. */
export default function ClipLoading() {
  const t = useTranslations("app.loading")
  return (
    <div className="container-app space-y-6 py-6">
      <span className="sr-only" role="status">
        {t("clips")}
      </span>
      <Skeleton className="h-8 w-2/3 max-w-md" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_clamp(20rem,26vw,24rem)]">
        <div className="space-y-4">
          <Skeleton className="mx-auto aspect-[9/16] w-full max-w-md rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}
