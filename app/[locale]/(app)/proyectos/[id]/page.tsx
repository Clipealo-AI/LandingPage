import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Pencil } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { Link, hrefDinamico } from "@/i18n/navigation"
import { clips, sourceVideos } from "@/lib/mock-data"
import { listJobs } from "@/lib/api/jobs"
import { Button } from "@/components/ui/button"
import { AppTopbar } from "@/components/app/app-topbar"
import { ClipsLibrary } from "@/components/app/clips-library"
import { ProyectoProceso } from "@/components/app/proyecto-proceso"
import { PageHeader } from "@/components/shared/page-header"
import { GridSkeleton } from "@/components/shared/panel-skeleton"
import { idiomaDe } from "@/i18n/server"

interface Props {
  params: Promise<{ locale: string; id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await idiomaDe(params)
  const { id } = await params
  const video = sourceVideos.find((v) => v.id === id)
  if (video) return { title: video.title }
  const t = await getTranslations({ locale, namespace: "app.nav" })
  return { title: t("projects") }
}

/**
 * Prerrenderiza los proyectos conocidos; el resto se resuelve bajo demanda.
 * Con `loading.tsx` en este segmento, un id inexistente responde 200 con el «no
 * encontrado» en el cuerpo, igual que el estudio: es una ruta privada y está
 * excluida en `robots.ts`.
 */
export function generateStaticParams() {
  return sourceVideos.map((video) => ({ id: video.id }))
}

/**
 * Un proyecto con sus clips dentro.
 *
 * Es la unidad del producto: un video subido da un proyecto, y sus clips viven
 * aquí y no en una biblioteca plana donde los de tres podcasts se mezclan. La
 * lista de clips es la misma de siempre (`ClipsLibrary`), con sus filtros en la
 * URL, así que «los publicados de este proyecto» es un enlace que se comparte.
 */
export default async function ProyectoPage({ params }: Props) {
  const locale = await idiomaDe(params)
  const { id } = await params
  const video = sourceVideos.find((v) => v.id === id)
  if (!video) notFound()

  const t = await getTranslations({ locale, namespace: "app" })
  const delProyecto = clips.filter((clip) => clip.sourceId === video.id)

  return (
    <>
      <AppTopbar
        crumbs={[
          { label: t("nav.projects"), href: "/proyectos" },
          { label: video.title },
        ]}
      />

      <div className="container-app space-y-6 py-6">
        <PageHeader
          title={video.title}
          description={t("proyecto.description", { n: delProyecto.length })}
          actions={
            // La barra lateral ya lleva el naranja de «Subir un video»
            <Button variant="outline" size="lg" asChild>
              <Link href={hrefDinamico("/studio/[id]", { id: video.id })}>
                <Pencil /> {t("proyecto.abrirEstudio")}
              </Link>
            </Button>
          }
        />

        {video.status === "listo" ? (
          /* Los filtros viven en la URL (nuqs -> useSearchParams) */
          <Suspense fallback={<GridSkeleton />}>
            <ClipsLibrary clips={delProyecto} />
          </Suspense>
        ) : (
          <ProyectoProceso video={video} proyectos={await listJobs()} />
        )}
      </div>
    </>
  )
}
