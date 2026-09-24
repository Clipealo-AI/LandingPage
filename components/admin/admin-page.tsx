import * as React from "react"
import { useLocale, useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import type { MonthKey } from "@/lib/admin/types"
import { conMes, mesEnEnlaces } from "@/lib/admin/enlaces"
import { useFormat } from "@/hooks/use-format"
import { AppTopbar, type Crumb } from "@/components/app/app-topbar"
import { MonthPicker } from "@/components/admin/month-picker"
import { INTL_TAG } from "@/components/admin/textos"
import { PageHeader } from "@/components/shared/page-header"
import { Badge } from "@/components/ui/badge"

export interface AdminPageProps {
  crumbs: Crumb[]
  title: string
  description?: React.ReactNode
  /**
   * El mes que se está mirando. Sin él no se pinta el selector: Disputas y
   * Mercado lo enseñaban sin leerlo, así que elegir agosto escribía `?mes=` en
   * la URL, el desplegable volvía solo a septiembre y ningún dato cambiaba.
   */
  month?: MonthKey
  months: MonthKey[]
  current: MonthKey
  updatedAt: string
  timeZone: string
  /** Día de corte si el mes está en curso. */
  mtd: { dia: number; diasMes: number } | null
  actions?: React.ReactNode
  children: React.ReactNode
}

/**
 * Marco de todas las páginas del backoffice: barra superior sin paleta ⌘K,
 * selector de mes a la derecha y cabecera con la marca temporal. La etiqueta
 * «hasta hoy» avisa de que el mes en curso se compara con los mismos días del
 * anterior, no con el mes entero.
 */
export function AdminPage({
  crumbs,
  title,
  description,
  month,
  months,
  current,
  updatedAt,
  timeZone,
  mtd,
  actions,
  children,
}: AdminPageProps) {
  const t = useTranslations("admin.page")
  const f = useFormat()
  const locale = useLocale()
  // El mes elegido viaja en los enlaces; el actual no se escribe
  const mes = month ? mesEnEnlaces(month, current) : null
  const actualizado = new Intl.DateTimeFormat(INTL_TAG[locale], {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Lima",
  }).format(new Date(updatedAt))

  return (
    <>
      <AppTopbar
        showCommand={false}
        crumbs={[
          { label: t("crumb"), href: conMes("/admin", mes) },
          // Las del admin son siempre estáticas: `conMes` recibe texto
          ...crumbs.map((c) =>
            typeof c.href === "string" ? { ...c, href: conMes(c.href, mes) } : c
          ),
        ]}
        actions={
          month ? <MonthPicker months={months} value={month} current={current} /> : null
        }
      />

      {/* `@container/admin` aquí y no en cada página: las consultas
          `@4xl/admin` de los paneles colgaban de un contenedor que solo
          declaraban dos páginas, así que en las otras diez eran CSS muerto */}
      <div className="@container/admin container-app space-y-8 py-6">
        <PageHeader
          title={title}
          description={description}
          actions={actions}
          eyebrow={
            month ? (
              <span className="flex flex-wrap items-center gap-2 normal-case">
                <span>{f.month(month, { capital: true })}</span>
                {mtd ? (
                  <Badge variant="secondary" className="normal-case">
                    {t("mtd", mtd)}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="normal-case">
                    {t("closed")}
                  </Badge>
                )}
                <span className="text-muted-foreground/80">
                  {t("updated", { fecha: actualizado, zona: timeZone })}
                </span>
              </span>
            ) : (
              // Sin mes, la marca temporal sola: lo demás hablaría de un
              // periodo que esta página no mira
              <span className="text-muted-foreground/80 normal-case">
                {t("updated", { fecha: actualizado, zona: timeZone })}
              </span>
            )
          }
        />
        {children}
      </div>
    </>
  )
}

/** Sección con título y, opcionalmente, un enlace o acción a la derecha. */
export function AdminSection({
  id,
  title,
  description,
  aside,
  children,
  className,
}: {
  id?: string
  title: string
  description?: React.ReactNode
  aside?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  const headingId = id ? `${id}-titulo` : undefined
  return (
    // `min-w-0`: como hijo de una rejilla, sin esto la sección crece hasta el
    // ancho de su tabla y desborda la página en móvil
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn("min-w-0", className ?? "space-y-4")}
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0 space-y-0.5">
          <h2 id={headingId} className="text-lg font-bold tracking-tight">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-balance text-muted-foreground">{description}</p>
          )}
        </div>
        {aside && <div className="flex shrink-0 items-center gap-2">{aside}</div>}
      </div>
      {children}
    </section>
  )
}
