import { Suspense } from "react"
import { IntlExtra } from "@/i18n/zone"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { getFormat } from "@/lib/format"
import { getAdminMercado, getAdminMonth, getAdminMonths } from "@/lib/api/admin"
import { getAdminDataset } from "@/lib/api/admin"
import { CREADORES } from "@/lib/creadores"
import { GLOBAL } from "@/lib/mercado"
import { COUNTRY_CODES } from "@/lib/countries"
import type { Vertical } from "@/lib/taxonomia"
import { AdminPage, AdminSection } from "@/components/admin/admin-page"
import { KpiCard, KpiGrid } from "@/components/admin/kpi-card"
import { MercadoCobertura } from "@/components/admin/mercado-cobertura"
import { CountryFlag } from "@/components/shared/country-flag"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { idiomaDe } from "@/i18n/server"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/mercado">): Promise<Metadata> {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "admin.mercado" })
  return { title: t("title") }
}

/** Cuántas filas se enseñan en las listas de trabajo. */
const FILAS = 12

/**
 * Mercado: la oferta de cliperos frente al dinero activo, celda a celda
 * (§7 de docs/onboarding-2026-09.md). Responde a cuatro preguntas del negocio:
 * qué nichos y países captar, a qué sectores vender, qué CPM recomendar y a qué
 * creadores llamar.
 *
 * Todas las definiciones están en `lib/mercado.ts` y se cruzan con los usuarios
 * en `lib/admin/metrics.ts`; aquí solo se pintan. Los datos son simulados con
 * semilla propia hasta conectar la API, y la página lo dice.
 */
export default async function AdminMercadoPage({
  params,
}: PageProps<"/[locale]/admin/mercado">) {
  const locale = await idiomaDe(params)
  // `snap` solo se usa para el día de corte: la página siempre pinta el mes en
  // curso, así que la cabecera tiene que decir «hasta hoy», igual que el Panel.
  const [t, tAdmin, tt, mercado, { months, current }, data, snap] = await Promise.all([
    getTranslations({ locale, namespace: "admin.mercado" }),
    getTranslations({ locale, namespace: "admin" }),
    getTranslations({ locale, namespace: "taxonomy" }),
    getAdminMercado(),
    getAdminMonths(),
    getAdminDataset(),
    getAdminMonth(),
  ])
  const f = getFormat(locale)

  // Sobre cuántos se cuentan las tarjetas de «Calidad del dato»: sin la base,
  // «105» no dice si es mucho o poco.
  const base = t("calidad.base", { n: mercado.calidad.cliperos })
  const baseInferidos = t("calidad.baseInferidos", { n: mercado.calidad.inferidos })

  const paises = [...COUNTRY_CODES, GLOBAL]
  const nombreCreador = new Map(CREADORES.map((c) => [c.id, c.nombre]))
  const celdaTexto = (vertical: Vertical, pais: string | typeof GLOBAL) =>
    `${tt(`verticales.${vertical}`)} · ${pais === GLOBAL ? t("cobertura.global") : pais}`

  return (
    <IntlExtra ns={["admin.mercado"]}>
      {/* El selector de mes lee la URL con nuqs: sin este Suspense la ruta no prerenderiza */}
      <Suspense>
        <AdminPage
          crumbs={[{ label: tAdmin("nav.items.mercado") }]}
          title={t("title")}
          description={t("description")}
          months={months}
          current={current}
          updatedAt={data.updatedAt}
          timeZone={data.timeZone}
          mtd={snap.mtd}
        >
          <p className="text-sm text-muted-foreground">{t("simulado")}</p>

          <KpiGrid>
            <KpiCard
              label={t("kpis.cliperos")}
              value={f.number(mercado.cliperos)}
              footnote={t("kpis.cliperosHint")}
            />
            <KpiCard
              label={t("kpis.enRiesgo")}
              value={f.money(mercado.enRiesgo)}
              footnote={t("kpis.enRiesgoHint")}
              tone={mercado.enRiesgo > 0 ? "aviso" : undefined}
            />
            <KpiCard
              label={t("kpis.huecos")}
              value={f.number(mercado.huecos.length)}
              footnote={t("kpis.huecosHint")}
            />
            <KpiCard
              label={t("kpis.excedentes")}
              value={f.number(mercado.excedentes.length)}
              footnote={t("kpis.excedentesHint")}
            />
          </KpiGrid>

          <AdminSection
            id="cobertura"
            title={t("cobertura.title")}
            description={t("cobertura.description")}
          >
            <MercadoCobertura celdas={mercado.celdas} paises={paises} />
          </AdminSection>

          <AdminSection
            id="huecos"
            title={t("huecos.title")}
            description={t("huecos.description")}
          >
            {mercado.huecos.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("huecos.empty")}</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("huecos.columns.celda")}</TableHead>
                      <TableHead>{t("huecos.columns.estado")}</TableHead>
                      <TableHead className="text-right">
                        {t("huecos.columns.demanda")}
                      </TableHead>
                      <TableHead className="text-right">
                        {t("huecos.columns.oferta")}
                      </TableHead>
                      <TableHead className="text-right">
                        {t("huecos.columns.cobertura")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mercado.huecos.slice(0, FILAS).map((c) => (
                      <TableRow key={c.clave}>
                        <TableCell className="font-medium">
                          {celdaTexto(c.vertical, c.pais ?? GLOBAL)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              c.estado === "sin-oferta" ? "destructive" : "warning"
                            }
                          >
                            {t(`estados.${c.estado}`)}
                          </Badge>
                        </TableCell>
                        <TableCell className="tabular text-right">
                          {f.money(c.D)}
                        </TableCell>
                        <TableCell className="tabular text-right">
                          {c.oculta ? t("cobertura.oculta") : f.number(c.O)}
                        </TableCell>
                        {/* Con la oferta oculta la cobertura tampoco se enseña: con
                            R y el dinero activo se deduce la gente que hay detrás */}
                        <TableCell className="tabular text-right">
                          {c.oculta || c.R === null ? "—" : f.number(c.R)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </AdminSection>

          <AdminSection
            id="excedentes"
            title={t("excedentes.title")}
            description={t("excedentes.description")}
          >
            {mercado.excedentes.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("excedentes.empty")}</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("huecos.columns.celda")}</TableHead>
                      <TableHead className="text-right">
                        {t("huecos.columns.oferta")}
                      </TableHead>
                      <TableHead className="text-right">
                        {t("huecos.columns.demanda")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mercado.excedentes.slice(0, FILAS).map((c) => (
                      <TableRow key={c.clave}>
                        <TableCell className="font-medium">
                          {celdaTexto(c.vertical, c.pais ?? GLOBAL)}
                        </TableCell>
                        <TableCell className="tabular text-right">
                          {c.oculta ? t("cobertura.oculta") : f.number(c.O)}
                        </TableCell>
                        <TableCell className="tabular text-right">
                          {f.money(c.D)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </AdminSection>

          <AdminSection
            id="cpm"
            title={t("cpm.title")}
            description={t("cpm.description")}
          >
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("cpm.columns.sector")}</TableHead>
                    <TableHead className="text-right">{t("cpm.columns.p25")}</TableHead>
                    <TableHead className="text-right">{t("cpm.columns.p50")}</TableHead>
                    <TableHead className="text-right">{t("cpm.columns.p75")}</TableHead>
                    <TableHead>{t("cpm.columns.base")}</TableHead>
                    <TableHead className="text-right">{t("cpm.columns.n")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mercado.cpm.map(({ sector, cpm }) => (
                    <TableRow key={sector}>
                      <TableCell className="font-medium">
                        {tt(`sectores.${sector}`)}
                      </TableCell>
                      <TableCell className="tabular text-right">
                        {cpm.p25 === null ? "—" : f.money(cpm.p25, { decimals: 2 })}
                      </TableCell>
                      <TableCell className="tabular text-right">
                        {cpm.p50 === null ? "—" : f.money(cpm.p50, { decimals: 2 })}
                      </TableCell>
                      <TableCell className="tabular text-right">
                        {cpm.p75 === null ? "—" : f.money(cpm.p75, { decimals: 2 })}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {t(`cpm.base.${cpm.base}`)}
                      </TableCell>
                      <TableCell className="tabular text-right">{cpm.n || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </AdminSection>

          <AdminSection
            id="fandom"
            title={t("fandom.title")}
            description={t("fandom.description")}
          >
            {mercado.oportunidades.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("fandom.empty")}</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("fandom.columns.creador")}</TableHead>
                      <TableHead className="text-right">
                        {t("fandom.columns.fans")}
                      </TableHead>
                      <TableHead>{t("fandom.columns.pais")}</TableHead>
                      <TableHead className="text-right">
                        {t("fandom.columns.vistas")}
                      </TableHead>
                      <TableHead>{t("fandom.columns.usuario")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mercado.oportunidades.slice(0, FILAS).map((o) => (
                      <TableRow key={o.creadorId}>
                        <TableCell className="font-medium">
                          {nombreCreador.get(o.creadorId) ?? o.creadorId}
                        </TableCell>
                        <TableCell className="tabular text-right">
                          {f.number(o.fans)}
                        </TableCell>
                        <TableCell>
                          {o.paisPrincipal ? (
                            <span className="flex items-center gap-1.5">
                              <CountryFlag
                                code={o.paisPrincipal}
                                className="h-3 w-[1rem]"
                              />
                              {o.paisPrincipal}
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="tabular text-right">
                          {o.vistasMedianas === null ? "—" : f.compact(o.vistasMedianas)}
                        </TableCell>
                        <TableCell>{o.esUsuario ? t("fandom.esUsuario") : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </AdminSection>

          <AdminSection
            id="calidad"
            title={t("calidad.title")}
            description={t("calidad.description")}
          >
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(
                [
                  ["conectados", f.number(mercado.calidad.conectados), base],
                  ["inferidos", f.number(mercado.calidad.inferidos), base],
                  ["confianzaBaja", f.number(mercado.calidad.confianzaBaja), base],
                  ["opuestos", f.number(mercado.calidad.opuestos), base],
                  ["pendientes", f.number(mercado.calidad.creadoresPendientes), null],
                  [
                    "sinNormalizar",
                    f.number(mercado.calidad.comoLlegasteSinNormalizar),
                    null,
                  ],
                  [
                    "concordancia",
                    f.percent(mercado.calidad.concordanciaVertical),
                    baseInferidos,
                  ],
                ] as const
              ).map(([clave, valor, nota]) => (
                <div key={clave} className="rounded-xl border p-4">
                  <dt className="text-sm text-muted-foreground">
                    {t(`calidad.items.${clave}`)}
                  </dt>
                  <dd className="mt-1 text-xl font-bold tabular-nums">{valor}</dd>
                  {nota && (
                    <p className="mt-1 text-[11px] leading-snug text-muted-foreground/70">
                      {nota}
                    </p>
                  )}
                </div>
              ))}
            </dl>
          </AdminSection>
        </AdminPage>
      </Suspense>
    </IntlExtra>
  )
}
