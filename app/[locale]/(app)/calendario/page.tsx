import { Suspense } from "react"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { AppTopbar } from "@/components/app/app-topbar"
import { PageHeader } from "@/components/shared/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import { AgendaView, SelloZona } from "@/components/agenda/agenda-view"
import { idiomaDe } from "@/i18n/server"
import { IntlExtra } from "@/i18n/zone"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/calendario">): Promise<Metadata> {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "calendario.meta" })
  return { title: t("title") }
}

/**
 * Calendario de publicaciones.
 *
 * Aquí se planifica y se ve lo que salió. Clipealo publica a la hora marcada
 * en la cuenta elegida (`lib/api/publicaciones.ts`, simulado hasta que haya
 * OAuth). Lo ya publicado viene de las publicaciones que Analíticas tiene
 * indexadas; lo planificado vive en el navegador.
 *
 * La página es de servidor y la agenda, una isla de cliente: la hora depende de
 * la zona de la cuenta y lo planificado, del almacén local.
 */
export default async function CalendarioPage({
  params,
}: PageProps<"/[locale]/calendario">) {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "calendario" })
  return (
    <IntlExtra ns={["calendario"]}>
      <AppTopbar crumbs={[{ label: t("crumbs.calendario") }]} />
      {/* `@container/calendario`: la rejilla sigue el sitio real, con la barra
          lateral abierta o plegada, no el ancho de la ventana */}
      <div className="@container/calendario container-app space-y-6 py-6">
        <PageHeader
          title={t("titulo")}
          description={t("intro")}
          actions={
            <Suspense fallback={<Skeleton className="h-9 w-40" />}>
              <SelloZona />
            </Suspense>
          }
        />
        {/* nuqs lee la URL en el cliente: sin Suspense la ruta no prerenderiza */}
        <Suspense
          fallback={
            <div className="space-y-4">
              <Skeleton className="h-10 w-full max-w-md" />
              <Skeleton className="h-[32rem] w-full rounded-xl" />
            </div>
          }
        >
          <AgendaView />
        </Suspense>
      </div>
    </IntlExtra>
  )
}
