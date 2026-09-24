import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Isotipo — tres brackets de recorte y una esquina solida.
 * El cuadrado naranja es "el momento seleccionado dentro del frame": es la
 * unica pieza de la marca que siempre lleva acento.
 *
 * Los brackets heredan `currentColor`, asi que el color se decide con una
 * utilidad de texto en el contenedor (`text-foreground`, `text-white`...) y
 * el isotipo funciona en claro y oscuro sin variantes duplicadas.
 */
export interface IsotipoProps extends React.ComponentProps<"svg"> {
  /** `mono` pinta tambien la esquina con currentColor (sellos, favicon 1 tinta). */
  tone?: "brand" | "mono"
  /** Oculta el `<title>` cuando el logotipo de al lado ya nombra la marca. */
  decorative?: boolean
}

export function Isotipo({
  tone = "brand",
  decorative = false,
  className,
  ...props
}: IsotipoProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={cn("size-8 shrink-0", className)}
      role={decorative ? "presentation" : "img"}
      aria-hidden={decorative || undefined}
      {...props}
    >
      {!decorative && <title>Clipealo</title>}
      <g
        stroke="currentColor"
        strokeWidth={5.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M13 4.75H7.5A2.75 2.75 0 0 0 4.75 7.5V13" />
        <path d="M4.75 19v5.5a2.75 2.75 0 0 0 2.75 2.75H13" />
        <path d="M19 27.25h5.5a2.75 2.75 0 0 0 2.75-2.75V19" />
      </g>
      <rect
        x="18"
        y="4"
        width="10"
        height="10"
        rx="3"
        className={tone === "brand" ? "fill-brand" : "fill-current"}
      />
    </svg>
  )
}

export interface LogoProps extends React.ComponentProps<"span"> {
  tone?: IsotipoProps["tone"]
  /** `md` es el tamaño de header; `lg` para footers y pantallas de bienvenida. */
  size?: "sm" | "md" | "lg"
  /** Solo isotipo: sidebar colapsada, avatares, favicon. */
  iconOnly?: boolean
}

const LOGO_SIZE = {
  sm: { icon: "size-6", word: "text-lg", gap: "gap-2" },
  md: { icon: "size-7", word: "text-2xl", gap: "gap-2.5" },
  lg: { icon: "size-9", word: "text-3xl", gap: "gap-3" },
} as const

export function Logo({
  tone = "brand",
  size = "md",
  iconOnly = false,
  className,
  ...props
}: LogoProps) {
  const s = LOGO_SIZE[size]

  if (iconOnly) {
    return <Isotipo tone={tone} className={cn(s.icon, className)} />
  }

  return (
    <span className={cn("inline-flex items-center", s.gap, className)} {...props}>
      <Isotipo tone={tone} className={s.icon} decorative />
      <span className={cn("display leading-none", s.word)}>Clipealo</span>
    </span>
  )
}

export interface CropFrameProps extends React.ComponentProps<"div"> {
  /** Grosor y tamaño de las esquinas. `lg` para titulares de hero. */
  size?: "sm" | "md" | "lg"
  /** Separacion de las esquinas respecto al contenido. */
  inset?: boolean
  /** Deja de pintar las esquinas sin desmontar el contenedor (estado no seleccionado). */
  active?: boolean
  /**
   * Las esquinas entran al montarse: `animate-crop-in` (450 ms, `backwards`),
   * escalonadas. Con «reducir movimiento», `fade-soft` de 200 ms en su sitio
   * (`[data-crop-animate]` en app/motion/onboarding.css). Quitarla a mitad
   * deja las esquinas en su estado final.
   */
  animateIn?: boolean
}

const CROP_SIZE = {
  sm: { box: "size-3.5", border: "border-2", radius: 4, offset: "-1px" },
  md: { box: "size-6", border: "border-[3px]", radius: 6, offset: "-6px" },
  lg: { box: "size-10", border: "border-4", radius: 8, offset: "-8px" },
} as const

/**
 * Marca de recorte (modulo 05). Envuelve cualquier contenido con las cuatro
 * esquinas naranja. Es decorativa: nunca lleva texto ni foco propio.
 *
 * Cada esquina lleva `data-crop-corner` («tl», «tr», «bl», «br»): así el
 * movimiento de la landing las cierra desde fuera (`.m-crop-corners` en
 * app/motion/base.css) o las anima con la Web Animations API sin tocar este
 * componente. No cambia nada visible.
 */
export function CropFrame({
  size = "md",
  inset = false,
  active = true,
  animateIn = false,
  className,
  children,
  ...props
}: CropFrameProps) {
  const s = CROP_SIZE[size]
  const offset = inset ? "0px" : s.offset

  const corner = cn(
    "pointer-events-none absolute border-brand transition-opacity duration-300",
    s.box,
    s.border,
    active ? "opacity-100" : "opacity-0",
    animateIn && "animate-crop-in"
  )

  const r = `${s.radius}px`

  return (
    <div
      className={cn("relative", className)}
      data-crop-animate={animateIn ? "" : undefined}
      {...props}
    >
      <span
        aria-hidden
        data-crop-corner="tl"
        className={cn(corner, "border-r-0 border-b-0")}
        style={{ top: offset, left: offset, borderTopLeftRadius: r }}
      />
      <span
        aria-hidden
        data-crop-corner="tr"
        className={cn(corner, "border-b-0 border-l-0")}
        style={{ top: offset, right: offset, borderTopRightRadius: r }}
      />
      <span
        aria-hidden
        data-crop-corner="bl"
        className={cn(corner, "border-t-0 border-r-0")}
        style={{ bottom: offset, left: offset, borderBottomLeftRadius: r }}
      />
      <span
        aria-hidden
        data-crop-corner="br"
        className={cn(corner, "border-t-0 border-l-0")}
        style={{ bottom: offset, right: offset, borderBottomRightRadius: r }}
      />
      {children}
    </div>
  )
}
