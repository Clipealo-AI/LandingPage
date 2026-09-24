import * as React from "react"
import { useTranslations } from "next-intl"

import type { CostesBlock } from "@/lib/admin/metrics"
import { PROVIDER_LABEL } from "@/lib/admin/types"
import { useFormat } from "@/hooks/use-format"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

/**
 * Contabilidad del mes por proveedor y modelo: importe, peso, unidades
 * facturadas y coste unitario en la unidad natural de cada uno (por minuto
 * de audio en transcripción, por proyecto en análisis).
 */
export function CostesModelos({ costes }: { costes: CostesBlock }) {
  const t = useTranslations("admin.costes.modelos")
  const f = useFormat()
  const guion = "—"

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-border">
        <Table>
          <caption className="sr-only">{t("caption")}</caption>
          <TableHeader>
            <TableRow>
              <TableHead>{t("providerModel")}</TableHead>
              <TableHead className="text-right">{t("cost")}</TableHead>
              <TableHead className="text-right">{t("share")}</TableHead>
              <TableHead className="text-right">{t("unit")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="tabular-nums">
            {costes.porProveedor.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                  {t("empty")}
                </TableCell>
              </TableRow>
            )}
            {costes.porProveedor.map((prov) => (
              <React.Fragment key={prov.provider}>
                <TableRow className="bg-muted/30">
                  <TableCell className="font-semibold">
                    {PROVIDER_LABEL[prov.provider]}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {f.money(prov.amount, { decimals: 2 })}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {f.percent(prov.pct, 0)}
                  </TableCell>
                  <TableCell />
                </TableRow>
                {costes.porModelo
                  .filter((m) => m.provider === prov.provider)
                  .map((m) => (
                    <TableRow key={`${m.provider}/${m.model}`}>
                      <TableCell className="pl-6">
                        <p>{m.model}</p>
                        <p className="text-xs text-muted-foreground">
                          {m.unitKind === "segundos"
                            ? t("audioMinutes", { n: f.number(Math.round(m.units / 60)) })
                            : t("tokens", { n: f.compact(m.units) })}{" "}
                          · {t("projects", { n: m.proyectos })}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        {f.money(m.amount, { decimals: 2 })}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {costes.total > 0
                          ? f.percent((m.amount / costes.total) * 100, 0)
                          : guion}
                      </TableCell>
                      <TableCell className="text-right">
                        {m.unitario === null
                          ? guion
                          : m.unitKind === "segundos"
                            ? t("perMinute", {
                                monto: f.money(m.unitario, { decimals: 4 }),
                              })
                            : t("perProject", {
                                monto: f.money(m.unitario, { decimals: 4 }),
                              })}
                      </TableCell>
                    </TableRow>
                  ))}
              </React.Fragment>
            ))}
          </TableBody>
          <TableFooter className="tabular-nums">
            <TableRow>
              <TableCell>
                <p>{t("total")}</p>
                <p className="text-xs font-normal text-muted-foreground">
                  {t("accumulated", {
                    monto: f.money(costes.acumulado, { decimals: 2 }),
                  })}
                </p>
              </TableCell>
              <TableCell className="text-right align-top">
                {f.money(costes.total, { decimals: 2 })}
              </TableCell>
              <TableCell className="text-right align-top">
                {costes.total > 0 ? f.percent(100, 0) : guion}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">{t("note")}</p>
    </div>
  )
}
