import type { Metadata } from "next"

import { listJobs } from "@/lib/api/jobs"
import { HerramientaPage, metadataHerramienta } from "@/components/app/herramienta-page"
import { VariantesPanel } from "@/components/app/variantes-panel"

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return metadataHerramienta(params, "variantes")
}

/** De un clip, varias versiones que son contenido distinto: cada una, un trabajo. */
export default async function VariantesPage({ params }: Props) {
  return (
    <HerramientaPage params={params} id="variantes">
      <VariantesPanel iniciales={await listJobs()} />
    </HerramientaPage>
  )
}
