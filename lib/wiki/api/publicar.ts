import type { Campo, Endpoint, ErrorDoc } from "@/lib/wiki/tipos"

/**
 * Endpoints de «publicar».
 *
 * Dos están conectados: `lib/api/publicaciones.ts` ya llama a `pedir()` para
 * mandar una entrada a la red y para leer lo que dejó la plataforma. El resto
 * vive hoy en el navegador —el texto de publicación en `clipealo-publicacion-v1`
 * (`hooks/use-publicacion.ts`)— y el servidor tendrá que darlo con estas formas
 * para que la app no cambie.
 *
 * La agenda en sí (listar, crear, mover, cancelar y marcar a mano) es del área
 * «calendario», y el texto propio de cada clip se guarda por las rutas del
 * clip, del área «proyectos»: aquí va lo que sale a la red, la plantilla de
 * cada proyecto y la lectura de todos los textos de una vez.
 */

const RED: Campo = {
  nombre: "red",
  tipo: '"tiktok" | "instagram" | "youtube" | "x" | "linkedin" | "facebook"',
  requerido: true,
  en: "ruta",
  descripcion: "La red (`SocialId`, lib/social.ts:21). Cualquier otro valor es 404.",
}

const ENTRADA_ID: Campo = {
  nombre: "entradaId",
  tipo: "string",
  requerido: true,
  en: "ruta",
  descripcion:
    "Id de la entrada de la agenda (`EntradaAgenda.id`): `age_*`, p. ej. `age_s4` en las semillas.",
}

const CAMPOS_COPIA: Campo[] = [
  {
    nombre: "titulo",
    tipo: "string",
    requerido: true,
    descripcion:
      "Título. Solo YouTube lo manda en un campo aparte (máx. 100); en las demás redes abre el texto. Vacío si no hay.",
  },
  {
    nombre: "texto",
    tipo: "string",
    requerido: true,
    descripcion:
      "Texto principal (caption, descripción, post). Límites: TikTok e Instagram 2.200, YouTube 5.000, X 280, LinkedIn 3.000, Facebook 63.206 (`LIMITES_PUBLICACION`, lib/publicacion.ts:35).",
  },
  {
    nombre: "hashtags",
    tipo: "string[]",
    requerido: true,
    descripcion:
      "Ya normalizados: con #, sin espacios y sin repetidos (`hashtagsDe`, lib/publicacion.ts:85). Recomendados como máximo: 5 (15 en YouTube, 2 en X).",
  },
]

const NO_AUTORIZADO: ErrorDoc = {
  codigo: "no-autorizado",
  http: 401,
  cuando: "Sin sesión (401), o lo pedido es de otra persona (403).",
  frase: "common.errors.no-autorizado",
  bloquea: true,
}

const NO_ENCONTRADO_ENTRADA: ErrorDoc = {
  codigo: "no-encontrado",
  http: 404,
  cuando: "La entrada no existe.",
  frase: "common.errors.no-encontrado",
  bloquea: true,
}

const REGLAS_COPIA = [
  "NO rechazar por longitud ni por número de hashtags: la app guarda mientras se escribe y los límites bloquean el ENVÍO, no el borrador. Se hacen cumplir en `POST /publicaciones/{entradaId}/enviar`.",
  "Normalizar los hashtags como `hashtagsDe` (lib/publicacion.ts:85): # delante, sin espacios, sin repetidos sin distinguir mayúsculas. Un hashtag con algo que no sea letra, número o guion bajo se guarda igual (solo avisa, `hashtagInvalido`).",
  "Una copia sin nada (título, texto y hashtags vacíos) equivale a borrarla: la app deja de tratarla como escrita (`copiaConTexto`, lib/publicacion.ts:153).",
  "Hoy la app escribe en cada pulsación: el PUT lleva el documento entero, es idempotente y gana el último.",
  "No tocar las entradas de la agenda ya creadas: cada una guarda la copia con la que se programó o salió (`EntradaAgenda.copia`, lib/agenda.ts:199).",
]

const EJEMPLO_COPIA_CLIP = {
  titulo: "",
  texto: "«Nadie se va por el sueldo. Se va por el jefe, y el sueldo le da la excusa.»",
  hashtags: ["#liderazgo", "#retención"],
}

const EJEMPLO_PLANTILLA_YT = {
  titulo: "Podcast #42 — Cómo escalar un equipo remoto",
  texto: "Un corte del Podcast #42. El episodio entero está en el canal.",
  hashtags: ["#shorts", "#trabajoremoto"],
}

export const ENDPOINTS: Endpoint[] = [
  {
    id: "publicar.enviar",
    area: "publicar",
    metodo: "POST",
    ruta: "/publicaciones/{entradaId}/enviar",
    resumen:
      "Manda una entrada de la agenda a su cuenta en la red y devuelve el enlace, el id del post y el instante.",
    descripcion:
      "Es `publicar(envio)` (lib/api/publicaciones.ts:106): con `NEXT_PUBLIC_API_URL` hace este POST; sin ella espera 900 ms y simula de forma determinista (el mismo envío da siempre el mismo `postId` de 14 cifras y el mismo enlace; sin cuenta falla con `cuentaCaducada` y sin texto ni título con `rechazoRed`). Lo llaman «Publicar ahora» del diálogo de publicar (una vez por cuenta, en paralelo) y «Publicar ahora» y «Volver a intentarlo» de la hoja del Calendario, todos por `enviarEntrada` (hooks/use-agenda.ts:145), que guarda tres momentos en la entrada: `publicando` y un intento más antes de llamar, `publicada` con `url`/`postId`/`publicadaEn`, o `fallida` con el código. Reintentar es volver a llamar: no hay otro endpoint. OJO al conectar: hoy `pedir()` convierte toda respuesta no 2xx en `ErrorApi` con un código genérico (lib/api/errores.ts:29) y `enviarEntrada` guarda `sinRed` para todo lo que no sea `PublicacionFallida` (hooks/use-agenda.ts:172). Hasta que `publicar()` lea el `{ code }` del cuerpo y lance `PublicacionFallida`, el motivo que mande el servidor no llega a la pantalla. Contrato de error que se propone: 422 con `{ code: FalloPublicacion }` para los cinco motivos de la plataforma, y los códigos genéricos de `lib/api/errores.ts` para lo demás.",
    estado: "conectado",
    auth: "sesion",
    parametros: [ENTRADA_ID],
    cuerpo: {
      tipo: "EnvioPublicacion",
      definidoEn: "lib/api/publicaciones.ts:33",
      campos: [
        {
          nombre: "entradaId",
          tipo: "string",
          requerido: true,
          descripcion: "El mismo id de la ruta.",
        },
        {
          nombre: "red",
          tipo: "SocialId",
          requerido: true,
          descripcion: "La red de la entrada.",
        },
        {
          nombre: "cuentaId",
          tipo: "string",
          requerido: false,
          descripcion:
            "La cuenta conectada donde sale (`cta_*`). Sin ella no hay dónde publicar: la demo falla con `cuentaCaducada`.",
        },
        {
          nombre: "handle",
          tipo: "string",
          requerido: false,
          descripcion:
            "El @ de la cuenta. Solo sirve para construir el enlace en la demo; el servidor no lo necesita.",
        },
        {
          nombre: "titulo",
          tipo: "string",
          requerido: false,
          descripcion:
            "Solo donde la red tiene campo de título aparte (YouTube): `tituloParaEnviar(copia, red)`.",
        },
        {
          nombre: "texto",
          tipo: "string",
          requerido: true,
          descripcion:
            "Lo que sale: `textoParaEnviar(copia, red)` si la entrada guarda copia (título si la red no tiene campo, texto y hashtags en una línea, separados por líneas en blanco); si no, el `texto` de la entrada, que es el gancho del clip.",
        },
        {
          nombre: "clipId",
          tipo: "string",
          requerido: false,
          descripcion:
            "El clip cuyo archivo se sube. En la demo no viaja ningún archivo.",
        },
      ],
      ejemplo: {
        entradaId: "age_s4",
        red: "youtube",
        cuentaId: "cta_yt_clipealo",
        handle: "@clipealo",
        clipId: "clip_04",
        texto:
          "«Nadie se va por el sueldo. Se va por el jefe, y el sueldo le da la excusa.»",
      },
    },
    respuesta: {
      tipo: "Publicado",
      definidoEn: "lib/api/publicaciones.ts:48",
      campos: [
        {
          nombre: "url",
          tipo: "string",
          requerido: true,
          descripcion:
            "Dónde vive el post. Forma por red (lib/api/publicaciones.ts:74): tiktok.com/@handle/video/{id}, instagram.com/reel/{id}/, youtube.com/shorts/{id}, x.com/handle/status/{id}, linkedin.com/feed/update/{id}/, facebook.com/reel/{id}.",
        },
        {
          nombre: "postId",
          tipo: "string",
          requerido: true,
          descripcion:
            "El id que devuelve la plataforma. Con él se leen las métricas después, no con la URL.",
        },
        {
          nombre: "publicadaEn",
          tipo: "string",
          requerido: true,
          descripcion:
            "Instante ISO en UTC. En la demo es `AHORA_AGENDA` (2026-09-13T12:20:00.000Z).",
        },
      ],
      ejemplo: {
        url: "https://youtube.com/shorts/74002636786015",
        postId: "74002636786015",
        publicadaEn: "2026-09-13T12:20:00.000Z",
      },
    },
    errores: [
      {
        codigo: "cuentaCaducada",
        http: 422,
        cuando:
          'No hay cuenta, o su conexión OAuth caducó. Se arregla reconectando (`PIDE_RECONECTAR`, lib/agenda.ts:141). Cuerpo: `{ code: "cuentaCaducada" }`.',
        frase: "calendario.fallo.cuentaCaducada",
        bloquea: true,
      },
      {
        codigo: "permisoDenegado",
        http: 422,
        cuando:
          "La cuenta no concedió permiso de PUBLICACIÓN (no basta el de leer seguidores). Se arregla reconectando.",
        frase: "calendario.fallo.permisoDenegado",
        bloquea: true,
      },
      {
        codigo: "rechazoRed",
        http: 422,
        cuando:
          "La plataforma rechazó el post (formato, duración, texto demasiado largo, post vacío…). Se reintenta.",
        frase: "calendario.fallo.rechazoRed",
        bloquea: true,
      },
      {
        codigo: "limiteApi",
        http: 422,
        cuando:
          "La plataforma no acepta más publicaciones por hoy en esa cuenta. Se reintenta.",
        frase: "calendario.fallo.limiteApi",
        bloquea: true,
      },
      {
        codigo: "sinRed",
        http: 422,
        cuando:
          "No se pudo llegar a la plataforma. Es también lo que guarda hoy el front ante cualquier error que no sea `PublicacionFallida`: sin conexión con el servidor de Clipealo, 401, 404, 409… (hooks/use-agenda.ts:172).",
        frase: "calendario.fallo.sinRed",
        bloquea: true,
      },
      NO_AUTORIZADO,
      NO_ENCONTRADO_ENTRADA,
      {
        codigo: "conflicto",
        http: 409,
        cuando:
          "La entrada ya está `publicando` o `publicada`, o está `cancelada`: no se manda dos veces.",
        frase: "common.errors.conflicto",
        bloquea: true,
      },
    ],
    reglas: [
      "Pedir OAuth con permiso de PUBLICACIÓN en cada plataforma, que no es el de leer seguidores; sin él, `permisoDenegado` (docs/costuras-backend.md:111).",
      "Comprobar que la entrada es de quien llama y que su `cuentaId` es una cuenta suya, viva (`handle` y estado `conectada`, `cuentaActiva`, lib/social.ts:133) y de la red de la entrada. Hoy la hoja del Calendario deja adelantar `age_s7`, cuya cuenta `cta_ig_ana` no está conectada, y la demo la da por publicada: sin cuenta viva, `cuentaCaducada`.",
      "Repetir la puerta de plan como `validarPublicacion` (lib/planes.ts:628): la red tiene que estar en las del escalón (Prueba solo TikTok) y la cuenta entre las `plan.cuentas` primeras por `connectedAt` de las redes del plan (1 en Prueba, 6 en Creador, 20 en Empresa). Se cuenta sobre las cuentas de dueño `clipero`: las de la agencia no gastan su cupo (lib/planes.ts:600). Lo que valida el navegador es cortesía, no seguridad.",
      "Volver a validar lo que la red rechazaría antes de gastar el intento: formato del clip en `SOCIAL_NETWORKS[red].aspects`, duración ≤ `maxSeconds` (lib/social.ts:39), título y texto dentro de `LIMITES_PUBLICACION` y que haya texto o título. Hoy la hoja del Calendario deja «Publicar ahora» sin mirar esos avisos.",
      "Marcar la entrada `publicando` y sumar `intentos` ANTES de salir, de forma atómica: dos procesos no pueden mandar el mismo clip dos veces (docs/costuras-backend.md:113).",
      "Al aceptar, guardar en la entrada `url`, `postId` y `publicadaEn` y pasarla a `publicada`. El `postId` es con lo que se leen las métricas después.",
      "Al fallar, pasar la entrada a `fallida` con el motivo como código `FalloPublicacion` (lib/agenda.ts:131) y devolver ese código en `{ code }`, nunca la frase de la plataforma: se enseña en tres idiomas (`calendario.fallo.*`).",
      "La misma cola despierta las entradas `planificada` de proveedor `clipealo` cuando llega su `programadaPara` y las manda por este mismo camino. Las de proveedor `manual` no se envían: se quedan en «Toca publicar».",
      "Una entrada `fallida` o `publicando` no vuelve nunca sola a `planificada`: podría haber salido, y saldría dos veces (lib/agenda.ts:1217).",
      "`publicadaEn` lo pone el servidor con su reloj.",
      "`pedir()` corta a los 15 s (lib/api/cliente.ts:25): si la plataforma tarda más, la entrada tiene que quedar en `publicando` y cerrarla la cola, no el navegador.",
      "Cerrar SIEMPRE lo que se quede en `publicando`: la hoja del Calendario no ofrece nada para una entrada en ese estado —ni reintentar ni «Ya la publiqué», que solo salen con `planificada` o `fallida` (components/agenda/detalle-sheet.tsx:482)—, así que si el navegador se cierra a mitad de un envío de la demo, esa entrada se queda «Publicándose» para siempre.",
    ],
    origen: "lib/api/publicaciones.ts:106",
  },
  {
    id: "publicar.obtener",
    area: "publicar",
    metodo: "GET",
    ruta: "/publicaciones/{entradaId}",
    resumen:
      "Lo que dejó la plataforma de una publicación ya enviada (enlace, id del post e instante), o `null` si todavía no ha salido.",
    descripcion:
      "Es `leerEstado(entradaId)` (lib/api/publicaciones.ts:136). Sin servidor devuelve siempre `null`. Hoy no la llama ninguna pantalla —solo tests/unit/publicaciones-api.test.ts—: según su comentario (lib/api/publicaciones.ts:131) existe para que Analíticas tenga por dónde entrar cuando haya servidor, y para que nadie invente la lectura en un componente. Ojo: la ruta `/publicaciones/{entradaId}` queda tomada por esta forma (`Publicado | null`); si la agenda necesita leer una entrada entera, que sea por otra ruta.",
    estado: "conectado",
    auth: "sesion",
    parametros: [ENTRADA_ID],
    respuesta: {
      tipo: "Publicado | null",
      definidoEn: "lib/api/publicaciones.ts:48",
      campos: [
        {
          nombre: "url",
          tipo: "string",
          requerido: true,
          descripcion: "El enlace del post en la red.",
        },
        {
          nombre: "postId",
          tipo: "string",
          requerido: true,
          descripcion: "El id que devolvió la plataforma.",
        },
        {
          nombre: "publicadaEn",
          tipo: "string",
          requerido: true,
          descripcion: "Instante ISO en UTC en que salió.",
        },
      ],
      ejemplo: {
        url: "https://www.tiktok.com/@clipealo/video/74001271906271",
        postId: "74001271906271",
        publicadaEn: "2026-09-13T12:20:00.000Z",
      },
    },
    errores: [NO_AUTORIZADO, NO_ENCONTRADO_ENTRADA],
    reglas: [
      "Devolver `null` (200 con cuerpo `null`) mientras la entrada no esté `publicada`: planificada, publicando, fallida o cancelada. No es un error. No un 204: con 204 `pedir()` devuelve `undefined`, no `null` (lib/api/cliente.ts:75).",
      "Responder con lo guardado en la entrada, no preguntando a la plataforma en cada visita: las plataformas limitan las peticiones (la misma regla que las métricas, docs/costuras-backend.md:46).",
      "Solo entradas de quien llama.",
    ],
    origen: "lib/api/publicaciones.ts:136",
  },
  {
    id: "publicar.leer-textos",
    area: "publicar",
    metodo: "GET",
    ruta: "/textos-publicacion",
    resumen:
      "Las plantillas por proyecto y red y los textos propios por clip y red de quien llama, de una vez.",
    descripcion:
      "Sustituye a leer `clipealo-publicacion-v1` (hooks/use-publicacion.ts:37). La app lo lee entero (`guardado`) y con él resuelve qué sale en cada red (`copiaEfectiva`), el punto «Con texto» de las pestañas, el texto que enseña el diálogo de publicar y lo que se copia. El texto propio de cada clip se escribe por las rutas del clip (`PUT`/`DELETE /jobs/{id}/clips/{clipId}/copias/{red}`, área «proyectos»); la plantilla, por `/jobs/{id}/plantillas/{red}`.",
    estado: "por-construir",
    auth: "sesion",
    respuesta: {
      tipo: "PublicacionGuardada",
      definidoEn: "lib/publicacion.ts:61",
      campos: [
        {
          nombre: "version",
          tipo: "number",
          requerido: true,
          descripcion: "`PUBLICACION_VERSION`, hoy 2.",
        },
        {
          nombre: "copias",
          tipo: "Record<string, CopiaPublicacion>",
          requerido: true,
          descripcion:
            "El texto propio de cada clip, con clave `<clipId>:<red>` (`claveCopia`).",
        },
        {
          nombre: "plantillas",
          tipo: "Record<string, CopiaPublicacion>",
          requerido: true,
          descripcion:
            "La plantilla de cada proyecto, con clave `<proyectoId>:<red>` (`clavePlantilla`). La heredan los clips sin texto propio.",
        },
      ],
      ejemplo: {
        version: 2,
        copias: { "clip_04:tiktok": EJEMPLO_COPIA_CLIP },
        plantillas: {
          "src_01:youtube": EJEMPLO_PLANTILLA_YT,
          "src_01:tiktok": {
            titulo: "",
            texto: "Del Podcast #42: cómo escalar un equipo remoto.",
            hashtags: ["#trabajoremoto", "#liderazgo"],
          },
        },
      },
    },
    errores: [NO_AUTORIZADO],
    reglas: [
      "Solo lo de quien llama: sus proyectos y sus clips.",
      "Devolverlo limpio, como `migrarPublicacion` (lib/publicacion.ts:257): fuera las claves con red desconocida y las copias vacías, hashtags normalizados. Si se importa lo que ya guardó el navegador, lo de la versión 1 (copias por proyecto) entra como plantillas, igual que hace esa función, para que nadie pierda lo que escribió.",
      "Los ids se conservan: `src_*` de proyectos y `clip_*` de clips, los mismos de las rutas.",
    ],
    origen: "hooks/use-publicacion.ts:37",
  },
  {
    id: "publicar.guardar-plantilla",
    area: "publicar",
    metodo: "PUT",
    ruta: "/jobs/{id}/plantillas/{red}",
    resumen: "Guarda la plantilla de un proyecto en una red: lo que heredan sus clips.",
    descripcion:
      "Sustituye a `guardarPlantilla(proyectoId, red, copia)` (hooks/use-publicacion.ts:110), que llama el panel de Operaciones › Publicación al teclear.",
    estado: "por-construir",
    auth: "sesion",
    parametros: [
      {
        nombre: "id",
        tipo: "string",
        requerido: true,
        en: "ruta",
        descripcion:
          "El proyecto (`SourceVideo.id`, el mismo de `/jobs/{id}`): p. ej. `src_01`. Es el `proyectoId` de `clavePlantilla`.",
      },
      RED,
    ],
    cuerpo: {
      tipo: "CopiaPublicacion",
      definidoEn: "lib/publicacion.ts:44",
      campos: CAMPOS_COPIA,
      ejemplo: EJEMPLO_PLANTILLA_YT,
    },
    respuesta: {
      tipo: "CopiaPublicacion",
      definidoEn: "lib/publicacion.ts:44",
      campos: CAMPOS_COPIA,
      ejemplo: EJEMPLO_PLANTILLA_YT,
    },
    errores: [
      NO_AUTORIZADO,
      {
        codigo: "no-encontrado",
        http: 404,
        cuando: "El proyecto no existe o la red no es una de las seis.",
        frase: "common.errors.no-encontrado",
        bloquea: true,
      },
    ],
    reglas: ["El proyecto tiene que ser de quien llama.", ...REGLAS_COPIA],
    origen: "hooks/use-publicacion.ts:110",
  },
  {
    id: "publicar.vaciar-plantilla",
    area: "publicar",
    metodo: "DELETE",
    ruta: "/jobs/{id}/plantillas/{red}",
    resumen: "Borra la plantilla de un proyecto en una red («Vaciar lo de {red}»).",
    descripcion:
      "Sustituye a `vaciarPlantilla(proyectoId, red)` (hooks/use-publicacion.ts:116). Responde 204 sin cuerpo: `pedir<void>` devuelve `undefined`.",
    estado: "por-construir",
    auth: "sesion",
    parametros: [
      {
        nombre: "id",
        tipo: "string",
        requerido: true,
        en: "ruta",
        descripcion:
          "El proyecto (`SourceVideo.id`, el mismo de `/jobs/{id}`): p. ej. `src_01`. Es el `proyectoId` de `clavePlantilla`.",
      },
      RED,
    ],
    respuesta: { tipo: "void" },
    errores: [
      NO_AUTORIZADO,
      {
        codigo: "no-encontrado",
        http: 404,
        cuando: "El proyecto no existe o la red no es una de las seis.",
        frase: "common.errors.no-encontrado",
        bloquea: true,
      },
    ],
    reglas: [
      "El proyecto tiene que ser de quien llama.",
      "Idempotente: borrar una plantilla que no existe también es 204.",
      "Solo borra la plantilla. Los clips que la heredaban se quedan sin texto en esa red (al publicarlos ahora sale su gancho); los que tienen texto propio y las entradas ya creadas no cambian.",
    ],
    origen: "hooks/use-publicacion.ts:116",
  },
]
