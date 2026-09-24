"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import { CAPACIDADES, CAPACIDAD_FILA, PLAN_IDS, type Capacidad } from "@/lib/pricing"
import {
  LIMITES_PLAN,
  borradorSobre,
  hayBloqueoPlan,
  validarPlan,
  type AvisoPlan,
  type BorradorPlan,
  type PlanCatalogo,
} from "@/lib/planes"
import { Button } from "@/components/ui/button"
import {
  DialogClose,
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
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useNombrePlan } from "@/components/planes/nombre-plan"

/** El estado marcado, escrito en el borde y el fondo, como en el resto. */
const MARCADO =
  "transition-colors data-[state=on]:border-primary data-[state=on]:bg-accent"

/**
 * Escribir un plan desde el backoffice.
 *
 * Se monta con `key` y recibe el borrador hecho, así que el estado nace del
 * inicializador del `useState` y no hace falta ningún efecto que lo siembre.
 *
 * Dos formas del mismo formulario: un plan creado tiene nombre, lema y escalón
 * del que hereda; uno de la web no —su nombre vive en los tres idiomas— y de él
 * se cambian precios, minutos, capacidades y si sale. La validación vive en el
 * dominio y devuelve códigos; aquí solo se traducen.
 */
export function PlanForm({
  inicial,
  otros,
  onGuardar,
  onCerrar,
}: {
  inicial: BorradorPlan
  /** Los demás planes, para no repetir nombre. */
  otros: readonly PlanCatalogo[]
  onGuardar: (b: BorradorPlan) => void
  onCerrar: () => void
}) {
  const t = useTranslations("admin.planes.catalogo.form")
  const tp = useTranslations("pricing")
  const nombrePlan = useNombrePlan()
  const [b, setB] = React.useState<BorradorPlan>(inicial)
  const [intento, setIntento] = React.useState(false)

  const creado = b.origen === "creado"
  const avisos = validarPlan(b, otros)
  const bloquea = hayBloqueoPlan(avisos)
  const pon = <K extends keyof BorradorPlan>(campo: K, valor: BorradorPlan[K]) =>
    setB((x) => ({ ...x, [campo]: valor }))

  const frase = (a: AvisoPlan | undefined) =>
    a ? t(`errors.${a.code}`, { min: a.values?.min ?? 0, max: a.values?.max ?? 0 }) : null
  const error = (campo: keyof BorradorPlan) => {
    const a = avisos[campo]
    if (!a) return null
    return !a.bloquea || intento ? frase(a) : null
  }
  const malo = (campo: keyof BorradorPlan) =>
    Boolean(intento && avisos[campo]?.bloquea) || undefined

  const numero =
    (campo: "monthly" | "yearly" | "minutos" | "asiento" | "cuentas") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = Number(e.target.value)
      pon(campo, Number.isFinite(v) ? v : 0)
    }

  const titulo = inicial.id
    ? t("editTitle", { nombre: creado ? inicial.nombre : nombrePlan(inicial.base) })
    : t("newTitle")

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault()
        setIntento(true)
        if (bloquea) return
        onGuardar(b)
      }}
    >
      <DialogHeader>
        <DialogTitle>{titulo}</DialogTitle>
        <FieldDescription>
          {creado ? t("description") : t("semillaDescription")}
        </FieldDescription>
      </DialogHeader>

      {creado && (
        <>
          <Field data-invalid={malo("nombre")}>
            <FieldLabel htmlFor="plan-nombre">{t("nombre")}</FieldLabel>
            <Input
              id="plan-nombre"
              value={b.nombre}
              maxLength={LIMITES_PLAN.nombreMax}
              aria-invalid={malo("nombre")}
              placeholder={t("nombrePlaceholder")}
              onChange={(e) => pon("nombre", e.target.value)}
            />
            {error("nombre") && <FieldError>{error("nombre")}</FieldError>}
          </Field>

          <Field>
            <FieldLabel htmlFor="plan-lema">{t("lema")}</FieldLabel>
            <Input
              id="plan-lema"
              value={b.lema}
              maxLength={LIMITES_PLAN.lemaMax}
              placeholder={t("lemaPlaceholder")}
              onChange={(e) => pon("lema", e.target.value)}
            />
            <FieldDescription>{t("lemaHint")}</FieldDescription>
          </Field>

          <FieldSet>
            <FieldLegend variant="label">{t("base")}</FieldLegend>
            <ToggleGroup
              type="single"
              variant="outline"
              spacing={2}
              value={b.base}
              // Al cambiar de escalón, lo demás lo sigue: es lo que «como Creador» quiere decir
              onValueChange={(v) =>
                v && setB((x) => borradorSobre(x, v as typeof b.base))
              }
              className="flex-wrap"
            >
              {PLAN_IDS.map((id) => (
                <ToggleGroupItem key={id} value={id} data-sound="tap" className={MARCADO}>
                  {nombrePlan(id)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <FieldDescription>{t("baseHint")}</FieldDescription>
          </FieldSet>
        </>
      )}

      <div className="grid gap-4 @lg/plan:grid-cols-2 @3xl/plan:grid-cols-3">
        <Field data-invalid={malo("monthly")}>
          <FieldLabel htmlFor="plan-monthly">{t("monthly")}</FieldLabel>
          <Input
            id="plan-monthly"
            type="number"
            inputMode="decimal"
            min={0}
            max={LIMITES_PLAN.precioMax}
            step="0.5"
            className="tabular-nums"
            value={b.monthly}
            aria-invalid={malo("monthly")}
            onChange={numero("monthly")}
          />
          {error("monthly") && <FieldError>{error("monthly")}</FieldError>}
        </Field>
        <Field data-invalid={malo("yearly")}>
          <FieldLabel htmlFor="plan-yearly">{t("yearly")}</FieldLabel>
          <Input
            id="plan-yearly"
            type="number"
            inputMode="decimal"
            min={0}
            max={LIMITES_PLAN.precioMax}
            step="0.5"
            className="tabular-nums"
            value={b.yearly}
            aria-invalid={malo("yearly")}
            onChange={numero("yearly")}
          />
          {error("yearly") && <FieldError>{error("yearly")}</FieldError>}
        </Field>
        <Field data-invalid={malo("minutos")}>
          <FieldLabel htmlFor="plan-minutos">{t("minutos")}</FieldLabel>
          <Input
            id="plan-minutos"
            type="number"
            inputMode="numeric"
            min={LIMITES_PLAN.minutosMin}
            max={LIMITES_PLAN.minutosMax}
            className="tabular-nums"
            value={b.minutos}
            aria-invalid={malo("minutos")}
            onChange={numero("minutos")}
          />
          {error("minutos") && <FieldError>{error("minutos")}</FieldError>}
        </Field>
        <Field data-invalid={malo("asiento")}>
          <FieldLabel htmlFor="plan-asiento">{t("asiento")}</FieldLabel>
          <Input
            id="plan-asiento"
            type="number"
            inputMode="decimal"
            min={0}
            max={LIMITES_PLAN.precioMax}
            step="0.5"
            className="tabular-nums"
            value={b.asiento}
            aria-invalid={malo("asiento")}
            onChange={numero("asiento")}
          />
          {error("asiento") ? (
            <FieldError>{error("asiento")}</FieldError>
          ) : (
            <FieldDescription>{t("asientoHint")}</FieldDescription>
          )}
        </Field>
        <Field data-invalid={malo("cuentas")}>
          <FieldLabel htmlFor="plan-cuentas">{t("cuentas")}</FieldLabel>
          <Input
            id="plan-cuentas"
            type="number"
            inputMode="numeric"
            min={LIMITES_PLAN.cuentasMin}
            max={LIMITES_PLAN.cuentasMax}
            className="tabular-nums"
            value={b.cuentas}
            aria-invalid={malo("cuentas")}
            onChange={numero("cuentas")}
          />
          {error("cuentas") ? (
            <FieldError>{error("cuentas")}</FieldError>
          ) : (
            <FieldDescription>{t("cuentasHint")}</FieldDescription>
          )}
        </Field>
      </div>

      <FieldSet>
        <FieldLegend variant="label">{t("capacidades")}</FieldLegend>
        <ToggleGroup
          type="multiple"
          variant="outline"
          spacing={2}
          value={b.capacidades}
          onValueChange={(v) =>
            pon(
              "capacidades",
              CAPACIDADES.filter((c) => (v as Capacidad[]).includes(c))
            )
          }
          className="flex-wrap"
        >
          {CAPACIDADES.map((c) => (
            <ToggleGroupItem key={c} value={c} data-sound="tap" className={MARCADO}>
              {tp(`features.${CAPACIDAD_FILA[c]}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <FieldDescription>{t("capacidadesHint")}</FieldDescription>
      </FieldSet>

      <div className="grid gap-3 @lg/plan:grid-cols-3">
        <Field orientation="horizontal">
          <Switch
            id="plan-visible"
            checked={b.visible}
            onCheckedChange={(v) => pon("visible", v)}
          />
          <FieldLabel htmlFor="plan-visible" className="font-normal">
            {t("visible")}
          </FieldLabel>
        </Field>
        <Field orientation="horizontal">
          <Switch
            id="plan-activo"
            checked={b.activo}
            onCheckedChange={(v) => pon("activo", v)}
          />
          <FieldLabel htmlFor="plan-activo" className="font-normal">
            {t("activo")}
          </FieldLabel>
        </Field>
        <Field orientation="horizontal">
          <Switch
            id="plan-featured"
            checked={b.featured}
            onCheckedChange={(v) => pon("featured", v)}
          />
          <FieldLabel htmlFor="plan-featured" className="font-normal">
            {t("featured")}
          </FieldLabel>
        </Field>
      </div>
      <FieldDescription>
        {t("visibleHint")} {t("activoHint")} {t("featuredHint")}
      </FieldDescription>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="ghost" onClick={onCerrar}>
            {t("cancel")}
          </Button>
        </DialogClose>
        <Button type="submit" variant="brand">
          {t("save")}
        </Button>
      </DialogFooter>
    </form>
  )
}
