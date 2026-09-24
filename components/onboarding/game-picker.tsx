"use client"

import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import { Search, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { alternarEleccion } from "@/lib/onboarding"
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/input-group"
import { ChipGroup, type CambioChip } from "@/components/onboarding/chip-group"

const sinTildes = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()

/** Palabras sin tildes ni signos: «Call of Duty: Mobile» → call, of, duty, mobile. */
const palabras = (s: string) =>
  sinTildes(s)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)

/**
 * Busca en un catálogo pequeño (juegos, ligas, géneros) por su etiqueta, sin
 * tildes, mayúsculas ni signos, y por siglas («lol» → League of Legends, «cs2»
 * → Counter-Strike 2, «codm» → Call of Duty: Mobile). Orden: empieza igual,
 * empieza una palabra o las siglas, contiene; a igualdad, el orden del catálogo.
 * Pura: en producción la sustituye la API de categorías (Twitch, Kick).
 */
export function buscarEnCatalogo<T extends string>(
  catalogo: readonly T[],
  etiquetaDe: (id: T) => string,
  texto: string
): T[] {
  const q = palabras(texto).join("")
  if (!q) return []
  const puntua = (id: T) => {
    const w = palabras(etiquetaDe(id))
    const junto = w.join("")
    const siglas = w.map((p) => (/^\d+$/.test(p) ? p : p[0])).join("")
    if (junto.startsWith(q)) return 3
    if (w.some((p) => p.startsWith(q)) || siglas.startsWith(q)) return 2
    if (junto.includes(q) || palabras(id).join("").includes(q)) return 1
    return 0
  }
  return catalogo
    .map((id, i) => ({ id, i, p: puntua(id) }))
    .filter((x) => x.p > 0)
    .sort((a, b) => b.p - a.p || a.i - b.i)
    .map((x) => x.id)
}

export interface GamePickerProps<T extends string> {
  value: readonly T[]
  onValueChange: (value: T[], cambio: CambioChip<T>) => void
  /** Los chips que se ven sin buscar (los 8 más jugados de su país). */
  destacados: readonly T[]
  /** Todo lo que se puede encontrar con el buscador. */
  catalogo: readonly T[]
  /** Nombre propio o etiqueta traducida de cada id. */
  etiquetaDe: (id: T) => string
  /** Respaldo cuando la búsqueda no encuentra nada («Otro juego»). */
  otro?: T
  max?: number
  onLleno?: (max: number) => void
  /** Textos ya traducidos por quien lo usa. */
  textos: {
    /** Etiqueta y placeholder del buscador («Busca un juego»). */
    buscar: string
    /** Nombre de la lista de resultados. */
    resultados: string
    /** «No lo encontramos.» */
    vacio: string
    /** Para lectores de pantalla, en un resultado ya elegido. */
    elegido: string
    /** Botón que borra la búsqueda. */
    borrar: string
  }
  /** Enter con el buscador vacío (en la toma: continuar). */
  onEnterVacio?: () => void
  /** `data-toma-entrada` en los chips. Fuera del flujo, `false`. */
  entrada?: boolean
  className?: string
  "aria-labelledby"?: string
  "aria-describedby"?: string
}

/**
 * Chips con los destacados y, debajo, un buscador para el resto del catálogo
 * (§4.3): juegos en la toma `nichos` al marcar gaming; ligas y géneros en las
 * micropreguntas M3. Se carga con `dynamic()`.
 *
 * - Lo elegido desde el buscador que no estaba entre los destacados se suma a
 *   la fila de chips, marcado: se quita desde ahí o volviendo a elegirlo.
 * - Máximo con `alternarEleccion`: con el grupo lleno no se añade, no suena y se
 *   llama a `onLleno` (la región viva lo dice).
 * - Sonido: los chips hacen «tap» al marcar (`ChipGroup`); elegir en el buscador
 *   va en silencio, como escribir en él (§5.12).
 * - Teclado del buscador: flechas, Enter elige (vacío: `onEnterVacio`), Esc
 *   borra. `data-toma-enter="propio"`.
 */
export function GamePicker<T extends string>({
  value,
  onValueChange,
  destacados,
  catalogo,
  etiquetaDe,
  otro,
  max,
  onLleno,
  textos,
  onEnterVacio,
  entrada = true,
  className,
  ...aria
}: GamePickerProps<T>) {
  const [q, setQ] = React.useState("")
  const input = React.useRef<HTMLInputElement>(null)

  const resultados = React.useMemo(
    () => buscarEnCatalogo(catalogo, etiquetaDe, q),
    [catalogo, etiquetaDe, q]
  )
  const abierta = q.trim().length > 0

  // cmdk fija `aria-expanded="true"`; aquí el estado real (ver creator-search)
  React.useLayoutEffect(() => {
    input.current?.setAttribute("aria-expanded", String(abierta))
  })

  const opciones = [...destacados, ...value.filter((v) => !destacados.includes(v))]

  const elegir = (id: T) => {
    const r = alternarEleccion(value, id, { max })
    if (r.cambio === "lleno") {
      onLleno?.(max ?? 0)
      return
    }
    onValueChange(r.seleccion, { id, tipo: r.cambio })
    setQ("")
  }

  const alTeclear = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.nativeEvent.isComposing) return
    if (e.key === "Enter" && !q.trim()) {
      e.preventDefault()
      onEnterVacio?.()
    } else if (e.key === "Escape" && q) {
      e.preventDefault()
      setQ("")
    }
  }

  const item = (id: T) => {
    const marcado = value.includes(id)
    return (
      <CommandItem
        key={id}
        value={id}
        onSelect={() => elegir(id)}
        data-checked={marcado ? "true" : undefined}
        className="min-h-11 rounded-lg px-3 @[100rem]/bienvenida:text-base"
      >
        {etiquetaDe(id)}
        {marcado && <span className="sr-only">{textos.elegido}</span>}
      </CommandItem>
    )
  }

  return (
    <div className={cn("space-y-3", className)}>
      <ChipGroup<T>
        value={value}
        onValueChange={onValueChange}
        max={max}
        onLleno={onLleno}
        entrada={entrada}
        options={opciones.map((id) => ({ value: id, label: etiquetaDe(id) }))}
        {...aria}
      />

      <Command
        shouldFilter={false}
        loop
        label={textos.buscar}
        onKeyDown={alTeclear}
        data-toma-enter="propio"
        data-buscador-catalogo=""
        className="size-auto overflow-visible rounded-none! bg-transparent p-0 text-foreground"
      >
        <InputGroup className="h-11 rounded-xl bg-card @md/bienvenida:max-w-sm @[100rem]/bienvenida:h-12">
          <InputGroupAddon>
            <Search aria-hidden />
          </InputGroupAddon>
          <CommandPrimitive.Input
            ref={input}
            value={q}
            onValueChange={setQ}
            placeholder={textos.buscar}
            data-slot="input-group-control"
            enterKeyHint="search"
            autoCapitalize="off"
            className="h-full min-w-0 flex-1 bg-transparent px-2 text-base outline-none placeholder:text-muted-foreground"
          />
          {q && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-sm"
                aria-label={textos.borrar}
                onClick={() => {
                  setQ("")
                  input.current?.focus()
                }}
              >
                <X aria-hidden />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>

        <CommandList
          hidden={!abierta}
          label={textos.resultados}
          className="mt-2 max-h-72 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-sm @md/bienvenida:max-w-sm"
        >
          {resultados.length > 0 ? (
            resultados.map(item)
          ) : otro ? (
            <CommandGroup heading={textos.vacio}>{item(otro)}</CommandGroup>
          ) : (
            <p role="presentation" className="px-3 py-3 text-sm text-muted-foreground">
              {textos.vacio}
            </p>
          )}
        </CommandList>
      </Command>
    </div>
  )
}
