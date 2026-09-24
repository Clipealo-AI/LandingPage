"use client"

import * as React from "react"
import { CalendarClock, Check, X } from "lucide-react"
import { useTranslations } from "next-intl"

import { toast } from "@/lib/toast"
import { AHORA_DEMO } from "@/lib/fechas"
import { planesAsignables, type PlanCatalogo, type PlanId } from "@/lib/planes"
import { PLAN_DEMO } from "@/lib/pricing"
import { SOCIAL_NETWORKS } from "@/lib/social"
import { MOTIVOS_RECHAZO_AGENCIA, type MotivoRechazo } from "@/lib/taxonomia"
import { useCampanas } from "@/hooks/use-campanas"
import { useCatalogoPlanes } from "@/hooks/use-catalogo-planes"
import { useFormat } from "@/hooks/use-format"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useCountryName } from "@/components/shared/country-flag"
import { useNombrePlan } from "@/components/planes/nombre-plan"

/** Respaldo para la demo antigua, que pedía el perfil sin pasar por el onboarding. */
const SOLICITANTE = { nombre: "Ana Ruiz", email: "ana@estudio.co" }

/**
 * La solicitud de perfil de agencia, con el paso que faltaba en medio.
 *
 * Antes se concedía o se rechazaba de un clic, y el rechazo iba sin motivo. Lo
 * que la dirección quiere es lo que hace un equipo comercial: mirar quién es la
 * organización, citarla a una entrevista y concederle el perfil CON un plan que
 * sale de esa entrevista. Los tres pasos escriben en el mismo almacén que lee
 * la agencia en su pantalla de solicitud, así que lo que se decide aquí se ve
 * allí sin recargar.
 */
export function SolicitudAgencia() {
  const t = useTranslations("admin.campanas.agency")
  const tTaxonomy = useTranslations("taxonomy")
  const f = useFormat()
  const nombrePais = useCountryName()
  const nombrePlan = useNombrePlan()
  const {
    solicitudAgencia,
    datosSolicitud,
    entrevista,
    citarEntrevista,
    resolverAgencia,
  } = useCampanas()
  const [citando, setCitando] = React.useState(false)
  const [concediendo, setConcediendo] = React.useState(false)
  const [rechazando, setRechazando] = React.useState(false)

  if (solicitudAgencia !== "pendiente" && solicitudAgencia !== "entrevista")
    return <p className="text-sm text-muted-foreground">{t("none")}</p>

  const nombre =
    datosSolicitud?.organizacion ?? datosSolicitud?.nombre ?? SOLICITANTE.nombre

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{nombre}</CardTitle>
          {/* Qué clase de organización es, delante: es lo primero que se mira */}
          <CardDescription>
            {datosSolicitud
              ? t("type", {
                  tipo: tTaxonomy(`tiposOrganizacion.${datosSolicitud.tipoOrganizacion}`),
                })
              : t("request", { email: SOLICITANTE.email })}
          </CardDescription>
          {datosSolicitud && (
            <CardDescription className="text-foreground">
              {[
                // Con quién se habla, delante del correo: el rol se preguntaba
                // en la toma «org» y se quedaba en el navegador, así que aquí
                // se decidía sobre una organización sin saber quién escribía
                datosSolicitud.rol
                  ? t("who", {
                      nombre: datosSolicitud.nombre,
                      rol: tTaxonomy(`roles.${datosSolicitud.rol}`),
                    })
                  : datosSolicitud.nombre,
                datosSolicitud.correo,
                tTaxonomy(`sectores.${datosSolicitud.sector}`),
                f.list(datosSolicitud.paisesObjetivo.map((c) => nombrePais(c))),
                f.list(datosSolicitud.redesObjetivo.map((r) => SOCIAL_NETWORKS[r].name)),
                tTaxonomy(`tramosPresupuesto.${datosSolicitud.tramoPresupuesto}`),
              ].join(" · ")}
              {datosSolicitud.web ? ` · ${datosSolicitud.web}` : ""}
            </CardDescription>
          )}
        </CardHeader>
        {solicitudAgencia === "entrevista" && entrevista && (
          <CardContent className="space-y-1 text-sm">
            <p className="flex items-center gap-2 font-medium">
              <CalendarClock className="size-4 shrink-0" aria-hidden />
              {t("interviewed", { fecha: f.date(entrevista.citadaEn) })}
            </p>
            {entrevista.nota && (
              <p className="text-muted-foreground">
                {t("interviewNote", { nota: entrevista.nota })}
              </p>
            )}
          </CardContent>
        )}
        <CardFooter className="flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setCitando(true)}>
            <CalendarClock /> {t("interview")}
          </Button>
          <Button size="sm" onClick={() => setConcediendo(true)}>
            <Check /> {t("grantWith")}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setRechazando(true)}>
            <X /> {t("reject")}
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={citando} onOpenChange={setCitando}>
        <DialogContent className="sm:max-w-md">
          {citando && (
            <Citar
              nombre={nombre}
              inicial={entrevista?.citadaEn}
              nota={entrevista?.nota}
              onCitar={(cita) => {
                citarEntrevista(cita)
                toast.success(t("interviewDialog.sent"), {
                  description: t("interviewDialog.sentDescription", { nombre }),
                })
                setCitando(false)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={concediendo} onOpenChange={setConcediendo}>
        <DialogContent className="sm:max-w-md">
          {concediendo && (
            <Conceder
              onConceder={(plan) => {
                resolverAgencia(true, undefined, plan.id)
                toast.success(t("granted"), {
                  description: t("grantedDescription", {
                    nombre,
                    plan: nombrePlan(plan),
                  }),
                })
                setConcediendo(false)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={rechazando} onOpenChange={setRechazando}>
        <DialogContent className="sm:max-w-md">
          {rechazando && (
            <Rechazar
              onRechazar={(motivo) => {
                resolverAgencia(false, motivo)
                toast(t("rejected"), { description: nombre, sound: "remove" })
                setRechazando(false)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

/** La cita es un día del calendario: a mediodía UTC cae en ese mismo día en cualquier zona. */
const isoDeDia = (dia: string) => `${dia}T12:00:00.000Z`
const diaDeIso = (iso: string) => iso.slice(0, 10)

function Citar({
  nombre,
  inicial,
  nota: notaInicial,
  onCitar,
}: {
  nombre: string
  inicial?: string
  nota?: string
  onCitar: (e: { citadaEn: string; nota?: string }) => void
}) {
  const t = useTranslations("admin.campanas.agency.interviewDialog")
  // Sin cita previa se propone dentro de una semana del «hoy» de la demo
  const [dia, setDia] = React.useState(
    inicial
      ? diaDeIso(inicial)
      : diaDeIso(new Date(Date.parse(AHORA_DEMO) + 7 * 86_400_000).toISOString())
  )
  const [nota, setNota] = React.useState(notaInicial ?? "")
  const [intento, setIntento] = React.useState(false)
  const sinFecha = !/^\d{4}-\d{2}-\d{2}$/.test(dia)

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault()
        setIntento(true)
        if (sinFecha) return
        onCitar({ citadaEn: isoDeDia(dia), nota: nota.trim() || undefined })
      }}
    >
      <DialogHeader>
        <DialogTitle>{t("title")}</DialogTitle>
        <DialogDescription>{t("description")}</DialogDescription>
      </DialogHeader>
      <Field data-invalid={(intento && sinFecha) || undefined}>
        <FieldLabel htmlFor="entrevista-dia">{t("when")}</FieldLabel>
        <Input
          id="entrevista-dia"
          type="date"
          value={dia}
          aria-invalid={(intento && sinFecha) || undefined}
          className="max-w-56 tabular-nums"
          onChange={(e) => setDia(e.target.value)}
        />
        {intento && sinFecha && <FieldError>{t("errors.fecha")}</FieldError>}
      </Field>
      <Field>
        <FieldLabel htmlFor="entrevista-nota">{t("note")}</FieldLabel>
        <Textarea
          id="entrevista-nota"
          rows={3}
          value={nota}
          placeholder={t("notePlaceholder")}
          onChange={(e) => setNota(e.target.value)}
        />
      </Field>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="ghost">
            {t("cancel")}
          </Button>
        </DialogClose>
        <Button type="submit">
          <CalendarClock /> {t("send")}
        </Button>
      </DialogFooter>
      <span className="sr-only">{nombre}</span>
    </form>
  )
}

/**
 * El plan sale del catálogo entero, también los ocultos: un plan hecho a medida
 * para una universidad no tiene por qué salir en /precios, y es justo el que se
 * concede desde aquí.
 */
function Conceder({ onConceder }: { onConceder: (plan: PlanCatalogo) => void }) {
  const t = useTranslations("admin.campanas.agency")
  const nombrePlan = useNombrePlan()
  const planes = planesAsignables(useCatalogoPlanes())
  const [planId, setPlanId] = React.useState<PlanId>(PLAN_DEMO)
  const plan = planes.find((p) => p.id === planId) ?? planes[0]

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault()
        if (plan) onConceder(plan)
      }}
    >
      <DialogHeader>
        <DialogTitle>{t("grantWith")}</DialogTitle>
        <DialogDescription>{t("planHint")}</DialogDescription>
      </DialogHeader>
      <Field>
        <FieldLabel htmlFor="conceder-plan">{t("plan")}</FieldLabel>
        <Select value={plan?.id ?? planId} onValueChange={setPlanId}>
          <SelectTrigger id="conceder-plan" className="max-w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {planes.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {nombrePlan(p)}
                {!p.visible && (
                  <span className="text-muted-foreground"> · {t("hiddenPlan")}</span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldDescription>{t("planHint")}</FieldDescription>
      </Field>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="ghost">
            {t("rejectDialog.cancel")}
          </Button>
        </DialogClose>
        <Button type="submit">
          <Check /> {t("grant")}
        </Button>
      </DialogFooter>
    </form>
  )
}

function Rechazar({ onRechazar }: { onRechazar: (motivo: MotivoRechazo) => void }) {
  const t = useTranslations("admin.campanas.agency.rejectDialog")
  const tTaxonomy = useTranslations("taxonomy")
  const [motivo, setMotivo] = React.useState<MotivoRechazo>("datos-incompletos")

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault()
        onRechazar(motivo)
      }}
    >
      <DialogHeader>
        <DialogTitle>{t("title")}</DialogTitle>
        <DialogDescription>{t("description")}</DialogDescription>
      </DialogHeader>
      <Field>
        <FieldLabel htmlFor="rechazo-motivo">{t("reason")}</FieldLabel>
        <Select value={motivo} onValueChange={(v) => setMotivo(v as MotivoRechazo)}>
          <SelectTrigger id="rechazo-motivo" className="max-w-72">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MOTIVOS_RECHAZO_AGENCIA.map((id) => (
              <SelectItem key={id} value={id}>
                {tTaxonomy(`motivosRechazo.${id}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="ghost">
            {t("cancel")}
          </Button>
        </DialogClose>
        <Button type="submit" variant="destructive">
          <X /> {t("send")}
        </Button>
      </DialogFooter>
    </form>
  )
}
