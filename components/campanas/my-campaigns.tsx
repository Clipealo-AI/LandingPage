"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Plus } from "lucide-react"

import { Link, hrefDinamico } from "@/i18n/navigation"
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
import { Progress } from "@/components/ui/progress"
import { EstadoBadge } from "@/components/campanas/campaign-bits"
import type { CampanaVista } from "@/components/campanas/campaigns-explorer"

/**
 * Las campañas de la agencia: estado, consumo y clips por revisar. Solo existe
 * para el perfil de agencia; los usuarios son cliperos y no crean campañas.
 */
export function MyCampaigns({ vistas }: { vistas: CampanaVista[] }) {
  const t = useTranslations("campaigns.myCampaigns")
  const f = useFormat()
  const { envios, cuenta } = useCampanas()
  const propias = vistas
    .filter((v) => v.campana.creadaPor.userId === cuenta.userId)
    .sort((a, b) => b.campana.creadaEn.localeCompare(a.campana.creadaEn))

  if (propias.length === 0) {
    return (
      <Empty className="rounded-xl ring-1 ring-border">
        <EmptyHeader>
          <EmptyTitle>{t("empty.title")}</EmptyTitle>
          <EmptyDescription>{t("empty.description")}</EmptyDescription>
        </EmptyHeader>
        <Button variant="outline" asChild>
          <Link href="/campanas/nueva">
            <Plus /> {t("empty.cta")}
          </Link>
        </Button>
      </Empty>
    )
  }

  return (
    <div className="grid gap-4 @3xl/campanas:grid-cols-2 @[100rem]/campanas:grid-cols-3">
      {propias.map(({ campana, liquidacion, estado }) => {
        const pendientes = envios.filter(
          (e) => e.campanaId === campana.id && e.estado === "en-revision"
        ).length
        return (
          <Card key={campana.id}>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <EstadoBadge estado={estado} />
                {campana.privada && (
                  <Badge variant="secondary">
                    {t("privateCode", { code: campana.codigo ?? "" })}
                  </Badge>
                )}
                {pendientes > 0 && (
                  <Badge variant="warning">{t("pending", { n: pendientes })}</Badge>
                )}
              </div>
              <CardTitle className="text-base">
                <Link
                  href={hrefDinamico("/campanas/[id]", { id: campana.id })}
                  className="hover:underline"
                >
                  {campana.titulo}
                </Link>
              </CardTitle>
              <CardDescription>
                {t("ends", { date: f.date(campana.fin) })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t("spentOf", {
                    spent: f.money(liquidacion.gastado),
                    budget: f.money(campana.presupuesto),
                  })}
                </span>
                <span className="tabular-nums">
                  {f.percent(Math.round(liquidacion.consumidoPct))}
                </span>
              </div>
              <Progress value={liquidacion.consumidoPct} aria-label={t("spentAria")} />
              <p className="text-xs text-muted-foreground">
                {t("rules", {
                  cpm: f.money(campana.cpm, { decimals: 2 }),
                  pct: f.percent(campana.topePorVideoPct),
                })}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
