import type { Endpoint } from "@/lib/wiki/tipos"

/**
 * Endpoints de «campanas»: el lado del clipero (explorar, desbloquear, pedir
 * entrar, entregar, releer vistas y reclamar). La lista blanca de Derechos
 * vive en Operaciones (`operaciones.*-lista-blanca`, api/operaciones.ts).
 *
 * Ninguno existe todavía como frontera en `lib/api/`: todo vive en el almacén
 * del navegador `clipealo-campanas-v1` (`hooks/use-campanas.ts`). Las formas
 * son las que ya usa el front, así que conectar es cambiar el cuerpo del hook
 * por estas llamadas. La lectura de vistas sí sale por una frontera conectada,
 * `POST /analiticas/metricas` (`lib/api/analiticas.ts`), que es de Analíticas.
 *
 * Los ejemplos salen de las semillas de `lib/campanas.ts` y
 * `lib/participacion.ts`, con el «hoy» de la demo: 2026-09-13T12:20:00.000Z.
 *
 * Los estados HTTP son una propuesta que encaja con `codigoDeEstado`
 * (`lib/api/errores.ts`). Ojo: hoy `pedir` no lee el cuerpo de un error
 * (`lib/api/cliente.ts:72`), así que un código de dominio en `{ code }`
 * («yaDentro», «sinPlazas»…) no llega a la pantalla: el front ve
 * `conflicto` o `no-autorizado`. Mientras tanto, el front ya valida lo mismo
 * antes de llamar y apaga el botón.
 */

/* Semillas que se repiten en los ejemplos --------------------------------- */

const LIGA = {
  id: "cmp_liga",
  titulo: "Liga de las Estrellas: temporada de otoño",
  marca: "Liga de las Estrellas",
  descripcion:
    "Las mejores jugadas, goles y reacciones de la temporada. Clips verticales de un solo momento, con el marcador visible.",
  categoria: "marcas",
  creadaPor: { perfil: "admin", nombre: "Clipealo" },
  estado: "activa",
  destacada: true,
  privada: false,
  presupuesto: 3600,
  cpm: 0.72,
  topePorVideoPct: 4,
  minimoVistas: 5000,
  redes: ["youtube", "tiktok", "instagram"],
  material: "https://youtube.com/@ligadelasestrellas",
  requisitos: [
    "Un momento por clip, de 15 a 45 segundos",
    "El marcador tiene que verse",
    "Etiqueta a @ligaestrellas",
  ],
  inicio: "2026-09-01T00:00:00.000Z",
  fin: "2026-11-30T23:59:00.000Z",
  creadaEn: "2026-08-30T15:00:00.000Z",
  vertical: "deportes",
  sector: "deportes",
  creadorId: "cre_liga_estrellas",
  licencia: {
    alcance: "campana",
    listaBlanca: true,
    atribucion: "@ligaestrellas",
    notas: "Sin música ajena encima; el marcador tiene que verse.",
  },
}

const ALEX = {
  id: "cmp_alex",
  titulo: "Álex Prado y el método Enfoque",
  marca: "Álex Prado",
  descripcion:
    "Fragmentos del curso gratuito de productividad: un hábito, una explicación, un antes y después.",
  categoria: "infoproductores",
  creadaPor: { perfil: "admin", nombre: "Clipealo" },
  estado: "activa",
  destacada: false,
  privada: false,
  presupuesto: 900,
  cpm: 1.1,
  topePorVideoPct: 10,
  minimoVistas: 2000,
  redes: ["youtube", "tiktok", "instagram"],
  material: "https://youtube.com/@alexprado",
  requisitos: ["Menciona el curso gratuito en la descripción"],
  inicio: "2026-09-05T00:00:00.000Z",
  fin: "2026-10-15T23:59:00.000Z",
  creadaEn: "2026-09-04T09:00:00.000Z",
  vertical: "educacion",
  sector: "educacion-infoproductos",
  creadorId: "cre_alex_prado",
  modoParticipacion: "abierta",
}

/** «Lanzamiento privado de Lumen» tal como la ve quien la desbloquea: sin `codigo`. */
const LUMEN_DESBLOQUEADA = {
  id: "cmp_vip",
  titulo: "Lanzamiento privado de Lumen",
  marca: "Lumen App",
  descripcion:
    "Solo para los creadores invitados por la agencia: clips del evento de lanzamiento antes de que se haga público.",
  categoria: "marcas",
  creadaPor: { perfil: "agencia", nombre: "Agencia Nébula", userId: "u_nebula" },
  estado: "activa",
  destacada: false,
  privada: true,
  presupuesto: 2500,
  cpm: 2.5,
  topePorVideoPct: 10,
  minimoVistas: 5000,
  redes: ["tiktok", "instagram", "linkedin"],
  material: "https://drive.google.com/drive/folders/lumen-privado",
  requisitos: [
    "No publicar antes del 15 de septiembre",
    "El logo de Lumen en los primeros 3 segundos",
  ],
  inicio: "2026-09-10T00:00:00.000Z",
  fin: "2026-10-10T23:59:00.000Z",
  creadaEn: "2026-09-09T11:00:00.000Z",
  vertical: "tecnologia",
  sector: "apps-software-ia",
}

/** «La regla de las tres reuniones»: recién publicado desde Clipealo, sin primera lectura. */
const ENVIO_PENDIENTE = {
  id: "env_ana_04",
  campanaId: "cmp_liga",
  creador: "Ana Ruiz",
  userId: "u_ana",
  titulo: "La regla de las tres reuniones",
  red: "tiktok",
  url: "https://www.tiktok.com/@cortes.ana/video/7409112233445566",
  publicacionId: "age_s8",
  cuentaId: "cta_tk_ana",
  clipId: "clip_02",
  proyectoId: "src_01",
  estado: "en-revision",
  enviadoEn: "2026-09-13T01:00:00.000Z",
}

/** «El gol de chilena del minuto 89»: medido, aprobado. */
const ENVIO_MEDIDO = {
  id: "env_ana_02",
  campanaId: "cmp_liga",
  creador: "Ana Ruiz",
  userId: "u_ana",
  titulo: "El gol de chilena del minuto 89",
  red: "instagram",
  url: "https://www.instagram.com/reel/7302",
  publicacionId: "pub_02_instagram",
  cuentaId: "cta_ig_nebula",
  clipId: "clip_02",
  proyectoId: "src_01",
  vistas: 38_900,
  vistasEn: "2026-09-13T12:20:00.000Z",
  estado: "aprobado",
  enviadoEn: "2026-09-04T16:00:00.000Z",
}

/** Ana, dentro de «Liga de las Estrellas» con el plazo corriendo. */
const PAR_LIGA = {
  id: "par_dem_01",
  campanaId: "cmp_liga",
  userId: "u_ana",
  clipero: "Ana Ruiz",
  estado: "aceptada",
  solicitadaEn: "2026-09-11T12:20:00.000Z",
  decididaEn: "2026-09-12T12:20:00.000Z",
  venceEn: "2026-09-19T12:20:00.000Z",
  nota: "Llevo dos años clipeando fútbol; publico en TikTok y YouTube el mismo día.",
}

const PARAMETRO_CAMPANA = {
  nombre: "id",
  tipo: "string",
  requerido: true,
  en: "ruta" as const,
  descripcion: "Id de la campaña, estable desde la semilla: `cmp_liga`, `cmp_anmi`…",
}

const PARAMETRO_PARTICIPACION = {
  nombre: "id",
  tipo: "string",
  requerido: true,
  en: "ruta" as const,
  descripcion: "Id de la participación (`par_dem_01`, o `par_…` de `nuevoId`).",
}

export const ENDPOINTS: Endpoint[] = [
  /* ----------------------------------------------------------------------
     Campañas
     ---------------------------------------------------------------------- */
  {
    id: "campanas.listar",
    area: "campanas",
    metodo: "GET",
    ruta: "/campanas",
    resumen:
      "Las campañas que la cuenta puede ver: las públicas, las privadas que desbloqueó con su código y las que creó.",
    descripcion:
      "Sustituye a `[...campanasSemilla, ...p.creadas]` con los cambios de estado aplicados (`p.cambios`). Con esta lista el front calcula todo lo demás en el cliente: la liquidación (`liquidar`), el estado que se enseña (`estadoVisible`: «vencida» sale del reloj y «cerrada» de `inscripcionesAbiertas`; ninguna de las dos se guarda como estado), la búsqueda, los filtros y el orden. El servidor devuelve la campaña tal como se guarda.",
    estado: "por-construir",
    auth: "sesion",
    respuesta: {
      tipo: "Campana[]",
      definidoEn: "lib/campanas.ts:75",
      ejemplo: [LIGA, ALEX],
    },
    errores: [
      {
        codigo: "no-autorizado",
        http: 401,
        cuando: "Sin sesión.",
        frase: "common.errors.no-autorizado",
        bloquea: true,
      },
    ],
    reglas: [
      "Una privada (`privada: true`) solo sale para quien la desbloqueó con su código o para quien la creó: Explorar enseña las públicas y las desbloqueadas (`campaigns-explorer.tsx:143`). Las ids de las privadas desbloqueadas son las que el front guarda hoy en `desbloqueadas`.",
      "`codigo` solo viaja a quien creó la campaña (y al admin, que lo ve en su backoffice): es la llave de la privada. La app solo lo enseña a quien la creó, en «Gestionar tu campaña» y en «Mis campañas».",
      "Lo guardado con un modelo anterior se limpia como `migrarCampana`: la categoría desde su etiqueta antigua («Música» → `musica`) y redes y segmentación con ids válidos.",
      "Los ids se conservan (`cmp_liga`, `cmp_bingo`…): envíos, participaciones y enlaces apuntan a ellos.",
      "Importes en dólares: `presupuesto` en US$ y `cpm` en US$ por 1.000 vistas, ya redondeados a céntimos (`borradorACampana`).",
    ],
    origen: "hooks/use-campanas.ts:270",
  },
  {
    id: "campanas.obtener",
    area: "campanas",
    metodo: "GET",
    ruta: "/campanas/{id}",
    resumen: "Una campaña, para su ficha.",
    descripcion:
      "Hoy la ficha la busca en la lista del almacén (`campanas.find`). Las semillas se prerrenderizan; las creadas en la app solo existen en el navegador, por eso un id desconocido enseña «No encontramos esta campaña» y no un 404.",
    estado: "por-construir",
    auth: "sesion",
    parametros: [PARAMETRO_CAMPANA],
    respuesta: {
      tipo: "Campana",
      definidoEn: "lib/campanas.ts:75",
      ejemplo: LIGA,
    },
    errores: [
      {
        codigo: "no-encontrado",
        http: 404,
        cuando: "No existe ninguna campaña con ese id.",
        frase: "campaigns.detail.notFound.title",
        bloquea: true,
      },
      {
        codigo: "no-autorizado",
        http: 403,
        cuando:
          "Es privada y la cuenta ni la creó ni la ha desbloqueado. El front enseña «Campaña privada» con el botón «Código de acceso».",
        frase: "campaigns.detail.private.title",
        bloquea: true,
      },
    ],
    reglas: [
      "Una privada sin desbloquear no se devuelve ni da pistas: ni título ni marca. La página ya lo cuida en el título de la pestaña (`page.tsx:17`).",
      "Mismo filtrado de `codigo` que en la lista: solo para quien la creó (y el admin).",
    ],
    origen: "components/campanas/campaign-detail.tsx:76",
  },
  {
    id: "campanas.desbloquear",
    area: "campanas",
    metodo: "POST",
    ruta: "/campanas/desbloquear",
    resumen: "Desbloquea una campaña privada con su código de acceso y la devuelve.",
    descripcion:
      "Sustituye a `buscarPorCodigo(campanas, codigo)` + `desbloquear(id)`. Hoy el navegador tiene todas las campañas y busca el código en local; con servidor, las privadas no llegan al cliente hasta que el código las abre, así que la búsqueda tiene que hacerla él.",
    estado: "por-construir",
    auth: "sesion",
    cuerpo: {
      tipo: "{ codigo: string }",
      campos: [
        {
          nombre: "codigo",
          tipo: "string",
          requerido: true,
          descripcion:
            "Lo que escribió la persona o lo que llegó en `?codigo=`, tal cual: el servidor lo normaliza.",
        },
      ],
      ejemplo: { codigo: "lumn 2026" },
    },
    respuesta: {
      tipo: "Campana",
      definidoEn: "lib/campanas.ts:75",
      ejemplo: LUMEN_DESBLOQUEADA,
    },
    errores: [
      {
        codigo: "no-encontrado",
        http: 404,
        cuando: "El código no corresponde a ninguna campaña privada.",
        frase: "campaigns.accessCode.notFound",
        bloquea: true,
      },
      {
        codigo: "limite",
        http: 429,
        cuando: "Demasiados intentos seguidos desde la misma cuenta.",
        frase: "common.errors.limite",
        bloquea: true,
      },
    ],
    reglas: [
      "Normalizar como `normalizarCodigo`: mayúsculas, solo A–Z y 0–9 y, con 8 caracteres, el guion en medio (`lumn 2026` → `LUMN-2026`).",
      "Buscar solo entre las privadas (`buscarPorCodigo`): una campaña pública no se abre con código.",
      "Guardar el desbloqueo en la cuenta. Hoy vive en `desbloqueadas` del almacén del navegador y se pierde al cambiar de dispositivo.",
      "Idempotente: desbloquear dos veces no duplica nada (`desbloquear` ya lo evita).",
      "Propuesta: limitar los intentos, porque el código es lo único que protege una privada. Hoy no hay límite: la búsqueda es local.",
      "No pide plan: ver una privada es de todos; participar, no.",
    ],
    origen: "hooks/use-campanas.ts:468",
  },

  /* ----------------------------------------------------------------------
     Envíos: los clips entregados y sus vistas
     ---------------------------------------------------------------------- */
  {
    id: "campanas.listar-envios",
    area: "campanas",
    metodo: "GET",
    ruta: "/envios",
    resumen:
      "Los clips enviados a las campañas que la cuenta ve, de todos los creadores: con ellos se reparte el presupuesto.",
    descripcion:
      "Sustituye a `[...enviosSemilla, ...p.envios]` con `cambiosEnvio` aplicados. El front reparte el presupuesto con `liquidar()` entre los envíos APROBADOS de cada campaña, por orden de llegada, así que necesita los de todos los creadores y no solo los suyos: de ahí salen el consumido de cada tarjeta, lo que queda, el ranking «Los clips que más cobran» y lo que cobra cada clip de «Tus clips enviados».",
    estado: "por-construir",
    auth: "sesion",
    parametros: [
      {
        nombre: "campanaId",
        tipo: "string",
        requerido: false,
        en: "consulta",
        descripcion:
          "Solo los de una campaña (la ficha). Sin él, los de todas las visibles.",
      },
    ],
    respuesta: {
      tipo: "Envio[]",
      definidoEn: "lib/campanas.ts:160",
      ejemplo: [ENVIO_MEDIDO, ENVIO_PENDIENTE],
    },
    reglas: [
      "`vistas` ausente significa sin medir, nunca cero: no rellenar con 0. La tabla distingue medido, pendiente de primera lectura (`medible`: hay `publicacionId`) y sin medir (enlace ajeno); `vistasDe` cuenta cero sin afirmar que se midió.",
      "`enviadoEn` es el orden de reparto: `liquidar` paga por orden de llegada y el que llega sin presupuesto cobra lo que reste.",
      "Hoy `publicacionId`, `clipId` y `proyectoId` solo los lee «Tus clips enviados», la tabla del dueño (para releer vistas y enlazar a su clip), y `cuentaId` no lo lee ninguna pantalla. De los envíos ajenos, el ranking de la ficha pinta creador, red, vistas y lo que cobran (`campaign-detail.tsx:265`).",
      "El motivo de un rechazo (`motivoRechazo`) lo escribe quien revisa, en su idioma: es contenido, no una clave.",
    ],
    origen: "hooks/use-campanas.ts:278",
  },
  {
    id: "campanas.crear-envio",
    area: "campanas",
    metodo: "POST",
    ruta: "/campanas/{id}/envios",
    resumen:
      "Entrega un clip a una campaña: entra en revisión y cierra la parte del clipero del compromiso.",
    descripcion:
      "Sustituye a `enviarClip(envio, compromisoAlEntregar(…))`. El front manda el `Envio` que ya construye el diálogo; el servidor decide lo que no puede decidir el navegador (quién puede entregar, cuántas vistas tiene el clip, el instante) y escribe el envío y el compromiso en la misma transacción.",
    estado: "por-construir",
    auth: "sesion",
    parametros: [PARAMETRO_CAMPANA],
    cuerpo: {
      tipo: "Envio",
      definidoEn: "lib/campanas.ts:160",
      campos: [
        {
          nombre: "id",
          tipo: "string",
          requerido: true,
          descripcion:
            "`env_…` generado en el cliente (`nuevoId`). El servidor puede respetarlo o dar el suyo; el compromiso se ata al id que devuelva.",
        },
        {
          nombre: "campanaId",
          tipo: "string",
          requerido: true,
          descripcion: "Tiene que coincidir con `{id}` de la ruta.",
        },
        {
          nombre: "creador",
          tipo: "string",
          requerido: true,
          descripcion:
            "Nombre visible de quien envía. El front lo manda; el servidor lo pone desde la sesión.",
        },
        {
          nombre: "userId",
          tipo: "string",
          requerido: false,
          descripcion:
            "`u_ana` en la demo. El servidor lo pone desde la sesión, nunca del cuerpo.",
        },
        {
          nombre: "titulo",
          tipo: "string",
          requerido: true,
          descripcion:
            "El de la publicación; si vino por enlace, «Clip enviado por enlace» en el idioma de quien lo envía.",
        },
        {
          nombre: "red",
          tipo: "SocialId",
          requerido: true,
          descripcion: "Una de `campana.redes`.",
        },
        {
          nombre: "url",
          tipo: "string",
          requerido: true,
          descripcion: "Enlace público del clip: `^https?://\\S+\\.\\S+`.",
        },
        {
          nombre: "publicacionId",
          tipo: "string",
          requerido: false,
          descripcion:
            "La publicación de Clipealo de la que sale. Con él, las vistas se leen solas; sin él, nadie las lee.",
        },
        {
          nombre: "cuentaId",
          tipo: "string",
          requerido: false,
          descripcion: "La cuenta conectada por la que salió.",
        },
        {
          nombre: "clipId",
          tipo: "string",
          requerido: false,
          descripcion: "El clip dentro de su proyecto.",
        },
        {
          nombre: "proyectoId",
          tipo: "string",
          requerido: false,
          descripcion: "El proyecto del clip.",
        },
        {
          nombre: "vistas",
          tipo: "number",
          requerido: false,
          descripcion:
            "Lo que el navegador leyó al enviar (del índice, si la publicación ya estaba indexada). El servidor no lo usa: pone la cifra de su instantánea.",
        },
        {
          nombre: "vistasEn",
          tipo: "string",
          requerido: false,
          descripcion:
            "ISO del índice (`INDEXADO_EN`) cuando van vistas. El servidor pone el instante de su lectura.",
        },
        {
          nombre: "estado",
          tipo: '"en-revision"',
          requerido: true,
          descripcion: "Siempre `en-revision` al entregar; lo impone el servidor.",
        },
        {
          nombre: "enviadoEn",
          tipo: "string",
          requerido: true,
          descripcion:
            "ISO. El servidor lo sustituye por su reloj: decide el orden de reparto.",
        },
      ],
      ejemplo: ENVIO_PENDIENTE,
    },
    respuesta: {
      tipo: "Envio",
      definidoEn: "lib/campanas.ts:160",
      ejemplo: ENVIO_PENDIENTE,
    },
    errores: [
      {
        codigo: "no-encontrado",
        http: 404,
        cuando: "La campaña no existe o es privada y no está desbloqueada.",
        frase: "common.errors.no-encontrado",
        bloquea: true,
      },
      {
        codigo: "conflicto",
        http: 409,
        cuando:
          "El mismo clip ya está en esta campaña: misma `publicacionId` o, si vino por enlace, misma `url`.",
        frase: "common.errors.conflicto",
        bloquea: true,
      },
      {
        codigo: "conflicto",
        http: 422,
        cuando:
          "La campaña no admite clips de esta persona: pausada, agotada, vencida o finalizada, o con solicitud y sin compromiso aceptado en plazo.",
        frase: "common.errors.conflicto",
        bloquea: true,
      },
      {
        codigo: "no-autorizado",
        http: 403,
        cuando:
          "Sin compromiso aceptado y con un plan que no incluye participar en campañas.",
        frase: "campaigns.participation.blocked.plan",
        bloquea: true,
      },
      {
        codigo: "linkError",
        http: 422,
        cuando: "La `url` no es un enlace público, o la `red` no es de la campaña.",
        frase: "campaigns.submit.linkError",
        bloquea: true,
      },
    ],
    reglas: [
      "Recalcular quién puede entregar sin fiarse del botón: con un compromiso `aceptada` en plazo, o en una campaña `abierta` (`puedeEntregar`); y la campaña tiene que admitir clips (`aceptaEnvios(estado, { yaDentro })`): activa, o con inscripciones cerradas si ya estaba dentro.",
      "Plan: sin compromiso aceptado hace falta la capacidad `participarCampanas` (Creador en adelante, `PLAN_MINIMO`). Con un compromiso aceptado se entrega aunque el plan haya bajado: el plazo lo dio la agencia (`accionClipero`).",
      "`red` tiene que estar en `campana.redes`.",
      'Poner el servidor `estado: "en-revision"`, `enviadoEn` con su reloj y `creador` y `userId` de la sesión.',
      "`vistas` y `vistasEn` salen de la lectura de la publicación (`publicacionId`), nunca de lo que mande el cliente: son lo que reparte el dinero. Un enlace pegado entra sin vistas y no suma al CPM.",
      "Un clip no entra dos veces en la misma campaña: se reconoce por `publicacionId` y, si vino por enlace, por `url` (`use-campanas.ts:326`). Comparar con TODOS los envíos de la campaña: hoy el navegador solo mira los que se hicieron en él (no los de la semilla) y descarta el repetido en silencio, con el aviso de éxito saliendo igual.",
      "El compromiso va en la misma transacción (`compromisoAlEntregar`): si había uno `aceptada`, pasa a `entregada` con `envioId`; en una campaña `abierta` sin compromiso nace uno ya `entregada`; en otro caso, ninguno. Son dos escrituras distintas: parchear uno que existe o crear uno nuevo.",
      "Los requisitos de la campaña los confirma la persona con una casilla: el servidor no puede comprobarlos, los revisa la agencia.",
    ],
    origen: "hooks/use-campanas.ts:322",
  },
  {
    id: "campanas.leer-vistas-envio",
    area: "campanas",
    metodo: "POST",
    ruta: "/envios/{id}/lectura",
    resumen:
      "Vuelve a leer las vistas de un clip entregado desde la instantánea de su publicación y las guarda en el envío.",
    descripcion:
      "Sustituye a `anotarVistas(id, vistas, leidoEn)`. Hoy el navegador lee con `leerVistas` (`POST /analiticas/metricas`, ya conectado) y escribe él la cifra en el envío. Con servidor, la escribe el servidor desde su instantánea: el cliente no puede decidir cuántas vistas tiene un clip que cobra por ellas.",
    estado: "por-construir",
    auth: "sesion",
    parametros: [
      {
        nombre: "id",
        tipo: "string",
        requerido: true,
        en: "ruta",
        descripcion: "Id del envío: `env_ana_02`.",
      },
    ],
    respuesta: {
      tipo: "Envio",
      definidoEn: "lib/campanas.ts:160",
      ejemplo: ENVIO_MEDIDO,
    },
    errores: [
      {
        codigo: "no-encontrado",
        http: 404,
        cuando: "El envío no existe o no es de la cuenta.",
        frase: "common.errors.no-encontrado",
        bloquea: true,
      },
      {
        codigo: "conflicto",
        http: 422,
        cuando: "No es medible: llegó pegando un enlace, sin `publicacionId`.",
        frase: "campaigns.submissions.sinMedir",
        bloquea: true,
      },
      {
        codigo: "conflicto",
        http: 409,
        cuando:
          "Su campaña está finalizada, vencida o agotada: las vistas están congeladas.",
        frase: "common.errors.conflicto",
        bloquea: true,
      },
      {
        codigo: "limite",
        http: 429,
        cuando: "La cuota de la plataforma no permite todavía una lectura nueva.",
        frase: "common.errors.limite",
        bloquea: false,
      },
    ],
    reglas: [
      "Solo envíos medibles (`medible`: con `publicacionId`).",
      "Congelar cuando la campaña está `finalizada`, `vencida` o `agotada` (`vistasCongeladas`): la última lectura es la que reparte. Sin esa regla, un refresco tardío dejaba sin presupuesto a quien ya había cobrado. Pausada o con inscripciones cerradas se sigue leyendo.",
      "Escribir `vistas` y `vistasEn` (el instante de la lectura) juntos: la tabla dice cuándo se leyó.",
      "Leer de la instantánea guardada por publicación, no de la red en cada petición: cada plataforma limita cuántas veces se le puede preguntar (`lib/api/analiticas.ts`).",
      "Solo la pide el dueño del envío.",
    ],
    origen: "hooks/use-campanas.ts:357",
  },

  /* ----------------------------------------------------------------------
     Participación: el compromiso entre el clipero y la campaña
     ---------------------------------------------------------------------- */
  {
    id: "campanas.listar-participaciones",
    area: "campanas",
    metodo: "GET",
    ruta: "/participaciones",
    resumen:
      "Los compromisos de la cuenta con campañas: lo solicitado, lo aceptado con su plazo y lo ya cerrado.",
    descripcion:
      "Sustituye a `[...participacionesSemilla, ...p.participaciones]` con `cambiosParticipacion`. Alimenta «Mis compromisos», el botón de cada campaña («Solicitud enviada», «Subir clip» con su cuenta atrás…) y Operaciones › Derechos.",
    estado: "por-construir",
    auth: "sesion",
    respuesta: {
      tipo: "Participacion[]",
      definidoEn: "lib/participacion.ts:99",
      ejemplo: [
        PAR_LIGA,
        {
          id: "par_dem_02",
          campanaId: "cmp_bingo",
          userId: "u_ana",
          clipero: "Ana Ruiz",
          estado: "cumplida",
          solicitadaEn: "2026-09-04T12:20:00.000Z",
          decididaEn: "2026-09-05T12:20:00.000Z",
          venceEn: "2026-09-12T12:20:00.000Z",
          envioId: "env_ana_01",
        },
      ],
    },
    reglas: [
      "A un clipero, solo las suyas y en todos los estados: «Mis compromisos» tiene «Activos» e «Historial». Las de sus campañas, a la agencia (lado de agencia).",
      "Una `aceptada` con `venceEn` pasado es `caducada` sin que nadie la toque (`estadoParticipacion`): el servidor puede escribirla así o dejar que el cliente la derive, pero nunca tratarla como viva al validar.",
      "Hoy Operaciones › Derechos saca sus campañas de TODAS las participaciones del almacén, no solo de las de la cuenta (`derechos-panel.tsx:82`); que el servidor devuelva solo las suyas lo corrige sin tocar la vista.",
      "El instante lo pone el servidor. En la demo es `HOY_CAMPANAS` (2026-09-13T12:20:00.000Z) para que servidor y navegador pinten los mismos días.",
    ],
    origen: "hooks/use-campanas.ts:286",
  },
  {
    id: "campanas.crear-participacion",
    area: "campanas",
    metodo: "POST",
    ruta: "/campanas/{id}/participaciones",
    resumen:
      "El clipero pide entrar en una campaña con solicitud; nace `solicitada` y decide la agencia.",
    descripcion:
      "Sustituye a `solicitarParticipacion`, que hoy escribe `solicitar(…)` en el almacén. Los códigos de error son los de `validarSolicitud`, los mismos que pinta el diálogo en `campaigns.participation.errors.<code>`: el servidor los devuelve en `{ code }`. Para que lleguen a la pantalla, `pedir` tendrá que leer ese cuerpo: hoy lo guarda solo para el registro (`lib/api/cliente.ts:71`).",
    estado: "por-construir",
    auth: "sesion",
    parametros: [PARAMETRO_CAMPANA],
    cuerpo: {
      tipo: "{ nota?: string }",
      campos: [
        {
          nombre: "nota",
          tipo: "string",
          requerido: false,
          descripcion:
            "Lo que quiera contar a quien decide. Hasta 280 caracteres (`NOTA_MAX`); vacía no se guarda.",
        },
      ],
      ejemplo: {
        nota: "Hago ediciones de baile en vertical, sin música con derechos encima.",
      },
    },
    respuesta: {
      tipo: "Participacion",
      definidoEn: "lib/participacion.ts:99",
      ejemplo: {
        id: "par_dem_03",
        campanaId: "cmp_anmi",
        userId: "u_bruno",
        clipero: "Bruno Salas",
        estado: "solicitada",
        solicitadaEn: "2026-09-12T12:20:00.000Z",
        nota: "Hago ediciones de baile en vertical, sin música con derechos encima.",
      },
    },
    errores: [
      {
        codigo: "yaDentro",
        http: 409,
        cuando:
          "Ya tiene en la campaña una participación viva (ni retirada ni rechazada).",
        frase: "campaigns.participation.errors.yaDentro",
        bloquea: true,
      },
      {
        codigo: "inscripcionesCerradas",
        http: 409,
        cuando: "La agencia cerró las inscripciones (`inscripcionesAbiertas: false`).",
        frase: "campaigns.participation.errors.inscripcionesCerradas",
        bloquea: true,
      },
      {
        codigo: "campanaVencida",
        http: 409,
        cuando: "Ya pasó el `fin` de la campaña.",
        frase: "campaigns.participation.errors.campanaVencida",
        bloquea: true,
      },
      {
        codigo: "sinPlazas",
        http: 409,
        cuando: "La campaña pone `plazas` y no queda ninguna libre.",
        frase: "campaigns.participation.errors.sinPlazas",
        bloquea: true,
      },
      {
        codigo: "notaLarga",
        http: 422,
        cuando: "La nota pasa de 280 caracteres (viaja `values.max = 280`).",
        frase: "campaigns.participation.errors.notaLarga",
        bloquea: true,
      },
      {
        codigo: "sinRedes",
        http: 422,
        cuando: "La cuenta no ha dicho en qué redes publica.",
        frase: "campaigns.participation.errors.sinRedes",
        bloquea: true,
      },
      {
        codigo: "sinPais",
        http: 422,
        cuando: "La cuenta no tiene país.",
        frase: "campaigns.participation.errors.sinPais",
        bloquea: true,
      },
      {
        codigo: "planInsuficiente",
        http: 403,
        cuando: "El plan no incluye participar en campañas (Prueba).",
        frase: "campaigns.participation.errors.planInsuficiente",
        bloquea: true,
      },
    ],
    reglas: [
      "Repetir `validarSolicitud` entera con el reloj del servidor y devolver todos sus códigos, con el del plan el último: primero lo que no se arregla pagando.",
      '`userId` y `clipero` salen de la sesión; `estado: "solicitada"` y `solicitadaEn` los pone el servidor.',
      "La nota se recorta a 280 caracteres y, vacía, no se guarda (`solicitar`).",
      "Plazas: ocupan plaza las participaciones `aceptada`, `entregada`, `cumplida` y `en-disputa` (`plazasLibres`). Sin `plazas`, no hay cupo. «Ámbar: Tra Tra Tra» pone 4.",
      "Pedir entrar es el consentimiento para enseñar a la agencia `perfilParaAgencia` y nada más: nombre, país, idiomas, redes con el TRAMO de seguidores, temas, experiencia, disponibilidad, historial dentro de Clipealo y la nota. Ni correo, ni wallet, ni a qué otras campañas se presenta.",
      "El spec pide registrar ese consentimiento con la finalidad `perfil-a-agencia` (docs/campanas-ciclo-2026-09.md:102); hoy no se registra en ningún sitio.",
      "Una campaña `abierta` no tiene solicitud: allí entregar es entrar (`POST /campanas/{id}/envios`).",
      "Quien creó la campaña no puede pedir entrar en ella.",
    ],
    origen: "hooks/use-campanas.ts:478",
  },
  {
    id: "campanas.retirar-participacion",
    area: "campanas",
    metodo: "POST",
    ruta: "/participaciones/{id}/retirar",
    resumen:
      "El clipero cancela su solicitud o se retira antes de entregar: libera la plaza sin penalización.",
    descripcion:
      "Sustituye a `retirarse(p)`, que escribe `retirar(p, HOY_CAMPANAS)`. Sirve para «Cancelar solicitud» y para «Retirarme»: las dos dejan la participación `retirada`.",
    estado: "por-construir",
    auth: "sesion",
    parametros: [PARAMETRO_PARTICIPACION],
    respuesta: {
      tipo: "Participacion",
      definidoEn: "lib/participacion.ts:99",
      ejemplo: {
        ...PAR_LIGA,
        estado: "retirada",
        decididaEn: "2026-09-13T12:20:00.000Z",
      },
    },
    errores: [
      {
        codigo: "no-autorizado",
        http: 403,
        cuando: "La participación no es de la cuenta.",
        frase: "common.errors.no-autorizado",
        bloquea: true,
      },
      {
        codigo: "conflicto",
        http: 409,
        cuando:
          "Ya no está `solicitada` ni `aceptada` con plazo: entregada, cumplida, caducada, en disputa…",
        frase: "common.errors.conflicto",
        bloquea: true,
      },
    ],
    reglas: [
      "Solo su dueño.",
      "Solo desde `solicitada` o desde `aceptada` con el plazo por delante, que es lo que ofrece «Mis compromisos» (`mis-compromisos.tsx:271`). Entregada ya no: su clip está en revisión.",
      "Sin penalización: libera la plaza al momento y se puede volver a solicitar (`participacionDe` no cuenta las retiradas).",
      "`decididaEn` con el reloj del servidor.",
    ],
    origen: "hooks/use-campanas.ts:517",
  },

  /* ----------------------------------------------------------------------
     Disputas
     ---------------------------------------------------------------------- */
  {
    id: "campanas.crear-disputa",
    area: "campanas",
    metodo: "POST",
    ruta: "/participaciones/{id}/disputas",
    resumen:
      "Abre una reclamación sobre un compromiso; desde ese momento decide el admin.",
    descripcion:
      "Sustituye a `abrirDisputa`, que escribe la disputa nueva y la participación en `en-disputa` (`abrirDisputa` de `lib/participacion.ts`). La usa el clipero desde «Mis compromisos»; la misma forma sirve a la agencia desde su campaña.",
    estado: "por-construir",
    auth: "sesion",
    parametros: [PARAMETRO_PARTICIPACION],
    cuerpo: {
      tipo: "{ motivo: MotivoDisputa; detalle?: string }",
      definidoEn: "lib/participacion.ts:75",
      campos: [
        {
          nombre: "motivo",
          tipo: '"no-entrego" | "no-revisa" | "rechazo-injusto" | "no-paga" | "contenido"',
          requerido: true,
          descripcion:
            "Uno de los que `disputasPosibles` permite ahora a quien reclama. El clipero: `no-revisa`, `rechazo-injusto`, `no-paga`.",
        },
        {
          nombre: "detalle",
          tipo: "string",
          requerido: false,
          descripcion:
            "Con sus palabras, hasta 280 caracteres. Lo leen el admin y la otra parte.",
        },
      ],
      ejemplo: {
        motivo: "rechazo-injusto",
        detalle: "Clipeo Arena Nova desde hace meses y me rechazan por tema.",
      },
    },
    respuesta: {
      tipo: "{ disputa: Disputa; participacion: Participacion }",
      definidoEn: "lib/participacion.ts:474",
      ejemplo: {
        disputa: {
          id: "dis_dem_02",
          participacionId: "par_dem_10",
          campanaId: "cmp_arena",
          abrePor: "clipero",
          motivo: "rechazo-injusto",
          detalle: "Clipeo Arena Nova desde hace meses y me rechazan por tema.",
          estado: "abierta",
          abiertaEn: "2026-09-11T12:20:00.000Z",
        },
        participacion: {
          id: "par_dem_10",
          campanaId: "cmp_arena",
          userId: "u_lucia",
          clipero: "Lucía Peña",
          estado: "en-disputa",
          solicitadaEn: "2026-09-09T12:20:00.000Z",
          decididaEn: "2026-09-10T12:20:00.000Z",
          motivo: "no-encaja-tema",
          disputaId: "dis_dem_02",
        },
      },
    },
    errores: [
      {
        codigo: "no-autorizado",
        http: 403,
        cuando:
          "Quien reclama no es parte: ni el clipero de la participación ni quien creó la campaña.",
        frase: "common.errors.no-autorizado",
        bloquea: true,
      },
      {
        codigo: "conflicto",
        http: 409,
        cuando: "Ya hay una reclamación abierta sobre este compromiso (`disputaId`).",
        frase: "compromisos.disputa.abierta",
        bloquea: true,
      },
      {
        codigo: "conflicto",
        http: 422,
        cuando: "El motivo no está entre los posibles ahora mismo (`disputasPosibles`).",
        frase: "compromisos.disputa.none",
        bloquea: true,
      },
    ],
    reglas: [
      "`abrePor` sale de la sesión, no del cuerpo: `clipero` si la participación es suya, `agencia` si la campaña es suya.",
      "El motivo tiene que estar en `disputasPosibles(p, envio, abrePor, ahora)`. Clipero: `no-revisa` con el clip entregado y, o sin plazo, o 3 días desde el fin del plazo o desde la solicitud (`DIAS_SIN_REVISAR` = 3; el código los llama hábiles pero `diasHasta` cuenta días naturales); `rechazo-injusto` con la solicitud rechazada; `no-paga` con su clip aprobado. Agencia: `no-entrego` con el compromiso caducado; `contenido` con el clip entregado o cumplido.",
      "Una sola por compromiso: con `disputaId` no se abre otra.",
      "La disputa nace `abierta` y la participación pasa a `en-disputa` con su `disputaId`, en la misma transacción. `abiertaEn` del reloj del servidor: es el criterio con el que el admin ordena su cola.",
      "Mientras esté abierta bloquea el cierre de la campaña (`bloqueaCierre`) y ocupa plaza; solo el laudo del admin la desbloquea.",
      "El diálogo promete que «el dinero en juego queda reservado» (y el spec, docs/campanas-ciclo-2026-09.md:194); `liquidar` hoy no reserva nada: reparte solo entre envíos aprobados. Lo tiene que hacer el servidor, o cambiar el aviso.",
      "`detalle` hasta 280 caracteres (el diálogo usa `NOTA_MAX`).",
    ],
    origen: "hooks/use-campanas.ts:550",
  },
]
