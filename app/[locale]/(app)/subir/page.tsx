import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { AppTopbar } from "@/components/app/app-topbar"
import { PageHeader } from "@/components/shared/page-header"
import { UploadPanel } from "@/components/app/upload-panel"
import { ProfileProgressCard } from "@/components/onboarding/profile-progress-card"
import { idiomaDe } from "@/i18n/server"
import { IntlExtra } from "@/i18n/zone"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/subir">): Promise<Metadata> {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "app" })
  return {
    title: t("nav.upload"),
    description: t("upload.metaDescription"),
  }
}

export default async function SubirPage({ params }: PageProps<"/[locale]/subir">) {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "app" })
  return (
    <IntlExtra ns={["onboarding"]}>
      <AppTopbar
        crumbs={[
          { label: t("nav.projects"), href: "/proyectos" },
          { label: t("upload.crumb") },
        ]}
      />

      <div className="container-form space-y-8 py-8">
        <PageHeader
          eyebrow={t("upload.eyebrow")}
          title={t("upload.title")}
          description={t("upload.description")}
        />

        {/* El otro sitio donde aterriza «Más tarde». Apagada: el naranja de
            esta vista es «Procesar el video» */}
        <ProfileProgressCard destacado={false} />

        <UploadPanel />
      </div>
    </IntlExtra>
  )
}
