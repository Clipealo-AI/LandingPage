import type { Metadata } from "next"

import { Hero } from "@/components/marketing/hero"
import { Comunidad } from "@/components/marketing/comunidad"
import { Reframe } from "@/components/marketing/reframe"
import { Features } from "@/components/marketing/features"
import { Steps } from "@/components/marketing/steps"
import { Redes } from "@/components/marketing/redes"
import { Pricing } from "@/components/marketing/pricing"
import { Faq } from "@/components/marketing/faq"
import { Cta } from "@/components/marketing/cta"
import { MotionObserver } from "@/components/marketing/motion-observer"
import { PointerLight } from "@/components/marketing/pointer-light"
import { alternates } from "@/i18n/metadata"
import { idiomaDe } from "@/i18n/server"

/** Título y descripción los pone el layout raíz (`common.meta`); aquí, canónica y hreflang. */
export async function generateMetadata({
  params,
}: PageProps<"/[locale]">): Promise<Metadata> {
  const locale = await idiomaDe(params)
  return { alternates: alternates("/", locale) }
}

export default async function LandingPage({ params }: PageProps<"/[locale]">) {
  await idiomaDe(params)
  return (
    <>
      <Hero />
      <Comunidad />
      <Reframe />
      <Features />
      <Steps />
      <Redes />
      <Pricing />
      <Faq />
      <Cta />
      {/* Movimiento: grupos «al entrar en pantalla» de las secciones de servidor y
          luz bajo el puntero. Últimos a propósito: sus efectos corren con todo ya
          hidratado. Sin interfaz propia. */}
      <MotionObserver />
      <PointerLight />
    </>
  )
}
