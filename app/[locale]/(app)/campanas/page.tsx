import { Suspense } from "react"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { AppTopbar } from "@/components/app/app-topbar"
import { Skeleton } from "@/components/ui/skeleton"
import { CampaignsExplorer } from "@/components/campanas/campaigns-explorer"
import { ProfileProgressCard } from "@/components/onboarding/profile-progress-card"
import { idiomaDe } from "@/i18n/server"
import { IntlExtra } from "@/i18n/zone"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/campanas">): Promise<Metadata> {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "campaigns.meta" })
  return { title: t("campaigns") }
}

export default async function CampanasPage({ params }: PageProps<"/[locale]/campanas">) {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "campaigns.crumbs" })
  return (
    <IntlExtra ns={["campaigns", "compromisos", "onboarding", "taxonomy"]}>
      <AppTopbar crumbs={[{ label: t("campaigns") }]} />
      {/* `@container/campanas`: la rejilla sigue el sitio real, con la barra lateral abierta o plegada */}
      <div className="@container/campanas container-app space-y-6 py-6">
        {/* Aquí aterriza «Más tarde» del onboarding, así que aquí hay que
            recordarle que dejó el perfil a medias: el aviso le decía que lo
            retomara desde su panel y lo dejaba en otra pantalla. Apagada,
            porque el naranja de esta vista es «Crear campaña» */}
        <ProfileProgressCard destacado={false} />
        {/* nuqs lee la URL en el cliente: sin Suspense la ruta no se prerenderiza */}
        <Suspense
          fallback={
            <div className="space-y-6">
              <Skeleton className="h-16 w-full max-w-2xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-96 w-full rounded-xl" />
            </div>
          }
        >
          <CampaignsExplorer />
        </Suspense>
      </div>
    </IntlExtra>
  )
}
