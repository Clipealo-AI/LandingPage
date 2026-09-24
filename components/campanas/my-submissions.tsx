"use client"

import * as React from "react"
import { RefreshCw } from "lucide-react"
import { useTranslations } from "next-intl"

import { Link, hrefDinamico } from "@/i18n/navigation"
import { INDEXADO_EN, todasLasPublicaciones } from "@/lib/analytics"
import { leerVistas } from "@/lib/api/analiticas"
import {
  medible,
  origenEnvio,
  sinMedir,
  vistasCongeladas,
  type EstadoEnvio,
  type LimitePago,
} from "@/lib/campanas"
import { toast } from "@/lib/toast"
import { SOCIAL_NETWORKS } from "@/lib/social"
import { useAgenda } from "@/hooks/use-agenda"
import { useCampanas } from "@/hooks/use-campanas"
import { useFormat } from "@/hooks/use-format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SocialGlyph } from "@/components/brand/social"
import { StatCard } from "@/components/shared/stat-card"
import { InfoHint } from "@/components/campanas/campaign-bits"
import type { CampanaVista } from "@/components/campanas/campaigns-explorer"

const TONO_ENVIO: Record<EstadoEnvio, React.ComponentProps<typeof Badge>["variant"]> = {
  "en-revision": "warning",
  aprobado: "success",
  rechazado: "destructive",
}

/**
 * El instante de una lectura nueva. La demo tiene el reloj parado en
 * `INDEXADO_EN`, así que se pide «ahora», que siempre va por delante: si no,
 * actualizar no traería nada. Fuera del componente porque la hora solo se lee
 * en un manejador, nunca al pintar.
 */
const instanteDeLectura = () =>
  new Date(Math.max(Date.now(), Date.parse(INDEXADO_EN) + 3_600_000)).toISOString()

/** Reglas que merecen una nota bajo el pago (`campaigns.submissions.note`); el CPM, no. */
const CON_NOTA = ["tope", "minimo", "presupuesto"] as const
const tieneNota = (l: LimitePago): l is (typeof CON_NOTA)[number] =>
  (CON_NOTA as readonly LimitePago[]).includes(l)

/** Los clips que la cuenta ha enviado a campañas y lo que cobra cada uno. */
export function MySubmissions({ vistas }: { vistas: CampanaVista[] }) {
  const t = useTranslations("campaigns.submissions")
  const ts = useTranslations("campaigns.submission.status")
  const f = useFormat()
  const { envios, cuenta, anotarVistas } = useCampanas()
  const { entradas } = useAgenda()
  const [leyendo, setLeyendo] = React.useState(false)
  const propios = envios
    .filter((e) => e.userId === cuenta.userId)
    .sort((a, b) => b.enviadoEn.localeCompare(a.enviadoEn))
  const filas = propios.map((e) => {
    const v = vistas.find((x) => x.campana.id === e.campanaId)
    return { envio: e, vista: v, pago: v?.liquidacion.pagos.get(e.id) ?? null }
  })
  /**
   * Se releen las vistas de lo publicado desde Clipealo mientras su campaña
   * siga viva. Cuando deja de aceptar clips, la última lectura es la que
   * cuenta: si no, un refresco tardío movería el reparto de quien ya cobró
   * (`vistasCongeladas`, `lib/campanas.ts`).
   */
  const releibles = filas.filter(
    ({ envio, vista }) =>
      medible(envio) && vista !== undefined && !vistasCongeladas(vista.estado)
  )

  const releer = async () => {
    setLeyendo(true)
    const hasta = instanteDeLectura()
    const pubs = todasLasPublicaciones(entradas)
    for (const { envio } of releibles) {
      const vistas = await leerVistas(envio.publicacionId!, pubs, hasta)
      if (vistas !== undefined) anotarVistas(envio.id, vistas, hasta)
    }
    setLeyendo(false)
    toast.success(t("releidas", { n: releibles.length }))
  }

  const cobrado = filas.reduce((n, f) => n + (f.pago?.pago ?? 0), 0)
  const enRevision = filas.filter((f) => f.envio.estado === "en-revision").length
  const campanas = new Set(propios.map((e) => e.campanaId)).size

  if (propios.length === 0) {
    return (
      <Empty className="rounded-xl ring-1 ring-border">
        <EmptyHeader>
          <EmptyTitle>{t("empty.title")}</EmptyTitle>
          <EmptyDescription>{t("empty.description")}</EmptyDescription>
        </EmptyHeader>
        <Button variant="outline" asChild>
          <Link href="/campanas">{t("empty.cta")}</Link>
        </Button>
      </Empty>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 @3xl/campanas:grid-cols-3">
        <StatCard
          featured
          label={t("earned")}
          value={f.money(cobrado, { decimals: 2 })}
          hint={t("earnedHint")}
        />
        <StatCard
          label={t("inReview")}
          value={f.number(enRevision)}
          hint={t("inReviewHint", { n: enRevision })}
        />
        <StatCard
          label={t("campaigns")}
          value={f.number(campanas)}
          hint={t("campaignsHint")}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
          {releibles.length > 0 && (
            <CardAction>
              <Button variant="outline" size="sm" disabled={leyendo} onClick={releer}>
                {leyendo ? <Spinner /> : <RefreshCw />} {t("releer")}
              </Button>
            </CardAction>
          )}
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {/* La primera celda se queda fija al desplazar: a 390 px la
                    tabla mide 659 px y, al arrastrar para ver «Cobras», las
                    filas empezaban por «olo», «do», «os» */}
                <TableHead className="sticky left-0 z-20 bg-card">
                  {t("table.clip")}
                </TableHead>
                <TableHead className="max-md:hidden">{t("table.campaign")}</TableHead>
                <TableHead className="text-right">{t("table.views")}</TableHead>
                <TableHead>{t("table.status")}</TableHead>
                <TableHead className="text-right">{t("table.earns")}</TableHead>
                <TableHead className="max-md:hidden">{t("table.sent")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map(({ envio, vista, pago }) => (
                <TableRow key={envio.id}>
                  <TableCell className="sticky left-0 z-10 max-w-72 min-w-48 bg-card whitespace-normal">
                    <span className="flex items-start gap-2">
                      <SocialGlyph
                        network={envio.red}
                        tone="official"
                        className="mt-0.5 size-4"
                        aria-hidden
                      />
                      <span>
                        {/* Con el clip identificado, el título lleva a su ficha:
                            desde ahí se cambia el texto o se vuelve a publicar */}
                        {envio.clipId && envio.proyectoId ? (
                          <Link
                            href={hrefDinamico("/proyectos/[id]/clips/[clipId]", {
                              id: envio.proyectoId,
                              clipId: envio.clipId,
                            })}
                            className="font-medium hover:underline"
                          >
                            {envio.titulo}
                          </Link>
                        ) : (
                          <span className="font-medium">{envio.titulo}</span>
                        )}
                        <span className="block text-xs text-muted-foreground">
                          {SOCIAL_NETWORKS[envio.red].name} ·{" "}
                          {t(`origen.${origenEnvio(envio)}`)}
                        </span>
                        {/* En móvil la columna «Campaña» no cabe: su dato baja
                            aquí en vez de perderse */}
                        {vista && (
                          <Link
                            href={hrefDinamico("/campanas/[id]", {
                              id: vista.campana.id,
                            })}
                            className="block text-xs text-muted-foreground hover:underline md:hidden"
                          >
                            {vista.campana.titulo}
                          </Link>
                        )}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="min-w-44 whitespace-normal max-md:hidden">
                    {vista ? (
                      <Link
                        href={hrefDinamico("/campanas/[id]", { id: vista.campana.id })}
                        className="hover:underline"
                      >
                        {vista.campana.titulo}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  {/* Tres casos distintos, no dos: medida, pendiente de su
                      primera lectura, y un enlace ajeno que nadie lee */}
                  <TableCell
                    className="text-right tabular-nums"
                    title={
                      !sinMedir(envio)
                        ? f.number(envio.vistas!)
                        : medible(envio)
                          ? t("pendienteLectura")
                          : t("sinMedir")
                    }
                  >
                    {sinMedir(envio) ? "—" : f.compact(envio.vistas!)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={TONO_ENVIO[envio.estado]}>{ts(envio.estado)}</Badge>
                    {envio.motivoRechazo && (
                      <span className="mt-1 block max-w-56 text-xs whitespace-normal text-muted-foreground">
                        {envio.motivoRechazo}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {pago ? (
                      <>
                        <span className="font-semibold">
                          {f.money(pago.pago, { decimals: 2 })}
                        </span>
                        {/* Con su (i): «Aprobado · US$ 0,00 · Último presupuesto»
                            era el único estado de la tabla sin explicación */}
                        {tieneNota(pago.limitadoPor) && (
                          <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                            {t(`note.${pago.limitadoPor}`)}
                            <InfoHint label={t(`note.${pago.limitadoPor}`)}>
                              {t(`noteHint.${pago.limitadoPor}`)}
                            </InfoHint>
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground max-md:hidden">
                    {f.date(envio.enviadoEn)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
