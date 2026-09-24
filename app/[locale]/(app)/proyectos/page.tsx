import type { Metadata } from "next"
import { Upload } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { Link } from "@/i18n/navigation"
import { listJobs } from "@/lib/api/jobs"
import { Button } from "@/components/ui/button"
import { AppTopbar } from "@/components/app/app-topbar"
import { ProjectsList } from "@/components/app/projects-list"
import { PageHeader } from "@/components/shared/page-header"
import { idiomaDe } from "@/i18n/server"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/proyectos">): Promise<Metadata> {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "app.nav" })
  return { title: t("projects") }
}

export default async function ProyectosPage({
  params,
}: PageProps<"/[locale]/proyectos">) {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "app" })
  return (
    <>
      <AppTopbar crumbs={[{ label: t("nav.projects") }]} />

      <div className="container-app space-y-6 py-6">
        <PageHeader
          title={t("nav.projects")}
          description={t("projects.description")}
          actions={
            // La barra lateral ya lleva el naranja de «Subir un video»:
            // repetirlo aquí ponía dos acciones `brand` en la misma pantalla
            <Button variant="outline" size="lg" asChild>
              <Link href="/subir">
                <Upload /> {t("nav.upload")}
              </Link>
            </Button>
          }
        />

        {/* El servidor pinta el estado inicial; el cliente sondea desde ahí */}
        <ProjectsList initialData={await listJobs()} />
      </div>
    </>
  )
}
