import * as React from "react"

import { cn } from "@/lib/utils"
import { formatTimecode } from "@/lib/format"
import { ASPECT_RATIOS, type AspectRatioKey } from "@/lib/video-formats"
import { CropFrame } from "@/components/brand/logo"

export interface MediaFrameProps extends React.ComponentProps<"div"> {
  aspect?: AspectRatioKey
  poster?: string
  /** Duracion en segundos: se pinta como pastilla en la esquina inferior. */
  duration?: number
  /** Envuelve el frame con la marca de recorte naranja. */
  cropped?: boolean
  /** Estado de carga: pinta el shimmer en lugar del poster. */
  loading?: boolean
  /** Etiqueta accesible del contenido del frame. */
  alt?: string
}

/**
 * Contenedor de media con ratio fijo.
 *
 * Reserva el espacio antes de que cargue el poster, asi la rejilla de la
 * biblioteca no salta (evita CLS). Es la base de la tarjeta de clip, del paso
 * 01/02/03 de la landing y de cualquier vista previa.
 */
export function MediaFrame({
  aspect = "16:9",
  poster,
  duration,
  cropped = false,
  loading = false,
  alt = "",
  className,
  children,
  ...props
}: MediaFrameProps) {
  const frame = (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-xl bg-muted ring-1 ring-border",
        loading && "skeleton-media",
        className
      )}
      style={{ aspectRatio: ASPECT_RATIOS[aspect].css }}
      {...props}
    >
      {poster && !loading && (
        // Poster de terceros / firmado: `next/image` no aporta aqui y complica el dominio
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poster}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full object-cover"
        />
      )}

      {!poster && !loading && (
        <div className="absolute inset-0 bg-secondary">
          <div className="absolute inset-0 pattern-isotipos opacity-[0.12]" aria-hidden />
        </div>
      )}

      {children}

      {duration !== undefined && (
        <span
          data-slot="timecode"
          className="absolute right-2 bottom-2 rounded-md bg-stage/85 px-1.5 py-0.5 text-[11px] font-medium text-stage-foreground tabular-nums backdrop-blur-sm"
        >
          {formatTimecode(duration)}
        </span>
      )}
    </div>
  )

  return cropped ? <CropFrame size="md">{frame}</CropFrame> : frame
}
