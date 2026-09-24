import * as React from "react"
import { useLocale } from "next-intl"

import { cn } from "@/lib/utils"
import { countryName, type CountryCode } from "@/lib/countries"

/**
 * Banderas dibujadas a mano, simplificadas (sin escudos): a 16 px un escudo
 * es ruido. Van en SVG y no en emoji porque Windows pinta las banderas emoji
 * como dos letras. Los colores son los de cada bandera, no tokens del
 * sistema: es la misma excepción que los logotipos de las redes sociales.
 * Añadir un país = añadirlo a COUNTRY_CODES y dibujarlo aquí.
 */
const BANDERAS: Record<CountryCode, React.ReactNode> = {
  PE: (
    <>
      <rect width="4" height="3" fill="#D91023" />
      <rect x="1.333" width="1.334" height="3" fill="#fff" />
    </>
  ),
  MX: (
    <>
      <rect width="4" height="3" fill="#006847" />
      <rect x="1.333" width="1.334" height="3" fill="#fff" />
      <rect x="2.667" width="1.333" height="3" fill="#CE1126" />
      <circle cx="2" cy="1.5" r="0.32" fill="#8C6D2E" opacity="0.85" />
    </>
  ),
  CO: (
    <>
      <rect width="4" height="1.5" fill="#FCD116" />
      <rect y="1.5" width="4" height="0.75" fill="#003893" />
      <rect y="2.25" width="4" height="0.75" fill="#CE1126" />
    </>
  ),
  CL: (
    <>
      <rect width="4" height="1.5" fill="#fff" />
      <rect y="1.5" width="4" height="1.5" fill="#D52B1E" />
      <rect width="1.5" height="1.5" fill="#0039A6" />
      <path
        d="M.75.35l.14.42h.44l-.36.27.14.43-.36-.27-.36.27.14-.43-.36-.27h.44z"
        fill="#fff"
      />
    </>
  ),
  AR: (
    <>
      <rect width="4" height="3" fill="#74ACDF" />
      <rect y="1" width="4" height="1" fill="#fff" />
      <circle cx="2" cy="1.5" r="0.3" fill="#F6B40E" />
    </>
  ),
  ES: (
    <>
      <rect width="4" height="3" fill="#AA151B" />
      <rect y="0.75" width="4" height="1.5" fill="#F1BF00" />
    </>
  ),
  EC: (
    <>
      <rect width="4" height="1.5" fill="#FFDD00" />
      <rect y="1.5" width="4" height="0.75" fill="#034EA2" />
      <rect y="2.25" width="4" height="0.75" fill="#ED1C24" />
    </>
  ),
  BR: (
    <>
      <rect width="4" height="3" fill="#009C3B" />
      <path d="M2 .3 3.72 1.5 2 2.7.28 1.5z" fill="#FFDF00" />
      <circle cx="2" cy="1.5" r="0.66" fill="#002776" />
      {/* La franja blanca del globo, sin el lema: a 16 px sería ruido */}
      <path
        d="M1.42 1.57Q2 1.18 2.58 1.47"
        fill="none"
        stroke="#fff"
        strokeWidth="0.14"
        strokeLinecap="round"
      />
    </>
  ),
  US: (
    <>
      <rect width="4" height="3" fill="#fff" />
      {[0, 2, 4, 6].map((i) => (
        <rect key={i} y={(i * 3) / 7} width="4" height={3 / 7} fill="#B22234" />
      ))}
      <rect width="1.6" height={(3 * 4) / 7} fill="#3C3B6E" />
    </>
  ),
}

/**
 * Nombre de un país en el idioma activo: `const pais = useCountryName()` y
 * `pais("PE")`. Sirve en cliente y en servidor síncrono; fuera de un componente,
 * `countryName(code, locale)` de `lib/countries.ts`.
 */
export function useCountryName() {
  const locale = useLocale()
  return (code: CountryCode) => countryName(code, locale)
}

export interface CountryFlagProps extends React.ComponentProps<"svg"> {
  code: CountryCode
  /** Por defecto la bandera es decorativa y el nombre va al lado o en `title`. */
  decorative?: boolean
}

export function CountryFlag({
  code,
  decorative = true,
  className,
  ...props
}: CountryFlagProps) {
  const pais = useCountryName()
  const nombre = pais(code)
  return (
    <svg
      viewBox="0 0 4 3"
      className={cn(
        "inline-block h-3 w-4 shrink-0 rounded-[2px] ring-1 ring-border ring-inset",
        className
      )}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : nombre}
      {...props}
    >
      {!decorative && <title>{nombre}</title>}
      {BANDERAS[code]}
    </svg>
  )
}

/** Bandera + nombre (o código) en línea, para celdas y listas. */
export function CountryBadge({
  code,
  short = false,
  className,
}: {
  code: CountryCode
  /** «PE» en vez de «Perú» cuando no cabe. */
  short?: boolean
  className?: string
}) {
  const pais = useCountryName()
  const nombre = pais(code)
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 whitespace-nowrap", className)}
      title={nombre}
    >
      <CountryFlag code={code} />
      <span>{short ? code : nombre}</span>
    </span>
  )
}
