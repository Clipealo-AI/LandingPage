import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import type { CostesBlock } from "@/lib/admin/metrics"
import { conMes } from "@/lib/admin/enlaces"
import { useFormat } from "@/hooks/use-format"
import { MockAction } from "@/components/admin/mock-action"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

/**
 * Las diez cuentas de Prueba sin ningún pago que más IA consumen este mes. Una
 * cuenta que domina la lista mes tras mes es candidata a tope de minutos o,
 * si está duplicada, a bloqueo.
 */
export function CostesTopFree({
  items,
  deFree,
  mes,
}: {
  items: CostesBlock["topFree"]
  deFree: CostesBlock["deFree"]
  /** El mes elegido en el backoffice, para que los enlaces no lo pierdan. */
  mes?: string | null
}) {
  const t = useTranslations("admin.costes.topFree")
  const tLabels = useTranslations("admin.labels")
  const tTable = useTranslations("admin.table")
  const f = useFormat()

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-border">
        <Table>
          <caption className="sr-only">{t("caption")}</caption>
          <TableHeader>
            <TableRow>
              <TableHead>{t("user")}</TableHead>
              <TableHead className="text-right">{t("min")}</TableHead>
              <TableHead className="text-right">{t("cost")}</TableHead>
              <TableHead className="text-right max-md:hidden">
                {t("shareOfTrial")}
              </TableHead>
              <TableHead className="text-right">
                <span className="sr-only">{tTable("actions")}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="tabular-nums">
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                  {t("empty")}
                </TableCell>
              </TableRow>
            )}
            {items.map((u, i) => (
              <TableRow key={u.userId}>
                <TableCell className="max-w-56">
                  <p className="flex items-center gap-2">
                    <span className="w-4 shrink-0 text-right text-xs text-muted-foreground">
                      {i + 1}
                    </span>
                    <Link
                      href={conMes(
                        `/admin/usuarios?q=${encodeURIComponent(u.userName)}`,
                        mes
                      )}
                      className="truncate font-medium underline-offset-4 hover:text-primary hover:underline"
                    >
                      {u.userName}
                    </Link>
                  </p>
                  <p className="truncate pl-6 text-xs text-muted-foreground">
                    {t("projects", {
                      canal: tLabels(`channel.${u.channel}`),
                      n: u.proyectos,
                    })}
                  </p>
                </TableCell>
                <TableCell className="text-right">
                  {f.number(Math.round(u.minutos))}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {f.money(u.cost, { decimals: 2 })}
                </TableCell>
                <TableCell className="text-right text-muted-foreground max-md:hidden">
                  {deFree.amount > 0 ? f.percent((u.cost / deFree.amount) * 100, 0) : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <MockAction
                    size="sm"
                    variant="ghost"
                    efecto={t("blockEffect", {
                      nombre: u.userName,
                      monto: f.money(u.cost, { decimals: 2 }),
                    })}
                  >
                    {t("block")}
                  </MockAction>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground tabular-nums">
        {t("note", {
          monto: f.money(deFree.amount, { decimals: 2 }),
          pct: f.percent(deFree.pct, 0),
        })}
        {deFree.porActivo !== null &&
          t("notePerActive", { monto: f.money(deFree.porActivo, { decimals: 3 }) })}
        {deFree.subsidioPctMrr !== null &&
          t("noteSubsidy", { pct: f.percent(deFree.subsidioPctMrr, 1) })}
        .
      </p>
    </div>
  )
}
