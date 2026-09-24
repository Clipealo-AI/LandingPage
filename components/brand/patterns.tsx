import * as React from "react"

import { cn } from "@/lib/utils"

type LayerProps = React.ComponentProps<"div"> & {
  /** Fundido en los bordes para que el patron no choque contra el corte. */
  fade?: "none" | "bottom" | "edges" | "top"
}

const FADE_MASK: Record<NonNullable<LayerProps["fade"]>, string | undefined> = {
  none: undefined,
  top: "linear-gradient(to bottom, transparent, #000 35%)",
  bottom: "linear-gradient(to bottom, #000 55%, transparent)",
  edges: "radial-gradient(ellipse 75% 65% at 50% 45%, #000 40%, transparent 100%)",
}

function Layer({ fade = "none", className, style, ...props }: LayerProps) {
  const mask = FADE_MASK[fade]
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{ ...(mask ? { maskImage: mask, WebkitMaskImage: mask } : {}), ...style }}
      {...props}
    />
  )
}

/**
 * Patron 04 — isotipos sueltos. Va siempre sobre `bg-stage` / `bg-ink-950`;
 * sobre fondo claro el naranja al 18 % se convierte en ruido.
 */
export function PatternIsotipos({
  className,
  opacity = 0.18,
  ...props
}: LayerProps & { opacity?: number }) {
  return (
    <Layer className={cn("pattern-isotipos", className)} style={{ opacity }} {...props} />
  )
}

/** Patron 04 — lineas horizontales. Solo sobre bloques naranja llenos. */
export function PatternLineas({ className, ...props }: LayerProps) {
  return <Layer className={cn("pattern-lineas opacity-40", className)} {...props} />
}

/** Rejilla tecnica de fondo. Por defecto se funde hacia los bordes. */
export function GridBackdrop({ fade = "edges", className, ...props }: LayerProps) {
  return (
    <Layer fade={fade} className={cn("pattern-grid opacity-60", className)} {...props} />
  )
}

/** Halo suave de marca detras de un hero o una tarjeta destacada. */
export function BrandGlow({
  className,
  tone = "brand",
  ...props
}: LayerProps & { tone?: "brand" | "primary" }) {
  return (
    <Layer
      className={cn("overflow-hidden", className)}
      style={{
        background:
          tone === "brand"
            ? "radial-gradient(60% 60% at 50% 0%, color-mix(in oklab, var(--color-brand-500) 26%, transparent), transparent 70%)"
            : "radial-gradient(60% 60% at 50% 0%, color-mix(in oklab, var(--color-blue-500) 26%, transparent), transparent 70%)",
      }}
      {...props}
    />
  )
}
