import type { Metadata } from "next"

import { listJobs } from "@/lib/api/jobs"
import { HerramientaPage, metadataHerramienta } from "@/components/app/herramienta-page"
import { PublicacionPanel } from "@/components/app/publicacion-panel"

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return metadataHerramienta(params, "publicacion")
}

/** La plantilla de un proyecto por red: el texto con el que salen sus clips. */
export default async function PublicacionPage({ params }: Props) {
  return (
    <HerramientaPage params={params} id="publicacion">
      <PublicacionPanel iniciales={await listJobs()} />
    </HerramientaPage>
  )
}
