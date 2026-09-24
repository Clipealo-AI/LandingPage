import type { Endpoint, ErrorDoc } from "@/lib/wiki/tipos"

/**
 * Endpoints de «cuenta»: la cuenta de quien tiene la sesión (perfil del canal,
 * público, borrado de respuestas), sus avisos y sus redes conectadas. Los
 * consentimientos se escriben con `onboarding.consentir` y las respuestas con
 * `onboarding.responder`: son del área «onboarding» aunque Ajustes los use.
 *
 * Ninguno existe todavía en `lib/api/`: los tres almacenes que sustituyen
 * viven en el navegador (`clipealo-cuenta-v1`, `clipealo-avisos-v1`,
 * `clipealo-cuentas-v1`) y docs/costuras-backend.md:54 pide crear su archivo
 * en `lib/api/` y hacer que el hook lo llame. Las formas son las que ya usa el
 * front, para que la pantalla no cambie.
 *
 * Ojo con los errores de validación: `pedir()` convierte cualquier 422 en
 * `conflicto` y no enseña el cuerpo (lib/api/cliente.ts:72). Para que llegue
 * a la pantalla un código propio (`tooShort`, `redFueraDelPlan`…), la función
 * de `lib/api/` que se cree tendrá que leerlo del cuerpo.
 */

const SIN_SESION: ErrorDoc = {
  codigo: "no-autorizado",
  http: 401,
  cuando: "No hay sesión, o ha caducado.",
  frase: "common.errors.no-autorizado",
  bloquea: true,
}

/** La cuenta demo «Ana Ruiz» (`CUENTA_VACIA`, hooks/use-cuenta.ts:200), sin `eventos`. */
const PERFIL_ANA = {
  canal: "clipealo",
  avatarUrl: null,
  plataformas: ["youtube", "tiktok"],
  pais: "PE",
  zona: "America/Lima",
}

const PUBLICO_ANA = {
  temas: ["podcast", "negocios"],
  edades: ["18–24", "25–34"],
  idioma: "es",
  tono: "cercano",
  ocultarPalabrotas: false,
}

/** `metaDemo` (hooks/use-cuenta.ts:172): declarado al terminar la bienvenida. */
const META_DEMO = { fuente: "declarado", en: "2026-08-18T10:13:24.000Z" }

/** Las cuatro entradas del alta de la demo (hooks/use-cuenta.ts:174). */
const CONSENTIMIENTOS_ANA = [
  ["terminos", "auth.signup.accept"],
  ["privacidad", "auth.signup.accept"],
  ["mayor-edad", "auth.signup.adult.label"],
  ["estadisticas", "auth.signup.privacyNote"],
].map(([finalidad, textoId]) => ({
  finalidad,
  valor: true,
  version: "privacidad-2026-10-v1",
  locale: "es",
  origen: "registro",
  textoId,
  en: "2026-08-18T10:12:00.000Z",
}))

const CUENTA_ANA = {
  nombre: "Ana Ruiz",
  correo: "ana@estudio.co",
  tipo: "clipero",
  creadaEn: "2026-08-18T10:12:00.000Z",
  mayorDeEdad: true,
  verificado: false,
  pais: "PE",
  idiomas: ["es"],
  perfilCanal: PERFIL_ANA,
  publico: PUBLICO_ANA,
  clipero: {
    objetivo: "ambos",
    experiencia: "regular",
    verticales: ["podcast", "negocios"],
    juegos: [],
    subverticales: {},
    creadoresFan: [],
    plataformasQueVe: [],
    redes: ["youtube", "tiktok", "instagram"],
    cuentas: [],
    motivaciones: [],
    tolerancia: [],
    herramientas: [],
    comoNosConociste: { chips: [] },
  },
  creador: { plataformasDirecto: ["youtube", "tiktok"] },
  agencia: {},
  meta: {
    tipo: META_DEMO,
    mayorDeEdad: META_DEMO,
    pais: META_DEMO,
    idiomas: META_DEMO,
    "clipero.objetivo": META_DEMO,
    "clipero.experiencia": META_DEMO,
    "clipero.verticales": META_DEMO,
    "clipero.redes": META_DEMO,
    "creador.plataformasDirecto": META_DEMO,
  },
  onboarding: {
    version: 1,
    taxonomia: 1,
    flujo: "clipero",
    modo: "normal",
    estado: "completado",
    pasoActual: null,
    pasosVistos: ["objetivo", "nichos", "fandom", "redes", "basicos", "render"],
    pasosRespondidos: ["objetivo", "nichos", "redes", "basicos"],
    pasosSaltados: ["fandom"],
    msPorPaso: {
      objetivo: 9200,
      nichos: 21400,
      fandom: 6100,
      redes: 11800,
      basicos: 8900,
    },
    textoAcelerado: 0,
    animacionVista: true,
    iniciadoEn: "2026-08-18T10:12:00.000Z",
    completadoEn: "2026-08-18T10:13:24.000Z",
    pospuestoEn: null,
    pasoAbandono: null,
    celebrado: true,
    celebradoAprobacion: false,
  },
  consentimientos: CONSENTIMIENTOS_ANA,
  microPreguntas: { ultimaEn: null, pospuestas: {}, descartadas: [] },
  respuestasLibres: {},
  borradorCampana: null,
}

export const ENDPOINTS: Endpoint[] = [
  {
    id: "cuenta.leer",
    area: "cuenta",
    metodo: "GET",
    ruta: "/cuenta",
    resumen:
      "La cuenta de quien tiene la sesión: identidad, perfil del canal, público, respuestas de la bienvenida y registro de consentimientos.",
    descripcion:
      "Sustituye al almacén del navegador `clipealo-cuenta-v1` (hooks/use-cuenta.ts:125). Es la única fuente del nombre, el correo, el país y las respuestas: el menú de usuario, Ajustes › Perfil, Público y Tus datos, la campana y la bienvenida leen de aquí. Devuelve la forma de `Cuenta` tal cual, en una sola respuesta, porque `useCuenta` la lee entera; `onboarding.leer` (GET /onboarding) y `onboarding.leer-respuestas` (GET /cuenta/respuestas) dan sus partes por separado. El registro de eventos del funnel (`eventos`, que solo tiene `CuentaGuardada`) no hace falta: ninguna pantalla lo lee. Los consentimientos se escriben con `onboarding.consentir` (POST /cuenta/consentimientos), también desde Ajustes › Tus datos.",
    estado: "por-construir",
    auth: "sesion",
    respuesta: {
      tipo: "Cuenta",
      definidoEn: "lib/onboarding.ts:296",
      campos: [
        {
          nombre: "nombre",
          tipo: "string",
          requerido: true,
          descripcion: "Nombre de la persona. De él salen las iniciales del avatar.",
        },
        {
          nombre: "correo",
          tipo: "string",
          requerido: true,
          descripcion: "Se enseña bajo el nombre en el menú de usuario.",
        },
        {
          nombre: "tipo",
          tipo: '"clipero" | "agencia" | null',
          requerido: true,
          descripcion:
            "El que eligió al darse de alta o en la toma «Tu cuenta»; `null` hasta entonces. Con «agencia», Tus datos ofrece dos permisos más.",
        },
        {
          nombre: "creadaEn",
          tipo: "string | null",
          requerido: true,
          descripcion: "ISO del alta.",
        },
        {
          nombre: "mayorDeEdad",
          tipo: "boolean",
          requerido: true,
          descripcion: "18+ declarado en el alta o en la bienvenida.",
        },
        {
          nombre: "verificado",
          tipo: "boolean",
          requerido: true,
          descripcion:
            "Si la cuenta está verificada. Sin verificar no se le recomiendan las campañas que piden verificación (lib/recomendacion.ts:185). La demo, Ana, no lo está.",
        },
        {
          nombre: "pais",
          tipo: "PaisResidencia | null",
          requerido: true,
          descripcion:
            "El país de la cuenta; Ajustes › Perfil lo cambia junto con `perfilCanal.pais`.",
        },
        {
          nombre: "idiomas",
          tipo: "IdiomaAudiencia[]",
          requerido: true,
          descripcion: "Los idiomas que respondió en la toma «basicos».",
        },
        {
          nombre: "perfilCanal",
          tipo: "PerfilCanal",
          requerido: true,
          descripcion: "Lo que edita Ajustes › Perfil (lib/ajustes.ts:50).",
        },
        {
          nombre: "publico",
          tipo: "PublicoCanal",
          requerido: true,
          descripcion: "Lo que edita Ajustes › Público (lib/ajustes.ts:137).",
        },
        {
          nombre: "clipero",
          tipo: "Partial<RespuestasClipero>",
          requerido: true,
          descripcion:
            "Respuestas de la bienvenida del clipero. «Borrar mis respuestas» las vacía.",
        },
        {
          nombre: "creador",
          tipo: "Partial<RespuestasCreador>",
          requerido: true,
          descripcion:
            "Respuestas de quien clipea sus propios videos. También se vacían al borrar.",
        },
        {
          nombre: "agencia",
          tipo: "Partial<RespuestasAgencia>",
          requerido: true,
          descripcion: "Respuestas de la agencia. Borrar las respuestas NO las toca.",
        },
        {
          nombre: "meta",
          tipo: "Partial<Record<CampoId, MetaDato>>",
          requerido: true,
          descripcion: "Fuente (`declarado`…) y fecha de cada respuesta.",
        },
        {
          nombre: "onboarding",
          tipo: "ProgresoOnboarding",
          requerido: true,
          descripcion: "Progreso de «Tu primer corte»: qué tomas vio, respondió o saltó.",
        },
        {
          nombre: "consentimientos",
          tipo: "RegistroConsentimiento[]",
          requerido: true,
          descripcion:
            "El registro entero, en el orden en que se escribió: es lo que pinta el «Historial de consentimientos».",
        },
        {
          nombre: "microPreguntas",
          tipo: "MicroPreguntas",
          requerido: true,
          descripcion:
            "Cuándo se enseñó la última micropregunta, cuáles están pospuestas y hasta cuándo, y cuáles descartó.",
        },
        {
          nombre: "respuestasLibres",
          tipo: "Record<string, string[]>",
          requerido: true,
          descripcion: "Respuestas a las preguntas creadas desde el backoffice.",
        },
        {
          nombre: "borradorCampana",
          tipo: "Partial<BorradorCampana> | null",
          requerido: true,
          descripcion:
            "Lo que la agencia dejó en el simulador de la bienvenida: Crear campaña arranca con ello (components/campanas/campaign-form.tsx:127).",
        },
      ],
      ejemplo: CUENTA_ANA,
    },
    errores: [SIN_SESION],
    reglas: [
      "Devuelve la cuenta de la sesión y ninguna otra: no hay id en la ruta.",
      "Los consentimientos salen completos y en orden de escritura; la pantalla los invierte para enseñar el más reciente arriba (`historial`, lib/privacidad.ts:126).",
      "Lo guardado sale limpio contra los catálogos, como hace hoy `migrarCuenta` (hooks/use-cuenta.ts:473): nunca más de 3 temas en `publico`, una zona horaria que no exista vuelve a `America/Lima` y un id que no esté en su catálogo se descarta.",
      "`perfilCanal.avatarUrl` es una URL servida por Clipealo o `null`, nunca una `blob:` (hooks/use-cuenta.ts:393).",
      "Las cuentas conectadas no van aquí: viven en `cuenta.listar-redes` y la completitud las mira al calcular en vez de copiarlas (hooks/use-cuenta.ts:1097).",
    ],
    origen: "hooks/use-cuenta.ts:1093",
  },
  {
    id: "cuenta.guardar-perfil",
    area: "cuenta",
    metodo: "PUT",
    ruta: "/cuenta/perfil",
    resumen:
      "Guarda el perfil del canal: nombre (la marca de agua), foto, plataformas donde transmite, país y zona horaria.",
    descripcion:
      "Lo llama «Guardar cambios» de Ajustes › Perfil con el borrador entero. Sustituye a la transición `guardarPerfil` (hooks/use-cuenta.ts:876), que además copia el país a la cuenta cuando cambia.",
    estado: "por-construir",
    auth: "sesion",
    cuerpo: {
      tipo: "PerfilCanal",
      definidoEn: "lib/ajustes.ts:50",
      campos: [
        {
          nombre: "canal",
          tipo: "string",
          requerido: true,
          descripcion:
            "Sin la arroba. De 3 a 30 caracteres: letras sin tilde, números, punto y guion bajo.",
        },
        {
          nombre: "avatarUrl",
          tipo: "string | null",
          requerido: true,
          descripcion:
            "La URL que devolvió `cuenta.subir-avatar`, o `null` para enseñar las iniciales.",
        },
        {
          nombre: "plataformas",
          tipo: "PlataformaDirecto[]",
          requerido: true,
          descripcion:
            "Dónde transmite: twitch, youtube, kick, tiktok, facebook. No son las redes donde se publica.",
        },
        {
          nombre: "pais",
          tipo: "CountryCode",
          requerido: true,
          descripcion: "Uno de PE, MX, CO, CL, AR, ES, EC, BR o US.",
        },
        {
          nombre: "zona",
          tipo: "Zona",
          requerido: true,
          descripcion:
            "Zona horaria IANA con la que se programan y se leen las publicaciones del Calendario.",
        },
      ],
      ejemplo: {
        canal: "cortes.ana",
        avatarUrl: null,
        plataformas: ["youtube", "tiktok", "twitch"],
        pais: "PE",
        zona: "America/Lima",
      },
    },
    respuesta: {
      tipo: "PerfilCanal",
      definidoEn: "lib/ajustes.ts:50",
      ejemplo: {
        canal: "cortes.ana",
        avatarUrl: null,
        plataformas: ["youtube", "tiktok", "twitch"],
        pais: "PE",
        zona: "America/Lima",
      },
    },
    errores: [
      {
        codigo: "tooShort",
        http: 422,
        cuando:
          "El nombre del canal, sin espacios en los extremos, tiene menos de 3 caracteres. Viaja con `values: { min: 3 }`.",
        frase: "settings.profile.channel.errors.tooShort",
        bloquea: true,
      },
      {
        codigo: "tooLong",
        http: 422,
        cuando: "Tiene más de 30 caracteres. Viaja con `values: { max: 30 }`.",
        frase: "settings.profile.channel.errors.tooLong",
        bloquea: true,
      },
      {
        codigo: "invalidChars",
        http: 422,
        cuando: "Lleva algo que no sea letra sin tilde, número, punto o guion bajo.",
        frase: "settings.profile.channel.errors.invalidChars",
        bloquea: true,
      },
      SIN_SESION,
    ],
    reglas: [
      "Repetir `validarCanal` (lib/ajustes.ts:83) sobre el nombre sin espacios en los extremos: de 3 (`CANAL_MIN`) a 30 (`CANAL_MAX`) caracteres y solo `[a-zA-Z0-9._]`, así que una arroba es `invalidChars` (la pantalla ya la quita al escribir). El error va como `{ code, values }`, el mismo `ErrorCanal` del front (lib/ajustes.ts:78); con `pedir()` tal cual, ese 422 llegaría a la pantalla como `conflicto` (lib/api/cliente.ts:72).",
      "`plataformas` solo admite ids de `PLATAFORMAS_DIRECTO` (lib/ajustes.ts:33) y puede ir vacía.",
      '`pais` es uno de los 9 de `COUNTRY_CODES` (lib/countries.ts:9). Si cambia, se escribe también `Cuenta.pais` y `meta.pais = { fuente: "declarado", en }` con la hora del servidor: es el mismo dato que la toma «basicos» de la bienvenida (hooks/use-cuenta.ts:876).',
      "`zona` tiene que ser una zona IANA que exista (`zonaValida`, hooks/use-cuenta.ts:404). Es de la cuenta y no del navegador: si alguien abre la agenda desde otro país, las horas siguen siendo las de su zona (lib/ajustes.ts:59).",
      "`avatarUrl` es `null` o una URL que haya dado `cuenta.subir-avatar`; nunca una `blob:`.",
      "El nombre del canal es la marca de agua de cada clip y el render tiene que leerlo de aquí: `createJob` no lo envía (lib/api/jobs.ts:139).",
    ],
    origen: "hooks/use-cuenta.ts:876",
  },
  {
    id: "cuenta.subir-avatar",
    area: "cuenta",
    metodo: "POST",
    ruta: "/cuenta/avatar",
    resumen:
      "Sube la foto del canal y devuelve la URL con la que se guarda en el perfil.",
    descripcion:
      "Hoy la foto elegida es una URL `blob:` que solo vive en esa pestaña: al recargar, `migrarPerfil` la descarta y vuelven las iniciales (hooks/use-cuenta.ts:392). Con servidor, la foto se sube al elegirla y la URL que vuelve entra en el borrador del perfil; pasa a ser la del canal con «Guardar cambios» (`cuenta.guardar-perfil`). Va como `multipart/form-data`: `pedir()` serializa siempre el cuerpo como JSON (lib/api/cliente.ts:63), así que esta llamada necesita su propia función en `lib/api/`.",
    estado: "por-construir",
    auth: "sesion",
    cuerpo: {
      tipo: "File",
      campos: [
        {
          nombre: "archivo",
          tipo: "File",
          requerido: true,
          descripcion:
            "PNG, JPG o WebP de hasta 5 MB (`AVATAR_TIPOS`, `AVATAR_MAX_BYTES`).",
        },
      ],
    },
    respuesta: {
      tipo: 'Pick<PerfilCanal, "avatarUrl">',
      definidoEn: "lib/ajustes.ts:50",
      campos: [
        {
          nombre: "avatarUrl",
          tipo: "string",
          requerido: true,
          descripcion:
            "Dónde queda la foto. Es lo que se manda después en `cuenta.guardar-perfil`.",
        },
      ],
      ejemplo: { avatarUrl: "https://clipealo.com/avatares/u_ana.webp" },
    },
    errores: [
      {
        codigo: "invalid",
        http: 422,
        cuando: "El archivo no es `image/png`, `image/jpeg` ni `image/webp`.",
        frase: "settings.profile.photo.invalid.title",
        bloquea: true,
      },
      {
        codigo: "tooBig",
        http: 422,
        cuando: "Pesa más de 5 MB (5 × 1024 × 1024 = 5.242.880 bytes).",
        frase: "settings.profile.photo.tooBig.title",
        bloquea: true,
      },
      SIN_SESION,
    ],
    reglas: [
      "Repetir las dos comprobaciones del front (components/app/profile-settings.tsx:164 y :170): tipo `image/png`, `image/jpeg` o `image/webp` (`AVATAR_TIPOS`, lib/ajustes.ts:91) y como mucho `AVATAR_MAX_BYTES` = 5 MB (lib/ajustes.ts:92).",
      "Comprobar el tipo por el contenido del archivo, no por el que declara el navegador.",
      "Subir no cambia el perfil: si la persona pulsa «Descartar», la foto nunca llega a `perfilCanal.avatarUrl`.",
    ],
    origen: "components/app/profile-settings.tsx:160",
  },
  {
    id: "cuenta.guardar-publico",
    area: "cuenta",
    metodo: "PUT",
    ruta: "/cuenta/publico",
    resumen:
      "Guarda a quién le habla el canal: temas, edades, idioma de la audiencia, tono de los títulos y si se tapan las palabrotas.",
    descripcion:
      "Lo llama «Guardar cambios» de Ajustes › Público con el borrador entero. Sustituye a la transición `guardarPublico` (hooks/use-cuenta.ts:888).",
    estado: "por-construir",
    auth: "sesion",
    cuerpo: {
      tipo: "PublicoCanal",
      definidoEn: "lib/ajustes.ts:137",
      campos: [
        {
          nombre: "temas",
          tipo: "Tema[]",
          requerido: true,
          descripcion:
            "Hasta 3 de: gaming, podcast, educacion, humor, deportes, musica, negocios, tecnologia, estilo, actualidad.",
        },
        {
          nombre: "edades",
          tipo: "Edad[]",
          requerido: true,
          descripcion:
            "Rangos «13–17», «18–24», «25–34», «35–44» y «45+» (con raya, no guion).",
        },
        {
          nombre: "idioma",
          tipo: "IdiomaAudiencia",
          requerido: true,
          descripcion:
            "Idioma de títulos, descripciones y hashtags: es, en, pt, fr, it, de, ca, eu o gl.",
        },
        {
          nombre: "tono",
          tipo: '"cercano" | "divertido" | "profesional" | "directo"',
          requerido: true,
          descripcion: "Tono de los títulos que escribe la IA.",
        },
        {
          nombre: "ocultarPalabrotas",
          tipo: "boolean",
          requerido: true,
          descripcion:
            "Tapa las palabrotas con asteriscos en los subtítulos; el audio no cambia.",
        },
      ],
      ejemplo: {
        temas: ["podcast", "negocios", "educacion"],
        edades: ["18–24", "25–34"],
        idioma: "es",
        tono: "directo",
        ocultarPalabrotas: true,
      },
    },
    respuesta: {
      tipo: "PublicoCanal",
      definidoEn: "lib/ajustes.ts:137",
      ejemplo: {
        temas: ["podcast", "negocios", "educacion"],
        edades: ["18–24", "25–34"],
        idioma: "es",
        tono: "directo",
        ocultarPalabrotas: true,
      },
    },
    errores: [
      {
        codigo: "conflicto",
        http: 422,
        cuando:
          "Más de 3 temas o un valor que no está en su catálogo. La pantalla no deja llegar a esto.",
        frase: "common.errors.conflicto",
        bloquea: true,
      },
      SIN_SESION,
    ],
    reglas: [
      "`temas` ⊂ `TEMAS` (lib/ajustes.ts:98), como mucho `TEMAS_MAX` = 3 (lib/ajustes.ts:111). El front recorta con `slice` y apaga el resto al llegar a 3 (components/app/audience-settings.tsx:123 y :134), pero el servidor no se fía.",
      "`edades` ⊂ `EDADES` (lib/ajustes.ts:113); `idioma` ∈ los 9 de `IDIOMAS_AUDIENCIA` (lib/ajustes.ts:121); `tono` ∈ `TONOS` (lib/ajustes.ts:134).",
      "Se aplica a los próximos videos que se suban: es lo que promete la pantalla al guardar (`settings.audience.saved.description`).",
      "El render tiene que leerlo de la cuenta: `createJob` no lo envía al crear el trabajo (lib/api/jobs.ts:139).",
    ],
    origen: "hooks/use-cuenta.ts:888",
  },
  {
    id: "cuenta.leer-avisos",
    area: "cuenta",
    metodo: "GET",
    ruta: "/cuenta/avisos",
    resumen: "Qué avisos quiere recibir la cuenta y por dónde (correo o en la app).",
    descripcion:
      "Sustituye al almacén `clipealo-avisos-v1` (lib/ajustes.ts:189). Es el contrato que tendrá que respetar quien mande los avisos cuando exista el correo o el push (docs/costuras-backend.md:154).",
    estado: "por-construir",
    auth: "sesion",
    respuesta: {
      tipo: "PreferenciasAviso",
      definidoEn: "lib/ajustes.ts:187",
      campos: [
        {
          nombre: "<tipo de aviso>",
          tipo: "Record<CanalAviso, boolean>",
          requerido: true,
          descripcion:
            "Una entrada por cada uno de los 7 tipos (`clips-listos`, `errores`, `publicaciones`, `minutos`, `resumen`, `pagos`, `novedades`) con `correo` y `app`.",
        },
      ],
      ejemplo: {
        "clips-listos": { correo: true, app: true },
        errores: { correo: true, app: true },
        publicaciones: { correo: false, app: true },
        minutos: { correo: true, app: true },
        resumen: { correo: true, app: false },
        pagos: { correo: true, app: false },
        novedades: { correo: false, app: false },
      },
    },
    errores: [SIN_SESION],
    reglas: [
      "Una cuenta nueva trae lo que declara cada tipo (`avisosPorDefecto`, lib/ajustes.ts:192).",
      "Siempre salen los 7 tipos: uno que ya no exista se descarta y uno nuevo entra con su valor por defecto, para que añadir un aviso al catálogo no deje a nadie sin poder elegirlo (`migrarAvisos`, lib/ajustes.ts:200).",
    ],
    origen: "hooks/use-avisos.ts:77",
  },
  {
    id: "cuenta.cambiar-aviso",
    area: "cuenta",
    metodo: "PATCH",
    ruta: "/cuenta/avisos",
    resumen: "Enciende o apaga un aviso en un canal y devuelve las preferencias enteras.",
    descripcion:
      "Cada interruptor de Ajustes › Notificaciones manda solo lo que cambia: los tres argumentos de `cambiar(tipo, canal, valor)` (hooks/use-avisos.ts:80). No hay botón de guardar.",
    estado: "por-construir",
    auth: "sesion",
    cuerpo: {
      tipo: "{ tipo: string; canal: CanalAviso; valor: boolean }",
      definidoEn: "hooks/use-avisos.ts:80",
      campos: [
        {
          nombre: "tipo",
          tipo: "string",
          requerido: true,
          descripcion:
            "Un id de `TIPOS_AVISO` (`TipoAvisoId`): `clips-listos`, `errores`, `publicaciones`, `minutos`, `resumen`, `pagos` o `novedades`.",
        },
        {
          nombre: "canal",
          tipo: '"correo" | "app"',
          requerido: true,
          descripcion: "El canal del interruptor.",
        },
        {
          nombre: "valor",
          tipo: "boolean",
          requerido: true,
          descripcion: "Encendido o apagado.",
        },
      ],
      ejemplo: { tipo: "resumen", canal: "app", valor: true },
    },
    respuesta: {
      tipo: "PreferenciasAviso",
      definidoEn: "lib/ajustes.ts:187",
      ejemplo: {
        "clips-listos": { correo: true, app: true },
        errores: { correo: true, app: true },
        publicaciones: { correo: false, app: true },
        minutos: { correo: true, app: true },
        resumen: { correo: true, app: true },
        pagos: { correo: true, app: false },
        novedades: { correo: false, app: false },
      },
    },
    errores: [
      {
        codigo: "conflicto",
        http: 422,
        cuando:
          "Un tipo que no está en `TIPOS_AVISO`, un canal que no es `correo` ni `app`, o un valor que no es booleano.",
        frase: "common.errors.conflicto",
        bloquea: true,
      },
      SIN_SESION,
    ],
    reglas: [
      "Cambiar solo ese interruptor: el resto de las preferencias se queda como estaba.",
      "Tipos de `TIPOS_AVISO` (lib/ajustes.ts:176) y canales de `CANALES_AVISO` (lib/ajustes.ts:157).",
      "El aviso «novedades» por correo y el permiso `novedades-correo` de Tus datos son dos datos distintos que hoy no se sincronizan (lib/ajustes.ts:183, lib/privacidad.ts:22).",
    ],
    origen: "hooks/use-avisos.ts:79",
  },
  {
    id: "cuenta.borrar-respuestas",
    area: "cuenta",
    metodo: "DELETE",
    ruta: "/cuenta/respuestas",
    resumen:
      "Vacía las respuestas de la bienvenida (clipero y creador) y devuelve la cuenta como queda.",
    descripcion:
      "Lo llama «Borrar respuestas» en el diálogo de Ajustes › Tus datos. Sustituye a la transición `borrarRespuestas` (hooks/use-cuenta.ts:898).",
    estado: "por-construir",
    auth: "sesion",
    respuesta: {
      tipo: "Cuenta",
      definidoEn: "lib/onboarding.ts:296",
      ejemplo: {
        ...CUENTA_ANA,
        clipero: {},
        creador: {},
        meta: {
          tipo: META_DEMO,
          mayorDeEdad: META_DEMO,
          pais: META_DEMO,
          idiomas: META_DEMO,
        },
      },
    },
    errores: [SIN_SESION],
    reglas: [
      "Vaciar `clipero`, `creador` y sus entradas de `meta` (las que empiezan por `clipero.` o `creador.`) (hooks/use-cuenta.ts:898).",
      "Conservar la cuenta (nombre, correo, tipo), el país, los idiomas, `agencia`, `perfilCanal`, `publico`, el progreso de la bienvenida y el registro de consentimientos entero (`settings.datos.borrar.confirmDescription`).",
      "Hoy tampoco toca `respuestasLibres` (las preguntas creadas desde el backoffice) ni `microPreguntas`, aunque la pantalla promete vaciar «lo que nos contaste en la bienvenida y después» (`settings.datos.borrar.description`): hay que decidir si entran.",
    ],
    origen: "hooks/use-cuenta.ts:898",
  },
  {
    id: "cuenta.listar-redes",
    area: "cuenta",
    metodo: "GET",
    ruta: "/cuentas-sociales",
    resumen:
      "Las cuentas de redes sociales de quien mira, con su estado y de qué cara son (clipero o agencia).",
    descripcion:
      "Sustituye al almacén `clipealo-cuentas-v1` (hooks/use-cuentas-sociales.ts:27), que hoy guarda solo qué semillas se desconectaron y qué cuentas se añadieron. Lo leen Ajustes › Cuentas conectadas, el Calendario (a qué cuenta programa), la campana y la completitud del perfil.",
    estado: "por-construir",
    auth: "sesion",
    respuesta: {
      tipo: "SocialAccount[]",
      definidoEn: "lib/social.ts:109",
      campos: [
        {
          nombre: "id",
          tipo: "string",
          requerido: true,
          descripcion:
            "Identifica la cuenta, no la red: puede haber varias de la misma red.",
        },
        {
          nombre: "network",
          tipo: "SocialId",
          requerido: true,
          descripcion: "tiktok, instagram, youtube, x, linkedin o facebook.",
        },
        {
          nombre: "handle",
          tipo: "string",
          requerido: false,
          descripcion: "Sin él, la cuenta se considera no conectada.",
        },
        {
          nombre: "followers",
          tipo: "number",
          requerido: false,
          descripcion: "Seguidores medidos. Puntúan en la completitud del perfil.",
        },
        {
          nombre: "connectedAt",
          tipo: "string",
          requerido: false,
          descripcion: "ISO. Se pinta «Desde el …» y ordena el cupo al bajar de plan.",
        },
        {
          nombre: "estado",
          tipo: '"conectada" | "caducada" | "revocada"',
          requerido: false,
          descripcion: "Sin valor, `conectada`.",
        },
        {
          nombre: "dueno",
          tipo: '"clipero" | "agencia"',
          requerido: false,
          descripcion: "Sin valor, `clipero`. El cupo del plan se cuenta por dueño.",
        },
      ],
      ejemplo: [
        {
          id: "cta_tk_clipealo",
          network: "tiktok",
          handle: "@clipealo",
          followers: 48200,
          connectedAt: "2026-07-14T10:00:00.000Z",
          estado: "conectada",
          dueno: "clipero",
        },
        {
          id: "cta_tk_ana",
          network: "tiktok",
          handle: "@cortes.ana",
          followers: 6100,
          connectedAt: "2026-08-21T18:00:00.000Z",
          estado: "conectada",
          dueno: "clipero",
        },
        {
          id: "cta_yt_clipealo",
          network: "youtube",
          handle: "@clipealo",
          followers: 12400,
          connectedAt: "2026-08-02T09:30:00.000Z",
          estado: "conectada",
          dueno: "clipero",
        },
        {
          id: "cta_ig_nebula",
          network: "instagram",
          handle: "@nebula.studio",
          followers: 31500,
          connectedAt: "2026-06-30T12:00:00.000Z",
          estado: "conectada",
          dueno: "agencia",
        },
        {
          id: "cta_li_nebula",
          network: "linkedin",
          handle: "@agencia-nebula",
          followers: 4800,
          connectedAt: "2026-07-02T08:00:00.000Z",
          estado: "conectada",
          dueno: "agencia",
        },
      ],
    },
    errores: [SIN_SESION],
    reglas: [
      "Devolver también las caducadas y las revocadas, con su `estado`: el calendario tiene que distinguir «esta cuenta ya no está» de «nunca la conectaste» (lib/social.ts:97).",
      "Solo los campos de `SocialAccount`: nada del OAuth (tokens, permisos) viaja al navegador.",
      "Una cuenta solo es activa con `handle` y estado `conectada` (`cuentaActiva`, lib/social.ts:133); el servidor usa la misma regla para el cupo y para publicar.",
    ],
    origen: "hooks/use-cuentas-sociales.ts:90",
  },
  {
    id: "cuenta.conectar-red",
    area: "cuenta",
    metodo: "POST",
    ruta: "/cuentas-sociales/{red}/conectar",
    resumen:
      "Conecta la cuenta de una red con permiso para publicar y devuelve las cuentas de esa red que quedan conectadas.",
    descripcion:
      "Hoy conectar es un apunte local, sin OAuth (docs/costuras-backend.md:61): pulsar una red devuelve sus cuentas semilla y, si no tenía ninguna, crea `cta_<red>_1` con «@clipealo» y 0 seguidores (components/app/social-accounts.tsx:83). Con servidor, este endpoint cierra el OAuth de la red; el salto a la red y la vuelta todavía no tienen forma en el front.",
    estado: "por-construir",
    auth: "sesion",
    parametros: [
      {
        nombre: "red",
        tipo: "SocialId",
        requerido: true,
        en: "ruta",
        descripcion: "tiktok, instagram, youtube, x, linkedin o facebook.",
      },
    ],
    respuesta: {
      tipo: "SocialAccount[]",
      definidoEn: "lib/social.ts:109",
      ejemplo: [
        {
          id: "cta_tk_clipealo",
          network: "tiktok",
          handle: "@clipealo",
          followers: 48200,
          connectedAt: "2026-07-14T10:00:00.000Z",
          estado: "conectada",
          dueno: "clipero",
        },
        {
          id: "cta_tk_ana",
          network: "tiktok",
          handle: "@cortes.ana",
          followers: 6100,
          connectedAt: "2026-08-21T18:00:00.000Z",
          estado: "conectada",
          dueno: "clipero",
        },
      ],
    },
    errores: [
      {
        codigo: "redFueraDelPlan",
        http: 422,
        cuando:
          "La red no está entre las del escalón del plan (en Prueba, todo lo que no sea TikTok).",
        frase: "settings.accounts.fueraDelPlan",
        bloquea: true,
      },
      {
        codigo: "cuentasAgotadas",
        http: 422,
        cuando:
          "Quien conecta ya tiene tantas cuentas activas como admite su plan. Viaja con `values: { max }`.",
        frase: "settings.accounts.sinCupo",
        bloquea: true,
      },
      SIN_SESION,
    ],
    reglas: [
      "Repetir `validarConexion` (lib/planes.ts:563): la red tiene que estar en `NETWORKS_BY_PLAN` del escalón (Prueba solo TikTok; Creador y Empresa, las seis; lib/pricing.ts:515) y las cuentas activas de quien conecta tienen que ser menos que `plan.cuentas` (1, 6 y 20 en los tres escalones, `CUENTAS_POR_PLAN`, lib/pricing.ts:152; el catálogo de planes del backoffice puede cambiarlo). Lo que valida el navegador es cortesía, no seguridad (docs/costuras-backend.md:117).",
      "Comprobar el cupo cuenta a cuenta: hoy reconectar TikTok devuelve de golpe sus dos cuentas semilla (components/app/social-accounts.tsx:84) y el front solo mira que quede sitio para una, así que puede pasarse del plan.",
      "Con `pedir()` tal cual, el 422 llega a la pantalla como `conflicto` (lib/api/cliente.ts:72): para enseñar `fueraDelPlan` o `sinCupo`, la función de `lib/api/` tiene que leer el `code` del cuerpo.",
      "El cupo se cuenta por dueño: las cuentas de la agencia no gastan las del clipero (components/app/social-accounts.tsx:57).",
      "El permiso que se pide a la red tiene que incluir publicar, no solo leer seguidores: Clipealo publica en esas cuentas (docs/costuras-backend.md:111).",
      "Volver a conectar una cuenta que ya existió devuelve la misma, con su `id`, sin duplicarla (hooks/use-cuentas-sociales.ts:107): lo programado en ella deja de estar «Sin cuenta».",
      '`connectedAt` y `estado: "conectada"` los pone el servidor.',
    ],
    origen: "hooks/use-cuentas-sociales.ts:107",
  },
  {
    id: "cuenta.desconectar-red",
    area: "cuenta",
    metodo: "DELETE",
    ruta: "/cuentas-sociales/{id}",
    resumen: "Desconecta una cuenta de red social.",
    descripcion:
      "La tarjeta de Ajustes › Cuentas conectadas desconecta la RED: llama a esto una vez por cada cuenta activa de esa red (components/app/social-accounts.tsx:72).",
    estado: "por-construir",
    auth: "sesion",
    parametros: [
      {
        nombre: "id",
        tipo: "string",
        requerido: true,
        en: "ruta",
        descripcion: "El id de la cuenta (`cta_tk_ana`), no el de la red.",
      },
    ],
    respuesta: {
      tipo: "void",
      campos: [],
      ejemplo: null,
    },
    errores: [
      {
        codigo: "no-encontrado",
        http: 404,
        cuando: "La cuenta no existe o no es de quien la desconecta.",
        frase: "common.errors.no-encontrado",
        bloquea: false,
      },
      SIN_SESION,
    ],
    reglas: [
      "Desconectar nunca pasa por el plan: quien baja de plan elige así qué cuentas conserva (lib/planes.ts:596).",
      "No borra lo publicado. Lo programado en esa cuenta no se cancela ni se reasigna: queda «Sin cuenta» hasta que se vuelva a conectar (`settings.accounts.disconnected.description`, lib/agenda.ts:269).",
      "Responder 204 sin cuerpo: `pedir()` devuelve `undefined` en un 204 (lib/api/cliente.ts:75).",
    ],
    origen: "hooks/use-cuentas-sociales.ts:118",
  },
]
