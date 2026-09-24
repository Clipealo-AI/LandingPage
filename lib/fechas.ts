/**
 * Aritmética de fechas civiles para el Calendario (docs/onboarding-2026-09.md
 * no la necesitaba; la pide la agenda de publicaciones).
 *
 * Aquí un **día** es una etiqueta («2026-09-13»), no un instante: el 13 de
 * septiembre empieza a horas distintas en Lima y en Madrid. Y un día no siempre
 * dura 24 horas: cuando cambia la hora dura 23 o 25, así que una rejilla semanal
 * que asuma 86.400.000 ms por día pinta mal dos veces al año.
 *
 * `lib/admin/dates.ts` sí puede seguir con meses UTC: allí se agregan importes,
 * no se coloca nada en una rejilla de horas.
 *
 * Sin librerías: `Intl` ya sabe todo esto y no pesa nada. Todo son funciones
 * puras; el instante «ahora» se pasa siempre desde fuera.
 */

/** Zona horaria IANA («America/Lima»). */
export type Zona = string

/** Etiqueta de un día civil, «2026-09-13». No es un instante. */
export type Dia = string

/** Un mes civil, «2026-09». */
export type Mes = string

export interface Civil {
  anio: number
  mes: number
  dia: number
  hora: number
  minuto: number
}

/** Perú es el país por defecto de la cuenta (`perfilInicial.pais`). */
export const ZONA_POR_DEFECTO: Zona = "America/Lima"

/**
 * EL «AHORA» DE LA DEMO.
 *
 * Todo lo que se pinta cuelga de este instante: campañas (`HOY_CAMPANAS`),
 * calendario (`AHORA_AGENDA`), analíticas (`INDEXADO_EN`) y la antigüedad de
 * los proyectos. Vive aquí, en el módulo de fechas, porque no depende de nada
 * y así nadie tiene que arrastrar el dominio de campañas para saber qué hora
 * es; estaba copiado literal en cuatro sitios y una copia ya iba cinco días
 * atrasada, así que el panel decía «hace 5 días» de lo que el calendario ponía
 * hoy.
 *
 * `new Date()` mientras se pinta provoca desajuste de hidratación: el instante
 * lo pone siempre quien llama, y en la demo es este.
 */
export const AHORA_DEMO = "2026-09-13T12:20:00.000Z"

/**
 * La semana empieza en lunes en los tres idiomas. Es la convención que el
 * producto ya enseña (`Weekday` del panel: «lun»…«dom», y su traducción
 * «Mon»…«Sun» en ese mismo orden); hacerlo por idioma dejaría el panel y el
 * calendario contradiciéndose.
 */
export const PRIMER_DIA = 1

const MINUTO_MS = 60_000
const DIA_MS = 86_400_000

const dosCifras = (n: number) => String(n).padStart(2, "0")

/** Formateador por zona, memorizado: crear uno por celda sería carísimo. */
const formateadores = new Map<Zona, Intl.DateTimeFormat>()

function formateador(zona: Zona): Intl.DateTimeFormat {
  let f = formateadores.get(zona)
  if (!f) {
    f = new Intl.DateTimeFormat("en-CA", {
      timeZone: zona,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
    formateadores.set(zona, f)
  }
  return f
}

/** La hora civil de un instante en una zona. */
export function partesEn(iso: string | number | Date, zona: Zona): Civil {
  const partes = formateador(zona).formatToParts(new Date(iso))
  const de = (tipo: Intl.DateTimeFormatPartTypes) =>
    Number(partes.find((p) => p.type === tipo)?.value ?? 0)
  return {
    anio: de("year"),
    mes: de("month"),
    dia: de("day"),
    // A medianoche, `hourCycle: "h23"` da 0; algunos motores devuelven 24
    hora: de("hour") % 24,
    minuto: de("minute"),
  }
}

/** El día civil de un instante en una zona. */
export function diaDe(iso: string | number | Date, zona: Zona): Dia {
  const { anio, mes, dia } = partesEn(iso, zona)
  return `${anio}-${dosCifras(mes)}-${dosCifras(dia)}`
}

/** Minutos desde la medianoche: la posición vertical de una tarjeta. */
export function minutosDelDia(iso: string | number | Date, zona: Zona): number {
  const { hora, minuto } = partesEn(iso, zona)
  return hora * 60 + minuto
}

/** Diferencia entre la zona y UTC, en minutos, para un instante dado. */
function desfase(ms: number, zona: Zona): number {
  const { anio, mes, dia, hora, minuto } = partesEn(ms, zona)
  const comoUtc = Date.UTC(anio, mes - 1, dia, hora, minuto)
  // El instante original puede llevar segundos: se recortan a la baja
  return Math.round((comoUtc - Math.floor(ms / MINUTO_MS) * MINUTO_MS) / MINUTO_MS)
}

/**
 * El instante en que esa hora civil ocurre en esa zona.
 *
 * Dos pasadas: la primera resta el desfase de una estimación, la segunda lo
 * corrige si la estimación cayó al otro lado de un cambio de hora. En la hora
 * que no existe (la madrugada en que el reloj salta) devuelve la hora siguiente,
 * que es lo que hace todo el mundo; en la repetida, la primera de las dos.
 */
export function instanteDe(civil: Civil, zona: Zona): string {
  const utc = Date.UTC(civil.anio, civil.mes - 1, civil.dia, civil.hora, civil.minuto)
  let ms = utc - desfase(utc, zona) * MINUTO_MS
  ms = utc - desfase(ms, zona) * MINUTO_MS
  return new Date(ms).toISOString()
}

/** El instante en que empieza un día civil. */
export const inicioDelDia = (dia: Dia, zona: Zona): string =>
  instanteDe({ ...desdeDia(dia), hora: 0, minuto: 0 }, zona)

/** Descompone una etiqueta de día. */
export function desdeDia(dia: Dia): { anio: number; mes: number; dia: number } {
  const [anio, mes, d] = dia.split("-").map(Number)
  return { anio, mes, dia: d }
}

/** Etiqueta de día de una fecha civil. */
export const aDia = (c: { anio: number; mes: number; dia: number }): Dia =>
  `${c.anio}-${dosCifras(c.mes)}-${dosCifras(c.dia)}`

/**
 * Suma días a una etiqueta. Se hace sobre la fecha civil con `Date.UTC`, no
 * sumando milisegundos: un día no siempre dura 24 horas, pero el calendario
 * siempre avanza de casilla en casilla.
 */
export function sumarDias(dia: Dia, n: number): Dia {
  const { anio, mes, dia: d } = desdeDia(dia)
  const t = new Date(Date.UTC(anio, mes - 1, d + n))
  return `${t.getUTCFullYear()}-${dosCifras(t.getUTCMonth() + 1)}-${dosCifras(t.getUTCDate())}`
}

/** Días entre dos etiquetas (b − a). Exacto: son fechas civiles. */
export function diasEntre(a: Dia, b: Dia): number {
  const x = desdeDia(a)
  const y = desdeDia(b)
  return Math.round(
    (Date.UTC(y.anio, y.mes - 1, y.dia) - Date.UTC(x.anio, x.mes - 1, x.dia)) / DIA_MS
  )
}

/** Día de la semana, 0 domingo a 6 sábado. */
export function diaSemana(dia: Dia): number {
  const { anio, mes, dia: d } = desdeDia(dia)
  return new Date(Date.UTC(anio, mes - 1, d)).getUTCDay()
}

/** El lunes de esa semana. */
export function inicioDeSemana(dia: Dia): Dia {
  const dif = (diaSemana(dia) - PRIMER_DIA + 7) % 7
  return sumarDias(dia, -dif)
}

/** Los siete días de la semana a la que pertenece, de lunes a domingo. */
export function diasDeLaSemana(dia: Dia): Dia[] {
  const lunes = inicioDeSemana(dia)
  return Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i))
}

/** El mes de un día. */
export const mesDe = (dia: Dia): Mes => dia.slice(0, 7)

/**
 * Las semanas de un mes, completas: empiezan en lunes y acaban en domingo, así
 * que la primera y la última traen días del mes de al lado.
 */
export function semanasDelMes(mes: Mes): Dia[][] {
  const primero = `${mes}-01`
  const [anio, m] = mes.split("-").map(Number)
  const ultimo = aDia({ anio, mes: m, dia: new Date(Date.UTC(anio, m, 0)).getUTCDate() })
  const semanas: Dia[][] = []
  for (let d = inicioDeSemana(primero); diasEntre(d, ultimo) >= 0; d = sumarDias(d, 7)) {
    semanas.push(diasDeLaSemana(d))
  }
  return semanas
}

/**
 * El mes N meses después, o antes con N negativo. Se cuenta en meses y no en
 * días a propósito: sumar 30 días a enero no da febrero y sumar 31 se lo salta
 * entero. `Date.UTC` normaliza los dos desbordamientos, el de diciembre hacia
 * arriba y el de enero hacia abajo (mes −1 es el diciembre anterior).
 */
export function sumarMeses(mes: Mes, n: number): Mes {
  const [anio, m] = mes.split("-").map(Number)
  const d = new Date(Date.UTC(anio, m - 1 + n, 1))
  return `${d.getUTCFullYear()}-${dosCifras(d.getUTCMonth() + 1)}`
}

/**
 * Horas que dura un día en esa zona: 24 casi siempre, 23 el día que el reloj se
 * adelanta y 25 el que se atrasa. Se calcula restando dos medianoches, nunca
 * escribiendo 24 a mano.
 */
export function horasDelDia(dia: Dia, zona: Zona): number {
  const a = Date.parse(inicioDelDia(dia, zona))
  const b = Date.parse(inicioDelDia(sumarDias(dia, 1), zona))
  return Math.round((b - a) / 3_600_000)
}

/** ¿Ese día es hoy, según el instante que se le pase? */
export const esHoy = (dia: Dia, ahora: string, zona: Zona) => diaDe(ahora, zona) === dia

/** ¿El instante cae dentro de ese día civil? */
export function esDelDia(iso: string, dia: Dia, zona: Zona): boolean {
  return diaDe(iso, zona) === dia
}

/** La zona del navegador, o la de casa si no se puede saber. Solo en efectos. */
export function zonaDelNavegador(): Zona {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || ZONA_POR_DEFECTO
  } catch {
    return ZONA_POR_DEFECTO
  }
}

/** Todas las zonas IANA que conoce el navegador, para el selector. */
export function zonasDisponibles(): Zona[] {
  try {
    const conocidas = (
      Intl as unknown as { supportedValuesOf?: (clave: string) => string[] }
    ).supportedValuesOf?.("timeZone")
    return conocidas?.length ? conocidas : [ZONA_POR_DEFECTO]
  } catch {
    return [ZONA_POR_DEFECTO]
  }
}

/**
 * El desfase escrito como lo espera la gente: «GMT-5». Se calcula para un
 * instante concreto porque en verano cambia.
 */
export function etiquetaZona(zona: Zona, ahora: string): string {
  try {
    const partes = new Intl.DateTimeFormat("en-US", {
      timeZone: zona,
      timeZoneName: "shortOffset",
    }).formatToParts(new Date(ahora))
    return partes.find((p) => p.type === "timeZoneName")?.value ?? "GMT"
  } catch {
    return "GMT"
  }
}

/** El nombre de la ciudad de una zona («America/Lima» → «Lima»). */
export const ciudadDeZona = (zona: Zona) =>
  zona.split("/").pop()?.replace(/_/g, " ") ?? zona
