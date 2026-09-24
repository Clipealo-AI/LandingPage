"use client"

import * as React from "react"

import { Link } from "@/i18n/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { Buscador } from "@/components/wiki/buscador"

export interface Miga {
  label: string
  href?: string
}

/**
 * La cabecera de la wiki: las migas, el buscador y el tema, con la altura de
 * la de la app. Las migas las da cada página, como en la app (`AppTopbar`): así
 * el título de una ficha sale ya en el HTML sin tener que traer el índice
 * entero para buscarlo.
 */
export function WikiTopbar({ migas }: { migas: Miga[] }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/85 px-(--gutter-app) backdrop-blur-md">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mr-1 data-[orientation=vertical]:h-4"
      />
      <Breadcrumb className="min-w-0 flex-1">
        <BreadcrumbList className="flex-nowrap">
          {migas.map((m, i) => (
            <React.Fragment key={`${m.label}-${i}`}>
              {i > 0 && <BreadcrumbSeparator className="max-sm:hidden" />}
              <BreadcrumbItem
                className={i < migas.length - 1 ? "max-sm:hidden" : "min-w-0"}
              >
                {m.href && i < migas.length - 1 ? (
                  <BreadcrumbLink asChild>
                    <Link href={m.href}>{m.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="truncate">{m.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <Buscador />
      <ThemeToggle />
    </header>
  )
}
