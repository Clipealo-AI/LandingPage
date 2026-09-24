"use client"

import * as React from "react"
import { Check, ChevronDown, Languages, Menu, UserRound } from "lucide-react"
import { useTranslations } from "next-intl"

import { Link, usePathname } from "@/i18n/navigation"
import { LOCALE_NAME, LOCALE_TAG, routing } from "@/i18n/routing"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { LocaleSwitcher, useCambiarIdioma } from "@/components/shared/locale-switcher"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import {
  featureNavigation,
  resourceNavigation,
  useCaseNavigation,
} from "@/lib/marketing/navigation"

/**
 * Rutas cuya primera pantalla es oscura (hero de la landing). Solo ahí la
 * cabecera arranca en blanco; en /precios o
 * en las páginas legales el fondo es claro desde el primer píxel y el texto
 * debe ser el del tema desde el servidor, sin esperar a hidratar.
 *
 * `usePathname` de `@/i18n/navigation` devuelve la ruta interna, sin prefijo de
 * idioma: «/en» llega como «/» y «/pt/precos», como «/precios».
 */
const RUTAS_HERO_OSCURO = new Set(["/"])

/**
 * Rutas cuya primera pantalla ya trae su propia acción naranja —el hero y la
 * tarjeta destacada de /precios—: ahí la
 * cabecera va en contorno. Es un conjunto aparte porque /precios es clara
 * desde el primer píxel y el texto blanco no le toca.
 */
const RUTAS_CON_ACCION_PROPIA = new Set([...RUTAS_HERO_OSCURO, "/precios"])

const DISCORD_URL = "https://discord.com/invite/XjhXBtaK6A"

const MENUS = {
  features: {
    items: featureNavigation.map(({ id, slug, icon }) => ({
      id,
      href: `/funciones/${slug}`,
      icon,
    })),
  },
  useCases: {
    items: useCaseNavigation.map(({ id, slug, icon }) => ({
      id,
      href: `/casos/${slug}`,
      icon,
    })),
  },
  resources: { items: resourceNavigation },
} as const

type MenuId = keyof typeof MENUS

const MENU_ORDER: MenuId[] = ["features", "useCases", "resources"]

function DiscordGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01 10.2 10.2 0 0 0 .372.292.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  )
}

function MenuLink({
  href,
  external = false,
  className,
  children,
}: {
  href: string
  external?: boolean
  className: string
  children: React.ReactNode
}) {
  if (external) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    )
  }

  return (
    <Link href={href as never} className={className}>
      {children}
    </Link>
  )
}

/**
 * Cabecera de marketing.
 *
 * Arranca transparente y solo adquiere fondo y borde al hacer scroll: asi el
 * titular respira y la navegacion sigue legible cuando pasa por encima de
 * secciones claras. El texto en blanco se reserva a las rutas con hero
 * oscuro; en el resto usa los colores del tema desde el principio.
 */
export function SiteHeader() {
  const t = useTranslations("marketing")
  const menuT = useTranslations("marketing.header")
  const menuText = menuT as unknown as (key: string) => string
  const [scrolled, setScrolled] = React.useState(false)
  const [activeMenu, setActiveMenu] = React.useState<MenuId | null>(null)
  const closeMenuTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const pathname = usePathname()
  const sobreOscuro = !scrolled && RUTAS_HERO_OSCURO.has(pathname)
  /**
   * En las rutas con hero, el naranja es del hero y la cabecera no compite.
   *
   * La cabecera es fija y llevaba el MISMO botón naranja que el hero, con el
   * mismo texto y el mismo destino: la primera pantalla enseñaba dos, y la
   * regla de la casa es como mucho una acción `brand` visible por vista.
   *
   * Depende de la RUTA, no del scroll. Hacerlo depender del scroll —como estuvo
   * un rato— cambiaba la identidad del botón a los 12 píxeles: pasaba de
   * contorno a naranja, y de paso ganaba el sonido «pop» y la marca de recorte,
   * que `Button` le da por defecto a `brand`. Un mando que suena distinto según
   * dónde esté la página no es el mismo mando.
   *
   * En /precios el naranja es el de la tarjeta destacada, y la comparativa no
   * lo repite: la cabecera tampoco compite ahí.
   */
  const ctaSecundaria = RUTAS_CON_ACCION_PROPIA.has(pathname)
  // Hover, pulsado y abierto en blanco: la tinta de `--surface-*` no se ve sobre el hero
  const botonSobreOscuro =
    sobreOscuro &&
    "text-white hover:bg-white/10 hover:text-white active:bg-white/15 aria-expanded:bg-white/10 aria-expanded:text-white"

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const cancelMenuClose = () => {
    if (closeMenuTimer.current) clearTimeout(closeMenuTimer.current)
    closeMenuTimer.current = null
  }
  const scheduleMenuClose = () => {
    cancelMenuClose()
    closeMenuTimer.current = setTimeout(() => setActiveMenu(null), 140)
  }
  React.useEffect(() => () => cancelMenuClose(), [])

  return (
    <header
      data-scrolled={scrolled}
      data-sobre-oscuro={sobreOscuro}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300",
        scrolled
          ? "border-b bg-background/80 backdrop-blur-xl"
          : "border-b border-transparent"
      )}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          aria-label={t("header.home")}
          className={cn(
            "rounded-md transition-colors",
            sobreOscuro ? "text-white" : "text-foreground"
          )}
        >
          <Logo size="md" />
        </Link>

        <nav
          aria-label={t("header.mainNav")}
          className="relative hidden items-center gap-1 lg:flex"
          onMouseEnter={cancelMenuClose}
          onMouseLeave={scheduleMenuClose}
          onKeyDown={(event) => {
            if (event.key === "Escape") setActiveMenu(null)
          }}
        >
          {MENU_ORDER.map((menuId) => {
            const isOpen = activeMenu === menuId
            return (
              <button
                key={menuId}
                type="button"
                aria-haspopup="true"
                aria-expanded={isOpen}
                aria-controls={`marketing-menu-${menuId}`}
                onMouseEnter={() => setActiveMenu(menuId)}
                onFocus={() => setActiveMenu(menuId)}
                onClick={() => {
                  cancelMenuClose()
                  setActiveMenu(menuId)
                }}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  sobreOscuro
                    ? "text-white/75 hover:bg-white/10 hover:text-white aria-expanded:bg-white/10 aria-expanded:text-white"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground"
                )}
              >
                {menuText(`menus.${menuId}`)}
                <ChevronDown
                  className={cn("size-3.5 transition-transform", isOpen && "rotate-180")}
                  aria-hidden="true"
                />
              </button>
            )
          })}
          <Link
            href="/precios"
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              sobreOscuro
                ? "text-white/75 hover:bg-white/10 hover:text-white"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {t("nav.pricing")}
          </Link>

          {activeMenu && (
            <div
              id={`marketing-menu-${activeMenu}`}
              className="absolute top-[calc(100%+0.5rem)] left-1/2 z-50 grid w-[min(54rem,calc(100vw-2rem))] -translate-x-1/2 grid-cols-2 gap-x-8 gap-y-1 rounded-2xl border border-border bg-popover p-6 text-popover-foreground shadow-xl"
              onMouseEnter={cancelMenuClose}
              onMouseLeave={scheduleMenuClose}
            >
              {MENUS[activeMenu].items.map((item) => {
                const Icon = item.icon
                return (
                  <MenuLink
                    key={item.id}
                    href={item.href}
                    external={"external" in item && item.external}
                    className="group flex min-w-0 items-start gap-3 rounded-xl p-3 transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                  >
                    <Icon
                      className="mt-0.5 size-5 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">
                        {menuText(`menuItems.${item.id}.title`)}
                      </span>
                      <span className="mt-1 block text-sm leading-snug text-muted-foreground">
                        {menuText(`menuItems.${item.id}.description`)}
                      </span>
                    </span>
                  </MenuLink>
                )
              })}
              {activeMenu === "features" && (
                <Link
                  href="/funciones"
                  className="col-span-2 mt-1 rounded-lg border-t border-border px-3 pt-4 text-sm font-semibold text-primary hover:underline"
                >
                  {menuText("menus.allFeatures")} <span aria-hidden="true">→</span>
                </Link>
              )}
            </div>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle className={cn(botonSobreOscuro)} />

          {/* Idioma: como el acceso, en móvil no cabe y va en el menú */}
          <LocaleSwitcher className={cn("hidden sm:inline-flex", botonSobreOscuro)} />

          <Button
            variant="ghost"
            size="icon-sm"
            asChild
            className={cn("hidden sm:inline-flex", botonSobreOscuro)}
          >
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("header.discord")}
            >
              <DiscordGlyph />
            </a>
          </Button>

          {/* Acceso: icono de persona, el gesto universal de «mi cuenta». En móvil no
              cabe junto a «Subir un video»: ahí va en el menú */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                asChild
                className={cn("hidden sm:inline-flex", botonSobreOscuro)}
              >
                <Link href="https://app.clipealo-ai.com/" aria-label={t("header.login")}>
                  <UserRound />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("header.login")}</TooltipContent>
          </Tooltip>

          <Button
            variant={ctaSecundaria ? "outline" : "brand"}
            size="lg"
            className={cn(
              // Solo mientras flota sobre el hero: al bajar, el contorno normal
              sobreOscuro &&
                "border-white/30 bg-transparent text-white hover:border-white/50 hover:bg-white/10 hover:text-white"
            )}
            asChild
          >
            <Link href="https://app.clipealo-ai.com/">{t("actions.upload")}</Link>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("header.openMenu")}
                className={cn("md:hidden", botonSobreOscuro)}
              >
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="sr-only">{t("header.menu")}</SheetTitle>
                <Logo size="md" />
              </SheetHeader>
              <nav aria-label={t("header.mobileNav")} className="grid gap-1 px-4">
                {MENU_ORDER.map((menuId) => (
                  <details key={menuId} className="group border-b border-border py-2">
                    <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-muted">
                      {menuText(`menus.${menuId}`)}
                      <ChevronDown
                        className="size-4 transition-transform group-open:rotate-180"
                        aria-hidden="true"
                      />
                    </summary>
                    <div className="grid gap-1 pt-1 pl-2">
                      {MENUS[menuId].items.map((item) => {
                        const Icon = item.icon
                        const external = "external" in item && item.external
                        const content = (
                          <>
                            <Icon
                              className="mt-0.5 size-4 shrink-0 text-primary"
                              aria-hidden="true"
                            />
                            <span>{menuText(`menuItems.${item.id}.title`)}</span>
                          </>
                        )
                        return (
                          <React.Fragment key={item.id}>
                            <SheetClose asChild>
                              {external ? (
                                <a
                                  href={item.href}
                                  className="flex items-start gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted"
                                >
                                  {content}
                                </a>
                              ) : (
                                <Link
                                  href={item.href as never}
                                  className="flex items-start gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted"
                                >
                                  {content}
                                </Link>
                              )}
                            </SheetClose>
                          </React.Fragment>
                        )
                      })}
                      {menuId === "features" && (
                        <SheetClose asChild>
                          <Link
                            href="/funciones"
                            className="rounded-lg px-3 py-2 text-sm font-semibold text-primary hover:bg-muted"
                          >
                            {menuText("menus.allFeatures")}
                          </Link>
                        </SheetClose>
                      )}
                    </div>
                  </details>
                ))}
                <SheetClose asChild>
                  <Link
                    href="/precios"
                    className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted"
                  >
                    {t("nav.pricing")}
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    href="https://app.clipealo-ai.com/"
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted"
                  >
                    <UserRound className="size-4" aria-hidden /> {t("header.login")}
                  </Link>
                </SheetClose>
              </nav>
              <IdiomaMovil />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

/**
 * Fila de idioma del menú móvil: los tres a la vista, cada uno escrito en su
 * propio idioma para que lo encuentre quien no lee el actual.
 */
function IdiomaMovil() {
  const t = useTranslations("common.locale")
  const { locale, cambiar, pendiente } = useCambiarIdioma()
  const id = React.useId()

  return (
    <div
      role="group"
      aria-labelledby={id}
      aria-busy={pendiente || undefined}
      className="mx-4 mt-2 grid gap-1 border-t pt-3"
    >
      <p
        id={id}
        className="flex items-center gap-2 px-3 pb-1 text-xs font-medium text-muted-foreground"
      >
        <Languages className="size-4" aria-hidden /> {t("label")}
      </p>
      {routing.locales.map((l) => (
        <SheetClose key={l} asChild>
          <button
            type="button"
            lang={LOCALE_TAG[l]}
            aria-current={l === locale ? "true" : undefined}
            onClick={() => cambiar(l)}
            className="flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium hover:bg-muted"
          >
            {LOCALE_NAME[l]}
            {l === locale && <Check className="size-4 text-primary" aria-hidden />}
          </button>
        </SheetClose>
      ))}
    </div>
  )
}
