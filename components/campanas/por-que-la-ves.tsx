"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"

import { LOCALE_TAG } from "@/i18n/routing"
import { cn } from "@/lib/utils"
import { creadorPorId } from "@/lib/creadores"
import type { MotivoRecomendacion } from "@/lib/recomendacion"
import { SOCIAL_NETWORKS } from "@/lib/social"
import { useCountryName } from "@/components/shared/country-flag"

/** Cuántos motivos se enseñan como mucho: la línea se lee de un vistazo. */
export const MAX_MOTIVOS = 4

/**
 * «Por qué la ves: Gaming · TikTok · español» (§6.1, §6.4). Traduce los motivos
 * de `recomendarCampanas` (ids, no frases): vertical con `taxonomy.verticales`,
 * red con su nombre, idioma y país con `Intl.DisplayNames`. Sin motivos, nada.
 * Sirve en Explorar (`?orden=para-ti`) y en el resultado del onboarding.
 */
export function PorQueLaVes({
  motivos,
  className,
}: {
  motivos: readonly MotivoRecomendacion[]
  className?: string
}) {
  const t = useTranslations("campaigns.explorer.reasons")
  const tt = useTranslations("taxonomy.verticales")
  const locale = useLocale()
  const nombrePais = useCountryName()
  const idiomas = React.useMemo(
    () => new Intl.DisplayNames([LOCALE_TAG[locale]], { type: "language" }),
    [locale]
  )

  const partes = motivos
    .flatMap((m) => {
      switch (m.tipo) {
        case "vertical":
          return [tt(m.vertical)]
        case "creador": {
          const creador = creadorPorId(m.creadorId)
          return creador ? [creador.nombre] : []
        }
        case "red":
          return [SOCIAL_NETWORKS[m.red].name]
        case "destacada":
          return [t("destacada")]
        case "presupuesto":
          return [t("presupuesto")]
        case "idioma":
          return [idiomas.of(m.idioma) ?? m.idioma]
        case "pais":
          return [nombrePais(m.pais)]
      }
    })
    .slice(0, MAX_MOTIVOS)

  if (partes.length === 0) return null
  return (
    <p
      data-slot="por-que-la-ves"
      className={cn("text-xs text-pretty text-muted-foreground", className)}
    >
      {t("label", { motivos: partes.join(" · ") })}
    </p>
  )
}
