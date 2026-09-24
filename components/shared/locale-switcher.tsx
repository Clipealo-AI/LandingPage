"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { Languages } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { hrefDinamico, usePathname, useRouter } from "@/i18n/navigation"
import { LOCALE_NAME, LOCALE_TAG, routing, type Locale } from "@/i18n/routing"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/**
 * Cambia el idioma conservando la página, sus parámetros y la consulta
 * (`?seccion=`, `?modo=`): la misma pantalla, en otro idioma. La cookie la
 * escribe el proxy al entrar en la nueva dirección.
 */
export function useCambiarIdioma() {
  const locale = useLocale()
  const pathname = usePathname()
  const params = useParams()
  const router = useRouter()
  const [pendiente, startTransition] = React.useTransition()

  const cambiar = React.useCallback(
    (siguiente: Locale) => {
      if (siguiente === locale) return
      const query = Object.fromEntries(new URLSearchParams(window.location.search))
      startTransition(() => {
        // `pathname` es la ruta interna («/campanas/[id]»): los params la completan
        router.replace(hrefDinamico(pathname, params as Record<string, string>, query), {
          locale: siguiente,
          scroll: false,
        })
      })
    },
    [locale, pathname, params, router]
  )

  return { locale, cambiar, pendiente }
}

/** Botón de icono con menú de idiomas, gemelo de `ThemeToggle`. */
export function LocaleSwitcher({
  className,
  align = "end",
}: {
  className?: string
  align?: "start" | "center" | "end"
}) {
  const t = useTranslations("common.locale")
  const { locale, cambiar, pendiente } = useCambiarIdioma()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("change", { current: LOCALE_NAME[locale] })}
          aria-busy={pendiente || undefined}
          className={cn(className)}
        >
          <Languages />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="min-w-44">
        <DropdownMenuLabel>{t("label")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={locale}
          onValueChange={(value) => cambiar(value as Locale)}
        >
          {routing.locales.map((l) => (
            // Cada idioma en su propio idioma, con su etiqueta `lang` para lectores de pantalla
            <DropdownMenuRadioItem key={l} value={l} lang={LOCALE_TAG[l]}>
              {LOCALE_NAME[l]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
