import * as React from "react"
import { useTranslations } from "next-intl"

import type { Locale } from "@/i18n/routing"
import type {
  CanalResuelto,
  MotivoBaja,
  MotivoCola,
  MotivoVencimiento,
} from "@/lib/admin/metrics"
import type { PlanId } from "@/lib/admin/types"
import { SOCIAL_NETWORKS } from "@/lib/social"

/**
 * Traductores de los códigos que devuelven `lib/admin/metrics.ts` y
 * `lib/admin/rows.ts`. Las métricas no escriben frases: aquí se convierten en
 * texto del idioma activo. Sirven en componentes cliente y de servidor
 * síncronos; las funciones que devuelven son estables entre renders.
 */

/** Configuración regional de `Intl` de cada idioma, la misma que `lib/format.ts`. */
export const INTL_TAG: Record<Locale, string> = { es: "es-ES", en: "en-US", pt: "pt-BR" }

/** Nombre del plan: los tres de la web salen del catálogo de precios; Interno es solo del backoffice. */
export function usePlanName() {
  const tPricing = useTranslations("pricing.plans")
  const t = useTranslations("admin.plans")
  return React.useCallback(
    (plan: PlanId) => (plan === "interno" ? t("interno.name") : tPricing(`${plan}.name`)),
    [t, tPricing]
  )
}

/** «Afiliado · NEBULA», «Invitado por Lucía Peña» u «Orgánico». */
export function useCanalResuelto() {
  const t = useTranslations("admin.metrics.resolvedChannel")
  const tLabels = useTranslations("admin.labels.channel")
  return React.useCallback(
    (c: CanalResuelto) => {
      switch (c.code) {
        case "afiliado":
          return t("afiliado", c.values)
        case "invitadoPor":
          return t("invitadoPor", c.values)
        case "canal":
          return tLabels(c.values.canal)
      }
    },
    [t, tLabels]
  )
}

/** Motivo de una baja: voluntaria, cobro fallido o el que devolvió la pasarela. */
export function useMotivoBaja() {
  const t = useTranslations("admin.labels")
  return React.useCallback(
    (m: MotivoBaja) =>
      m === "voluntaria" || m === "cobro-fallido"
        ? t(`churnReason.${m}`)
        : t(`failureReason.${m}`),
    [t]
  )
}

/** Motivo de una fila de cola (vencimientos, pipeline, programas, coste). */
export function useMotivoCola() {
  const t = useTranslations("admin.metrics")
  const tLabels = useTranslations("admin.labels")
  return React.useCallback(
    (m: MotivoCola | MotivoVencimiento): string => {
      switch (m.code) {
        case "transferenciaSinVerificar":
          return t("reason.transferenciaSinVerificar", m.values)
        case "cobroRechazado":
          return t("reason.cobroRechazado", {
            razon: m.values.razon
              ? tLabels(`failureReason.${m.values.razon}`)
              : t("reason.cobroRechazadoSinRazon"),
            intentos: m.values.intentos,
          })
        case "vencidaSinRenovar":
          return t("reason.vencidaSinRenovar", m.values)
        case "renuevaPronto": {
          const { senales, primeraRenovacion, cobroManual } = m.values
          const base = senales.length
            ? senales.map((s) => t(`signal.${s}`)).join(" · ")
            : primeraRenovacion
              ? t("reason.primeraRenovacion")
              : t("reason.renuevaSemana")
          return cobroManual
            ? t("reason.cobroManual", { base, metodo: cobroManual })
            : base
        }
        case "sinProyectosCiclo":
          return t("reason.sinProyectosCiclo")
        case "sinActividad14d":
          return t("reason.sinActividad14d")
        case "proyectoError":
          return t("reason.proyectoError", m.values)
        case "proyectoAtascado":
          return t("reason.proyectoAtascado", m.values)
        case "recompensaPendiente":
          return t("reason.recompensaPendiente", m.values)
        case "comisionPendiente":
          return t("reason.comisionPendiente", m.values)
        case "costeAnomalo":
          return t("reason.costeAnomalo", {
            anomalia: t(`anomaly.metric.${m.values.anomalia}`),
            minutos: m.values.minutos,
          })
        // La red es una marca y no se traduce; el motivo sí, y es el mismo
        // código que guarda la agenda
        case "publicacionFallida":
          return t("reason.publicacionFallida", {
            plataforma: SOCIAL_NETWORKS[m.values.plataforma].name,
            motivo: t(`publishFailure.${m.values.motivo}`),
            intentos: m.values.intentos,
          })
        case "cuentaCaducada":
          return t("reason.cuentaCaducada", {
            plataforma: SOCIAL_NETWORKS[m.values.plataforma].name,
            dias: m.values.dias,
          })
      }
    },
    [t, tLabels]
  )
}
