"use client"

import * as React from "react"
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2, X } from "lucide-react"
import { useTranslations } from "next-intl"

import { formatDuration } from "@/lib/format"
import { EXPERIENCIA, type Experiencia } from "@/lib/taxonomia"
import {
  LIMITES_RUTA,
  RUTA_NUEVA,
  borradorDeRuta,
  hayBloqueoRuta,
  leccionPorId,
  planMinimoRuta,
  validarRuta,
  type AvisoRuta,
  type BorradorRuta,
  type Catalogo,
  type Ruta,
} from "@/lib/formacion"
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
import { ButtonGroup } from "@/components/ui/button-group"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { AdminSection } from "@/components/admin/admin-page"
import { PlanBadge } from "@/components/admin/plan-badge"

/**
 * Las rutas del catálogo: qué clases llevan y en qué orden.
 *
 * El orden importa más que en el catálogo —una ruta es una secuencia, no una
 * lista— así que se cambia aquí mismo con dos flechas por clase, sin abrir nada.
 * El diálogo solo hace falta para el título, la descripción y a quién se propone.
 *
 * El plan de la ruta NO se edita: es el más alto de sus clases publicadas y se
 * calcula. Un campo propio se desincronizaría al primer cambio de plan de una
 * clase, y entonces la ruta prometería un plan que no es el suyo.
 */
export function RutasAdmin({
  catalogo,
  onGuardar,
  onBorrar,
  onMover,
  onAnadir,
  onQuitar,
  esCreada,
}: {
  catalogo: Catalogo
  onGuardar: (b: BorradorRuta) => void
  onBorrar: (id: string) => void
  onMover: (rutaId: string, leccionId: string, delta: -1 | 1) => void
  onAnadir: (rutaId: string, leccionId: string) => void
  onQuitar: (rutaId: string, leccionId: string) => void
  esCreada: (id: string) => boolean
}) {
  const t = useTranslations("admin.formacion.rutas")
  const tf = useTranslations("admin.formacion")
  const tax = useTranslations("taxonomy")
  const f = useFormat()
  const [editando, setEditando] = React.useState<BorradorRuta | null>(null)
  const [borrando, setBorrando] = React.useState<Ruta | null>(null)

  return (
    <AdminSection
      id="rutas"
      title={t("title")}
      description={t("description")}
      aside={
        <Button
          variant="outline"
          size="sm"
          onClick={() => setEditando({ ...RUTA_NUEVA })}
        >
          <Plus /> {t("create")}
        </Button>
      }
    >
      {catalogo.rutas.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="grid gap-4 @4xl/admin:grid-cols-2">
          {catalogo.rutas.map((ruta) => {
            // Publicadas o no: el admin ordena lo que hay, y se marca lo que
            // todavía no ve el alumno
            const clases = ruta.lecciones
              .map((id) => leccionPorId(id, catalogo))
              .filter((l): l is NonNullable<typeof l> => l !== undefined)
            const sinPublicar = clases.filter((l) => l.estado !== "publicada").length
            const libres = catalogo.lecciones.filter(
              (l) => !ruta.lecciones.includes(l.id)
            )
            return (
              <li
                key={ruta.id}
                className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-border"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <h3 className="font-semibold text-balance">{ruta.titulo}</h3>
                    <p className="text-sm text-pretty text-muted-foreground">
                      {ruta.descripcion}
                    </p>
                  </div>
                  <ButtonGroup>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label={t("editar")}
                      onClick={() => setEditando(borradorDeRuta(ruta))}
                    >
                      <Pencil />
                    </Button>
                    {esCreada(ruta.id) && (
                      <Button
                        variant="outline"
                        size="icon-sm"
                        aria-label={t("borrar")}
                        onClick={() => setBorrando(ruta)}
                      >
                        <Trash2 />
                      </Button>
                    )}
                  </ButtonGroup>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <PlanBadge plan={planMinimoRuta(ruta, catalogo)} />
                  <Badge variant="outline">{t("clases", { n: clases.length })}</Badge>
                  {sinPublicar > 0 && (
                    <Badge variant="warning">
                      {t("sinPublicar", { n: sinPublicar })}
                    </Badge>
                  )}
                  <span className="text-muted-foreground">
                    {t("para", {
                      lista: f.list(ruta.para.map((p) => tax(`experiencia.${p}`))),
                    })}
                  </span>
                </div>

                {/* Las filas envuelven: a 412 px el título, la duración y los
                    tres botones no caben en una línea, y los botones quedaban
                    fuera de la tarjeta sin forma de llegar a ellos */}
                <ol className="space-y-1">
                  {clases.map((l, i) => (
                    <li
                      key={l.id}
                      className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-muted/50 px-2 py-1.5"
                    >
                      <span className="w-5 shrink-0 text-xs text-muted-foreground tabular-nums">
                        {i + 1}
                      </span>
                      <span className="min-w-40 flex-1 truncate text-sm">{l.titulo}</span>
                      {l.estado !== "publicada" && (
                        <Badge variant="outline">{tf(`estados.${l.estado}`)}</Badge>
                      )}
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {formatDuration(l.duracionSeg)}
                      </span>
                      <ButtonGroup className="ms-auto">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={i === 0}
                          aria-label={t("subir", { titulo: l.titulo })}
                          onClick={() => onMover(ruta.id, l.id, -1)}
                        >
                          <ChevronUp />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={i === clases.length - 1}
                          aria-label={t("bajar", { titulo: l.titulo })}
                          onClick={() => onMover(ruta.id, l.id, 1)}
                        >
                          <ChevronDown />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t("quitar", { titulo: l.titulo })}
                          onClick={() => onQuitar(ruta.id, l.id)}
                        >
                          <X />
                        </Button>
                      </ButtonGroup>
                    </li>
                  ))}
                </ol>

                {/* El desplegable se queda apagado con su motivo, como el resto */}
                <Select
                  value=""
                  disabled={libres.length === 0}
                  onValueChange={(v) => onAnadir(ruta.id, v)}
                >
                  <SelectTrigger size="sm" aria-label={t("anadir")}>
                    <SelectValue
                      placeholder={libres.length === 0 ? t("anadirVacio") : t("anadir")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {libres.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.titulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </li>
            )
          })}
        </ul>
      )}

      {/* `key` por ruta: el formulario nace con su borrador y no hace falta
          ningún efecto que lo siembre */}
      <Dialog open={editando !== null} onOpenChange={(v) => !v && setEditando(null)}>
        <DialogContent className="top-[6vh] max-h-[88vh] translate-y-0 overflow-y-auto sm:max-w-lg">
          {editando && (
            <RutaForm
              key={editando.id ?? "nueva"}
              inicial={editando}
              catalogo={catalogo}
              onCerrar={() => setEditando(null)}
              onGuardar={(b) => {
                onGuardar(b)
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
                if (borrando) onBorrar(borrando.id)
                setBorrando(null)
              }}
            >
              {t("delete.action")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminSection>
  )
}

/** El título, la descripción y a quién se propone. Las clases se ordenan fuera. */
function RutaForm({
  inicial,
  catalogo,
  onGuardar,
  onCerrar,
}: {
  inicial: BorradorRuta
  catalogo: Catalogo
  onGuardar: (b: BorradorRuta) => void
  onCerrar: () => void
}) {
  const t = useTranslations("admin.formacion.rutas")
  const tax = useTranslations("taxonomy")
  const [b, setB] = React.useState<BorradorRuta>(inicial)
  const [intento, setIntento] = React.useState(false)

  const avisos = validarRuta(b, catalogo)
  const frase = (a: AvisoRuta | undefined) =>
    a
      ? t(`form.errors.${a.code}`, { min: a.values?.min ?? 0, max: a.values?.max ?? 0 })
      : null
  const error = (campo: keyof BorradorRuta) => {
    const a = avisos[campo]
    if (!a) return null
    return !a.bloquea || intento ? frase(a) : null
  }
  const malo = (campo: keyof BorradorRuta) =>
    Boolean(intento && avisos[campo]?.bloquea) || undefined

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault()
        setIntento(true)
        if (hayBloqueoRuta(avisos)) return
        onGuardar(b)
      }}
    >
      <DialogHeader>
        <DialogTitle>
          {inicial.id
            ? t("form.editTitle", { titulo: inicial.titulo })
            : t("form.newTitle")}
        </DialogTitle>
        <FieldDescription>{t("form.description")}</FieldDescription>
      </DialogHeader>

      <Field data-invalid={malo("titulo")}>
        <FieldLabel htmlFor="ruta-titulo">{t("form.titulo")}</FieldLabel>
        <Input
          id="ruta-titulo"
          value={b.titulo}
          aria-invalid={malo("titulo")}
          minLength={LIMITES_RUTA.tituloMin}
          onChange={(e) => setB((x) => ({ ...x, titulo: e.target.value }))}
        />
        {error("titulo") && <FieldError>{error("titulo")}</FieldError>}
      </Field>

      <Field data-invalid={malo("descripcion")}>
        <FieldLabel htmlFor="ruta-descripcion">{t("form.descripcion")}</FieldLabel>
        <Textarea
          id="ruta-descripcion"
          rows={3}
          value={b.descripcion}
          aria-invalid={malo("descripcion")}
          onChange={(e) => setB((x) => ({ ...x, descripcion: e.target.value }))}
        />
        {error("descripcion") && <FieldError>{error("descripcion")}</FieldError>}
      </Field>

      {/* `FieldLegend`, no `FieldLabel htmlFor`: un `<label for>` apuntando a un
          botón le roba el nombre accesible —el primero pasaba a llamarse «A
          quién se le propone»— y además un grupo de opciones no es un campo */}
      <FieldSet data-invalid={malo("para")}>
        <FieldLegend variant="label">{t("form.para")}</FieldLegend>
        <FieldDescription>{t("form.paraHint")}</FieldDescription>
        <ToggleGroup
          type="multiple"
          variant="outline"
          spacing={2}
          value={[...b.para]}
          onValueChange={(v) => setB((x) => ({ ...x, para: v as Experiencia[] }))}
          className="flex-wrap"
        >
          {EXPERIENCIA.map((e) => (
            <ToggleGroupItem
              key={e}
              value={e}
              data-sound="tap"
              className="transition-colors data-[state=on]:border-primary data-[state=on]:bg-accent"
            >
              {tax(`experiencia.${e}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {error("para") && <FieldError>{error("para")}</FieldError>}
      </FieldSet>

      {error("lecciones") && (
        <p className="text-sm text-muted-foreground">{error("lecciones")}</p>
      )}

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="ghost" onClick={onCerrar}>
            {t("form.cancel")}
          </Button>
        </DialogClose>
        <Button type="submit" variant="brand">
          {t("form.save")}
        </Button>
      </DialogFooter>
    </form>
  )
}
