"use client"

import { Info } from "lucide-react"
import { useTranslations } from "next-intl"

import type { DatoConservado } from "@/lib/privacidad"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

/** Quién ve lo que se responde en una toma (`onboarding.chrome.dataLabel.quien.<id>`). */
export const QUIEN_VE = ["equipo", "estadisticas", "agencias"] as const
export type QuienVe = (typeof QUIEN_VE)[number]

/**
 * Etiqueta de datos de una toma (§2.3): el icono ⓘ abre «Tus datos» con quién
 * lo ve, cuánto lo guardamos (`taxonomy.conservacion`) y dónde se cambia. No se
 * escribe ni suena; va junto al «Para qué».
 */
export function DataLabel({
  quien,
  conservacion = "respuestas-perfil",
}: {
  quien: QuienVe
  conservacion?: DatoConservado
}) {
  const t = useTranslations("onboarding.chrome.dataLabel")
  const tt = useTranslations("taxonomy.conservacion")
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="-my-1 shrink-0 text-muted-foreground hover:text-foreground"
          aria-label={t("trigger")}
        >
          <Info />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 space-y-3 text-sm">
        <p className="font-semibold">{t("title")}</p>
        <dl className="space-y-2.5">
          <div>
            <dt className="text-xs font-medium text-muted-foreground">{t("whoLabel")}</dt>
            <dd className="text-pretty">{t(`quien.${quien}`)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">
              {t("howLongLabel")}
            </dt>
            <dd className="text-pretty">{tt(conservacion)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">
              {t("whereLabel")}
            </dt>
            <dd>{t("where")}</dd>
          </div>
        </dl>
      </PopoverContent>
    </Popover>
  )
}
