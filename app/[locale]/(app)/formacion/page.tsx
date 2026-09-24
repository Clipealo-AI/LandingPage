import { Suspense } from "react"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { AppTopbar } from "@/components/app/app-topbar"
import { PageHeader } from "@/components/shared/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import { FormacionPanel } from "@/components/formacion/formacion-panel"
import { idiomaDe } from "@/i18n/server"
import { IntlExtra } from "@/i18n/zone"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/formacion">): Promise<Metadata> {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "formacion.meta" })
  return { title: t("title") }
}

/**
 * Formación: las clases que sube el equipo de Clipealo
 * (docs/campanas-ciclo-2026-09.md, §6).
 *
 * La página es de servidor y el panel, una isla de cliente: lo que se recomienda
 * depende de las respuestas del onboarding y del progreso, que viven en el
 * navegador.
 */
export default async function FormacionPage({
  params,
}: PageProps<"/[locale]/formacion">) {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "formacion" })
  return (
    <IntlExtra ns={["formacion", "taxonomy"]}>
      <AppTopbar crumbs={[{ label: t("crumbs.formacion") }]} />
      <div className="@container/formacion container-app space-y-6 py-6">
        <PageHeader title={t("titulo")} description={t("intro")} />
        <Suspense
          fallback={
            <div className="space-y-6">
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-96 w-full rounded-xl" />
            </div>
          }
        >
          <FormacionPanel />
        </Suspense>
      </div>
    </IntlExtra>
  )
}
