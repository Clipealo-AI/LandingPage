import { Suspense } from "react"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { AppTopbar } from "@/components/app/app-topbar"
import { Skeleton } from "@/components/ui/skeleton"
import { CampaignForm } from "@/components/campanas/campaign-form"
import { idiomaDe } from "@/i18n/server"
import { IntlExtra } from "@/i18n/zone"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/campanas/nueva">): Promise<Metadata> {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "campaigns.meta" })
  return { title: t("new") }
}

export default async function NuevaCampanaPage({
  params,
}: PageProps<"/[locale]/campanas/nueva">) {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "campaigns.crumbs" })
  return (
    <IntlExtra ns={["campaigns", "onboarding", "taxonomy"]}>
      <AppTopbar
        crumbs={[{ label: t("campaigns"), href: "/campanas" }, { label: t("new") }]}
      />
      <div className="@container/nueva container-app py-6">
        <Suspense fallback={<Skeleton className="h-[40rem] w-full rounded-xl" />}>
          <CampaignForm />
        </Suspense>
      </div>
    </IntlExtra>
  )
}
