import type { Campo, Endpoint, ErrorDoc } from "@/lib/wiki/tipos"

/**
 * Endpoints de «proyectos»: los trabajos (`/jobs`), la subida del archivo
 * (`/uploads`) y todo lo que cuelga de un proyecto —sus clips, su
 * transcripción, sus oradores y el texto con el que sale cada clip—.
 *
 * Los cuatro de `/jobs` ya los llama `lib/api/jobs.ts` cuando existe
 * `NEXT_PUBLIC_API_URL`. El resto vive hoy en la semilla (`lib/mock-data.ts`),
 * en memoria del navegador o en `localStorage`, y el servidor tendrá que darlo
 * con estas formas para que la app no cambie.
 */

/* ---------------------------------------------------------------------------
   Piezas que se repiten
   --------------------------------------------------------------------------- */

/** Lo que devuelve `pedir()` cuando el servidor falla: códigos, nunca frases. */
const ERRORES_API: ErrorDoc[] = [
  {
    codigo: "no-autorizado",
    http: 401,
    cuando: "No hay sesión, o la sesión no alcanza (403 da el mismo código).",
    frase: "common.errors.no-autorizado",
    bloquea: true,
  },
  {
    codigo: "limite",
    http: 429,
    cuando: "Demasiadas peticiones seguidas.",
    frase: "common.errors.limite",
    bloquea: true,
  },
  {
    codigo: "servidor",
    http: 500,
    cuando: "Cualquier 5xx.",
    frase: "common.errors.servidor",
    bloquea: true,
  },
  {
    codigo: "sin-red",
    cuando: "No se llegó a salir: sin red (`fetch` rechaza con `TypeError`).",
    frase: "common.errors.sin-red",
    bloquea: true,
  },
  {
    codigo: "desconocido",
    cuando:
      "Cualquier otra cosa: un estado sin código propio, una respuesta que no es JSON o agotar los 15 s de espera (`ESPERA_MS`, lib/api/cliente.ts:25), que llega como `TimeoutError` y no como `TypeError`.",
    frase: "common.errors.desconocido",
    bloquea: true,
  },
]

const NO_ENCONTRADO = (que: string): ErrorDoc => ({
  codigo: "no-encontrado",
  http: 404,
  cuando: `${que} no existe o no es de esta cuenta (410 da el mismo código).`,
  frase: "common.errors.no-encontrado",
  bloquea: true,
})

const CONFLICTO = (cuando: string): ErrorDoc => ({
  codigo: "conflicto",
  http: 409,
  cuando,
  frase: "common.errors.conflicto",
  bloquea: true,
})

const P_ID: Campo = {
  nombre: "id",
  tipo: "string",
  requerido: true,
  en: "ruta",
  descripcion: "Id del proyecto (`SourceVideo.id`), p. ej. `src_01`.",
}

const P_CLIP: Campo = {
  nombre: "clipId",
  tipo: "string",
  requerido: true,
  en: "ruta",
  descripcion:
    "Id del clip (`Clip.id`), p. ej. `clip_01`. Tiene que ser de ese proyecto: la ficha no redirige un clip pedido desde otro proyecto.",
}

const P_RED: Campo = {
  nombre: "red",
  tipo: '"tiktok" | "instagram" | "youtube" | "x" | "linkedin" | "facebook"',
  requerido: true,
  en: "ruta",
  descripcion: "La red (`SocialId`, lib/social.ts:21).",
}

const P_UPLOAD: Campo = {
  nombre: "uploadId",
  tipo: "string",
  requerido: true,
  en: "ruta",
  descripcion: "La subida, tal como la devolvió `POST /uploads` en su `url`.",
}

/** `SourceVideo` (lib/types.ts:38), campo a campo. */
const CAMPOS_PROYECTO: Campo[] = [
  { nombre: "id", tipo: "string", requerido: true, descripcion: "Lo pone el servidor." },
  {
    nombre: "title",
    tipo: "string",
    requerido: true,
    descripcion: "El nombre del archivo tal cual se subió.",
  },
  {
    nombre: "duration",
    tipo: "number",
    requerido: true,
    descripcion: "Segundos de video. 0 mientras nadie lo haya medido.",
  },
  {
    nombre: "sizeBytes",
    tipo: "number",
    requerido: true,
    descripcion: "Peso del master.",
  },
  {
    nombre: "uploadedAt",
    tipo: "string",
    requerido: true,
    descripcion: "ISO 8601 en UTC. La lista se ordena por aquí, lo último arriba.",
  },
  {
    nombre: "status",
    tipo: '"en-cola" | "procesando" | "listo" | "error"',
    requerido: true,
    descripcion:
      "`JobStatus` (lib/types.ts:36). Mientras sea `en-cola` o `procesando` el front vuelve a preguntar cada 2 s.",
  },
  {
    nombre: "stage",
    tipo: '"subiendo" | "transcribiendo" | "analizando" | "recortando" | "reencuadrando" | "listo"',
    requerido: true,
    descripcion:
      "`JobStage` (lib/types.ts:25), en este orden: la interfaz lo usa como progreso y nombra la etapa en curso.",
  },
  {
    nombre: "progress",
    tipo: "number",
    requerido: true,
    descripcion:
      "0–100, entero. La interfaz lo enseña junto a la etapa mientras está en cola o procesando; con `listo` o `error` no.",
  },
  {
    nombre: "clipCount",
    tipo: "number",
    requerido: true,
    descripcion: "Clips generados. La lista enseña «{n} clips» si es mayor que 0.",
  },
  {
    nombre: "language",
    tipo: "string",
    requerido: true,
    descripcion: "Idioma del audio. «es» si no se declaró.",
  },
  {
    nombre: "operacion",
    tipo: "ParametrosOperacion",
    requerido: false,
    descripcion:
      "Si es una operación (recortar, reducir, variante) y no un análisis (lib/operaciones.ts:217). La lista lo enseña como etiqueta.",
  },
  {
    nombre: "posterUrl",
    tipo: "string",
    requerido: false,
    descripcion: "Portada. Hoy ninguna semilla la trae.",
  },
  {
    nombre: "src",
    tipo: "string",
    requerido: false,
    descripcion: "URL del master (.m3u8 o .mp4). Hoy ninguna semilla la trae.",
  },
]

/** `Clip` (lib/types.ts:68), campo a campo. */
const CAMPOS_CLIP: Campo[] = [
  { nombre: "id", tipo: "string", requerido: true, descripcion: "Lo pone el servidor." },
  {
    nombre: "sourceId",
    tipo: "string",
    requerido: true,
    descripcion: "El proyecto del que sale.",
  },
  {
    nombre: "title",
    tipo: "string",
    requerido: true,
    descripcion: "Hasta 90 caracteres (el campo del estudio).",
  },
  {
    nombre: "hook",
    tipo: "string",
    requerido: true,
    descripcion: "La frase que justifica el recorte: «Por qué este momento».",
  },
  {
    nombre: "range",
    tipo: "ClipRange",
    requerido: true,
    descripcion: "`{ start, end }` en segundos desde el inicio del video fuente.",
  },
  {
    nombre: "aspect",
    tipo: '"9:16" | "1:1" | "4:5" | "16:9"',
    requerido: true,
    descripcion: "Formato.",
  },
  {
    nombre: "score",
    tipo: "number",
    requerido: true,
    descripcion: "0–100, retención estimada. ≥ 85 alto, ≥ 70 medio, el resto bajo.",
  },
  {
    nombre: "tags",
    tipo: "string[]",
    requerido: true,
    descripcion: "Etiquetas del análisis.",
  },
  {
    nombre: "hasCaptions",
    tipo: "boolean",
    requerido: true,
    descripcion: "Si lleva subtítulos.",
  },
  {
    nombre: "status",
    tipo: '"borrador" | "listo" | "publicado"',
    requerido: true,
    descripcion: "Estado del clip.",
  },
  {
    nombre: "createdAt",
    tipo: "string",
    requerido: true,
    descripcion: "ISO 8601 en UTC.",
  },
  {
    nombre: "metrics",
    tipo: "ClipMetrics",
    requerido: false,
    descripcion:
      "`{ views, likes, shares, retention }` (`ClipMetrics`, lib/types.ts:89), si las hay: en la semilla las llevan los tres publicados de src_01 y clip_06, que está «listo».",
  },
  {
    nombre: "src",
    tipo: "string",
    requerido: false,
    descripcion:
      "El archivo renderizado. Sin él no se reproduce ni se descarga: hoy ningún clip lo trae.",
  },
  { nombre: "posterUrl", tipo: "string", requerido: false, descripcion: "Portada." },
]

/* ---------------------------------------------------------------------------
   Ejemplos, de la semilla de la demo (lib/mock-data.ts)
   --------------------------------------------------------------------------- */

const SRC_01 = {
  id: "src_01",
  title: "Podcast #42 — Cómo escalar un equipo remoto",
  duration: 4812,
  sizeBytes: 2640000000,
  uploadedAt: "2026-09-06T09:12:00.000Z",
  status: "listo",
  stage: "listo",
  progress: 100,
  clipCount: 6,
  language: "es",
}

const SRC_02 = {
  id: "src_02",
  title: "Directo — Preguntas y respuestas de septiembre",
  duration: 3190,
  sizeBytes: 1820000000,
  uploadedAt: "2026-09-07T17:40:00.000Z",
  status: "procesando",
  stage: "analizando",
  progress: 62,
  clipCount: 0,
  language: "es",
}

const CLIP_01 = {
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
  metrics: { views: 128400, likes: 9120, shares: 1840, retention: 71 },
}

const CLIP_04 = {
  id: "clip_04",
  sourceId: "src_01",
  title: "Nadie se va por el sueldo",
  hook: "«Nadie se va por el sueldo. Se va por el jefe, y el sueldo le da la excusa.»",
  range: { start: 2890, end: 2944 },
  aspect: "9:16",
  score: 92,
  tags: ["liderazgo", "retención"],
  hasCaptions: true,
  status: "borrador",
  createdAt: "2026-09-06T10:09:00.000Z",
}

const COPIA_TIKTOK = {
  titulo: "",
  texto: "Contratamos por husos horarios y perdimos a la mejor diseñadora del equipo.",
  hashtags: ["#remoto", "#contratación"],
}

/* ---------------------------------------------------------------------------
   Los endpoints
   --------------------------------------------------------------------------- */

/** Endpoints de «proyectos». */
export const ENDPOINTS: Endpoint[] = [
  /* --- Trabajos: ya conectados en lib/api/jobs.ts ------------------------ */
  {
    id: "proyectos.listar",
    area: "proyectos",
    metodo: "GET",
    ruta: "/jobs",
    resumen: "Los proyectos de la cuenta con su estado de proceso.",
    descripcion:
      "Alimenta /proyectos, la tarjeta «En proceso» de Resumen y la página de un proyecto que todavía no está listo: las tres comparten la misma consulta (`jobKeys.list()`), así que solo hay un sondeo en marcha. El front vuelve a pedirla cada 2 s (`POLL_MS`) mientras quede algún trabajo `en-cola` o `procesando`, y deja de hacerlo solo cuando no queda ninguno.",
    estado: "conectado",
    auth: "sesion",
    respuesta: {
      tipo: "SourceVideo[]",
      definidoEn: "lib/types.ts:38",
      campos: CAMPOS_PROYECTO,
      ejemplo: [SRC_02, SRC_01],
    },
    errores: ERRORES_API,
    reglas: [
      "Solo los proyectos de la cuenta de la sesión.",
      "Ordenados por `uploadedAt`, lo último arriba: un proyecto recién creado se ve sin buscarlo (lib/api/jobs.ts:103).",
      "`progress` entero entre 0 y 100 y `stage` coherente con él: en la simulación cada una de las 6 etapas ocupa el mismo tramo, ~16,6 % (lib/api/jobs.ts:46).",
      'Al terminar, `status: "listo"`, `stage: "listo"`, `progress: 100` y `clipCount` con los clips generados.',
      "Tiene que aguantar el sondeo de 2 s de cada pestaña abierta mientras algo procesa; si hay que frenar, 429 (`limite`).",
    ],
    origen: "lib/api/jobs.ts:97",
  },
  {
    id: "proyectos.obtener",
    area: "proyectos",
    metodo: "GET",
    ruta: "/jobs/{id}",
    resumen: "Un proyecto con su estado de proceso.",
    descripcion:
      "La frontera ya lo llama (`getJob`) y el hook `useJobStatus` (hooks/use-jobs.ts:47) sondea con él cada 2 s mientras el trabajo está activo, pero hoy ninguna pantalla usa ese hook: la página del proyecto y el estudio leen la semilla `sourceVideos` en el servidor. Es el que tendrán que pedir.",
    estado: "conectado",
    auth: "sesion",
    parametros: [P_ID],
    respuesta: {
      tipo: "SourceVideo",
      definidoEn: "lib/types.ts:38",
      campos: CAMPOS_PROYECTO,
      ejemplo: SRC_02,
    },
    errores: [
      {
        ...NO_ENCONTRADO("El proyecto"),
        cuando:
          "El proyecto no existe o no es de esta cuenta. Sin servidor, la simulación lanza `JobNotFoundError` (lib/api/jobs.ts:110), que se dice con `app.jobs.notFound`.",
      },
      ...ERRORES_API,
    ],
    reglas: [
      "Un proyecto de otra cuenta responde 404, no 403: no se confirma que existe.",
      "Misma forma y mismas reglas de estado que en `GET /jobs`.",
    ],
    origen: "lib/api/jobs.ts:107",
  },
  {
    id: "proyectos.crear",
    area: "proyectos",
    metodo: "POST",
    ruta: "/jobs",
    resumen: "Dar de alta un trabajo: un proyecto por cada video subido.",
    descripcion:
      "Es lo que hace «Procesar video» en /subir, una llamada por archivo terminado. Las operaciones (Recortar, Reducir tamaño, Variantes) usan el mismo alta con `operacion`: el servidor las ejecuta en vez de analizar (docs/costuras-backend.md). Devuelve el trabajo con su id de verdad y la app lo escribe en la caché de la lista sin esperar al siguiente sondeo.",
    estado: "conectado",
    auth: "sesion",
    cuerpo: {
      tipo: "NuevoTrabajo",
      definidoEn: "lib/api/jobs.ts:115",
      campos: [
        {
          nombre: "title",
          tipo: "string",
          requerido: true,
          descripcion: "El nombre del archivo tal cual se subió.",
        },
        {
          nombre: "sizeBytes",
          tipo: "number",
          requerido: false,
          descripcion: "Peso del archivo. /subir lo manda.",
        },
        {
          nombre: "sourceUrl",
          tipo: "string",
          requerido: false,
          descripcion:
            "Dónde quedó el archivo: el `url` que devuelve la subida. Hoy llega vacío porque el transporte simulado no guarda nada.",
        },
        {
          nombre: "duration",
          tipo: "number",
          requerido: false,
          descripcion: "Segundos. /subir no lo manda: lo tiene que medir el servidor.",
        },
        {
          nombre: "language",
          tipo: "string",
          requerido: false,
          descripcion:
            "Idioma declarado del audio. Está en el tipo, pero /subir todavía no lo manda.",
        },
        {
          nombre: "operacion",
          tipo: "ParametrosOperacion",
          requerido: false,
          descripcion:
            "Una operación sobre el video en vez del análisis (lib/operaciones.ts:217).",
        },
      ],
      ejemplo: {
        title: "masterclass-estructura-narrativa.mp4",
        sizeBytes: 740000000,
        sourceUrl: "/uploads/5f0c1a7e-3b9d-4e2a-9c61-2d8f4b7a0e13",
      },
    },
    respuesta: {
      tipo: "SourceVideo",
      definidoEn: "lib/types.ts:38",
      campos: CAMPOS_PROYECTO,
      ejemplo: {
        id: "src_mub38f9c",
        title: "masterclass-estructura-narrativa.mp4",
        duration: 0,
        sizeBytes: 740000000,
        uploadedAt: "2026-09-21T10:14:00.000Z",
        status: "en-cola",
        stage: "subiendo",
        progress: 0,
        clipCount: 0,
        language: "es",
      },
    },
    errores: [
      {
        codigo: "conflicto",
        http: 422,
        cuando:
          "El alta no cabe: `sourceUrl` no es ni una subida terminada de esta cuenta ni un enlace que su plan admita, o el video pasa lo que su plan admite (tamaño, duración, minutos del mes), o la cuenta pide una `operacion` sin llegar a Creador. 409 da el mismo código.",
        frase: "common.errors.conflicto",
        bloquea: true,
      },
      ...ERRORES_API,
    ],
    reglas: [
      "El id, `uploadedAt` y el estado inicial los pone el servidor: nace `en-cola`, etapa `subiendo`, `progress` 0 y `clipCount` 0 (lib/api/jobs.ts:152).",
      "`language` vale «es» si no llega (lib/api/jobs.ts:156). `duration` se mide del archivo, no se fía del cuerpo.",
      "`sourceUrl` tiene que ser una subida completada de la misma cuenta (`POST /uploads`) o, cuando se conecte «Importar», un enlace de lo que su plan admite: enlaces de YouTube, Google Drive y Vimeo en todos los planes y directos de Twitch y Kick desde Creador (lib/pricing.ts:312 y :313). Nunca una dirección cualquiera.",
      "Tamaño por archivo según el plan: 1 GB en Prueba y 30 GB en Creador y Empresa (lib/pricing.ts:309). La zona de subida corta en 8 GB para todos (components/video/upload-dropzone.tsx:29): el límite de Prueba solo lo puede poner el servidor, y hoy Creador y Empresa no pueden subir los 30 GB que promete /precios.",
      "Duración máxima por video: 60 min en Prueba y 600 min en Creador y Empresa (lib/pricing.ts:305).",
      "Minutos de video al mes: 60 en Prueba, 600 en Creador y 600 en Empresa (`MINUTOS_INCLUIDOS`, lib/pricing.ts:159; un plan creado en el backoffice lleva los suyos). Hoy nadie los descuenta: el consumo que enseña la app es un 69 % fijo (lib/mock-data.ts:494).",
      "Con `operacion`, del plan Creador en adelante (`PLAN_MINIMO.operaciones`, lib/pricing.ts:80): ejecutarla, no analizar.",
      "Lo que /subir enseña en «Cómo quieres los clips» (formato, duración objetivo, idioma, subtítulos, seguimiento de rostro) todavía no viaja: `NuevoTrabajo` no tiene esos campos y el panel manda solo `title`, `sizeBytes` y `sourceUrl` (components/app/upload-panel.tsx:311).",
    ],
    origen: "lib/api/jobs.ts:143",
  },
  {
    id: "proyectos.reintentar",
    area: "proyectos",
    metodo: "POST",
    ruta: "/jobs/{id}/retry",
    resumen: "Volver a encolar un proyecto que terminó en error.",
    descripcion:
      "Devuelve el trabajo ya reencolado para que la app lo escriba en la caché (lista y detalle) sin esperar al sondeo; el sondeo arranca solo porque vuelve a estar activo.",
    estado: "conectado",
    auth: "sesion",
    parametros: [P_ID],
    respuesta: {
      tipo: "SourceVideo",
      definidoEn: "lib/types.ts:38",
      campos: CAMPOS_PROYECTO,
      ejemplo: {
        id: "src_04",
        title: "Entrevista — Product-market fit sin inversión",
        duration: 2734,
        sizeBytes: 1130000000,
        uploadedAt: "2026-09-02T11:25:00.000Z",
        status: "en-cola",
        stage: "subiendo",
        progress: 0,
        clipCount: 0,
        language: "es",
      },
    },
    errores: [
      {
        ...NO_ENCONTRADO("El proyecto"),
        cuando:
          "El proyecto no existe o no es de esta cuenta. Sin servidor, `JobNotFoundError` (lib/api/jobs.ts:172), que el aviso dice con `app.jobs.notFound`.",
      },
      CONFLICTO("El proyecto no está en `error`: solo se reintenta lo que ha fallado."),
      ...ERRORES_API,
    ],
    reglas: [
      "Solo si `status` es `error`. El front solo enseña «Reintentar» en ese estado, pero el servidor no se fía: la simulación de hoy no lo comprueba y reencola cualquier proyecto que exista (lib/api/jobs.ts:171).",
      'Reencolado: `status: "en-cola"`, `stage: "subiendo"`, `progress: 0`; el resto del trabajo se conserva (lib/api/jobs.ts:173).',
      "Se guarda antes de responder: devolverlo sin guardarlo hacía que el siguiente sondeo leyera el original y el reintento se deshiciera solo.",
    ],
    origen: "lib/api/jobs.ts:169",
  },

  /* --- Subida del archivo: lib/api/upload.ts, por construir -------------- */
  {
    id: "proyectos.iniciar-subida",
    area: "proyectos",
    metodo: "POST",
    ruta: "/uploads",
    resumen: "Abrir la subida reanudable de un archivo de video.",
    descripcion:
      "Primer paso del transporte (`UploadTransport`, lib/api/upload.ts:34), que se sustituye por tus-js-client o el multipart de S3 sin tocar ni el hook ni la interfaz. Devuelve dónde va a quedar el archivo: es el `url` que acaba en `NuevoTrabajo.sourceUrl`.",
    estado: "por-construir",
    auth: "sesion",
    cuerpo: {
      tipo: 'Pick<UploadItem, "name" | "size">',
      definidoEn: "lib/types.ts:133",
      campos: [
        {
          nombre: "name",
          tipo: "string",
          requerido: true,
          descripcion: "Nombre del archivo.",
        },
        {
          nombre: "size",
          tipo: "number",
          requerido: true,
          descripcion: "Tamaño total en bytes.",
        },
      ],
      ejemplo: { name: "masterclass-estructura-narrativa.mp4", size: 740000000 },
    },
    respuesta: {
      tipo: "UploadTransportResult",
      definidoEn: "lib/api/upload.ts:19",
      campos: [
        {
          nombre: "uploadedBytes",
          tipo: "number",
          requerido: true,
          descripcion: "0 al abrir.",
        },
        {
          nombre: "completed",
          tipo: "boolean",
          requerido: true,
          descripcion: "`false` al abrir.",
        },
        {
          nombre: "url",
          tipo: "string",
          requerido: false,
          descripcion: "Dónde quedará el archivo (lo que tus devuelve en `Location`).",
        },
      ],
      ejemplo: {
        uploadedBytes: 0,
        completed: false,
        url: "/uploads/5f0c1a7e-3b9d-4e2a-9c61-2d8f4b7a0e13",
      },
    },
    errores: [
      {
        codigo: "conflicto",
        http: 422,
        cuando:
          "El tipo no es de video admitido o el tamaño pasa el del plan. El front ya rechaza antes lo que no es MP4, MOV, WebM o MKV y lo que pasa de 8 GB (`invalidType`, `tooBig`).",
        frase: "common.errors.conflicto",
        bloquea: true,
      },
      ...ERRORES_API,
    ],
    reglas: [
      "Tipos admitidos: `video/mp4`, `video/quicktime`, `video/webm`, `video/x-matroska` (components/video/upload-dropzone.tsx:28). El servidor lo comprueba con el contenido, no con la extensión.",
      "Tamaño: el del plan —1 GB en Prueba, 30 GB en Creador y Empresa (lib/pricing.ts:309)—. Hoy el front corta antes, en 8 GB para todos (`MAX_BYTES`, components/video/upload-dropzone.tsx:29).",
      "La subida es de quien la abre: nadie más puede escribir en ella ni usarla en `POST /jobs`.",
      "Una subida que no termina en un trabajo no se queda para siempre: salir de /subir no avisa al servidor.",
    ],
    origen: "lib/api/upload.ts:34",
  },
  {
    id: "proyectos.subir-trozo",
    area: "proyectos",
    metodo: "PATCH",
    ruta: "/uploads/{uploadId}",
    resumen: "Mandar el siguiente trozo del archivo desde el último byte confirmado.",
    descripcion:
      "El contrato ya está pensado para reanudar: se entra por `offset` y se sale devolviendo los bytes confirmados, que es lo que hace un `PATCH` de tus o una parte de un multipart. Pausar corta la petición con su `AbortSignal`; reanudar y reintentar vuelven a llamar desde lo confirmado.",
    estado: "por-construir",
    auth: "sesion",
    parametros: [
      P_UPLOAD,
      {
        nombre: "Upload-Offset",
        tipo: "number",
        requerido: true,
        en: "cabecera",
        descripcion:
          "Bytes ya confirmados (`UploadTransportParams.offset`). 0 en la primera llamada.",
      },
    ],
    cuerpo: {
      tipo: "File",
      definidoEn: "lib/api/upload.ts:10",
      ejemplo: "(bytes del archivo desde Upload-Offset, application/offset+octet-stream)",
    },
    respuesta: {
      tipo: "UploadTransportResult",
      definidoEn: "lib/api/upload.ts:19",
      campos: [
        {
          nombre: "uploadedBytes",
          tipo: "number",
          requerido: true,
          descripcion: "Total confirmado, no el incremento: es desde donde se reanuda.",
        },
        {
          nombre: "completed",
          tipo: "boolean",
          requerido: true,
          descripcion: "`true` cuando `uploadedBytes` llega al tamaño total.",
        },
        {
          nombre: "url",
          tipo: "string",
          requerido: false,
          descripcion:
            "Dónde quedó el archivo. Obligatorio al completar: sin él no hay `sourceUrl`.",
        },
      ],
      ejemplo: {
        uploadedBytes: 740000000,
        completed: true,
        url: "/uploads/5f0c1a7e-3b9d-4e2a-9c61-2d8f4b7a0e13",
      },
    },
    errores: [
      NO_ENCONTRADO("La subida"),
      CONFLICTO(
        "`Upload-Offset` no coincide con lo que el servidor tiene confirmado: el cliente tiene que volver a entrar desde el valor real."
      ),
      ...ERRORES_API,
    ],
    reglas: [
      "Solo se escribe a partir de lo confirmado: un offset distinto es 409, nunca se sobrescribe ni se deja un hueco.",
      "`uploadedBytes` es el acumulado confirmado; el front lo guarda en la fila y es el `offset` con el que vuelve a llamar al reanudar o reintentar (hooks/use-resumable-upload.ts:126).",
      "El transporte simulado avanza en bloques de 512 KB (`CHUNK_BYTES`, lib/api/upload.ts:39) y la cola sube dos archivos a la vez (hooks/use-resumable-upload.ts:49); el servidor no debe depender del tamaño del trozo.",
      "Al completar devuelve `url`: hoy el transporte simulado no la rellena, `sourceUrl` llega vacío y por eso no se procesa nada de verdad (lib/api/jobs.ts:124). docs/costuras-backend.md lo pide expresamente: el transporte tiene que devolver `url`.",
    ],
    origen: "lib/api/upload.ts:54",
  },
  {
    id: "proyectos.cancelar-subida",
    area: "proyectos",
    metodo: "DELETE",
    ruta: "/uploads/{uploadId}",
    resumen: "Descartar una subida a medias.",
    descripcion:
      "Lo que tendrá que pedir quitar un archivo de la cola (la ✕ de su fila) y, por cada subida a medias, salir de /subir con «Cancelar». Hoy quitar solo corta la petición en curso y olvida el archivo en el navegador, y salir corta todas las transferencias al desmontar el panel.",
    estado: "por-construir",
    auth: "sesion",
    parametros: [P_UPLOAD],
    respuesta: { tipo: "void", ejemplo: null },
    errores: [
      NO_ENCONTRADO("La subida"),
      CONFLICTO(
        "La subida ya se usó para crear un trabajo: ese archivo es del proyecto."
      ),
      ...ERRORES_API,
    ],
    reglas: [
      "Responde 204 sin cuerpo (`pedir` devuelve `undefined`).",
      "Borra los bytes guardados. Una subida que ya es el `sourceUrl` de un trabajo no se borra por aquí.",
    ],
    origen: "hooks/use-resumable-upload.ts:185",
  },

  /* --- Clips del proyecto: hoy la semilla `clips`, por construir --------- */
  {
    id: "proyectos.listar-clips",
    area: "proyectos",
    metodo: "GET",
    ruta: "/jobs/{id}/clips",
    resumen: "Los clips de un proyecto.",
    descripcion:
      "Hoy la página del proyecto y el estudio filtran la semilla en el servidor (`clips.filter(c => c.sourceId === id)`). Los filtros de la lista (búsqueda, estado, formato, orden) se hacen en el navegador sobre esta respuesta y viven en la URL.",
    estado: "por-construir",
    auth: "sesion",
    parametros: [P_ID],
    respuesta: {
      tipo: "Clip[]",
      definidoEn: "lib/types.ts:68",
      campos: CAMPOS_CLIP,
      ejemplo: [CLIP_01, CLIP_04],
    },
    errores: [NO_ENCONTRADO("El proyecto"), ...ERRORES_API],
    reglas: [
      "Solo los clips de ese proyecto y de esa cuenta; un borrado no sale.",
      "Un proyecto que no está `listo` devuelve la lista vacía, no un error.",
      "Clips por proyecto según el plan: hasta 10 en Prueba e ilimitados en Creador y Empresa (lib/pricing.ts:347). Lo decide el análisis al generarlos, no esta lectura.",
    ],
    origen: "app/[locale]/(app)/proyectos/[id]/page.tsx:56",
  },
  {
    id: "proyectos.listar-clips-cuenta",
    area: "proyectos",
    metodo: "GET",
    ruta: "/clips",
    resumen: "Los clips más recientes de todos los proyectos de la cuenta.",
    descripcion:
      "Lo que pide «Clips recientes» en Resumen, que hoy son los cuatro primeros de la semilla (`clips.slice(0, 4)`) mezclando proyectos.",
    estado: "por-construir",
    auth: "sesion",
    parametros: [
      {
        nombre: "limite",
        tipo: "number",
        requerido: false,
        en: "consulta",
        descripcion: "Cuántos. Resumen pide 4.",
      },
    ],
    respuesta: {
      tipo: "Clip[]",
      definidoEn: "lib/types.ts:68",
      campos: CAMPOS_CLIP,
      ejemplo: [CLIP_04, CLIP_01],
    },
    errores: ERRORES_API,
    reglas: [
      "Solo clips de proyectos de la cuenta, lo último (`createdAt`) arriba.",
      "Cada clip lleva `sourceId`: la tarjeta enlaza a /proyectos/{sourceId}/clips/{id}.",
    ],
    origen: "app/[locale]/(app)/dashboard/page.tsx:140",
  },
  {
    id: "proyectos.obtener-clip",
    area: "proyectos",
    metodo: "GET",
    ruta: "/jobs/{id}/clips/{clipId}",
    resumen: "Un clip con todo lo que enseña su ficha.",
    descripcion:
      "Hoy la ficha busca el clip en la semilla y comprueba que su `sourceId` es el proyecto de la URL. `src` es lo que hará falta para reproducir, pero no basta con rellenarlo: hoy ni la ficha ni el estudio se lo pasan al reproductor (components/app/clip-detalle.tsx:90, components/app/studio.tsx:216).",
    estado: "por-construir",
    auth: "sesion",
    parametros: [P_ID, P_CLIP],
    respuesta: {
      tipo: "Clip",
      definidoEn: "lib/types.ts:68",
      campos: CAMPOS_CLIP,
      ejemplo: CLIP_01,
    },
    errores: [
      {
        ...NO_ENCONTRADO("El clip"),
        cuando:
          "El clip no existe, está borrado o es de otro proyecto: no se redirige, porque el enlace estaba mal.",
      },
      ...ERRORES_API,
    ],
    reglas: [
      "El clip tiene que ser del proyecto de la ruta (app/[locale]/(app)/proyectos/[id]/clips/[clipId]/page.tsx:42).",
      "Mientras no haya archivo, el clip va sin `src`: el front lo trata como opcional y enseña el encuadre vacío.",
    ],
    origen: "app/[locale]/(app)/proyectos/[id]/clips/[clipId]/page.tsx:41",
  },
  {
    id: "proyectos.actualizar-clip",
    area: "proyectos",
    metodo: "PATCH",
    ruta: "/jobs/{id}/clips/{clipId}",
    resumen:
      "Guardar lo que se cambia de un clip en el estudio: recorte, formato o título.",
    descripcion:
      "Hoy nada de esto se guarda: el estudio lo tiene en estado local y lo pierde al cambiar de clip o recargar. Los momentos naturales para mandarlo ya existen en el estudio: al soltar una manija del recorte o pulsar una flecha (`onCommit`, que hoy solo avisa «Recorte actualizado»), al elegir formato y al escribir el título.",
    estado: "por-construir",
    auth: "sesion",
    parametros: [P_ID, P_CLIP],
    cuerpo: {
      tipo: 'Partial<Pick<Clip, "title" | "range" | "aspect">>',
      definidoEn: "lib/types.ts:68",
      campos: [
        {
          nombre: "title",
          tipo: "string",
          requerido: false,
          descripcion: "Hasta 90 caracteres.",
        },
        {
          nombre: "range",
          tipo: "ClipRange",
          requerido: false,
          descripcion: "Nuevo tramo, en segundos del video fuente.",
        },
        {
          nombre: "aspect",
          tipo: '"9:16" | "1:1" | "4:5" | "16:9"',
          requerido: false,
          descripcion: "Nuevo formato.",
        },
      ],
      ejemplo: { range: { start: 610, end: 665 } },
    },
    respuesta: {
      tipo: "Clip",
      definidoEn: "lib/types.ts:68",
      campos: CAMPOS_CLIP,
      ejemplo: { ...CLIP_01, range: { start: 610, end: 665 } },
    },
    errores: [
      NO_ENCONTRADO("El clip"),
      {
        codigo: "conflicto",
        http: 422,
        cuando:
          "El tramo no cabe (menos de 5 s, más de 180 s, o fuera del video), el título pasa de 90 caracteres, o el formato no es del plan.",
        frase: "common.errors.conflicto",
        bloquea: true,
      },
      ...ERRORES_API,
    ],
    reglas: [
      "Tramo: `start` ≥ 0, `end` ≤ duración del video, y entre 5 y 180 s de largo (`minLength` y `maxLength` del recorte, components/app/studio.tsx:241).",
      "Título: 90 caracteres como mucho (components/app/studio.tsx:320).",
      "Formato: uno de `9:16`, `1:1`, `4:5`, `16:9`. La comparativa da solo 9:16 a Prueba (lib/pricing.ts:339); el estudio no lo mira.",
      "No toca `hook`, `tags` ni `score`: son del análisis, y el estudio enseña el gancho y las etiquetas en solo lectura.",
    ],
    origen: "components/app/studio.tsx:237",
  },
  {
    id: "proyectos.eliminar-clip",
    area: "proyectos",
    metodo: "DELETE",
    ruta: "/jobs/{id}/clips/{clipId}",
    resumen: "Quitar un clip de su proyecto, con posibilidad de deshacer.",
    descripcion:
      "Hoy «Eliminar» solo enseña el aviso con «Deshacer»: el clip no sale de la lista. Como el aviso ofrece deshacer, el borrado tiene que poder volverse atrás (`POST …/restore`).",
    estado: "por-construir",
    auth: "sesion",
    parametros: [P_ID, P_CLIP],
    respuesta: { tipo: "void", ejemplo: null },
    errores: [NO_ENCONTRADO("El clip"), ...ERRORES_API],
    reglas: [
      "Responde 204 sin cuerpo.",
      "Borrado recuperable: el clip deja de salir en `GET …/clips` pero se puede restaurar.",
      "Lo ya publicado en las redes no se borra de ellas por esto.",
    ],
    origen: "components/app/clips-library.tsx:158",
  },
  {
    id: "proyectos.restaurar-clip",
    area: "proyectos",
    metodo: "POST",
    ruta: "/jobs/{id}/clips/{clipId}/restore",
    resumen: "Deshacer el borrado de un clip.",
    descripcion:
      "Lo que tendrá que pedir «Deshacer» en el aviso de «Clip «…» eliminado».",
    estado: "por-construir",
    auth: "sesion",
    parametros: [P_ID, P_CLIP],
    respuesta: {
      tipo: "Clip",
      definidoEn: "lib/types.ts:68",
      campos: CAMPOS_CLIP,
      ejemplo: CLIP_04,
    },
    errores: [
      NO_ENCONTRADO("El clip"),
      CONFLICTO("El clip no estaba borrado."),
      ...ERRORES_API,
    ],
    reglas: [
      "Devuelve el clip tal como estaba, con su id: el enlace a su ficha vuelve a valer.",
    ],
    origen: "components/app/clips-library.tsx:163",
  },
  {
    id: "proyectos.renderizar-clip",
    area: "proyectos",
    metodo: "POST",
    ruta: "/jobs/{id}/clips/{clipId}/render",
    resumen: "Generar el archivo de un clip en un formato, para descargarlo.",
    descripcion:
      "Es el archivo que hoy falta: «Descargar {formato}» está apagado en la ficha, y con «Duplicar» en el menú de la tarjeta, con el motivo «Descargar y duplicar necesitan el archivo renderizado, que todavía no se genera.»; el «Descargar» del estudio solo avisa «Preparando descarga…». Devuelve el clip; cuando el archivo está, `src` apunta a él.",
    estado: "por-construir",
    auth: "sesion",
    parametros: [P_ID, P_CLIP],
    cuerpo: {
      tipo: 'Pick<Clip, "aspect">',
      definidoEn: "lib/types.ts:68",
      campos: [
        {
          nombre: "aspect",
          tipo: '"9:16" | "1:1" | "4:5" | "16:9"',
          requerido: true,
          descripcion: "El formato del archivo.",
        },
      ],
      ejemplo: { aspect: "9:16" },
    },
    respuesta: {
      tipo: "Clip",
      definidoEn: "lib/types.ts:68",
      campos: CAMPOS_CLIP,
      ejemplo: CLIP_01,
    },
    errores: [
      NO_ENCONTRADO("El clip"),
      {
        codigo: "conflicto",
        http: 422,
        cuando: "El formato pedido no es del plan.",
        frase: "common.errors.conflicto",
        bloquea: true,
      },
      ...ERRORES_API,
    ],
    reglas: [
      "Calidad de exportación: 720p en Prueba y 4K en Creador y Empresa (lib/pricing.ts:337).",
      "Formatos: solo 9:16 en Prueba; 9:16, 4:5, 1:1 y 16:9 en Creador y Empresa (lib/pricing.ts:339).",
      "Marca de agua en Prueba: «Sin marca de agua» es de Creador y Empresa (lib/pricing.ts:354).",
      "Exportar otro formato no vuelve a procesar el video (lo que promete /subir: «Siempre puedes exportar los demás formatos después, sin volver a procesar.»).",
    ],
    origen: "components/video/clip-card.tsx:182",
  },
  {
    id: "proyectos.reencuadrar-clip",
    area: "proyectos",
    metodo: "POST",
    ruta: "/jobs/{id}/clips/{clipId}/reframe",
    resumen: "Volver a buscar el encuadre de un clip.",
    descripcion:
      "Lo que tendrá que pedir «Reencuadrar de nuevo» en la pestaña Ajustes del estudio, que hoy solo avisa «Buscando encuadres alternativos…».",
    estado: "por-construir",
    auth: "sesion",
    parametros: [P_ID, P_CLIP],
    respuesta: {
      tipo: "Clip",
      definidoEn: "lib/types.ts:68",
      campos: CAMPOS_CLIP,
      ejemplo: CLIP_01,
    },
    errores: [
      NO_ENCONTRADO("El clip"),
      {
        codigo: "no-autorizado",
        http: 403,
        cuando: "El plan no incluye el reencuadre automático.",
        frase: "common.errors.no-autorizado",
        bloquea: true,
      },
      ...ERRORES_API,
    ],
    reglas: [
      "El reencuadre automático con seguimiento es de Creador y Empresa (lib/pricing.ts:330).",
      "No cambia el tramo ni el formato: solo dónde cae el encuadre dentro de él.",
    ],
    origen: "components/app/studio.tsx:349",
  },

  /* --- Transcripción y oradores: hoy semilla, por construir -------------- */
  {
    id: "proyectos.obtener-transcripcion",
    area: "proyectos",
    metodo: "GET",
    ruta: "/jobs/{id}/transcript",
    resumen: "La transcripción de un proyecto, frase a frase.",
    descripcion:
      "La lee la ficha del clip (solo el tramo del clip), la pestaña Transcripción del estudio y la pista «Subtítulos» de su línea de tiempo. Hoy sale de la semilla: solo `src_01` y `src_05` tienen, y el estudio enseña siempre la de `src_01` sea cual sea el proyecto (components/app/studio.tsx:17).",
    estado: "por-construir",
    auth: "sesion",
    parametros: [P_ID],
    respuesta: {
      tipo: "TranscriptCue[]",
      definidoEn: "lib/types.ts:97",
      campos: [
        { nombre: "id", tipo: "string", requerido: true, descripcion: "Id de la frase." },
        {
          nombre: "start",
          tipo: "number",
          requerido: true,
          descripcion: "Segundo en que empieza.",
        },
        {
          nombre: "end",
          tipo: "number",
          requerido: true,
          descripcion: "Segundo en que acaba.",
        },
        {
          nombre: "text",
          tipo: "string",
          requerido: true,
          descripcion: "Lo que se dice.",
        },
        {
          nombre: "speaker",
          tipo: "string",
          requerido: false,
          descripcion: "Id del orador (`Speaker.id`).",
        },
        {
          nombre: "highlighted",
          tipo: "boolean",
          requerido: false,
          descripcion: "Si la IA la marcó como parte de un momento fuerte («Momento»).",
        },
      ],
      ejemplo: [
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
      ],
    },
    errores: [NO_ENCONTRADO("El proyecto"), ...ERRORES_API],
    reglas: [
      "Ordenada por `start`, sin solapes. Un proyecto sin transcripción devuelve `[]`: la ficha dice «De este tramo todavía no hay transcripción guardada.».",
      "La ficha se queda con las frases que pisan el tramo del clip (`end > start del clip` y `start < end del clip`, lib/mock-data.ts:448); el servidor puede devolverla entera.",
    ],
    origen: "lib/mock-data.ts:444",
  },
  {
    id: "proyectos.listar-oradores",
    area: "proyectos",
    metodo: "GET",
    ruta: "/jobs/{id}/speakers",
    resumen: "Quién habla en un proyecto, con su nombre y su color.",
    descripcion:
      "La transcripción pinta el nombre de cada orador; hoy son los dos de la semilla («Ana Ruiz» e «Invitado») para todos los proyectos.",
    estado: "por-construir",
    auth: "sesion",
    parametros: [P_ID],
    respuesta: {
      tipo: "Speaker[]",
      definidoEn: "lib/types.ts:107",
      campos: [
        {
          nombre: "id",
          tipo: "string",
          requerido: true,
          descripcion: "Lo que lleva `TranscriptCue.speaker`.",
        },
        {
          nombre: "name",
          tipo: "string",
          requerido: true,
          descripcion: "Nombre visible.",
        },
        {
          nombre: "color",
          tipo: "string",
          requerido: true,
          descripcion:
            "Un color de la marca como variable CSS (`var(--color-blue-500)`).",
        },
        { nombre: "avatarUrl", tipo: "string", requerido: false, descripcion: "Foto." },
      ],
      ejemplo: [
        { id: "sp1", name: "Ana Ruiz", color: "var(--color-blue-500)" },
        { id: "sp2", name: "Invitado", color: "var(--color-brand-500)" },
      ],
    },
    errores: [NO_ENCONTRADO("El proyecto"), ...ERRORES_API],
    reglas: [
      "Cada `speaker` de la transcripción tiene que estar aquí; si no, la transcripción enseña el id en crudo.",
    ],
    origen: "lib/mock-data.ts:50",
  },

  /* --- El texto con el que sale cada clip: hoy localStorage -------------- */
  {
    id: "proyectos.listar-copias-clip",
    area: "proyectos",
    metodo: "GET",
    ruta: "/jobs/{id}/clips/{clipId}/copias",
    resumen: "El texto propio de un clip en cada red.",
    descripcion:
      "Solo lo propio del clip: lo que no tiene, lo hereda de la plantilla del proyecto (Operaciones › Publicación). Hoy vive en `localStorage`, clave `clipealo-publicacion-v1`, mapa `copias` con claves `clipId:red`.",
    estado: "por-construir",
    auth: "sesion",
    parametros: [P_ID, P_CLIP],
    respuesta: {
      tipo: "Partial<Record<SocialId, CopiaPublicacion>>",
      definidoEn: "lib/publicacion.ts:44",
      ejemplo: { tiktok: COPIA_TIKTOK },
    },
    errores: [NO_ENCONTRADO("El clip"), ...ERRORES_API],
    reglas: [
      "Una red sin texto propio no sale en el mapa. Hoy la ficha llega a escribir copias vacías, pero no cuentan: la ficha las trata como heredadas (`copiaHeredada`, lib/publicacion.ts:201) y al volver a leer el almacén se descartan (lib/publicacion.ts:237).",
      "Nunca mezcla con la plantilla: el clip que se aparta se aparta entero (lib/publicacion.ts:190).",
    ],
    origen: "lib/publicacion.ts:64",
  },
  {
    id: "proyectos.guardar-copia-clip",
    area: "proyectos",
    metodo: "PUT",
    ruta: "/jobs/{id}/clips/{clipId}/copias/{red}",
    resumen: "Guardar el título, el texto y los hashtags de un clip en una red.",
    descripcion:
      "La ficha guarda al teclear, sin botón. Escribir aquí es apartar el clip de la plantilla de su proyecto en esa red.",
    estado: "por-construir",
    auth: "sesion",
    parametros: [P_ID, P_CLIP, P_RED],
    cuerpo: {
      tipo: "CopiaPublicacion",
      definidoEn: "lib/publicacion.ts:44",
      campos: [
        {
          nombre: "titulo",
          tipo: "string",
          requerido: true,
          descripcion:
            "Solo YouTube tiene título aparte (100); en las demás redes abre el texto.",
        },
        {
          nombre: "texto",
          tipo: "string",
          requerido: true,
          descripcion: "Caption, descripción o post.",
        },
        {
          nombre: "hashtags",
          tipo: "string[]",
          requerido: true,
          descripcion: "Con «#», sin repetidos.",
        },
      ],
      ejemplo: COPIA_TIKTOK,
    },
    respuesta: {
      tipo: "CopiaPublicacion",
      definidoEn: "lib/publicacion.ts:44",
      ejemplo: COPIA_TIKTOK,
    },
    errores: [NO_ENCONTRADO("El clip"), ...ERRORES_API],
    reglas: [
      "Guardar no valida longitudes: la ficha guarda lo que se teclea aunque pase del límite. El bloqueo es al publicar (`BLOQUEA_PUBLICACION`, lib/publicacion.ts:107).",
      "Límites por red (lib/publicacion.ts:35): TikTok e Instagram 2.200 caracteres y 5 hashtags; YouTube título 100, texto 5.000 y 15 hashtags; X 280 y 2; LinkedIn 3.000 y 5; Facebook 63.206 y 5.",
      "Hashtags normalizados como el front (`hashtagsDe`, lib/publicacion.ts:85): con «#» delante, sin espacios y sin repetidos sin distinguir mayúsculas.",
      "Una copia sin título, sin texto y sin hashtags equivale a borrarla.",
      "Es el texto con el que Clipealo publica: viaja con la publicación (docs/costuras-backend.md).",
    ],
    origen: "hooks/use-publicacion.ts:99",
  },
  {
    id: "proyectos.borrar-copia-clip",
    area: "proyectos",
    metodo: "DELETE",
    ruta: "/jobs/{id}/clips/{clipId}/copias/{red}",
    resumen:
      "Quitar el texto propio de un clip en una red para que vuelva a heredar la plantilla.",
    descripcion:
      "Lo que hace «Volver a la plantilla». Borra lo propio, no copia la plantilla encima: si la copiara, mejorar la plantilla dejaría de llegar a ese clip.",
    estado: "por-construir",
    auth: "sesion",
    parametros: [P_ID, P_CLIP, P_RED],
    respuesta: { tipo: "void", ejemplo: null },
    errores: [NO_ENCONTRADO("El clip"), ...ERRORES_API],
    reglas: [
      "Responde 204. Borrar lo que no existe no es un error: el resultado es el mismo.",
    ],
    origen: "hooks/use-publicacion.ts:106",
  },
]
