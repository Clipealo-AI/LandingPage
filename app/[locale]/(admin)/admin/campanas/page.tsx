import type { Metadata } from "next"
import { IntlExtra } from "@/i18n/zone"
import { getTranslations } from "next-intl/server"

import { AppTopbar } from "@/components/app/app-topbar"
import { CampanasAdmin } from "@/components/admin/campanas-admin"
import { idiomaDe } from "@/i18n/server"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/campanas">): Promise<Metadata> {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "admin.campanas" })
  return { title: t("title") }
}

/**
 * Campañas en el backoffice. Sin selector de mes: las colas (solicitudes y
 * retiros) son de hoy y la tabla enseña cada campaña entera, no un mes.
 */
export default async function AdminCampanasPage({
  params,
}: PageProps<"/[locale]/admin/campanas">) {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "admin" })
  return (
    <IntlExtra ns={["admin.campanas"]}>
      <AppTopbar
        showCommand={false}
        crumbs={[
          { label: t("page.crumb"), href: "/admin" },
          { label: t("campanas.title") },
        ]}
      />
      <div className="@container/admin container-app space-y-8 py-6">
        <CampanasAdmin />
      </div>
    </IntlExtra>
  )
}
