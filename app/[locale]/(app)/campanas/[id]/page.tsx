import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { campanasSemilla } from "@/lib/campanas"
import { AppTopbar } from "@/components/app/app-topbar"
import { CampaignDetail } from "@/components/campanas/campaign-detail"
import { idiomaDe } from "@/i18n/server"
import { IntlExtra } from "@/i18n/zone"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/campanas/[id]">): Promise<Metadata> {
  const locale = await idiomaDe(params)
  const { id } = await params
  const campana = campanasSemilla.find((c) => c.id === id)
  // Las privadas no dan pistas ni en el título de la pestaña
  if (campana && !campana.privada) return { title: campana.titulo }
  const t = await getTranslations({ locale, namespace: "campaigns.meta" })
  return { title: t("detail") }
}

/**
 * Prerrenderiza las campañas de demo. Las creadas en la app viven en el
 * navegador (`hooks/use-campanas.ts`), así que el detalle se resuelve en el
 * cliente y un id desconocido enseña «no encontrada» en vez de un 404.
 */
export function generateStaticParams() {
  return campanasSemilla.map((c) => ({ id: c.id }))
}

export default async function CampanaPage({
  params,
}: PageProps<"/[locale]/campanas/[id]">) {
  const locale = await idiomaDe(params)
  const { id } = await params
  const t = await getTranslations({ locale, namespace: "campaigns.crumbs" })
  return (
    <IntlExtra
      ns={["campaigns", "campaignsAgencia", "compromisos", "onboarding", "taxonomy"]}
    >
      <AppTopbar
        crumbs={[{ label: t("campaigns"), href: "/campanas" }, { label: t("detail") }]}
      />
      <div className="@container/campana container-app space-y-6 py-6">
        <CampaignDetail id={id} />
      </div>
    </IntlExtra>
  )
}
