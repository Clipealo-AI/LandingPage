import type { Metadata } from "next"

import { listJobs } from "@/lib/api/jobs"
import { HerramientaPage, metadataHerramienta } from "@/components/app/herramienta-page"
import { OperacionesPanel } from "@/components/app/operaciones-panel"

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return metadataHerramienta(params, "reducir")
}

/** El mismo video con menos peso: un trabajo más de la cola. */
export default async function ReducirPage({ params }: Props) {
  return (
    <HerramientaPage params={params} id="reducir">
      <OperacionesPanel iniciales={await listJobs()} operacion="reducir" />
    </HerramientaPage>
  )
}
