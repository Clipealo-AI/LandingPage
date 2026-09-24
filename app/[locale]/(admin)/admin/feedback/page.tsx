import { Suspense } from "react"
import { IntlExtra } from "@/i18n/zone"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { getAdminDataset, getAdminMonths } from "@/lib/api/admin"
import { AdminPage } from "@/components/admin/admin-page"
import { FeedbackAdmin } from "@/components/admin/feedback-admin"
import { TableSkeleton } from "@/components/admin/table-skeleton"
import { idiomaDe } from "@/i18n/server"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/feedback">): Promise<Metadata> {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "admin.feedback" })
  return { title: t("title") }
}

/**
 * El casillero: lo que cliperos y agencias le escriben a Clipealo.
 *
 * Sin selector de mes, como Campañas y Formación: un mensaje no pertenece a un
 * mes, y enseñar un mando que la página no lee es peor que no enseñarlo.
 *
 * Los mensajes viven en el navegador (`hooks/use-feedback.ts`) porque todavía
 * no hay servidor, así que lo que se escribe en /ayuda aparece aquí y la
 * respuesta vuelve allí sin recargar nada. Al conectar la API esto pasa a ser
 * una función más de `lib/api/` (ver `docs/costuras-backend.md`).
 */
export default async function AdminFeedbackPage({
  params,
}: PageProps<"/[locale]/admin/feedback">) {
  const locale = await idiomaDe(params)
  const [t, tAdmin, { months, current }, data] = await Promise.all([
    getTranslations({ locale, namespace: "admin.feedback" }),
    getTranslations({ locale, namespace: "admin" }),
    getAdminMonths(),
    getAdminDataset(),
  ])

  return (
    <IntlExtra ns={["admin.feedback"]}>
      <AdminPage
        crumbs={[{ label: tAdmin("nav.items.feedback") }]}
        title={t("title")}
        description={t("description")}
        months={months}
        current={current}
        updatedAt={data.updatedAt}
        timeZone={data.timeZone}
        mtd={null}
      >
        {/* La tabla lee los filtros de la URL con nuqs: sin este Suspense la
            ruta deja de poder prerenderizarse */}
        <Suspense fallback={<TableSkeleton />}>
          <FeedbackAdmin />
        </Suspense>
      </AdminPage>
    </IntlExtra>
  )
}
