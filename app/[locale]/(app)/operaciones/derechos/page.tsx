import type { Metadata } from "next"

import { HerramientaPage, metadataHerramienta } from "@/components/app/herramienta-page"
import { DerechosPanel } from "@/components/app/derechos-panel"
import { IntlExtra } from "@/i18n/zone"

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return metadataHerramienta(params, "derechos")
}

/** Qué permite cada campaña y cómo va la lista blanca: el permiso, no la huella. */
export default async function DerechosPage({ params }: Props) {
  return (
    <IntlExtra ns={["campaigns"]}>
      <HerramientaPage params={params} id="derechos">
        <DerechosPanel />
      </HerramientaPage>
    </IntlExtra>
  )
}
