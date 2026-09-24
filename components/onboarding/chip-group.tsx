"use client"

import * as React from "react"
import { Check, Plus } from "lucide-react"
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { alternarEleccion } from "@/lib/onboarding"
import { Kbd } from "@/components/ui/kbd"
import { atajosDe } from "@/components/onboarding/choice-cards"

export interface OpcionChip<T extends string> {
  value: T
  label: string
  /** Logo o icono a la izquierda (decorativo: el nombre ya va en `label`). */
  icon?: React.ReactNode
}

export type CambioChip<T extends string> = {
  id: T
  tipo: "marcado" | "desmarcado"
}

/**
 * Selección múltiple en chips (nichos, redes, idiomas, plataformas…) sobre el
 * `ToggleGroup` de Radix: foco itinerante con flechas, Espacio marca o
 * desmarca el chip enfocado.
 *
 * - `max`: al intentar pasar del máximo no se añade, no suena y se llama a
 *   `onLleno(max)` (la toma lo dice en la región viva).
 * - `excluyentes` («Aún no lo sé», «Aún no tengo cuenta», «No hago directos»):
 *   marcarlo deja solo ese; marcar otro lo quita. Se pintan con borde discontinuo.
 * - Sonido: «tap» solo al marcar (`data-sound` se lee en captura, antes del
 *   cambio); ni al desmarcar ni con el grupo lleno.
 * - `atajos`: grupo principal de la toma, teclas 1-9 (ver `ChoiceCards`).
 * - 44 px de alto como mínimo, foco y pulsación de `[data-button]`.
 */
export function ChipGroup<T extends string>({
  value,
  onValueChange,
  options,
  excluyentes = [],
  max,
  onLleno,
  atajos = false,
  entrada = true,
  sonido = true,
  invalid,
  className,
  ...aria
}: {
  value: readonly T[]
  onValueChange: (value: T[], cambio: CambioChip<T>) => void
  options: readonly OpcionChip<T>[]
  excluyentes?: readonly T[]
  max?: number
  onLleno?: (max: number) => void
  atajos?: boolean
  /** Marca `data-toma-entrada` (entrada escalonada de la toma). Fuera del flujo, `false`. */
  entrada?: boolean
  /** «tap» al marcar. Añadir o quitar un creador va en silencio (§5.12). */
  sonido?: boolean
  invalid?: boolean
  className?: string
  "aria-label"?: string
  "aria-labelledby"?: string
  "aria-describedby"?: string
}) {
  const marcados = value.filter((v) => !excluyentes.includes(v)).length
  const lleno = max !== undefined && marcados >= max

  const cambiar = (siguiente: string[]) => {
    // Radix da la lista nueva: el chip pulsado es el que entra o sale
    const id = (siguiente.find((v) => !value.includes(v as T)) ??
      value.find((v) => !siguiente.includes(v))) as T | undefined
    if (id === undefined) return
    const r = alternarEleccion(value, id, { max, excluyentes })
    if (r.cambio === "lleno") {
      onLleno?.(max ?? 0)
      return
    }
    onValueChange(r.seleccion, { id, tipo: r.cambio })
  }

  return (
    <ToggleGroupPrimitive.Root
      type="multiple"
      data-slot="chip-group"
      value={[...value]}
      onValueChange={cambiar}
      data-atajos={atajos ? "" : undefined}
      aria-keyshortcuts={atajos ? atajosDe(options.length) : undefined}
      data-invalid={invalid || undefined}
      data-toma-entrada={entrada ? "" : undefined}
      className={cn("flex flex-wrap gap-2 @3xl/bienvenida:gap-2.5", className)}
      {...aria}
    >
      {options.map((o, i) => {
        const pulsado = value.includes(o.value)
        const excluyente = excluyentes.includes(o.value)
        const sinSitio = !pulsado && !excluyente && lleno
        return (
          <ToggleGroupPrimitive.Item
            key={o.value}
            value={o.value}
            data-button=""
            data-chip=""
            data-opcion=""
            data-excluyente={excluyente || undefined}
            data-lleno={sinSitio || undefined}
            data-sound={sonido && !pulsado && !sinSitio ? "tap" : undefined}
            style={{ "--i": i } as React.CSSProperties}
            className={cn(
              "group/chip inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground outline-none hover:border-primary/40 hover:bg-surface-hover data-[state=on]:border-primary data-[state=on]:bg-accent data-[state=on]:text-accent-foreground @[100rem]/bienvenida:min-h-12 @[100rem]/bienvenida:text-base",
              excluyente && "border-dashed",
              sinSitio && "text-muted-foreground"
            )}
          >
            {/* Un hueco fijo a la izquierda: marcar no cambia el ancho ni reordena la fila */}
            <span
              aria-hidden
              className="relative -ml-1.5 grid size-5 shrink-0 place-items-center [&_svg]:size-5"
            >
              {o.icon ? (
                <>
                  {o.icon}
                  <span className="absolute -right-1 -bottom-1 hidden size-3.5 place-items-center rounded-full bg-primary text-primary-foreground ring-2 ring-accent group-data-[state=on]/chip:grid">
                    <Check className="size-2.5!" strokeWidth={3} />
                  </span>
                </>
              ) : (
                <>
                  <Plus className="size-4! text-muted-foreground group-data-[state=on]/chip:hidden" />
                  <Check className="hidden size-4! text-primary group-data-[state=on]/chip:block" />
                </>
              )}
            </span>
            <span className="truncate">{o.label}</span>
            {atajos && i < 9 && (
              <Kbd aria-hidden className="-mr-1.5 hidden pointer-fine:inline-flex">
                {i + 1}
              </Kbd>
            )}
          </ToggleGroupPrimitive.Item>
        )
      })}
    </ToggleGroupPrimitive.Root>
  )
}
