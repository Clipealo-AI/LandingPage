import { useTranslations } from "next-intl"

import { Skeleton } from "@/components/ui/skeleton"

/** Sombra de una tabla de trabajo mientras cargan los filtros de la URL. */
export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  const t = useTranslations("admin.table")
  return (
    <div className="space-y-4" aria-busy="true" aria-label={t("loading")}>
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-8 w-36" />
      </div>
      <Skeleton className="h-3 w-24" />
      <div className="space-y-0 overflow-hidden rounded-xl bg-card ring-1 ring-border">
        <div className="h-9 bg-muted/40" />
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-4 border-t px-3 py-2.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="ml-auto h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}
