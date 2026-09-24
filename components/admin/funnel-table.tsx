import { useLocale, useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import type { FunnelRow } from "@/lib/admin/metrics"
import { useFormat } from "@/hooks/use-format"
import { INTL_TAG } from "@/components/admin/textos"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

/**
 * Funnel de activación por cohorte: una fila por semana o mes de alta y una
 * columna por paso. Cada paso trae el número y el % sobre registrados.
 * Los umbrales pintan la celda: registro→proyecto < 50 % es fricción de
 * subida; proyecto→clip < 80 % es pipeline; clip→pago < 5 % es paywall.
 */
export function FunnelTable({
  rows,
  caption,
  cohorteLabel,
}: {
  rows: FunnelRow[]
  caption?: string
  cohorteLabel?: string
}) {
  const t = useTranslations("admin.funnel")
  const f = useFormat()
  const locale = useLocale()
  // Semana: el día en que empieza, «19/07» · «07/19»
  const diaMes = new Intl.DateTimeFormat(INTL_TAG[locale], {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  })
  /** "2026-09" → "Septiembre de 2026"; semana → "19/07". */
  const etiqueta = (row: FunnelRow) =>
    /^\d{4}-\d{2}$/.test(row.etiqueta)
      ? f.month(row.etiqueta, { capital: true })
      : diaMes.format(new Date(row.desde))

  return (
    <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-border">
      <Table className="text-xs sm:text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <TableHeader>
          <TableRow>
            <TableHead>{cohorteLabel ?? t("cohort")}</TableHead>
            <TableHead className="text-right">{t("signups")}</TableHead>
            <TableHead className="text-right">
              {t("project")}{" "}
              <span className="font-normal text-muted-foreground">
                {t("within", { n: 7 })}
              </span>
            </TableHead>
            <TableHead className="text-right">
              {t("clip")}{" "}
              <span className="font-normal text-muted-foreground">
                {t("within", { n: 7 })}
              </span>
            </TableHead>
            <TableHead className="text-right">
              {t("payment")}{" "}
              <span className="font-normal text-muted-foreground">
                {t("within", { n: 30 })}
              </span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="tabular-nums">
          {rows.map((row) => {
            // Las señales vienen calculadas (`UMBRAL_FUNNEL`, metrics.ts): aquí solo se pintan
            const proyectoBajo = row.senales.includes("registro-proyecto-bajo")
            const clipBajo = row.senales.includes("proyecto-clip-bajo")
            const pagoBajo = row.senales.includes("clip-pago-bajo")
            return (
              <TableRow key={row.etiqueta}>
                <TableCell className="whitespace-nowrap">
                  {etiqueta(row)}
                  {row.enCurso && (
                    <Badge variant="outline" className="ml-1.5 h-4 px-1 text-[10px]">
                      {t("inProgress")}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {row.registrados}
                </TableCell>
                <Celda n={row.conProyecto} pct={row.pctProyecto} alerta={proyectoBajo} />
                <Celda n={row.activados} pct={row.pctActivados} alerta={clipBajo} />
                <Celda n={row.pagantes} pct={row.pctPagantes} alerta={pagoBajo} />
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

function Celda({ n, pct, alerta }: { n: number; pct: number | null; alerta: boolean }) {
  const f = useFormat()
  return (
    <TableCell
      className={cn("text-right whitespace-nowrap", alerta && "font-medium text-warning")}
    >
      {n}
      {pct !== null && (
        <span className="ml-1 text-[11px] text-muted-foreground">
          {f.percent(pct, 0)}
        </span>
      )}
    </TableCell>
  )
}
