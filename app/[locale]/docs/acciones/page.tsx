import { Suspense } from "react"
import type { Metadata } from "next"

import { idiomaDe } from "@/i18n/server"
import { ACCIONES, endpointPorId } from "@/lib/wiki"
import { Skeleton } from "@/components/ui/skeleton"
import { IndiceAcciones, type FilaAccion } from "@/components/wiki/indice-acciones"
import { PaginaWiki } from "@/components/wiki/pagina-wiki"

export const metadata: Metadata = { title: "Acciones" }

/** El estado del backend de una acción, por sus endpoints. */
function backendDe(ids: string[]): FilaAccion["backend"] {
  const endpoints = ids.map(endpointPorId).filter((e) => e != null)
  if (endpoints.length === 0) return "sin-servidor"
  return endpoints.every((e) => e.estado === "conectado") ? "conectado" : "por-construir"
}

export default async function AccionesPage({ params }: PageProps<"/[locale]">) {
  await idiomaDe(params)
  const filas: FilaAccion[] = ACCIONES.map((a) => ({
    id: a.id,
    area: a.area,
    titulo: a.titulo,
    resumen: a.resumen,
    quien: a.quien,
    plan: a.plan?.minimo,
    backend: backendDe(a.endpoints),
  }))
  return (
    <PaginaWiki migas={[{ label: "Wiki", href: "/docs" }, { label: "Acciones" }]}>
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Acciones</h1>
          <p className="max-w-2xl text-pretty text-muted-foreground">
            Todo lo que se puede hacer en Clipealo, por área: quién lo hace, dónde, cómo,
            qué garantiza el producto y qué endpoints hay detrás.
          </p>
        </header>
        {/* nuqs lee los filtros de la URL en el cliente: sin Suspense no se prerenderiza */}
        <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
          <IndiceAcciones filas={filas} />
        </Suspense>
      </div>
    </PaginaWiki>
  )
}
