import { ArrowLeft } from "lucide-react"
import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { Logo } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"
import { PatternIsotipos } from "@/components/brand/patterns"

export default function NotFound() {
  const t = useTranslations("common.notFound")

  return (
    <main
      id="contenido"
      className="relative grid min-h-svh place-items-center overflow-hidden bg-ink-950 px-5"
    >
      <PatternIsotipos opacity={0.14} fade="edges" />

      <div className="relative max-w-md text-center">
        <Logo size="lg" className="text-white" />

        <p className="mt-10 display text-7xl text-brand">404</p>
        <h1 className="mt-3 display text-3xl text-ink-50">{t("title")}</h1>
        <p className="mt-4 text-sm text-pretty text-mist/70">{t("description")}</p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button variant="brand" size="lg" asChild>
            <Link href="/">
              <ArrowLeft /> {t("home")}
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            asChild
            className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          >
            <Link href="/proyectos">{t("clips")}</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
