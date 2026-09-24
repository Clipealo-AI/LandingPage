import type { Accion } from "@/lib/wiki/tipos"

/**
 * Acciones de «ayuda»: escribirle al equipo (el casillero, visto desde la app),
 * leer lo que contesta y el buscador ⌘K.
 *
 * Lo que el equipo hace con la cola (abrir, responder, archivar en
 * /admin/feedback) es del backoffice.
 */
export const ACCIONES: Accion[] = [
  {
    id: "ayuda.enviar-comentario",
    area: "ayuda",
    titulo: "Enviar un comentario al equipo",
    resumen:
      "Cuenta una idea, un fallo o una duda al equipo de Clipealo desde cualquier pantalla, y el mensaje guarda desde cuál se escribió.",
    quien: ["clipero", "agencia"],
    donde: [
      { ruta: "/ayuda", etiqueta: "Ayuda › Tus mensajes › «Enviar un comentario»" },
      {
        ruta: "/dashboard",
        etiqueta:
          "Menú de usuario (tu nombre, al pie de la barra lateral) › «Enviar un comentario». Está en todas las pantallas de la app",
      },
    ],
    pasos: [
      "Abre el menú de usuario (tu nombre, abajo en la barra lateral) y pulsa «Enviar un comentario». También está en Ayuda, junto al título «Tus mensajes».",
      "Se abre «Cuéntanos». En «¿De qué va?» elige una opción: «Una idea» (marcada al abrir), «Algo no funciona», «Precios y planes», «Contenido y formación» u «Otra cosa».",
      "Escribe en «Tu mensaje» qué esperabas, qué pasó y en qué pantalla. Debajo del campo se lee desde dónde se manda, p. ej. «Se manda desde /calendario».",
      "Pulsa «Enviar». Si el texto es demasiado corto o demasiado largo, el aviso sale bajo el campo y el diálogo sigue abierto con lo escrito.",
      "Con el texto bien, el diálogo se cierra y aparece «Mensaje enviado». «Ahora no» cierra sin mandar nada.",
    ],
    reglas: [
      "El texto se mide sin los espacios de los bordes y tiene que tener entre 10 y 1200 caracteres (`LIMITES_FEEDBACK.textoMin` y `textoMax`). Fuera de ese margen no se manda.",
      "Siempre hay un tipo elegido: el formulario nace con «Una idea» (`FEEDBACK_NUEVO`) y volver a pulsar la opción marcada no la desmarca.",
      "Quién escribe no se elige: si la cuenta tiene perfil de agencia el mensaje va como «agencia»; en cualquier otro caso, como «clipero». Una agencia que pudiera escribir como clipero falsearía la cola.",
      "El autor es el nombre de la cuenta. El `userId`, hoy, es siempre el de la cuenta de demostración (`CUENTA_DEMO.userId`, «u_ana»), aunque se haya registrado otro nombre: no hay sesión todavía.",
      "Se guarda la pantalla desde la que se escribe como ruta interna, en español, sin idioma ni consulta y con los segmentos dinámicos sin rellenar: «/campanas/[id]», no «/campaigns/cmp_liga». Se dice antes de mandar («Se manda desde …»): nada viaja a escondidas.",
      "El mensaje nace en «nuevo» (se ve como «Enviado»), sin respuesta. La fecha es el «ahora» de la demo (`AHORA_DEMO`, 2026-09-13T12:20:00.000Z) y no el reloj real, para que la cola ordene bien frente a las semillas.",
      "El id lo pone hoy el navegador: `fb_` + la hora del reloj real en base 36 + la longitud del texto tal como se escribió (`nuevoIdFeedback`), no `Math.random()`. La fecha, en cambio, es la de la demo.",
      "Es contenido de usuario: se guarda tal cual (solo sin los espacios de los bordes) y nunca se traduce ni se reescribe.",
      "Cada vez que se abre, el formulario empieza vacío.",
      "El aviso de longitud solo sale después del primer «Enviar»; desde ahí se recalcula mientras escribes y desaparece en cuanto el texto vale.",
      "Ningún plan lo limita: ni el diálogo ni el menú miran el plan.",
      "No se puede borrar un mensaje enviado: el equipo, como mucho, lo archiva.",
    ],
    estados: [
      {
        estado: "nuevo",
        significa:
          "«Enviado». Nadie del equipo lo ha abierto. Es el número que pinta la barra del backoffice junto a Casillero.",
      },
      {
        estado: "leido",
        significa:
          "«Leído por el equipo». Alguien del equipo lo abrió en /admin/feedback (abrirlo es leerlo). Sigue abierto (`ABIERTOS`): todavía se puede responder o archivar.",
      },
      {
        estado: "respondido",
        significa:
          "«Respondido». Hay respuesta; queda sin leer hasta que la persona la marca en Ayuda › Tus mensajes.",
      },
      {
        estado: "archivado",
        significa:
          "«Archivado». Deja de contar como abierto para el equipo, pero no se borra: sigue en la tabla de /admin/feedback y en Ayuda › Tus mensajes de quien lo escribió.",
      },
    ],
    errores: [
      {
        codigo: "textoCorto",
        cuando: "El texto, sin los espacios de los bordes, tiene menos de 10 caracteres.",
        frase: "feedback.dialogo.errors.textoCorto",
        bloquea: true,
      },
      {
        codigo: "textoLargo",
        cuando: "El texto pasa de 1200 caracteres.",
        frase: "feedback.dialogo.errors.textoLargo",
        bloquea: true,
      },
    ],
    endpoints: ["ayuda.enviar"],
    datos:
      "Almacén del navegador `clipealo-feedback-v1` (hooks/use-feedback.ts): el mensaje se añade a `creados`, junto a las cuatro semillas de lib/feedback.ts. El backoffice lee el mismo almacén, así que aparece en /admin/feedback sin recargar. «Reiniciar demo» lo vacía y vuelve a dejar solo las semillas.",
    respuesta:
      "«Enviar» es el botón `brand`: suena «pop» y se encuadra con la marca de recorte al pulsarlo, también cuando el texto no vale. Elegir un tipo suena «tap». Con el mensaje guardado sale `toast.success` «Mensaje enviado» («Lo lee el equipo. Si hay respuesta, la verás en Ayuda › Tus mensajes.») con su sonido `success`. Un texto que no vale no lanza aviso ni sonido de error: la frase va bajo el campo, en el color `destructive`.",
    origen: [
      "components/app/feedback-dialog.tsx:83",
      "components/app/feedback-dialog.tsx:96",
      "components/app/feedback-dialog.tsx:104",
      "components/app/feedback-dialog.tsx:150",
      "components/app/user-nav-menu.tsx:179",
      "components/app/mis-mensajes.tsx:45",
      "lib/feedback.ts:41",
      "lib/feedback.ts:71",
      "lib/feedback.ts:96",
      "lib/feedback.ts:116",
      "hooks/use-feedback.ts:119",
      "i18n/navigation.ts:8",
      "tests/e2e/casillero.spec.ts:14",
      "tests/e2e/casillero.spec.ts:64",
    ],
    relacionadas: [
      "ayuda.leer-mis-mensajes",
      "ayuda.marcar-respuesta-leida",
      "ayuda.abrir-respuestas-desde-avisos",
    ],
  },
  {
    id: "ayuda.leer-mis-mensajes",
    area: "ayuda",
    titulo: "Leer tus mensajes y las respuestas del equipo",
    resumen:
      "Ver todo lo que le has escrito al equipo, en qué estado está cada mensaje y qué te ha contestado.",
    quien: ["clipero", "agencia"],
    donde: [{ ruta: "/ayuda", etiqueta: "Ayuda › Tus mensajes" }],
    pasos: [
      "Entra en «Ayuda», en el grupo Cuenta de la barra lateral.",
      "En «Tus mensajes» sale cada mensaje que has escrito, del más nuevo al más viejo, con su tipo, su estado, «Enviado el …» y «Desde /ruta».",
      "Si el equipo contestó, debajo va el bloque «Respuesta del equipo» con el texto y «Respondido el …». Si no, «Sin respuesta todavía».",
      "Una respuesta que aún no has marcado lleva la insignia «Nueva».",
    ],
    reglas: [
      "Solo salen los tuyos (mismo `userId`, `misFeedbacks`), ordenados por fecha de envío, del más nuevo al más viejo. En la demo «tuyos» es siempre `CUENTA_DEMO.userId` («u_ana»), sea cual sea el nombre de la cuenta.",
      "Salen en todos sus estados, también «Archivado»: archivar cambia el estado para el equipo, no quita el mensaje de tu historial.",
      "La insignia de estado va en el tono de éxito (`success`) si está «Respondido» y en el neutro (`secondary`) en los demás; «Nueva», en el de aviso (`warning`). El color acompaña a la palabra, no la sustituye.",
      "El texto y la respuesta se enseñan tal cual, con sus saltos de línea: son contenido de usuario y no se traducen.",
      "Sin mensajes, la sección lo dice: «Todavía no has escrito nada. Cuando algo te chirríe, dínoslo: es la forma más rápida de que cambie.»",
      "Abrir la página no marca nada como leído: la insignia «Nueva» solo se quita con «Marcar como leída».",
      "Debajo va «Centro de ayuda en construcción»: la ayuda escrita (guías de formatos y límites, solución de errores de proceso, atajos de teclado del editor) aún no existe. La descripción de la página remite a hola@clipealo.com, y «Volver al resumen» lleva a /dashboard.",
    ],
    estados: [
      { estado: "nuevo", significa: "«Enviado»: el equipo aún no lo ha abierto." },
      {
        estado: "leido",
        significa: "«Leído por el equipo»: lo abrieron; todavía puede llegar respuesta.",
      },
      {
        estado: "respondido",
        significa: "«Respondido»: debajo está la respuesta, con su fecha.",
      },
      {
        estado: "archivado",
        significa:
          "«Archivado»: dejó de estar pendiente para el equipo sin borrarse; sigue aquí, con su respuesta si la tenía.",
      },
    ],
    endpoints: ["ayuda.listar"],
    datos:
      "Almacén del navegador `clipealo-feedback-v1`: semillas de lib/feedback.ts más lo creado en este navegador, con los cambios del equipo aplicados encima. La cuenta de demostración (Ana Ruiz, «u_ana») tiene dos semillas: `fb_s1` («Algo no funciona», sin abrir, desde /campanas) y `fb_s3` («Precios y planes», respondida y sin leer, desde /precios).",
    respuesta:
      "Ninguna: es lectura. Ni sonido ni aviso, como toda navegación (regla 7 de AGENTS.md).",
    origen: [
      "components/app/mis-mensajes.tsx:27",
      "components/app/mis-mensajes.tsx:32",
      "components/app/mis-mensajes.tsx:73",
      "lib/feedback.ts:222",
      "app/[locale]/(app)/ayuda/page.tsx:30",
      "app/[locale]/(app)/ayuda/page.tsx:31",
      "tests/e2e/casillero.spec.ts:59",
    ],
    relacionadas: [
      "ayuda.enviar-comentario",
      "ayuda.marcar-respuesta-leida",
      "ayuda.abrir-respuestas-desde-avisos",
    ],
  },
  {
    id: "ayuda.marcar-respuesta-leida",
    area: "ayuda",
    titulo: "Marcar como leída una respuesta del equipo",
    resumen:
      "Dar por leída la respuesta del equipo para que deje de salir como «Nueva» y deje de contar en la campana.",
    quien: ["clipero", "agencia"],
    donde: [{ ruta: "/ayuda", etiqueta: "Ayuda › Tus mensajes › «Marcar como leída»" }],
    pasos: [
      "En Ayuda › Tus mensajes, busca el mensaje con la insignia «Nueva».",
      "Bajo «Respuesta del equipo», pulsa «Marcar como leída».",
      "La insignia «Nueva» y el botón desaparecen, y la campana deja de contar esa respuesta.",
    ],
    reglas: [
      "El botón solo aparece en un mensaje que tiene respuesta y que sigue sin leer.",
      "Solo cambia la marca de sin leer (`marcarVisto` deja `sinLeer: false`): no toca el estado ni la respuesta.",
      "Marcar es del lector, no del reloj: no ocurre al abrir la página, solo al pulsar.",
      "El punto naranja de la campana se apaga cuando ya no queda ningún aviso: ni respuestas sin leer, ni publicaciones que piden atención, ni primeras misiones pendientes.",
    ],
    endpoints: ["ayuda.marcar-visto"],
    datos:
      "Almacén del navegador `clipealo-feedback-v1`: se guarda el parche `{ sinLeer: false }` en `cambios`, también sobre las semillas. La campana lo nota al momento por el evento `clipealo:feedback`, y las demás pestañas por `storage`.",
    respuesta:
      "Botón `ghost`: ni sonido ni aviso. La respuesta es que la insignia «Nueva» desaparece.",
    origen: [
      "components/app/mis-mensajes.tsx:100",
      "lib/feedback.ts:158",
      "hooks/use-feedback.ts:140",
      "components/app/avisos-boton.tsx:53",
    ],
    relacionadas: ["ayuda.leer-mis-mensajes", "ayuda.abrir-respuestas-desde-avisos"],
  },
  {
    id: "ayuda.abrir-respuestas-desde-avisos",
    area: "ayuda",
    titulo: "Ir a las respuestas del equipo desde la campana",
    resumen:
      "Enterarse de que el equipo ha contestado sin entrar en Ayuda, y llegar a la respuesta en un clic.",
    quien: ["clipero", "agencia"],
    donde: [
      {
        ruta: "/dashboard",
        etiqueta:
          "Barra superior › campana «Notificaciones» › «N respuestas del equipo». Está en todas las pantallas de la app y también en la barra del backoffice",
      },
    ],
    pasos: [
      "Pulsa la campana («Notificaciones») de la barra superior. Si tienes respuestas sin leer, lleva un punto naranja.",
      "En el panel, bajo el título «Notificaciones» y las primeras misiones que queden, sale «1 respuesta del equipo» o «N respuestas del equipo».",
      "Púlsalo: te lleva a Ayuda, donde esas respuestas llevan la insignia «Nueva».",
    ],
    reglas: [
      "Cuenta los mensajes propios con la respuesta sin leer (`respuestasSinLeer`). Con cero, esa línea no sale.",
      "Se suman al punto de la campana junto con las publicaciones que piden atención y las primeras misiones pendientes; el punto solo se pinta si el total pasa de cero, y el lector de pantalla oye «Tienes N avisos sin leer».",
      "No depende del plan: lo ve cualquier cuenta.",
      "Ir a Ayuda no marca nada como leído.",
    ],
    endpoints: ["ayuda.listar"],
    datos:
      "Almacén del navegador `clipealo-feedback-v1`, el mismo que Ayuda. En la demo, la cuenta arranca con una respuesta sin leer (`fb_s3`); al responder desde el backoffice pasan a ser dos, sin recargar.",
    respuesta: "Ninguna: es navegación. Sin sonido ni aviso (regla 7 de AGENTS.md).",
    origen: [
      "components/app/avisos-boton.tsx:52",
      "components/app/avisos-boton.tsx:65",
      "components/app/avisos-boton.tsx:75",
      "lib/feedback.ts:228",
      "tests/e2e/casillero.spec.ts:55",
    ],
    relacionadas: ["ayuda.leer-mis-mensajes", "ayuda.marcar-respuesta-leida"],
  },
  {
    id: "ayuda.abrir-buscador",
    area: "ayuda",
    titulo: "Buscar y moverse por la app con ⌘K",
    resumen:
      "Abrir el buscador para saltar a una página, a un proyecto o a un clip, ir a «Subir un video» o cambiar el tema sin soltar el teclado.",
    quien: ["clipero", "agencia"],
    donde: [
      {
        ruta: "/dashboard",
        etiqueta:
          "Barra superior › «Buscar…» (o ⌘K / Ctrl+K). Está en todas las pantallas de la app, no en el backoffice",
      },
    ],
    pasos: [
      "Pulsa «Buscar…» en la barra superior, o ⌘K / Ctrl+K (valen los dos en cualquier sistema). El mismo atajo lo cierra.",
      "Escribe en «Busca un proyecto, un clip o una acción…»: la lista se filtra mientras escribes. Si nada encaja, «Sin resultados.».",
      "Elige con el ratón, o con las flechas y Enter. En «Acciones», «Subir un video» lleva a /subir.",
      "En «Ir a»: «Resumen», «Proyectos», «Analíticas», «Campañas», «Wallet» y «Ajustes».",
      "En «Proyectos» y «Clips», salta a uno concreto (ver sus propias acciones).",
      "En «Tema», «Claro» u «Oscuro» cambia el tema al momento.",
    ],
    reglas: [
      "Solo existe en la app: las pantallas del backoffice no lo montan (`showCommand={false}`), así que allí ⌘K no hace nada.",
      "Por debajo de 768 px (`md`) el botón «Buscar…» no se ve; el atajo sigue funcionando.",
      "Al elegir cualquier resultado el buscador se cierra primero y luego hace lo que toca.",
      "El filtro se hace en el navegador: por el nombre de la página, el título del proyecto o el del clip (no por la duración ni por el formato que se ven a la derecha).",
      "«Ir a» tiene seis destinos fijos: no incluye Calendario, Formación, Operaciones ni Ayuda.",
      "El tema solo ofrece «Claro» y «Oscuro» (el selector de tema de la barra superior tiene además «Sistema»). Se guarda en este dispositivo, en `clipealo-theme`, no en la cuenta; sin nada guardado, el tema es claro.",
      "Proyectos y clips salen de la semilla fija de lib/mock-data.ts (los cinco proyectos y los cinco primeros clips), no del almacén de trabajos: un video recién subido no aparece en el buscador.",
      "Ningún plan lo limita.",
    ],
    endpoints: ["proyectos.listar", "proyectos.listar-clips-cuenta"],
    datos:
      "Semilla fija de lib/mock-data.ts (`sourceVideos` y `clips`); no pasa por ninguna frontera de lib/api/. Con servidor tendría que leer la lista de proyectos (`GET /jobs`, `listJobs` en lib/api/jobs.ts) y los clips de la cuenta (`GET /clips`, por construir). El tema vive en localStorage (`clipealo-theme`), porque es del dispositivo.",
    respuesta:
      "Ninguna: es navegación. Ni el botón ni los resultados suenan (regla 7 de AGENTS.md).",
    origen: [
      "components/app/command-menu.tsx:37",
      "components/app/command-menu.tsx:58",
      "components/app/command-menu.tsx:69",
      "components/app/command-menu.tsx:104",
      "components/app/command-menu.tsx:169",
      "components/app/app-topbar.tsx:86",
      "components/admin/admin-page.tsx:70",
      "components/providers.tsx:60",
    ],
    relacionadas: ["ayuda.saltar-a-proyecto", "ayuda.saltar-a-clip"],
  },
  {
    id: "ayuda.saltar-a-proyecto",
    area: "ayuda",
    titulo: "Saltar a un proyecto desde el buscador",
    resumen: "Abrir un proyecto concreto escribiendo parte de su título.",
    quien: ["clipero", "agencia"],
    donde: [
      {
        ruta: "/dashboard",
        etiqueta: "Buscador (⌘K) › grupo «Proyectos», desde cualquier pantalla de la app",
      },
    ],
    pasos: [
      "Abre el buscador con «Buscar…» o ⌘K.",
      "Escribe parte del título, p. ej. «Podcast».",
      "En «Proyectos» elige «Podcast #42 — Cómo escalar un equipo remoto»; a la derecha se ve su duración, 1:20:12.",
      "Se abre la página del proyecto, /proyectos/src_01.",
    ],
    reglas: [
      "Salen todos los proyectos de la semilla, en su orden, con la duración como código de tiempo (h:mm:ss, o m:ss por debajo de una hora).",
      "Se busca por el título del proyecto.",
      "El enlace se traduce al idioma de la URL: /en/projects/src_01 en inglés y /pt/projetos/src_01 en portugués.",
      "Salen también los que no están listos (en cola, procesando o con error): el buscador no mira el estado.",
    ],
    endpoints: ["proyectos.listar"],
    datos:
      "Semilla fija `sourceVideos` de lib/mock-data.ts (cinco proyectos, de `src_01` a `src_05`). No lee el almacén de trabajos de lib/api/jobs.ts.",
    respuesta: "Ninguna: es navegación, sin sonido.",
    origen: ["components/app/command-menu.tsx:119", "lib/mock-data.ts:55"],
    relacionadas: ["ayuda.abrir-buscador", "ayuda.saltar-a-clip"],
  },
  {
    id: "ayuda.saltar-a-clip",
    area: "ayuda",
    titulo: "Saltar a un clip desde el buscador",
    resumen: "Abrir el detalle de un clip escribiendo parte de su título.",
    quien: ["clipero", "agencia"],
    donde: [
      {
        ruta: "/dashboard",
        etiqueta: "Buscador (⌘K) › grupo «Clips», desde cualquier pantalla de la app",
      },
    ],
    pasos: [
      "Abre el buscador con «Buscar…» o ⌘K.",
      "Escribe parte del título, p. ej. «zona horaria».",
      "En «Clips» elige «El error de contratar por zona horaria»; a la derecha se ve su formato, 9:16.",
      "Se abre el clip dentro de su proyecto: /proyectos/src_01/clips/clip_01.",
    ],
    reglas: [
      "Solo salen los cinco primeros clips de la semilla (`clips.slice(0, 5)`), no todos: hoy, cinco del Podcast #42.",
      "A la derecha va el formato del clip (`aspect`): en esos cinco, 9:16, 1:1 o 4:5.",
      "El enlace lleva el id del proyecto y el del clip, y se traduce al idioma de la URL.",
    ],
    endpoints: ["proyectos.listar-clips-cuenta"],
    datos:
      "Semilla fija `clips` de lib/mock-data.ts (los cinco primeros). No hay frontera de clips en lib/api/ todavía: con servidor saldrían de los clips de la cuenta (`GET /clips`).",
    respuesta: "Ninguna: es navegación, sin sonido.",
    origen: ["components/app/command-menu.tsx:142", "lib/mock-data.ts:118"],
    relacionadas: ["ayuda.abrir-buscador", "ayuda.saltar-a-proyecto"],
  },
]
