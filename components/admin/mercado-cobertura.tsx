"use client"

import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import { GLOBAL, type CeldaMercado, type EstadoCelda } from "@/lib/mercado"
import { VERTICALES, type Vertical } from "@/lib/taxonomia"
import { useFormat } from "@/hooks/use-format"
import { CountryFlag, useCountryName } from "@/components/shared/country-flag"

/** Fondo y tinta de cada estado. El texto va escrito: el color no decide nada. */
const TONO: Record<EstadoCelda, string> = {
  "sin-oferta": "bg-destructive/10 text-destructive",
  escasez: "bg-warning/15 text-warning",
  equilibrio: "bg-success/12 text-success",
  excedente: "bg-primary/10 text-primary",
  "sin-datos": "bg-muted text-muted-foreground",
}

/**
 * Mapa de cobertura: nicho × país (§7.3). Cada casilla dice su estado con
 * palabras y, debajo, cuántos cliperos ponderados hay por cada US$ 1.000
 * activos. Las celdas con menos de 10 personas no enseñan la cifra de oferta:
 * el estado sí, la gente no.
 *
 * En móvil la rejilla se desplaza en horizontal dentro de su caja, nunca
 * empuja la página.
 */
export function MercadoCobertura({
  celdas,
  paises,
}: {
  celdas: CeldaMercado[]
  paises: readonly (string | typeof GLOBAL)[]
}) {
  const t = useTranslations("admin.mercado")
  const tv = useTranslations("taxonomy.verticales")
  const f = useFormat()
  const nombrePais = useCountryName()

  const porClave = new Map(celdas.map((c) => [`${c.vertical}|${c.pais}`, c]))
  const verticales = VERTICALES.filter((v) =>
    paises.some((p) => {
      const celda = porClave.get(`${v}|${p}`)
      return celda && (celda.D > 0 || celda.O > 0)
    })
  )

  return (
    <div className="overflow-x-auto">
      <div
        className="grid min-w-3xl gap-1"
        style={{
          gridTemplateColumns: `10rem repeat(${paises.length}, minmax(6.5rem, 1fr))`,
        }}
      >
        <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
          {t("cobertura.vertical")}
        </div>
        {paises.map((p) => (
          <div
            key={p}
            className="flex items-center justify-center gap-1.5 px-2 py-1 text-xs font-medium text-muted-foreground"
          >
            {p === GLOBAL ? (
              t("cobertura.global")
            ) : (
              <>
                <CountryFlag code={p as never} className="h-3 w-[1rem]" />
                {p}
              </>
            )}
          </div>
        ))}

        {verticales.map((vertical: Vertical) => (
          <div key={vertical} className="contents">
            <div className="flex items-center px-2 text-sm font-medium">
              {tv(vertical)}
            </div>
            {paises.map((pais) => {
              const celda = porClave.get(`${vertical}|${pais}`)
              const estado = celda?.estado ?? "sin-datos"
              // Segunda línea: la cobertura, o por qué no está. Sin demanda no hay
              // cifra que enseñar y la línea no se pinta: repetir «Sin datos»
              // debajo de «Sin datos» no añade nada.
              const cobertura = celda?.oculta
                ? t("cobertura.oculta")
                : celda && celda.R !== null
                  ? f.number(celda.R)
                  : null
              return (
                <div
                  key={`${vertical}-${pais}`}
                  className={cn("grid gap-0.5 rounded-lg px-2 py-2", TONO[estado])}
                  title={
                    pais === GLOBAL
                      ? t("cobertura.global")
                      : `${tv(vertical)} · ${nombrePais(pais as never)}`
                  }
                >
                  <span className="text-xs font-bold">{t(`estados.${estado}`)}</span>
                  {cobertura && (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {cobertura}
                    </span>
                  )}
                  {celda?.D ? (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {f.money(celda.D)}
                    </span>
                  ) : null}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
