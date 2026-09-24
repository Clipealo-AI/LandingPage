import * as React from "react"

import { cn } from "@/lib/utils"
import { retardosDe, type PalabraRetardo, type Ritmo } from "@/lib/onboarding"

/** Duración de la entrada de cada palabra (`toma-palabra`, §5.3). */
export const DURACION_PALABRA_MS = 200

/** Fin de la escritura: la última palabra termina de entrar. */
export const finEscritura = (frases: readonly (readonly PalabraRetardo[])[]) =>
  Math.max(0, ...frases.flat().map((p) => p.retardo)) + DURACION_PALABRA_MS

/**
 * Cursor de la línea (§5.4):
 * - `fin`: avanza palabra a palabra y parpadea 3 veces en la última (la pregunta);
 * - `sigue`: avanza, pero la frase continúa en otra línea (el saludo): sin parpadeo;
 * - `no`: sin cursor (reacciones y registro del render).
 */
export type CursorLinea = "fin" | "sigue" | "no"

/**
 * Copia animada de una frase: una palabra por `span[data-palabra]` con
 * `--retardo` y `--dura` de `retardosDe`, y los espacios fuera de los `span`
 * (las líneas se cortan con normalidad). Ocupa su sitio desde el primer pintado,
 * aunque las palabras aún no se vean: sin CLS. Sin el CSS de
 * `app/motion/onboarding.css` se ve completa (regla 8).
 *
 * Va con `aria-hidden`: la frase completa la lee quien la pinta en un `sr-only`
 * (lo hace `TypeLine`). Sin estado ni hooks: vale en servidor y en cliente.
 */
export function PalabrasToma({
  palabras,
  completo,
  cursor = "fin",
  className,
}: {
  palabras: readonly PalabraRetardo[]
  /** Todo terminado desde ya (vista antes, acelerada o aprendida la prisa). */
  completo: boolean
  cursor?: CursorLinea
  className?: string
}) {
  const ultima = palabras.length - 1
  return (
    <span
      aria-hidden="true"
      data-toma-texto=""
      data-completo={completo ? "" : undefined}
      data-cursor={cursor}
      className={className}
    >
      {palabras.map((p, i) => (
        <React.Fragment key={i}>
          {i > 0 && " "}
          <span
            data-palabra=""
            data-fin={cursor === "fin" && i === ultima ? "" : undefined}
            style={
              {
                "--retardo": `${p.retardo}ms`,
                "--dura": `${p.dura}ms`,
              } as React.CSSProperties
            }
          >
            {p.palabra}
          </span>
        </React.Fragment>
      ))}
    </span>
  )
}

/**
 * Línea que se escribe sola en el onboarding: la frase completa en `sr-only`
 * (el lector de pantalla la lee una vez, desde el primer pintado) y la copia
 * animada con `aria-hidden`.
 *
 * No es `TypeWords` de la landing (`components/shared/type-words.tsx`), que
 * depende de los grupos «al entrar en pantalla»: aquí la animación arranca al
 * montarse la línea (la toma se monta con `key={paso}`) y el ritmo sale de
 * `retardosDe`, una función pura (§5.3).
 *
 * Con «reducir movimiento» la frase se ve entera desde el primer fotograma y
 * cada palabra se enciende de gris a su color con el mismo retardo (karaoke).
 */
export function TypeLine({
  texto,
  palabras,
  ritmo,
  completo,
  cursor = "fin",
  className,
}: {
  texto: string
  /** Retardos ya calculados (varias frases seguidas); si no, `retardosDe(texto, ritmo)`. */
  palabras?: readonly PalabraRetardo[]
  ritmo?: Partial<Ritmo>
  completo: boolean
  cursor?: CursorLinea
  className?: string
}) {
  const lista = palabras ?? retardosDe(texto, ritmo)
  return (
    <>
      <span className="sr-only">{texto}</span>
      <PalabrasToma
        palabras={lista}
        completo={completo}
        cursor={cursor}
        className={cn(className)}
      />
    </>
  )
}
