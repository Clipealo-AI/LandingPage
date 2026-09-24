"use client"

import * as React from "react"
import { ChevronDown, ChevronUp, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"

import { toast } from "@/lib/toast"
import { LUGARES_MICRO, type LugarMicro } from "@/lib/micro-preguntas"
import {
  LIMITES_REGLAS,
  PREGUNTA_NUEVA,
  borradorDePregunta,
  nuevoIdPregunta,
  resumenCatalogoMicro,
  type BorradorPregunta,
  type PreguntaCatalogo,
  type ReglasMicro,
} from "@/lib/micro-catalogo"
import { useEditorMicro } from "@/hooks/use-catalogo-micro"
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
import { ButtonGroup } from "@/components/ui/button-group"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { AdminSection } from "@/components/admin/admin-page"
import { KpiCard, KpiGrid } from "@/components/admin/kpi-card"
import { PreguntaForm } from "@/components/admin/pregunta-form"
import { useFormat } from "@/hooks/use-format"

/**
 * Qué se le pregunta al clipero, dónde y cada cuánto.
 *
 * Escribe en el mismo almacén que lee la app, como el catálogo de Formación:
 * apagar una pregunta aquí hace que deje de salir allí sin recargar nada. Es lo
 * que permite juzgar si una pregunta nueva encaja antes de decidir que se queda.
 *
 * Frontera de datos: aquí NO se pueden contar respuestas. Lo que la gente
 * contesta vive en su navegador, igual que el avance de Formación, y la página
 * lo dice en vez de enseñar un cero.
 */
export function PreguntasAdmin() {
  const t = useTranslations("admin.preguntas")
  const f = useFormat()
  const editor = useEditorMicro()
  const { catalogo } = editor
  const [editando, setEditando] = React.useState<BorradorPregunta | null>(null)
  const [borrando, setBorrando] = React.useState<PreguntaCatalogo | null>(null)

  const resumen = resumenCatalogoMicro(catalogo)

  return (
    <>
      <KpiGrid>
        <KpiCard
          featured
          label={t("kpis.activas")}
          value={f.number(resumen.activas)}
          footnote={t("kpis.activasHint", { total: resumen.total })}
        />
        <KpiCard
          label={t("kpis.panel")}
          value={f.number(resumen.porLugar.panel)}
          footnote={t("kpis.panelHint")}
        />
        <KpiCard
          label={t("kpis.enviar")}
          value={f.number(resumen.porLugar.enviar)}
          footnote={t("kpis.enviarHint")}
        />
        <KpiCard
          label={t("kpis.creadas")}
          value={f.number(resumen.creadas)}
          footnote={t("kpis.creadasHint")}
        />
      </KpiGrid>

      {/* La frontera, dicha en pantalla como en Formación y en Mercado */}
      <p className="text-sm text-pretty text-muted-foreground">{t("frontera")}</p>

      <AdminSection
        id="catalogo"
        title={t("catalogo.title")}
        description={t("catalogo.description")}
        aside={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditando({ ...PREGUNTA_NUEVA })}
          >
            <Plus /> {t("catalogo.crear")}
          </Button>
        }
      >
        <p className="text-xs text-pretty text-muted-foreground">
          {t("catalogo.semillaNota")}
        </p>
        <div className="grid gap-5 @4xl/admin:grid-cols-2">
          {LUGARES_MICRO.map((lugar) => (
            <Lugar
              key={lugar}
              lugar={lugar}
              preguntas={catalogo.preguntas.filter((p) => p.lugar === lugar)}
              editor={editor}
              onEditar={setEditando}
              onBorrar={setBorrando}
            />
          ))}
        </div>
      </AdminSection>

      <Reglas editor={editor} />

      <Dialog open={editando !== null} onOpenChange={(v) => !v && setEditando(null)}>
        <DialogContent className="top-[6vh] max-h-[88vh] translate-y-0 overflow-y-auto sm:max-w-lg">
          {editando && (
            <PreguntaForm
              key={editando.id ?? "nueva"}
              inicial={editando}
              onCerrar={() => setEditando(null)}
              onGuardar={(b) => {
                editor.guardar(b, b.id ?? nuevoIdPregunta(Date.now().toString(36)))
                toast.success(t("toasts.guardada"), { description: b.titulo })
                setEditando(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={borrando !== null} onOpenChange={(v) => !v && setBorrando(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("delete.title", { titulo: borrando?.titulo ?? "" })}
            </AlertDialogTitle>
            <AlertDialogDescription>{t("delete.description")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("delete.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (borrando) {
                  editor.borrar(borrando.id)
                  toast(t("toasts.borrada"), { description: borrando.titulo })
                }
                setBorrando(null)
              }}
            >
              {t("delete.action")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

type Editor = ReturnType<typeof useEditorMicro>

/** Las preguntas de un lugar, en el orden en que se hacen. */
function Lugar({
  lugar,
  preguntas,
  editor,
  onEditar,
  onBorrar,
}: {
  lugar: LugarMicro
  preguntas: PreguntaCatalogo[]
  editor: Editor
  onEditar: (b: BorradorPregunta) => void
  onBorrar: (p: PreguntaCatalogo) => void
}) {
  const t = useTranslations("admin.preguntas")

  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">{t(`lugares.${lugar}`)}</h3>
      <ol className="space-y-2">
        {preguntas.map((p, i) => {
          // La semilla lleva aquí un nombre corto para el operador: la
          // pregunta literal vive en el espacio `onboarding`, que el backoffice
          // no carga —son once archivos— y que no hace falta para reconocerla
          const titulo =
            p.origen === "semilla"
              ? t(`semillas.${p.id as "experiencia"}`)
              : (p.titulo ?? p.id)
          return (
            <li
              key={p.id}
              className="flex flex-wrap items-start gap-x-3 gap-y-2 rounded-xl bg-card p-3 ring-1 ring-border"
              data-apagada={!p.activa || undefined}
            >
              <Switch
                checked={p.activa}
                aria-label={t("catalogo.alternar", { titulo })}
                onCheckedChange={() => {
                  editor.alternar(p)
                  toast(p.activa ? t("toasts.apagada") : t("toasts.encendida"), {
                    description: titulo,
                  })
                }}
              />
              <div className="min-w-40 flex-1 space-y-1">
                <p
                  className={cnTitulo(p.activa)}
                  // El estado se escribe, no se cifra solo en la opacidad
                  title={p.activa ? undefined : t("catalogo.apagadaNota")}
                >
                  {titulo}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <Badge variant={p.origen === "creada" ? "secondary" : "outline"}>
                    {t(`catalogo.${p.origen === "creada" ? "creada" : "semilla"}`)}
                  </Badge>
                  {!p.activa && <Badge variant="warning">{t("catalogo.apagada")}</Badge>}
                  {p.origen === "creada" && (
                    <>
                      <span className="text-muted-foreground">
                        {t("catalogo.opciones", { n: p.opciones?.length ?? 0 })}
                      </span>
                      <span className="text-muted-foreground">
                        {p.tipo === "multiple"
                          ? t("catalogo.multiple", { max: p.max ?? 0 })
                          : t("catalogo.unica")}
                      </span>
                      <span className="text-muted-foreground tabular-nums">
                        {t("catalogo.desdeAlta", { n: p.desdeAltaDias ?? 0 })}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <ButtonGroup className="ms-auto">
                <Button
                  variant="outline"
                  size="icon-sm"
                  disabled={i === 0}
                  aria-label={t("catalogo.subir", { titulo })}
                  onClick={() => {
                    editor.mover(p, -1)
                    toast(t("toasts.orden"))
                  }}
                >
                  <ChevronUp />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  disabled={i === preguntas.length - 1}
                  aria-label={t("catalogo.bajar", { titulo })}
                  onClick={() => {
                    editor.mover(p, 1)
                    toast(t("toasts.orden"))
                  }}
                >
                  <ChevronDown />
                </Button>
                {p.origen === "creada" && (
                  <>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label={t("catalogo.editar", { titulo })}
                      onClick={() => onEditar(borradorDePregunta(p))}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label={t("catalogo.borrar", { titulo })}
                      onClick={() => onBorrar(p)}
                    >
                      <Trash2 />
                    </Button>
                  </>
                )}
              </ButtonGroup>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

const cnTitulo = (activa: boolean) =>
  activa ? "text-sm text-pretty" : "text-sm text-pretty text-muted-foreground"

/** Las reglas de frecuencia. Valen para todo el catálogo. */
function Reglas({ editor }: { editor: Editor }) {
  const t = useTranslations("admin.preguntas.reglas")
  const tt = useTranslations("admin.preguntas.toasts")
  const claves = Object.keys(LIMITES_REGLAS) as (keyof ReglasMicro)[]

  return (
    <AdminSection
      id="reglas"
      title={t("title")}
      description={t("description")}
      aside={
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            editor.reiniciarCatalogoMicro()
            toast(tt("reiniciadas"))
          }}
        >
          <RotateCcw /> {t("reiniciar")}
        </Button>
      }
    >
      <div className="grid gap-4 @2xl/admin:grid-cols-2 @5xl/admin:grid-cols-4">
        {claves.map((clave) => {
          const limite = LIMITES_REGLAS[clave]
          return (
            <Field key={clave}>
              <FieldLabel htmlFor={`regla-${clave}`}>{t(clave)}</FieldLabel>
              <Input
                id={`regla-${clave}`}
                type="number"
                inputMode="numeric"
                min={limite.min}
                max={limite.max}
                className="tabular-nums"
                value={editor.catalogo.reglas[clave]}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  if (!Number.isFinite(v)) return
                  editor.cambiarRegla(clave, v)
                }}
              />
              <FieldDescription>
                {t(`${clave}Hint`)} · {t("rango", limite)}
              </FieldDescription>
            </Field>
          )
        })}
      </div>
    </AdminSection>
  )
}
