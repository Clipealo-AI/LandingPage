import type { Accion } from "@/lib/wiki/tipos"

/**
 * Acciones de «publicar».
 *
 * Clipealo publica en las cuentas conectadas que la persona elija, ahora o a
 * la hora que programe (decisión del director, 20 de septiembre de 2026;
 * docs/costuras-backend.md §Publicar). Aquí va el gesto de publicar un clip,
 * el camino hacia programarlo, la plantilla de texto de cada proyecto por red
 * y dónde ha salido cada clip. Lo que se hace con una publicación ya creada
 * —adelantarla, reintentarla, reconectar la cuenta, «Ya la publiqué»— vive en
 * la hoja del Calendario y es del área «calendario»; la campana de avisos, del
 * área «cuenta»; y el texto propio de cada clip («El texto con el que sale» y
 * «Volver a la plantilla», en la ficha del clip), del área «proyectos».
 */

const DATOS_ENVIO =
  "Las entradas viven en el almacén del navegador `clipealo-agenda-v1` (hooks/use-agenda.ts: semillas `agendaSemilla` + entradas creadas + parches por id). El envío sale por la frontera `lib/api/publicaciones.ts`: con `NEXT_PUBLIC_API_URL` hace `POST /publicaciones/{entradaId}/enviar`; sin ella espera 900 ms y simula de forma determinista. Las cuentas salen de `clipealo-cuentas-v1` (hooks/use-cuentas-sociales.ts) sobre las semillas de lib/social.ts."

const DATOS_TEXTOS =
  "Almacén del navegador `clipealo-publicacion-v1` (hooks/use-publicacion.ts), versión 2: `plantillas` con clave `<proyectoId>:<red>` y `copias` con clave `<clipId>:<red>`. Se escribe en cada pulsación. No hay frontera en `lib/api/` todavía."

const LIMITES =
  "Límites por red (`LIMITES_PUBLICACION`, lib/publicacion.ts:35, cifras de septiembre de 2026): TikTok 2.200 caracteres y 5 hashtags; Instagram 2.200 y 5; YouTube título 100, texto 5.000 y 15 hashtags; X 280 y 2; LinkedIn 3.000 y 5; Facebook 63.206 y 5."

const BLOQUEOS_TEXTO =
  "Pasarse de caracteres en el título o en el texto BLOQUEA el envío, porque la red lo rechazaría; pasarse de hashtags o escribir uno inválido solo avisa, porque es alcance y no regla (`BLOQUEA_PUBLICACION`, lib/publicacion.ts:107)."

export const ACCIONES: Accion[] = [
  {
    id: "publicar.publicar-clip-ahora",
    area: "publicar",
    titulo: "Publicar un clip ahora",
    resumen:
      "Mandar un clip, en el mismo gesto, a una o varias de tus cuentas conectadas y quedarte con el enlace que devuelve cada red.",
    quien: ["clipero"],
    plan: {
      minimo: "free",
      nota: "Está en todos los planes, también en Prueba (fila `directPublish` de la comparativa, lib/pricing.ts:385). Lo que cambia es dónde: Prueba publica solo en TikTok y en 1 cuenta; Creador en 6 cuentas y Empresa en 20, de las seis redes (`CUENTAS_POR_PLAN`, lib/pricing.ts:152; `NETWORKS_BY_PLAN`, lib/pricing.ts:515). Un plan creado en el backoffice usa su propio `cuentas` y las redes de su escalón (`redesDe`, lib/planes.ts:495). Las cuentas que el plan no cubre no se esconden: salen en gris, aparte, con «El plan {plan} cubre N cuentas conectadas y esta se queda fuera.» y el enlace «Ver los planes».",
    },
    donde: [
      {
        ruta: "/proyectos/[id]/clips/[clipId]",
        etiqueta: "Ficha del clip › botón «Publicar»",
      },
      {
        ruta: "/studio/[id]",
        etiqueta:
          "Estudio › botón «Publicar» (publica el clip elegido: el de `?clip=` o, sin él, el primero del proyecto)",
      },
      {
        ruta: "/proyectos/[id]",
        etiqueta:
          "Menú «…» de cada tarjeta de clip › «Publicar…» (lleva a la ficha del clip)",
      },
      {
        ruta: "/dashboard",
        etiqueta:
          "Resumen › menú «…» de un clip reciente › «Publicar…» (lleva a la ficha del clip)",
      },
    ],
    pasos: [
      "En la ficha del clip pulsa «Publicar» (en el Estudio, «Publicar» en la cabecera, con el clip elegido). Se abre «Publicar el clip»: «Elige en qué cuentas sale. Se publica ahora, con el texto que tengas escrito para cada red.»",
      "En «Tus cuentas conectadas» marca una o varias casillas. Al marcar una aparece debajo, en dos líneas, el texto que va a salir en esa red.",
      "Lo que no puede recibir el clip va aparte y en gris, bajo «N cuentas se quedan fuera», cada cuenta con su motivo (plan, formato, duración o el mismo clip ya en esa cuenta a esa hora). «Ver los planes» lleva a /precios.",
      "Si el texto de alguna red elegida no cabe, sale en rojo «El texto de {red} no cabe en lo que la red acepta: arréglalo antes de publicar.» y el botón se apaga hasta corregirlo (en la ficha del clip o en Operaciones › Publicación).",
      "Pulsa «Publicar ahora», o «Publicar en N cuentas» si marcaste más de una. El botón enseña un spinner mientras sale.",
      "El diálogo se cierra solo y el resultado llega en avisos; cada envío aparece en «Dónde ha salido» con su estado y su enlace.",
      "Sin ninguna cuenta conectada, el diálogo lo dice («Todavía no tienes ninguna cuenta conectada donde publicar.») y ofrece «Conectar una cuenta». Si todas se quedan fuera: «Ninguna de tus cuentas conectadas puede recibir este clip.»",
    ],
    reglas: [
      "Solo se ofrecen tus cuentas vivas (con `handle` y en estado `conectada`, `cuentaActiva`) y de dueño `clipero`: las cuentas de la agencia no aparecen ni gastan tu cupo (components/app/publicar-dialog.tsx:100).",
      "El cupo del plan se decide al PUBLICAR, no solo al conectar (`cuentasPublicables`, lib/planes.ts:602): cuentan las cuentas de las redes del plan, en el orden en que se conectaron (`connectedAt`), hasta `plan.cuentas`. Quien baja de Empresa a Creador conserva sus cuentas conectadas, pero solo publica en las 6 primeras. Con las semillas y Prueba solo queda @clipealo de TikTok (conectada el 14 de julio); @cortes.ana (TikTok) y @clipealo (YouTube) salen fuera. Con Creador, el plan con el que arranca la demo (`PLAN_DEMO`), entran las tres.",
      "Una cuenta también queda fuera si el clip no encaja en su red (lib/social.ts:39): formato no admitido (TikTok solo 9:16; Instagram 9:16, 4:5 y 1:1; YouTube 9:16 y 16:9; X 16:9 y 1:1; LinkedIn 1:1, 4:5 y 16:9; Facebook 9:16 y 1:1) o duración por encima del máximo (TikTok 600 s, Instagram 180, YouTube 60, X 140, LinkedIn 600, Facebook 90).",
      "No se admite el mismo clip dos veces en la misma cuenta y el mismo instante (`duplicadaEnCuenta`, lib/agenda.ts:626; las canceladas no cuentan). En la demo «ahora» es siempre `AHORA_AGENDA` (13 de septiembre de 2026, 12:20 UTC), así que un clip ya publicado ahora en una cuenta sale después «fuera» en esa cuenta.",
      '«Ahora» se valida con `modo: "ahora"` y no puede caer en `enPasado` por lo que tarde el clic (lib/agenda.ts:609). Los consejos de ritmo —menos de 45 min entre dos publicaciones de la misma cuenta (`SEPARACION_MINIMA_MIN`) o más de 4 al día (`MAX_POR_CUENTA_DIA`)— no se enseñan aquí: el diálogo solo mira lo que bloquea.',
      "El texto de cada red es el propio del clip si lo tiene y, si no, la plantilla de su proyecto (`copiaEfectiva`, lib/publicacion.ts:190). Si ninguno tiene nada, sale el gancho del clip (`clip.hook`): no tener texto no bloquea, a propósito.",
      "Solo bloquea el texto que la red rechazaría: título de más de 100 caracteres en YouTube o texto por encima del límite de la red. " +
        LIMITES,
      "Lo que se manda (`textoParaEnviar`, lib/publicacion.ts:161): en YouTube el título va en su campo aparte; en las demás redes el título abre el texto. Después el texto y, al final, los hashtags en una línea, separados por líneas en blanco.",
      "Cada cuenta elegida es una entrada de la agenda (dos cuentas de TikTok son dos publicaciones), todas con el mismo instante (`cada: 0`) y proveedor `clipealo`; si son varias comparten lote (`loteId`, hooks/use-agenda.ts:133). La entrada guarda la copia con la que salió: cambiar la plantilla después no reescribe lo publicado (lib/agenda.ts:199).",
      "Los envíos van en paralelo y cada uno por su cuenta (`Promise.allSettled`, hooks/use-agenda.ts:242): si uno falla, los demás siguen.",
      "Lo que no sale queda «No salió» y se resuelve desde la hoja del Calendario (reintentar, reconectar o «Ya la publiqué»). En Prueba el Calendario es un muro (components/agenda/agenda-view.tsx:277): hoy Prueba ve el fallo en el aviso, en la campana y en «Dónde ha salido», pero no tiene dónde reintentarlo.",
      "En la demo el envío tarda 900 ms y no falla por azar (lib/api/publicaciones.ts:106): sin cuenta da `cuentaCaducada` y sin texto ni título, `rechazoRed`. Como el diálogo siempre pone cuenta y el texto cae al gancho del clip, publicar desde el diálogo sale siempre bien. El mismo envío da siempre el mismo `postId` de 14 cifras y el mismo enlace.",
      "En la lista de clips del Estudio, «Publicar…» del menú de una tarjeta no abre la ficha: solo elige ese clip en el Estudio (la tarjeta recibe el enlace `?clip=<id>`, components/app/studio.tsx:280). Desde ahí se pulsa «Publicar» en la cabecera.",
      "«Conectar una cuenta» enlaza a /ajustes?seccion=social (components/app/publicar-dialog.tsx:228), que no es una sección de Ajustes (son perfil, publico, cuentas, notificaciones, datos y facturacion, lib/ajustes.ts:17): hoy abre Perfil y no «Cuentas conectadas» (/ajustes?seccion=cuentas).",
    ],
    estados: [
      { estado: "planificada", significa: "Recién creada, un instante antes de salir." },
      {
        estado: "publicando",
        significa: "«Publicándose»: el envío está en marcha y ya cuenta un intento más.",
      },
      {
        estado: "publicada",
        significa: "Salió: guarda `url`, `postId` y `publicadaEn`.",
      },
      {
        estado: "fallida",
        significa: "«No salió»: guarda el motivo como código (`fallo`) y los intentos.",
      },
    ],
    errores: [
      {
        codigo: "fueraDelCupo",
        cuando:
          "La cuenta es de una red que el plan no incluye o pasa del cupo de cuentas del plan. La cuenta sale fuera, en gris, con la misma frase en los dos casos.",
        frase: "app.publicar.fueraDelCupo",
        bloquea: true,
      },
      {
        codigo: "formatoNoAdmitido",
        cuando: "El formato del clip no está entre los que admite la red de esa cuenta.",
        frase: "calendario.compositor.errores.formatoNoAdmitido",
        bloquea: true,
      },
      {
        codigo: "duracionExcedida",
        cuando: "El clip dura más que el máximo de la red de esa cuenta.",
        frase: "calendario.compositor.errores.duracionExcedida",
        bloquea: true,
      },
      {
        codigo: "duplicadaEnCuenta",
        cuando: "Ese clip ya tiene una entrada en esa cuenta a ese mismo instante.",
        frase: "calendario.compositor.errores.duplicadaEnCuenta",
        bloquea: true,
      },
      {
        codigo: "tituloLargo",
        cuando: "El título que sale en YouTube pasa de 100 caracteres.",
        frase: "app.publicar.textoNoCabe",
        bloquea: true,
      },
      {
        codigo: "textoLargo",
        cuando:
          "El texto de una red elegida pasa de su límite (280 en X, 2.200 en TikTok…).",
        frase: "app.publicar.textoNoCabe",
        bloquea: true,
      },
      {
        codigo: "cuentaCaducada",
        cuando:
          "Al enviar: la conexión con la cuenta caducó (en la demo, si la entrada no lleva cuenta).",
        frase: "calendario.fallo.cuentaCaducada",
        bloquea: true,
      },
      {
        codigo: "permisoDenegado",
        cuando: "Al enviar: la cuenta no concedió permiso de publicación.",
        frase: "calendario.fallo.permisoDenegado",
        bloquea: true,
      },
      {
        codigo: "rechazoRed",
        cuando:
          "Al enviar: la plataforma rechazó la publicación (en la demo, sin texto ni título).",
        frase: "calendario.fallo.rechazoRed",
        bloquea: true,
      },
      {
        codigo: "limiteApi",
        cuando: "Al enviar: la red no acepta más publicaciones por hoy.",
        frase: "calendario.fallo.limiteApi",
        bloquea: true,
      },
      {
        codigo: "sinRed",
        cuando:
          "Al enviar: no se pudo llegar a la red. También es lo que se guarda en la entrada ante cualquier error que no sea `PublicacionFallida` (hooks/use-agenda.ts:172); en ese caso el aviso «No salió en {red}» sale sin motivo.",
        frase: "calendario.fallo.sinRed",
        bloquea: true,
      },
    ],
    endpoints: [
      "publicar.enviar",
      "calendario.crear",
      "calendario.listar",
      "publicar.leer-textos",
      "cuenta.listar-redes",
    ],
    datos: `${DATOS_ENVIO} El texto de cada red sale de \`clipealo-publicacion-v1\` (hooks/use-publicacion.ts) y el plan de \`clipealo-plan-v1\` (hooks/use-plan.ts).`,
    respuesta:
      "«Publicar ahora» es el botón de marca: suena «pop» y se encuadra con la marca de recorte (AGENTS.md, regla 7); mientras sale lleva un spinner. Si sale en alguna cuenta: `toast.celebrate` «Publicado en N cuentas» (arpegio y confeti de esquinas de recorte) con «El enlace queda guardado y Analíticas lo sigue.». Por cada cuenta que falla, un `toast.error` «No salió en {red}» (sonido de error y sacudida) con el motivo de `calendario.fallo.<codigo>` cuando el fallo trae código (`PublicacionFallida`); si no, sin motivo.",
    origen: [
      "components/app/publicar-dialog.tsx:182",
      "components/app/publicar-dialog.tsx:110",
      "components/app/publicar-dialog.tsx:156",
      "hooks/use-agenda.ts:239",
      "hooks/use-agenda.ts:145",
      "lib/api/publicaciones.ts:106",
      "lib/planes.ts:602",
      "lib/agenda.ts:597",
      "components/app/clip-detalle.tsx:184",
      "components/app/studio.tsx:193",
      "components/video/clip-card.tsx:213",
    ],
    relacionadas: [
      "proyectos.escribir-texto-clip",
      "publicar.programar-clip",
      "publicar.ver-donde-ha-salido",
      "calendario.reintentar-publicacion",
    ],
  },
  {
    id: "publicar.programar-clip",
    area: "publicar",
    titulo: "Llevar un clip al Calendario para programarlo",
    resumen:
      "Abrir el compositor del Calendario con el clip (o todos los clips del proyecto) ya elegidos, para que salgan solos el día y la hora que marques.",
    quien: ["clipero"],
    plan: {
      minimo: "creator",
      nota: "Programar es de Creador en adelante (`PLAN_MINIMO.programar`, lib/pricing.ts:76). En Prueba «Programar» sale apagado en el diálogo de publicar y en el Estudio, con el candado y «Programar es del plan Creador en adelante. Ver los planes». «Programar…» del menú del clip no se apaga: navega, y el Calendario enseña su muro «Programar es del plan Creador» — «Publicar ahora en tus cuentas conectadas está en todos los planes, también en Prueba.»",
    },
    donde: [
      {
        ruta: "/proyectos/[id]/clips/[clipId]",
        etiqueta: "Ficha del clip › «Publicar» › «Programar»",
      },
      { ruta: "/studio/[id]", etiqueta: "Estudio › botón «Programar»" },
      {
        ruta: "/proyectos/[id]",
        etiqueta: "Menú «…» de cada tarjeta de clip › «Programar…»",
      },
      {
        ruta: "/dashboard",
        etiqueta: "Resumen › menú «…» de un clip reciente › «Programar…»",
      },
    ],
    pasos: [
      "Desde «Publicar el clip», pulsa «Programar»: el diálogo se cierra y se abre /calendario?crear=1&clips=<id del clip> (p. ej. clips=clip_04).",
      "En el Estudio, «Programar» avisa «Clip listo para publicar» — «Elige en qué cuentas sale y cuándo: ahora o a la hora que marques.» — y lleva al Calendario con TODOS los clips del proyecto (clips=clip_01,clip_02,…).",
      "En el menú «…» de una tarjeta de clip (en el proyecto, en Resumen o en la lista del Estudio), «Programar…» abre el Calendario con ese clip.",
      "En el compositor del Calendario («Programar publicación») eliges los clips, en qué cuentas salen, el día y la hora, y confirmas con «Programar» (área «calendario»).",
    ],
    reglas: [
      "El Estudio manda todos los clips del proyecto, no solo el elegido (components/app/studio.tsx:111).",
      "Lo que se programa desde Clipealo lo publica Clipealo (proveedor `clipealo`, `publicaSolo: true`, lib/agenda.ts:87): a su hora sale solo, y una entrada vencida que lleva Clipealo se ve «Publicándose», nunca «Toca publicar».",
      "En la demo no hay cola: nada sale solo a su hora. La cola que despierta a la hora programada es del servidor (docs/costuras-backend.md:113).",
      "Hoy lo programado desde el compositor del Calendario NO guarda la copia por red: `repartir` se llama sin `copia` ni `texto` (components/agenda/compositor-dialog.tsx:334), así que sale con el gancho del clip y no con la plantilla del proyecto ni con el texto propio del clip. Solo «Publicar ahora» del diálogo resuelve la copia.",
      "La puerta de plan se mira en el navegador con `puedeProgramar(plan)` (lib/pricing.ts:110); el servidor tiene que repetirla al crear las entradas.",
    ],
    endpoints: ["calendario.crear"],
    datos:
      "Aquí solo se navega: la URL lleva `crear=1` y `clips=…` y el Calendario abre su compositor. Las entradas se crean en `clipealo-agenda-v1` (hooks/use-agenda.ts) al confirmar allí.",
    respuesta:
      "En el diálogo, «Programar» es un botón secundario (`outline`): no suena. En el Estudio, aviso neutro `toast()` sin sonido «Clip listo para publicar». En el menú del clip, solo navegación (la navegación no suena, AGENTS.md regla 7).",
    origen: [
      "components/app/publicar-dialog.tsx:353",
      "components/app/studio.tsx:178",
      "components/video/clip-card.tsx:220",
      "lib/pricing.ts:76",
      "components/agenda/agenda-view.tsx:277",
      "components/agenda/compositor-dialog.tsx:334",
    ],
    relacionadas: ["publicar.publicar-clip-ahora", "calendario.programar-publicacion"],
  },
  {
    id: "publicar.editar-plantilla-proyecto",
    area: "publicar",
    titulo: "Escribir la plantilla de publicación de un proyecto",
    resumen:
      "Dejar escrito, una vez por red, el título, el texto y los hashtags con los que salen todos los clips de un proyecto.",
    quien: ["clipero"],
    plan: {
      minimo: "free",
      nota: "En todos los planes: la herramienta «Publicación» no pide capacidad (`HERRAMIENTA_CAPACIDAD` solo la piden recortar, reducir y variantes, lib/operaciones.ts:40). Su tarjeta en Operaciones dice «En todos los planes».",
    },
    donde: [
      { ruta: "/operaciones/publicacion", etiqueta: "Operaciones › Publicación" },
      {
        ruta: "/operaciones",
        etiqueta: "Operaciones › tarjeta «Publicación» › «Abrir»",
      },
      {
        ruta: "/proyectos/[id]/clips/[clipId]",
        etiqueta:
          "Ficha del clip › «Editar la plantilla» (sale cuando el clip hereda una plantilla con texto)",
      },
    ],
    pasos: [
      "Entra en Operaciones › Publicación.",
      "En «Video» elige el proyecto. Solo salen los que están listos, con su duración («Podcast #42 — Cómo escalar un equipo remoto · 1:20:12»). Empieza en el primero de la lista.",
      "Elige la red en la barra de pestañas (TikTok, Instagram, YouTube, X, LinkedIn, Facebook). Empieza en TikTok.",
      "Escribe «Título», «Texto» y «Hashtags» (separados por espacios o comas; de ejemplo, «#clips #futbol»).",
      "Debajo de cada campo va el contador («{n} de {max} caracteres»; en hashtags, «Separados por espacios o comas. {n} de {max} recomendados.») y, si algo no cuadra, el aviso de la red.",
      "No hay botón de guardar: se guarda al escribir. La pestaña de la red lleva un punto («Con texto») cuando ya tiene algo.",
    ],
    reglas: [
      "Se guarda en cada pulsación, en este navegador; la nota de la página lo dice: «Se guarda al escribir, en este navegador.»",
      LIMITES,
      BLOQUEOS_TEXTO,
      "Solo YouTube tiene campo de título aparte y solo ahí se enseña el contador del título; en las demás redes el título abre el texto que se manda.",
      "Hashtags (`hashtagsDe`, lib/publicacion.ts:85): «#Clips», «clips» y « #clips » son el mismo; se guardan con # delante, sin espacios y sin repetidos (sin distinguir mayúsculas). Un hashtag válido lleva solo letras, números y guion bajo, en cualquier alfabeto («#retención» vale).",
      "Los clips del proyecto heredan la plantilla ENTERA mientras no tengan texto propio en esa red; cuando lo tienen se apartan enteros, sin mezclar campos (`copiaEfectiva`, lib/publicacion.ts:190). Un clip cuyos tres campos propios se vacían a mano vuelve a heredarla (`copiaHeredada`, lib/publicacion.ts:201).",
      "Cambiarla no cambia lo que ya se publicó: cada entrada guarda la copia con la que salió. Y hoy solo la usa «Publicar ahora» del diálogo: lo que se programa desde el compositor del Calendario sale con el gancho del clip (components/agenda/compositor-dialog.tsx:334).",
      "Nada de aquí toca el archivo de video ni sus metadatos: es el texto que acompaña a la publicación.",
      "Sin proyectos listos, la página dice «Todavía no tienes ningún proyecto: sube un video y vuelve.» y ofrece «Subir un video» (/subir).",
      "En este panel todos los avisos se pintan en ámbar, también los que bloquean el envío; en la ficha del clip los que bloquean van en rojo.",
      "«Editar la plantilla» de la ficha del clip enlaza a /operaciones/publicacion sin decir de qué proyecto (components/app/copia-clip.tsx:139): la página abre con el primer proyecto listo elegido, que no tiene por qué ser el del clip.",
    ],
    errores: [
      {
        codigo: "tituloLargo",
        cuando: "El título pasa del máximo de la red (100 en YouTube).",
        frase: "app.operaciones.publicacion.avisos.tituloLargo",
        bloquea: true,
      },
      {
        codigo: "textoLargo",
        cuando: "El texto pasa del máximo de la red.",
        frase: "app.operaciones.publicacion.avisos.textoLargo",
        bloquea: true,
      },
      {
        codigo: "demasiadosHashtags",
        cuando:
          "Hay más hashtags de los que la red recomienda (2 en X, 15 en YouTube, 5 en el resto).",
        frase: "app.operaciones.publicacion.avisos.demasiadosHashtags",
        bloquea: false,
      },
      {
        codigo: "hashtagInvalido",
        cuando: "Algún hashtag lleva algo que no es letra, número o guion bajo.",
        frase: "app.operaciones.publicacion.avisos.hashtagInvalido",
        bloquea: false,
      },
      {
        codigo: "vacia",
        cuando:
          "La plantilla de esa red no tiene título, texto ni hashtags: se lee «No hay nada que copiar todavía.» y «Copiar para {red}» se apaga. No impide escribir ni publicar: sin plantilla sale el gancho del clip.",
        frase: "app.operaciones.publicacion.avisos.vacia",
        bloquea: false,
      },
    ],
    endpoints: ["publicar.leer-textos", "publicar.guardar-plantilla", "proyectos.listar"],
    datos: `${DATOS_TEXTOS} Los proyectos salen de \`lib/api/jobs.ts\` (\`listJobs\`, GET /jobs con servidor).`,
    respuesta:
      "Sin aviso ni sonido: guardar es escribir. La confirmación es el punto de la pestaña y los contadores.",
    origen: [
      "components/app/publicacion-panel.tsx:46",
      "components/app/publicacion-panel.tsx:164",
      "hooks/use-publicacion.ts:110",
      "lib/publicacion.ts:35",
      "lib/publicacion.ts:107",
      "lib/publicacion.ts:128",
      "lib/operaciones.ts:40",
      "components/app/copia-clip.tsx:139",
    ],
    relacionadas: [
      "publicar.copiar-texto-plantilla",
      "publicar.vaciar-plantilla",
      "proyectos.escribir-texto-clip",
    ],
  },
  {
    id: "publicar.copiar-texto-plantilla",
    area: "publicar",
    titulo: "Copiar el texto de una red para publicarlo a mano",
    resumen:
      "Llevarse al portapapeles, tal cual lo mandaría Clipealo, el texto de la plantilla de una red para pegarlo al subir el clip por tu cuenta.",
    quien: ["clipero"],
    plan: {
      minimo: "free",
      nota: "En todos los planes, como el resto de Operaciones › Publicación (lib/operaciones.ts:40).",
    },
    donde: [
      {
        ruta: "/operaciones/publicacion",
        etiqueta: "Operaciones › Publicación › «Copiar para {red}»",
      },
    ],
    pasos: [
      "En Operaciones › Publicación elige el proyecto y la pestaña de la red.",
      "Pulsa «Copiar para {red}» (p. ej. «Copiar para TikTok»).",
      "Pega el texto en la red al subir el clip. Si esa publicación estaba en el Calendario, registra luego su enlace con «Ya la publiqué».",
    ],
    reglas: [
      "Copia exactamente lo que se mandaría (`textoParaEnviar`, lib/publicacion.ts:161): lo pegado y lo enviado son lo mismo. En YouTube el título NO entra en lo copiado, porque va en su campo aparte.",
      "Solo lo impide no tener nada escrito (`vacia`, `impideCopiar`, lib/publicacion.ts:150): pasarse de largo no impide copiar, aunque el aviso sigue a la vista.",
      "Si el navegador niega el portapapeles, sale igualmente «Copiado» como aviso neutro y sin sonido, aunque no se haya copiado nada; el texto sigue en pantalla para copiarlo a mano (components/app/publicacion-panel.tsx:176).",
    ],
    errores: [
      {
        codigo: "vacia",
        cuando:
          "La plantilla de esa red no tiene título, texto ni hashtags: el botón está apagado.",
        frase: "app.operaciones.publicacion.avisos.vacia",
        bloquea: true,
      },
    ],
    endpoints: ["publicar.leer-textos"],
    datos: `${DATOS_TEXTOS} Copiar escribe en el portapapeles del sistema y no guarda nada.`,
    respuesta:
      "`toast.success` «Copiado» (sonido `success`) con «Por si lo publicas en {red} fuera de Clipealo.». El botón es el principal del panel pero no es de marca: no suena al pulsar.",
    origen: [
      "components/app/publicacion-panel.tsx:169",
      "components/app/publicacion-panel.tsx:238",
      "lib/publicacion.ts:150",
      "lib/publicacion.ts:161",
    ],
    relacionadas: ["publicar.editar-plantilla-proyecto", "calendario.marcar-publicada"],
  },
  {
    id: "publicar.vaciar-plantilla",
    area: "publicar",
    titulo: "Vaciar la plantilla de una red",
    resumen:
      "Borrar el título, el texto y los hashtags de la plantilla de un proyecto en una red.",
    quien: ["clipero"],
    plan: {
      minimo: "free",
      nota: "En todos los planes, como el resto de Operaciones › Publicación (lib/operaciones.ts:40).",
    },
    donde: [
      {
        ruta: "/operaciones/publicacion",
        etiqueta: "Operaciones › Publicación › «Vaciar lo de {red}»",
      },
    ],
    pasos: [
      "En Operaciones › Publicación elige el proyecto y la pestaña de la red.",
      "Pulsa «Vaciar lo de {red}» (p. ej. «Vaciar lo de YouTube»). Los campos se vacían en el sitio.",
    ],
    reglas: [
      "Solo está activo si la plantilla de esa red tiene algo escrito.",
      "Borra la plantilla de ese proyecto en esa red (`vaciarPlantilla`, hooks/use-publicacion.ts:116). Los clips que la heredaban se quedan sin texto en esa red: al publicarlos ahora sale su gancho (`clip.hook`). Los que tienen texto propio no cambian.",
      "No se puede deshacer: no hay aviso con «Deshacer».",
    ],
    endpoints: ["publicar.vaciar-plantilla"],
    datos: DATOS_TEXTOS,
    respuesta:
      "Ninguna: es un botón fantasma (`ghost`) y no suena. Los campos quedan vacíos, desaparece el punto de la pestaña y aparece el aviso «No hay nada que copiar todavía.».",
    origen: ["components/app/publicacion-panel.tsx:247", "hooks/use-publicacion.ts:116"],
    relacionadas: ["publicar.editar-plantilla-proyecto"],
  },
  {
    id: "publicar.ver-donde-ha-salido",
    area: "publicar",
    titulo: "Ver dónde ha salido un clip",
    resumen:
      "Ver en la ficha del clip cada publicación y programación de ese clip, con su estado escrito y su enlace.",
    quien: ["clipero"],
    donde: [
      {
        ruta: "/proyectos/[id]/clips/[clipId]",
        etiqueta: "Ficha del clip › «Dónde ha salido»",
      },
    ],
    pasos: [
      "Abre la ficha del clip. En la columna de la derecha, bajo los botones, está «Dónde ha salido».",
      "Cada fila dice la red, el estado y, si la entrada tiene enlace (el que devolvió la red o el que se pegó con «Ya la publiqué»), «Abrir».",
      "«Abrir» lleva a la publicación en la red, en otra pestaña.",
      "Con las semillas, «Nadie se va por el sueldo» (clip_04) enseña TikTok «No salió» (la red la rechazó) y dos de YouTube «Planificada».",
    ],
    reglas: [
      "Lista todas las entradas de la agenda de ese clip, por hora (`entradasDeClip`, lib/agenda.ts:899): lo publicado desde Clipealo, lo programado, lo cancelado y lo marcado a mano, más lo que ya estaba publicado antes (las publicaciones que indexa Analíticas).",
      "El estado se deriva de (entrada, cuentas, instante) (`estadoVistoAgenda`, lib/agenda.ts:262): lo publicado y lo cancelado mandan; si no, «Sin cuenta» cuando la cuenta ya no está conectada; una planificada vencida es «Publicándose» si la lleva Clipealo y «Toca publicar» si la publica la persona.",
      "Sin nada, dice «Todavía no ha salido en ninguna cuenta.». La ayuda de debajo: «Lo publicado y lo programado de este clip. Los enlaces son los que devuelve cada red.»",
      "Hoy lee el almacén de la agenda. La lectura en el servidor de lo que dejó la plataforma (`leerEstado`, `GET /publicaciones/{entradaId}`) existe en lib/api pero ninguna pantalla la llama todavía; el código la reserva para Analíticas (lib/api/publicaciones.ts:131).",
    ],
    estados: [
      { estado: "planificada", significa: "«Planificada»: espera su hora." },
      {
        estado: "toca-publicar",
        significa:
          "«Toca publicar»: pasó su hora y la publica la persona (proveedor `manual`).",
      },
      {
        estado: "publicando",
        significa:
          "«Publicándose»: el envío está en marcha, o pasó su hora y la lleva Clipealo.",
      },
      { estado: "publicada", significa: "«Publicada»: con su enlace." },
      { estado: "fallida", significa: "«No salió»." },
      { estado: "cancelada", significa: "«Cancelada»." },
      {
        estado: "sin-cuenta",
        significa: "«Sin cuenta»: la cuenta a la que iba ya no está conectada.",
      },
    ],
    endpoints: ["calendario.listar", "publicar.obtener"],
    datos: DATOS_ENVIO,
    respuesta: "Ninguna: es una consulta.",
    origen: [
      "components/app/publicar-dialog.tsx:402",
      "components/app/clip-detalle.tsx:227",
      "lib/agenda.ts:262",
      "lib/agenda.ts:899",
      "lib/api/publicaciones.ts:136",
    ],
    relacionadas: ["publicar.publicar-clip-ahora", "calendario.reintentar-publicacion"],
  },
]
