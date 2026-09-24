"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { campanaDeNext } from "@/lib/invitacion"
import { Button } from "@/components/ui/button"
import { useFlujo } from "@/components/onboarding/contexto"

export { campanaDeNext }

/** Lo que se espera antes de devolverle a su campaña: da tiempo a leer la línea. */
const ESPERA_MS = 1400

/**
 * Render corto del modo exprés por invitación (§2.7): «Listo. Te llevamos a
 * «{campaña}».» y vuelta a `next`.
 *
 * Guarda la vertical de la campaña como `inferido` (nunca se le preguntó: el
 * resto de preguntas entran en el perfilado progresivo) y vuelve solo a la
 * campaña. El botón sigue ahí para quien no quiera esperar.
 */
export function ResultExpres() {
  const ctx = useFlujo()
  const t = useTranslations("onboarding.resultado")
  const id = campanaDeNext(ctx.next)
  const campana = ctx.campanas.find((x) => x.campana.id === id)?.campana

  const alMontar = React.useEffectEvent(() => {
    ctx.terminar()
    // La vertical de la campaña a la que le invitaron vale como señal
    const v = campana?.vertical
    if (v && !ctx.cuenta.clipero.verticales)
      ctx.responder("clipero.verticales", [v], "inferido")
  })
  // A la campaña solo si existe: con un enlace inventado, `next` llevaba a una
  // ficha que no está y el invitado terminaba en un 404
  const volver = React.useEffectEvent(() =>
    ctx.salir(campana && ctx.next ? ctx.next : "/campanas")
  )

  React.useEffect(() => {
    alMontar()
    const id = window.setTimeout(volver, ESPERA_MS)
    return () => window.clearTimeout(id)
  }, [])

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-start gap-8">
      <h1
        id="toma-titulo"
        tabIndex={-1}
        className="scroll-mt-28 text-[clamp(1.75rem,1rem+1.6cqi,2.75rem)] leading-tight font-bold tracking-tight text-balance outline-none @5xl/bienvenida:scroll-mt-10"
      >
        {campana
          ? t("expres.title", { campana: campana.titulo })
          : t("expres.titleSinCampana")}
      </h1>
      <Button variant="brand" size="xl" asChild>
        <Link href={campana && ctx.next ? ctx.next : "/campanas"}>
          {t("acciones.continuar")}
        </Link>
      </Button>
    </div>
  )
}
