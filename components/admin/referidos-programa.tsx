import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import type { ReferralStats } from "@/lib/admin/metrics"
import { useFormat } from "@/hooks/use-format"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

/** Por debajo de este % del MAU el prompt de invitación no se ve. */
const TASA_INVITACION_MINIMA_PCT = 5

/**
 * Salud del programa en cuatro cifras y un embudo: cuánta gente invita
 * (sobre el MAU), qué parte de las altas llega por invitación, lo que ya se
 * ha regalado y lo que falta por otorgar. El embudo es acumulado: quien ha
 * pagado también activó.
 */
export function ReferidosPrograma({
  referidos,
  mau,
}: {
  referidos: ReferralStats
  mau: number
}) {
  const t = useTranslations("admin.referidos.program")
  const f = useFormat()
  const pct = (v: number | null, decimals = 0) =>
    v === null ? "—" : f.percent(v, decimals)
  const invitados = referidos.registrados + referidos.activados + referidos.convertidos
  const activados = referidos.activados + referidos.convertidos
  const pendientes = referidos.recompensasPendientes.length
  const tasaBaja =
    referidos.tasaInvitacionPct !== null &&
    referidos.tasaInvitacionPct < TASA_INVITACION_MINIMA_PCT

  const pasos = [
    {
      id: "registrados",
      etiqueta: t("steps.registered"),
      n: invitados,
      nota: t("steps.registeredNote", { n: referidos.atascados }),
    },
    {
      id: "activados",
      etiqueta: t("steps.activated"),
      n: activados,
      nota: t("steps.activatedNote"),
    },
    {
      id: "convertidos",
      etiqueta: t("steps.converted"),
      n: referidos.convertidos,
      nota: t("steps.convertedNote"),
    },
  ]

  return (
    <div className="space-y-4">
      <dl className="grid gap-3 sm:grid-cols-2">
        <Cifra
          label={t("inviteRate")}
          value={pct(referidos.tasaInvitacionPct, 1)}
          detail={t("inviteRateDetail", {
            n: referidos.invitadores90d,
            mau: f.number(mau),
          })}
          aviso={tasaBaja}
        />
        <Cifra
          label={t("share")}
          value={pct(referidos.aportePct, 1)}
          detail={t("shareDetail", { n: referidos.total90d })}
        />
        <Cifra
          label={t("granted")}
          value={f.money(referidos.valorOtorgado)}
          detail={t("grantedDetail", { minutos: f.number(referidos.minutosOtorgados) })}
        />
        <Cifra
          label={t("toGrant")}
          value={f.money(referidos.valorPendiente)}
          detail={
            pendientes === 0
              ? t("nothingPending")
              : t("toGrantDetail", {
                  minutos: f.number(referidos.minutosPendientes),
                  n: pendientes,
                })
          }
          aviso={pendientes > 0}
        />
      </dl>

      <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-border">
        <Table className="text-xs sm:text-sm">
          <caption className="sr-only">{t("caption")}</caption>
          <TableHeader>
            <TableRow>
              <TableHead>{t("funnel")}</TableHead>
              <TableHead className="text-right">{t("n")}</TableHead>
              <TableHead className="text-right">{t("ofInvitees")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="tabular-nums">
            {pasos.map((paso) => (
              <TableRow key={paso.id}>
                <TableCell className="whitespace-normal">
                  <span className="font-medium">{paso.etiqueta}</span>
                  <span className="block text-xs text-muted-foreground">{paso.nota}</span>
                </TableCell>
                <TableCell className="text-right font-medium">{paso.n}</TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {invitados > 0 ? f.percent((paso.n / invitados) * 100, 0) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        {tasaBaja
          ? t("lowRate", { pct: f.percent(TASA_INVITACION_MINIMA_PCT, 0) })
          : t("okRate", { pct: f.percent(TASA_INVITACION_MINIMA_PCT, 0) })}
      </p>
    </div>
  )
}

function Cifra({
  label,
  value,
  detail,
  aviso = false,
}: {
  label: string
  value: string
  detail: string
  aviso?: boolean
}) {
  return (
    <div
      className={cn(
        "rounded-xl bg-card p-3 ring-1",
        aviso ? "ring-warning/50" : "ring-border"
      )}
    >
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 space-y-0.5">
        <span className="block text-xl font-bold tracking-tight tabular-nums">
          {value}
        </span>
        <span className="block text-xs text-muted-foreground tabular-nums">{detail}</span>
      </dd>
    </div>
  )
}
