"use client"

import { CalendarClock } from "lucide-react"
import { useTranslations } from "next-intl"

import { PLAN_MINIMO } from "@/lib/pricing"
import { MuroPlan } from "@/components/planes/muro-plan"
import { useNombrePlan } from "@/components/planes/nombre-plan"

const VENTAJAS = ["plan", "lote", "aviso", "enlace"] as const

/**
 * Lo que ve un plan Prueba al entrar en el Calendario: la página entera, con su
 * puerta (decisión del director). Programar se vende «desde el plan Creador» en
 * /precios, así que dejar programar a todo el mundo haría mentir a la web.
 *
 * El nombre del plan sale de `PLAN_MINIMO.programar` y no escrito a mano: con
 * el catálogo editable del backoffice, «Creador» dentro del texto mentiría en
 * cuanto alguien moviera esa capacidad de escalón.
 *
 * La nota dice lo que Prueba SÍ tiene —publicar ahora en su cuenta conectada—,
 * porque un muro que solo dice que no sirve para decidir.
 */
export function MuroCalendario() {
  const t = useTranslations("calendario.muro")
  const nombrePlan = useNombrePlan()
  return (
    <MuroPlan
      icono={CalendarClock}
      titulo={t("titulo", { plan: nombrePlan(PLAN_MINIMO.programar) })}
      descripcion={t("descripcion")}
      ventajas={VENTAJAS.map((v) => t(`ventajas.${v}`))}
      nota={t("nota")}
    />
  )
}
