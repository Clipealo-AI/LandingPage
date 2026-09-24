import { escalonDe, type PlanRef } from "@/lib/pricing"
import type {
  Clip,
  SourceVideo,
  Speaker,
  TimelineTrack,
  TranscriptCue,
} from "@/lib/types"

/**
 * Datos de demostracion del arquetipo. Todo es determinista a proposito:
 * un `Math.random()` aqui provoca desajuste de hidratacion en cuanto el
 * componente se renderiza en servidor y cliente.
 *
 * Sustituye este modulo por tus llamadas reales; los componentes solo
 * dependen de los tipos de `lib/types.ts`.
 */

/** PRNG con semilla — misma entrada, misma salida en servidor y cliente. */
export function seededNoise(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0xffffffff
  }
}

/**
 * Forma de onda sintetica con picos donde hay "momentos fuertes".
 *
 * El resultado se redondea a tres decimales a proposito: `Math.exp` puede
 * diferir en el ultimo bit entre el V8 de Node y el del navegador, y con
 * flotantes en crudo el `height` calculado en servidor y en cliente sale con
 * distinto numero de decimales -> desajuste de hidratacion.
 */
export function buildWaveform(
  bars: number,
  seed = 7,
  peaks: number[] = [0.22, 0.55, 0.78]
) {
  const rnd = seededNoise(seed)
  return Array.from({ length: bars }, (_, i) => {
    const t = i / (bars - 1)
    const peak = peaks.reduce((acc, p) => acc + Math.exp(-(((t - p) * 9) ** 2)), 0)
    const base = 0.28 + rnd() * 0.3
    return Math.round(Math.min(1, base + peak * 0.55) * 1000) / 1000
  })
}

export const speakers: Speaker[] = [
  { id: "sp1", name: "Ana Ruiz", color: "var(--color-blue-500)" },
  { id: "sp2", name: "Invitado", color: "var(--color-brand-500)" },
]

export const sourceVideos: SourceVideo[] = [
  {
    id: "src_01",
    title: "Podcast #42 — Cómo escalar un equipo remoto",
    duration: 4_812,
    sizeBytes: 2_640_000_000,
    uploadedAt: "2026-09-06T09:12:00.000Z",
    status: "listo",
    stage: "listo",
    progress: 100,
    clipCount: 6,
    language: "es",
  },
  {
    id: "src_02",
    title: "Directo — Preguntas y respuestas de septiembre",
    duration: 3_190,
    sizeBytes: 1_820_000_000,
    uploadedAt: "2026-09-07T17:40:00.000Z",
    status: "procesando",
    stage: "analizando",
    progress: 62,
    clipCount: 0,
    language: "es",
  },
  {
    id: "src_03",
    title: "Masterclass — Estructura narrativa en 20 minutos",
    duration: 1_265,
    sizeBytes: 740_000_000,
    uploadedAt: "2026-09-08T08:05:00.000Z",
    status: "en-cola",
    stage: "subiendo",
    progress: 18,
    clipCount: 0,
    language: "es",
  },
  {
    id: "src_04",
    title: "Entrevista — Product-market fit sin inversión",
    duration: 2_734,
    sizeBytes: 1_130_000_000,
    uploadedAt: "2026-09-02T11:25:00.000Z",
    status: "error",
    stage: "transcribiendo",
    progress: 34,
    clipCount: 0,
    language: "es",
  },
  {
    id: "src_05",
    title: "Webinar — Poner precio sin pedir perdón",
    duration: 2_180,
    sizeBytes: 960_000_000,
    uploadedAt: "2026-08-28T16:10:00.000Z",
    status: "listo",
    stage: "listo",
    progress: 100,
    clipCount: 4,
    language: "es",
  },
]

export const clips: Clip[] = [
  {
    id: "clip_01",
    sourceId: "src_01",
    title: "El error de contratar por zona horaria",
    hook: "«Contratamos por husos horarios y perdimos a la mejor diseñadora del equipo.»",
    range: { start: 612, end: 665 },
    aspect: "9:16",
    score: 94,
    tags: ["contratación", "remoto", "error"],
    hasCaptions: true,
    status: "publicado",
    createdAt: "2026-09-06T10:02:00.000Z",
    metrics: { views: 128_400, likes: 9_120, shares: 1_840, retention: 71 },
  },
  {
    id: "clip_02",
    sourceId: "src_01",
    title: "La regla de las tres reuniones",
    hook: "«Si algo necesita tres reuniones, el problema no es la agenda: es la decisión.»",
    range: { start: 1_204, end: 1_251 },
    aspect: "9:16",
    score: 88,
    tags: ["procesos", "reuniones"],
    hasCaptions: true,
    status: "publicado",
    createdAt: "2026-09-06T10:04:00.000Z",
    metrics: { views: 42_300, likes: 3_410, shares: 620, retention: 64 },
  },
  {
    id: "clip_03",
    sourceId: "src_01",
    title: "Documentar es un acto de respeto",
    hook: "«Escribirlo cuesta veinte minutos. No escribirlo cuesta veinte personas preguntando.»",
    range: { start: 2_050, end: 2_106 },
    aspect: "1:1",
    score: 81,
    tags: ["cultura", "documentación"],
    hasCaptions: true,
    status: "publicado",
    createdAt: "2026-09-06T10:06:00.000Z",
    metrics: { views: 18_900, likes: 1_260, shares: 214, retention: 58 },
  },
  {
    id: "clip_04",
    sourceId: "src_01",
    title: "Nadie se va por el sueldo",
    hook: "«Nadie se va por el sueldo. Se va por el jefe, y el sueldo le da la excusa.»",
    range: { start: 2_890, end: 2_944 },
    aspect: "9:16",
    score: 92,
    tags: ["liderazgo", "retención"],
    hasCaptions: true,
    status: "borrador",
    createdAt: "2026-09-06T10:09:00.000Z",
  },
  {
    id: "clip_05",
    sourceId: "src_01",
    title: "Onboarding en 48 horas",
    hook: "«Si en dos días no ha entregado algo a producción, el onboarding falló.»",
    range: { start: 3_402, end: 3_449 },
    aspect: "4:5",
    score: 76,
    tags: ["onboarding"],
    hasCaptions: false,
    status: "borrador",
    createdAt: "2026-09-06T10:11:00.000Z",
  },
  {
    id: "clip_06",
    sourceId: "src_01",
    title: "El coste real de una mala primera semana",
    hook: "«Una mala primera semana se paga durante seis meses.»",
    range: { start: 4_010, end: 4_063 },
    aspect: "9:16",
    score: 69,
    tags: ["onboarding", "coste"],
    hasCaptions: true,
    status: "listo",
    createdAt: "2026-09-06T10:14:00.000Z",
    metrics: { views: 7_400, likes: 480, shares: 61, retention: 49 },
  },
  {
    id: "clip_07",
    sourceId: "src_05",
    title: "Subir el precio no espanta a quien te iba a comprar",
    hook: "«El que se va por veinte euros no se iba a quedar por nada.»",
    range: { start: 318, end: 366 },
    aspect: "9:16",
    score: 90,
    tags: ["precios", "clientes"],
    hasCaptions: true,
    status: "listo",
    createdAt: "2026-08-28T17:02:00.000Z",
  },
  {
    id: "clip_08",
    sourceId: "src_05",
    title: "El descuento que te cuesta el cliente bueno",
    hook: "«Cada descuento le dice al que pagó entero que hizo el tonto.»",
    range: { start: 742, end: 795 },
    aspect: "9:16",
    score: 84,
    tags: ["precios", "descuentos"],
    hasCaptions: true,
    status: "listo",
    createdAt: "2026-08-28T17:05:00.000Z",
  },
  {
    id: "clip_09",
    sourceId: "src_05",
    title: "Cobrar por resultado suena bien hasta que lo haces",
    hook: "«Cobrar por resultado es cobrar por lo que no controlas.»",
    range: { start: 1_330, end: 1_382 },
    aspect: "1:1",
    score: 77,
    tags: ["precios", "modelo"],
    hasCaptions: false,
    status: "borrador",
    createdAt: "2026-08-28T17:09:00.000Z",
  },
  {
    id: "clip_10",
    sourceId: "src_05",
    title: "Tu precio dice a quién quieres como cliente",
    hook: "«El precio es la primera frase de tu posicionamiento.»",
    range: { start: 1_908, end: 1_954 },
    aspect: "9:16",
    score: 73,
    tags: ["precios", "posicionamiento"],
    hasCaptions: true,
    status: "borrador",
    createdAt: "2026-08-28T17:12:00.000Z",
  },
]

/**
 * La transcripción del proyecto `src_01`. Se exporta suelta porque el estudio
 * la usaba antes de que hubiera dos proyectos con clips; lo nuevo pasa por
 * `transcriptDe`, que es lo que necesita la ficha de un clip.
 */
export const transcript: TranscriptCue[] = [
  {
    id: "c1",
    start: 600,
    end: 606.5,
    speaker: "sp1",
    text: "Al principio lo hicimos como todo el mundo: buscábamos gente en nuestra franja horaria.",
  },
  {
    id: "c2",
    start: 606.5,
    end: 612,
    speaker: "sp1",
    text: "Parecía lo sensato. Reuniones fáciles, respuestas rápidas.",
  },
  {
    id: "c3",
    start: 612,
    end: 619.4,
    speaker: "sp2",
    text: "Contratamos por husos horarios y perdimos a la mejor diseñadora del equipo.",
    highlighted: true,
  },
  {
    id: "c4",
    start: 619.4,
    end: 627,
    speaker: "sp2",
    text: "Estaba en Buenos Aires, se solapaba tres horas con nosotros y decidimos que no era suficiente.",
    highlighted: true,
  },
  {
    id: "c5",
    start: 627,
    end: 636.2,
    speaker: "sp1",
    text: "Seis meses después montamos el equipo entero en asíncrono y ella ya trabajaba para la competencia.",
    highlighted: true,
  },
  {
    id: "c6",
    start: 636.2,
    end: 644,
    speaker: "sp2",
    text: "La lección no es «contrata en cualquier sitio». Es que el solapamiento no es el problema que crees.",
    highlighted: true,
  },
  {
    id: "c7",
    start: 644,
    end: 652.8,
    speaker: "sp1",
    text: "El problema es no tener escrito cómo se decide algo cuando no estáis conectados a la vez.",
  },
  {
    id: "c8",
    start: 652.8,
    end: 665,
    speaker: "sp1",
    text: "Si eso está resuelto, la zona horaria deja de importar casi por completo.",
    highlighted: true,
  },
  {
    id: "c9",
    start: 665,
    end: 673.5,
    speaker: "sp2",
    text: "Y si no lo está, tampoco te salva tener a todo el mundo en la misma oficina.",
  },
  /* El tramo de `clip_04`. Sin él, la ficha del clip que sale en media demo
     —el del calendario, el de las campañas— decía «sin transcripción», y
     parecía roto lo que solo estaba vacío. */
  {
    id: "c10",
    start: 2884,
    end: 2890,
    speaker: "sp1",
    text: "Cuando alguien se va, la entrevista de salida siempre dice lo mismo: una oferta mejor.",
  },
  {
    id: "c11",
    start: 2890,
    end: 2898.5,
    speaker: "sp2",
    text: "Nadie se va por el sueldo. Se va por el jefe, y el sueldo le da la excusa.",
    highlighted: true,
  },
  {
    id: "c12",
    start: 2898.5,
    end: 2908,
    speaker: "sp2",
    text: "Lo he visto cuatro veces: suben el sueldo para retener a alguien y se va igual seis meses después.",
    highlighted: true,
  },
  {
    id: "c13",
    start: 2908,
    end: 2919.4,
    speaker: "sp1",
    text: "Porque el dinero tapa el síntoma. Lo que no aguantaba era que nadie le dijera si lo estaba haciendo bien.",
    highlighted: true,
  },
  {
    id: "c14",
    start: 2919.4,
    end: 2931,
    speaker: "sp2",
    text: "Y eso no se arregla con un aumento. Se arregla con una conversación de quince minutos cada dos semanas.",
    highlighted: true,
  },
  {
    id: "c15",
    start: 2931,
    end: 2944,
    speaker: "sp1",
    text: "La que casi nadie tiene tiempo de hacer, y la única que de verdad retiene.",
    highlighted: true,
  },
  {
    id: "c16",
    start: 2944,
    end: 2952,
    speaker: "sp2",
    text: "Si tu equipo solo sabe cómo va cuando hay revisión anual, ya llegas tarde.",
  },
]

/** La transcripción del webinar de precios, para los clips de `src_05`. */
export const transcriptPrecios: TranscriptCue[] = [
  {
    id: "p1",
    start: 306,
    end: 318,
    speaker: "sp1",
    text: "La pregunta que más me hacen es cuánto tengo que cobrar, y casi nunca es la pregunta correcta.",
  },
  {
    id: "p2",
    start: 318,
    end: 327.5,
    speaker: "sp2",
    text: "Subimos la tarifa un treinta por ciento esperando perder la mitad de la cartera.",
    highlighted: true,
  },
  {
    id: "p3",
    start: 327.5,
    end: 338,
    speaker: "sp2",
    text: "Se fueron tres clientes de veinte, y los tres eran los que más horas nos comían.",
    highlighted: true,
  },
  {
    id: "p4",
    start: 338,
    end: 349.2,
    speaker: "sp1",
    text: "El que se va por veinte euros no se iba a quedar por nada: estaba buscando una excusa.",
    highlighted: true,
  },
  {
    id: "p5",
    start: 349.2,
    end: 366,
    speaker: "sp1",
    text: "Y el que se queda te lo dice de otra manera: empieza a tratarte como a alguien a quien paga en serio.",
    highlighted: true,
  },
  {
    id: "p6",
    start: 366,
    end: 374,
    speaker: "sp2",
    text: "Eso sí, hay que avisar con tiempo y explicarlo. Subirlo en una factura, sin más, sí que enfada.",
  },
]

/** La transcripción de un proyecto. Sin ella, la ficha del clip no la enseña. */
const TRANSCRIPCIONES: Record<string, TranscriptCue[]> = {
  src_01: transcript,
  src_05: transcriptPrecios,
}

export const transcriptDe = (sourceId: string): TranscriptCue[] =>
  TRANSCRIPCIONES[sourceId] ?? []

/** Los cues que caen dentro del tramo de un clip, que es lo que se le dijo. */
export const cuesDelTramo = (
  cues: TranscriptCue[],
  range: { start: number; end: number }
) => cues.filter((c) => c.end > range.start && c.start < range.end)

/**
 * Pistas del estudio. `label` es solo la referencia en español: la etiqueta
 * visible la pone el estudio según `kind` (`app.studio.tracks`).
 */
export const timelineTracks: TimelineTrack[] = [
  {
    id: "trk_video",
    kind: "video",
    label: "Video",
    items: [{ id: "seg_full", start: 0, end: 4_812, label: "Master 1080p" }],
  },
  {
    id: "trk_clips",
    kind: "clips",
    label: "Clips detectados",
    items: clips
      .filter((c) => c.sourceId === "src_01")
      .map((c) => ({
        id: c.id,
        start: c.range.start,
        end: c.range.end,
        label: c.title,
        selected: c.id === "clip_01",
      })),
  },
  {
    id: "trk_captions",
    kind: "captions",
    label: "Subtítulos",
    items: transcript.map((c) => ({ id: c.id, start: c.start, end: c.end })),
  },
]

/**
 * El consumo del mes de la demo. Depende del plan porque lo incluido depende del
 * plan: con cifras fijas, al ponerse en Prueba la barra lateral decía «412 de
 * 60 min» mientras /precios promete 60, y «87 clips» con 10 por proyecto.
 *
 * El 69 % y los 22 clips son el consumo que enseña la demo; el plan lo pone
 * `hooks/use-plan.ts`, que es el único que sabe cuál está puesto.
 */
export const minutosUsados = (incluidos: number) => Math.round(incluidos * 0.69)

export const clipsDelMes = (plan: PlanRef) => (escalonDe(plan) === "free" ? 6 : 87)

export const usage = {
  renewsAt: "2026-10-01T00:00:00.000Z",
}

/** Día de la semana por id; su abreviatura sale de `app.viewsChart.days`. */
export type Weekday = "lun" | "mar" | "mie" | "jue" | "vie" | "sab" | "dom"

export const weeklyViews: { day: Weekday; views: number; clips: number }[] = [
  { day: "lun", views: 12_400, clips: 3 },
  { day: "mar", views: 18_900, clips: 5 },
  { day: "mie", views: 15_200, clips: 4 },
  { day: "jue", views: 27_600, clips: 6 },
  { day: "vie", views: 41_300, clips: 8 },
  { day: "sab", views: 36_800, clips: 4 },
  { day: "dom", views: 22_100, clips: 2 },
]
