"use client"

import { Check } from "lucide-react"
import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import { formatDuration } from "@/lib/format"
import { planesVisibles, redesDe } from "@/lib/planes"
import { socialList } from "@/lib/social"
import { useCatalogoPlanes } from "@/hooks/use-catalogo-planes"
import { useNombrePlan } from "@/components/planes/nombre-plan"
import { SocialBadge } from "@/components/brand/social"
import { Badge } from "@/components/ui/badge"

/**
 * Qué red admite cada plan y qué le pide cada red a un clip. La segunda
 * parte importa más que la primera: el producto adapta formato y duración
 * a cada destino, y aquí se ve con qué números.
 */
export function PricingNetworks() {
  const t = useTranslations("marketing.pricingNetworks")
  const tc = useTranslations("common")
  const nombrePlan = useNombrePlan()
  const planes = planesVisibles(useCatalogoPlanes())

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {socialList.map((red) => {
        // El primero (el más barato) que la admite; las redes son las de su escalón
        const desde = planes.find((p) => redesDe(p).includes(red.id))
        const enTodos = desde !== undefined && desde.id === planes[0]?.id
        return (
          <article
            key={red.id}
            className="flex flex-col gap-4 rounded-frame bg-card p-5 ring-1 ring-border"
          >
            <header className="flex items-center gap-3">
              <SocialBadge network={red.id} size="md" tone="marca" />
              <div className="min-w-0">
                <h3 className="font-bold tracking-tight">{red.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {tc(`social.surface.${red.id}`)}
                </p>
              </div>
              {desde && (
                <Badge
                  variant={enTodos ? "secondary" : "brand-subtle"}
                  className="ml-auto whitespace-nowrap"
                >
                  {enTodos ? t("allPlans") : t("fromPlan", { plan: nombrePlan(desde) })}
                </Badge>
              )}
            </header>

            <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
              <dt className="text-xs text-muted-foreground">{t("formats")}</dt>
              <dd className="tabular-nums">{red.aspects.join(" · ")}</dd>
              <dt className="text-xs text-muted-foreground">{t("maxDuration")}</dt>
              <dd className="tabular-nums">{formatDuration(red.maxSeconds)}</dd>
              <dt className="text-xs text-muted-foreground">{t("bestRetention")}</dt>
              <dd className="tabular-nums">
                {formatDuration(red.sweetSpot[0])} – {formatDuration(red.sweetSpot[1])}
              </dd>
            </dl>

            <ul className="mt-auto space-y-1.5 text-xs">
              {planes.map((plan) => {
                const incluido = redesDe(plan).includes(red.id)
                return (
                  <li
                    key={plan.id}
                    className={cn(
                      "flex items-center gap-2",
                      !incluido && "text-muted-foreground/60"
                    )}
                  >
                    <Check
                      className={cn("size-3.5", incluido ? "text-primary" : "opacity-30")}
                      aria-hidden
                    />
                    <span className={cn(!incluido && "line-through")}>
                      {nombrePlan(plan)}
                    </span>
                    <span className="sr-only">
                      {incluido ? t("included") : t("notIncluded")}
                    </span>
                  </li>
                )
              })}
            </ul>
          </article>
        )
      })}
    </div>
  )
}
