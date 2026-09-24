import type { Campo, Endpoint } from "@/lib/wiki/tipos"

/**
 * Endpoints de «calendario»: la agenda de publicaciones.
 *
 * Hoy la agenda entera vive en el navegador (`hooks/use-agenda.ts`, clave
 * `clipealo-agenda-v1`) y no hay frontera en `lib/api/` que la lea o la
 * escriba: todos son `por-construir`. Las rutas cuelgan de `/publicaciones`,
 * el mismo recurso que ya usa la frontera del envío
 * (`POST /publicaciones/{entradaId}/enviar`, en `lib/api/publicaciones.ts`),
 * porque el id de la publicación es el id de la entrada de la agenda.
 *
 * Los cuerpos y las respuestas son los tipos que el front ya usa: el servidor
 * sustituye al almacén sin que la app cambie.
 */

/** Los campos de `EntradaAgenda` (lib/agenda.ts:174), tal y como viajan. */
const CAMPOS_ENTRADA: Campo[] = [
  {
    nombre: "id",
    tipo: "string",
    requerido: true,
    descripcion: "`age_*`. Lo crea el servidor al dar de alta.",
  },
  {
    nombre: "clipId",
    tipo: "string",
    requerido: false,
    descripcion:
      "El clip que sale. Opcional: lo ya publicado puede no tener clip vivo en la biblioteca.",
  },
  {
    nombre: "proyectoId",
    tipo: "string",
    requerido: false,
    descripcion:
      "Denormalizado del clip (`clip.sourceId`), para filtrar por proyecto sin cruzar la biblioteca.",
  },
  {
    nombre: "titulo",
    tipo: "string",
    requerido: true,
    descripcion: "Título del clip. Contenido de usuario: no se traduce.",
  },
  {
    nombre: "red",
    tipo: "SocialId",
    requerido: true,
    descripcion: "tiktok, instagram, youtube, x, linkedin o facebook.",
  },
  {
    nombre: "cuentaId",
    tipo: "string",
    requerido: false,
    descripcion:
      "La CUENTA conectada (`cta_*`), no la red. Sin ella la entrada no se puede enviar.",
  },
  {
    nombre: "programadaPara",
    tipo: "string",
    requerido: true,
    descripcion:
      "Instante UTC en ISO 8601. Es el único dato de tiempo que se guarda: la zona es pintura.",
  },
  {
    nombre: "zonaOrigen",
    tipo: "Zona",
    requerido: true,
    descripcion:
      "Zona IANA en la que se eligió (America/Lima en la demo). El tipo la guarda para avisar si la zona activa es otra; hoy ninguna pantalla lo avisa.",
  },
  {
    nombre: "texto",
    tipo: "string",
    requerido: true,
    descripcion: "Texto propuesto; por defecto, el `hook` del clip.",
  },
  {
    nombre: "copia",
    tipo: "CopiaPublicacion",
    requerido: false,
    descripcion:
      "`{ titulo, texto, hashtags }` con el que sale, resuelto al crear la entrada (lo rellena el diálogo «Publicar el clip»; el compositor del calendario no, y entonces se envía `texto`). Es lo que DE VERDAD se envió: cambiar la plantilla después no lo reescribe.",
  },
  {
    nombre: "estado",
    tipo: '"planificada" | "publicando" | "publicada" | "fallida" | "cancelada"',
    requerido: true,
    descripcion:
      "Uno de los cinco estados guardados (ESTADOS_AGENDA). sin-cuenta y toca-publicar NO viajan: los deriva el front.",
  },
  {
    nombre: "url",
    tipo: "string",
    requerido: false,
    descripcion: "Solo con `publicada`: el enlace en la red.",
  },
  {
    nombre: "postId",
    tipo: "string",
    requerido: false,
    descripcion:
      "El id que devuelve la plataforma; con él se leen las métricas después, no con la URL.",
  },
  {
    nombre: "publicadaEn",
    tipo: "string",
    requerido: false,
    descripcion: "Instante UTC en que salió.",
  },
  {
    nombre: "fallo",
    tipo: "FalloPublicacion",
    requerido: false,
    descripcion:
      "Solo con `fallida`: cuentaCaducada, permisoDenegado, rechazoRed, limiteApi o sinRed. Código, nunca la frase de la plataforma.",
  },
  {
    nombre: "intentos",
    tipo: "number",
    requerido: false,
    descripcion: "Cuántas veces se intentó enviar. Sin valor, ninguna.",
  },
  {
    nombre: "campanaId",
    tipo: "string",
    requerido: false,
    descripcion: "La campaña a la que va, si va a una.",
  },
  {
    nombre: "loteId",
    tipo: "string",
    requerido: false,
    descripcion:
      "El mismo clip mandado a varias cuentas de una vez comparte lote (`lot_*_n`).",
  },
  {
    nombre: "dueno",
    tipo: '"clipero" | "agencia"',
    requerido: true,
    descripcion: "La cara del producto a la que pertenece.",
  },
  {
    nombre: "proveedor",
    tipo: '"clipealo" | "manual"',
    requerido: false,
    descripcion:
      "Quién la lleva a la red. Sin valor, `manual`. Todo lo programado desde Clipealo es `clipealo`.",
  },
  {
    nombre: "creadaEn",
    tipo: "string",
    requerido: true,
    descripcion: "Instante UTC del alta.",
  },
]

/** age_s1 de la demo: la que la red rechazó el sábado 12 a las 19:00 en Lima. */
const EJEMPLO_FALLIDA = {
  id: "age_s1",
  clipId: "clip_04",
  proyectoId: "src_01",
  titulo: "Nadie se va por el sueldo",
  red: "tiktok",
  cuentaId: "cta_tk_clipealo",
  programadaPara: "2026-09-13T00:00:00.000Z",
  zonaOrigen: "America/Lima",
  texto: "«Nadie se va por el sueldo. Se va por el jefe, y el sueldo le da la excusa.»",
  estado: "fallida",
  fallo: "rechazoRed",
  intentos: 1,
  dueno: "clipero",
  proveedor: "clipealo",
  creadaEn: "2026-09-11T15:00:00.000Z",
}

/** age_s8 de la demo: salió sola y guardó su enlace. */
const EJEMPLO_PUBLICADA = {
  id: "age_s8",
  clipId: "clip_02",
  proyectoId: "src_01",
  titulo: "La regla de las tres reuniones",
  red: "tiktok",
  cuentaId: "cta_tk_ana",
  programadaPara: "2026-09-12T20:00:00.000Z",
  zonaOrigen: "America/Lima",
  texto:
    "«Si algo necesita tres reuniones, el problema no es la agenda: es la decisión.»",
  estado: "publicada",
  url: "https://www.tiktok.com/@cortes.ana/video/7409112233445566",
  publicadaEn: "2026-09-12T20:00:00.000Z",
  dueno: "clipero",
  proveedor: "clipealo",
  creadaEn: "2026-09-11T15:00:00.000Z",
}

/** age_s3 de la demo: el mismo clip que age_s2, en otra red y otra cuenta. */
const EJEMPLO_PLANIFICADA = {
  id: "age_s3",
  clipId: "clip_06",
  proyectoId: "src_01",
  titulo: "El coste real de una mala primera semana",
  red: "tiktok",
  cuentaId: "cta_tk_ana",
  programadaPara: "2026-09-13T19:00:00.000Z",
  zonaOrigen: "America/Lima",
  texto: "«Una mala primera semana se paga durante seis meses.»",
  estado: "planificada",
  loteId: "lot_s2",
  dueno: "clipero",
  proveedor: "clipealo",
  creadaEn: "2026-09-11T15:00:00.000Z",
}

const PARAM_ID: Campo = {
  nombre: "entradaId",
  tipo: "string",
  requerido: true,
  descripcion: "El id de la entrada de la agenda (`age_s6`, `age_pub_01_tiktok`…).",
  en: "ruta",
}

const NO_AUTORIZADO = {
  codigo: "no-autorizado",
  http: 401,
  cuando: "La sesión no vale.",
  frase: "common.errors.no-autorizado",
  bloquea: true,
}

const NO_ENCONTRADO = {
  codigo: "no-encontrado",
  http: 404,
  cuando: "La entrada no existe o no es de esta sesión.",
  frase: "common.errors.no-encontrado",
  bloquea: true,
}

export const ENDPOINTS: Endpoint[] = [
  {
    id: "calendario.listar",
    area: "calendario",
    metodo: "GET",
    ruta: "/publicaciones",
    resumen: "La agenda entera de la sesión: lo planificado y lo que ya salió.",
    descripcion:
      "Sustituye a la lectura de `useAgenda()`, que hoy junta las semillas, lo publicado que Analíticas tiene indexado y lo guardado en el navegador. El calendario, la bandeja «sin salir», el panel y la campana leen de aquí.",
    estado: "por-construir",
    auth: "sesion",
    respuesta: {
      tipo: "EntradaAgenda[]",
      definidoEn: "lib/agenda.ts:174",
      campos: CAMPOS_ENTRADA,
      ejemplo: [EJEMPLO_FALLIDA, EJEMPLO_PUBLICADA, EJEMPLO_PLANIFICADA],
    },
    errores: [NO_AUTORIZADO],
    reglas: [
      "Devolver TODA la agenda de la sesión, sin paginar por semana ni filtrar por red: la bandeja de lo que no salió se calcula sobre todas (components/agenda/agenda-view.tsx:157) y los filtros y las vistas son del navegador.",
      "Incluir lo ya publicado que indexa Analíticas, con id determinista `age_<id de publicación>`, estado `publicada`, `url`, `publicadaEn` y proveedor `manual`, para que recargar no duplique nada (`entradasDePublicaciones`, lib/agenda.ts:1030).",
      "Solo los cinco estados guardados (ESTADOS_AGENDA, lib/agenda.ts:158). Nunca `sin-cuenta` ni `toca-publicar`: los deriva el front con `estadoVistoAgenda` contra las cuentas y el instante (lib/agenda.ts:262).",
      "Registros viejos, como `migrarEntrada` (lib/agenda.ts:1209): sin `proveedor` → `manual`; sin `dueno` → `clipero`; sin `zonaOrigen` → America/Lima; sin `texto` → cadena vacía; un estado desconocido → `planificada`. Pero `publicando` y `fallida` se devuelven tal cual: volverlas a planificada reprogramaría un envío que quizá salió.",
      "Una entrada que se quedó en `publicando` porque el proceso murió a mitad la cierra el servidor (publicada o fallida), no el navegador (hooks/use-agenda.ts:221): la hoja de una entrada en `publicando` no ofrece ninguna acción.",
    ],
    origen: "hooks/use-agenda.ts:182",
  },
  {
    id: "calendario.crear",
    area: "calendario",
    metodo: "POST",
    ruta: "/publicaciones",
    resumen:
      "Da de alta una tanda de publicaciones planificadas y devuelve las creadas, con su id.",
    descripcion:
      "Sustituye a `crear` de `hooks/use-agenda.ts`, que `useAgenda()` expone como `programar` y usa también `publicarAhora`. Lo llaman el compositor del calendario (N clips × M redes a partir de una hora) y el diálogo «Publicar el clip», que crea las entradas y las envía en el mismo gesto. El «Publicar ahora» de la hoja del calendario no crea nada: envía una entrada que ya existe.",
    estado: "por-construir",
    auth: "sesion",
    cuerpo: {
      tipo: "NuevaEntrada[]",
      definidoEn: "lib/agenda.ts:220",
      campos: CAMPOS_ENTRADA.filter((c) => c.nombre !== "id" && c.nombre !== "creadaEn"),
      ejemplo: [
        {
          clipId: "clip_04",
          proyectoId: "src_01",
          titulo: "Nadie se va por el sueldo",
          red: "tiktok",
          cuentaId: "cta_tk_clipealo",
          programadaPara: "2026-09-17T00:00:00.000Z",
          zonaOrigen: "America/Lima",
          texto:
            "«Nadie se va por el sueldo. Se va por el jefe, y el sueldo le da la excusa.»",
          estado: "planificada",
          loteId: "lot_mfkq3x2a9z_0",
          dueno: "clipero",
          proveedor: "clipealo",
        },
        {
          clipId: "clip_04",
          proyectoId: "src_01",
          titulo: "Nadie se va por el sueldo",
          red: "youtube",
          cuentaId: "cta_yt_clipealo",
          programadaPara: "2026-09-17T00:00:00.000Z",
          zonaOrigen: "America/Lima",
          texto:
            "«Nadie se va por el sueldo. Se va por el jefe, y el sueldo le da la excusa.»",
          estado: "planificada",
          loteId: "lot_mfkq3x2a9z_0",
          dueno: "clipero",
          proveedor: "clipealo",
        },
      ],
    },
    respuesta: {
      tipo: "EntradaAgenda[]",
      definidoEn: "lib/agenda.ts:174",
      ejemplo: [
        {
          id: "age_mfkq3x4b1k",
          clipId: "clip_04",
          proyectoId: "src_01",
          titulo: "Nadie se va por el sueldo",
          red: "tiktok",
          cuentaId: "cta_tk_clipealo",
          programadaPara: "2026-09-17T00:00:00.000Z",
          zonaOrigen: "America/Lima",
          texto:
            "«Nadie se va por el sueldo. Se va por el jefe, y el sueldo le da la excusa.»",
          estado: "planificada",
          loteId: "lot_mfkq3x2a9z_0",
          dueno: "clipero",
          proveedor: "clipealo",
          creadaEn: "2026-09-13T12:25:00.000Z",
        },
        {
          id: "age_mfkq3x4c7p",
          clipId: "clip_04",
          proyectoId: "src_01",
          titulo: "Nadie se va por el sueldo",
          red: "youtube",
          cuentaId: "cta_yt_clipealo",
          programadaPara: "2026-09-17T00:00:00.000Z",
          zonaOrigen: "America/Lima",
          texto:
            "«Nadie se va por el sueldo. Se va por el jefe, y el sueldo le da la excusa.»",
          estado: "planificada",
          loteId: "lot_mfkq3x2a9z_0",
          dueno: "clipero",
          proveedor: "clipealo",
          creadaEn: "2026-09-13T12:25:00.000Z",
        },
      ],
    },
    errores: [
      NO_AUTORIZADO,
      {
        codigo: "no-autorizado",
        http: 403,
        cuando:
          "Alguna entrada es para más tarde y el plan no incluye programar (Prueba), o la cuenta no es de esta sesión.",
        frase: "common.errors.no-autorizado",
        bloquea: true,
      },
      {
        codigo: "redFueraDelPlan",
        http: 403,
        cuando:
          "La red de la cuenta no entra en el plan (Prueba solo publica en TikTok).",
        bloquea: true,
      },
      {
        codigo: "fueraDelCupo",
        http: 403,
        cuando:
          "La cuenta se sale del cupo de cuentas del plan (1 en Prueba, 6 en Creador, 20 en Empresa).",
        frase: "app.publicar.fueraDelCupo",
        bloquea: true,
      },
      {
        codigo: "sinClip",
        http: 422,
        cuando: "Falta el clip o no existe.",
        frase: "calendario.compositor.errores.sinClip",
        bloquea: true,
      },
      {
        codigo: "sinCuenta",
        http: 422,
        cuando: "Falta la cuenta o no está viva (con @ y conectada).",
        frase: "calendario.compositor.errores.sinCuenta",
        bloquea: true,
      },
      {
        codigo: "enPasado",
        http: 422,
        cuando:
          '`programadaPara` no es una fecha o ya pasó (salvo el envío inmediato del diálogo «Publicar el clip», que valida con `modo: "ahora"`).',
        frase: "calendario.compositor.errores.enPasado",
        bloquea: true,
      },
      {
        codigo: "formatoNoAdmitido",
        http: 422,
        cuando: "La red no admite el formato del clip.",
        frase: "calendario.compositor.errores.formatoNoAdmitido",
        bloquea: true,
      },
      {
        codigo: "duracionExcedida",
        http: 422,
        cuando: "El clip dura más que el máximo de la red.",
        frase: "calendario.compositor.errores.duracionExcedida",
        bloquea: true,
      },
      {
        codigo: "duplicadaEnCuenta",
        http: 422,
        cuando: "El mismo clip ya está a esa misma hora en esa cuenta.",
        frase: "calendario.compositor.errores.duplicadaEnCuenta",
        bloquea: true,
      },
      {
        codigo: "fueraDeVentanaCampana",
        http: 422,
        cuando: "Con `campanaId`: ese día la campaña ya no acepta clips.",
        frase: "calendario.compositor.errores.fueraDeVentanaCampana",
        bloquea: true,
      },
    ],
    reglas: [
      "Crear el `id` (`age_*`) y `creadaEn` en el servidor (hooks/use-agenda.ts:130). Si una entrada no trae `loteId` y la tanda tiene más de una, agrupar por clip: el mismo clip, el mismo lote (hooks/use-agenda.ts:120).",
      "Revalidar cada entrada con los códigos que bloquean de `validarEntrada` (lib/agenda.ts:597; BLOQUEA en lib/agenda.ts:497), contando la agenda MÁS el resto de la tanda. Los consejos (muyPegadaAOtra, demasiadasHoy, fueraDeDuracionIdeal) no rechazan nada. Responder con el mismo código en `{ code }`: hoy `pedir()` convierte cualquier 422 en `conflicto` (lib/api/errores.ts:32) y solo registra el cuerpo, así que la frontera tendrá que leerlo para enseñar la frase exacta.",
      "Formatos y duración máxima por red, como SOCIAL_NETWORKS (lib/social.ts:39): TikTok 9:16 hasta 600 s; Instagram 9:16, 4:5 o 1:1 hasta 180 s; YouTube 9:16 o 16:9 hasta 60 s; X 16:9 o 1:1 hasta 140 s; LinkedIn 1:1, 4:5 o 16:9 hasta 600 s; Facebook 9:16 o 1:1 hasta 90 s.",
      'Puerta de plan en el servidor, no en el navegador: programar para más tarde exige la capacidad `programar` (PLAN_MINIMO.programar = "creator", lib/pricing.ts:76; un plan creado en el backoffice la tiene si está en su lista). Crear para enviar ya (diálogo «Publicar el clip») es de todos los planes (docs/costuras-backend.md:122).',
      "Repetir la puerta de red y cupo de `validarPublicacion` (lib/planes.ts:628): NETWORKS_BY_PLAN (Prueba solo TikTok) y CUENTAS_POR_PLAN (1 / 6 / 20). El compositor del calendario no la pasa: ofrece todas las cuentas vivas.",
      "Cada `cuentaId` tiene que ser una cuenta de la sesión y estar viva: con @ y en estado `conectada` (`cuentaActiva`, lib/social.ts:133).",
      "Guardar `copia` tal cual llega: es el texto que DE VERDAD sale, y cambiar la plantilla del proyecto después no puede reescribirlo (lib/agenda.ts:193).",
      "Encolar cada entrada de proveedor `clipealo` para su `programadaPara`. Al despertar, marcarla `publicando` ANTES de enviar para que dos procesos no manden el mismo clip dos veces; después, `publicada` con `url`, `postId` y `publicadaEn`, o `fallida` con el código (lib/api/publicaciones.ts:18).",
      "Lo que se programa separado lo separa el front (45 minutos dentro de la misma cuenta, SEPARACION_MINIMA_MIN, lib/agenda.ts:467): el servidor guarda los instantes que llegan, no los recoloca.",
    ],
    origen: "hooks/use-agenda.ts:120",
  },
  {
    id: "calendario.reprogramar",
    area: "calendario",
    metodo: "PATCH",
    ruta: "/publicaciones/{entradaId}",
    resumen: "Cambia el día y la hora de una publicación y la devuelve a la cola.",
    descripcion:
      "Sustituye a `reprogramar(id, programadaPara)`. Lo usan el arrastre y el teclado de la rejilla, «Mover» de la hoja y el «Deshacer» del aviso «Ahora sale el {fecha}.», que manda el instante de antes.",
    estado: "por-construir",
    auth: "sesion",
    parametros: [PARAM_ID],
    cuerpo: {
      tipo: 'Pick<EntradaAgenda, "programadaPara">',
      definidoEn: "lib/agenda.ts:188",
      campos: [
        {
          nombre: "programadaPara",
          tipo: "string",
          requerido: true,
          descripcion:
            "El instante nuevo, en UTC. El front lo calcula del día y el minuto en la zona de la cuenta (`instanteDestino`).",
        },
      ],
      ejemplo: { programadaPara: "2026-09-18T23:00:00.000Z" },
    },
    respuesta: {
      tipo: "EntradaAgenda",
      definidoEn: "lib/agenda.ts:174",
      ejemplo: {
        id: "age_s6",
        clipId: "clip_04",
        proyectoId: "src_01",
        titulo: "Nadie se va por el sueldo",
        red: "youtube",
        cuentaId: "cta_yt_clipealo",
        programadaPara: "2026-09-18T23:00:00.000Z",
        zonaOrigen: "America/Lima",
        texto:
          "«Nadie se va por el sueldo. Se va por el jefe, y el sueldo le da la excusa.»",
        estado: "planificada",
        dueno: "clipero",
        proveedor: "clipealo",
        creadaEn: "2026-09-11T15:00:00.000Z",
      },
    },
    errores: [
      NO_AUTORIZADO,
      NO_ENCONTRADO,
      {
        codigo: "publicada",
        http: 409,
        cuando: "Ya salió: no se mueve.",
        frase: "calendario.mover.noSeMueve.publicada",
        bloquea: true,
      },
      {
        codigo: "publicando",
        http: 409,
        cuando: "El envío está en marcha.",
        frase: "calendario.mover.noSeMueve.publicando",
        bloquea: true,
      },
      {
        codigo: "cancelada",
        http: 409,
        cuando: "Está cancelada: primero se vuelve a planificar.",
        frase: "calendario.mover.noSeMueve.cancelada",
        bloquea: true,
      },
      {
        codigo: "sinCuenta",
        http: 422,
        cuando: "No tiene cuenta o su cuenta ya no está viva.",
        frase: "calendario.mover.noSeMueve.sinCuenta",
        bloquea: true,
      },
      {
        codigo: "noEncaja",
        http: 422,
        cuando:
          "El clip no cabe en su red por formato o duración: cambiar la hora no lo arregla.",
        frase: "calendario.mover.noSeMueve.noEncaja",
        bloquea: true,
      },
      {
        codigo: "enPasado",
        http: 422,
        cuando: "El instante nuevo ya pasó.",
        frase: "calendario.compositor.errores.enPasado",
        bloquea: true,
      },
      {
        codigo: "duplicadaEnCuenta",
        http: 422,
        cuando: "El mismo clip ya está a esa hora en esa cuenta.",
        frase: "calendario.compositor.errores.duplicadaEnCuenta",
        bloquea: true,
      },
      {
        codigo: "fueraDeVentanaCampana",
        http: 422,
        cuando: "Con campaña: ese día ya no acepta clips.",
        frase: "calendario.compositor.errores.fueraDeVentanaCampana",
        bloquea: true,
      },
    ],
    reglas: [
      "Solo se mueven las `planificada` y las `fallida`: `motivoNoMover` (lib/agenda.ts:349) rechaza publicada, publicando, cancelada, sin cuenta y noEncaja.",
      'Mover una fallida es volver a ponerla en cola: el servidor guarda `programadaPara`, pone `estado: "planificada"` y borra `fallo` (hooks/use-agenda.ts:205). Si ya estaba encolada, reencolarla con la hora nueva.',
      "Revalidar lo que depende del instante —enPasado, duplicadaEnCuenta y fueraDeVentanaCampana— sin contar la propia entrada ni las canceladas de la cuenta (lib/agenda.ts:582).",
      "No tocar nada más: ni el texto, ni la copia, ni la cuenta, ni el lote. Las hermanas del lote no se mueven con ella.",
      "Ojo con el «Deshacer» del arrastre: manda el instante de antes sin validar (components/agenda/agenda-view.tsx:246). Si lo que se movió era una fallida con la hora ya pasada (age_s1, sábado 12 a las 19:00 en Lima), ese instante está en el pasado y enPasado lo rechazaría; hoy el navegador lo acepta y la deja planificada en el pasado.",
    ],
    origen: "hooks/use-agenda.ts:205",
  },
  {
    id: "calendario.cancelar",
    area: "calendario",
    metodo: "POST",
    ruta: "/publicaciones/{entradaId}/cancelar",
    resumen: "Cancela una publicación planificada sin borrarla.",
    descripcion: "Sustituye a `cancelar(id)`: «Cancelar la publicación» de la hoja.",
    estado: "por-construir",
    auth: "sesion",
    parametros: [PARAM_ID],
    respuesta: {
      tipo: "EntradaAgenda",
      definidoEn: "lib/agenda.ts:174",
      ejemplo: { ...EJEMPLO_PLANIFICADA, estado: "cancelada" },
    },
    errores: [
      NO_AUTORIZADO,
      NO_ENCONTRADO,
      {
        codigo: "conflicto",
        http: 409,
        cuando:
          "No está planificada: ya salió, está saliendo, falló o ya estaba cancelada.",
        frase: "common.errors.conflicto",
        bloquea: true,
      },
    ],
    reglas: [
      "Solo desde `planificada`: es el único estado en el que la hoja lo ofrece (components/agenda/detalle-sheet.tsx:251).",
      "Sacarla de la cola de envío. Si ya está `publicando`, no se cancela: responder 409.",
      "No borrar: pasa a `cancelada` y conserva todo lo demás, porque se puede recuperar.",
      "Cancelar una entrada no cancela las de su lote.",
    ],
    origen: "hooks/use-agenda.ts:214",
  },
  {
    id: "calendario.recuperar",
    area: "calendario",
    metodo: "POST",
    ruta: "/publicaciones/{entradaId}/recuperar",
    resumen: "Devuelve una publicación cancelada a planificada.",
    descripcion:
      "Sustituye a `recuperar(id)`: «Volver a planificarla» de la hoja y el «Deshacer» del aviso «Publicación cancelada.».",
    estado: "por-construir",
    auth: "sesion",
    parametros: [PARAM_ID],
    respuesta: {
      tipo: "EntradaAgenda",
      definidoEn: "lib/agenda.ts:174",
      ejemplo: EJEMPLO_PLANIFICADA,
    },
    errores: [
      NO_AUTORIZADO,
      NO_ENCONTRADO,
      {
        codigo: "conflicto",
        http: 409,
        cuando: "No está cancelada.",
        frase: "common.errors.conflicto",
        bloquea: true,
      },
    ],
    reglas: [
      "Solo desde `cancelada`. Vuelve a `planificada` con el mismo `programadaPara` y la misma cuenta.",
      "Volver a encolarla. El front no revalida la hora al recuperar: si ya pasó, una de Clipealo se pinta «Publicándose» (lib/agenda.ts:271) y la cola la mandaría enseguida. Antes de reencolar, el servidor tiene que comprobar enPasado, que es lo que el navegador no hace.",
    ],
    origen: "hooks/use-agenda.ts:217",
  },
  {
    id: "calendario.marcar-publicada",
    area: "calendario",
    metodo: "POST",
    ruta: "/publicaciones/{entradaId}/marcar-publicada",
    resumen:
      "Registra como publicada una publicación que se subió fuera de Clipealo, con su enlace.",
    descripcion:
      "Sustituye a `marcarPublicada(id, url)`: «Ya la publiqué» del pie de la hoja. El enlace es el que Analíticas sabe seguir y el que «Enviar clip» necesita para una campaña.",
    estado: "por-construir",
    auth: "sesion",
    parametros: [PARAM_ID],
    cuerpo: {
      tipo: "{ url: string }",
      definidoEn: "hooks/use-agenda.ts:265",
      campos: [
        {
          nombre: "url",
          tipo: "string",
          requerido: true,
          descripcion:
            "El enlace de la publicación, copiado de la propia red. Sin espacios al principio ni al final.",
        },
      ],
      ejemplo: { url: "https://www.tiktok.com/@cortes.ana/video/7409118877665544" },
    },
    respuesta: {
      tipo: "EntradaAgenda",
      definidoEn: "lib/agenda.ts:174",
      ejemplo: {
        ...EJEMPLO_PLANIFICADA,
        estado: "publicada",
        url: "https://www.tiktok.com/@cortes.ana/video/7409118877665544",
        publicadaEn: "2026-09-13T12:20:00.000Z",
      },
    },
    errores: [
      NO_AUTORIZADO,
      NO_ENCONTRADO,
      {
        codigo: "enlaceError",
        http: 422,
        cuando: "La `url` no tiene forma de enlace http(s).",
        frase: "calendario.detalle.enlaceError",
        bloquea: true,
      },
      {
        codigo: "conflicto",
        http: 409,
        cuando:
          "No está planificada ni fallida (ya salió, está saliendo o está cancelada).",
        frase: "common.errors.conflicto",
        bloquea: true,
      },
    ],
    reglas: [
      "Validar al menos lo mismo que el navegador: `/^https?:\\/\\/\\S+\\.\\S+/` sobre la url sin espacios (components/agenda/detalle-sheet.tsx:58).",
      "Solo desde `planificada` o `fallida`, los dos estados en que la hoja lo ofrece (components/agenda/detalle-sheet.tsx:482). Sacarla de la cola: ya no hay nada que enviar.",
      'Guardar `estado: "publicada"`, la `url` y `publicadaEn` con la hora del servidor (la demo sella con AHORA_AGENDA, hooks/use-agenda.ts:270). No hay `postId`: no lo devolvió ninguna plataforma.',
      "Borrar `fallo` al marcar una fallida: el tipo dice que solo vale con `fallida` (lib/agenda.ts:206), y hoy el parche del navegador lo deja puesto.",
    ],
    origen: "hooks/use-agenda.ts:265",
  },
]
