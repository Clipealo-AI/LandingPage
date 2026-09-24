import { Skeleton } from "@/components/ui/skeleton"

/**
 * Reserva del espacio mientras se resuelve un panel que lee la URL.
 * Los componentes que usan `nuqs` leen `useSearchParams`, y Next exige un
 * limite de Suspense para poder prerenderizar la ruta.
 */
export function GridSkeleton({ cards = 8 }: { cards?: number }) {
  return (
    <div className="space-y-5" aria-hidden>
      <div className="flex flex-col gap-3 lg:flex-row">
        <Skeleton className="h-8 w-full lg:max-w-xs" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-8 w-32 lg:ml-auto" />
      </div>
      <div className="grid-clips">
        {Array.from({ length: cards }, (_, i) => (
          <div key={i} className="space-y-3 rounded-2xl bg-card p-3 ring-1 ring-border">
            <Skeleton className="aspect-[9/16] w-full rounded-xl" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function StudioSkeleton() {
  return (
    <div
      className="container-app grid gap-4 py-4 xl:grid-cols-[minmax(0,1fr)_22rem]"
      aria-hidden
    >
      <div className="space-y-4">
        <Skeleton className="aspect-video w-full rounded-frame" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-(--spacing-timeline) w-full rounded-xl" />
      </div>
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  )
}
