import { getTranslations } from "next-intl/server"

import { getFormat } from "@/lib/format"
import type { Locale } from "@/i18n/routing"
import type { OnboardingResumen } from "@/lib/admin/metrics"
import { ESTADOS_ONBOARDING, esRender } from "@/lib/onboarding"
import { AdminSection } from "@/components/admin/admin-page"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

/** Umbrales de §7.2: a partir de aquí la toma se revisa. */
const SALTO_ALTO = 0.4
const ABANDONO_ALTO = 0.1

/**
 * Bloque «Bienvenida» del panel (§7.2): quién termina el onboarding, cuánto
 * tarda, qué toma se salta y dónde se cae. Es lo que dice si una pregunta
 * sobra: más del 40 % de saltos y pasa al perfilado progresivo; más del 10 %
 * de abandono y hay que rediseñar la toma.
 *
 * Los datos son simulados con semilla propia hasta conectar la API.
 */
export async function OnboardingPanel({
  locale,
  resumen,
}: {
  locale: Locale
  resumen: OnboardingResumen
}) {
  const t = await getTranslations({ locale, namespace: "admin.onboarding" })
  const tc = await getTranslations({ locale, namespace: "onboarding.chrome" })
  const f = getFormat(locale)
  const guion = "—"
  const segundos = (ms: number | null) =>
    ms === null ? guion : `${Math.round(ms / 1000)} s`

  return (
    <AdminSection id="onboarding" title={t("title")} description={t("description")}>
      {/* La frontera, dicha en pantalla como en Mercado: el onboarding de
          verdad vive en el navegador de cada persona, así que esto es una
          semilla y no una medición */}
      <p className="text-sm text-muted-foreground">{t("simulado")}</p>
      <div className="grid gap-4 @4xl/admin:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <dl className="grid min-w-0 gap-3 sm:grid-cols-2 @4xl/admin:grid-cols-1">
          {(
            [
              ["cuentas", f.number(resumen.cuentas), null],
              [
                "finalizacion",
                f.percent(resumen.tasaFinalizacion * 100),
                t("kpis.finalizacionHint"),
              ],
              ["tiempo", segundos(resumen.p50Ms), t("kpis.tiempoHint")],
              ["completitud", f.percent(resumen.completitudMedia), null],
            ] as const
          ).map(([clave, valor, nota]) => (
            <div key={clave} className="rounded-xl bg-card p-4 ring-1 ring-border">
              <dt className="text-sm text-muted-foreground">{t(`kpis.${clave}`)}</dt>
              <dd className="mt-1 text-xl font-bold tabular-nums">{valor}</dd>
              {nota && <p className="mt-1 text-xs text-muted-foreground">{nota}</p>}
            </div>
          ))}
        </dl>

        <div className="min-w-0 space-y-6">
          <div className="flex flex-wrap gap-2">
            {ESTADOS_ONBOARDING.map((estado) => (
              <span
                key={estado}
                className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground"
              >
                {t(`estados.${estado}`)}:{" "}
                <b className="tabular-nums">{f.number(resumen.estados[estado])}</b>
              </span>
            ))}
          </div>

          <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-border">
            <Table>
              <caption className="sr-only">{t("tomas.title")}</caption>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("tomas.columns.toma")}</TableHead>
                  <TableHead className="text-right">
                    {t("tomas.columns.vistos")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("tomas.columns.respondidos")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("tomas.columns.saltados")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("tomas.columns.abandono")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("tomas.columns.tiempo")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resumen.tomas.map((toma) => {
                  const salto = toma.vistos ? toma.saltados / toma.vistos : 0
                  const abandono = toma.vistos ? toma.abandono / toma.vistos : 0
                  // El final de cada flujo no pregunta nada: «0 respondidas» y
                  // «0 % saltadas» se leerían como una caída que no existe.
                  const sinPregunta = esRender(toma.paso)
                  return (
                    <TableRow key={toma.paso}>
                      <TableCell className="font-medium">
                        {tc(`pasos.${toma.paso}`)}
                      </TableCell>
                      <TableCell className="tabular text-right">
                        {f.number(toma.vistos)}
                      </TableCell>
                      <TableCell className="tabular text-right">
                        {sinPregunta ? guion : f.number(toma.respondidos)}
                      </TableCell>
                      <TableCell
                        className={
                          !sinPregunta && salto > SALTO_ALTO
                            ? "tabular text-right font-semibold text-warning"
                            : "tabular text-right"
                        }
                      >
                        {sinPregunta ? guion : f.percent(salto * 100)}
                      </TableCell>
                      <TableCell
                        className={
                          abandono > ABANDONO_ALTO
                            ? "tabular text-right font-semibold text-destructive"
                            : "tabular text-right"
                        }
                      >
                        {f.percent(abandono * 100)}
                      </TableCell>
                      <TableCell className="tabular text-right">
                        {segundos(toma.p50Ms)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          <p className="text-sm text-muted-foreground">{t("tomas.description")}</p>

          <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            {(
              [
                [
                  "consentimientos.estadisticas",
                  f.number(resumen.consentimientos.estadisticas),
                ],
                [
                  "consentimientos.informesSector",
                  f.number(resumen.consentimientos.informesSector),
                ],
                [
                  "consentimientos.novedades",
                  f.number(resumen.consentimientos.novedades),
                ],
                ["consentimientos.revocaron", f.number(resumen.revocaron30d)],
                ["aceleracion", f.percent(resumen.aceleracion * 100)],
                ["saltoIntro", f.percent(resumen.saltoIntro * 100)],
              ] as const
            ).map(([clave, valor]) => (
              <div key={clave} className="flex items-baseline gap-2">
                <dt className="text-muted-foreground">{t(clave)}</dt>
                <dd className="font-semibold tabular-nums">{valor}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </AdminSection>
  )
}
