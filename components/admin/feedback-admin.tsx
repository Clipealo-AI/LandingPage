"use client"

import * as React from "react"
import { Archive, Mail, MailOpen } from "lucide-react"
import { useTranslations } from "next-intl"

import { AHORA_DEMO } from "@/lib/fechas"
import { toast } from "@/lib/toast"
import {
  ABIERTOS,
  ESTADOS_FEEDBACK,
  TIPOS_FEEDBACK,
  AUTORES_FEEDBACK,
  resumenFeedback,
  type EstadoFeedback,
  type Feedback,
} from "@/lib/feedback"
import { useFeedback } from "@/hooks/use-feedback"
import { useFormat } from "@/hooks/use-format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { AdminSection } from "@/components/admin/admin-page"
import { AdminTable, type Column, type FilterDef } from "@/components/admin/admin-table"
import { KpiCard, KpiGrid } from "@/components/admin/kpi-card"

/**
 * Cómo se pinta cada estado: el color acompaña a la palabra, nunca la sustituye.
 *
 * Sin abrir va en `warning`, no en naranja de marca: el naranja es la marca de
 * recorte y la acción principal de la vista, y una cola con cinco badges
 * naranjas se lo gastaría entero.
 */
const TONO: Record<EstadoFeedback, "warning" | "secondary" | "success" | "outline"> = {
  nuevo: "warning",
  leido: "secondary",
  respondido: "success",
  archivado: "outline",
}

/**
 * El casillero: lo que cliperos y agencias le escriben a Clipealo.
 *
 * Escribe de verdad en el mismo almacén que lee la app, como la cola de
 * disputas y el catálogo de Formación: responder aquí hace que la respuesta
 * aparezca en su Ayuda › Tus mensajes sin recargar nada. Un casillero que no
 * contesta no se puede juzgar.
 *
 * Nada se borra. Lo que alguien se molestó en escribir se archiva, que es otra
 * cosa: sale de la cola y sigue ahí.
 */
export function FeedbackAdmin() {
  const t = useTranslations("admin.feedback")
  const tf = useTranslations("feedback")
  const f = useFormat()
  const { mensajes, leer, responder, archivar } = useFeedback()
  const [abierto, setAbierto] = React.useState<string | null>(null)

  const resumen = resumenFeedback(mensajes, AHORA_DEMO)
  const elegido = mensajes.find((m) => m.id === abierto) ?? null

  const abrir = (m: Feedback) => {
    setAbierto(m.id)
    // Abrirlo es leerlo: el estado lo dice la acción, no un botón aparte
    leer(m)
  }

  const columnas: Column<Feedback>[] = [
    {
      key: "autor",
      header: t("tabla.autor"),
      sortValue: (m) => m.autor,
      render: (m) => (
        <span className="flex flex-col">
          <span className="font-medium">{m.autor}</span>
          <span className="text-xs text-muted-foreground">{t(`de.${m.de}`)}</span>
        </span>
      ),
    },
    {
      key: "tipo",
      header: t("tabla.tipo"),
      sortValue: (m) => m.tipo,
      render: (m) => <Badge variant="outline">{tf(`tipos.${m.tipo}`)}</Badge>,
    },
    {
      key: "mensaje",
      header: t("tabla.mensaje"),
      render: (m) => (
        <button
          type="button"
          data-button=""
          aria-label={t("abrir", { autor: m.autor })}
          onClick={() => abrir(m)}
          className="line-clamp-2 max-w-md text-left hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {m.texto}
        </button>
      ),
    },
    {
      key: "desde",
      header: t("tabla.desde"),
      hideBelow: "lg",
      sortValue: (m) => m.ruta ?? "",
      render: (m) => (
        <span className="text-xs text-muted-foreground">{m.ruta ?? "—"}</span>
      ),
    },
    {
      key: "fecha",
      header: t("tabla.fecha"),
      align: "right",
      hideBelow: "md",
      sortValue: (m) => m.creadoEn,
      render: (m) => <span className="tabular-nums">{f.date(m.creadoEn)}</span>,
    },
    {
      key: "estado",
      header: t("tabla.estado"),
      sortValue: (m) => ESTADOS_FEEDBACK.indexOf(m.estado),
      render: (m) => <Badge variant={TONO[m.estado]}>{tf(`estados.${m.estado}`)}</Badge>,
    },
  ]

  const filtros: FilterDef<Feedback>[] = [
    {
      param: "estado",
      label: t("filtros.estado"),
      variant: "toggle",
      options: ESTADOS_FEEDBACK.map((e) => ({ value: e, label: tf(`estados.${e}`) })),
      predicate: (m, v) => m.estado === v,
    },
    {
      param: "tipo",
      label: t("filtros.tipo"),
      options: [
        { value: "todos", label: t("filtros.todosTipos") },
        ...TIPOS_FEEDBACK.map((x) => ({ value: x, label: tf(`tipos.${x}`) })),
      ],
      predicate: (m, v) => m.tipo === v,
    },
    {
      param: "de",
      label: t("filtros.de"),
      options: [
        { value: "todos", label: t("filtros.todosAutores") },
        ...AUTORES_FEEDBACK.map((a) => ({ value: a, label: t(`de.${a}`) })),
      ],
      predicate: (m, v) => m.de === v,
    },
  ]

  return (
    <>
      <KpiGrid>
        <KpiCard
          featured
          label={t("kpis.nuevos")}
          value={f.number(resumen.nuevos)}
          tone={resumen.nuevos > 0 ? "aviso" : "ok"}
          footnote={t("kpis.nuevosHint")}
        />
        <KpiCard
          label={t("kpis.abiertos")}
          value={f.number(resumen.abiertos)}
          footnote={t("kpis.abiertosHint")}
        />
        <KpiCard
          label={t("kpis.espera")}
          value={
            resumen.esperaMaxDias === null
              ? t("sinEspera")
              : t("dias", { n: resumen.esperaMaxDias })
          }
          footnote={t("kpis.esperaHint")}
        />
        <KpiCard
          label={t("kpis.respondidos")}
          value={f.number(resumen.respondidos)}
          footnote={t("kpis.respondidosHint")}
        />
      </KpiGrid>

      <AdminSection id="cola" title={t("cola.title")} description={t("cola.description")}>
        <AdminTable
          rows={mensajes}
          columns={columnas}
          rowKey={(m) => m.id}
          caption={t("tabla.caption")}
          search={{
            placeholder: t("tabla.buscar"),
            keys: (m) => [m.texto, m.autor, m.ruta, m.respuesta],
          }}
          filters={filtros}
          defaultSort={{ key: "fecha", dir: "desc" }}
          empty={{ title: t("tabla.vacio"), description: t("tabla.vacioHint") }}
          summary={(filas) =>
            t("tabla.resumen", {
              n: filas.length,
              abiertos: filas.filter((m) => ABIERTOS.includes(m.estado)).length,
            })
          }
        />
      </AdminSection>

      <Dialog open={elegido !== null} onOpenChange={(v) => !v && setAbierto(null)}>
        <DialogContent className="top-[6vh] max-h-[88vh] translate-y-0 overflow-y-auto sm:max-w-lg">
          {elegido && (
            <Detalle
              key={elegido.id}
              mensaje={elegido}
              onResponder={(texto) => {
                responder(elegido, texto, AHORA_DEMO)
                toast.success(t("toasts.respondido"), {
                  description: t("toasts.respondidoHint", { autor: elegido.autor }),
                })
                setAbierto(null)
              }}
              onArchivar={() => {
                archivar(elegido)
                toast(t("toasts.archivado"), { description: t("toasts.archivadoHint") })
                setAbierto(null)
              }}
              onCerrar={() => setAbierto(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function Detalle({
  mensaje,
  onResponder,
  onArchivar,
  onCerrar,
}: {
  mensaje: Feedback
  onResponder: (texto: string) => void
  onArchivar: () => void
  onCerrar: () => void
}) {
  const t = useTranslations("admin.feedback")
  const tf = useTranslations("feedback")
  const f = useFormat()
  const [texto, setTexto] = React.useState(mensaje.respuesta ?? "")
  const [intento, setIntento] = React.useState(false)
  const vacia = texto.trim().length === 0

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault()
        setIntento(true)
        if (vacia) return
        onResponder(texto)
      }}
    >
      <DialogHeader>
        <DialogTitle>{t("detalle.title", { autor: mensaje.autor })}</DialogTitle>
        <FieldDescription>
          {mensaje.ruta
            ? t("detalle.recibido", {
                fecha: f.dateTime(mensaje.creadoEn),
                ruta: mensaje.ruta,
              })
            : t("detalle.recibidoSinRuta", { fecha: f.dateTime(mensaje.creadoEn) })}
        </FieldDescription>
      </DialogHeader>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge variant="outline">{tf(`tipos.${mensaje.tipo}`)}</Badge>
        <Badge variant={TONO[mensaje.estado]}>{tf(`estados.${mensaje.estado}`)}</Badge>
        <Badge variant="secondary">{t(`de.${mensaje.de}`)}</Badge>
      </div>

      {/* Tal cual lo escribió: ni se traduce ni se recorta */}
      <p className="rounded-lg bg-muted p-3 text-sm whitespace-pre-line">
        {mensaje.texto}
      </p>

      <Field data-invalid={(intento && vacia) || undefined}>
        <FieldLabel htmlFor="feedback-respuesta">{t("detalle.respuesta")}</FieldLabel>
        <Textarea
          id="feedback-respuesta"
          rows={5}
          value={texto}
          aria-invalid={(intento && vacia) || undefined}
          placeholder={t("detalle.respuestaPlaceholder")}
          onChange={(e) => setTexto(e.target.value)}
        />
        {intento && vacia ? (
          <FieldError>{t("detalle.errors.vacia")}</FieldError>
        ) : (
          <FieldDescription>{t("detalle.respuestaHint")}</FieldDescription>
        )}
        {mensaje.respondidoEn && (
          <FieldDescription>
            {t("detalle.yaRespondido", { fecha: f.dateTime(mensaje.respondidoEn) })}
          </FieldDescription>
        )}
      </Field>

      <DialogFooter className="sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={onArchivar}
          disabled={mensaje.estado === "archivado"}
        >
          <Archive /> {t("detalle.archivar")}
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="ghost" onClick={onCerrar}>
            {t("detalle.cerrar")}
          </Button>
          <Button type="submit" variant="brand">
            {mensaje.estado === "respondido" ? <MailOpen /> : <Mail />}{" "}
            {t("detalle.enviar")}
          </Button>
        </div>
      </DialogFooter>
    </form>
  )
}
