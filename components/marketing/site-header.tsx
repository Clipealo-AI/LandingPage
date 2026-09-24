"use client";

import * as React from "react";
import {
  BookOpen,
  ChevronDown,
  FileText,
  FolderOpen,
  Gamepad2,
  Globe,
  HelpCircle,
  Languages,
  Menu,
  MessageCircle,
  Palette,
  Search,
  Smartphone,
  Target,
  Users,
  UserRound,
  Video,
  Zap,
  Check,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { LOCALE_NAME, LOCALE_TAG, routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { DiscordIcon } from "@/components/brand/discord-icon";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LocaleSwitcher,
  useCambiarIdioma,
} from "@/components/shared/locale-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";

/**
 * Rutas cuya primera pantalla es oscura (hero de la landing, portada del
 * sistema de diseño). Solo ahí la cabecera arranca en blanco; en /precios o
 * en las páginas legales el fondo es claro desde el primer píxel y el texto
 * debe ser el del tema desde el servidor, sin esperar a hidratar.
 *
 * `usePathname` de `@/i18n/navigation` devuelve la ruta interna, sin prefijo de
 * idioma: «/en» llega como «/» y «/pt/design-system», como «/design-system».
 */
const RUTAS_HERO_OSCURO = new Set(["/", "/design-system"]);

/**
 * Rutas cuya primera pantalla ya trae su propia acción naranja —el hero, la
 * portada del sistema de diseño, la tarjeta destacada de /precios—: ahí la
 * cabecera va en contorno. Es un conjunto aparte porque /precios es clara
 * desde el primer píxel y el texto blanco no le toca.
 */
const RUTAS_CON_ACCION_PROPIA = new Set([...RUTAS_HERO_OSCURO, "/precios"]);
const DISCORD_URL = "https://discord.com/invite/XjhXBtaK6A";

type MenuKey = "funcionalidades" | "casos" | "recursos";

type MenuItem = {
  icon: LucideIcon;
  label: string;
  description: string;
  href: string;
};

const MENUS: { id: MenuKey; label: string; items: MenuItem[] }[] = [
  {
    id: "funcionalidades",
    label: "Funcionalidades",
    items: [
      {
        icon: Zap,
        label: "Clips automáticos",
        description:
          "Pega el link de tu stream. La IA procesa el video completo y genera clips listos para publicar.",
        href: "/funciones/clips-automaticos-con-ia",
      },
      {
        icon: Target,
        label: "Entrenada en contenido LATAM",
        description:
          "Detecta momentos virales en español. Entiende jerga local y contexto cultural.",
        href: "/funciones/ia-entrenada-contenido-latam",
      },
      {
        icon: MessageCircle,
        label: "Editor de subtítulos",
        description:
          "Personaliza fuentes, colores, animaciones y posición de subtítulos automáticos.",
        href: "/funciones/editor-subtitulos-estilos",
      },
      {
        icon: Smartphone,
        label: "Exporta en 2 formatos",
        description:
          "16:9 para YouTube/Kick y 9:16 para TikTok/Reels. Reencuadre automático en 1 clic.",
        href: "/funciones/exporta-dos-formatos",
      },
      {
        icon: Palette,
        label: "Plantillas de marca",
        description:
          "Configura el branding de cada cliente y aplícalo a todos sus clips en un clic.",
        href: "/funciones/plantillas-de-marca",
      },
      {
        icon: FolderOpen,
        label: "Gestión de proyectos",
        description:
          "Organiza todos tus videos y clips por cliente, campaña o fecha.",
        href: "/funciones/gestion-proyectos-carpetas",
      },
      {
        icon: Search,
        label: "Exportación en masa",
        description: "Descarga todos los clips de un proyecto en un solo clic.",
        href: "/funciones/exportacion-en-masa",
      },
    ],
  },
  {
    id: "casos",
    label: "Casos de uso",
    items: [
      {
        icon: Video,
        label: "Cliperos",
        description: "Convierte momentos épicos en clips virales.",
        href: "/casos/cliperos",
      },
      {
        icon: Gamepad2,
        label: "Streamers",
        description: "Extrae los mejores momentos de tus streams.",
        href: "/casos/streamers",
      },
      {
        icon: MessageCircle,
        label: "Podcasters",
        description: "Convierte episodios largos en clips sociales.",
        href: "/casos/podcasters",
      },
      {
        icon: BookOpen,
        label: "Coaches y educadores",
        description: "Comparte clases y tutoriales como contenido corto.",
        href: "/casos/coaches",
      },
      {
        icon: Palette,
        label: "Creadores de contenido",
        description: "Lleva tus videos largos a todas tus redes.",
        href: "/casos/creadores",
      },
      {
        icon: Users,
        label: "Comunidades y esports",
        description: "Crea highlights de torneos y eventos.",
        href: "/casos/comunidades",
      },
      {
        icon: Globe,
        label: "Agencias audiovisuales",
        description: "Gestiona contenido de varios creadores.",
        href: "/casos/agencias",
      },
      {
        icon: Search,
        label: "Marcas",
        description: "Genera contenido a partir de streams patrocinados.",
        href: "/casos/marcas",
      },
    ],
  },
  {
    id: "recursos",
    label: "Recursos",
    items: [
      {
        icon: BookOpen,
        label: "Blog",
        description: "Guías para crear contenido y crecer.",
        href: "/blog",
      },
      {
        icon: HelpCircle,
        label: "Preguntas frecuentes",
        description: "Resolvemos tus dudas más comunes.",
        href: "/#faq",
      },
      {
        icon: FileText,
        label: "Guías",
        description: "Aprende a sacar más de Clipealo.",
        href: "/blog",
      },
    ],
  },
];

/**
 * Cabecera de marketing.
 *
 * Arranca transparente y solo adquiere fondo y borde al hacer scroll: asi el
 * titular respira y la navegacion sigue legible cuando pasa por encima de
 * secciones claras. El texto en blanco se reserva a las rutas con hero
 * oscuro; en el resto usa los colores del tema desde el principio.
 */
export function SiteHeader() {
  const t = useTranslations("marketing");
  const [scrolled, setScrolled] = React.useState(false);
  const [menuAbierto, setMenuAbierto] = React.useState<MenuKey | null>(null);
  const ultimoTipoPointer = React.useRef<string | null>(null);
  const header = React.useRef<HTMLElement>(null);
  const pathname = usePathname();
  const sobreOscuro = !scrolled && RUTAS_HERO_OSCURO.has(pathname);
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
  const ctaSecundaria = RUTAS_CON_ACCION_PROPIA.has(pathname);
  // Hover, pulsado y abierto en blanco: la tinta de `--surface-*` no se ve sobre el hero
  const botonSobreOscuro =
    sobreOscuro &&
    "text-white hover:bg-white/10 hover:text-white active:bg-white/15 aria-expanded:bg-white/10 aria-expanded:text-white";

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    if (!menuAbierto) return;
    const cerrarFuera = (event: MouseEvent) => {
      if (!header.current?.contains(event.target as Node)) setMenuAbierto(null);
    };
    const cerrarEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuAbierto(null);
    };
    document.addEventListener("mousedown", cerrarFuera);
    document.addEventListener("keydown", cerrarEscape);
    return () => {
      document.removeEventListener("mousedown", cerrarFuera);
      document.removeEventListener("keydown", cerrarEscape);
    };
  }, [menuAbierto]);

  return (
    <header
      ref={header}
      data-scrolled={scrolled}
      data-sobre-oscuro={sobreOscuro}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300",
        scrolled
          ? "border-b bg-background/80 backdrop-blur-xl"
          : "border-b border-transparent",
      )}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          aria-label={t("header.home")}
          className={cn(
            "rounded-md transition-colors",
            sobreOscuro ? "text-white" : "text-foreground",
          )}
        >
          <Logo size="md" />
        </Link>

        <nav
          aria-label={t("header.mainNav")}
          className="relative hidden items-center gap-1 after:absolute after:left-1/2 after:top-full after:h-4 after:w-[min(56rem,calc(100vw-2rem))] after:-translate-x-1/2 after:content-[''] lg:flex"
          onPointerLeave={(event) => {
            // The panel is rendered inside the nav, so moving from its trigger
            // into the panel keeps the disclosure open. Leaving the whole nav
            // closes it without a timer or a pointer gap.
            if (event.pointerType === "mouse") setMenuAbierto(null);
          }}
        >
          {MENUS.map((menu) => {
            const abierto = menuAbierto === menu.id;
            return (
              <div key={menu.id}>
                <button
                  type="button"
                  aria-expanded={abierto}
                  aria-controls={`menu-${menu.id}`}
                  onPointerEnter={(event) => {
                    if (event.pointerType === "mouse") setMenuAbierto(menu.id);
                  }}
                  onPointerDown={(event) => {
                    ultimoTipoPointer.current = event.pointerType;
                  }}
                  onClick={(event) => {
                    // On desktop, the pointer already opened this disclosure.
                    // Keep it open when clicked; touch and keyboard still toggle.
                    if (
                      ultimoTipoPointer.current === "mouse" &&
                      event.detail > 0
                    ) {
                      setMenuAbierto(menu.id);
                      return;
                    }
                    setMenuAbierto((actual) =>
                      actual === menu.id ? null : menu.id,
                    );
                  }}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                    sobreOscuro
                      ? "text-white/75 hover:bg-white/10 hover:text-white aria-expanded:bg-white/10 aria-expanded:text-white"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
                  )}
                >
                  {menu.label}
                  <ChevronDown
                    className={cn(
                      "size-3.5 transition-transform",
                      abierto && "rotate-180",
                    )}
                    aria-hidden
                  />
                </button>
                {abierto && (
                  <div
                    id={`menu-${menu.id}`}
                    className="fixed left-1/2 top-16 z-50 w-[calc(100vw-2rem)] max-w-[56rem] -translate-x-1/2 rounded-2xl border border-border bg-popover p-5 text-popover-foreground shadow-xl sm:p-7"
                  >
                    <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
                      {menu.items.map(({ icon: Icon, ...item }) => {
                        const contenido = (
                          <>
                            <Icon
                              className="mt-0.5 size-5 shrink-0 text-primary"
                              aria-hidden
                            />
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold text-popover-foreground">
                                {item.label}
                              </span>
                              <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                                {item.description}
                              </span>
                            </span>
                          </>
                        );
                        const className =
                          "flex min-h-20 gap-3 rounded-xl p-3 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
                        return (
                          <Link
                            key={`${item.href}-${item.label}`}
                            href={item.href}
                            className={className}
                            onClick={() => setMenuAbierto(null)}
                          >
                            {contenido}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <Link
            href="/precios"
            className={cn(
              "rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              sobreOscuro
                ? "text-white/75 hover:bg-white/10 hover:text-white"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            Precios
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle className={cn(botonSobreOscuro)} />

          {/* Idioma: como el acceso, en móvil no cabe y va en el menú */}
          <LocaleSwitcher
            className={cn("hidden sm:inline-flex", botonSobreOscuro)}
          />

          <Button
            variant="ghost"
            size="icon-sm"
            asChild
            className={cn("hidden md:inline-flex", botonSobreOscuro)}
          >
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noreferrer"
              aria-label={t("header.discord")}
            >
              <DiscordIcon className="size-5" />
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
                <Link href="/login" aria-label={t("header.login")}>
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
                "border-white/30 bg-transparent text-white hover:border-white/50 hover:bg-white/10 hover:text-white",
            )}
            asChild
          >
            <Link href="/subir">{t("actions.upload")}</Link>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("header.openMenu")}
                className={cn("lg:hidden", botonSobreOscuro)}
              >
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="sr-only">{t("header.menu")}</SheetTitle>
                <Logo size="md" />
              </SheetHeader>
              <nav
                aria-label={t("header.mobileNav")}
                className="grid gap-1 px-4"
              >
                {MENUS.map((menu) => (
                  <details
                    key={menu.id}
                    className="group rounded-lg px-3 py-2.5 text-sm"
                  >
                    <summary className="cursor-pointer list-none font-medium">
                      <span className="flex items-center justify-between">
                        {menu.label}
                        <ChevronDown
                          className="size-4 transition-transform group-open:rotate-180"
                          aria-hidden
                        />
                      </span>
                    </summary>
                    <div className="mt-2 grid gap-1 border-l pl-3">
                      {menu.items.map((item) => (
                        <SheetClose key={`${item.href}-${item.label}`} asChild>
                          <Link
                            href={item.href}
                            className="rounded-md px-2 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            {item.label}
                          </Link>
                        </SheetClose>
                      ))}
                    </div>
                  </details>
                ))}
                <SheetClose asChild>
                  <Link
                    href="/precios"
                    className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted"
                  >
                    Precios
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    href="/login"
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted"
                  >
                    <UserRound className="size-4" aria-hidden />{" "}
                    {t("header.login")}
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <a
                    href={DISCORD_URL}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={t("header.discord")}
                    className="grid size-10 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <DiscordIcon className="size-5" />
                  </a>
                </SheetClose>
              </nav>
              <IdiomaMovil />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

/**
 * Fila de idioma del menú móvil: los tres a la vista, cada uno escrito en su
 * propio idioma para que lo encuentre quien no lee el actual.
 */
function IdiomaMovil() {
  const t = useTranslations("common.locale");
  const { locale, cambiar, pendiente } = useCambiarIdioma();
  const id = React.useId();

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
            {l === locale && (
              <Check className="size-4 text-primary" aria-hidden />
            )}
          </button>
        </SheetClose>
      ))}
    </div>
  );
}
