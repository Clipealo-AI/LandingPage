"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { Kbd } from "@/components/ui/kbd"

export interface OpcionTarjeta<T extends string> {
  value: T
  title: string
  description?: string
  /** Icono o logo a la izquierda (decorativo). */
  icon?: React.ReactNode
  /** Insignia junto al título («Revisión»). */
  badge?: React.ReactNode
}

/** Teclas de las nueve primeras opciones, para `aria-keyshortcuts`. */
export const atajosDe = (n: number) =>
  Array.from({ length: Math.min(n, 9) }, (_, i) => String(i + 1)).join(" ")

/**
 * Opción única en tarjetas (tomas `objetivo`, `tipo-org`, `cuenta`): un
 * `RadioGroup` de Radix con foco itinerante (flechas) y «tap» automático al
 * elegir (`InteractionFeedback` suena con `role="radio"`).
 *
 * - `atajos`: es el grupo principal de la toma; `OnboardingFlow` elige la
 *   opción n con las teclas 1-9 (`data-atajos` + `data-opcion`) y lo declara en
 *   `aria-keyshortcuts`. El `Kbd` con el número solo se ve con puntero fino.
 * - Cada tarjeta se nombra con su título y se describe con su descripción.
 * - Foco y pulsación de `[data-button]`; elegida, borde y fondo `primary`.
 */
export function ChoiceCards<T extends string>({
  value,
  onValueChange,
  options,
  atajos = false,
  entrada = true,
  invalid,
  size = "md",
  className,
  ...aria
}: {
  value: T | null | undefined
  onValueChange: (value: T) => void
  options: readonly OpcionTarjeta<T>[]
  atajos?: boolean
  /** Marca `data-toma-entrada` (entrada escalonada de la toma). Fuera del flujo, `false`. */
  entrada?: boolean
  invalid?: boolean
  /** `sm`: tarjetas compactas en rejilla (muchas opciones). */
  size?: "md" | "sm"
  className?: string
  "aria-label"?: string
  "aria-labelledby"?: string
  "aria-describedby"?: string
}) {
  const id = React.useId()
  return (
    <RadioGroupPrimitive.Root
      data-slot="choice-cards"
      value={value ?? ""}
      onValueChange={(v) => onValueChange(v as T)}
      aria-invalid={invalid || undefined}
      data-atajos={atajos ? "" : undefined}
      aria-keyshortcuts={atajos ? atajosDe(options.length) : undefined}
      data-toma-entrada={entrada ? "" : undefined}
      className={cn("grid gap-2.5", className)}
      {...aria}
    >
      {options.map((o, i) => (
        <RadioGroupPrimitive.Item
          key={o.value}
          value={o.value}
          data-button=""
          data-opcion=""
          aria-labelledby={`${id}-${i}-t`}
          aria-describedby={o.description ? `${id}-${i}-d` : undefined}
          style={{ "--i": i } as React.CSSProperties}
          className={cn(
            "group/opcion relative flex w-full items-center gap-3 rounded-xl border border-border bg-card text-left text-card-foreground outline-none [--press:0.99] hover:border-primary/40 hover:bg-surface-hover disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground",
            size === "md" ? "min-h-16 p-4 @3xl/bienvenida:p-5" : "min-h-12 px-3.5 py-2.5"
          )}
        >
          {o.icon && (
            <span
              aria-hidden
              className={cn(
                "grid shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground group-data-[state=checked]/opcion:bg-primary group-data-[state=checked]/opcion:text-primary-foreground",
                size === "md" ? "size-10 [&_svg]:size-5" : "size-8 [&_svg]:size-4"
              )}
            >
              {o.icon}
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span
              id={`${id}-${i}-t`}
              className={cn(
                "flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold text-pretty",
                size === "md" ? "text-base" : "text-sm"
              )}
            >
              {o.title}
              {o.badge}
            </span>
            {o.description && (
              <span
                id={`${id}-${i}-d`}
                className="mt-0.5 block text-sm text-pretty text-muted-foreground"
              >
                {o.description}
              </span>
            )}
          </span>
          {atajos && i < 9 && (
            <Kbd aria-hidden className="hidden pointer-fine:inline-flex">
              {i + 1}
            </Kbd>
          )}
          <span
            aria-hidden
            className="grid size-5 shrink-0 place-items-center rounded-full border border-input bg-background text-primary-foreground group-data-[state=checked]/opcion:border-primary group-data-[state=checked]/opcion:bg-primary"
          >
            <Check className="size-3.5 opacity-0 group-data-[state=checked]/opcion:opacity-100" />
          </span>
        </RadioGroupPrimitive.Item>
      ))}
    </RadioGroupPrimitive.Root>
  )
}
