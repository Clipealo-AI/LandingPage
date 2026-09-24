"use client"

import { ArrowRight, ShieldCheck } from "lucide-react"
import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import type { Campana } from "@/lib/campanas"
import { licenciaDe, pendientesDe } from "@/lib/derechos"
import { SOCIAL_NETWORKS } from "@/lib/social"
import { useCampanas } from "@/hooks/use-campanas"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

/**
 * Lo que la agencia concede con la campaña, en su ficha: alcance, lista
 * blanca, atribución y condiciones. Para quien la creó, además cuántas cuentas
 * piden el alta; el trámite se hace en Operaciones › Derechos.
 */
export function DerechosCard({
  campana,
  esDueno,
}: {
  campana: Campana
  esDueno: boolean
}) {
  const t = useTranslations("campaigns.licencia")
  const { solicitudesListaBlanca } = useCampanas()
  const licencia = licenciaDe(campana)
  const pendientes = esDueno ? pendientesDe(solicitudesListaBlanca, [campana]).length : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="size-4 text-primary" aria-hidden />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <dt className="text-muted-foreground">{t("alcance")}</dt>
          <dd>
            <span className="block">{t(`alcances.${licencia.alcance}`)}</span>
            <span className="block text-xs text-muted-foreground">
              {t(`alcanceHint.${licencia.alcance}`)}
            </span>
          </dd>
          <dt className="text-muted-foreground">{t("listaBlanca")}</dt>
          <dd>
            <Badge variant={licencia.listaBlanca ? "secondary" : "outline"}>
              {licencia.listaBlanca ? t("conListaBlanca") : t("sinListaBlanca")}
            </Badge>
          </dd>
          {licencia.atribucion && (
            <>
              <dt className="text-muted-foreground">{t("atribucion")}</dt>
              <dd>{licencia.atribucion}</dd>
            </>
          )}
          {licencia.notas && (
            <>
              <dt className="text-muted-foreground">{t("notas")}</dt>
              <dd className="text-pretty">{licencia.notas}</dd>
            </>
          )}
        </dl>
        <p className="text-xs text-muted-foreground">
          {campana.redes.map((r) => SOCIAL_NETWORKS[r].name).join(" · ")}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/operaciones/derechos">
              {t("verEnOperaciones")} <ArrowRight />
            </Link>
          </Button>
          {esDueno && pendientes > 0 && (
            <Badge variant="warning">{t("pendientes", { n: pendientes })}</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
