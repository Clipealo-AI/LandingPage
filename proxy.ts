import { NextResponse, type NextRequest } from "next/server"
import createMiddleware from "next-intl/middleware"

import { ADMIN_LOCALE, LOCALE_COOKIE, routing, type Locale } from "@/i18n/routing"

const handleI18n = createMiddleware(routing)

/** «/admin…», «/en/admin…» o «/pt/admin…» (y «/es/admin…», que next-intl quitaría). */
const RUTA_ADMIN = /^\/(?:(es|en|pt)\/)?admin(\/.*)?$/

const esIdioma = (valor: string | undefined): valor is Locale =>
  routing.locales.includes(valor as Locale)

/**
 * Resuelve el idioma de cada petición: prefijo, cookie y, la primera vez, el
 * navegador. El backoffice es la excepción: manda su propia preferencia
 * (`ADMIN_LOCALE`, inglés si no hay elección) y no escribe la cookie del sitio.
 */
export default function proxy(request: NextRequest) {
  const admin = request.nextUrl.pathname.match(RUTA_ADMIN)
  if (!admin) return handleI18n(request)

  const guardado = request.cookies.get(ADMIN_LOCALE.cookie)?.value
  const preferido: Locale = esIdioma(guardado) ? guardado : ADMIN_LOCALE.default
  const actual: Locale = esIdioma(admin[1]) ? admin[1] : routing.defaultLocale

  if (actual !== preferido) {
    const url = request.nextUrl.clone()
    const prefijo = preferido === routing.defaultLocale ? "" : `/${preferido}`
    url.pathname = `${prefijo}/admin${admin[2] ?? ""}`
    return NextResponse.redirect(url)
  }

  const response = handleI18n(request)
  // Entrar al admin en inglés no debe pasar el resto del sitio a inglés
  const cookies = response.headers.getSetCookie()
  const sinIdiomaDelSitio = cookies.filter((c) => !c.startsWith(`${LOCALE_COOKIE}=`))
  if (sinIdiomaDelSitio.length !== cookies.length) {
    response.headers.delete("set-cookie")
    sinIdiomaDelSitio.forEach((c) => response.headers.append("set-cookie", c))
  }
  return response
}

export const config = {
  // Fuera: API, estáticos de Next y cualquier archivo con extensión (sitemap.xml, icon.svg)
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
}
