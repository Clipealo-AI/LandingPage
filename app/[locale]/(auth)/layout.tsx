import { idiomaDe } from "@/i18n/server"
import { IntlZone } from "@/i18n/zone"

export default async function AuthLayout({ children, params }: LayoutProps<"/[locale]">) {
  const locale = await idiomaDe(params)
  return (
    <IntlZone locale={locale} zone="auth">
      {children}
    </IntlZone>
  )
}
