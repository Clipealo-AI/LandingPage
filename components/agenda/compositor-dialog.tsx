"use client"

import * as React from "react"
import { AlertTriangle, BellRing, CalendarPlus, Info } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  AHORA_AGENDA,
  BLOQUEA,
  SEPARACION_MINIMA_MIN,
  repartir,
  validarEntrada,
  type AvisoAgenda,
  type EntradaAgenda,
  type NuevaEntrada,
} from "@/lib/agenda"
import { nuevoId } from "@/lib/campanas"
import {
  ciudadDeZona,
  desdeDia,
  diaDe,
  etiquetaZona,
  instanteDe,
  partesEn,
  type Zona,
} from "@/lib/fechas"
import { clips as todosLosClips, sourceVideos } from "@/lib/mock-data"
import {
  SOCIAL_IDS,
  SOCIAL_NETWORKS,
  cuentaPorId,
  cuentasDeRed,
  duenoCuenta,
  type SocialAccount,
  type SocialId,
} from "@/lib/social"
import { toast } from "@/lib/toast"
import { useAgenda } from "@/hooks/use-agenda"
import { useFechasZona } from "@/hooks/use-format"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SocialGlyph } from "@/components/brand/social"
import { SelectorClips } from "@/components/agenda/selector-clips"

/**
 * El compositor: de unos clips a unas publicaciones planificadas.
 *
 * Tres decisiones y ninguna más: **qué** clips, **dónde** (la red y, si hay dos
 * cuentas de la misma red, cuál) y **cuándo**. El día y la hora son los de la
 * zona de la cuenta, y eso se dice en pantalla: quien mira puede estar en otro
 * huso y la hora que ve no es la suya.
 *
 * El mismo clip en varias redes es **una acción**: se crean juntas y comparten
 * `loteId`, así que después se pueden reconocer como un grupo. Antes de
 * confirmar, el diálogo dice cuántas publicaciones va a crear y las enseña una
 * a una, con su hora y su cuenta.
 *
 * Y lo dice sin letra pequeña: Clipealo **las publica** en las cuentas
 * elegidas a la hora marcada, y guarda el enlace que devuelve cada red.
 */
export function CompositorDialog({
  open,
  onOpenChange,
  zona,
  dia,
  clipsIniciales = [],
  redesIniciales = [],
  cuentaInicial,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  zona: Zona
  /** Día que se está mirando en el calendario: es el que se propone. */
  dia: string
  /** Ids que llegan marcados desde la URL (`?clips=id1,id2`). */
  clipsIniciales?: string[]
  /** Lo que se está mirando PROPONE dónde va; no lo decide. */
  redesIniciales?: SocialId[]
  cuentaInicial?: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Anclado arriba, no centrado: el diálogo crece al marcar redes y al
          recentrarse saltaba bajo el cursor, así que el siguiente clic caía
          fuera. Creciendo hacia abajo, lo que ya está no se mueve. */}
      <DialogContent className="top-[4vh] max-h-[92vh] translate-y-0 overflow-y-auto sm:max-w-2xl">
        {/* La `key` reinicia el formulario cada vez que se abre con otros clips
            o en otro día: un borrador viejo no sobrevive al cierre */}
        {open && (
          <Compositor
            key={`${dia}|${clipsIniciales.join(",")}|${redesIniciales.join(",")}|${cuentaInicial ?? ""}`}
            zona={zona}
            dia={dia}
            clipsIniciales={clipsIniciales}
            redesIniciales={redesIniciales}
            cuentaInicial={cuentaInicial}
            onHecho={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

/** Los proyectos que tienen algún clip: los demás no se pueden programar. */
const proyectosConClips = sourceVideos.filter((v) =>
  todosLosClips.some((c) => c.sourceId === v.id)
)

/** La primera cuenta viva de cada red, que es la que se propone. */
function cuentasPorDefecto(cuentas: SocialAccount[]) {
  const mapa: Partial<Record<SocialId, string>> = {}
  for (const red of SOCIAL_IDS) {
    const primera = cuentasDeRed(red, cuentas)[0]
    if (primera) mapa[red] = primera.id
  }
  return mapa
}

/**
 * La clave con la que un aviso es «el mismo aviso»: su código y sus datos,
 * menos la duración del clip. Con `segundos` dentro, dos clips de 53 s y 54 s
 * daban dos renglones casi idénticos del mismo consejo, y con seis clips serían
 * seis. Diez clips con el mismo problema son un problema, no diez renglones.
 */
const claveAviso = (a: AvisoAgenda) => {
  const valores = { ...a.values }
  delete valores.segundos
  return `${a.code}|${JSON.stringify(valores)}`
}

function Compositor({
  zona,
  dia,
  clipsIniciales,
  redesIniciales,
  cuentaInicial,
  onHecho,
}: {
  zona: Zona
  dia: string
  clipsIniciales: string[]
  redesIniciales: SocialId[]
  cuentaInicial?: string
  onHecho: () => void
}) {
  const t = useTranslations("calendario.compositor")
  const te = useTranslations("calendario.compositor.errores")
  const fz = useFechasZona(zona)
  const { entradas, cuentas, programar } = useAgenda()

  const hoy = diaDe(AHORA_AGENDA, zona)
  /** La hora en punto siguiente al «ahora», derivada: nunca `Date.now()`. */
  const horaSiguiente = `${String(Math.min(23, partesEn(AHORA_AGENDA, zona).hora + 1)).padStart(2, "0")}:00`

  const marcados = todosLosClips.filter((c) => clipsIniciales.includes(c.id))
  /** Redes con alguna cuenta viva: no se ofrece publicar donde no se puede. */
  const redesDisponibles = SOCIAL_IDS.filter((r) => cuentasDeRed(r, cuentas).length > 0)
  const propuesta = cuentaPorId(cuentaInicial, cuentas)

  const [proyectoId, setProyectoId] = React.useState(
    marcados[0]?.sourceId ?? proyectosConClips[0]?.id ?? ""
  )
  const [seleccion, setSeleccion] = React.useState<string[]>(marcados.map((c) => c.id))
  /**
   * El filtro del calendario PROPONE dónde va; no lo decide. Las casillas se ven
   * marcadas, se pueden quitar y las demás redes siguen ahí: la lista no se
   * recorta nunca, y «Se crearán N publicaciones» sigue diciendo la verdad antes
   * de confirmar. Un recorte silencioso podría crear la publicación en el sitio
   * equivocado; una propuesta a la vista ahorra tres clics.
   */
  const [redes, setRedes] = React.useState<SocialId[]>(() =>
    redesDisponibles.filter((r) => redesIniciales.includes(r) || propuesta?.network === r)
  )
  const [cuentaPorRed, setCuentaPorRed] = React.useState(() => {
    const base = cuentasPorDefecto(cuentas)
    // Filtrado a una cuenta concreta, esa es la que se propone, no la primera
    return propuesta ? { ...base, [propuesta.network]: propuesta.id } : base
  })
  const [cuando, setCuando] = React.useState({
    dia: dia >= hoy ? dia : hoy,
    hora: horaSiguiente,
  })
  const [intento, setIntento] = React.useState(false)

  const delProyecto = todosLosClips.filter((c) => c.sourceId === proyectoId)
  // Un clip marcado sigue contando aunque se cambie de proyecto; el orden es el
  // de la biblioteca, que es el que se ve al marcarlos
  const elegidos = todosLosClips.filter((c) => seleccion.includes(c.id))

  const fechaValida =
    /^\d{4}-\d{2}-\d{2}$/.test(cuando.dia) && /^\d{2}:\d{2}/.test(cuando.hora)
  const [h, m] = cuando.hora.split(":").map(Number)
  // Un día a medio escribir daría una fecha inválida: `instanteDe` la
  // convertiría en `Invalid Date` y `toISOString` reventaría
  const instante = fechaValida
    ? instanteDe({ ...desdeDia(cuando.dia), hora: h, minuto: m }, zona)
    : ""

  const cuentaElegida = cuentaPorId(cuentaPorRed[redes[0]], cuentas)
  const dueno = cuentaElegida ? duenoCuenta(cuentaElegida) : "clipero"

  /**
   * Lo que se va a crear, con la misma función que después guarda: lo que se
   * enseña, lo que se valida y lo que se guarda son exactamente lo mismo.
   */
  const previstas: NuevaEntrada[] =
    fechaValida && elegidos.length > 0 && redes.length > 0
      ? repartir(elegidos, redes, cuentas, instante, SEPARACION_MINIMA_MIN, {
          zona,
          dueno,
          cuentaPorRed,
        })
      : []

  /* Validación: el dominio devuelve códigos y aquí se dicen en palabras */
  const avisos: AvisoAgenda[] = []
  if (elegidos.length === 0) avisos.push({ code: "sinClip", bloquea: BLOQUEA.sinClip })
  if (redes.length === 0) avisos.push({ code: "sinCuenta", bloquea: BLOQUEA.sinCuenta })
  // Un día sin escribir no «ha pasado»: falta
  if (!fechaValida) avisos.push({ code: "faltaFecha", bloquea: BLOQUEA.faltaFecha })
  /**
   * Cada prevista se valida contra la agenda MÁS las otras de esta tanda.
   *
   * Con solo `entradas`, cada publicación nueva se contaba como si fuera la
   * única: en un día vacío, `demasiadasHoy` siempre daba 1 y el consejo «serían
   * N publicaciones ese día en la misma cuenta» llegaba después de crearlas, no
   * antes. Los ids son de mentira porque `validarEntrada` solo mira la hora, la
   * red y la cuenta de las vecinas.
   */
  const comoEntradas: EntradaAgenda[] = previstas.map((n, i) => ({
    ...n,
    id: `prevista_${i}`,
    creadaEn: AHORA_AGENDA,
  }))
  for (const [i, n] of previstas.entries()) {
    avisos.push(
      ...validarEntrada(
        {
          clipId: n.clipId,
          red: n.red,
          cuentaId: n.cuentaId,
          programadaPara: n.programadaPara,
        },
        {
          clip: elegidos.find((c) => c.id === n.clipId),
          cuentas,
          // Todas menos ella misma: contarse a sí misma sumaría uno de más
          entradas: [...entradas, ...comoEntradas.filter((_, j) => j !== i)],
          zona,
          instante: AHORA_AGENDA,
        }
      )
    )
  }
  // Diez clips con el mismo problema son un problema, no diez renglones: se
  // agrupan y la frase dice cuántos son
  const unicos = new Map<string, AvisoAgenda>()
  const repeticiones = new Map<string, number>()
  for (const a of avisos) {
    const clave = claveAviso(a)
    if (!unicos.has(clave)) unicos.set(clave, a)
    repeticiones.set(clave, (repeticiones.get(clave) ?? 0) + 1)
  }
  const bloqueos = [...unicos.values()].filter((a) => a.bloquea)
  const consejos = [...unicos.values()].filter((a) => !a.bloquea)
  /**
   * Los que hablan de un hueco por rellenar («elige un clip») esperan a que se
   * pulse; los que hablan de algo ya escrito —una hora que ya pasó— se dicen al
   * momento, en vez de prometer dos publicaciones y desdecirse al pulsar.
   */
  const bloqueosVisibles = intento
    ? bloqueos
    : bloqueos.filter((a) => a.code !== "sinClip" && a.code !== "sinCuenta")

  /** Un código y sus datos crudos, dichos en el idioma de quien mira. */
  const frase = (a: AvisoAgenda) => {
    const v = a.values ?? {}
    // `n` es cuántos clips comparten el aviso, salvo que el propio aviso traiga
    // el suyo (el de «demasiadas ese día»)
    const cuantos = repeticiones.get(claveAviso(a)) ?? 1
    return te(a.code, {
      red: v.red ? SOCIAL_NETWORKS[v.red].name : "",
      aspecto: v.aspecto ?? "",
      segundos: v.segundos ?? 0,
      minutos: v.minutos ?? 0,
      min: v.min ?? 0,
      max: v.max ?? 0,
      n: v.n ?? cuantos,
    })
  }

  const alternarClip = (id: string) =>
    setSeleccion((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const alternarRed = (red: SocialId) =>
    setRedes((s) => (s.includes(red) ? s.filter((x) => x !== red) : [...s, red]))

  /** El aviso de lo que bloquea, para poder llevarlo a la vista y darle el foco. */
  const avisoBloqueos = React.useRef<HTMLElement>(null)

  const enviar = (e: React.FormEvent) => {
    e.preventDefault()
    setIntento(true)
    if (bloqueos.length > 0) {
      // Vive dentro del panel que se desplaza: si no se trae a la vista, pulsar
      // «Programar» no parecía hacer nada
      requestAnimationFrame(() => {
        avisoBloqueos.current?.scrollIntoView({ block: "nearest" })
        avisoBloqueos.current?.focus()
      })
      return
    }
    // Los ids se crean aquí, en el manejador, nunca al pintar
    const base = nuevoId("lot")
    const orden = new Map(elegidos.map((c, i) => [c.id, i]))
    const nuevas = repartir(elegidos, redes, cuentas, instante, SEPARACION_MINIMA_MIN, {
      zona,
      dueno,
      cuentaPorRed,
      loteId: base,
    }).map((n) => ({
      ...n,
      // Un lote es «el mismo clip en varias redes». Con una sola red cada clip
      // va por su cuenta: sin `loteId` propio se agruparían todos en uno solo
      loteId: n.loteId ?? `${base}_${orden.get(n.clipId ?? "") ?? 0}`,
    }))
    programar(nuevas)
    toast.success(t("programadas", { n: nuevas.length }), {
      // Cuándo caen: el calendario no salta al día elegido, así que si no se
      // dice aquí, uno programa y no ve nada cambiar
      description: t("programadasCuando", {
        fecha: fz.fechaHora(nuevas[0].programadaPara),
      }),
    })
    onHecho()
  }

  return (
    <form
      onSubmit={enviar}
      className="@container/compositor flex max-h-[84vh] flex-col gap-4"
    >
      <DialogHeader>
        <DialogTitle>{t("titulo")}</DialogTitle>
        <DialogDescription>{t("descripcion")}</DialogDescription>
      </DialogHeader>

      {/* La promesa, en el mismo cuerpo que todo lo demás: no es letra pequeña */}
      <p className="flex items-start gap-2 rounded-lg bg-primary/10 p-3 text-sm">
        <BellRing className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        {t("promesa")}
      </p>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto">
        <Field>
          <FieldLabel htmlFor="compositor-proyecto">{t("proyecto")}</FieldLabel>
          <Select value={proyectoId} onValueChange={setProyectoId}>
            <SelectTrigger id="compositor-proyecto" className="h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {proyectosConClips.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  <span className="truncate">{v.title}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <section aria-labelledby="compositor-clips" className="space-y-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 id="compositor-clips" className="text-sm font-semibold">
              {t("clips")}
            </h3>
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {t("clipsElegidos", { n: elegidos.length })}
            </p>
          </div>
          <SelectorClips
            clips={delProyecto}
            seleccion={seleccion}
            onToggle={alternarClip}
            idPrefijo="compositor"
          />
        </section>

        <section aria-labelledby="compositor-redes" className="space-y-2">
          <h3 id="compositor-redes" className="text-sm font-semibold">
            {t("redes")}
          </h3>
          {redesDisponibles.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("redesVacio")}</p>
          ) : (
            <ul className="grid gap-2">
              {redesDisponibles.map((red) => {
                const deLaRed = cuentasDeRed(red, cuentas)
                const marcada = redes.includes(red)
                const id = `compositor-red-${red}`
                return (
                  <li
                    key={red}
                    data-marcada={marcada || undefined}
                    className="flex flex-wrap items-center gap-3 rounded-xl bg-card p-2.5 ring-1 ring-border data-marcada:ring-primary/40"
                  >
                    <Checkbox
                      id={id}
                      checked={marcada}
                      onCheckedChange={() => alternarRed(red)}
                    />
                    <label
                      htmlFor={id}
                      className="flex flex-1 cursor-pointer items-center gap-2 text-sm font-medium"
                    >
                      {/* El nombre va escrito al lado: el logo no lo repite */}
                      <SocialGlyph
                        network={red}
                        tone="current"
                        className="size-4"
                        aria-hidden
                      />
                      {SOCIAL_NETWORKS[red].name}
                    </label>
                    {deLaRed.length > 1 ? (
                      /* Dos cuentas de la misma red: hay que decir cuál */
                      <Select
                        value={cuentaPorRed[red] ?? deLaRed[0].id}
                        onValueChange={(v) =>
                          setCuentaPorRed((s) => ({ ...s, [red]: v }))
                        }
                      >
                        <SelectTrigger
                          size="sm"
                          aria-label={t("cuentaDe", { red: SOCIAL_NETWORKS[red].name })}
                          className="w-full @sm/compositor:w-52"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {deLaRed.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.handle}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {deLaRed[0].handle}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby="compositor-cuando" className="space-y-2">
          <h3 id="compositor-cuando" className="text-sm font-semibold">
            {t("cuando")}
          </h3>
          <div className="grid gap-4 @lg/compositor:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="compositor-dia">{t("dia")}</FieldLabel>
              <Input
                id="compositor-dia"
                type="date"
                value={cuando.dia}
                min={hoy}
                // El error hablaba del día y el campo no se marcaba de nada
                aria-invalid={!fechaValida || undefined}
                onChange={(e) => setCuando((s) => ({ ...s, dia: e.target.value }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="compositor-hora">{t("hora")}</FieldLabel>
              <Input
                id="compositor-hora"
                type="time"
                value={cuando.hora}
                aria-invalid={!fechaValida || undefined}
                onChange={(e) => setCuando((s) => ({ ...s, hora: e.target.value }))}
              />
              <FieldDescription>
                {t("zonaAviso", {
                  ciudad: ciudadDeZona(zona),
                  desfase: etiquetaZona(zona, AHORA_AGENDA),
                })}
              </FieldDescription>
            </Field>
          </div>
          {previstas.length > 1 && (
            <p className="text-xs text-muted-foreground">
              {t("separacion", { min: SEPARACION_MINIMA_MIN })}
            </p>
          )}
        </section>

        {bloqueosVisibles.length > 0 && (
          <section
            ref={avisoBloqueos}
            tabIndex={-1}
            role="alert"
            aria-labelledby="compositor-bloqueos"
            className="space-y-1.5 rounded-lg bg-destructive/10 p-3 ring-1 ring-destructive/30 outline-none"
          >
            <h3
              id="compositor-bloqueos"
              className="flex items-center gap-2 text-sm font-semibold"
            >
              <AlertTriangle className="size-4 text-destructive" aria-hidden />
              {t("bloqueos")}
            </h3>
            <ul className="list-disc space-y-0.5 pl-8 text-sm">
              {bloqueosVisibles.map((a) => (
                <li key={claveAviso(a)}>{frase(a)}</li>
              ))}
            </ul>
          </section>
        )}

        {consejos.length > 0 && (
          <section
            aria-labelledby="compositor-consejos"
            className="space-y-1.5 rounded-lg bg-muted p-3"
          >
            <h3
              id="compositor-consejos"
              className="flex items-center gap-2 text-sm font-semibold"
            >
              <Info className="size-4 text-muted-foreground" aria-hidden />
              {t("consejos")}
            </h3>
            <ul className="list-disc space-y-0.5 pl-8 text-sm text-muted-foreground">
              {consejos.map((a) => (
                <li key={claveAviso(a)}>{frase(a)}</li>
              ))}
            </ul>
          </section>
        )}

        {previstas.length > 0 && (
          <section aria-labelledby="compositor-previo" className="space-y-2">
            <h3 id="compositor-previo" className="text-sm font-semibold">
              {t("previo")}
            </h3>
            <ul className="grid gap-1.5">
              {previstas.map((n) => (
                <li
                  key={`${n.clipId}-${n.red}-${n.programadaPara}`}
                  className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/60 px-2.5 py-1.5 text-sm"
                >
                  <span className="tabular font-medium">
                    {fz.fechaHora(n.programadaPara)}
                  </span>
                  <SocialGlyph
                    network={n.red}
                    tone="current"
                    className="size-3.5"
                    aria-hidden
                  />
                  <span className="text-muted-foreground">
                    {cuentaPorId(n.cuentaId, cuentas)?.handle}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{n.titulo}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Cuántas se van a crear, dicho antes de confirmar y no después */}
      <p className="text-sm font-medium" aria-live="polite">
        {/* Lo bloqueado no se cuenta: la línea decía «Se crearán 2
            publicaciones» justo debajo del recuadro rojo que lo impedía */}
        {t("resumen", { n: bloqueos.length > 0 ? 0 : previstas.length })}
      </p>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onHecho}>
          {t("cancelar")}
        </Button>
        <Button type="submit" variant="brand">
          <CalendarPlus /> {t("confirmar")}
        </Button>
      </DialogFooter>
    </form>
  )
}
