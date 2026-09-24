"use client"

import * as React from "react"
import { X } from "lucide-react"
import { useTranslations } from "next-intl"

import { rangoCpmSimulador } from "@/lib/agencia"
import { creadorPorId, plataformaPrincipal, type CreadorId } from "@/lib/creadores"
import {
  LIMITES_ONBOARDING,
  analizarEnlaceCanal,
  umbralPublicoValor,
} from "@/lib/onboarding"
import {
  SECTORES,
  SECTOR_REGULADO,
  SECTOR_CANAL,
  VERTICALES_ELEGIBLES,
  tieneVarianteCanal,
} from "@/lib/taxonomia"
import { leerCuenta } from "@/hooks/use-cuenta"
import { useFormat } from "@/hooks/use-format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CropFrame } from "@/components/brand/logo"
import { ChipGroup } from "@/components/onboarding/chip-group"
import { ChoiceCards } from "@/components/onboarding/choice-cards"
import { useFlujo } from "@/components/onboarding/contexto"
import { AvatarCreador } from "@/components/onboarding/creator-avatar"
import { BuscadorCreadores } from "@/components/onboarding/tomas/fandom"
import { CampoToma, Toma } from "@/components/onboarding/toma"

/** Millares siempre agrupados («1.000 cliperos»), como `money` en `lib/format.ts`. */
const FORMATOS = { number: { agrupado: { useGrouping: "always" } } } as const

/**
 * Toma 3 de la agencia (§2.8): qué va a promocionar y de qué va el contenido.
 *
 * Sector en tarjetas, con la insignia «Revisión» en los regulados; temas del
 * material (hasta 3) y, opcional, el creador concreto del que salen los clips
 * (buscador de §4.1). En la variante de streamer o management el enlace del
 * canal es obligatorio y el sector va precargado en «entretenimiento y
 * creadores», editable.
 *
 * La reacción avisa de la revisión a mano en los sectores regulados y, si no,
 * da el CPM de referencia del sector.
 */
export function TomaPromocion() {
  const ctx = useFlujo()
  const t = useTranslations("onboarding.agencia.promocion")
  const te = useTranslations("onboarding.errors")
  const tt = useTranslations("taxonomy")
  const f = useFormat()
  const { cuenta, responder } = ctx
  const a = cuenta.agencia
  const variante = tieneVarianteCanal(a.tipoOrganizacion)
  const sector = a.sector

  // En la variante el sector se sabe de antemano; sigue siendo editable
  React.useEffect(() => {
    if (!variante) return
    const c = leerCuenta()
    if (!c.agencia.sector) responder("agencia.sector", SECTOR_CANAL, "inferido")
  }, [variante, responder])

  const creador = a.creadorId ? creadorPorId(a.creadorId) : null
  const umbralFans = creador ? umbralPublicoValor(creador.fansDemo) : null

  const quitarCreador = () => {
    const nombre = creador?.nombre ?? ""
    responder("agencia.creadorId", undefined)
    if (nombre) ctx.anunciar(t("creador.removed", { creador: nombre }))
  }

  /* Al quitar desde el chip, el foco pasa al buscador (igual que en `fandom`) */
  const focoAlBuscador = React.useRef(false)
  React.useEffect(() => {
    if (a.creadorId || !focoAlBuscador.current) return
    focoAlBuscador.current = false
    document.querySelector<HTMLElement>("[data-buscador-creadores] input")?.focus()
  }, [a.creadorId])

  const cpm = rangoCpmSimulador(sector)
  const nombreSector = sector ? tt(`sectores.${sector}`) : ""
  const reaccion = !sector
    ? null
    : SECTOR_REGULADO[sector]
      ? t("reaction.regulado", { sector: nombreSector })
      : cpm.referencia
        ? t("reaction.cpm", {
            sector: nombreSector,
            min: f.money(cpm.min, { decimals: 2 }),
            max: f.money(cpm.max, { decimals: 2 }),
          })
        : t("reaction.sinCpm", { sector: nombreSector })

  return (
    <Toma
      pregunta={t("question")}
      paraQue={t("why")}
      datos="agencias"
      reaccion={reaccion}
    >
      {variante && (
        <CampoToma
          campo="canal"
          etiqueta={t("fields.canal")}
          htmlFor="toma-canal-agencia"
        >
          {(x) => (
            <Input
              id="toma-canal-agencia"
              data-toma-foco=""
              className="h-11"
              inputMode="url"
              autoComplete="url"
              autoCapitalize="off"
              spellCheck={false}
              placeholder={t("fields.canalPlaceholder")}
              aria-invalid={x.invalid || undefined}
              aria-describedby={x.describedBy}
              onChange={(e) => {
                const texto = e.target.value
                ctx.setTextos({ canal: texto })
                const enlace = analizarEnlaceCanal(texto)
                responder(
                  "agencia.canal",
                  enlace
                    ? { plataforma: enlace.plataforma, handle: enlace.handle }
                    : undefined
                )
              }}
            />
          )}
        </CampoToma>
      )}

      <CampoToma campo="sector" etiqueta={t("fields.sector")}>
        {(x) => (
          <ChoiceCards
            atajos={!variante}
            size="sm"
            className="@xl/bienvenida:grid-cols-2 @[120rem]/bienvenida:grid-cols-3"
            value={sector}
            onValueChange={(v) => responder("agencia.sector", v)}
            aria-labelledby={x.etiquetaId}
            aria-describedby={x.describedBy}
            invalid={x.invalid}
            options={SECTORES.map((id) => ({
              value: id,
              title: tt(`sectores.${id}`),
              badge: SECTOR_REGULADO[id] ? (
                <Badge variant="warning">{t("regulado")}</Badge>
              ) : undefined,
            }))}
          />
        )}
      </CampoToma>

      <CampoToma
        campo="verticalesMaterial"
        etiqueta={variante ? t("fields.verticalesVariante") : t("fields.verticales")}
        ayuda={t("fields.verticalesHelp", {
          max: LIMITES_ONBOARDING.verticalesMaterial,
        })}
      >
        {(x) => (
          <ChipGroup
            value={a.verticalesMaterial ?? []}
            max={LIMITES_ONBOARDING.verticalesMaterial}
            onLleno={(max) => ctx.anunciar(te("limiteElegidos", { max }))}
            onValueChange={(sel) =>
              responder("agencia.verticalesMaterial", sel.length ? sel : undefined)
            }
            aria-labelledby={x.etiquetaId}
            aria-describedby={x.describedBy}
            invalid={x.invalid}
            options={VERTICALES_ELEGIBLES.map((v) => ({
              value: v,
              label: tt(`verticales.${v}`),
            }))}
          />
        )}
      </CampoToma>

      {!variante && (
        <div className="space-y-3">
          <BuscadorCreadores
            etiqueta={t("creador.label")}
            placeholder={t("creador.placeholder")}
            pais={a.pais}
            verticales={a.verticalesMaterial}
            pendientes={false}
            elegidos={a.creadorId ? [a.creadorId] : []}
            onElegir={(fan) => {
              if (typeof fan !== "string") return
              responder("agencia.creadorId", fan as CreadorId)
              ctx.anunciar(
                t("creador.chosen", { creador: creadorPorId(fan)?.nombre ?? fan })
              )
            }}
            onQuitar={quitarCreador}
          />
          {creador && (
            <>
              {/* El elegido, con su «Quitar»: misma lista de chips que la toma `fandom` */}
              <ul
                data-radar=""
                aria-label={t("creador.elegido")}
                className="flex flex-wrap gap-2.5"
              >
                <li data-fan={creador.id} className="max-w-full min-w-0">
                  <CropFrame size="sm" className="max-w-full rounded-full">
                    <span className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border border-primary bg-accent py-1 pr-1 pl-1.5 text-sm font-medium text-accent-foreground @[100rem]/bienvenida:min-h-12 @[100rem]/bienvenida:text-base">
                      <AvatarCreador
                        size="sm"
                        nombre={creador.nombre}
                        semilla={creador.id}
                        plataforma={plataformaPrincipal(creador)}
                      />
                      <span className="min-w-0 truncate">{creador.nombre}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="rounded-full hover:bg-primary/10"
                        aria-label={t("creador.remove", { creador: creador.nombre })}
                        onClick={() => {
                          focoAlBuscador.current = true
                          quitarCreador()
                        }}
                      >
                        <X aria-hidden />
                      </Button>
                    </span>
                  </CropFrame>
                </li>
              </ul>
              <p className="text-sm text-muted-foreground">
                {umbralFans
                  ? t(
                      "creador.fans",
                      { umbral: umbralFans, creador: creador.nombre },
                      FORMATOS
                    )
                  : t("creador.few", { creador: creador.nombre })}
              </p>
            </>
          )}
        </div>
      )}
    </Toma>
  )
}
