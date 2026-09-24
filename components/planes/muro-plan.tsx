"use client"

import { Check, Lock, type LucideIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

/**
 * La puerta de una vista entera: lo que ve quien no tiene el plan que esa vista
 * necesita. Se dice qué se gana, no solo que no se puede.
 *
 * No traduce nada suyo salvo el botón: los textos los pasa quien la usa, con su
 * propio `useTranslations` y su namespace literal. Así el Calendario conserva
 * sus frases (`calendario.muro`) y el tipado de next-intl no se pierde por un
 * namespace guardado en una variable.
 *
 * Su hermano por tipo de cuenta es `components/campanas/agency-gate.tsx`: perfil
 * y plan son ejes distintos y nunca se apilan.
 *
 * Esto no es seguridad: es una puerta de interfaz. En producción, quien decide
 * qué puede hacer una cuenta es el servidor.
 */
export function MuroPlan({
  titulo,
  descripcion,
  ventajas,
  nota,
  icono: Icono = Lock,
  className,
}: {
  titulo: string
  descripcion: string
  /** Lo que se gana, ya traducido y en orden. */
  ventajas: readonly string[]
  /** Lo que Clipealo NO hace, si la vista se presta a malentenderlo. */
  nota?: string
  icono?: LucideIcon
  className?: string
}) {
  const t = useTranslations("pricing")
  return (
    // `mx-auto`: el muro es el cuerpo entero de su página, y sin esto a 2560 px
    // dejaba 2.100 px de blanco a su derecha
    <Card className={cn("@container/muro mx-auto max-w-2xl", className)}>
      <CardHeader>
        <span className="grid size-10 place-items-center rounded-lg bg-secondary text-secondary-foreground">
          <Icono className="size-5" aria-hidden />
        </span>
        <CardTitle>{titulo}</CardTitle>
        <CardDescription>{descripcion}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-2 text-sm @lg/muro:grid-cols-2 @lg/muro:gap-x-6">
          {ventajas.map((v) => (
            <li key={v} className="flex items-start gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
              {v}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="flex-col items-start gap-3">
        <Button variant="brand" asChild>
          <Link href="/precios">{t("gate.cta")}</Link>
        </Button>
        {nota && <p className="text-sm text-muted-foreground">{nota}</p>}
      </CardFooter>
    </Card>
  )
}
