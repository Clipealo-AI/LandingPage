"use client"

import { Suspense } from "react"
import {
  ArrowLeft,
  CalendarClock,
  Coins,
  Compass,
  CreditCard,
  Gift,
  GraduationCap,
  MessageCircleQuestion,
  MessageSquare,
  Handshake,
  LayoutDashboard,
  Megaphone,
  Scale,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"

import { Link, usePathname } from "@/i18n/navigation"
import { conMes } from "@/lib/admin/enlaces"
import { Logo } from "@/components/brand/logo"
import { Badge } from "@/components/ui/badge"
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
import { useCampanas } from "@/hooks/use-campanas"
import { useFeedback } from "@/hooks/use-feedback"
import { AdminUserNav } from "@/components/admin/admin-user-nav"

export interface AdminSidebarProps {
  /** Contadores de trabajo pendiente: solo se pintan si son mayores que 0. */
  pendientes: {
    usuarios: number
    vencimientos: number
    formacion: number
  }
  totalUsuarios: number
}

interface Item {
  href: string
  label: string
  icon: LucideIcon
  exact?: boolean
  badge?: number
}

interface Grupo {
  label: string
  items: Item[]
}

export function AdminSidebar({ pendientes, totalUsuarios }: AdminSidebarProps) {
  const t = useTranslations("admin.nav")

  /**
   * Las disputas se cuentan aquí, no en el servidor.
   *
   * `getAdminDisputas` devuelve la lista vacía a propósito —en el arquetipo
   * viven en el navegador— así que el contador del layout valía siempre cero y
   * la barra decía «nada pendiente» mientras la cola enseñaba dos. La insignia
   * y la página tienen que salir del mismo sitio, y el sitio es este almacén.
   */
  const { disputas } = useCampanas()
  const disputasPendientes = disputas.filter((d) => d.estado !== "resuelta").length
  // Lo mismo con el casillero: vive en el navegador, se cuenta aquí
  const { mensajes } = useFeedback()
  const feedbackNuevos = mensajes.filter((m) => m.estado === "nuevo").length

  const nav: Grupo[] = [
    {
      label: t("groups.negocio"),
      items: [
        { href: "/admin", label: t("items.panel"), icon: LayoutDashboard, exact: true },
        { href: "/admin/ingresos", label: t("items.ingresos"), icon: Wallet },
        { href: "/admin/costes", label: t("items.costes"), icon: Coins },
        { href: "/admin/planes", label: t("items.planes"), icon: CreditCard },
      ],
    },
    {
      label: t("groups.clientes"),
      items: [
        {
          href: "/admin/usuarios",
          label: t("items.usuarios"),
          icon: Users,
          badge: pendientes.usuarios,
        },
        {
          href: "/admin/vencimientos",
          label: t("items.vencimientos"),
          icon: CalendarClock,
          badge: pendientes.vencimientos,
        },
      ],
    },
    {
      label: t("groups.crecimiento"),
      items: [
        { href: "/admin/afiliados", label: t("items.afiliados"), icon: Handshake },
        { href: "/admin/referidos", label: t("items.referidos"), icon: Gift },
      ],
    },
    {
      label: t("groups.creadores"),
      items: [
        { href: "/admin/campanas", label: t("items.campanas"), icon: Megaphone },
        {
          href: "/admin/disputas",
          label: t("items.disputas"),
          icon: Scale,
          badge: disputasPendientes,
        },
        {
          href: "/admin/preguntas",
          label: t("items.preguntas"),
          icon: MessageCircleQuestion,
        },
        {
          href: "/admin/feedback",
          label: t("items.feedback"),
          icon: MessageSquare,
          // Sin abrir: es trabajo de verdad, y se cuenta donde vive
          badge: feedbackNuevos,
        },
        {
          href: "/admin/formacion",
          label: t("items.formacion"),
          icon: GraduationCap,
          // Clases publicadas sin video: es trabajo pendiente de verdad, no una
          // cola de gente esperando
          badge: pendientes.formacion,
        },
        { href: "/admin/mercado", label: t("items.mercado"), icon: Compass },
      ],
    },
  ]

  return (
    <Sidebar collapsible="icon" variant="inset">
      {/* El `Suspense` es obligatorio: `useSearchParams` sin él impide
          prerenderizar las páginas del admin que no leen el mes (campañas,
          formación, preguntas, casillero, disputas, mercado). El respaldo es el
          mismo menú sin mes, así el HTML estático nunca sale sin barra */}
      <Suspense fallback={<Cuerpo nav={nav} mes={null} />}>
        <CuerpoDesdeUrl nav={nav} />
      </Suspense>

      <SidebarFooter>
        <SidebarMenu className="group-data-[collapsible=icon]:hidden">
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="sm" className="text-muted-foreground">
              <Link href="/dashboard">
                <ArrowLeft />
                <span>{t("backToProduct")}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <AdminUserNav totalUsuarios={totalUsuarios} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

/** El mes elegido viaja en la URL: la barra lo lee de ahí para no perderlo al navegar. */
function CuerpoDesdeUrl({ nav }: { nav: Grupo[] }) {
  const mes = useSearchParams().get("mes")
  return <Cuerpo nav={nav} mes={mes} />
}

function Cuerpo({ nav, mes }: { nav: Grupo[]; mes: string | null }) {
  const t = useTranslations("admin.nav")
  const pathname = usePathname()
  const { state } = useSidebar()
  const collapsed = state === "collapsed"

  return (
    <>
      <SidebarHeader>
        <Link
          href={conMes("/admin", mes)}
          aria-label={t("home")}
          className="flex h-9 items-center gap-2 px-1.5"
        >
          <Logo size="sm" iconOnly={collapsed} />
          {!collapsed && (
            <Badge
              variant="secondary"
              className="h-4 px-1.5 text-[10px] tracking-wide uppercase"
            >
              {t("badge")}
            </Badge>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {nav.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = item.exact
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(`${item.href}/`)
                  return (
                    // `key` con el href base: cambiar de mes no remonta los
                    // ítems ni pierde el foco del teclado
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                        {/* Sin prefetch: cada página del admin es un render pesado y
                            precargar las diez a cada navegación saturaba el servidor */}
                        <Link href={conMes(item.href, mes)} prefetch={false}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                      {item.badge ? (
                        <SidebarMenuBadge className="rounded-full bg-secondary px-1.5 font-semibold text-secondary-foreground">
                          {item.badge}
                        </SidebarMenuBadge>
                      ) : null}
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </>
  )
}
