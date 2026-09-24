import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"

import { hrefDinamico } from "@/i18n/navigation"
import { clips, sourceVideos } from "@/lib/mock-data"
import { AppTopbar } from "@/components/app/app-topbar"
import { Studio } from "@/components/app/studio"
import { StudioSkeleton } from "@/components/shared/panel-skeleton"
import { idiomaDe } from "@/i18n/server"
import { IntlExtra } from "@/i18n/zone"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/studio/[id]">): Promise<Metadata> {
  const locale = await idiomaDe(params)
  const { id } = await params
  const video = sourceVideos.find((v) => v.id === id)
  if (video) return { title: video.title }
  const t = await getTranslations({ locale, namespace: "app.studio" })
  return { title: t("metaTitle") }
}

/**
 * Prerrenderiza los proyectos conocidos; el resto se resuelve bajo demanda.
 *
 * Nota: `loading.tsx` abre un boundary de Suspense en este segmento, así que la
 * cabecera sale antes de resolver y un id inexistente responde 200 con la
 * pantalla de «no encontrado» en el cuerpo. Se acepta a propósito: el esqueleto
 * inmediato vale más en un editor pesado que el código de estado en una ruta
 * privada que además está excluida en `robots.ts`. En `/legal/[slug]`, que sí es
 * pública, no hay `loading.tsx` y el 404 es real.
 */
export function generateStaticParams() {
  return sourceVideos.map((video) => ({ id: video.id }))
}

export default async function StudioPage({ params }: PageProps<"/[locale]/studio/[id]">) {
  const locale = await idiomaDe(params)
  const { id } = await params
  const video = sourceVideos.find((v) => v.id === id)
  if (!video) notFound()

  const t = await getTranslations({ locale, namespace: "app" })
  const projectClips = clips.filter((clip) => clip.sourceId === video.id)

  return (
    <IntlExtra ns={["calendario"]}>
      <AppTopbar
        crumbs={[
          { label: t("nav.projects"), href: "/proyectos" },
          {
            label: video.title,
            href: hrefDinamico("/proyectos/[id]", { id: video.id }),
          },
          { label: t("studio.crumb") },
        ]}
      />
      {/* El estudio lee el clip activo de la URL (nuqs -> useSearchParams) */}
      <Suspense fallback={<StudioSkeleton />}>
        <Studio video={video} clips={projectClips} />
      </Suspense>
    </IntlExtra>
  )
}
