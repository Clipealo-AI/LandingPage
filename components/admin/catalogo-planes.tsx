"use client"

import * as React from "react"
import { ChevronDown, ChevronUp, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"

import { toast } from "@/lib/toast"
import type { CuentasPlan } from "@/lib/admin/metrics"
import { CAPACIDADES, CAPACIDAD_FILA } from "@/lib/pricing"
import {
  PLAN_NUEVO,
  borradorDePlan,
  nuevoIdPlan,
  resumenPlanes,
  type BorradorPlan,
  type PlanCatalogo,
} from "@/lib/planes"
import { useEditorPlanes } from "@/hooks/use-catalogo-planes"
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
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { AdminSection } from "@/components/admin/admin-page"
import { PlanForm } from "@/components/admin/plan-form"
import { usePrecio } from "@/components/planes/precio"
import { useLemaPlan, useNombrePlan } from "@/components/planes/nombre-plan"

/**
 * El catálogo de planes, editable.
 *
 * Escribe en el mismo almacén que leen /precios, la barra lateral y cada
 * puerta de la app: cambiar aquí el precio de Creador lo cambia en la tarjeta
 * sin recargar, y un plan creado para una universidad sale en «Conceder con
 * plan» al momento. Es lo que permite juzgar un plan antes de venderlo.
 *
 * Las cuentas por plan llegan del servidor (`cuentasPorPlan`, misma
 * definición que Usuarios): cada cuenta registrada está en el plan de su
 * suscripción de pago vigente y, sin ella, en Prueba. La cuenta de la demo vive
 * en este navegador y no está entre ellas; un plan creado aquí no tiene cuentas
 * en esos datos hasta que la API lo devuelva. El pie lo dice.
 */
export function CatalogoPlanes({
  cuentas,
}: {
  /** Por id de plan. Un plan creado (`plan_…`) no está: cae en «sin cuentas». */
  cuentas?: Readonly<Record<string, CuentasPlan>>
}) {
  const t = useTranslations("admin.planes.catalogo")
  const editor = useEditorPlanes()
  const { planes } = editor
  const nombrePlan = useNombrePlan()
  const [editando, setEditando] = React.useState<BorradorPlan | null>(null)
  const [borrando, setBorrando] = React.useState<PlanCatalogo | null>(null)

  const resumen = resumenPlanes(planes)

  return (
    <>
      <AdminSection
        id="catalogo"
        title={t("title")}
        description={
          <>
            {t("description")}{" "}
            <span className="tabular-nums">{t("resumen", { ...resumen })}</span>
          </>
        }
        aside={
          <ButtonGroup>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                editor.reiniciarCatalogoPlanes()
                toast(t("toasts.reiniciado"))
              }}
            >
              <RotateCcw /> {t("reiniciar")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditando({ ...PLAN_NUEVO })}
            >
              <Plus /> {t("crear")}
            </Button>
          </ButtonGroup>
        }
      >
        <ol className="space-y-2">
          {planes.map((p, i) => (
            <FilaPlan
              key={p.id}
              plan={p}
              cuenta={cuentas?.[p.id]}
              primero={i === 0}
              ultimo={i === planes.length - 1}
              editor={editor}
              onEditar={() => setEditando(borradorDePlan(p))}
              onBorrar={() => setBorrando(p)}
            />
          ))}
        </ol>
        {/* La frontera, dicha en pantalla como en Formación y en Preguntas */}
        <p className="text-xs text-pretty text-muted-foreground">{t("frontera")}</p>
      </AdminSection>

      <Dialog open={editando !== null} onOpenChange={(v) => !v && setEditando(null)}>
        <DialogContent className="@container/plan top-[6vh] max-h-[88vh] translate-y-0 overflow-y-auto sm:max-w-xl">
          {editando && (
            <PlanForm
              key={editando.id ?? "nuevo"}
              inicial={editando}
              otros={planes}
              onCerrar={() => setEditando(null)}
              onGuardar={(b) => {
                editor.guardar(b, b.id ?? nuevoIdPlan(Date.now().toString(36)))
                toast.success(t("toasts.guardado"), {
                  description: b.origen === "creado" ? b.nombre : nombrePlan(b.base),
                })
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
              {t("delete.title", { nombre: borrando ? nombrePlan(borrando) : "" })}
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
                  toast(t("toasts.borrado"), { description: nombrePlan(borrando) })
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

type Editor = ReturnType<typeof useEditorPlanes>

function FilaPlan({
  plan: p,
  cuenta,
  primero,
  ultimo,
  editor,
  onEditar,
  onBorrar,
}: {
  plan: PlanCatalogo
  cuenta?: CuentasPlan
  primero: boolean
  ultimo: boolean
  editor: Editor
  onEditar: () => void
  onBorrar: () => void
}) {
  const t = useTranslations("admin.planes.catalogo")
  const tp = useTranslations("pricing")
  const f = useFormat()
  const precio = usePrecio()
  const nombrePlan = useNombrePlan()
  const lemaPlan = useLemaPlan()
  const nombre = nombrePlan(p)
  const apagado = !p.activo
  const oculto = p.activo && !p.visible

  return (
    <li
      className="flex flex-wrap items-start gap-x-3 gap-y-2 rounded-xl bg-card p-3 ring-1 ring-border"
      data-oculto={oculto || undefined}
      data-apagado={apagado || undefined}
    >
      <Switch
        checked={p.visible}
        disabled={apagado}
        aria-label={t("mostrar", { nombre })}
        onCheckedChange={(visible) => {
          editor.parchear(p.id, { visible })
          toast(visible ? t("toasts.visible") : t("toasts.oculto"), {
            description: nombre,
          })
        }}
      />
      <div className="min-w-40 flex-1 space-y-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <p
            className={
              apagado
                ? "text-sm font-semibold text-muted-foreground"
                : "text-sm font-semibold"
            }
            // El estado se escribe, no se cifra solo en la opacidad
            title={apagado ? t("apagadoNota") : oculto ? t("ocultoNota") : undefined}
          >
            {nombre}
          </p>
          <p className="text-xs text-muted-foreground">{lemaPlan(p)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <Badge variant={p.origen === "creado" ? "secondary" : "outline"}>
            {t(p.origen === "creado" ? "creado" : "semilla")}
          </Badge>
          {p.origen === "creado" && (
            <Badge variant="outline">{t("como", { plan: nombrePlan(p.base) })}</Badge>
          )}
          {p.featured && <Badge variant="brand-subtle">{t("destacado")}</Badge>}
          {oculto && <Badge variant="warning">{t("oculto")}</Badge>}
          {apagado && <Badge variant="destructive">{t("apagado")}</Badge>}
          <span className="text-muted-foreground tabular-nums">
            {p.monthly === 0
              ? t("gratis")
              : t("precios", { mensual: precio(p.monthly), anual: precio(p.yearly) })}
          </span>
          <span className="text-muted-foreground tabular-nums">
            {t("minutos", { n: p.minutos })}
          </span>
          <span className="text-muted-foreground tabular-nums">
            {t("conexiones", { n: p.cuentas })}
          </span>
          {p.asiento > 0 && (
            <span className="text-muted-foreground tabular-nums">
              {t("asiento", { precio: precio(p.asiento) })}
            </span>
          )}
          {/* Del negocio, no del catálogo: el pie dice de dónde sale */}
          <span className="text-muted-foreground tabular-nums">
            {cuenta && cuenta.cuentas > 0
              ? t("cuentas", { n: cuenta.cuentas, pago: cuenta.dePago })
              : t("sinCuentas")}
          </span>
        </div>
        <p className="flex flex-wrap items-center gap-1.5 text-xs">
          {p.capacidades.length === 0 ? (
            <span className="text-muted-foreground">{t("sinCapacidades")}</span>
          ) : (
            <>
              <span className="text-muted-foreground">{t("desbloquea")}</span>
              {CAPACIDADES.filter((c) => p.capacidades.includes(c)).map((c) => (
                <Badge key={c} variant="outline" className="font-normal">
                  {tp(`features.${CAPACIDAD_FILA[c]}`)}
                </Badge>
              ))}
            </>
          )}
        </p>
      </div>
      <ButtonGroup className="ms-auto">
        <Button
          variant="outline"
          size="icon-sm"
          disabled={primero}
          aria-label={t("subir", { nombre })}
          onClick={() => {
            editor.mover(p.id, -1)
            toast(t("toasts.orden"))
          }}
        >
          <ChevronUp />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          disabled={ultimo}
          aria-label={t("bajar", { nombre })}
          onClick={() => {
            editor.mover(p.id, 1)
            toast(t("toasts.orden"))
          }}
        >
          <ChevronDown />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label={t("editar", { nombre })}
          onClick={onEditar}
        >
          <Pencil />
        </Button>
        {p.origen === "creado" && (
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={t("borrar", { nombre })}
            onClick={onBorrar}
          >
            <Trash2 />
          </Button>
        )}
      </ButtonGroup>
      <span className="sr-only">{f.number(p.orden + 1)}</span>
    </li>
  )
}
