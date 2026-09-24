import { Suspense } from "react"
import { IntlExtra } from "@/i18n/zone"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { getAdminDataset, getAdminDisputas, getAdminMonths } from "@/lib/api/admin"
import { AdminPage } from "@/components/admin/admin-page"
import { DisputasAdmin } from "@/components/admin/disputas-admin"
import { idiomaDe } from "@/i18n/server"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/disputas">): Promise<Metadata> {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "admin.disputas" })
  return { title: t("title") }
}

/**
 * Disputas: donde el equipo de Clipealo arbitra cuando una campaña y un clipero
 * no se entienden (docs/campanas-ciclo-2026-09.md, §4).
 *
 * La cola llega del servidor y se mezcla con lo que haya abierto la demo en este
 * navegador (`hooks/use-campanas.ts`), así que el laudo que se dicta aquí
 * desbloquea la campaña en /campanas sin recargar nada.
 *
 * Frontera de datos: se ve lo justo para decidir —las dos versiones, el
 * compromiso, las fechas y el dinero comprometido— y nunca el wallet del
 * clipero.
 */
export default async function AdminDisputasPage({
  params,
}: PageProps<"/[locale]/admin/disputas">) {
  const locale = await idiomaDe(params)
  const [t, tAdmin, disputas, { months, current }, data] = await Promise.all([
    getTranslations({ locale, namespace: "admin.disputas" }),
    getTranslations({ locale, namespace: "admin" }),
    getAdminDisputas(),
    getAdminMonths(),
    getAdminDataset(),
  ])

  return (
    <IntlExtra ns={["admin.disputas"]}>
      {/* El selector de mes lee la URL con nuqs: sin este Suspense no prerenderiza */}
      <Suspense>
        <AdminPage
          crumbs={[{ label: tAdmin("nav.items.disputas") }]}
          title={t("title")}
          description={t("description")}
          months={months}
          current={current}
          updatedAt={data.updatedAt}
          timeZone={data.timeZone}
          mtd={null}
        >
          <DisputasAdmin iniciales={disputas} />
        </AdminPage>
      </Suspense>
    </IntlExtra>
  )
}
