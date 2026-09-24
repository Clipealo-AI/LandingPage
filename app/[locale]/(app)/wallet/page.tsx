import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { AppTopbar } from "@/components/app/app-topbar"
import { WalletDashboard } from "@/components/wallet/wallet-dashboard"
import { idiomaDe } from "@/i18n/server"
import { IntlExtra } from "@/i18n/zone"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/wallet">): Promise<Metadata> {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "campaigns.meta" })
  return { title: t("wallet") }
}

export default async function WalletPage({ params }: PageProps<"/[locale]/wallet">) {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "campaigns.crumbs" })
  return (
    <IntlExtra ns={["campaigns"]}>
      <AppTopbar crumbs={[{ label: t("wallet") }]} />
      <div className="@container/wallet container-app space-y-6 py-6">
        <WalletDashboard />
      </div>
    </IntlExtra>
  )
}
