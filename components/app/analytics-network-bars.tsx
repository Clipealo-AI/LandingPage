import * as React from "react"
import { useTranslations } from "next-intl"

import { COLOR_RED, type TotalRed } from "@/lib/analytics"
import { SOCIAL_NETWORKS } from "@/lib/social"
import { useFormat } from "@/hooks/use-format"
import { SocialGlyph } from "@/components/brand/social"

/**
 * Dónde se ven los clips: vistas ganadas en el período por red, de más a menos.
 * Barras finas en HTML con la cifra en el extremo, así que no hace falta hover
 * para leerlas. Extremo redondeado de 4 px y recto en la base; el color es el
 * de la red, el mismo que en la gráfica de crecimiento.
 */
export function AnalyticsNetworkBars({ totales }: { totales: TotalRed[] }) {
  const t = useTranslations("analytics.networks")
  const f = useFormat()
  const max = Math.max(...totales.map((x) => x.vistas), 1)
  const suma = totales.reduce((n, x) => n + x.vistas, 0)

  return (
    <ul className="space-y-5" aria-label={t("listLabel")}>
      {totales.map((total) => {
        const red = SOCIAL_NETWORKS[total.red]
        const pct = suma > 0 ? (total.vistas / suma) * 100 : 0
        return (
          <li key={total.red} className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <SocialGlyph
                  network={total.red}
                  tone="official"
                  className="size-4"
                  aria-hidden
                />
                <span className="truncate font-medium">{red.name}</span>
              </span>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {t("shareOfTotal", { percent: f.percent(pct, 0) })}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2.5 min-w-0 flex-1">
                <div
                  className="h-full rounded-r-[4px]"
                  style={{
                    width: `${Math.max((total.vistas / max) * 100, 1)}%`,
                    background: COLOR_RED[total.red],
                  }}
                />
              </div>
              <span
                className="w-16 shrink-0 text-right text-sm font-semibold tabular-nums"
                title={f.number(total.vistas)}
              >
                {f.compact(total.vistas)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("summary", {
                rate:
                  total.interaccionPct === null
                    ? "—"
                    : f.percent(total.interaccionPct, 1),
                count: total.publicaciones,
              })}
            </p>
          </li>
        )
      })}
    </ul>
  )
}
