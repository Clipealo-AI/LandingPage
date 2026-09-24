import type { Campo, Endpoint, ErrorDoc, Esquema } from "@/lib/wiki/tipos"

/*
 * Formación no tiene hoy ninguna llamada a `pedir()`: el catálogo son las
 * semillas de `lib/formacion.ts` más los parches que el admin guarda en su
 * navegador (`clipealo-formacion-catalogo-v1`), y el avance de cada alumno vive
 * en el suyo (`clipealo-formacion-v1`). Todo lo de aquí es `por-construir`, con
 * los tipos que el front ya usa para que el día que exista la API solo cambien
 * los cuerpos de `hooks/use-catalogo-formacion.ts` y
 * `components/formacion/use-progreso.ts`.
 */

/* ---------------------------------------------------------------------------
   Piezas compartidas
   --------------------------------------------------------------------------- */

const CAMPOS_LECCION: Campo[] = [
  {
    nombre: "id",
    tipo: "string",
    requerido: true,
    descripcion:
      "Estable para siempre (`lec_gancho`): lo enlazan las rutas y el progreso de cada alumno.",
  },
  {
    nombre: "titulo",
    tipo: "string",
    requerido: true,
    descripcion: "Lo que lee el clipero.",
  },
  {
    nombre: "descripcion",
    tipo: "string",
    requerido: true,
    descripcion: "De qué va. Es lo que se ve aunque la clase tenga candado.",
  },
  {
    nombre: "duracionSeg",
    tipo: "number",
    requerido: true,
    descripcion: "Duración en segundos, entre 30 y 3.600.",
  },
  {
    nombre: "nivel",
    tipo: '"inicio" | "medio" | "avanzado"',
    requerido: true,
    descripcion: "Se cruza con la experiencia del onboarding para recomendarla.",
  },
  {
    nombre: "temas",
    tipo: "Vertical[]",
    requerido: true,
    descripcion: "De 1 a 6 verticales de `lib/taxonomia.ts`: por ellos se recomienda.",
  },
  {
    nombre: "redes",
    tipo: "SocialId[]",
    requerido: false,
    descripcion: "Solo si la clase habla de una red concreta. Vacío no se guarda.",
  },
  {
    nombre: "video",
    tipo: "{ url?: string; portada?: string }",
    requerido: true,
    descripcion:
      "Sin `url`, el reproductor mantiene el encuadre con el título y dice que el video está por subir.",
  },
  {
    nombre: "planMinimo",
    tipo: '"free" | "creator" | "business"',
    requerido: true,
    descripcion: "Escalón mínimo para verla entera. `free`: la ve todo el mundo.",
  },
  {
    nombre: "estado",
    tipo: '"borrador" | "publicada" | "despublicada"',
    requerido: true,
    descripcion: "Solo `publicada` existe para el alumno. Ninguno de los tres borra.",
  },
  {
    nombre: "publicadaEn",
    tipo: "string",
    requerido: true,
    descripcion:
      "ISO. La fecha que ve el alumno. En un alta, el momento de crearla (también si nace como borrador); después solo cambia cuando la clase pasa a `publicada` desde otro estado. Corregir una clase ya publicada no la mueve.",
  },
  {
    nombre: "editadaEn",
    tipo: "string",
    requerido: false,
    descripcion: "ISO de la última vez que el admin la tocó. Vacío en las semillas.",
  },
  {
    nombre: "autor",
    tipo: '"clipealo"',
    requerido: true,
    descripcion: "Siempre el equipo.",
  },
]

/** La clase de fábrica «El gancho», tal cual está en las semillas. */
const EJ_GANCHO = {
  id: "lec_gancho",
  titulo: "El gancho: los tres primeros segundos",
  descripcion:
    "Cuatro formas de abrir un clip y cómo elegir la que encaja con el momento que has cortado, sin prometer lo que no hay.",
  duracionSeg: 300,
  nivel: "medio",
  temas: ["podcast", "humor", "negocios", "finanzas", "tecnologia"],
  video: {},
  planMinimo: "creator",
  estado: "publicada",
  publicadaEn: "2026-08-06T09:00:00.000Z",
  autor: "clipealo",
}

const EJ_QUE_FUNCIONA = {
  id: "lec_que_funciona",
  titulo: "Qué hace que un clip funcione",
  descripcion:
    "Los tres ingredientes que repiten los clips que se ven enteros: una idea, un conflicto y un final que no se explica.",
  duracionSeg: 125,
  nivel: "inicio",
  temas: ["podcast", "directos-irl", "gaming", "humor"],
  video: {},
  planMinimo: "free",
  estado: "publicada",
  publicadaEn: "2026-07-02T09:00:00.000Z",
  autor: "clipealo",
}

const EJ_RUTA_MAS_VISTAS = {
  id: "ruta_mas_vistas",
  titulo: "Sube tus vistas",
  descripcion:
    "Ya publicas: ahora el gancho, la salida a cada red y los números que dicen qué repetir.",
  lecciones: ["lec_gancho", "lec_publicar", "lec_campanas", "lec_analiticas"],
  para: ["regular", "clientes"],
}

const RESPUESTA_CATALOGO = (ejemplo: unknown): Esquema => ({
  tipo: "Catalogo",
  definidoEn: "lib/formacion.ts:260",
  campos: [
    {
      nombre: "lecciones",
      tipo: "Leccion[]",
      requerido: true,
      descripcion: "Las clases (`Leccion`, lib/formacion.ts:54).",
    },
    {
      nombre: "rutas",
      tipo: "Ruta[]",
      requerido: true,
      descripcion:
        "Las rutas (`Ruta`, lib/formacion.ts:87): título, descripción, ids de clase en orden y a qué experiencia se proponen.",
    },
  ],
  ejemplo,
})

/** El avance de Ana Ruiz (`u_ana`), que clipea con regularidad. */
const EJ_PROGRESO = {
  version: 1,
  vistas: {
    lec_gancho: {
      segundoVisto: 300,
      completada: true,
      vistaEn: "2026-09-15T18:42:10.000Z",
    },
    lec_publicar: {
      segundoVisto: 142,
      completada: false,
      vistaEn: "2026-09-18T19:05:33.000Z",
    },
  },
  ocultas: ["ruta_primera_semana"],
}

const RESPUESTA_PROGRESO = (ejemplo: unknown = EJ_PROGRESO): Esquema => ({
  tipo: "ProgresoFormacion",
  definidoEn: "lib/formacion.ts:432",
  campos: [
    {
      nombre: "version",
      tipo: "number",
      requerido: true,
      descripcion: "`FORMACION_VERSION`, hoy 1.",
    },
    {
      nombre: "vistas",
      tipo: "Record<string, VistaLeccion>",
      requerido: true,
      descripcion:
        "Por id de clase, solo las empezadas: `segundoVisto` (el punto más lejano), `completada` y `vistaEn` (ISO).",
    },
    {
      nombre: "ocultas",
      tipo: "string[]",
      requerido: false,
      descripcion: "Ids de las rutas apartadas con «Ya me lo sé».",
    },
  ],
  ejemplo,
})

const PARAM_LECCION: Campo = {
  nombre: "leccionId",
  tipo: "string",
  requerido: true,
  en: "ruta",
  descripcion: "El id de la clase (`lec_publicar`).",
}

const PARAM_ID_CLASE: Campo = {
  nombre: "id",
  tipo: "string",
  requerido: true,
  en: "ruta",
  descripcion: "El id de la clase (`lec_gancho`, o `lec_…` si la creó el panel).",
}

const PARAM_ID_RUTA: Campo = {
  nombre: "id",
  tipo: "string",
  requerido: true,
  en: "ruta",
  descripcion: "El id de la ruta (`ruta_mas_vistas`, o `ruta_…` si la creó el panel).",
}

const SIN_SESION: ErrorDoc = {
  codigo: "no-autorizado",
  http: 401,
  cuando: "No hay sesión.",
  frase: "common.errors.no-autorizado",
  bloquea: true,
}

const NO_ADMIN: ErrorDoc = {
  codigo: "no-autorizado",
  http: 403,
  cuando: "La sesión no es de administración.",
  frase: "common.errors.no-autorizado",
  bloquea: true,
}

const CLASE_NO_ENCONTRADA: ErrorDoc = {
  codigo: "no-encontrado",
  http: 404,
  cuando: "La clase no existe o no está publicada.",
  frase: "common.errors.no-encontrado",
  bloquea: true,
}

const FUERA_DEL_PLAN: ErrorDoc = {
  codigo: "no-autorizado",
  http: 403,
  cuando:
    "El plan de la sesión no alcanza la clase (`alAlcance` da `false`): hoy el front ni siquiera pinta el reproductor, pero el servidor no puede fiarse.",
  frase: "common.errors.no-autorizado",
  bloquea: true,
}

/** Los códigos de `validarClase`, con su frase en `admin.formacion.form.errors`. */
const ERRORES_CLASE: ErrorDoc[] = [
  {
    codigo: "tituloCorto",
    http: 422,
    cuando: "El título, sin espacios a los lados, tiene menos de 6 caracteres.",
    frase: "admin.formacion.form.errors.tituloCorto",
    bloquea: true,
  },
  {
    codigo: "descripcionCorta",
    http: 422,
    cuando: "La descripción, sin espacios a los lados, tiene menos de 20 caracteres.",
    frase: "admin.formacion.form.errors.descripcionCorta",
    bloquea: true,
  },
  {
    codigo: "duracionRango",
    http: 422,
    cuando: "La duración no es un número o está fuera de 30–3.600 segundos.",
    frase: "admin.formacion.form.errors.duracionRango",
    bloquea: true,
  },
  {
    codigo: "temasRequeridos",
    http: 422,
    cuando: "No lleva ningún tema.",
    frase: "admin.formacion.form.errors.temasRequeridos",
    bloquea: true,
  },
  {
    codigo: "temasDemasiados",
    http: 422,
    cuando: "Lleva más de 6 temas.",
    frase: "admin.formacion.form.errors.temasDemasiados",
    bloquea: true,
  },
  {
    codigo: "videoUrl",
    http: 422,
    cuando: "`videoUrl` no está vacío y no casa con `^https?://\\S+\\.\\S+`.",
    frase: "admin.formacion.form.errors.videoUrl",
    bloquea: true,
  },
  {
    codigo: "portadaUrl",
    http: 422,
    cuando: "`portadaUrl` no está vacío y no casa con `^https?://\\S+\\.\\S+`.",
    frase: "admin.formacion.form.errors.portadaUrl",
    bloquea: true,
  },
  {
    codigo: "publicadaSinVideo",
    cuando:
      "Se publica sin `videoUrl`. No es un error: se guarda igual y el panel lo cuenta en «Sin video».",
    frase: "admin.formacion.form.errors.publicadaSinVideo",
    bloquea: false,
  },
]

/** Los códigos de `validarRuta`, con su frase en `admin.formacion.rutas.form.errors`. */
const ERRORES_RUTA: ErrorDoc[] = [
  {
    codigo: "tituloCorto",
    http: 422,
    cuando: "El título, sin espacios a los lados, tiene menos de 6 caracteres.",
    frase: "admin.formacion.rutas.form.errors.tituloCorto",
    bloquea: true,
  },
  {
    codigo: "descripcionCorta",
    http: 422,
    cuando: "La descripción, sin espacios a los lados, tiene menos de 20 caracteres.",
    frase: "admin.formacion.rutas.form.errors.descripcionCorta",
    bloquea: true,
  },
  {
    codigo: "sinPara",
    http: 422,
    cuando: "`para` está vacío: no se sabe a quién proponerla.",
    frase: "admin.formacion.rutas.form.errors.sinPara",
    bloquea: true,
  },
  {
    codigo: "sinClases",
    cuando:
      "No lleva ninguna clase. Se guarda igual: el clipero no la ve hasta que lleve alguna.",
    frase: "admin.formacion.rutas.form.errors.sinClases",
    bloquea: false,
  },
  {
    codigo: "sinPublicadas",
    cuando:
      "Ninguna de sus clases está publicada. Se guarda igual: el clipero no la ve todavía.",
    frase: "admin.formacion.rutas.form.errors.sinPublicadas",
    bloquea: false,
  },
]

const CAMPOS_BORRADOR_CLASE: Campo[] = [
  {
    nombre: "id",
    tipo: "string",
    requerido: false,
    descripcion:
      "Sin él es un alta; al editar va el de la clase y debe coincidir con el `{id}` de la URL.",
  },
  {
    nombre: "titulo",
    tipo: "string",
    requerido: true,
    descripcion: "Al menos 6 caracteres.",
  },
  {
    nombre: "descripcion",
    tipo: "string",
    requerido: true,
    descripcion: "Al menos 20 caracteres.",
  },
  {
    nombre: "duracionSeg",
    tipo: "number",
    requerido: true,
    descripcion: "Entre 30 y 3.600. El formulario arranca en 180.",
  },
  {
    nombre: "nivel",
    tipo: '"inicio" | "medio" | "avanzado"',
    requerido: true,
    descripcion: "Arranca en `inicio`.",
  },
  { nombre: "temas", tipo: "Vertical[]", requerido: true, descripcion: "De 1 a 6." },
  {
    nombre: "redes",
    tipo: "SocialId[]",
    requerido: true,
    descripcion: "Puede ir vacío.",
  },
  {
    nombre: "videoUrl",
    tipo: "string",
    requerido: true,
    descripcion: "Vacío o un enlace http(s) con dominio. Se guarda en `video.url`.",
  },
  {
    nombre: "portadaUrl",
    tipo: "string",
    requerido: true,
    descripcion: "Vacío o un enlace http(s) con dominio. Se guarda en `video.portada`.",
  },
  {
    nombre: "planMinimo",
    tipo: '"free" | "creator" | "business"',
    requerido: true,
    descripcion: "Arranca en `free` (Prueba).",
  },
  {
    nombre: "estado",
    tipo: '"borrador" | "publicada" | "despublicada"',
    requerido: true,
    descripcion: "Arranca en `borrador`.",
  },
]

const CAMPOS_BORRADOR_RUTA: Campo[] = [
  {
    nombre: "id",
    tipo: "string",
    requerido: false,
    descripcion: "Sin él es una ruta nueva.",
  },
  {
    nombre: "titulo",
    tipo: "string",
    requerido: true,
    descripcion: "Al menos 6 caracteres.",
  },
  {
    nombre: "descripcion",
    tipo: "string",
    requerido: true,
    descripcion: "Al menos 20 caracteres.",
  },
  {
    nombre: "lecciones",
    tipo: "string[]",
    requerido: true,
    descripcion:
      "Ids de clase en el orden en que se ven. Puede ir vacía; publicadas o no.",
  },
  {
    nombre: "para",
    tipo: "Experiencia[]",
    requerido: true,
    descripcion: "Al menos una de `nunca`, `diversion`, `regular`, `clientes`.",
  },
]

/* ---------------------------------------------------------------------------
   Endpoints
   --------------------------------------------------------------------------- */

export const ENDPOINTS: Endpoint[] = [
  /* --- Lo que ve el alumno ------------------------------------------------ */
  {
    id: "formacion.listar-catalogo",
    area: "formacion",
    metodo: "GET",
    ruta: "/formacion/catalogo",
    resumen: "Las clases publicadas y las rutas que ve quien entra en Formación.",
    descripcion:
      "Sustituye a las semillas (`LECCIONES`, `RUTAS`) más los parches que hoy guarda el admin en su navegador. El panel del alumno ya ordena, recomienda y calcula el avance de cada ruta a partir de un `Catalogo`, así que no hace falta ningún campo calculado.",
    estado: "por-construir",
    auth: "sesion",
    respuesta: RESPUESTA_CATALOGO({
      lecciones: [EJ_QUE_FUNCIONA, EJ_GANCHO],
      rutas: [EJ_RUTA_MAS_VISTAS],
    }),
    errores: [SIN_SESION],
    reglas: [
      'Solo clases con `estado: "publicada"` (`publicadas`, lib/formacion.ts:361). Un borrador o una clase retirada no se manda, pero su id no se reutiliza nunca: el progreso y las rutas apuntan a él (docs/costuras-backend.md:160).',
      "Una clase que el plan de la sesión no alcanza se manda igual —portada, título, duración, nivel, temas y descripción—, pero SIN `video.url`. Alcanza si `planMinimo` es `free`, o si el plan tiene la capacidad `clasesDePago` y llega al escalón de la clase (`alAlcance`, lib/formacion.ts:393). Hoy el candado es solo de interfaz (`MuroPlan`) y la decisión tiene que ser del servidor.",
      "Cada ruta lleva sus `lecciones` en orden y solo con ids que existen (`limpiarRuta`, lib/formacion.ts:1257). El plan de la ruta no viaja: es el más alto de sus clases publicadas (`planMinimoRuta`).",
      "El título y la descripción de una clase o una ruta de fábrica se devuelven con el texto de la semilla, en español: el front los traduce por id mientras el texto sea el de fábrica y enseña tal cual el que haya reescrito el admin (`useTextoClase`).",
      "El orden de `lecciones` da igual: la rejilla la ordena el front con el perfil del clipero (`recomendadas`).",
    ],
    origen: "hooks/use-catalogo-formacion.ts:237",
  },
  {
    id: "formacion.leer-progreso",
    area: "formacion",
    metodo: "GET",
    ruta: "/formacion/progreso",
    resumen: "Lo que la persona lleva visto de cada clase y las rutas que ha apartado.",
    descripcion:
      "Hoy vive en el `localStorage` de cada navegador (`clipealo-formacion-v1`), así que el panel de admin no puede contar vistas (docs/costuras-backend.md:62). Con este endpoint el avance sigue a la persona entre dispositivos.",
    estado: "por-construir",
    auth: "sesion",
    respuesta: RESPUESTA_PROGRESO(),
    errores: [SIN_SESION],
    reglas: [
      "Es de la persona, no del navegador: el mismo avance en cualquier dispositivo.",
      "Sin nada guardado responde `{ version: 1, vistas: {}, ocultas: [] }` (`PROGRESO_VACIO`), nunca 404.",
      "Se conserva el avance de las clases retiradas o borradas: si una vuelve a publicarse, vuelve intacto (`migrarProgreso`, lib/formacion.ts:819). No suma en ningún recuento, porque el front recorre el catálogo y no este mapa.",
      "`segundoVisto` es un entero entre 0 y 43.200 (12 h, `TOPE_SEGUNDOS_VISTOS`, lib/formacion.ts:798). Una entrada sin avance y sin completar no se guarda.",
    ],
    origen: "components/formacion/use-progreso.ts:111",
  },
  {
    id: "formacion.guardar-avance",
    area: "formacion",
    metodo: "PUT",
    ruta: "/formacion/progreso/clases/{leccionId}",
    resumen: "Avanza el punto visto de una clase mientras se reproduce.",
    descripcion:
      "Es `verSegundo` en el servidor. El reproductor avisa en cada cambio del cabezal (`onTimeChange`) y el hook lo manda tal cual; el servidor decide si eso es avanzar.",
    estado: "por-construir",
    auth: "sesion",
    parametros: [PARAM_LECCION],
    cuerpo: {
      tipo: "{ segundo: number }",
      definidoEn: "components/formacion/use-progreso.ts:117",
      campos: [
        {
          nombre: "segundo",
          tipo: "number",
          requerido: true,
          descripcion: "Dónde está el cabezal, en segundos.",
        },
      ],
      ejemplo: { segundo: 142 },
    },
    respuesta: RESPUESTA_PROGRESO(),
    errores: [SIN_SESION, CLASE_NO_ENCONTRADA, FUERA_DEL_PLAN],
    reglas: [
      "Nunca retrocede: guarda el mayor entre lo que había y `floor(segundo)`, acotado a [0, `duracionSeg`] (`verSegundo`, lib/formacion.ts:495). Volver atrás para repasar no borra lo visto.",
      "Marca `completada` al llegar a `duracionSeg × 0,9` (`UMBRAL_COMPLETADA`, lib/formacion.ts:422): en «Publicar en TikTok, Reels y Shorts» (330 s), en el segundo 297. Una clase completada no se descompleta aquí.",
      "`vistaEn` lo pone el reloj del servidor.",
      "Si no cambia nada, no escribe y responde lo mismo (lib/formacion.ts:510): el reproductor lo llama muchas veces seguidas y tiene que aguantar ráfagas.",
      "Solo clases publicadas y al alcance del plan de la sesión.",
    ],
    origen: "components/formacion/use-progreso.ts:117",
  },
  {
    id: "formacion.completar-clase",
    area: "formacion",
    metodo: "POST",
    ruta: "/formacion/progreso/clases/{leccionId}/completar",
    resumen:
      "«Marcar como vista»: da la clase por terminada sin exigir que el video corra.",
    estado: "por-construir",
    auth: "sesion",
    parametros: [PARAM_LECCION],
    respuesta: RESPUESTA_PROGRESO({
      ...EJ_PROGRESO,
      vistas: {
        ...EJ_PROGRESO.vistas,
        lec_publicar: {
          segundoVisto: 330,
          completada: true,
          vistaEn: "2026-09-21T10:14:02.000Z",
        },
      },
    }),
    errores: [SIN_SESION, CLASE_NO_ENCONTRADA, FUERA_DEL_PLAN],
    reglas: [
      "Deja `segundoVisto = duracionSeg`, `completada: true` y `vistaEn` con el reloj del servidor (`completar`, lib/formacion.ts:521).",
      "Idempotente: si ya estaba completada no cambia nada, tampoco la fecha (lib/formacion.ts:527).",
      "Solo clases publicadas y al alcance del plan: en una con candado el botón no existe.",
      "Lo completado sigue contando aunque la clase pase después a ser de pago: el muro impide volver a verla, no borra un logro (`progresoRuta`, lib/formacion.ts:575).",
    ],
    origen: "components/formacion/use-progreso.ts:120",
  },
  {
    id: "formacion.reiniciar-clase",
    area: "formacion",
    metodo: "DELETE",
    ruta: "/formacion/progreso/clases/{leccionId}",
    resumen: "«Empezar de nuevo»: borra lo visto de una clase.",
    estado: "por-construir",
    auth: "sesion",
    parametros: [PARAM_LECCION],
    respuesta: RESPUESTA_PROGRESO({
      version: 1,
      vistas: { lec_gancho: EJ_PROGRESO.vistas.lec_gancho },
      ocultas: EJ_PROGRESO.ocultas,
    }),
    errores: [SIN_SESION],
    reglas: [
      "Quita la entrada entera de esa clase: segundo visto y completada (`reiniciar`, lib/formacion.ts:542).",
      "Si no había nada, no cambia nada y responde igual: nunca 404.",
      "No pide plan: «Empezar de nuevo» sale en cualquier clase empezada, también en una que después pasó a ser de pago (components/formacion/reproductor-leccion.tsx:216).",
    ],
    origen: "components/formacion/use-progreso.ts:121",
  },
  {
    id: "formacion.ocultar-ruta",
    area: "formacion",
    metodo: "PUT",
    ruta: "/formacion/progreso/rutas/{rutaId}",
    resumen: "Aparta una ruta con «Ya me lo sé» o la vuelve a enseñar.",
    estado: "por-construir",
    auth: "sesion",
    parametros: [
      {
        nombre: "rutaId",
        tipo: "string",
        requerido: true,
        en: "ruta",
        descripcion: "El id de la ruta (`ruta_primera_semana`).",
      },
    ],
    cuerpo: {
      tipo: "{ oculta: boolean }",
      definidoEn: "components/formacion/use-progreso.ts:127",
      campos: [
        {
          nombre: "oculta",
          tipo: "boolean",
          requerido: true,
          descripcion:
            "`true` la aparta; `false` la devuelve. Mismo camino en los dos sentidos.",
        },
      ],
      ejemplo: { oculta: true },
    },
    respuesta: RESPUESTA_PROGRESO(),
    errores: [
      SIN_SESION,
      {
        codigo: "no-encontrado",
        http: 404,
        cuando: "La ruta no existe.",
        frase: "common.errors.no-encontrado",
        bloquea: true,
      },
    ],
    reglas: [
      "Añade o quita `rutaId` de `ocultas` sin tocar `vistas` (`ocultarRuta`, lib/formacion.ts:457): apartar no es terminar.",
      "Idempotente: pedir lo que ya está no cambia nada (lib/formacion.ts:463).",
      "Persiste: es una decisión de la persona y tiene que aguantar la recarga y el cambio de dispositivo. Sobrevive aunque el resto del progreso guardado esté roto (lib/formacion.ts:806).",
    ],
    origen: "components/formacion/use-progreso.ts:127",
  },

  /* --- Lo que edita el admin ---------------------------------------------- */
  {
    id: "formacion.listar-catalogo-admin",
    area: "formacion",
    metodo: "GET",
    ruta: "/admin/formacion",
    resumen:
      "El catálogo entero para el backoffice: clases en los tres estados y todas las rutas.",
    descripcion:
      "Hoy `getAdminFormacion()` devuelve las semillas (`CATALOGO_SEMILLA`) y el navegador del admin pone encima sus cambios (`hooks/use-catalogo-formacion.ts`). Con servidor, esta función devuelve el catálogo de verdad y nada más cambia (lib/api/admin.ts:187).",
    estado: "por-construir",
    auth: "admin",
    respuesta: RESPUESTA_CATALOGO({
      lecciones: [EJ_GANCHO, EJ_QUE_FUNCIONA],
      rutas: [EJ_RUTA_MAS_VISTAS],
    }),
    errores: [NO_ADMIN],
    reglas: [
      "Todas las clases, también los borradores y las retiradas: el panel las lista, las filtra por estado y las ordena dentro de las rutas.",
      "El layout del backoffice cuenta con esta misma respuesta las publicadas sin `video.url` para el número de la barra lateral (app/[locale]/(admin)/layout.tsx:40).",
      "No devuelve vistas: mientras el avance viva en el navegador de cada alumno no hay forma de contarlas, y el panel lo dice en vez de pintar un cero (`resumenCatalogo`, lib/formacion.ts:1055).",
    ],
    origen: "lib/api/admin.ts:190",
  },
  {
    id: "formacion.crear-clase",
    area: "formacion",
    metodo: "POST",
    ruta: "/admin/formacion/clases",
    resumen: "Da de alta una clase nueva, como borrador o ya publicada.",
    estado: "por-construir",
    auth: "admin",
    cuerpo: {
      tipo: "BorradorClase",
      definidoEn: "lib/formacion.ts:882",
      campos: CAMPOS_BORRADOR_CLASE,
      ejemplo: {
        titulo: "Recorta un directo largo sin perder el hilo",
        descripcion:
          "Cómo sacar tres clips de un directo de dos horas: dónde buscar los momentos y cómo cerrar cada uno sin contexto.",
        duracionSeg: 240,
        nivel: "medio",
        temas: ["directos-irl", "gaming"],
        redes: ["tiktok"],
        videoUrl: "",
        portadaUrl: "",
        planMinimo: "creator",
        estado: "borrador",
      },
    },
    respuesta: {
      tipo: "Leccion",
      definidoEn: "lib/formacion.ts:54",
      campos: CAMPOS_LECCION,
      ejemplo: {
        id: "lec_mub2qf40k7rd",
        titulo: "Recorta un directo largo sin perder el hilo",
        descripcion:
          "Cómo sacar tres clips de un directo de dos horas: dónde buscar los momentos y cómo cerrar cada uno sin contexto.",
        duracionSeg: 240,
        nivel: "medio",
        temas: ["directos-irl", "gaming"],
        redes: ["tiktok"],
        video: {},
        planMinimo: "creator",
        estado: "borrador",
        publicadaEn: "2026-09-21T10:00:00.000Z",
        editadaEn: "2026-09-21T10:00:00.000Z",
        autor: "clipealo",
      },
    },
    errores: [NO_ADMIN, ...ERRORES_CLASE],
    reglas: [
      "Valida con los límites de `LIMITES_CLASE` (lib/formacion.ts:873): título ≥ 6 caracteres, descripción ≥ 20, duración entre 30 y 3.600 s, de 1 a 6 temas, y enlaces de video y portada vacíos o con `^https?://\\S+\\.\\S+`. Publicar sin video avisa y no bloquea (`validarClase`, lib/formacion.ts:939).",
      "Devuelve los mismos códigos que el front (`AvisoClase.code`, lib/formacion.ts:920), como pide docs/costuras-backend.md:163. Ojo: hoy `pedir()` convierte un 422 en `conflicto` (lib/api/errores.ts:32) y guarda el cuerpo solo para el registro (lib/api/cliente.ts:70), así que para pintar el error en su campo el front tendrá que leer ese cuerpo.",
      "El id lo pone el servidor: `lec_` + instante en base 36 + 4 caracteres al azar (`nuevoIdClase`, lib/formacion.ts:1033).",
      "`publicadaEn` y `editadaEn` = ahora; en un borrador, `publicadaEn` es la fecha de creación. Recorta espacios de título, descripción y enlaces, redondea la duración, no guarda `redes` vacío y el autor es siempre `clipealo` (`claseDeBorrador`, lib/formacion.ts:1005).",
      "No acepta temas ni redes fuera de la taxonomía ni niveles, planes o estados que no existen: el front los descarta al limpiar lo guardado (`migrarCatalogo`, lib/formacion.ts:1120) y el servidor no debe guardarlos.",
    ],
    origen: "hooks/use-catalogo-formacion.ts:107",
  },
  {
    id: "formacion.editar-clase",
    area: "formacion",
    metodo: "PUT",
    ruta: "/admin/formacion/clases/{id}",
    resumen: "Guarda la clase editada en su diálogo.",
    descripcion:
      "El front manda el borrador entero (`BorradorClase` con `id`). En la demo, de una clase de fábrica solo se guarda lo que cambia (`parcheLeccion`) para que una mejora de la semilla siga llegando; con servidor, la clase guardada es la fuente.",
    estado: "por-construir",
    auth: "admin",
    parametros: [PARAM_ID_CLASE],
    cuerpo: {
      tipo: "BorradorClase",
      definidoEn: "lib/formacion.ts:882",
      campos: CAMPOS_BORRADOR_CLASE,
      ejemplo: {
        id: "lec_gancho",
        titulo: "El gancho: los tres primeros segundos",
        descripcion:
          "Cuatro formas de abrir un clip y cómo elegir la que encaja con el momento que has cortado, sin prometer lo que no hay.",
        duracionSeg: 300,
        nivel: "medio",
        temas: ["podcast", "humor", "negocios", "finanzas", "tecnologia"],
        redes: [],
        videoUrl: "https://clipealo.app/formacion/lec_gancho.mp4",
        portadaUrl: "",
        planMinimo: "creator",
        estado: "publicada",
      },
    },
    respuesta: {
      tipo: "Leccion",
      definidoEn: "lib/formacion.ts:54",
      campos: CAMPOS_LECCION,
      ejemplo: {
        ...EJ_GANCHO,
        video: { url: "https://clipealo.app/formacion/lec_gancho.mp4" },
        editadaEn: "2026-09-21T10:20:00.000Z",
      },
    },
    errores: [
      NO_ADMIN,
      { ...CLASE_NO_ENCONTRADA, cuando: "No hay ninguna clase con ese id." },
      ...ERRORES_CLASE,
    ],
    reglas: [
      "Mismas validaciones y mismos códigos que al crear.",
      "`publicadaEn` = ahora solo si la clase pasa a `publicada` desde otro estado (también al volver de `despublicada`); si ya estaba publicada no se toca, porque moverla al corregir una errata mentiría sobre cuándo salió (`claseDeBorrador`, lib/formacion.ts:1011). `editadaEn` = ahora.",
      "El id no cambia nunca.",
    ],
    origen: "hooks/use-catalogo-formacion.ts:107",
  },
  {
    id: "formacion.cambiar-estado-clase",
    area: "formacion",
    metodo: "PATCH",
    ruta: "/admin/formacion/clases/{id}",
    resumen: "Publica una clase o la retira desde el menú de su fila.",
    estado: "por-construir",
    auth: "admin",
    parametros: [PARAM_ID_CLASE],
    cuerpo: {
      tipo: "{ estado: EstadoClase }",
      definidoEn: "lib/formacion.ts:52",
      campos: [
        {
          nombre: "estado",
          tipo: '"borrador" | "publicada" | "despublicada"',
          requerido: true,
          descripcion: "El estado nuevo. El menú manda `publicada` o `despublicada`.",
        },
      ],
      ejemplo: { estado: "despublicada" },
    },
    respuesta: {
      tipo: "Leccion",
      definidoEn: "lib/formacion.ts:54",
      campos: CAMPOS_LECCION,
      ejemplo: {
        ...EJ_GANCHO,
        estado: "despublicada",
        editadaEn: "2026-09-21T10:30:00.000Z",
      },
    },
    errores: [
      NO_ADMIN,
      { ...CLASE_NO_ENCONTRADA, cuando: "No hay ninguna clase con ese id." },
    ],
    reglas: [
      "Cambiar de estado nunca borra: el id sigue vivo y el avance de los alumnos también. Una clase retirada una semana vuelve intacta.",
      "`editadaEn` = ahora.",
      "`publicadaEn` = ahora al pasar a `publicada` desde otro estado, la misma regla que aplica `claseDeBorrador` al guardar el formulario (lib/formacion.ts:1011). Ojo: el atajo del menú en la demo solo cambia `estado` y `editadaEn` (hooks/use-catalogo-formacion.ts:124), así que un borrador publicado desde el menú conserva como fecha de publicación la de su creación, y una retirada, la antigua. El servidor tiene que aplicar una sola regla para los dos caminos.",
      "Al retirarla deja de salir en /formacion y en sus rutas; quien la tenga abierta la ve cerrarse (components/formacion/formacion-panel.tsx:81).",
    ],
    origen: "hooks/use-catalogo-formacion.ts:124",
  },
  {
    id: "formacion.borrar-clase",
    area: "formacion",
    metodo: "DELETE",
    ruta: "/admin/formacion/clases/{id}",
    resumen: "Borra para siempre una clase creada en el panel.",
    estado: "por-construir",
    auth: "admin",
    parametros: [PARAM_ID_CLASE],
    respuesta: { tipo: "void" },
    errores: [
      NO_ADMIN,
      { ...CLASE_NO_ENCONTRADA, cuando: "No hay ninguna clase con ese id." },
      {
        codigo: "conflicto",
        http: 409,
        cuando:
          "Es una clase de fábrica: esas se retiran, no se borran, porque dejarían rutas apuntando a un id que no existe.",
        frase: "common.errors.conflicto",
        bloquea: true,
      },
    ],
    reglas: [
      "Solo las creadas desde el panel; una semilla se retira (hooks/use-catalogo-formacion.ts:143).",
      "Responde 204 sin cuerpo; el front no lee nada.",
      "Las rutas que la llevaban dejan de apuntar a ella: una ruta no puede tener un paso que no lleva a ninguna parte (`limpiarRuta`, lib/formacion.ts:1261).",
      "El avance de los alumnos en esa clase no se toca: se queda en reserva y no suma en ningún sitio (`migrarProgreso`).",
    ],
    origen: "hooks/use-catalogo-formacion.ts:147",
  },
  {
    id: "formacion.crear-ruta",
    area: "formacion",
    metodo: "POST",
    ruta: "/admin/formacion/rutas",
    resumen: "Crea una ruta nueva: título, descripción y a quién se propone.",
    descripcion:
      "El diálogo no lleva clases: la ruta nace vacía (`RUTA_NUEVA`) y se llena desde su tarjeta con `formacion.editar-ruta`.",
    estado: "por-construir",
    auth: "admin",
    cuerpo: {
      tipo: "BorradorRuta",
      definidoEn: "lib/formacion.ts:1158",
      campos: CAMPOS_BORRADOR_RUTA,
      ejemplo: {
        titulo: "Clipea para marcas",
        descripcion:
          "Lo que mira una agencia antes de aceptarte y cómo medir lo que publicas para ella.",
        lecciones: [],
        para: ["regular", "clientes"],
      },
    },
    respuesta: {
      tipo: "Ruta",
      definidoEn: "lib/formacion.ts:87",
      ejemplo: {
        id: "ruta_mub2qf40p3xa",
        titulo: "Clipea para marcas",
        descripcion:
          "Lo que mira una agencia antes de aceptarte y cómo medir lo que publicas para ella.",
        lecciones: [],
        para: ["regular", "clientes"],
      },
    },
    errores: [NO_ADMIN, ...ERRORES_RUTA],
    reglas: [
      "Valida con `LIMITES_RUTA` (lib/formacion.ts:1156): título ≥ 6 caracteres, descripción ≥ 20 y al menos una experiencia en `para`. Sin clases o solo con clases sin publicar avisa y guarda (`validarRuta`, lib/formacion.ts:1191).",
      "El id lo pone el servidor: `ruta_` + instante en base 36 + 4 caracteres al azar (`nuevoIdRuta`, lib/formacion.ts:1241).",
      "Recorta espacios de título y descripción; `lecciones` solo con ids de clase que existan; `para` solo con valores de `EXPERIENCIA`.",
      "El plan de la ruta no se guarda: es el más alto de sus clases publicadas y se calcula (`planMinimoRuta`, lib/formacion.ts:404).",
    ],
    origen: "hooks/use-catalogo-formacion.ts:157",
  },
  {
    id: "formacion.editar-ruta",
    area: "formacion",
    metodo: "PUT",
    ruta: "/admin/formacion/rutas/{id}",
    resumen:
      "Guarda una ruta entera: sus textos, a quién se propone y sus clases en orden.",
    descripcion:
      "El front manda siempre la ruta completa: al editar el diálogo y también al subir, bajar, añadir o quitar una clase (`moverClaseEnRuta` y `conLecciones` acaban en `guardarRuta`, hooks/use-catalogo-formacion.ts:191).",
    estado: "por-construir",
    auth: "admin",
    parametros: [PARAM_ID_RUTA],
    cuerpo: {
      tipo: "BorradorRuta",
      definidoEn: "lib/formacion.ts:1158",
      campos: CAMPOS_BORRADOR_RUTA,
      ejemplo: {
        id: "ruta_mas_vistas",
        titulo: "Sube tus vistas",
        descripcion:
          "Ya publicas: ahora el gancho, la salida a cada red y los números que dicen qué repetir.",
        lecciones: ["lec_publicar", "lec_gancho", "lec_campanas", "lec_analiticas"],
        para: ["regular", "clientes"],
      },
    },
    respuesta: {
      tipo: "Ruta",
      definidoEn: "lib/formacion.ts:87",
      ejemplo: {
        ...EJ_RUTA_MAS_VISTAS,
        lecciones: ["lec_publicar", "lec_gancho", "lec_campanas", "lec_analiticas"],
      },
    },
    errores: [
      NO_ADMIN,
      {
        codigo: "no-encontrado",
        http: 404,
        cuando: "No hay ninguna ruta con ese id.",
        frase: "common.errors.no-encontrado",
        bloquea: true,
      },
      ...ERRORES_RUTA,
    ],
    reglas: [
      "Mismas validaciones y mismos códigos que al crear.",
      "`lecciones` en el orden en que llega: es el orden en que el clipero las ve. Sin duplicados (añadir una que ya está no hace nada, hooks/use-catalogo-formacion.ts:210) y solo con ids que existan; pueden ser borradores o retiradas, que el alumno no ve.",
      "El id no cambia nunca.",
    ],
    origen: "hooks/use-catalogo-formacion.ts:157",
  },
  {
    id: "formacion.borrar-ruta",
    area: "formacion",
    metodo: "DELETE",
    ruta: "/admin/formacion/rutas/{id}",
    resumen: "Borra para siempre una ruta creada en el panel.",
    estado: "por-construir",
    auth: "admin",
    parametros: [PARAM_ID_RUTA],
    respuesta: { tipo: "void" },
    errores: [
      NO_ADMIN,
      {
        codigo: "no-encontrado",
        http: 404,
        cuando: "No hay ninguna ruta con ese id.",
        frase: "common.errors.no-encontrado",
        bloquea: true,
      },
      {
        codigo: "conflicto",
        http: 409,
        cuando:
          "Es una ruta de fábrica (`ruta_primera_semana`, `ruta_mas_vistas`): solo se borran las creadas en el panel.",
        frase: "common.errors.conflicto",
        bloquea: true,
      },
    ],
    reglas: [
      "Solo las creadas desde el panel (hooks/use-catalogo-formacion.ts:172).",
      "Responde 204 sin cuerpo.",
      "Las clases no se tocan: siguen en el catálogo.",
    ],
    origen: "hooks/use-catalogo-formacion.ts:173",
  },
  {
    id: "formacion.subir-video",
    area: "formacion",
    metodo: "POST",
    ruta: "/admin/formacion/videos",
    resumen: "Sube el archivo de una clase por trozos y devuelve dónde quedó.",
    descripcion:
      "Es el hueco de `UploadTransport`: se entra por `offset` y se sale con los bytes confirmados, como un `PATCH` de tus o una parte de un multipart de S3 (lib/api/upload.ts:4). Hoy el transporte simulado recorre el archivo en trozos de 512 KB y no lo guarda en ninguna parte.",
    estado: "por-construir",
    auth: "admin",
    parametros: [
      {
        nombre: "Upload-Offset",
        tipo: "number",
        requerido: true,
        en: "cabecera",
        descripcion: "Bytes ya confirmados por el servidor: 0 en la primera llamada.",
      },
    ],
    cuerpo: {
      tipo: "UploadTransportParams",
      definidoEn: "lib/api/upload.ts:10",
      campos: [
        {
          nombre: "file",
          tipo: "File",
          requerido: true,
          descripcion:
            "El archivo de video, desde `offset` hasta el final o hasta que se pause.",
        },
      ],
    },
    respuesta: {
      tipo: "UploadTransportResult",
      definidoEn: "lib/api/upload.ts:19",
      campos: [
        {
          nombre: "uploadedBytes",
          tipo: "number",
          requerido: true,
          descripcion: "Bytes confirmados: desde aquí se reanuda.",
        },
        {
          nombre: "completed",
          tipo: "boolean",
          requerido: true,
          descripcion: "`true` cuando ha llegado el archivo entero.",
        },
        {
          nombre: "url",
          tipo: "string",
          requerido: false,
          descripcion:
            "Dónde quedó el archivo (en tus, la cabecera `Location`). El formulario la escribe sola en `videoUrl`.",
        },
      ],
      ejemplo: {
        uploadedBytes: 734003200,
        completed: true,
        url: "https://clipealo.app/formacion/lec_mub2qf40k7rd.mp4",
      },
    },
    errores: [
      NO_ADMIN,
      {
        codigo: "invalidType",
        http: 415,
        cuando: "No es MP4, MOV, WebM ni MKV.",
        frase: "common.video.upload.invalidType",
        bloquea: true,
      },
      {
        codigo: "tooBig",
        http: 413,
        cuando: "Pasa de 8 GB.",
        frase: "common.video.upload.tooBig",
        bloquea: true,
      },
    ],
    reglas: [
      "Solo `video/mp4`, `video/quicktime`, `video/webm` y `video/x-matroska`, hasta 8 GB (components/video/upload-dropzone.tsx:28). El front lo comprueba antes de subir; el servidor también.",
      "Reanudable: responde siempre con los bytes confirmados para que «Reanudar» y «Reintentar desde donde se quedó» sigan desde ahí.",
      "Al completar devuelve `url`. Sin ella el formulario avisa de que no hay dónde guardar el archivo (`admin.formacion.form.sinAlmacenamiento`) y el admin tiene que pegar un enlace.",
    ],
    origen: "lib/api/upload.ts:54",
  },
]
