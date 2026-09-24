"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Check, Copy, ExternalLink, Lock, Pause, Play, X } from "lucide-react"

import { Link } from "@/i18n/navigation"
import { toast } from "@/lib/toast"
import {
  HOY_CAMPANAS,
  estadoVisible,
  liquidar,
  sinMedir,
  topePorVideo,
  videosAlTope,
  vistasCompradas,
  vistasDe,
  vistasHastaTope,
  type Envio,
} from "@/lib/campanas"
import { SOCIAL_NETWORKS } from "@/lib/social"
import { useCampanas } from "@/hooks/use-campanas"
import { useFormat } from "@/hooks/use-format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SocialGlyph } from "@/components/brand/social"
import { PageHeader } from "@/components/shared/page-header"
import { AccessCodeDialog } from "@/components/campanas/access-code-dialog"
import { CampaignCover, EstadoBadge, InfoHint } from "@/components/campanas/campaign-bits"
import { cpmTexto } from "@/components/campanas/campaign-card"
import { PayoutCalculator } from "@/components/campanas/payout-calculator"
import { AccionCampana } from "@/components/campanas/solicitar-dialog"
import { CerrarCampana } from "@/components/campanas/cerrar-campana"
import { DerechosCard } from "@/components/campanas/derechos-card"
import { SolicitudesAgencia } from "@/components/campanas/solicitudes-agencia"
import { SubmitClipDialog } from "@/components/campanas/submit-clip-dialog"

/**
 * Una campaña: qué pide, cómo paga y cuánto queda. A la derecha, lo que decide
 * si merece la pena (presupuesto y reglas) y la acción; debajo, la calculadora
 * del juego y los clips que más cobran. Quien la creó la gestiona desde aquí:
 * revisa los clips que llegan, la pausa y comparte el código si es privada.
 */
export function CampaignDetail({ id }: { id: string }) {
  const t = useTranslations("campaigns.detail")
  const th = useTranslations("campaigns.help")
  const tc = useTranslations("campaigns.category")
  const f = useFormat()
  const {
    campanas,
    envios,
    participaciones,
    desbloqueadas,
    cuenta,
    cambiarEstado,
    revisarEnvio,
  } = useCampanas()
  const [subiendo, setSubiendo] = React.useState(false)
  const campana = campanas.find((c) => c.id === id)

  if (!campana) {
    return (
      <Empty className="rounded-xl ring-1 ring-border">
        <EmptyHeader>
          <EmptyTitle>{t("notFound.title")}</EmptyTitle>
          <EmptyDescription>{t("notFound.description")}</EmptyDescription>
        </EmptyHeader>
        <Button variant="outline" asChild>
          <Link href="/campanas">{t("notFound.back")}</Link>
        </Button>
      </Empty>
    )
  }

  const esDueno = campana.creadaPor.userId === cuenta.userId
  if (campana.privada && !esDueno && !desbloqueadas.includes(campana.id)) {
    return (
      <Empty className="rounded-xl ring-1 ring-border">
        <EmptyHeader>
          <Lock className="mx-auto size-6 text-muted-foreground" aria-hidden />
          <EmptyTitle>{t("private.title")}</EmptyTitle>
          <EmptyDescription>{t("private.description")}</EmptyDescription>
        </EmptyHeader>
        <AccessCodeDialog />
      </Empty>
    )
  }

  const liquidacion = liquidar(campana, envios)
  // El «ahora» de la demo, igual en el servidor y en el navegador
  const estado = estadoVisible(campana, liquidacion, HOY_CAMPANAS)
  const suyos = envios.filter((e) => e.campanaId === campana.id)
  const aprobados = suyos
    .filter((e) => e.estado === "aprobado")
    .map((e) => ({ envio: e, pago: liquidacion.pagos.get(e.id)! }))
    .sort((a, b) => b.pago.pago - a.pago.pago || vistasDe(b.envio) - vistasDe(a.envio))
  const porRevisar = suyos.filter((e) => e.estado === "en-revision")
  const creadores = new Set(suyos.map((e) => e.creador)).size
  const tope = topePorVideo(campana)

  const revisar = (e: Envio, aprobar: boolean) => {
    // El motivo es lo que escribe quien revisa: se guarda en su idioma, como contenido.
    // Y con la participación: sin ella, aprobar el clip no cerraba el compromiso y
    // «Finalizar campaña» seguía diciendo que faltaba un clip por revisar.
    revisarEnvio(
      e.id,
      aprobar ? "aprobado" : "rechazado",
      aprobar ? undefined : t("manage.rejectReason"),
      participaciones.find((p) => p.envioId === e.id)
    )
    if (aprobar)
      toast.success(t("manage.approved"), {
        description: t("manage.approvedDescription", { title: e.titulo }),
      })
    else toast(t("manage.rejected"), { description: e.titulo, sound: "remove" })
  }

  return (
    <>
      <PageHeader
        eyebrow={
          <span className="flex flex-wrap items-center gap-2 normal-case">
            <span>{tc(campana.categoria)}</span>
            <EstadoBadge estado={estado} />
          </span>
        }
        title={campana.titulo}
        description={
          campana.serie
            ? t("bylineSeries", {
                brand: campana.marca,
                series: campana.serie,
                author: campana.creadaPor.nombre,
              })
            : t("byline", { brand: campana.marca, author: campana.creadaPor.nombre })
        }
        actions={
          // Quien la creó no se solicita a sí mismo: lo suyo es decidir y cerrar
          esDueno ? null : (
            <AccionCampana
              campana={campana}
              estado={estado}
              variant="brand"
              size="lg"
              alinear="end"
              onEntregar={() => setSubiendo(true)}
            />
          )
        }
      />

      <div className="grid items-start gap-6 @5xl/campana:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)] @[110rem]/campana:grid-cols-[minmax(0,1fr)_30rem]">
        <div className="min-w-0 space-y-6">
          <Card className="overflow-hidden pt-0">
            <CampaignCover campana={campana} estado={estado} size="lg" />
            <CardContent className="space-y-5">
              <p className="text-pretty">{campana.descripcion}</p>
              {campana.requisitos.length > 0 && (
                <div className="space-y-2">
                  <h2 className="text-sm font-semibold">{t("requirements")}</h2>
                  <ul className="space-y-1.5 text-sm">
                    {campana.requisitos.map((r) => (
                      <li key={r} className="flex gap-2">
                        <Check
                          className="mt-0.5 size-4 shrink-0 text-success"
                          aria-hidden
                        />{" "}
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" asChild>
                  <a href={campana.material} target="_blank" rel="noreferrer">
                    {t("material")} <ExternalLink />
                  </a>
                </Button>
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  {t("onlyOn")}
                  {campana.redes.map((r) => (
                    <span
                      key={r}
                      className="inline-flex items-center gap-1 text-foreground"
                    >
                      <SocialGlyph
                        network={r}
                        tone="official"
                        className="size-4"
                        aria-hidden
                      />
                      {SOCIAL_NETWORKS[r].name}
                    </span>
                  ))}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Lo que la agencia concede: el clipero lo mira antes de entrar y
              lo tiene a mano en Operaciones › Derechos */}
          <DerechosCard campana={campana} esDueno={esDueno} />

          {/* Con quién trabaja: en la columna ancha y no en el carril de 570 px,
              donde el tablero de cinco cifras se apilaba en una sola columna y
              las fichas de los cliperos nunca llegaban a ponerse en paralelo */}
          {esDueno && <SolicitudesAgencia campana={campana} ahora={HOY_CAMPANAS} />}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("howMuch.title")}</CardTitle>
              <CardDescription>
                {t("howMuch.description", { pct: f.percent(campana.topePorVideoPct) })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PayoutCalculator reglas={campana} restante={liquidacion.restante} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("top.title")}</CardTitle>
              <CardDescription>
                {t("top.description", {
                  approved: aprobados.length,
                  creators: creadores,
                  views: f.compact(liquidacion.vistasPagadas),
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {aprobados.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("top.empty")}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>{t("top.creator")}</TableHead>
                      <TableHead className="max-sm:hidden">{t("top.network")}</TableHead>
                      <TableHead className="text-right">{t("top.views")}</TableHead>
                      <TableHead className="text-right">{t("top.earns")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aprobados.slice(0, 10).map(({ envio, pago }, i) => (
                      <TableRow key={envio.id}>
                        <TableCell className="text-muted-foreground tabular-nums">
                          {i + 1}
                        </TableCell>
                        <TableCell className="font-medium">
                          {envio.creador}
                          {envio.userId === cuenta.userId && (
                            <Badge variant="brand-subtle" className="ml-2">
                              {t("top.you")}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="max-sm:hidden">
                          <span className="inline-flex items-center gap-1.5">
                            <SocialGlyph
                              network={envio.red}
                              tone="official"
                              className="size-4"
                              aria-hidden
                            />
                            {SOCIAL_NETWORKS[envio.red].name}
                          </span>
                        </TableCell>
                        <TableCell
                          className="text-right tabular-nums"
                          title={
                            sinMedir(envio) ? t("sinMedir") : f.number(envio.vistas!)
                          }
                        >
                          {sinMedir(envio) ? "—" : f.compact(envio.vistas!)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          <span className="font-semibold">
                            {f.money(pago.pago, { decimals: 2 })}
                          </span>
                          {pago.limitadoPor === "tope" && (
                            <span className="block text-xs text-muted-foreground">
                              {t("top.atCap")}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6 @5xl/campana:sticky @5xl/campana:top-[calc(var(--spacing-topbar)+1.5rem)]">
          <Card>
            <CardHeader>
              <CardDescription>{t("budget")}</CardDescription>
              <CardTitle className="text-3xl">{f.money(campana.presupuesto)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Progress
                  value={liquidacion.consumidoPct}
                  aria-label={t("spentAria", {
                    pct: f.percent(Math.round(liquidacion.consumidoPct)),
                  })}
                />
                <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
                  <span className="flex items-center gap-1">
                    {t("spent", { pct: f.percent(Math.round(liquidacion.consumidoPct)) })}{" "}
                    <InfoHint label={t("spentHint")}>{th("spent")}</InfoHint>
                  </span>
                  <span>{t("left", { amount: f.money(liquidacion.restante) })}</span>
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <Dato etiqueta={t("paid")} valor={f.money(liquidacion.gastado)} />
                <Dato
                  etiqueta={t("clips")}
                  valor={f.number(suyos.filter((e) => e.estado !== "rechazado").length)}
                />
                <Dato etiqueta={t("starts")} valor={f.date(campana.inicio)} />
                <Dato etiqueta={t("ends")} valor={f.date(campana.fin)} />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("rules.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y text-sm">
                <Regla
                  etiqueta={t("rules.cpm")}
                  ayuda={th("cpm")}
                  valor={t("rules.cpmValue", { amount: cpmTexto(f, campana.cpm) })}
                />
                <Regla
                  etiqueta={t("rules.maxPerVideo")}
                  ayuda={th("cap")}
                  valor={`${f.money(tope)} · ${f.percent(campana.topePorVideoPct)}`}
                />
                <Regla
                  etiqueta={t("rules.minToEarn")}
                  ayuda={th("minViews")}
                  valor={t("rules.views", {
                    n: campana.minimoVistas,
                    views: f.grouped(campana.minimoVistas),
                  })}
                />
                <Regla
                  etiqueta={t("rules.capAt")}
                  valor={t("rules.views", {
                    n: vistasHastaTope(campana),
                    views: f.grouped(vistasHastaTope(campana)),
                  })}
                />
                <Regla
                  etiqueta={t("rules.videosAtCap")}
                  valor={t("rules.videosAtCapValue", {
                    n: f.number(videosAlTope(campana)),
                  })}
                />
                <Regla
                  etiqueta={t("rules.viewsBought")}
                  valor={f.compact(vistasCompradas(campana))}
                />
              </dl>
            </CardContent>
          </Card>

          {/* Cómo cierra. Va aquí, pegado a «Gestionar tu campaña», porque los
              dos hablan de lo mismo: lo que queda pendiente */}
          {esDueno && <CerrarCampana campana={campana} ahora={HOY_CAMPANAS} />}

          {esDueno && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("manage.title")}</CardTitle>
                <CardDescription>
                  {porRevisar.length === 0
                    ? t("manage.none")
                    : t("manage.pending", { n: porRevisar.length })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {campana.privada && campana.codigo && (
                  <div className="flex items-center justify-between gap-3 rounded-lg bg-muted p-3">
                    <span>
                      <span className="block text-xs text-muted-foreground">
                        {t("manage.accessCode")}
                      </span>
                      <span className="font-mono text-lg font-semibold tracking-[0.2em]">
                        {campana.codigo}
                      </span>
                    </span>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label={t("manage.copy")}
                      onClick={() => {
                        void navigator.clipboard?.writeText(campana.codigo!)
                        toast.success(t("manage.copied"), {
                          description: t("manage.copiedDescription"),
                        })
                      }}
                    >
                      <Copy />
                    </Button>
                  </div>
                )}

                {porRevisar.map((e) => (
                  <div key={e.id} className="space-y-2 rounded-lg p-3 ring-1 ring-border">
                    <p className="text-sm font-medium">{e.titulo}</p>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <SocialGlyph
                        network={e.red}
                        tone="official"
                        className="size-3.5"
                        aria-hidden
                      />
                      {t("manage.submissionMeta", {
                        creator: e.creador,
                        views: sinMedir(e) ? "—" : f.compact(e.vistas!),
                      })}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => revisar(e, true)}
                      >
                        <Check /> {t("manage.approve")}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => revisar(e, false)}>
                        <X /> {t("manage.reject")}
                      </Button>
                    </div>
                  </div>
                ))}

                {(estado === "activa" || estado === "pausada") && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      const pausar = estado === "activa"
                      cambiarEstado(campana.id, pausar ? "pausada" : "activa")
                      toast.success(pausar ? t("manage.paused") : t("manage.resumed"), {
                        description: pausar
                          ? t("manage.pausedDescription")
                          : t("manage.resumedDescription"),
                      })
                    }}
                  >
                    {estado === "activa" ? (
                      <>
                        <Pause /> {t("manage.pause")}
                      </>
                    ) : (
                      <>
                        <Play /> {t("manage.resume")}
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </aside>
      </div>

      <SubmitClipDialog campana={campana} open={subiendo} onOpenChange={setSubiendo} />
    </>
  )
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
      <dd className="font-semibold tabular-nums">{valor}</dd>
    </div>
  )
}

function Regla({
  etiqueta,
  ayuda,
  valor,
}: {
  etiqueta: string
  ayuda?: string
  valor: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
      <dt className="flex items-center gap-1 text-muted-foreground">
        {etiqueta}
        {ayuda && <InfoHint label={etiqueta.toLowerCase()}>{ayuda}</InfoHint>}
      </dt>
      <dd className="text-right font-semibold tabular-nums">{valor}</dd>
    </div>
  )
}
