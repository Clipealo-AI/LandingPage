import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import type { SubscriptionRow } from "@/lib/admin/rows"
import type { SubscriptionStatus } from "@/lib/admin/types"
import { conMes } from "@/lib/admin/enlaces"
import { useFormat } from "@/hooks/use-format"
import { PlanBadge } from "@/components/admin/plan-badge"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const ESTADO_VARIANT: Record<
  SubscriptionStatus,
  "success" | "warning" | "destructive" | "outline"
> = {
  activa: "success",
  "pendiente-pago": "warning",
  vencida: "destructive",
  cancelada: "outline",
}

/** Cliente de pago: activa (o en gracia), plan ≠ Interno, importe > 0. La misma regla que el MRR. */
export function esClienteDePago(s: SubscriptionRow) {
  return s.activa && s.plan !== "interno" && s.amount > 0
}

function porQueNo(s: SubscriptionRow) {
  if (s.plan === "interno") return "cortesia"
  if (s.amount <= 0) return "importeCero"
  if (s.status === "cancelada") return "cancelada"
  return "fueraDeGracia"
}

/**
 * Lista nominal detrás del MRR: con siete clientes cada cifra tiene nombre.
 * Vigentes primero (ya vienen así), y en cada fila se dice si cuenta como
 * cliente de pago y, si no, por qué.
 */
export function PlanesSuscripciones({
  rows,
  hoy,
  mes,
}: {
  rows: SubscriptionRow[]
  hoy: Date
  /** El mes elegido en el backoffice, para que los enlaces no lo pierdan. */
  mes?: string | null
}) {
  const t = useTranslations("admin.planes.subscriptions")
  const tLabels = useTranslations("admin.labels")
  const f = useFormat()
  return (
    <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-border">
      <Table className="text-xs sm:text-sm">
        <caption className="sr-only">{t("caption")}</caption>
        <TableHeader>
          <TableRow>
            <TableHead>{t("user")}</TableHead>
            <TableHead>{t("plan")}</TableHead>
            <TableHead>{t("cycle")}</TableHead>
            <TableHead className="text-right">{t("amount")}</TableHead>
            <TableHead className="text-right">{t("monthly")}</TableHead>
            <TableHead>{t("status")}</TableHead>
            <TableHead>{t("paying")}</TableHead>
            <TableHead className="max-lg:hidden">{t("method")}</TableHead>
            <TableHead className="max-md:hidden">{t("start")}</TableHead>
            <TableHead>{t("renewal")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="tabular-nums">
          {rows.map((s) => {
            const paga = esClienteDePago(s)
            const enGracia = s.activa && s.status !== "activa"
            return (
              <TableRow key={s.id} className={cn(!s.activa && "text-muted-foreground")}>
                <TableCell className="max-w-56">
                  <Link
                    href={conMes(
                      `/admin/usuarios?q=${encodeURIComponent(s.userName)}`,
                      mes
                    )}
                    className={cn(
                      "block truncate font-medium underline-offset-4 hover:text-primary hover:underline",
                      !s.activa && "text-foreground"
                    )}
                  >
                    {s.userName}
                  </Link>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {s.userEmail}
                  </span>
                </TableCell>
                <TableCell>
                  <PlanBadge plan={s.plan} />
                </TableCell>
                <TableCell>{tLabels(`billing.${s.billing}`)}</TableCell>
                <TableCell className="text-right">{f.money(s.amount)}</TableCell>
                <TableCell className="text-right">
                  <span className={cn(paga && "font-medium")}>{f.money(s.mrr)}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {t("perMonth")}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="flex flex-wrap items-center gap-1">
                    <Badge variant={ESTADO_VARIANT[s.status]}>
                      {tLabels(`subscriptionStatus.${s.status}`)}
                    </Badge>
                    {enGracia && (
                      <Badge variant="outline" className="h-4 px-1 text-[10px]">
                        {t("inGrace")}
                      </Badge>
                    )}
                  </span>
                </TableCell>
                <TableCell>
                  {paga ? (
                    <span className="font-medium text-success">{t("yes")}</span>
                  ) : (
                    <span className="text-muted-foreground">
                      {t("no")}{" "}
                      <span className="text-[11px]">· {t(`why.${porQueNo(s)}`)}</span>
                    </span>
                  )}
                </TableCell>
                <TableCell className="max-lg:hidden">
                  {tLabels(`paymentMethod.${s.paymentMethod}`)}
                </TableCell>
                <TableCell className="whitespace-nowrap max-md:hidden">
                  {f.date(s.startedAt)}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {f.date(s.renewsAt)}
                  <span className="block text-[11px] text-muted-foreground">
                    {s.status === "cancelada" && s.canceledAt
                      ? t("canceled", { cuando: f.relative(s.canceledAt, hoy) })
                      : f.relative(s.renewsAt, hoy)}
                  </span>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
