"use client"

import * as React from "react"
import { BookOpen, Braces, Palette, Search, Workflow } from "lucide-react"

import { useRouter } from "@/i18n/navigation"
import type { EntradaIndice } from "@/lib/wiki/indice"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Kbd } from "@/components/ui/kbd"

const GRUPOS = [
  { tipo: "area", titulo: "Áreas", icono: BookOpen },
  { tipo: "accion", titulo: "Acciones", icono: Workflow },
  { tipo: "endpoint", titulo: "API", icono: Braces },
  { tipo: "marca", titulo: "Marca", icono: Palette },
] as const

type Carga =
  | { estado: "cargando" }
  | { estado: "listo"; indice: EntradaIndice[] }
  | { estado: "error" }

const normal = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")

/**
 * Cada palabra tecleada tiene que estar entera, sin mirar tildes; en el título
 * cuenta más que en el resumen o en las claves. El difuso de cmdk puntuaba
 * letras sueltas repartidas por un texto largo: «lista blanca» sacaba primero
 * el área de Analíticas.
 */
function puntuar(_valor: string, busqueda: string, claves: string[] = []) {
  const palabras = normal(busqueda).split(/\s+/).filter(Boolean)
  if (palabras.length === 0) return 1
  const [titulo = "", ...resto] = claves.map(normal)
  const todo = `${titulo} ${resto.join(" ")}`
  if (!palabras.every((p) => todo.includes(p))) return 0
  const enTitulo = palabras.filter((p) => titulo.includes(p)).length
  return 0.2 + 0.8 * (enTitulo / palabras.length)
}

/**
 * El índice se pide una sola vez por visita y lo comparten todas las páginas:
 * la cabecera se vuelve a montar al navegar, la promesa no.
 */
let pedido: Promise<EntradaIndice[]> | null = null
function pedirIndice() {
  pedido ??= fetch("/wiki-indice.json").then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return r.json() as Promise<EntradaIndice[]>
  })
  // Si falla, que el siguiente intento vuelva a pedirlo
  pedido.catch(() => (pedido = null))
  return pedido
}

/**
 * El buscador de la wiki: ⌘K o «/» desde cualquier página.
 *
 * Busca en títulos, resúmenes, rutas de pantalla, ids y tipos de la API, así
 * que «/campanas», «Envio» o «retiro» llevan a la entrada que toca. Es la misma
 * paleta que la de la app (`cmdk`), con los mismos atajos.
 *
 * El índice llega aparte (`/wiki-indice.json`): se pide al pasar por encima del
 * botón o al abrir, y en local tarda menos de lo que se tarda en teclear.
 */
export function Buscador() {
  const [abierto, setAbierto] = React.useState(false)
  const [carga, setCarga] = React.useState<Carga>({ estado: "cargando" })
  const router = useRouter()

  const cargar = React.useCallback(() => {
    pedirIndice().then(
      (indice) => setCarga({ estado: "listo", indice }),
      () => setCarga({ estado: "error" })
    )
  }, [])

  React.useEffect(() => {
    if (abierto) cargar()
  }, [abierto, cargar])

  React.useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => {
      const enTexto = (e.target as HTMLElement | null)?.closest(
        "input, textarea, select, [contenteditable='true']"
      )
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !enTexto)) {
        e.preventDefault()
        setAbierto((v) => !v)
      }
    }
    window.addEventListener("keydown", alPulsar)
    return () => window.removeEventListener("keydown", alPulsar)
  }, [])

  const ir = (href: string) => {
    setAbierto(false)
    router.push(href)
  }

  return (
    <>
      {/* En el móvil, solo la lupa; con sitio, la caja entera con su atajo */}
      <Button
        variant="outline"
        aria-label="Buscar en la wiki"
        className="size-9 justify-center gap-2 px-0 text-muted-foreground sm:w-72 sm:justify-start sm:px-3"
        onClick={() => setAbierto(true)}
        onPointerEnter={cargar}
        onFocus={cargar}
      >
        <Search aria-hidden />
        <span className="hidden flex-1 text-left sm:inline">Buscar en la wiki…</span>
        <Kbd className="hidden sm:inline-flex">⌘K</Kbd>
      </Button>
      <CommandDialog
        open={abierto}
        onOpenChange={setAbierto}
        title="Buscar en la wiki"
        description="Acciones, endpoints, áreas y marca"
        filter={puntuar}
      >
        <CommandInput placeholder="Una acción, una ruta, un tipo, un token…" />
        <CommandList className="max-h-[min(28rem,70vh)]">
          {carga.estado === "listo" ? (
            <CommandEmpty>
              Nada con ese nombre. Prueba con la pantalla o el verbo.
            </CommandEmpty>
          ) : (
            <p role="status" className="py-6 text-center text-sm text-muted-foreground">
              {carga.estado === "cargando"
                ? "Cargando el índice…"
                : "No se pudo cargar el índice. Cierra el buscador y vuelve a abrirlo."}
            </p>
          )}
          {GRUPOS.map((g) => {
            if (carga.estado !== "listo") return null
            const del = carga.indice.filter((x) => x.tipo === g.tipo)
            if (del.length === 0) return null
            return (
              <CommandGroup key={g.tipo} heading={g.titulo}>
                {del.map((x) => (
                  <CommandItem
                    key={`${x.tipo}:${x.id}`}
                    value={`${x.tipo}:${x.id}`}
                    keywords={[x.titulo, x.detalle, x.claves]}
                    onSelect={() => ir(x.href)}
                  >
                    <g.icono aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span
                        className={
                          x.tipo === "endpoint"
                            ? "block truncate font-mono text-xs"
                            : "block truncate"
                        }
                      >
                        {x.titulo}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {x.detalle}
                      </span>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )
          })}
        </CommandList>
      </CommandDialog>
    </>
  )
}
