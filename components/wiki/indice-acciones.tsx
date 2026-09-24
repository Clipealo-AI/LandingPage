"use client"

import * as React from "react"
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs"
import { ArrowRight, Search } from "lucide-react"

import { Link } from "@/i18n/navigation"
import { hrefAccion } from "@/lib/wiki/rutas"
import { AREA_INFO, PLAN_INFO, ROL_INFO } from "@/lib/wiki/areas"
import { AREAS, type Area, type PlanBase, type Rol } from "@/lib/wiki/tipos"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ICONO_AREA } from "@/components/wiki/iconos"
import { Texto } from "@/components/wiki/texto"

/** Lo justo de cada acción para el índice: la ficha entera se pide al abrirla. */
export interface FilaAccion {
  id: string
  area: Area
  titulo: string
  resumen: string
  quien: Rol[]
  plan?: PlanBase
  backend: "conectado" | "por-construir" | "sin-servidor"
}

const ROLES = ["todos", "clipero", "agencia", "admin", "visitante"] as const
const BACKEND = ["todos", "conectado", "por-construir"] as const

const normal = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")

/**
 * El índice de acciones, por área, con filtros que quedan en la URL: una vista
 * filtrada («lo que hace una agencia y aún no tiene servidor») se comparte con
 * un enlace.
 */
export function IndiceAcciones({ filas }: { filas: FilaAccion[] }) {
  const [q, setQ] = useQueryState("q", parseAsString.withDefault(""))
  const [rol, setRol] = useQueryState(
    "rol",
    parseAsStringLiteral(ROLES).withDefault("todos")
  )
  const [backend, setBackend] = useQueryState(
    "backend",
    parseAsStringLiteral(BACKEND).withDefault("todos")
  )

  const busqueda = normal(q.trim())
  const visibles = filas.filter(
    (f) =>
      (rol === "todos" || f.quien.includes(rol)) &&
      (backend === "todos" || f.backend === backend) &&
      (!busqueda || normal(`${f.titulo} ${f.resumen} ${f.id}`).includes(busqueda))
  )

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
            placeholder="Filtrar acciones…"
            aria-label="Filtrar acciones"
            className="pl-9"
          />
        </div>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={rol}
          onValueChange={(v) =>
            v && void setRol(v === "todos" ? null : (v as typeof rol))
          }
          aria-label="Quién"
        >
          {ROLES.map((r) => (
            <ToggleGroupItem key={r} value={r} className="px-3">
              {r === "todos" ? "Todos" : ROL_INFO[r]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={backend}
          onValueChange={(v) =>
            v && void setBackend(v === "todos" ? null : (v as typeof backend))
          }
          aria-label="Backend"
        >
          <ToggleGroupItem value="todos" className="px-3">
            Cualquier backend
          </ToggleGroupItem>
          <ToggleGroupItem value="conectado" className="px-3">
            Conectado
          </ToggleGroupItem>
          <ToggleGroupItem value="por-construir" className="px-3">
            Por construir
          </ToggleGroupItem>
        </ToggleGroup>
        {/* El recuento, escrito: filtrar sin saber cuántas quedan es ir a ciegas */}
        <p className="text-sm text-muted-foreground tabular-nums" aria-live="polite">
          {visibles.length} de {filas.length}
        </p>
      </div>

      {visibles.length === 0 && (
        <p className="rounded-xl bg-muted/50 px-4 py-6 text-center text-sm text-muted-foreground">
          Ninguna acción con esos filtros. Quita alguno o busca por la pantalla.
        </p>
      )}

      {AREAS.map((area) => {
        const del = visibles.filter((f) => f.area === area)
        if (del.length === 0) return null
        const Icono = ICONO_AREA[area]
        return (
          <section
            key={area}
            id={area}
            aria-labelledby={`${area}-t`}
            className="scroll-mt-20 space-y-3"
          >
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <Icono className="size-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 id={`${area}-t`} className="text-lg font-bold tracking-tight">
                  {AREA_INFO[area].titulo}
                  <span className="ml-2 text-sm font-normal text-muted-foreground tabular-nums">
                    {del.length}
                  </span>
                </h2>
                <p className="text-sm text-pretty text-muted-foreground">
                  {AREA_INFO[area].descripcion}
                </p>
              </div>
            </div>
            <ul className="divide-y overflow-hidden rounded-xl bg-card ring-1 ring-border">
              {del.map((f) => (
                <li key={f.id}>
                  <Link
                    href={hrefAccion(f.id)}
                    className="group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{f.titulo}</span>
                      <span className="block truncate text-sm text-muted-foreground">
                        <Texto>{f.resumen}</Texto>
                      </span>
                    </span>
                    <span className="hidden shrink-0 flex-wrap justify-end gap-1.5 md:flex">
                      {f.plan && (
                        <Badge variant="brand-subtle">Desde {PLAN_INFO[f.plan]}</Badge>
                      )}
                      {f.backend === "conectado" ? (
                        <Badge variant="success">Conectado</Badge>
                      ) : f.backend === "por-construir" ? (
                        <Badge variant="warning">Por construir</Badge>
                      ) : null}
                    </span>
                    <ArrowRight
                      className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
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
