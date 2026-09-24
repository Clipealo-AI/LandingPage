"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Flag, Scale } from "lucide-react"

import { toast } from "@/lib/toast"
import { HOY_CAMPANAS, type Envio } from "@/lib/campanas"
import {
  MOTIVOS_DISPUTA,
  NOTA_MAX,
  disputasPosibles,
  type MotivoDisputa,
  type Participacion,
} from "@/lib/participacion"
import { useCampanas } from "@/hooks/use-campanas"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"

/**
 * Abrir una reclamación sobre un compromiso (§4 de
 * docs/campanas-ciclo-2026-09.md).
 *
 * Sirve para las dos partes —`abrePor`— porque el problema es simétrico:
 * reclama quien tiene algo que perder. Los motivos no se eligen a mano: son los
 * que el dominio permite ahora mismo (`disputasPosibles`), así que nadie puede
 * reclamar «no me pagan» de un clip que nadie ha aprobado todavía.
 *
 * El «ahora» es `HOY_CAMPANAS`, como en el resto de la demo: los motivos se
 * derivan al pintar y tienen que salir iguales en el servidor y en el cliente.
 */
export function DisputaDialog({
  participacion,
  envio = null,
  abrePor,
  titulo,
  clipero,
  open,
  onOpenChange,
}: {
  participacion: Participacion | null
  /** El clip entregado, si lo hay: decide si cabe reclamar el pago. */
  envio?: Pick<Envio, "estado"> | null
  /** Quién reclama. El clipero desde «Mis compromisos»; la agencia, desde su campaña. */
  abrePor: "clipero" | "agencia"
  /** Título de la campaña: de qué se reclama. */
  titulo: string
  /** Nombre visible del clipero; solo se nombra cuando reclama la agencia. */
  clipero?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open && participacion !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {participacion && (
          // `key`: cada compromiso empieza con su formulario limpio
          <Contenido
            key={participacion.id}
            participacion={participacion}
            envio={envio}
            abrePor={abrePor}
            titulo={titulo}
            clipero={clipero}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function Contenido({
  participacion,
  envio,
  abrePor,
  titulo,
  clipero,
  onDone,
}: {
  participacion: Participacion
  envio: Pick<Envio, "estado"> | null
  abrePor: "clipero" | "agencia"
  titulo: string
  clipero?: string
  onDone: () => void
}) {
  const t = useTranslations("compromisos.disputa")
  const { abrirDisputa } = useCampanas()
  // El catálogo manda el orden; el dominio, cuáles se pueden usar ahora
  const posibles = disputasPosibles(participacion, envio, abrePor, HOY_CAMPANAS)
  const opciones = MOTIVOS_DISPUTA.filter((m) => posibles.includes(m))
  const [motivo, setMotivo] = React.useState<MotivoDisputa | null>(opciones[0] ?? null)
  const [detalle, setDetalle] = React.useState("")

  const cabecera = (
    <DialogHeader>
      <DialogTitle>{t("title")}</DialogTitle>
      <DialogDescription className="text-pretty">
        {abrePor === "agencia"
          ? t("descriptionAgencia", { title: titulo, clipero: clipero ?? "" })
          : t("descriptionClipero", { title: titulo })}
      </DialogDescription>
    </DialogHeader>
  )

  // Sin motivo posible no hay formulario: se dice por qué y se cierra
  if (!motivo) {
    return (
      <div className="space-y-5">
        {cabecera}
        <p className="text-sm text-muted-foreground">
          {participacion.disputaId ? t("abierta") : t("none")}
        </p>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t("close")}</Button>
          </DialogClose>
        </DialogFooter>
      </div>
    )
  }

  const enviar = (e: React.FormEvent) => {
    e.preventDefault()
    abrirDisputa({
      participacion,
      abrePor,
      motivo,
      detalle: detalle.trim() || undefined,
    })
    toast.success(t("sent"), { description: t("sentDescription") })
    onDone()
  }

  return (
    <form onSubmit={enviar} className="space-y-5">
      {cabecera}

      <FieldSet>
        <FieldLegend variant="label">{t("motivo")}</FieldLegend>
        <RadioGroup
          value={motivo}
          onValueChange={(v) => setMotivo(v as MotivoDisputa)}
          className="grid gap-2"
        >
          {opciones.map((m) => (
            <FieldLabel key={m} htmlFor={`motivo-disputa-${m}`}>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>{t(`motivos.${m}.title`)}</FieldTitle>
                  <FieldDescription className="text-xs">
                    {t(`motivos.${m}.description`)}
                  </FieldDescription>
                </FieldContent>
                <RadioGroupItem value={m} id={`motivo-disputa-${m}`} />
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>
      </FieldSet>

      <Field>
        <FieldLabel htmlFor="detalle-disputa">{t("detalle")}</FieldLabel>
        <Textarea
          id="detalle-disputa"
          value={detalle}
          maxLength={NOTA_MAX}
          rows={3}
          placeholder={t("detallePlaceholder")}
          onChange={(e) => setDetalle(e.target.value)}
        />
        <FieldDescription className="text-right tabular-nums">
          {t("contador", { n: detalle.length, max: NOTA_MAX })}
        </FieldDescription>
      </Field>

      {/* Lo que pasa a partir de ahora, antes de enviar y no después */}
      <Alert>
        <Scale aria-hidden />
        <AlertTitle>{t("avisoTitle")}</AlertTitle>
        <AlertDescription className="text-pretty">{t("aviso")}</AlertDescription>
      </Alert>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="ghost">
            {t("cancel")}
          </Button>
        </DialogClose>
        <Button type="submit">
          <Flag /> {t("send")}
        </Button>
      </DialogFooter>
    </form>
  )
}
