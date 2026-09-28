import Image from "next/image"
import type { RouteMediaAsset } from "@/lib/marketing/route-media"

/** Pre-sized local sources also work with the static export, without an image server. */
export function RouteMedia({
  asset,
  alt,
  compact = false,
  eager = false,
}: {
  asset: RouteMediaAsset
  alt: string
  compact?: boolean
  eager?: boolean
}) {
  return (
    <picture
      className={`block min-w-0 overflow-hidden bg-ink-950 ${compact ? "aspect-video rounded-xl" : "rounded-frame border border-border/60 shadow-xl"}`}
    >
      <source media="(max-width: 640px)" srcSet={asset.mobileSrc} />
      <Image
        src={asset.src}
        width={asset.width}
        height={asset.height}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        className={
          compact ? "h-full w-full object-cover" : "max-h-[36rem] w-full object-contain"
        }
      />
    </picture>
  )
}
