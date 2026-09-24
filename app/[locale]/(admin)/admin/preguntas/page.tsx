import type { Metadata } from "next"
import { IntlExtra } from "@/i18n/zone"
import { getTranslations } from "next-intl/server"

import { getAdminDataset, getAdminMonths } from "@/lib/api/admin"
import { AdminPage } from "@/components/admin/admin-page"
import { PreguntasAdmin } from "@/components/admin/preguntas-admin"
import { idiomaDe } from "@/i18n/server"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/preguntas">): Promise<Metadata> {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "admin.preguntas" })
  return { title: t("title") }
}

/**
 * Qué se le pregunta al clipero, dónde y cada cuánto.
 *
 * Sin selector de mes, como Campañas y Formación: el catálogo no pertenece a un
 * mes. Y sin métricas de respuestas, porque no se pueden tener: lo que la gente
 * contesta vive en su navegador, igual que el avance de Formación, y la página
 * lo dice en vez de enseñar un cero (`docs/costuras-backend.md`).
 */
export default async function AdminPreguntasPage({
  params,
}: PageProps<"/[locale]/admin/preguntas">) {
  const locale = await idiomaDe(params)
  const [t, tAdmin, { months, current }, data] = await Promise.all([
    getTranslations({ locale, namespace: "admin.preguntas" }),
    getTranslations({ locale, namespace: "admin" }),
    getAdminMonths(),
    getAdminDataset(),
  ])

  return (
    <IntlExtra ns={["admin.preguntas"]}>
      <AdminPage
        crumbs={[{ label: tAdmin("nav.items.preguntas") }]}
        title={t("title")}
        description={t("description")}
        months={months}
        current={current}
        updatedAt={data.updatedAt}
        timeZone={data.timeZone}
        mtd={null}
      >
        <PreguntasAdmin />
      </AdminPage>
    </IntlExtra>
  )
}
