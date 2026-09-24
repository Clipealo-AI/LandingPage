import type { Metadata } from "next"

import { listJobs } from "@/lib/api/jobs"
import { HerramientaPage, metadataHerramienta } from "@/components/app/herramienta-page"
import { OperacionesPanel } from "@/components/app/operaciones-panel"

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return metadataHerramienta(params, "recortar")
}

/** Recortar un tramo, tal cual: un trabajo más de la cola. */
export default async function RecortarPage({ params }: Props) {
  return (
    <HerramientaPage params={params} id="recortar">
      <OperacionesPanel iniciales={await listJobs()} operacion="recortar" />
    </HerramientaPage>
  )
}
