"use client"

import * as React from "react"
import { GripVertical } from "lucide-react"
import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import {
  SIN_FRANJA,
  bloquean,
  carriles,
  estadoVistoAgenda,
  horasUtiles,
  instanteDestino,
  motivoNoMover,
  ocultasEnMes,
  porDia,
  type AvisoAgenda,
  type ClipDeAgenda,
  type EntradaAgenda,
  type EstadoVistoAgenda,
  type MotivoNoMover,
} from "@/lib/agenda"
import {
  desdeDia,
  diaDe,
  instanteDe,
  mesDe,
  minutosDelDia,
  type Dia,
  type Mes,
  type Zona,
} from "@/lib/fechas"
import { SOCIAL_NETWORKS, type SocialAccount } from "@/lib/social"
import { useFechasZona } from "@/hooks/use-format"
import { useMoverPublicacion, type DestinoMover } from "@/hooks/use-mover-publicacion"
import { SocialGlyph } from "@/components/brand/social"

/** Las tres disposiciones del mismo DOM. El orden es el del conmutador. */
export const VISTAS = ["semana", "mes", "lista"] as const
export type Vista = (typeof VISTAS)[number]

/**
 * Semana, Mes y Lista son **el mismo DOM**: cada día es una `<section>` con su
 * `<ol>` de publicaciones en orden. En `data-vista="semana"` un contenedor
 * coloca esas `<li>` dentro de su columna y su hora; en `"mes"` cada `<section>`
 * es una celda de una rejilla de siete columnas; en `"lista"` caen una detrás de
 * otra. Un componente, tres disposiciones, y la lista accesible existe siempre:
 * es también lo que se ve en móvil y lo que lee un lector de pantalla.
 *
 * En Mes no hace falta ni un nodo por semana: el orden en que
 * `semanasDelMes(mes).flat()` devuelve los días es exactamente el orden en que
 * la rejilla los coloca.
 *
 * La rejilla no son 168 celdas: las líneas de hora las pinta un
 * `repeating-linear-gradient` y en el DOM solo van las siete cabeceras y las
 * etiquetas de hora, que son decorativas (el dato va en el `aria-label` de cada
 * tarjeta). Las columnas se miden en `--agenda-alto-hora`, así que subir la
 * escala es cambiar una variable, no rediseñar nada.
 *
 * Los días de 23 y 25 horas salen bien porque las horas las cuenta
 * `horasUtiles` con `horasDelDia`, nunca un 24 escrito a mano.
 */
export function AgendaRejilla({
  entradas,
  dias,
  zona,
  ahora,
  cuentas,
  vista,
  mes,
  diaEntero = false,
  onAbrir,
  onVerDia,
  avisosAlMover,
  onMover,
  clipDe,
  className,
}: {
  entradas: EntradaAgenda[]
  /** Semana: siete. Mes: 28, 35 o 42, en semanas completas y en orden. */
  dias: Dia[]
  zona: Zona
  ahora: string
  cuentas: SocialAccount[]
  vista: Vista
  /** Solo en Mes: los días que no son de este mes se pintan apagados. */
  mes?: Mes
  diaEntero?: boolean
  onAbrir?: (entrada: EntradaAgenda) => void
  /** Solo en Mes: lo que hace «+N más». Sin él el botón no se pinta. */
  onVerDia?: (dia: Dia) => void
  /**
   * Qué impediría soltar aquí. Sin esto no se ofrece mover: un gesto que no se
   * puede validar es un gesto que promete algo que no sabe cumplir.
   */
  avisosAlMover?: (entrada: EntradaAgenda, destino: DestinoMover) => AvisoAgenda[]
  /** Guardar el movimiento. Sin él, tampoco se ofrece. */
  onMover?: (entrada: EntradaAgenda, destino: DestinoMover) => void
  /** Para saber qué clips no encajan en su red: no se ofrecen para mover. */
  clipDe?: (entrada: EntradaAgenda) => ClipDeAgenda | undefined
  className?: string
}) {
  const t = useTranslations("calendario")
  const te = useTranslations("calendario.compositor.errores")
  const fz = useFechasZona(zona)
  // Mes no tiene canal de horas: recorrer 42 días para calcular una franja que
  // su CSS no lee sería trabajo tirado, y con `SIN_FRANJA` la línea de ahora ni
  // se llega a construir
  const franja =
    vista === "mes" ? SIN_FRANJA : horasUtiles(entradas, dias, zona, diaEntero)
  const porDias = porDia(entradas, zona)
  const hoy = diaDe(ahora, zona)
  const minutosAhora = minutosDelDia(ahora, zona)
  const ahoraEnFranja =
    minutosAhora >= franja.desde * 60 && minutosAhora <= franja.hasta * 60

  const horas = Array.from(
    { length: Math.max(1, franja.hasta - franja.desde) },
    (_, i) => franja.desde + i
  )
  /**
   * La hora y el día se escriben desde un INSTANTE de esa zona, nunca desde una
   * fecha suelta: `new Date("2026-09-13T12:00:00")` la interpreta en la zona del
   * navegador y, al pintarla en la de la cuenta, salían horas corridas.
   */
  const enZona = (dia: Dia, hora = 12) =>
    instanteDe({ ...desdeDia(dia), hora, minuto: 0 }, zona)

  /**
   * Mover solo tiene sentido donde hay eje de tiempo: en Semana. En Lista y en
   * Mes no hay a dónde arrastrar, y el destino se cambia desde la hoja.
   */
  const seMueve = Boolean(onMover && avisosAlMover) && vista === "semana"
  const mover = useMoverPublicacion({ zona, franja, dias })
  const enMovimiento = mover.gesto
    ? entradas.find((e) => e.id === mover.gesto?.id)
    : undefined
  /**
   * Se valida con cada destino, no al soltar: quien arrastra tiene que ver el
   * rojo ANTES de soltar, no enterarse del viaje en balde después. Es derivado y
   * no estado: React solo repinta cuando cambia el destino imantado, así que
   * esto corre una vez por casilla, no por fotograma.
   */
  const avisosDestino: AvisoAgenda[] =
    enMovimiento && mover.gesto && avisosAlMover
      ? avisosAlMover(enMovimiento, mover.gesto.destino)
      : []
  const bloqueado = bloquean(avisosDestino)
  /** El primero que manda: lo que bloquea si hay, y si no el primer consejo. */
  const avisoMandante = avisosDestino.find((a) => a.bloquea) ?? avisosDestino[0]

  const guardar = (entrada: EntradaAgenda, destino: DestinoMover) => {
    if (bloqueado) return
    onMover?.(entrada, destino)
  }

  return (
    <div
      data-vista={vista}
      className={cn("agenda", className)}
      style={
        {
          "--agenda-desde": franja.desde,
          "--agenda-horas": Math.max(1, franja.hasta - franja.desde),
          // `--dias` son las COLUMNAS de la rejilla, no los días que se pintan:
          // en Mes hay hasta 42 días repartidos en siete columnas
          "--dias": vista === "mes" ? 7 : dias.length,
        } as React.CSSProperties
      }
    >
      {/* Antes de la cabecera y no entre ella y las horas: ahí partía la rejilla
          en dos, y un lector de pantalla oiría las instrucciones después de
          haber pasado por las siete columnas */}
      {seMueve && (
        <p className="agenda-ayuda">
          <GripVertical className="size-4 shrink-0" aria-hidden />
          {t("mover.ayuda")}
          {/* El resto solo hace falta con el teclado, y para entonces ya se sabe
              que la tarjeta se coge: se anuncia, no se pinta */}
          <span className="sr-only"> {t("mover.ayudaTeclado")}</span>
        </p>
      )}

      {/* Cabecera de días: en lista no se pinta, cada sección lleva la suya */}
      <div className="agenda-cabecera" aria-hidden>
        <span className="agenda-canal" />
        {/* Siete y solo siete: en Mes esta fila son los nombres de los días, y
            los de la primera semana ya son los siete */}
        {dias.slice(0, 7).map((dia) => (
          <span
            key={dia}
            data-hoy={dia === hoy || undefined}
            className="agenda-dia-cabecera"
          >
            <span className="text-xs tracking-wide text-muted-foreground uppercase">
              {fz.diaCorto(enZona(dia))}
            </span>
            <span className="agenda-dia-numero tabular">{Number(dia.slice(-2))}</span>
          </span>
        ))}
      </div>

      <div className="agenda-cuerpo">
        {/* Las etiquetas de hora son decorativas: la hora va en cada tarjeta */}
        <div className="agenda-canal agenda-horas" aria-hidden>
          {horas.map((h) => (
            <span key={h} className="agenda-hora tabular">
              {fz.hora(enZona(dias[0] ?? hoy, h))}
            </span>
          ))}
        </div>

        <div className="agenda-columnas">
          {dias.map((dia) => {
            const delDia = porDias.get(dia) ?? []
            const colocadas = carriles(delDia, zona)
            return (
              <section
                key={dia}
                data-dia={dia}
                data-hoy={dia === hoy || undefined}
                // Los días del mes de al lado se pintan apagados: esconderlos
                // mentiría sobre de qué semana forman parte
                data-fuera={(mes && mesDe(dia) !== mes) || undefined}
                // Foco: «+N más» trae aquí al saltar a la Semana de ese día
                tabIndex={-1}
                aria-label={[
                  fz.fechaLarga(enZona(dia)),
                  dia === hoy ? t("barra.hoy") : null,
                  t("dia.publicaciones", { n: delDia.length }),
                ]
                  .filter(Boolean)
                  .join(" · ")}
                className="agenda-columna outline-none"
              >
                <h3 className="agenda-lista-titulo">
                  {/* El número vive en la cabecera en Semana y en la celda en
                      Mes: está en los dos sitios del DOM y el CSS enseña el que
                      toca */}
                  <span className="agenda-dia-numero tabular">
                    {Number(dia.slice(-2))}
                  </span>
                  <span className="agenda-lista-fecha">{fz.fechaLarga(enZona(dia))}</span>
                  <span className="agenda-lista-cuenta text-sm font-normal text-muted-foreground">
                    {t("dia.publicaciones", { n: delDia.length })}
                  </span>
                </h3>

                {/* La línea de ahora la pinta el servidor con el «ahora» de la demo */}
                {dia === hoy && ahoraEnFranja && (
                  <span
                    aria-hidden
                    className="agenda-ahora"
                    style={
                      {
                        "--minutos": minutosAhora - franja.desde * 60,
                      } as React.CSSProperties
                    }
                  >
                    <span className="agenda-ahora-punto" />
                  </span>
                )}

                <ol className="agenda-entradas">
                  {colocadas.map(({ entrada, carril, carriles: total }) => {
                    // El motivo se guarda, no se tira: está escrito en los
                    // tres idiomas y no lo pintaba nadie, así que la ayuda
                    // prometía «arrastra las publicaciones» también para las
                    // que no se pueden mover, sin decir por qué
                    const noMueve = motivoNoMover(entrada, cuentas, clipDe?.(entrada))
                    const movible = seMueve && noMueve === null
                    const moviendo = mover.gesto?.id === entrada.id
                    return (
                      <li
                        key={entrada.id}
                        className="agenda-entrada"
                        data-moviendo={moviendo || undefined}
                        data-bloqueado={(moviendo && bloqueado) || undefined}
                        style={
                          {
                            "--minutos":
                              minutosDelDia(entrada.programadaPara, zona) -
                              franja.desde * 60,
                            "--carril": carril,
                            "--carriles": total,
                          } as React.CSSProperties
                        }
                        // Los manejadores viven en la `<li>` y no en la tarjeta:
                        // los eventos burbujean, así que la tarjeta sigue siendo
                        // la misma pieza en la bandeja, donde no se mueve nada
                        onPointerDown={
                          movible ? (e) => mover.cogerConPuntero(e, entrada) : undefined
                        }
                        onPointerMove={movible ? mover.alMoverPuntero : undefined}
                        onPointerUp={
                          movible
                            ? () => mover.soltar((d) => guardar(entrada, d))
                            : undefined
                        }
                        onPointerCancel={movible ? mover.terminar : undefined}
                        onKeyDown={
                          movible
                            ? (e) =>
                                mover.conTeclado(e, entrada, (d) => guardar(entrada, d))
                            : undefined
                        }
                        // El clic que cierra un arrastre no abre la hoja: quien
                        // arrastra no ha pedido abrir nada
                        onClickCapture={
                          movible
                            ? (e) => {
                                if (mover.clicEsDelArrastre()) {
                                  e.preventDefault()
                                  e.stopPropagation()
                                }
                              }
                            : undefined
                        }
                      >
                        <AgendaTarjeta
                          entrada={entrada}
                          zona={zona}
                          ahora={ahora}
                          cuentas={cuentas}
                          arrastrable={movible}
                          noSeMueve={seMueve ? noMueve : null}
                          instanteVisto={
                            moviendo && mover.gesto
                              ? instanteDestino(
                                  mover.gesto.destino.dia,
                                  mover.gesto.destino.minutos,
                                  zona
                                )
                              : undefined
                          }
                          onAbrir={onAbrir}
                        />
                        {/* El motivo, ANTES de soltar y pegado a la tarjeta: es
                            lo que evita el viaje en balde */}
                        {moviendo && avisoMandante && (
                          <p className="agenda-motivo" role="status">
                            {te(avisoMandante.code, {
                              red: avisoMandante.values?.red
                                ? SOCIAL_NETWORKS[avisoMandante.values.red].name
                                : "",
                              aspecto: avisoMandante.values?.aspecto ?? "",
                              segundos: avisoMandante.values?.segundos ?? 0,
                              minutos: avisoMandante.values?.minutos ?? 0,
                              min: avisoMandante.values?.min ?? 0,
                              max: avisoMandante.values?.max ?? 0,
                              n: avisoMandante.values?.n ?? 1,
                            })}
                          </p>
                        )}
                      </li>
                    )
                  })}
                  {/* La guía: dónde va a caer, con su hora escrita. Vive en la
                      columna de destino, que puede no ser la de origen */}
                  {mover.gesto && mover.gesto.destino.dia === dia && (
                    <li
                      aria-hidden
                      className="agenda-guia"
                      data-bloqueado={bloqueado || undefined}
                      style={
                        {
                          "--minutos": mover.gesto.destino.minutos - franja.desde * 60,
                        } as React.CSSProperties
                      }
                    >
                      <span className="tabular">
                        {fz.hora(instanteDestino(dia, mover.gesto.destino.minutos, zona))}
                      </span>
                      {/* `tope` se calculaba en cada paso y no lo leía nadie: la
                          publicación dejaba de bajar sin decir por qué, con la
                          salida («Ver el día entero») ahí al lado */}
                      {mover.gesto.tope && (
                        <span className="agenda-guia-tope">{t("mover.tope")}</span>
                      )}
                    </li>
                  )}
                  {/* Lo que no cabe en la celda, dicho con su número. Va el
                      último del `<ol>` porque el `:nth-child` que recorta cuenta
                      desde el principio */}
                  {onVerDia && ocultasEnMes(delDia.length) > 0 && (
                    <li className="agenda-mas">
                      <button
                        type="button"
                        data-button=""
                        data-sound="none"
                        onClick={() => onVerDia(dia)}
                        className="w-full rounded-md px-2 py-1 text-start text-xs font-medium text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-accent-foreground"
                      >
                        {t("mes.mas", { n: ocultasEnMes(delDia.length) })}
                        {/* El nombre accesible dice lo que se lee y, después, a
                            dónde lleva (WCAG 2.5.3) */}
                        <span className="sr-only">
                          {" "}
                          {t("mes.masVer", { fecha: fz.fechaLarga(enZona(dia)) })}
                        </span>
                      </button>
                    </li>
                  )}
                </ol>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/** Tonos por estado. El estado va escrito: el color solo acompaña. */
const TONO: Record<EstadoVistoAgenda, string> = {
  planificada: "bg-card text-card-foreground ring-border",
  "toca-publicar": "bg-primary/10 text-foreground ring-primary/40",
  publicando: "bg-primary/10 text-foreground ring-primary/40",
  publicada: "bg-success/10 text-foreground ring-success/40",
  fallida: "bg-destructive/10 text-foreground ring-destructive/40",
  cancelada: "bg-muted text-muted-foreground line-through ring-border",
  "sin-cuenta": "bg-destructive/10 text-foreground ring-destructive/40",
}

/**
 * Una publicación en el calendario: su hora, el logo de su red, el título del
 * clip y su estado **escrito**. Nada de leer un color para saber qué pasa.
 */
export function AgendaTarjeta({
  entrada,
  zona,
  ahora,
  cuentas,
  conFecha = false,
  arrastrable = false,
  noSeMueve = null,
  instanteVisto,
  onAbrir,
}: {
  entrada: EntradaAgenda
  zona: Zona
  ahora: string
  cuentas: SocialAccount[]
  /** Se puede coger y llevar: lo dice el cursor y el atajo. */
  arrastrable?: boolean
  /** Si no se puede mover, por qué. Se dice en el nombre accesible y al pasar. */
  noSeMueve?: MotivoNoMover | null
  /** Mientras se mueve, la hora del DESTINO. Solo lo que se pinta. */
  instanteVisto?: string
  /**
   * Fuera de la rejilla (la bandeja «toca publicar») no hay columna que diga de
   * qué día es, así que la hora sola no basta: «19:00» puede ser de hace dos
   * semanas.
   */
  conFecha?: boolean
  onAbrir?: (entrada: EntradaAgenda) => void
}) {
  const t = useTranslations("calendario")
  const fz = useFechasZona(zona)
  const estado = estadoVistoAgenda(entrada, cuentas, ahora)
  const red = SOCIAL_NETWORKS[entrada.red].name
  const hora = conFecha
    ? fz.fechaHora(entrada.programadaPara)
    : fz.hora(entrada.programadaPara)
  /**
   * Dos horas y no una: la que se PINTA sigue al destino mientras se mueve, y la
   * del nombre accesible es la GUARDADA. Cambiar el nombre de un control
   * enfocado lo reanuncia en cada paso del arrastre y se pisa con la región viva
   * que ya va diciendo dónde caería.
   */
  const horaVista = instanteVisto
    ? conFecha
      ? fz.fechaHora(instanteVisto)
      : fz.hora(instanteVisto)
    : hora
  const motivo = noSeMueve ? t(`mover.noSeMueve.${noSeMueve}`) : null
  const etiqueta = [
    t("tarjeta.aria", {
      hora,
      red,
      titulo: entrada.titulo,
      estado: t(`estado.${estado}`),
    }),
    motivo,
  ]
    .filter(Boolean)
    .join(" ")

  const contenido = (
    <>
      <span className="flex items-center gap-1.5 text-xs">
        <SocialGlyph network={entrada.red} tone="current" className="size-3.5" />
        <span className="tabular font-medium">{horaVista}</span>
        {/* Cuando dos publicaciones se reparten el hueco, la tarjeta baja a
            ~139 px y el estado se leía «Planifi…». Por debajo de 10rem se
            calla: el color y el `aria-label` lo siguen diciendo entero */}
        <span className="truncate text-muted-foreground @max-[10rem]/tarjeta:hidden">
          {t(`estado.${estado}`)}
        </span>
      </span>
      <span className="agenda-tarjeta-titulo line-clamp-2 text-sm font-medium">
        {entrada.titulo}
      </span>
    </>
  )

  const clase = cn(
    "@container/tarjeta flex h-full w-full flex-col gap-0.5 overflow-hidden rounded-lg px-2 py-1.5 text-left ring-1",
    TONO[estado],
    arrastrable && "cursor-grab touch-none",
    // Lo que se puede abrir tiene que notarse al pasar por encima
    onAbrir && "transition-shadow hover:ring-2"
  )

  if (!onAbrir) {
    return (
      <span className={clase} aria-label={etiqueta} role="group">
        {contenido}
      </span>
    )
  }
  return (
    <button
      type="button"
      data-button=""
      data-sound="none"
      aria-label={etiqueta}
      title={motivo ?? undefined}
      // El atajo se anuncia donde está el foco; qué hace lo dice la ayuda que
      // va antes de la rejilla
      aria-keyshortcuts={arrastrable ? "M" : undefined}
      data-arrastrable={arrastrable || undefined}
      onClick={() => onAbrir(entrada)}
      className={cn(clase, "outline-none focus-visible:ring-2 focus-visible:ring-ring")}
    >
      {contenido}
    </button>
  )
}
