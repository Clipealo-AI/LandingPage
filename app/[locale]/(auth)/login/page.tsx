import { Suspense } from "react"
import type { Metadata } from "next"
import { ArrowLeft } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { Link } from "@/i18n/navigation"
import { legalNav } from "@/lib/site"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Logo } from "@/components/brand/logo"
import { LocaleSwitcher } from "@/components/shared/locale-switcher"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { AuthBrandPanel } from "@/components/auth/auth-brand-panel"
import { LoginPanel } from "@/components/auth/login-panel"
import { alternates } from "@/i18n/metadata"
import { idiomaDe } from "@/i18n/server"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/login">): Promise<Metadata> {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "auth.meta" })
  return {
    title: t("title"),
    description: t("description"),
    alternates: alternates("/login", locale),
  }
}

/** Etiqueta propia de cada enlace legal (`auth.page.legal`); el `href` sale de `legalNav`. */
const LEGAL = {
  "/legal/privacidad": "privacidad",
  "/legal/terminos": "terminos",
  "/legal/cookies": "cookies",
} as const satisfies Record<(typeof legalNav)[number]["href"], string>

/**
 * Acceso. Pantalla partida a todo el alto: a la izquierda la marca (desde lg),
 * a la derecha el formulario centrado. Sin la cabecera de marketing: aquí solo
 * se entra, y «Volver a la web» es la única salida visible.
 *
 * Desde `lg` la página mide exactamente la pantalla y no se desplaza: entrar
 * cabe entero. Lo único que puede desbordar es el alta —nombre, contraseña con
 * sus reglas, tipo de cuenta, edad y condiciones no caben en un portátil—, y
 * entonces se desplaza la columna del formulario, no la página: la marca, la
 * cabecera y el pie se quedan donde están. Por debajo de `lg` la página fluye
 * como cualquier otra, porque en un móvil no hay alto que valga.
 */
export default async function LoginPage({ params }: PageProps<"/[locale]/login">) {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "auth.page" })
  return (
    <div className="grid min-h-svh lg:h-svh lg:grid-cols-2">
      <AuthBrandPanel />

      <main
        id="contenido"
        className="flex min-h-svh flex-col bg-background px-5 sm:px-8 lg:h-svh lg:min-h-0 xl:px-12"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 py-4 [@media(max-height:760px)]:py-3">
          <Link href="/" aria-label={t("homeLabel")} className="lg:hidden">
            <Logo size="sm" />
          </Link>
          <Button variant="ghost" asChild className="-ml-3 max-lg:hidden">
            <Link href="/">
              <ArrowLeft /> {t("backToSite")}
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
        </header>

        {/* Lo único que se mueve. La cabecera y el pie se quedan quietos, y
            dentro el formulario se centra cuando cabe y se desplaza desde
            arriba cuando no: centrar el propio contenedor dejaría el principio
            del alta fuera de alcance. En un portátil bajo el aire se recorta
            para que entrar siga cabiendo entero */}
        {/* `relative` en el MISMO elemento que recorta: los radios y la
            casilla llevan dentro un `input` absoluto y, sin un ancestro
            posicionado, se anclan al `body`, se escapan del recorte y estiran
            el documento. Eran ellos los que hacían scrollear la página */}
        <div className="relative min-h-0 flex-1 lg:overflow-y-auto">
          <div className="flex min-h-full items-center justify-center py-6 [@media(max-height:760px)]:py-4">
            {/* nuqs lee el modo de la URL en el cliente: sin Suspense la ruta no se prerenderiza */}
            <Suspense
              fallback={<Skeleton className="h-[32rem] w-full max-w-md rounded-xl" />}
            >
              <LoginPanel />
            </Suspense>
          </div>
        </div>

        <footer className="flex shrink-0 flex-wrap items-center justify-center gap-x-5 gap-y-2 py-4 text-xs text-muted-foreground [@media(max-height:760px)]:py-3">
          <span>© {new Date().getFullYear()} Clipealo</span>
          {legalNav.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-foreground">
              {t(`legal.${LEGAL[l.href]}`)}
            </Link>
          ))}
          <Link href="/ayuda" className="hover:text-foreground">
            {t("needHelp")}
          </Link>
        </footer>
      </main>
    </div>
  )
}
