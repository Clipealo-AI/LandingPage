import { useTranslations } from "next-intl"

import { UMBRAL_FALLOS_PUBLICACION, type PublicacionesBlock } from "@/lib/admin/metrics"
import { SOCIAL_NETWORKS } from "@/lib/social"
import { useFormat } from "@/hooks/use-format"
import { deltaOf, KpiCard } from "@/components/admin/kpi-card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

/**
 * Salud de publicación: lo que salió a las redes este mes, qué falló en la
 * semana y cómo están las cuentas conectadas.
 *
 * Va pegado al pipeline porque cuenta la última milla del mismo trabajo: el
 * pipeline fabrica el clip y esto dice si llegó a salir. Un clip que se queda
 * dentro costó lo mismo y no valió nada.
 *
 * Las cifras son SIMULADAS y la primera línea lo dice en voz alta. La agenda y
 * las cuentas viven hoy en el navegador de cada persona, así que el servidor no
 * las puede contar: sin el aviso, estos números se leerían como medidos.
 */
export function CostesPublicaciones({
  publicaciones,
  comparable,
}: {
  publicaciones: PublicacionesBlock
  /** Contra qué se compara el mes: «mismos días» si está en curso. */
  comparable: string
}) {
  const t = useTranslations("admin.costes.publicaciones")
  const tMetrics = useTranslations("admin.metrics")
  const tLabels = useTranslations("admin.labels")
  const f = useFormat()
  const {
    publicadas,
    publicadasPrevias,
    porPlataforma,
    fallidas7d,
    exito7dPct,
    cuentas,
    usuariosConCuentaViva,
    clipsPublicadosPct,
    medianaHorasAPublicar,
  } = publicaciones
  const guion = "—"
  const U = UMBRAL_FALLOS_PUBLICACION

  // Las redes son marcas: el nombre no se traduce, el motivo del fallo sí
  const red = (id: (typeof porPlataforma)[number]["network"]) => SOCIAL_NETWORKS[id].name
  const totalCuentas = cuentas.reduce((n, c) => n + c.n, 0)
  const caducadas = cuentas.find((c) => c.estado === "caducada")?.n ?? 0
  // Solo las tres primeras: la cuarta red ya no cambia ninguna decisión
  const mezcla = porPlataforma.length
    ? porPlataforma
        .slice(0, 3)
        .map((p) =>
          t("stats.share", {
            red: red(p.network),
            pct: p.pct === null ? guion : f.percent(p.pct, 0),
          })
        )
        .join(" · ")
    : t("stats.noNetworks")

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t("simulated")}</p>

      {/* Rejilla propia y no `KpiGrid`: la página ya tiene una region de
          indicadores arriba y dos con el mismo nombre se confunden al navegar
          por landmarks */}
      <div className="grid [grid-template-columns:repeat(auto-fit,minmax(15rem,1fr))] gap-3">
        <KpiCard
          label={t("stats.published")}
          value={f.number(publicadas)}
          delta={deltaOf(
            publicadas,
            publicadasPrevias,
            (d) => `${d >= 0 ? "+" : "−"}${Math.abs(d)}`,
            comparable
          )}
          lines={[mezcla]}
          footnote={t("stats.publishedFootnote")}
        />
        <KpiCard
          label={t("stats.failures")}
          value={fallidas7d.pct === null ? guion : f.percent(fallidas7d.pct, 1)}
          tone={fallidas7d.tono}
          lines={[
            t("stats.failuresOf", { n: fallidas7d.n, total: fallidas7d.intentadas }),
            t("stats.success", {
              pct: exito7dPct === null ? guion : f.percent(exito7dPct, 1),
            }),
          ]}
          footnote={t("stats.failuresFootnote", {
            aviso: f.percent(U.avisoPct, 0),
            alerta: f.percent(U.alertaPct, 0),
          })}
        />
        <KpiCard
          label={t("stats.accounts")}
          value={f.number(totalCuentas)}
          tone={caducadas > 0 ? "aviso" : "neutral"}
          lines={[
            cuentas
              .map((c) => `${tLabels(`accountState.${c.estado}`)} ${f.number(c.n)}`)
              .join(" · "),
          ]}
          footnote={t("stats.accountsFootnote", { n: usuariosConCuentaViva })}
        />
        <KpiCard
          label={t("stats.toPublish")}
          value={
            medianaHorasAPublicar === null
              ? guion
              : t("stats.hours", { n: Math.round(medianaHorasAPublicar * 10) / 10 })
          }
          lines={[
            clipsPublicadosPct === null
              ? t("stats.clipsOutNone")
              : t("stats.clipsOut", { pct: f.percent(clipsPublicadosPct, 0) }),
          ]}
          footnote={t("stats.toPublishFootnote")}
        />
      </div>

      {fallidas7d.n === 0 ? (
        <p className="text-sm text-muted-foreground">{t("failures.empty")}</p>
      ) : (
        <div className="grid gap-3 @3xl/admin:grid-cols-2">
          <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-border">
            <Table>
              <caption className="sr-only">{t("failures.captionReason")}</caption>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("failures.reason")}</TableHead>
                  <TableHead className="text-right">{t("failures.count")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="tabular-nums">
                {fallidas7d.porMotivo.map(({ motivo, n }) => (
                  <TableRow key={motivo}>
                    <TableCell className="font-medium">
                      {tMetrics(`publishFailure.${motivo}`)}
                    </TableCell>
                    <TableCell className="text-right">{n}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-border">
            <Table>
              <caption className="sr-only">{t("failures.captionNetwork")}</caption>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("failures.network")}</TableHead>
                  <TableHead className="text-right">{t("failures.count")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="tabular-nums">
                {fallidas7d.porPlataforma.map(({ network, n }) => (
                  <TableRow key={network}>
                    <TableCell className="font-medium">{red(network)}</TableCell>
                    <TableCell className="text-right">{n}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">{t("note")}</p>
    </div>
  )
}
