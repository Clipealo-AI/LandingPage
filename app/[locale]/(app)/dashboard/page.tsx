import type { Metadata } from "next"
import { ArrowRight, Clapperboard, Eye, TrendingUp, Upload } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { Link } from "@/i18n/navigation"
import { getFormat } from "@/lib/format"
import { clips } from "@/lib/mock-data"
import { listJobs } from "@/lib/api/jobs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AppTopbar } from "@/components/app/app-topbar"
import { StatCard } from "@/components/shared/stat-card"
import { ClipCard } from "@/components/video/clip-card"
import { ActiveJobs } from "@/components/app/active-jobs"
import { DashboardGreeting } from "@/components/app/dashboard-greeting"
import { MinutesStat } from "@/components/app/minutes-stat"
import { ViewsChart } from "@/components/shared/graficas-diferidas"
import { MicroPanel } from "@/components/onboarding/micro-panel"
import { ProfileProgressCard } from "@/components/onboarding/profile-progress-card"
import { idiomaDe } from "@/i18n/server"
import { IntlExtra } from "@/i18n/zone"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard">): Promise<Metadata> {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "app.nav" })
  return { title: t("dashboard") }
}

export default async function DashboardPage({
  params,
}: PageProps<"/[locale]/dashboard">) {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "app" })
  const f = getFormat(locale)
  const totalViews = clips.reduce((sum, c) => sum + (c.metrics?.views ?? 0), 0)
  const published = clips.filter((c) => c.status === "publicado")
  const avgRetention = Math.round(
    published.reduce((sum, c) => sum + (c.metrics?.retention ?? 0), 0) /
      Math.max(published.length, 1)
  )

  return (
    <IntlExtra ns={["onboarding", "taxonomy"]}>
      <AppTopbar crumbs={[{ label: t("nav.dashboard") }]} />

      <div className="container-app space-y-8 py-6">
        {/* El nombre sale de la cuenta del navegador: el saludo es una isla de cliente */}
        <DashboardGreeting
          description={t("dashboard.summary", { videos: 2, clips: 4 })}
          actions={
            // La misma acción ya va en naranja en la barra lateral: aquí baja a
            // `outline` para que el panel no enseñe dos (o tres) botones brand
            <Button variant="outline" size="lg" asChild>
              <Link href="/subir">
                <Upload /> {t("nav.upload")}
              </Link>
            </Button>
          }
        />

        {/* Solo aparece si dejó la bienvenida a medias; se va sola al terminarla */}
        <ProfileProgressCard />

        <section
          aria-label={t("dashboard.metrics")}
          className="grid [grid-template-columns:repeat(auto-fit,minmax(15rem,1fr))] gap-3"
        >
          <StatCard
            featured
            label={t("dashboard.stats.views")}
            value={f.compact(totalViews)}
            delta={24}
            icon={Eye}
          />
          <StatCard
            label={t("dashboard.stats.published")}
            value={published.length}
            delta={12}
            icon={Clapperboard}
          />
          <StatCard
            label={t("dashboard.stats.retention")}
            value={f.percent(avgRetention)}
            delta={-3}
            icon={TrendingUp}
          />
          {/* Isla de cliente: los minutos incluidos son del plan y el plan solo
              se sabe en el navegador */}
          <MinutesStat />
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_clamp(20rem,24vw,30rem)]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("dashboard.weekViews")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ViewsChart />
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("dashboard.inProgress")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ActiveJobs initialData={await listJobs()} />
              </CardContent>
            </Card>

            {/* Como mucho una micropregunta por sesión, y nunca a mitad de una
                tarea. Va aquí, y no arriba del todo, porque se decide en el
                navegador y aparecía DESPUÉS de hidratar: empujaba 370 px hacia
                abajo todo el panel (CLS 0,15 en cada visita limpia). Detrás de
                «En proceso» crece sin mover nada que ya se estuviera leyendo, y
                se sigue viendo de un vistazo. */}
            <MicroPanel />
          </div>
        </div>

        <section aria-labelledby="recientes" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 id="recientes" className="text-lg font-bold tracking-tight">
              {t("dashboard.recent")}
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/proyectos">
                {t("dashboard.seeAll")} <ArrowRight />
              </Link>
            </Button>
          </div>

          {/* Aquí solo hay cuatro clips, así que la rejilla es `auto-fit` y no la
              `auto-fill` de /clips: las columnas de sobra se pliegan y las cuatro
              tarjetas llenan la fila en vez de dejar dos huecos a 2560 px */}
          <div className="grid [grid-template-columns:repeat(auto-fit,minmax(16rem,1fr))] gap-4">
            {clips.slice(0, 4).map((clip) => (
              <ClipCard key={clip.id} clip={clip} />
            ))}
          </div>
        </section>
      </div>
    </IntlExtra>
  )
}
