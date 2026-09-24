"use client"

import { CalendarClock } from "lucide-react"
import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { necesitanAtencion } from "@/lib/agenda"
import { useAgenda } from "@/hooks/use-agenda"
import { primerNombre, useNombreCuenta } from "@/hooks/use-cuenta"
import { PageHeader, type PageHeaderProps } from "@/components/shared/page-header"

/**
 * Cabecera del panel con el saludo. Es la isla de cliente de una página
 * estática: el nombre sale de la cuenta (`use-cuenta`), que en el servidor y en
 * la hidratación es la demo «Ana Ruiz» y después la de quien se registró.
 *
 * Si hay publicaciones que no salieron, el saludo lo dice en una línea con
 * enlace al Calendario: no una tarjeta nueva ni una segunda acción naranja.
 * `necesitanAtencion` deriva del «ahora» de la agenda (`AHORA_AGENDA`), igual
 * en el servidor y en el navegador, así que la línea no aparece ni desaparece
 * al hidratar.
 */
export function DashboardGreeting({
  children,
  ...props
}: Omit<PageHeaderProps, "title">) {
  const t = useTranslations("app.dashboard")
  const nombre = useNombreCuenta()
  const { entradas, cuentas } = useAgenda()
  const pendientes = necesitanAtencion(entradas, cuentas).length

  return (
    <PageHeader title={t("greeting", { name: primerNombre(nombre) })} {...props}>
      {pendientes > 0 && (
        <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted-foreground">
          <CalendarClock aria-hidden className="size-4 shrink-0" />
          {t("tocaPublicar.aviso", { n: pendientes })}
          <Link
            href="/calendario"
            className="rounded-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {t("tocaPublicar.enlace")}
          </Link>
        </p>
      )}
      {children}
    </PageHeader>
  )
}
