import Link from "next/link"
/** Entrada local y archivo index.html para la exportación estática. */
export default function Home() {
  return (
    <html lang="es">
      <head>
        <meta httpEquiv="refresh" content="0;url=/es/" />
      </head>
      <body>
        <Link href="/es/">Ir a Clipealo</Link>
      </body>
    </html>
  )
}
