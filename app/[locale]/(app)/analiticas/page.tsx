import { Suspense } from "react"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { AppTopbar } from "@/components/app/app-topbar"
import { Skeleton } from "@/components/ui/skeleton"
import { AnalyticsDashboard } from "@/components/app/analytics-dashboard"
import { idiomaDe } from "@/i18n/server"
import { IntlExtra } from "@/i18n/zone"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/analiticas">): Promise<Metadata> {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "analytics.page" })
  return { title: t("title") }
}

export default async function AnaliticasPage({
  params,
}: PageProps<"/[locale]/analiticas">) {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "analytics.page" })
  return (
    <IntlExtra ns={["analytics"]}>
      <AppTopbar crumbs={[{ label: t("title") }]} />
      {/* `@container/analitica`: las columnas siguen el sitio real, con la barra lateral abierta o plegada */}
      <div className="@container/analitica container-app space-y-6 py-6">
        {/* nuqs lee la URL en el cliente: sin Suspense la ruta no se prerenderiza */}
        <Suspense
          fallback={
            <div className="space-y-6">
              <Skeleton className="h-16 w-full max-w-2xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-96 w-full rounded-xl" />
            </div>
          }
        >
          <AnalyticsDashboard />
        </Suspense>
      </div>
    </IntlExtra>
  )
}
