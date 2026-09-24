"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Check, Gavel, X } from "lucide-react"

import { toast } from "@/lib/toast"
import {
  HOY_CAMPANAS,
  liquidar,
  redondear,
  topePorVideo,
  type Campana,
} from "@/lib/campanas"
import { estadoVisible } from "@/lib/campanas"
import {
  MOTIVOS_DECISION,
  PERFILES_DEMO,
  aceptar,
  diasHasta,
  disputasPosibles,
  estadoParticipacion,
  inscripcionesAbiertas,
  pendientesDe,
  perfilParaAgencia,
  plazasLibres,
  plazoDe,
  type MotivoDecision,
  type Participacion,
  type PerfilParaAgencia,
} from "@/lib/participacion"
import { cn } from "@/lib/utils"
import { useCampanas } from "@/hooks/use-campanas"
import { useCuenta } from "@/hooks/use-cuenta"
import { useFormat } from "@/hooks/use-format"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldContent, FieldLabel, FieldTitle } from "@/components/ui/field"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { InfoHint } from "@/components/campanas/campaign-bits"
import { DisputaDialog } from "@/components/campanas/disputa-dialog"
import { PerfilClipero } from "@/components/campanas/perfil-clipero"

/**
 * La cara de la agencia en una campaña: **con quién trabajo**.
 *
 * Arriba, el tablero que hace estrategia solo con lo que existe (plazas, clips
 * comprometidos, presupuesto que comprometen al tope por video, días y ritmo);
 * debajo, la bandeja de solicitudes: por cada una, la ficha del clipero
 * (`PerfilClipero`) y las dos únicas decisiones posibles, aceptar o rechazar con
 * motivo. Nada de cifras inventadas: si no sale del dominio, no se enseña.
 *
 * Montaje: es una pieza suelta, pensada para la pestaña «Solicitudes» del
 * detalle de campaña (`components/campanas/campaign-detail.tsx`), visible solo
 * para quien creó la campaña. Aquí no se comprueba la propiedad: eso lo decide
 * quien la monta.
 *
 * El «ahora» llega por prop y por defecto es `HOY_CAMPANAS`, como el resto de
 * campañas: nunca `Date.now()` al pintar (rompe la hidratación). La hora real
 * solo se lee dentro de los manejadores, al decidir.
 */
export function SolicitudesAgencia({
  campana,
  ahora = HOY_CAMPANAS,
  perfilDe,
  className,
}: {
  campana: Campana
  /** Instante desde el que se derivan estados y plazos. */
  ahora?: string
  /**
   * De dónde sale la ficha de cada solicitante. Por defecto se compone con lo
   * que el almacén sabe de verdad (`perfilParaAgencia`): con la API real, aquí
   * entrará el perfil que devuelva el servidor.
   */
  perfilDe?: (participacion: Participacion) => PerfilParaAgencia
  className?: string
}) {
  const t = useTranslations("campaignsAgencia.solicitudes")
  const tm = useTranslations("campaignsAgencia.motivos")
  const f = useFormat()
  const { participaciones, envios, decidirSolicitud } = useCampanas()
  const perfilPorDefecto = usePerfilDeSolicitud()
  const ficha = perfilDe ?? perfilPorDefecto
  const [rechazando, setRechazando] = React.useState<Participacion | null>(null)

  const liquidacion = React.useMemo(() => liquidar(campana, envios), [campana, envios])
  const estado = estadoVisible(campana, liquidacion, ahora)
  const libres = plazasLibres(campana, participaciones, ahora)
  // Quien ya está dentro entrega aunque las inscripciones se cierren; entrar es otra
  // cosa: solo una campaña activa (`estadoVisible`) admite gente nueva
  const admiteNuevos = estado === "activa"
  const puedeAceptar = admiteNuevos && libres !== 0

  const solicitudes = participaciones
    .filter(
      (p) => p.campanaId === campana.id && estadoParticipacion(p, ahora) === "solicitada"
    )
    .sort((a, b) => a.solicitadaEn.localeCompare(b.solicitadaEn))

  const decidirAceptar = (p: Participacion) => {
    // La misma transición que aplica el hook, para poder decir el plazo exacto
    const vence = aceptar(p, campana, new Date().toISOString()).venceEn ?? campana.fin
    decidirSolicitud(p, campana, "aceptar")
    toast.success(t("accepted.title", { name: p.clipero }), {
      description: t("accepted.description", { date: f.date(vence) }),
    })
  }

  const decidirRechazar = (p: Participacion, motivo: MotivoDecision) => {
    decidirSolicitud(p, campana, "rechazar", motivo)
    setRechazando(null)
    toast(t("rejected.title"), {
      description: t("rejected.description", {
        name: p.clipero,
        reason: tm(motivo),
      }),
      sound: "remove",
    })
  }

  return (
    <section className={cn("@container/solicitudes space-y-6", className)}>
      <TableroCampana campana={campana} ahora={ahora} />

      <div className="space-y-4">
        <header className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold tracking-tight">{t("title")}</h3>
            {solicitudes.length > 0 && (
              <Badge variant="secondary">{t("count", { n: solicitudes.length })}</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {t("description", { days: plazoDe(campana) })}
          </p>
        </header>

        {/* Por qué no se puede aceptar, escrito: el botón apagado nunca explica solo */}
        {!inscripcionesAbiertas(campana) ? (
          <Alert>
            <AlertTitle>{t("closed.title")}</AlertTitle>
            <AlertDescription>{t("closed.description")}</AlertDescription>
          </Alert>
        ) : !admiteNuevos ? (
          <Alert>
            <AlertTitle>{t("noNuevos.title")}</AlertTitle>
            <AlertDescription>{t("noNuevos.description")}</AlertDescription>
          </Alert>
        ) : null}
        {/* Sin plazas no es un error: es un aviso de que hay que liberar alguna */}
        {admiteNuevos && libres === 0 && (
          <Alert>
            <AlertDescription>{t("full")}</AlertDescription>
          </Alert>
        )}

        {solicitudes.length === 0 ? (
          <Empty className="rounded-xl ring-1 ring-border">
            <EmptyHeader>
              <EmptyTitle>{t("empty.title")}</EmptyTitle>
              <EmptyDescription>{t("empty.description")}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="grid gap-4 @3xl/solicitudes:grid-cols-2 @[90rem]/solicitudes:grid-cols-3">
            {solicitudes.map((p) => (
              <li key={p.id}>
                <Card className="h-full">
                  <CardContent className="flex-1">
                    <PerfilClipero perfil={ficha(p)} />
                  </CardContent>
                  <CardFooter className="flex-col items-stretch gap-3 border-t pt-4">
                    <p className="text-xs text-muted-foreground">
                      {t("requested", { date: f.date(p.solicitadaEn) })}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => decidirAceptar(p)}
                        disabled={!puedeAceptar}
                        aria-label={t("acceptAria", { name: p.clipero })}
                      >
                        <Check /> {t("accept")}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setRechazando(p)}
                        aria-label={t("rejectAria", { name: p.clipero })}
                      >
                        <X /> {t("reject")}
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Quién está dentro: los compromisos vivos, que son los que impiden
          cerrar la campaña. Y es el único sitio donde la agencia puede reclamar
          cuando alguien aceptó y no entrega: sin esto, `no-entrego` no existía. */}
      <DentroDeLaCampana campana={campana} ahora={ahora} />

      {/* `key` en el componente, no en su formulario: el motivo elegido vive en
          el estado del diálogo, así que sin esto la siguiente solicitud llegaba
          con el motivo de la anterior ya marcado */}
      <RechazarDialog
        key={rechazando?.id ?? "sin-solicitud"}
        participacion={rechazando}
        onOpenChange={(abierto) => !abierto && setRechazando(null)}
        onRechazar={decidirRechazar}
      />
    </section>
  )
}

/**
 * El tablero de la campaña para quien la paga. Cinco cifras, todas derivadas:
 * plazas ocupadas, clips que se esperan por lo aceptado, lo que comprometen al
 * tope por video, días que quedan y el ritmo necesario para repartir lo que
 * queda. Se exporta aparte por si el detalle lo quiere fuera de la bandeja.
 */
export function TableroCampana({
  campana,
  ahora = HOY_CAMPANAS,
  className,
}: {
  campana: Campana
  ahora?: string
  className?: string
}) {
  const t = useTranslations("campaignsAgencia.tablero")
  const f = useFormat()
  const { participaciones, envios } = useCampanas()

  const liquidacion = React.useMemo(() => liquidar(campana, envios), [campana, envios])
  const pendientes = pendientesDe(campana.id, participaciones, ahora)
  const libres = plazasLibres(campana, participaciones, ahora)
  const dentro = participaciones.filter((p) => {
    if (p.campanaId !== campana.id) return false
    const e = estadoParticipacion(p, ahora)
    return e === "aceptada" || e === "entregada" || e === "cumplida" || e === "en-disputa"
  }).length

  const tope = topePorVideo(campana)
  // Caso peor honesto: cada compromiso vivo puede llevarse como mucho el tope
  const esperados = pendientes.aceptadas.length
  const comprometido = redondear(esperados * tope)
  const restante = liquidacion.restante
  const dias = Math.max(0, diasHasta(campana.fin, ahora) ?? 0)
  const cabenAlTope = Math.floor(restante / tope)

  return (
    <Card className={cn("@container/tablero", className)}>
      <CardHeader>
        <CardTitle className="text-base">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-x-6 gap-y-5 @lg/tablero:grid-cols-2 @3xl/tablero:grid-cols-3 @6xl/tablero:grid-cols-5">
          <Dato
            label={t("plazas.label")}
            ayuda={t("plazas.help")}
            valor={
              campana.plazas != null
                ? t("plazas.value", { taken: dentro, total: campana.plazas })
                : t("plazas.unlimited")
            }
            pie={
              campana.plazas != null
                ? t("plazas.free", { n: libres ?? 0 })
                : t("plazas.inside", { n: dentro })
            }
          />
          <Dato
            label={t("esperados.label")}
            ayuda={t("esperados.help")}
            valor={t("esperados.value", { n: esperados })}
            pie={t("esperados.review", { n: pendientes.sinRevisar.length })}
          />
          <Dato
            label={t("comprometido.label")}
            ayuda={t("comprometido.help", { cap: f.money(tope) })}
            valor={f.money(comprometido)}
            pie={t("comprometido.left", { amount: f.money(restante) })}
            aviso={comprometido > restante ? t("comprometido.exceeds") : undefined}
          >
            <Progress
              value={restante > 0 ? Math.min(100, (comprometido / restante) * 100) : 100}
              aria-label={t("comprometido.aria")}
              className="mt-2"
            />
          </Dato>
          <Dato
            label={t("dias.label")}
            ayuda={t("dias.help")}
            valor={t("dias.value", { n: dias })}
            pie={
              dias > 0
                ? t("dias.ends", { date: f.date(campana.fin) })
                : t("dias.over", { date: f.date(campana.fin) })
            }
          />
          <Dato
            label={t("ritmo.label")}
            ayuda={t("ritmo.help")}
            valor={
              restante < 0.01
                ? t("ritmo.none")
                : dias === 0
                  ? t("ritmo.over")
                  : t("ritmo.value", { amount: f.money(restante / dias) })
            }
            pie={restante < 0.01 ? undefined : t("ritmo.clips", { n: cabenAlTope })}
          />
        </dl>
      </CardContent>
    </Card>
  )
}

/** Una cifra del tablero: qué es (con su ⓘ), cuánto, y de dónde sale. */
function Dato({
  label,
  ayuda,
  valor,
  pie,
  aviso,
  children,
}: {
  label: string
  ayuda: string
  valor: string
  pie?: string
  /** Lo que hay que saber aunque no se mire el número. */
  aviso?: string
  children?: React.ReactNode
}) {
  return (
    <div className="space-y-0.5">
      <dt className="flex items-center gap-0.5 text-sm text-muted-foreground">
        {label}
        <InfoHint label={label}>{ayuda}</InfoHint>
      </dt>
      <dd className="space-y-0.5">
        <p className="text-xl leading-tight font-bold tabular-nums">{valor}</p>
        {pie && <p className="text-xs text-muted-foreground">{pie}</p>}
        {aviso && <p className="text-xs font-medium text-warning">{aviso}</p>}
        {children}
      </dd>
    </div>
  )
}

/**
 * Rechazar con motivo. Los códigos son los de `MOTIVOS_DECISION` menos
 * `inscripciones-cerradas`, que no se elige a mano: lo pone el rechazo en bloque
 * al cerrar inscripciones (`CerrarCampana`).
 */
const MOTIVOS_A_MANO = MOTIVOS_DECISION.filter((m) => m !== "inscripciones-cerradas")

function RechazarDialog({
  participacion,
  onOpenChange,
  onRechazar,
}: {
  participacion: Participacion | null
  onOpenChange: (abierto: boolean) => void
  onRechazar: (participacion: Participacion, motivo: MotivoDecision) => void
}) {
  const t = useTranslations("campaignsAgencia.solicitudes.dialog")
  const tm = useTranslations("campaignsAgencia.motivos")
  // Sin motivo de partida: con el primero preseleccionado, «Rechazar solicitud»
  // nacía activo y un clic de más rechazaba con un motivo que nadie eligió
  const [motivo, setMotivo] = React.useState<MotivoDecision | null>(null)

  return (
    <Dialog open={participacion !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {participacion && (
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault()
              if (motivo) onRechazar(participacion, motivo)
            }}
          >
            <DialogHeader>
              <DialogTitle>{t("title", { name: participacion.clipero })}</DialogTitle>
              <DialogDescription>{t("description")}</DialogDescription>
            </DialogHeader>

            <RadioGroup
              value={motivo ?? ""}
              onValueChange={(v) => setMotivo(v as MotivoDecision)}
              aria-label={t("legend")}
              className="gap-2"
            >
              {MOTIVOS_A_MANO.map((m) => (
                <FieldLabel key={m} htmlFor={`motivo-${m}`}>
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>{tm(m)}</FieldTitle>
                    </FieldContent>
                    <RadioGroupItem value={m} id={`motivo-${m}`} />
                  </Field>
                </FieldLabel>
              ))}
            </RadioGroup>

            <DialogFooter className="flex-col items-stretch gap-2 sm:flex-row sm:items-center">
              {/* El apagado siempre con su motivo escrito, como el resto */}
              {!motivo && (
                <p className="text-xs text-muted-foreground sm:mr-auto">
                  {t("needReason")}
                </p>
              )}
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" variant="outline" disabled={!motivo}>
                <X /> {t("confirm")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

/**
 * El perfil que viaja con cada solicitud, compuesto con lo que el arquetipo sabe
 * de verdad: las respuestas del onboarding solo existen para la cuenta de esta
 * demo, así que del resto se enseña su nombre, su historial de envíos y su nota,
 * y lo demás se escribe como «no lo ha dicho». Con la API real esto se sustituye
 * por el perfil que devuelva el servidor (prop `perfilDe`).
 */
function usePerfilDeSolicitud() {
  const { envios, cuenta } = useCampanas()
  const { cuenta: propia } = useCuenta()
  return React.useCallback(
    (p: Participacion): PerfilParaAgencia =>
      perfilParaAgencia(
        p.userId === cuenta.userId
          ? {
              nombre: p.clipero,
              pais: propia.pais,
              idiomas: propia.idiomas,
              clipero: propia.clipero,
            }
          : {
              nombre: p.clipero,
              // Los cliperos de la demo traen su ficha escrita en las semillas
              ...(PERFILES_DEMO[p.userId] ?? { pais: null, idiomas: [], clipero: {} }),
            },
        envios.filter((e) => e.userId === p.userId),
        p.nota
      ),
    [cuenta.userId, envios, propia]
  )
}

/**
 * Los compromisos vivos de la campaña, para quien la paga: quién está dentro,
 * en qué anda y cuánto plazo le queda. Es también el único sitio donde la
 * agencia puede **reclamar** (`no-entrego`) cuando alguien aceptó, se le pasó el
 * plazo y no contesta: el laudo del admin es lo único que desbloquea la campaña.
 */
/** Los estados que esta lista puede pintar: los otros ya se han filtrado. */
type EstadoDentro = "aceptada" | "entregada" | "cumplida" | "caducada" | "en-disputa"

function DentroDeLaCampana({ campana, ahora }: { campana: Campana; ahora: string }) {
  const t = useTranslations("campaignsAgencia.dentro")
  const { participaciones, envios } = useCampanas()
  const [reclamando, setReclamando] = React.useState<Participacion | null>(null)

  const dentro = participaciones
    .filter((p) => {
      if (p.campanaId !== campana.id) return false
      const e = estadoParticipacion(p, ahora)
      return e !== "solicitada" && e !== "rechazada" && e !== "retirada"
    })
    .sort((a, b) => (a.venceEn ?? "").localeCompare(b.venceEn ?? ""))

  const envioDe = (p: Participacion) =>
    p.envioId ? (envios.find((e) => e.id === p.envioId) ?? null) : null

  return (
    <section aria-labelledby="agencia-dentro" className="space-y-3">
      <header className="space-y-1">
        <h3 id="agencia-dentro" className="text-lg font-bold tracking-tight">
          {t("titulo")}
        </h3>
        <p className="text-sm text-muted-foreground">{t("descripcion")}</p>
      </header>

      {dentro.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("vacio")}</p>
      ) : (
        <ul className="grid gap-2 @2xl/solicitudes:grid-cols-2">
          {dentro.map((p) => {
            const estado = estadoParticipacion(p, ahora)
            const dias = diasHasta(p.venceEn, ahora)
            const motivos = disputasPosibles(p, envioDe(p), "agencia", ahora)
            return (
              <li
                key={p.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl bg-card p-3 ring-1 ring-border"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{p.clipero}</span>
                  <span className="block text-sm text-muted-foreground">
                    {t(`estado.${estado as EstadoDentro}`)}
                    {dias !== null && estado === "aceptada" && (
                      <> · {t("plazo", { n: Math.max(0, dias) })}</>
                    )}
                    {dias !== null && estado === "caducada" && (
                      <> · {t("vencido", { n: Math.abs(dias) })}</>
                    )}
                  </span>
                </span>
                {motivos.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReclamando(p)}
                    aria-label={t("reclamarAria", { name: p.clipero })}
                  >
                    <Gavel /> {t("reclamar")}
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <DisputaDialog
        key={reclamando?.id ?? "sin-reclamacion"}
        participacion={reclamando}
        envio={reclamando ? envioDe(reclamando) : null}
        abrePor="agencia"
        titulo={campana.titulo}
        clipero={reclamando?.clipero}
        open={reclamando !== null}
        onOpenChange={(abierto: boolean) => !abierto && setReclamando(null)}
      />
    </section>
  )
}
