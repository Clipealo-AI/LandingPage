import type { Accion } from "@/lib/wiki/tipos"

/**
 * Acciones de «calendario»: la agenda de publicaciones de `/calendario`.
 *
 * Todo lo que se pinta sale de `hooks/use-agenda.ts` (almacén del navegador
 * `clipealo-agenda-v1` mezclado con las semillas de `lib/agenda.ts`) y el envío
 * a la red pasa por la frontera `lib/api/publicaciones.ts`.
 */

const PLAN_CALENDARIO = {
  minimo: "creator" as const,
  nota: 'Todo /calendario es del plan Creador en adelante (PLAN_MINIMO.programar = "creator"). Con Prueba la página entera es la puerta: «Programar es del plan Creador», lo que se gana y «Ver los planes» → /precios.',
}

const DATOS_AGENDA =
  "Almacén del navegador `clipealo-agenda-v1` (hooks/use-agenda.ts), mezclado al leer con las semillas `entradasSemilla` y con lo que Analíticas ya tiene indexado (`entradasDePublicaciones`, lib/agenda.ts). Las altas van a `entradas`; todo cambio posterior, sea sobre una semilla o sobre una entrada creada aquí, se guarda como parche por id en `cambios` (`parchear`), nunca copiando la entrada entera."

export const ACCIONES: Accion[] = [
  {
    id: "calendario.navegar-fechas",
    area: "calendario",
    titulo: "Moverse por semanas y meses",
    resumen:
      "Ir a la semana o al mes que se quiere mirar y volver a hoy, con la fecha en la dirección para poder compartirla.",
    quien: ["clipero", "agencia"],
    plan: PLAN_CALENDARIO,
    donde: [
      {
        ruta: "/calendario",
        etiqueta:
          "Barra del calendario: «Hoy», las flechas y el título de la semana o del mes",
      },
    ],
    pasos: [
      "Entra en «Calendario» desde la barra lateral. Se abre en la vista Semana, en la semana de hoy (en la demo, la del domingo 13 de septiembre de 2026).",
      "Pulsa las flechas «Semana anterior» y «Semana siguiente» para saltar de semana; en la vista Mes son «Mes anterior» y «Mes siguiente».",
      "Pulsa «Hoy» para volver a la semana (o al mes) de hoy.",
      "Comparte la dirección: el día que se mira va en `?dia=AAAA-MM-DD`.",
      "El sello «Hora de Lima (GMT-5)» de la cabecera dice en qué zona se pinta todo; pulsarlo lleva a Ajustes › Perfil (/ajustes?seccion=perfil), donde se cambia.",
    ],
    reglas: [
      "En Semana las flechas saltan 7 días desde el lunes de la semana; en Mes saltan un mes y caen en el día 1, que es el único día que existe en los doce meses (components/agenda/agenda-view.tsx:173).",
      "La semana va de lunes a domingo: desde el domingo 13 de septiembre, «Semana anterior» lleva a `?dia=2026-08-31` (tests/e2e/calendario.spec.ts:77).",
      "«Hoy» es el día civil de la cuenta: `diaDe(AHORA_AGENDA, zona)`. En la demo AHORA_AGENDA = HOY_CAMPANAS = AHORA_DEMO = 2026-09-13T12:20:00.000Z, las 07:20 del domingo 13 en Lima. Nunca la hora del navegador: el servidor y el cliente pintan lo mismo.",
      "La zona es la del perfil de la cuenta (`perfilCanal.zona`) y, sin ella, America/Lima (ZONA_POR_DEFECTO). No es la del navegador de quien mira.",
      "Solo se guarda el instante UTC de cada publicación: cambiar la zona repinta el calendario pero no mueve nada.",
      'El valor por defecto no se escribe en la URL: sin `?dia=` se abre la semana de hoy. Todo el estado de la página va con `history: "replace"`: el botón Atrás del navegador sale del calendario, no deshace pasos.',
      "El título de la barra es una región viva: al cambiar de semana con las flechas el foco se queda en la flecha y el título anuncia el rango (en Mes, «septiembre de 2026»).",
    ],
    endpoints: ["calendario.listar"],
    datos: `${DATOS_AGENDA} El día que se mira vive en la URL (nuqs).`,
    respuesta:
      "Sin sonido: navegar no suena (AGENTS.md, regla 7). Las tarjetas de la semana nueva entran con un fundido y medio rem de subida (`agenda-entra`, 240 ms, escalonadas 40 ms por carril); con «reducir movimiento», solo el fundido (`fade-soft`).",
    origen: [
      "components/agenda/agenda-view.tsx:100",
      "components/agenda/agenda-view.tsx:173",
      "components/agenda/agenda-view.tsx:295",
      "components/agenda/agenda-view.tsx:550",
      "lib/agenda.ts:68",
      "lib/fechas.ts:51",
      "lib/fechas.ts:35",
      "app/motion/calendario.css:659",
      "app/motion/calendario.css:666",
      "tests/e2e/calendario.spec.ts:70",
      "tests/e2e/calendario.spec.ts:229",
    ],
    relacionadas: ["calendario.cambiar-vista", "calendario.filtrar-publicaciones"],
  },
  {
    id: "calendario.cambiar-vista",
    area: "calendario",
    titulo: "Cambiar entre Semana, Mes y Lista",
    resumen:
      "Ver la agenda con eje de horas (Semana), de un vistazo por días (Mes) o como una lista seguida (Lista).",
    quien: ["clipero", "agencia"],
    plan: PLAN_CALENDARIO,
    donde: [
      {
        ruta: "/calendario",
        etiqueta: "Conmutador «Vista» de la barra: «Semana», «Mes», «Lista»",
      },
    ],
    pasos: [
      "En la barra del calendario, elige «Semana», «Mes» o «Lista».",
      "La elección queda en la URL: `?vista=mes` o `?vista=lista`. Semana es la de por defecto y no se escribe.",
    ],
    reglas: [
      "Las tres vistas son el mismo DOM: cada día es una sección con su lista ordenada de publicaciones y solo cambia la disposición. La lista accesible existe siempre y es lo que se ve en móvil.",
      "Semana: siete columnas con eje de horas y la línea de «ahora» sobre hoy. Es la única vista en la que se arrastran publicaciones.",
      "Mes: semanas completas de lunes a domingo (28, 35 o 42 días); los días del mes de al lado se pintan apagados. Cada celda enseña 2 publicaciones (VISIBLES_EN_MES = 2) y resume el resto en «+N más». No hay línea de ahora: se marca el día.",
      "Lista: los días uno detrás de otro, sin eje de horas; no hay a dónde arrastrar.",
      "Al pasar de Semana a Mes se abre el mes del día que se estaba viendo: con `?dia=2026-08-31` es agosto, no septiembre.",
      "Si el contenedor del calendario mide menos de 52rem, la semana se pliega a un día por sección y el mes se despliega en días, escondiendo los vacíos.",
      "Vacío: «Esta semana no tienes nada programado» o «Este mes no tienes nada programado», con «Elige clips de un proyecto y repártelos por los días que vienen.». El aviso va encima de la rejilla, que sigue pintada.",
    ],
    endpoints: ["calendario.listar"],
    datos: `${DATOS_AGENDA} La vista vive en la URL (\`?vista=\`).`,
    respuesta:
      'Sin sonido: las opciones del conmutador llevan `data-sound="none"`. La opción activa se marca con borde azul (`primary`) y fondo `accent`.',
    origen: [
      "components/agenda/agenda-rejilla.tsx:40",
      "components/agenda/agenda-rejilla.tsx:44",
      "components/agenda/agenda-view.tsx:96",
      "components/agenda/agenda-view.tsx:134",
      "components/agenda/agenda-view.tsx:344",
      "lib/agenda.ts:811",
      "app/motion/calendario.css:382",
      "tests/e2e/calendario.spec.ts:165",
      "tests/e2e/calendario.spec.ts:243",
    ],
    relacionadas: [
      "calendario.navegar-fechas",
      "calendario.abrir-dia-del-mes",
      "calendario.ver-dia-entero",
    ],
  },
  {
    id: "calendario.ver-dia-entero",
    area: "calendario",
    titulo: "Ver el día entero en la semana",
    resumen:
      "Ampliar la rejilla de la semana, de la franja con publicaciones a todas las horas del día, y volver.",
    quien: ["clipero", "agencia"],
    plan: PLAN_CALENDARIO,
    donde: [
      {
        ruta: "/calendario",
        etiqueta:
          "Botón «Ver el día entero», junto al conmutador de vista (solo en Semana)",
      },
    ],
    pasos: [
      "En la vista Semana, pulsa «Ver el día entero».",
      "La rejilla pinta todas las horas del día. Para volver, pulsa «Ver solo las horas con publicaciones».",
    ],
    reglas: [
      "Por defecto se pinta la franja 07:00–23:00 (FRANJA_MINIMA = [7, 23]), ensanchada lo justo para cubrir lo que haya programado fuera de ella (`horasUtiles`).",
      "Con el día entero se pintan las horas reales de ese día en la zona de la cuenta: 23, 24 o 25 en los días de cambio de hora, nunca un 24 escrito a mano.",
      "No se guarda en la URL: es estado de la página y se pierde al recargar.",
      "Solo existe en Semana: Mes y Lista no tienen eje de horas.",
      "Al arrastrar una publicación hasta el final de la franja, la guía avisa «Fin de la franja · «Ver el día entero» para bajar más».",
    ],
    endpoints: ["calendario.listar"],
    datos: "Estado de la página (`useState`), sobre la agenda de hooks/use-agenda.ts.",
    respuesta: "Sin sonido.",
    origen: [
      "components/agenda/agenda-view.tsx:101",
      "components/agenda/agenda-view.tsx:333",
      "lib/agenda.ts:782",
      "lib/agenda.ts:824",
    ],
    relacionadas: ["calendario.cambiar-vista", "calendario.mover-publicacion"],
  },
  {
    id: "calendario.abrir-dia-del-mes",
    area: "calendario",
    titulo: "Abrir un día lleno desde el mes",
    resumen:
      "Ver todas las publicaciones de un día que en la vista Mes no caben en su celda.",
    quien: ["clipero", "agencia"],
    plan: PLAN_CALENDARIO,
    donde: [
      {
        ruta: "/calendario?vista=mes",
        etiqueta: "Botón «+N más» al pie de una celda del mes",
      },
    ],
    pasos: [
      "En la vista Mes, en una celda con más de dos publicaciones, pulsa «+N más» (en la demo, «+1 más» el domingo 13, que tiene tres).",
      "Se abre la vista Semana de ese día con todas sus publicaciones, y el foco va a la columna del día.",
    ],
    reglas: [
      "«+N más» no despliega la celda ni inventa una vista Día: lleva a la Semana, que es donde la hora significa algo.",
      "N es el total del día menos 2 (`ocultasEnMes`), nunca negativo, y cuenta también las canceladas: lo que se resume es lo que hay, no lo que sigue en pie.",
      "El 2 está escrito dos veces, en VISIBLES_EN_MES (lib/agenda.ts) y en app/motion/calendario.css (`:nth-child(n + 3)`); si uno cambia sin el otro, el «+N» miente.",
      "La dirección queda en `?dia=AAAA-MM-DD` (la vista Semana, por ser la de por defecto, no se escribe).",
      "El nombre accesible dice lo que se lee y a dónde lleva: «+1 más Ver el {fecha} en la vista Semana».",
      "En pantallas estrechas el mes va desplegado en días y el botón no se ve: cabe todo.",
    ],
    endpoints: ["calendario.listar"],
    datos:
      "La vista y el día viven en la URL; las publicaciones, en hooks/use-agenda.ts.",
    respuesta:
      'Sin sonido (`data-sound="none"`); el foco salta a la celda de ese día en la Semana.',
    origen: [
      "components/agenda/agenda-view.tsx:257",
      "components/agenda/agenda-rejilla.tsx:386",
      "lib/agenda.ts:811",
      "lib/agenda.ts:818",
      "tests/e2e/calendario.spec.ts:192",
      "tests/e2e/calendario.spec.ts:208",
    ],
    relacionadas: ["calendario.cambiar-vista"],
  },
  {
    id: "calendario.filtrar-publicaciones",
    area: "calendario",
    titulo: "Filtrar por red y por cuenta",
    resumen:
      "Mirar solo lo que va a unas redes o a una cuenta concreta, con un enlace que se puede compartir.",
    quien: ["clipero", "agencia"],
    plan: PLAN_CALENDARIO,
    donde: [
      {
        ruta: "/calendario",
        etiqueta:
          "Grupo «Filtrar el calendario»: desplegable de redes, desplegable de cuentas y «Quitar el filtro»",
      },
    ],
    pasos: [
      "Abre el desplegable de redes («Todas las redes») y marca una o varias. El menú no se cierra entre casilla y casilla, y cada red dice cuántas hay a la vista («2 a la vista»).",
      "En el desplegable de cuentas («Todas las cuentas»), elige una. Solo ofrece cuentas de las redes marcadas, escritas «TikTok · @cortes.ana». «Planes sin cuenta» aísla lo que apunta a una cuenta que ya no está conectada.",
      "Lee el resultado al lado: «3 de 9 publicaciones a la vista».",
      "Pulsa «Quitar el filtro» para volver a verlo todo.",
    ],
    reglas: [
      "Por red (varias) y por cuenta (una), y las dos condiciones se suman. Un enlace imposible (`?red=youtube&cuenta=cta_tk_ana`) da vacío y la pantalla lo dice: no se corrige a escondidas (`filtrarAgenda`).",
      "`?red=` se escribe siempre en el orden de SOCIAL_IDS (tiktok, instagram, youtube, x, linkedin, facebook) y sin repetidos, para que la misma vista dé el mismo enlace (`normalizarRedes`).",
      "`?cuenta=sin-cuenta` (CUENTA_HUERFANA) aísla las entradas cuya cuenta ya no está viva; una entrada sin `cuentaId` nunca eligió cuenta y no cuenta como huérfana. Filtrar por una cuenta recién desconectada sigue enseñando sus planes.",
      "Solo se ofrecen las redes donde hay una cuenta viva o alguna publicación (`redesFiltrables`). Los controles solo se pintan si hay un filtro puesto, más de una red filtrable o más de una cuenta con @.",
      "Una cuenta que este navegador no tiene (llega en un enlace ajeno) se enseña como «Una cuenta que ya no está aquí» y se puede quitar con un clic.",
      "Vacío por el filtro: «Nada de este filtro a la vista» con «Hay N publicaciones en otras redes o cuentas.», distinto del vacío de no tener nada.",
      "«Quitar el filtro» está siempre montado y apagado sin filtro: los desplegables ya dicen «Todas las redes» y «Todas las cuentas».",
      "El filtro no calla la bandeja de lo que no salió: esa se calcula sobre toda la agenda.",
      "El filtro propone dónde va lo que se programe: el compositor abre con esas redes (y esa cuenta) marcadas, sin recortar las demás.",
    ],
    endpoints: ["calendario.listar"],
    datos:
      "El filtro vive en la URL (`?red=` y `?cuenta=`, nuqs); se aplica en el navegador sobre la agenda de hooks/use-agenda.ts.",
    respuesta:
      "Ningún control suena: el sonido es de la acción principal, no de mirar. El contador «N de M publicaciones a la vista» es una región viva, montada siempre para que el primer filtro se anuncie.",
    origen: [
      "components/agenda/agenda-filtros.tsx:51",
      "components/agenda/agenda-filtros.tsx:215",
      "components/agenda/agenda-view.tsx:122",
      "components/agenda/agenda-view.tsx:161",
      "components/agenda/agenda-view.tsx:186",
      "components/agenda/agenda-view.tsx:463",
      "lib/agenda.ts:405",
      "lib/agenda.ts:423",
      "lib/agenda.ts:432",
      "lib/agenda.ts:451",
      "tests/e2e/calendario.spec.ts:373",
      "tests/e2e/calendario.spec.ts:394",
    ],
    relacionadas: ["calendario.revisar-pendientes", "calendario.programar-publicacion"],
  },
  {
    id: "calendario.revisar-pendientes",
    area: "calendario",
    titulo: "Revisar lo que no salió",
    resumen:
      "Ver de un vistazo las publicaciones que necesitan una mano —fallaron, perdieron su cuenta o se le pasó la hora a quien las publica— y abrirlas para arreglarlas.",
    quien: ["clipero", "agencia"],
    plan: {
      minimo: "creator",
      nota: "La bandeja vive en /calendario (Creador en adelante). El aviso del panel y la campana cuentan lo que no salió con cualquier plan, también Prueba, porque publicar es de todos; con Prueba su enlace lleva al muro del calendario.",
    },
    donde: [
      {
        ruta: "/calendario",
        etiqueta: "Bandeja «N publicaciones sin salir», encima de la rejilla",
      },
      {
        ruta: "/dashboard",
        etiqueta: "Línea «Tienes N publicaciones sin salir.» con «Ver en el calendario»",
      },
      {
        ruta: "/dashboard",
        etiqueta:
          "Barra superior › campana «Notificaciones» (en todas las pantallas de la app): cada aviso abre /calendario?dia=AAAA-MM-DD en el día de su publicación",
      },
    ],
    pasos: [
      "Arriba del calendario, lee la bandeja «N publicaciones sin salir»: «No salieron: la red las rechazó, la cuenta ya no está o las publicas tú. Aquí se arreglan.» Cada tarjeta lleva fecha y hora.",
      "Pulsa una tarjeta para abrir su hoja y arreglarla según su estado: una «No salió» se reintenta («Volver a intentarlo») o se reconecta («Reconectar la cuenta»); una «Sin cuenta» o «Toca publicar» sigue planificada y se publica ya, se cambia de hora o se cancela; en todas queda «Ya la publiqué» con su enlace.",
      "Si hay un filtro puesto que deja alguna fuera, la bandeja lo dice («Hay N publicaciones sin salir fuera de este filtro») y «Ver todas» quita el filtro.",
      "Fuera del calendario: el panel dice «Tienes N publicaciones sin salir.» con el enlace «Ver en el calendario», y la campana de la barra superior las lista; cada una abre /calendario en su día.",
    ],
    reglas: [
      "Entran los estados vistos fallida («No salió»), sin-cuenta («Sin cuenta») y toca-publicar («Toca publicar») (ESTADOS_QUE_PIDEN_ALGO), ordenados por hora.",
      "Se calcula sobre TODA la agenda, no sobre la semana ni sobre el filtro: una alarma que se calla porque hay un filtro puesto deja de ser una alarma.",
      "Lo cerrado (publicada, cancelada) nunca entra. sin-cuenta manda sobre lo demás: la cuenta a la que iba ya no está, no tiene @ o está caducada o revocada.",
      "toca-publicar solo lo tienen las que publica la persona (proveedor `manual`) cuando pasa su hora. Una de Clipealo con la hora pasada se pinta «Publicándose»: está en la cola, y decir «toca publicar» sería mentir.",
      "En la demo hay dos: age_s1 (TikTok @clipealo, sábado 12 a las 19:00 en Lima, la red la rechazó) y age_s7 (Instagram, cuenta cta_ig_ana, que no está conectada).",
      "El día al que lleva la campana es el día civil en la zona de la cuenta (`diaDe`), no el de UTC: age_s1 (sábado 12 a las 19:00 en Lima, domingo 13 en UTC) lleva a `/calendario?dia=2026-09-12`. El enlace del panel, en cambio, abre /calendario sin día.",
      "Si todo lo pendiente queda fuera del filtro, la bandeja sigue ahí con «Nada pendiente en este filtro».",
    ],
    estados: [
      {
        estado: "fallida",
        significa: "«No salió»: el envío falló y guarda el motivo como código.",
      },
      {
        estado: "sin-cuenta",
        significa: "«Sin cuenta»: derivado; la cuenta a la que iba ya no está conectada.",
      },
      {
        estado: "toca-publicar",
        significa: "«Toca publicar»: derivado; la publica la persona y ya pasó su hora.",
      },
    ],
    endpoints: ["calendario.listar"],
    datos: `${DATOS_AGENDA} Los estados sin-cuenta y toca-publicar no se guardan: se derivan con \`estadoVistoAgenda\` contra las cuentas y el instante.`,
    respuesta:
      "Sin sonido: es un aviso permanente, no un resultado. La bandeja lleva el anillo azul (`ring-primary/30`) y la campana pinta su punto solo si hay algo.",
    origen: [
      "lib/agenda.ts:262",
      "lib/agenda.ts:287",
      "lib/agenda.ts:298",
      "components/agenda/agenda-view.tsx:157",
      "components/agenda/agenda-view.tsx:485",
      "components/app/dashboard-greeting.tsx:30",
      "components/app/avisos-boton.tsx:46",
      "components/app/avisos-boton.tsx:97",
      "tests/e2e/calendario.spec.ts:95",
      "tests/e2e/calendario.spec.ts:411",
      "tests/e2e/calendario.spec.ts:442",
    ],
    relacionadas: [
      "calendario.ver-detalle-publicacion",
      "calendario.reintentar-publicacion",
      "calendario.marcar-publicada",
    ],
  },
  {
    id: "calendario.ver-detalle-publicacion",
    area: "calendario",
    titulo: "Abrir una publicación",
    resumen:
      "Ver en una hoja lateral todo lo de una publicación —estado, hora, texto, lote y enlace— y lo que se puede hacer con ella.",
    quien: ["clipero", "agencia"],
    plan: PLAN_CALENDARIO,
    donde: [
      {
        ruta: "/calendario",
        etiqueta: "Cualquier tarjeta de la rejilla, de la lista o de la bandeja",
      },
    ],
    pasos: [
      "Pulsa una tarjeta: se abre una hoja lateral a la derecha.",
      "Arriba: la red, la cuenta, el estado en una insignia y el título del clip; debajo, «Programada para {fecha}» o «Publicada el {fecha}» y la zona («Hora de Lima (GMT-5)»).",
      "Según el caso: el aviso «La cuenta de {red} ya no está conectada.», «No se pudo publicar» con el motivo y los intentos, «Publicando en {red}…», el «Texto propuesto», «Sale acompañada» con las hermanas del lote y, si la entrada tiene enlace, «Enlace de la publicación» con el botón «Abrir la publicación», que abre la red en una pestaña nueva.",
      "Las acciones dependen del estado guardado: una planificada se publica ya, se cambia de día y hora o se cancela; una que no salió se reintenta o se reconecta; una cancelada se vuelve a planificar; en planificadas y en las que no salieron queda «Ya la publiqué». Una publicada o una que se está publicando no ofrece ninguna acción.",
    ],
    reglas: [
      "La hoja lee la entrada viva por id: si se mueve o se cancela, se entera sola.",
      "Cada tarjeta escribe su estado; el color solo acompaña. Su nombre accesible es «{hora} · {red} · {titulo} · {estado}» y, en la vista Semana, si no se puede mover, el motivo detrás. En la bandeja la hora lleva también la fecha.",
      "El lote son las entradas con el mismo `loteId`: el mismo clip mandado a varias cuentas de una vez («El mismo clip va también a N redes más, de la misma tanda»).",
      "El clic que llega detrás de un arrastre no abre la hoja: quien arrastra no ha pedido abrir nada.",
      'El enlace a la red es externo: `<a target="_blank" rel="noreferrer noopener">`, no el `Link` del idioma.',
    ],
    endpoints: ["calendario.listar"],
    datos: DATOS_AGENDA,
    respuesta:
      'Sin sonido: las tarjetas llevan `data-sound="none"`. La hoja entra desde la derecha.',
    origen: [
      "components/agenda/detalle-sheet.tsx:82",
      "components/agenda/detalle-sheet.tsx:131",
      "components/agenda/detalle-sheet.tsx:153",
      "components/agenda/detalle-sheet.tsx:376",
      "components/agenda/agenda-rejilla.tsx:430",
      "components/agenda/agenda-view.tsx:129",
      "hooks/use-mover-publicacion.ts:80",
      "lib/agenda.ts:903",
    ],
    relacionadas: [
      "calendario.publicar-ahora",
      "calendario.reprogramar-publicacion",
      "calendario.cancelar-publicacion",
      "calendario.marcar-publicada",
    ],
  },
  {
    id: "calendario.programar-publicacion",
    area: "calendario",
    titulo: "Programar publicaciones",
    resumen:
      "Elegir clips de un proyecto, en qué cuentas conectadas salen y cuándo, para que Clipealo los publique solos a esa hora.",
    quien: ["clipero", "agencia"],
    plan: {
      minimo: "creator",
      nota: 'Programar es del plan Creador en adelante (PLAN_MINIMO.programar = "creator"). Con Prueba el calendario entero es el muro «Programar es del plan Creador» y el botón «Programar» del estudio sale apagado con «Programar es del plan Creador en adelante.». Publicar ahora, en cambio, es de todos los planes.',
    },
    donde: [
      { ruta: "/calendario", etiqueta: "Botón «Programar publicación» de la barra" },
      {
        ruta: "/calendario?crear=1&clips=clip_04",
        etiqueta: "Enlace directo: abre el diálogo con esos clips ya marcados",
      },
      { ruta: "/proyectos/[id]", etiqueta: "Menú «…» de un clip › «Programar…»" },
      { ruta: "/dashboard", etiqueta: "Menú «…» de un clip del panel › «Programar…»" },
      {
        ruta: "/studio/[id]",
        etiqueta: "Botón «Programar» del estudio, con los clips detectados",
      },
      {
        ruta: "/proyectos/[id]/clips/[clipId]",
        etiqueta:
          "Diálogo «Publicar el clip» › «Programar» (el mismo diálogo se abre desde «Publicar» del estudio)",
      },
    ],
    pasos: [
      "Pulsa «Programar publicación» (o llega desde «Programar…» en el menú de un clip, desde «Programar» en el estudio, que avisa «Clip listo para publicar», o desde «Programar» del diálogo «Publicar el clip»). Se abre el diálogo «Programar publicación» con la promesa: «Clipealo las publica en las cuentas que elijas, a la hora que marques, y guarda el enlace.»",
      "En «Proyecto», elige de dónde salen los clips: solo aparecen los proyectos que tienen alguno (en la demo, «Podcast #42 — Cómo escalar un equipo remoto» y «Webinar — Poner precio sin pedir perdón»). Si llegas con clips marcados, abre en el proyecto del primero.",
      "En «Clips», marca uno o varios. Cada fila enseña la miniatura, la duración y el formato (9:16, 4:5, 1:1…). Lo marcado se mantiene aunque cambies de proyecto, y el contador dice «2 clips elegidos».",
      "En «En qué cuentas sale», marca las redes. Si una red tiene dos cuentas, elige cuál en el desplegable de al lado (se anuncia «Cuenta de {red}»; en la demo, TikTok: @clipealo o @cortes.ana); si tiene una, se ve su @.",
      "En «Cuándo», escribe el «Día» y la «Hora». La hora es la de la cuenta y el diálogo lo dice: «La hora es la de Lima (GMT-5), la zona de tu cuenta.»",
      "Revisa «Lo que se va a crear» (cada publicación con su fecha, su red, su cuenta y su título), los «Consejos» y la línea «Se crearán N publicaciones».",
      "Pulsa «Programar». Si algo bloquea, el recuadro «Esto hay que arreglarlo antes de programar» se trae a la vista con el foco y no se crea nada. «Cancelar» cierra sin guardar.",
    ],
    reglas: [
      "Sin ninguna cuenta viva no aparece el botón: manda el vacío «Conecta una red para empezar» con «Ir a Cuentas conectadas» (/ajustes?seccion=cuentas).",
      "Solo se ofrecen redes con alguna cuenta viva (con @ y conectada), también las de agencia. Una cuenta por red: por defecto, la primera que se conectó (`cuentasDeRed`).",
      "N clips × M redes: cada clip sale una vez en cada red marcada. Dentro de la MISMA cuenta se separan 45 minutos (SEPARACION_MINIMA_MIN = 45) y dos cuentas distintas pueden recibir a la vez. Con más de una publicación el diálogo lo avisa: «Dos publicaciones seguidas en la misma cuenta se separan 45 minutos.»",
      "Día propuesto: el que se estaba mirando si no ha pasado; si no, hoy. Hora propuesta: la siguiente en punto después de «ahora», como mucho las 23:00 (en la demo, 08:00). El campo «Día» no deja elegir antes de hoy.",
      "Bloquean: sinClip y sinCuenta (ningún clip o ninguna red marcada, o la cuenta elegida ya no está viva), faltaFecha (el diálogo lo pone con el día o la hora a medio escribir) y, de `validarEntrada` sobre cada publicación prevista contra la agenda MÁS las otras de la misma tanda: enPasado, formatoNoAdmitido, duracionExcedida y duplicadaEnCuenta (el mismo clip a la misma hora en la misma cuenta).",
      "Son consejos y no bloquean: muyPegadaAOtra (menos de 45 minutos con otra de la misma cuenta), demasiadasHoy (más de 4 en el mismo día y la misma cuenta, MAX_POR_CUENTA_DIA = 4) y fueraDeDuracionIdeal (fuera de la duración que mejor retiene en la red, el `sweetSpot`; es DURACIÓN, no «mejores horas»).",
      "Formatos y duración máxima por red (SOCIAL_NETWORKS): TikTok 9:16 hasta 600 s; Instagram 9:16, 4:5 o 1:1 hasta 180 s; YouTube 9:16 o 16:9 hasta 60 s; X 16:9 o 1:1 hasta 140 s; LinkedIn 1:1, 4:5 o 16:9 hasta 600 s; Facebook 9:16 o 1:1 hasta 90 s.",
      "«Elige al menos un clip.» y «Elige al menos una cuenta conectada donde publicar.» esperan a que se pulse «Programar»; lo ya escrito mal (una hora pasada) se dice al momento. Varios clips con el mismo problema son un solo renglón con su número.",
      "Mientras algo bloquea, la línea dice «Todavía no se creará ninguna publicación».",
      "El mismo clip en varias redes comparte `loteId` y después se reconoce como «Sale acompañada». Con una sola red, cada clip lleva su propio lote.",
      "Cada entrada nace `planificada`, con el gancho del clip (`hook`) como texto, proveedor `clipealo`, la zona activa como `zonaOrigen` y el dueño (clipero o agencia) de la cuenta elegida para la primera red marcada. El compositor no guarda `copia`: al enviarla sale su `texto`.",
      "Desde aquí no se programa dentro de una campaña: el diálogo no pasa campaña, así que fueraDeVentanaCampana no se evalúa.",
      "`?crear=1` abre el diálogo y `?clips=id1,id2` lo abre con esos clips marcados; el filtro (`?red=`, `?cuenta=`) propone las redes marcadas. Cerrar el diálogo borra `crear` y `clips` de la URL.",
      "El calendario no salta al día elegido: por eso el aviso dice cuándo sale la primera.",
      "En la demo no hay cola: una planificada de Clipealo cuya hora pasa se pinta «Publicándose» y nadie la envía. Mandarla a su hora es trabajo del servidor.",
    ],
    estados: [
      { estado: "planificada", significa: "«Planificada»: espera su hora." },
      {
        estado: "publicando",
        significa:
          "«Publicándose»: el envío está en marcha, o es de Clipealo y su hora ya pasó (está en la cola).",
      },
      {
        estado: "publicada",
        significa: "«Publicada»: salió; guarda `url`, `postId` y `publicadaEn`.",
      },
      {
        estado: "fallida",
        significa:
          "«No salió»: el envío falló; guarda el motivo (`fallo`) y los `intentos`.",
      },
      {
        estado: "cancelada",
        significa: "«Cancelada»: ya no va a salir; se puede volver a planificar.",
      },
      {
        estado: "toca-publicar",
        significa:
          "«Toca publicar»: derivado; la publica la persona (proveedor `manual`) y pasó su hora.",
      },
      {
        estado: "sin-cuenta",
        significa:
          "«Sin cuenta»: derivado; su cuenta ya no está conectada. Manda sobre todo salvo lo cerrado.",
      },
    ],
    errores: [
      {
        codigo: "sinClip",
        cuando: "No hay ningún clip marcado.",
        frase: "calendario.compositor.errores.sinClip",
        bloquea: true,
      },
      {
        codigo: "sinCuenta",
        cuando: "No hay ninguna red marcada, o la cuenta elegida ya no está viva.",
        frase: "calendario.compositor.errores.sinCuenta",
        bloquea: true,
      },
      {
        codigo: "faltaFecha",
        cuando: "El día o la hora están a medio escribir.",
        frase: "calendario.compositor.errores.faltaFecha",
        bloquea: true,
      },
      {
        codigo: "enPasado",
        cuando: "El día y la hora ya pasaron.",
        frase: "calendario.compositor.errores.enPasado",
        bloquea: true,
      },
      {
        codigo: "formatoNoAdmitido",
        cuando: "La red no admite el formato del clip (por ejemplo, un 4:5 en TikTok).",
        frase: "calendario.compositor.errores.formatoNoAdmitido",
        bloquea: true,
      },
      {
        codigo: "duracionExcedida",
        cuando: "El clip dura más que el máximo de la red (60 s en YouTube).",
        frase: "calendario.compositor.errores.duracionExcedida",
        bloquea: true,
      },
      {
        codigo: "duplicadaEnCuenta",
        cuando: "Ese clip ya está a esa misma hora en esa cuenta.",
        frase: "calendario.compositor.errores.duplicadaEnCuenta",
        bloquea: true,
      },
      {
        codigo: "muyPegadaAOtra",
        cuando: "Hay otra publicación en esa cuenta a menos de 45 minutos.",
        frase: "calendario.compositor.errores.muyPegadaAOtra",
        bloquea: false,
      },
      {
        codigo: "demasiadasHoy",
        cuando: "Serían más de 4 publicaciones ese día en la misma cuenta.",
        frase: "calendario.compositor.errores.demasiadasHoy",
        bloquea: false,
      },
      {
        codigo: "fueraDeDuracionIdeal",
        cuando:
          "La duración cae fuera del `sweetSpot` de la red (TikTok 21–60 s, YouTube 25–55 s…).",
        frase: "calendario.compositor.errores.fueraDeDuracionIdeal",
        bloquea: false,
      },
    ],
    endpoints: ["calendario.crear", "calendario.listar"],
    datos: `${DATOS_AGENDA} Las publicaciones nuevas se añaden a \`entradas\` con id \`age_*\` creado en el manejador (\`nuevoId\`), nunca al pintar.`,
    respuesta:
      '«Programar publicación» y «Programar» son la acción naranja (`variant="brand"`): suenan «pop» y se encuadran con la marca de recorte. Al guardar, `toast.success` «N publicaciones programadas» con «La primera sale el {fecha}. Te avisamos cuando esté publicada.» (sonido «success») y el diálogo se cierra. Si algo bloquea no hay aviso: el recuadro rojo recibe el foco.',
    origen: [
      "components/agenda/agenda-view.tsx:107",
      "components/agenda/agenda-view.tsx:277",
      "components/agenda/agenda-view.tsx:368",
      "components/agenda/compositor-dialog.tsx:149",
      "components/agenda/compositor-dialog.tsx:171",
      "components/agenda/compositor-dialog.tsx:224",
      "components/agenda/compositor-dialog.tsx:248",
      "components/agenda/compositor-dialog.tsx:289",
      "components/agenda/compositor-dialog.tsx:319",
      "components/agenda/compositor-dialog.tsx:346",
      "lib/agenda.ts:467",
      "lib/agenda.ts:470",
      "lib/agenda.ts:497",
      "lib/agenda.ts:597",
      "lib/agenda.ts:933",
      "lib/social.ts:39",
      "hooks/use-agenda.ts:120",
      "lib/pricing.ts:76",
      "components/agenda/compositor-dialog.tsx:123",
      "components/agenda/muro-plan.tsx:24",
      "components/video/clip-card.tsx:218",
      "components/app/studio.tsx:112",
      "components/app/publicar-dialog.tsx:354",
      "tests/e2e/calendario.spec.ts:107",
      "tests/e2e/calendario.spec.ts:422",
    ],
    relacionadas: [
      "calendario.mover-publicacion",
      "calendario.publicar-ahora",
      "calendario.cancelar-publicacion",
    ],
  },
  {
    id: "calendario.mover-publicacion",
    area: "calendario",
    titulo: "Mover una publicación en la rejilla",
    resumen:
      "Cambiar de día o de hora una publicación arrastrándola en la vista Semana, o con el teclado, sabiendo antes de soltar si ahí se puede.",
    quien: ["clipero", "agencia"],
    plan: PLAN_CALENDARIO,
    donde: [
      {
        ruta: "/calendario",
        etiqueta:
          "Rejilla de la vista Semana; la ayuda «Arrastra las publicaciones…» va encima",
      },
    ],
    pasos: [
      "En la vista Semana, coge una tarjeta con el botón principal del ratón y arrástrala. La tarjeta sigue al puntero y una guía punteada dice dónde caerá, con su hora escrita.",
      "Suelta para guardarla ahí. Sale «Ahora sale el {fecha}.» con «Deshacer», que la devuelve a donde estaba.",
      "Con el teclado: enfoca la tarjeta y pulsa M. Las flechas ← y → cambian de día dentro de la semana y ↑ y ↓ la suben o la bajan de 15 en 15 minutos; Intro (o Espacio) la deja y Esc la devuelve a su sitio sin guardar.",
      "Con Mayús (al arrastrar o con las flechas) se mueve de hora en hora; con Alt, de 5 en 5 minutos.",
    ],
    reglas: [
      "Imantado a pasos de 15 minutos (PASO_MOVER_MIN = 15); con Mayús, 60 (PASO_MOVER_GRANDE_MIN); con Alt, 5 (PASO_MOVER_FINO_MIN).",
      "El destino no sale de la franja pintada, y el margen de abajo es el alto de una tarjeta, 30 minutos (DURACION_TARJETA_MIN): en la franja 07:00–23:00 lo más tarde es 22:30. Al topar, la guía dice «Fin de la franja · «Ver el día entero» para bajar más».",
      "Solo en Semana: en Mes y en Lista no hay eje de tiempo y la hora se cambia desde la hoja.",
      "No se ofrecen para mover (ni cursor de agarre ni atajo M; el motivo va en el nombre accesible y al pasar el ratón): publicada «Ya está publicada.», publicando «Se está publicando ahora mismo.», cancelada «Está cancelada.», sin cuenta o con la cuenta caída «Su cuenta ya no está conectada.» y un clip que no encaja en su red por formato o duración «Ese clip no encaja en esa red, y cambiar la hora no lo arregla.» (`motivoNoMover`).",
      "Una que no salió (fallida) sí se mueve: moverla es volver a ponerla en cola.",
      "Se valida con cada destino, no al soltar, y solo con los avisos que dependen de la hora (`avisosDeMover`): enPasado, duplicadaEnCuenta y fueraDeVentanaCampana bloquean; muyPegadaAOtra y demasiadasHoy solo avisan. Si el destino bloquea, la guía se pone roja, el motivo aparece pegado a la tarjeta y soltar no guarda nada.",
      "Si la publicación es de una campaña, cuenta su ventana: si ese día la campaña ya no acepta clips, bloquea («Ese día la campaña ya no acepta clips.»).",
      "Guardar cambia solo el instante y deja la entrada planificada y sin fallo (`reprogramar`). Soltar en el mismo sitio no guarda nada.",
      "«Deshacer» vuelve a llamar a `reprogramar` con la hora de antes, sin validar: una fallida que se movió vuelve a su hora, pero planificada y sin su fallo; si esa hora ya pasó (age_s1, sábado 12 a las 19:00), la tarjeta se pinta «Publicándose».",
      "El día de destino es el día civil de la cuenta, no el de UTC: la publicación de las 21:00 del domingo 13 en Lima (lunes 14 en UTC) no salta de día al moverla con el teclado.",
      "En la demo, en la semana del 14 al 20 de septiembre solo se mueve la del jueves 17 (age_s6): la del martes 15 es un clip 4:5 en TikTok y la del viernes 18 apunta a una cuenta que ya no está.",
    ],
    errores: [
      {
        codigo: "enPasado",
        cuando: "El destino ya pasó.",
        frase: "calendario.compositor.errores.enPasado",
        bloquea: true,
      },
      {
        codigo: "duplicadaEnCuenta",
        cuando: "El mismo clip ya está a esa hora en esa cuenta.",
        frase: "calendario.compositor.errores.duplicadaEnCuenta",
        bloquea: true,
      },
      {
        codigo: "fueraDeVentanaCampana",
        cuando: "Ese día la campaña de la publicación ya no acepta clips.",
        frase: "calendario.compositor.errores.fueraDeVentanaCampana",
        bloquea: true,
      },
      {
        codigo: "muyPegadaAOtra",
        cuando: "Cae a menos de 45 minutos de otra de la misma cuenta.",
        frase: "calendario.compositor.errores.muyPegadaAOtra",
        bloquea: false,
      },
      {
        codigo: "demasiadasHoy",
        cuando: "Serían más de 4 ese día en la misma cuenta.",
        frase: "calendario.compositor.errores.demasiadasHoy",
        bloquea: false,
      },
      {
        codigo: "noEncaja",
        cuando:
          "El clip no cabe en su red por formato o duración: la tarjeta no se ofrece para mover.",
        frase: "calendario.mover.noSeMueve.noEncaja",
        bloquea: true,
      },
      {
        codigo: "sinCuenta",
        cuando:
          "La publicación no tiene cuenta o su cuenta ya no está viva: no se ofrece para mover.",
        frase: "calendario.mover.noSeMueve.sinCuenta",
        bloquea: true,
      },
    ],
    endpoints: ["calendario.reprogramar", "calendario.listar"],
    datos: `${DATOS_AGENDA} Durante el gesto, el desplazamiento crudo va en las variables CSS \`--mover-dx\` y \`--mover-dy\` sobre el DOM; por React solo viaja el destino imantado.`,
    respuesta:
      "`toast.success` «Ahora sale el {fecha}.» (sonido «success») con la acción «Deshacer». Durante el arrastre no hay transición: la tarjeta responde 1:1 a la mano y se ve igual con «reducir movimiento».",
    origen: [
      "hooks/use-mover-publicacion.ts:46",
      "hooks/use-mover-publicacion.ts:66",
      "hooks/use-mover-publicacion.ts:205",
      "hooks/use-mover-publicacion.ts:220",
      "lib/agenda.ts:314",
      "lib/agenda.ts:333",
      "lib/agenda.ts:349",
      "lib/agenda.ts:377",
      "components/agenda/agenda-rejilla.tsx:134",
      "components/agenda/agenda-rejilla.tsx:145",
      "components/agenda/agenda-rejilla.tsx:153",
      "components/agenda/agenda-view.tsx:205",
      "components/agenda/agenda-view.tsx:236",
      "hooks/use-agenda.ts:205",
      "app/motion/calendario.css:534",
      "tests/e2e/calendario.spec.ts:260",
      "tests/e2e/calendario.spec.ts:291",
      "tests/e2e/calendario.spec.ts:318",
      "tests/e2e/calendario.spec.ts:344",
    ],
    relacionadas: ["calendario.reprogramar-publicacion", "calendario.ver-dia-entero"],
  },
  {
    id: "calendario.reprogramar-publicacion",
    area: "calendario",
    titulo: "Cambiar el día y la hora desde la hoja",
    resumen:
      "Llevar una publicación planificada a otro día u hora escribiéndolos, en cualquier vista.",
    quien: ["clipero", "agencia"],
    plan: PLAN_CALENDARIO,
    donde: [
      {
        ruta: "/calendario",
        etiqueta:
          "Hoja de una publicación planificada › «Cambiar el día y la hora» › «Mover»",
      },
    ],
    pasos: [
      "Abre una publicación planificada.",
      "En «Cambiar el día y la hora», cambia el «Día» o la «Hora» (en la zona de la cuenta).",
      "Pulsa «Mover». Hasta que cambies algo el botón está apagado y lo dice: «Cambia el día o la hora para poder moverla.»",
    ],
    reglas: [
      "Solo en entradas guardadas como planificadas. Una que no salió se arrastra en la rejilla o se reintenta.",
      "Se valida con todo `validarEntrada` salvo sinClip: lo ya publicado viene del índice de Analíticas y su clip puede no seguir en la biblioteca.",
      "Bloquean: sinCuenta, enPasado, formatoNoAdmitido, duracionExcedida, duplicadaEnCuenta y fueraDeVentanaCampana. Los consejos (muyPegadaAOtra, demasiadasHoy, fueraDeDuracionIdeal) se enseñan en cuanto cambia la fecha; los bloqueos, al pulsar «Mover».",
      "El «Día» de la hoja no pone mínimo: lo pasado lo para enPasado («Elige un día y una hora que no hayan pasado.»). Un día o una hora a medio escribir también sale como enPasado: la hoja no usa faltaFecha.",
      "Guarda solo el instante UTC y deja la entrada planificada y sin fallo. La hoja sigue abierta.",
    ],
    errores: [
      {
        codigo: "sinCuenta",
        cuando: "Su cuenta ya no está conectada.",
        frase: "calendario.compositor.errores.sinCuenta",
        bloquea: true,
      },
      {
        codigo: "enPasado",
        cuando: "El día y la hora nuevos ya pasaron.",
        frase: "calendario.compositor.errores.enPasado",
        bloquea: true,
      },
      {
        codigo: "formatoNoAdmitido",
        cuando: "El clip no tiene un formato que admita la red (age_s5: 4:5 en TikTok).",
        frase: "calendario.compositor.errores.formatoNoAdmitido",
        bloquea: true,
      },
      {
        codigo: "duracionExcedida",
        cuando: "El clip dura más que el máximo de la red.",
        frase: "calendario.compositor.errores.duracionExcedida",
        bloquea: true,
      },
      {
        codigo: "duplicadaEnCuenta",
        cuando: "El mismo clip ya está a esa hora en esa cuenta.",
        frase: "calendario.compositor.errores.duplicadaEnCuenta",
        bloquea: true,
      },
      {
        codigo: "fueraDeVentanaCampana",
        cuando: "Ese día su campaña ya no acepta clips.",
        frase: "calendario.compositor.errores.fueraDeVentanaCampana",
        bloquea: true,
      },
      {
        codigo: "muyPegadaAOtra",
        cuando: "Queda a menos de 45 minutos de otra de la misma cuenta.",
        frase: "calendario.compositor.errores.muyPegadaAOtra",
        bloquea: false,
      },
      {
        codigo: "demasiadasHoy",
        cuando: "Serían más de 4 ese día en la misma cuenta.",
        frase: "calendario.compositor.errores.demasiadasHoy",
        bloquea: false,
      },
      {
        codigo: "fueraDeDuracionIdeal",
        cuando: "La duración del clip cae fuera del `sweetSpot` de su red.",
        frase: "calendario.compositor.errores.fueraDeDuracionIdeal",
        bloquea: false,
      },
    ],
    endpoints: ["calendario.reprogramar"],
    datos: DATOS_AGENDA,
    respuesta:
      "`toast.success` «Ahora sale el {fecha}.» (sonido «success»), sin «Deshacer».",
    origen: [
      "components/agenda/detalle-sheet.tsx:165",
      "components/agenda/detalle-sheet.tsx:186",
      "components/agenda/detalle-sheet.tsx:202",
      "components/agenda/detalle-sheet.tsx:388",
      "components/agenda/detalle-sheet.tsx:459",
      "hooks/use-agenda.ts:205",
    ],
    relacionadas: ["calendario.mover-publicacion", "calendario.ver-detalle-publicacion"],
  },
  {
    id: "calendario.publicar-ahora",
    area: "calendario",
    titulo: "Publicar ahora una publicación planificada",
    resumen:
      "Mandar ya a su red una publicación que estaba programada, sin esperar a su hora.",
    quien: ["clipero", "agencia"],
    plan: {
      minimo: "creator",
      nota: "Publicar ahora es de todos los planes, pero este botón vive en la hoja del calendario, que pide Creador. Con Prueba se publica ahora desde la ficha del clip o desde el estudio (diálogo «Publicar el clip»).",
    },
    donde: [
      {
        ruta: "/calendario",
        etiqueta: "Hoja de una publicación planificada › «Publicar ahora»",
      },
    ],
    pasos: [
      "Abre una publicación planificada.",
      "Pulsa «Publicar ahora». La insignia pasa a «Publicándose» y, en lugar de los botones, la hoja enseña «Publicando en {red}…» con un spinner (en la demo, 900 ms).",
      "Si la red la acepta, sale «¡Publicada!», la hoja se cierra y la tarjeta queda «Publicada»; al abrirla otra vez, «Abrir la publicación» lleva a su enlace.",
      "Si no, sale «No se pudo publicar» con el motivo y la publicación queda «No salió», lista para reintentar.",
    ],
    reglas: [
      "Es el mismo camino que el reintento: `enviar(id)`. Guarda tres momentos: `publicando` (sin fallo y con un intento más), `publicada` (con `url`, `postId` y `publicadaEn`) o `fallida` (con el código del motivo; si el error no es de publicación, `sinRed`).",
      "Pasa por la frontera lib/api/publicaciones.ts: con NEXT_PUBLIC_API_URL hace POST /publicaciones/{entradaId}/enviar; sin ella simula con 900 ms de espera (ESPERA_ENVIO_MS).",
      "Viaja: `entradaId`, `red`, `cuentaId`, `handle`, `clipId` y el texto (y el título, donde la red lo tiene) de la copia guardada con la entrada; sin copia, su `texto`.",
      "La simulación no falla por azar: solo da cuentaCaducada si la entrada no tiene `cuentaId`, y rechazoRed si la red no existe o si el texto y el título están vacíos.",
      "Se ofrece en toda entrada guardada como planificada, también si se ve «Sin cuenta». Por eso, en la demo, «Publicar ahora» sobre age_s7 (cuenta cta_ig_ana, desconectada) o sobre age_s5 (clip 4:5 en TikTok) sale bien: el servidor tiene que rechazar el envío a una cuenta que no está viva y lo que `validarEntrada` bloquea.",
      "Con servidor, cualquier error de `POST /publicaciones/{entradaId}/enviar` llega como `ErrorApi` (el cuerpo solo va al registro, lib/api/cliente.ts:71) y la entrada se guarda con fallo `sinRed` (hooks/use-agenda.ts:172): hasta que la frontera lea el código del cuerpo, permisoDenegado, limiteApi o cuentaCaducada del servidor se ven como «No se pudo llegar a la red.» y nunca aparece «Reconectar la cuenta».",
      "Si se cierra el navegador a mitad, la entrada se queda en `publicando` y la hoja solo dice «Publicando en {red}…»: no ofrece reintentar, ni mover, ni marcarla (el comentario de hooks/use-agenda.ts:222 dice «en la demo se reintenta a mano», pero la hoja no lo permite). En producción la cierra el servidor.",
    ],
    estados: [
      { estado: "publicando", significa: "«Publicándose»: el envío está en marcha." },
      {
        estado: "publicada",
        significa: "«Publicada»: la red la aceptó y se guardó su enlace.",
      },
      {
        estado: "fallida",
        significa: "«No salió»: la red no la aceptó; guarda el motivo.",
      },
    ],
    errores: [
      {
        codigo: "cuentaCaducada",
        cuando:
          "La conexión con la cuenta caducó (en la demo, si la entrada no tiene cuenta).",
        frase: "calendario.fallo.cuentaCaducada",
        bloquea: true,
      },
      {
        codigo: "permisoDenegado",
        cuando:
          "La cuenta no da permiso de publicación. Solo lo puede mandar el servidor: la simulación nunca lo da.",
        frase: "calendario.fallo.permisoDenegado",
        bloquea: true,
      },
      {
        codigo: "rechazoRed",
        cuando:
          "La red la rechazó (en la demo, si la red no existe o si el texto y el título están vacíos).",
        frase: "calendario.fallo.rechazoRed",
        bloquea: true,
      },
      {
        codigo: "limiteApi",
        cuando:
          "La red no acepta más publicaciones por hoy. Solo lo puede mandar el servidor: la simulación nunca lo da.",
        frase: "calendario.fallo.limiteApi",
        bloquea: true,
      },
      {
        codigo: "sinRed",
        cuando:
          "No se pudo llegar a la red, o el error no era un `PublicacionFallida` (hoy, cualquier error del servidor).",
        frase: "calendario.fallo.sinRed",
        bloquea: true,
      },
    ],
    endpoints: ["publicar.enviar", "calendario.listar"],
    datos: `${DATOS_AGENDA} El envío lo hace la frontera lib/api/publicaciones.ts; quien guarda el resultado en la entrada es hooks/use-agenda.ts.`,
    respuesta:
      '«Publicar ahora» es la acción naranja de la hoja (`variant="brand"`): «pop» y marca de recorte. Mientras sale, spinner y «Publicando en {red}…». Si sale, `toast.celebrate` «¡Publicada!» con «El enlace ya está guardado y Analíticas lo sigue.» (arpegio y confeti de esquinas de recorte). Si no, `toast.error` «No se pudo publicar» con el motivo (sonido de error y sacudida).',
    origen: [
      "components/agenda/detalle-sheet.tsx:236",
      "components/agenda/detalle-sheet.tsx:338",
      "components/agenda/detalle-sheet.tsx:437",
      "hooks/use-agenda.ts:145",
      "hooks/use-agenda.ts:172",
      "hooks/use-agenda.ts:226",
      "lib/api/cliente.ts:69",
      "lib/api/publicaciones.ts:69",
      "lib/api/publicaciones.ts:106",
      "lib/api/publicaciones.ts:117",
      "tests/e2e/calendario.spec.ts:139",
    ],
    relacionadas: ["calendario.reintentar-publicacion", "calendario.marcar-publicada"],
  },
  {
    id: "calendario.reintentar-publicacion",
    area: "calendario",
    titulo: "Reintentar una publicación que no salió",
    resumen:
      "Volver a mandar a la red una publicación fallida o, si el fallo es de la cuenta, ir a reconectarla.",
    quien: ["clipero", "agencia"],
    plan: PLAN_CALENDARIO,
    donde: [
      {
        ruta: "/calendario",
        etiqueta:
          "Hoja de una publicación «No salió» › «Volver a intentarlo» o «Reconectar la cuenta»",
      },
    ],
    pasos: [
      "Abre la publicación «No salió», desde la bandeja o desde la rejilla. Arriba se lee «No se pudo publicar», el motivo y cuántos intentos lleva.",
      "Si el motivo se arregla reintentando (la red la rechazó, el límite de la red, sin conexión), pulsa «Volver a intentarlo».",
      "Si la conexión caducó o la cuenta no da permiso, el botón es «Reconectar la cuenta» y lleva a Ajustes (hoy cae en Perfil y no en Cuentas conectadas: ver las reglas).",
      "También puedes arrastrarla a otra hora en la vista Semana (vuelve a la cola; solo si su cuenta sigue viva y el clip encaja en la red) o, si la subiste tú, pegar su enlace en «Ya la publiqué». Desde la hoja no se cambia de hora ni se cancela: eso es de las planificadas.",
    ],
    reglas: [
      "Motivos (FALLOS_PUBLICACION), con su frase en calendario.fallo.*: cuentaCaducada «La conexión con la cuenta caducó.», permisoDenegado «La cuenta no da permiso para publicar.», rechazoRed «La red rechazó la publicación.», limiteApi «La red no acepta más publicaciones por hoy.» y sinRed «No se pudo llegar a la red.».",
      "cuentaCaducada y permisoDenegado se arreglan reconectando (PIDE_RECONECTAR): con ellos no se ofrece reintentar.",
      "Reintentar es volver a llamar a `enviar`: no hay dos caminos. Cada intento suma uno a `intentos`.",
      "Con servidor, hoy todo error del envío se guarda como `sinRed` (hooks/use-agenda.ts:172): hasta que la frontera lea el código del cuerpo, una cuenta caducada que diga el servidor se ofrece a reintentar en vez de a reconectar.",
      "Hoy «Reconectar la cuenta» enlaza a /ajustes?seccion=social, que no es una sección de Ajustes (SECCIONES_AJUSTES): la página cae en Perfil. Las cuentas están en /ajustes?seccion=cuentas.",
      "En la demo, age_s1 (TikTok @clipealo, rechazoRed, 1 intento) sale bien al reintentar, con un enlace determinista https://www.tiktok.com/@clipealo/video/…: el mismo envío da siempre el mismo enlace.",
      "La migración de lo guardado nunca devuelve una fallida a planificada: reprogramaría un envío que quizá salió.",
    ],
    estados: [
      {
        estado: "fallida",
        significa: "«No salió»: punto de partida, con `fallo` e `intentos`.",
      },
      { estado: "publicando", significa: "«Publicándose»: el reintento está en marcha." },
      { estado: "publicada", significa: "«Publicada»: esta vez salió." },
    ],
    errores: [
      {
        codigo: "rechazoRed",
        cuando: "La red la vuelve a rechazar.",
        frase: "calendario.fallo.rechazoRed",
        bloquea: true,
      },
      {
        codigo: "limiteApi",
        cuando: "La red sigue sin aceptar más por hoy.",
        frase: "calendario.fallo.limiteApi",
        bloquea: true,
      },
      {
        codigo: "sinRed",
        cuando: "No se pudo llegar a la red.",
        frase: "calendario.fallo.sinRed",
        bloquea: true,
      },
      {
        codigo: "cuentaCaducada",
        cuando: "La conexión caducó: hay que reconectar, no reintentar.",
        frase: "calendario.fallo.cuentaCaducada",
        bloquea: true,
      },
      {
        codigo: "permisoDenegado",
        cuando: "La cuenta no da permiso para publicar: hay que reconectar.",
        frase: "calendario.fallo.permisoDenegado",
        bloquea: true,
      },
    ],
    endpoints: ["publicar.enviar", "calendario.listar"],
    datos: `${DATOS_AGENDA} El motivo se guarda como código (\`fallo\`), nunca la frase de la plataforma.`,
    respuesta:
      "«Volver a intentarlo» es un botón secundario (sin «pop»); mientras sale, la hoja cambia a «Publicando en {red}…» con un spinner. Si sale, `toast.celebrate` «¡Publicada!» y la hoja se cierra; si no, `toast.error` «No se pudo publicar» con el motivo (sonido de error y sacudida).",
    origen: [
      "components/agenda/detalle-sheet.tsx:255",
      "components/agenda/detalle-sheet.tsx:304",
      "components/agenda/detalle-sheet.tsx:318",
      "lib/agenda.ts:131",
      "lib/agenda.ts:141",
      "lib/agenda.ts:1217",
      "lib/ajustes.ts:17",
      "hooks/use-agenda.ts:145",
      "lib/api/publicaciones.ts:87",
    ],
    relacionadas: [
      "calendario.publicar-ahora",
      "calendario.mover-publicacion",
      "calendario.marcar-publicada",
      "calendario.revisar-pendientes",
    ],
  },
  {
    id: "calendario.cancelar-publicacion",
    area: "calendario",
    titulo: "Cancelar una publicación",
    resumen:
      "Hacer que una publicación planificada no salga, con la vuelta atrás a un clic.",
    quien: ["clipero", "agencia"],
    plan: PLAN_CALENDARIO,
    donde: [
      {
        ruta: "/calendario",
        etiqueta: "Hoja de una publicación planificada › «Cancelar la publicación»",
      },
    ],
    pasos: [
      "Abre una publicación planificada.",
      "Pulsa «Cancelar la publicación». La hoja se cierra y sale «Publicación cancelada.» con el título y «Deshacer».",
      "La tarjeta sigue en el calendario, tachada y con el estado «Cancelada».",
    ],
    reglas: [
      "Solo se ofrece en entradas planificadas.",
      "No se borra: pasa a `cancelada` y se puede recuperar («Deshacer» en el aviso o «Volver a planificarla» en su hoja).",
      "Cancela solo esa entrada: las hermanas de su lote siguen planificadas.",
      "Las canceladas no cuentan para el ritmo de la cuenta (separación de 45 minutos y máximo de 4 al día) ni para los duplicados, pero sí para el «+N más» del mes y el recuento del día.",
    ],
    estados: [
      {
        estado: "cancelada",
        significa: "«Cancelada»: no va a salir; se puede volver a planificar.",
      },
    ],
    endpoints: ["calendario.cancelar"],
    datos: DATOS_AGENDA,
    respuesta:
      'El botón es rojo (`variant="destructive"`) y no suena. Aviso neutro `toast()`, sin sonido: cancelar no es un fallo ni un hito. Lleva la acción «Deshacer», que la recupera con `toast.success` «Vuelve a estar planificada.».',
    origen: [
      "components/agenda/detalle-sheet.tsx:209",
      "components/agenda/detalle-sheet.tsx:453",
      "hooks/use-agenda.ts:214",
      "lib/agenda.ts:582",
      "lib/agenda.ts:814",
    ],
    relacionadas: ["calendario.recuperar-publicacion"],
  },
  {
    id: "calendario.recuperar-publicacion",
    area: "calendario",
    titulo: "Volver a planificar una publicación cancelada",
    resumen: "Deshacer una cancelación para que la publicación vuelva a salir a su hora.",
    quien: ["clipero", "agencia"],
    plan: PLAN_CALENDARIO,
    donde: [
      {
        ruta: "/calendario",
        etiqueta: "Hoja de una publicación cancelada › «Volver a planificarla»",
      },
      { ruta: "/calendario", etiqueta: "Aviso «Publicación cancelada.» › «Deshacer»" },
    ],
    pasos: [
      "Abre una publicación «Cancelada».",
      "Pulsa «Volver a planificarla». O, justo después de cancelar, pulsa «Deshacer» en el aviso.",
      "Sale «Vuelve a estar planificada.».",
    ],
    reglas: [
      "Vuelve a `planificada` con el mismo día y hora; no se revalida.",
      "Si su hora ya pasó, se pinta «Publicándose» si la lleva Clipealo (está en la cola) o «Toca publicar» si la publica la persona.",
      "La hoja sigue abierta y enseña ya las acciones de una planificada.",
    ],
    estados: [
      { estado: "planificada", significa: "«Planificada»: vuelve a esperar su hora." },
    ],
    endpoints: ["calendario.recuperar"],
    datos: DATOS_AGENDA,
    respuesta: "`toast.success` «Vuelve a estar planificada.» (sonido «success»).",
    origen: [
      "components/agenda/detalle-sheet.tsx:216",
      "components/agenda/detalle-sheet.tsx:466",
      "hooks/use-agenda.ts:217",
      "lib/agenda.ts:271",
    ],
    relacionadas: ["calendario.cancelar-publicacion"],
  },
  {
    id: "calendario.marcar-publicada",
    area: "calendario",
    titulo: "Marcar como publicada con su enlace",
    resumen:
      "Registrar una publicación que se subió fuera de Clipealo pegando su enlace, para que Analíticas la siga igual.",
    quien: ["clipero", "agencia"],
    plan: PLAN_CALENDARIO,
    donde: [
      {
        ruta: "/calendario",
        etiqueta:
          "Pie de la hoja de una publicación planificada o que no salió › «¿La subiste tú a mano?» › «Ya la publiqué»",
      },
    ],
    pasos: [
      "Abre una publicación planificada o que no salió.",
      "Al pie de la hoja, en «¿La subiste tú a mano?», pega el enlace en «Enlace de la publicación», copiado tal cual de la propia red.",
      "Pulsa «Ya la publiqué». Sale «¡Publicada!» y la hoja se cierra.",
    ],
    reglas: [
      "El enlace tiene que tener forma de URL: empieza por http:// o https:// y lleva un punto (`/^https?:\\/\\/\\S+\\.\\S+/`). Si no: «Pega un enlace válido, que empiece por https://».",
      "Guarda `publicada`, la `url` y `publicadaEn` = el «hoy» de la demo (AHORA_AGENDA), no la hora del navegador: una sellada con la hora real aparecería una semana más adelante.",
      "No hay `postId`: el enlace es lo que Analíticas sabe seguir y lo que «Enviar clip» necesita para una campaña.",
      "Solo en entradas planificadas o fallidas.",
      "El parche solo toca `estado`, `url` y `publicadaEn`: una fallida marcada a mano conserva su `fallo` y sus `intentos` guardados.",
    ],
    estados: [{ estado: "publicada", significa: "«Publicada»: con el enlace pegado." }],
    errores: [
      {
        codigo: "enlaceError",
        cuando: "El texto pegado no tiene forma de enlace.",
        frase: "calendario.detalle.enlaceError",
        bloquea: true,
      },
    ],
    endpoints: ["calendario.marcar-publicada"],
    datos: DATOS_AGENDA,
    respuesta:
      "`toast.celebrate` «¡Publicada!» con «El enlace ya está guardado y Analíticas lo sigue.» (arpegio y confeti de esquinas de recorte): la publicación es el hito, la haga Clipealo o la persona. El botón es secundario y no suena por sí mismo.",
    origen: [
      "components/agenda/detalle-sheet.tsx:58",
      "components/agenda/detalle-sheet.tsx:225",
      "components/agenda/detalle-sheet.tsx:482",
      "hooks/use-agenda.ts:265",
    ],
    relacionadas: ["calendario.revisar-pendientes", "calendario.reintentar-publicacion"],
  },
]
