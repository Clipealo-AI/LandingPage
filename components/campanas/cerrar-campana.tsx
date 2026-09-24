"use client"

import * as React from "react"
import { Lock, LockOpen, Square } from "lucide-react"
import { useTranslations } from "next-intl"

import { toast } from "@/lib/toast"
import { HOY_CAMPANAS, type Campana } from "@/lib/campanas"
import {
  estadoParticipacion,
  inscripcionesAbiertas,
  pendientesDe,
  puedeFinalizar,
} from "@/lib/participacion"
import { cn } from "@/lib/utils"
import { useCampanas } from "@/hooks/use-campanas"
import { useFormat } from "@/hooks/use-format"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

/**
 * Cerrar una campaña, con la regla que manda (docs/campanas-ciclo-2026-09.md §3):
 * la agencia puede dejar de admitir gente nueva cuando quiera, pero **no puede
 * finalizar dejando trabajo pendiente**. Quien aceptó a alguien le dio su
 * palabra; quien recibió un clip debe revisarlo.
 *
 * Por eso «Finalizar campaña» solo se enciende con cero pendientes y, mientras
 * no lo esté, el botón apagado dice exactamente qué falta: «Te faltan 2 clips
 * por revisar y 1 clipero con plazo hasta el 19 sept». Un botón apagado sin
 * explicación es una puerta sin cartel.
 *
 * Al cerrar inscripciones, las solicitudes sin decidir se rechazan en bloque con
 * el motivo `inscripciones-cerradas`, que es el que verá cada clipero: nadie se
 * queda esperando una respuesta que no va a llegar.
 *
 * Montaje: dentro del detalle de campaña, solo para quien la creó. Aquí no se
 * comprueba la propiedad: eso lo decide quien lo monta.
 */
export function CerrarCampana({
  campana,
  ahora = HOY_CAMPANAS,
  className,
}: {
  campana: Campana
  ahora?: string
  className?: string
}) {
  const t = useTranslations("campaignsAgencia.cerrar")
  const f = useFormat()
  const { participaciones, cerrarInscripciones, finalizarCampana, decidirSolicitud } =
    useCampanas()
  const [confirmando, setConfirmando] = React.useState(false)
  // Cerrar inscripciones rechaza en bloque a gente de fuera: preguntar antes no
  // es opcional cuando finalizar —que solo afecta a la agencia— ya pregunta
  const [confirmandoCierre, setConfirmandoCierre] = React.useState(false)

  const abiertas = inscripcionesAbiertas(campana)
  const pendientes = pendientesDe(campana.id, participaciones, ahora)
  const sinDecidir = participaciones.filter(
    (p) => p.campanaId === campana.id && estadoParticipacion(p, ahora) === "solicitada"
  )
  const finalizada = campana.estado === "finalizada"
  const lista = puedeFinalizar(pendientes)

  /** Lo que falta, escrito como se lee: «2 clips por revisar y 1 disputa». */
  const queFalta = () => {
    const partes: string[] = []
    if (pendientes.sinRevisar.length)
      partes.push(t("pendientes.sinRevisar", { n: pendientes.sinRevisar.length }))
    if (pendientes.aceptadas.length) {
      // El plazo que manda es el último: hasta que pase, alguien puede entregar
      const ultimo = pendientes.aceptadas
        .map((p) => p.venceEn ?? campana.fin)
        .sort()
        .at(-1)!
      partes.push(
        t("pendientes.aceptadas", {
          n: pendientes.aceptadas.length,
          date: f.date(ultimo),
        })
      )
    }
    if (pendientes.enDisputa.length)
      partes.push(t("pendientes.enDisputa", { n: pendientes.enDisputa.length }))
    return f.list(partes)
  }

  const cerrar = () => {
    // Nadie se queda esperando: lo sin decidir se rechaza con su motivo
    for (const p of sinDecidir)
      decidirSolicitud(p, campana, "rechazar", "inscripciones-cerradas")
    cerrarInscripciones(campana.id)
    setConfirmandoCierre(false)
    toast.success(t("closed.title"), {
      description: t("closed.description", { n: sinDecidir.length }),
    })
  }

  const alternarInscripciones = () => {
    if (abiertas) {
      // Sin nadie esperando decisión no hay a quién rechazar: cierra directo
      if (sinDecidir.length === 0) cerrar()
      else setConfirmandoCierre(true)
      return
    }
    cerrarInscripciones(campana.id, true)
    toast.success(t("reopened.title"), { description: t("reopened.description") })
  }

  const finalizar = () => {
    finalizarCampana(campana.id)
    setConfirmando(false)
    toast.success(t("finished.title"), { description: t("finished.description") })
  }

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base">{t("title")}</CardTitle>
          <Badge variant={abiertas ? "success" : "secondary"}>
            {t(abiertas ? "state.open" : "state.closed")}
          </Badge>
        </div>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {!finalizada && (
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={alternarInscripciones}
            >
              {abiertas ? <Lock /> : <LockOpen />}
              {t(abiertas ? "closeSignups" : "reopen")}
            </Button>
            <p className="text-sm text-muted-foreground">
              {abiertas
                ? t("closeSignupsHint", { n: sinDecidir.length })
                : t("reopenHint")}
            </p>
          </div>
        )}

        <div className="space-y-2 border-t pt-4">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            disabled={!lista || finalizada}
            onClick={() => setConfirmando(true)}
          >
            <Square />
            {t("finish")}
          </Button>
          {/* El motivo, siempre a la vista: un botón apagado nunca explica solo */}
          <p
            className={cn(
              "text-sm",
              lista && !finalizada ? "text-muted-foreground" : "font-medium"
            )}
          >
            {finalizada
              ? t("already")
              : lista
                ? t("ready")
                : t("blocked", { n: pendientes.total, list: queFalta() })}
          </p>
        </div>
      </CardContent>

      <AlertDialog open={confirmandoCierre} onOpenChange={setConfirmandoCierre}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("confirmSignups.title", { title: campana.titulo })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("closeSignupsHint", { n: sinDecidir.length })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("confirmSignups.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={cerrar}>
              {t("confirmSignups.action")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmando} onOpenChange={setConfirmando}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("confirm.title", { title: campana.titulo })}
            </AlertDialogTitle>
            <AlertDialogDescription>{t("confirm.description")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("confirm.cancel")}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={finalizar}>
              {t("confirm.action")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
