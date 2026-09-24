"use client"

import { useTranslations } from "next-intl"
import { ArrowRight, Building2, CalendarClock, Check, Clock } from "lucide-react"

import { Link } from "@/i18n/navigation"
import {
  estadoGate,
  pasoRetomarAgencia,
  tomasPendientesAgencia,
  type EstadoSolicitudAgencia,
} from "@/lib/agencia"
import { useCampanas } from "@/hooks/use-campanas"
import { useCuenta } from "@/hooks/use-cuenta"
import { useFormat } from "@/hooks/use-format"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { PageHeader } from "@/components/shared/page-header"

const VENTAJAS = ["create", "publish", "review", "account"] as const

/**
 * Lo que ve un usuario al intentar crear una campaña. Los usuarios son
 * cliperos: las campañas las crean las agencias. Si representa a una marca o a
 * un creador, pide el perfil de agencia y el equipo lo concede desde /admin.
 *
 * El botón mandaba la solicitud de un clic, sin datos: al backoffice le
 * llegaba una petición vacía y el equipo comercial tenía que decidir sobre
 * ella sin saber qué organización era, de qué sector ni con qué presupuesto.
 * Esa solicitud ya se recoge entera en la rama de agencia de la bienvenida
 * —cuatro tomas y un simulador—, así que la puerta lleva allí y `estadoGate`
 * dice con qué palabras: pedirlo, terminarlo, enviarlo o volver a intentarlo.
 */
export function AgencyGate() {
  const t = useTranslations("campaigns.agencyGate")
  const tTaxonomy = useTranslations("taxonomy")
  const f = useFormat()
  const { solicitudAgencia, entrevista, motivoRechazo } = useCampanas()
  const { cuenta } = useCuenta()

  // «entrevista» es un paso del backoffice, no un estado de la solicitud: para
  // las reglas es una solicitud pendiente, y tiene su propio aviso más abajo
  const solicitud: EstadoSolicitudAgencia =
    solicitudAgencia === "entrevista" ? "pendiente" : solicitudAgencia
  const estado = estadoGate(solicitud, cuenta)
  const pendientes = tomasPendientesAgencia(cuenta).length
  const paso = pasoRetomarAgencia(cuenta)
  const etiqueta =
    estado === "rechazada"
      ? t("requestAgain")
      : estado === "solicitar"
        ? t("request")
        : pendientes > 0
          ? t("finish", { n: pendientes })
          : t("send")

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />

      <Card className="max-w-2xl">
        <CardHeader>
          <span className="grid size-10 place-items-center rounded-lg bg-secondary text-secondary-foreground">
            <Building2 className="size-5" aria-hidden />
          </span>
          <CardTitle className="text-base">{t("cardTitle")}</CardTitle>
          <CardDescription>{t("cardDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {VENTAJAS.map((v) => (
              <li key={v} className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />{" "}
                {t(`benefits.${v}`)}
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter className="flex-wrap gap-3">
          {solicitudAgencia === "pendiente" ? (
            <p
              className="flex items-center gap-2 text-sm text-muted-foreground"
              role="status"
            >
              <Clock className="size-4" aria-hidden /> {t("pending")}
            </p>
          ) : solicitudAgencia === "entrevista" && entrevista ? (
            // El paso de en medio: la agencia ve cuándo y qué llevar
            <div className="space-y-1 text-sm" role="status">
              <p className="flex items-start gap-2">
                <CalendarClock className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>{t("interview", { fecha: f.date(entrevista.citadaEn) })}</span>
              </p>
              {entrevista.nota && (
                <p className="ps-6 text-muted-foreground">{entrevista.nota}</p>
              )}
            </div>
          ) : (
            <>
              {estado === "rechazada" && motivoRechazo && (
                <p
                  className="w-full text-sm text-pretty text-muted-foreground"
                  role="status"
                >
                  {t("rejectedReason", {
                    motivo: tTaxonomy(`motivosRechazo.${motivoRechazo}`),
                  })}
                </p>
              )}
              <Button asChild>
                <Link
                  href={{
                    pathname: "/bienvenida",
                    query: {
                      tipo: "agencia",
                      origen: estado === "solicitar" ? "gate" : "retomar",
                      paso,
                    },
                  }}
                >
                  {etiqueta} <ArrowRight />
                </Link>
              </Button>
            </>
          )}
          <Button variant="ghost" asChild>
            <Link href="/campanas">{t("browse")}</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
