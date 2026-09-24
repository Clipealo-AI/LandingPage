import * as React from "react"

import { cn } from "@/lib/utils"
import { PLATAFORMA_LABEL, type PlataformaDirecto } from "@/lib/ajustes"
import { creadorPorId, type CreadorId } from "@/lib/creadores"
import { hashEstable, type CreadorPendiente } from "@/lib/onboarding"
import { SOCIAL_IDS, SOCIAL_NETWORKS, type SocialId } from "@/lib/social"
import { esId } from "@/lib/taxonomia"
import { inicialesDe } from "@/hooks/use-cuenta"
import { KickIcon, TwitchIcon } from "@/components/brand/social-icons"
import { SocialGlyph } from "@/components/brand/social"

/**
 * Piezas comunes de los creadores del fandom (§4.1), sin estado ni `cmdk`: las
 * usan la toma `fandom` (tarjetas de sugerencias y chips del radar), el
 * buscador `creator-search.tsx` (que se carga con `dynamic()`) y cualquier
 * vista que pinte un creador del catálogo (la tarjeta del monitor, el
 * resultado). Viven aparte para que importarlas no arrastre el buscador al
 * paquete inicial.
 */

/** Un creador del catálogo o uno que el usuario añadió y aún no está en él. */
export type Fan = CreadorId | CreadorPendiente

/** Plataforma de una cuenta de creador: de directo (Twitch, Kick…) o red social. */
export type PlataformaCreador = PlataformaDirecto | SocialId

/** Nombre propio de la plataforma (no se traduce). */
export const nombrePlataforma = (p: PlataformaCreador) =>
  esId(SOCIAL_IDS, p) ? SOCIAL_NETWORKS[p].name : PLATAFORMA_LABEL[p]

/** Lo que se enseña de un fan: el nombre del catálogo, «@handle» o el texto escrito. */
export function etiquetaFan(fan: Fan): string {
  if (typeof fan === "string") return creadorPorId(fan)?.nombre ?? fan
  return fan.handle ? `@${fan.handle}` : fan.texto
}

/** Clave estable de un fan (para `key` y para comparar pendientes). */
export function claveFan(fan: Fan): string {
  if (typeof fan === "string") return fan
  return fan.plataforma && fan.handle
    ? `${fan.plataforma}:${fan.handle.toLowerCase()}`
    : `texto:${fan.texto.trim().toLowerCase()}`
}

export const mismoFan = (a: Fan, b: Fan) => claveFan(a) === claveFan(b)

/**
 * Logo oficial de la plataforma, decorativo (el nombre ya va en el texto). Kick
 * y Twitch salen de `social-icons`; las redes, de `SocialGlyph`.
 */
export function LogoPlataforma({
  plataforma,
  className,
}: {
  plataforma: PlataformaCreador
  className?: string
}) {
  const clase = cn("size-4", className)
  return (
    <span aria-hidden className="inline-grid shrink-0 place-items-center">
      {plataforma === "twitch" ? (
        <TwitchIcon tone="official" className={clase} />
      ) : plataforma === "kick" ? (
        <KickIcon tone="official" className={clase} />
      ) : esId(SOCIAL_IDS, plataforma) ? (
        <SocialGlyph network={plataforma} tone="official" className={clase} />
      ) : null}
    </span>
  )
}

/*
 * Iniciales sobre un token de 600 o más oscuro (§4.1): azul de estructura o la
 * tinta del escenario, repartidos por un hash estable del id (nunca
 * `Math.random`). Con foto real, la foto.
 *
 * El tono de tinta lleva canto (`ring-stage-border`): en tema oscuro el disco
 * queda a 1,3:1 sobre la tarjeta y sin borde no se ve, solo flotan las
 * iniciales y la insignia. En claro el canto no se nota (disco negro sobre
 * blanco) y no cambia ningún color: `--stage-border` existe en los dos temas.
 */
const TONOS = [
  "bg-primary text-primary-foreground",
  "bg-stage text-stage-foreground ring-1 ring-stage-border",
] as const

const TAMANOS = {
  sm: {
    caja: "size-7 text-[0.625rem]",
    logo: "size-3.5 -right-1 -bottom-1",
    icono: "size-2.5",
  },
  md: {
    caja: "size-10 text-xs @[100rem]/bienvenida:size-11 @[100rem]/bienvenida:text-sm",
    logo: "size-5 -right-1 -bottom-1",
    icono: "size-3",
  },
} as const

/**
 * Avatar de un creador: iniciales y, en la esquina, el logo de su plataforma
 * principal. Decorativo (`aria-hidden`): el nombre va siempre al lado.
 */
export function AvatarCreador({
  nombre,
  semilla,
  plataforma,
  size = "md",
  className,
}: {
  nombre: string
  /** Id del creador o clave del pendiente: decide el tono. */
  semilla: string
  plataforma?: PlataformaCreador
  size?: keyof typeof TAMANOS
  className?: string
}) {
  const s = TAMANOS[size]
  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-grid shrink-0 place-items-center rounded-full leading-none font-bold",
        TONOS[hashEstable(semilla) % TONOS.length],
        s.caja,
        className
      )}
    >
      {inicialesDe(nombre.replace(/^@/, ""))}
      {plataforma && (
        <span
          className={cn(
            "absolute grid place-items-center rounded-full bg-card text-card-foreground ring-2 ring-card",
            s.logo
          )}
        >
          <LogoPlataforma plataforma={plataforma} className={s.icono} />
        </span>
      )}
    </span>
  )
}
