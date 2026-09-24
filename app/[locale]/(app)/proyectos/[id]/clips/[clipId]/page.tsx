import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"

import { hrefDinamico } from "@/i18n/navigation"
import { clips, cuesDelTramo, sourceVideos, transcriptDe } from "@/lib/mock-data"
import { AppTopbar } from "@/components/app/app-topbar"
import { ClipDetalle } from "@/components/app/clip-detalle"
import { idiomaDe } from "@/i18n/server"
import { IntlExtra } from "@/i18n/zone"

interface Props {
  params: Promise<{ locale: string; id: string; clipId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await idiomaDe(params)
  const { clipId } = await params
  const clip = clips.find((c) => c.id === clipId)
  if (clip) return { title: clip.title }
  const t = await getTranslations({ locale, namespace: "app.nav" })
  return { title: t("clips") }
}

export function generateStaticParams() {
  return clips.map((clip) => ({ id: clip.sourceId, clipId: clip.id }))
}

/**
 * La ficha de un clip, colgando de su proyecto.
 *
 * La ruta lleva los dos ids a propósito: el clip pertenece a un proyecto y la
 * dirección lo dice, así que las migas y el activo de la barra lateral salen
 * solos. Un clip pedido desde otro proyecto no existe, no se redirige: el
 * enlace estaba mal y decirlo es mejor que enseñar otra cosa.
 */
export default async function ClipPage({ params }: Props) {
  const locale = await idiomaDe(params)
  const { id, clipId } = await params
  const video = sourceVideos.find((v) => v.id === id)
  const clip = clips.find((c) => c.id === clipId)
  if (!video || !clip || clip.sourceId !== video.id) notFound()

  const t = await getTranslations({ locale, namespace: "app.nav" })

  return (
    <IntlExtra ns={["calendario"]}>
      <AppTopbar
        crumbs={[
          { label: t("projects"), href: "/proyectos" },
          { label: video.title, href: hrefDinamico("/proyectos/[id]", { id: video.id }) },
          { label: clip.title },
        ]}
      />

      <div className="container-app space-y-6 py-6">
        <h1 className="text-xl font-bold tracking-tight text-balance sm:text-2xl">
          {clip.title}
        </h1>
        <ClipDetalle
          clip={clip}
          video={video}
          cues={cuesDelTramo(transcriptDe(video.id), clip.range)}
        />
      </div>
    </IntlExtra>
  )
}
