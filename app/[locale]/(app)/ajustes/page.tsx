import { Suspense } from "react"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { AppTopbar } from "@/components/app/app-topbar"
import { PageHeader } from "@/components/shared/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import { SettingsTabs } from "@/components/app/settings-tabs"
import { idiomaDe } from "@/i18n/server"
import { IntlExtra } from "@/i18n/zone"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/ajustes">): Promise<Metadata> {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "settings.page" })
  return { title: t("title") }
}

export default async function AjustesPage({ params }: PageProps<"/[locale]/ajustes">) {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "settings.page" })
  return (
    <IntlExtra ns={["onboarding", "settings", "taxonomy"]}>
      <AppTopbar crumbs={[{ label: t("title") }]} />
      {/* Ancho completo, como el resto de la app: cada pestaña reparte en columnas según el sitio */}
      <div className="container-app space-y-6 py-6">
        <PageHeader title={t("title")} description={t("description")} />

        {/* nuqs lee la URL en el cliente: sin Suspense la ruta no se prerenderiza */}
        <Suspense
          fallback={
            <div className="space-y-6">
              <Skeleton className="h-11 w-full max-w-2xl" />
              <Skeleton className="h-96 w-full rounded-xl" />
            </div>
          }
        >
          <SettingsTabs />
        </Suspense>
      </div>
    </IntlExtra>
  )
}
