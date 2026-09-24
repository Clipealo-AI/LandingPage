"use client"

import * as React from "react"
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs"
import { Search } from "lucide-react"

import { Link } from "@/i18n/navigation"
import { hrefEndpoint } from "@/lib/wiki/rutas"
import { AREA_INFO } from "@/lib/wiki/areas"
import { AREAS, type Area, type Endpoint } from "@/lib/wiki/tipos"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { AuthBadge, EstadoBadge, MetodoBadge } from "@/components/wiki/insignias"
import { Texto } from "@/components/wiki/texto"

/** Lo justo de cada endpoint para el índice. */
export interface FilaEndpoint {
  id: string
  area: Area
  metodo: Endpoint["metodo"]
  ruta: string
  resumen: string
  estado: Endpoint["estado"]
  auth: Endpoint["auth"]
}

const ESTADOS = ["todos", "conectado", "por-construir"] as const
const METODOS = ["todos", "GET", "POST", "PUT", "PATCH", "DELETE"] as const

/**
 * La referencia de la API, por área. Cada fila dice su método, su ruta, si ya
 * está conectada o está por construir y quién puede llamarla, sin abrirla.
 */
export function IndiceApi({ filas }: { filas: FilaEndpoint[] }) {
  const [q, setQ] = useQueryState("q", parseAsString.withDefault(""))
  const [estado, setEstado] = useQueryState(
    "estado",
    parseAsStringLiteral(ESTADOS).withDefault("todos")
  )
  const [metodo, setMetodo] = useQueryState(
    "metodo",
    parseAsStringLiteral(METODOS).withDefault("todos")
  )

  const busqueda = q.trim().toLowerCase()
  const visibles = filas.filter(
    (f) =>
      (estado === "todos" || f.estado === estado) &&
      (metodo === "todos" || f.metodo === metodo) &&
      (!busqueda || `${f.ruta} ${f.resumen} ${f.id}`.toLowerCase().includes(busqueda))
  )
  const porConstruir = filas.filter((f) => f.estado === "por-construir").length

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={q}
            onChange={(e) => void setQ(e.target.value || null)}
            placeholder="Filtrar por ruta o nombre…"
            aria-label="Filtrar endpoints"
            className="pl-9 font-mono text-sm"
          />
        </div>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={estado}
          onValueChange={(v) =>
            v && void setEstado(v === "todos" ? null : (v as typeof estado))
          }
          aria-label="Estado"
        >
          <ToggleGroupItem value="todos" className="px-3">
            Todos
          </ToggleGroupItem>
          <ToggleGroupItem value="conectado" className="px-3">
            Conectados
          </ToggleGroupItem>
          <ToggleGroupItem value="por-construir" className="px-3">
            Por construir · {porConstruir}
          </ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={metodo}
          onValueChange={(v) =>
            v && void setMetodo(v === "todos" ? null : (v as typeof metodo))
          }
          aria-label="Método"
        >
          {METODOS.map((m) => (
            <ToggleGroupItem key={m} value={m} className="px-2.5 font-mono text-xs">
              {m === "todos" ? "Todos" : m}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p className="text-sm text-muted-foreground tabular-nums" aria-live="polite">
          {visibles.length} de {filas.length}
        </p>
      </div>

      {visibles.length === 0 && (
        <p className="rounded-xl bg-muted/50 px-4 py-6 text-center text-sm text-muted-foreground">
          Ningún endpoint con esos filtros.
        </p>
      )}

      {AREAS.map((area) => {
        const del = visibles.filter((f) => f.area === area)
        if (del.length === 0) return null
        return (
          <section
            key={area}
            id={area}
            aria-labelledby={`${area}-t`}
            className="scroll-mt-20 space-y-3"
          >
            <h2 id={`${area}-t`} className="text-lg font-bold tracking-tight">
              {AREA_INFO[area].titulo}
              <span className="ml-2 text-sm font-normal text-muted-foreground tabular-nums">
                {del.length}
              </span>
            </h2>
            <ul className="divide-y overflow-hidden rounded-xl bg-card ring-1 ring-border">
              {del.map((f) => (
                <li key={f.id}>
                  <Link
                    href={hrefEndpoint(f.id)}
                    className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                  >
                    <MetodoBadge metodo={f.metodo} />
                    <code className="min-w-0 font-mono text-sm break-all">{f.ruta}</code>
                    <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground max-md:basis-full">
                      <Texto>{f.resumen}</Texto>
                    </span>
                    <span className="flex shrink-0 gap-1.5">
                      <AuthBadge auth={f.auth} />
                      <EstadoBadge estado={f.estado} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
