import { redirect } from "@/i18n/navigation"
import { idiomaDe } from "@/i18n/server"

/** La facturación es una pestaña de Ajustes; esta ruta se conserva para los enlaces antiguos. */
export default async function FacturacionPage({
  params,
}: PageProps<"/[locale]/ajustes/facturacion">) {
  const locale = await idiomaDe(params)
  redirect({ href: { pathname: "/ajustes", query: { seccion: "facturacion" } }, locale })
}
