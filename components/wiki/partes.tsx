import type * as React from "react"

import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import type { ErrorDoc } from "@/lib/wiki/tipos"
import { Badge } from "@/components/ui/badge"
import { Texto } from "@/components/wiki/texto"

/** Un apartado de ficha: título pequeño, contenido y ancla propia para enlazarlo. */
export function Apartado({
  id,
  titulo,
  children,
  className,
}: {
  id: string
  titulo: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-t`}
      className={cn("scroll-mt-20 space-y-3", className)}
    >
      <h2 id={`${id}-t`} className="text-base font-bold tracking-tight">
        {titulo}
      </h2>
      {children}
    </section>
  )
}

/**
 * Una ruta de pantalla de la app. Las fijas son enlaces de verdad; las que
 * llevan un parámetro (`/campanas/[id]`) se escriben tal cual, porque no hay
 * una a la que llevar.
 */
export function RutaApp({ ruta, etiqueta }: { ruta: string; etiqueta: string }) {
  const dinamica = ruta.includes("[")
  const [pathname, consulta] = ruta.split("?")
  const query = consulta ? Object.fromEntries(new URLSearchParams(consulta)) : undefined
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2">
      <span className="font-medium">{etiqueta}</span>
      {dinamica ? (
        <code className="font-mono text-xs text-muted-foreground">{ruta}</code>
      ) : (
        <Link
          href={query ? { pathname, query } : pathname}
          className="font-mono text-xs text-primary underline-offset-4 hover:underline"
        >
          {ruta}
        </Link>
      )}
    </span>
  )
}

/** Los errores, con su código, cuándo salen, la frase que ve la persona y si bloquean. */
export function TablaErrores({
  errores,
  conHttp = false,
}: {
  errores: ErrorDoc[]
  conHttp?: boolean
}) {
  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-border">
      <table className="w-full min-w-[36rem] text-sm">
        <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Código</th>
            {conHttp && <th className="px-3 py-2 font-medium">HTTP</th>}
            <th className="px-3 py-2 font-medium">Cuándo</th>
            <th className="px-3 py-2 font-medium">Efecto</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {errores.map((e) => (
            <tr key={`${e.codigo}-${e.http ?? ""}`} className="align-top">
              <td className="px-3 py-2.5">
                <code className="font-mono text-xs">{e.codigo}</code>
                {e.frase && (
                  <span className="mt-1 block font-mono text-[11px] text-muted-foreground">
                    {e.frase}
                  </span>
                )}
              </td>
              {conHttp && (
                <td className="px-3 py-2.5 font-mono text-xs tabular-nums">
                  {e.http ?? "—"}
                </td>
              )}
              <td className="px-3 py-2.5 text-pretty text-muted-foreground">
                <Texto>{e.cuando}</Texto>
              </td>
              <td className="px-3 py-2.5">
                {e.bloquea === true ? (
                  <Badge variant="destructive">Bloquea</Badge>
                ) : e.bloquea === false ? (
                  <Badge variant="warning">Avisa</Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Dónde está en el código: rutas del repositorio, en mono, listas para copiar. */
export function Origenes({ origenes }: { origenes: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {origenes.map((o) => (
        <li key={o}>
          <code className="rounded-md bg-muted px-2 py-1 font-mono text-xs">{o}</code>
        </li>
      ))}
    </ul>
  )
}

/** Lista con viñetas de reglas o garantías. */
export function Lista({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-pretty">
      {items.map((x) => (
        <li key={x} className="flex gap-2.5">
          <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
          <span>
            <Texto>{x}</Texto>
          </span>
        </li>
      ))}
    </ul>
  )
}
