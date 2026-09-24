"use client"

import { useTranslations } from "next-intl"

import { primerNombre } from "@/hooks/use-cuenta"
import { TIPOS_ORGANIZACION } from "@/lib/taxonomia"
import { ChoiceCards } from "@/components/onboarding/choice-cards"
import { useFlujo } from "@/components/onboarding/contexto"
import { CampoToma, Toma } from "@/components/onboarding/toma"

/**
 * Toma 1 de la agencia (§2.8): a quién representa (11 tarjetas, teclas 1-9).
 * Al elegir, la reacción dice qué plantilla de campaña le espera.
 */
export function TomaTipoOrg() {
  const ctx = useFlujo()
  const t = useTranslations("onboarding.agencia.tipo-org")
  const tt = useTranslations("taxonomy.tiposOrganizacion")
  const { cuenta, responder } = ctx
  const nombre = primerNombre(cuenta.nombre)

  const tipo = cuenta.agencia.tipoOrganizacion

  return (
    <Toma
      saludo={
        ctx.numero !== 1
          ? null
          : nombre
            ? t("greeting", { nombre, total: ctx.total })
            : t("greetingSinNombre", { total: ctx.total })
      }
      pregunta={t("question")}
      paraQue={t("why")}
      datos="agencias"
      reaccion={tipo ? t(`reaction.${tipo}`) : null}
    >
      <CampoToma campo="tipoOrganizacion">
        {(a) => (
          <ChoiceCards
            atajos
            size="sm"
            className="@xl/bienvenida:grid-cols-2"
            value={tipo}
            onValueChange={(v) => responder("agencia.tipoOrganizacion", v)}
            aria-labelledby={a.etiquetaId}
            aria-describedby={a.describedBy}
            invalid={a.invalid}
            options={TIPOS_ORGANIZACION.map((id) => ({ value: id, title: tt(id) }))}
          />
        )}
      </CampoToma>
    </Toma>
  )
}
