import { Suspense } from "react"
import { IntlExtra } from "@/i18n/zone"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { getAdminFormacion } from "@/lib/api/admin"
import { AppTopbar } from "@/components/app/app-topbar"
import { TableSkeleton } from "@/components/admin/table-skeleton"
import { FormacionAdmin } from "@/components/admin/formacion-admin"
import { idiomaDe } from "@/i18n/server"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/formacion">): Promise<Metadata> {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "admin.formacion" })
  return { title: t("title") }
}

/**
 * Formación en el backoffice: aquí se publican las clases que ve el clipero
 * (docs/campanas-ciclo-2026-09.md §6).
 *
 * Sin selector de mes: una clase no pertenece a un mes, y enseñar uno haría
 * pensar que las cifras son de ese mes.
 *
 * El catálogo llega del servidor con las semillas y se mezcla con lo que este
 * navegador haya publicado (`hooks/use-catalogo-formacion.ts`), así que lo que
 * se cambia aquí se ve en /formacion sin recargar nada. El `<Suspense>` es
 * obligatorio: la tabla lee sus filtros de la URL con nuqs.
 */
export default async function AdminFormacionPage({
  params,
}: PageProps<"/[locale]/admin/formacion">) {
  const locale = await idiomaDe(params)
  const [t, tAdmin, catalogo] = await Promise.all([
    getTranslations({ locale, namespace: "admin.formacion" }),
    getTranslations({ locale, namespace: "admin" }),
    getAdminFormacion(),
  ])

  return (
    <IntlExtra ns={["admin.formacion"]}>
      <AppTopbar
        showCommand={false}
        crumbs={[{ label: tAdmin("page.crumb"), href: "/admin" }, { label: t("title") }]}
      />
      <div className="@container/admin container-app space-y-8 py-6">
        <Suspense fallback={<TableSkeleton />}>
          <FormacionAdmin iniciales={catalogo} />
        </Suspense>
      </div>
    </IntlExtra>
  )
}
