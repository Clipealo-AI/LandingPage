"use client"

import * as React from "react"

import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { AvisosBoton } from "@/components/app/avisos-boton"
import { CommandMenu } from "@/components/app/command-menu"
import { ThemeToggle } from "@/components/shared/theme-toggle"

export interface Crumb {
  /** Ya traducida: la pone cada página. */
  label: string
  /**
   * Una ruta estática («/proyectos») o lo que devuelve `hrefDinamico`: sin eso
   * la miga a un proyecto saldría sin traducir en inglés y en portugués.
   */
  href?: string | { pathname: string; query?: Record<string, string> }
}

export interface AppTopbarProps extends React.ComponentProps<"header"> {
  crumbs?: Crumb[]
  /** Acciones especificas de la pagina, alineadas a la derecha. */
  actions?: React.ReactNode
  /** La paleta ⌘K conoce las rutas del producto; el backoffice no la usa. */
  showCommand?: boolean
}

export function AppTopbar({
  crumbs = [],
  actions,
  showCommand = true,
  className,
  ...props
}: AppTopbarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-(--spacing-topbar) shrink-0 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur-md sm:px-4",
        className
      )}
      {...props}
    >
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 !h-4" />

      {/* Recorte solo en horizontal y con hueco: `overflow-hidden` cortaba el foco */}
      <Breadcrumb className="-mx-1 min-w-0 overflow-x-clip px-1">
        <BreadcrumbList className="flex-nowrap">
          {crumbs.map((crumb, i) => {
            const last = i === crumbs.length - 1
            return (
              // Por índice y no por etiqueta: un clip puede llamarse igual
              // que su proyecto y dos claves iguales rompen la lista
              <React.Fragment key={i}>
                <BreadcrumbItem className={cn(!last && "hidden sm:flex")}>
                  {last || !crumb.href ? (
                    <BreadcrumbPage className="truncate">{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={crumb.href}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!last && <BreadcrumbSeparator className="hidden sm:block" />}
              </React.Fragment>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        {showCommand && <CommandMenu className="hidden md:flex" />}
        {actions}
        <AvisosBoton />
        <ThemeToggle />
      </div>
    </header>
  )
}
