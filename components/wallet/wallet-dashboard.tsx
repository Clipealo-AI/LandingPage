"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { useTranslations } from "next-intl"
import { ArrowDownLeft, ArrowUpRight, Clock, Megaphone } from "lucide-react"

import { Link, hrefDinamico } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { HOY_CAMPANAS } from "@/lib/campanas"
import { RETIRO_MINIMO, resumenWallet, type Movimiento } from "@/lib/wallet"
import { useCampanas } from "@/hooks/use-campanas"
import { useFormat } from "@/hooks/use-format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Hueco } from "@/components/shared/hueco-grafica"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { WithdrawDialog } from "@/components/wallet/withdraw-dialog"

/** Lo ganado por mes, sin recharts en la primera carga. Debajo queda la tabla. */
const WalletMesesChart = dynamic(
  () => import("@/components/wallet/wallet-meses-chart").then((m) => m.WalletMesesChart),
  { ssr: false, loading: () => <Hueco className="h-56" /> }
)

const TONO_MOVIMIENTO: Record<
  Movimiento["estado"],
  React.ComponentProps<typeof Badge>["variant"]
> = {
  cobrado: "success",
  "en-revision": "warning",
  solicitado: "secondary",
  pagado: "outline",
  rechazado: "destructive",
}

/**
 * Wallet del clipero: lo que ganan sus clips en campañas y sus retiros. Todo
 * sale de las campañas (`lib/wallet.ts`), así que el saldo cuadra con lo que
 * enseña cada campaña en «Participando».
 */
export function WalletDashboard() {
  const t = useTranslations("campaigns.wallet")
  const tRetiro = useTranslations("campaigns.withdrawal")
  const f = useFormat()
  const { campanas, envios, retiros, cuenta } = useCampanas()
  const w = React.useMemo(
    () => resumenWallet(cuenta.userId, campanas, envios, retiros, new Date(HOY_CAMPANAS)),
    [cuenta.userId, campanas, envios, retiros]
  )
  const ultimoMes = w.porMes.at(-1)
  const datos = w.porMes.map((m) => ({
    ...m,
    etiqueta: f.monthShort(m.mes),
  }))
  const estadoTexto = (m: Movimiento) =>
    m.estado === "cobrado"
      ? t("movements.collected")
      : m.estado === "en-revision"
        ? t("movements.inReview")
        : tRetiro(`status.${m.estado}`)

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("description", { min: f.money(RETIRO_MINIMO) })}
        actions={<WithdrawDialog disponible={w.disponible} />}
      />

      <div className="grid grid-cols-2 gap-3 @4xl/wallet:grid-cols-4">
        <StatCard
          featured
          className="col-span-2 @4xl/wallet:col-span-1"
          label={t("available")}
          value={f.money(w.disponible, { decimals: 2 })}
          hint={
            w.enCurso > 0
              ? t("availableInProgress", { amount: f.money(w.enCurso, { decimals: 2 }) })
              : t("availableReady")
          }
        />
        <StatCard
          label={t("pending")}
          value={f.money(w.pendiente, { decimals: 2 })}
          icon={Clock}
          hint={t("pendingHint")}
        />
        <StatCard
          label={t("earned")}
          value={f.money(w.ganado, { decimals: 2 })}
          icon={ArrowDownLeft}
        />
        <StatCard
          label={t("withdrawn")}
          value={f.money(w.retirado, { decimals: 2 })}
          icon={ArrowUpRight}
        />
      </div>

      <div className="grid items-start gap-6 @5xl/wallet:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("monthly.title")}</CardTitle>
            <CardDescription>
              {ultimoMes && ultimoMes.ganado > 0
                ? t("monthly.last", {
                    amount: f.money(ultimoMes.ganado, { decimals: 2 }),
                    month: f.month(ultimoMes.mes),
                  })
                : t("monthly.empty")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <WalletMesesChart datos={datos} />
            <details className="text-sm">
              <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                {t("monthly.asTable")}
              </summary>
              <table className="mt-2 w-full text-xs">
                <caption className="sr-only">{t("monthly.title")}</caption>
                <tbody className="tabular-nums">
                  {datos.map((m) => (
                    <tr key={m.mes} className="border-t">
                      <th scope="row" className="py-1 text-left font-normal capitalize">
                        {f.month(m.mes)}
                      </th>
                      <td className="py-1 text-right">
                        {f.money(m.ganado, { decimals: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("movements.title")}</CardTitle>
            <CardDescription>{t("movements.description")}</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {w.movimientos.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>{t("empty.title")}</EmptyTitle>
                  <EmptyDescription>{t("empty.description")}</EmptyDescription>
                </EmptyHeader>
                <Button variant="outline" asChild>
                  <Link href="/campanas">
                    <Megaphone /> {t("empty.cta")}
                  </Link>
                </Button>
              </Empty>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("movements.concept")}</TableHead>
                    <TableHead className="max-sm:hidden">{t("movements.date")}</TableHead>
                    <TableHead>{t("movements.status")}</TableHead>
                    <TableHead className="text-right">{t("movements.amount")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {w.movimientos.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="max-w-96 min-w-52 whitespace-normal">
                        {m.tipo === "retiro" ? (
                          <span className="font-medium">
                            {t("movements.withdrawalTo", {
                              method: tRetiro(`method.${m.metodo}.name`),
                            })}
                          </span>
                        ) : (
                          <Link
                            href={hrefDinamico("/campanas/[id]", { id: m.campanaId })}
                            className="font-medium hover:underline"
                          >
                            {m.concepto}
                          </Link>
                        )}
                        <span className="block text-xs text-muted-foreground">
                          {m.detalle}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground max-sm:hidden">
                        {f.date(m.fecha)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={TONO_MOVIMIENTO[m.estado]}>
                          {estadoTexto(m)}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-semibold whitespace-nowrap tabular-nums",
                          (m.tipo === "pendiente" || m.estado === "rechazado") &&
                            "font-normal text-muted-foreground",
                          m.estado === "rechazado" && "line-through"
                        )}
                      >
                        {m.importe >= 0 ? "+" : "−"}
                        {f.money(Math.abs(m.importe), { decimals: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
