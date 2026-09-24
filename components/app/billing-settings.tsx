"use client"

import * as React from "react"
import { CreditCard, Download } from "lucide-react"
import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { toast } from "@/lib/toast"
import { DESCUENTO_ANUAL_PCT } from "@/lib/pricing"
import { clipsDelMes, minutosUsados, usage } from "@/lib/mock-data"
import { facturasDemo, suscripcionDemo } from "@/lib/ajustes"
import { useFormat } from "@/hooks/use-format"
import { usePlan } from "@/hooks/use-plan"
import { useNombrePlan } from "@/components/planes/nombre-plan"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

/** Por encima de este consumo se avisa: es el mismo umbral que el aviso por correo. */
const AVISO_CONSUMO_PCT = 80

/**
 * Plan, consumo del mes, método de pago y facturas. Sin pasarela conectada:
 * las acciones dicen lo que harían. El plan sale del catálogo de la web, así
 * que el precio que se ve aquí es el mismo que el de /precios.
 */
export function BillingSettings() {
  const t = useTranslations("settings.billing")
  const tPricing = useTranslations("pricing")
  const f = useFormat()
  const { plan } = usePlan()
  const nombreDe = useNombrePlan()
  const nombrePlan = nombreDe(plan)
  const nombrePrueba = tPricing("plans.free.name")
  const [ciclo, setCiclo] = React.useState(suscripcionDemo.ciclo)
  const [cancelada, setCancelada] = React.useState(false)
  const renovacion = f.date(usage.renewsAt)
  const precioMes = ciclo === "anual" ? plan.yearly : plan.monthly
  // Con el plan gratuito no hay nada que renovar, que pasar a anual, que
  // cancelar ni tarjeta que enseñar: dejarlo todo puesto decía cosas imposibles
  // («pagarías US$ 0 al mes», «Visa terminada en 4242» en una cuenta sin cobro)
  const dePago = plan.monthly > 0
  const usados = minutosUsados(plan.minutos)
  const incluidos = plan.minutos
  const consumoPct = Math.round((usados / incluidos) * 100)

  return (
    <div className="space-y-4">
      {/* Plan y consumo lado a lado con el método de pago debajo; con sitio, los tres en fila */}
      <div className="grid gap-4 @3xl/ajustes:grid-cols-2 @7xl/ajustes:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>{t("plan.eyebrow")}</CardDescription>
            <CardTitle className="flex flex-wrap items-center gap-2 text-2xl">
              {nombrePlan}
              {!dePago ? (
                <Badge variant="secondary">{t("plan.freeBadge")}</Badge>
              ) : cancelada ? (
                <Badge variant="warning">
                  {t("plan.cancelsOn", { date: renovacion })}
                </Badge>
              ) : (
                <Badge variant="success">{t("plan.active")}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <p>
              <span className="text-lg font-semibold tabular-nums">
                {f.money(precioMes)}
              </span>
              <span className="text-muted-foreground">
                {" "}
                {t("plan.perMonth", { cycle: ciclo })}
              </span>
            </p>
            <p className="text-muted-foreground">
              {!dePago
                ? t("plan.freeNote")
                : cancelada
                  ? t("plan.keepsUntil", {
                      plan: nombrePlan,
                      date: renovacion,
                      trial: nombrePrueba,
                    })
                  : t("plan.renews", {
                      date: renovacion,
                      since: f.date(suscripcionDemo.desde),
                    })}
            </p>
            {dePago && ciclo === "mensual" && !cancelada && (
              <p className="text-muted-foreground">
                {t("plan.yearlyOffer", {
                  price: f.money(plan.yearly),
                  discount: f.percent(DESCUENTO_ANUAL_PCT),
                })}
              </p>
            )}
            {/* Solo se enuncia el precio: la demo no cuenta miembros */}
            {dePago && plan.asiento > 0 && (
              <p className="text-muted-foreground">
                {t("plan.seatNote", { price: f.money(plan.asiento) })}
              </p>
            )}
          </CardContent>
          <CardFooter className="flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/precios">{t("plan.change")}</Link>
            </Button>
            {dePago && ciclo === "mensual" && !cancelada && (
              <Button
                variant="outline"
                onClick={() => {
                  setCiclo("anual")
                  toast.success(t("plan.yearlyToast.title"), {
                    description: t("plan.yearlyToast.description", {
                      date: renovacion,
                      price: f.money(plan.yearly * 12),
                    }),
                  })
                }}
              >
                {t("plan.switchYearly")}
              </Button>
            )}
            {!dePago ? null : cancelada ? (
              <Button
                variant="ghost"
                onClick={() => {
                  setCancelada(false)
                  toast.success(t("plan.reactivatedToast.title"), {
                    description: t("plan.reactivatedToast.description", {
                      plan: nombrePlan,
                      date: renovacion,
                    }),
                  })
                }}
              >
                {t("plan.keep", { plan: nombrePlan })}
              </Button>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" className="text-muted-foreground">
                    {t("plan.cancel")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t("plan.cancelDialog.title", { plan: nombrePlan })}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("plan.cancelDialog.description", {
                        date: renovacion,
                        trial: nombrePrueba,
                      })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      {t("plan.keep", { plan: nombrePlan })}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={() => {
                        setCancelada(true)
                        toast(t("plan.cancelledToast.title"), {
                          description: t("plan.cancelledToast.description", {
                            plan: nombrePlan,
                            date: renovacion,
                          }),
                          sound: "remove",
                        })
                      }}
                    >
                      {t("plan.cancel")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>{t("usage.eyebrow")}</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {f.number(usados)}{" "}
              <span className="text-base font-normal text-muted-foreground">
                {t("usage.of", { total: f.number(incluidos) })}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Progress
              value={consumoPct}
              aria-label={t("usage.progressLabel", { percent: f.percent(consumoPct) })}
              className={
                consumoPct >= AVISO_CONSUMO_PCT
                  ? "[&>[data-slot=progress-indicator]]:bg-warning"
                  : undefined
              }
            />
            <p className="text-muted-foreground">
              {t("usage.summary", {
                percent: f.percent(consumoPct),
                available: f.number(incluidos - usados),
                date: renovacion,
                clips: clipsDelMes(plan),
              })}
            </p>
            <p className="text-muted-foreground">{t("usage.note")}</p>
          </CardContent>
        </Card>

        {dePago && (
          <Card className="@3xl/ajustes:col-span-2 @7xl/ajustes:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">{t("payment.title")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between @7xl/ajustes:flex-col @7xl/ajustes:items-start">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-lg bg-secondary text-secondary-foreground">
                  <CreditCard className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-medium">
                    {t("payment.card", {
                      brand: suscripcionDemo.metodo.marca,
                      last4: suscripcionDemo.metodo.ultimos4,
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("payment.expires", { date: suscripcionDemo.metodo.caduca })}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() =>
                  toast(t("payment.gatewayToast.title"), {
                    description: t("payment.gatewayToast.description"),
                  })
                }
              >
                {t("payment.change")}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("invoices.title")}</CardTitle>
          <CardDescription>{t("invoices.description")}</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("invoices.columns.date")}</TableHead>
                <TableHead>{t("invoices.columns.concept")}</TableHead>
                <TableHead className="max-sm:hidden">
                  {t("invoices.columns.number")}
                </TableHead>
                <TableHead className="text-right">
                  {t("invoices.columns.amount")}
                </TableHead>
                <TableHead>{t("invoices.columns.status")}</TableHead>
                <TableHead>
                  <span className="sr-only">{t("invoices.columns.download")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facturasDemo.map((factura) => (
                <TableRow key={factura.id}>
                  <TableCell className="whitespace-nowrap">
                    {f.date(factura.fecha)}
                  </TableCell>
                  <TableCell>
                    {t("invoices.concept", {
                      plan: tPricing(`plans.${factura.plan}.name`),
                      cycle: factura.ciclo,
                    })}
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums max-sm:hidden">
                    {factura.id}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {f.money(factura.importe)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={factura.estado === "pagada" ? "success" : "outline"}>
                      {t(`invoices.status.${factura.estado}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t("invoices.downloadLabel", { id: factura.id })}
                      onClick={() =>
                        toast(t("invoices.downloadToast.title", { id: factura.id }), {
                          description: t("invoices.downloadToast.description"),
                        })
                      }
                    >
                      <Download />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
