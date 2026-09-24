import type { Endpoint } from "@/lib/wiki/tipos"

/**
 * Endpoints de «onboarding»: la bienvenida «Tu primer corte», las respuestas del
 * perfil, los consentimientos, el catálogo de creadores y las micropreguntas.
 *
 * Ninguno está conectado todavía: hoy todo vive en el almacén de la cuenta del
 * navegador (`hooks/use-cuenta.ts`, clave `clipealo-cuenta-v1`), en la semilla
 * de creadores (`lib/creadores.ts`) y en el catálogo de micropreguntas
 * (`hooks/use-catalogo-micro.ts`). Cada endpoint sustituye una transición de
 * ese almacén con la misma forma de datos, para que la app no cambie.
 */

const NO_AUTORIZADO = {
  codigo: "no-autorizado",
  http: 401,
  cuando: "No hay sesión o ha caducado.",
  frase: "common.errors.no-autorizado",
  bloquea: true,
} as const

const PROGRESO_EJEMPLO = {
  version: 1,
  taxonomia: 1,
  flujo: "clipero",
  modo: "normal",
  estado: "en-curso",
  pasoActual: "fandom",
  pasosVistos: ["cuenta", "objetivo", "nichos", "fandom"],
  pasosRespondidos: ["cuenta", "objetivo", "nichos"],
  pasosSaltados: [],
  msPorPaso: { cuenta: 5200, objetivo: 9200, nichos: 21400 },
  textoAcelerado: 1,
  animacionVista: false,
  iniciadoEn: "2026-09-21T10:12:00.000Z",
  completadoEn: null,
  pospuestoEn: null,
  pasoAbandono: null,
  celebrado: false,
  celebradoAprobacion: false,
}

/** El mismo recorrido, terminado: «Tus creadores» saltada y el resto respondido. */
const PROGRESO_COMPLETADO = {
  ...PROGRESO_EJEMPLO,
  estado: "completado",
  pasoActual: "render",
  pasosVistos: ["cuenta", "objetivo", "nichos", "fandom", "redes", "basicos", "render"],
  pasosRespondidos: ["cuenta", "objetivo", "nichos", "redes", "basicos"],
  pasosSaltados: ["fandom"],
  msPorPaso: {
    cuenta: 5200,
    objetivo: 9200,
    nichos: 21400,
    fandom: 6100,
    redes: 11800,
    basicos: 8900,
  },
  completadoEn: "2026-09-21T10:14:02.000Z",
}

const RESPUESTA_PROGRESO = {
  tipo: "ProgresoOnboarding",
  definidoEn: "lib/onboarding.ts:243",
  campos: [
    {
      nombre: "estado",
      tipo: '"sin-empezar" | "en-curso" | "pospuesto" | "completado"',
      requerido: true,
      descripcion: "En qué punto está la bienvenida (`ESTADOS_ONBOARDING`).",
    },
    {
      nombre: "flujo",
      tipo: '"clipero" | "agencia" | null',
      requerido: true,
      descripcion: "Recorrido que sigue. `null` hasta que se elige el tipo de cuenta.",
    },
    {
      nombre: "modo",
      tipo: '"normal" | "expres"',
      requerido: true,
      descripcion:
        "`expres`: el recorrido corto de quien llega invitado a una campaña privada.",
    },
    {
      nombre: "pasoActual",
      tipo: "PasoId | null",
      requerido: true,
      descripcion: "La toma en pantalla; desde aquí se retoma.",
    },
    {
      nombre: "pasosVistos · pasosRespondidos · pasosSaltados",
      tipo: "PasoId[]",
      requerido: true,
      descripcion: "Sin repetir. Un paso respondido deja de estar saltado, y al revés.",
    },
    {
      nombre: "msPorPaso",
      tipo: "Partial<Record<PasoId, number>>",
      requerido: true,
      descripcion: "Milisegundos en cada toma, solo con la pestaña visible.",
    },
    {
      nombre: "textoAcelerado · animacionVista",
      tipo: "number · boolean",
      requerido: true,
      descripcion:
        "Tomas completadas a mano y si el texto ya sale completo («aprende la prisa»).",
    },
    {
      nombre: "iniciadoEn · completadoEn · pospuestoEn",
      tipo: "string | null",
      requerido: true,
      descripcion: "Fechas ISO que pone el servidor.",
    },
    {
      nombre: "pasoAbandono",
      tipo: "PasoId | null",
      requerido: true,
      descripcion: "Dónde pulsó «Hacerlo luego». Se vacía al completar.",
    },
    {
      nombre: "celebrado · celebradoAprobacion",
      tipo: "boolean",
      requerido: true,
      descripcion:
        "Si ya salió el aviso de celebración del resultado y el de agencia aprobada. Una sola vez cada uno.",
    },
  ],
  ejemplo: PROGRESO_EJEMPLO,
}

const PARAM_PASO = {
  nombre: "paso",
  tipo: "PasoId",
  requerido: true,
  en: "ruta",
  descripcion:
    "La toma: `cuenta`, `objetivo`, `nichos`, `fandom`, `redes`, `basicos`, `directo`, `canal` o, en la agencia, `tipo-org`, `org`, `promocion`, `alcance`.",
} as const

const RESPUESTA_MICRO = {
  tipo: "MicroPreguntas",
  definidoEn: "lib/onboarding.ts:288",
  campos: [
    {
      nombre: "ultimaEn",
      tipo: "string | null",
      requerido: true,
      descripcion: "Cuándo se enseñó, pospuso o respondió la última micropregunta.",
    },
    {
      nombre: "pospuestas",
      tipo: "Record<string, string>",
      requerido: true,
      descripcion:
        "id de la pregunta → fecha ISO a partir de la cual puede volver a salir.",
    },
    {
      nombre: "descartadas",
      tipo: "string[]",
      requerido: true,
      descripcion: "Las que no se vuelven a preguntar nunca.",
    },
  ],
  ejemplo: {
    ultimaEn: "2026-09-21T09:40:00.000Z",
    pospuestas: { motivaciones: "2026-09-28T09:40:00.000Z" },
    descartadas: ["herramientas"],
  },
}

const PARAM_MICRO = {
  nombre: "id",
  tipo: "MicroId | string",
  requerido: true,
  en: "ruta",
  descripcion:
    "Una de las nueve de siempre (`experiencia`, `ligas`, `generos`, `formatos`, `disponibilidad`, `motivo-pausa`, `motivaciones`, `herramientas`, `sigues-clipeando`) o una escrita desde el backoffice (`micro_…`).",
} as const

export const ENDPOINTS: Endpoint[] = [
  /* -------------------------------------------------------------------------
     Progreso de la bienvenida
     ------------------------------------------------------------------------- */
  {
    id: "onboarding.leer",
    area: "onboarding",
    metodo: "GET",
    ruta: "/onboarding",
    resumen: "El progreso de la bienvenida «Tu primer corte» de quien tiene la sesión.",
    descripcion:
      "Lo leen la bienvenida (para decidir con qué toma se abre), la tarjeta «Termina tu perfil» y el resumen de Ajustes › Tus datos. Hoy es `cuenta.onboarding` en el almacén del navegador.",
    estado: "por-construir",
    auth: "sesion",
    respuesta: RESPUESTA_PROGRESO,
    errores: [NO_AUTORIZADO],
    reglas: [
      "Una cuenta recién creada empieza con `PROGRESO_VACIO` (lib/onboarding.ts:267): estado `sin-empezar`, sin pasos ni fechas; `flujo` toma el tipo que traiga el alta (hooks/use-cuenta.ts:652), que hoy llega siempre vacío (`null`) porque el tipo se pregunta en la toma «Tu cuenta».",
      "Lo que no se pueda leer se da por no hecho: un estado desconocido vale `sin-empezar`, nunca `completado` (`migrarProgreso`, hooks/use-cuenta.ts:434). Dar por completada una bienvenida que no se vio deja a la persona sin la tarjeta que la rescata y sin modo exprés.",
      "`version` es `ONBOARDING_VERSION` = 1 y `taxonomia` es `TAXONOMIA_VERSION` = 1. Los ids de la taxonomía no se borran: solo se marcan obsoletos.",
      "`msPorPaso` solo admite pasos de `PASOS` (lib/onboarding.ts:115) con milisegundos ≥ 0.",
    ],
    origen: "hooks/use-cuenta.ts:984",
  },
  {
    id: "onboarding.iniciar",
    area: "onboarding",
    metodo: "POST",
    ruta: "/onboarding/iniciar",
    resumen: "Empieza o retoma la bienvenida y registra por dónde entró la persona.",
    descripcion:
      "La bienvenida lo llama al montarse, con el flujo y el modo de la URL (`?tipo=`, `?modo=`) y el origen (`?origen=` o, si no viene, `retomar` para una bienvenida pospuesta, `invitacion` en exprés y `registro` en el resto).",
    estado: "por-construir",
    auth: "sesion",
    cuerpo: {
      tipo: 'Omit<Extract<EventoOnboarding, { tipo: "onboarding_iniciado" }>, "tipo">',
      definidoEn: "lib/onboarding.ts:356",
      campos: [
        {
          nombre: "flujo",
          tipo: '"clipero" | "agencia"',
          requerido: true,
          descripcion: "Recorrido de tomas (`FLUJOS_ONBOARDING`).",
        },
        {
          nombre: "modo",
          tipo: '"normal" | "expres"',
          requerido: true,
          descripcion: "`expres` solo cuando llega invitado a una campaña privada.",
        },
        {
          nombre: "origen",
          tipo: '"registro" | "oauth" | "retomar" | "gate" | "invitacion"',
          requerido: true,
          descripcion:
            "Por dónde entró: `registro` (por defecto), `oauth` (primer acceso con Google, Apple o TikTok), `retomar` (la bienvenida estaba pospuesta), `gate` (llega con `?origen=gate`, p. ej. desde «Preparar la solicitud») o `invitacion` (modo exprés). Un `?origen=` válido en la URL manda.",
        },
        {
          nombre: "locale",
          tipo: '"es" | "en" | "pt"',
          requerido: true,
          descripcion: "Idioma de la interfaz en ese momento.",
        },
      ],
      ejemplo: { flujo: "clipero", modo: "expres", origen: "invitacion", locale: "es" },
    },
    respuesta: RESPUESTA_PROGRESO,
    errores: [
      NO_AUTORIZADO,
      {
        codigo: "conflicto",
        http: 422,
        cuando: "El flujo, el modo o el origen no están en su catálogo.",
        frase: "common.errors.conflicto",
        bloquea: true,
      },
    ],
    reglas: [
      "Idempotente: con el mismo flujo y modo y el estado `en-curso` o `completado`, devuelve el progreso sin tocarlo.",
      "Una bienvenida `completado` no vuelve a `en-curso`: solo cambian `flujo` y `modo`. Así «Ver la bienvenida» deja editar sin perder el estado.",
      "Si no, pasa a `en-curso`, fija `iniciadoEn` la primera vez (al retomar no lo pisa) y registra el evento `onboarding_iniciado` con flujo, modo, origen y locale.",
      "No cambia el tipo de la cuenta: eso lo decide la toma «Tu cuenta».",
      "La hora es la del servidor, nunca la del navegador.",
    ],
    origen: "hooks/use-cuenta.ts:698",
  },
  {
    id: "onboarding.ver-paso",
    area: "onboarding",
    metodo: "PUT",
    ruta: "/onboarding/paso-actual",
    resumen: "Marca la toma que está en pantalla.",
    descripcion:
      "Se llama cada vez que cambia la toma: al continuar, al volver atrás, al saltar, al editar desde el timeline o desde «Lo que nos contaste» y con el atrás del navegador.",
    estado: "por-construir",
    auth: "sesion",
    cuerpo: {
      tipo: "{ paso: PasoId }",
      definidoEn: "lib/onboarding.ts:112",
      campos: [
        {
          nombre: "paso",
          tipo: "PasoId",
          requerido: true,
          descripcion: "La toma o el render final (`render`, `render-agencia`).",
        },
      ],
      ejemplo: { paso: "fandom" },
    },
    respuesta: RESPUESTA_PROGRESO,
    errores: [
      NO_AUTORIZADO,
      {
        codigo: "no-encontrado",
        http: 404,
        cuando: "El paso no está en el recorrido de esta cuenta (`pasosDe`).",
        frase: "common.errors.no-encontrado",
        bloquea: true,
      },
      {
        codigo: "conflicto",
        http: 422,
        cuando: "Alguna toma obligatoria anterior aún no es válida.",
        frase: "common.errors.conflicto",
        bloquea: true,
      },
    ],
    reglas: [
      "Solo pasos del recorrido de la cuenta (`pasosDe`, lib/onboarding.ts:430). `cuenta` va delante si falta el tipo, la mayoría de edad o los términos, o si ya se vio (así el número de toma no cambia). Clipero · campañas, las dos cosas o sin objetivo aún: cuenta · objetivo · nichos · fandom · redes · basicos · render. Clipero · mis videos: cuenta · objetivo · directo · canal · redes · basicos · render. Exprés: cuenta (solo si de verdad falta algo) · redes · basicos · render. Agencia: cuenta · tipo-org · org · promocion · alcance · render-agencia.",
      "Solo se abre un paso si todas las tomas obligatorias anteriores son válidas (`pasoPermitido`, lib/onboarding.ts:481). Las opcionales (`fandom`) no bloquean.",
      "Guarda `pasoActual`. La primera vez que se ve un paso lo añade a `pasosVistos` y registra `paso_visto` con `ms_desde_inicio`, contado desde `iniciadoEn`.",
      "Si el paso ya estaba visto y es el actual, no cambia nada.",
    ],
    origen: "hooks/use-cuenta.ts:727",
  },
  {
    id: "onboarding.responder-paso",
    area: "onboarding",
    metodo: "POST",
    ruta: "/onboarding/pasos/{paso}/respuesta",
    resumen: "Da una toma por respondida al pulsar «Continuar».",
    estado: "por-construir",
    auth: "sesion",
    parametros: [PARAM_PASO],
    cuerpo: {
      tipo: "{ opciones: number; acelerado: boolean }",
      definidoEn: "hooks/use-cuenta.ts:748",
      campos: [
        {
          nombre: "opciones",
          tipo: "number",
          requerido: true,
          descripcion:
            "Cuántas opciones eligió (`opcionesElegidas`): un recuento, nunca el contenido.",
        },
        {
          nombre: "acelerado",
          tipo: "boolean",
          requerido: true,
          descripcion: "Si completó a mano el texto que se estaba escribiendo.",
        },
      ],
      ejemplo: { opciones: 2, acelerado: false },
    },
    respuesta: RESPUESTA_PROGRESO,
    errores: [
      NO_AUTORIZADO,
      {
        codigo: "conflicto",
        http: 422,
        cuando:
          "La toma no es válida con lo guardado: `validarToma` devuelve un error que bloquea (`sinTipo`, `sinMayorEdad`, `sinTerminos`, `sinObjetivo`, `sinNichos`, `sinRedes`, `sinPais`, `sinIdiomas`, `sinPlataformas`, `sinFrecuencia`, `sinTemaCanal` y los de la agencia).",
        frase: "common.errors.conflicto",
        bloquea: true,
      },
      {
        codigo: "no-encontrado",
        http: 404,
        cuando: "El paso no es una toma de su recorrido (el render no se responde).",
        frase: "common.errors.no-encontrado",
        bloquea: true,
      },
    ],
    reglas: [
      "Vuelve a validar la toma con `validarToma` (lib/onboarding.ts:615) sobre las respuestas guardadas: el front no deja continuar con errores, pero el servidor no se fía. `enlaceNoReconocido` no se puede comprobar aquí: depende del texto crudo del campo de enlace, que no se guarda (solo viaja el enlace ya reconocido), así que lo valida solo el front.",
      "Añade el paso a `pasosRespondidos` (sin repetir) y lo quita de `pasosSaltados`.",
      "Registra `paso_respondido` con `n_opciones`, `ms_en_paso` (lo acumulado en `msPorPaso`) y `texto_acelerado`.",
      "El evento lleva solo ids y recuentos, nunca el contenido de las respuestas. Los eventos del onboarding se guardan 24 meses (`PLAZOS_CONSERVACION`, lib/privacidad.ts:161).",
    ],
    origen: "hooks/use-cuenta.ts:745",
  },
  {
    id: "onboarding.saltar-paso",
    area: "onboarding",
    metodo: "POST",
    ruta: "/onboarding/pasos/{paso}/salto",
    resumen: "Salta una toma opcional («Saltar esta toma»).",
    estado: "por-construir",
    auth: "sesion",
    parametros: [PARAM_PASO],
    respuesta: RESPUESTA_PROGRESO,
    errores: [
      NO_AUTORIZADO,
      {
        codigo: "conflicto",
        http: 422,
        cuando: "La toma no es opcional.",
        frase: "common.errors.conflicto",
        bloquea: true,
      },
    ],
    reglas: [
      "Solo tomas opcionales: hoy `PASOS_OPCIONALES` contiene únicamente `fandom` (lib/onboarding.ts:133).",
      "Añade el paso a `pasosSaltados` (sin repetir), lo quita de `pasosRespondidos` y registra `paso_saltado`.",
    ],
    origen: "hooks/use-cuenta.ts:769",
  },
  {
    id: "onboarding.sumar-tiempo",
    area: "onboarding",
    metodo: "POST",
    ruta: "/onboarding/pasos/{paso}/tiempo",
    resumen: "Suma el tiempo que la persona pasó en una toma con la pestaña visible.",
    estado: "por-construir",
    auth: "sesion",
    parametros: [PARAM_PASO],
    cuerpo: {
      tipo: "{ ms: number }",
      definidoEn: "hooks/use-cuenta.ts:782",
      campos: [
        {
          nombre: "ms",
          tipo: "number",
          requerido: true,
          descripcion:
            "Milisegundos desde la última medida, contados solo con la pestaña visible.",
        },
      ],
      ejemplo: { ms: 11800 },
    },
    respuesta: RESPUESTA_PROGRESO,
    errores: [NO_AUTORIZADO],
    reglas: [
      "Suma `ms`, redondeado, a `msPorPaso[paso]`; ignora el 0 y los negativos.",
      "El tiempo lo mide el navegador (se para con `visibilitychange` al ocultar la pestaña): el servidor no lo puede medir y no lo debe estimar.",
      "Se envía antes de cada cambio de toma: continuar, atrás, saltar, editar, «Hacerlo luego» y el atrás del navegador.",
    ],
    origen: "hooks/use-cuenta.ts:782",
  },
  {
    id: "onboarding.posponer",
    area: "onboarding",
    metodo: "POST",
    ruta: "/onboarding/posponer",
    resumen: "«Hacerlo luego»: deja la bienvenida a medias y recuerda dónde.",
    estado: "por-construir",
    auth: "sesion",
    cuerpo: {
      tipo: "{ paso: PasoId }",
      definidoEn: "lib/onboarding.ts:112",
      campos: [
        {
          nombre: "paso",
          tipo: "PasoId",
          requerido: true,
          descripcion: "La toma en la que la deja.",
        },
      ],
      ejemplo: { paso: "fandom" },
    },
    respuesta: {
      ...RESPUESTA_PROGRESO,
      ejemplo: {
        ...PROGRESO_EJEMPLO,
        estado: "pospuesto",
        pospuestoEn: "2026-09-21T10:13:05.000Z",
        pasoAbandono: "fandom",
      },
    },
    errores: [NO_AUTORIZADO],
    reglas: [
      "Pasa a `pospuesto`, salvo que ya esté `completado`: una bienvenida completada no retrocede.",
      "Guarda `pospuestoEn` (hora del servidor) y `pasoAbandono`, y registra `onboarding_pospuesto` con el paso.",
      "Las respuestas ya dadas se quedan: se retoma sin volver a contestar.",
      "En la rama de agencia, posponer no envía la solicitud de agencia.",
    ],
    origen: "hooks/use-cuenta.ts:798",
  },
  {
    id: "onboarding.completar",
    area: "onboarding",
    metodo: "POST",
    ruta: "/onboarding/completar",
    resumen: "Da la bienvenida por terminada al llegar al resultado.",
    estado: "por-construir",
    auth: "sesion",
    respuesta: {
      ...RESPUESTA_PROGRESO,
      ejemplo: PROGRESO_COMPLETADO,
    },
    errores: [
      NO_AUTORIZADO,
      {
        codigo: "conflicto",
        http: 422,
        cuando: "Falta alguna toma obligatoria válida del recorrido.",
        frase: "common.errors.conflicto",
        bloquea: true,
      },
    ],
    reglas: [
      "Idempotente: si ya está `completado`, devuelve el progreso sin tocarlo.",
      "Pasa a `completado`, fija `completadoEn` y vacía `pasoAbandono`.",
      "Registra `onboarding_completado` con `ms_total` (la suma de `msPorPaso`) y la lista de pasos saltados.",
      "El front solo llega al render con todas las tomas obligatorias válidas (`pasoPermitido`); el servidor lo comprueba igual antes de completar.",
      "Desde aquí deja de salir la tarjeta «Termina tu perfil» y pueden empezar las micropreguntas del panel.",
    ],
    origen: "hooks/use-cuenta.ts:811",
  },
  {
    id: "onboarding.actualizar",
    area: "onboarding",
    metodo: "PATCH",
    ruta: "/onboarding",
    resumen: "Cambia las marcas de montaje y de celebración del progreso.",
    descripcion:
      "Sustituye a `acelerarTexto`, `marcarAnimacionVista`, `celebrar` y `celebrarAprobacion` del almacén: cuatro marcas que solo avanzan.",
    estado: "por-construir",
    auth: "sesion",
    cuerpo: {
      tipo: 'Partial<Pick<ProgresoOnboarding, "textoAcelerado" | "animacionVista" | "celebrado" | "celebradoAprobacion">>',
      definidoEn: "lib/onboarding.ts:243",
      campos: [
        {
          nombre: "textoAcelerado",
          tipo: "number",
          requerido: false,
          descripcion: "Tomas completadas a mano. Solo sube, de uno en uno.",
        },
        {
          nombre: "animacionVista",
          tipo: "true",
          requerido: false,
          descripcion:
            "«Saltar intro» o dos tomas seguidas completadas a mano: el resto del texto sale completo.",
        },
        {
          nombre: "celebrado",
          tipo: "true",
          requerido: false,
          descripcion: "Ya salió el aviso «Tu perfil está listo».",
        },
        {
          nombre: "celebradoAprobacion",
          tipo: "true",
          requerido: false,
          descripcion: "Ya salió el aviso de agencia aprobada.",
        },
      ],
      ejemplo: { celebrado: true },
    },
    respuesta: RESPUESTA_PROGRESO,
    errores: [
      NO_AUTORIZADO,
      {
        codigo: "conflicto",
        http: 422,
        cuando: "Se intenta bajar una marca o tocar otro campo del progreso.",
        frase: "common.errors.conflicto",
        bloquea: true,
      },
    ],
    reglas: [
      "Solo estos cuatro campos: el resto del progreso cambia con sus propios endpoints.",
      "`celebrado` y `celebradoAprobacion` pasan de `false` a `true` una sola vez. El front celebra solo si antes era `false` (`celebrar`, hooks/use-cuenta.ts:1157); con dos pestañas abiertas, el servidor decide cuál celebra.",
      "`textoAcelerado` solo sube, de uno en uno.",
      "`animacionVista` solo pasa a `true`; vuelve a `false` únicamente con `POST /onboarding/repetir`.",
    ],
    origen: "hooks/use-cuenta.ts:790",
  },
  {
    id: "onboarding.repetir",
    area: "onboarding",
    metodo: "POST",
    ruta: "/onboarding/repetir",
    resumen:
      "«Ver la bienvenida otra vez»: el texto vuelve a escribirse y las respuestas se quedan.",
    estado: "por-construir",
    auth: "sesion",
    respuesta: {
      ...RESPUESTA_PROGRESO,
      ejemplo: {
        ...PROGRESO_COMPLETADO,
        pasosVistos: [],
        animacionVista: false,
      },
    },
    errores: [NO_AUTORIZADO],
    reglas: [
      "Vacía `pasosVistos` y pone `animacionVista` a `false`.",
      "No toca el estado, las fechas, los pasos respondidos ni ninguna respuesta: una bienvenida completada sigue completada.",
    ],
    origen: "hooks/use-cuenta.ts:908",
  },

  /* -------------------------------------------------------------------------
     Respuestas y consentimientos
     ------------------------------------------------------------------------- */
  {
    id: "onboarding.leer-respuestas",
    area: "onboarding",
    metodo: "GET",
    ruta: "/cuenta/respuestas",
    resumen: "Lo que la persona ha contado de sí misma, con de dónde sale cada dato.",
    descripcion:
      "Lo pintan las tomas (con lo ya elegido marcado), la tarjeta de perfil, «Lo que nos contaste», la recomendación «Para ti» y las misiones.",
    estado: "por-construir",
    auth: "sesion",
    respuesta: {
      tipo: 'Pick<Cuenta, "tipo" | "mayorDeEdad" | "verificado" | "pais" | "idiomas" | "clipero" | "creador" | "agencia" | "meta" | "respuestasLibres">',
      definidoEn: "lib/onboarding.ts:296",
      campos: [
        {
          nombre: "tipo",
          tipo: '"clipero" | "agencia" | null',
          requerido: true,
          descripcion: "`null` hasta la toma «Tu cuenta».",
        },
        {
          nombre: "mayorDeEdad · verificado",
          tipo: "boolean",
          requerido: true,
          descripcion:
            "18+ declarado en el alta o en la toma; la verificación de edad llega en el primer retiro.",
        },
        {
          nombre: "pais · idiomas",
          tipo: 'CountryCode | "otro" | null · IdiomaAudiencia[]',
          requerido: true,
          descripcion: "Toma «País e idiomas».",
        },
        {
          nombre: "clipero",
          tipo: "Partial<RespuestasClipero>",
          requerido: true,
          descripcion:
            "Objetivo, verticales o `aun-no-se`, juegos, creadores fan, plataformas que ve, redes, cuentas, experiencia, disponibilidad, motivaciones, tolerancia, herramientas, motivo de pausa y cómo nos conoció.",
        },
        {
          nombre: "creador",
          tipo: "Partial<RespuestasCreador>",
          requerido: true,
          descripcion:
            "Plataformas de directo, frecuencia, duración, temas del canal, enlace e interés en lanzar campañas propias.",
        },
        {
          nombre: "agencia",
          tipo: "Partial<RespuestasAgencia>",
          requerido: true,
          descripcion: "Las tomas de la solicitud de agencia.",
        },
        {
          nombre: "meta",
          tipo: "Partial<Record<CampoId, MetaDato>>",
          requerido: true,
          descripcion:
            'Por campo: `fuente` (`declarado`, `medido` o `inferido`), fecha y, si aplica, `confianza: "baja"`.',
        },
        {
          nombre: "respuestasLibres",
          tipo: "Record<string, string[]>",
          requerido: true,
          descripcion: "Respuestas a las preguntas escritas desde el backoffice.",
        },
      ],
      ejemplo: {
        tipo: "clipero",
        mayorDeEdad: true,
        verificado: false,
        pais: "PE",
        idiomas: ["es"],
        clipero: {
          objetivo: "ambos",
          experiencia: "regular",
          verticales: ["podcast", "negocios"],
          juegos: [],
          creadoresFan: [],
          redes: ["youtube", "tiktok", "instagram"],
        },
        creador: { plataformasDirecto: ["youtube", "tiktok"] },
        agencia: {},
        meta: {
          "clipero.verticales": { fuente: "declarado", en: "2026-08-18T10:13:24.000Z" },
          pais: { fuente: "declarado", en: "2026-08-18T10:13:24.000Z" },
        },
        respuestasLibres: {},
      },
    },
    errores: [NO_AUTORIZADO],
    reglas: [
      "Cada id se comprueba contra su catálogo al leer, como hace `migrarCuenta` (hooks/use-cuenta.ts:473): lo que no esté en la taxonomía se descarta, no se enseña.",
      "`clipero.creadoresFan` solo admite ids que empiezan por `cre_` o pendientes `{ pendiente: true, texto }` (`esCreadorFan`); el servidor, además, puede comprobar que el id está en su catálogo.",
      "Sin nada guardado, la demo enseña a «Ana Ruiz» (`CUENTA_VACIA`, hooks/use-cuenta.ts:200). El servidor devuelve siempre la cuenta de la sesión, nunca la de la demo.",
    ],
    origen: "hooks/use-cuenta.ts:1093",
  },
  {
    id: "onboarding.responder",
    area: "onboarding",
    metodo: "PUT",
    ruta: "/cuenta/respuestas/{campo}",
    resumen: "Guarda (o borra) una respuesta del perfil con su fuente y su fecha.",
    descripcion:
      "Es la escritura de todas las tomas, de las micropreguntas de siempre, de los requisitos para entrar en una campaña y de «¿Cómo llegaste a Clipealo?». Cada toque de un chip es una llamada: las tomas guardan al momento, sin botón de guardar.",
    estado: "por-construir",
    auth: "sesion",
    parametros: [
      {
        nombre: "campo",
        tipo: "CampoId",
        requerido: true,
        en: "ruta",
        descripcion:
          "`tipo`, `mayorDeEdad`, `pais`, `idiomas` o `clipero.<clave>`, `creador.<clave>`, `agencia.<clave>` (lib/onboarding.ts:234). Ej.: `clipero.verticales`, `creador.enlaceCanal`.",
      },
    ],
    cuerpo: {
      tipo: '{ valor?: ValorCampo<CampoId>; fuente: Fuente; confianza?: "baja" }',
      definidoEn: "hooks/use-cuenta.ts:142",
      campos: [
        {
          nombre: "valor",
          tipo: "ValorCampo<CampoId>",
          requerido: false,
          descripcion:
            "El valor del campo, con su tipo. Sin `valor` (el front pasa `undefined`, que JSON omite) se borra la respuesta.",
        },
        {
          nombre: "fuente",
          tipo: '"declarado" | "medido" | "inferido"',
          requerido: true,
          descripcion:
            "`declarado` si lo eligió la persona; `inferido` si se dedujo (país del navegador, plataformas del fandom, vertical de la campaña a la que la invitaron…).",
        },
        {
          nombre: "confianza",
          tipo: '"baja"',
          requerido: false,
          descripcion:
            "Marca de baja confianza. `responder` la admite, pero hoy ninguna pantalla la envía; `confianzaBaja` (lib/onboarding.ts:1153) define cuándo aplica: las 5 verticales y todas las redes marcadas, o `1m-plus` declarado sin conectar la cuenta.",
        },
      ],
      ejemplo: { valor: ["deportes", "musica"], fuente: "declarado" },
    },
    respuesta: {
      tipo: "Cuenta",
      definidoEn: "lib/onboarding.ts:296",
      ejemplo: {
        nombre: "Ana Ruiz",
        correo: "ana@estudio.co",
        tipo: "clipero",
        pais: "PE",
        idiomas: ["es"],
        perfilCanal: {
          canal: "clipealo",
          plataformas: ["youtube", "tiktok"],
          pais: "PE",
        },
        publico: { temas: ["deportes", "musica"], idioma: "es" },
        clipero: { objetivo: "ambos", verticales: ["deportes", "musica"] },
        meta: {
          "clipero.verticales": { fuente: "declarado", en: "2026-09-21T10:12:41.000Z" },
        },
      },
    },
    errores: [
      NO_AUTORIZADO,
      {
        codigo: "no-encontrado",
        http: 404,
        cuando: "El campo no existe en `CampoId`.",
        frase: "common.errors.no-encontrado",
        bloquea: true,
      },
      {
        codigo: "conflicto",
        http: 422,
        cuando:
          "Un id fuera de su catálogo, más opciones que el límite o una opción excluyente junto a otras.",
        frase: "common.errors.conflicto",
        bloquea: true,
      },
    ],
    reglas: [
      "Guarda `meta[campo] = { fuente, en }` con la hora del servidor, y `confianza` si llega. Al borrar, borra también su `meta`.",
      "Cada id se comprueba contra su catálogo: verticales (las 14 elegibles; `actualidad` solo es etiqueta de campaña), juegos, redes (`tiktok`, `instagram`, `youtube`, `x`, `linkedin`, `facebook`, `otra`, `sin-cuenta`), plataformas de directo, idiomas (`IDIOMAS_AUDIENCIA`), países (`COUNTRY_CODES` u `otro`)…",
      "Límites de `LIMITES_ONBOARDING` (lib/onboarding.ts:392): 5 nichos, 5 juegos, 5 creadores, 3 idiomas, 3 temas de canal, 3 verticales de material, 2 motivaciones y 120 caracteres en el texto de «¿Cómo llegaste?». Ligas, géneros y formatos declarados en una micropregunta, como mucho `REGLAS_MICRO.maxSubverticales` = 3 (los formatos que se deducen del fandom no tienen ese tope).",
      "«Aún no lo sé» (`aun-no-se`), «Aún no tengo cuenta» (`sin-cuenta`) y «No hago directos» (`no-transmito`) no conviven con otras opciones (`alternarEleccion`, lib/onboarding.ts:736). «Ninguna» tampoco, en herramientas.",
      "Sin gaming no se guardan juegos; sin plataformas de directo reales no se guardan frecuencia ni duración. El front ya los borra; el servidor lo hace cumplir.",
      "Refleja en Ajustes lo mismo que `sincronizarAjustes` (hooks/use-cuenta.ts:577): `pais` → país de Ajustes › Perfil; `idiomas` → idioma de Público si el actual no está entre ellos; `clipero.verticales` y `creador.verticalesCanal` → temas de Público (solo los ids de `TEMAS`, como mucho `TEMAS_MAX` = 3); `creador.plataformasDirecto` → plataformas del perfil; `creador.enlaceCanal` → nombre de canal (la marca de agua) si el handle pasa `validarCanal`.",
      "Un creador fuera del catálogo llega como `CreadorPendiente` (`{ pendiente: true, texto, plataforma?, handle?, url? }`, lib/onboarding.ts:163), pensado para la cola `#pendientes` del admin. De él solo se usa su plataforma al deducir `plataformasQueVe` (`dimensionesDe`).",
      "`clipero.plataformasQueVe` no se pregunta nunca: se deduce del fandom y llega como `inferido`.",
      "`creador.enlaceCanal` se guarda con `verificado: false` hasta que se compruebe.",
      "Conservación: las respuestas se borran a los 18 meses sin actividad, salvo el país y los consentimientos (`PLAZOS_CONSERVACION`, lib/privacidad.ts:161).",
    ],
    origen: "hooks/use-cuenta.ts:665",
  },
  {
    id: "onboarding.consentir",
    area: "onboarding",
    metodo: "POST",
    ruta: "/cuenta/consentimientos",
    resumen: "Añade una entrada al registro de consentimientos.",
    descripcion:
      "Lo usan las casillas de 18+ y de términos de la toma «Tu cuenta», el interruptor «Avisarme también por correo» del fandom, los permisos opcionales del resultado y los interruptores de Ajustes › Tus datos (área cuenta).",
    estado: "por-construir",
    auth: "sesion",
    cuerpo: {
      tipo: 'Omit<RegistroConsentimiento, "version" | "en">',
      definidoEn: "lib/privacidad.ts:43",
      campos: [
        {
          nombre: "finalidad",
          tipo: "Finalidad",
          requerido: true,
          descripcion:
            "`terminos`, `privacidad`, `mayor-edad`, `estadisticas`, `informes-sector`, `perfil-visible`, `novedades-correo`, `novedades-marcas`, `alertas-correo`, `contacto-comercial` o `datos-cobro`.",
        },
        { nombre: "valor", tipo: "boolean", requerido: true, descripcion: "Sí o no." },
        {
          nombre: "origen",
          tipo: '"registro" | "oauth" | "onboarding" | "ajustes" | "retiro" | "gate"',
          requerido: true,
          descripcion: "Dónde se dio.",
        },
        {
          nombre: "textoId",
          tipo: "string",
          requerido: true,
          descripcion: "Clave exacta del texto que se enseñó.",
        },
        {
          nombre: "locale",
          tipo: '"es" | "en" | "pt"',
          requerido: true,
          descripcion: "Idioma en que se leyó.",
        },
      ],
      ejemplo: {
        finalidad: "alertas-correo",
        valor: true,
        origen: "onboarding",
        textoId: "onboarding.clipero.fandom.emailAlerts",
        locale: "es",
      },
    },
    respuesta: {
      tipo: "RegistroConsentimiento[]",
      definidoEn: "lib/privacidad.ts:43",
      ejemplo: [
        {
          finalidad: "terminos",
          valor: true,
          version: "privacidad-2026-10-v1",
          locale: "es",
          origen: "registro",
          textoId: "auth.signup.accept",
          en: "2026-08-18T10:12:00.000Z",
        },
        {
          finalidad: "alertas-correo",
          valor: true,
          version: "privacidad-2026-10-v1",
          locale: "es",
          origen: "onboarding",
          textoId: "onboarding.clipero.fandom.emailAlerts",
          en: "2026-09-21T10:12:58.000Z",
        },
      ],
    },
    errores: [
      NO_AUTORIZADO,
      {
        codigo: "conflicto",
        http: 422,
        cuando: "La finalidad o el origen no están en su catálogo.",
        frase: "common.errors.conflicto",
        bloquea: true,
      },
    ],
    reglas: [
      "Solo añade: nunca modifica ni borra una entrada anterior (`registrar`, lib/privacidad.ts:104). El historial es la prueba de qué se aceptó, cuándo, en qué idioma y con qué versión del aviso.",
      "`version` es la del aviso vigente, `VERSION_AVISO` = `privacidad-2026-10-v1` (lib/privacidad.ts:31), y `en` es la hora del servidor.",
      "El valor vigente de una finalidad es su última entrada o, si no hay ninguna, `VALOR_POR_DEFECTO`: estadísticas de la plataforma activadas; todo lo demás apagado.",
      "Registra el evento `consentimiento_cambiado` solo si cambia el valor vigente.",
      "El registro se conserva mientras dure la cuenta más el plazo legal de cada país.",
    ],
    origen: "hooks/use-cuenta.ts:830",
  },

  /* -------------------------------------------------------------------------
     Catálogo de creadores (toma «Tus creadores»)
     ------------------------------------------------------------------------- */
  {
    id: "onboarding.sugerir-creadores",
    area: "onboarding",
    metodo: "GET",
    ruta: "/creadores/sugerencias",
    resumen: "Las 8 sugerencias de «Populares entre cliperos de {pais}».",
    estado: "por-construir",
    auth: "sesion",
    parametros: [
      {
        nombre: "pais",
        tipo: 'CountryCode | "otro"',
        requerido: false,
        en: "consulta",
        descripcion:
          "El país respondido o, si aún no lo hay, la región del navegador. Con `otro` o sin país, no se filtra por país.",
      },
      {
        nombre: "verticales",
        tipo: "Vertical[]",
        requerido: false,
        en: "consulta",
        descripcion: "Las elegidas en la toma «Tus temas».",
      },
      {
        nombre: "limite",
        tipo: "number",
        requerido: false,
        en: "consulta",
        descripcion: "Cuántas. Por defecto, 8.",
      },
    ],
    respuesta: {
      tipo: "Creador[]",
      definidoEn: "lib/creadores.ts:38",
      ejemplo: [
        {
          id: "cre_liga_estrellas",
          nombre: "Liga de las Estrellas",
          tipo: "club-evento",
          cuentas: [
            { plataforma: "youtube", handle: "ligadelasestrellas", seguidores: 420000 },
            { plataforma: "tiktok", handle: "ligaestrellas", seguidores: 180000 },
            { plataforma: "instagram", handle: "ligaestrellas", seguidores: 95000 },
          ],
          verticales: ["deportes"],
          pais: "PE",
          idiomas: ["es"],
          campanaId: "cmp_liga",
          sugerible: true,
          fansDemo: 310,
        },
        {
          id: "cre_kira_andes",
          nombre: "Kira Andes",
          tipo: "streamer",
          cuentas: [
            { plataforma: "twitch", handle: "kiraandes", seguidores: 72000 },
            { plataforma: "tiktok", handle: "kiraandes", seguidores: 150000 },
          ],
          verticales: ["gaming"],
          juegos: ["free-fire"],
          pais: "PE",
          idiomas: ["es"],
          sugerible: true,
          fansDemo: 150,
        },
      ],
    },
    errores: [
      NO_AUTORIZADO,
      {
        codigo: "servidor",
        http: 500,
        cuando: "No se pudieron calcular: la toma lo dice y deja buscar a mano.",
        frase: "onboarding.errors.sugerenciasFallidas",
        bloquea: false,
      },
    ],
    reglas: [
      "Tres grupos, en este orden (`sugerencias`, lib/creadores.ts:514): 1) creadores con una campaña activa que se puede hacer desde su país (sin países objetivo, o con el suyo entre ellos); 2) creadores de las verticales que eligió; 3) el resto, de más a menos fans.",
      "Dentro de los grupos 1 y 2 se barajan con un hash estable (FNV-1a) del correo de la sesión: cada persona ve un orden distinto y siempre el mismo. Nunca `Math.random`.",
      "Nunca sale un creador con `sugerible: false`: políticos, líderes religiosos, menores, cuentas de apuestas o adultas.",
      "«Activa» es el estado visible de la campaña: una agotada, vencida o cerrada ya no cuenta.",
      "En producción el catálogo sale de las APIs de Twitch, Kick y YouTube y de los creadores que ya son usuarios; el de la demo es ficticio.",
    ],
    origen: "lib/creadores.ts:514",
  },
  {
    id: "onboarding.buscar-creadores",
    area: "onboarding",
    metodo: "GET",
    ruta: "/creadores",
    resumen:
      "Busca creadores por nombre o handle, o resuelve el enlace de un canal pegado.",
    estado: "por-construir",
    auth: "sesion",
    parametros: [
      {
        nombre: "q",
        tipo: "string",
        requerido: true,
        en: "consulta",
        descripcion: "Lo escrito: nombre, @canal o enlace.",
      },
      {
        nombre: "pais",
        tipo: 'CountryCode | "otro"',
        requerido: false,
        en: "consulta",
        descripcion: "Desempata a favor de su país.",
      },
      {
        nombre: "verticales",
        tipo: "Vertical[]",
        requerido: false,
        en: "consulta",
        descripcion: "Desempata a favor de sus temas.",
      },
      {
        nombre: "limite",
        tipo: "number",
        requerido: false,
        en: "consulta",
        descripcion: "El buscador de la toma pide 8.",
      },
    ],
    respuesta: {
      tipo: "ResultadoBusquedaCreadores",
      definidoEn: "lib/creadores.ts:391",
      ejemplo: {
        tipo: "enlace",
        creador: {
          id: "cre_kira_andes",
          nombre: "Kira Andes",
          tipo: "streamer",
          cuentas: [
            { plataforma: "twitch", handle: "kiraandes", seguidores: 72000 },
            { plataforma: "tiktok", handle: "kiraandes", seguidores: 150000 },
          ],
          verticales: ["gaming"],
          juegos: ["free-fire"],
          pais: "PE",
          idiomas: ["es"],
          sugerible: true,
          fansDemo: 150,
        },
        enlace: {
          plataforma: "twitch",
          handle: "kiraandes",
          url: "https://twitch.tv/kiraandes",
        },
      },
    },
    errores: [NO_AUTORIZADO],
    reglas: [
      "Texto: busca sin tildes ni mayúsculas en el nombre y los handles, y solo devuelve creadores `sugerible`. Orden: empieza por lo escrito, empieza una palabra, lo contiene; a igualdad, su país, sus verticales, más fans y el nombre (`buscarCreadores`, lib/creadores.ts:420). Los resultados van agrupados por plataforma principal («En YouTube», «En Kick»…).",
      "Un enlace de `twitch.tv/x`, `kick.com/x`, `youtube.com/@x` o `tiktok.com/@x` (con o sin protocolo, `www.` o `m.`) se resuelve: a un creador del catálogo, aunque no sea sugerible, o a un pendiente con plataforma, handle y dirección canónica.",
      "Handles válidos (`analizarEnlaceCanal`, lib/onboarding.ts:821): Twitch de 3 a 25 caracteres (letras, números y _), Kick de 3 a 25 (también -), YouTube de 3 a 30 (también . y -), TikTok de 2 a 24 (letras, números, . y _). Las rutas reservadas de Twitch y Kick (`directory`, `videos`, `categories`, `browse`…) no son canales.",
      "Si parece una dirección pero no es de esas cuatro plataformas, devuelve `enlace-no-reconocido`: la toma dice «No reconocemos ese enlace…» y no deja añadirlo.",
      "Con el campo vacío devuelve `vacio`: se enseñan las sugerencias.",
    ],
    origen: "lib/creadores.ts:420",
  },

  /* -------------------------------------------------------------------------
     Micropreguntas (perfilado progresivo)
     ------------------------------------------------------------------------- */
  {
    id: "onboarding.listar-micropreguntas",
    area: "onboarding",
    metodo: "GET",
    ruta: "/micropreguntas",
    resumen:
      "El catálogo de micropreguntas vigente: cuáles se hacen, dónde, en qué orden y con qué reglas.",
    descripcion:
      "Lo edita el admin desde el backoffice; aquí solo se lee para decidir qué preguntar. Hoy vive en `clipealo-micro-catalogo-v1` del navegador.",
    estado: "por-construir",
    auth: "sesion",
    respuesta: {
      tipo: "CatalogoMicro",
      definidoEn: "lib/micro-catalogo.ts:66",
      ejemplo: {
        preguntas: [
          {
            id: "experiencia",
            origen: "semilla",
            activa: true,
            lugar: "enviar",
            orden: 0,
          },
          { id: "ligas", origen: "semilla", activa: true, lugar: "panel", orden: 1 },
          { id: "generos", origen: "semilla", activa: true, lugar: "panel", orden: 2 },
          { id: "formatos", origen: "semilla", activa: true, lugar: "panel", orden: 3 },
          {
            id: "disponibilidad",
            origen: "semilla",
            activa: true,
            lugar: "panel",
            orden: 4,
          },
          {
            id: "motivo-pausa",
            origen: "semilla",
            activa: true,
            lugar: "panel",
            orden: 5,
          },
          {
            id: "motivaciones",
            origen: "semilla",
            activa: true,
            lugar: "panel",
            orden: 6,
          },
          {
            id: "herramientas",
            origen: "semilla",
            activa: true,
            lugar: "panel",
            orden: 7,
          },
          {
            id: "sigues-clipeando",
            origen: "semilla",
            activa: true,
            lugar: "panel",
            orden: 8,
          },
          {
            id: "micro_x",
            origen: "creada",
            activa: true,
            lugar: "enviar",
            orden: 50,
            titulo: "¿Qué es lo que más te cuesta al montar un clip?",
            ayuda: "Para saber qué parte del editor mejorar primero.",
            tipo: "unica",
            opciones: ["Encontrar el momento", "Los subtítulos", "El reencuadre"],
            desdeAltaDias: 0,
          },
        ],
        reglas: {
          diasEntre: 3,
          diasPospuesta: 7,
          diasMotivaciones: 7,
          diasHerramientas: 14,
          diasSinEnvios: 7,
          diasRevalidar: 180,
          enviosDisponibilidad: 3,
          maxSubverticales: 3,
        },
      },
    },
    errores: [NO_AUTORIZADO],
    reglas: [
      "Las nueve de siempre (`semilla`) tienen su texto en `messages/`: el catálogo solo dice si están activas, su lugar (`panel` o `enviar`) y su orden.",
      "Las escritas por el admin (`creada`) traen título (8–120 caracteres), ayuda (10–200), tipo (`unica` o `multiple`), de 2 a 8 opciones de hasta 60 caracteres, `max` en las múltiples y `desdeAltaDias`. Van en el idioma en que se escribieron y no se traducen.",
      "Cada regla se sujeta a su rango (`LIMITES_REGLAS`, lib/micro-catalogo.ts:75): `diasEntre` 0–60, `diasPospuesta` 1–90, `diasMotivaciones` y `diasHerramientas` 1–180, `diasSinEnvios` 1–90, `diasRevalidar` 30–730, `enviosDisponibilidad` 1–50, `maxSubverticales` 1–10.",
      "Hoy la app lee del catálogo `diasEntre`, `diasMotivaciones`, `diasHerramientas`, `diasSinEnvios`, `diasRevalidar` y `enviosDisponibilidad`. `diasPospuesta` y `maxSubverticales` se editan pero no se leen: «Ahora no» aplica `DIAS_MICRO_POSPUESTA` = 7 (hooks/use-cuenta.ts:131) y ligas, géneros y formatos topan en `REGLAS_MICRO.maxSubverticales` = 3 (components/onboarding/micro-question.tsx:352). Al construirlo hay que decidir cuál manda.",
      "Una pregunta apagada deja de hacerse, pero lo ya respondido no se borra.",
    ],
    origen: "hooks/use-catalogo-micro.ts:86",
  },
  {
    id: "onboarding.ver-micropregunta",
    area: "onboarding",
    metodo: "POST",
    ruta: "/cuenta/micropreguntas/vista",
    resumen:
      "Anota que se ha enseñado una micropregunta, para la regla «una cada 3 días».",
    estado: "por-construir",
    auth: "sesion",
    respuesta: RESPUESTA_MICRO,
    errores: [
      NO_AUTORIZADO,
      {
        codigo: "conflicto",
        http: 422,
        cuando:
          "Todavía no han pasado `diasEntre` días desde la última. El front no enseña nada: la micropregunta simplemente no sale.",
        bloquea: false,
      },
    ],
    reglas: [
      "Pone `ultimaEn` con la hora del servidor.",
      "Solo cuando toca preguntar: `puedePreguntar` (lib/micro-preguntas.ts:339) exige `diasEntre` días (3 por defecto) desde `ultimaEn`.",
      "«Una por sesión» la decide el navegador (`sessionStorage`, clave `clipealo-micro-sesion`) y no se guarda en el servidor.",
    ],
    origen: "hooks/use-cuenta.ts:920",
  },
  {
    id: "onboarding.posponer-micropregunta",
    area: "onboarding",
    metodo: "POST",
    ruta: "/cuenta/micropreguntas/{id}/posponer",
    resumen: "«Ahora no»: la micropregunta vuelve a salir pasados unos días.",
    estado: "por-construir",
    auth: "sesion",
    parametros: [PARAM_MICRO],
    respuesta: RESPUESTA_MICRO,
    errores: [NO_AUTORIZADO],
    reglas: [
      "Guarda `pospuestas[id]` = ahora + 7 días y pone `ultimaEn`.",
      "Hoy la demo aplica siempre la constante `DIAS_MICRO_POSPUESTA` = 7 (hooks/use-cuenta.ts:131) y no lee `reglas.diasPospuesta` del catálogo, que el admin puede cambiar de 1 a 90: al construirlo hay que decidir cuál manda.",
    ],
    origen: "hooks/use-cuenta.ts:926",
  },
  {
    id: "onboarding.descartar-micropregunta",
    area: "onboarding",
    metodo: "POST",
    ruta: "/cuenta/micropreguntas/{id}/descartar",
    resumen: "«No volver a preguntar».",
    estado: "por-construir",
    auth: "sesion",
    parametros: [PARAM_MICRO],
    respuesta: RESPUESTA_MICRO,
    errores: [NO_AUTORIZADO],
    reglas: [
      "Añade el id a `descartadas` (sin repetir), lo quita de `pospuestas` y pone `ultimaEn`.",
      "Una descartada no vuelve a salir nunca (`microDisponible`, lib/micro-preguntas.ts:328).",
    ],
    origen: "hooks/use-cuenta.ts:941",
  },
  {
    id: "onboarding.responder-libre",
    area: "onboarding",
    metodo: "PUT",
    ruta: "/cuenta/respuestas-libres/{id}",
    resumen: "Guarda la respuesta a una pregunta escrita desde el backoffice.",
    estado: "por-construir",
    auth: "sesion",
    parametros: [
      {
        nombre: "id",
        tipo: "string",
        requerido: true,
        en: "ruta",
        descripcion: "Id de la pregunta creada (`micro_…`).",
      },
    ],
    cuerpo: {
      tipo: "{ valores: string[] }",
      definidoEn: "hooks/use-cuenta.ts:961",
      campos: [
        {
          nombre: "valores",
          tipo: "string[]",
          requerido: true,
          descripcion: "Las opciones marcadas, tal como las escribió el admin.",
        },
      ],
      ejemplo: { valores: ["Los subtítulos"] },
    },
    respuesta: {
      tipo: 'Cuenta["respuestasLibres"]',
      definidoEn: "lib/onboarding.ts:325",
      ejemplo: { micro_x: ["Los subtítulos"] },
    },
    errores: [
      NO_AUTORIZADO,
      {
        codigo: "no-encontrado",
        http: 404,
        cuando: "No hay ninguna pregunta creada y activa con ese id.",
        frase: "common.errors.no-encontrado",
        bloquea: true,
      },
      {
        codigo: "conflicto",
        http: 422,
        cuando:
          "Algún valor no es una de sus opciones, o hay más de uno en una pregunta de respuesta única, o más que su `max`.",
        frase: "common.errors.conflicto",
        bloquea: true,
      },
    ],
    reglas: [
      "Sin valores se borra la entrada; no se guarda una lista vacía: «no respondida» y «respondida con nada» no son lo mismo, y la segunda dejaría de preguntarse para siempre.",
      "Los valores tienen que ser opciones de la pregunta: el front no lo comprueba, el servidor sí. Respuesta única: 1; múltiple: como mucho su `max` (de 1 a 8).",
      "Pone `microPreguntas.ultimaEn` con la hora del servidor.",
    ],
    origen: "hooks/use-cuenta.ts:961",
  },
]
