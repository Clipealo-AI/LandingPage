import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import type { SourceStats } from "@/lib/admin/metrics"
import { useFormat } from "@/hooks/use-format"
import { MockAction } from "@/components/admin/mock-action"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

/** Mediana; null si no hay datos. */
function mediana(values: number[]) {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/**
 * Rendimiento por fuente de vídeo en 30 días: volumen frente a los 30 d
 * previos, tasa de éxito, coste unitario y conversión de quien empezó por esa
 * fuente. La alerta de caída (histórico > 20 y cero en 30 d) es un conector roto.
 */
export function CostesFuentes({ fuentes }: { fuentes: SourceStats[] }) {
  const t = useTranslations("admin.costes.fuentes")
  const tLabels = useTranslations("admin.labels")
  const tTable = useTranslations("admin.table")
  const f = useFormat()
  const guion = "—"
  const medianaMin = mediana(
    fuentes.map((f) => f.costePorMinuto).filter((v): v is number => v !== null)
  )

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-border">
        <Table>
          <caption className="sr-only">{t("caption")}</caption>
          <TableHeader>
            <TableRow>
              <TableHead>{t("source")}</TableHead>
              <TableHead className="text-right">
                {t("projects")}{" "}
                <span className="font-normal text-muted-foreground">{t("prior")}</span>
              </TableHead>
              <TableHead className="text-right">{t("success")}</TableHead>
              <TableHead className="text-right max-lg:hidden">
                {t("clipsPerProject")}
              </TableHead>
              <TableHead className="text-right max-lg:hidden">{t("users")}</TableHead>
              <TableHead className="text-right max-md:hidden">
                {t("perProject")}
              </TableHead>
              <TableHead className="text-right">{t("perMin")}</TableHead>
              <TableHead className="text-right max-xl:hidden">
                {t("firstSourceConv")}
              </TableHead>
              <TableHead className="text-right">
                <span className="sr-only">{tTable("actions")}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="tabular-nums">
            {fuentes.map((fuente) => {
              const exitoBajo =
                fuente.exitoPct !== null && fuente.proyectos >= 5 && fuente.exitoPct < 80
              const caro =
                medianaMin !== null &&
                fuente.costePorMinuto !== null &&
                fuente.costePorMinuto > medianaMin * 2
              const sinUso = fuente.proyectos === 0
              const nombre = tLabels(`source.${fuente.source}`)
              return (
                <TableRow
                  key={fuente.source}
                  className={cn(fuente.alertaCaida && "bg-destructive/5")}
                >
                  <TableCell className="font-medium">
                    <span className="flex flex-wrap items-center gap-2">
                      {nombre}
                      {fuente.alertaCaida && (
                        <Badge variant="destructive">{t("broken")}</Badge>
                      )}
                    </span>
                  </TableCell>
                  <TableCell
                    className={cn("text-right", sinUso && "text-muted-foreground")}
                  >
                    {fuente.proyectos}{" "}
                    <span className="text-muted-foreground">({fuente.previos})</span>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right",
                      exitoBajo && "font-medium text-destructive"
                    )}
                  >
                    {fuente.exitoPct === null ? guion : f.percent(fuente.exitoPct, 0)}
                  </TableCell>
                  <TableCell className="text-right max-lg:hidden">
                    {fuente.clipsPorProyecto === null
                      ? guion
                      : f.number(fuente.clipsPorProyecto)}
                  </TableCell>
                  <TableCell className="text-right max-lg:hidden">
                    {f.number(fuente.usuarios)}
                  </TableCell>
                  <TableCell className="text-right max-md:hidden">
                    {fuente.costePorProyecto === null
                      ? guion
                      : f.money(fuente.costePorProyecto, { decimals: 3 })}
                  </TableCell>
                  <TableCell
                    className={cn("text-right", caro && "font-medium text-warning")}
                  >
                    {fuente.costePorMinuto === null
                      ? guion
                      : f.money(fuente.costePorMinuto, { decimals: 4 })}
                  </TableCell>
                  <TableCell className="text-right max-xl:hidden">
                    {fuente.conversionPrimeraFuentePct === null
                      ? guion
                      : f.percent(fuente.conversionPrimeraFuentePct, 1)}
                  </TableCell>
                  <TableCell className="text-right">
                    {(fuente.alertaCaida || exitoBajo) && (
                      <MockAction
                        size="sm"
                        variant="ghost"
                        efecto={
                          fuente.alertaCaida
                            ? t("reviewConnectorEffect", {
                                fuente: nombre,
                                n: fuente.acumulado,
                              })
                            : t("disableEffect", { fuente: nombre })
                        }
                      >
                        {fuente.alertaCaida ? t("reviewConnector") : t("disable")}
                      </MockAction>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">
        {medianaMin !== null
          ? t("noteMedian", { mediana: f.money(medianaMin, { decimals: 4 }) })
          : t("note")}
      </p>
    </div>
  )
}
