"use client"

import type { ReactNode } from "react"
import { Layers, Scissors, Wallet } from "lucide-react"
import { useTranslations } from "next-intl"

import { primerNombre } from "@/hooks/use-cuenta"
import { OBJETIVOS_USO, type ObjetivoUso } from "@/lib/taxonomia"
import { ChoiceCards } from "@/components/onboarding/choice-cards"
import { useFlujo } from "@/components/onboarding/contexto"
import { CampoToma, Toma } from "@/components/onboarding/toma"

const ICONO: Record<ObjetivoUso, ReactNode> = {
  campanas: <Wallet />,
  "mis-videos": <Scissors />,
  ambos: <Layers />,
}

/**
 * Toma 1 del clipero (§2.4): qué viene a hacer. Decide la rama (campañas, mis
 * videos o las dos cosas) y el destino. Teclas 1-3.
 */
export function TomaObjetivo() {
  const ctx = useFlujo()
  const t = useTranslations("onboarding.clipero.objetivo")
  const objetivo = ctx.cuenta.clipero.objetivo
  const nombre = primerNombre(ctx.cuenta.nombre)

  return (
    <Toma
      saludo={
        ctx.numero === 1
          ? nombre
            ? t("greeting", { nombre, total: ctx.total })
            : t("greetingSinNombre", { total: ctx.total })
          : null
      }
      pregunta={t("question")}
      paraQue={t("why")}
      datos="estadisticas"
      reaccion={objetivo ? t(`reaction.${objetivo}`) : null}
    >
      <CampoToma campo="objetivo">
        {(a) => (
          <ChoiceCards
            atajos
            value={objetivo}
            onValueChange={(v) => ctx.responder("clipero.objetivo", v)}
            aria-labelledby={a.etiquetaId}
            aria-describedby={a.describedBy}
            invalid={a.invalid}
            options={OBJETIVOS_USO.map((id) => ({
              value: id,
              title: t(`options.${id}.title`),
              description: t(`options.${id}.description`),
              icon: ICONO[id],
            }))}
          />
        )}
      </CampoToma>
    </Toma>
  )
}
