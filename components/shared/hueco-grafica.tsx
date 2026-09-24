import { cn } from "@/lib/utils"

/**
 * El sitio que ocupa una gráfica mientras llega.
 *
 * Mide lo mismo que ella para que no salte el layout, y es una caja quieta: un
 * pulso sería un efecto nuevo que además tendría que seguir viéndose con
 * «reducir movimiento». Vive aparte de las gráficas porque lo usan las de la
 * app y las del backoffice, que no comparten textos.
 */
export function Hueco({ className }: { className?: string }) {
  return <div aria-hidden className={cn("w-full rounded-lg bg-muted/40", className)} />
}
