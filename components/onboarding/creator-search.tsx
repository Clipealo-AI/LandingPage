"use client"

import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import { Plus, Search, X } from "lucide-react"
import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import {
  buscarCreadores,
  pendienteDesdeTexto,
  plataformaPrincipal,
  seguidoresPrincipales,
  type Creador,
} from "@/lib/creadores"
import type { CreadorPendiente, PaisResidencia } from "@/lib/onboarding"
import type { Vertical } from "@/lib/taxonomia"
import { useFormat } from "@/hooks/use-format"
import { Badge } from "@/components/ui/badge"
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/input-group"
import {
  AvatarCreador,
  LogoPlataforma,
  mismoFan,
  nombrePlataforma,
  type Fan,
} from "@/components/onboarding/creator-avatar"

export interface CreatorSearchProps {
  /** Nombre del campo (visible arriba y etiqueta del combobox). */
  etiqueta: string
  placeholder: string
  /** A la derecha de la etiqueta: el contador «{n} de 5». También describe el campo. */
  contador?: string
  pais?: PaisResidencia | null
  /** Desempata a favor de sus verticales. */
  verticales?: readonly Vertical[]
  /** Ya elegidos: salen con ✓ y elegirlos otra vez los quita. */
  elegidos: readonly Fan[]
  /**
   * «Añadir «{texto}»» y enlaces fuera del catálogo como `CreadorPendiente`.
   * `false` (creador de la agencia) solo deja elegir del catálogo.
   */
  pendientes?: boolean
  /** Si el creador tiene una campaña activa (insignia «Tiene campaña»). */
  conCampana?: (creador: Creador) => boolean
  /** Elige un fan. `false` = no se añadió (p. ej. lleno): la búsqueda se queda. */
  onElegir: (fan: Fan) => boolean | void
  onQuitar: (fan: Fan) => void
  /** Retroceso con el campo vacío: quita el último. */
  onQuitarUltimo?: () => void
  /** Enter con el campo vacío (en la toma: continuar). */
  onEnterVacio?: () => void
  invalid?: boolean
  "aria-describedby"?: string
  className?: string
}

/**
 * Buscador de creadores (§4.1) sobre `cmdk` (`role="combobox"`), en línea y a
 * todo el ancho de la toma en escritorio y móvil (sin Drawer ni popover). Se
 * carga con `dynamic()` desde la toma: no entra en el paquete inicial.
 *
 * - Busca sin tildes por nombre y handle y agrupa por plataforma («En Kick»,
 *   «En YouTube»); un enlace pegado (`twitch.tv/x`, `kick.com/x`,
 *   `youtube.com/@x`, `tiktok.com/@x`) se resuelve a un creador del catálogo o a
 *   un pendiente con plataforma y handle. Sin resultados: «No lo encontramos.» y
 *   «Añadir «{texto}»».
 * - Teclado: flechas recorren los resultados, Enter elige (con el campo vacío,
 *   `onEnterVacio`), Esc borra la búsqueda y Retroceso con el campo vacío quita
 *   el último. El contenedor lleva `data-toma-enter="propio"`: el flujo no
 *   continúa con su Enter.
 * - Elegir o quitar va en silencio (§5.12): no hay `data-sound`.
 */
export function CreatorSearch({
  etiqueta,
  placeholder,
  contador,
  pais,
  verticales,
  elegidos,
  pendientes = true,
  conCampana = (c) => !!c.campanaId,
  onElegir,
  onQuitar,
  onQuitarUltimo,
  onEnterVacio,
  invalid,
  "aria-describedby": describedByExterno,
  className,
}: CreatorSearchProps) {
  const t = useTranslations("onboarding.clipero.fandom")
  const te = useTranslations("onboarding.errors")
  const tt = useTranslations("taxonomy")
  const f = useFormat()
  const id = React.useId()
  const input = React.useRef<HTMLInputElement>(null)
  const [q, setQ] = React.useState("")

  const busqueda = React.useMemo(
    () => buscarCreadores(q, { pais, verticales, limite: 8 }),
    [q, pais, verticales]
  )
  const noReconocido = busqueda.tipo === "enlace-no-reconocido"
  const abierta = busqueda.tipo !== "vacio" && !noReconocido

  // cmdk fija `aria-expanded="true"` en el campo; React no lo vuelve a escribir
  // mientras la prop no cambie, así que aquí se deja el estado real
  React.useLayoutEffect(() => {
    input.current?.setAttribute("aria-expanded", String(abierta))
  })

  const elegido = (fan: Fan) => elegidos.some((x) => mismoFan(x, fan))

  const alternar = (fan: Fan) => {
    if (elegido(fan)) {
      onQuitar(fan)
      setQ("")
      return
    }
    if (onElegir(fan) !== false) setQ("")
  }

  const alTeclear = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.nativeEvent.isComposing) return
    if (e.key === "Enter" && !q.trim()) {
      e.preventDefault()
      onEnterVacio?.()
    } else if (e.key === "Escape" && q) {
      e.preventDefault()
      setQ("")
    } else if (e.key === "Backspace" && !q && elegidos.length) {
      onQuitarUltimo?.()
    }
  }

  const describedBy =
    [
      describedByExterno,
      contador ? `${id}-contador` : null,
      noReconocido ? `${id}-error` : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined

  const itemCreador = (c: Creador) => {
    const plataforma = plataformaPrincipal(c)
    const marcado = elegido(c.id)
    return (
      <CommandItem
        key={c.id}
        value={c.id}
        onSelect={() => alternar(c.id)}
        data-checked={marcado ? "true" : undefined}
        data-creador={c.id}
        className="min-h-12 gap-3 rounded-lg px-2.5 py-2 @[100rem]/bienvenida:min-h-14"
      >
        <AvatarCreador nombre={c.nombre} semilla={c.id} plataforma={plataforma} />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate font-medium @[100rem]/bienvenida:text-base">
              {c.nombre}
            </span>
            {conCampana(c) && <Badge variant="secondary">{t("hasCampaign")}</Badge>}
          </span>
          <span className="block truncate text-xs text-muted-foreground @[100rem]/bienvenida:text-sm">
            @{c.cuentas[0].handle} · {nombrePlataforma(plataforma)} ·{" "}
            {t("followers", { seguidores: f.compact(seguidoresPrincipales(c)) })}
            {c.verticales[0] ? ` · ${tt(`verticales.${c.verticales[0]}`)}` : null}
          </span>
        </span>
        {marcado && <span className="sr-only">{t("search.chosen")}</span>}
      </CommandItem>
    )
  }

  const itemPendiente = (p: CreadorPendiente) => (
    <CommandItem
      key="pendiente"
      value={`pendiente:${p.plataforma ?? ""}:${p.handle ?? p.texto}`}
      onSelect={() => alternar(p)}
      data-checked={elegido(p) ? "true" : undefined}
      data-pendiente=""
      className="min-h-12 gap-3 rounded-lg px-2.5 py-2 @[100rem]/bienvenida:min-h-14"
    >
      <span
        aria-hidden
        className="grid size-10 shrink-0 place-items-center rounded-full border border-dashed border-border text-muted-foreground"
      >
        {p.plataforma ? <LogoPlataforma plataforma={p.plataforma} /> : <Plus />}
      </span>
      <span className="min-w-0 flex-1 truncate font-medium @[100rem]/bienvenida:text-base">
        {t("search.add", { texto: p.handle ? `@${p.handle}` : p.texto })}
      </span>
      {elegido(p) && <span className="sr-only">{t("search.chosen")}</span>}
    </CommandItem>
  )

  const vacio = (
    <p role="presentation" className="px-3 py-3 text-sm text-muted-foreground">
      {t("search.empty")}
    </p>
  )

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-baseline justify-between gap-3">
        {/* Visible para quien ve; el lector de pantalla lee la etiqueta de cmdk */}
        <span
          aria-hidden
          className="text-sm font-medium"
          onClick={() => input.current?.focus()}
        >
          {etiqueta}
        </span>
        {contador && (
          <span
            id={`${id}-contador`}
            className="text-sm text-muted-foreground tabular-nums"
          >
            {contador}
          </span>
        )}
      </div>

      <Command
        shouldFilter={false}
        loop
        label={etiqueta}
        onKeyDown={alTeclear}
        data-toma-enter="propio"
        data-buscador-creadores=""
        className="size-auto overflow-visible rounded-none! bg-transparent p-0 text-foreground"
      >
        <InputGroup
          data-invalid={invalid || undefined}
          className="h-11 rounded-xl bg-card @[100rem]/bienvenida:h-12"
        >
          <InputGroupAddon>
            <Search aria-hidden />
          </InputGroupAddon>
          <CommandPrimitive.Input
            ref={input}
            value={q}
            onValueChange={setQ}
            placeholder={placeholder}
            data-slot="input-group-control"
            enterKeyHint="search"
            autoCapitalize="off"
            aria-invalid={invalid || noReconocido || undefined}
            aria-describedby={describedBy}
            className="h-full min-w-0 flex-1 bg-transparent px-2 text-base outline-none placeholder:text-muted-foreground"
          />
          {q && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-sm"
                aria-label={t("search.clear")}
                onClick={() => {
                  setQ("")
                  input.current?.focus()
                }}
              >
                <X aria-hidden />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>

        {noReconocido && (
          <p id={`${id}-error`} className="mt-2 text-sm text-destructive">
            {te("enlaceNoReconocido")}
          </p>
        )}

        <CommandList
          hidden={!abierta}
          label={t("search.results")}
          className="mt-2 max-h-[min(24rem,50svh)] rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-sm"
        >
          {busqueda.tipo === "texto" &&
            (busqueda.creadores.length > 0 ? (
              busqueda.grupos.map((g) => (
                <CommandGroup
                  key={g.plataforma}
                  heading={t("search.group", {
                    plataforma: nombrePlataforma(g.plataforma),
                  })}
                >
                  {g.creadores.map(itemCreador)}
                </CommandGroup>
              ))
            ) : pendientes ? (
              <CommandGroup heading={t("search.empty")}>
                {itemPendiente(pendienteDesdeTexto(q))}
              </CommandGroup>
            ) : (
              vacio
            ))}
          {busqueda.tipo === "enlace" && (
            <CommandGroup
              heading={t("search.link", {
                plataforma: nombrePlataforma(busqueda.enlace.plataforma),
              })}
            >
              {itemCreador(busqueda.creador)}
            </CommandGroup>
          )}
          {busqueda.tipo === "pendiente" &&
            (pendientes && busqueda.pendiente.plataforma ? (
              <CommandGroup
                heading={t("search.link", {
                  plataforma: nombrePlataforma(busqueda.pendiente.plataforma),
                })}
              >
                {itemPendiente(busqueda.pendiente)}
              </CommandGroup>
            ) : (
              vacio
            ))}
        </CommandList>
      </Command>
    </div>
  )
}
