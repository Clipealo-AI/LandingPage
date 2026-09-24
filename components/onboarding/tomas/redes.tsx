"use client"

import { Globe } from "lucide-react"
import { useTranslations } from "next-intl"

import { redesDe } from "@/lib/planes"
import { SOCIAL_IDS, SOCIAL_NETWORKS, type SocialId } from "@/lib/social"
import { SIN_CUENTA, esId, type RedPublicacion } from "@/lib/taxonomia"
import { usePlan } from "@/hooks/use-plan"
import { SocialGlyph } from "@/components/brand/social"
import { useNombrePlan } from "@/components/planes/nombre-plan"
import { ChipGroup } from "@/components/onboarding/chip-group"
import { useFlujo } from "@/components/onboarding/contexto"
import { CampoToma, Toma } from "@/components/onboarding/toma"

/**
 * Toma 4 del clipero (§2.4): dónde publica. Logos oficiales de las seis redes,
 * «Otra red» y «Aún no tengo cuenta» (excluyente). La reacción usa la duración
 * y el formato que premia la primera red (`SOCIAL_NETWORKS`).
 */
export function TomaRedes() {
  const ctx = useFlujo()
  const { plan } = usePlan()
  const nombrePlan = useNombrePlan()
  const redesPlan = redesDe(plan)
  const t = useTranslations("onboarding.clipero.redes")
  const tt = useTranslations("taxonomy.redesPublicacion")
  const redes = ctx.cuenta.clipero.redes ?? []
  const primera = redes.find((r): r is SocialId => esId(SOCIAL_IDS, r))

  const reaccion = primera
    ? t("reaction.red", {
        red: SOCIAL_NETWORKS[primera].name,
        min: SOCIAL_NETWORKS[primera].sweetSpot[0],
        max: SOCIAL_NETWORKS[primera].sweetSpot[1],
        formato: SOCIAL_NETWORKS[primera].aspects[0],
      })
    : redes.includes(SIN_CUENTA)
      ? t("reaction.sinCuenta")
      : redes.length
        ? t("reaction.otra")
        : null

  return (
    <Toma
      pregunta={t("question")}
      paraQue={t("why")}
      datos="estadisticas"
      reaccion={reaccion}
    >
      <CampoToma campo="redes">
        {(a) => (
          <ChipGroup<RedPublicacion>
            atajos
            value={redes}
            excluyentes={[SIN_CUENTA]}
            onValueChange={(sel) =>
              ctx.responder("clipero.redes", sel.length ? sel : undefined)
            }
            aria-labelledby={a.etiquetaId}
            aria-describedby={a.describedBy}
            invalid={a.invalid}
            options={[
              ...SOCIAL_IDS.map((id) => ({
                value: id,
                label: SOCIAL_NETWORKS[id].name,
                icon: <SocialGlyph network={id} tone="official" />,
              })),
              { value: "otra" as const, label: tt("otra"), icon: <Globe /> },
              { value: SIN_CUENTA, label: tt("sin-cuenta") },
            ]}
          />
        )}
      </CampoToma>
      {/* Marcar una red es decir dónde publicas, y eso es cierto tengas el plan
          que tengas: no se apaga ninguna. Lo que sí se dice es cuál se puede
          conectar, que es lo que la persona descubría dos pantallas después */}
      {redesPlan.length < SOCIAL_IDS.length && (
        <p className="text-sm text-pretty text-muted-foreground">
          {t("soloConecta", {
            plan: nombrePlan(plan),
            red: SOCIAL_NETWORKS[redesPlan[0]].name,
          })}
        </p>
      )}
    </Toma>
  )
}
