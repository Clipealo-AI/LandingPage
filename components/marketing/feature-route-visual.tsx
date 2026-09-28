import { PatternIsotipos } from "@/components/brand/patterns"
import { RouteMedia } from "@/components/marketing/route-media"
import { featureMedia } from "@/lib/marketing/route-media"

export function FeatureRouteVisual({
  id,
  alt,
  subtitle,
}: {
  id: keyof typeof featureMedia
  alt: string
  subtitle: string
}) {
  if (id === "subtitleEditor") {
    return (
      <div className="relative overflow-hidden rounded-frame bg-ink-950 p-6 sm:p-8">
        <PatternIsotipos />
        <div className="relative mx-auto max-w-60">
          <RouteMedia asset={featureMedia[id]} alt={alt} eager />
          <p className="absolute inset-x-4 bottom-10 rounded-xl bg-ink-950/90 px-3 py-2 text-center text-lg font-bold text-white">
            {subtitle}
            <span
              aria-hidden="true"
              className="mx-auto mt-2 block h-1 w-12 rounded-full bg-brand"
            />
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <RouteMedia asset={featureMedia[id]} alt={alt} eager />
      {id === "verticalExport" && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-[8%] left-[18%] aspect-[9/16] rounded-2xl border-2 border-brand bg-transparent"
        >
          <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-ink-950/90 px-3 py-1 text-xs font-bold whitespace-nowrap text-white">
            9:16
          </span>
        </div>
      )}
    </div>
  )
}
