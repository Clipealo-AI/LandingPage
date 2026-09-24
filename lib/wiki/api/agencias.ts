import type { Campo, Endpoint } from "@/lib/wiki/tipos"

/**
 * Endpoints de «agencias»: lo que el servidor tiene que dar para el lado de
 * quien paga. Ninguno existe todavía en `lib/api/`: hoy todo vive en el
 * almacén `clipealo-campanas-v1` (`hooks/use-campanas.ts`) y en la cuenta
 * (`clipealo-cuenta-v1`, `hooks/use-cuenta.ts`).
 *
 * Criterio de rutas: `/agencia/...` es lo que la agencia ve de SUS campañas
 * (el hook lo mezcla en las mismas listas que ya usa: `envios` y
 * `participaciones`); las mutaciones van sobre el
 * recurso (`/campanas/{id}`, `/participaciones/{id}`, `/envios/{id}`), como
 * `/jobs/{id}/retry` y `/publicaciones/{id}/enviar`.
 */

/* ---------------------------------------------------------------------------
   Ejemplos, con las semillas de la demo («hoy» = 2026-09-13T12:20:00.000Z)
   --------------------------------------------------------------------------- */

/** Lo que manda el onboarding de agencia de Ana Ruiz por «Ámbar». */
const SOLICITUD_ANA = {
  tipoOrganizacion: "artista",
  organizacion: "Ámbar",
  web: "https://open.spotify.com/track/tra-tra-tra",
  dominioCoincide: false,
  rol: "manager",
  pais: "PE",
  sector: "musica",
  verticalesMaterial: ["musica"],
  creadorId: "cre_ambar",
  redesObjetivo: ["tiktok"],
  paisesObjetivo: ["PE"],
  idiomasObjetivo: ["es"],
  nombre: "Ana Ruiz",
  correo: "ana@estudio.co",
  tramoPresupuesto: "500-2k",
  enviadaEn: "2026-09-13T12:20:00.000Z",
}

/** `borradorDeSolicitud` de esa solicitud con el simulador en sus valores de partida. */
const BORRADOR_AMBAR = {
  presupuesto: 500,
  cpm: 0.65,
  topePorVideoPct: 10,
  minimoVistas: 1000,
  marca: "Ámbar",
  categoria: "musica",
  redes: ["tiktok"],
  vertical: "musica",
  sector: "musica",
  paisesObjetivo: ["PE"],
  idiomas: ["es"],
  creadorId: "cre_ambar",
}

/** Una campaña como la publica el formulario (reglas de «Ámbar: Tra Tra Tra»). */
const CAMPANA_NUEVA = {
  id: "cmp_mfhq2x7k3a",
  titulo: "Ámbar: Tra Tra Tra",
  marca: "Ámbar",
  descripcion:
    "El baile de «Tra Tra Tra» en tu versión. Cuanto más original, más lejos llega.",
  categoria: "musica",
  creadaPor: { perfil: "agencia", nombre: "Ana Ruiz (agencia)", userId: "u_ana" },
  estado: "activa",
  destacada: false,
  privada: false,
  presupuesto: 500,
  cpm: 0.5,
  topePorVideoPct: 5,
  minimoVistas: 1000,
  redes: ["tiktok"],
  material: "https://open.spotify.com/track/tra-tra-tra",
  requisitos: ["Audio oficial", "Hashtag #TraTraTra"],
  inicio: "2026-09-15T00:00:00.000Z",
  fin: "2026-10-15T23:59:00.000Z",
  creadaEn: "2026-09-13T12:20:00.000Z",
  licencia: { alcance: "campana", listaBlanca: false },
  vertical: "musica",
  sector: "musica",
  paisesObjetivo: ["PE"],
  idiomas: ["es"],
  creadorId: "cre_ambar",
}

/** La campaña de la cuenta demo tal como está en las semillas. */
const AMBAR = {
  id: "cmp_anmi",
  titulo: "Ámbar: Tra Tra Tra",
  marca: "Ámbar",
  descripcion:
    "El baile de «Tra Tra Tra» en tu versión. Cuanto más original, más lejos llega.",
  categoria: "musica",
  creadaPor: { perfil: "agencia", nombre: "Ana Ruiz", userId: "u_ana" },
  plazas: 4,
  estado: "activa",
  destacada: false,
  privada: false,
  presupuesto: 500,
  cpm: 0.5,
  topePorVideoPct: 5,
  minimoVistas: 1000,
  redes: ["tiktok"],
  material: "https://open.spotify.com/track/tra-tra-tra",
  requisitos: ["Audio oficial", "Hashtag #TraTraTra"],
  inicio: "2026-09-08T00:00:00.000Z",
  fin: "2026-10-08T23:59:00.000Z",
  creadaEn: "2026-09-07T20:00:00.000Z",
  vertical: "musica",
  sector: "musica",
  creadorId: "cre_ambar",
}

/** El clip de Nora Vidal que nadie ha revisado en «Ámbar». */
const ENVIO_NORA = {
  id: "env_nora_01",
  campanaId: "cmp_anmi",
  creador: "Nora Vidal",
  userId: "u_nora",
  titulo: "El paso del Tra Tra Tra, pero en cámara lenta",
  red: "tiktok",
  url: "https://www.tiktok.com/@noravidal/video/7311",
  vistas: 22_600,
  estado: "en-revision",
  enviadoEn: "2026-09-12T13:00:00.000Z",
}

/** Bruno Salas pide entrar en «Ámbar» (`par_dem_03`). */
const PAR_BRUNO = {
  id: "par_dem_03",
  campanaId: "cmp_anmi",
  userId: "u_bruno",
  clipero: "Bruno Salas",
  estado: "solicitada",
  solicitadaEn: "2026-09-12T12:20:00.000Z",
  nota: "Hago ediciones de baile en vertical, sin música con derechos encima.",
}

/** Kai Moreno, aceptado y con plazo hasta el 16 (`par_dem_05`). */
const PAR_KAI = {
  id: "par_dem_05",
  campanaId: "cmp_anmi",
  userId: "u_kai",
  clipero: "Kai Moreno",
  estado: "aceptada",
  solicitadaEn: "2026-09-08T12:20:00.000Z",
  decididaEn: "2026-09-09T12:20:00.000Z",
  venceEn: "2026-09-16T12:20:00.000Z",
}

/** Nora Vidal, con el clip entregado sin revisar (`par_dem_06`). */
const PAR_NORA = {
  id: "par_dem_06",
  campanaId: "cmp_anmi",
  userId: "u_nora",
  clipero: "Nora Vidal",
  estado: "entregada",
  solicitadaEn: "2026-09-04T12:20:00.000Z",
  decididaEn: "2026-09-05T12:20:00.000Z",
  venceEn: "2026-09-12T12:20:00.000Z",
  envioId: "env_nora_01",
}

const ID_CAMPANA: Campo = {
  nombre: "id",
  tipo: "string",
  requerido: true,
  en: "ruta",
  descripcion: "Id de la campaña (`cmp_anmi`). Tiene que ser de quien llama.",
}

const ID_PARTICIPACION: Campo = {
  nombre: "id",
  tipo: "string",
  requerido: true,
  en: "ruta",
  descripcion:
    "Id de la participación (`par_dem_03`). Su campaña tiene que ser de quien llama.",
}

export const ENDPOINTS: Endpoint[] = [
  /* -------------------------------------------------------------------------
     El perfil de agencia
     ------------------------------------------------------------------------- */
  {
    id: "agencias.solicitar-perfil",
    area: "agencias",
    metodo: "POST",
    ruta: "/agencia/solicitud",
    resumen: "Envía (o reenvía) la solicitud del perfil de agencia a la cola del equipo.",
    descripcion:
      "Sustituye a `useCampanas().solicitarAgencia(datos)`, que pone la solicitud en `pendiente`, guarda lo que verá la cola de /admin/campanas y registra el evento `solicitud_agencia`. Lo llaman «Enviar solicitud» y «Volver a enviar» del render de agencia de la bienvenida.",
    estado: "por-construir",
    auth: "sesion",
    cuerpo: {
      tipo: "SolicitudAgenciaDatos",
      definidoEn: "lib/onboarding.ts:330",
      campos: [
        {
          nombre: "tipoOrganizacion",
          tipo: "TipoOrganizacion",
          requerido: true,
          descripcion: "Uno de los 13 de `TIPOS_ORGANIZACION` (lib/taxonomia.ts:352).",
        },
        {
          nombre: "organizacion",
          tipo: "string",
          requerido: true,
          descripcion: "Nombre como lo verán los cliperos, de 2 a 60 caracteres.",
        },
        {
          nombre: "web",
          tipo: "string",
          requerido: true,
          descripcion: "Web o red oficial.",
        },
        {
          nombre: "dominioCoincide",
          tipo: "boolean",
          requerido: true,
          descripcion: "Si el dominio del correo coincide con la web.",
        },
        {
          nombre: "rol",
          tipo: '"fundador" | "marketing" | "manager" | "creador" | "otro"',
          requerido: false,
          descripcion: "Quién escribe, si lo dijo.",
        },
        {
          nombre: "pais",
          tipo: "PaisResidencia",
          requerido: true,
          descripcion: "País de la organización.",
        },
        {
          nombre: "sector",
          tipo: "Sector",
          requerido: true,
          descripcion: "Uno de los 20 de `SECTORES`; 6 son regulados.",
        },
        {
          nombre: "verticalesMaterial",
          tipo: "Vertical[]",
          requerido: true,
          descripcion: "De 1 a 3 temas del material.",
        },
        {
          nombre: "creadorId",
          tipo: "CreadorId",
          requerido: false,
          descripcion: "Creador del catálogo cuyo contenido se clipea (`cre_…`).",
        },
        {
          nombre: "redesObjetivo",
          tipo: "SocialId[]",
          requerido: true,
          descripcion: "Al menos una.",
        },
        {
          nombre: "paisesObjetivo",
          tipo: "CountryCode[]",
          requerido: true,
          descripcion: "Al menos uno.",
        },
        {
          nombre: "idiomasObjetivo",
          tipo: "IdiomaAudiencia[]",
          requerido: true,
          descripcion: "Al menos uno.",
        },
        {
          nombre: "nombre",
          tipo: "string",
          requerido: true,
          descripcion: "Nombre de la cuenta. El servidor lo toma de la sesión.",
        },
        {
          nombre: "correo",
          tipo: "string",
          requerido: true,
          descripcion: "Correo de la cuenta. El servidor lo toma de la sesión.",
        },
        {
          nombre: "tramoPresupuesto",
          tipo: '"lt-500" | "500-2k" | "2k-10k" | "10k-50k" | "50k-plus" | "no-decir"',
          requerido: true,
          descripcion: "Tramo del presupuesto del simulador (`tramoPresupuestoDe`).",
        },
        {
          nombre: "enviadaEn",
          tipo: "string",
          requerido: true,
          descripcion: "ISO. El servidor pone la suya.",
        },
      ],
      ejemplo: SOLICITUD_ANA,
    },
    respuesta: {
      tipo: 'Pick<Persistido, "solicitudAgencia" | "datosSolicitud">',
      definidoEn: "hooks/use-campanas.ts:97",
      ejemplo: { solicitudAgencia: "pendiente", datosSolicitud: SOLICITUD_ANA },
    },
    errores: [
      {
        codigo: "no-autorizado",
        http: 401,
        cuando: "Sin sesión.",
        frase: "common.errors.no-autorizado",
        bloquea: true,
      },
      {
        codigo: "conflicto",
        http: 409,
        cuando:
          "La cuenta ya es agencia o ya tiene una solicitud `pendiente` o en `entrevista`.",
        frase: "common.errors.conflicto",
        bloquea: true,
      },
      {
        codigo: "conflicto",
        http: 422,
        cuando:
          "Falta un dato obligatorio o trae un id que no está en su catálogo (tipo, sector, temas, redes, países, idiomas).",
        frase: "onboarding.errors.solicitudFallida.title",
        bloquea: true,
      },
    ],
    reglas: [
      "Validar lo que hoy reparten `datosSolicitudDe` y las tomas (`validarToma`): tipo, nombre, web, país, sector, temas, redes, países e idiomas son obligatorios; el papel y el creador, no. Nombre de 2 a 60 caracteres, web que pase `normalizarWeb` y como mucho 3 temas (`LIMITES_ONBOARDING`); en las tomas un cuarto tema solo avisa, así que aquí es donde se hace cumplir.",
      "`nombre` y `correo` salen de la sesión, no del cuerpo; `dominioCoincide` se recalcula con `dominioCoincide(correo, web)` (lib/onboarding.ts:783) en vez de fiarse del que llega.",
      "`enviadaEn` es la hora del servidor. Con ella se calcula la promesa «Decisión antes del…»: 2 días hábiles, de lunes a viernes, en UTC (`decisionAntesDe`).",
      "La solicitud queda `pendiente` y se borra el motivo de un rechazo anterior. Sin datos nuevos se conservan los de la solicitud anterior (`datos ?? s.datosSolicitud`).",
      "Registrar el evento `solicitud_agencia` con estado `pendiente`, si el sector es regulado (`SECTOR_REGULADO`) y el tramo; solo ids y tramos, nunca la cifra.",
      "Marcar `agencia.solicitudEnviadaEn` en la cuenta solo si la solicitud se acepta. Hoy el render la marca antes de comprobar los datos (`result-agencia.tsx:104`): si faltaba algo, la pantalla pasa a «Solicitud enviada» aunque a la cola no ha llegado nada.",
      "El borrador del simulador no viaja en este cuerpo: hoy lo guarda `marcarSolicitudEnviada` en la cuenta en la misma pulsación; con servidor va por `PUT /cuenta/borrador-campana` (`agencias.guardar-borrador`).",
    ],
    origen: "hooks/use-campanas.ts:411",
  },
  {
    id: "agencias.leer-solicitud",
    area: "agencias",
    metodo: "GET",
    ruta: "/agencia/solicitud",
    resumen:
      "En qué va la solicitud de perfil de agencia de la cuenta: estado, entrevista, motivo y plan.",
    descripcion:
      "Sustituye a lo que `useCampanas()` devuelve de `Persistido`: `perfil`, `solicitudAgencia`, `entrevista`, `planAsignado`, `datosSolicitud` y `motivoRechazo`. Lo leen la puerta de agencia de Crear campaña y el render de agencia de la bienvenida.",
    estado: "por-construir",
    auth: "sesion",
    respuesta: {
      tipo: 'Pick<Persistido, "perfil" | "solicitudAgencia" | "entrevista" | "motivoRechazo" | "planAsignado" | "datosSolicitud">',
      definidoEn: "hooks/use-campanas.ts:97",
      campos: [
        {
          nombre: "perfil",
          tipo: '"usuario" | "agencia"',
          requerido: true,
          descripcion: "`agencia` desde que se concede. Es lo que abre Crear campaña.",
        },
        {
          nombre: "solicitudAgencia",
          tipo: '"ninguna" | "pendiente" | "entrevista" | "aprobada" | "rechazada"',
          requerido: true,
          descripcion: "Por dónde va (`ESTADOS_SOLICITUD`).",
        },
        {
          nombre: "entrevista",
          tipo: "Entrevista",
          requerido: false,
          descripcion:
            "`{ citadaEn, nota? }`: la última cita es la que vale. `citadaEn` es un día: el backoffice lo guarda a mediodía UTC (`T12:00:00.000Z`).",
        },
        {
          nombre: "motivoRechazo",
          tipo: '"web-no-verificable" | "sector-no-admitido" | "datos-incompletos" | "duplicada" | "otro"',
          requerido: false,
          descripcion:
            "Solo si está rechazada. Código; el texto está en `taxonomy.motivosRechazo`.",
        },
        {
          nombre: "planAsignado",
          tipo: "PlanId",
          requerido: false,
          descripcion: "El plan con el que se concedió; puede ser uno creado a medida.",
        },
        {
          nombre: "datosSolicitud",
          tipo: "SolicitudAgenciaDatos",
          requerido: false,
          descripcion: "Lo último que se envió.",
        },
      ],
      ejemplo: {
        perfil: "usuario",
        solicitudAgencia: "entrevista",
        entrevista: {
          citadaEn: "2026-09-15T12:00:00.000Z",
          nota: "Trae el enlace del canal de Ámbar y el presupuesto del primer mes.",
        },
        datosSolicitud: SOLICITUD_ANA,
      },
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
      "Solo la de la propia cuenta.",
      "Lo que escribe el admin (citar, conceder con plan, rechazar con motivo) se tiene que ver aquí sin recargar: hoy el almacén se sincroniza entre pestañas (`storage`).",
      "Un estado o un motivo desconocido se lee como hace `migrar`: la solicitud vuelve a `ninguna` y el motivo se descarta.",
      "Conceder cambia también el plan de la cuenta (`cambiarPlan`): perfil y plan tienen que cambiar juntos.",
    ],
    origen: "hooks/use-campanas.ts:97",
  },
  {
    id: "agencias.guardar-borrador",
    area: "agencias",
    metodo: "PUT",
    ruta: "/cuenta/borrador-campana",
    resumen:
      "Guarda (o borra, con `null`) el borrador de la primera campaña que deja el simulador de la agencia.",
    descripcion:
      "Sustituye a `useCuenta().guardarBorrador` y a la parte de `marcarSolicitudEnviada` que guarda el borrador. Lo escriben el simulador del render de agencia al soltar cada control, «Enviar solicitud» / «Volver a enviar» y «Publicar campaña» (que lo borra). Se lee con la cuenta (`Cuenta.borradorCampana`) y precarga Crear campaña.",
    estado: "por-construir",
    auth: "sesion",
    cuerpo: {
      tipo: "Partial<BorradorCampana> | null",
      definidoEn: "lib/onboarding.ts:326",
      ejemplo: BORRADOR_AMBAR,
    },
    respuesta: { tipo: "void" },
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
      "Responde 204: `pedir()` devuelve `undefined` sin cuerpo.",
      "`null` lo borra: ya no espera a nadie.",
      "Guardar solo los campos de `BorradorCampana` con valor y con ids válidos: redes, sector, tema, países e idiomas de sus catálogos y números finitos. `borradorInicial` (lib/agencia.ts:334) ya hace ese filtro, pero hoy nadie lo llama: el formulario vuelca el borrador tal cual sobre sus valores de partida (`campaign-form.tsx:132`).",
      "Al crear una campaña el servidor puede borrarlo él mismo; hoy lo borra el formulario (`campaign-form.tsx:197`).",
    ],
    origen: "hooks/use-cuenta.ts:1142",
  },
  {
    id: "agencias.estimar-oferta",
    area: "agencias",
    metodo: "GET",
    ruta: "/agencia/oferta",
    resumen:
      "Cuántos cliperos cubren una combinación de temas, países, idiomas y redes, para la reacción de la toma 4 y la sección «Mercado».",
    descripcion:
      "Hoy es `ofertaEstimada`, una función pura sobre datos de demo (`CLIPEROS_DEMO_POR_PAIS`, `CUOTA_VERTICAL_DEMO`, `CUOTA_RED_DEMO`), que el propio código dice que sirve «hasta que `lib/mercado.ts` (`oferta`) lea datos reales». Con servidor, esa cifra sale de los cliperos de verdad.",
    estado: "por-construir",
    auth: "sesion",
    parametros: [
      {
        nombre: "verticales",
        tipo: "Vertical[]",
        requerido: false,
        en: "consulta",
        descripcion: "Temas del material. Sin ellos se usan los del sector.",
      },
      {
        nombre: "sector",
        tipo: "Sector",
        requerido: false,
        en: "consulta",
        descripcion: "Sector del producto.",
      },
      {
        nombre: "paises",
        tipo: "CountryCode[]",
        requerido: true,
        en: "consulta",
        descripcion: "Países del público.",
      },
      {
        nombre: "idiomas",
        tipo: "IdiomaAudiencia[]",
        requerido: true,
        en: "consulta",
        descripcion: "Idiomas objetivo.",
      },
      {
        nombre: "redes",
        tipo: "SocialId[]",
        requerido: true,
        en: "consulta",
        descripcion: "Redes donde se publican los clips.",
      },
    ],
    respuesta: {
      tipo: "number",
      definidoEn: "lib/agencia.ts:443",
      ejemplo: 215,
    },
    reglas: [
      "Cuenta, por país, a los cliperos que clipean alguno de los temas, publican en alguna de las redes y en alguno de los idiomas. Sin temas, los del sector: principales y secundarios (`SECTOR_VERTICALES`).",
      "La cifra solo se enseña pasada por `umbralPublicoValor`: por debajo de 50 no se da ninguna y por encima se redondea a 50, 200, 1.000 o 5.000. Conviene que el servidor devuelva ya ese valor (y 0 por debajo de 50), para que el recuento exacto no salga nunca de él: `umbralPublicoValor` deja igual 50, 200, 1.000 y 5.000, y de 0 no enseña nada.",
      "Ejemplo de la demo: Música en Perú, en español y en TikTok, da 215, que se enseña «más de 200».",
    ],
    origen: "lib/agencia.ts:443",
  },

  /* -------------------------------------------------------------------------
     Crear
     ------------------------------------------------------------------------- */
  {
    id: "agencias.crear-campana",
    area: "agencias",
    metodo: "POST",
    ruta: "/campanas",
    resumen: "Crea y publica una campaña (pública o privada con código).",
    descripcion:
      "Sustituye a `useCampanas().crear(c)`, que añade la campaña que monta `borradorACampana` a `creadas`. La llama «Publicar campaña» de /campanas/nueva, también desde el backoffice (`?como=admin`).",
    estado: "por-construir",
    auth: "agencia",
    cuerpo: {
      tipo: "Campana",
      definidoEn: "lib/campanas.ts:75",
      ejemplo: CAMPANA_NUEVA,
    },
    respuesta: {
      tipo: "Campana",
      definidoEn: "lib/campanas.ts:75",
      ejemplo: CAMPANA_NUEVA,
    },
    errores: [
      {
        codigo: "no-autorizado",
        http: 403,
        cuando: "El perfil de la sesión es `usuario`: solo crean agencias y admin.",
        frase: "common.errors.no-autorizado",
        bloquea: true,
      },
      {
        codigo: "brandRequired",
        http: 422,
        cuando: "Marca con menos de 2 caracteres.",
        frase: "campaigns.form.errors.brandRequired",
        bloquea: true,
      },
      {
        codigo: "titleShort",
        http: 422,
        cuando: "Nombre con menos de 6 caracteres.",
        frase: "campaigns.form.errors.titleShort",
        bloquea: true,
      },
      {
        codigo: "descriptionShort",
        http: 422,
        cuando: "Descripción con menos de 20 caracteres.",
        frase: "campaigns.form.errors.descriptionShort",
        bloquea: true,
      },
      {
        codigo: "materialUrl",
        http: 422,
        cuando: "El material no es un enlace http(s) con dominio.",
        frase: "campaigns.form.errors.materialUrl",
        bloquea: true,
      },
      {
        codigo: "networksRequired",
        http: 422,
        cuando: "Sin redes.",
        frase: "campaigns.form.errors.networksRequired",
        bloquea: true,
      },
      {
        codigo: "budgetRange",
        http: 422,
        cuando: "Presupuesto fuera de US$ 100–100.000.",
        frase: "campaigns.form.errors.budgetRange",
        bloquea: true,
      },
      {
        codigo: "cpmRange",
        http: 422,
        cuando: "CPM fuera de US$ 0,10–20.",
        frase: "campaigns.form.errors.cpmRange",
        bloquea: true,
      },
      {
        codigo: "capRange",
        http: 422,
        cuando: "Tope por video fuera del 1–50 %.",
        frase: "campaigns.form.errors.capRange",
        bloquea: true,
      },
      {
        codigo: "minViewsRange",
        http: 422,
        cuando: "Mínimo de vistas fuera de 0–100.000.",
        frase: "campaigns.form.errors.minViewsRange",
        bloquea: true,
      },
      {
        codigo: "minViewsAboveCap",
        http: 422,
        cuando: "El mínimo supera las vistas con las que un video llega al tope.",
        frase: "campaigns.form.errors.minViewsAboveCap",
        bloquea: true,
      },
      {
        codigo: "startRequired",
        http: 422,
        cuando: "Sin fecha de inicio.",
        frase: "campaigns.form.errors.startRequired",
        bloquea: true,
      },
      {
        codigo: "endRequired",
        http: 422,
        cuando: "Sin fecha de fin.",
        frase: "campaigns.form.errors.endRequired",
        bloquea: true,
      },
      {
        codigo: "endBeforeStart",
        http: 422,
        cuando: "El fin no es posterior al inicio.",
        frase: "campaigns.form.errors.endBeforeStart",
        bloquea: true,
      },
      {
        codigo: "attributionLong",
        http: 422,
        cuando: "Atribución de más de 60 caracteres.",
        frase: "campaigns.form.errors.attributionLong",
        bloquea: true,
      },
      {
        codigo: "conditionsLong",
        http: 422,
        cuando: "Condiciones de más de 300 caracteres.",
        frase: "campaigns.form.errors.conditionsLong",
        bloquea: true,
      },
    ],
    reglas: [
      "El perfil sale de la sesión, nunca de la URL: `?como=admin` es solo la entrada desde el backoffice (`campaign-form.tsx:111`). Crean `agencia` y `admin` (`puedeCrearCampanas`).",
      "Repetir las validaciones de `validarBorrador` y devolver sus mismos códigos: `LIMITES` (presupuesto 100–100.000 US$, CPM 0,10–20 US$, tope 1–50 %, mínimo 0–100.000 vistas), mínimo por debajo de `vistasHastaTope`, marca ≥ 2, nombre ≥ 6, descripción ≥ 20, material `http(s)`, al menos una red, fin posterior al inicio, atribución ≤ 60 y condiciones ≤ 300 (`LIMITES_LICENCIA`). Hoy `pedir()` convierte el 422 en `conflicto` y deja el cuerpo en el registro.",
      'El servidor pone `id` (prefijo `cmp_`), `creadaEn`, `estado: "activa"` y `creadaPor` (una agencia firma «{nombre} (agencia)»; el admin, «Clipealo»). Hoy los genera el navegador (`nuevoId`, `new Date()`).',
      "`destacada` solo puede ser `true` si crea el admin; lo de una agencia se guarda sin destacar.",
      "`codigo` solo si `privada`: lo genera el servidor, único, con `generarCodigo` (dos bloques de 4 del alfabeto sin 0/O ni 1/I). Hoy sale de `Math.random` en el navegador y nadie comprueba que no se repita. Si no es privada, sin código.",
      "Un sector de `SECTOR_REGULADO` fija `regulado: true` y `soloVerificados: true`, diga lo que diga el cuerpo.",
      "Limpiar como `borradorACampana` y `migrarCampana`: presupuesto y CPM a céntimos, mínimo entero, licencia con `licenciaValida` y segmentación con ids válidos.",
      "El formulario no manda `modoParticipacion`, `plazoEntregaDias`, `plazas` ni `inscripcionesAbiertas`: valen «con solicitud», 7 días, sin cupo y abiertas (`MODO_POR_DEFECTO`, `PLAZO_ENTREGA_DIAS`).",
      "Importes en dólares. Se publica al momento y sale en `GET /campanas` para todos si es pública.",
      "Hoy `inicio` y `fin` se calculan en el navegador con su hora local (00:00 del primer día y 23:59 del último, `borradorACampana`): el mismo día da instantes distintos según la zona de quien crea. El servidor tiene que decidir en qué zona se leen.",
      "Al crear, borrar el borrador de la cuenta (`Cuenta.borradorCampana = null`).",
    ],
    origen: "hooks/use-campanas.ts:307",
  },

  /* -------------------------------------------------------------------------
     Lo que la agencia ve de sus campañas
     ------------------------------------------------------------------------- */
  {
    id: "agencias.listar-envios",
    area: "agencias",
    metodo: "GET",
    ruta: "/agencia/envios",
    resumen:
      "Todos los clips entregados a las campañas de la agencia, en cualquier estado: la cola de revisión y la base del reparto.",
    descripcion:
      "El hook mezcla estos envíos en la misma lista `envios` que ya usa. De ella salen «{n} clips por revisar» de Mis campañas, los clips de «Gestionar tu campaña» (`en-revision`), el tablero y lo gastado de cada campaña (`liquidar`).",
    estado: "por-construir",
    auth: "agencia",
    parametros: [
      {
        nombre: "campanaId",
        tipo: "string",
        requerido: false,
        en: "consulta",
        descripcion: "Solo los de una campaña propia (la ficha). Sin él, los de todas.",
      },
    ],
    respuesta: {
      tipo: "Envio[]",
      definidoEn: "lib/campanas.ts:160",
      ejemplo: [ENVIO_NORA],
    },
    errores: [
      {
        codigo: "no-autorizado",
        http: 403,
        cuando: "La campaña pedida no es de quien llama.",
        frase: "common.errors.no-autorizado",
        bloquea: true,
      },
    ],
    reglas: [
      "Solo campañas cuyo `creadaPor.userId` es la sesión, con los envíos de todos los creadores y en todos los estados (`en-revision`, `aprobado`, `rechazado`): la agencia revisa los que esperan y `liquidar` reparte entre los aprobados.",
      "`vistas` ausente es «sin medir», nunca cero; `vistasEn` dice cuándo se leyó.",
      "Orden por `enviadoEn`: es el orden en que `liquidar` reparte el presupuesto.",
    ],
    origen: "components/campanas/campaign-detail.tsx:109",
  },
  {
    id: "agencias.listar-participaciones",
    area: "agencias",
    metodo: "GET",
    ruta: "/agencia/participaciones",
    resumen:
      "Los compromisos de los cliperos con las campañas de la agencia: solicitudes por decidir, gente dentro y lo ya cerrado.",
    descripcion:
      "El hook las mezcla en la misma lista `participaciones`. Con ellas se pintan «Solicitudes», «Cómo va la campaña», «Quién está dentro», lo que falta para finalizar y «{n} solicitudes esperando tu decisión».",
    estado: "por-construir",
    auth: "agencia",
    parametros: [
      {
        nombre: "campanaId",
        tipo: "string",
        requerido: false,
        en: "consulta",
        descripcion: "Solo las de una campaña propia.",
      },
    ],
    respuesta: {
      tipo: "Participacion[]",
      definidoEn: "lib/participacion.ts:99",
      ejemplo: [PAR_BRUNO, PAR_KAI, PAR_NORA],
    },
    errores: [
      {
        codigo: "no-autorizado",
        http: 403,
        cuando: "La campaña pedida no es de quien llama.",
        frase: "common.errors.no-autorizado",
        bloquea: true,
      },
    ],
    reglas: [
      "Solo las de campañas propias. De cada clipero, su id, el nombre visible (`clipero`) y su nota; nada más de su cuenta.",
      "Una `aceptada` con `venceEn` pasado se lee `caducada` (`estadoParticipacion`): el servidor puede escribirla así (`caducar`) o dejar que el front la derive, pero nunca contarla como viva al decidir, al aceptar ni al finalizar.",
      "El instante es el del servidor; en la demo, `HOY_CAMPANAS` (2026-09-13T12:20:00.000Z).",
    ],
    origen: "components/campanas/solicitudes-agencia.tsx:113",
  },
  {
    id: "agencias.leer-perfil-solicitante",
    area: "agencias",
    metodo: "GET",
    ruta: "/participaciones/{id}/perfil",
    resumen: "La ficha del clipero que pide entrar, tal como la puede ver la agencia.",
    descripcion:
      "`SolicitudesAgencia` ya tiene la costura: su prop `perfilDe` «con la API real, aquí entrará el perfil que devuelva el servidor». Hoy se compone en el navegador con `perfilParaAgencia` y, para los cliperos de la demo, con `PERFILES_DEMO`.",
    estado: "por-construir",
    auth: "agencia",
    parametros: [ID_PARTICIPACION],
    respuesta: {
      tipo: "PerfilParaAgencia",
      definidoEn: "lib/participacion.ts:584",
      ejemplo: {
        nombre: "Bruno Salas",
        pais: "PE",
        idiomas: ["es"],
        redes: [
          { red: "tiktok", handle: "@brunoedita", tramo: "10k-100k" },
          { red: "instagram", handle: "@brunoedita", tramo: "1k-10k" },
        ],
        temas: ["musica", "humor"],
        experiencia: "clientes",
        disponibilidad: "10-20",
        historial: {
          aprobados: 0,
          enviados: 0,
          tasaAprobacion: null,
          vistasMedianas: null,
        },
        nota: "Hago ediciones de baile en vertical, sin música con derechos encima.",
      },
    },
    errores: [
      {
        codigo: "no-autorizado",
        http: 403,
        cuando: "La campaña de esa participación no es de quien llama.",
        frase: "common.errors.no-autorizado",
        bloquea: true,
      },
      {
        codigo: "no-encontrado",
        http: 404,
        cuando: "No existe la participación.",
        frase: "common.errors.no-encontrado",
        bloquea: true,
      },
    ],
    reglas: [
      "Devolver solo los campos de `PerfilParaAgencia` y nada más: ni correo, ni teléfono, ni lo que ha ganado, ni a qué otras campañas se presentó, ni sus creadores favoritos uno por uno (docs/campanas-ciclo-2026-09.md §2.1.b).",
      "Redes con TRAMO de seguidores: el medido si lo hay (`tramoSeguidoresDe`), si no el declarado; nunca la cifra exacta.",
      "Historial solo de lo verificable en Clipealo: aprobados, enviados, tasa de aprobación en % entero (`null` sin envíos) y mediana de vistas de los aprobados CON medición (`null` si no hay).",
      "La nota, recortada a 280 caracteres (`NOTA_MAX`).",
      "Solo para la dueña de la campaña a la que pertenece la participación.",
    ],
    origen: "lib/participacion.ts:608",
  },

  /* -------------------------------------------------------------------------
     Decidir y revisar
     ------------------------------------------------------------------------- */
  {
    id: "agencias.decidir-solicitud",
    area: "agencias",
    metodo: "POST",
    ruta: "/participaciones/{id}/decision",
    resumen: "Acepta o rechaza con motivo la solicitud de un clipero.",
    descripcion:
      "Sustituye a `useCampanas().decidirSolicitud(p, campana, decision, motivo)`. La llaman «Aceptar», «Rechazar solicitud» y el rechazo en bloque de «Cerrar inscripciones», que la llama una vez por cada solicitud sin decidir con el motivo `inscripciones-cerradas`.",
    estado: "por-construir",
    auth: "agencia",
    parametros: [ID_PARTICIPACION],
    cuerpo: {
      tipo: '{ decision: "aceptar" | "rechazar"; motivo?: MotivoDecision }',
      definidoEn: "hooks/use-campanas.ts:499",
      campos: [
        {
          nombre: "decision",
          tipo: '"aceptar" | "rechazar"',
          requerido: true,
          descripcion: "Las dos únicas decisiones posibles.",
        },
        {
          nombre: "motivo",
          tipo: '"no-encaja-publico" | "no-encaja-tema" | "sin-historial" | "plazas-llenas" | "inscripciones-cerradas" | "otro"',
          requerido: false,
          descripcion: "Solo al rechazar. Sin él, `otro`.",
        },
      ],
      ejemplo: { decision: "aceptar" },
    },
    respuesta: {
      tipo: "Participacion",
      definidoEn: "lib/participacion.ts:99",
      ejemplo: {
        ...PAR_BRUNO,
        estado: "aceptada",
        decididaEn: "2026-09-13T12:20:00.000Z",
        venceEn: "2026-09-20T12:20:00.000Z",
      },
    },
    errores: [
      {
        codigo: "no-autorizado",
        http: 403,
        cuando: "La campaña no es de quien llama.",
        frase: "common.errors.no-autorizado",
        bloquea: true,
      },
      {
        codigo: "no-encontrado",
        http: 404,
        cuando: "No existe la participación.",
        frase: "common.errors.no-encontrado",
        bloquea: true,
      },
      {
        codigo: "conflicto",
        http: 409,
        cuando:
          "Ya no está `solicitada`, o se intenta aceptar con la campaña no activa o sin plazas libres.",
        frase: "campaignsAgencia.solicitudes.noNuevos.title",
        bloquea: true,
      },
      {
        codigo: "conflicto",
        http: 422,
        cuando: "El motivo no está en `MOTIVOS_DECISION`.",
        frase: "campaignsAgencia.solicitudes.dialog.needReason",
        bloquea: true,
      },
    ],
    reglas: [
      "Solo desde `solicitada` y solo la dueña de la campaña.",
      "Aceptar exige la campaña en estado visto `activa` (`estadoVisible`: ni pausada, ni agotada, ni vencida, ni con inscripciones cerradas) y `plazasLibres` distinto de 0. Ocupan plaza `aceptada`, `entregada`, `cumplida` y `en-disputa`.",
      "Al aceptar, `decididaEn` es la hora del servidor y `venceEn` = mín(`decididaEn` + `plazoEntregaDias` días —7 por defecto—, `fin` de la campaña) (`aceptar`).",
      "Al rechazar, `motivo` de `MOTIVOS_DECISION` (sin él, `otro`). `inscripciones-cerradas` no lo elige nadie a mano: solo llega del cierre de inscripciones.",
      "Avisar al clipero: al solicitar se le prometió «te avisamos con su decisión» (`campaigns.participation.sentDescription`). El motivo de un rechazo se le enseña traducido (`campaigns.participation.decision.<motivo>`).",
    ],
    origen: "hooks/use-campanas.ts:499",
  },
  {
    id: "agencias.revisar-envio",
    area: "agencias",
    metodo: "POST",
    ruta: "/envios/{id}/revision",
    resumen: "Aprueba o rechaza un clip entregado a una campaña propia.",
    descripcion:
      "Sustituye a `useCampanas().revisarEnvio(id, estado, motivoRechazo, participacion)`. La llaman «Aprobar» y «Rechazar» de «Gestionar tu campaña».",
    estado: "por-construir",
    auth: "agencia",
    parametros: [
      {
        nombre: "id",
        tipo: "string",
        requerido: true,
        en: "ruta",
        descripcion:
          "Id del envío (`env_nora_01`). Su campaña tiene que ser de quien llama.",
      },
    ],
    cuerpo: {
      tipo: "{ estado: EstadoEnvio; motivoRechazo?: string }",
      definidoEn: "hooks/use-campanas.ts:367",
      campos: [
        {
          nombre: "estado",
          tipo: '"aprobado" | "rechazado"',
          requerido: true,
          descripcion: "La decisión.",
        },
        {
          nombre: "motivoRechazo",
          tipo: "string",
          requerido: false,
          descripcion:
            "Solo al rechazar. Texto en el idioma de quien revisa: hoy «No cumple los requisitos de la campaña.».",
        },
      ],
      ejemplo: { estado: "aprobado" },
    },
    respuesta: {
      tipo: "Envio",
      definidoEn: "lib/campanas.ts:160",
      ejemplo: { ...ENVIO_NORA, estado: "aprobado" },
    },
    errores: [
      {
        codigo: "no-autorizado",
        http: 403,
        cuando: "La campaña del envío no es de quien llama.",
        frase: "common.errors.no-autorizado",
        bloquea: true,
      },
      {
        codigo: "no-encontrado",
        http: 404,
        cuando: "No existe el envío.",
        frase: "common.errors.no-encontrado",
        bloquea: true,
      },
      {
        codigo: "conflicto",
        http: 409,
        cuando: "El envío ya no está `en-revision`.",
        frase: "common.errors.conflicto",
        bloquea: true,
      },
    ],
    reglas: [
      "Solo envíos `en-revision` de campañas propias.",
      "En la misma transacción, la participación de ese envío (la que tiene su `envioId`): al aprobar pasa a `cumplida`; al rechazar vuelve a `aceptada` sin `envioId`, y si ya no le queda plazo el reloj la dará por caducada. El front manda hoy la participación como cuarto argumento: el servidor la busca él.",
      "Un aprobado entra en la liquidación por orden de `enviadoEn`: cobra mín(vistas ÷ 1.000 × CPM, tope, lo que quede) si pasa del mínimo (`pagoPorVideo`).",
      "El motivo del rechazo es contenido, no una clave: se guarda tal cual.",
    ],
    origen: "hooks/use-campanas.ts:367",
  },

  /* -------------------------------------------------------------------------
     Pausar, cerrar y finalizar
     ------------------------------------------------------------------------- */
  {
    id: "agencias.cambiar-estado-campana",
    area: "agencias",
    metodo: "PATCH",
    ruta: "/campanas/{id}/estado",
    resumen: "Pausa o reanuda una campaña propia.",
    descripcion:
      "Sustituye a `useCampanas().cambiarEstado(id, estado)`. En la app la llaman «Pausar campaña» y «Reanudar campaña»; el backoffice usa la misma función para moderar.",
    estado: "por-construir",
    auth: "agencia",
    parametros: [ID_CAMPANA],
    cuerpo: {
      tipo: "{ estado: EstadoCampana }",
      definidoEn: "hooks/use-campanas.ts:308",
      campos: [
        {
          nombre: "estado",
          tipo: '"activa" | "pausada" | "agotada" | "finalizada"',
          requerido: true,
          descripcion: "Desde la agencia, solo `pausada` o `activa`.",
        },
      ],
      ejemplo: { estado: "pausada" },
    },
    respuesta: {
      tipo: "Campana",
      definidoEn: "lib/campanas.ts:75",
      ejemplo: { ...AMBAR, estado: "pausada" },
    },
    errores: [
      {
        codigo: "no-autorizado",
        http: 403,
        cuando: "La campaña no es de quien llama.",
        frase: "common.errors.no-autorizado",
        bloquea: true,
      },
      {
        codigo: "conflicto",
        http: 409,
        cuando:
          "La campaña está finalizada, o se pide `finalizada` o `agotada` por aquí.",
        frase: "common.errors.conflicto",
        bloquea: true,
      },
    ],
    reglas: [
      "Una agencia solo alterna `activa` y `pausada`: es lo único que ofrece la ficha (el botón sale con el estado visto `activa` o `pausada`). Finalizar va por su endpoint, que comprueba los pendientes; `agotada`, `vencida` y `cerrada` se derivan.",
      "Pausada no admite solicitudes ni clips de nadie, ni de los ya aceptados (`aceptaEnvios`).",
      "Lo guardado manda sobre lo derivado: una pausada se enseña pausada aunque haya vencido (`estadoVisible`).",
    ],
    origen: "hooks/use-campanas.ts:308",
  },
  {
    id: "agencias.cambiar-inscripciones",
    area: "agencias",
    metodo: "PATCH",
    ruta: "/campanas/{id}/inscripciones",
    resumen: "Cierra o vuelve a abrir las inscripciones de una campaña propia.",
    descripcion:
      "Sustituye a `useCampanas().cerrarInscripciones(campanaId, abiertas)`. La llaman «Cerrar inscripciones» (después de rechazar en bloque lo que quede sin decidir) y «Volver a abrir inscripciones».",
    estado: "por-construir",
    auth: "agencia",
    parametros: [ID_CAMPANA],
    cuerpo: {
      tipo: "{ abiertas: boolean }",
      definidoEn: "hooks/use-campanas.ts:527",
      campos: [
        {
          nombre: "abiertas",
          tipo: "boolean",
          requerido: true,
          descripcion: "`false` cierra; `true` vuelve a abrir.",
        },
      ],
      ejemplo: { abiertas: false },
    },
    respuesta: {
      tipo: "Campana",
      definidoEn: "lib/campanas.ts:75",
      ejemplo: { ...AMBAR, inscripcionesAbiertas: false },
    },
    errores: [
      {
        codigo: "no-autorizado",
        http: 403,
        cuando: "La campaña no es de quien llama.",
        frase: "common.errors.no-autorizado",
        bloquea: true,
      },
      {
        codigo: "conflicto",
        http: 409,
        cuando: "La campaña está finalizada.",
        frase: "campaignsAgencia.cerrar.already",
        bloquea: true,
      },
    ],
    reglas: [
      "Al cerrar, toda participación que siga `solicitada` se rechaza con el motivo `inscripciones-cerradas`, en la misma transacción. Hoy el front las rechaza una a una antes de cerrar (`cerrar-campana.tsx:107`); si entra alguna entre medias, el servidor la rechaza igual.",
      "Cerrar no toca a quien ya está dentro: la campaña pasa a verse `cerrada` y los aceptados siguen entregando (`aceptaEnvios` con `yaDentro`).",
      "Reabrir no devuelve las solicitudes rechazadas: tendrán que pedirlo otra vez.",
    ],
    origen: "hooks/use-campanas.ts:527",
  },
  {
    id: "agencias.finalizar-campana",
    area: "agencias",
    metodo: "POST",
    ruta: "/campanas/{id}/finalizar",
    resumen: "Finaliza una campaña propia, solo si no queda trabajo pendiente.",
    descripcion:
      "Sustituye a `useCampanas().finalizarCampana(campanaId)`, que «solo escribe la decisión»: hoy quien llama comprueba antes `puedeFinalizar`. Lo llama «Finalizar campaña» tras su confirmación.",
    estado: "por-construir",
    auth: "agencia",
    parametros: [ID_CAMPANA],
    respuesta: {
      tipo: "Campana",
      definidoEn: "lib/campanas.ts:75",
      ejemplo: { ...AMBAR, estado: "finalizada" },
    },
    errores: [
      {
        codigo: "no-autorizado",
        http: 403,
        cuando: "La campaña no es de quien llama.",
        frase: "common.errors.no-autorizado",
        bloquea: true,
      },
      {
        codigo: "conflicto",
        http: 409,
        cuando:
          "Queda trabajo pendiente: aceptados en plazo, clips entregados sin revisar o disputas abiertas.",
        frase: "campaignsAgencia.cerrar.blocked",
        bloquea: true,
      },
    ],
    reglas: [
      "Comprobar `pendientesDe` con la hora del servidor y finalizar solo con total 0 (`puedeFinalizar`). Cuentan las `aceptada` dentro de plazo, las `entregada` y las `en-disputa` (`bloqueaCierre`); no cuentan `solicitada`, `cumplida`, `rechazada`, `retirada` ni `caducada`.",
      "En la demo, «Ámbar» no se puede finalizar: Kai Moreno tiene plazo hasta el 2026-09-16 y el clip de Nora Vidal está sin revisar.",
      "No se deshace: pasa a `finalizada` y no admite clips de nadie.",
      "Desde ese momento las vistas se congelan (`vistasCongeladas`): la última lectura es la que reparte.",
    ],
    origen: "hooks/use-campanas.ts:540",
  },
]
