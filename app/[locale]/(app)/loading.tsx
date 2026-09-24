"use client"

import { useTranslations } from "next-intl"

import { Skeleton } from "@/components/ui/skeleton"

/**
 * Se ve mientras Next resuelve el segmento; reserva el mismo alto que la vista.
 * Componente de cliente: el `loading` se pinta en paralelo a los layouts y en el
 * servidor aún no sabría el idioma; aquí lo toma del proveedor de la zona.
 */
export default function AppLoading() {
  const t = useTranslations("app.loading")
  return (
    <div className="container-app space-y-6 py-6" aria-busy>
      <span className="sr-only" role="status">
        {t("app")}
      </span>
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  )
}
