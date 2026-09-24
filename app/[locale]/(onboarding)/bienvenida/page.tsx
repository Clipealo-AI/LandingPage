import { Suspense } from "react"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { idiomaDe } from "@/i18n/server"
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow"
import { TomaSkeleton } from "@/components/onboarding/toma-skeleton"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/bienvenida">): Promise<Metadata> {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "onboarding.meta" })
  return {
    title: t("title"),
    description: t("description"),
    // Privada: ni se indexa ni entra en el sitemap (robots.txt también la bloquea)
    robots: { index: false, follow: false },
  }
}

/**
 * Bienvenida tras crear la cuenta. Estática: el paso, las respuestas y la
 * cuenta viven en el navegador. nuqs lee la consulta (`?paso=`, `?tipo=`,
 * `?next=`, `?modo=`, `?origen=`) en el cliente, así que va dentro de
 * `Suspense`; el esqueleto tiene la geometría de una toma.
 */
export default async function BienvenidaPage({
  params,
}: PageProps<"/[locale]/bienvenida">) {
  await idiomaDe(params)
  return (
    <Suspense fallback={<TomaSkeleton />}>
      <OnboardingFlow />
    </Suspense>
  )
}
