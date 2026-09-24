import { Suspense } from "react"
import type { Metadata } from "next"
import { FileJson } from "lucide-react"

import { idiomaDe } from "@/i18n/server"
import { ENDPOINTS } from "@/lib/wiki"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { IndiceApi, type FilaEndpoint } from "@/components/wiki/indice-api"
import { PaginaWiki } from "@/components/wiki/pagina-wiki"

export const metadata: Metadata = { title: "Referencia de la API" }

export default async function ApiPage({ params }: PageProps<"/[locale]">) {
  await idiomaDe(params)
  const filas: FilaEndpoint[] = ENDPOINTS.map((e) => ({
    id: e.id,
    area: e.area,
    metodo: e.metodo,
    ruta: e.ruta,
    resumen: e.resumen,
    estado: e.estado,
    auth: e.auth,
  }))
  return (
    <PaginaWiki migas={[{ label: "Wiki", href: "/docs" }, { label: "API" }]}>
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Referencia de la API</h1>
            <p className="max-w-2xl text-pretty text-muted-foreground">
              El contrato del backend. «Conectado»: el front ya lo llama cuando existe{" "}
              <code className="font-mono text-sm">NEXT_PUBLIC_API_URL</code>. «Por
              construir»: hoy vive en el navegador, y el servidor tendrá que darlo con
              esta misma forma para que la app no cambie.
            </p>
          </div>
          <Button variant="outline" asChild>
            {/* Un enlace de verdad, fuera del router: es un archivo, no una página */}
            <a href="/openapi.json" target="_blank" rel="noreferrer">
              <FileJson /> OpenAPI 3.1
            </a>
          </Button>
        </header>
        <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
          <IndiceApi filas={filas} />
        </Suspense>
      </div>
    </PaginaWiki>
  )
}
