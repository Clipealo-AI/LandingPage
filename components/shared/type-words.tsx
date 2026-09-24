import * as React from "react"

/**
 * Espacios que no parten línea (sin separar, cifra y fino sin separar): se
 * quedan dentro de la palabra. `\s` los incluye, así que un `split(/\s+/)`
 * convertiría «18 %» en dos palabras con un espacio normal entre medias y la
 * cifra podría quedar sola al final de una línea.
 */
const SEPARADOR = /([^\S   ]+)/

export interface Palabra {
  palabra: string
  /** El espacio que la sigue tal cual venía en el texto; vacío en la última. */
  separador: string
}

/**
 * Parte un texto plano en palabras conservando cada separador original. Recorta
 * los extremos; un texto vacío no tiene palabras. Determinista: el servidor y el
 * cliente obtienen lo mismo.
 */
export function trocearPalabras(texto: string): Palabra[] {
  const limpio = texto.trim()
  if (!limpio) return []
  // Con el grupo de captura, `split` alterna palabra, separador, palabra…
  const trozos = limpio.split(SEPARADOR)
  const palabras: Palabra[] = []
  for (let i = 0; i < trozos.length; i += 2) {
    palabras.push({ palabra: trozos[i], separador: trozos[i + 1] ?? "" })
  }
  return palabras
}

export interface TypeWordsProps {
  /** Texto plano ya traducido. Nunca `t.rich` ni variables ICU con marcado. */
  text: string
  /** Cuándo empieza la primera palabra desde que el grupo arranca (`--m-at`). */
  at?: string
  /** Separación entre palabras (`--stagger`). */
  stagger?: string
}

/**
 * Frase que aparece palabra a palabra (E10), con un fundido por palabra: no es
 * un tecleo (no hay letras sueltas ni cursor). Solo opacidad: un `translate` no
 * se aplica a un `span` en línea y convertirlo en `inline-block` cambiaría el
 * reparto de líneas de `text-balance`. Por eso los espacios quedan fuera de los
 * `span`.
 *
 * - Va dentro del bloque de texto (`<p>`) y de un grupo de movimiento
 *   (`data-motion-group`): el grupo decide cuándo corre (`.m-anim.m-word` de
 *   `app/motion/base.css`). Fuera de un grupo, o sin JS, la frase se ve entera.
 * - Con «reducir movimiento» se queda igual: ya es solo opacidad.
 * - El lector de pantalla lee la frase una vez (`sr-only`); las palabras
 *   animadas van con `aria-hidden`. Al copiar, la frase sale duplicada.
 * - Componente sin estado ni hooks: vale en servidor y en cliente.
 */
export function TypeWords({ text, at = "250ms", stagger = "70ms" }: TypeWordsProps) {
  const palabras = trocearPalabras(text)

  return (
    <>
      <span className="sr-only">{text}</span>
      <span
        aria-hidden
        style={{ "--m-at": at, "--stagger": stagger } as React.CSSProperties}
      >
        {palabras.map(({ palabra, separador }, i) => (
          <React.Fragment key={i}>
            <span className="m-anim m-word" style={{ "--i": i } as React.CSSProperties}>
              {palabra}
            </span>
            {separador}
          </React.Fragment>
        ))}
      </span>
    </>
  )
}
