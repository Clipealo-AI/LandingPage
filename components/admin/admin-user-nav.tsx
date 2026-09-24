"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { toast } from "@/lib/toast"
import {
  ChevronsUpDown,
  ExternalLink,
  Languages,
  LogOut,
  ShieldCheck,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import {
  ADMIN_LOCALE,
  LOCALE_NAME,
  LOCALE_TAG,
  routing,
  type Locale,
} from "@/i18n/routing"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"

/**
 * Idioma del backoffice. No usa el router de next-intl a propósito: ese
 * escribiría la cookie del sitio, y el admin guarda su idioma aparte
 * (`ADMIN_LOCALE`, inglés por defecto, lo aplica `proxy.ts`). Las rutas del
 * admin no se traducen, así que basta con cambiar el prefijo.
 */
function useIdiomaAdmin() {
  const locale = useLocale()
  const router = useRouter()
  const [pendiente, startTransition] = React.useTransition()

  const cambiar = (siguiente: Locale) => {
    if (siguiente === locale) return
    document.cookie = `${ADMIN_LOCALE.cookie}=${siguiente}; path=/; max-age=31536000; samesite=lax`
    const { pathname, search, hash } = window.location
    const sinPrefijo = pathname.replace(/^\/(?:es|en|pt)(?=\/|$)/, "") || "/"
    const prefijo = siguiente === routing.defaultLocale ? "" : `/${siguiente}`
    startTransition(() =>
      router.replace(`${prefijo}${sinPrefijo}${search}${hash}`, { scroll: false })
    )
  }

  return { locale, cambiar, pendiente }
}

/** Sustituir por la sesión real del operador. */
const admin = {
  name: "Admin",
  email: "admin@clipealo.com",
  initials: "AD",
}

export function AdminUserNav({ totalUsuarios }: { totalUsuarios: number }) {
  const t = useTranslations("admin.userNav")
  const tLocale = useTranslations("common.locale")
  const { locale, cambiar, pendiente } = useIdiomaAdmin()
  const router = useRouter()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
              <Avatar className="size-7 rounded-md">
                <AvatarFallback className="rounded-md bg-primary text-xs font-semibold text-primary-foreground">
                  {admin.initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-medium">{admin.name}</span>
                <span className="truncate text-xs text-muted-foreground tabular-nums">
                  {t("users", { count: totalUsuarios })}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent side="top" align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <ShieldCheck className="size-3.5 text-primary" aria-hidden />
                {admin.name}
              </p>
              <p className="text-xs text-muted-foreground">{admin.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                {/* Enlace sin idioma: el proxy abre el sitio en el idioma del sitio,
                    no en el del backoffice */}
                <a href="/" target="_blank" rel="noreferrer">
                  <ExternalLink /> {t("publicSite")}
                </a>
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger aria-busy={pendiente || undefined}>
                  <Languages /> {tLocale("label")}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="min-w-44">
                  <DropdownMenuRadioGroup
                    value={locale}
                    onValueChange={(value) => cambiar(value as Locale)}
                  >
                    {routing.locales.map((l) => (
                      // Cada idioma en su propio idioma, con su `lang` para lectores de pantalla
                      <DropdownMenuRadioItem key={l} value={l} lang={LOCALE_TAG[l]}>
                        {LOCALE_NAME[l]}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {/* Sin sesión de operador todavía: lleva a la pantalla de acceso,
                que es lo que se espera al pulsarlo, y el aviso dice qué falta */}
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => {
                toast(t("logoutDone"), { description: t("logoutHint") })
                router.push("/login")
              }}
            >
              <LogOut /> {t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
