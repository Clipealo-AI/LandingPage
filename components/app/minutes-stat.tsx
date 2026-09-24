"use client"

import { Timer } from "lucide-react"
import { useTranslations } from "next-intl"

import { minutosUsados } from "@/lib/mock-data"
import { useFormat } from "@/hooks/use-format"
import { usePlan } from "@/hooks/use-plan"
import { StatCard } from "@/components/shared/stat-card"

/**
 * Los minutos del mes, en el panel. Es la única tarjeta del panel que vive en el
 * cliente: los minutos incluidos son del plan, y en la demo el plan solo se sabe
 * en el navegador. En producción vendría de la sesión y esto volvería a ser una
 * `StatCard` más del componente de servidor.
 */
export function MinutesStat() {
  const t = useTranslations("app.dashboard.stats")
  const f = useFormat()
  const { plan } = usePlan()
  return (
    <StatCard
      label={t("minutes")}
      value={minutosUsados(plan.minutos)}
      hint={t("minutesHint", { included: f.number(plan.minutos) })}
      icon={Timer}
    />
  )
}
