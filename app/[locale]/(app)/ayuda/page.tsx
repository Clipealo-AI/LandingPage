import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { AppTopbar } from "@/components/app/app-topbar"
import { PageHeader } from "@/components/shared/page-header"
import { ComingSoon } from "@/components/shared/coming-soon"
import { MisMensajes } from "@/components/app/mis-mensajes"
import { idiomaDe } from "@/i18n/server"

const TEMAS = ["formats", "errors", "shortcuts"] as const

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/ayuda">): Promise<Metadata> {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "app.nav" })
  return { title: t("help") }
}

export default async function AyudaPage({ params }: PageProps<"/[locale]/ayuda">) {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "app" })
  return (
    <>
      <AppTopbar crumbs={[{ label: t("nav.help") }]} />
      <div className="container-app space-y-6 py-6">
        <PageHeader title={t("nav.help")} description={t("help.description")} />
        {/* Lo primero es lo que sí existe: escribirle al equipo y leer lo que
            te ha contestado. La ayuda escrita viene después */}
        <MisMensajes />
        <ComingSoon
          title={t("help.soonTitle")}
          description={t("help.soonDescription")}
          bullets={TEMAS.map((tema) => t(`help.bullets.${tema}`))}
        />
      </div>
    </>
  )
}
