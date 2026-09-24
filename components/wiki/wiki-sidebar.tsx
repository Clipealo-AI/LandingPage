"use client"

import { ArrowLeft, Braces, House, Palette } from "lucide-react"

import { Link, usePathname } from "@/i18n/navigation"
import { AREA_INFO } from "@/lib/wiki/areas"
import { AREAS, type Area } from "@/lib/wiki/tipos"
import { Logo } from "@/components/brand/logo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { ICONO_AREA } from "@/components/wiki/iconos"

/**
 * La barra de la wiki: la guía, las acciones por área y la API por área.
 *
 * Es la misma pieza que la barra de la app —mismo `Sidebar`, mismos tamaños,
 * misma hoja en el móvil— para que la wiki se lea como parte del producto y
 * no como otra web. Los recuentos llegan del servidor: el catálogo entero no
 * viaja al navegador.
 */
export function WikiSidebar({
  acciones,
  endpoints,
}: {
  acciones: Record<Area, number>
  endpoints: Record<Area, number>
}) {
  const pathname = usePathname()
  const activa = (href: string) => pathname === href

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <Link href="/docs" className="flex h-9 items-center gap-2 px-1.5">
          <Logo size="sm" />
          <span className="text-sm font-semibold text-muted-foreground">Wiki</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Guía</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={activa("/docs")}>
                  <Link href="/docs">
                    <House />
                    <span>Inicio</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={activa("/docs/marca")}>
                  <Link href="/docs/marca">
                    <Palette />
                    <span>Marca</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith("/docs/api")}>
                  <Link href="/docs/api">
                    <Braces />
                    <span>Referencia de la API</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Acciones</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {AREAS.map((area) => {
                const Icono = ICONO_AREA[area]
                return (
                  <SidebarMenuItem key={area}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith(`/docs/acciones/${area}/`)}
                    >
                      <Link href={`/docs/acciones#${area}`}>
                        <Icono />
                        <span>{AREA_INFO[area].titulo}</span>
                      </Link>
                    </SidebarMenuButton>
                    {/* Cuántas hay, escrito: la barra dice dónde hay más documentado */}
                    <SidebarMenuBadge className="tabular-nums">
                      {acciones[area]}
                    </SidebarMenuBadge>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>API por área</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {AREAS.filter((a) => endpoints[a] > 0).map((area) => (
                <SidebarMenuItem key={area}>
                  <SidebarMenuButton
                    asChild
                    size="sm"
                    isActive={pathname.startsWith(`/docs/api/${area}/`)}
                  >
                    <Link href={`/docs/api#${area}`}>
                      <span>{AREA_INFO[area].titulo}</span>
                    </Link>
                  </SidebarMenuButton>
                  <SidebarMenuBadge className="tabular-nums">
                    {endpoints[area]}
                  </SidebarMenuBadge>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/dashboard">
                <ArrowLeft />
                <span>Volver a la app</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
