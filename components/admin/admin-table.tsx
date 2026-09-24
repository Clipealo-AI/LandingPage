"use client"

import * as React from "react"
import { parseAsInteger, parseAsString, useQueryState, useQueryStates } from "nuqs"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

export interface Column<T> {
  key: string
  header: React.ReactNode
  render: (row: T) => React.ReactNode
  /** Valor por el que se ordena. Sin él, la columna no es ordenable. */
  sortValue?: (row: T) => number | string | null | undefined
  align?: "left" | "right" | "center"
  className?: string
  /** Oculta la columna por debajo de este ancho. */
  hideBelow?: "sm" | "md" | "lg" | "xl"
}

export interface FilterDef<T> {
  /** Nombre del parámetro en la URL. */
  param: string
  label: string
  options: { value: string; label: string }[]
  predicate: (row: T, value: string) => boolean
  /** Botones a la vista (pocas opciones) o desplegable. */
  variant?: "toggle" | "select"
  defaultValue?: string
}

export interface AdminTableProps<T> {
  rows: T[]
  columns: Column<T>[]
  rowKey: (row: T) => string
  caption: string
  search?: { placeholder: string; keys: (row: T) => (string | null | undefined)[] }
  filters?: FilterDef<T>[]
  defaultSort?: { key: string; dir: "asc" | "desc" }
  pageSize?: number
  empty?: { title: string; description?: string }
  /** Resumen sobre las filas filtradas (totales, medias…). */
  summary?: (rows: T[]) => React.ReactNode
  /** Acciones a la derecha de la barra de filtros. */
  toolbar?: React.ReactNode
  rowClassName?: (row: T) => string | undefined
}

const HIDE: Record<NonNullable<Column<unknown>["hideBelow"]>, string> = {
  sm: "max-sm:hidden",
  md: "max-md:hidden",
  lg: "max-lg:hidden",
  xl: "max-xl:hidden",
}

/**
 * Tabla de trabajo del backoffice. Búsqueda, filtros, orden y página viven en
 * la URL (nuqs): un enlace a «pagantes inactivos ordenados por importe» se
 * puede compartir. Las filas llegan ya calculadas del servidor; aquí solo se
 * filtran y se ordenan. Necesita un `<Suspense>` por encima.
 */
export function AdminTable<T>({
  rows,
  columns,
  rowKey,
  caption,
  search,
  filters = [],
  defaultSort,
  pageSize = 25,
  empty,
  summary,
  toolbar,
  rowClassName,
}: AdminTableProps<T>) {
  const t = useTranslations("admin.table")
  const locale = useLocale()
  const [q, setQ] = useQueryState("q", parseAsString.withDefault(""))
  const [orden, setOrden] = useQueryState(
    "orden",
    parseAsString.withDefault(defaultSort ? `${defaultSort.key}:${defaultSort.dir}` : "")
  )
  const [pagina, setPagina] = useQueryState("pagina", parseAsInteger.withDefault(1))
  const [filterValues, setFilterValue] = useFilterParams(filters)

  const [sortKey, sortDir] = orden.split(":") as [string, "asc" | "desc" | undefined]

  const filtradas = React.useMemo(() => {
    const term = q.trim().toLowerCase()
    let list = rows
    for (const f of filters) {
      const v = filterValues[f.param]
      if (v && v !== "todos") list = list.filter((r) => f.predicate(r, v))
    }
    if (term && search) {
      list = list.filter((r) =>
        search
          .keys(r)
          .filter(Boolean)
          .some((k) => String(k).toLowerCase().includes(term))
      )
    }
    const col = columns.find((c) => c.key === sortKey)
    if (col?.sortValue) {
      const dir = sortDir === "asc" ? 1 : -1
      // Un colador reutilizado: `String.localeCompare` construye uno nuevo en
      // cada comparación, y ordenar 652 filas son miles
      const comparador = new Intl.Collator(locale)
      list = [...list].sort((a, b) => {
        const va = col.sortValue!(a)
        const vb = col.sortValue!(b)
        if (va == null && vb == null) return 0
        if (va == null) return 1
        if (vb == null) return -1
        if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir
        return comparador.compare(String(va), String(vb)) * dir
      })
    }
    return list
  }, [rows, filters, filterValues, q, search, columns, sortKey, sortDir, locale])

  const paginas = Math.max(1, Math.ceil(filtradas.length / pageSize))
  const actual = Math.min(Math.max(1, pagina), paginas)
  const visibles = filtradas.slice((actual - 1) * pageSize, actual * pageSize)

  const hayFiltros =
    Boolean(q) ||
    filters.some(
      (f) =>
        filterValues[f.param] && filterValues[f.param] !== (f.defaultValue ?? "todos")
    )
  const limpiar = () => {
    void setQ(null)
    void setPagina(null)
    for (const f of filters) void setFilterValue(f.param, null)
  }

  const cambiarOrden = (key: string) => {
    const next = sortKey === key ? (sortDir === "desc" ? "asc" : "desc") : "desc"
    void setOrden(`${key}:${next}`)
    void setPagina(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        {search && (
          <div className="relative min-w-0 flex-1 lg:max-w-xs">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={q}
              onChange={(e) => {
                void setQ(e.target.value || null)
                void setPagina(null)
              }}
              placeholder={search.placeholder}
              aria-label={search.placeholder}
              className="pl-9"
            />
          </div>
        )}

        {filters.map((f) =>
          f.variant === "toggle" ? (
            <ToggleGroup
              key={f.param}
              type="single"
              value={filterValues[f.param] || f.defaultValue || "todos"}
              onValueChange={(v) => {
                void setFilterValue(
                  f.param,
                  v && v !== (f.defaultValue ?? "todos") ? v : null
                )
                void setPagina(null)
              }}
              aria-label={f.label}
              className="w-fit max-w-full flex-wrap"
            >
              {f.options.map((o) => (
                <ToggleGroupItem key={o.value} value={o.value} className="px-3 text-xs">
                  {o.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          ) : (
            <Select
              key={f.param}
              value={filterValues[f.param] || f.defaultValue || "todos"}
              onValueChange={(v) => {
                void setFilterValue(
                  f.param,
                  v && v !== (f.defaultValue ?? "todos") ? v : null
                )
                void setPagina(null)
              }}
            >
              <SelectTrigger size="sm" className="w-44" aria-label={f.label}>
                <SelectValue placeholder={f.label} />
              </SelectTrigger>
              <SelectContent>
                {f.options.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        )}

        {hayFiltros && (
          <Button variant="ghost" size="sm" onClick={limpiar}>
            <X /> {t("clear")}
          </Button>
        )}

        {toolbar && <div className="flex items-center gap-2 lg:ml-auto">{toolbar}</div>}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground tabular-nums">
        <p aria-live="polite">
          {t("count", { n: filtradas.length, total: rows.length })}
        </p>
        {summary && <div>{summary(filtradas)}</div>}
      </div>

      {filtradas.length === 0 ? (
        <Empty className="py-10">
          <EmptyHeader>
            <EmptyTitle>{empty?.title ?? t("noResults")}</EmptyTitle>
            {empty?.description && (
              <EmptyDescription>{empty.description}</EmptyDescription>
            )}
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-border">
          <Table>
            <caption className="sr-only">{caption}</caption>
            <TableHeader>
              <TableRow>
                {columns.map((c) => {
                  const activo = sortKey === c.key
                  const Icon = activo
                    ? sortDir === "asc"
                      ? ArrowUp
                      : ArrowDown
                    : ArrowUpDown
                  return (
                    <TableHead
                      key={c.key}
                      className={cn(
                        c.align === "right" && "text-right",
                        c.align === "center" && "text-center",
                        c.hideBelow && HIDE[c.hideBelow],
                        c.className
                      )}
                      aria-sort={
                        activo
                          ? sortDir === "asc"
                            ? "ascending"
                            : "descending"
                          : undefined
                      }
                    >
                      {c.sortValue ? (
                        <button
                          type="button"
                          onClick={() => cambiarOrden(c.key)}
                          className={cn(
                            "inline-flex items-center gap-1 hover:text-foreground",
                            c.align === "right" && "flex-row-reverse",
                            activo && "text-foreground"
                          )}
                        >
                          {c.header}
                          <Icon
                            className={cn("size-3", !activo && "opacity-40")}
                            aria-hidden
                          />
                        </button>
                      ) : (
                        c.header
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            </TableHeader>
            <TableBody className="tabular-nums">
              {visibles.map((row) => (
                <TableRow key={rowKey(row)} className={rowClassName?.(row)}>
                  {columns.map((c) => (
                    <TableCell
                      key={c.key}
                      className={cn(
                        c.align === "right" && "text-right",
                        c.align === "center" && "text-center",
                        c.hideBelow && HIDE[c.hideBelow],
                        c.className
                      )}
                    >
                      {c.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {paginas > 1 && (
        <nav
          aria-label={t("pagination")}
          className="flex items-center justify-between gap-2 text-xs"
        >
          <span className="text-muted-foreground tabular-nums">
            {t("page", { actual, paginas })}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={actual <= 1}
              onClick={() => void setPagina(actual - 1 <= 1 ? null : actual - 1)}
            >
              <ChevronLeft /> {t("previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={actual >= paginas}
              onClick={() => void setPagina(actual + 1)}
            >
              {t("next")} <ChevronRight />
            </Button>
          </div>
        </nav>
      )}
    </div>
  )
}

/** Todos los filtros de la tabla en un solo estado de URL. */
function useFilterParams<T>(filters: FilterDef<T>[]) {
  const keyMap = React.useMemo(
    () =>
      Object.fromEntries(filters.map((f) => [f.param, parseAsString.withDefault("")])),
    [filters]
  )
  const [values, setValues] = useQueryStates(keyMap)
  const set = React.useCallback(
    (param: string, v: string | null) => setValues({ [param]: v }),
    [setValues]
  )
  return [values as Record<string, string>, set] as const
}
