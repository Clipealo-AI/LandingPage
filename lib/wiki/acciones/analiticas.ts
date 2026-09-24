import type { Accion } from "@/lib/wiki/tipos"

/**
 * Acciones de «analiticas»: lo que una persona hace en /analiticas y en la
 * tarjeta de reproducciones del Resumen.
 *
 * Todo lo que se pinta se calcula para un instante —el de la última
 * actualización— con funciones puras de `lib/analytics.ts`. Hoy las cifras
 * salen de una curva simulada y determinista; la frontera es
 * `lib/api/analiticas.ts`.
 */

/** Dónde viven hoy los datos de la página de Analíticas. */
const DATOS_ANALITICAS =
  "Semillas de `lib/analytics.ts` (8 clips → 19 publicaciones) más lo publicado desde Clipealo, que sale de la agenda del navegador (`clipealo-agenda-v1`, `hooks/use-agenda.ts`); el plan, de `clipealo-plan-v1` (`hooks/use-plan.ts`). Las cifras las simula `metricasEn`, una curva determinista. La frontera de datos es `lib/api/analiticas.ts`, pero la página todavía no la llama: calcula en el navegador."

export const ACCIONES: Accion[] = [
  {
    id: "analiticas.ver-panel",
    area: "analiticas",
    titulo: "Ver las analíticas de lo publicado",
    resumen:
      "Ver cuántas vistas, me gusta, comentarios y compartidos han ganado los clips publicados, por red y por publicación, en el instante de la última actualización.",
    quien: ["clipero", "agencia"],
    plan: {
      nota: 'La página está en todos los planes, pero Prueba (free) solo mide TikTok y sus 5 últimos clips (`NETWORKS_BY_PLAN.free = ["tiktok"]`, `CLIPS_ANALITICA_POR_PLAN.free = 5`) y lo dice arriba. Creador y Empresa miden las seis redes y todos los clips (`null`). Un plan creado en el backoffice hereda el límite de su escalón y no se edita por plan.',
    },
    donde: [{ ruta: "/analiticas", etiqueta: "Analíticas" }],
    pasos: [
      "En la barra lateral, grupo «Trabajo», pulsa «Analíticas». También se llega desde la paleta de comandos (Ctrl K o ⌘ K).",
      "Junto al título, bajo el botón «Refrescar», el sello «Actualizado el 13 de septiembre, …» dice de cuándo son las cifras: no es en tiempo real.",
      "Si el plan tiene límite, antes de cualquier cifra aparece el aviso con candado (ver «Ver lo que el plan deja medir»).",
      "Lee las cinco tarjetas: «Vistas en 30 días» (destacada, con minigráfica y «frente a los 30 días anteriores»), «Me gusta», «Comentarios», «Compartidos» y «Retención media».",
      "Debajo, «Crecimiento de vistas» (una línea por red) y «Dónde se ven» (barras por red con su porcentaje del total, la interacción y los clips publicados).",
      "Al final, «Clips publicados»: una fila por clip y red, con Vistas, En el período, Desde la última actualización, Me gusta, Compartidos, Retención y Últimos 14 días.",
      "Si no hay nada publicado, sale «Aún no hay clips publicados» con el botón «Ir a mis clips», que lleva a /proyectos.",
    ],
    reglas: [
      "Nada es en tiempo real: todo se calcula para `indexadoEn`. Al entrar vale `INDEXADO_EN` (2026-09-13T12:20:00.000Z) y la actualización anterior, `ANTERIOR_INICIAL` (2026-09-12T20:05:00.000Z).",
      "Entra lo ya indexado más cada entrada de la agenda en estado `publicada` y con URL (`publicacionesDeAgenda`): publicar un clip lo trae aquí solo, sin pegar ningún enlace. Lo que ya venía de las semillas (`age_pub_…`) no se cuenta dos veces. Con la agenda de la demo son 20 publicaciones.",
      "Una publicación recién salida entra con 0 vistas y las gana al refrescar.",
      "El recorte del plan se hace una sola vez, arriba (`limitarAnaliticas`), para que tarjetas, gráfica, barras y tabla cuenten lo mismo.",
      "Las tarjetas comparan el período con el anterior de la misma longitud: variación = (actual − anterior) ÷ anterior × 100, y no se enseña si el anterior es 0 (`variacionPct`).",
      "La retención media se pondera por las vistas ganadas en el período; su variación va en puntos con un decimal («+N,N pts», `analytics.kpi.retentionDelta`), no en porcentaje. Sin vistas ganadas, «—».",
      "La minigráfica de «Vistas en N días» tiene min(N, 14) puntos: las vistas ganadas en cada tramo.",
      "«Dónde se ven» ordena las redes de más a menos vistas ganadas en el período; interacción = (me gusta + comentarios + compartidos) ÷ vistas, con un decimal.",
      "«Clips publicados» se ordena por vistas ganadas en el período y, a igualdad, por vistas totales. «Desde la última actualización» es «—» si no hubo anterior, y «Nuevo» marca lo publicado después de la actualización anterior.",
      "Cada fila lleva el @handle de la cuenta que publicó si sigue conectada: con dos cuentas de la misma red es lo que las distingue.",
      "Por ancho se esconden columnas: «Desde la última actualización» por debajo de lg, «Me gusta» y «Retención» por debajo de md, «Compartidos» por debajo de xl y «Últimos 14 días» por debajo de sm.",
      "El color es de la red y no de su posición (`COLOR_RED`: TikTok `--chart-1`, Instagram `--chart-2`, YouTube `--chart-3`, LinkedIn `--chart-4`, X `--chart-5`, Facebook `--chart-6`): filtrar no repinta a las demás.",
    ],
    endpoints: [
      "analiticas.leer-indice",
      "analiticas.listar",
      "analiticas.leer-metricas",
      "analiticas.leer-serie",
    ],
    datos: DATOS_ANALITICAS,
    respuesta:
      "Sin sonido ni efecto: es una lectura. Mientras carga la ruta salen esqueletos; la gráfica de crecimiento (recharts, fuera de la primera carga) llega con un hueco de su misma altura para que nada salte.",
    origen: [
      "app/[locale]/(app)/analiticas/page.tsx:39",
      "components/app/analytics-dashboard.tsx:149",
      "components/app/analytics-dashboard.tsx:124",
      "components/app/analytics-dashboard.tsx:110",
      "lib/analytics.ts:284",
      "lib/analytics.ts:436",
      "lib/analytics.ts:501",
      "lib/analytics.ts:532",
      "components/app/app-sidebar.tsx:81",
      "tests/e2e/analiticas.spec.ts:6",
    ],
    relacionadas: [
      "analiticas.refrescar-metricas",
      "analiticas.filtrar-por-periodo",
      "analiticas.filtrar-por-red",
      "analiticas.ver-detalle-publicacion",
      "analiticas.ver-limite-plan",
    ],
  },
  {
    id: "analiticas.refrescar-metricas",
    area: "analiticas",
    titulo: "Refrescar las métricas",
    resumen:
      "Traer de las redes las cifras de ahora y saber cuántas vistas se han ganado desde la última actualización.",
    quien: ["clipero", "agencia"],
    donde: [{ ruta: "/analiticas", etiqueta: "Analíticas · botón «Refrescar»" }],
    pasos: [
      "En /analiticas, arriba a la derecha, pulsa «Refrescar».",
      "El botón pasa a «Actualizando…», su icono gira y todo lo de debajo se atenúa en su sitio, sin esqueletos ni saltos.",
      "Al volver, aviso «Métricas actualizadas» con «+N vistas desde la última actualización.», y el sello «Actualizado el …» cambia a la hora nueva.",
      "Durante 30 s el botón queda apagado con la cuenta atrás «Refrescar en 30 s» … «Refrescar en 1 s»; después vuelve a «Refrescar».",
    ],
    reglas: [
      "En la demo la lectura tarda 1,4 s (`DURACION_REFRESCO_MS = 1_400`).",
      "Entre dos refrescos hay que esperar 30 s (`ESPERA_ENTRE_REFRESCOS_S = 30`): las redes limitan cuántas veces se les pregunta.",
      "El nuevo instante siempre va hacia delante: el mayor entre la hora del equipo y el índice vigente + 1 h (el reloj del equipo puede ir por detrás del índice).",
      "La actualización vigente pasa a ser la «anterior»: de ella salen la columna «Desde la última actualización» y la etiqueta «Nuevo».",
      "Las vistas del aviso son las ganadas entre las dos actualizaciones por todo lo que el plan deja medir, sin mirar el filtro de red.",
      "Si se abre el detalle de una publicación mientras dura la lectura, al volver enseña ya las cifras nuevas: el panel busca su fila entre las recalculadas.",
      "La cuenta atrás vive en el estado del botón (`BotonRefrescar`): recargar la página la borra y deja refrescar otra vez.",
      "Hoy no pasa por la frontera de datos: simula con un temporizador y `refrescar` no atrapa errores. Al conectarla, un fallo sin atrapar dejaría el botón en «Actualizando…».",
    ],
    estados: [
      { estado: "Refrescar", significa: "Se puede pedir una lectura nueva." },
      {
        estado: "Actualizando…",
        significa:
          "La lectura está en marcha: botón apagado, icono girando y el contenido al 60 % de opacidad con `aria-busy`.",
      },
      {
        estado: "Refrescar en N s",
        significa:
          "Acaba de refrescar: el botón espera los 30 s de respiro antes de admitir otra lectura.",
      },
    ],
    errores: [
      {
        codigo: "limite",
        cuando:
          "Con servidor: la red o el propio servidor no admiten otra lectura todavía (HTTP 429). Hoy la cuenta atrás de 30 s lo evita en el navegador y la página no enseña este error.",
        frase: "common.errors.limite",
        bloquea: true,
      },
    ],
    endpoints: ["analiticas.refrescar", "analiticas.leer-metricas"],
    datos:
      "El instante vive en el estado de la página (`indexadoEn`, `anterior`): recargar vuelve a `INDEXADO_EN`. Las cifras nuevas las calcula `ganado` con la curva simulada.",
    respuesta:
      '`toast.success` «Métricas actualizadas»: suena «success» y no lleva efecto. El botón es `outline`, así que pulsarlo no suena. El sello «Actualizado el …» está en `aria-live="polite"` y se anuncia.',
    origen: [
      "components/app/analytics-dashboard.tsx:66",
      "components/app/analytics-dashboard.tsx:126",
      "components/app/analytics-dashboard.tsx:128",
      "components/app/analytics-dashboard.tsx:213",
      "components/app/analytics-dashboard.tsx:222",
      "components/app/analytics-dashboard.tsx:316",
      "lib/analytics.ts:403",
      "tests/e2e/analiticas.spec.ts:21",
    ],
    relacionadas: ["analiticas.ver-panel", "analiticas.ver-detalle-publicacion"],
  },
  {
    id: "analiticas.filtrar-por-periodo",
    area: "analiticas",
    titulo: "Cambiar el período",
    resumen:
      "Ver lo ganado en los últimos 7, 30 o 90 días, comparado con el período anterior de la misma longitud.",
    quien: ["clipero", "agencia"],
    donde: [{ ruta: "/analiticas", etiqueta: "Analíticas · filtro de período" }],
    pasos: [
      "En la fila de filtros, pulsa «7 días», «30 días» o «90 días».",
      "Cambian a la vez las tarjetas («Vistas en 7 días», «frente a los 7 días anteriores»), la gráfica, «Dónde se ven» y la columna «En el período».",
      "La dirección guarda la elección (`?periodo=7`): se puede recargar o compartir.",
    ],
    reglas: [
      "Solo 7, 30 o 90 días (`PERIODOS`); por defecto, 30. Un valor distinto en la URL se ignora y vale 30.",
      "El período anterior es el tramo de la misma longitud justo antes del inicio del período.",
      "La gráfica tiene un punto por día: 8 con 7 días, 31 con 30 y 91 con 90 (el inicio, uno al cierre de cada día y el último en el instante de la actualización).",
      "«N publicaciones nuevas en N días» cuenta las publicadas dentro del período; sin ninguna, «Sin publicaciones nuevas en N días.».",
      "La minigráfica «Últimos 14 días» de la tabla no depende del período: siempre son 14 días.",
    ],
    endpoints: ["analiticas.leer-metricas", "analiticas.leer-serie"],
    datos: DATOS_ANALITICAS,
    respuesta:
      'Sin sonido: las opciones llevan `data-sound="none"` porque filtrar no se celebra (regla 7 de AGENTS.md).',
    origen: [
      "components/app/analytics-dashboard.tsx:153",
      "components/app/analytics-dashboard.tsx:289",
      "lib/analytics.ts:30",
      "lib/analytics.ts:469",
      "tests/e2e/analiticas.spec.ts:35",
    ],
    relacionadas: ["analiticas.ver-panel", "analiticas.filtrar-por-red"],
  },
  {
    id: "analiticas.filtrar-por-red",
    area: "analiticas",
    titulo: "Filtrar por red",
    resumen: "Quedarse con lo publicado en una sola red en todo el panel.",
    quien: ["clipero", "agencia"],
    plan: {
      nota: "Con Prueba solo se puede elegir TikTok, la única red que mide (`NETWORKS_BY_PLAN.free`). Con Creador y Empresa, cualquiera de las seis que tenga publicaciones.",
    },
    donde: [{ ruta: "/analiticas", etiqueta: "Analíticas · desplegable «Red»" }],
    pasos: [
      "Abre el desplegable «Red», que por defecto dice «Todas las redes».",
      "Elige una red: cada opción lleva su logo y solo aparecen las que tienen publicaciones.",
      "Todo lo de debajo se queda con esa red: las tarjetas, la gráfica (su descripción pasa a «Vistas ganadas desde el inicio del período en LinkedIn.»), las barras y la tabla.",
      "La dirección guarda la red (`?red=linkedin`). Para volver, elige «Todas las redes».",
    ],
    reglas: [
      "Valores posibles: `todas` o una de `tiktok`, `instagram`, `youtube`, `x`, `linkedin`, `facebook` (`FILTRO_RED`); cualquier otro en la URL vale «todas».",
      "Solo se ofrecen las redes con alguna publicación dentro de lo que el plan deja ver: el filtro va después del recorte del plan.",
      "Con una sola red, la línea de la gráfica lleva su lavado al 10 %; con varias, líneas de 2 px sin apilar, para poder comparar.",
      "Si la red de la dirección no tiene publicaciones visibles (escribiendo `?red=` a mano, o con un plan que no mide esa red), el vacío lo dice: «Aún no hay clips publicados en {red}».",
      "El aviso de «Métricas actualizadas» suma todas las redes aunque haya filtro.",
    ],
    endpoints: ["analiticas.listar", "analiticas.leer-serie"],
    datos: DATOS_ANALITICAS,
    respuesta: "Sin sonido: filtrar no se celebra.",
    origen: [
      "components/app/analytics-dashboard.tsx:130",
      "components/app/analytics-dashboard.tsx:157",
      "components/app/analytics-dashboard.tsx:189",
      "components/app/analytics-dashboard.tsx:209",
      "components/app/analytics-growth-chart.tsx:41",
      "tests/e2e/analiticas.spec.ts:41",
    ],
    relacionadas: ["analiticas.ver-panel", "analiticas.filtrar-por-periodo"],
  },
  {
    id: "analiticas.ver-crecimiento-como-tabla",
    area: "analiticas",
    titulo: "Leer el crecimiento como tabla",
    resumen:
      "Leer las cifras exactas de la gráfica «Crecimiento de vistas» sin depender del color ni del ratón.",
    quien: ["clipero", "agencia"],
    donde: [{ ruta: "/analiticas", etiqueta: "Analíticas · «Crecimiento de vistas»" }],
    pasos: [
      "En la tarjeta «Crecimiento de vistas», debajo de la gráfica, pulsa «Ver los datos como tabla».",
      "Se despliega una tabla con una fila por día (columna «Día») y una columna por red, con la cifra entera.",
      "Pulsa otra vez para plegarla.",
    ],
    reglas: [
      "Son los mismos datos de la gráfica: vistas ganadas desde el inicio del período, por red y día.",
      "La leyenda de encima nombra cada red con su total ganado, así que la identidad de una línea nunca depende solo del color.",
      "Al pasar por la gráfica, el último punto se rotula «{fecha} · última actualización».",
      "La gráfica no se anima (`isAnimationActive={false}`).",
    ],
    endpoints: ["analiticas.leer-serie"],
    datos: DATOS_ANALITICAS,
    respuesta: "Sin sonido: es un `<details>` nativo.",
    origen: [
      "components/app/analytics-growth-chart.tsx:32",
      "components/app/analytics-growth-chart.tsx:46",
      "components/app/analytics-growth-chart.tsx:139",
    ],
    relacionadas: ["analiticas.ver-panel"],
  },
  {
    id: "analiticas.ver-detalle-publicacion",
    area: "analiticas",
    titulo: "Ver el crecimiento de una publicación",
    resumen:
      "Abrir una publicación para ver sus cifras acumuladas, su retención y cómo han crecido sus vistas desde que salió.",
    quien: ["clipero", "agencia"],
    donde: [{ ruta: "/analiticas", etiqueta: "Analíticas · «Clips publicados»" }],
    pasos: [
      "En «Clips publicados», pulsa el título de una publicación (o cualquier punto de su fila).",
      "Se abre un panel a la derecha: «{Red} · publicado hace …», el @handle de la cuenta si sigue conectada, el título y «Cifras de la última actualización, el …».",
      "Arriba, cuatro cifras: «Vistas», «Me gusta», «Comentarios» y «Compartidos».",
      "Después, «Retención media» con su barra, «Qué parte del clip ve la gente de media.» y la interacción.",
      "Y la gráfica «Vistas acumuladas desde que se publicó».",
      "Al pie, «Abrir en {red}» y, si el clip sigue en la biblioteca, «Ver el clip». Se cierra con la X, con Esc o pulsando fuera.",
    ],
    reglas: [
      "Las cifras son las acumuladas en el instante de la última actualización, no las del período.",
      "Interacción = (me gusta + comentarios + compartidos) ÷ vistas, con un decimal; sin vistas no se dice.",
      "La curva tiene un punto por día desde la publicación y el último en la actualización: como mínimo, dos.",
      "El título de la fila es un botón, para que el teclado y los lectores de pantalla tengan un objetivo claro; la fila entera también abre.",
      "El panel es modal: mientras está abierto no se puede pulsar «Refrescar». Si se abre durante una lectura, al volver enseña ya las cifras nuevas (busca su fila entre las recalculadas).",
    ],
    endpoints: ["analiticas.leer-metricas", "analiticas.leer-curva"],
    datos: DATOS_ANALITICAS,
    respuesta: "Sin sonido: abrir un panel es navegación. La gráfica no se anima.",
    origen: [
      "components/app/analytics-publications-table.tsx:68",
      "components/app/analytics-publications-table.tsx:79",
      "components/app/analytics-publication-sheet.tsx:49",
      "components/app/analytics-publication-sheet.tsx:65",
      "components/app/analytics-publication-sheet.tsx:69",
      "components/app/analytics-dashboard.tsx:440",
      "lib/analytics.ts:563",
      "tests/e2e/analiticas.spec.ts:53",
    ],
    relacionadas: [
      "analiticas.abrir-publicacion-en-red",
      "analiticas.ir-al-clip-publicado",
      "analiticas.refrescar-metricas",
    ],
  },
  {
    id: "analiticas.abrir-publicacion-en-red",
    area: "analiticas",
    titulo: "Abrir la publicación en la red",
    resumen: "Ir al post en TikTok, Instagram, YouTube… para verlo donde lo ve la gente.",
    quien: ["clipero", "agencia"],
    donde: [{ ruta: "/analiticas", etiqueta: "Analíticas · detalle de la publicación" }],
    pasos: [
      "Abre el detalle de una publicación.",
      "Pulsa «Abrir en TikTok» (o en la red que corresponda).",
      "El post se abre en una pestaña nueva.",
    ],
    reglas: [
      "El enlace es la URL de la publicación: la que devolvió la plataforma al publicar desde Clipealo, o la ya indexada.",
      'Se abre con `target="_blank"` y `rel="noreferrer"`.',
      "Con servidor, lo que identifica al post para leer sus cifras es el `postId`, no esta URL.",
    ],
    endpoints: ["analiticas.listar"],
    datos: DATOS_ANALITICAS,
    respuesta: "Sin sonido: es un enlace que sale del producto.",
    origen: [
      "components/app/analytics-publication-sheet.tsx:188",
      "lib/analytics.ts:69",
      "tests/e2e/analiticas.spec.ts:65",
    ],
    relacionadas: ["analiticas.ver-detalle-publicacion"],
  },
  {
    id: "analiticas.ir-al-clip-publicado",
    area: "analiticas",
    titulo: "Ir al clip de una publicación",
    resumen:
      "Pasar de la cifra al clip, para cambiarle el texto o volver a publicarlo en otra cuenta.",
    quien: ["clipero", "agencia"],
    donde: [
      { ruta: "/analiticas", etiqueta: "Analíticas · detalle de la publicación" },
      { ruta: "/proyectos/[id]/clips/[clipId]", etiqueta: "Ficha del clip" },
    ],
    pasos: [
      "Abre el detalle de una publicación.",
      "Pulsa «Ver el clip».",
      "Llegas a la ficha del clip dentro de su proyecto.",
    ],
    reglas: [
      "Solo aparece si la publicación trae `clipId` y `proyectoId`. Las semillas de clips que ya no están en la biblioteca no los traen. El panel no comprueba que el clip siga existiendo: se fía de esos dos ids.",
      "En las semillas lo llevan los tres clips de la biblioteca (`clip_01`, `clip_02`, `clip_03`, del proyecto `src_01`); lo publicado desde Clipealo lo lleva si la entrada de agenda guardó clip y proyecto.",
    ],
    endpoints: ["analiticas.listar"],
    datos: DATOS_ANALITICAS,
    respuesta: "Sin sonido: es navegación.",
    origen: [
      "components/app/analytics-publication-sheet.tsx:194",
      "components/app/analytics-publication-sheet.tsx:197",
      "lib/analytics.ts:216",
    ],
    relacionadas: ["analiticas.ver-detalle-publicacion"],
  },
  {
    id: "analiticas.ver-limite-plan",
    area: "analiticas",
    titulo: "Ver lo que el plan deja medir",
    resumen:
      "Saber, antes de ver ninguna cifra, qué parte de lo publicado mide el plan, cuánto queda fuera y dónde se amplía.",
    quien: ["clipero", "agencia"],
    plan: {
      nota: "El aviso solo sale con un plan con límite (`hayLimiteAnaliticas`): hoy, los que heredan de Prueba (free). Con Creador o Empresa no hay recorte ni aviso.",
    },
    donde: [{ ruta: "/analiticas", etiqueta: "Analíticas · aviso bajo el título" }],
    pasos: [
      "Con el plan Prueba, entra en /analiticas.",
      "Debajo del título, con un candado: «Con el plan Prueba se miden tus últimos 5 clips de TikTok. Quedan 14 publicaciones fuera.».",
      "Pulsa «Ver los planes» para ir a /precios.",
    ],
    reglas: [
      "Prueba mide solo TikTok (`NETWORKS_BY_PLAN.free`) y sus 5 últimos clips (`CLIPS_ANALITICA_POR_PLAN.free = 5`); Creador y Empresa, todo (`null`).",
      "El tope cuenta clips, no publicaciones: el mismo clip en dos redes, o dos veces en TikTok, es uno. Con la agenda de la demo, Prueba ve 6 publicaciones de 5 clips y deja 14 fuera.",
      "Los clips que entran son los más recientes, por la fecha de su última publicación; a igualdad, por id. Una publicación sin `clipId` cuenta como su propio clip.",
      "Nada se recorta a escondidas: si queda algo fuera se dice cuántas publicaciones (`ocultasPorPlan`); si no queda ninguna, solo se dice el límite.",
      "El nombre del plan es el del catálogo (un plan creado en el backoffice enseña el suyo) y el límite, el de su escalón: redes y clips no se editan por plan.",
      'El aviso tiene `role="status"`: si se cambia de plan desde el menú de usuario, aparece o desaparece sin recargar.',
    ],
    endpoints: ["analiticas.listar"],
    datos:
      "El plan vive en `clipealo-plan-v1` (`hooks/use-plan.ts`) y el catálogo de planes, en `clipealo-planes-v1` (`hooks/use-catalogo-planes.ts`); los límites, en `lib/pricing.ts`.",
    respuesta: "Sin sonido: es un aviso en línea, no un toast.",
    origen: [
      "components/app/analytics-dashboard.tsx:258",
      "lib/analytics.ts:315",
      "lib/analytics.ts:339",
      "lib/pricing.ts:508",
      "lib/pricing.ts:515",
      "lib/planes.ts:505",
      "components/planes/aviso-plan.tsx:52",
      "tests/e2e/analiticas.spec.ts:71",
    ],
    relacionadas: ["analiticas.ver-panel", "analiticas.filtrar-por-red"],
  },
  {
    id: "analiticas.ver-reproducciones-semana",
    area: "analiticas",
    titulo: "Ver las reproducciones de la semana en el Resumen",
    resumen:
      "Ver de un vistazo, en la página de inicio, cuántas reproducciones y clips publicados hubo cada día de la semana.",
    quien: ["clipero", "agencia"],
    donde: [{ ruta: "/dashboard", etiqueta: "Resumen · «Reproducciones esta semana»" }],
    pasos: [
      "Entra en «Resumen» desde la barra lateral.",
      "En la tarjeta «Reproducciones esta semana», la cifra grande es el total («reproducciones en los últimos 7 días») y hay una barra por día, de lunes a domingo.",
      "Pasa el ratón por una barra para ver «N reproducciones» y «N clips».",
      "Pulsa «Ver los datos como tabla» para leer Día, Reproducciones y Clips.",
    ],
    reglas: [
      "Barras y no área: siete días son categorías discretas. Una sola serie y sin leyenda: el título de la tarjeta la nombra.",
      "El número de clips va en el tooltip y en la tabla, nunca en un segundo eje.",
      "Hoy los datos son una semilla fija (`weeklyViews`: 174.300 reproducciones y 32 clips) y no salen de las publicaciones de Analíticas, así que las dos pantallas no cuadran.",
      "La gráfica se carga aparte (recharts fuera de la primera carga).",
    ],
    endpoints: ["analiticas.leer-semana"],
    datos:
      "Semilla fija `weeklyViews` en `lib/mock-data.ts`; no hay almacén ni frontera de datos.",
    respuesta: "Sin sonido: es una lectura.",
    origen: [
      "components/app/views-chart.tsx:23",
      "components/app/views-chart.tsx:103",
      "lib/mock-data.ts:505",
      "app/[locale]/(app)/dashboard/page.tsx:97",
      "components/shared/graficas-diferidas.tsx:33",
    ],
    relacionadas: ["analiticas.ver-panel", "analiticas.ver-cifras-resumen"],
  },
  {
    id: "analiticas.ver-cifras-resumen",
    area: "analiticas",
    titulo: "Ver las cifras de lo publicado en el Resumen",
    resumen:
      "Ver en la página de inicio, en tres tarjetas, las reproducciones, los clips publicados y la retención media.",
    quien: ["clipero", "agencia"],
    donde: [{ ruta: "/dashboard", etiqueta: "Resumen · fila «Métricas»" }],
    pasos: [
      "Entra en «Resumen» desde la barra lateral.",
      "Debajo del saludo (y de la tarjeta de perfil, si la bienvenida quedó a medias), la fila de tarjetas empieza con «Reproducciones (30 d)» (destacada), «Clips publicados» y «Retención media». La cuarta, «Minutos procesados», es del plan.",
      "Cada tarjeta lleva debajo su variación con una flecha: verde si sube y roja si baja.",
    ],
    reglas: [
      "«Reproducciones (30 d)» suma `metrics.views` de todos los clips de la semilla que tienen cifras, publicados o no, sin ventana de fechas: 197.000 con la demo (128.400 + 42.300 + 18.900 + 7.400, este último de `clip_06`, en estado `listo`). La etiqueta dice 30 días, pero el cálculo no los aplica.",
      "«Clips publicados» cuenta los clips en estado `publicado`: 3 con la demo.",
      "«Retención media» es la media simple, redondeada, de `metrics.retention` de los publicados: (71 + 64 + 58) ÷ 3 = 64 %. No se pondera por vistas, a diferencia de la de /analiticas.",
      "Las variaciones son fijas en el código: +24 %, +12 % y −3 %. No comparan con ningún período.",
      "Estas cifras no salen de las publicaciones de /analiticas ni de `weeklyViews`: las tres fuentes no cuadran entre sí.",
    ],
    endpoints: ["proyectos.listar-clips-cuenta"],
    datos:
      "Semilla fija `clips` de `lib/mock-data.ts`, leída en el servidor. No pasa por ninguna frontera de datos.",
    respuesta: "Sin sonido: es una lectura.",
    origen: [
      "app/[locale]/(app)/dashboard/page.tsx:37",
      "app/[locale]/(app)/dashboard/page.tsx:38",
      "app/[locale]/(app)/dashboard/page.tsx:39",
      "app/[locale]/(app)/dashboard/page.tsx:70",
      "app/[locale]/(app)/dashboard/page.tsx:74",
      "app/[locale]/(app)/dashboard/page.tsx:80",
      "app/[locale]/(app)/dashboard/page.tsx:86",
      "lib/mock-data.ts:199",
      "components/shared/stat-card.tsx:58",
    ],
    relacionadas: ["analiticas.ver-reproducciones-semana", "analiticas.ver-panel"],
  },
]
