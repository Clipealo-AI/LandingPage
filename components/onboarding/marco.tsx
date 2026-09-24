import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Geometría de `/bienvenida`, la misma para el esqueleto y para el flujo (sin
 * saltos al hidratar). Contenedor `@container/bienvenida`:
 *
 * - Desde `@5xl` (64 rem), dos columnas `5fr / 7fr` a todo el alto: a la
 *   izquierda la barra y la Mesa (pregunta, controles y acciones, bloque de
 *   lectura centrado); a la derecha el Monitor en tinta, fijo mientras la Mesa
 *   se desplaza.
 * - Desde `@5xl`, la toma (`[data-toma]`) se centra en vertical dentro de la
 *   Mesa con `my-auto` y el aire de arriba y abajo se recorta: el sobrante se
 *   reparte en vez de acumularse bajo «Continuar». El timeline se queda arriba
 *   (no es la toma) y una toma más alta que la pantalla no se mueve: los
 *   márgenes automáticos solo reparten espacio libre.
 * - Por debajo, una columna: la barra, la tarjeta mini fija arriba y la Mesa.
 * - `ancho` (render y resultado): una columna centrada a todo el ancho, sin Monitor.
 *
 * Componente sin estado: sirve en servidor (esqueleto) y en cliente (flujo).
 */
export function MarcoBienvenida({
  barra,
  monitor,
  mini,
  ancho = false,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  barra: React.ReactNode
  /** Columna de tinta desde `@5xl`. */
  monitor?: React.ReactNode
  /** Tarjeta mini por debajo de `@5xl`. */
  mini?: React.ReactNode
  ancho?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      id="bienvenida"
      className={cn(
        "@container/bienvenida flex min-h-dvh flex-col bg-background pb-[env(safe-area-inset-bottom)] text-foreground",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "grid flex-1",
          !ancho && monitor && "@5xl/bienvenida:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
        )}
      >
        <div className="flex min-w-0 flex-col">
          {barra}
          {!ancho && mini}
          <main
            id="contenido"
            className={cn(
              "flex flex-1 flex-col px-4 pt-6 pb-10 @3xl/bienvenida:px-8 @[100rem]/bienvenida:px-14",
              ancho
                ? "@5xl/bienvenida:px-10 @5xl/bienvenida:pt-10"
                : "@5xl/bienvenida:pb-6"
            )}
          >
            <div
              className={cn(
                "mx-auto flex w-full flex-1 flex-col",
                ancho
                  ? "max-w-[112rem]"
                  : "max-w-176 @[140rem]/bienvenida:max-w-192 @5xl/bienvenida:[&>[data-toma]]:my-auto"
              )}
            >
              {children}
            </div>
          </main>
        </div>
        {!ancho && monitor && (
          <div className="relative hidden @5xl/bienvenida:block">{monitor}</div>
        )}
      </div>
    </div>
  )
}

/**
 * Barra superior: marca, timecode de la toma y, a la derecha, idioma y
 * «Hacerlo luego». Con `pl-[env(safe-area-inset-left)]` para los notch.
 */
export function BarraBienvenida({
  marca,
  centro,
  acciones,
}: {
  marca: React.ReactNode
  centro?: React.ReactNode
  acciones?: React.ReactNode
}) {
  return (
    <header className="grid h-14 shrink-0 grid-cols-[auto_1fr_auto] items-center gap-3 px-4 @3xl/bienvenida:px-8 @[100rem]/bienvenida:px-14">
      <div className="flex items-center">{marca}</div>
      <div className="flex min-w-0 items-center justify-center">{centro}</div>
      <div className="flex items-center justify-end gap-1">{acciones}</div>
    </header>
  )
}
