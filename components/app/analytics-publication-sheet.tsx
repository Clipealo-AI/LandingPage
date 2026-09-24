"use client"

import * as React from "react"
import { ExternalLink } from "lucide-react"
import { useTranslations } from "next-intl"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  COLOR_RED,
  curvaPublicacion,
  fechasAnalitica,
  type FilaPublicacion,
} from "@/lib/analytics"
import { Link, hrefDinamico } from "@/i18n/navigation"
import { SOCIAL_NETWORKS, cuentaPorId } from "@/lib/social"
import { useCuentasSociales } from "@/hooks/use-cuentas-sociales"
import { useFormat } from "@/hooks/use-format"
import { Button } from "@/components/ui/button"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Progress } from "@/components/ui/progress"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { SocialGlyph } from "@/components/brand/social"

/**
 * El crecimiento de una publicación desde que se indexó: vistas acumuladas día a
 * día hasta la última actualización, y sus cifras de ese momento.
 */
export function AnalyticsPublicationSheet({
  fila,
  indexadoEn,
  onOpenChange,
}: {
  fila: FilaPublicacion | null
  indexadoEn: Date
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Sheet open={fila !== null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-xl">
        {fila && <Detalle fila={fila} indexadoEn={indexadoEn} />}
      </SheetContent>
    </Sheet>
  )
}

function Detalle({ fila, indexadoEn }: { fila: FilaPublicacion; indexadoEn: Date }) {
  const t = useTranslations("analytics.sheet")
  const f = useFormat()
  const { dia, diaHora } = fechasAnalitica(f.locale)
  const { pub, total } = fila
  const { cuentas } = useCuentasSociales()
  const cuenta = cuentaPorId(pub.cuentaId, cuentas)
  const red = SOCIAL_NETWORKS[pub.red]
  const curva = React.useMemo(() => curvaPublicacion(pub, indexadoEn), [pub, indexadoEn])
  const config = {
    vistas: { label: t("metrics.views"), color: COLOR_RED[pub.red] },
  } satisfies ChartConfig
  const interaccion =
    total.vistas > 0
      ? ((total.likes + total.comentarios + total.compartidos) / total.vistas) * 100
      : null

  const cifras = [
    ["views", total.vistas],
    ["likes", total.likes],
    ["comments", total.comentarios],
    ["shares", total.compartidos],
  ] as const

  return (
    <>
      <SheetHeader className="border-b">
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <SocialGlyph network={pub.red} tone="official" className="size-4" aria-hidden />
          {t("published", {
            network: red.name,
            when: f.relative(pub.publicadoEn, indexadoEn),
          })}
          {cuenta?.handle && <span>· {cuenta.handle}</span>}
        </p>
        <SheetTitle className="text-lg leading-snug text-balance">
          {pub.titulo}
        </SheetTitle>
        <SheetDescription>
          {t("description", { date: diaHora.format(indexadoEn) })}
        </SheetDescription>
      </SheetHeader>

      <div className="space-y-6 p-4">
        <dl className="grid grid-cols-2 gap-3">
          {cifras.map(([metrica, valor]) => (
            <div key={metrica} className="rounded-xl p-3 ring-1 ring-border">
              <dt className="text-xs text-muted-foreground">{t(`metrics.${metrica}`)}</dt>
              <dd className="text-xl font-semibold" title={f.number(valor)}>
                {f.compact(valor)}
              </dd>
            </div>
          ))}
        </dl>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-medium">{t("retention")}</span>
            <span className="font-semibold tabular-nums">
              {f.percent(pub.retencion, 0)}
            </span>
          </div>
          <Progress
            value={pub.retencion}
            aria-label={t("retentionLabel", { percent: f.percent(pub.retencion, 0) })}
          />
          <p className="text-xs text-muted-foreground">
            {t("retentionHelp")}
            {interaccion !== null &&
              ` ${t("engagement", { rate: f.percent(interaccion, 1) })}`}
          </p>
        </div>

        <figure className="space-y-2">
          <figcaption className="text-sm font-medium">{t("chartCaption")}</figcaption>
          <ChartContainer config={config} className="aspect-auto h-56 w-full">
            <AreaChart data={curva} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="instante"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={28}
                tickFormatter={(v: string) => dia.format(new Date(v))}
                className="text-xs"
                stroke="var(--muted-foreground)"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={44}
                tickFormatter={(v: number) => f.compact(v)}
                className="text-xs tabular-nums"
                stroke="var(--muted-foreground)"
              />
              <ChartTooltip
                cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1 }}
                content={
                  <ChartTooltipContent
                    indicator="line"
                    labelFormatter={(v) => dia.format(new Date(String(v)))}
                    formatter={(value) => (
                      <span className="flex w-full items-baseline justify-between gap-4">
                        <span className="text-muted-foreground">
                          {t("metrics.views")}
                        </span>
                        <span className="font-semibold text-foreground tabular-nums">
                          {f.number(Number(value))}
                        </span>
                      </span>
                    )}
                  />
                }
              />
              <Area
                dataKey="vistas"
                type="monotone"
                stroke="var(--color-vistas)"
                strokeWidth={2}
                fill="var(--color-vistas)"
                fillOpacity={0.1}
                isAnimationActive={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--background)" }}
              />
            </AreaChart>
          </ChartContainer>
        </figure>

        <div className="space-y-2">
          <Button variant="outline" asChild className="w-full">
            <a href={pub.url} target="_blank" rel="noreferrer">
              {t("open", { network: red.name })} <ExternalLink />
            </a>
          </Button>
          {/* De la cifra al clip: desde aquí se cambia el texto o se vuelve a
              publicar en otra cuenta, que es lo que se hace tras mirar esto */}
          {pub.clipId && pub.proyectoId && (
            <Button variant="ghost" asChild className="w-full">
              <Link
                href={hrefDinamico("/proyectos/[id]/clips/[clipId]", {
                  id: pub.proyectoId,
                  clipId: pub.clipId,
                })}
              >
                {t("verClip")}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </>
  )
}
