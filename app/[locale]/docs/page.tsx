import type { Metadata } from "next"
import { ArrowRight, Braces, FileJson, Layers, Palette, Workflow } from "lucide-react"

import { Link } from "@/i18n/navigation"
import { idiomaDe } from "@/i18n/server"
import { ACCIONES, ENDPOINTS } from "@/lib/wiki"
import { AREA_INFO } from "@/lib/wiki/areas"
import { SECCIONES_MARCA } from "@/lib/wiki/marca"
import { AREAS } from "@/lib/wiki/tipos"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/shared/stat-card"
import { ICONO_AREA } from "@/components/wiki/iconos"
import { PaginaWiki } from "@/components/wiki/pagina-wiki"

export const metadata: Metadata = { title: { absolute: "Wiki de Clipealo" } }

/**
 * La portada de la wiki: qué hay, cuánto hay y por dónde se entra.
 *
 * Una sola acción naranja —ver las acciones, que es lo que más se consulta— y
 * el resto en contorno. Las cifras salen del catálogo en cada build, así que no
 * se quedan viejas.
 */
export default async function DocsPage({ params }: PageProps<"/[locale]">) {
  await idiomaDe(params)
  const conectados = ENDPOINTS.filter((e) => e.estado === "conectado").length

  return (
    <PaginaWiki migas={[{ label: "Wiki" }]}>
      <div className="mx-auto max-w-6xl space-y-12">
        <header className="max-w-3xl space-y-4">
          <Badge variant="secondary">Interna · para el equipo</Badge>
          <h1 className="text-4xl font-bold tracking-tight text-balance">
            Wiki de Clipealo
          </h1>
          <p className="text-lg text-pretty text-muted-foreground">
            Todo lo que se puede hacer en el producto, el contrato del backend y la marca,
            en un solo sitio y sacado del código: cada entrada cita el archivo y la línea
            de donde sale, y una prueba falla si alguna deja de ser verdad.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button variant="brand" size="lg" asChild>
              <Link href="/docs/acciones">
                <Workflow /> Ver las acciones
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/docs/api">
                <Braces /> Referencia de la API
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/docs/marca">
                <Palette /> Guía de marca
              </Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Pulsa{" "}
            <kbd className="rounded border bg-muted px-1.5 font-mono text-xs">⌘K</kbd> o{" "}
            <kbd className="rounded border bg-muted px-1.5 font-mono text-xs">/</kbd> en
            cualquier página para buscar una acción, una ruta, un tipo o un token.
          </p>
        </header>

        <section
          aria-label="La wiki en cifras"
          className="grid [grid-template-columns:repeat(auto-fit,minmax(13rem,1fr))] gap-3"
        >
          <StatCard
            featured
            label="Acciones documentadas"
            value={ACCIONES.length}
            icon={Workflow}
          />
          <StatCard
            label="Endpoints"
            value={ENDPOINTS.length}
            hint={`${conectados} conectados · ${ENDPOINTS.length - conectados} por construir`}
            icon={Braces}
          />
          <StatCard label="Áreas del producto" value={AREAS.length} icon={Layers} />
          <StatCard
            label="Secciones de marca"
            value={SECCIONES_MARCA.length}
            icon={Palette}
          />
        </section>

        <section aria-labelledby="areas" className="space-y-4">
          <h2 id="areas" className="text-xl font-bold tracking-tight">
            Por área
          </h2>
          <ul className="grid [grid-template-columns:repeat(auto-fill,minmax(18rem,1fr))] gap-3">
            {AREAS.map((area) => {
              const Icono = ICONO_AREA[area]
              const acciones = ACCIONES.filter((a) => a.area === area).length
              const endpoints = ENDPOINTS.filter((e) => e.area === area).length
              return (
                <li key={area}>
                  <Link
                    href={`/docs/acciones#${area}`}
                    className="group flex h-full flex-col gap-3 rounded-xl bg-card p-5 ring-1 ring-border transition-colors hover:bg-muted/40"
                  >
                    <span className="flex items-center gap-3">
                      <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                        <Icono className="size-4" aria-hidden />
                      </span>
                      <span className="font-semibold">{AREA_INFO[area].titulo}</span>
                    </span>
                    <span className="flex-1 text-sm text-pretty text-muted-foreground">
                      {AREA_INFO[area].descripcion}
                    </span>
                    <span className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
                      <span>
                        {acciones} acciones · {endpoints} endpoints
                      </span>
                      <ArrowRight
                        className="size-4 transition-transform group-hover:translate-x-0.5"
                        aria-hidden
                      />
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>

        <section aria-labelledby="leer" className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 id="leer" className="text-xl font-bold tracking-tight">
              Cómo se lee
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <dt className="w-32 shrink-0">
                  <Badge variant="success">Conectado</Badge>
                </dt>
                <dd className="text-pretty text-muted-foreground">
                  El front ya lo pide al servidor en cuanto existe{" "}
                  <code className="font-mono text-xs">NEXT_PUBLIC_API_URL</code>. Hoy lo
                  simula.
                </dd>
              </div>
              <div className="flex items-start gap-3">
                <dt className="w-32 shrink-0">
                  <Badge variant="warning">Por construir</Badge>
                </dt>
                <dd className="text-pretty text-muted-foreground">
                  Vive en el navegador. El servidor tiene que darlo con la forma
                  documentada para que la app no cambie al conectarse.
                </dd>
              </div>
              <div className="flex items-start gap-3">
                <dt className="w-32 shrink-0">
                  <Badge variant="brand-subtle">Desde Creador</Badge>
                </dt>
                <dd className="text-pretty text-muted-foreground">
                  El plan mínimo que la desbloquea. Por debajo se ve con candado y su
                  motivo escrito.
                </dd>
              </div>
            </dl>
          </div>
          <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight">Fuera de la wiki</h2>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/design-system" className="text-primary hover:underline">
                  Sistema de diseño
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  · cada componente vivo, con sus variantes y sus estados.
                </span>
              </li>
              <li className="flex flex-wrap items-center gap-1">
                <a
                  href="/openapi.json"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <FileJson className="size-4" aria-hidden /> openapi.json
                </a>
                <span className="text-muted-foreground">
                  · la misma API en OpenAPI 3.1, para Postman o para generar un cliente.
                </span>
              </li>
              <li>
                <code className="font-mono text-xs">docs/costuras-backend.md</code>
                <span className="text-muted-foreground">
                  {" "}
                  · el porqué de cada costura y el orden recomendado para conectarlas.
                </span>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </PaginaWiki>
  )
}
