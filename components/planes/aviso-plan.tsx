"use client"

import { Lock } from "lucide-react"
import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import { Link } from "@/i18n/navigation"

/**
 * «Esto es del plan X», en línea: el motivo escrito debajo de un control
 * apagado, con el enlace a los planes. La frase la escribe quien la usa (viene
 * de un código del dominio traducido en su espacio); aquí solo vive la forma,
 * para que se lea igual bajo «Solicitar entrar» que bajo «Subir clip».
 *
 * Lleva `id` porque el botón apagado la referencia con `aria-describedby`: un
 * `disabled` sale del orden de tabulación y, sin esa atadura, el motivo no se
 * alcanza con el teclado. Y `role="status"` porque aparece al vuelo cuando se
 * cambia de plan desde el menú, sin recargar.
 *
 * `text-sm` y no `text-xs`: el motivo por el que un botón está apagado no es una
 * nota al pie, y a 12 px el gris no llega a 4,5:1.
 */
export function AvisoPlan({
  id,
  motivo,
  alinear = "start",
  className,
}: {
  id?: string
  /** Por qué está apagado, ya traducido y con el nombre del plan dentro. */
  motivo: string
  /** `end` donde la acción va a la derecha (cabecera del detalle). */
  alinear?: "start" | "end"
  className?: string
}) {
  const t = useTranslations("pricing")
  return (
    <p
      id={id}
      role="status"
      className={cn(
        // `flex-wrap` es lo que lo salva a 390 px dentro de una tarjeta de
        // campaña: el enlace baja solo a su línea
        "flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm text-pretty text-muted-foreground",
        alinear === "end" && "justify-end text-right",
        className
      )}
    >
      <Lock className="size-3.5 shrink-0" aria-hidden />
      <span>{motivo}</span>
      <Link
        href="/precios"
        className="font-medium text-primary underline-offset-4 hover:underline"
      >
        {t("gate.cta")}
      </Link>
    </p>
  )
}
