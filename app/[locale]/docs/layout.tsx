import type { Metadata } from "next"

import { idiomaDe } from "@/i18n/server"
import { IntlZone } from "@/i18n/zone"
import { ACCIONES, ENDPOINTS } from "@/lib/wiki"
import { AREAS, type Area } from "@/lib/wiki/tipos"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { WikiSidebar } from "@/components/wiki/wiki-sidebar"

export const metadata: Metadata = {
  title: { default: "Wiki", template: "%s · Wiki" },
  // Interna: la referencia del equipo, no una página para buscadores
  robots: { index: false, follow: false },
}

const cuantas = (lista: readonly { area: Area }[]) =>
  Object.fromEntries(
    AREAS.map((a) => [a, lista.filter((x) => x.area === a).length])
  ) as Record<Area, number>

/**
 * La wiki de Clipealo: todas las acciones del producto, la referencia de la
 * API y la guía de marca, con la misma barra, la misma cabecera y los mismos
 * componentes que la app.
 *
 * El contenido va en español y no pasa por `messages/`: es documentación
 * interna del equipo, no interfaz de producto. La zona `base` solo trae
 * `common`, que es lo que piden el buscador y el selector de tema.
 *
 * La cabecera la pone cada página (`PaginaWiki`) con sus propias migas.
 */
export default async function DocsLayout({ children, params }: LayoutProps<"/[locale]">) {
  const locale = await idiomaDe(params)
  return (
    <IntlZone locale={locale} zone="base">
      <SidebarProvider>
        <WikiSidebar acciones={cuantas(ACCIONES)} endpoints={cuantas(ENDPOINTS)} />
        <SidebarInset id="contenido" className="min-w-0">
          {children}
        </SidebarInset>
      </SidebarProvider>
    </IntlZone>
  )
}
