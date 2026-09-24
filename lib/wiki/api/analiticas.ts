import type { Endpoint } from "@/lib/wiki/tipos"

/**
 * Endpoints de «analiticas».
 *
 * Solo uno está conectado (`POST /analiticas/metricas`, `lib/api/analiticas.ts`).
 * El resto hoy lo resuelve el navegador: las semillas de `lib/analytics.ts`, la
 * agenda (`clipealo-agenda-v1`) y la curva simulada `metricasEn`, que según
 * `lib/analytics.ts` se sustituye con la API real por la lectura de las
 * instantáneas guardadas.
 */
export const ENDPOINTS: Endpoint[] = [
  {
    id: "analiticas.leer-metricas",
    area: "analiticas",
    metodo: "POST",
    ruta: "/analiticas/metricas",
    resumen:
      "Las cifras acumuladas (vistas, me gusta, comentarios, compartidos) de unas publicaciones en un instante.",
    descripcion:
      "Es la frontera de datos de las cifras (`leerMetricas`). Hoy la llama una sola pantalla: Campañas, que relee las vistas de cada envío publicado desde Clipealo con `leerVistas` (una publicación por llamada, `components/campanas/my-submissions.tsx:99`). Analíticas todavía no la llama —calcula en el navegador con `metricasEn`— y al conectarse tendrá que pedirla en varios instantes: el de la última actualización, el inicio del período, el inicio del período anterior y la actualización anterior. Sin `NEXT_PUBLIC_API_URL` se simula con la curva de `lib/analytics.ts`, que es determinista: la misma publicación en el mismo instante da siempre lo mismo.",
    estado: "conectado",
    auth: "sesion",
    cuerpo: {
      tipo: "{ ids: string[]; hasta: string }",
      definidoEn: "lib/api/analiticas.ts:35",
      campos: [
        {
          nombre: "ids",
          tipo: "string[]",
          requerido: true,
          descripcion:
            "Ids de publicación: `pub_01_tiktok` en lo ya indexado, el id de la entrada de agenda (`age_s8`) en lo que publicó Clipealo.",
        },
        {
          nombre: "hasta",
          tipo: "string",
          requerido: true,
          descripcion:
            "Instante ISO de la lectura. Por defecto, `INDEXADO_EN` (2026-09-13T12:20:00.000Z). Campañas pide el mayor entre ahora y `INDEXADO_EN` + 1 h.",
        },
      ],
      ejemplo: { ids: ["pub_01_tiktok", "age_s8"], hasta: "2026-09-13T12:20:00.000Z" },
    },
    respuesta: {
      tipo: "LecturaMetricas",
      definidoEn: "lib/api/analiticas.ts:19",
      campos: [
        {
          nombre: "[id]",
          tipo: "Metricas",
          requerido: false,
          descripcion:
            "Una entrada por publicación con lectura: `{ vistas, likes, comentarios, compartidos }` (`lib/analytics.ts:51`). Lo que no tiene lectura no aparece.",
        },
      ],
      ejemplo: {
        pub_01_tiktok: {
          vistas: 81200,
          likes: 5765,
          comentarios: 487,
          compartidos: 1137,
        },
        age_s8: { vistas: 2711, likes: 192, comentarios: 16, compartidos: 38 },
      },
    },
    errores: [
      {
        codigo: "no-autorizado",
        http: 401,
        cuando: "Sin sesión, o la sesión no vale (401/403).",
        frase: "common.errors.no-autorizado",
        bloquea: true,
      },
      {
        codigo: "limite",
        http: 429,
        cuando: "Demasiadas lecturas seguidas: hay que esperar.",
        frase: "common.errors.limite",
        bloquea: true,
      },
      {
        codigo: "servidor",
        http: 500,
        cuando: "Falla el servidor (5xx).",
        frase: "common.errors.servidor",
        bloquea: true,
      },
    ],
    reglas: [
      "Lee las instantáneas que guarda el proceso del servidor; nunca pregunta a la red en cada petición, porque cada plataforma limita cuántas veces se le pregunta.",
      "Devuelve las cifras acumuladas en `hasta`: la última instantánea en ese instante o antes. Las métricas son acumuladas y nunca bajan.",
      "Lo que no existe no aparece: un id sin lectura no va en la respuesta. No se devuelve un cero que nadie midió (`leerVistas` devuelve `undefined`, no 0).",
      "Solo publicaciones de la cuenta en sesión; un id ajeno se trata como uno que no existe.",
      "Repite el recorte del plan (`limitarAnaliticas`): con Prueba, solo TikTok y los 5 últimos clips. No choca con Campañas: participar es de Creador en adelante (`PLAN_MINIMO.participarCampanas`) y Creador no tiene recorte.",
      "El parámetro `pubs` de `leerMetricas` no viaja: solo sirve a la simulación.",
    ],
    origen: "lib/api/analiticas.ts:33",
  },
  {
    id: "analiticas.listar",
    area: "analiticas",
    metodo: "GET",
    ruta: "/analiticas/publicaciones",
    resumen:
      "Todo lo publicado e indexado de la cuenta: lo que ya se medía y lo que Clipealo ha publicado en sus cuentas.",
    descripcion:
      "Sustituye a `todasLasPublicaciones(entradas)`: hoy se juntan en el navegador las semillas de `lib/analytics.ts` (8 clips → 19 publicaciones) y cada entrada de la agenda en estado `publicada` con URL (`publicacionesDeAgenda`). Con la agenda de la demo son 20. Los campos `vistasHoy`, `tau` y `tasas` solo calibran la curva simulada (`metricasEn`); con servidor las cifras salen de `analiticas.leer-metricas`, `analiticas.leer-serie` y `analiticas.leer-curva`, así que la capa de cálculo de `lib/analytics.ts` tiene que leer de ahí en vez de la curva.",
    estado: "por-construir",
    auth: "sesion",
    respuesta: {
      tipo: "Publicacion[]",
      definidoEn: "lib/analytics.ts:58",
      campos: [
        {
          nombre: "id",
          tipo: "string",
          requerido: true,
          descripcion: "Id estable de la publicación.",
        },
        {
          nombre: "clipId",
          tipo: "string",
          requerido: false,
          descripcion:
            "Clip de la biblioteca, si sigue en ella. Sin él no hay «Ver el clip».",
        },
        {
          nombre: "proyectoId",
          tipo: "string",
          requerido: false,
          descripcion: "Proyecto del que salió (`src_01` en las semillas).",
        },
        {
          nombre: "cuentaId",
          tipo: "string",
          requerido: false,
          descripcion:
            "Cuenta por la que salió: con dos cuentas de la misma red es lo que las separa en la tabla.",
        },
        {
          nombre: "titulo",
          tipo: "string",
          requerido: true,
          descripcion: "Contenido de la persona: no se traduce.",
        },
        {
          nombre: "red",
          tipo: '"tiktok" | "instagram" | "youtube" | "x" | "linkedin" | "facebook"',
          requerido: true,
          descripcion: "`RedAnalitica`: son todas las redes del producto (`SOCIAL_IDS`).",
        },
        {
          nombre: "publicadoEn",
          tipo: "string",
          requerido: true,
          descripcion:
            "Instante ISO de publicación: en lo publicado desde Clipealo, `publicadaEn` de la entrada de agenda o, si falta, `programadaPara`.",
        },
        {
          nombre: "url",
          tipo: "string",
          requerido: true,
          descripcion: "Enlace del post en la red: lo abre «Abrir en {red}».",
        },
        {
          nombre: "postId",
          tipo: "string",
          requerido: false,
          descripcion:
            "Lo que devolvió la plataforma al publicar; con él se leen las métricas, no con la URL.",
        },
        {
          nombre: "retencion",
          tipo: "number",
          requerido: true,
          descripcion: "Porcentaje medio del clip que se ve.",
        },
        {
          nombre: "vistasHoy",
          tipo: "number",
          requerido: true,
          descripcion: "Solo simulación: vistas en `INDEXADO_EN`, calibra la curva.",
        },
        {
          nombre: "tau",
          tipo: "number",
          requerido: true,
          descripcion:
            "Solo simulación: días hasta estabilizarse (TikTok 2,2; YouTube 8).",
        },
        {
          nombre: "tasas",
          tipo: "{ likes: number; comentarios: number; compartidos: number }",
          requerido: true,
          descripcion:
            "Solo simulación: proporción de cada interacción sobre las vistas.",
        },
      ],
      ejemplo: [
        {
          id: "pub_01_tiktok",
          clipId: "clip_01",
          proyectoId: "src_01",
          titulo: "El error de contratar por zona horaria",
          red: "tiktok",
          publicadoEn: "2026-09-06T17:00:00.000Z",
          url: "https://www.tiktok.com/@clipealo/video/7335775943",
          retencion: 73,
          vistasHoy: 81200,
          tau: 2.48,
          tasas: { likes: 0.071, comentarios: 0.006, compartidos: 0.014 },
        },
        {
          id: "age_s8",
          clipId: "clip_02",
          proyectoId: "src_01",
          cuentaId: "cta_tk_ana",
          titulo: "La regla de las tres reuniones",
          red: "tiktok",
          publicadoEn: "2026-09-12T20:00:00.000Z",
          url: "https://www.tiktok.com/@cortes.ana/video/7409112233445566",
          retencion: 73,
          vistasHoy: 2711,
          tau: 2.428,
          tasas: { likes: 0.071, comentarios: 0.006, compartidos: 0.014 },
        },
      ],
    },
    errores: [
      {
        codigo: "no-autorizado",
        http: 401,
        cuando: "Sin sesión, o la sesión no vale.",
        frase: "common.errors.no-autorizado",
        bloquea: true,
      },
      {
        codigo: "servidor",
        http: 500,
        cuando: "Falla el servidor (5xx).",
        frase: "common.errors.servidor",
        bloquea: true,
      },
    ],
    reglas: [
      "Sale de la tabla que escribe la publicación (`lib/api/publicaciones.ts`): toda entrada `publicada` con URL entra sola, sin que nadie pegue un enlace. Lo que no ha salido (`planificada`, `publicando`, `fallida`, `cancelada`) no entra.",
      "Una publicación no se cuenta dos veces: las entradas de agenda que ya vienen de lo indexado (`age_pub_…`) no se vuelven a leer como publicaciones.",
      "Ordenada de la más reciente a la más antigua por `publicadoEn`.",
      "Devuelve también las que el plan deja fuera: la página cuenta cuántas quedan fuera restando lo visible del total (`components/app/analytics-dashboard.tsx:180`) y lo dice. Sus cifras no las dan las lecturas (`analiticas.leer-metricas`, `analiticas.leer-serie`, `analiticas.leer-curva`).",
      "Los ids se conservan (`pub_01_tiktok`, `age_s8`): los envíos a campaña guardan `publicacionId` y releen sus vistas con él.",
    ],
    origen: "lib/analytics.ts:284",
  },
  {
    id: "analiticas.leer-indice",
    area: "analiticas",
    metodo: "GET",
    ruta: "/analiticas/indice",
    resumen:
      "El instante de la última actualización de la cuenta y el de la anterior: de cuándo son las cifras que se enseñan.",
    descripcion:
      "Todo el panel se calcula para un único instante, `indexadoEn`, y compara con el anterior. Hoy son dos constantes: `INDEXADO_EN` (2026-09-13T12:20:00.000Z) y `ANTERIOR_INICIAL` (2026-09-12T20:05:00.000Z), y viven en el estado de la página, así que recargar las devuelve a esos valores.",
    estado: "por-construir",
    auth: "sesion",
    respuesta: {
      tipo: "{ indexadoEn: string; anterior: string | null }",
      definidoEn: "components/app/analytics-dashboard.tsx:182",
      campos: [
        {
          nombre: "indexadoEn",
          tipo: "string",
          requerido: true,
          descripcion:
            "Instante ISO de la última actualización: el sello «Actualizado el …».",
        },
        {
          nombre: "anterior",
          tipo: "string | null",
          requerido: true,
          descripcion:
            "La actualización anterior. Con `null`, la columna «Desde la última actualización» enseña «—» y nada lleva «Nuevo».",
        },
      ],
      ejemplo: {
        indexadoEn: "2026-09-13T12:20:00.000Z",
        anterior: "2026-09-12T20:05:00.000Z",
      },
    },
    errores: [
      {
        codigo: "no-autorizado",
        http: 401,
        cuando: "Sin sesión, o la sesión no vale.",
        frase: "common.errors.no-autorizado",
        bloquea: true,
      },
    ],
    reglas: [
      "Es por cuenta, no por publicación: todo lo que se pinta se calcula para ese instante, así que las gráficas no cambian mientras se leen.",
      "Se guarda en el servidor: la actualización tiene que sobrevivir a una recarga, cosa que hoy no pasa.",
    ],
    origen: "lib/analytics.ts:28",
  },
  {
    id: "analiticas.refrescar",
    area: "analiticas",
    metodo: "POST",
    ruta: "/analiticas/refrescar",
    resumen:
      "Pide a las redes una lectura nueva de lo publicado y mueve el índice de la cuenta a ese instante.",
    descripcion:
      "Es el botón «Refrescar». Hoy la página no llama a ninguna frontera: espera 1,4 s (`DURACION_REFRESCO_MS`), fija el nuevo instante en el mayor entre la hora del equipo y el índice + 1 h y recalcula con la curva. `lib/api/analiticas.ts` describe lo que tiene que hacer en producción: «Refrescar» pide una lectura nueva cuando la cuota lo permite.",
    estado: "por-construir",
    auth: "sesion",
    respuesta: {
      tipo: "{ indexadoEn: string; anterior: string | null }",
      definidoEn: "components/app/analytics-dashboard.tsx:182",
      campos: [
        {
          nombre: "indexadoEn",
          tipo: "string",
          requerido: true,
          descripcion: "El instante de la lectura nueva.",
        },
        {
          nombre: "anterior",
          tipo: "string | null",
          requerido: true,
          descripcion: "El índice que había antes de refrescar.",
        },
      ],
      ejemplo: {
        indexadoEn: "2026-09-13T13:20:00.000Z",
        anterior: "2026-09-13T12:20:00.000Z",
      },
    },
    errores: [
      {
        codigo: "limite",
        http: 429,
        cuando:
          "Se pide otra lectura antes de tiempo o la cuota de la plataforma no deja: hay que esperar. En el navegador lo evita la cuenta atrás de 30 s, pero el servidor no puede fiarse de ella.",
        frase: "common.errors.limite",
        bloquea: true,
      },
      {
        codigo: "no-autorizado",
        http: 401,
        cuando: "Sin sesión, o la sesión no vale.",
        frase: "common.errors.no-autorizado",
        bloquea: true,
      },
      {
        codigo: "servidor",
        http: 502,
        cuando: "Falla el servidor o no se pudo leer de las redes (5xx).",
        frase: "common.errors.servidor",
        bloquea: true,
      },
    ],
    reglas: [
      "Lee cada publicación con el `postId` que devolvió la plataforma al publicar, no con la URL.",
      "Guarda una instantánea por publicación con su instante: es lo que después leen `analiticas.leer-metricas`, `analiticas.leer-serie` y `analiticas.leer-curva`.",
      "Hace cumplir la espera entre refrescos en el servidor: la página deja 30 s (`ESPERA_ENTRE_REFRESCOS_S = 30`) porque las redes limitan cuántas veces se les pregunta. Si no toca, 429 (`limite`).",
      "El instante nuevo nunca es anterior al vigente: siempre hacia delante.",
      "El índice que había pasa a ser `anterior`: de él salen la columna «Desde la última actualización» y la etiqueta «Nuevo».",
      "Una publicación recién salida entra con cero y gana vistas en cada lectura, como una de verdad.",
    ],
    origen: "components/app/analytics-dashboard.tsx:213",
  },
  {
    id: "analiticas.leer-serie",
    area: "analiticas",
    metodo: "GET",
    ruta: "/analiticas/serie",
    resumen:
      "Las vistas ganadas desde el inicio del período, por red y por día: la gráfica «Crecimiento de vistas».",
    descripcion:
      "Sustituye a `serieCrecimiento(pubs, indexadoEn, periodo)`, que hoy se calcula en el navegador con la curva simulada. Es la serie que pinta `AnalyticsGrowthChart` y la tabla «Ver los datos como tabla». El ejemplo es el de 7 días con el plan Creador y la agenda de la demo.",
    estado: "por-construir",
    auth: "sesion",
    parametros: [
      {
        nombre: "periodo",
        tipo: "7 | 30 | 90",
        requerido: true,
        en: "consulta",
        descripcion: "Días del período (`PERIODOS`). Por defecto en la página, 30.",
      },
      {
        nombre: "red",
        tipo: '"tiktok" | "instagram" | "youtube" | "x" | "linkedin" | "facebook"',
        requerido: false,
        en: "consulta",
        descripcion: "Solo esa red. Sin ella, todas las que tienen publicaciones.",
      },
      {
        nombre: "hasta",
        tipo: "string",
        requerido: true,
        en: "consulta",
        descripcion: "Instante ISO de la actualización vigente (`indexadoEn`).",
      },
    ],
    respuesta: {
      tipo: "FilaSerie[]",
      definidoEn: "lib/analytics.ts:463",
      campos: [
        {
          nombre: "instante",
          tipo: "string",
          requerido: true,
          descripcion: "Instante ISO del punto.",
        },
        {
          nombre: "[red]",
          tipo: "number",
          requerido: false,
          descripcion:
            "Vistas ganadas por esa red desde el inicio del período hasta el instante.",
        },
      ],
      ejemplo: [
        {
          instante: "2026-09-06T12:20:00.000Z",
          tiktok: 0,
          instagram: 0,
          youtube: 0,
          linkedin: 0,
        },
        {
          instante: "2026-09-07T12:20:00.000Z",
          tiktok: 25212,
          instagram: 7001,
          youtube: 4143,
          linkedin: 109,
        },
        {
          instante: "2026-09-08T12:20:00.000Z",
          tiktok: 54671,
          instagram: 17567,
          youtube: 9190,
          linkedin: 1411,
        },
        {
          instante: "2026-09-09T12:20:00.000Z",
          tiktok: 76324,
          instagram: 29219,
          youtube: 13679,
          linkedin: 5488,
        },
        {
          instante: "2026-09-10T12:20:00.000Z",
          tiktok: 91483,
          instagram: 38431,
          youtube: 17678,
          linkedin: 9331,
        },
        {
          instante: "2026-09-11T12:20:00.000Z",
          tiktok: 102282,
          instagram: 45522,
          youtube: 21249,
          linkedin: 12372,
        },
        {
          instante: "2026-09-12T12:20:00.000Z",
          tiktok: 110145,
          instagram: 51008,
          youtube: 24441,
          linkedin: 14790,
        },
        {
          instante: "2026-09-13T12:20:00.000Z",
          tiktok: 118733,
          instagram: 55284,
          youtube: 27303,
          linkedin: 16722,
        },
      ],
    },
    errores: [
      {
        codigo: "no-autorizado",
        http: 401,
        cuando: "Sin sesión, o la sesión no vale.",
        frase: "common.errors.no-autorizado",
        bloquea: true,
      },
      {
        codigo: "desconocido",
        http: 400,
        cuando:
          "`periodo` no es 7, 30 ni 90, o `red` no es una red del producto. El front solo manda valores válidos (`PERIODOS`, `FILTRO_RED`); un 400 se enseña como «algo ha fallado».",
        frase: "common.errors.desconocido",
        bloquea: true,
      },
    ],
    reglas: [
      "`periodo` + 1 puntos: el inicio del período, uno al cierre de cada día y el último exactamente en `hasta` (8 puntos con 7 días, 31 con 30, 91 con 90).",
      "Cada valor es lo ganado desde el inicio del período, no lo acumulado desde que se publicó: el primer punto vale 0 en todas las redes.",
      "Solo lleva las redes que tienen alguna publicación; una red sin publicaciones no aparece ni con ceros.",
      "Repite el recorte del plan (`limitarAnaliticas`) antes de sumar: la gráfica, las tarjetas, las barras y la tabla tienen que contar lo mismo.",
    ],
    origen: "lib/analytics.ts:469",
  },
  {
    id: "analiticas.leer-curva",
    area: "analiticas",
    metodo: "GET",
    ruta: "/analiticas/publicaciones/{id}/curva",
    resumen:
      "Las vistas acumuladas de una publicación, día a día, desde que se publicó hasta la última actualización.",
    descripcion:
      "Sustituye a `curvaPublicacion(pub, indexadoEn)`: es la gráfica «Vistas acumuladas desde que se publicó» del detalle de una publicación. El ejemplo es el de `pub_01_tiktok` en `INDEXADO_EN`.",
    estado: "por-construir",
    auth: "sesion",
    parametros: [
      {
        nombre: "id",
        tipo: "string",
        requerido: true,
        en: "ruta",
        descripcion: "Id de la publicación (`pub_01_tiktok`, `age_s8`).",
      },
      {
        nombre: "hasta",
        tipo: "string",
        requerido: true,
        en: "consulta",
        descripcion: "Instante ISO de la actualización vigente (`indexadoEn`).",
      },
    ],
    respuesta: {
      tipo: "{ instante: string; vistas: number }[]",
      definidoEn: "lib/analytics.ts:563",
      campos: [
        {
          nombre: "instante",
          tipo: "string",
          requerido: true,
          descripcion: "Instante ISO del punto.",
        },
        {
          nombre: "vistas",
          tipo: "number",
          requerido: true,
          descripcion: "Vistas acumuladas en ese instante.",
        },
      ],
      ejemplo: [
        { instante: "2026-09-06T17:00:00.000Z", vistas: 0 },
        { instante: "2026-09-07T17:00:00.000Z", vistas: 27770 },
        { instante: "2026-09-08T17:00:00.000Z", vistas: 46598 },
        { instante: "2026-09-09T17:00:00.000Z", vistas: 59434 },
        { instante: "2026-09-10T17:00:00.000Z", vistas: 68248 },
        { instante: "2026-09-11T17:00:00.000Z", vistas: 74360 },
        { instante: "2026-09-12T17:00:00.000Z", vistas: 78654 },
        { instante: "2026-09-13T12:20:00.000Z", vistas: 81200 },
      ],
    },
    errores: [
      {
        codigo: "no-encontrado",
        http: 404,
        cuando: "La publicación no existe, no es de la cuenta o el plan la deja fuera.",
        frase: "common.errors.no-encontrado",
        bloquea: true,
      },
      {
        codigo: "no-autorizado",
        http: 401,
        cuando: "Sin sesión, o la sesión no vale.",
        frase: "common.errors.no-autorizado",
        bloquea: true,
      },
    ],
    reglas: [
      "Un punto al día desde `publicadoEn` y el último exactamente en `hasta`; como mínimo dos puntos (el de la publicación y el de la actualización).",
      "Vistas acumuladas: el primer punto es 0 y ninguno baja respecto al anterior.",
      "Solo publicaciones de la cuenta en sesión y dentro de lo que su plan deja medir.",
    ],
    origen: "lib/analytics.ts:563",
  },
  {
    id: "analiticas.leer-semana",
    area: "analiticas",
    metodo: "GET",
    ruta: "/analiticas/semana",
    resumen:
      "Reproducciones y clips publicados por día de la semana: la tarjeta «Reproducciones esta semana» del Resumen.",
    descripcion:
      "Hoy es una semilla fija (`weeklyViews`): 174.300 reproducciones y 32 clips en la semana, que no salen de las publicaciones de Analíticas. Al conectarla, el Resumen y Analíticas tienen que contar lo mismo.",
    estado: "por-construir",
    auth: "sesion",
    respuesta: {
      tipo: "{ day: Weekday; views: number; clips: number }[]",
      definidoEn: "lib/mock-data.ts:505",
      campos: [
        {
          nombre: "day",
          tipo: '"lun" | "mar" | "mie" | "jue" | "vie" | "sab" | "dom"',
          requerido: true,
          descripcion:
            "`Weekday`: la clave del día; la etiqueta sale de `app.viewsChart.days`.",
        },
        {
          nombre: "views",
          tipo: "number",
          requerido: true,
          descripcion: "Reproducciones de ese día.",
        },
        {
          nombre: "clips",
          tipo: "number",
          requerido: true,
          descripcion:
            "Clips publicados ese día: va en el tooltip y en la tabla, nunca en un segundo eje.",
        },
      ],
      ejemplo: [
        { day: "lun", views: 12400, clips: 3 },
        { day: "mar", views: 18900, clips: 5 },
        { day: "mie", views: 15200, clips: 4 },
        { day: "jue", views: 27600, clips: 6 },
        { day: "vie", views: 41300, clips: 8 },
        { day: "sab", views: 36800, clips: 4 },
        { day: "dom", views: 22100, clips: 2 },
      ],
    },
    errores: [
      {
        codigo: "no-autorizado",
        http: 401,
        cuando: "Sin sesión, o la sesión no vale.",
        frase: "common.errors.no-autorizado",
        bloquea: true,
      },
    ],
    reglas: [
      "Siete filas, de lunes a domingo y en ese orden: la gráfica pinta las barras tal cual llegan.",
      "Sale de las mismas instantáneas que Analíticas y con el mismo recorte del plan: si no, el Resumen enseñaría a Prueba cifras que Analíticas le recorta.",
    ],
    origen: "lib/mock-data.ts:505",
  },
]
