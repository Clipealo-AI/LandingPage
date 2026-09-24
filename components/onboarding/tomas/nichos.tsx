"use client"

import dynamic from "next/dynamic"
import { useTranslations } from "next-intl"

import {
  LIMITES_ONBOARDING,
  nichosDesdeSeleccion,
  seleccionDesdeNichos,
} from "@/lib/onboarding"
import { juegosDe } from "@/lib/creadores"
import {
  AUN_NO_SE,
  JUEGOS,
  JUEGO_NOMBRE,
  VERTICALES_ELEGIBLES,
  tieneNombreJuego,
  type JuegoId,
} from "@/lib/taxonomia"
import { useFormat } from "@/hooks/use-format"
import { ChipGroup } from "@/components/onboarding/chip-group"
import { useFlujo } from "@/components/onboarding/contexto"
import { CampoToma, Toma } from "@/components/onboarding/toma"

/** El buscador solo hace falta si marca gaming: se carga entonces. */
const GamePicker = dynamic(
  () => import("@/components/onboarding/game-picker").then((m) => m.GamePicker),
  { ssr: false }
  // `dynamic` pierde los genéricos: se recupera el tipo original del componente
) as typeof import("@/components/onboarding/game-picker").GamePicker

/**
 * Toma 2 del clipero · campañas (§2.4): qué le gustaría clipear. Hasta 5
 * verticales o «Aún no lo sé», que excluye al resto. Con gaming aparecen en
 * línea los 8 juegos de su país (opcional). La reacción cuenta las campañas
 * que encajan con lo marcado.
 *
 * El buscador de juegos («Busca un juego») y los detalles de §4.3 son del
 * agente de Fandom, que puede sustituir este archivo.
 */
export function TomaNichos() {
  const ctx = useFlujo()
  const t = useTranslations("onboarding.clipero.nichos")
  const te = useTranslations("onboarding.errors")
  const tt = useTranslations("taxonomy")
  const f = useFormat()
  const { cuenta, responder } = ctx
  const verticales = cuenta.clipero.verticales
  const seleccion = seleccionDesdeNichos(verticales)
  const conGaming = Array.isArray(verticales) && verticales.includes("gaming")
  const juegos = cuenta.clipero.juegos ?? []

  const reaccion =
    verticales === AUN_NO_SE
      ? t("reactionUnsure", { count: ctx.encajan })
      : Array.isArray(verticales) && verticales.length > 0
        ? t("reaction", {
            count: ctx.encajan,
            nichos: f.list(verticales.map((v) => tt(`verticales.${v}`))),
          })
        : null

  return (
    <Toma
      pregunta={t("question")}
      paraQue={t("why")}
      datos="estadisticas"
      reaccion={reaccion}
    >
      <CampoToma campo="verticales">
        {(a) => (
          <ChipGroup
            atajos
            value={seleccion}
            max={LIMITES_ONBOARDING.nichos}
            excluyentes={[AUN_NO_SE]}
            onLleno={(max) => ctx.anunciar(te("limiteElegidos", { max }))}
            onValueChange={(sel) => {
              responder(
                "clipero.verticales",
                sel.length ? nichosDesdeSeleccion(sel) : undefined
              )
              // Sin gaming, los juegos no se guardan
              if (!sel.includes("gaming") && juegos.length)
                responder("clipero.juegos", undefined)
            }}
            aria-labelledby={a.etiquetaId}
            aria-describedby={a.describedBy}
            invalid={a.invalid}
            options={[
              ...VERTICALES_ELEGIBLES.map((v) => ({
                value: v,
                label: tt(`verticales.${v}`),
              })),
              { value: AUN_NO_SE, label: tt("aunNoSe") },
            ]}
          />
        )}
      </CampoToma>

      {conGaming && (
        <CampoToma campo="juegos" etiqueta={t("games.label")}>
          {(a) => (
            <GamePicker<JuegoId>
              value={juegos}
              max={LIMITES_ONBOARDING.juegos}
              onLleno={(max) => ctx.anunciar(te("limiteElegidos", { max }))}
              onValueChange={(sel) =>
                responder("clipero.juegos", sel.length ? sel : undefined)
              }
              aria-labelledby={a.etiquetaId}
              aria-describedby={a.describedBy}
              destacados={juegosDe(cuenta.pais)}
              catalogo={JUEGOS}
              otro="otro-juego"
              etiquetaDe={(id) =>
                tieneNombreJuego(id) ? JUEGO_NOMBRE[id] : tt(`juegos.${id}`)
              }
              onEnterVacio={ctx.continuar}
              textos={{
                buscar: t("games.search.label"),
                resultados: t("games.search.results"),
                vacio: t("games.search.empty"),
                elegido: t("games.search.chosen"),
                borrar: t("games.search.clear"),
              }}
            />
          )}
        </CampoToma>
      )}
    </Toma>
  )
}
