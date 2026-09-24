import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import type { HerramientaId } from "@/lib/operaciones"
import { AppTopbar } from "@/components/app/app-topbar"
import { PageHeader } from "@/components/shared/page-header"
import { idiomaDe } from "@/i18n/server"

/**
 * El marco de cada herramienta de Operaciones: migas hasta el centro, cabecera
 * con su título y su descripción, y el contenido. Cada página lo monta con su
 * id; así las cinco se ven iguales y una nueva es una carpeta más.
 */
export async function metadataHerramienta(
  params: Promise<{ locale: string }>,
  id: HerramientaId
): Promise<Metadata> {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "app.operaciones" })
  return {
    title: `${t(`${id}.title`)} · ${t("title")}`,
    description: t(`herramientas.${id}.descripcion`),
  }
}

export async function HerramientaPage({
  params,
  id,
  children,
}: {
  params: Promise<{ locale: string }>
  id: HerramientaId
  children: React.ReactNode
}) {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "app" })
  return (
    <>
      <AppTopbar
        crumbs={[
          { label: t("nav.projects"), href: "/proyectos" },
          { label: t("operaciones.crumb"), href: "/operaciones" },
          { label: t(`operaciones.${id}.title`) },
        ]}
      />

      <div className="@container/operaciones container-form space-y-8 py-8">
        <PageHeader
          eyebrow={t("operaciones.eyebrow")}
          title={t(`operaciones.${id}.title`)}
          description={t(`operaciones.${id}.description`)}
        />
        {children}
      </div>
    </>
  )
}
