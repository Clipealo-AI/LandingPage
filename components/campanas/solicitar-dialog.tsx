"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  Check,
  Clock,
  Gavel,
  Lock,
  Send,
  TimerOff,
  Upload,
  X,
  type LucideIcon,
} from "lucide-react"

import { LOCALE_TAG } from "@/i18n/routing"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { COUNTRY_CODES } from "@/lib/countries"
import {
  HOY_CAMPANAS,
  noAdmiteClips,
  type Campana,
  type EstadoVisto,
} from "@/lib/campanas"
import {
  PLAN_MINIMO,
  puedeParticipar,
  type PlanRef,
  type PricingPlanId,
} from "@/lib/pricing"
import { requisitosQueFaltan } from "@/lib/micro-preguntas"
import { SOCIAL_NETWORKS } from "@/lib/social"
import { esId } from "@/lib/taxonomia"
import {
  NOTA_MAX,
  diasHasta,
  estadoParticipacion,
  modoDe,
  participacionDe,
  perfilParaAgencia,
  plazoDe,
  puedeEntregar,
  validarSolicitud,
  type MotivoDecision,
  type Participacion,
  type PerfilParaAgencia,
} from "@/lib/participacion"
import { useCampanas } from "@/hooks/use-campanas"
import { usePlan } from "@/hooks/use-plan"
import { inicialesDe, useCuenta, useCuentaLista } from "@/hooks/use-cuenta"
import { useFormat } from "@/hooks/use-format"
import { AvisoPlan } from "@/components/planes/aviso-plan"
import { useNombrePlan } from "@/components/planes/nombre-plan"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { SocialGlyph } from "@/components/brand/social"
import { CountryFlag, useCountryName } from "@/components/shared/country-flag"
import { DataLabel } from "@/components/onboarding/data-label"
import { RequisitosCampana } from "@/components/onboarding/micro-question"

/**
 * La cara del clipero en una campaña (docs/campanas-ciclo-2026-09.md).
 *
 * Una campaña decide con quién trabaja: el clipero **solicita**, la agencia ve
 * su perfil y acepta o rechaza, y desde que acepta corre un plazo. Aquí viven
 * las dos piezas de ese lado:
 *
 * - `AccionCampana`: el botón principal de la tarjeta y del detalle, que dice
 *   dónde está esta persona («Solicitar entrar», «Subir clip» con su cuenta
 *   atrás, «En revisión», «Listo») y, cuando no puede hacer nada, **escribe el
 *   motivo al lado** en vez de limitarse a apagarse.
 * - `SolicitarDialog`: el diálogo de solicitud, con la misma ficha que verá la
 *   agencia (`perfilParaAgencia`), su etiqueta de datos y la nota opcional.
 *
 * El «ahora» es `HOY_CAMPANAS` en todo lo que se pinta: el reloj de verdad solo
 * se lee dentro de los manejadores (lo hace `hooks/use-campanas.ts`).
 */

/* ---------------------------------------------------------------------------
   Qué puede hacer el clipero, y si no puede, por qué
   --------------------------------------------------------------------------- */

/**
 * El botón que toca pintar. `clave` elige etiqueta e icono; lo demás es lo que
 * hay que escribir al lado para que nadie se quede mirando un botón apagado.
 */
export type AccionClipero =
  /** `planMinimo` presente = el botón se pinta, apagado, y hace falta ese plan. */
  | { clave: "solicitar"; planMinimo?: PricingPlanId }
  | { clave: "entregar"; dias: number | null; planMinimo?: PricingPlanId }
  | { clave: "solicitada" | "revision" | "cumplida" | "caducada" }
  | { clave: "disputa" }
  | { clave: "rechazada"; motivo?: MotivoDecision }
  | { clave: "bloqueada"; estado: Exclude<EstadoVisto, "activa"> }

/**
 * Las dos claves que hacen algo al pulsarlas; el resto solo informan. Con un
 * plan que no llega, la acción sigue siendo la suya —el botón conserva su
 * etiqueta y su icono, que es lo que dice qué haría— pero no se puede pulsar.
 */
export const accionActiva = (a: AccionClipero) =>
  (a.clave === "solicitar" || a.clave === "entregar") && a.planMinimo === undefined

/**
 * El compromiso que manda en la tarjeta: el vivo y, si no hay, el rechazo que
 * hubo (`participacionDe` no lo devuelve a propósito, pero el clipero merece
 * saber que le dijeron que no, y por qué). Retirarse no deja rastro: se puede
 * volver a solicitar.
 */
export function miParticipacion(
  participaciones: readonly Participacion[],
  campanaId: string,
  userId: string
): Participacion | null {
  const viva = participacionDe(participaciones, campanaId, userId)
  if (viva) return viva
  const suyas = participaciones.filter(
    (p) => p.campanaId === campanaId && p.userId === userId
  )
  const ultima = suyas[suyas.length - 1]
  return ultima?.estado === "rechazada" ? ultima : null
}

/**
 * Dónde está esta persona en esta campaña. El compromiso manda sobre el estado
 * de la campaña: quien ya está dentro entrega aunque las inscripciones estén
 * cerradas (para eso se cierran, para terminar con los que hay).
 */
export function accionClipero(
  campana: Campana,
  estado: EstadoVisto,
  participacion: Participacion | null,
  plan: PlanRef,
  ahora: string = HOY_CAMPANAS
): AccionClipero {
  // Un compromiso manda sobre todo: quien ya está dentro termina lo que empezó,
  // le pase lo que le pase a su suscripción. El plazo lo dio la agencia y el
  // plan es un contrato con Clipealo: cancelar uno no puede incumplir el otro
  if (participacion) {
    const suyo = estadoParticipacion(participacion, ahora)
    if (suyo === "solicitada") return { clave: "solicitada" }
    if (suyo === "entregada") return { clave: "revision" }
    if (suyo === "cumplida") return { clave: "cumplida" }
    if (suyo === "caducada") return { clave: "caducada" }
    if (suyo === "en-disputa") return { clave: "disputa" }
    if (suyo === "rechazada") return { clave: "rechazada", motivo: participacion.motivo }
    if (suyo === "aceptada") {
      // Termina lo que empezó aunque se cierren las inscripciones, pero una
      // campaña pausada, agotada o vencida no admite clips de nadie: ofrecer
      // «Subir clip» ahí mandaba al clipero a un compositor que se lo iba a
      // rechazar por «fuera de ventana»
      if (noAdmiteClips(estado)) return { clave: "bloqueada", estado }
      if (puedeEntregar(campana, participacion, ahora))
        return { clave: "entregar", dias: diasHasta(participacion.venceEn, ahora) }
    }
  }
  // Sin compromiso vivo manda la campaña: si no admite a nadie nuevo, se dice
  if (estado !== "activa") return { clave: "bloqueada", estado }
  // Y solo entonces el plan: nunca se vende una mejora que no desbloquearía nada
  const planMinimo = puedeParticipar(plan) ? undefined : PLAN_MINIMO.participarCampanas
  // En una campaña abierta, entregar ES entrar: el plan la apaga igual
  if (modoDe(campana) === "abierta") return { clave: "entregar", dias: null, planMinimo }
  return { clave: "solicitar", planMinimo }
}

const ICONO: Record<AccionClipero["clave"], LucideIcon> = {
  solicitar: Send,
  solicitada: Clock,
  entregar: Upload,
  revision: Clock,
  cumplida: Check,
  rechazada: X,
  caducada: TimerOff,
  disputa: Gavel,
  bloqueada: Lock,
}

/**
 * El botón principal de una campaña y, debajo, en qué anda o por qué no puede.
 * La tarjeta le pasa su botón de «ver» en `extra` para que compartan fila.
 */
export function AccionCampana({
  campana,
  estado,
  onEntregar,
  extra,
  size,
  variant = "secondary",
  alinear = "start",
}: {
  campana: Campana
  estado: EstadoVisto
  /** Abrir el diálogo de subir clip, que lo tiene la vista. */
  onEntregar?: () => void
  /** Acción secundaria en la misma fila (el icono de «ver» de la tarjeta). */
  extra?: React.ReactNode
  size?: React.ComponentProps<typeof Button>["size"]
  variant?: React.ComponentProps<typeof Button>["variant"]
  /** `end` en la cabecera del detalle, donde la acción va a la derecha. */
  alinear?: "start" | "end"
}) {
  const t = useTranslations("campaigns.participation")
  const f = useFormat()
  const { participaciones, cuenta } = useCampanas()
  const { plan } = usePlan()
  const nombrePlan = useNombrePlan()
  const idAviso = React.useId()
  const [solicitando, setSolicitando] = React.useState(false)

  // Quien creó la campaña no entra en ella: su sitio es decidir y cerrar
  const esDueno = campana.creadaPor.userId === cuenta.userId
  const participacion = miParticipacion(participaciones, campana.id, cuenta.userId)
  const accion = accionClipero(campana, estado, participacion, plan)
  if (esDueno) {
    // Sin botón —quien paga la campaña no se solicita a sí misma— pero con su
    // fila: devolver `null` se llevaba por delante el acceso de la tarjeta y
    // dejaba un escalón vacío en la fila, sin decir siquiera que es suya
    const esperando = participaciones.filter(
      (p) =>
        p.campanaId === campana.id &&
        estadoParticipacion(p, HOY_CAMPANAS) === "solicitada"
    ).length
    return (
      <div
        className={
          alinear === "end"
            ? "flex flex-col items-end gap-1.5"
            : "flex flex-col items-start gap-1.5"
        }
      >
        <div className="flex w-full items-center gap-2">
          <p className="min-w-0 flex-1 text-sm font-medium">{t("owner.label")}</p>
          {extra}
        </div>
        <p
          className={
            alinear === "end"
              ? "text-right text-xs text-pretty text-muted-foreground"
              : "text-xs text-pretty text-muted-foreground"
          }
        >
          {esperando > 0 ? t("owner.waiting", { n: esperando }) : t("owner.note")}
        </p>
      </div>
    )
  }
  const Icono = ICONO[accion.clave]
  // Sin quien abra el diálogo de subir clip (vista previa), el botón no promete nada
  const activa =
    accionActiva(accion) && (accion.clave !== "entregar" || Boolean(onEntregar))

  // El plan solo se enseña cuando mejorar desbloquearía algo: si la campaña ya
  // está vencida o cerrada, gana su estado
  const planQueFalta =
    (accion.clave === "solicitar" || accion.clave === "entregar") && accion.planMinimo
      ? accion.planMinimo
      : null

  const explicacion = (() => {
    switch (accion.clave) {
      case "bloqueada":
        return accion.estado === "vencida"
          ? t("blocked.vencida", { date: f.date(campana.fin) })
          : t(`blocked.${accion.estado}`)
      case "solicitada":
        return t("note.solicitada", { brand: campana.marca })
      case "entregar": {
        if (accion.dias === null) return null
        // Con la fecha límite: «Te quedan 6 días» sin el día es lo único que
        // decía, en la letra más pequeña de la página, que ya estás dentro
        const date = f.date(participacion?.venceEn ?? campana.fin)
        return accion.dias <= 0
          ? t("note.ultimoDia", { date })
          : t("note.dias", { n: accion.dias, date })
      }
      case "revision":
        return t("note.revision", { brand: campana.marca })
      case "cumplida":
        return t("note.cumplida")
      case "caducada":
        return t("note.caducada")
      case "disputa":
        return t("note.disputa")
      case "rechazada":
        return t(`decision.${accion.motivo ?? "otro"}`)
      default:
        return null
    }
  })()

  return (
    <div
      className={
        alinear === "end"
          ? "flex flex-col items-end gap-1.5"
          : "flex flex-col items-start gap-1.5"
      }
    >
      <div className="flex w-full gap-2">
        <Button
          variant={variant}
          size={size}
          className={extra ? "flex-1" : undefined}
          disabled={!activa}
          // Un `disabled` sale del orden de tabulación: sin esto, el motivo
          // escrito debajo no se alcanza nunca con el teclado
          aria-describedby={planQueFalta ? idAviso : undefined}
          onClick={
            accion.clave === "solicitar"
              ? () => setSolicitando(true)
              : accion.clave === "entregar"
                ? onEntregar
                : undefined
          }
        >
          <Icono /> {t(`action.${accion.clave}`)}
        </Button>
        {extra}
      </div>
      {planQueFalta ? (
        <AvisoPlan
          id={idAviso}
          alinear={alinear}
          motivo={t("blocked.plan", { plan: nombrePlan(planQueFalta) })}
        />
      ) : (
        explicacion && (
          <p
            className={cn(
              "text-pretty text-muted-foreground",
              alinear === "end" ? "text-right" : "",
              // El compromiso vivo no es una nota al pie: es el estado de quien mira
              accion.clave === "entregar"
                ? "text-sm font-medium text-foreground"
                : "text-xs"
            )}
          >
            {explicacion}
          </p>
        )
      )}
      <SolicitarDialog
        campana={campana}
        open={solicitando}
        onOpenChange={setSolicitando}
      />
    </div>
  )
}

/* ---------------------------------------------------------------------------
   El diálogo de solicitud
   --------------------------------------------------------------------------- */

/**
 * Pedir entrar en una campaña. Enseña, antes de enviar, exactamente la ficha
 * que verá quien decide: solicitar **es** el consentimiento para enseñarla.
 */
export function SolicitarDialog({
  campana,
  open,
  onOpenChange,
}: {
  campana: Campana | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open && campana !== null} onOpenChange={onOpenChange}>
      {/* Más ancho en pantallas grandes: a 2560 px el diálogo se quedaba en
          608 px justo cuando hay que leer con calma lo que verá la marca */}
      <DialogContent className="sm:max-w-lg lg:max-w-2xl">
        {campana && (
          <Formulario
            key={campana.id}
            campana={campana}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function Formulario({ campana, onDone }: { campana: Campana; onDone: () => void }) {
  const t = useTranslations("campaigns.participation")
  const tr = useTranslations("onboarding.micro.requisitos")
  const f = useFormat()
  const { participaciones, envios, cuenta, solicitarParticipacion } = useCampanas()
  const { plan } = usePlan()
  const nombrePlan = useNombrePlan()
  const { cuenta: perfil } = useCuenta()
  const cuentaLista = useCuentaLista()
  const [requisitosHechos, setRequisitosHechos] = React.useState(false)
  const [nota, setNota] = React.useState("")
  const idNota = React.useId()

  const mios = envios.filter((e) => e.userId === cuenta.userId)
  const ficha = perfilParaAgencia(perfil, mios, nota.trim())
  const errores = validarSolicitud(
    campana,
    {
      participacion: participacionDe(participaciones, campana.id, cuenta.userId),
      participaciones,
      nota,
      redes: perfil.clipero.redes ?? [],
      pais: perfil.pais,
      plan,
    },
    HOY_CAMPANAS
  )
  // Redes y país se arreglan aquí mismo (abajo); el resto solo se puede contar
  const bloquean = errores.filter(
    (e) => e.bloquea && e.code !== "sinRedes" && e.code !== "sinPais"
  )

  const enviar = (e: React.FormEvent) => {
    e.preventDefault()
    if (bloquean.length > 0) return
    solicitarParticipacion({
      campanaId: campana.id,
      userId: cuenta.userId,
      clipero: cuenta.nombre,
      nota: nota.trim() || undefined,
    })
    toast.success(t("sent"), {
      description: t("sentDescription", { brand: campana.marca }),
    })
    onDone()
  }

  // Redes, país e idiomas son obligatorios para entrar en una campaña (§6.5):
  // se piden antes, con la misma puerta que al enviar un clip
  const faltan = cuentaLista && !requisitosHechos ? requisitosQueFaltan(perfil) : []
  if (faltan.length > 0) {
    return (
      <div className="space-y-5">
        <DialogHeader>
          <DialogTitle>{tr("title")}</DialogTitle>
          <DialogDescription>
            {tr("description", {
              n: faltan.length,
              campos: f.list(
                faltan.map((campo) => tr(`campos.${campo}`)),
                "conjunction"
              ),
            })}
          </DialogDescription>
        </DialogHeader>
        <RequisitosCampana faltan={faltan} onListo={() => setRequisitosHechos(true)} />
      </div>
    )
  }

  return (
    <form onSubmit={enviar} className="space-y-5">
      <DialogHeader>
        <DialogTitle>{t("dialog.title", { title: campana.titulo })}</DialogTitle>
        <DialogDescription>
          {t("dialog.description", {
            brand: campana.marca,
            days: plazoDe(campana),
          })}
        </DialogDescription>
      </DialogHeader>

      <FichaParaAgencia ficha={ficha} marca={campana.marca} />

      <Field>
        <div className="flex items-baseline justify-between gap-3">
          <FieldLabel htmlFor={idNota}>{t("dialog.note")}</FieldLabel>
          <span className="text-xs text-muted-foreground tabular-nums">
            {t("dialog.counter", { n: nota.length, max: NOTA_MAX })}
          </span>
        </div>
        <Textarea
          id={idNota}
          rows={3}
          value={nota}
          maxLength={NOTA_MAX}
          placeholder={t("dialog.notePlaceholder")}
          onChange={(e) => setNota(e.target.value)}
        />
        <FieldDescription>{t("dialog.noteHint")}</FieldDescription>
      </Field>

      {/* Los códigos de `validarSolicitud` se traducen aquí; nunca al revés */}
      {bloquean.length > 0 && (
        <ul className="space-y-1 rounded-lg bg-muted p-3 text-sm text-destructive">
          {bloquean.map((e) => (
            <li key={e.code}>
              {e.code === "notaLarga"
                ? t("errors.notaLarga", { max: NOTA_MAX })
                : e.code === "planInsuficiente"
                  ? t("errors.planInsuficiente", {
                      plan: nombrePlan(PLAN_MINIMO.participarCampanas),
                    })
                  : t(`errors.${e.code}`)}
            </li>
          ))}
        </ul>
      )}

      <DialogFooter>
        <Button type="submit" variant="brand" disabled={bloquean.length > 0}>
          <Send /> {t("dialog.send")}
        </Button>
      </DialogFooter>
    </form>
  )
}

/* ---------------------------------------------------------------------------
   La ficha: lo que verá la agencia, y nada más
   --------------------------------------------------------------------------- */

/**
 * Nombre del idioma en el idioma activo («Español», «Portuguese»), con la
 * inicial en mayúscula: el código («ES») no deja ver si es país o idioma.
 */
function useNombreIdioma() {
  const locale = useLocale()
  return React.useMemo(() => {
    const tag = LOCALE_TAG[locale]
    const nombres = new Intl.DisplayNames([tag], { type: "language" })
    return (codigo: string) => {
      const nombre = nombres.of(codigo) ?? codigo
      return nombre.charAt(0).toLocaleUpperCase(tag) + nombre.slice(1)
    }
  }, [locale])
}

function FichaParaAgencia({ ficha, marca }: { ficha: PerfilParaAgencia; marca: string }) {
  const t = useTranslations("campaigns.participation")
  const tt = useTranslations("taxonomy")
  const f = useFormat()
  const nombrePais = useCountryName()
  const nombreIdioma = useNombreIdioma()
  const id = React.useId()

  const pais = esId(COUNTRY_CODES, ficha.pais) ? ficha.pais : null
  const historial = ficha.historial

  return (
    <section
      aria-labelledby={id}
      className="@container space-y-3 rounded-xl bg-muted/50 p-4 ring-1 ring-border"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 id={id} className="text-sm font-semibold text-pretty">
          {t("dialog.profileTitle", { brand: marca })}
        </h3>
        <DataLabel quien="agencias" />
      </div>

      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground"
        >
          {inicialesDe(ficha.nombre || "·")}
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold">{ficha.nombre}</p>
          <p className="flex min-w-0 items-center gap-1.5 truncate text-xs text-muted-foreground">
            {pais && <CountryFlag code={pais} />}
            {[
              pais ? nombrePais(pais) : null,
              ficha.idiomas.length
                ? f.list(ficha.idiomas.map(nombreIdioma), "conjunction")
                : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </div>

      <dl className="grid gap-x-4 gap-y-2.5 @md:grid-cols-2">
        {ficha.redes.length > 0 && (
          <Dato etiqueta={t("dialog.fields.networks")}>
            <ul className="space-y-0.5">
              {ficha.redes.map((r) => (
                <li key={r.red} className="flex items-center gap-1.5">
                  <SocialGlyph
                    network={r.red}
                    tone="official"
                    className="size-4 shrink-0"
                    aria-hidden
                  />
                  <span className="truncate">{SOCIAL_NETWORKS[r.red].name}</span>
                  {r.tramo && (
                    <span className="truncate text-muted-foreground">
                      {tt(`tramosSeguidores.${r.tramo}`)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Dato>
        )}

        {ficha.temas.length > 0 && (
          <Dato etiqueta={t("dialog.fields.topics")}>
            {/* Una píldora por tema, como en la bandeja de la agencia: unidos
                con «y», y llevando cada tema su propia «y» dentro, salía
                «Podcasts y entrevistas y Negocios y emprendimiento» */}
            <span className="flex flex-wrap gap-1">
              {ficha.temas.map((v) => (
                <Badge key={v} variant="outline">
                  {tt(`verticales.${v}`)}
                </Badge>
              ))}
            </span>
          </Dato>
        )}

        <Dato etiqueta={t("dialog.fields.clipealo")}>
          {historial.enviados === 0 ? (
            t("dialog.noHistory")
          ) : (
            <span className="space-y-0.5">
              <span className="block">
                {t("dialog.history", {
                  approved: historial.aprobados,
                  sent: historial.enviados,
                })}
              </span>
              {historial.tasaAprobacion !== null && (
                <span className="block text-muted-foreground">
                  {t("dialog.rate", { pct: f.percent(historial.tasaAprobacion) })}
                </span>
              )}
              {historial.vistasMedianas !== null && (
                <span className="block text-muted-foreground">
                  {t("dialog.medianViews", {
                    views: f.compact(historial.vistasMedianas),
                  })}
                </span>
              )}
            </span>
          )}
        </Dato>

        {ficha.experiencia && (
          <Dato etiqueta={t("dialog.fields.experience")}>
            {tt(`experiencia.${ficha.experiencia}`)}
          </Dato>
        )}

        {ficha.disponibilidad && (
          <Dato etiqueta={t("dialog.fields.availability")}>
            {tt(`disponibilidad.${ficha.disponibilidad}`)}
          </Dato>
        )}
      </dl>

      <p className="text-xs text-pretty text-muted-foreground">
        {t("dialog.profileHint")}
      </p>
    </section>
  )
}

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {etiqueta}
      </dt>
      <dd className="min-w-0 text-sm">{children}</dd>
    </div>
  )
}
