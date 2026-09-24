"use client"

import * as React from "react"
import {
  EyeOff,
  MoreHorizontal,
  Pencil,
  Plus,
  Send,
  Trash2,
  VideoOff,
} from "lucide-react"
import { useTranslations } from "next-intl"

import { toast } from "@/lib/toast"
import { formatDuration } from "@/lib/format"
import { PLAN_IDS } from "@/lib/pricing"
import {
  CLASE_NUEVA,
  ESTADOS_CLASE,
  borradorDeClase,
  resumenCatalogo,
  type BorradorClase,
  type Catalogo,
  type EstadoClase,
  type Leccion,
} from "@/lib/formacion"
import { useFormat } from "@/hooks/use-format"
import {
  esClaseCreada,
  esRutaCreada,
  useCatalogoFormacion,
} from "@/hooks/use-catalogo-formacion"
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
import { Dialog, DialogContent } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PageHeader } from "@/components/shared/page-header"
import { AdminSection } from "@/components/admin/admin-page"
import { AdminTable, type Column } from "@/components/admin/admin-table"
import { KpiCard, KpiGrid } from "@/components/admin/kpi-card"
import { PlanBadge } from "@/components/admin/plan-badge"
import { ClaseForm } from "@/components/admin/clase-form"
import { RutasAdmin } from "@/components/admin/rutas-admin"

const TONO_ESTADO: Record<EstadoClase, React.ComponentProps<typeof Badge>["variant"]> = {
  borrador: "outline",
  publicada: "success",
  despublicada: "secondary",
}

/**
 * Formación en el backoffice: publicar clases, retirarlas y decidir con qué plan
 * se ven (docs/campanas-ciclo-2026-09.md §6).
 *
 * Como la cola de disputas, comparte estado con la app: lo que se publica aquí
 * aparece en /formacion sin recargar, porque las dos mitades leen el mismo
 * almacén (`hooks/use-catalogo-formacion.ts`). El servidor solo trae las
 * semillas; lo que este navegador haya cambiado va encima.
 *
 * Frontera de datos: **no hay vistas**. El avance de cada alumno vive en su
 * navegador y no llega hasta aquí, así que el panel no cuenta cuántos han visto
 * una clase; lo dice con todas las letras en vez de enseñar un cero que parece
 * un dato.
 */
export function FormacionAdmin({ iniciales }: { iniciales: Catalogo }) {
  const t = useTranslations("admin.formacion")
  const tr = useTranslations("admin.formacion.rutas")
  const f = useFormat()
  const base = React.useMemo(() => iniciales, [iniciales])
  const {
    catalogo,
    lecciones,
    guardarClase,
    cambiarEstadoClase,
    borrarClase,
    guardarRuta,
    borrarRuta,
    moverClaseEnRuta,
    anadirClaseARuta,
    quitarClaseDeRuta,
  } = useCatalogoFormacion(base)

  /** `null` = cerrado; sin `id` = alta nueva. */
  const [editando, setEditando] = React.useState<BorradorClase | null>(null)
  const [borrando, setBorrando] = React.useState<Leccion | null>(null)

  const resumen = React.useMemo(() => resumenCatalogo(catalogo), [catalogo])
  const filas = React.useMemo(
    () =>
      [...lecciones].sort(
        (a, b) =>
          Date.parse(b.editadaEn ?? b.publicadaEn) -
            Date.parse(a.editadaEn ?? a.publicadaEn) || a.id.localeCompare(b.id)
      ),
    [lecciones]
  )

  /** El reloj real, y solo aquí: esto es un manejador, no una pintada. */
  const avisar = (guardado: boolean, texto: string, descripcion?: string) => {
    if (!guardado) return toast.warning(t("toasts.noStorage"))
    toast.success(texto, descripcion ? { description: descripcion } : undefined)
  }

  const columnas: Column<Leccion>[] = [
    {
      key: "clase",
      header: t("table.clase"),
      sortValue: (l) => l.titulo,
      render: (l) => (
        <span className="block max-w-96 min-w-56 space-y-0.5 whitespace-normal">
          <span className="font-medium">{l.titulo}</span>
          <span className="block text-xs text-muted-foreground">{l.descripcion}</span>
          {l.estado === "publicada" && !l.video.url && (
            <Badge variant="warning" className="mt-1 gap-1">
              <VideoOff aria-hidden data-icon="inline-start" />
              {t("table.sinVideo")}
            </Badge>
          )}
        </span>
      ),
    },
    {
      key: "estado",
      header: t("table.estado"),
      sortValue: (l) => l.estado,
      render: (l) => (
        <Badge variant={TONO_ESTADO[l.estado]}>{t(`estados.${l.estado}`)}</Badge>
      ),
    },
    {
      key: "plan",
      header: t("table.plan"),
      sortValue: (l) => PLAN_IDS.indexOf(l.planMinimo),
      render: (l) => <PlanBadge plan={l.planMinimo} />,
    },
    {
      key: "nivel",
      header: t("table.nivel"),
      hideBelow: "md",
      sortValue: (l) => l.nivel,
      render: (l) => t(`niveles.${l.nivel}`),
    },
    {
      key: "duracion",
      header: t("table.duracion"),
      align: "right",
      hideBelow: "sm",
      sortValue: (l) => l.duracionSeg,
      render: (l) => (
        <span className="tabular-nums">{formatDuration(l.duracionSeg)}</span>
      ),
    },
    {
      key: "publicada",
      header: t("table.publicada"),
      hideBelow: "lg",
      sortValue: (l) => l.publicadaEn,
      render: (l) => (
        <span className="whitespace-nowrap text-muted-foreground tabular-nums">
          {l.publicadaEn ? f.date(l.publicadaEn) : "—"}
        </span>
      ),
    },
    {
      key: "acciones",
      header: t("table.acciones"),
      align: "right",
      render: (l) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("acciones.menu", { titulo: l.titulo })}
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setEditando(borradorDeClase(l))}>
              <Pencil /> {t("acciones.editar")}
            </DropdownMenuItem>
            {l.estado === "publicada" ? (
              <DropdownMenuItem
                onSelect={() =>
                  avisar(
                    cambiarEstadoClase(l.id, "despublicada", new Date().toISOString()),
                    t("toasts.unpublished"),
                    t("toasts.unpublishedDescription")
                  )
                }
              >
                <EyeOff /> {t("acciones.retirar")}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onSelect={() =>
                  avisar(
                    cambiarEstadoClase(l.id, "publicada", new Date().toISOString()),
                    t("toasts.published"),
                    l.titulo
                  )
                }
              >
                <Send /> {t("acciones.publicar")}
              </DropdownMenuItem>
            )}
            {/* Solo lo creado aquí se borra: una semilla se retira, porque
                borrarla dejaría rutas apuntando a un id que ya no existe */}
            {esClaseCreada(l.id) && (
              <DropdownMenuItem variant="destructive" onSelect={() => setBorrando(l)}>
                <Trash2 /> {t("acciones.borrar")}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Button
            variant="brand"
            size="sm"
            onClick={() => setEditando({ ...CLASE_NUEVA })}
          >
            <Plus /> {t("create")}
          </Button>
        }
      />

      <KpiGrid>
        <KpiCard
          featured
          label={t("kpis.published")}
          value={f.number(resumen.publicadas)}
          lines={[
            t("kpis.publishedLines", {
              borradores: resumen.borradores,
              retiradas: resumen.despublicadas,
            }),
          ]}
          footnote={t("kpis.publishedFootnote")}
        />
        <KpiCard
          label={t("kpis.minutes")}
          value={f.number(resumen.minutos)}
          lines={[t("kpis.minutesLines", resumen.porNivel)]}
        />
        <KpiCard
          label={t("kpis.noVideo")}
          value={f.number(resumen.sinVideo)}
          tone={resumen.sinVideo > 0 ? "aviso" : "ok"}
          lines={[t("kpis.noVideoLines")]}
          footnote={t("kpis.noVideoFootnote")}
        />
        <KpiCard
          label={t("kpis.paid")}
          value={f.number(resumen.porPlan.creator + resumen.porPlan.business)}
          lines={[t("kpis.paidLines", resumen.porPlan)]}
          footnote={t("kpis.paidFootnote")}
        />
      </KpiGrid>

      {/* Lo que este panel NO puede saber, escrito antes de que nadie lo busque
          en la tabla. Sin cuerpo: el aviso ES el contenido */}
      <AdminSection
        id="vistas"
        title={t("views.title")}
        description={t("views.description")}
      >
        {null}
      </AdminSection>

      <RutasAdmin
        catalogo={catalogo}
        esCreada={esRutaCreada}
        onGuardar={(b) => avisar(guardarRuta(b), tr("toasts.saved"), b.titulo)}
        onBorrar={(id) => avisar(borrarRuta(id), tr("toasts.deleted"))}
        onMover={(rutaId, leccionId, delta) =>
          avisar(moverClaseEnRuta(rutaId, leccionId, delta), tr("toasts.ordered"))
        }
        onAnadir={(rutaId, leccionId) =>
          avisar(anadirClaseARuta(rutaId, leccionId), tr("toasts.saved"))
        }
        onQuitar={(rutaId, leccionId) =>
          avisar(quitarClaseDeRuta(rutaId, leccionId), tr("toasts.saved"))
        }
      />

      <AdminSection id="clases" title={t("table.caption")}>
        <AdminTable
          rows={filas}
          columns={columnas}
          rowKey={(l) => l.id}
          caption={t("table.caption")}
          defaultSort={{ key: "publicada", dir: "desc" }}
          search={{
            placeholder: t("table.search"),
            keys: (l) => [l.titulo, l.descripcion],
          }}
          filters={[
            {
              param: "estado",
              label: t("filters.estado"),
              variant: "toggle",
              options: [
                { value: "todos", label: t("filters.todos") },
                ...ESTADOS_CLASE.map((e) => ({ value: e, label: t(`estados.${e}`) })),
              ],
              predicate: (l, v) => v === "todos" || l.estado === v,
              defaultValue: "todos",
            },
            {
              param: "plan",
              label: t("filters.plan"),
              options: [
                { value: "todos", label: t("filters.todos") },
                ...PLAN_IDS.map((p) => ({ value: p, label: p })),
              ],
              predicate: (l, v) => v === "todos" || l.planMinimo === v,
              defaultValue: "todos",
            },
          ]}
          summary={(rows) =>
            t("table.resumen", {
              n: rows.length,
              min: Math.round(rows.reduce((s, l) => s + l.duracionSeg, 0) / 60),
            })
          }
          empty={{ title: t("table.empty"), description: t("table.emptyDescription") }}
        />
      </AdminSection>

      {/* `key` por clase: el formulario nace con su borrador dentro y no hace
          falta ningún efecto que lo siembre */}
      <Dialog open={editando !== null} onOpenChange={(v) => !v && setEditando(null)}>
        <DialogContent className="@container/clase top-[4vh] max-h-[92vh] translate-y-0 overflow-y-auto sm:max-w-2xl">
          {editando && (
            <ClaseForm
              key={editando.id ?? "nueva"}
              inicial={editando}
              onCerrar={() => setEditando(null)}
              onGuardar={(b) => {
                avisar(
                  guardarClase(b, new Date().toISOString()),
                  t("toasts.saved"),
                  b.titulo
                )
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
                if (borrando)
                  avisar(borrarClase(borrando.id), t("toasts.deleted"), borrando.titulo)
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
