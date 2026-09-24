"use client"

import * as React from "react"
import { ExternalLink, Gavel } from "lucide-react"
import { useTranslations } from "next-intl"

import { hrefDinamico, Link } from "@/i18n/navigation"
import { toast } from "@/lib/toast"
import { HOY_CAMPANAS, sinMedir, topePorVideo, type Campana } from "@/lib/campanas"
import {
  diasHasta,
  estadoParticipacion,
  laudosPosibles,
  PLAZO_ENTREGA_DIAS,
  type Disputa,
  type EstadoDisputa,
  type Laudo,
  type Participacion,
} from "@/lib/participacion"
import { useCampanas } from "@/hooks/use-campanas"
import { useFormat } from "@/hooks/use-format"
import { SocialGlyph } from "@/components/brand/social"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { AdminSection } from "@/components/admin/admin-page"
import { KpiCard, KpiGrid } from "@/components/admin/kpi-card"

type TonoBadge = React.ComponentProps<typeof Badge>["variant"]

/** Abierta pide decisión; resuelta ya la tiene. El texto lo dice igualmente. */
const TONO_DISPUTA: Record<EstadoDisputa, TonoBadge> = {
  abierta: "warning",
  "en-revision": "secondary",
  resuelta: "success",
}

/** Cómo terminó: se cobra, se cierra sin pago o se da otra oportunidad. */
const TONO_LAUDO: Record<Laudo, TonoBadge> = {
  "liberar-plaza": "outline",
  "dar-prorroga": "secondary",
  "pagar-clipero": "success",
  "sin-pago": "destructive",
}

/** Los hitos del expediente, en el orden en que ocurren. */
type ClaveFecha = "requested" | "decided" | "dueDate" | "delivered" | "openedAt"

interface Fila {
  disputa: Disputa
  /** El compromiso sobre el que se reclama; sin él no hay nada que arbitrar. */
  participacion: Participacion | null
  campana: Campana | null
  /** Días abierta según el «hoy» de la demo; nunca negativa. */
  dias: number
  /** El tope por video de la campaña: lo que está en juego en este clip. */
  enJuego: number
}

/** Lo del servidor más lo del cliente; el cliente manda (es donde se resuelve). */
function unir<T extends { id: string }>(servidor: readonly T[], cliente: readonly T[]) {
  const vistos = new Set(cliente.map((x) => x.id))
  return [...servidor.filter((x) => !vistos.has(x.id)), ...cliente]
}

/**
 * El árbitro: la cola de disputas del admin (docs/campanas-ciclo-2026-09.md).
 *
 * Una campaña no puede cerrarse dejando trabajo pendiente: cuando el clipero y
 * quien paga no se ponen de acuerdo, alguien tiene que decidir, y ese alguien
 * es el admin. Cada fila es un compromiso parado —con su antigüedad, las dos
 * partes, la campaña, el tope por video que está en juego y el motivo— y al
 * abrirla están las dos versiones, las fechas y los cuatro laudos de
 * `lib/participacion.ts`.
 *
 * Frontera de datos: aquí solo aparece lo que hace falta para arbitrar. El
 * wallet del clipero, sus otras campañas y sus datos de cobro no se enseñan.
 *
 * Comparte estado con la app (`hooks/use-campanas.ts`): el laudo que se dicta
 * aquí desbloquea la participación en /campanas sin recargar.
 */
export function DisputasAdmin({
  iniciales,
}: {
  iniciales: {
    disputas: readonly Disputa[]
    participaciones: readonly Participacion[]
  }
}) {
  const t = useTranslations("admin.disputas")
  const tTable = useTranslations("admin.table")
  const f = useFormat()
  const { campanas, participaciones, disputas } = useCampanas()
  const [abierta, setAbierta] = React.useState<string | null>(null)

  const todas = unir(iniciales.disputas, disputas)
  const compromisos = unir(iniciales.participaciones, participaciones)

  const filas: Fila[] = todas.map((d) => {
    const campana = campanas.find((c) => c.id === d.campanaId) ?? null
    return {
      disputa: d,
      participacion: compromisos.find((p) => p.id === d.participacionId) ?? null,
      campana,
      // Lo que se abre en la demo lleva la hora real, posterior al «hoy» de las
      // campañas: sin el tope, una disputa recién abierta saldría con días en negativo
      dias: Math.max(0, -(diasHasta(d.abiertaEn, HOY_CAMPANAS) ?? 0)),
      enJuego: campana ? topePorVideo(campana) : 0,
    }
  })

  const pendientes = filas
    .filter((x) => x.disputa.estado !== "resuelta")
    .sort((a, b) => a.disputa.abiertaEn.localeCompare(b.disputa.abiertaEn))
  const resueltas = filas
    .filter((x) => x.disputa.estado === "resuelta")
    .sort((a, b) =>
      (b.disputa.resueltaEn ?? "").localeCompare(a.disputa.resueltaEn ?? "")
    )

  const enJuego = pendientes.reduce((n, x) => n + x.enJuego, 0)
  const delClipero = pendientes.filter((x) => x.disputa.abrePor === "clipero").length
  const espera = pendientes.length ? pendientes[0].dias : 0
  const pagadas = resueltas.filter((x) => x.disputa.laudo === "pagar-clipero").length

  const elegida = pendientes.find((x) => x.disputa.id === abierta) ?? null

  return (
    <>
      {/* El título y la descripción los pone `AdminPage`, como en el resto del
          backoffice: repetirlos aquí los sacaba dos veces */}
      <KpiGrid>
        <KpiCard
          featured
          label={t("kpis.open")}
          value={f.number(pendientes.length)}
          tone={pendientes.length > 0 ? "aviso" : "ok"}
          lines={[
            t("kpis.openBy", {
              cliperos: delClipero,
              agencias: pendientes.length - delClipero,
            }),
          ]}
          footnote={t("kpis.openHint")}
        />
        <KpiCard
          label={t("kpis.money")}
          value={f.money(enJuego)}
          footnote={t("kpis.moneyHint")}
        />
        <KpiCard
          label={t("kpis.oldest")}
          value={pendientes.length ? t("kpis.days", { n: espera }) : "—"}
          footnote={t("kpis.oldestHint")}
        />
        <KpiCard
          label={t("kpis.resolved")}
          value={f.number(resueltas.length)}
          lines={[t("kpis.resolvedPaid", { n: pagadas })]}
          footnote={t("kpis.resolvedHint")}
        />
      </KpiGrid>

      <AdminSection
        id="cola"
        title={t("queue.title")}
        description={t("queue.description")}
      >
        {pendientes.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("queue.empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("queue.age")}</TableHead>
                  <TableHead>{t("queue.parties")}</TableHead>
                  <TableHead>{t("queue.campaign")}</TableHead>
                  <TableHead className="text-right">{t("queue.money")}</TableHead>
                  <TableHead>{t("queue.reason")}</TableHead>
                  <TableHead className="max-md:hidden">{t("queue.status")}</TableHead>
                  <TableHead>
                    <span className="sr-only">{tTable("actions")}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendientes.map((fila) => (
                  <TableRow key={fila.disputa.id}>
                    <TableCell className="whitespace-nowrap">
                      <span className="font-medium">
                        {t("queue.ago", { n: fila.dias })}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {f.date(fila.disputa.abiertaEn)}
                      </span>
                    </TableCell>
                    <TableCell className="min-w-44 whitespace-normal">
                      <Partes fila={fila} />
                    </TableCell>
                    <TableCell className="max-w-72 min-w-48 whitespace-normal">
                      <Campania fila={fila} />
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap tabular-nums">
                      {fila.campana ? f.money(fila.enJuego) : "—"}
                    </TableCell>
                    <TableCell className="min-w-40 whitespace-normal">
                      <Badge variant="outline">
                        {t(`reason.${fila.disputa.motivo}.label`)}
                      </Badge>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {t("queue.claims", { parte: fila.disputa.abrePor })}
                      </span>
                    </TableCell>
                    <TableCell className="max-md:hidden">
                      <Badge variant={TONO_DISPUTA[fila.disputa.estado]}>
                        {t(`status.${fila.disputa.estado}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!fila.participacion || !fila.campana}
                        aria-label={t("queue.arbitrateAria", {
                          clipero: fila.participacion?.clipero ?? fila.disputa.id,
                        })}
                        onClick={() => setAbierta(fila.disputa.id)}
                      >
                        <Gavel /> {t("queue.arbitrate")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </AdminSection>

      <AdminSection
        id="resueltas"
        title={t("history.title")}
        description={t("history.description")}
      >
        {resueltas.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("history.empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("history.resolved")}</TableHead>
                  <TableHead>{t("queue.parties")}</TableHead>
                  <TableHead>{t("queue.campaign")}</TableHead>
                  <TableHead>{t("history.award")}</TableHead>
                  <TableHead>{t("history.note")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resueltas.map((fila) => (
                  <TableRow key={fila.disputa.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {fila.disputa.resueltaEn ? f.date(fila.disputa.resueltaEn) : "—"}
                    </TableCell>
                    <TableCell className="min-w-44 whitespace-normal">
                      <Partes fila={fila} />
                    </TableCell>
                    <TableCell className="max-w-72 min-w-48 whitespace-normal">
                      <Campania fila={fila} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {fila.disputa.laudo ? (
                        <Badge variant={TONO_LAUDO[fila.disputa.laudo]}>
                          {t(`award.${fila.disputa.laudo}.label`)}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="max-w-96 min-w-56 whitespace-normal text-muted-foreground">
                      {fila.disputa.notaAdmin || t("history.noNote")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </AdminSection>

      <Dialog open={elegida !== null} onOpenChange={(v) => !v && setAbierta(null)}>
        <DialogContent className="@container/disputa max-h-[90svh] gap-3 overflow-y-auto sm:max-w-2xl">
          {elegida?.participacion && elegida.campana && (
            <Arbitraje
              key={elegida.disputa.id}
              disputa={elegida.disputa}
              participacion={elegida.participacion}
              campana={elegida.campana}
              enJuego={elegida.enJuego}
              onDone={() => setAbierta(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

/** Las dos partes de una fila: quién clipea y quién paga. */
function Partes({ fila }: { fila: Fila }) {
  const t = useTranslations("admin.disputas")
  return (
    <>
      <span className="font-medium">{fila.participacion?.clipero ?? "—"}</span>
      <span className="block text-xs text-muted-foreground">
        {t("queue.versus", { agencia: fila.campana?.creadaPor.nombre ?? "—" })}
      </span>
    </>
  )
}

/** La campaña de una fila, con su marca debajo. */
function Campania({ fila }: { fila: Fila }) {
  const t = useTranslations("admin.disputas")
  if (!fila.campana) {
    return <span className="text-sm text-muted-foreground">{t("queue.missing")}</span>
  }
  return (
    <>
      <Link
        href={hrefDinamico("/campanas/[id]", { id: fila.campana.id })}
        className="font-medium hover:underline"
      >
        {fila.campana.titulo}
      </Link>
      <span className="block text-xs text-muted-foreground">{fila.campana.marca}</span>
    </>
  )
}

/**
 * El expediente y el laudo. Las dos versiones son lo que cada parte escribió:
 * quien reclama tiene su detalle y la otra, la nota con la que pidió la plaza.
 * Lo que nadie escribió se dice, no se rellena.
 */
function Arbitraje({
  disputa,
  participacion,
  campana,
  enJuego,
  onDone,
}: {
  disputa: Disputa
  participacion: Participacion
  campana: Campana
  enJuego: number
  onDone: () => void
}) {
  const t = useTranslations("admin.disputas")
  const f = useFormat()
  const { envios, resolverDisputa } = useCampanas()
  const [laudo, setLaudo] = React.useState<Laudo | null>(null)
  const [dias, setDias] = React.useState(String(PLAZO_ENTREGA_DIAS))
  const [nota, setNota] = React.useState("")
  const [intento, setIntento] = React.useState(false)

  const envio = envios.find((e) => e.id === participacion.envioId)
  const estado = estadoParticipacion(participacion, HOY_CAMPANAS)
  const faltaNota = nota.trim().length === 0

  // El expediente en orden. Lo que todavía no ha pasado no se pinta: una fila
  // «Clip entregado — —» diría que hubo entrega
  const fechas: [ClaveFecha, string | undefined][] = [
    ["requested", participacion.solicitadaEn],
    ["decided", participacion.decididaEn],
    ["dueDate", participacion.venceEn],
    ["delivered", envio?.enviadoEn],
    ["openedAt", disputa.abiertaEn],
  ]

  const enviar = (e: React.FormEvent) => {
    e.preventDefault()
    setIntento(true)
    if (!laudo || faltaNota) return
    resolverDisputa(disputa, participacion, laudo, {
      notaAdmin: nota.trim(),
      prorrogaDias:
        laudo === "dar-prorroga" ? Number(dias) || PLAZO_ENTREGA_DIAS : undefined,
    })
    toast.success(t("done.title"), {
      description: t("done.description", {
        campana: campana.titulo,
        laudo: t(`award.${laudo}.label`),
      }),
    })
    onDone()
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{t("detail.title", { campana: campana.titulo })}</DialogTitle>
        <DialogDescription>
          {t("detail.opened", {
            fecha: f.date(disputa.abiertaEn),
            motivo: t(`reason.${disputa.motivo}.label`),
          })}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-1 rounded-lg bg-muted/50 p-3">
        <p>{t(`reason.${disputa.motivo}.description`)}</p>
        <p className="text-muted-foreground tabular-nums">
          {t("detail.money", { monto: f.money(enJuego) })}
        </p>
        <p className="text-muted-foreground">
          {t("commitment.line", { estado: t(`commitment.estado.${estado}`) })}
        </p>
      </div>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">{t("detail.versions")}</h3>
        <div className="grid gap-2 @lg/disputa:grid-cols-2">
          <Version
            parte="clipero"
            nombre={participacion.clipero}
            reclama={disputa.abrePor === "clipero"}
            detalle={disputa.abrePor === "clipero" ? (disputa.detalle ?? "") : undefined}
            nota={participacion.nota}
          />
          <Version
            parte="agencia"
            nombre={campana.creadaPor.nombre}
            reclama={disputa.abrePor === "agencia"}
            detalle={disputa.abrePor === "agencia" ? (disputa.detalle ?? "") : undefined}
          />
        </div>
      </section>

      {/* El laudo se dicta sobre este clip: el expediente ya lo tenía cargado
          y solo enseñaba su fecha, así que se decidía sin verlo */}
      {envio && (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold">{t("detail.clip")}</h3>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg bg-muted/50 p-3">
            <SocialGlyph network={envio.red} className="size-4 shrink-0" aria-hidden />
            <p className="min-w-0 flex-1 font-medium">{envio.titulo}</p>
            <p className="text-muted-foreground tabular-nums">
              {t("detail.clipViews", {
                vistas: sinMedir(envio) ? "—" : f.number(envio.vistas!),
              })}
            </p>
            <Button variant="outline" size="sm" asChild>
              <a href={envio.url} target="_blank" rel="noopener noreferrer">
                {t("detail.clipOpen")} <ExternalLink />
              </a>
            </Button>
          </div>
        </section>
      )}

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">{t("detail.timeline")}</h3>
        <dl className="grid gap-x-6 gap-y-1 @lg/disputa:grid-cols-2">
          {fechas
            .filter((x): x is [ClaveFecha, string] => x[1] !== undefined)
            .map(([clave, fecha]) => (
              <div key={clave} className="flex justify-between gap-3 border-b py-1">
                <dt className="text-muted-foreground">{t(`detail.${clave}`)}</dt>
                <dd className="whitespace-nowrap tabular-nums">{f.date(fecha)}</dd>
              </div>
            ))}
        </dl>
      </section>

      <FieldSet>
        <FieldLegend variant="label">{t("form.award")}</FieldLegend>
        <FieldDescription>{t("form.awardHint")}</FieldDescription>
        <RadioGroup
          value={laudo ?? ""}
          onValueChange={(v) => setLaudo(v as Laudo)}
          className="grid gap-2 @lg/disputa:grid-cols-2"
        >
          {/* «Pagar al clipero» solo si hay clip: el dinero lo reparte
              `liquidar` entre los envíos aprobados, y sin envío ese laudo
              prometía una liquidación que no podía ocurrir */}
          {laudosPosibles(participacion).map((id) => (
            <FieldLabel key={id} htmlFor={`laudo-${id}`}>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>{t(`award.${id}.label`)}</FieldTitle>
                  <FieldDescription>{t(`award.${id}.description`)}</FieldDescription>
                </FieldContent>
                <RadioGroupItem value={id} id={`laudo-${id}`} />
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>
      </FieldSet>

      {laudo === "dar-prorroga" && (
        <Field>
          <FieldLabel htmlFor="prorroga">{t("form.days")}</FieldLabel>
          <Input
            id="prorroga"
            type="number"
            inputMode="numeric"
            min={1}
            max={30}
            value={dias}
            onChange={(e) => setDias(e.target.value)}
            // `max-w-24` y no `w-24`: el Field vertical lleva `*:w-full`, que
            // empata en especificidad y ganaba por orden de hoja, asi que el
            // campo de dos cifras se pintaba de 760 px
            className="max-w-24 tabular-nums"
          />
          <FieldDescription>{t("form.daysHint")}</FieldDescription>
        </Field>
      )}

      <Field data-invalid={intento && faltaNota}>
        <FieldLabel htmlFor="nota-laudo">{t("form.note")}</FieldLabel>
        <Textarea
          id="nota-laudo"
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder={t("form.notePlaceholder")}
          aria-invalid={intento && faltaNota}
          rows={3}
        />
        <FieldDescription>{t("form.noteHint")}</FieldDescription>
        {intento && faltaNota && <FieldError>{t("form.noteRequired")}</FieldError>}
      </Field>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          {t("form.cancel")}
        </Button>
        <Button type="submit" disabled={!laudo}>
          <Gavel /> {t("form.submit")}
        </Button>
      </DialogFooter>
    </form>
  )
}

/** La versión de una parte: lo que escribió, o que no ha escrito nada. */
function Version({
  parte,
  nombre,
  reclama,
  detalle,
  nota,
}: {
  parte: "clipero" | "agencia"
  nombre: string
  reclama: boolean
  detalle?: string
  nota?: string
}) {
  const t = useTranslations("admin.disputas")
  return (
    <div className="space-y-1 rounded-lg p-3 ring-1 ring-border">
      <p className="text-xs font-medium text-muted-foreground">{t(`role.${parte}`)}</p>
      <p className="font-medium">{nombre}</p>
      {reclama ? (
        <p className="text-pretty">{detalle || t("detail.noDetail")}</p>
      ) : (
        <p className="text-muted-foreground">{t("detail.silent")}</p>
      )}
      {nota && (
        <p className="text-pretty text-muted-foreground">
          <span className="block text-xs">{t("detail.requestNote")}</span>
          {nota}
        </p>
      )}
    </div>
  )
}
