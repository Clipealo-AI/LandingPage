import { WikiTopbar, type Miga } from "@/components/wiki/wiki-topbar"

/** Una página de la wiki: su cabecera con sus migas y el contenido con el ancho de la app. */
export function PaginaWiki({
  migas,
  children,
}: {
  migas: Miga[]
  children: React.ReactNode
}) {
  return (
    <>
      <WikiTopbar migas={migas} />
      <div className="container-app py-8 lg:py-10">{children}</div>
    </>
  )
}
