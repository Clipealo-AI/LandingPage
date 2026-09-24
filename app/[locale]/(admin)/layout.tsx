import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { idiomaDe } from "@/i18n/server"
import { IntlZone } from "@/i18n/zone"
import { getAdminFormacion, getAdminMonth } from "@/lib/api/admin"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "admin.meta" })
  return {
    title: { default: t("title"), template: t("template") },
    robots: { index: false, follow: false },
  }
}

/**
 * Shell del backoffice. Misma barra lateral y mismo chrome que el producto,
 * con su propia navegación: quien administra no necesita «Subir un video».
 * Los contadores de la barra salen de la instantánea del mes en curso.
 */
export default async function AdminLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const locale = await idiomaDe(params)
  const hoy = await getAdminMonth()
  const usuariosPendientes =
    hoy.colas.filter((c) => c.tipo === "retencion").length +
    (hoy.alertas.find((a) => a.id === "revisar")?.n ?? 0)
  const vencimientosPendientes = hoy.colas.filter((c) => c.tipo === "cobro").length
  // Las disputas las cuenta la propia barra: viven en el navegador y el
  // servidor no las conoce (ver `AdminSidebar`)
  // Formación no tiene cola de gente: lo pendiente es el archivo que falta por
  // subir de las clases que ya están publicadas
  const catalogo = await getAdminFormacion()
  const formacionPendiente = catalogo.lecciones.filter(
    (l) => l.estado === "publicada" && !l.video.url
  ).length

  return (
    <IntlZone locale={locale} zone="admin">
      <SidebarProvider>
        <AdminSidebar
          pendientes={{
            usuarios: usuariosPendientes,
            vencimientos: vencimientosPendientes,
            formacion: formacionPendiente,
          }}
          totalUsuarios={hoy.usuarios.total}
        />
        <SidebarInset id="contenido" className="min-w-0">
          {children}
        </SidebarInset>
      </SidebarProvider>
    </IntlZone>
  )
}
