"use client"

import * as React from "react"
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  RotateCcw,
  Send,
  Trash2,
} from "lucide-react"
import { useTranslations } from "next-intl"

import {
  AHORA_AGENDA,
  estadoVistoAgenda,
  loteDe,
  seArreglaReconectando,
  validarEntrada,
  type AvisoAgenda,
  type EntradaAgenda,
  type EstadoVistoAgenda,
} from "@/lib/agenda"
import { PublicacionFallida } from "@/lib/api/publicaciones"
import { Link } from "@/i18n/navigation"
import {
  ciudadDeZona,
  desdeDia,
  diaDe,
  etiquetaZona,
  instanteDe,
  minutosDelDia,
  type Zona,
} from "@/lib/fechas"
import { clips as todosLosClips } from "@/lib/mock-data"
import { SOCIAL_NETWORKS, cuentaPorId } from "@/lib/social"
import { toast } from "@/lib/toast"
import { useAgenda } from "@/hooks/use-agenda"
import { useCampanas } from "@/hooks/use-campanas"
import { useFechasZona } from "@/hooks/use-format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"
import { SocialGlyph } from "@/components/brand/social"

/** El enlace de una publicación, como en «Enviar clip» de campañas. */
const ENLACE = /^https?:\/\/\S+\.\S+/

const VARIANTE: Record<EstadoVistoAgenda, React.ComponentProps<typeof Badge>["variant"]> =
  {
    planificada: "outline",
    "toca-publicar": "default",
    publicando: "default",
    publicada: "success",
    fallida: "destructive",
    cancelada: "secondary",
    "sin-cuenta": "destructive",
  }

/**
 * Una publicación abierta.
 *
 * Lo que se puede hacer con ella depende de dónde esté: una planificada se
 * mueve, se tira o **sale ya** («Publicar ahora», que la manda de verdad); una
 * que falló se reintenta, o se reconecta la cuenta si el motivo es ese; y en
 * cualquiera de las dos queda la vía manual —«Ya la publiqué» con su enlace—
 * para lo que se subió fuera de Clipealo.
 *
 * El hito es la publicación, la haga Clipealo o la persona: ahí se celebra.
 */
export function DetalleSheet({
  entrada,
  open,
  onOpenChange,
  zona,
}: {
  entrada: EntradaAgenda | null
  open: boolean
  onOpenChange: (open: boolean) => void
  zona: Zona
}) {
  return (
    <Sheet open={open && entrada !== null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        {entrada && (
          /* La `key` reinicia el formulario al saltar de una tarjeta a otra */
          <Detalle
            key={entrada.id}
            entradaId={entrada.id}
            zona={zona}
            onCerrar={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

function Detalle({
  entradaId,
  zona,
  onCerrar,
}: {
  entradaId: string
  zona: Zona
  onCerrar: () => void
}) {
  const t = useTranslations("calendario")
  const td = useTranslations("calendario.detalle")
  const te = useTranslations("calendario.compositor.errores")
  const tfRaw = useTranslations("calendario.fallo")
  const tf = (code: string) => tfRaw(code as never)
  const fz = useFechasZona(zona)
  const { entradas, cuentas, reprogramar, cancelar, recuperar, marcarPublicada, enviar } =
    useAgenda()
  const [enviando, setEnviando] = React.useState(false)
  const { campanas, envios } = useCampanas()

  // Se lee de la lista viva: al mover o cancelar, la hoja se entera sola
  const entrada = entradas.find((e) => e.id === entradaId)

  const [cuando, setCuando] = React.useState(() => {
    const e = entradas.find((x) => x.id === entradaId)
    const instante = e?.programadaPara ?? AHORA_AGENDA
    const minutos = minutosDelDia(instante, zona)
    return {
      dia: diaDe(instante, zona),
      hora: `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`,
    }
  })
  const [url, setUrl] = React.useState("")
  // Dos banderas, no una: pulsar «Mover» encendía en rojo el formulario del
  // enlace, que nadie había tocado
  const [intentoMover, setIntentoMover] = React.useState(false)
  const [intentoPublicar, setIntentoPublicar] = React.useState(false)

  if (!entrada) return null

  const estado = estadoVistoAgenda(entrada, cuentas, AHORA_AGENDA)
  const red = SOCIAL_NETWORKS[entrada.red]
  const cuenta = cuentaPorId(entrada.cuentaId, cuentas)
  const hermanas = loteDe(entradas, entrada.loteId).filter((e) => e.id !== entrada.id)
  const clip = todosLosClips.find((c) => c.id === entrada.clipId)
  const campana = campanas.find((c) => c.id === entrada.campanaId)

  const fechaValida =
    /^\d{4}-\d{2}-\d{2}$/.test(cuando.dia) && /^\d{2}:\d{2}/.test(cuando.hora)
  const [h, m] = cuando.hora.split(":").map(Number)
  const nuevoInstante = fechaValida
    ? instanteDe({ ...desdeDia(cuando.dia), hora: h, minuto: m }, zona)
    : ""
  const haCambiado = nuevoInstante !== entrada.programadaPara

  const avisos: AvisoAgenda[] = validarEntrada(
    {
      id: entrada.id,
      clipId: entrada.clipId,
      red: entrada.red,
      cuentaId: entrada.cuentaId,
      programadaPara: nuevoInstante,
      campanaId: entrada.campanaId,
    },
    {
      clip,
      cuentas,
      entradas,
      campana,
      envios: campana ? envios.filter((e) => e.campanaId === campana.id) : undefined,
      zona,
      instante: AHORA_AGENDA,
    }
  )
  // Sin clip vivo no se puede mover algo que sí existe: lo publicado de la demo
  // viene del índice de Analíticas y no tiene por qué seguir en la biblioteca
  const bloqueos = avisos.filter((a) => a.bloquea && a.code !== "sinClip")
  const consejos = avisos.filter((a) => !a.bloquea)

  const frase = (a: AvisoAgenda) => {
    const v = a.values ?? {}
    return te(a.code, {
      red: v.red ? SOCIAL_NETWORKS[v.red].name : "",
      aspecto: v.aspecto ?? "",
      segundos: v.segundos ?? 0,
      minutos: v.minutos ?? 0,
      min: v.min ?? 0,
      max: v.max ?? 0,
      n: v.n ?? 0,
    })
  }

  const mover = () => {
    setIntentoMover(true)
    if (!haCambiado || bloqueos.length > 0) return
    reprogramar(entrada.id, nuevoInstante)
    toast.success(td("movida", { fecha: fz.fechaHora(nuevoInstante) }))
  }

  const tirar = () => {
    cancelar(entrada.id)
    // Un aviso neutro: cancelar no es un fallo ni un hito, y se puede deshacer
    toast(td("cancelada"), {
      description: entrada.titulo,
      action: {
        label: td("deshacer"),
        onClick: () => {
          recuperar(entrada.id)
          toast.success(td("recuperada"))
        },
      },
    })
    onCerrar()
  }

  const publicar = (e: React.FormEvent) => {
    e.preventDefault()
    setIntentoPublicar(true)
    if (!ENLACE.test(url.trim())) return
    marcarPublicada(entrada.id, url.trim())
    // El único hito del calendario: la publicación existe y ya se puede seguir
    toast.celebrate(td("publicada"), { description: td("publicadaDescripcion") })
    onCerrar()
  }

  /** Mandarla a la red ahora mismo: el mismo camino que usa el reintento. */
  const publicarAhora = async () => {
    setEnviando(true)
    try {
      await enviar(entrada.id)
      toast.celebrate(td("publicada"), { description: td("publicadaDescripcion") })
      onCerrar()
    } catch (error) {
      const codigo = error instanceof PublicacionFallida ? error.fallo : "sinRed"
      toast.error(td("falloTitulo"), { description: tf(codigo) })
    } finally {
      setEnviando(false)
    }
  }

  const enlaceMal = intentoPublicar && !ENLACE.test(url.trim())
  const editable = entrada.estado === "planificada"
  const fallida = entrada.estado === "fallida"
  const enMarcha = entrada.estado === "publicando"
  // Un fallo de permiso no se arregla reintentando: hay que volver a conectar
  const reconectar = seArreglaReconectando(entrada.fallo)

  return (
    <>
      <SheetHeader className="gap-2 border-b">
        {/* `pr-8`: la ✕ de la hoja va absoluta arriba a la derecha y se comía el
            final de la insignia («Planificad✕»), igual que le pasaba al título */}
        <div className="flex items-center gap-2 pr-8">
          {/* El nombre va escrito al lado: el logo no lo repite */}
          <SocialGlyph
            network={entrada.red}
            tone="current"
            className="size-4"
            aria-hidden
          />
          <span className="text-sm font-medium">{red.name}</span>
          {cuenta?.handle && (
            <span className="text-sm text-muted-foreground">{cuenta.handle}</span>
          )}
          <Badge variant={VARIANTE[estado]} className="ml-auto">
            {t(`estado.${estado}`)}
          </Badge>
        </div>
        <SheetTitle className="pr-8 text-left">{entrada.titulo}</SheetTitle>
        <SheetDescription className="text-left">
          {entrada.estado === "publicada" && entrada.publicadaEn
            ? td("publicadaEl", { fecha: fz.fechaHora(entrada.publicadaEn) })
            : td("programadaPara", { fecha: fz.fechaHora(entrada.programadaPara) })}
          {" · "}
          {t("zona.sello", {
            ciudad: ciudadDeZona(zona),
            desfase: etiquetaZona(zona, AHORA_AGENDA),
          })}
        </SheetDescription>
      </SheetHeader>

      {/* Sin `flex-1`: el cuerpo se estiraba hasta el pie y dejaba 445 px de
          blanco entre lo último que se lee y el bloque del enlace */}
      <div className="@container/detalle min-h-0 shrink space-y-5 overflow-y-auto px-4">
        {estado === "sin-cuenta" && (
          <p className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm">
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0 text-destructive"
              aria-hidden
            />
            {t("tarjeta.sinCuenta", { red: red.name })}
          </p>
        )}

        {fallida && (
          <div className="space-y-2 rounded-lg bg-destructive/10 p-3">
            <p className="flex items-start gap-2 text-sm">
              <AlertTriangle
                className="mt-0.5 size-4 shrink-0 text-destructive"
                aria-hidden
              />
              <span>
                <span className="font-medium">{td("falloTitulo")}</span>{" "}
                {entrada.fallo ? tf(entrada.fallo) : ""}
                {entrada.intentos ? ` · ${td("intentos", { n: entrada.intentos })}` : ""}
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              {reconectar ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={{ pathname: "/ajustes", query: { seccion: "social" } }}>
                    {td("reconectar")}
                  </Link>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={enviando}
                  onClick={publicarAhora}
                >
                  {enviando ? <Spinner /> : <RotateCcw />} {td("reintentar")}
                </Button>
              )}
            </div>
          </div>
        )}

        {enMarcha && (
          <p className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm">
            <Spinner className="size-4" /> {td("publicando", { red: red.name })}
          </p>
        )}

        {entrada.texto && (
          <section className="space-y-1">
            <h3 className="text-sm font-semibold">{td("texto")}</h3>
            <p className="rounded-lg bg-muted p-3 text-sm">{entrada.texto}</p>
          </section>
        )}

        {hermanas.length > 0 && (
          <section className="space-y-1.5">
            <h3 className="text-sm font-semibold">{td("lote")}</h3>
            <p className="text-sm text-muted-foreground">
              {td("loteDescripcion", { n: hermanas.length })}
            </p>
            <ul className="grid gap-1">
              {hermanas.map((e) => (
                <li key={e.id} className="flex items-center gap-2 text-sm">
                  <SocialGlyph
                    network={e.red}
                    tone="current"
                    className="size-3.5"
                    aria-hidden
                  />
                  <span>{SOCIAL_NETWORKS[e.red].name}</span>
                  <span className="tabular text-muted-foreground">
                    {fz.fechaHora(e.programadaPara)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {entrada.url && (
          <section className="space-y-1.5">
            <h3 className="text-sm font-semibold">{td("enlace")}</h3>
            <Button variant="outline" size="sm" asChild>
              {/* Enlace a la red: externo, así que `<a>` y no el `Link` del idioma */}
              <a href={entrada.url} target="_blank" rel="noreferrer noopener">
                <ExternalLink /> {td("verPublicacion")}
              </a>
            </Button>
          </section>
        )}

        {editable && (
          <section aria-labelledby="detalle-mover" className="space-y-3">
            <h3 id="detalle-mover" className="text-sm font-semibold">
              {td("reprogramar")}
            </h3>
            <div className="grid gap-3 @sm/detalle:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="detalle-dia">{td("dia")}</FieldLabel>
                <Input
                  id="detalle-dia"
                  type="date"
                  value={cuando.dia}
                  onChange={(e) => setCuando((s) => ({ ...s, dia: e.target.value }))}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="detalle-hora">{td("hora")}</FieldLabel>
                <Input
                  id="detalle-hora"
                  type="time"
                  value={cuando.hora}
                  onChange={(e) => setCuando((s) => ({ ...s, hora: e.target.value }))}
                />
              </Field>
            </div>
            <FieldDescription>
              {td("zonaAviso", {
                ciudad: ciudadDeZona(zona),
                desfase: etiquetaZona(zona, AHORA_AGENDA),
              })}
            </FieldDescription>

            {intentoMover && haCambiado && bloqueos.length > 0 && (
              <ul className="list-disc space-y-0.5 rounded-lg bg-destructive/10 p-3 pl-7 text-sm">
                {bloqueos.map((a) => (
                  <li key={a.code}>{frase(a)}</li>
                ))}
              </ul>
            )}
            {haCambiado && consejos.length > 0 && (
              <ul className="list-disc space-y-0.5 rounded-lg bg-muted p-3 pl-7 text-sm text-muted-foreground">
                {consejos.map((a) => (
                  <li key={a.code}>{frase(a)}</li>
                ))}
              </ul>
            )}

            <div className="space-y-1.5">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="brand"
                  disabled={enviando}
                  onClick={publicarAhora}
                >
                  {enviando ? <Spinner /> : <Send />} {td("publicarAhora")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={mover}
                  disabled={!haCambiado}
                >
                  <CalendarClock /> {td("mover")}
                </Button>
                <Button type="button" variant="destructive" onClick={tirar}>
                  <Trash2 /> {td("cancelar")}
                </Button>
              </div>
              {/* Nacía apagado y sin decir por qué, al lado de un «Cancelar la
                  publicación» bien vivo */}
              {!haCambiado && (
                <p className="text-xs text-muted-foreground">{td("moverSinCambios")}</p>
              )}
            </div>
          </section>
        )}

        {entrada.estado === "cancelada" && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              recuperar(entrada.id)
              toast.success(td("recuperada"))
            }}
          >
            <RotateCcw /> {td("recuperar")}
          </Button>
        )}
      </div>

      {/* `mt-0` contra el `mt-auto` del pie: pegado a lo que se estaba leyendo,
          no clavado al fondo de la hoja */}
      {(editable || fallida) && (
        <SheetFooter className="mt-0 gap-3 border-t">
          <form onSubmit={publicar} className="space-y-3">
            <p className="text-sm font-medium">{td("manual")}</p>
            <p className="text-sm text-muted-foreground">{td("promesa")}</p>
            <Field data-invalid={enlaceMal ? true : undefined}>
              <FieldLabel htmlFor="detalle-url">{td("enlace")}</FieldLabel>
              <Input
                id="detalle-url"
                value={url}
                inputMode="url"
                placeholder={td("enlacePlaceholder")}
                aria-invalid={enlaceMal ? true : undefined}
                onChange={(e) => setUrl(e.target.value)}
              />
              {enlaceMal ? (
                <FieldError>{td("enlaceError")}</FieldError>
              ) : (
                <FieldDescription>{td("enlaceAyuda")}</FieldDescription>
              )}
            </Field>
            <Button type="submit" variant="outline" className="w-full">
              <CheckCircle2 /> {td("publicar")}
            </Button>
          </form>
        </SheetFooter>
      )}
    </>
  )
}
