"use client"

import * as React from "react"
import { Check, MoreHorizontal, Plus, X } from "lucide-react"
import { useTranslations } from "next-intl"

import { hrefDinamico, Link } from "@/i18n/navigation"
import { toast } from "@/lib/toast"
import { estadoVisible, liquidar, type Campana, type EstadoCampana } from "@/lib/campanas"
import { enmascarar } from "@/lib/wallet"
import { useCampanas } from "@/hooks/use-campanas"
import { useFormat } from "@/hooks/use-format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PageHeader } from "@/components/shared/page-header"
import { AdminSection } from "@/components/admin/admin-page"
import { KpiCard, KpiGrid } from "@/components/admin/kpi-card"
import { EstadoBadge } from "@/components/campanas/campaign-bits"
import { SolicitudAgencia } from "@/components/admin/solicitud-agencia"

/**
 * Campañas en el backoffice. Arriba lo que espera al equipo —solicitudes de
 * perfil de agencia y retiros por pagar—, con la acción al lado; debajo, todas
 * las campañas con su consumo y las acciones de moderación. Las campañas solo
 * las crean agencias y el admin: los usuarios son cliperos. Comparte estado con
 * la app (`hooks/use-campanas.ts`): lo que se decide aquí se ve allí sin recargar.
 */
export function CampanasAdmin() {
  const t = useTranslations("admin.campanas")
  const tTable = useTranslations("admin.table")
  const tCampaigns = useTranslations("campaigns")
  const f = useFormat()
  const {
    campanas,
    envios,
    retiros,
    solicitudAgencia,
    cambiarEstado,
    destacar,
    resolverRetiro,
  } = useCampanas()

  const filas = campanas
    .map((c) => {
      const l = liquidar(c, envios)
      return {
        campana: c,
        liquidacion: l,
        estado: estadoVisible(c, l),
        clips: envios.filter((e) => e.campanaId === c.id && e.estado !== "rechazado")
          .length,
      }
    })
    .sort((a, b) => b.campana.creadaEn.localeCompare(a.campana.creadaEn))

  const activas = filas.filter((f) => f.estado === "activa")
  const enJuego = activas.reduce((n, f) => n + f.liquidacion.restante, 0)
  const pagado = filas.reduce((n, f) => n + f.liquidacion.gastado, 0)
  const porPagar = retiros.filter((r) => r.estado === "solicitado")
  const importePorPagar = porPagar.reduce((n, r) => n + r.importe, 0)
  const pendientes = porPagar.length + (solicitudAgencia === "pendiente" ? 1 : 0)

  const mover = (c: Campana, estado: EstadoCampana, texto: string) => {
    cambiarEstado(c.id, estado)
    toast.success(texto, { description: c.titulo })
  }

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Button variant="brand" size="sm" asChild>
            <Link href="/campanas/nueva?como=admin">
              <Plus /> {t("create")}
            </Link>
          </Button>
        }
      />

      <KpiGrid>
        <KpiCard
          featured
          label={t("kpis.team")}
          value={f.number(pendientes)}
          tone={pendientes > 0 ? "aviso" : "ok"}
          lines={[
            t("kpis.withdrawals", {
              n: porPagar.length,
              monto: f.money(importePorPagar, { decimals: 2 }),
            }),
            solicitudAgencia === "pendiente"
              ? t("kpis.agencyRequest")
              : t("kpis.noAgencyRequests"),
          ]}
          footnote={t("kpis.teamFootnote")}
        />
        <KpiCard
          label={t("kpis.active")}
          value={f.number(activas.length)}
          lines={[
            t("kpis.activeMix", {
              privadas: filas.filter((f) => f.campana.privada).length,
              destacadas: filas.filter((f) => f.campana.destacada).length,
            }),
          ]}
        />
        <KpiCard
          label={t("kpis.budget")}
          value={f.money(enJuego)}
          lines={[t("kpis.budgetHint")]}
        />
        <KpiCard
          label={t("kpis.paid")}
          value={f.money(pagado)}
          lines={[
            t("kpis.approvedClips", {
              n: f.number(envios.filter((e) => e.estado === "aprobado").length),
            }),
          ]}
        />
      </KpiGrid>

      <div className="grid items-start gap-6 @5xl/admin:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <AdminSection
          id="agencias"
          title={t("agency.title")}
          description={t("agency.description")}
        >
          <SolicitudAgencia />
        </AdminSection>

        <AdminSection
          id="retiros"
          title={t("withdrawals.title")}
          description={t("withdrawals.description")}
        >
          {porPagar.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("withdrawals.none")}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("withdrawals.creator")}</TableHead>
                    <TableHead>{t("withdrawals.method")}</TableHead>
                    <TableHead className="text-right">
                      {t("withdrawals.amount")}
                    </TableHead>
                    <TableHead className="max-md:hidden">
                      {t("withdrawals.requested")}
                    </TableHead>
                    <TableHead>
                      <span className="sr-only">{tTable("actions")}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {porPagar.map((r) => {
                    const metodo = tCampaigns(`withdrawal.method.${r.metodo}.name`)
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.nombre}</TableCell>
                        <TableCell>
                          {metodo}
                          <span className="block text-xs text-muted-foreground">
                            {enmascarar(r.metodo, r.destino)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                          {f.money(r.importe, { decimals: 2 })}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground max-md:hidden">
                          {f.date(r.solicitadoEn)}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              resolverRetiro(r.id, "pagado")
                              toast.success(t("withdrawals.paid"), {
                                description: t("withdrawals.paidDescription", {
                                  monto: f.money(r.importe, { decimals: 2 }),
                                  nombre: r.nombre,
                                  metodo,
                                }),
                              })
                            }}
                          >
                            <Check /> {t("withdrawals.markPaid")}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            aria-label={t("withdrawals.rejectAria", { nombre: r.nombre })}
                            onClick={() => {
                              // El motivo lo escribe quien rechaza: se guarda en su idioma
                              resolverRetiro(
                                r.id,
                                "rechazado",
                                t("withdrawals.rejectReason")
                              )
                              toast(t("withdrawals.rejected"), {
                                description: t("withdrawals.rejectedDescription", {
                                  nombre: r.nombre,
                                }),
                                sound: "remove",
                              })
                            }}
                          >
                            <X />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </AdminSection>
      </div>

      <AdminSection id="todas" title={t("all.title")} description={t("all.description")}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("all.campaign")}</TableHead>
                <TableHead>{t("all.createdBy")}</TableHead>
                <TableHead>{t("all.status")}</TableHead>
                <TableHead className="text-right">{t("all.budget")}</TableHead>
                <TableHead className="w-40">{t("all.spent")}</TableHead>
                <TableHead className="text-right max-lg:hidden">
                  {t("all.cpmCap")}
                </TableHead>
                <TableHead className="text-right max-md:hidden">
                  {t("all.clips")}
                </TableHead>
                <TableHead className="max-xl:hidden">{t("all.ends")}</TableHead>
                <TableHead>
                  <span className="sr-only">{tTable("actions")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map(({ campana: c, liquidacion: l, estado, clips }) => (
                <TableRow key={c.id}>
                  <TableCell className="max-w-80 min-w-56 whitespace-normal">
                    <Link
                      href={hrefDinamico("/campanas/[id]", { id: c.id })}
                      className="font-medium hover:underline"
                    >
                      {c.titulo}
                    </Link>
                    <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      {c.marca} · {tCampaigns(`category.${c.categoria}`)}
                      {c.destacada && (
                        <Badge variant="brand-subtle">{t("all.featured")}</Badge>
                      )}
                      {c.privada && (
                        <Badge variant="secondary">
                          {t("all.private", { codigo: c.codigo ?? "" })}
                        </Badge>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {c.creadaPor.nombre}
                    <span className="block text-xs text-muted-foreground">
                      {tCampaigns(`profile.${c.creadaPor.perfil}`)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <EstadoBadge estado={estado} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {f.money(c.presupuesto)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={l.consumidoPct}
                        className="h-1.5"
                        aria-label={t("all.spentAria", {
                          pct: f.percent(l.consumidoPct, 0),
                        })}
                      />
                      <span className="w-9 text-right text-xs text-muted-foreground tabular-nums">
                        {f.percent(l.consumidoPct, 0)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap tabular-nums max-lg:hidden">
                    {f.money(c.cpm, { decimals: 2 })} · {f.percent(c.topePorVideoPct, 0)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums max-md:hidden">
                    {f.number(clips)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground max-xl:hidden">
                    {f.date(c.fin)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t("all.actionsFor", { titulo: c.titulo })}
                        >
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={hrefDinamico("/campanas/[id]", { id: c.id })}>
                            {t("all.view")}
                          </Link>
                        </DropdownMenuItem>
                        {!c.privada && (estado === "activa" || estado === "pausada") && (
                          <DropdownMenuItem
                            onSelect={() => {
                              destacar(c.id, !c.destacada)
                              toast.success(
                                c.destacada ? t("all.unfeatured") : t("all.featuredDone"),
                                { description: c.titulo }
                              )
                            }}
                          >
                            {c.destacada ? t("all.unfeature") : t("all.feature")}
                          </DropdownMenuItem>
                        )}
                        {estado === "activa" && (
                          <DropdownMenuItem
                            onSelect={() => mover(c, "pausada", t("all.paused"))}
                          >
                            {t("all.pause")}
                          </DropdownMenuItem>
                        )}
                        {estado === "pausada" && (
                          <DropdownMenuItem
                            onSelect={() => mover(c, "activa", t("all.resumed"))}
                          >
                            {t("all.resume")}
                          </DropdownMenuItem>
                        )}
                        {(estado === "activa" ||
                          estado === "pausada" ||
                          estado === "agotada") && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={() => mover(c, "finalizada", t("all.finished"))}
                            >
                              {t("all.finish")}
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </AdminSection>
    </>
  )
}
