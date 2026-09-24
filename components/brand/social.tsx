import * as React from "react"

import { cn } from "@/lib/utils"
import type { SocialId } from "@/lib/social"
import {
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  TikTokIcon,
  XIcon,
  YouTubeIcon,
  type SocialIconProps,
} from "@/components/brand/social-icons"

const ICONOS: Record<SocialId, React.ComponentType<SocialIconProps>> = {
  tiktok: TikTokIcon,
  instagram: InstagramIcon,
  youtube: YouTubeIcon,
  x: XIcon,
  linkedin: LinkedInIcon,
  facebook: FacebookIcon,
}

export interface SocialGlyphProps extends SocialIconProps {
  network: SocialId
}

/** Logotipo de una red por su id. Un solo punto de entrada para todo el producto. */
export function SocialGlyph({ network, ...props }: SocialGlyphProps) {
  const Icono = ICONOS[network]
  return <Icono {...props} />
}

const TAMANO = {
  sm: { caja: "size-8 rounded-lg", icono: "size-4" },
  md: { caja: "size-11 rounded-xl", icono: "size-5" },
  lg: { caja: "size-14 rounded-2xl", icono: "size-7" },
} as const

export interface SocialBadgeProps extends React.ComponentProps<"span"> {
  network: SocialId
  size?: keyof typeof TAMANO
  /**
   * `marca` pinta el logotipo oficial a todo color sobre una pastilla blanca,
   * como lo publica cada red. Se reserva para donde el usuario elige o
   * reconoce un destino; en listados densos se prefiere `neutro`, para que
   * seis logotipos a todo color no compitan con el naranja de la marca.
   */
  tone?: "neutro" | "marca"
}

/** Logotipo dentro de su pastilla. La pieza que se repite en todo el producto. */
export function SocialBadge({
  network,
  size = "md",
  tone = "neutro",
  className,
  ...props
}: SocialBadgeProps) {
  const s = TAMANO[size]

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center transition-colors duration-200",
        s.caja,
        // La pastilla blanca es la misma en claro y en oscuro: los logotipos
        // oficiales están pensados sobre blanco, y X y TikTok heredan el negro.
        tone === "marca"
          ? "bg-white text-black ring-1 ring-border"
          : "bg-muted text-foreground",
        className
      )}
      {...props}
    >
      <SocialGlyph
        network={network}
        tone={tone === "marca" ? "official" : "current"}
        className={s.icono}
      />
    </span>
  )
}
