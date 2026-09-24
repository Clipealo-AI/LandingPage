"use client"

import * as React from "react"
import { ChevronRight } from "lucide-react"
import { useTranslations } from "next-intl"

import { COLOR_RED, type FilaPublicacion } from "@/lib/analytics"
import { SOCIAL_NETWORKS, cuentaPorId } from "@/lib/social"
import { useCuentasSociales } from "@/hooks/use-cuentas-sociales"
import { useFormat } from "@/hooks/use-format"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SocialGlyph } from "@/components/brand/social"
import { Sparkline } from "@/components/shared/sparkline"

/**
 * El índice: una fila por clip publicado en una red, de más a menos vistas
 * ganadas en el período. Toda la fila abre el detalle; el título es el botón,
 * para que el teclado y los lectores de pantalla tengan un objetivo claro.
 */
export function AnalyticsPublicationsTable({
  filas,
  indexadoEn,
  onOpen,
}: {
  filas: FilaPublicacion[]
  indexadoEn: Date
  onOpen: (fila: FilaPublicacion) => void
}) {
  const t = useTranslations("analytics.table")
  const f = useFormat()
  const { cuentas } = useCuentasSociales()
  /** El `@handle` de la cuenta que publicó, si esa cuenta sigue conectada. */
  const handleDe = (id?: string) => cuentaPorId(id, cuentas)?.handle
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("clip")}</TableHead>
            <TableHead className="text-right">{t("views")}</TableHead>
            <TableHead className="text-right">{t("inPeriod")}</TableHead>
            <TableHead className="text-right max-lg:hidden">{t("sinceLast")}</TableHead>
            <TableHead className="text-right max-md:hidden">{t("likes")}</TableHead>
            <TableHead className="text-right max-xl:hidden">{t("shares")}</TableHead>
            <TableHead className="text-right max-md:hidden">{t("retention")}</TableHead>
            <TableHead className="w-28 max-sm:hidden">{t("last14Days")}</TableHead>
            <TableHead className="w-8">
              <span className="sr-only">{t("detail")}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filas.map((fila) => {
            const { pub } = fila
            const red = SOCIAL_NETWORKS[pub.red]
            return (
              <TableRow
                key={pub.id}
                className="group cursor-pointer"
                onClick={() => onOpen(fila)}
              >
                <TableCell className="max-w-[28rem] min-w-56 whitespace-normal">
                  <div className="flex items-start gap-3">
                    <SocialGlyph
                      network={pub.red}
                      tone="official"
                      className="mt-0.5 size-5"
                      aria-hidden
                    />
                    <div className="min-w-0 space-y-0.5">
                      <button
                        type="button"
                        className="text-left font-medium text-balance hover:underline"
                        onClick={(e) => {
                          e.stopPropagation()
                          onOpen(fila)
                        }}
                      >
                        {pub.titulo}
                      </button>
                      <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                        <span>
                          {red.name}
                          {/* Con dos cuentas de la misma red, el nombre de la
                              red no basta para saber de cuál es esta fila */}
                          {handleDe(pub.cuentaId) ? ` · ${handleDe(pub.cuentaId)}` : ""} ·{" "}
                          {f.relative(pub.publicadoEn, indexadoEn)}
                        </span>
                        {fila.nueva && <Badge variant="brand-subtle">{t("new")}</Badge>}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell
                  className="text-right tabular-nums"
                  title={f.number(fila.total.vistas)}
                >
                  {f.compact(fila.total.vistas)}
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  +{f.compact(fila.enPeriodo.vistas)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground tabular-nums max-lg:hidden">
                  {fila.desdeAnterior === null ? "—" : `+${f.number(fila.desdeAnterior)}`}
                </TableCell>
                <TableCell className="text-right tabular-nums max-md:hidden">
                  {f.compact(fila.total.likes)}
                </TableCell>
                <TableCell className="text-right tabular-nums max-xl:hidden">
                  {f.compact(fila.total.compartidos)}
                </TableCell>
                <TableCell className="text-right tabular-nums max-md:hidden">
                  {f.percent(pub.retencion, 0)}
                </TableCell>
                <TableCell className="max-sm:hidden">
                  <Sparkline
                    values={fila.tendencia}
                    color={COLOR_RED[pub.red]}
                    className="h-7 w-24"
                  />
                </TableCell>
                <TableCell>
                  <ChevronRight
                    aria-hidden
                    className="size-4 text-muted-foreground transition-colors group-hover:text-foreground"
                  />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
