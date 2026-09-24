"use client"

import * as React from "react"
import {
  CalendarClock,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock,
  EyeOff,
  FunnelX,
  Plug,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { parseAsArrayOf, parseAsString, parseAsStringLiteral, useQueryState } from "nuqs"

import { Link } from "@/i18n/navigation"
import {
  AHORA_AGENDA,
  CUENTA_HUERFANA,
  filtrarAgenda,
  hayFiltro,
  normalizarRedes,
  redesFiltrables,
  avisosDeMover,
  instanteDestino,
  necesitanAtencion,
  validarEntrada,
  type EntradaAgenda,
  type FiltroAgenda,
} from "@/lib/agenda"
import {
  ciudadDeZona,
  desdeDia,
  diaDe,
  diasDeLaSemana,
  etiquetaZona,
  inicioDeSemana,
  instanteDe,
  mesDe,
  semanasDelMes,
  sumarDias,
  sumarMeses,
  ZONA_POR_DEFECTO,
} from "@/lib/fechas"
import { puedeProgramar } from "@/lib/pricing"
import { clips as todosLosClips } from "@/lib/mock-data"
import { toast } from "@/lib/toast"
import { SOCIAL_IDS, cuentaActiva } from "@/lib/social"
import { cn } from "@/lib/utils"
import { useAgenda } from "@/hooks/use-agenda"
import { useCampanas } from "@/hooks/use-campanas"
import { usePlan } from "@/hooks/use-plan"
import { useCuenta } from "@/hooks/use-cuenta"
import { useFechasZona } from "@/hooks/use-format"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { AgendaFiltros } from "@/components/agenda/agenda-filtros"
import {
  AgendaRejilla,
  AgendaTarjeta,
  VISTAS,
  type Vista,
} from "@/components/agenda/agenda-rejilla"
import { MuroCalendario } from "@/components/agenda/muro-plan"
import { CompositorDialog } from "@/components/agenda/compositor-dialog"
import { DetalleSheet } from "@/components/agenda/detalle-sheet"

/**
 * El Calendario de publicaciones.
 *
 * Lo que se ve son dos cosas distintas: lo que **ya salió** (viene de las
 * publicaciones que Analíticas tiene indexadas, no se inventa) y lo que está
 * **planificado**. Clipealo lo publica a su hora en la cuenta elegida y guarda
 * el enlace; lo que se sube fuera de aquí se marca a mano con el suyo.
 *
 * El «ahora» es el de la demo (`AHORA_AGENDA`), igual en el servidor y en el
 * navegador: así la línea de la hora no baila al hidratar.
 *
 * Estado en la URL (nuqs), para poder compartir una semana y para que otras
 * pantallas puedan abrir el compositor con unos clips ya marcados:
 * `?vista=`, `?dia=`, `?crear=1` y `?clips=id1,id2`.
 */
export function AgendaView() {
  const t = useTranslations("calendario")
  const { cuenta } = useCuenta()
  const { entradas, cuentas, reprogramar } = useAgenda()
  const { campanas, envios } = useCampanas()
  const { plan } = usePlan()
  const zona = cuenta.perfilCanal?.zona ?? ZONA_POR_DEFECTO
  const fz = useFechasZona(zona)

  const hoy = diaDe(AHORA_AGENDA, zona)
  const [vista, setVista] = useQueryState(
    "vista",
    parseAsStringLiteral(VISTAS).withDefault("semana")
  )
  const [dia, setDia] = useQueryState("dia", parseAsString.withDefault(hoy))
  const [diaEntero, setDiaEntero] = React.useState(false)
  /**
   * El contrato que usan los enganches del resto del producto: `?crear=1` abre
   * el compositor y `?clips=` lo abre con esos clips marcados. Se escribe «1»
   * porque es lo que ya enlazan desde la biblioteca.
   */
  const [crear, setCrear] = useQueryState("crear", parseAsString)
  const [clipsUrl, setClipsUrl] = useQueryState(
    "clips",
    parseAsArrayOf(parseAsString, ",").withDefault([])
  )
  /**
   * El filtro. `?red=` admite varias separadas por coma y se escribe SIEMPRE en
   * el orden de `SOCIAL_IDS`, para que la misma vista dé el mismo enlace.
   * `?cuenta=` es una sola: una cuenta ya lleva su red dentro, y «mirar como dos
   * personas a la vez» no es una tarea que exista. Las dos se cumplen a la vez.
   *
   * Como el resto del estado de esta página va con `history: "replace"`: el
   * «atrás» del navegador sale del calendario, no deshace filtros. Lo que
   * deshace un filtro es «Quitar el filtro», que está siempre a la vista.
   */
  const [redes, setRedes] = useQueryState(
    "red",
    parseAsArrayOf(parseAsStringLiteral(SOCIAL_IDS), ",").withDefault([])
  )
  const [cuentaFiltro, setCuentaFiltro] = useQueryState("cuenta", parseAsString)
  const filtro: FiltroAgenda = { redes, cuenta: cuentaFiltro ?? undefined }
  const abierto = crear === "1" || crear === "true"
  // La publicación abierta se guarda por id: al moverla o cancelarla, la hoja
  // sigue leyendo la entrada viva y no una copia de hace dos clics
  const [detalleId, setDetalleId] = React.useState<string | null>(null)

  const mes = mesDe(dia)
  // Mes pinta semanas completas de lunes a domingo, así que la primera y la
  // última traen días del mes de al lado; se pintan, apagados. Al pasar de
  // Semana a Mes se abre el mes del día que se estaba viendo, que con
  // `?dia=2026-08-31` es agosto y no septiembre: manda el día, no la semana.
  const dias = vista === "mes" ? semanasDelMes(mes).flat() : diasDeLaSemana(dia)
  // El rango es lexicográfico porque un `Dia` es «AAAA-MM-DD»: comparar cadenas
  // es comparar fechas. Sirve igual para 7 días que para 42
  const primero = dias[0]
  const ultimo = dias[dias.length - 1]
  // Dos conjuntos con dos nombres: lo que cae en los días pintados y, de eso, lo
  // que pasa el filtro. El «3 de 9» es exactamente esa diferencia
  const enRango = entradas.filter((e) => {
    const d = diaDe(e.programadaPara, zona)
    return d >= primero && d <= ultimo
  })
  const visibles = filtrarAgenda(enRango, filtro, cuentas)
  /**
   * La bandeja se calcula sobre TODAS, como siempre: el filtro cambia lo que
   * miras, no lo que te deben. Una alarma que se calla porque hay un filtro
   * puesto deja de ser una alarma. Con Clipealo publicando, lo que entra aquí
   * es lo que NO salió: un envío fallido, una cuenta que ya no está, o algo
   * que publica la persona y se le pasó la hora.
   */
  const pendientes = necesitanAtencion(entradas, cuentas, AHORA_AGENDA)
  const pendientesVisibles = filtrarAgenda(pendientes, filtro, cuentas)
  const hayCuentas = cuentas.some(cuentaActiva)
  // Con una sola red y una sola cuenta el filtro no puede hacer nada: no se pinta
  const sePuedeFiltrar =
    hayFiltro(filtro) ||
    redesFiltrables(entradas, cuentas).length > 1 ||
    cuentas.filter((c) => c.handle).length > 1

  const detalle = detalleId ? (entradas.find((e) => e.id === detalleId) ?? null) : null

  /**
   * Anterior y siguiente cambian de UNIDAD con la vista: en Semana saltan siete
   * días; en Mes saltan un mes y caen en el día 1, que es el único día que
   * existe en los doce meses (el 31 de enero + 1 mes no es una fecha).
   */
  const irA = (delta: number) =>
    void setDia(
      vista === "mes"
        ? `${sumarMeses(mes, delta)}-01`
        : sumarDias(inicioDeSemana(dia), delta * 7)
    )

  /**
   * El único sitio donde se escriben las dos partes del filtro. No se corrige
   * nada a escondidas: si alguien pide una red y una cuenta que no casan, sale
   * vacío y el vacío lo explica. Corregirlo en silencio haría que lo que se ve
   * no fuera lo que pone en la barra de direcciones.
   */
  const aplicarFiltro = (siguiente: FiltroAgenda) => {
    const redesNuevas = normalizarRedes(siguiente.redes)
    void setRedes(redesNuevas.length > 0 ? redesNuevas : null)
    void setCuentaFiltro(siguiente.cuenta ?? null)
  }
  const quitarFiltro = () => aplicarFiltro({ redes: [] })

  const clipDe = (e: EntradaAgenda) => todosLosClips.find((c) => c.id === e.clipId)

  /**
   * Qué impediría soltar la publicación ahí. Se pregunta con CADA destino, no al
   * soltar: quien arrastra tiene que ver el rojo antes, no enterarse del viaje
   * en balde después.
   *
   * Solo los avisos que dependen de la hora: que el formato no encaje o que el
   * clip dure de más no se arregla moviéndolo, y teñiría de rojo todos los
   * destinos por algo que el gesto no puede resolver. Esas publicaciones ni se
   * ofrecen para mover (`motivoNoMover`).
   */
  const avisosAlMover = React.useCallback(
    (entrada: EntradaAgenda, destino: { dia: string; minutos: number }) => {
      const campana = campanas.find((c) => c.id === entrada.campanaId)
      return avisosDeMover(
        validarEntrada(
          {
            id: entrada.id,
            clipId: entrada.clipId,
            red: entrada.red,
            cuentaId: entrada.cuentaId,
            programadaPara: instanteDestino(destino.dia, destino.minutos, zona),
            campanaId: entrada.campanaId,
          },
          {
            clip: todosLosClips.find((c) => c.id === entrada.clipId),
            cuentas,
            entradas,
            campana,
            envios: campana
              ? envios.filter((e) => e.campanaId === campana.id)
              : undefined,
            zona,
            instante: AHORA_AGENDA,
          }
        )
      )
    },
    [campanas, cuentas, entradas, envios, zona]
  )

  /** Guardar el movimiento, con la vuelta atrás a un clic. */
  const moverEntrada = (
    entrada: EntradaAgenda,
    destino: { dia: string; minutos: number }
  ) => {
    const antes = entrada.programadaPara
    const instante = instanteDestino(destino.dia, destino.minutos, zona)
    reprogramar(entrada.id, instante)
    toast.success(t("mover.movida", { fecha: fz.fechaHora(instante) }), {
      action: {
        label: t("detalle.deshacer"),
        onClick: () => reprogramar(entrada.id, antes),
      },
    })
  }

  /**
   * «+N más» no despliega ni inventa una vista Día: lleva a la Semana de ese
   * día, que es donde la hora significa algo, y queda en la URL para poder
   * compartirla. El foco va a la celda de destino: el botón que se pulsó
   * desaparece del DOM y sin esto el teclado volvía al principio de la página.
   */
  const verDia = (d: string) => {
    void setVista("semana")
    void setDia(d)
    requestAnimationFrame(() =>
      document.querySelector<HTMLElement>(`[data-dia="${d}"]`)?.focus()
    )
  }
  const cerrarCompositor = () => {
    void setCrear(null)
    void setClipsUrl(null)
  }
  /** El mediodía de un día EN LA ZONA de la cuenta: un instante, no una cadena. */
  const mediodia = (d: string) =>
    instanteDe({ ...desdeDia(d), hora: 12, minuto: 0 }, zona)

  // Programar es del plan Creador en adelante, como lo vende /precios: para un
  // Prueba la página entera es la puerta (decisión del director, 15 sep).
  // El servidor no sabe el plan —en la demo vive en el navegador—, así que lo
  // que se pinta antes de hidratar es el del plan de la demo; `usePlan` corrige
  // en la primera pasada del cliente.
  if (!puedeProgramar(plan)) return <MuroCalendario />

  return (
    <div className="space-y-5">
      {/* Lo que toca publicar hoy: el recordatorio es el producto */}
      {pendientes.length > 0 && (
        <BandejaTocaPublicar
          entradas={pendientesVisibles}
          fuera={pendientes.length - pendientesVisibles.length}
          onVerTodas={quitarFiltro}
          zona={zona}
          cuentas={cuentas}
          onAbrir={(e) => setDetalleId(e.id)}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void setDia(hoy)}>
            {t("barra.hoy")}
          </Button>
          <ButtonGroup>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={t(vista === "mes" ? "barra.anteriorMes" : "barra.anterior")}
              onClick={() => irA(-1)}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={t(vista === "mes" ? "barra.siguienteMes" : "barra.siguiente")}
              onClick={() => irA(1)}
            >
              <ChevronRight />
            </Button>
          </ButtonGroup>
          {/* `aria-live`: al cambiar de semana o de mes con las flechas, el foco
              se queda en la flecha y esto es lo único que cambia */}
          <h2
            aria-live="polite"
            className="text-base font-semibold first-letter:uppercase"
          >
            {/* En Mes `dias[0]` puede ser del mes anterior, así que un rango
                diría «31 ago – 6 sept» en vez de «septiembre de 2026» */}
            {vista === "mes"
              ? fz.mes(mediodia(`${mes}-01`))
              : fz.rango(mediodia(dias[0]), mediodia(dias[6]))}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Junto al conmutador, no al pie: al ampliar la franja el botón se
              iba 1.300 px abajo y había que bajar a buscarlo para volver */}
          {vista === "semana" && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => setDiaEntero((v) => !v)}
            >
              <Clock />
              {t(diaEntero ? "franjaCorta" : "diaEntero")}
            </Button>
          )}
          <ToggleGroup
            type="single"
            value={vista}
            onValueChange={(v) => v && void setVista(v as Vista)}
            variant="outline"
            size="sm"
            aria-label={t("barra.vista")}
          >
            {VISTAS.map((v) => (
              <ToggleGroupItem
                key={v}
                value={v}
                data-sound="none"
                // El `bg-muted` que trae el componente deja 1,06:1 sobre el
                // fondo: la vista activa era indistinguible de la otra
                className="data-[state=on]:border-primary data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
              >
                {t(`barra.${v}`)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          {/* La única acción naranja de la vista. Sin cuentas no hay dónde
              publicar: entonces manda el vacío, que ya lleva su propio camino */}
          {hayCuentas && (
            <Button variant="brand" size="sm" onClick={() => void setCrear("1")}>
              <CalendarPlus /> {t("programar")}
            </Button>
          )}
        </div>
      </div>

      {!hayCuentas ? (
        <Empty className="rounded-xl ring-1 ring-border">
          <EmptyHeader>
            <Plug className="mx-auto size-6 text-muted-foreground" aria-hidden />
            <EmptyTitle>{t("vacio.sinCuentas.titulo")}</EmptyTitle>
            <EmptyDescription>{t("vacio.sinCuentas.descripcion")}</EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" asChild>
            <Link href={{ pathname: "/ajustes", query: { seccion: "cuentas" } }}>
              {t("vacio.sinCuentas.cta")}
            </Link>
          </Button>
        </Empty>
      ) : (
        <>
          {sePuedeFiltrar && (
            <AgendaFiltros
              entradas={entradas}
              aLaVista={enRango}
              cuentas={cuentas}
              filtro={filtro}
              visibles={visibles.length}
              onCambiar={aplicarFiltro}
            />
          )}

          {/* El vacío ya no borra el mapa: el aviso va encima de la rejilla,
              para seguir viendo qué días la componen. Y dice el motivo REAL: no
              es lo mismo «no hay nada» que «no hay nada DE ESTO», y con el mismo
              texto uno programa de más creyendo que no tenía nada */}
          {visibles.length === 0 && hayFiltro(filtro) && enRango.length > 0 ? (
            <Empty className="rounded-xl ring-1 ring-border">
              <EmptyHeader>
                <FunnelX className="mx-auto size-6 text-muted-foreground" aria-hidden />
                <EmptyTitle>{t("vacio.filtro.titulo")}</EmptyTitle>
                <EmptyDescription>
                  {t("vacio.filtro.descripcion", { n: enRango.length })}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            visibles.length === 0 && (
              <Empty className="rounded-xl ring-1 ring-border">
                <EmptyHeader>
                  <CalendarClock
                    className="mx-auto size-6 text-muted-foreground"
                    aria-hidden
                  />
                  <EmptyTitle>
                    {t(vista === "mes" ? "vacio.mes.titulo" : "vacio.semana.titulo")}
                  </EmptyTitle>
                  <EmptyDescription>
                    {t(
                      vista === "mes"
                        ? "vacio.mes.descripcion"
                        : "vacio.semana.descripcion"
                    )}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )
          )}

          <AgendaRejilla
            entradas={visibles}
            dias={dias}
            mes={vista === "mes" ? mes : undefined}
            zona={zona}
            ahora={AHORA_AGENDA}
            cuentas={cuentas}
            vista={vista}
            diaEntero={diaEntero}
            onAbrir={(e) => setDetalleId(e.id)}
            onVerDia={vista === "mes" ? verDia : undefined}
            avisosAlMover={avisosAlMover}
            onMover={moverEntrada}
            clipDe={clipDe}
          />
        </>
      )}

      <CompositorDialog
        open={abierto}
        onOpenChange={(v) => (v ? void setCrear("1") : cerrarCompositor())}
        zona={zona}
        dia={dia}
        clipsIniciales={clipsUrl}
        // Lo que se está mirando propone dónde va. `sin-cuenta` no propone nada:
        // no se puede programar a una cuenta que ya no está
        redesIniciales={redes}
        cuentaInicial={
          cuentaFiltro === CUENTA_HUERFANA ? undefined : (cuentaFiltro ?? undefined)
        }
      />

      <DetalleSheet
        entrada={detalle}
        open={detalle !== null}
        onOpenChange={(v) => !v && setDetalleId(null)}
        zona={zona}
      />
    </div>
  )
}

/**
 * Lo que ya tocaba y sigue sin publicarse. Es el corazón del producto: sin este
 * recordatorio, un calendario que no publica solo no sirve de nada.
 */
function BandejaTocaPublicar({
  entradas,
  fuera,
  onVerTodas,
  zona,
  cuentas,
  onAbrir,
  className,
}: {
  entradas: EntradaAgenda[]
  /** Cuántas esperan pero no caben en el filtro puesto. */
  fuera: number
  onVerTodas: () => void
  zona: string
  cuentas: Parameters<typeof AgendaTarjeta>[0]["cuentas"]
  onAbrir?: (entrada: EntradaAgenda) => void
  className?: string
}) {
  const t = useTranslations("calendario")
  return (
    <section
      aria-labelledby="agenda-toca"
      className={cn("space-y-3 rounded-xl bg-card p-4 ring-1 ring-primary/30", className)}
    >
      <div className="space-y-1">
        <h2 id="agenda-toca" className="text-base font-bold">
          {t("bandeja.titulo", { n: entradas.length })}
        </h2>
        <p className="text-sm text-muted-foreground">{t("bandeja.descripcion")}</p>
      </div>
      {/* `auto-fill` con mínimo: con una sola publicación no reserva tres
          columnas y deja dos tercios del panel vacíos */}
      {entradas.length > 0 && (
        <ul className="grid [grid-template-columns:repeat(auto-fill,minmax(20rem,1fr))] gap-2">
          {entradas.map((e) => (
            <li key={e.id}>
              <AgendaTarjeta
                entrada={e}
                zona={zona}
                ahora={AHORA_AGENDA}
                cuentas={cuentas}
                conFecha
                onAbrir={onAbrir}
              />
            </li>
          ))}
        </ul>
      )}

      {/* Lo que el filtro deja fuera se dice, con la salida al lado: la alarma
          no puede callarse por una lente que alguien puso hace dos clics */}
      {fuera > 0 && (
        <div role="status" className="flex flex-wrap items-center gap-2 text-sm">
          <EyeOff className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span>{t("bandeja.fuera", { n: fuera })}</span>
          <Button variant="outline" size="sm" onClick={onVerTodas}>
            {t("bandeja.verTodas")}
          </Button>
        </div>
      )}
    </section>
  )
}

/** El sello de zona de la cabecera: la hora que manda, dicha en pantalla. */
export function SelloZona() {
  const t = useTranslations("calendario")
  const { cuenta } = useCuenta()
  const zona = cuenta.perfilCanal?.zona ?? ZONA_POR_DEFECTO
  return (
    <Button variant="outline" size="sm" asChild>
      {/* El nombre accesible tiene que contener lo que se lee (WCAG 2.5.3): el
          texto visible va primero y la explicación después, en `sr-only` */}
      <Link href={{ pathname: "/ajustes", query: { seccion: "perfil" } }}>
        <Clock />
        {t("zona.sello", {
          ciudad: ciudadDeZona(zona),
          desfase: etiquetaZona(zona, AHORA_AGENDA),
        })}
        <span className="sr-only">{t("zona.cambiar")}</span>
      </Link>
    </Button>
  )
}
