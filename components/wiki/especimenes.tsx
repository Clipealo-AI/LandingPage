"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import type { TokenMarca } from "@/lib/wiki/tipos"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/brand/logo"
import { BrandGlow, PatternIsotipos } from "@/components/brand/patterns"
import { DsCanvas, Swatch } from "@/components/design-system/primitives"

/**
 * Los especímenes de la guía de marca: se pintan con los componentes y los
 * tokens de verdad. Si alguien cambia el naranja o el logo, la wiki cambia con
 * ellos; una captura se quedaría vieja al día siguiente.
 */

/** Los tokens de una sección: los de color como muestra, el resto con su valor calculado. */
export function Tokens({ tokens }: { tokens: TokenMarca[] }) {
  const colores = tokens.filter((t) => t.variable.startsWith("color-"))
  const otros = tokens.filter((t) => !t.variable.startsWith("color-"))
  return (
    <div className="space-y-6">
      {colores.length > 0 && (
        <div className="grid [grid-template-columns:repeat(auto-fill,minmax(9rem,1fr))] gap-4">
          {colores.map((t) => (
            <Swatch
              key={t.variable}
              token={`--${t.variable}`}
              name={t.nombre}
              note={t.uso}
            />
          ))}
        </div>
      )}
      {otros.length > 0 && (
        <dl className="divide-y rounded-xl ring-1 ring-border">
          {otros.map((t) => (
            <TokenFila key={t.variable} token={t} />
          ))}
        </dl>
      )}
    </div>
  )
}

function TokenFila({ token }: { token: TokenMarca }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [valor, setValor] = React.useState("")
  React.useEffect(() => {
    if (!ref.current) return
    setValor(getComputedStyle(ref.current).getPropertyValue(`--${token.variable}`).trim())
  }, [token.variable])
  return (
    <div
      ref={ref}
      className="grid gap-1 px-4 py-3 sm:grid-cols-[14rem_12rem_1fr] sm:items-baseline"
    >
      <dt className="font-medium">{token.nombre}</dt>
      <dd className="font-mono text-xs break-all text-primary">
        --{token.variable}
        {valor && <span className="block text-muted-foreground">{valor}</span>}
      </dd>
      <dd className="text-sm text-pretty text-muted-foreground">{token.uso}</dd>
    </div>
  )
}

/** El logotipo en sus tres tamaños, a color y en monocromo, sobre claro y sobre tinta. */
export function EspecimenLogo() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <DsCanvas className="flex flex-col items-start gap-6">
        <Logo size="lg" />
        <Logo size="md" />
        <Logo size="sm" />
        <div className="flex items-center gap-4">
          <Logo iconOnly size="lg" />
          <Logo iconOnly size="md" tone="mono" className="text-foreground" />
        </div>
      </DsCanvas>
      <DsCanvas dark className="flex flex-col items-start gap-6">
        <Logo size="lg" className="text-ink-50" />
        <Logo size="md" tone="mono" className="text-ink-50" />
        <Logo iconOnly size="lg" />
      </DsCanvas>
    </div>
  )
}

/** Las tres familias con su papel: la display solo para titulares de marketing. */
export function EspecimenTipografia() {
  return (
    <div className="space-y-4">
      <DsCanvas dark className="relative overflow-hidden">
        <p className="display text-[clamp(2rem,5vw,3.5rem)] leading-[1.05] text-ink-50">
          Tus mejores momentos, listos para publicar.
        </p>
        <p className="mt-3 font-mono text-xs text-ink-300">
          Climate Crisis · .display · solo marketing
        </p>
      </DsCanvas>
      <DsCanvas className="space-y-3">
        <p className="text-3xl font-bold tracking-tight">Crea tu cuenta</p>
        <p className="max-w-prose text-pretty">
          DM Sans en todo lo demás: títulos de componente en negrita, texto de lectura en
          regular. A tamaño de tarjeta la display es ilegible, por eso nunca sale de un
          titular.
        </p>
        <p className="font-mono text-xs text-muted-foreground">DM Sans · font-sans</p>
      </DsCanvas>
      <DsCanvas className="space-y-2">
        <p className="font-mono text-2xl tabular-nums" data-slot="timecode">
          00:12:48.320
        </p>
        <p className="font-mono text-xs text-muted-foreground">
          Geist Mono · timecodes, códigos y rutas · tabular-nums para que no bailen
        </p>
      </DsCanvas>
    </div>
  )
}

/** El patrón de isotipos y el halo, sobre la tinta del escenario. */
export function EspecimenPatrones() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="relative isolate h-56 overflow-hidden rounded-xl bg-ink-950 ring-1 ring-border">
        <PatternIsotipos opacity={0.18} fade="bottom" />
        <p className="absolute bottom-3 left-4 font-mono text-xs text-ink-300">
          PatternIsotipos
        </p>
      </div>
      <div className="relative isolate h-56 overflow-hidden rounded-xl bg-ink-950 ring-1 ring-border">
        <BrandGlow />
        <p className="absolute bottom-3 left-4 font-mono text-xs text-ink-300">
          BrandGlow
        </p>
      </div>
    </div>
  )
}

/** La marca de recorte: las cuatro esquinas naranjas que enmarcan lo que importa. */
export function EspecimenRecorte() {
  const esquinas = [
    "top-0 left-0 rounded-tl-[6px] border-r-0 border-b-0",
    "top-0 right-0 rounded-tr-[6px] border-b-0 border-l-0",
    "bottom-0 left-0 rounded-bl-[6px] border-t-0 border-r-0",
    "right-0 bottom-0 rounded-br-[6px] border-t-0 border-l-0",
  ]
  return (
    <DsCanvas dark>
      <div className="relative w-fit px-5 py-4">
        {esquinas.map((c) => (
          <span
            key={c}
            aria-hidden
            className={cn("absolute size-7 border-4 border-brand", c)}
          />
        ))}
        <p className="display text-3xl leading-tight text-ink-50">El clip seleccionado</p>
      </div>
    </DsCanvas>
  )
}

/** Las variantes de botón, con la naranja sola: una por vista. */
export function EspecimenBotones() {
  return (
    <DsCanvas className="flex flex-wrap items-center gap-3">
      <Button variant="brand">Acción principal</Button>
      <Button>Estructura</Button>
      <Button variant="outline">Secundaria</Button>
      <Button variant="secondary">Suave</Button>
      <Button variant="ghost">Discreta</Button>
      <Button variant="destructive">Destructiva</Button>
      <Button variant="link">Enlace</Button>
      <Button variant="outline" disabled>
        Deshabilitada
      </Button>
    </DsCanvas>
  )
}

/**
 * El espécimen de una sección, si lo tiene. Se reconoce por palabras del id
 * porque las secciones las escribe la guía y pueden renombrarse.
 */
export function EspecimenDe({ id }: { id: string }) {
  if (/logo/.test(id)) return <EspecimenLogo />
  if (/tipograf/.test(id)) return <EspecimenTipografia />
  if (/patron|recurso|grafic/.test(id)) return <EspecimenPatrones />
  if (/recorte/.test(id)) return <EspecimenRecorte />
  if (/boton|componente/.test(id)) return <EspecimenBotones />
  return null
}
