import type { Locale } from "@/i18n/routing"
import { MONEDA } from "@/lib/pricing"

/**
 * Formateadores compartidos. Todo lo que se pinta en pantalla como numero
 * pasa por aqui, para que un clip nunca muestre "1:5" en un sitio y "01:05"
 * en otro.
 *
 * Lo que depende del idioma (separadores, meses, «hace 3 h») sale de
 * `getFormat(locale)`; en componentes, `useFormat()` de `hooks/use-format.ts`.
 * Las funciones sueltas `formatX` son la versión en español y quedan para los
 * tests y para código sin idioma: en la interfaz, siempre `useFormat()`.
 */

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max)

/** Configuración regional de `Intl` de cada idioma de la interfaz. */
const INTL: Record<Locale, string> = {
  es: "es-ES",
  en: "en-US",
  pt: "pt-BR",
}

/**
 * Timecode legible. Omite la hora si el video dura menos de una. Igual en
 * todos los idiomas.
 *   65      -> "1:05"
 *   3725    -> "1:02:05"
 *   65.4 f  -> "1:05.400" con `frames`
 */
export function formatTimecode(
  seconds: number,
  opts?: { millis?: boolean; forceHours?: boolean }
) {
  const total = Math.max(0, seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = Math.floor(total % 60)
  const pad = (n: number) => String(n).padStart(2, "0")

  const base = h > 0 || opts?.forceHours ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`

  if (!opts?.millis) return base
  const ms = Math.floor((total % 1) * 1000)
  return `${base}.${String(ms).padStart(3, "0")}`
}

/** Duracion en prosa: "1 min 05 s". Las unidades son las mismas en los tres idiomas. */
export function formatDuration(seconds: number) {
  const total = Math.max(0, Math.round(seconds))
  if (total < 60) return `${total} s`
  const m = Math.floor(total / 60)
  const s = total % 60
  if (m < 60) return s === 0 ? `${m} min` : `${m} min ${String(s).padStart(2, "0")} s`
  const h = Math.floor(m / 60)
  return `${h} h ${String(m % 60).padStart(2, "0")} min`
}

const BYTE_UNITS = ["B", "KB", "MB", "GB", "TB"] as const

/** Tipo de lista de `Format.list`: «a, b y c» · «a, b o c» · medidas. */
export type TipoLista = "conjunction" | "disjunction" | "unit"

const RELATIVE_STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["second", 60],
  ["minute", 60],
  ["hour", 24],
  ["day", 7],
  ["week", 4.348],
  ["month", 12],
  ["year", Infinity],
]

function createFormat(locale: Locale) {
  const tag = INTL[locale]
  // Español separa el signo de porcentaje («64,5 %»); inglés y portugués de Brasil, no
  const pct = locale === "es" ? " %" : "%"

  /**
   * Construir un `Intl.NumberFormat` cuesta más que usarlo, y estos tres se
   * llaman una vez por celda: una tabla del backoffice o una rejilla de
   * campañas levantan cientos por render. Se guardan por número de decimales.
   *
   * Tres mapas y no uno: aunque coincidan los decimales, las tres
   * configuraciones son distintas —`money` agrupa los millares siempre,
   * `fixed` no agrupa y fija los decimales, `delta` no agrupa y deja el mínimo
   * en cero—, así que compartir mapa haría que el primero en llegar le robara
   * el formato a los otros dos.
   */
  const deMoney = new Map<number, Intl.NumberFormat>()
  const deFixed = new Map<number, Intl.NumberFormat>()
  const deDelta = new Map<number, Intl.NumberFormat>()
  const guardado = (
    mapa: Map<number, Intl.NumberFormat>,
    clave: number,
    crear: () => Intl.NumberFormat
  ) => {
    let formateador = mapa.get(clave)
    if (!formateador) {
      formateador = crear()
      mapa.set(clave, formateador)
    }
    return formateador
  }

  const fixed = (value: number, decimals: number) =>
    guardado(
      deFixed,
      decimals,
      () =>
        new Intl.NumberFormat(tag, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
          useGrouping: false,
        })
    ).format(value)

  const compactFormatter = new Intl.NumberFormat(tag, {
    notation: "compact",
    maximumFractionDigits: 1,
  })
  const numberFormatter = new Intl.NumberFormat(tag)
  /**
   * Con separador de millares SIEMPRE. es-ES y pt-BR no agrupan las cifras de
   * cuatro dígitos («5000») y entonces conviven con los «1.000» que llevan
   * escritos los propios mensajes, en la misma tarjeta y a dos renglones.
   *
   * Va aquí y no en un esqueleto ICU (`::group-always`) porque el parser de
   * `intl-messageformat` no traduce ese token: lo ignora y deja «1000».
   */
  const groupedFormatter = new Intl.NumberFormat(tag, { useGrouping: "always" })
  const relativeFormatter = new Intl.RelativeTimeFormat(tag, { numeric: "auto" })
  const dateFormatter = new Intl.DateTimeFormat(tag, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
  // Igual que `dateFormatter` mas la hora: para registros donde dos filas caen el
  // mismo dia y la fecha sola no distingue cual fue antes
  const dateTimeFormatter = new Intl.DateTimeFormat(tag, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
  const monthFormatter = new Intl.DateTimeFormat(tag, { month: "long", year: "numeric" })
  const shortMonthFormatter = new Intl.DateTimeFormat(tag, { month: "short" })
  const listFormatters: Partial<Record<TipoLista, Intl.ListFormat>> = {}

  return {
    locale,
    timecode: formatTimecode,
    duration: formatDuration,

    bytes(bytes: number, decimals = 1) {
      if (bytes <= 0) return "0 B"
      const i = clamp(
        Math.floor(Math.log(bytes) / Math.log(1024)),
        0,
        BYTE_UNITS.length - 1
      )
      return `${fixed(bytes / 1024 ** i, i === 0 ? 0 : decimals)} ${BYTE_UNITS[i]}`
    },

    /** 12400 -> "12,4 mil" · "12.4K". Para metricas de tarjetas. */
    compact(value: number) {
      return compactFormatter.format(value)
    },

    number(value: number) {
      return numberFormatter.format(value)
    },

    /** 1000 -> «1.000». Para las cifras que conviven con millares escritos. */
    grouped(value: number) {
      return groupedFormatter.format(value)
    },

    percent(value: number, decimals = 0) {
      return `${fixed(value, decimals)}${pct}`
    },

    /** "hace 3 h" · "3 hours ago". Estable en servidor y cliente si le pasas `now`. */
    relative(date: string | Date, now: Date = new Date()) {
      const target = typeof date === "string" ? new Date(date) : date
      let delta = (target.getTime() - now.getTime()) / 1000

      for (const [unit, size] of RELATIVE_STEPS) {
        if (Math.abs(delta) < size)
          return relativeFormatter.format(Math.round(delta), unit)
        delta /= size
      }
      return relativeFormatter.format(Math.round(delta), "year")
    },

    date(date: string | Date) {
      return dateFormatter.format(typeof date === "string" ? new Date(date) : date)
    },

    /**
     * Fecha con hora: «15 sept 2026, 09:41» · "Sep 15, 2026, 09:41 AM". Para el
     * historial de consentimientos y cualquier registro con varias entradas del
     * mismo dia. Sale en la zona horaria de quien mira, asi que el nodo que lo
     * pinta necesita `suppressHydrationWarning` si tambien se renderiza en el
     * servidor.
     */
    dateTime(date: string | Date) {
      return dateTimeFormatter.format(typeof date === "string" ? new Date(date) : date)
    },

    /**
     * Importe en la moneda de los precios: "US$ 1.633" · "US$ 9,17" · "US$1,633".
     * Mismo símbolo que la web (`MONEDA` de `lib/pricing.ts`): «$» a secas se
     * confunde con el peso en México, Chile, Colombia o Argentina. Los decimales
     * se enseñan solo cuando aportan (importes pequeños o pedidos explícitamente):
     * en un KPI, "US$ 1.633,00" es ruido.
     */
    money(value: number, opts?: { decimals?: number; signed?: boolean }) {
      const decimals =
        opts?.decimals ?? (Math.abs(value) < 100 && value % 1 !== 0 ? 2 : 0)
      // es-ES no agrupa los millares por debajo de 10.000; en dinero sí se espera «1.633»
      const abs = guardado(
        deMoney,
        decimals,
        () =>
          new Intl.NumberFormat(tag, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
            useGrouping: "always",
          })
      ).format(Math.abs(value))
      const sign = value < 0 ? "−" : opts?.signed && value > 0 ? "+" : ""
      // En inglés el símbolo va pegado («US$1,633»); en español y portugués, con espacio
      return `${sign}${MONEDA}${locale === "en" ? "" : " "}${abs}`
    },

    /** "2026-09" -> "septiembre de 2026" · con `capital`, "Septiembre de 2026". */
    month(month: string, opts?: { capital?: boolean }) {
      const s = monthFormatter.format(new Date(`${month}-15T12:00:00Z`))
      return opts?.capital ? s.charAt(0).toUpperCase() + s.slice(1) : s
    },

    /** "2026-09" -> "sept" · "Sep" · "set". Para ejes de gráfica. */
    monthShort(month: string) {
      return shortMonthFormatter
        .format(new Date(`${month}-15T12:00:00Z`))
        .replace(".", "")
    },

    /**
     * Lista en prosa del idioma: "PayPal, Transferencia y Yape" ·
     * "PayPal, Bank transfer, and Yape" · "PayPal, Transferência e Yape".
     * `disjunction` usa «o» · "or" · «ou»; `unit` es para medidas ("1 h, 5 min y 3 s").
     */
    list(items: readonly string[], type: TipoLista = "conjunction") {
      let formatter = listFormatters[type]
      if (!formatter) {
        formatter = new Intl.ListFormat(tag, { style: "long", type })
        listFormatters[type] = formatter
      }
      return formatter.format(items)
    },

    /** Variacion en puntos porcentuales con signo: "+12,4 %" · "−3 %". */
    delta(value: number, decimals = 1) {
      const abs = guardado(
        deDelta,
        decimals,
        () =>
          new Intl.NumberFormat(tag, {
            minimumFractionDigits: 0,
            maximumFractionDigits: decimals,
            useGrouping: false,
          })
      ).format(Math.abs(value))
      return `${value < 0 ? "−" : "+"}${abs}${pct}`
    },
  }
}

export type Format = ReturnType<typeof createFormat>

const cache = new Map<Locale, Format>()

/** Formateadores del idioma, creados una vez por idioma. */
export function getFormat(locale: Locale): Format {
  let format = cache.get(locale)
  if (!format) {
    format = createFormat(locale)
    cache.set(locale, format)
  }
  return format
}

// Versión en español, para tests y código sin idioma. En la interfaz, `useFormat()`.
const es = getFormat("es")
export const formatBytes = es.bytes
export const formatCompact = es.compact
export const formatNumber = es.number
export const formatPercent = es.percent
export const formatRelative = es.relative
export const formatDate = es.date
export const formatDateTime = es.dateTime
export const formatMoney = es.money
export const formatMonth = es.month
export const formatMonthShort = es.monthShort
export const formatDelta = es.delta
export const formatList = es.list

/* ---------------------------------------------------------------------------
   Fechas con zona horaria: lo que necesita el Calendario
   --------------------------------------------------------------------------- */

/**
 * Formateadores atados a una zona horaria concreta. El resto de la app pinta
 * fechas en la zona de quien mira (`date`, `dateTime`); la agenda no puede: una
 * publicación programada a las 19:00 en Lima es a las 19:00 en Lima aunque la
 * mire alguien desde Madrid, así que la zona se pasa y se dice en pantalla.
 *
 * La hora sale como la escribe cada idioma: «19:00» en español y portugués,
 * «7:00 PM» en inglés.
 */
export function createFechasZona(locale: Locale, zona: string) {
  const tag = INTL[locale]
  const hora = new Intl.DateTimeFormat(tag, {
    timeZone: zona,
    hour: "numeric",
    minute: "2-digit",
  })
  const diaCorto = new Intl.DateTimeFormat(tag, { timeZone: zona, weekday: "short" })
  const diaLargo = new Intl.DateTimeFormat(tag, { timeZone: zona, weekday: "long" })
  const diaYMes = new Intl.DateTimeFormat(tag, {
    timeZone: zona,
    day: "numeric",
    month: "short",
  })
  const fechaLarga = new Intl.DateTimeFormat(tag, {
    timeZone: zona,
    weekday: "long",
    day: "numeric",
    month: "long",
  })
  const fechaHora = new Intl.DateTimeFormat(tag, {
    timeZone: zona,
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  })
  const mesLargo = new Intl.DateTimeFormat(tag, {
    timeZone: zona,
    month: "long",
    year: "numeric",
  })

  const enFecha = (x: string | number | Date) => (x instanceof Date ? x : new Date(x))

  return {
    zona,
    /** «19:00» · "7:00 PM" */
    hora: (x: string | number | Date) => hora.format(enFecha(x)),
    /** «lun» · "Mon" */
    diaCorto: (x: string | number | Date) => diaCorto.format(enFecha(x)),
    /** «lunes» · "Monday" */
    diaLargo: (x: string | number | Date) => diaLargo.format(enFecha(x)),
    /** «13 sept» */
    diaYMes: (x: string | number | Date) => diaYMes.format(enFecha(x)),
    /** «domingo, 13 de septiembre» */
    fechaLarga: (x: string | number | Date) => fechaLarga.format(enFecha(x)),
    /** «13 sept, 19:00» */
    fechaHora: (x: string | number | Date) => fechaHora.format(enFecha(x)),
    /** «septiembre de 2026» */
    mes: (x: string | number | Date) => mesLargo.format(enFecha(x)),
    /** «7–13 sept»: el título de la semana, con el guion del idioma. */
    rango: (desde: string | number | Date, hasta: string | number | Date) =>
      diaYMes.formatRange(enFecha(desde), enFecha(hasta)),
  }
}

export type FechasZona = ReturnType<typeof createFechasZona>

const cacheZonas = new Map<string, FechasZona>()

/** Formateadores de (idioma, zona), creados una sola vez por combinación. */
export function getFechasZona(locale: Locale, zona: string): FechasZona {
  const clave = `${locale}|${zona}`
  let f = cacheZonas.get(clave)
  if (!f) {
    f = createFechasZona(locale, zona)
    cacheZonas.set(clave, f)
  }
  return f
}

/** Posicion 0–1 dentro de un rango; util para pintar la linea de tiempo. */
export function progressOf(value: number, start: number, end: number) {
  if (end <= start) return 0
  return clamp((value - start) / (end - start), 0, 1)
}

export { clamp }
