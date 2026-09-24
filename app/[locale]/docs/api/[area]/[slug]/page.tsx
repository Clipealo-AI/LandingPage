import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { idiomaDe } from "@/i18n/server"
import { idDe } from "@/lib/wiki/rutas"
import { AREA_INFO } from "@/lib/wiki/areas"
import { endpointPorId } from "@/lib/wiki"
import { FichaEndpoint } from "@/components/wiki/ficha-endpoint"
import { PaginaWiki } from "@/components/wiki/pagina-wiki"

type Props = { params: Promise<{ locale: string; area: string; slug: string }> }

// Igual que las acciones: al pedirlas, no en el build
export function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { area, slug } = await params
  const id = idDe(area, slug)
  const e = endpointPorId(id)
  return e ? { title: `${e.metodo} ${e.ruta}`, description: e.resumen } : {}
}

export default async function EndpointPage({ params }: Props) {
  await idiomaDe(params)
  const { area, slug } = await params
  const id = idDe(area, slug)
  const endpoint = endpointPorId(id)
  if (!endpoint) notFound()
  return (
    <PaginaWiki
      migas={[
        { label: "Wiki", href: "/docs" },
        { label: "API", href: "/docs/api" },
        { label: AREA_INFO[endpoint.area].titulo, href: `/docs/api#${endpoint.area}` },
        { label: `${endpoint.metodo} ${endpoint.ruta}` },
      ]}
    >
      <FichaEndpoint endpoint={endpoint} />
    </PaginaWiki>
  )
}
