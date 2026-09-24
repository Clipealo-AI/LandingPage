"use client"

import {
  ArrowRight,
  Copy,
  Layers,
  Lock,
  Minimize2,
  Scissors,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import {
  HERRAMIENTAS,
  HERRAMIENTA_CAPACIDAD,
  puedeUsarHerramienta,
  type HerramientaId,
} from "@/lib/operaciones"
import { PLAN_MINIMO } from "@/lib/pricing"
import { usePlan } from "@/hooks/use-plan"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useNombrePlan } from "@/components/planes/nombre-plan"

const ICONO: Record<HerramientaId, LucideIcon> = {
  recortar: Scissors,
  reducir: Minimize2,
  variantes: Layers,
  publicacion: Copy,
  derechos: ShieldCheck,
}

/** Cada herramienta es su página. */
export const RUTA_HERRAMIENTA = {
  recortar: "/operaciones/recortar",
  reducir: "/operaciones/reducir",
  variantes: "/operaciones/variantes",
  publicacion: "/operaciones/publicacion",
  derechos: "/operaciones/derechos",
} as const satisfies Record<HerramientaId, string>

/**
 * El centro de Operaciones: una tarjeta por herramienta, con su plan escrito.
 * Una herramienta de un plan superior se ve entera y se abre igual —dentro, el
 * botón de encargar está apagado con su motivo—: nunca se esconde lo que se
 * vende.
 */
export function OperacionesHub() {
  const t = useTranslations("app.operaciones")
  const { plan } = usePlan()
  const nombrePlan = useNombrePlan()

  return (
    <ul className="grid gap-4 @2xl/operaciones:grid-cols-2 @5xl/operaciones:grid-cols-3">
      {HERRAMIENTAS.map((id) => {
        const Icono = ICONO[id]
        const capacidad = HERRAMIENTA_CAPACIDAD[id]
        const puede = puedeUsarHerramienta(plan, id)
        return (
          <li
            key={id}
            className={cn(
              "flex flex-col gap-3 rounded-xl bg-card p-5 ring-1 ring-border transition-shadow hover:shadow-sm",
              !puede && "bg-muted/30"
            )}
            data-herramienta={id}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icono className="size-5" aria-hidden />
              </span>
              {capacidad ? (
                <Badge variant={puede ? "secondary" : "outline"} className="gap-1">
                  {!puede && <Lock className="size-3" aria-hidden />}
                  {t("delPlan", { plan: nombrePlan(PLAN_MINIMO[capacidad]) })}
                </Badge>
              ) : (
                <Badge variant="outline">{t("paraTodos")}</Badge>
              )}
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-semibold">
                {t(`herramientas.${id}.nombre`)}
              </h2>
              <p className="text-sm text-pretty text-muted-foreground">
                {t(`herramientas.${id}.descripcion`)}
              </p>
            </div>
            <Button variant="outline" size="sm" className="mt-auto w-fit" asChild>
              <Link href={RUTA_HERRAMIENTA[id]}>
                {t("abrir")} <ArrowRight />
              </Link>
            </Button>
          </li>
        )
      })}
    </ul>
  )
}
