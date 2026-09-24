"use client"

import { ArrowRight } from "lucide-react"
import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { pasosDe, esRender, type PasoId } from "@/lib/onboarding"
import { useCuenta, useCuentaLista } from "@/hooks/use-cuenta"
import { useFormat } from "@/hooks/use-format"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

/**
 * Tarjeta de quien dejó la bienvenida a medias (§6.5): cuánto le falta, por qué
 * le conviene y el enlace a la toma donde lo dejó. Desaparece sola al
 * completar el onboarding.
 *
 * Va en el panel y TAMBIÉN donde aterriza «Más tarde» —campañas y subir—,
 * porque ahí es donde está la persona a la que rescata: el aviso le decía que
 * lo retomara desde su panel y la dejaba en otra pantalla, sin nada que se lo
 * recordara nunca más.
 *
 * Se pinta solo cuando el navegador ya leyó la cuenta (`useCuentaLista`): en el
 * servidor no existe, así que no hay parpadeo ni desajuste de hidratación.
 */
export function ProfileProgressCard({
  className,
  destacado = true,
}: {
  className?: string
  /** Naranja solo donde no haya otra: una acción `brand` por vista. */
  destacado?: boolean
}) {
  const lista = useCuentaLista()
  const { cuenta, completitud, precision } = useCuenta()
  const t = useTranslations("onboarding.micro.progreso")
  const tc = useTranslations("onboarding.chrome")
  const f = useFormat()

  const estado = cuenta.onboarding.estado
  if (!lista || estado === "completado") return null

  const pasos = pasosDe(
    cuenta.onboarding.flujo,
    cuenta.clipero.objetivo,
    cuenta.onboarding.modo,
    cuenta
  )
  const respondidos = new Set<PasoId>(cuenta.onboarding.pasosRespondidos)
  const pendientes = pasos.filter((p) => !esRender(p) && !respondidos.has(p))
  const empezado = estado !== "sin-empezar"
  // `pasoActual` primero: `pasoAbandono` es la foto del día que lo dejó y, si
  // ha vuelto y ha contestado tres tomas más, lo devolvía a una ya respondida
  const paso = cuenta.onboarding.pasoActual ?? cuenta.onboarding.pasoAbandono

  return (
    <Card className={className}>
      <CardContent className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="font-semibold">{t("title", { pct: f.percent(completitud) })}</p>
          <Progress
            value={completitud}
            aria-label={t("ring", { pct: f.percent(completitud) })}
            className="max-w-sm"
          />
          <p className="text-sm text-pretty text-muted-foreground">
            {t("description", { n: pendientes.length })}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("precision", { nivel: precision })}
            {pendientes.length > 0 && (
              <>
                {" · "}
                {t("pendientes")}: {f.list(pendientes.map((p) => tc(`pasos.${p}`)))}
              </>
            )}
          </p>
        </div>
        <Button variant={destacado ? "brand" : "outline"} size="lg" asChild>
          <Link
            href={
              paso && empezado
                ? { pathname: "/bienvenida", query: { paso } }
                : "/bienvenida"
            }
          >
            {empezado ? t("continue") : t("start")} <ArrowRight />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
