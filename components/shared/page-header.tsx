import * as React from "react"

import { cn } from "@/lib/utils"

export interface PageHeaderProps extends React.ComponentProps<"div"> {
  title: string
  description?: React.ReactNode
  /** Botones de la vista. En movil bajan a su propia fila. */
  actions?: React.ReactNode
  eyebrow?: React.ReactNode
}

/** Cabecera de pagina de aplicacion. Fija la jerarquia tipografica del producto. */
export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  className,
  children,
  ...props
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)} {...props}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          {eyebrow && (
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {eyebrow}
            </p>
          )}
          {/* Hasta dos líneas: un nombre de campaña largo no puede quedarse en «Liga de las Estr…» */}
          <h1 className="line-clamp-2 text-xl font-bold tracking-tight text-balance sm:text-2xl">
            {title}
          </h1>
          {description && (
            <p className="max-w-2xl text-sm text-balance text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  )
}
