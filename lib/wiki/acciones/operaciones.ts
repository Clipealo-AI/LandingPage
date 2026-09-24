import type { Accion, ErrorDoc } from "@/lib/wiki/tipos"

/**
 * Acciones de «operaciones».
 *
 * Operaciones es la suite de herramientas del clipero sobre sus videos, sin
 * pasar por el análisis: un centro (/operaciones) con una tarjeta por
 * herramienta y cada herramienta en su página. Recortar, Reducir tamaño y
 * Variantes son trabajos de la cola (`POST /jobs` con `operacion`); Derechos
 * enseña la licencia de cada campaña y lleva la lista blanca. Publicación
 * (la plantilla de texto de un proyecto) está documentada en «publicar».
 *
 * Lo que NO hay, a propósito, y por eso no sale aquí: ninguna operación que
 * altere un video para que una plataforma no lo reconozca («cambio de
 * huella»). Está escrito en lib/operaciones.ts:16.
 */

/* ---------------------------------------------------------------------------
   Piezas que se repiten
   --------------------------------------------------------------------------- */

/** El plan de las tres herramientas que encargan trabajos. */
const planOperaciones = (motivo: string): Accion["plan"] => ({
  minimo: "creator",
  nota: `Piden la capacidad \`operaciones\`, de Creador en adelante (\`PLAN_MINIMO.operaciones\`, lib/pricing.ts:80); un plan creado en el backoffice la tiene si la incluye en sus capacidades (\`planPermite\`, lib/pricing.ts:100). En Prueba la herramienta se abre y se rellena entera, pero el botón de encargar está apagado y debajo se lee «${motivo}» con el enlace «Ver los planes» (/precios). Nunca se esconde lo que se vende.`,
})

const DATOS_TRABAJOS =
  "La lista de proyectos y el alta van por la frontera `lib/api/jobs.ts` (`listJobs`, `createJob`), que con `NEXT_PUBLIC_API_URL` ya pide `GET /jobs` y `POST /jobs`. Sin servidor, los trabajos viven en un `Map` en memoria sembrado con `sourceVideos` (lib/api/jobs.ts:66), sin persistir: el alta se hace en el navegador y se pierde al recargar. La simulación avanza 1,6 puntos de progreso por segundo (lib/api/jobs.ts:54) sin distinguir una operación de un análisis: pasa por las mismas etapas y al acabar le pone 8 clips (lib/api/jobs.ts:89). El plan sale del navegador (`clipealo-plan-v1`, lib/pricing.ts:131, hooks/use-plan.ts)."

const DATOS_DERECHOS =
  "Almacén del navegador `clipealo-campanas-v1` (hooks/use-campanas.ts:130): campañas (semillas de lib/campanas.ts más las creadas), participaciones (semillas de lib/participacion.ts:676 más las nuevas) y `solicitudesListaBlanca`, que nace vacío: no hay solicitudes semilla (hooks/use-campanas.ts:146). La licencia va dentro de cada campaña (`Campana.licencia`). Se sincroniza entre pestañas con el evento `storage`. Las cuentas conectadas salen de otro almacén, `clipealo-cuentas-v1` (hooks/use-cuentas-sociales.ts:27). No hay frontera en `lib/api/`."

/** Los estados de un trabajo encargado, igual que cualquier proyecto (`JobStatus`, lib/types.ts:36). */
const ESTADOS_TRABAJO = [
  {
    estado: "en-cola",
    significa:
      "Así nace el trabajo en la simulación: etapa «subiendo», progreso 0 y 0 clips (lib/api/jobs.ts:152). Mientras siga «en-cola» o «procesando», /proyectos vuelve a preguntar cada 2 s (`POLL_MS`, hooks/use-jobs.ts:23).",
  },
  {
    estado: "procesando",
    significa: "El pipeline lo está haciendo; la barra de Proyectos enseña el progreso.",
  },
  {
    estado: "listo",
    significa:
      "Terminado. Sale en Proyectos con la etiqueta de su operación («Recortar», «Reducir tamaño» o «Variante», components/app/projects-list.tsx:57). No se le puede aplicar otra operación, pero sí escribirle la plantilla de Publicación, que no filtra las operaciones (components/app/publicacion-panel.tsx:53).",
  },
  {
    estado: "error",
    significa:
      "Falló. Se reintenta desde Proyectos, como cualquier proyecto. La simulación nunca lleva ahí un trabajo nuevo.",
  },
]

/**
 * Lo que pasa si el alta del trabajo falla: solo con servidor, porque la
 * simulación no falla. El aviso lo pone el hook (hooks/use-jobs.ts:76).
 */
const ERRORES_ALTA: ErrorDoc[] = [
  {
    codigo: "no-autorizado",
    cuando:
      "El servidor rechaza el alta por sesión o por plan (401/403). Aviso de error «No se ha podido crear el proyecto» con el motivo «Tu sesión no vale para esto. Vuelve a entrar.»; la persona se queda en la página.",
    frase: "common.errors.no-autorizado",
    bloquea: true,
  },
  {
    codigo: "conflicto",
    cuando:
      "El servidor responde 409 o 422, p. ej. porque no acepta los parámetros aunque el navegador los diera por buenos. Mismo aviso, con «Alguien lo cambió antes que tú. Vuelve a cargar y mira cómo quedó.»: hoy `pedir()` solo traduce el estado HTTP, no un código del cuerpo (lib/api/cliente.ts:72), así que un «recorteCorto» del servidor se leería así.",
    frase: "common.errors.conflicto",
    bloquea: true,
  },
  {
    codigo: "limite",
    cuando:
      "429. Mismo aviso, con «Demasiadas peticiones seguidas. Espera unos segundos.».",
    frase: "common.errors.limite",
    bloquea: true,
  },
  {
    codigo: "servidor",
    cuando:
      "Cualquier 5xx. Mismo aviso, con «Se ha roto por nuestro lado. Ya lo estamos mirando.».",
    frase: "common.errors.servidor",
    bloquea: true,
  },
  {
    codigo: "sin-red",
    cuando:
      "`fetch` no llegó a salir (sin red). Mismo aviso, con «No hay conexión. Comprueba tu red y vuelve a intentarlo.».",
    frase: "common.errors.sin-red",
    bloquea: true,
  },
  {
    codigo: "desconocido",
    cuando:
      "Cualquier otro fallo, también el corte a los 15 s (`ESPERA_MS`, lib/api/cliente.ts:25): `AbortSignal.timeout` rechaza con un `DOMException`, que `codigoDeError` no toma por falta de red (lib/api/errores.ts:60). Mismo aviso, con «Algo ha fallado. Vuelve a intentarlo.».",
    frase: "common.errors.desconocido",
    bloquea: true,
  },
]

const PASO_SIN_VIDEOS =
  "Sin ningún proyecto listo, la página solo dice «Todavía no tienes ningún proyecto: sube un video y vuelve.» con el botón «Subir un video» (/subir)."

const PASO_VIDEO_ELEGIDO =
  "Al entrar sale elegido el primero de la lista. En la simulación la lista va de lo más reciente a lo más antiguo (lib/api/jobs.ts:103): recién arrancada la demo es «Podcast #42 — Cómo escalar un equipo remoto», y en cuanto la simulación termina «Directo — Preguntas y respuestas de septiembre» y «Masterclass — Estructura narrativa en 20 minutos», pasan ellos delante."

const REGLA_LISTOS =
  "Solo se ofrecen proyectos en estado «listo» que no sean ya una operación (`!p.operacion`, components/app/operaciones-panel.tsx:84): no se opera un video a medio procesar ni el resultado de otra operación."

const REGLA_SIN_HUELLA =
  "Ninguna operación altera el archivo para que una plataforma no lo reconozca: no existe ese parámetro y el servidor no debe aceptar ninguno parecido (lib/operaciones.ts:16)."

const REGLA_FALLO_SIN_CAPTURAR =
  "Si el alta falla, el aviso lo pone el `onError` del hook (hooks/use-jobs.ts:76). El panel no captura el rechazo de `mutateAsync`: no navega, pero la promesa queda rechazada sin manejar."

/** Las frases de lista blanca no llegan a verse: el botón nace apagado con cualquier bloqueo. */
const NO_SE_VE =
  "Hoy no se ve la frase: con cualquier bloqueo el botón nace apagado y no llega a intentarse (components/app/derechos-panel.tsx:278)."

/* ---------------------------------------------------------------------------
   Acciones
   --------------------------------------------------------------------------- */

export const ACCIONES: Accion[] = [
  /* --- El centro -------------------------------------------------------- */
  {
    id: "operaciones.abrir-herramienta",
    area: "operaciones",
    titulo: "Abrir una herramienta de Operaciones",
    resumen:
      "Ver de un vistazo las cinco herramientas sobre tus videos, qué plan pide cada una, y entrar en la que necesitas.",
    quien: ["clipero", "agencia"],
    donde: [{ ruta: "/operaciones", etiqueta: "Operaciones" }],
    pasos: [
      "Abre «Operaciones» en la barra lateral (grupo «Trabajo»). Bajo el título «Operaciones» se lee «Una suite de herramientas para trabajar tus videos sin pasar por el análisis. Cada una es su página; lo que encargas entra en Proyectos como un trabajo más.».",
      "Mira las cinco tarjetas: «Recortar», «Reducir tamaño», «Variantes», «Publicación» y «Derechos», cada una con su descripción.",
      "Arriba a la derecha de cada tarjeta, su plan: «Del plan Creador en adelante» (con candado si tu plan no llega) o «En todos los planes».",
      "Pulsa «Abrir» en la que quieras: te lleva a /operaciones/recortar, /operaciones/reducir, /operaciones/variantes, /operaciones/publicacion o /operaciones/derechos.",
      "Dentro, las migas «Proyectos › Operaciones › <herramienta>» te devuelven al centro.",
    ],
    reglas: [
      "Las herramientas son `HERRAMIENTAS` (lib/operaciones.ts:30), en ese orden. Cada una es su página, /operaciones/<id>, con el mismo marco (`HerramientaPage`): migas hasta el centro, cabecera con su título y su descripción, y el contenido.",
      "Recortar, Reducir tamaño y Variantes piden la capacidad `operaciones` (`HERRAMIENTA_CAPACIDAD`, lib/operaciones.ts:40), que abre desde Creador (`PLAN_MINIMO.operaciones`, lib/pricing.ts:80). Publicación y Derechos no piden nada: son de todos los planes.",
      "Una herramienta de un plan superior se ve entera y se abre igual: la tarjeta lleva el candado y un fondo apagado, y dentro el botón de encargar está apagado con su motivo. Nunca se esconde lo que se vende (components/app/operaciones-hub.tsx:49).",
      "El nombre del plan de la etiqueta sale del catálogo de planes (en la web, «Creador»), no está escrito en la tarjeta.",
      "La fila «Recortar y reducir tamaño» de la comparativa de /precios (clave `operaciones`) dice lo mismo: no en Prueba, sí en Creador y Empresa (lib/pricing.ts:357). Su texto no nombra Variantes, que también pide esa capacidad.",
      "No hay ninguna herramienta de «cambio de huella» (alterar un video para que la plataforma no lo reconozca): se decidió no construirla porque sirve para esquivar el Content ID y pone en riesgo las cuentas. Lo que cubre esa necesidad son las variantes, la licencia con lista blanca y los metadatos de publicación (lib/operaciones.ts:16).",
    ],
    endpoints: ["planes.obtener-suscripcion", "planes.listar"],
    datos:
      "Estático salvo el plan: la lista de herramientas vive en el código (lib/operaciones.ts:30) y el plan sale del navegador (`clipealo-plan-v1`, hooks/use-plan.ts), resuelto contra el catálogo de planes.",
    respuesta:
      "Ninguna: «Abrir» es navegación y no suena (AGENTS.md, regla 7). Si se cambia el plan desde el menú de usuario («Plan · demo»), los candados cambian al vuelo, sin recargar.",
    origen: [
      "components/app/operaciones-hub.tsx:52",
      "components/app/operaciones-hub.tsx:38",
      "lib/operaciones.ts:30",
      "lib/operaciones.ts:40",
      "app/[locale]/(app)/operaciones/page.tsx:26",
      "components/app/herramienta-page.tsx:26",
    ],
    relacionadas: [
      "operaciones.recortar-video",
      "operaciones.reducir-tamano",
      "operaciones.encargar-variantes",
      "operaciones.consultar-derechos",
      "publicar.editar-plantilla-proyecto",
    ],
  },

  /* --- Trabajos de la cola --------------------------------------------- */
  {
    id: "operaciones.recortar-video",
    area: "operaciones",
    titulo: "Recortar un tramo de un video",
    resumen:
      "Quedarte con un tramo de uno de tus proyectos, tal cual, sin análisis ni reencuadre: entra en Proyectos como un trabajo más.",
    quien: ["clipero", "agencia"],
    plan: planOperaciones("Recortar es del plan Creador en adelante."),
    donde: [{ ruta: "/operaciones/recortar", etiqueta: "Operaciones › Recortar" }],
    pasos: [
      "En Operaciones, pulsa «Abrir» en «Recortar».",
      "En «Video», elige uno de tus proyectos. Cada opción dice título · duración · peso, p. ej. «Podcast #42 — Cómo escalar un equipo remoto · 1:20:12 · 2,5 GB».",
      PASO_VIDEO_ELEGIDO,
      "Escribe el tramo en «Desde (segundos)» y «Hasta (segundos)». Al elegir un video el tramo nace abarcándolo entero, de 0 a su duración: se acota desde ahí.",
      "Debajo se lee lo que queda, p. ej. «Quedan 0:45 de 1:20:12.» con Desde 754 y Hasta 799.",
      "Pulsa «Encargar».",
      "La app te lleva a /proyectos: el trabajo sale arriba con la etiqueta «Recortar» y su progreso.",
      PASO_SIN_VIDEOS,
    ],
    reglas: [
      "El final va después del inicio (`recorteInvertido`) y el tramo dura al menos 1 segundo (`LIMITES_OPERACION.recorteMinSeg`, lib/operaciones.ts:224).",
      "El tramo no se sale del video: «Desde» ≥ 0 y «Hasta» ≤ la duración del video en segundos (`recorteFuera`, lib/operaciones.ts:255).",
      "Los fallos se enseñan bajo los campos a partir del primer intento de encargar. «Encargar» no se apaga por ellos: solo por el plan o mientras se crea el trabajo (components/app/operaciones-panel.tsx:243).",
      "«Quedan … de …» es aritmética sobre lo que ya se sabe del video (`duracionRecortada` = fin − inicio, lib/operaciones.ts:268); solo se enseña si no hay nada que bloquee.",
      REGLA_LISTOS,
      "El trabajo se llama como el video más el tramo en m:ss: «Podcast #42 — Cómo escalar un equipo remoto · 12:34–13:19» (`tituloOperado`, lib/operaciones.ts:275). Los minutos no se parten en horas: el segundo 4.812 se escribe «80:12».",
      'Viaja con la duración del tramo, el peso del original (no se estima), el idioma del original, `sourceUrl` = el `src` del video y `operacion: { operacion: "recortar", recorte: { inicio, fin } }` (components/app/operaciones-panel.tsx:119).',
      "El servidor tiene que repetir estas comprobaciones al recibir `POST /jobs` con `operacion`: capacidad del plan, tramo de al menos 1 s y dentro del video. Ojo: el cuerpo no lleva el id del proyecto de origen sino su `sourceUrl`, y las semillas no tienen `src`, así que hoy llega vacío; el servidor tendrá que resolver el archivo por esa dirección y medir su duración.",
      "Nada de análisis ni reencuadre: el servidor ejecuta la operación en vez de analizar (docs/costuras-backend.md:43).",
      REGLA_FALLO_SIN_CAPTURAR,
      REGLA_SIN_HUELLA,
    ],
    estados: ESTADOS_TRABAJO,
    errores: [
      {
        codigo: "sinVideo",
        cuando:
          "No hay ningún video elegido. La pantalla no enseña esta frase: solo lista los errores del tramo. En la práctica no pasa, porque el selector nace con el primer proyecto listo.",
        frase: "app.operaciones.errors.sinVideo",
        bloquea: true,
      },
      {
        codigo: "recorteInvertido",
        cuando: "«Hasta» es igual o anterior a «Desde».",
        frase: "app.operaciones.errors.recorteInvertido",
        bloquea: true,
      },
      {
        codigo: "recorteCorto",
        cuando:
          "El tramo dura más de 0 y menos de 1 s (solo con decimales): «Un recorte necesita al menos 1 segundo.».",
        frase: "app.operaciones.errors.recorteCorto",
        bloquea: true,
      },
      {
        codigo: "recorteFuera",
        cuando:
          "«Desde» es negativo o «Hasta» pasa de la duración: «El tramo se sale del video: va de 0 a 4812 segundos.» (con el Podcast #42).",
        frase: "app.operaciones.errors.recorteFuera",
        bloquea: true,
      },
      ...ERRORES_ALTA,
    ],
    endpoints: [
      "proyectos.listar",
      "proyectos.crear",
      "planes.obtener-suscripcion",
      "planes.listar",
    ],
    datos: DATOS_TRABAJOS,
    respuesta:
      "«Encargar» es el botón de marca de la vista: suena «pop» y se encuadra con la marca de recorte al pulsarlo. Con el trabajo creado, `toast.success` «Operación encargada» — «Sale en Proyectos con su progreso; el análisis no se toca.» (sonido de éxito) y salto a /proyectos, donde el trabajo ya está sin esperar al siguiente sondeo. Si el alta falla, `toast.error` «No se ha podido crear el proyecto» con el motivo de `common.errors` (sonido de error y sacudida del aviso) y la persona se queda en la página.",
    origen: [
      "components/app/operaciones-panel.tsx:115",
      "components/app/operaciones-panel.tsx:84",
      "lib/operaciones.ts:240",
      "lib/operaciones.ts:222",
      "lib/operaciones.ts:275",
      "hooks/use-jobs.ts:63",
      "lib/api/jobs.ts:139",
      "app/[locale]/(app)/operaciones/recortar/page.tsx:14",
    ],
    relacionadas: [
      "operaciones.reducir-tamano",
      "operaciones.encargar-variantes",
      "operaciones.abrir-herramienta",
    ],
  },
  {
    id: "operaciones.reducir-tamano",
    area: "operaciones",
    titulo: "Reducir el tamaño de un video",
    resumen:
      "Encargar el mismo video con menos peso, eligiendo cuánto sacrificar: entra en Proyectos como un trabajo más.",
    quien: ["clipero", "agencia"],
    plan: planOperaciones("Reducir tamaño es del plan Creador en adelante."),
    donde: [{ ruta: "/operaciones/reducir", etiqueta: "Operaciones › Reducir tamaño" }],
    pasos: [
      "En Operaciones, pulsa «Abrir» en «Reducir tamaño».",
      "En «Video», elige el proyecto (título · duración · peso).",
      PASO_VIDEO_ELEGIDO,
      "En «Calidad», elige una: «Ligera · pesa un 30 % menos», «Equilibrada · la mitad» (la marcada al entrar) o «Máxima · una cuarta parte».",
      "Debajo se lee la estimación, p. ej. con «Webinar — Poner precio sin pedir perdón» y Equilibrada: «Pesaría unos 457,8 MB, de 915,5 MB. La cifra real la da el procesado.».",
      "Pulsa «Encargar».",
      "La app te lleva a /proyectos: el trabajo sale arriba con la etiqueta «Reducir tamaño».",
      PASO_SIN_VIDEOS,
    ],
    reglas: [
      "Factores aproximados sobre el peso original (`REDUCCION_APROX`, lib/operaciones.ts:63): ligera × 0,7 · equilibrada × 0,5 · máxima × 0,25. Solo sirven para decirlo antes de encargar: el peso real lo da el procesado y el servidor tiene que devolverlo en `sizeBytes`.",
      'El trabajo viaja con el peso estimado (`tamanoAprox`, redondeado al byte, lib/operaciones.ts:271), la duración entera del original, su idioma, su `sourceUrl` y `operacion: { operacion: "reducir", calidad }` (components/app/operaciones-panel.tsx:127).',
      "Se llama como el video más el id de la calidad, en minúscula y sin traducir: «Webinar — Poner precio sin pedir perdón · equilibrada» (lib/operaciones.ts:278).",
      "La calidad no tiene validación propia: lo único que bloquea es no tener video (`validarOperacion` solo mira el tramo al recortar, lib/operaciones.ts:240).",
      REGLA_LISTOS,
      "El servidor tiene que repetir la capacidad del plan y aceptar solo una de las tres calidades (`CALIDADES`, lib/operaciones.ts:56). Mismo aviso que al recortar: el origen llega por `sourceUrl`, no por id.",
      REGLA_FALLO_SIN_CAPTURAR,
      REGLA_SIN_HUELLA,
    ],
    estados: ESTADOS_TRABAJO,
    errores: [
      {
        codigo: "sinVideo",
        cuando:
          "No hay ningún video elegido. Bloquea sin decirlo: esta vista no enseña ninguna frase de error. En la práctica no pasa, porque el selector nace con el primer proyecto listo.",
        frase: "app.operaciones.errors.sinVideo",
        bloquea: true,
      },
      ...ERRORES_ALTA,
    ],
    endpoints: [
      "proyectos.listar",
      "proyectos.crear",
      "planes.obtener-suscripcion",
      "planes.listar",
    ],
    datos: DATOS_TRABAJOS,
    respuesta:
      'Cada calidad suena «tap» al pulsarla (`data-sound="tap"`). «Encargar» es el botón de marca: «pop» y marca de recorte. Con el trabajo creado, `toast.success` «Operación encargada» — «Sale en Proyectos con su progreso; el análisis no se toca.» y salto a /proyectos. Si falla, `toast.error` «No se ha podido crear el proyecto» con su motivo (sonido de error y sacudida).',
    origen: [
      "components/app/operaciones-panel.tsx:211",
      "components/app/operaciones-panel.tsx:127",
      "lib/operaciones.ts:63",
      "lib/operaciones.ts:271",
      "lib/operaciones.ts:278",
      "app/[locale]/(app)/operaciones/reducir/page.tsx:14",
    ],
    relacionadas: ["operaciones.recortar-video", "operaciones.abrir-herramienta"],
  },
  {
    id: "operaciones.encargar-variantes",
    area: "operaciones",
    titulo: "Encargar variantes de un clip",
    resumen:
      "Sacar de un video varias versiones que son contenido distinto —otro gancho, otra duración, otro formato, otros subtítulos, otra portada—, cada una como un trabajo de la cola.",
    quien: ["clipero", "agencia"],
    plan: planOperaciones("Variantes es del plan Creador en adelante."),
    donde: [{ ruta: "/operaciones/variantes", etiqueta: "Operaciones › Variantes" }],
    pasos: [
      "En Operaciones, pulsa «Abrir» en «Variantes».",
      "En «Video», elige el proyecto (título · duración · peso).",
      PASO_VIDEO_ELEGIDO,
      "En «Ganchos» («Segundo en el que empieza cada versión. Hasta 4; los propuestos reparten el video.») vienen tres propuestos, al 10 %, 40 % y 70 % del video: con el Podcast #42 (4.812 s), 481, 1924 y 3368. Cambia cualquiera en su campo (sin etiqueta visible; se anuncia como «Gancho N (segundos)»), añade otro con «Añadir un gancho» (con tres, el nuevo cae al 85 % del video) o quítalo con la ✕ («Quitar el gancho N»).",
      "En «Duraciones» marca una o varias: 15 s, 30 s, 45 s, 60 s (entra marcada 30 s).",
      "En «Formatos» marca uno o varios: 9:16, 1:1, 4:5, 16:9 (entra 9:16). La ayuda dice para qué red va cada uno.",
      "En «Subtítulos» marca uno o varios estilos: «Sin subtítulos», «Limpios», «Karaoke», «En caja» (entra «Limpios»).",
      "Elige el «Idioma de los subtítulos» (español, inglés o portugués, nombrados en el idioma de la interfaz; entra español) y deja o quita «Portada en el fotograma del gancho» (activado al entrar).",
      "Revisa «Lo que se va a encargar»: V1, V2… con gancho · duración · formato · subtítulos, p. ej. «V1 8:01 · 30 s · 9:16 · Limpios», y el total («3 variantes»).",
      "Pulsa «Encargar 3 variantes». El número es el total con un tope de 12 en la etiqueta: con 48 combinaciones dice «Encargar 12 variantes» (y bloquea), y sin ninguna, «Encargar 1 variante».",
      "La app te lleva a /proyectos: cada variante sale con la etiqueta «Variante» y su progreso.",
      PASO_SIN_VIDEOS,
    ],
    reglas: [
      "Cada combinación de gancho × duración × formato × subtítulos es una variante, en ese orden (`combinarVariantes`, lib/operaciones.ts:141). El idioma y la portada son uno para todas.",
      "Como mucho 12 variantes a la vez (`LIMITES_VARIANTES.max`) y 4 ganchos (`ganchosMax`) (lib/operaciones.ts:113). Con 3 ganchos, las 4 duraciones, los 4 formatos y un estilo salen 48: bloquea con «Como mucho 12 variantes a la vez: quita ganchos, duraciones o formatos.». La lista enseña solo las 12 primeras y la etiqueta del total se pone en aviso.",
      "Siempre queda al menos un gancho: «Quitar el gancho» se apaga con uno solo. «Añadir un gancho» se apaga con cuatro.",
      "Un gancho va de 0 a la duración del video menos 1 s (`ganchoFuera`).",
      "Si al gancho no le queda la duración elegida, la variante dura hasta el final del video (`duracionVariante`, lib/operaciones.ts:165). Si no le quedan ni 5 s (`duracionMin`), esa combinación se descarta sin avisar; solo si no queda ninguna combinación se avisa (`duracionCorta` o `sinVariantes`).",
      "Al cambiar de video, los ganchos se vuelven a repartir sobre el nuevo; duraciones, formatos, subtítulos, idioma y portada se conservan (components/app/variantes-panel.tsx:117).",
      "Con «Portada en el fotograma del gancho», la portada de cada variante es el segundo de su gancho; sin él, el segundo 0 del video (lib/operaciones.ts:158).",
      "Los fallos se enseñan debajo de la lista a partir del primer intento de encargar. «Encargar N variantes» no se apaga por ellos: solo por el plan o mientras se encargan (components/app/variantes-panel.tsx:405).",
      'Cada variante es un `POST /jobs` con su título, «Podcast #42 — Cómo escalar un equipo remoto · V1/3 · 8:01 · 30 s · 9:16» (`tituloOperado`), su duración real, un peso estimado proporcional al tramo (peso × segundos ÷ duración: 16.458.853 bytes para 30 s del Podcast #42, components/app/variantes-panel.tsx:142), el idioma elegido como `language` y `operacion: { operacion: "variante", variante, indice, total }`.',
      "Se encargan una tras otra, en orden. Si una falla, las anteriores ya quedaron encargadas, no sale el aviso de éxito y la persona se queda en la página (components/app/variantes-panel.tsx:130). Como al recortar, el rechazo de `mutateAsync` no se captura: el aviso lo pone el hook.",
      REGLA_LISTOS,
      "El servidor tiene que repetir la capacidad del plan y, por cada variante: gancho dentro del video, al menos 5 s desde el gancho, duración en {15, 30, 45, 60}, formato en {9:16, 1:1, 4:5, 16:9}, subtítulos en {sin, limpio, karaoke, caja}, idioma en {es, en, pt} (lib/operaciones.ts:80-88), `indice` < `total` y `total` ≤ 12.",
      "Son contenido distinto de verdad: lo que cambia es lo que se ve, y el archivo nunca se disfraza. " +
        REGLA_SIN_HUELLA,
    ],
    estados: ESTADOS_TRABAJO,
    errores: [
      {
        codigo: "sinVideo",
        cuando: "No hay ningún video elegido.",
        frase: "app.operaciones.variantes.errors.sinVideo",
        bloquea: true,
      },
      {
        codigo: "sinVariantes",
        cuando:
          "No sale ninguna combinación (p. ej. sin ninguna duración, formato o estilo marcado): «No hay ninguna combinación posible: revisa ganchos y duraciones.».",
        frase: "app.operaciones.variantes.errors.sinVariantes",
        bloquea: true,
      },
      {
        codigo: "demasiadasVariantes",
        cuando: "Salen más de 12 combinaciones.",
        frase: "app.operaciones.variantes.errors.demasiadasVariantes",
        bloquea: true,
      },
      {
        codigo: "ganchoFuera",
        cuando:
          "Un gancho es negativo o llega al final del video (≥ su duración): «Un gancho se sale del video: va de 0 a 4811 segundos.» (con el Podcast #42).",
        frase: "app.operaciones.variantes.errors.ganchoFuera",
        bloquea: true,
      },
      {
        codigo: "duracionCorta",
        cuando:
          "No queda ninguna combinación y algún gancho deja menos de 5 s de video: «Con ese gancho no quedan 5 segundos de video.».",
        frase: "app.operaciones.variantes.errors.duracionCorta",
        bloquea: true,
      },
      ...ERRORES_ALTA,
    ],
    endpoints: [
      "proyectos.listar",
      "proyectos.crear",
      "planes.obtener-suscripcion",
      "planes.listar",
    ],
    datos: DATOS_TRABAJOS,
    respuesta:
      "Las opciones de Duraciones, Formatos y Subtítulos suenan «tap»; el interruptor de la portada suena al encender y al apagar. «Encargar N variantes» es el botón de marca: «pop» y marca de recorte, y se apaga mientras se encargan. Al terminar, un solo `toast.success` «Variantes encargadas» — «Salen en Proyectos, cada una con su etiqueta y su progreso.» y salto a /proyectos. Si un alta falla, `toast.error` «No se ha podido crear el proyecto» con su motivo (sonido de error y sacudida).",
    origen: [
      "components/app/variantes-panel.tsx:124",
      "components/app/variantes-panel.tsx:85",
      "components/app/variantes-panel.tsx:227",
      "lib/operaciones.ts:113",
      "lib/operaciones.ts:122",
      "lib/operaciones.ts:141",
      "lib/operaciones.ts:180",
      "app/[locale]/(app)/operaciones/variantes/page.tsx:14",
    ],
    relacionadas: [
      "operaciones.recortar-video",
      "operaciones.abrir-herramienta",
      "publicar.editar-plantilla-proyecto",
    ],
  },

  /* --- Derechos: el clipero ------------------------------------------- */
  {
    id: "operaciones.consultar-derechos",
    area: "operaciones",
    titulo: "Consultar qué permite cada campaña",
    resumen:
      "Leer, campaña a campaña, la licencia que da la agencia —alcance, redes, atribución, condiciones— y cómo va tu lista blanca.",
    quien: ["clipero"],
    donde: [
      { ruta: "/operaciones/derechos", etiqueta: "Operaciones › Derechos" },
      {
        ruta: "/campanas/[id]",
        etiqueta: "Ficha de la campaña › Derechos › «Ver en Operaciones»",
      },
    ],
    pasos: [
      "En Operaciones, pulsa «Abrir» en «Derechos», o pulsa «Ver en Operaciones» en la tarjeta «Derechos» de la ficha de una campaña.",
      "Con el perfil «Usuario» (menú de usuario › «Perfil de la cuenta · demo»), cada campaña en la que tienes una participación sale en una tarjeta con su título (enlace a /campanas/[id]) y la marca.",
      "Lee «Alcance» («Dentro de la campaña» o «Libre»), «Redes», y «Atribución» y «Condiciones» si la agencia las escribió.",
      "Mira «Lista blanca»: «La agencia no ofrece lista blanca», «Disponible: pídela para una cuenta», «Pedida, a la espera de la agencia», «Activa: tu cuenta está dada de alta» o «Rechazada».",
      "Sin campañas, la página dice «Todavía no estás en ninguna campaña: la licencia la da cada campaña.» y ofrece «Explorar campañas» (/campanas).",
    ],
    reglas: [
      "La licencia la pone la agencia en cada campaña (`Campana.licencia`). Sin licencia escrita vale la de por defecto: alcance «campana» y sin lista blanca (`LICENCIA_POR_DEFECTO`, lib/derechos.ts:40).",
      "«Dentro de la campaña»: mientras la campaña esté abierta y con sus reglas; al cerrar, los clips se retiran. «Libre»: el clipero puede dejar los clips publicados y volver a publicarlos después, en las mismas redes (lib/derechos.ts:22).",
      "Atribución hasta 60 caracteres y condiciones hasta 300 (`LIMITES_LICENCIA`, lib/derechos.ts:48); lo guardado se recorta a eso al leer (`licenciaValida`, lib/derechos.ts:201).",
      "La situación de la lista blanca es por persona y campaña (`situacionListaBlanca`, lib/derechos.ts:163): con varias solicitudes manda «activa» sobre «pendiente» y «pendiente» sobre «rechazada».",
      "En la demo solo «Liga de las Estrellas: temporada de otoño» (cmp_liga) ofrece lista blanca, con atribución «@ligaestrellas» y la condición «Sin música ajena encima; el marcador tiene que verse.» (lib/campanas.ts:772).",
      "La lista sale de TODAS las participaciones del almacén, en cualquier estado (también solo solicitadas) y sin filtrar por persona (components/app/derechos-panel.tsx:82). En la demo salen cinco tarjetas: la Liga, «Serie Bingo Monstruos» y «Casi Casi: el estribillo en todas partes», que son de Ana, y también «Ámbar: Tra Tra Tra» y «Arena Nova · temporada de clips», en las que solo participan otros cliperos. Con el servidor, las participaciones tienen que ser las de la sesión.",
      "En la ficha de la campaña, la tarjeta «Derechos» titula la fila de la lista blanca «Ofrezco lista blanca» (la etiqueta del formulario de la agencia) también cuando la lee el clipero, con «Con lista blanca» o «Sin lista blanca» (components/campanas/derechos-card.tsx:49).",
      "Con el perfil «Agencia» la misma página enseña la otra mitad, las solicitudes de sus campañas (components/app/derechos-panel.tsx:65).",
      "No depende del plan: Derechos es de todos (lib/operaciones.ts:40).",
    ],
    estados: [
      {
        estado: "no-ofrecida",
        significa: "La licencia de la campaña no ofrece lista blanca.",
      },
      {
        estado: "disponible",
        significa: "La ofrece y todavía no la has pedido para ninguna cuenta.",
      },
      { estado: "pendiente", significa: "Pedida, a la espera de que la agencia decida." },
      {
        estado: "activa",
        significa: "La agencia dio de alta la cuenta en su Content ID.",
      },
      {
        estado: "rechazada",
        significa:
          "La agencia la rechazó; el motivo, si lo escribió, sale al lado de la cuenta.",
      },
    ],
    endpoints: [
      "campanas.listar",
      "campanas.listar-participaciones",
      "operaciones.listar-lista-blanca",
    ],
    datos: DATOS_DERECHOS,
    respuesta: "Ninguna: es una consulta, sin sonido ni efecto.",
    origen: [
      "components/app/derechos-panel.tsx:76",
      "components/app/derechos-panel.tsx:82",
      "lib/derechos.ts:29",
      "lib/derechos.ts:163",
      "components/campanas/derechos-card.tsx:73",
      "app/[locale]/(app)/operaciones/derechos/page.tsx:14",
    ],
    relacionadas: [
      "operaciones.pedir-lista-blanca",
      "operaciones.abrir-herramienta",
      "campanas.consultar-derechos",
    ],
  },
  {
    id: "operaciones.pedir-lista-blanca",
    area: "operaciones",
    titulo: "Pedir la lista blanca para una cuenta",
    resumen:
      "Pedirle a la agencia de una campaña que dé de alta una de tus cuentas conectadas en su Content ID, para que tus clips no reciban reclamaciones.",
    quien: ["clipero"],
    donde: [{ ruta: "/operaciones/derechos", etiqueta: "Operaciones › Derechos" }],
    pasos: [
      "En Operaciones › Derechos, con el perfil «Usuario», busca la tarjeta de una campaña que ofrezca lista blanca: solo en esas aparece el formulario.",
      "En «Cuenta» («Las plataformas dan de alta un canal concreto, no a una persona.»), elige una de tus cuentas conectadas de las redes de la campaña, escrita red · handle, p. ej. «TikTok · @cortes.ana». Sale elegida la primera: en la demo, «TikTok · @clipealo».",
      "Pulsa «Pedir lista blanca».",
      "La solicitud aparece encima del selector con el icono de su red, su handle y «Pedida, a la espera de la agencia»; la línea «Lista blanca» de la tarjeta cambia a lo mismo.",
      "Si no tienes cuentas conectadas en esas redes, en su lugar se lee «No tienes cuentas conectadas en las redes de esta campaña.» con el botón «Conectar una cuenta» (/ajustes?seccion=cuentas).",
    ],
    reglas: [
      "Es por cuenta, no por persona: las plataformas dan de alta un canal concreto. Una misma persona puede pedirla para varias cuentas.",
      "Solo se ofrecen cuentas activas —con handle y en estado «conectada» (`cuentaActiva`, lib/social.ts:133)— de las redes de la campaña (components/app/derechos-panel.tsx:188). En la demo, para la Liga (YouTube, TikTok e Instagram): @clipealo y @cortes.ana en TikTok, @clipealo en YouTube y @nebula.studio en Instagram, aunque esta última es de dueño «agencia».",
      "La campaña tiene que admitir solicitudes: inscripciones abiertas, estado «activa» y `fin` sin pasar respecto a hoy (components/app/derechos-panel.tsx:196). El «hoy» es `HOY_CAMPANAS` (lib/campanas.ts:736), que es `AHORA_DEMO`, 2026-09-13T12:20:00.000Z (lib/fechas.ts:51).",
      "Una cuenta no puede tener dos solicitudes vivas en la misma campaña: bloquea si ya hay una «pendiente» o «activa». Tras un rechazo se puede volver a pedir (lib/derechos.ts:105).",
      "Con cualquier bloqueo «Pedir lista blanca» nace apagado (`disabled={bloquea && !intento}`, components/app/derechos-panel.tsx:278) y no llega a intentarse, así que las frases de error de debajo del campo no se ven hoy: una campaña cerrada, p. ej., deja el botón apagado sin decir por qué. Después de pedirla para una cuenta, el botón se apaga hasta que elijas otra sin solicitud viva.",
      "La solicitud nace «pendiente» con `pedidaEn` = `AHORA_DEMO`, tu nombre como `creador` («Ana Ruiz» en la demo) y la red y el handle de la cuenta (`nuevaSolicitudListaBlanca`, lib/derechos.ts:120).",
      "La ve la agencia que creó la campaña en su Operaciones › Derechos y, en la ficha de la campaña, como «1 solicitud de lista blanca» (components/campanas/derechos-card.tsx:77). Si la campaña la creó el equipo (como cmp_liga), hoy no la ve nadie: el backoffice no tiene pantalla de lista blanca.",
      "No depende del plan.",
    ],
    estados: [
      { estado: "pendiente", significa: "Pedida, a la espera de la agencia." },
      { estado: "activa", significa: "La agencia la dio de alta." },
      {
        estado: "rechazada",
        significa: "La agencia la rechazó, con motivo o sin él. Se puede volver a pedir.",
      },
    ],
    errores: [
      {
        codigo: "sinListaBlanca",
        cuando:
          "La campaña no ofrece lista blanca. En pantalla no llega a verse: sin lista blanca no aparece el formulario.",
        frase: "app.operaciones.derechos.errors.sinListaBlanca",
        bloquea: true,
      },
      {
        codigo: "campanaCerrada",
        cuando: "Inscripciones cerradas, campaña no activa o ya vencida. " + NO_SE_VE,
        frase: "app.operaciones.derechos.errors.campanaCerrada",
        bloquea: true,
      },
      {
        codigo: "sinCuenta",
        cuando: "No hay ninguna cuenta elegida. " + NO_SE_VE,
        frase: "app.operaciones.derechos.errors.sinCuenta",
        bloquea: true,
      },
      {
        codigo: "redFuera",
        cuando:
          "La red de la cuenta no está en la campaña. No pasa en pantalla: el selector solo ofrece cuentas de sus redes.",
        frase: "app.operaciones.derechos.errors.redFuera",
        bloquea: true,
      },
      {
        codigo: "yaPedida",
        cuando:
          "Esa cuenta ya tiene una solicitud «pendiente» o «activa» en la campaña. " +
          NO_SE_VE,
        frase: "app.operaciones.derechos.errors.yaPedida",
        bloquea: true,
      },
    ],
    endpoints: [
      "operaciones.pedir-lista-blanca",
      "operaciones.listar-lista-blanca",
      "cuenta.listar-redes",
    ],
    datos: DATOS_DERECHOS,
    respuesta:
      "«Pedir lista blanca» es un botón de contorno (`outline`), no de marca: no suena al pulsarlo. Al guardarse, `toast.success` «Lista blanca pedida» — «La agencia la ve en su campaña y decide.» (sonido de éxito).",
    origen: [
      "components/app/derechos-panel.tsx:176",
      "components/app/derechos-panel.tsx:191",
      "components/app/derechos-panel.tsx:225",
      "lib/derechos.ts:91",
      "lib/derechos.ts:120",
      "hooks/use-campanas.ts:452",
    ],
    relacionadas: [
      "operaciones.consultar-derechos",
      "operaciones.aprobar-lista-blanca",
      "operaciones.rechazar-lista-blanca",
    ],
  },

  /* --- Derechos: la agencia ------------------------------------------- */
  {
    id: "operaciones.revisar-lista-blanca",
    area: "operaciones",
    titulo: "Revisar las solicitudes de lista blanca",
    resumen:
      "Ver qué cuentas de cliperos piden el alta en el Content ID de tus campañas y el historial de lo ya decidido.",
    quien: ["agencia"],
    donde: [
      {
        ruta: "/operaciones/derechos",
        etiqueta: "Operaciones › Derechos (perfil agencia)",
      },
      { ruta: "/campanas/[id]", etiqueta: "Ficha de tu campaña › Derechos" },
    ],
    pasos: [
      "Con el perfil «Agencia» (en la demo, menú de usuario › «Perfil de la cuenta · demo» › «Agencia»), abre Operaciones › Derechos. Desde la ficha de una campaña tuya, la tarjeta «Derechos» dice cuántas esperan («2 solicitudes de lista blanca») y «Ver en Operaciones» lleva aquí.",
      "La tarjeta «Solicitudes de lista blanca» («Cuentas de cliperos que piden el alta en tu Content ID…») lista las pendientes: «@cortes.ana en TikTok», quién la pide, la campaña y «Pedida el …».",
      "Debajo de la tarjeta va el historial de las resueltas: «Cuenta dada de alta» o «Solicitud rechazada», la cuenta, la campaña, la fecha de la decisión y el motivo si lo hubo.",
      "Sin pendientes, la tarjeta dice «Nadie ha pedido lista blanca todavía.», aunque haya resueltas en el historial.",
    ],
    reglas: [
      "Solo cuentan las campañas que creó esta cuenta (`creadaPor.userId`, components/app/derechos-panel.tsx:292).",
      "Las solicitudes de campañas creadas por el equipo (perfil admin, sin `userId`, como cmp_liga, que es la única de la demo con lista blanca) no las ve ninguna agencia y el backoffice no tiene pantalla de lista blanca: hoy nadie puede resolverlas.",
      "En la demo la lista no llega a llenarse: no hay solicitudes semilla (hooks/use-campanas.ts:146), la única campaña de la cuenta, «Ámbar: Tra Tra Tra» (cmp_anmi), no tiene licencia escrita y por tanto no ofrece lista blanca, y en una campaña que crees tú no puedes participar (components/campanas/campaign-detail.tsx:156), que es lo que hace falta para pedirla.",
      "El perfil de agencia no ve la mitad del clipero: la página enseña una u otra según el perfil (components/app/derechos-panel.tsx:65).",
      "No depende del plan.",
    ],
    estados: [
      {
        estado: "pendiente",
        significa: "Espera tu decisión: sale en la lista de arriba con sus dos botones.",
      },
      {
        estado: "activa",
        significa: "La diste de alta: pasa al historial como «Cuenta dada de alta».",
      },
      {
        estado: "rechazada",
        significa:
          "La rechazaste: pasa al historial como «Solicitud rechazada», con el motivo.",
      },
    ],
    endpoints: ["operaciones.listar-lista-blanca", "campanas.listar"],
    datos: DATOS_DERECHOS,
    respuesta: "Ninguna: es una consulta, sin sonido ni efecto.",
    origen: [
      "components/app/derechos-panel.tsx:285",
      "components/app/derechos-panel.tsx:292",
      "lib/derechos.ts:179",
      "components/campanas/derechos-card.tsx:30",
    ],
    relacionadas: [
      "operaciones.aprobar-lista-blanca",
      "operaciones.rechazar-lista-blanca",
    ],
  },
  {
    id: "operaciones.aprobar-lista-blanca",
    area: "operaciones",
    titulo: "Dar de alta una cuenta en la lista blanca",
    resumen:
      "Aceptar la solicitud de un clipero: su cuenta queda como dada de alta en el Content ID de tu campaña.",
    quien: ["agencia"],
    donde: [
      {
        ruta: "/operaciones/derechos",
        etiqueta: "Operaciones › Derechos (perfil agencia)",
      },
    ],
    pasos: [
      "En «Solicitudes de lista blanca», localiza la solicitud: «@cortes.ana en TikTok» y debajo quién la pide, la campaña y «Pedida el …».",
      "Pulsa «Dar de alta».",
      "La solicitud sale de pendientes y pasa al historial con «Cuenta dada de alta» y la fecha.",
    ],
    reglas: [
      "Un clic, sin confirmación.",
      "La solicitud pasa a «activa» con `resueltaEn` y sin motivo (`resolverListaBlanca`, lib/derechos.ts:142). En la demo, `resueltaEn` es `AHORA_DEMO`.",
      "El clipero lo ve en su tarjeta como «Activa: tu cuenta está dada de alta».",
      "Clipealo guarda la decisión; el alta de verdad la hace la agencia en su Content ID («Darás de alta en tu Content ID las cuentas que lo pidan, para que sus clips no reciban reclamaciones.», al crear la campaña, components/campanas/campaign-form.tsx:396). Ningún código de hoy llama a una plataforma.",
      "Solo sobre solicitudes pendientes de campañas propias.",
    ],
    estados: [
      { estado: "pendiente", significa: "Antes de decidir." },
      { estado: "activa", significa: "Después de «Dar de alta»." },
    ],
    endpoints: ["operaciones.resolver-lista-blanca"],
    datos: DATOS_DERECHOS,
    respuesta:
      "`toast.success` «Cuenta dada de alta» con el handle como descripción (sonido de éxito). El botón no es de marca: no suena al pulsarlo.",
    origen: [
      "components/app/derechos-panel.tsx:336",
      "hooks/use-campanas.ts:458",
      "lib/derechos.ts:142",
    ],
    relacionadas: [
      "operaciones.revisar-lista-blanca",
      "operaciones.rechazar-lista-blanca",
    ],
  },
  {
    id: "operaciones.rechazar-lista-blanca",
    area: "operaciones",
    titulo: "Rechazar una solicitud de lista blanca",
    resumen: "Decir que no a la solicitud de un clipero, con un motivo que él leerá.",
    quien: ["agencia"],
    donde: [
      {
        ruta: "/operaciones/derechos",
        etiqueta: "Operaciones › Derechos (perfil agencia)",
      },
    ],
    pasos: [
      "En «Solicitudes de lista blanca», pulsa «Rechazar» en la solicitud.",
      "Se abre el diálogo «Rechazar» con la cuenta («@cortes.ana en TikTok»).",
      "Escribe el «Motivo» si quieres («Lo verá el clipero.»).",
      "Pulsa «Rechazar» para confirmar, o «Cancelar» para dejarla pendiente.",
      "La solicitud pasa al historial con «Solicitud rechazada», la fecha y el motivo.",
    ],
    reglas: [
      "El motivo es opcional: se guarda sin espacios al principio ni al final y, si queda vacío, no se guarda (lib/derechos.ts:152). El código no le pone tope de caracteres.",
      "La solicitud pasa a «rechazada» con `resueltaEn`.",
      "El clipero ve «Rechazada» y el motivo al lado de la cuenta, y puede volver a pedirla para esa misma cuenta: una rechazada no cuenta como ya pedida (lib/derechos.ts:110).",
      "Cada vez que se abre el diálogo, el motivo empieza vacío.",
    ],
    estados: [
      { estado: "pendiente", significa: "Antes de decidir, o si se cancela el diálogo." },
      { estado: "rechazada", significa: "Después de confirmar «Rechazar»." },
    ],
    endpoints: ["operaciones.resolver-lista-blanca"],
    datos: DATOS_DERECHOS,
    respuesta:
      "Aviso neutro `toast` «Solicitud rechazada» con el handle: sin sonido, porque informa y no premia (lib/toast.ts). El botón de confirmar es rojo (`destructive`), no de marca, y no suena.",
    origen: [
      "components/app/derechos-panel.tsx:345",
      "components/app/derechos-panel.tsx:379",
      "hooks/use-campanas.ts:458",
      "lib/derechos.ts:142",
    ],
    relacionadas: [
      "operaciones.revisar-lista-blanca",
      "operaciones.aprobar-lista-blanca",
    ],
  },
]
