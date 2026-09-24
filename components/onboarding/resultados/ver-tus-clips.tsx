"use client"

import { useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"

import { hrefDinamico, Link } from "@/i18n/navigation"
import { jobKeys, listJobs } from "@/lib/api/jobs"
import { Button } from "@/components/ui/button"

/**
 * «Ver tus clips»: el final del onboarding, cuando ya hay clips de verdad.
 *
 * La bienvenida se llama «Tu primer corte» y terminaba sin enseñar ni uno:
 * en todo el onboarding no había un solo enlace a un proyecto ni a un clip.
 * A quien no tiene nada, lo que le toca es subir su primer video, y eso ya
 * está; pero a quien vuelve a pasar por aquí con doce clips hechos se le
 * seguía ofreciendo «subir el primero». Con proyectos listos, esto lleva al
 * último, que es donde están sus cortes.
 *
 * Sin proyectos no se pinta: no hay adónde llevar.
 */
export function VerTusClips() {
  const t = useTranslations("onboarding.resultado.acciones")
  const { data } = useQuery({ queryKey: jobKeys.list(), queryFn: listJobs })
  // Solo los que ya tienen clips: uno en cola lleva a una página en obras
  const ultimo = data?.find((p) => p.status === "listo")
  if (!ultimo) return null

  return (
    <Button variant="outline" size="xl" asChild>
      <Link href={hrefDinamico("/proyectos/[id]", { id: ultimo.id })}>{t("clips")}</Link>
    </Button>
  )
}
