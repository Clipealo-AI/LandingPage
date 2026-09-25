/* eslint-disable @next/next/no-html-link-for-pages -- fuera de un idioma no hay
   navegación con prefijo: cada enlace carga el documento entero en su idioma */
import "./globals.css"

/**
 * 404 fuera de cualquier idioma. Sin layout ni textos traducidos:
 * se ofrece la portada en los tres idiomas, cada enlace con su `lang` para que el
 * lector de pantalla lo pronuncie bien.
 */
export default function NotFound() {
  return (
    <html lang="es">
      <body className="grid min-h-svh place-items-center bg-ink-950 px-5 text-center text-ink-50 antialiased">
        <main>
          <p className="display text-7xl text-brand">404</p>
          <nav className="mt-8 flex justify-center gap-6 text-sm underline underline-offset-4">
            <a href="/es/" hrefLang="es">
              Inicio
            </a>
            <a href="/en/" lang="en" hrefLang="en">
              Home
            </a>
            <a href="/pt/" lang="pt-BR" hrefLang="pt-BR">
              Início
            </a>
          </nav>
        </main>
      </body>
    </html>
  )
}
