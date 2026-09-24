import type { Accion } from "@/lib/wiki/tipos"

/**
 * Acciones de «proyectos»: subir un video, convertirlo en proyecto, seguir su
 * proceso y trabajar sus clips (ficha, estudio, texto por red).
 *
 * Un video subido da un proyecto y sus clips viven dentro de él (/clips ya no
 * existe). Publicar y programar se documentan en sus áreas; aquí solo la
 * puerta que abren desde el estudio y desde la ficha.
 */

const QUIEN: Accion["quien"] = ["clipero", "agencia"]

const DATOS_SUBIDA =
  "En memoria de la página: `useResumableUpload` guarda la cola en estado y los `File` y los `AbortController` en refs, así que nada sobrevive a recargar. El transporte es `simulatedTransport` (lib/api/upload.ts), que recorre el archivo sin guardarlo; cambiarlo por tus-js-client o el multipart de S3 no toca ni el hook ni la interfaz."

const DATOS_TRABAJOS =
  "Frontera `lib/api/jobs.ts`: sin `NEXT_PUBLIC_API_URL`, un `Map` en memoria del módulo sembrado con los cinco proyectos de `lib/mock-data.ts` (src_01 a src_05) y un avance simulado; con servidor, `pedir()` contra `/jobs`. Sin servidor ese `Map` existe dos veces: en el servidor, que pinta la primera vista, y en la pestaña, que sondea y da de alta."

const DATOS_SEMILLA_CLIPS =
  "Semilla `lib/mock-data.ts` (`sourceVideos`, `clips`) leída en el servidor por la página, sin pasar por ninguna frontera de lib/api/: todavía no hay frontera de clips."

/** Acciones de «proyectos». */
export const ACCIONES: Accion[] = [
  /* --- Subir ------------------------------------------------------------- */
  {
    id: "proyectos.subir-video",
    area: "proyectos",
    titulo: "Subir un video",
    resumen:
      "Meter uno o varios videos en la cola de subida para convertirlos en proyectos.",
    quien: QUIEN,
    plan: {
      nota: "Todos los planes. /precios anuncia 1 GB por archivo y 60 min por video en Prueba, y 30 GB y 600 min en Creador y Empresa (lib/pricing.ts:305 y :309); la zona de subida aplica 8 GB a todos y no mira la duración, así que el límite del plan lo tiene que poner el servidor.",
    },
    donde: [
      { ruta: "/subir", etiqueta: "Subir un video › «Arrastra tus videos o súbelos»" },
    ],
    pasos: [
      "Entra en «Subir un video»: el botón naranja de la barra lateral, «Subir un video» en Resumen o en Proyectos, o «Acciones › Subir un video» en el buscador (⌘K).",
      "Arrastra uno o varios videos a la zona «Arrastra tus videos o súbelos» (al pasar por encima dice «Suéltalo aquí»), o pulsa «Seleccionar archivos».",
      "Cada archivo entra en la cola (la lista que los lectores de pantalla anuncian como «Cola de subida») con su nombre, «{subido} de {total}» y su estado; mientras no ha terminado ni fallado, también su porcentaje y su barra.",
      "Junto a los botones de abajo, «Subiendo 2 archivos · 40 %» da el progreso de toda la tanda.",
      "Cuando terminan todos sale «Subida terminada» con «Ver estado». El proyecto se crea al pulsar «Procesar video».",
    ],
    reglas: [
      "Formatos admitidos: MP4, MOV, WebM y MKV (`video/mp4`, `video/quicktime`, `video/webm`, `video/x-matroska`), según el tipo que declara el navegador.",
      "Hasta 8 GB por archivo (`MAX_BYTES`), igual para todos los planes. La zona lo dice: «MP4, MOV, WebM o MKV · hasta 8 GB · la subida se reanuda si se corta».",
      "Se valida la tanda entera antes de añadirla: si un archivo no vale, no entra ninguno de esa tanda. Primero se mira el tipo de todos y después el tamaño, y el mensaje nombra al primero que falla.",
      "Suben dos archivos a la vez (`concurrency = 2`); los demás esperan «En cola».",
      "El progreso es por archivo; el de la tanda se pondera por tamaño, así que un video de 2 GB pesa más que uno de 200 MB.",
      "Se puede volver a elegir el mismo archivo: el selector se vacía después de cada elección.",
      "Hoy la subida es simulada: avanza en trozos de 512 KB cada 90 ms y no guarda el archivo en ninguna parte, así que termina sin `url` y el proyecto nace sin archivo.",
    ],
    estados: [
      {
        estado: "en-cola",
        significa: "«En cola»: esperando hueco (suben dos a la vez).",
      },
      { estado: "subiendo", significa: "«Subiendo»: la transferencia está en marcha." },
      {
        estado: "pausado",
        significa: "«Pausado»: cortada a mano; conserva los bytes confirmados.",
      },
      { estado: "completado", significa: "«Completado»: el archivo entero está arriba." },
      {
        estado: "error",
        significa:
          "«Error»: falló el transporte; la fila enseña el motivo y se puede reintentar.",
      },
    ],
    errores: [
      {
        codigo: "invalidType",
        cuando: "Algún archivo de la tanda no es MP4, MOV, WebM ni MKV.",
        frase: "common.video.upload.invalidType",
        bloquea: true,
      },
      {
        codigo: "tooBig",
        cuando: "Algún archivo de la tanda pasa de 8 GB.",
        frase: "common.video.upload.tooBig",
        bloquea: true,
      },
      {
        codigo: "sin-red",
        cuando:
          "Con un transporte real, la transferencia falla a mitad (el simulado no falla nunca). La fila pasa a «Error» con la frase del código (`common.errors.<código>`: `sin-red` si `fetch` no llega a salir, el del estado HTTP si es un `ErrorApi`, y si no `desconocido`), nunca con el texto del servidor.",
        frase: "common.errors.sin-red",
        bloquea: true,
      },
    ],
    endpoints: ["proyectos.iniciar-subida", "proyectos.subir-trozo"],
    datos: DATOS_SUBIDA,
    respuesta:
      'Al arrastrar encima, la zona se encuadra con las esquinas de recorte de la marca. «Seleccionar archivos» es un botón `brand`: suena «pop». Un archivo rechazado suena a error y sacude la zona (`playSound("error")` + `shake`), con el motivo en rojo debajo. Al terminar la tanda, `toast.celebrate` «Subida terminada» (arpegio y confeti) con «Pulsa «Procesar» para crear el proyecto…» y la acción «Ver estado» → /proyectos; además se lanza el evento `clipealo:subida-completada` y el panel se marca con `data-subida-completada`.',
    origen: [
      "components/video/upload-dropzone.tsx:28",
      "components/video/upload-dropzone.tsx:29",
      "components/video/upload-dropzone.tsx:92",
      "components/video/upload-dropzone.tsx:106",
      "hooks/use-resumable-upload.ts:49",
      "hooks/use-resumable-upload.ts:151",
      "components/app/upload-panel.tsx:167",
      "components/app/upload-panel.tsx:175",
      "components/app/app-sidebar.tsx:136",
      "lib/api/upload.ts:54",
    ],
    relacionadas: [
      "proyectos.pausar-subida",
      "proyectos.reintentar-subida",
      "proyectos.quitar-de-la-cola",
      "proyectos.importar-enlace",
      "proyectos.procesar-videos",
    ],
  },
  {
    id: "proyectos.pausar-subida",
    area: "proyectos",
    titulo: "Pausar una subida",
    resumen: "Detener la subida de un archivo sin perder lo que ya subió.",
    quien: QUIEN,
    donde: [{ ruta: "/subir", etiqueta: "Cola de subida › botón de pausa («Pausar»)" }],
    pasos: [
      "En la fila de un archivo que está «Subiendo», pulsa el botón de pausa (su nombre es «Pausar»).",
      "La fila pasa a «Pausado» y conserva «{subido} de {total}».",
    ],
    reglas: [
      "Solo aparece mientras el archivo está «Subiendo».",
      "Corta la petición en curso con su `AbortController`: la transferencia se para de verdad, no es una animación.",
      "Guarda los bytes confirmados; «Reanudar» sigue desde ahí.",
      "Un archivo pausado no cuenta como subiendo: si los demás han terminado, «Procesar video» se enciende, pero el pausado se queda fuera. Tampoco sale «Subida terminada» mientras haya uno pausado.",
    ],
    endpoints: ["proyectos.subir-trozo"],
    datos: DATOS_SUBIDA,
    respuesta: "Ninguna: la fila cambia de estado, sin sonido ni aviso.",
    origen: [
      "hooks/use-resumable-upload.ts:166",
      "components/video/upload-dropzone.tsx:313",
      "hooks/use-resumable-upload.ts:211",
    ],
    relacionadas: ["proyectos.reanudar-subida", "proyectos.subir-video"],
  },
  {
    id: "proyectos.reanudar-subida",
    area: "proyectos",
    titulo: "Reanudar una subida pausada",
    resumen: "Seguir subiendo un archivo pausado desde el último byte confirmado.",
    quien: QUIEN,
    donde: [
      { ruta: "/subir", etiqueta: "Cola de subida › botón de reproducir («Reanudar»)" },
    ],
    pasos: [
      "En la fila de un archivo «Pausado», pulsa el botón de reproducir (su nombre es «Reanudar»).",
      "La fila vuelve a «En cola» y arranca en cuanto hay hueco.",
    ],
    reglas: [
      "Solo aparece con el archivo «Pausado».",
      "Sigue desde los bytes confirmados (`uploadedBytes`), no desde cero: eso es reanudar, no repetir.",
      "Respeta el límite de dos subidas a la vez: si ya hay dos en marcha, espera en cola.",
    ],
    endpoints: ["proyectos.subir-trozo"],
    datos: DATOS_SUBIDA,
    respuesta: "Ninguna: la fila cambia de estado, sin sonido ni aviso.",
    origen: [
      "hooks/use-resumable-upload.ts:174",
      "hooks/use-resumable-upload.ts:117",
      "components/video/upload-dropzone.tsx:318",
    ],
    relacionadas: ["proyectos.pausar-subida", "proyectos.reintentar-subida"],
  },
  {
    id: "proyectos.reintentar-subida",
    area: "proyectos",
    titulo: "Reintentar una subida que falló",
    resumen: "Volver a intentar un archivo con error sin empezar desde cero.",
    quien: QUIEN,
    donde: [
      {
        ruta: "/subir",
        etiqueta: "Cola de subida › «Reintentar desde donde se quedó»",
      },
    ],
    pasos: [
      "En la fila en «Error» se lee el motivo (p. ej. «No hay conexión. Comprueba tu red y vuelve a intentarlo.»).",
      "Pulsa el botón de reintentar («Reintentar desde donde se quedó»).",
      "La fila vuelve a «En cola», sin el motivo, y sigue desde lo que ya estaba confirmado.",
    ],
    reglas: [
      "Solo aparece con el archivo en «Error».",
      "Conserva los bytes confirmados: se reanuda, no se repite.",
      "El motivo es la frase del código de la API (`common.errors.<código>`), nunca el texto que mandó el servidor.",
    ],
    errores: [
      {
        codigo: "sin-red",
        cuando:
          "Vuelve a fallar el transporte: la fila regresa a «Error» con el motivo nuevo.",
        frase: "common.errors.sin-red",
        bloquea: true,
      },
    ],
    endpoints: ["proyectos.subir-trozo"],
    datos: DATOS_SUBIDA,
    respuesta: "Ninguna: la fila cambia de estado, sin sonido ni aviso.",
    origen: [
      "hooks/use-resumable-upload.ts:179",
      "hooks/use-resumable-upload.ts:108",
      "components/video/upload-dropzone.tsx:323",
    ],
    relacionadas: ["proyectos.subir-video", "proyectos.reanudar-subida"],
  },
  {
    id: "proyectos.quitar-de-la-cola",
    area: "proyectos",
    titulo: "Quitar un archivo de la cola",
    resumen: "Sacar un video de la tanda antes de procesarla.",
    quien: QUIEN,
    donde: [{ ruta: "/subir", etiqueta: "Cola de subida › ✕ («Quitar {nombre}»)" }],
    pasos: [
      "En la fila del archivo, pulsa la ✕ (su nombre es «Quitar masterclass-estructura-narrativa.mp4»).",
      "La fila desaparece de la cola.",
    ],
    reglas: [
      "Está en todas las filas, también en las completadas.",
      "Si estaba subiendo, corta la transferencia; el archivo se olvida y no dará proyecto.",
      "Sin confirmación ni deshacer: para recuperarlo hay que volver a elegirlo.",
      "Hoy no avisa al servidor: con transporte real tendrá que descartar la subida (`DELETE /uploads/{uploadId}`).",
    ],
    endpoints: ["proyectos.cancelar-subida"],
    datos: DATOS_SUBIDA,
    respuesta: "Ninguna: la fila se va, sin sonido ni aviso.",
    origen: [
      "hooks/use-resumable-upload.ts:185",
      "components/video/upload-dropzone.tsx:328",
    ],
    relacionadas: ["proyectos.subir-video", "proyectos.cancelar-y-salir"],
  },
  {
    id: "proyectos.cancelar-y-salir",
    area: "proyectos",
    titulo: "Cancelar la subida y salir",
    resumen: "Irse de /subir sin crear ningún proyecto.",
    quien: QUIEN,
    donde: [{ ruta: "/subir", etiqueta: "Subir un video › «Cancelar»" }],
    pasos: [
      "Pulsa «Cancelar», junto a «Procesar video».",
      "Vuelves a la pantalla anterior.",
    ],
    reglas: [
      "Vuelve atrás en el historial del navegador (`router.back()`), no a una ruta fija.",
      "Al salir de la página se cortan todas las transferencias en curso y la cola se pierde; no se crea ningún proyecto.",
      "No pide confirmación aunque haya archivos a medias.",
    ],
    endpoints: ["proyectos.cancelar-subida"],
    datos: DATOS_SUBIDA,
    respuesta: "Ninguna: es un botón `ghost` y solo navega.",
    origen: ["components/app/upload-panel.tsx:297", "hooks/use-resumable-upload.ts:146"],
    relacionadas: ["proyectos.quitar-de-la-cola"],
  },
  {
    id: "proyectos.importar-enlace",
    area: "proyectos",
    titulo: "Importar un video por enlace",
    resumen: "Pegar el enlace de un video o de un VOD en vez de subir el archivo.",
    quien: QUIEN,
    plan: {
      nota: "La comparativa promete enlaces de YouTube, Google Drive y Vimeo en todos los planes (lib/pricing.ts:312) y «Directos de Twitch y Kick» del plan Creador en adelante (lib/pricing.ts:313). Hoy la app no mira el plan aquí: el botón solo avisa.",
    },
    donde: [
      {
        ruta: "/subir",
        etiqueta: "Subir un video › «…o pega un enlace de YouTube, Drive o Vimeo»",
      },
      {
        ruta: "/subir",
        etiqueta: "Subir un video › «Pega el enlace de tu VOD de {plataforma}»",
      },
    ],
    pasos: [
      "Si tu cuenta tiene un canal o plataformas donde haces directo, encima de la zona de subida sale el campo «Pega el enlace de tu VOD de Twitch», con su logo; con varias, encima salen sus botones con logo (el grupo «Plataforma de origen») para cambiar de una a otra.",
      "Si no, el campo va bajo la zona de subida: «…o pega un enlace de YouTube, Drive o Vimeo».",
      "Pega el enlace y pulsa «Importar» (o Enter).",
      "Sale «Importar por enlace todavía no está conectado», con el enlace pegado debajo.",
    ],
    reglas: [
      "«Importar» está apagado con el campo vacío; se manda el enlace sin espacios a los lados y el campo se vacía.",
      "La plataforma de origen sale de la cuenta: primero la del enlace del canal (`creador.enlaceCanal`), después las de `creador.plataformasDirecto`; «No hago directos» no cuenta.",
      "Pegar un enlace de otra plataforma la elige sola, por el dominio: twitch.tv, youtube.com o youtu.be, kick.com, tiktok.com, facebook.com o fb.watch.",
      "Solo hay un campo de enlace a la vez: con plataforma de origen, el de bajo la zona desaparece.",
      "Hoy no se crea nada, ni subida ni proyecto: el enlace solo sale en el aviso. Propuesta para cuando haya servidor, sin tocar la frontera: dar de alta el trabajo con `sourceUrl` = el enlace (`NuevoTrabajo`, lib/api/jobs.ts:128) y que el servidor lo descargue.",
    ],
    endpoints: ["proyectos.crear"],
    datos:
      "No se guarda nada. La plataforma de origen se lee de la cuenta del navegador (`useCuenta`, clave `clipealo-cuenta-v1`).",
    respuesta:
      "`toast` neutro, sin sonido: «Importar por enlace todavía no está conectado», con el enlace como descripción. «Importar» es `outline` y no suena; cambiar de plataforma de origen hace «tap» (opción de un grupo).",
    origen: [
      "components/app/upload-panel.tsx:188",
      "components/app/upload-panel.tsx:339",
      "components/app/upload-panel.tsx:111",
      "components/app/upload-panel.tsx:414",
      "components/video/upload-dropzone.tsx:100",
      "components/video/upload-dropzone.tsx:198",
    ],
    relacionadas: ["proyectos.subir-video", "proyectos.procesar-videos"],
  },
  {
    id: "proyectos.elegir-ajustes-de-clips",
    area: "proyectos",
    titulo: "Elegir cómo quieres los clips",
    resumen:
      "Decidir formato, duración, idioma, subtítulos y seguimiento de rostro antes de procesar.",
    quien: QUIEN,
    plan: {
      nota: "En /subir todo está abierto a todos los planes. La comparativa reserva a Creador y Empresa los subtítulos automáticos (lib/pricing.ts:321), el reencuadre automático con seguimiento (lib/pricing.ts:330) y los formatos distintos de 9:16 (lib/pricing.ts:339): lo tendrá que aplicar el servidor.",
    },
    donde: [{ ruta: "/subir", etiqueta: "Subir un video › «Cómo quieres los clips»" }],
    pasos: [
      "En «Formato principal», elige 9:16 (Vertical), 4:5 (Retrato), 1:1 (Cuadrado) o 16:9 (Horizontal): cada botón dibuja el rectángulo y el nombre sale al pasar por encima.",
      "En «Duración objetivo del clip», mueve el control; la cifra en segundos sale a la derecha.",
      "En «Idioma del audio», elige «Detectar automáticamente», «Español», «Inglés», «Portugués» o «Francés».",
      "Enciende o apaga «Subtítulos automáticos» y «Seguimiento de rostro».",
    ],
    reglas: [
      "Duración objetivo: de 15 a 120 s, de 5 en 5; empieza en 45 s. La ayuda dice «Entre 30 y 60 s es lo que mejor retiene en Reels y Shorts.».",
      "El formato parte del que premia tu primera red de publicación (`clipero.redes`) y, si no hay, de 9:16; mientras no lo cambies se lee «Elegido para TikTok e Instagram.» con tus redes.",
      "El idioma parte del primero de tus idiomas que reconoce el proceso y, si no hay, de Español.",
      "Subtítulos y seguimiento de rostro empiezan encendidos.",
      "Lo que eliges aquí no viaja todavía: el alta del trabajo manda solo nombre, peso y dirección del archivo (components/app/upload-panel.tsx:311). Formato, duración y subtítulos solo aparecen en el aviso «Proyecto creado».",
      "No se guarda: al volver a /subir se parte otra vez de la cuenta.",
    ],
    endpoints: ["proyectos.crear"],
    datos:
      "Estado de la página. Los valores de partida salen de la cuenta del navegador (`preseleccionSubida`).",
    respuesta:
      "Elegir un formato hace «tap» (opción de un grupo) y los interruptores suenan al encenderse y al apagarse (`toggle-on` / `toggle-off`). Sin avisos.",
    origen: [
      "components/app/upload-panel.tsx:47",
      "components/app/upload-panel.tsx:81",
      "components/app/upload-panel.tsx:158",
      "components/app/upload-panel.tsx:162",
      "components/app/upload-panel.tsx:240",
      "components/app/upload-panel.tsx:311",
      "components/shared/interaction-feedback.tsx:36",
      "lib/sound.ts:12",
    ],
    relacionadas: ["proyectos.procesar-videos"],
  },
  {
    id: "proyectos.procesar-videos",
    area: "proyectos",
    titulo: "Procesar los videos subidos",
    resumen:
      "Crear un proyecto por cada video que terminó de subir: la acción central del producto.",
    quien: QUIEN,
    plan: {
      nota: "Todos los planes. Cada plan trae sus minutos de video al mes —60 en Prueba, 600 en Creador y 600 en Empresa (`MINUTOS_INCLUIDOS`, lib/pricing.ts:159)—, pero hoy la app no los comprueba ni los descuenta.",
    },
    donde: [{ ruta: "/subir", etiqueta: "Subir un video › «Procesar video»" }],
    pasos: [
      "Con la cola terminada, pulsa «Procesar video» («Procesar videos» si hay varios).",
      "Se da de alta un trabajo por cada archivo «Completado», uno detrás de otro.",
      "Sale «Proyecto creado» (o «3 proyectos creados») con «9:16 · 45 s · con subtítulos», y te lleva a Proyectos, donde el nuevo aparece arriba.",
    ],
    reglas: [
      "Apagado con la cola vacía, con algún archivo «En cola» o «Subiendo», o mientras se está creando uno.",
      "Solo crea proyecto de los archivos «Completado»: los pausados o con error se quedan fuera, aunque cuenten en la etiqueta del botón.",
      "Si ninguno está completado, el aviso dice «Sin proyectos que crear» y aun así lleva a Proyectos.",
      "Si falla el alta de uno, se para ahí: los anteriores quedan creados, sale «No se ha podido crear el proyecto» y no se navega.",
      "El título del proyecto es el nombre del archivo. Nace «En cola», etapa «Subiendo», 0 % y sin clips.",
      "Se escribe en la caché de la lista al momento: se ve en /proyectos sin esperar al sondeo, que arranca solo porque el trabajo nace activo.",
      "Sin servidor, el avance es simulado: 1,6 puntos por segundo desde que se crea; al llegar a 100 queda «Listo» con 8 clips (lib/api/jobs.ts:54 y :89).",
      "Sin servidor, el alta se hace en la pestaña (`useCrearTrabajo` llama a `createJob` en el navegador): el proyecto nuevo vive en la memoria de esa pestaña y desaparece al recargar, porque la primera pintura sale del `Map` del servidor, que no lo tiene.",
    ],
    estados: [
      { estado: "en-cola", significa: "Recién creado o reencolado; etapa «Subiendo»." },
      {
        estado: "procesando",
        significa:
          "Avanza por «Transcribiendo», «Analizando momentos», «Recortando» y «Reencuadrando a vertical», con su porcentaje.",
      },
      {
        estado: "listo",
        significa: "Terminado: etapa «Listo», 100 % y sus clips dentro.",
      },
      {
        estado: "error",
        significa: "Falló: «Error al procesar» y el botón «Reintentar».",
      },
    ],
    errores: [
      {
        codigo: "createFailed",
        cuando:
          "Falla el alta de un trabajo. La descripción del aviso es la frase de su código (`common.errors.<código>`), nunca el texto del servidor.",
        frase: "app.jobs.createFailed",
        bloquea: true,
      },
      {
        codigo: "conflicto",
        cuando:
          "Con servidor: el video no cabe en el plan o la subida no es válida (409/422).",
        frase: "common.errors.conflicto",
        bloquea: true,
      },
    ],
    endpoints: ["proyectos.crear"],
    datos: DATOS_TRABAJOS,
    respuesta:
      "Botón `brand`: suena «pop» y se encuadra con la marca de recorte al pulsar. Al acabar, `toast.success` («ding») «Proyecto creado» con «9:16 · 45 s · con subtítulos». Si falla, `toast.error` (sonido de error y sacudida del aviso) «No se ha podido crear el proyecto».",
    origen: [
      "components/app/upload-panel.tsx:304",
      "components/app/upload-panel.tsx:307",
      "components/app/upload-panel.tsx:309",
      "components/app/upload-panel.tsx:317",
      "components/app/upload-panel.tsx:324",
      "hooks/use-jobs.ts:63",
      "hooks/use-jobs.ts:69",
      "hooks/use-jobs.ts:76",
      "lib/api/jobs.ts:66",
      "lib/api/jobs.ts:139",
    ],
    relacionadas: [
      "proyectos.subir-video",
      "proyectos.elegir-ajustes-de-clips",
      "proyectos.ver-proyectos",
    ],
  },

  /* --- Seguir los proyectos ---------------------------------------------- */
  {
    id: "proyectos.ver-proyectos",
    area: "proyectos",
    titulo: "Ver tus proyectos y su estado",
    resumen: "Repasar todos los videos subidos y en qué punto está cada uno.",
    quien: QUIEN,
    donde: [{ ruta: "/proyectos", etiqueta: "Proyectos" }],
    pasos: [
      "Entra en «Proyectos» desde la barra lateral.",
      "Cada proyecto es una fila: miniatura con la duración, título, la etiqueta de la operación si lo es («Recortar», «Reducir tamaño», «Variante»), «6 clips» si ya tiene, y «1:20:12 · 2,5 GB · la semana pasada».",
      "Debajo, su estado: la etapa y el porcentaje («Analizando momentos 62 %»), «Error al procesar» o «Listo».",
      "A la derecha, «Ver clips» si está listo o «Ver estado» si no; los dos llevan a su página. Con error, además, «Reintentar».",
      "Mientras algo procesa, arriba se lee «Actualizando estado…» en cada consulta.",
    ],
    reglas: [
      "Lo último subido, arriba (por `uploadedAt`).",
      "Se vuelve a preguntar cada 2 s (`POLL_MS`) mientras quede algún proyecto en cola o procesando; cuando no queda ninguno, el sondeo se apaga solo. Al volver a la pestaña solo se refresca si algo sigue activo.",
      "La primera pintura sale del servidor, sin estado de carga.",
      "La lista, «En proceso» de Resumen y la página de un proyecto sin terminar comparten consulta: se actualizan a la vez con un solo sondeo.",
      "El «hace cuánto» se cuenta desde la fecha fija de la demo (`AHORA_DEMO`, 13 sep 2026, 12:20 UTC).",
      "«Subir un video» va en `outline`: el naranja de esa acción ya está en la barra lateral.",
    ],
    estados: [
      { estado: "en-cola", significa: "Esperando proceso; etapa «Subiendo»." },
      { estado: "procesando", significa: "Nombra la etapa en curso y su porcentaje." },
      { estado: "listo", significa: "Con clips: el botón pasa a «Ver clips»." },
      { estado: "error", significa: "«Error al procesar», con «Reintentar»." },
    ],
    endpoints: ["proyectos.listar"],
    datos: DATOS_TRABAJOS,
    respuesta: "Ninguna: es consulta, sin sonido.",
    origen: [
      "app/[locale]/(app)/proyectos/page.tsx:46",
      "components/app/projects-list.tsx:22",
      "components/app/projects-list.tsx:57",
      "components/app/projects-list.tsx:99",
      "hooks/use-jobs.ts:23",
      "hooks/use-jobs.ts:41",
      "lib/api/jobs.ts:96",
      "lib/fechas.ts:51",
    ],
    relacionadas: [
      "proyectos.reintentar-proyecto",
      "proyectos.seguir-proceso",
      "proyectos.abrir-proyecto",
    ],
  },
  {
    id: "proyectos.reintentar-proyecto",
    area: "proyectos",
    titulo: "Reintentar un proyecto con error",
    resumen: "Volver a poner en cola un video cuyo proceso falló.",
    quien: QUIEN,
    donde: [
      { ruta: "/proyectos", etiqueta: "Proyectos › «Reintentar» en la fila" },
      {
        ruta: "/proyectos/[id]",
        etiqueta: "Proyecto › «Todavía no hay clips» › «Reintentar»",
      },
      { ruta: "/dashboard", etiqueta: "Resumen › «En proceso» › «Reintentar»" },
    ],
    pasos: [
      "En un proyecto con «Error al procesar» (en la demo, «Entrevista — Product-market fit sin inversión»), pulsa «Reintentar».",
      "Mientras se pide, el icono gira y el botón se apaga.",
      "Sale «Proyecto reencolado» con su título, y la fila vuelve a «Subiendo» 0 %.",
    ],
    reglas: [
      "Solo aparece con el proyecto en error.",
      "Vuelve a empezar desde cero: en cola, etapa «Subiendo», 0 %.",
      "El resultado se escribe al momento en la lista y en el detalle, y el sondeo se enciende solo porque el proyecto vuelve a estar activo.",
      "Solo se apaga el botón del proyecto que se reintenta: los demás siguen pulsables.",
    ],
    errores: [
      {
        codigo: "retryFailed",
        cuando:
          "Falla el reintento. La descripción dice por qué: `app.jobs.notFound` si el proyecto no existe, o la frase del código de la API.",
        frase: "app.jobs.retryFailed",
        bloquea: true,
      },
      {
        codigo: "JobNotFoundError",
        cuando: "Sin servidor, el id no está en el almacén de la simulación.",
        frase: "app.jobs.notFound",
        bloquea: true,
      },
      {
        codigo: "no-encontrado",
        cuando: "Con servidor, el proyecto ya no existe (404).",
        frase: "common.errors.no-encontrado",
        bloquea: true,
      },
    ],
    endpoints: ["proyectos.reintentar"],
    datos: DATOS_TRABAJOS,
    respuesta:
      "`toast.success` («ding») «Proyecto reencolado» con el título. Si falla, `toast.error` (sonido de error y sacudida) «No se pudo reintentar». El botón es `outline`: no suena al pulsar.",
    origen: [
      "components/app/projects-list.tsx:82",
      "components/app/proyecto-proceso.tsx:62",
      "components/app/active-jobs.tsx:71",
      "hooks/use-jobs.ts:81",
      "hooks/use-jobs.ts:95",
      "hooks/use-jobs.ts:98",
      "lib/api/jobs.ts:168",
    ],
    relacionadas: [
      "proyectos.ver-proyectos",
      "proyectos.seguir-proceso",
      "proyectos.ver-en-proceso",
    ],
  },
  {
    id: "proyectos.seguir-proceso",
    area: "proyectos",
    titulo: "Seguir el proceso de un proyecto",
    resumen:
      "Ver en qué etapa va un video que todavía no tiene clips y abrirlos cuando terminen.",
    quien: QUIEN,
    donde: [{ ruta: "/proyectos/[id]", etiqueta: "Proyecto › «Todavía no hay clips»" }],
    pasos: [
      "En Proyectos, pulsa «Ver estado» en uno que no está listo (p. ej. «Directo — Preguntas y respuestas de septiembre»).",
      "La página dice «Todavía no hay clips» y «53:10 · En cuanto termine el análisis aparecen aquí.», con la etapa y el porcentaje.",
      "Se actualiza sola cada 2 s.",
      "Al terminar aparece «Ver los clips», que vuelve a pedir la página para enseñarlos.",
    ],
    reglas: [
      "Siembra la consulta con TODOS los proyectos, no solo con este: es la misma que la lista y que Resumen, y sembrarla con uno dejaba las otras dos vistas con un solo proyecto.",
      "«Ver los clips» vuelve a pedir la página al servidor (`router.refresh()`), porque los clips los pinta el servidor. Hoy esa página decide con el estado de la semilla, así que en la demo el proyecto sigue enseñando el proceso: tendrá que leer `GET /jobs/{id}` y sus clips.",
      "Un proyecto recién creado todavía no tiene página: la ruta busca en la semilla `sourceVideos` y responde «Este clip no existe.».",
      "Con error, «Reintentar» aquí mismo.",
    ],
    estados: [
      {
        estado: "subiendo",
        significa:
          "«Subiendo»: en la simulación, del 0 al ~16 % (cada una de las 6 etapas ocupa una sexta parte del progreso).",
      },
      { estado: "transcribiendo", significa: "«Transcribiendo»." },
      { estado: "analizando", significa: "«Analizando momentos»." },
      { estado: "recortando", significa: "«Recortando»." },
      { estado: "reencuadrando", significa: "«Reencuadrando a vertical»." },
      { estado: "listo", significa: "«Listo»: aparece «Ver los clips»." },
    ],
    errores: [
      {
        codigo: "no-encontrado",
        cuando: "El id no está en la semilla (p. ej. un proyecto recién creado).",
        frase: "common.notFound.title",
        bloquea: true,
      },
    ],
    endpoints: ["proyectos.listar", "proyectos.obtener"],
    datos: `${DATOS_TRABAJOS} La página en sí lee la semilla \`sourceVideos\` en el servidor.`,
    respuesta: "Ninguna: es consulta, sin sonido.",
    origen: [
      "app/[locale]/(app)/proyectos/[id]/page.tsx:87",
      "app/[locale]/(app)/proyectos/[id]/page.tsx:52",
      "components/app/proyecto-proceso.tsx:38",
      "components/app/proyecto-proceso.tsx:72",
      "components/video/processing-status.tsx:25",
      "hooks/use-jobs.ts:47",
    ],
    relacionadas: [
      "proyectos.ver-proyectos",
      "proyectos.abrir-proyecto",
      "proyectos.reintentar-proyecto",
    ],
  },
  {
    id: "proyectos.ver-en-proceso",
    area: "proyectos",
    titulo: "Seguir lo que está en proceso desde Resumen",
    resumen:
      "Ver de un vistazo los videos en cola, procesando o con error sin salir del panel.",
    quien: QUIEN,
    donde: [{ ruta: "/dashboard", etiqueta: "Resumen › «En proceso»" }],
    pasos: [
      "En «Resumen», la tarjeta «En proceso» lista cada proyecto en cola, procesando o con error, con su duración, hace cuánto se subió y su estado.",
      "Con error, «Reintentar» ahí mismo.",
      "«Ver todos los proyectos» lleva a Proyectos.",
      "Si no queda nada, dice «Todo procesado. No hay nada en cola.».",
    ],
    reglas: [
      "Enseña los activos (en cola o procesando) y los que tienen error; los listos no.",
      "Comparte consulta y sondeo con /proyectos: las dos se mueven a la vez.",
    ],
    endpoints: ["proyectos.listar"],
    datos: DATOS_TRABAJOS,
    respuesta: "Ninguna: es consulta, sin sonido.",
    origen: [
      "app/[locale]/(app)/dashboard/page.tsx:110",
      "components/app/active-jobs.tsx:30",
      "components/app/active-jobs.tsx:32",
    ],
    relacionadas: ["proyectos.reintentar-proyecto", "proyectos.ver-proyectos"],
  },

  /* --- Los clips de un proyecto ------------------------------------------ */
  {
    id: "proyectos.abrir-proyecto",
    area: "proyectos",
    titulo: "Abrir un proyecto y ver sus clips",
    resumen: "Entrar en un video procesado para ver todos los clips que salieron de él.",
    quien: QUIEN,
    donde: [{ ruta: "/proyectos/[id]", etiqueta: "Proyecto" }],
    pasos: [
      "En Proyectos, pulsa «Ver clips» en uno listo (p. ej. «Podcast #42 — Cómo escalar un equipo remoto»).",
      "Arriba, el título y «6 clips generados de este video»; a la derecha, «Abrir el estudio».",
      "Debajo, las tarjetas de sus clips con los filtros encima.",
    ],
    reglas: [
      "Un video subido da un proyecto y sus clips viven dentro: no hay una biblioteca plana que mezcle los de varios videos.",
      "Si el proyecto no está «Listo», en vez de los clips sale su proceso.",
      "Hoy la página lee la semilla (`sourceVideos` y `clips`) en el servidor, no la frontera: con servidor pedirá `GET /jobs/{id}` y `GET /jobs/{id}/clips`.",
      "Un id que no existe enseña «Este clip no existe.» con «Volver al inicio» y «Ver mis clips», pero responde 200: el segmento tiene `loading.tsx`, y es una ruta privada excluida en `robots.ts`.",
      "Si la página falla: «No hemos podido abrir el estudio» — «El proyecto puede estar aún procesándose o el enlace ha caducado. Tus clips siguen intactos.», con reintentar y «Volver a proyectos».",
    ],
    errores: [
      {
        codigo: "no-encontrado",
        cuando: "El proyecto no existe.",
        frase: "common.notFound.title",
        bloquea: true,
      },
    ],
    endpoints: ["proyectos.obtener", "proyectos.listar-clips"],
    datos: DATOS_SEMILLA_CLIPS,
    respuesta: "Ninguna: es navegación.",
    origen: [
      "app/[locale]/(app)/proyectos/[id]/page.tsx:52",
      "app/[locale]/(app)/proyectos/[id]/page.tsx:70",
      "app/[locale]/(app)/proyectos/[id]/page.tsx:74",
      "app/[locale]/(app)/proyectos/[id]/page.tsx:81",
      "app/[locale]/(app)/proyectos/[id]/error.tsx:14",
      "app/[locale]/not-found.tsx:10",
    ],
    relacionadas: [
      "proyectos.filtrar-clips",
      "proyectos.ver-clip",
      "proyectos.abrir-estudio",
    ],
  },
  {
    id: "proyectos.filtrar-clips",
    area: "proyectos",
    titulo: "Buscar, filtrar y ordenar los clips de un proyecto",
    resumen: "Quedarse con los clips que interesan y compartir esa vista con un enlace.",
    quien: QUIEN,
    donde: [{ ruta: "/proyectos/[id]", etiqueta: "Proyecto › filtros sobre los clips" }],
    pasos: [
      "Escribe en «Buscar por título, gancho o etiqueta…».",
      "Elige estado: «Todos», «Borrador», «Listo» o «Publicado».",
      "En «Formato», «Todos» o uno: «9:16 · Vertical», «1:1 · Cuadrado», «4:5 · Retrato», «16:9 · Horizontal».",
      "En «Ordenar por»: «Mejor puntuación», «Más reciente» o «Más largo».",
      "«3 de 6 clips» dice cuántos quedan; con algún filtro puesto aparece «Limpiar», que quita búsqueda, estado y formato.",
      "Si no queda ninguno: «Ningún clip coincide» y «Limpiar filtros».",
    ],
    reglas: [
      "Todo vive en la URL (`q`, `estado`, `formato`, `orden`): «los publicados de este proyecto» es un enlace que se comparte, /proyectos/src_01?estado=publicado.",
      "La búsqueda no distingue mayúsculas y mira título, gancho y etiquetas juntos.",
      "Por defecto: todos los estados y formatos, por mejor puntuación.",
      "«Más largo» ordena por la duración del tramo; «Más reciente», por fecha de creación.",
      "«Limpiar» no toca el orden.",
      "Se filtra en el navegador, sobre los clips del proyecto.",
    ],
    endpoints: ["proyectos.listar-clips"],
    datos: `${DATOS_SEMILLA_CLIPS} Los filtros, en la URL (nuqs).`,
    respuesta:
      "Sin avisos. Elegir un estado hace «tap», porque es un grupo de opciones de una sola elección; el resto de filtros no suena. El recuento se anuncia a los lectores de pantalla (`aria-live`).",
    origen: [
      "components/app/clips-library.tsx:29",
      "components/app/clips-library.tsx:30",
      "components/app/clips-library.tsx:35",
      "components/app/clips-library.tsx:46",
      "components/app/clips-library.tsx:59",
      "components/app/clips-library.tsx:69",
      "components/app/clips-library.tsx:93",
      "components/app/clips-library.tsx:139",
      "components/shared/interaction-feedback.tsx:38",
    ],
    relacionadas: ["proyectos.abrir-proyecto", "proyectos.ver-clip"],
  },
  {
    id: "proyectos.ver-clips-recientes",
    area: "proyectos",
    titulo: "Ver los clips recientes en Resumen",
    resumen: "Abrir desde el panel los últimos clips sin entrar en cada proyecto.",
    quien: QUIEN,
    donde: [{ ruta: "/dashboard", etiqueta: "Resumen › «Clips recientes»" }],
    pasos: [
      "En «Resumen», «Clips recientes» enseña cuatro tarjetas de clip.",
      "Pulsa un título para abrir su ficha; «Ver todos» lleva a Proyectos.",
    ],
    reglas: [
      "Hoy son los cuatro primeros de la semilla (`clips.slice(0, 4)`), todos del Podcast #42.",
      "Las tarjetas tienen el mismo menú que en el proyecto, pero aquí «Eliminar» y el botón de reproducir no hacen nada: la tarjeta no recibe `onDelete` ni `onPlay`.",
      "La rejilla es `auto-fit`: las cuatro llenan la fila también a 2560 px.",
    ],
    endpoints: ["proyectos.listar-clips-cuenta"],
    datos: "Semilla `clips` de lib/mock-data.ts, leída en el servidor.",
    respuesta: "Ninguna: es navegación.",
    origen: [
      "app/[locale]/(app)/dashboard/page.tsx:140",
      "app/[locale]/(app)/dashboard/page.tsx:130",
    ],
    relacionadas: ["proyectos.ver-clip"],
  },
  {
    id: "proyectos.ver-clip",
    area: "proyectos",
    titulo: "Abrir la ficha de un clip",
    resumen:
      "Ver un clip, por qué se cortó ahí y todo lo necesario para publicarlo, en una pantalla.",
    quien: QUIEN,
    donde: [{ ruta: "/proyectos/[id]/clips/[clipId]", etiqueta: "Ficha del clip" }],
    pasos: [
      "Pulsa el título de una tarjeta de clip (o «Publicar…» en su menú).",
      "A la izquierda, el reproductor; a su lado, «Por qué este momento» con el gancho, los datos («Formato», «Duración», «Tramo del original», «Subtítulos», «Etiquetas») y «El texto con el que sale».",
      "Debajo, «Lo que se dice»: la transcripción del tramo, «De Podcast #42 — Cómo escalar un equipo remoto, entre 10:12 y 11:05».",
      "En la columna derecha: el estado y la puntuación, «Publicar», «Editar el clip», «Descargar 9:16» (apagado) y «Dónde ha salido».",
    ],
    reglas: [
      "La ruta lleva el id del proyecto y el del clip: un clip pedido desde otro proyecto responde «Este clip no existe.», sin redirigir, porque el enlace estaba mal.",
      "La transcripción es solo el tramo del clip (las frases que lo pisan). Sin transcripción guardada: «De este tramo todavía no hay transcripción guardada.»; hoy solo tienen `src_01` y `src_05`.",
      "Puntuación: 85 o más es alta, de 70 a 84 media y por debajo baja; al pasar por encima explica qué significa («Muy probable que funcione: gancho claro en los primeros 3 segundos.»).",
      "Con 9:16, 1:1 o 4:5, si la columna es lo bastante ancha, el reproductor va al lado de los datos; con 16:9 todo se apila.",
      "«Publicar» abre el diálogo de publicación y «Dónde ha salido» lista lo publicado y lo programado (área Publicar).",
    ],
    estados: [
      { estado: "borrador", significa: "Se ve «Borrador», con la insignia de contorno." },
      { estado: "listo", significa: "Se ve «Listo», con la insignia secundaria." },
      { estado: "publicado", significa: "Se ve «Publicado», con la insignia verde." },
    ],
    errores: [
      {
        codigo: "no-encontrado",
        cuando: "El clip no existe o es de otro proyecto.",
        frase: "common.notFound.title",
        bloquea: true,
      },
    ],
    endpoints: [
      "proyectos.obtener-clip",
      "proyectos.obtener-transcripcion",
      "proyectos.listar-oradores",
    ],
    datos:
      "Semilla `lib/mock-data.ts` leída en el servidor (`clips`, `sourceVideos`, `transcriptDe`, `speakers`). El texto por red vive en `localStorage` (`clipealo-publicacion-v1`).",
    respuesta: "Ninguna: es navegación.",
    origen: [
      "app/[locale]/(app)/proyectos/[id]/clips/[clipId]/page.tsx:42",
      "app/[locale]/(app)/proyectos/[id]/clips/[clipId]/page.tsx:63",
      "components/app/clip-detalle.tsx:64",
      "components/app/clip-detalle.tsx:107",
      "components/app/clip-detalle.tsx:159",
      "components/video/score-badge.tsx:10",
    ],
    relacionadas: [
      "proyectos.reproducir-clip",
      "proyectos.escribir-texto-clip",
      "proyectos.descargar-clip",
      "proyectos.abrir-estudio",
    ],
  },
  {
    id: "proyectos.reproducir-clip",
    area: "proyectos",
    titulo: "Reproducir un clip",
    resumen:
      "Ver el clip en el reproductor del producto, con su tramo marcado sobre el video entero.",
    quien: QUIEN,
    donde: [
      {
        ruta: "/proyectos/[id]/clips/[clipId]",
        etiqueta: "Ficha del clip › reproductor",
      },
      { ruta: "/studio/[id]", etiqueta: "Estudio › reproductor" },
      {
        ruta: "/proyectos/[id]",
        etiqueta: "Proyecto › botón de reproducir de la tarjeta",
      },
    ],
    pasos: [
      "En la ficha o en el estudio, con archivo, pulsa el botón naranja del centro (solo aparece si hay `src`) o «Reproducir (espacio)» en la barra de abajo.",
      "En la barra: «Silenciar (m)» y el volumen, el tiempo, la velocidad y «Pantalla completa (f)».",
      "En la lista de clips de un proyecto, el botón de reproducir de la tarjeta (sale al pasar por encima) avisa «Reproduciendo «El error de contratar por zona horaria»»; en el estudio, ese botón elige el clip.",
    ],
    reglas: [
      "Atajos con el foco en el reproductor: espacio o K reproduce y pausa; ← y → saltan 5 s; J y L, 10 s; «,» y «.» van fotograma a fotograma; ↑ y ↓ cambian el volumen un 10 %; M silencia; F pantalla completa; del 0 al 9 saltan a esa décima parte del video. No actúan mientras se escribe en un campo.",
      "Velocidades: 0.5×, 0.75×, 1× («normal»), 1.25×, 1.5× y 2×. Por debajo de 640 px no salen ni la velocidad ni la barra de volumen (el volumen lo lleva el sistema); silenciar sí.",
      "La barra pinta el tramo del clip sobre el video entero.",
      "Reproduciendo, los controles se esconden a los 2,6 s sin mover el puntero.",
      "El botón de subtítulos solo sale si hay pista de subtítulos (`captionsSrc`). Su nombre anuncia la tecla («Mostrar subtítulos (c)»), pero la C no está entre los atajos.",
      "Hoy no hay archivo que reproducir: ni la ficha ni el estudio pasan `src` al reproductor y ningún clip de la semilla lo trae, así que enseña el encuadre con el título, sin botón central y con reproducir, silenciar, velocidad y pantalla completa apagados. Para que reproduzca hace falta que el servidor rellene `Clip.src` (HLS .m3u8 o un archivo que el navegador lea) y que la ficha y el estudio se lo pasen.",
    ],
    errores: [
      {
        codigo: "load",
        cuando: "El archivo no carga: «No se pudo cargar el video», con «Reintentar».",
        frase: "common.video.player.error.load",
        bloquea: true,
      },
      {
        codigo: "blocked",
        cuando: "El navegador bloquea la reproducción.",
        frase: "common.video.player.error.blocked",
        bloquea: true,
      },
    ],
    endpoints: ["proyectos.obtener-clip"],
    datos: "El archivo será `Clip.src` (HLS .m3u8 o .mp4). Hoy vacío en toda la semilla.",
    respuesta:
      "Ninguna: la reproducción no suena ni avisa, salvo el `toast` neutro «Reproduciendo «…»» de la tarjeta en la lista de clips.",
    origen: [
      "components/video/video-player.tsx:39",
      "components/video/video-player.tsx:181",
      "components/video/video-player.tsx:202",
      "components/video/video-player.tsx:229",
      "components/video/video-player.tsx:250",
      "components/video/video-player.tsx:333",
      "hooks/use-video-player.ts:237",
      "hooks/use-video-player.ts:279",
      "components/app/clips-library.tsx:157",
      "components/app/studio.tsx:281",
      "components/video/clip-card.tsx:118",
    ],
    relacionadas: ["proyectos.ver-clip", "proyectos.abrir-estudio"],
  },
  {
    id: "proyectos.escribir-texto-clip",
    area: "proyectos",
    titulo: "Escribir el texto con el que sale un clip",
    resumen:
      "Dar a un clip su propio título, texto y hashtags en cada red, apartándolo de la plantilla del proyecto.",
    quien: QUIEN,
    donde: [
      {
        ruta: "/proyectos/[id]/clips/[clipId]",
        etiqueta: "Ficha del clip › «El texto con el que sale»",
      },
    ],
    pasos: [
      "En la ficha, en «El texto con el que sale», elige la red en las pestañas (TikTok, Instagram, YouTube, X, LinkedIn, Facebook); la que ya sale con algún texto, propio o de la plantilla, lleva un punto.",
      "Si el clip hereda una plantilla con texto, se lee «Viene de la plantilla del proyecto.» con el enlace «Editar la plantilla».",
      "Escribe en «Título», «Hashtags» y «Texto»; debajo, «120 de 2200 caracteres» y «Separados por espacios o comas. 2 de 5 recomendados.».",
      "Se guarda al teclear, sin botón.",
    ],
    reglas: [
      "Uno por red. Sin texto propio, el clip sale con la plantilla de su proyecto (Operaciones › Publicación); en cuanto escribes algo, manda lo tuyo y se aparta entero, sin mezclar campos.",
      "Límites (lib/publicacion.ts:35): TikTok e Instagram 2.200 caracteres y 5 hashtags; YouTube título 100, texto 5.000 y 15 hashtags; X 280 y 2; LinkedIn 3.000 y 5; Facebook 63.206 y 5. El campo «Título» está en todas las pestañas, pero su contador solo sale en YouTube, la única con título aparte; en las demás el título abre el texto al publicar (`textoParaEnviar`, lib/publicacion.ts:161).",
      "Pasarse de caracteres se avisa en rojo: la red rechazaría la publicación, así que la bloquea. Pasarse de hashtags, o un hashtag con algo que no sea letras, números o guion bajo, se avisa en ámbar: solo pierde alcance.",
      "Los hashtags se normalizan: «#» delante, sin espacios y sin repetidos (sin distinguir mayúsculas).",
      "No tener nada escrito no se avisa aquí: sin texto propio ni plantilla, el clip sale con el gancho que propuso la IA (components/app/publicar-dialog.tsx:194).",
      "Se abre en la pestaña de TikTok.",
    ],
    errores: [
      {
        codigo: "tituloLargo",
        cuando: "El título pasa de lo que acepta la red (YouTube, 100).",
        frase: "app.operaciones.publicacion.avisos.tituloLargo",
        bloquea: true,
      },
      {
        codigo: "textoLargo",
        cuando: "El texto pasa de lo que acepta la red.",
        frase: "app.operaciones.publicacion.avisos.textoLargo",
        bloquea: true,
      },
      {
        codigo: "demasiadosHashtags",
        cuando: "Más hashtags de los recomendados para esa red.",
        frase: "app.operaciones.publicacion.avisos.demasiadosHashtags",
        bloquea: false,
      },
      {
        codigo: "hashtagInvalido",
        cuando: "Un hashtag lleva algo que no es letra, número o guion bajo.",
        frase: "app.operaciones.publicacion.avisos.hashtagInvalido",
        bloquea: false,
      },
    ],
    endpoints: ["proyectos.listar-copias-clip", "proyectos.guardar-copia-clip"],
    datos:
      "`localStorage`, clave `clipealo-publicacion-v1` (hooks/use-publicacion.ts): mapa `copias` por `clipId:red`, junto a las plantillas por proyecto. Las otras pestañas se enteran por el evento `storage`.",
    respuesta:
      "Ninguna: se guarda en silencio. Los avisos de límite aparecen debajo, en rojo si bloquean y en ámbar si no.",
    origen: [
      "components/app/copia-clip.tsx:43",
      "components/app/copia-clip.tsx:125",
      "components/app/copia-clip.tsx:128",
      "components/app/copia-clip.tsx:135",
      "components/app/copia-clip.tsx:69",
      "lib/publicacion.ts:35",
      "lib/publicacion.ts:128",
      "lib/publicacion.ts:161",
      "components/app/publicar-dialog.tsx:194",
      "hooks/use-publicacion.ts:99",
    ],
    relacionadas: ["proyectos.volver-a-plantilla", "proyectos.ver-clip"],
  },
  {
    id: "proyectos.volver-a-plantilla",
    area: "proyectos",
    titulo: "Devolver un clip a la plantilla del proyecto",
    resumen:
      "Borrar el texto propio de un clip en una red para que vuelva a salir con la plantilla.",
    quien: QUIEN,
    donde: [
      {
        ruta: "/proyectos/[id]/clips/[clipId]",
        etiqueta: "Ficha del clip › «El texto con el que sale» › «Volver a la plantilla»",
      },
    ],
    pasos: [
      "En la pestaña de una red donde el clip tiene texto propio, pulsa «Volver a la plantilla».",
      "Los campos enseñan otra vez la plantilla del proyecto, o se quedan vacíos si no la hay.",
    ],
    reglas: [
      "Solo aparece cuando el clip tiene texto propio en esa red.",
      "Borra lo propio, no copia la plantilla encima: si la copiara, mejorar la plantilla dejaría de llegar a este clip.",
      "Solo afecta a la red de la pestaña.",
    ],
    endpoints: ["proyectos.borrar-copia-clip"],
    datos:
      "`localStorage`, clave `clipealo-publicacion-v1`: se borra la entrada `clipId:red` del mapa `copias`.",
    respuesta: "Ninguna: los campos cambian, sin sonido ni aviso.",
    origen: [
      "components/app/copia-clip.tsx:210",
      "components/app/copia-clip.tsx:217",
      "hooks/use-publicacion.ts:106",
    ],
    relacionadas: ["proyectos.escribir-texto-clip"],
  },
  {
    id: "proyectos.copiar-enlace-clip",
    area: "proyectos",
    titulo: "Copiar el enlace de un clip",
    resumen: "Llevarse al portapapeles la dirección de la ficha de un clip para pasarla.",
    quien: QUIEN,
    donde: [
      {
        ruta: "/proyectos/[id]",
        etiqueta: "Tarjeta del clip › menú «Acciones de {título}» › «Copiar enlace»",
      },
      {
        ruta: "/dashboard",
        etiqueta: "Resumen › «Clips recientes» › menú › «Copiar enlace»",
      },
      {
        ruta: "/studio/[id]",
        etiqueta: "Estudio › pestaña «Clips» › menú › «Copiar enlace»",
      },
    ],
    pasos: [
      "Abre el menú de la tarjeta (los tres puntos, «Acciones de El error de contratar por zona horaria»).",
      "Pulsa «Copiar enlace».",
      "Sale «Enlace copiado».",
    ],
    reglas: [
      "Copia exactamente el enlace que pinta la tarjeta, con el idioma de la URL incluido.",
      "En el estudio, la tarjeta enlaza al propio estudio con `?clip=`, así que se copia ese enlace.",
      "Sin permiso de portapapeles (o sin HTTPS) avisa del fallo en vez de fingir que copió.",
    ],
    errores: [
      {
        codigo: "linkFailed",
        cuando: "El navegador no deja escribir en el portapapeles.",
        frase: "common.video.clipCard.linkFailed",
        bloquea: true,
      },
    ],
    endpoints: ["proyectos.obtener-clip"],
    datos:
      "Nada que guardar: el enlace es la ruta de la ficha. Quien lo abra pedirá el clip.",
    respuesta:
      "`toast.success` («ding») «Enlace copiado»; si falla, `toast.error` (sonido de error y sacudida) «No se ha podido copiar el enlace».",
    origen: [
      "components/video/clip-card.tsx:192",
      "components/video/clip-card.tsx:197",
      "components/video/clip-card.tsx:200",
      "components/video/clip-card.tsx:203",
    ],
    relacionadas: ["proyectos.ver-clip"],
  },
  {
    id: "proyectos.eliminar-clip",
    area: "proyectos",
    titulo: "Eliminar un clip",
    resumen: "Quitar un clip de su proyecto, con la opción de deshacerlo.",
    quien: QUIEN,
    donde: [
      { ruta: "/proyectos/[id]", etiqueta: "Tarjeta del clip › menú › «Eliminar»" },
    ],
    pasos: [
      "Abre el menú de la tarjeta y pulsa «Eliminar» (en rojo, al final).",
      "Sale «Clip «Nadie se va por el sueldo» eliminado» con «Deshacer».",
      "«Deshacer» responde «Restaurado».",
    ],
    reglas: [
      "Hoy es solo el aviso: el clip no sale de la lista (viene de la semilla) y «Deshacer» no tiene nada que devolver.",
      "Solo en la lista de un proyecto: en Resumen y en el estudio el menú enseña «Eliminar» pero no hace nada (la tarjeta no recibe `onDelete`).",
      "Sin confirmación previa: la red de seguridad es «Deshacer», así que el servidor tiene que poder restaurar lo borrado.",
    ],
    endpoints: ["proyectos.eliminar-clip", "proyectos.restaurar-clip"],
    datos: DATOS_SEMILLA_CLIPS,
    respuesta:
      "`toast.error` con el sonido «remove» (no el de error, así que no sacude) y la acción «Deshacer»; «Deshacer» responde con `toast.success` («ding») «Restaurado».",
    origen: [
      "components/video/clip-card.tsx:228",
      "components/app/clips-library.tsx:158",
      "components/app/clips-library.tsx:163",
      "lib/toast.ts:83",
    ],
    relacionadas: ["proyectos.filtrar-clips"],
  },
  {
    id: "proyectos.descargar-clip",
    area: "proyectos",
    titulo: "Descargar un clip",
    resumen: "Bajarse el archivo del clip en su formato.",
    quien: QUIEN,
    plan: {
      nota: "La comparativa: 720p en Prueba y 4K en Creador y Empresa (lib/pricing.ts:337), solo 9:16 en Prueba (lib/pricing.ts:339) y marca de agua en Prueba (lib/pricing.ts:354). Hoy no hay archivo, así que ningún plan descarga.",
    },
    donde: [
      { ruta: "/studio/[id]", etiqueta: "Estudio › «Descargar»" },
      {
        ruta: "/proyectos/[id]/clips/[clipId]",
        etiqueta: "Ficha del clip › «Descargar 9:16»",
      },
      { ruta: "/proyectos/[id]", etiqueta: "Tarjeta del clip › menú › «Descargar 9:16»" },
    ],
    pasos: [
      "En el estudio, pulsa «Descargar»: avisa «Preparando descarga…» y no baja nada.",
      "En la ficha y en el menú de la tarjeta, «Descargar 9:16» (con el formato del clip) está apagado, con el motivo «Descargar y duplicar necesitan el archivo renderizado, que todavía no se genera.».",
      "En el mismo menú, «Duplicar» está apagado por el mismo motivo.",
    ],
    reglas: [
      "Apagado con el motivo escrito, y no mudo y pulsable: es la regla de la casa. En la ficha, el motivo cuelga del botón con `aria-describedby`.",
      "La etiqueta lleva el formato del clip (`Clip.aspect`).",
      "El archivo no existe todavía: hace falta que el servidor lo genere (`src` del clip).",
    ],
    endpoints: ["proyectos.renderizar-clip"],
    datos: "No hay archivo: `Clip.src` está vacío en toda la semilla.",
    respuesta:
      "En el estudio, `toast` neutro con el sonido «tap» «Preparando descarga…». En la ficha y en la tarjeta no hay respuesta: están apagados.",
    origen: [
      "components/app/studio.tsx:163",
      "components/app/clip-detalle.tsx:208",
      "components/video/clip-card.tsx:182",
      "components/video/clip-card.tsx:185",
      "components/video/clip-card.tsx:188",
    ],
    relacionadas: ["proyectos.ver-clip", "proyectos.abrir-estudio"],
  },

  /* --- El estudio -------------------------------------------------------- */
  {
    id: "proyectos.abrir-estudio",
    area: "proyectos",
    titulo: "Abrir el estudio de un proyecto",
    resumen:
      "Pasar al editor para retocar los clips de un video: recorte, formato, título y encuadre.",
    quien: QUIEN,
    donde: [
      { ruta: "/studio/[id]", etiqueta: "Estudio" },
      { ruta: "/proyectos/[id]", etiqueta: "Proyecto › «Abrir el estudio»" },
      {
        ruta: "/proyectos/[id]/clips/[clipId]",
        etiqueta: "Ficha del clip › «Editar el clip»",
      },
    ],
    pasos: [
      "Desde el proyecto, «Abrir el estudio»; desde una tarjeta, «Editar clip»; desde la ficha, «Editar el clip» (estos dos abren ya con ese clip).",
      "Arriba: el título, «1:20:12 · 6 clips detectados», el selector de formato, «Descargar», «Programar» y «Publicar».",
      "En el centro, el reproductor y «Recorte del clip» («Propuesto por IA»); a la derecha, las pestañas «Clips», «Transcripción» y «Ajustes»; abajo, la línea de tiempo.",
      "Pulsa una tarjeta de «Clips» (o un clip en la línea de tiempo) para editarlo: la URL pasa a /studio/src_01?clip=clip_04.",
    ],
    reglas: [
      "Sin `?clip=`, o con un id que no es del proyecto, se abre el primero de sus clips.",
      "Al cambiar de clip se cargan su tramo, su título y su formato; lo tocado en el anterior se pierde (hoy nada se guarda).",
      "Desde 1280 px ocupa todo el ancho y el alto disponibles, sin scroll de página; por debajo, todo se apila.",
      "Hoy el estudio enseña la transcripción y la línea de tiempo del Podcast #42 (`src_01`) sea cual sea el proyecto.",
      "Un proyecto sin clips (todavía en proceso) abre igual, sin «Publicar».",
      "En la pestaña «Clips», las tarjetas enlazan al propio estudio (`?clip=`): su título y «Publicar…» de su menú eligen el clip en vez de abrir la ficha, y «Eliminar» no hace nada (la tarjeta no recibe `onDelete`).",
      "Si falla al abrir: «No hemos podido abrir el estudio» — «El proyecto puede estar aún procesándose o el enlace ha caducado. Tus clips siguen intactos.», con «Volver a proyectos».",
    ],
    errores: [
      {
        codigo: "no-encontrado",
        cuando:
          "El proyecto no existe: «Este clip no existe.» con respuesta 200 (el segmento tiene `loading.tsx`).",
        frase: "common.notFound.title",
        bloquea: true,
      },
    ],
    endpoints: [
      "proyectos.obtener",
      "proyectos.listar-clips",
      "proyectos.obtener-transcripcion",
    ],
    datos:
      "Semilla `lib/mock-data.ts` en el servidor (`sourceVideos`, `clips`, `transcript`, `timelineTracks`); el clip activo, en la URL (nuqs).",
    respuesta:
      "Ninguna visible: es navegación. Al cambiar de clip, los lectores de pantalla oyen «Clip seleccionado: {título}» (`aria-live`).",
    origen: [
      "app/[locale]/(app)/studio/[id]/page.tsx:42",
      "app/[locale]/(app)/studio/[id]/page.tsx:46",
      "app/[locale]/(app)/studio/[id]/error.tsx:14",
      "components/app/studio.tsx:17",
      "components/app/studio.tsx:59",
      "components/app/studio.tsx:73",
      "components/app/studio.tsx:202",
      "components/app/studio.tsx:280",
      "components/video/clip-card.tsx:87",
      "components/app/clip-detalle.tsx:190",
    ],
    relacionadas: [
      "proyectos.ajustar-recorte",
      "proyectos.cambiar-formato-clip",
      "proyectos.renombrar-clip",
      "proyectos.navegar-linea-de-tiempo",
    ],
  },
  {
    id: "proyectos.ajustar-recorte",
    area: "proyectos",
    titulo: "Ajustar el recorte de un clip",
    resumen:
      "Mover el inicio y el fin del clip, o el clip entero, sobre el video original.",
    quien: QUIEN,
    donde: [{ ruta: "/studio/[id]", etiqueta: "Estudio › «Recorte del clip»" }],
    pasos: [
      "En «Recorte del clip», arrastra la manija naranja de la izquierda («Inicio del clip») o la de la derecha («Fin del clip»).",
      "Arrastra el centro para mover el clip entero sin cambiar su duración.",
      "Con el teclado, sobre una manija: ← y → mueven 1 s; con Mayús, 5 s; con Alt, un fotograma (1/30 s).",
      "Debajo se leen el inicio, la duración y el fin, con milésimas.",
      "Al soltar sale «Recorte actualizado».",
    ],
    reglas: [
      "Entre 5 y 180 s de largo, y siempre dentro del video.",
      "La ventana del recorte es el entorno del clip, no el video entero: el tramo más un margen a cada lado de al menos 20 s o el 60 % de su duración, lo que sea mayor. Se fija al elegir clip para que la escala no salte al arrastrar.",
      "La onda se genera a la resolución de esa ventana, no se corta de la del video entero.",
      "Hoy no se guarda: el tramo vive en la página y se pierde al cambiar de clip o recargar.",
    ],
    endpoints: ["proyectos.actualizar-clip"],
    datos:
      "Estado de la página del estudio. El tramo inicial es `Clip.range` de la semilla.",
    respuesta:
      "`toast` neutro «Recorte actualizado» con el sonido «snip», el de recortar, al soltar la manija y con cada pulsación de flecha.",
    origen: [
      "components/app/studio.tsx:237",
      "components/app/studio.tsx:241",
      "components/app/studio.tsx:244",
      "components/app/studio.tsx:84",
      "components/video/trim-range.tsx:67",
      "components/video/trim-range.tsx:79",
      "components/video/trim-range.tsx:108",
      "lib/sound.ts:13",
    ],
    relacionadas: ["proyectos.abrir-estudio", "proyectos.navegar-linea-de-tiempo"],
  },
  {
    id: "proyectos.cambiar-formato-clip",
    area: "proyectos",
    titulo: "Cambiar el formato de un clip en el estudio",
    resumen: "Ver el clip en otra proporción: vertical, cuadrado, retrato u horizontal.",
    quien: QUIEN,
    plan: {
      nota: "La comparativa da solo 9:16 a Prueba (lib/pricing.ts:339); el estudio ofrece los cuatro a todos los planes.",
    },
    donde: [
      { ruta: "/studio/[id]", etiqueta: "Estudio › selector de formato de la cabecera" },
    ],
    pasos: [
      "En la cabecera del estudio, elige 9:16 (Vertical), 4:5 (Retrato), 1:1 (Cuadrado) o 16:9 (Horizontal).",
      "El reproductor cambia de proporción al momento, sin salirse del hueco.",
    ],
    reglas: [
      "Empieza con el formato del clip y vuelve a él al cambiar de clip.",
      "Hoy solo cambia la vista previa: no se guarda ni cambia `Clip.aspect`.",
    ],
    endpoints: ["proyectos.actualizar-clip"],
    datos: "Estado de la página del estudio.",
    respuesta: "Elegir un formato hace «tap» (opción de un grupo). Sin avisos.",
    origen: [
      "components/app/studio.tsx:63",
      "components/app/studio.tsx:159",
      "lib/sound.ts:12",
    ],
    relacionadas: ["proyectos.abrir-estudio", "proyectos.descargar-clip"],
  },
  {
    id: "proyectos.renombrar-clip",
    area: "proyectos",
    titulo: "Cambiar el título de un clip",
    resumen: "Poner a un clip un título propio en el estudio.",
    quien: QUIEN,
    donde: [
      {
        ruta: "/studio/[id]",
        etiqueta: "Estudio › pestaña «Ajustes» › «Título del clip»",
      },
    ],
    pasos: [
      "En la pestaña «Ajustes», escribe en «Título del clip»; debajo se lee «38/90 caracteres».",
      "Debajo, «Gancho detectado» y «Etiquetas» se ven pero no se editan.",
    ],
    reglas: [
      "Hasta 90 caracteres: el campo no deja escribir más.",
      "Hoy no se guarda: se pierde al cambiar de clip o recargar.",
      "El gancho y las etiquetas son del análisis: solo lectura.",
    ],
    endpoints: ["proyectos.actualizar-clip"],
    datos:
      "Estado de la página del estudio. El título inicial es `Clip.title` de la semilla.",
    respuesta: "Ninguna.",
    origen: [
      "components/app/studio.tsx:67",
      "components/app/studio.tsx:316",
      "components/app/studio.tsx:320",
    ],
    relacionadas: ["proyectos.abrir-estudio"],
  },
  {
    id: "proyectos.reencuadrar-clip",
    area: "proyectos",
    titulo: "Reencuadrar un clip de nuevo",
    resumen: "Pedir otra vez el encuadre automático de un clip.",
    quien: QUIEN,
    plan: {
      nota: "La comparativa reserva el reencuadre automático con seguimiento a Creador y Empresa (lib/pricing.ts:330); el botón del estudio no mira el plan.",
    },
    donde: [
      {
        ruta: "/studio/[id]",
        etiqueta: "Estudio › pestaña «Ajustes» › «Reencuadrar de nuevo»",
      },
    ],
    pasos: [
      "En la pestaña «Ajustes», pulsa «Reencuadrar de nuevo».",
      "Sale «Buscando encuadres alternativos…».",
    ],
    reglas: ["Hoy solo avisa: no cambia nada del clip."],
    endpoints: ["proyectos.reencuadrar-clip"],
    datos: "Nada: no hay servicio de reencuadre detrás.",
    respuesta:
      "`toast` neutro, sin sonido: «Buscando encuadres alternativos…». El botón es `outline` y no suena.",
    origen: ["components/app/studio.tsx:345", "components/app/studio.tsx:349"],
    relacionadas: ["proyectos.abrir-estudio"],
  },
  {
    id: "proyectos.navegar-linea-de-tiempo",
    area: "proyectos",
    titulo: "Moverse por la línea de tiempo del estudio",
    resumen:
      "Ir a cualquier momento del video y saltar de un clip a otro desde la vista de pistas.",
    quien: QUIEN,
    donde: [{ ruta: "/studio/[id]", etiqueta: "Estudio › línea de tiempo" }],
    pasos: [
      "Abajo del estudio, la línea de tiempo enseña las pistas «Video», «Clips detectados» y «Subtítulos».",
      "Pulsa en la regla de tiempos o en un hueco de una pista para llevar el cabezal ahí; arriba se lee el tiempo del cabezal.",
      "Pulsa un clip de «Clips detectados» para editarlo: el foco pasa a su tarjeta del panel.",
      "«Acercar» y «Alejar» cambian el zoom; entre los dos se lee la cifra («1.0×»).",
    ],
    reglas: [
      "Zoom de 1× a 24×, multiplicando o dividiendo por 1,75 en cada pulsación; en los extremos el botón se apaga.",
      "Solo los clips se pueden elegir; los tramos de video y de subtítulos no.",
      "El zoom ensancha el lienzo y deja hacer scroll; con más de 40 elementos en una pista solo pinta los que se ven y un margen.",
      "La línea de tiempo, la onda del recorte y la transcripción comparten el mismo tiempo: moverlo en una mueve las otras. El reproductor lo escribe al reproducir, cuando haya archivo.",
      "Hoy las pistas son las del Podcast #42 (`timelineTracks`) en todos los proyectos.",
    ],
    endpoints: ["proyectos.listar-clips", "proyectos.obtener-transcripcion"],
    datos:
      "Semilla `timelineTracks` de lib/mock-data.ts; el zoom, en el estado de la página.",
    respuesta: "Ninguna.",
    origen: [
      "components/app/studio.tsx:362",
      "components/app/studio.tsx:122",
      "components/video/timeline.tsx:190",
      "components/video/timeline.tsx:191",
      "components/video/timeline.tsx:244",
      "components/video/timeline.tsx:276",
      "lib/mock-data.ts:457",
    ],
    relacionadas: ["proyectos.abrir-estudio", "proyectos.buscar-en-transcripcion"],
  },
  {
    id: "proyectos.buscar-en-transcripcion",
    area: "proyectos",
    titulo: "Buscar en la transcripción y saltar a un momento",
    resumen: "Encontrar una frase del video y llevar el cabezal a donde se dice.",
    quien: QUIEN,
    donde: [
      { ruta: "/studio/[id]", etiqueta: "Estudio › pestaña «Transcripción»" },
      {
        ruta: "/proyectos/[id]/clips/[clipId]",
        etiqueta: "Ficha del clip › «Lo que se dice»",
      },
    ],
    pasos: [
      "Escribe en «Buscar en la transcripción…»: se quedan las frases que lo contienen, con lo buscado resaltado.",
      "Pulsa una frase: en el estudio lleva el cabezal a su inicio (la línea de tiempo y la onda del recorte se mueven con él); en la ficha la marca como la frase actual.",
      "Las frases que la IA marcó llevan «Momento»; cada una dice quién habla («Ana Ruiz», «Invitado»).",
    ],
    reglas: [
      "La búsqueda no distingue mayúsculas y resalta la primera coincidencia de cada frase. Sin resultados: «Sin resultados para «{búsqueda}».».",
      "En el estudio la lista sigue sola a la frase que suena, salvo mientras buscas; en la ficha no, para no arrastrar la página.",
      "En la ficha solo están las frases del tramo del clip, y pulsar una no mueve el reproductor: el tiempo que cambia es el de la transcripción, que el reproductor no recibe.",
    ],
    endpoints: ["proyectos.obtener-transcripcion", "proyectos.listar-oradores"],
    datos: "Semilla `lib/mock-data.ts` (`transcript`, `transcriptPrecios`, `speakers`).",
    respuesta: "Ninguna.",
    origen: [
      "components/video/transcript-panel.tsx:48",
      "components/video/transcript-panel.tsx:59",
      "components/video/transcript-panel.tsx:90",
      "components/video/transcript-panel.tsx:153",
      "components/app/studio.tsx:300",
      "components/app/clip-detalle.tsx:160",
      "components/app/clip-detalle.tsx:164",
    ],
    relacionadas: ["proyectos.ver-clip", "proyectos.navegar-linea-de-tiempo"],
  },
  {
    id: "proyectos.programar-clips",
    area: "proyectos",
    titulo: "Programar los clips de un proyecto",
    resumen:
      "Mandar los clips de un proyecto al Calendario para repartirlos por los próximos días.",
    quien: QUIEN,
    plan: {
      minimo: "creator",
      nota: "Programar es del plan Creador en adelante (`PLAN_MINIMO.programar`). En Prueba, «Programar» del estudio está apagado con «Programar es del plan Creador en adelante.» y «Ver los planes». Un plan creado en el backoffice manda por su lista de capacidades. Publicar ahora no tiene puerta: es de todos los planes.",
    },
    donde: [
      { ruta: "/studio/[id]", etiqueta: "Estudio › «Programar»" },
      { ruta: "/proyectos/[id]", etiqueta: "Tarjeta del clip › menú › «Programar…»" },
    ],
    pasos: [
      "En el estudio, pulsa «Programar»: sale «Clip listo para publicar» — «Elige en qué cuentas sale y cuándo: ahora o a la hora que marques.» y se abre el Calendario con todos los clips del proyecto.",
      "Desde el menú de una tarjeta, «Programar…» abre el Calendario con ese clip.",
      "Los días, las horas y las cuentas se eligen en el Calendario (área Calendario).",
    ],
    reglas: [
      "Lleva a /calendario?crear=1&clips=clip_01,clip_02,… con los ids del proyecto; sin clips, solo con `crear=1`.",
      "El botón del estudio mira el plan; «Programar…» de la tarjeta enlaza siempre.",
      "Apagado, el motivo cuelga del botón con `aria-describedby`, porque un botón apagado sale del orden de tabulación.",
    ],
    errores: [
      {
        codigo: "publishBlocked",
        cuando: "El plan no llega a Creador.",
        frase: "app.studio.publishBlocked",
        bloquea: true,
      },
    ],
    endpoints: ["proyectos.listar-clips"],
    datos:
      "Los ids salen de los clips del proyecto (semilla); el plan, de `usePlan` (clave `clipealo-plan-v1`).",
    respuesta:
      "`toast` neutro «Clip listo para publicar», sin sonido, y navegación al Calendario. El botón es `outline`: no suena al pulsar.",
    origen: [
      "components/app/studio.tsx:58",
      "components/app/studio.tsx:111",
      "components/app/studio.tsx:175",
      "components/app/studio.tsx:179",
      "components/app/studio.tsx:185",
      "components/video/clip-card.tsx:217",
      "lib/pricing.ts:76",
      "lib/pricing.ts:110",
    ],
    relacionadas: ["proyectos.abrir-estudio"],
  },
]
