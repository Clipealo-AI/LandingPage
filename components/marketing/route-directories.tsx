import { getTranslations } from "next-intl/server"

import {
  RouteCardGrid,
  RouteHero,
  RouteSection,
} from "@/components/marketing/route-page-ui"
import type { Locale } from "@/i18n/routing"
import { featureNavigation, useCaseNavigation } from "@/lib/marketing/navigation"

type Translator = (key: string) => string

export async function FeatureDirectory({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "routes" })
  const menu = await getTranslations({ locale, namespace: "marketing.header" })
  const copy = menu as unknown as Translator

  return (
    <>
      <RouteHero
        eyebrow={t("shared.featureIndexEyebrow")}
        title={t("shared.featureIndexTitle")}
        lead={t("shared.featureIndexLead")}
      />
      <RouteSection title={t("shared.whatYouCanDo")}>
        <RouteCardGrid
          items={featureNavigation.map(({ id, slug, icon }) => ({
            href: `/funciones/${slug}`,
            title: copy(`menuItems.${id}.title`),
            description: copy(`menuItems.${id}.description`),
            icon,
            actionLabel: t("shared.openFeature"),
          }))}
        />
      </RouteSection>
    </>
  )
}

export async function UseCaseDirectory({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "routes" })
  const menu = await getTranslations({ locale, namespace: "marketing.header" })
  const copy = menu as unknown as Translator

  return (
    <>
      <RouteHero
        eyebrow={t("shared.caseIndexEyebrow")}
        title={t("shared.caseIndexTitle")}
        lead={t("shared.caseIndexLead")}
      />
      <RouteSection title={t("shared.caseIndexEyebrow")}>
        <RouteCardGrid
          items={useCaseNavigation.map(({ id, slug, icon }) => ({
            href: `/casos/${slug}`,
            title: copy(`menuItems.${id}.title`),
            description: copy(`menuItems.${id}.description`),
            icon,
            actionLabel: t("shared.openCase"),
          }))}
        />
      </RouteSection>
    </>
  )
}
