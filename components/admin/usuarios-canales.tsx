import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import type { ChannelStats } from "@/lib/admin/metrics"
import { conMes } from "@/lib/admin/enlaces"
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
 * Rendimiento por canal de adquisición, acumulado hasta la fecha de corte.
 * El orgánico es la vara de medir: un canal que activa menos de la mitad
 * que el orgánico trae altas que solo consumen IA.
 */
export function UsuariosCanales({
  canales,
  mes,
}: {
  canales: ChannelStats[]
  mes?: string | null
}) {
  const t = useTranslations("admin.usuarios.channels")
  const tLabels = useTranslations("admin.labels")
  const f = useFormat()
  const pct = (v: number | null, decimals = 0) =>
    v === null ? "—" : f.percent(v, decimals)

  return (
    <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-border">
      <Table className="text-xs sm:text-sm">
        <caption className="sr-only">{t("caption")}</caption>
        <TableHeader>
          <TableRow>
            <TableHead>{t("channel")}</TableHead>
            <TableHead className="text-right" title={t("usersTitle")}>
              {t("users")}
            </TableHead>
            <TableHead
              className="text-right whitespace-nowrap"
              title={t("activatedTitle")}
            >
              {t("activated")}
            </TableHead>
            <TableHead className="text-right" title={t("paidTitle")}>
              {t("paid")}
            </TableHead>
            <TableHead className="text-right">{t("revenue")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="tabular-nums">
          {canales.map((c) => {
            // La señal viene calculada (`canalFlojo`, metrics.ts): aquí solo se escribe
            const flojo = c.senal !== null
            return (
              <TableRow key={c.channel}>
                <TableCell className="whitespace-nowrap">
                  <Link
                    href={conMes(`/admin/usuarios?canal=${c.channel}`, mes)}
                    className="font-medium underline-offset-4 hover:text-primary hover:underline"
                  >
                    {tLabels(`channel.${c.channel}`)}
                  </Link>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {f.number(c.total)}
                  <span className="ml-1 text-[11px] text-muted-foreground">
                    +{c.altasMes}
                  </span>
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right whitespace-nowrap",
                    flojo && "font-medium text-warning"
                  )}
                >
                  {c.activadosD7}
                  <span className="ml-1 text-[11px] text-muted-foreground">
                    {pct(c.activacionPct)}
                  </span>
                  {flojo && (
                    // El estado se escribe, no solo se tiñe
                    <span className="block text-[10px] font-normal">{t("weak")}</span>
                  )}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {c.pagando}
                  <span className="ml-1 text-[11px] text-muted-foreground">
                    {pct(c.conversionPct, 1)}
                  </span>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {f.money(c.ingreso)}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
