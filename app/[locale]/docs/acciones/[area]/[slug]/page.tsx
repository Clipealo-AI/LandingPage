import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { idiomaDe } from "@/i18n/server"
import { idDe } from "@/lib/wiki/rutas"
import { AREA_INFO } from "@/lib/wiki/areas"
import { accionPorId } from "@/lib/wiki"
import { FichaAccion } from "@/components/wiki/ficha-accion"
import { PaginaWiki } from "@/components/wiki/pagina-wiki"

type Props = { params: Promise<{ locale: string; area: string; slug: string }> }

// Se pintan al pedirlas y quedan guardadas: generarlas todas en el build
// multiplicaba cientos de fichas por tres idiomas para una wiki interna
export function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { area, slug } = await params
  const id = idDe(area, slug)
  const accion = accionPorId(id)
  return accion ? { title: accion.titulo, description: accion.resumen } : {}
}

export default async function AccionPage({ params }: Props) {
  await idiomaDe(params)
  const { area, slug } = await params
  const id = idDe(area, slug)
  const accion = accionPorId(id)
  if (!accion) notFound()
  return (
    <PaginaWiki
      migas={[
        { label: "Wiki", href: "/docs" },
        { label: "Acciones", href: "/docs/acciones" },
        { label: AREA_INFO[accion.area].titulo, href: `/docs/acciones#${accion.area}` },
        { label: accion.titulo },
      ]}
    >
      <FichaAccion accion={accion} />
    </PaginaWiki>
  )
}
