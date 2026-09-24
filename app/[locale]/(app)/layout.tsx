import { idiomaDe } from "@/i18n/server"
import { IntlZone } from "@/i18n/zone"
import { AppSidebar } from "@/components/app/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default async function AppLayout({ children, params }: LayoutProps<"/[locale]">) {
  const locale = await idiomaDe(params)
  return (
    <IntlZone locale={locale} zone="app">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset id="contenido" className="min-w-0">
          {children}
        </SidebarInset>
      </SidebarProvider>
    </IntlZone>
  )
}
