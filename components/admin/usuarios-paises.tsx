import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import type { CountryStats } from "@/lib/admin/metrics"
import { conMes } from "@/lib/admin/enlaces"
import { useFormat } from "@/hooks/use-format"
import { CountryFlag, useCountryName } from "@/components/shared/country-flag"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

/**
 * Segmentación por país, acumulada hasta la fecha de corte. La clave es el
 * código ISO de cada usuario; el nombre del país enlaza con la tabla filtrada.
 */
export function UsuariosPaises({
  paises,
  mes,
}: {
  paises: CountryStats[]
  /** El mes elegido en el backoffice, para que los enlaces no lo pierdan. */
  mes?: string | null
}) {
  const t = useTranslations("admin.usuarios.countries")
  const f = useFormat()
  const pais = useCountryName()
  const pct = (v: number | null, decimals = 0) =>
    v === null ? "—" : f.percent(v, decimals)

  return (
    <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-border">
      <Table className="text-xs sm:text-sm">
        <caption className="sr-only">{t("caption")}</caption>
        <TableHeader>
          <TableRow>
            <TableHead>{t("country")}</TableHead>
            <TableHead className="text-right" title={t("usersTitle")}>
              {t("users")}
            </TableHead>
            <TableHead className="text-right whitespace-nowrap" title={t("signupsTitle")}>
              {t("signups")}
            </TableHead>
            <TableHead className="text-right whitespace-nowrap" title={t("activeTitle")}>
              {t("active")}
            </TableHead>
            <TableHead className="text-right whitespace-nowrap" title={t("payingTitle")}>
              {t("paying")}
            </TableHead>
            <TableHead className="text-right">{t("mrr")}</TableHead>
            <TableHead className="text-right">{t("revenue")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="tabular-nums">
          {paises.map((c) => (
            <TableRow key={c.code}>
              <TableCell className="whitespace-nowrap">
                <Link
                  href={conMes(`/admin/usuarios?pais=${c.code}`, mes)}
                  className="inline-flex items-center gap-2 font-medium underline-offset-4 hover:text-primary hover:underline"
                >
                  <CountryFlag code={c.code} />
                  {pais(c.code)}
                </Link>
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {f.number(c.total)}
                <span className="ml-1 text-[11px] text-muted-foreground">
                  {pct(c.pctTotal)}
                </span>
              </TableCell>
              <TableCell className="text-right">
                {c.altasMes > 0 ? (
                  `+${c.altasMes}`
                ) : (
                  <span className="text-muted-foreground">0</span>
                )}
              </TableCell>
              <TableCell className="text-right">{c.activos30d}</TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {c.pagando}
                <span className="ml-1 text-[11px] text-muted-foreground">
                  {pct(c.conversionPct, 1)}
                </span>
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {c.mrr > 0 ? (
                  f.money(c.mrr)
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {c.ingreso > 0 ? (
                  f.money(c.ingreso)
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
