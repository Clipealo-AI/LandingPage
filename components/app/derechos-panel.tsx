"use client"

import * as React from "react"
import { Check, Compass, ShieldCheck, X } from "lucide-react"
import { useTranslations } from "next-intl"

import { Link, hrefDinamico } from "@/i18n/navigation"
import { toast } from "@/lib/toast"
import { AHORA_DEMO } from "@/lib/fechas"
import { HOY_CAMPANAS, nuevoId, type Campana } from "@/lib/campanas"
import {
  hayBloqueoListaBlanca,
  licenciaDe,
  nuevaSolicitudListaBlanca,
  pendientesDe,
  situacionListaBlanca,
  validarSolicitudListaBlanca,
  type SolicitudListaBlanca,
} from "@/lib/derechos"
import { inscripcionesAbiertas } from "@/lib/participacion"
import { SOCIAL_NETWORKS } from "@/lib/social"
import { useCampanas } from "@/hooks/use-campanas"
import { useCuentasSociales } from "@/hooks/use-cuentas-sociales"
import { useFormat } from "@/hooks/use-format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { SocialGlyph } from "@/components/brand/social"

/**
 * Derechos: qué permite cada campaña y cómo va la lista blanca.
 *
 * El clipero ve las campañas en las que está, con la licencia de cada una y
 * el estado de sus cuentas en el Content ID de la agencia; pide el alta para
 * una cuenta concreta, porque las plataformas dan de alta canales, no personas.
 * La agencia ve las solicitudes de sus campañas y decide. Las dos mitades
 * escriben en el mismo almacén, así que lo que se decide aquí se ve allí.
 */
export function DerechosPanel() {
  const { perfil } = useCampanas()
  return perfil === "agencia" ? <DerechosAgencia /> : <DerechosClipero />
}

const ESTADO_BADGE = {
  "no-ofrecida": "outline",
  disponible: "secondary",
  pendiente: "warning",
  activa: "success",
  rechazada: "destructive",
} as const

function DerechosClipero() {
  const t = useTranslations("app.operaciones.derechos")
  const tl = useTranslations("campaigns.licencia")
  const { campanas, participaciones, solicitudesListaBlanca, cuenta } = useCampanas()

  // Las campañas en las que está o estuvo: la licencia se lee también después de entregar
  const ids = [...new Set(participaciones.map((p) => p.campanaId))]
  const mias = ids
    .map((id) => campanas.find((c) => c.id === id))
    .filter((c): c is Campana => c !== undefined)

  if (mias.length === 0)
    return (
      <div className="space-y-4 rounded-xl bg-card p-6 ring-1 ring-border">
        <p className="text-sm text-pretty text-muted-foreground">{t("sinCampanas")}</p>
        <Button variant="outline" asChild>
          <Link href="/campanas">
            <Compass /> {t("explorar")}
          </Link>
        </Button>
      </div>
    )

  return (
    <ul className="grid gap-4 @4xl/operaciones:grid-cols-2">
      {mias.map((campana) => {
        const licencia = licenciaDe(campana)
        const situacion = situacionListaBlanca(
          campana,
          solicitudesListaBlanca,
          cuenta.userId
        )
        return (
          <li key={campana.id}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="size-4 text-primary" aria-hidden />
                  <Link
                    href={hrefDinamico("/campanas/[id]", { id: campana.id })}
                    className="underline-offset-4 hover:underline"
                  >
                    {campana.titulo}
                  </Link>
                </CardTitle>
                <CardDescription>{campana.marca}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm">
                  <dt className="text-muted-foreground">{t("alcance")}</dt>
                  <dd>{tl(`alcances.${licencia.alcance}`)}</dd>
                  <dt className="text-muted-foreground">{t("redes")}</dt>
                  <dd className="flex flex-wrap items-center gap-2">
                    {campana.redes.map((r) => (
                      <span key={r} className="inline-flex items-center gap-1">
                        <SocialGlyph
                          network={r}
                          tone="official"
                          className="size-4"
                          aria-hidden
                        />
                        {SOCIAL_NETWORKS[r].name}
                      </span>
                    ))}
                  </dd>
                  {licencia.atribucion && (
                    <>
                      <dt className="text-muted-foreground">{t("atribucion")}</dt>
                      <dd>{licencia.atribucion}</dd>
                    </>
                  )}
                  {licencia.notas && (
                    <>
                      <dt className="text-muted-foreground">{t("notas")}</dt>
                      <dd className="text-pretty">{licencia.notas}</dd>
                    </>
                  )}
                  <dt className="text-muted-foreground">{t("listaBlanca")}</dt>
                  <dd>
                    <Badge variant={ESTADO_BADGE[situacion]}>
                      {t(`situacion.${situacion}`)}
                    </Badge>
                  </dd>
                </dl>
                {licencia.listaBlanca && (
                  <PedirListaBlanca
                    campana={campana}
                    solicitudes={solicitudesListaBlanca}
                  />
                )}
              </CardContent>
            </Card>
          </li>
        )
      })}
    </ul>
  )
}

/** Pedir el alta de UNA cuenta conectada en el Content ID de la agencia. */
function PedirListaBlanca({
  campana,
  solicitudes,
}: {
  campana: Campana
  solicitudes: readonly SolicitudListaBlanca[]
}) {
  const t = useTranslations("app.operaciones.derechos")
  const { activas } = useCuentasSociales()
  const { cuenta, pedirListaBlanca } = useCampanas()
  const [intento, setIntento] = React.useState(false)
  // Solo las cuentas de las redes de la campaña: la lista blanca es por canal
  const candidatas = activas.filter((c) => campana.redes.includes(c.network))
  const [cuentaId, setCuentaId] = React.useState<string>(candidatas[0]?.id ?? "")
  const elegida = candidatas.find((c) => c.id === cuentaId) ?? null
  const avisos = validarSolicitudListaBlanca({
    campana,
    cuenta: elegida,
    existentes: solicitudes,
    // Abierta: admite gente nueva, sigue activa y no ha vencido
    abierta:
      inscripcionesAbiertas(campana) &&
      campana.estado === "activa" &&
      Date.parse(campana.fin) >= Date.parse(HOY_CAMPANAS),
  })
  const bloquea = hayBloqueoListaBlanca(avisos)
  const mias = solicitudes.filter(
    (s) => s.campanaId === campana.id && s.userId === cuenta.userId
  )

  if (candidatas.length === 0)
    return (
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>{t("sinCuentas")}</p>
        <Button variant="outline" size="sm" asChild>
          <Link href={{ pathname: "/ajustes", query: { seccion: "cuentas" } }}>
            {t("conectar")}
          </Link>
        </Button>
      </div>
    )

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        setIntento(true)
        if (bloquea || !elegida) return
        pedirListaBlanca(
          nuevaSolicitudListaBlanca({
            id: nuevoId("lb"),
            campanaId: campana.id,
            userId: cuenta.userId,
            creador: cuenta.nombre,
            cuenta: elegida,
            ahora: AHORA_DEMO,
          })
        )
        toast.success(t("pedida"), { description: t("pedidaHint") })
        setIntento(false)
      }}
    >
      {mias.length > 0 && (
        <ul className="space-y-1 text-xs text-muted-foreground">
          {mias.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-1.5">
              <SocialGlyph
                network={s.red}
                tone="official"
                className="size-3.5"
                aria-hidden
              />
              {s.handle}
              <Badge variant={ESTADO_BADGE[s.estado]} className="h-4 px-1 text-[10px]">
                {t(`situacion.${s.estado}`)}
              </Badge>
              {s.motivo && <span>· {s.motivo}</span>}
            </li>
          ))}
        </ul>
      )}
      <Field>
        <FieldLabel htmlFor={`lb-cuenta-${campana.id}`}>{t("cuenta")}</FieldLabel>
        <Select value={cuentaId} onValueChange={setCuentaId}>
          <SelectTrigger id={`lb-cuenta-${campana.id}`} className="max-w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {candidatas.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {SOCIAL_NETWORKS[c.network].name} · {c.handle}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldDescription>{t("cuentaHint")}</FieldDescription>
        {intento &&
          avisos.map((a) => (
            <FieldError key={a.code}>{t(`errors.${a.code}`)}</FieldError>
          ))}
      </Field>
      <Button type="submit" variant="outline" size="sm" disabled={bloquea && !intento}>
        {t("pedir")}
      </Button>
    </form>
  )
}

function DerechosAgencia() {
  const t = useTranslations("app.operaciones.derechos.agencia")
  const f = useFormat()
  const { campanas, solicitudesListaBlanca, cuenta, resolverListaBlanca } = useCampanas()
  const [rechazando, setRechazando] = React.useState<SolicitudListaBlanca | null>(null)
  const [motivo, setMotivo] = React.useState("")

  const mias = campanas.filter((c) => c.creadaPor.userId === cuenta.userId)
  const ids = new Set(mias.map((c) => c.id))
  const pendientes = pendientesDe(solicitudesListaBlanca, mias)
  const resueltas = solicitudesListaBlanca.filter(
    (s) => ids.has(s.campanaId) && s.estado !== "pendiente"
  )
  const nombreCampana = (id: string) => mias.find((c) => c.id === id)?.titulo ?? id

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {pendientes.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("ninguna")}</p>
          ) : (
            <ul className="divide-y">
              {pendientes.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="flex items-center gap-1.5 text-sm font-medium">
                      <SocialGlyph
                        network={s.red}
                        tone="official"
                        className="size-4"
                        aria-hidden
                      />
                      {t("cuenta", {
                        handle: s.handle,
                        red: SOCIAL_NETWORKS[s.red].name,
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {s.creador} · {nombreCampana(s.campanaId)} ·{" "}
                      {t("pedidaEl", { fecha: f.date(s.pedidaEn) })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        resolverListaBlanca(s.id, true)
                        toast.success(t("aprobada"), { description: s.handle })
                      }}
                    >
                      <Check /> {t("aprobar")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setMotivo("")
                        setRechazando(s)
                      }}
                    >
                      <X /> {t("rechazar")}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {resueltas.length > 0 && (
        <ul className="space-y-1 text-xs text-muted-foreground">
          {resueltas.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-1.5">
              <Badge variant={ESTADO_BADGE[s.estado]} className="h-4 px-1 text-[10px]">
                {s.estado === "activa" ? t("aprobada") : t("rechazada")}
              </Badge>
              {t("cuenta", { handle: s.handle, red: SOCIAL_NETWORKS[s.red].name })} ·{" "}
              {nombreCampana(s.campanaId)}
              {s.resueltaEn && <span>· {f.date(s.resueltaEn)}</span>}
              {s.motivo && <span>· {s.motivo}</span>}
            </li>
          ))}
        </ul>
      )}

      <Dialog open={rechazando !== null} onOpenChange={(v) => !v && setRechazando(null)}>
        <DialogContent className="sm:max-w-md">
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault()
              if (!rechazando) return
              resolverListaBlanca(rechazando.id, false, motivo)
              toast(t("rechazada"), { description: rechazando.handle })
              setRechazando(null)
            }}
          >
            <DialogHeader>
              <DialogTitle>{t("rechazar")}</DialogTitle>
              <DialogDescription>
                {rechazando &&
                  t("cuenta", {
                    handle: rechazando.handle,
                    red: SOCIAL_NETWORKS[rechazando.red].name,
                  })}
              </DialogDescription>
            </DialogHeader>
            <Field>
              <FieldLabel htmlFor="lb-motivo">{t("motivo")}</FieldLabel>
              <Textarea
                id="lb-motivo"
                rows={3}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              />
              <FieldDescription>{t("motivoHint")}</FieldDescription>
            </Field>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost">
                  {t("cancelar")}
                </Button>
              </DialogClose>
              <Button type="submit" variant="destructive">
                <X /> {t("rechazar")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
