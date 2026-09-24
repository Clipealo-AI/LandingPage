"use client"

import { ChevronDown, Funnel, X } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  CUENTA_HUERFANA,
  hayFiltro,
  hayHuerfanas,
  redesFiltrables,
  type EntradaAgenda,
  type FiltroAgenda,
} from "@/lib/agenda"
import {
  SOCIAL_NETWORKS,
  cuentaPorId,
  type SocialAccount,
  type SocialId,
} from "@/lib/social"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SocialGlyph } from "@/components/brand/social"

/** Valor del desplegable de cuentas para «todas»: Radix no admite `""`. */
const TODAS = "todas"

/**
 * El filtro del Calendario: por red (varias) y por cuenta (una).
 *
 * El estado va ESCRITO en los dos disparadores («Todas las redes», «3 redes»,
 * «TikTok · @cortes.ana»): el tinte de la fila solo acompaña. Por eso no hay
 * chips, que repetirían lo que ya dicen los botones y robarían un renglón a
 * 390 px.
 *
 * Ningún control suena: el sonido es de la acción principal, no de mirar.
 */
export function AgendaFiltros({
  entradas,
  aLaVista,
  cuentas,
  filtro,
  visibles,
  onCambiar,
  className,
}: {
  /** Todas las de la agenda: deciden qué opciones EXISTEN (no cambian al navegar). */
  entradas: EntradaAgenda[]
  /** Las de los días que se miran, SIN filtrar: son los contadores. */
  aLaVista: EntradaAgenda[]
  cuentas: SocialAccount[]
  filtro: FiltroAgenda
  /** Cuántas de las que se miran pasan el filtro: el «3 de 9». */
  visibles: number
  onCambiar: (filtro: FiltroAgenda) => void
  className?: string
}) {
  const t = useTranslations("calendario.filtros")
  const puesto = hayFiltro(filtro)

  const redes = redesFiltrables(entradas, cuentas)
  // La cuenta se elige DENTRO de las redes puestas: así ningún clic construye un
  // filtro imposible. A mano sí se puede, y entonces la pantalla lo dice
  const opciones = cuentas.filter(
    (c) => c.handle && (filtro.redes.length === 0 || filtro.redes.includes(c.network))
  )
  const elegida = cuentaPorId(filtro.cuenta, cuentas)
  const huerfanas = hayHuerfanas(entradas, cuentas)
  /**
   * Las cuentas viven en el navegador: un enlace compartido puede traer una que
   * este no tiene. Se mide contra TODAS las cuentas, no contra las opciones: una
   * cuenta de TikTok con el filtro puesto en YouTube existe, solo que no está
   * ofertada, y llamarla «una cuenta que ya no está» sería mentir.
   */
  const desconocida =
    filtro.cuenta !== undefined &&
    (filtro.cuenta === CUENTA_HUERFANA ? !huerfanas : !elegida)

  const etiquetaCuenta = (c: SocialAccount) =>
    t("cuentaOpcion", { red: SOCIAL_NETWORKS[c.network].name, handle: c.handle ?? "" })

  const etiquetaRedes =
    filtro.redes.length === 0
      ? t("todasLasRedes")
      : filtro.redes.length === 1
        ? SOCIAL_NETWORKS[filtro.redes[0]].name
        : t("nRedes", { n: filtro.redes.length })

  const valorCuenta = elegida
    ? etiquetaCuenta(elegida)
    : desconocida
      ? t("cuentaDesconocida")
      : filtro.cuenta === CUENTA_HUERFANA
        ? t("sinCuenta")
        : t("todasLasCuentas")

  const alternarRed = (red: SocialId) =>
    onCambiar({
      ...filtro,
      redes: filtro.redes.includes(red)
        ? filtro.redes.filter((r) => r !== red)
        : [...filtro.redes, red],
    })

  return (
    <div
      role="group"
      aria-label={t("grupo")}
      data-filtrado={puesto || undefined}
      className={cn("agenda-filtros", className)}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {/* El nombre accesible CONTIENE lo que se lee (WCAG 2.5.3): un
              `aria-label` que solo dijera «Redes» taparía el estado */}
          <Button
            variant="outline"
            size="sm"
            aria-label={t("redesAria", { valor: etiquetaRedes })}
          >
            <Funnel aria-hidden />
            {etiquetaRedes}
            <ChevronDown aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-60">
          <DropdownMenuCheckboxItem
            checked={filtro.redes.length === 0}
            // Sin esto el menú se cierra en cada casilla y marcar tres redes son
            // tres viajes
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={() => onCambiar({ ...filtro, redes: [] })}
          >
            {t("todasLasRedes")}
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          {redes.map((red) => (
            <DropdownMenuCheckboxItem
              key={red}
              checked={filtro.redes.includes(red)}
              onSelect={(e) => e.preventDefault()}
              onCheckedChange={() => alternarRed(red)}
            >
              <SocialGlyph network={red} tone="current" className="size-4" aria-hidden />
              {SOCIAL_NETWORKS[red].name}
              {/* Un hecho, no una predicción: cuántas hay en lo que se está mirando */}
              <span className="tabular ms-auto text-xs text-muted-foreground">
                {t("enVista", { n: aLaVista.filter((e) => e.red === red).length })}
              </span>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Select
        value={filtro.cuenta ?? TODAS}
        onValueChange={(v) =>
          onCambiar({ ...filtro, cuenta: v === TODAS ? undefined : v })
        }
      >
        <SelectTrigger
          size="sm"
          className="max-w-56"
          aria-label={t("cuentaAria", { valor: valorCuenta })}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TODAS}>{t("todasLasCuentas")}</SelectItem>
          {opciones.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {/* La red va escrita: «@clipealo» es de TikTok Y de YouTube */}
              <SocialGlyph
                network={c.network}
                tone="current"
                className="size-4"
                aria-hidden
              />
              {etiquetaCuenta(c)}
            </SelectItem>
          ))}
          {(huerfanas || filtro.cuenta === CUENTA_HUERFANA) && (
            <SelectItem value={CUENTA_HUERFANA}>{t("sinCuenta")}</SelectItem>
          )}
          {/* El valor puesto SIEMPRE tiene su opción, esté ofertado o no: sin
              ella el disparador se queda en blanco y no hay de dónde agarrarlo
              para quitarlo */}
          {filtro.cuenta &&
            filtro.cuenta !== CUENTA_HUERFANA &&
            !opciones.some((c) => c.id === filtro.cuenta) && (
              <SelectItem value={filtro.cuenta}>
                {elegida ? etiquetaCuenta(elegida) : t("cuentaDesconocida")}
              </SelectItem>
            )}
        </SelectContent>
      </Select>

      {/* Siempre montado, apagado sin filtro: los dos desplegables de al lado
          dicen «Todas las redes» y «Todas las cuentas», que es el motivo escrito
          de por qué no hay nada que quitar. Montarlo y desmontarlo tiraba el
          foco al `body` justo al pulsarlo */}
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
        disabled={!puesto}
        onClick={() => onCambiar({ redes: [] })}
      >
        <X aria-hidden /> {t("quitar")}
      </Button>

      {/* Montado siempre y vacío sin filtro: una región viva que nace con su
          texto dentro no la anuncia ningún lector, y el primer filtro —cuando la
          rejilla acaba de perder la mitad de las tarjetas— es justo el que más
          importa */}
      <p role="status" className="text-sm text-muted-foreground">
        {puesto ? t("resultado", { n: visibles, total: aLaVista.length }) : ""}
      </p>
    </div>
  )
}
