import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { AppTopbar } from "@/components/app/app-topbar"
import { OperacionesHub } from "@/components/app/operaciones-hub"
import { PageHeader } from "@/components/shared/page-header"
import { idiomaDe } from "@/i18n/server"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/operaciones">): Promise<Metadata> {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "app" })
  return {
    title: t("nav.operations"),
    description: t("operaciones.metaDescription"),
  }
}

/**
 * Operaciones es una suite: un centro con una tarjeta por herramienta y cada
 * herramienta en su propia página (`/operaciones/<id>`). Recortar, reducir y
 * variantes son trabajos de la cola; publicación y derechos preparan lo de
 * alrededor sin tocar el archivo.
 */
export default async function OperacionesPage({
  params,
}: PageProps<"/[locale]/operaciones">) {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "app" })
  return (
    <>
      <AppTopbar
        crumbs={[
          { label: t("nav.projects"), href: "/proyectos" },
          { label: t("operaciones.crumb") },
        ]}
      />

      <div className="@container/operaciones container-app space-y-8 py-8">
        <PageHeader
          eyebrow={t("operaciones.eyebrow")}
          title={t("operaciones.title")}
          description={t("operaciones.description")}
        />
        <OperacionesHub />
      </div>
    </>
  )
}
