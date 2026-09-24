"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { ArrowUpRight } from "lucide-react"

import { Link, hrefDinamico } from "@/i18n/navigation"
import type { Format } from "@/lib/format"
import {
  topePorVideo,
  type Campana,
  type EstadoVisto,
  type Liquidacion,
} from "@/lib/campanas"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useFormat } from "@/hooks/use-format"
import { CampaignCover, InfoHint } from "@/components/campanas/campaign-bits"
import { AccionCampana } from "@/components/campanas/solicitar-dialog"

/** «US$ 0,72» aunque sea redondo en céntimos: el CPM se compara al céntimo. */
export const cpmTexto = (f: Format, cpm: number) => f.money(cpm, { decimals: 2 })

/**
 * Tarjeta de campaña en Explorar: la portada con las redes, quién la paga, las
 * tres cifras que deciden si merece la pena (CPM, presupuesto y tope por video)
 * y cuánto queda. La acción la pone `AccionCampana` y depende de dónde esté
 * quien mira —«Solicitar entrar», «Subir clip» con su cuenta atrás, «En
 * revisión»…—, con el motivo escrito cuando no puede hacer nada; el icono abre
 * el detalle.
 */
export function CampaignCard({
  campana,
  liquidacion,
  estado,
  clips,
  onSubir,
  preview = false,
}: {
  campana: Campana
  liquidacion: Pick<Liquidacion, "consumidoPct">
  estado: EstadoVisto
  clips: number
  onSubir?: () => void
  /** En la vista previa del formulario: sin enlaces ni acciones. */
  preview?: boolean
}) {
  const t = useTranslations("campaigns.card")
  const th = useTranslations("campaigns.help")
  const tc = useTranslations("campaigns.category")
  const f = useFormat()
  const consumido = Math.min(100, Math.round(liquidacion.consumidoPct))
  const href = hrefDinamico("/campanas/[id]", { id: campana.id })

  return (
    <article className="flex flex-col gap-3" aria-labelledby={`cmp-${campana.id}`}>
      <div
        className={
          campana.destacada
            ? "overflow-hidden rounded-xl bg-card ring-2 ring-brand/40"
            : "overflow-hidden rounded-xl bg-card ring-1 ring-border"
        }
      >
        <CampaignCover campana={campana} estado={estado} />

        <div className="space-y-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3
                id={`cmp-${campana.id}`}
                className="leading-snug font-bold text-balance"
              >
                {preview ? (
                  campana.titulo || t("titlePlaceholder")
                ) : (
                  <Link href={href} className="hover:underline">
                    {campana.titulo}
                  </Link>
                )}
              </h3>
              <p className="truncate text-sm text-muted-foreground">
                {campana.marca || t("brandPlaceholder")}
              </p>
            </div>
            <Badge variant="outline" className="shrink-0">
              {tc(campana.categoria)}
            </Badge>
          </div>

          <dl className="grid grid-cols-3 gap-2">
            <Cifra
              etiqueta={t("cpm")}
              ayuda={th("cpm")}
              valor={cpmTexto(f, campana.cpm)}
            />
            <Cifra
              etiqueta={t("budget")}
              ayuda={th("budget")}
              valor={f.money(campana.presupuesto)}
            />
            <Cifra
              etiqueta={t("perVideo")}
              ayuda={th("cap")}
              valor={f.money(topePorVideo(campana))}
              detalle={t("maxPct", { pct: f.percent(campana.topePorVideoPct) })}
            />
          </dl>

          <div className="space-y-1.5">
            <Progress
              value={consumido}
              aria-label={t("spentAria", { pct: f.percent(consumido) })}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                {t("spent", { pct: f.percent(consumido) })}{" "}
                <InfoHint label={t("spentHint")}>{th("spent")}</InfoHint>
              </span>
              <span className="tabular-nums">{t("clips", { n: clips })}</span>
            </div>
          </div>
        </div>
      </div>

      {!preview && (
        <AccionCampana
          campana={campana}
          estado={estado}
          onEntregar={onSubir}
          extra={
            <Button variant="outline" size="icon" asChild>
              <Link href={href} aria-label={t("view", { title: campana.titulo })}>
                <ArrowUpRight />
              </Link>
            </Button>
          }
        />
      )}
    </article>
  )
}

function Cifra({
  etiqueta,
  ayuda,
  valor,
  detalle,
}: {
  etiqueta: string
  ayuda: string
  valor: string
  detalle?: string
}) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-0.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {/* «Qué es presupuesto», pero «Qué es CPM»: las siglas no se pasan a minúsculas */}
        {etiqueta}{" "}
        <InfoHint label={/^\p{Lu}+$/u.test(etiqueta) ? etiqueta : etiqueta.toLowerCase()}>
          {ayuda}
        </InfoHint>
      </dt>
      <dd
        className="truncate font-semibold tabular-nums"
        title={detalle ? `${valor} · ${detalle}` : valor}
      >
        {valor}
      </dd>
      {detalle && <dd className="text-xs text-muted-foreground">{detalle}</dd>}
    </div>
  )
}
