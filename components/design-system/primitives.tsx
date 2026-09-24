"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/** Bloque de una seccion del sistema. */
export function DsSection({
  id,
  title,
  intro,
  children,
}: {
  id: string
  title: string
  intro?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t pt-12">
      <h2 className="display text-[clamp(1.5rem,3.5vw,2.25rem)]">{title}</h2>
      {intro && (
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-pretty text-muted-foreground">
          {intro}
        </p>
      )}
      <div className="mt-8 space-y-10">{children}</div>
    </section>
  )
}

/** Sub-bloque con titulo pequeño y, opcionalmente, la regla de uso. */
export function DsBlock({
  title,
  rule,
  className,
  children,
}: {
  title: string
  rule?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        {rule && <p className="mt-1 max-w-2xl text-xs text-muted-foreground">{rule}</p>}
      </div>
      {children}
    </div>
  )
}

/** Lienzo con fondo de tarjeta donde se muestran ejemplos vivos. */
export function DsCanvas({
  className,
  dark = false,
  children,
}: {
  className?: string
  dark?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "rounded-xl p-5 ring-1 ring-border sm:p-6",
        dark ? "bg-stage" : "bg-card",
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * Muestra de color. Lee el valor calculado del navegador en lugar de repetir el
 * hex a mano: si alguien cambia el token, la documentacion cambia con el.
 */
export function Swatch({
  token,
  name,
  note,
  className,
}: {
  token: string
  name: string
  note?: string
  className?: string
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [value, setValue] = React.useState("")

  React.useEffect(() => {
    if (!ref.current) return
    setValue(getComputedStyle(ref.current).backgroundColor)
  }, [token])

  return (
    <div className={cn("min-w-0", className)}>
      <div
        ref={ref}
        className="h-14 w-full rounded-lg ring-1 ring-border ring-inset"
        style={{ backgroundColor: `var(${token})` }}
      />
      <p className="mt-1.5 truncate text-xs font-medium">{name}</p>
      <p className="truncate font-mono text-[10px] text-muted-foreground">
        {value || token}
      </p>
      {note && <p className="mt-0.5 text-[10px] text-muted-foreground">{note}</p>}
    </div>
  )
}
