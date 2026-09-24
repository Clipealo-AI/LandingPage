import type { Campo, Endpoint, ErrorDoc } from "@/lib/wiki/tipos"

/**
 * Endpoints de «operaciones».
 *
 * Recortar, Reducir tamaño y Variantes no tienen endpoint propio: son un
 * trabajo más de la cola y viajan por `POST /jobs` con el campo `operacion`
 * (`proyectos.crear`, frontera ya conectada en `lib/api/jobs.ts`). Lo que el
 * servidor tiene que comprobar de cada operación está escrito en su acción.
 *
 * Lo que sí es de aquí es la lista blanca de Derechos: las solicitudes de los
 * cliperos para que la agencia dé de alta una cuenta en su Content ID. Hoy
 * viven en el almacén del navegador `clipealo-campanas-v1`
 * (`solicitudesListaBlanca`, hooks/use-campanas.ts) y no tienen frontera en
 * `lib/api/`: hay que crearla y que el hook la llame.
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
    cuando: "`fetch` no llegó a salir: sin red (lib/api/errores.ts:63).",
    frase: "common.errors.sin-red",
    bloquea: true,
  },
  {
    codigo: "desconocido",
    cuando:
      "Cualquier otro estado (p. ej. 400) y también el corte a los 15 s (`ESPERA_MS`, lib/api/cliente.ts:25): `AbortSignal.timeout` rechaza con un `DOMException`, que `codigoDeError` no toma por falta de red (lib/api/errores.ts:60).",
    frase: "common.errors.desconocido",
    bloquea: true,
  },
]

/** La forma de una solicitud, campo a campo (`SolicitudListaBlanca`, lib/derechos.ts:61). */
const CAMPOS_SOLICITUD: Campo[] = [
  {
    nombre: "id",
    tipo: "string",
    requerido: true,
    descripcion:
      'Hoy lo inventa el cliente con `nuevoId("lb")` («lb_…»); en producción, el servidor.',
  },
  {
    nombre: "campanaId",
    tipo: "string",
    requerido: true,
    descripcion: "La campaña cuya licencia ofrece la lista blanca («cmp_liga»).",
  },
  {
    nombre: "userId",
    tipo: "string",
    requerido: false,
    descripcion:
      "Quién la pide. Opcional en el tipo porque lo guardado antes no lo traía; el servidor lo pone siempre, desde la sesión.",
  },
  {
    nombre: "creador",
    tipo: "string",
    requerido: true,
    descripcion:
      "Nombre visible de quien la pide, el que lee la agencia en la lista («Ana Ruiz»).",
  },
  {
    nombre: "cuentaId",
    tipo: "string",
    requerido: true,
    descripcion:
      "La cuenta conectada concreta («cta_tk_ana»): las plataformas dan de alta un canal, no a una persona.",
  },
  {
    nombre: "red",
    tipo: '"tiktok" | "instagram" | "youtube" | "x" | "linkedin" | "facebook"',
    requerido: true,
    descripcion:
      "`SocialId` de la cuenta (`SOCIAL_IDS`, lib/social.ts:12). Se copia de la cuenta al pedirla.",
  },
  {
    nombre: "handle",
    tipo: "string",
    requerido: true,
    descripcion:
      "El @ de la cuenta en el momento de pedirla («@cortes.ana»). Vacío si la cuenta no tenía.",
  },
  {
    nombre: "estado",
    tipo: '"pendiente" | "activa" | "rechazada"',
    requerido: true,
    descripcion:
      "`EstadoListaBlanca` (lib/derechos.ts:57). Nace «pendiente»; la agencia la pasa a «activa» o «rechazada».",
  },
  {
    nombre: "pedidaEn",
    tipo: "string",
    requerido: true,
    descripcion: "ISO. En la demo, `AHORA_DEMO` (2026-09-13T12:20:00.000Z).",
  },
  {
    nombre: "resueltaEn",
    tipo: "string",
    requerido: false,
    descripcion: "ISO. Solo cuando la agencia ha decidido.",
  },
  {
    nombre: "motivo",
    tipo: "string",
    requerido: false,
    descripcion:
      "Solo si se rechaza, y solo si la agencia escribió algo. Contenido de la agencia: lo lee el clipero.",
  },
]

const SOLICITUD_PENDIENTE = {
  id: "lb_mtzs7n9ck2",
  campanaId: "cmp_liga",
  userId: "u_ana",
  creador: "Ana Ruiz",
  cuentaId: "cta_tk_ana",
  red: "tiktok",
  handle: "@cortes.ana",
  estado: "pendiente",
  pedidaEn: "2026-09-13T12:20:00.000Z",
}

const SOLICITUD_RECHAZADA = {
  id: "lb_mtzs7n9c1f",
  campanaId: "cmp_liga",
  userId: "u_ana",
  creador: "Ana Ruiz",
  cuentaId: "cta_yt_clipealo",
  red: "youtube",
  handle: "@clipealo",
  estado: "rechazada",
  pedidaEn: "2026-09-13T12:20:00.000Z",
  resueltaEn: "2026-09-13T12:20:00.000Z",
  motivo: "Cuenta sin videos",
}

/* ---------------------------------------------------------------------------
   Endpoints
   --------------------------------------------------------------------------- */

/** Endpoints de «operaciones». */
export const ENDPOINTS: Endpoint[] = [
  {
    id: "operaciones.listar-lista-blanca",
    area: "operaciones",
    metodo: "GET",
    ruta: "/lista-blanca",
    resumen:
      "Las solicitudes de lista blanca que la sesión puede ver: las suyas como clipero y las de sus campañas como agencia.",
    descripcion:
      "Sustituye la lectura de `solicitudesListaBlanca` del almacén `clipealo-campanas-v1` (hooks/use-campanas.ts:127), que hoy devuelve todas las solicitudes del navegador y cada pantalla filtra: la tarjeta de cada campaña en Operaciones › Derechos (clipero), la lista «Solicitudes de lista blanca» (agencia) y el contador de pendientes de la tarjeta «Derechos» de la ficha de una campaña. Devuelve el mismo array, ya limpio, para que el hook no cambie.",
    estado: "por-construir",
    auth: "sesion",
    respuesta: {
      tipo: "SolicitudListaBlanca[]",
      definidoEn: "lib/derechos.ts:61",
      campos: CAMPOS_SOLICITUD,
      ejemplo: [SOLICITUD_PENDIENTE, SOLICITUD_RECHAZADA],
    },
    errores: ERRORES_API,
    reglas: [
      "Nunca todas: a un clipero, las que pidió él (`userId` de la sesión, que es con lo que la pantalla las cruza, lib/derechos.ts:170); a una agencia, además, todas las de las campañas que creó (`creadaPor.userId`, components/app/derechos-panel.tsx:292). Hoy el almacén del navegador las guarda todas juntas y cada pantalla filtra.",
      "Con solo las de la sesión la pantalla sigue funcionando: el aviso «yaPedida» mira las solicitudes que recibe (components/app/derechos-panel.tsx:194), y la cuenta por la que se pregunta es siempre de quien pide.",
      "Las solicitudes de las campañas creadas por el equipo (perfil admin, sin `userId`, como cmp_liga) no son de ninguna agencia: hoy no las ve nadie y el backoffice no tiene pantalla para ellas. Hay que decidir quién las lee antes de conectarlo.",
      "Cada fila con la forma completa: `estado` siempre uno de los tres (lo desconocido se lee como «pendiente», lib/derechos.ts:232) y `motivo` solo si no está vacío.",
      "Sin orden garantizado en el front: la pantalla las pinta en el orden en que llegan. Conviene devolverlas por `pedidaEn`, de la más antigua a la más nueva, como las añade hoy el almacén.",
    ],
    origen: "hooks/use-campanas.ts:127",
  },
  {
    id: "operaciones.pedir-lista-blanca",
    area: "operaciones",
    metodo: "POST",
    ruta: "/lista-blanca",
    resumen:
      "El clipero pide que la agencia dé de alta una de sus cuentas conectadas en el Content ID de una campaña.",
    descripcion:
      "Sustituye a `pedirListaBlanca(s)` (hooks/use-campanas.ts:452), que hoy solo añade la solicitud al almacén del navegador. El cuerpo es la `SolicitudListaBlanca` que monta la tarjeta con `nuevaSolicitudListaBlanca` (lib/derechos.ts:120) y la respuesta, la solicitud guardada. Las validaciones que hoy hace el navegador (`validarSolicitudListaBlanca`, lib/derechos.ts:91) las tiene que repetir el servidor y contestar con los mismos códigos (docs/costuras-backend.md:163). Ojo: hoy `pedir()` solo traduce el estado HTTP (lib/api/cliente.ts:72), así que la frase que verá la persona es la de `common.errors.conflicto` hasta que la frontera lea el código.",
    estado: "por-construir",
    auth: "sesion",
    cuerpo: {
      tipo: "SolicitudListaBlanca",
      definidoEn: "lib/derechos.ts:61",
      campos: [
        {
          nombre: "campanaId",
          tipo: "string",
          requerido: true,
          descripcion: "La campaña («cmp_liga»).",
        },
        {
          nombre: "cuentaId",
          tipo: "string",
          requerido: true,
          descripcion: "La cuenta conectada elegida en «Cuenta» («cta_tk_ana»).",
        },
        {
          nombre: "red",
          tipo: "SocialId",
          requerido: true,
          descripcion:
            "La red de esa cuenta. El servidor la saca de la cuenta, no del cuerpo.",
        },
        {
          nombre: "handle",
          tipo: "string",
          requerido: true,
          descripcion: "El @ de esa cuenta. Igual: lo saca de la cuenta.",
        },
        {
          nombre: "id",
          tipo: "string",
          requerido: true,
          descripcion:
            'Hoy lo inventa el navegador con `nuevoId("lb")`. El servidor lo ignora y pone el suyo.',
        },
        {
          nombre: "userId",
          tipo: "string",
          requerido: false,
          descripcion:
            "Hoy `CUENTA_DEMO.userId` («u_ana»). El servidor lo ignora y lo toma de la sesión.",
        },
        {
          nombre: "creador",
          tipo: "string",
          requerido: true,
          descripcion:
            "Hoy el nombre de la cuenta de la demo. El servidor pone el nombre visible de la sesión.",
        },
        {
          nombre: "estado",
          tipo: '"pendiente"',
          requerido: true,
          descripcion: "Siempre «pendiente». El servidor no acepta otro.",
        },
        {
          nombre: "pedidaEn",
          tipo: "string",
          requerido: true,
          descripcion:
            "Hoy `AHORA_DEMO` (2026-09-13T12:20:00.000Z). El servidor pone su reloj.",
        },
      ],
      ejemplo: SOLICITUD_PENDIENTE,
    },
    respuesta: {
      tipo: "SolicitudListaBlanca",
      definidoEn: "lib/derechos.ts:61",
      campos: CAMPOS_SOLICITUD,
      ejemplo: SOLICITUD_PENDIENTE,
    },
    errores: [
      {
        codigo: "sinListaBlanca",
        http: 422,
        cuando:
          "La licencia de la campaña no ofrece lista blanca (o la campaña no tiene licencia: vale `LICENCIA_POR_DEFECTO`, sin lista blanca).",
        frase: "app.operaciones.derechos.errors.sinListaBlanca",
        bloquea: true,
      },
      {
        codigo: "campanaCerrada",
        http: 422,
        cuando:
          "La campaña ya no admite solicitudes: inscripciones cerradas, estado distinto de «activa» o `fin` ya pasado.",
        frase: "app.operaciones.derechos.errors.campanaCerrada",
        bloquea: true,
      },
      {
        codigo: "sinCuenta",
        http: 422,
        cuando:
          "Falta `cuentaId`, o no es una cuenta conectada y activa de quien la pide.",
        frase: "app.operaciones.derechos.errors.sinCuenta",
        bloquea: true,
      },
      {
        codigo: "redFuera",
        http: 422,
        cuando: "La red de la cuenta no está entre las `redes` de la campaña.",
        frase: "app.operaciones.derechos.errors.redFuera",
        bloquea: true,
      },
      {
        codigo: "yaPedida",
        http: 409,
        cuando:
          "Esa cuenta ya tiene en esa campaña una solicitud «pendiente» o «activa». Una «rechazada» no cuenta.",
        frase: "app.operaciones.derechos.errors.yaPedida",
        bloquea: true,
      },
      {
        codigo: "no-encontrado",
        http: 404,
        cuando: "La campaña no existe.",
        frase: "common.errors.no-encontrado",
        bloquea: true,
      },
      ...ERRORES_API,
    ],
    reglas: [
      "La licencia de la campaña tiene que ofrecer lista blanca (`licenciaDe(c).listaBlanca`, lib/derechos.ts:42). En la demo solo la ofrece cmp_liga, «Liga de las Estrellas: temporada de otoño» (lib/campanas.ts:772).",
      'Campaña abierta con el reloj del servidor, como hace hoy la tarjeta con el de la demo (components/app/derechos-panel.tsx:196): `inscripcionesAbiertas !== false`, `estado === "activa"` y `fin` ≥ ahora.',
      "La cuenta tiene que ser de quien la pide y estar activa: con handle y en estado «conectada» (`cuentaActiva`, lib/social.ts:133). Hoy la pantalla ofrece todas las cuentas activas del navegador, también las de dueño «agencia»; el servidor no puede fiarse de eso.",
      "La red de la cuenta, entre las de la campaña (lib/derechos.ts:103).",
      "Como mucho una solicitud viva por cuenta y campaña: se rechaza si ya hay una «pendiente» o «activa»; tras un rechazo se puede volver a pedir (lib/derechos.ts:105).",
      "Solo quien participa o participó en la campaña: la pantalla solo ofrece el formulario en las campañas con participaciones (components/app/derechos-panel.tsx:82), que hoy no se filtran por persona y con el servidor serán las de la sesión.",
      "La solicitud nace «pendiente». `id`, `userId`, `creador`, `red`, `handle` y `pedidaEn` los pone el servidor, nunca el cuerpo.",
      "No depende del plan: Derechos es de todos (lib/operaciones.ts:40 no le pone capacidad).",
    ],
    origen: "hooks/use-campanas.ts:452",
  },
  {
    id: "operaciones.resolver-lista-blanca",
    area: "operaciones",
    metodo: "PATCH",
    ruta: "/lista-blanca/{id}",
    resumen:
      "La agencia decide una solicitud: la da de alta («activa») o la rechaza con su motivo.",
    descripcion:
      "Sustituye a `resolverListaBlanca(id, aprobada, motivo?)` (hooks/use-campanas.ts:458), que hoy cambia la solicitud en el almacén del navegador con `resolverListaBlanca` de lib/derechos.ts:142. Lo usan «Dar de alta» y la confirmación del diálogo «Rechazar» de Operaciones › Derechos. Clipealo guarda la decisión: el alta en el Content ID la hace la agencia en la plataforma, y ningún código de hoy llama a una plataforma.",
    estado: "por-construir",
    auth: "agencia",
    parametros: [
      {
        nombre: "id",
        tipo: "string",
        requerido: true,
        en: "ruta",
        descripcion: "Id de la solicitud («lb_mtzs7n9ck2»).",
      },
    ],
    cuerpo: {
      tipo: "{ aprobada: boolean; motivo?: string }",
      definidoEn: "hooks/use-campanas.ts:458",
      campos: [
        {
          nombre: "aprobada",
          tipo: "boolean",
          requerido: true,
          descripcion: "`true` con «Dar de alta»; `false` al confirmar «Rechazar».",
        },
        {
          nombre: "motivo",
          tipo: "string",
          requerido: false,
          descripcion:
            "Solo al rechazar: lo que se escribió en «Motivo» («Lo verá el clipero.»). Se ignora al aprobar.",
        },
      ],
      ejemplo: { aprobada: false, motivo: "Cuenta sin videos" },
    },
    respuesta: {
      tipo: "SolicitudListaBlanca",
      definidoEn: "lib/derechos.ts:61",
      campos: CAMPOS_SOLICITUD,
      ejemplo: SOLICITUD_RECHAZADA,
    },
    errores: [
      {
        codigo: "no-encontrado",
        http: 404,
        cuando: "La solicitud no existe, o es de una campaña que no es de esta agencia.",
        frase: "common.errors.no-encontrado",
        bloquea: true,
      },
      {
        codigo: "conflicto",
        http: 409,
        cuando:
          "La solicitud ya no está «pendiente»: otra pestaña o otra persona de la agencia ya la resolvió.",
        frase: "common.errors.conflicto",
        bloquea: true,
      },
      ...ERRORES_API,
    ],
    reglas: [
      "Solo la cuenta que creó la campaña (`creadaPor.userId`): es la única que la ve en su lista (components/app/derechos-panel.tsx:292).",
      "Solo solicitudes «pendientes»: la pantalla no ofrece botones sobre las resueltas.",
      "Aprobar: `estado` «activa», `resueltaEn` = ahora del servidor y sin `motivo` aunque llegue (lib/derechos.ts:152).",
      "Rechazar: `estado` «rechazada», `resueltaEn` = ahora y `motivo` sin espacios al principio ni al final; si queda vacío, no se guarda. El código no le pone tope de caracteres.",
      "El clipero ve el cambio en su tarjeta («Activa: tu cuenta está dada de alta» o «Rechazada» con el motivo). Una rechazada deja volver a pedir la misma cuenta.",
      "Por decidir: las solicitudes de campañas creadas por el equipo (sin `creadaPor.userId`, como cmp_liga, la única de la demo con lista blanca y la del ejemplo) no tienen agencia que las resuelva y el backoffice no tiene pantalla para ellas. O las resuelve el equipo (y este endpoint admite también `admin`) o esas campañas no ofrecen lista blanca.",
    ],
    origen: "hooks/use-campanas.ts:458",
  },
]
