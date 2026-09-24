import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import type { ChannelStats } from "@/lib/admin/metrics"
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
 * Canales de adquisición con el orgánico como referencia: activación D7 y
 * conversión a pagante de cada canal, acumulado. La fila de afiliados va
 * resaltada; una celda por debajo de la mitad de la orgánica se tiñe.
 */
export function AfiliadosCanales({ canales }: { canales: ChannelStats[] }) {
  const t = useTranslations("admin.afiliados.channels")
  const tLabels = useTranslations("admin.labels")
  const f = useFormat()
  const organico = canales.find((c) => c.channel === "organico")
  const actOrg = organico?.activacionPct ?? null
  const convOrg = organico?.conversionPct ?? null
  const orden = [...canales].sort((a, b) =>
    a.channel === "afiliado"
      ? -1
      : b.channel === "afiliado"
        ? 1
        : a.channel === "organico"
          ? -1
          : b.channel === "organico"
            ? 1
            : b.total - a.total
  )

  return (
    <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-border">
      <Table className="text-xs sm:text-sm">
        <caption className="sr-only">{t("caption")}</caption>
        <TableHeader>
          <TableRow>
            <TableHead>{t("channel")}</TableHead>
            <TableHead className="text-right">{t("users")}</TableHead>
            <TableHead className="text-right">{t("signupsMonth")}</TableHead>
            <TableHead className="text-right">{t("activated")}</TableHead>
            <TableHead className="text-right">{t("payers")}</TableHead>
            <TableHead className="text-right">{t("revenue")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="tabular-nums">
          {orden.map((c) => {
            const esAfiliado = c.channel === "afiliado"
            const esOrganico = c.channel === "organico"
            const actBaja =
              !esOrganico &&
              c.total >= 10 &&
              c.activacionPct !== null &&
              actOrg !== null &&
              c.activacionPct < actOrg / 2
            const convBaja =
              !esOrganico &&
              c.total >= 10 &&
              c.conversionPct !== null &&
              convOrg !== null &&
              c.conversionPct < convOrg
            return (
              <TableRow
                key={c.channel}
                className={cn(esAfiliado && "bg-primary/5 font-medium")}
              >
                <TableCell className="whitespace-nowrap">
                  {tLabels(`channel.${c.channel}`)}
                  {esOrganico && (
                    <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">
                      {t("benchmark")}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">{f.number(c.total)}</TableCell>
                <TableCell className="text-right">{c.altasMes}</TableCell>
                <Celda n={c.activadosD7} pct={c.activacionPct} alerta={actBaja} />
                <Celda
                  n={c.pagando}
                  pct={c.conversionPct}
                  alerta={convBaja}
                  decimals={1}
                />
                <TableCell className="text-right">{f.money(c.ingreso)}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

function Celda({
  n,
  pct,
  alerta,
  decimals = 0,
}: {
  n: number
  pct: number | null
  alerta: boolean
  decimals?: number
}) {
  const f = useFormat()
  return (
    <TableCell
      className={cn("text-right whitespace-nowrap", alerta && "font-medium text-warning")}
    >
      {n}
      {pct !== null && (
        <span className="ml-1 text-[11px] text-muted-foreground">
          {f.percent(pct, decimals)}
        </span>
      )}
    </TableCell>
  )
}
