import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import { RETENCION_M1, type CohortRow } from "@/lib/admin/metrics"
import { useFormat } from "@/hooks/use-format"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

/**
 * Tabla triangular de retención: cohorte de alta × meses desde el alta.
 * El tinte de cada celda va con el valor, en escala del color de estructura,
 * y el número siempre está escrito: el color ayuda, no sustituye.
 */
export function CohortTable({
  rows,
  base = "registrados",
  meses = 4,
}: {
  rows: CohortRow[]
  /** Sobre quién se mide: todos los registrados o solo los activados en 7 días. */
  base?: "registrados" | "activados"
  meses?: number
}) {
  const t = useTranslations("admin.cohorts")
  const f = useFormat()
  const key = base === "activados" ? "retencionActivados" : "retencion"
  return (
    <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-border">
      <Table>
        <caption className="sr-only">{t("caption")}</caption>
        <TableHeader>
          <TableRow>
            <TableHead>{t("cohort")}</TableHead>
            <TableHead className="text-right">
              {base === "activados" ? t("activated") : t("signups")}
            </TableHead>
            {Array.from({ length: meses }, (_, k) => (
              <TableHead key={k} className="text-center">
                M{k}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className="tabular-nums">
          {rows.map((row) => (
            <TableRow key={row.cohorte}>
              <TableCell className="whitespace-nowrap capitalize">
                {f.monthShort(row.cohorte)} {row.cohorte.slice(2, 4)}
              </TableCell>
              <TableCell className="text-right">
                {base === "activados" ? row.activadosD7 : row.registrados}
              </TableCell>
              {row[key].slice(0, meses).map((v, k) => (
                <TableCell key={k} className="p-1 text-center">
                  {v === null ? (
                    <span className="text-muted-foreground/50">·</span>
                  ) : (
                    <span
                      className={cn(
                        "inline-block w-full rounded-md px-1.5 py-1 text-xs font-medium",
                        tinte(v)
                      )}
                      style={{ opacity: 0.55 + Math.min(v, 60) / 130 }}
                    >
                      {f.percent(v, 0)}
                    </span>
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function tinte(v: number) {
  if (v >= RETENCION_M1.nucleoPct) return "bg-primary text-primary-foreground"
  if (v >= RETENCION_M1.episodicoPct) return "bg-primary/60 text-primary-foreground"
  if (v >= 10) return "bg-primary/25 text-foreground"
  return "bg-muted text-muted-foreground"
}
