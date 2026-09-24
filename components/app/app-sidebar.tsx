"use client"

import * as React from "react"
import {
  BarChart3,
  CalendarClock,
  FolderOpen,
  GraduationCap,
  LayoutDashboard,
  LifeBuoy,
  Megaphone,
  Scissors,
  Settings,
  Sparkles,
  Upload,
  Wallet,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { Link, usePathname } from "@/i18n/navigation"
import { minutosUsados } from "@/lib/mock-data"
import { useFormat } from "@/hooks/use-format"
import { usePlan } from "@/hooks/use-plan"
import { useNombrePlan } from "@/components/planes/nombre-plan"
import { Logo } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
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
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { UserNav } from "@/components/app/user-nav"

/** Las claves de `app.nav` que usa la barra, escritas: así el texto se comprueba. */
type ClaveNav =
  | "dashboard"
  | "projects"
  | "operations"
  | "calendar"
  | "analytics"
  | "campaigns"
  | "learn"
  | "wallet"
  | "settings"
  | "help"

type ClaveGrupo = "work" | "earn" | "account"

interface ItemNav {
  href: string
  id: ClaveNav
  icon: LucideIcon
  /** Rutas que también lo encienden, aunque cuelguen de otro sitio. */
  tambien?: string[]
  badge?: string
}

/** `id` es la clave de `app.nav`; las etiquetas salen de los mensajes. */
const NAV: { id: ClaveGrupo; items: ItemNav[] }[] = [
  {
    id: "work",
    items: [
      { href: "/dashboard", id: "dashboard", icon: LayoutDashboard },
      // El estudio cuelga de un proyecto aunque su dirección no lo diga:
      // sin esto, editar un clip dejaba la barra sin nada iluminado
      { href: "/proyectos", id: "projects", icon: FolderOpen, tambien: ["/studio"] },
      { href: "/operaciones", id: "operations", icon: Scissors },
      { href: "/calendario", id: "calendar", icon: CalendarClock },
      { href: "/analiticas", id: "analytics", icon: BarChart3 },
    ],
  },
  {
    id: "earn",
    items: [
      { href: "/campanas", id: "campaigns", icon: Megaphone },
      { href: "/formacion", id: "learn", icon: GraduationCap },
      { href: "/wallet", id: "wallet", icon: Wallet },
    ],
  },
  {
    id: "account",
    items: [
      { href: "/ajustes", id: "settings", icon: Settings },
      { href: "/ayuda", id: "help", icon: LifeBuoy },
    ],
  },
] as const

export function AppSidebar() {
  const t = useTranslations("app")
  const f = useFormat()
  // Ruta interna en español y sin prefijo («/campanas/[id]»): compara igual en los tres idiomas
  const pathname = usePathname()
  const { state } = useSidebar()
  const collapsed = state === "collapsed"
  const { plan } = usePlan()
  const nombrePlan = useNombrePlan()
  const usados = minutosUsados(plan.minutos)
  const incluidos = plan.minutos
  const pctUsed = Math.round((usados / incluidos) * 100)

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <Link
          href="/dashboard"
          aria-label={t("sidebar.home")}
          className="flex h-9 items-center px-1.5"
        >
          <Logo size="sm" iconOnly={collapsed} />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            {/* Accion principal del producto: la unica pieza naranja de la barra */}
            <Button
              variant="brand"
              size={collapsed ? "icon-lg" : "lg"}
              className="w-full"
              asChild
            >
              <Link href="/subir">
                <Upload />
                {!collapsed && t("nav.upload")}
              </Link>
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>

        {NAV.map((group) => (
          <SidebarGroup key={group.id}>
            <SidebarGroupLabel>{t(`nav.groups.${group.id}`)}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const suyas = [item.href, ...(item.tambien ?? [])]
                  const active = suyas.some(
                    (h) => pathname === h || pathname.startsWith(`${h}/`)
                  )
                  const label = t(`nav.${item.id}`)
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={active} tooltip={label}>
                        {/* Sin prefetch: precargar las diez secciones son 24
                            peticiones y ~28 KB comprimidos peleando con el JS
                            de la página que se está abriendo. El de «Subir»
                            (más abajo) sí se queda: mantiene caliente el
                            segmento del layout y la primera navegación sale
                            gratis */}
                        <Link href={item.href} prefetch={false}>
                          <item.icon />
                          <span>{label}</span>
                        </Link>
                      </SidebarMenuButton>
                      {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        {/* El consumo se oculta al colapsar: en 3 rem no cabe nada legible */}
        <div className="rounded-lg bg-sidebar-accent p-3 group-data-[collapsible=icon]:hidden">
          <p className="flex items-center gap-1.5 text-xs font-medium">
            <Sparkles className="size-3.5 text-brand" aria-hidden />
            {t("sidebar.plan", { plan: nombrePlan(plan) })}
          </p>
          <Progress value={pctUsed} className="mt-2 h-1.5" />
          <p className="mt-1.5 text-[11px] text-muted-foreground tabular-nums">
            {t("sidebar.usage", {
              used: f.compact(usados),
              included: f.compact(incluidos),
            })}
          </p>
        </div>
        <UserNav />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
