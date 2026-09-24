"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import { barajarEstable, LIMITES_ONBOARDING } from "@/lib/onboarding"
import { COMO_NOS_CONOCISTE, type ComoNosConociste } from "@/lib/taxonomia"
import { Input } from "@/components/ui/input"
import { ChipGroup } from "@/components/onboarding/chip-group"
import { useFlujo } from "@/components/onboarding/contexto"

/**
 * «¿Cómo llegaste a Clipealo?» (opcional) del resultado, igual para el clipero
 * y para la agencia: texto corto y chips. Los chips van barajados de forma
 * estable con el correo como semilla, para no sugerir siempre lo mismo primero
 * (§3.2, D.6) y sin `Math.random`: el orden es el mismo al volver. «Otro», que
 * es el comodín, se queda fuera del barajado y va siempre el último.
 */
export function ComoLlegaste({
  campo,
  titulo,
}: {
  campo: "clipero.comoNosConociste" | "agencia.comoNosConociste"
  /** Bloque de claves: el del resultado del clipero o el del render de la agencia. */
  titulo:
    | "onboarding.resultado.extra.comoLlegaste"
    | "onboarding.agencia.render.extra.comoLlegaste"
}) {
  const ctx = useFlujo()
  const t = useTranslations(titulo)
  const tt = useTranslations("taxonomy.comoNosConociste")
  const { cuenta, responder } = ctx
  const id = React.useId()
  const actual = (campo === "clipero.comoNosConociste"
    ? cuenta.clipero.comoNosConociste
    : cuenta.agencia.comoNosConociste) ?? { chips: [] }
  const max = LIMITES_ONBOARDING.comoNosConocisteMax
  // Solo se barajan las opciones reales: el comodín «Otro» cierra la lista
  const chips = React.useMemo(
    () => [
      ...barajarEstable(
        COMO_NOS_CONOCISTE.filter((c) => c !== "otro"),
        cuenta.correo
      ),
      "otro" as const,
    ],
    [cuenta.correo]
  )

  const guardar = (siguiente: { texto?: string; chips: ComoNosConociste[] }) =>
    responder(campo, siguiente.texto || siguiente.chips.length ? siguiente : undefined)

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold">
          {t("label")}
        </label>
        <span className="text-xs text-muted-foreground tabular-nums">
          {t("counter", { n: actual.texto?.length ?? 0, max })}
        </span>
      </div>
      <Input
        id={id}
        className="h-11"
        maxLength={max}
        value={actual.texto ?? ""}
        placeholder={t("placeholder")}
        onChange={(e) => guardar({ ...actual, texto: e.target.value || undefined })}
      />
      <ChipGroup<ComoNosConociste>
        entrada={false}
        aria-label={t("chips")}
        value={actual.chips}
        onValueChange={(sel) => guardar({ ...actual, chips: sel })}
        options={chips.map((c) => ({ value: c, label: tt(c) }))}
      />
    </div>
  )
}
