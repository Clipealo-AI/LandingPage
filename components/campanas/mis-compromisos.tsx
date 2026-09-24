"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs"
import { AlarmClock, ArrowRight, Flag, LogOut, Upload } from "lucide-react"

import { Link, hrefDinamico } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { toast } from "@/lib/toast"
import { HOY_CAMPANAS, type Campana, type Envio } from "@/lib/campanas"
import {
  diasHasta,
  disputasPosibles,
  estadoParticipacion,
  puedeEntregar,
  type EstadoParticipacion,
  type MotivoDisputa,
  type Participacion,
} from "@/lib/participacion"
import { useCampanas } from "@/hooks/use-campanas"
import { useFormat } from "@/hooks/use-format"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DisputaDialog } from "@/components/campanas/disputa-dialog"

const VISTAS = ["activos", "historial"] as const

/** Compromisos con algo vivo: o esperas respuesta, o tienes trabajo por delante. */
const VIVOS: readonly EstadoParticipacion[] = [
  "solicitada",
  "aceptada",
  "entregada",
  "en-disputa",
]

/** Lo primero es lo que depende de ti; lo último, lo que ya no. */
const RANGO: Record<EstadoParticipacion, number> = {
  aceptada: 0,
  "en-disputa": 1,
  entregada: 2,
  solicitada: 3,
  caducada: 4,
  rechazada: 5,
  cumplida: 6,
  retirada: 7,
}

const TONO: Record<EstadoParticipacion, React.ComponentProps<typeof Badge>["variant"]> = {
  solicitada: "secondary",
  aceptada: "success",
  entregada: "warning",
  cumplida: "success",
  rechazada: "outline",
  retirada: "outline",
  caducada: "destructive",
  "en-disputa": "warning",
}

interface Fila {
  participacion: Participacion
  estado: EstadoParticipacion
  campana: Campana
  /** El clip entregado, si ya lo hay. */
  envio: Envio | null
  /** Días hasta el fin del plazo; negativo si ya pasó, `null` sin plazo. */
  dias: number | null
  motivos: MotivoDisputa[]
  puedeSubir: boolean
}

/**
 * «Mis compromisos» (§5.2 de docs/campanas-ciclo-2026-09.md): la cara del
 * clipero de la participación.
 *
 * Lo que ha solicitado y lo que tiene aceptado, cada uno con su cuenta atrás,
 * el acceso a entregar, «Retirarme» mientras esté a tiempo (libera la plaza sin
 * penalización) y «Reclamar» cuando la otra parte no contesta. Qué se puede
 * reclamar y por qué motivo lo decide el dominio (`disputasPosibles`), nunca
 * esta vista.
 *
 * El «ahora» es `HOY_CAMPANAS` y no el reloj del navegador: los días que quedan
 * se derivan al pintar y tienen que salir iguales en el servidor y en el
 * cliente. `Date.now()` solo dentro de las acciones (lo pone `use-campanas`).
 */
export function MisCompromisos() {
  const t = useTranslations("compromisos")
  const f = useFormat()
  const { campanas, envios, participaciones, cuenta, retirarse } = useCampanas()
  // Su propio estado en la URL, como el resto de la página
  const [vista, setVista] = useQueryState(
    "compromisos",
    parseAsStringLiteral(VISTAS).withDefault("activos")
  )
  /**
   * `?vista` es de `CampaignsExplorer`, que es quien pinta las pestañas. Hasta
   * que «Mis compromisos» sea una pestaña más (ese archivo no es de este
   * cambio), vive dentro de «Participando»: es donde el clipero mira lo suyo.
   */
  const [pestana] = useQueryState("vista", parseAsString.withDefault("explorar"))
  const [reclamando, setReclamando] = React.useState<string | null>(null)

  if (pestana !== "participando") return null

  const filas: Fila[] = participaciones
    .filter((p) => p.userId === cuenta.userId)
    .flatMap((participacion) => {
      const campana = campanas.find((c) => c.id === participacion.campanaId)
      if (!campana) return []
      const estado = estadoParticipacion(participacion, HOY_CAMPANAS)
      const envio = participacion.envioId
        ? (envios.find((e) => e.id === participacion.envioId) ?? null)
        : null
      return [
        {
          participacion,
          estado,
          campana,
          envio,
          dias: diasHasta(participacion.venceEn, HOY_CAMPANAS),
          motivos: disputasPosibles(participacion, envio, "clipero", HOY_CAMPANAS),
          puedeSubir:
            estado === "aceptada" && puedeEntregar(campana, participacion, HOY_CAMPANAS),
        },
      ]
    })

  const activos = filas
    .filter((x) => VIVOS.includes(x.estado))
    .sort(
      (a, b) =>
        RANGO[a.estado] - RANGO[b.estado] ||
        (a.dias ?? Number.MAX_SAFE_INTEGER) - (b.dias ?? Number.MAX_SAFE_INTEGER)
    )
  const historial = filas
    .filter((x) => !VIVOS.includes(x.estado))
    .sort((a, b) => cuando(b).localeCompare(cuando(a)))
  const reclamado = filas.find((x) => x.participacion.id === reclamando) ?? null

  const salir = ({ participacion, campana, estado }: Fila) => {
    retirarse(participacion)
    // Retirarse no es un logro ni un fallo: informa y no suena
    if (estado === "solicitada") {
      toast(t("retirar.cancelDone"), {
        description: t("retirar.cancelDoneDescription", { title: campana.titulo }),
      })
    } else {
      toast(t("retirar.done"), {
        description: t("retirar.doneDescription", { title: campana.titulo }),
      })
    }
  }

  const salida = (fila: Fila) => {
    const esSolicitud = fila.estado === "solicitada"
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost">
            <LogOut />
            {esSolicitud ? t("acciones.cancelar") : t("acciones.retirarme")}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {esSolicitud
                ? t("retirar.cancelTitle", { title: fila.campana.titulo })
                : t("retirar.title", { title: fila.campana.titulo })}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-pretty">
              {esSolicitud ? t("retirar.cancelDescription") : t("retirar.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("retirar.keep")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => salir(fila)}>
              {esSolicitud ? t("retirar.cancelConfirm") : t("retirar.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  const tarjeta = (fila: Fila) => {
    const { participacion: p, estado, campana, envio, dias, motivos, puedeSubir } = fila
    // En rojo solo el último día y lo ya vencido: la urgencia va escrita, no solo en color
    const urgente = dias !== null && dias <= 0
    const conPlazo = estado === "aceptada" || estado === "caducada"
    const destino = hrefDinamico("/campanas/[id]", { id: campana.id })
    return (
      <li
        key={p.id}
        className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-border @xl/compromisos:p-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="min-w-0 space-y-1.5">
            <Badge variant={TONO[estado]}>{t(`estado.${estado}`)}</Badge>
            <h3 className="text-base font-semibold tracking-tight">
              <Link href={destino} className="hover:underline">
                {campana.titulo}
              </Link>
            </h3>
            <p className="text-sm text-muted-foreground">
              {campana.marca} · {t("solicitado", { date: f.date(p.solicitadaEn) })}
            </p>
          </div>

          {conPlazo && (
            <div className="shrink-0 text-right">
              <p
                className={cn(
                  "flex items-center justify-end gap-1.5 text-sm font-semibold tabular-nums",
                  urgente && "text-destructive"
                )}
              >
                <AlarmClock className="size-4" aria-hidden />
                {dias === null
                  ? t("plazo.sin")
                  : dias > 0
                    ? t("plazo.quedan", { n: dias })
                    : dias === 0
                      ? t("plazo.ultimo")
                      : t("plazo.vencido", { n: -dias })}
              </p>
              {p.venceEn && (
                <p className="text-xs text-muted-foreground">
                  {t("plazo.hasta", { date: f.date(p.venceEn) })}
                </p>
              )}
            </div>
          )}
        </div>

        <p className="text-sm text-pretty">{t(`linea.${estado}`)}</p>
        {envio && (
          <p className="truncate text-xs text-muted-foreground">
            {t("clip", { title: envio.titulo })}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          {/* Entregar es la acción, pero nunca en naranja: hay una por compromiso */}
          {puedeSubir ? (
            <Button asChild>
              <Link href={destino}>
                <Upload data-icon="inline-start" /> {t("acciones.entregar")}
              </Link>
            </Button>
          ) : (
            <Button variant="outline" asChild>
              <Link href={destino}>
                {t("acciones.ver")} <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          )}
          {(estado === "aceptada" || estado === "solicitada") && salida(fila)}
          {motivos.length > 0 && (
            <Button variant="ghost" onClick={() => setReclamando(p.id)}>
              <Flag /> {t("acciones.reclamar")}
            </Button>
          )}
        </div>
      </li>
    )
  }

  const lista = (items: Fila[], cual: (typeof VISTAS)[number]) =>
    items.length === 0 ? (
      <Empty className="rounded-xl ring-1 ring-border">
        <EmptyHeader>
          <EmptyTitle>{t(`empty.${cual}.title`)}</EmptyTitle>
          <EmptyDescription>{t(`empty.${cual}.description`)}</EmptyDescription>
        </EmptyHeader>
        {cual === "activos" && (
          <Button variant="outline" asChild>
            <Link href={{ pathname: "/campanas", query: { vista: "explorar" } }}>
              {t("empty.activos.cta")}
            </Link>
          </Button>
        )}
      </Empty>
    ) : (
      // Tres por fila a partir de @7xl: con dos, a 2560 px cada tarjeta medía
      // 1.060 px para 450 px de contenido
      <ul className="grid gap-4 @4xl/compromisos:grid-cols-2 @7xl/compromisos:grid-cols-3">
        {items.map(tarjeta)}
      </ul>
    )

  return (
    <section
      aria-labelledby="mis-compromisos"
      className="@container/compromisos space-y-4"
    >
      <div className="space-y-1">
        <h2 id="mis-compromisos" className="text-lg font-bold tracking-tight">
          {t("title")}
        </h2>
        <p className="max-w-2xl text-sm text-balance text-muted-foreground">
          {t("description")}
        </p>
      </div>

      <Tabs
        value={vista}
        onValueChange={(v) => void setVista(v as (typeof VISTAS)[number])}
        className="gap-4"
      >
        <TabsList className="w-max">
          <TabsTrigger value="activos" className="gap-1.5 px-3.5">
            {t("tabs.activos")}
            <span className="tabular-nums opacity-60">{f.number(activos.length)}</span>
          </TabsTrigger>
          <TabsTrigger value="historial" className="gap-1.5 px-3.5">
            {t("tabs.historial")}
            <span className="tabular-nums opacity-60">{f.number(historial.length)}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activos">{lista(activos, "activos")}</TabsContent>
        <TabsContent value="historial">{lista(historial, "historial")}</TabsContent>
      </Tabs>

      <DisputaDialog
        participacion={reclamado?.participacion ?? null}
        envio={reclamado?.envio ?? null}
        abrePor="clipero"
        titulo={reclamado?.campana.titulo ?? ""}
        open={reclamado !== null}
        onOpenChange={(v) => !v && setReclamando(null)}
      />
    </section>
  )
}

/** Cuándo se cerró un compromiso; sin decisión, cuándo se pidió. */
const cuando = (fila: Fila) =>
  fila.participacion.decididaEn ?? fila.participacion.solicitadaEn
