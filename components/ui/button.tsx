import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

import type { SoundName } from "@/lib/sound"

const buttonVariants = cva(
  // Deshabilitado: los rellenos (azul, naranja…) pasan a `muted` en vez de bajar
  // la opacidad del boton entero, que dejaba el texto en 2:1 y casi no se leia;
  // los planos (outline, ghost, link) si se atenuan, que ahi el texto aguanta.
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary-hover disabled:border-transparent disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none",
        /**
         * Naranja. Reservado a la accion principal de la vista: como maximo
         * un boton `brand` visible a la vez. Si aparece dos veces, deja de
         * significar "esto es lo que hay que pulsar".
         */
        brand:
          "bg-brand text-brand-foreground shadow-brand-sm hover:bg-brand-hover hover:shadow-brand active:shadow-xs disabled:border-transparent disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none",
        "brand-subtle":
          "bg-brand-subtle text-brand-subtle-foreground hover:bg-brand-subtle/70 disabled:border-transparent disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none",
        outline:
          "border-border bg-background hover:bg-surface-hover hover:text-foreground active:bg-surface-active disabled:opacity-50 aria-expanded:bg-surface-hover aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] disabled:border-transparent disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-surface-hover hover:text-foreground active:bg-surface-active disabled:opacity-50 aria-expanded:bg-surface-hover aria-expanded:text-foreground",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 disabled:border-transparent disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline disabled:opacity-50",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        /** Escala de marketing: objetivo tactil comodo y texto a 16 px. */
        xl: "h-12 gap-2 rounded-xl px-6 text-base has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5 [&_svg:not([class*='size-'])]:size-5",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
        "icon-xl": "size-12 rounded-xl [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/**
 * `sound` y `effect` declaran la respuesta a la pulsación; la ejecuta
 * `InteractionFeedback` con un listener delegado, así que el botón sigue
 * pudiendo renderizarse en el servidor. Por defecto solo la variante `brand`
 * (la acción principal de la vista) suena («pop») y se encuadra con la marca de
 * recorte. `"none"` quita cualquiera de los dos en un botón concreto.
 */
function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  sound,
  effect,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    sound?: SoundName | "none"
    effect?: "crop" | "none"
  }) {
  const Comp = asChild ? Slot.Root : "button"
  const principal = variant === "brand"
  const sonido = sound ?? (principal ? "pop" : undefined)
  const efecto = effect ?? (principal ? "crop" : undefined)

  return (
    <Comp
      // `data-slot` lo pisa cualquier Trigger con `asChild` (dropdown, tooltip,
      // sheet…); `data-button` no, y es el que usa globals.css para foco y pulsación
      data-button=""
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-sound={sonido === "none" ? undefined : sonido}
      data-effect={efecto === "none" ? undefined : efecto}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button,  }
