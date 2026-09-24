"use client"

import * as React from "react"
import { Link2 } from "lucide-react"
import { useTranslations } from "next-intl"

import { PLATAFORMA_LABEL, validarCanal } from "@/lib/ajustes"
import {
  LIMITES_ONBOARDING,
  analizarEnlaceCanal,
  type RespuestasCreador,
} from "@/lib/onboarding"
import {
  INTERES_CAMPANA_PROPIA,
  VERTICALES_ELEGIBLES,
  type InteresCampanaPropia,
} from "@/lib/taxonomia"
import { useFormat } from "@/hooks/use-format"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { ChipGroup } from "@/components/onboarding/chip-group"
import { ChoiceCards } from "@/components/onboarding/choice-cards"
import { useFlujo } from "@/components/onboarding/contexto"
import { CampoToma, Toma } from "@/components/onboarding/toma"
import { IconoPlataforma, plataformasReales } from "@/components/onboarding/tomas/directo"

type EnlaceGuardado = RespuestasCreador["enlaceCanal"]

/**
 * Texto con el que se vuelve a pintar un enlace ya reconocido, sin protocolo:
 * `twitch.tv/tucanal`, `kick.com/tucanal`, `youtube.com/@tucanal`, `tiktok.com/@tucanal`.
 */
export function textoDeEnlace(enlace: Pick<EnlaceGuardado, "plataforma" | "handle">) {
  switch (enlace.plataforma) {
    case "twitch":
      return `twitch.tv/${enlace.handle}`
    case "kick":
      return `kick.com/${enlace.handle}`
    case "youtube":
      return `youtube.com/@${enlace.handle}`
    case "tiktok":
      return `tiktok.com/@${enlace.handle}`
    case "facebook":
      return `facebook.com/${enlace.handle}`
  }
}

/** Lo último que tocó en la toma: decide qué reacción se ve («Responde X, ve Y»). */
type Ultimo = "temas" | "enlace" | "interes"

/**
 * Toma 3 del creador · mis videos (§2.5, §3.3): de qué va su canal.
 *
 * - Temas (obligatorio, hasta 3): chips de verticales con las teclas 1-9.
 * - «Enlace de tu canal (opcional)»: se reconoce mientras se escribe
 *   (`analizarEnlaceCanal`) y dice «Detectado: {plataforma} · @{handle}». El
 *   enlace reconocido se guarda al momento como `creador.enlaceCanal` (y pone la
 *   marca de agua en Ajustes › Perfil si el handle es válido); el texto crudo va
 *   al flujo con `setTextos` para el error `enlaceNoReconocido` al continuar.
 * - «¿Te gustaría que otros cliperos recorten tus directos?» (opcional): con
 *   «Sí, cuéntame» el resultado ofrece pedir el perfil de agencia.
 *
 * Reacción según lo último que cambió: marca de agua, interés o plantillas.
 */
export function TomaCanal() {
  const ctx = useFlujo()
  const t = useTranslations("onboarding.creador.canal")
  const te = useTranslations("onboarding.errors")
  const tt = useTranslations("taxonomy")
  const f = useFormat()
  const { cuenta, responder, setTextos } = ctx
  const cr = cuenta.creador
  const guardado = cr.enlaceCanal
  const temas = cr.verticalesCanal ?? []
  const transmite = plataformasReales(cr.plataformasDirecto).length > 0

  // El campo arranca con lo guardado; lo que se escribe vive aquí hasta reconocerlo
  const [texto, setTexto] = React.useState(() =>
    guardado ? textoDeEnlace(guardado) : ""
  )
  const [ultimo, setUltimo] = React.useState<Ultimo | null>(null)
  const idDetectado = React.useId()
  const idInteres = React.useId()

  const cambiarEnlace = (valor: string) => {
    setTexto(valor)
    setTextos({ enlaceCanal: valor })
    setUltimo("enlace")
    const enlace = analizarEnlaceCanal(valor)
    if (enlace) {
      if (
        enlace.plataforma !== guardado?.plataforma ||
        enlace.handle !== guardado?.handle
      )
        responder("creador.enlaceCanal", {
          plataforma: enlace.plataforma,
          handle: enlace.handle,
          verificado: false,
        })
    } else if (guardado) {
      responder("creador.enlaceCanal", undefined)
    }
  }

  const reaccionEnlace = guardado
    ? validarCanal(guardado.handle)
      ? t("reaction.canal", {
          plataforma: PLATAFORMA_LABEL[guardado.plataforma],
          handle: guardado.handle,
        })
      : t("reaction.marcaAgua", { handle: guardado.handle })
    : null
  const reaccionTemas = temas.length
    ? t("reaction.temas", { temas: f.list(temas.map((v) => tt(`verticales.${v}`))) })
    : null
  const reaccionInteres =
    cr.interesCampanaPropia === "si" ? t("reaction.interesSi") : null
  const porUltimo = {
    enlace: reaccionEnlace,
    interes: reaccionInteres,
    temas: reaccionTemas,
  } satisfies Record<Ultimo, string | null>
  const reaccion =
    (ultimo && porUltimo[ultimo]) || reaccionEnlace || reaccionTemas || reaccionInteres

  return (
    <Toma
      pregunta={t("question")}
      paraQue={t("why")}
      datos="estadisticas"
      reaccion={reaccion}
    >
      <CampoToma campo="verticalesCanal">
        {(a) => (
          <ChipGroup
            atajos
            value={temas}
            max={LIMITES_ONBOARDING.temasCanal}
            onLleno={(max) => ctx.anunciar(te("limiteElegidos", { max }))}
            onValueChange={(sel) => {
              setUltimo("temas")
              responder("creador.verticalesCanal", sel.length ? sel : undefined)
            }}
            aria-labelledby={a.etiquetaId}
            aria-describedby={a.describedBy}
            invalid={a.invalid}
            options={VERTICALES_ELEGIBLES.map((v) => ({
              value: v,
              label: tt(`verticales.${v}`),
            }))}
          />
        )}
      </CampoToma>

      <CampoToma
        campo="enlaceCanal"
        etiqueta={t("link.label")}
        htmlFor="toma-enlace-canal"
      >
        {(a) => (
          <div className="space-y-2">
            <InputGroup className="h-11 w-full @md/bienvenida:max-w-md">
              <InputGroupAddon>
                {guardado ? (
                  <IconoPlataforma plataforma={guardado.plataforma} className="size-4" />
                ) : (
                  <Link2 aria-hidden />
                )}
              </InputGroupAddon>
              <InputGroupInput
                id="toma-enlace-canal"
                className="h-full"
                type="url"
                inputMode="url"
                autoComplete="url"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="next"
                placeholder={t("link.placeholder")}
                value={texto}
                aria-invalid={a.invalid || undefined}
                aria-describedby={
                  [a.describedBy, guardado ? idDetectado : null]
                    .filter(Boolean)
                    .join(" ") || undefined
                }
                onChange={(e) => cambiarEnlace(e.target.value)}
              />
            </InputGroup>
            {guardado && (
              <p
                id={idDetectado}
                data-enlace-detectado={guardado.plataforma}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <IconoPlataforma plataforma={guardado.plataforma} className="size-4" />
                {t("link.detected", {
                  plataforma: PLATAFORMA_LABEL[guardado.plataforma],
                  handle: guardado.handle,
                })}
              </p>
            )}
          </div>
        )}
      </CampoToma>

      <div className="space-y-3">
        <p id={idInteres} className="text-sm font-medium text-pretty">
          {transmite ? t("interest.directos") : t("interest.videos")}
        </p>
        <ChoiceCards<InteresCampanaPropia>
          size="sm"
          className="@xl/bienvenida:grid-cols-3"
          value={cr.interesCampanaPropia}
          onValueChange={(v) => {
            setUltimo("interes")
            responder("creador.interesCampanaPropia", v)
          }}
          aria-labelledby={idInteres}
          options={INTERES_CAMPANA_PROPIA.map((id) => ({
            value: id,
            title: tt(`interesCampanaPropia.${id}`),
          }))}
        />
      </div>
    </Toma>
  )
}
