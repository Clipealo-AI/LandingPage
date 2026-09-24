import type { Accion } from "@/lib/wiki/tipos"

/**
 * Acciones de «campanas»: lo que hace el clipero con las campañas.
 *
 * Explorar y filtrar, entrar en una privada con su código, pedir entrar,
 * entregar el clip, seguir sus compromisos y lo que cobra, releer vistas,
 * reclamar y pedir la lista blanca. Lo que hace la agencia con SUS campañas
 * (crearlas, decidir solicitudes, revisar clips, pausar, cerrar) está en
 * «agencias»; el arbitraje del admin, en «backoffice».
 *
 * Todo vive hoy en el almacén del navegador `clipealo-campanas-v1`
 * (`hooks/use-campanas.ts`) sobre las semillas de `lib/campanas.ts` y
 * `lib/participacion.ts`. El «hoy» de la demo es `HOY_CAMPANAS`
 * (2026-09-13T12:20:00.000Z) y la cuenta, Ana Ruiz (`u_ana`).
 */

const DATOS_ALMACEN =
  "Semillas de `lib/campanas.ts` (11 campañas y sus envíos) y de `lib/participacion.ts`, más lo que guarda el almacén del navegador `clipealo-campanas-v1` (`hooks/use-campanas.ts`): campañas creadas, cambios, envíos, participaciones, disputas y privadas desbloqueadas. Se sincroniza entre pestañas."

export const ACCIONES: Accion[] = [
  /* ----------------------------------------------------------------------
     Explorar
     ---------------------------------------------------------------------- */
  {
    id: "campanas.explorar-campanas",
    area: "campanas",
    titulo: "Explorar campañas",
    resumen:
      "Ver las campañas en las que se puede clipear, por categoría, con las tres cifras que deciden si merece la pena: CPM, presupuesto y tope por video.",
    quien: ["clipero", "agencia"],
    plan: {
      nota: "Se ven las campañas que pagan en alguna red del plan (`NETWORKS_BY_PLAN`): Prueba, solo TikTok; Creador y Empresa, las seis. Las que quedan fuera no se esconden en silencio: «Con el plan {plan} se ven las campañas que pagan por {red}. Quedan N fuera.», con «Ver los planes».",
    },
    donde: [{ ruta: "/campanas", etiqueta: "Campañas › Explorar" }],
    pasos: [
      "Entra en Campañas. «Explorar» es la pestaña por defecto (`?vista=explorar`); al lado, «Participando» y, si eres agencia, «Mis campañas».",
      "Arriba, las categorías con su contador: «Todas», «Influencers», «Música», «Marcas» e «Infoproductores». Pulsa una para quedarte con las suyas.",
      "Recorre las secciones: «Destacadas», «Privadas desbloqueadas» y «Campañas individuales».",
      "En cada tarjeta lee «CPM», «Presupuesto» y «Por video» (el tope, con su «máx. %»), la barra de «consumido» y cuántos clips lleva. Cada cifra tiene su (i).",
      "Pulsa el título o la flecha ↗ para abrir la campaña. El botón de la tarjeta dice qué puedes hacer tú en ella: «Solicitar entrar», «Subir clip», «Solicitud enviada», «En revisión», «Listo», «No te aceptaron», «Se pasó el plazo», «En disputa» o «No acepta clips».",
    ],
    reglas: [
      "Salen las públicas y las privadas desbloqueadas con su código; una privada sin desbloquear no sale, tampoco a quien la creó, que la ve en «Mis campañas» (`campaigns-explorer.tsx:143`).",
      "De esas, solo las que pagan en alguna red del plan. El resto se cuenta en el aviso, antes de la rejilla: una lista más corta sin decir por qué se lee como que no hay campañas.",
      "«Destacadas» son las que destaca el admin (`destacada`); las privadas desbloqueadas van en su sección; el resto, en «Campañas individuales».",
      "«Por video» es el tope por video: presupuesto × tope % ÷ 100, redondeado a céntimos (`topePorVideo`). En «Liga de las Estrellas»: 3.600 × 4 % = US$ 144.",
      "El consumido sale de `liquidar()`: lo pagado a los clips aprobados sobre el presupuesto. «Clips» cuenta los envíos que no están rechazados.",
      "El estado que se enseña (`estadoVisible`), por orden: el estado guardado, si no es «activa», manda (pausada o finalizada, que deciden la agencia o el admin); una activa con menos de US$ 0,01 por repartir es «Agotada»; pasado su `fin`, «Vencida»; con las inscripciones cerradas, «Inscripciones cerradas».",
      "Quien creó la campaña no ve botón en su tarjeta: ve «Es tu campaña» y cuántas solicitudes esperan su decisión.",
      "«Mis campañas» es de las agencias: quien no lo es y llega con `?vista=mis-campanas` ve Explorar.",
    ],
    estados: [
      {
        estado: "activa",
        significa: "«Activa»: todo en orden. Admite solicitudes y clips.",
      },
      {
        estado: "cerrada",
        significa:
          "«Inscripciones cerradas»: no entra nadie nuevo; los ya aceptados siguen entregando.",
      },
      {
        estado: "agotada",
        significa:
          "«Agotada»: se repartió el presupuesto (quedan menos de US$ 0,01). El tipo admite guardarla así, pero ninguna pantalla lo hace: siempre sale del reparto. No admite clips.",
      },
      {
        estado: "vencida",
        significa: "«Vencida»: pasó su fecha de fin. No admite clips ni gente nueva.",
      },
      {
        estado: "pausada",
        significa:
          "«Pausada»: la paró quien la creó o el admin. No admite clips hasta que se reanude.",
      },
      {
        estado: "finalizada",
        significa:
          "«Finalizada»: cerrada. Quien la creó solo puede cerrarla sin trabajo pendiente; el admin la cierra desde el backoffice sin esa comprobación. No admite clips.",
      },
    ],
    endpoints: ["campanas.listar", "campanas.listar-envios"],
    datos: DATOS_ALMACEN + " El plan, de `clipealo-plan-v1`.",
    respuesta:
      'Sin sonido: navegar y elegir categoría es silencioso (los botones de categoría llevan `data-sound="none"`).',
    origen: [
      "components/campanas/campaigns-explorer.tsx:88",
      "components/campanas/campaigns-explorer.tsx:143",
      "components/campanas/campaigns-explorer.tsx:153",
      "components/campanas/campaign-card.tsx:33",
      "lib/campanas.ts:233",
      "lib/campanas.ts:308",
      "lib/campanas.ts:356",
    ],
    relacionadas: [
      "campanas.filtrar-campanas",
      "campanas.ordenar-para-ti",
      "campanas.ver-campana",
      "campanas.desbloquear-privada",
    ],
  },
  {
    id: "campanas.filtrar-campanas",
    area: "campanas",
    titulo: "Buscar y filtrar campañas",
    resumen:
      "Acotar Explorar por texto, red y estado, y elegir el orden, con cada filtro guardado en la URL.",
    quien: ["clipero", "agencia"],
    plan: {
      nota: "El selector de red solo ofrece las redes del plan (`redesDe`): con Prueba, TikTok. Filtrar por una red donde no se puede cobrar devolvía siempre cero.",
    },
    donde: [{ ruta: "/campanas", etiqueta: "Campañas › Explorar › Filtros" }],
    pasos: [
      "En Explorar, escribe en «Buscar campaña, creador o serie…».",
      "Elige la red en «Todas las redes».",
      "Elige el estado en «Cualquier estado»: «Activa», «Agotada» o «Finalizada».",
      "Elige el orden: «Presupuesto: mayor primero» (el de por defecto), «CPM: mayor primero», «Más recientes», «A punto de agotarse» o «Para ti».",
      "«Limpiar» vuelve a todo. Si no queda ninguna, «No hay campañas con esos filtros» y «Limpiar filtros».",
    ],
    reglas: [
      "La búsqueda mira título, marca, serie y el nombre de quien la creó, sin distinguir mayúsculas ni tildes (`coincideBusqueda`): «musica» encuentra «Música».",
      "Cada filtro vive en la URL: `?q=`, `?red=`, `?estado=`, `?orden=` y `?categoria=`. Un enlace guarda la vista. `?categoria=` usa las etiquetas de siempre («Todas», «Música») para no romper enlaces guardados.",
      "El estado se compara con el que se enseña; «Vencida», «Pausada» e «Inscripciones cerradas» no están entre las opciones del filtro.",
      "Órdenes (`ordenar`): presupuesto total, CPM, fecha de creación, porcentaje consumido («A punto de agotarse») y puntos de «Para ti». A igualdad, por título.",
      "El contador de cada categoría cuenta lo que queda con los demás filtros puestos.",
      "«Limpiar» está apagado cuando no hay nada que limpiar.",
    ],
    endpoints: ["campanas.listar", "campanas.listar-envios"],
    datos:
      "Todo en el cliente sobre la lista de campañas; los filtros, en la URL (nuqs). No se guarda nada.",
    respuesta:
      "Sin sonido ni aviso: filtrar no suena (regla 7 de AGENTS.md). El listado cambia al momento.",
    origen: [
      "components/campanas/campaigns-explorer.tsx:63",
      "components/campanas/campaigns-explorer.tsx:69",
      "components/campanas/campaigns-explorer.tsx:168",
      "components/campanas/campaigns-explorer.tsx:197",
      "lib/campanas.ts:454",
      "lib/campanas.ts:466",
    ],
    relacionadas: ["campanas.explorar-campanas", "campanas.ordenar-para-ti"],
  },
  {
    id: "campanas.ordenar-para-ti",
    area: "campanas",
    titulo: "Ver las campañas «Para ti»",
    resumen:
      "Ordenar Explorar por encaje con lo que la persona respondió en el onboarding, con una línea «Por qué la ves» en cada campaña que puntúa.",
    quien: ["clipero", "agencia"],
    donde: [
      { ruta: "/campanas?orden=para-ti", etiqueta: "Campañas › Explorar › Para ti" },
    ],
    pasos: [
      "En Explorar, abre el selector de orden y elige «Para ti».",
      "Las campañas salen en un solo listado, «Para ti», de más a menos puntos.",
      "Encima de cada tarjeta que puntúa: «Por qué la ves: Gaming · TikTok · Destacada».",
    ],
    reglas: [
      "Puntos (`PUNTOS_RECOMENDACION`): +3 si su vertical, principal o secundaria, está entre las tuyas (las declaradas en el onboarding; si no declaraste ninguna, las de tus creadores favoritos); +2 si su creador está en tu fandom; +1 por cada red en común, máximo 2; +1 si es destacada; +1 si le queda al menos el 50 % del presupuesto. Idioma y país explican, pero no suman.",
      "Solo puntúan las que pasan los filtros duros (`recomendarCampanas`): admite clips, no es privada sin desbloquear, comparte alguna red contigo (con «Aún no tengo cuenta» no filtra), encaja en sus idiomas y países objetivo si los pone, toleras sus etiquetas de seguridad y, si es regulada o solo para verificados, tu cuenta está verificada.",
      "Las que no pasan no desaparecen de Explorar: cuentan 0 puntos, quedan detrás de las que puntúan y salen sin «Por qué la ves» (se ordena la lista visible, no la recomendada: `campaigns-explorer.tsx:168`).",
      "A igualdad de puntos, más presupuesto restante primero y, después, el título.",
      "«Por qué la ves» enseña como mucho 4 motivos (`MAX_MOTIVOS`).",
      "Con «Para ti» no se separan «Destacadas» ni «Privadas desbloqueadas»: rompería el orden por encaje.",
    ],
    endpoints: ["campanas.listar", "campanas.listar-envios"],
    datos:
      "Cálculo puro (`recomendarCampanas`) sobre las campañas y las respuestas del onboarding (`clipealo-cuenta-v1`). No guarda nada.",
    respuesta: "Sin sonido: es un orden.",
    origen: [
      "lib/recomendacion.ts:70",
      "lib/recomendacion.ts:132",
      "components/campanas/campaigns-explorer.tsx:163",
      "components/campanas/por-que-la-ves.tsx:14",
    ],
    relacionadas: ["campanas.explorar-campanas", "campanas.filtrar-campanas"],
  },
  {
    id: "campanas.refrescar-campanas",
    area: "campanas",
    titulo: "Refrescar las campañas",
    resumen: "Volver a mirar presupuestos y clips de las campañas.",
    quien: ["clipero", "agencia"],
    donde: [{ ruta: "/campanas", etiqueta: "Campañas › Refrescar" }],
    pasos: [
      "En la cabecera de Campañas, pulsa «Refrescar».",
      "El icono gira y el listado se atenúa un momento.",
      "Sale «Nada nuevo que traer» y, junto a los filtros, «Consultado a las {hora}».",
    ],
    reglas: [
      "Hoy no pide nada: las campañas viven en el navegador y el aviso lo dice («Presupuestos y clips se actualizarán solos cuando las campañas vivan en el servidor.»). Espera 900 ms fijos.",
      "Cuando haya servidor, aquí irá la llamada que vuelve a traer campañas y envíos, y el aviso volverá a hablar de presupuestos y clips (lo dice el comentario de `refrescar`).",
      "El botón se apaga mientras refresca.",
    ],
    endpoints: ["campanas.listar", "campanas.listar-envios"],
    datos: "Nada: no hay a quién preguntar todavía.",
    respuesta:
      "`toast()` neutro, sin sonido: no ha habido ningún éxito que celebrar. Icono girando y rejilla al 60 % de opacidad mientras dura.",
    origen: ["components/campanas/campaigns-explorer.tsx:211"],
    relacionadas: ["campanas.explorar-campanas"],
  },
  {
    id: "campanas.desbloquear-privada",
    area: "campanas",
    titulo: "Entrar en una campaña privada con su código",
    resumen:
      "Desbloquear una campaña privada con el código que da quien la creó, para verla en Explorar y poder participar.",
    quien: ["clipero", "agencia"],
    donde: [
      { ruta: "/campanas", etiqueta: "Campañas › Código de acceso" },
      { ruta: "/campanas/[id]", etiqueta: "Campaña privada › Código de acceso" },
      { ruta: "/campanas?codigo=LUMN-2026", etiqueta: "Enlace compartido con el código" },
    ],
    pasos: [
      "En Campañas, pulsa «Código de acceso». También sale en la ficha de una privada que aún no has desbloqueado («Campaña privada»).",
      "En «Entrar a una campaña privada», escribe el código en «Código» como quieras: minúsculas, sin guion o con espacios. Al salir del campo se normaliza.",
      "Pulsa «Entrar» (se activa con 4 caracteres o más).",
      "Si es correcto, vas a la ficha de la campaña. Si tu bienvenida está sin terminar, pasas antes por el modo exprés (redes, y país con idiomas) y vuelves a la campaña.",
      "Si llegas con un enlace (`/campanas?codigo=LUMN-2026`), el diálogo se abre solo con el código puesto y la URL se limpia.",
    ],
    reglas: [
      "El código se normaliza: mayúsculas, solo letras y números y, con 8 caracteres, guion en medio (`normalizarCodigo`): «lumn 2026» es «LUMN-2026».",
      "Solo abre privadas: se busca entre las campañas con `privada: true` (`buscarPorCodigo`).",
      "Los códigos que da Clipealo son dos tramos de 4 caracteres de un alfabeto sin 0, O, 1 ni I, para dictarlos por teléfono sin errores (`generarCodigo`).",
      "Desbloquear queda guardado y no se duplica: desde entonces la campaña sale en Explorar, en «Privadas desbloqueadas» (o en «Destacadas», si lo está), siempre que pague en alguna red de tu plan.",
      "El modo exprés salta si el onboarding no está completado (`necesitaExpres`) y lleva a `/bienvenida` con `modo=expres`, `tipo=clipero`, `origen=invitacion` y `next=/campanas/<id>`.",
      "No pide plan: ver una privada es de todos; participar, no.",
    ],
    errores: [
      {
        codigo: "notFound",
        cuando: "El código no corresponde a ninguna campaña privada.",
        frase: "campaigns.accessCode.notFound",
        bloquea: true,
      },
    ],
    endpoints: ["campanas.desbloquear"],
    datos:
      "Los ids desbloqueados, en `desbloqueadas` del almacén `clipealo-campanas-v1`: se pierden al cambiar de navegador.",
    respuesta:
      "Acierto: `toast.celebrate` «Campaña desbloqueada» con el título de la campaña (arpegio y confeti de esquinas de recorte). Fallo: sonido de error, sacudida del campo y el mensaje debajo; sin toast.",
    origen: [
      "components/campanas/access-code-dialog.tsx:57",
      "components/campanas/access-code-dialog.tsx:68",
      "components/campanas/access-code-dialog.tsx:81",
      "lib/campanas.ts:414",
      "lib/campanas.ts:424",
      "lib/campanas.ts:429",
      "lib/invitacion.ts:12",
      "lib/invitacion.ts:22",
      "hooks/use-campanas.ts:468",
    ],
    relacionadas: ["campanas.explorar-campanas", "campanas.ver-campana"],
  },

  /* ----------------------------------------------------------------------
     La ficha
     ---------------------------------------------------------------------- */
  {
    id: "campanas.ver-campana",
    area: "campanas",
    titulo: "Ver una campaña",
    resumen:
      "Abrir la ficha de una campaña: qué pide, cómo paga, cuánto queda, qué derechos concede y qué clips cobran más.",
    quien: ["clipero", "agencia"],
    donde: [{ ruta: "/campanas/[id]", etiqueta: "Ficha de la campaña" }],
    pasos: [
      "Desde una tarjeta, pulsa el título o la flecha ↗ («Ver la campaña {título}»).",
      "Arriba: categoría, estado, título y «{marca} · creada por {autor}» (con «Serie» si la tiene). A la derecha, tu acción con su explicación debajo.",
      "Lee la descripción y los «Requisitos». «Material para los clips» abre el material en otra pestaña; «Solo en» dice las redes.",
      "Baja a «Derechos», «¿Cuánto cobra un clip?» y «Los clips que más cobran».",
      "En la columna derecha: «Presupuesto» con lo consumido y lo que queda, «Pagado», «Clips», «Empieza», «Termina» y las «Reglas de pago».",
    ],
    reglas: [
      "El pago de un video es `mín(vistas ÷ 1.000 × CPM, tope por video, lo que quede)`, y nada si no llega al mínimo de vistas (`pagoPorVideo`). Se reparte entre los envíos aprobados por orden de llegada (`liquidar`): el que llega cuando no queda presupuesto cobra lo que reste, y después nada.",
      "«Reglas de pago»: «CPM» (US$ por 1.000 vistas), «Máximo por video» (importe y %), «Mínimo para cobrar», «Llega al tope con» (⌈tope ÷ CPM × 1.000⌉ vistas, `vistasHastaTope`), «Videos que cobran al tope» (al menos ⌊100 ÷ tope %⌋, `videosAlTope`) y «Vistas que compra» (⌊presupuesto ÷ CPM × 1.000⌋, `vistasCompradas`).",
      "Ejemplo, «Liga de las Estrellas» (US$ 3.600, CPM US$ 0,72, tope 4 %, mínimo 5.000): máximo por video US$ 144; llega al tope con 200.000 vistas; cobran al tope al menos 25 videos; compra 5.000.000 de vistas.",
      "Límites con los que se crean las campañas (`LIMITES`): presupuesto de US$ 100 a US$ 100.000; CPM de US$ 0,10 a US$ 20; tope por video del 1 % al 50 % (un video nunca se lleva más de la mitad); mínimo de vistas de 0 a 100.000, y nunca por encima de las vistas que llevan al tope.",
      "«Los clips que más cobran»: los 10 aprobados que más cobran; «al tope» debajo del importe cuando lo decide el tope; «Tú» marca los tuyos; las vistas sin medir salen «—».",
      "Privada sin desbloquear: «Campaña privada» con el botón «Código de acceso». La pestaña del navegador de una privada dice «Campaña» y nunca su título, esté desbloqueada o no (`page.tsx:17`).",
      "Id desconocido: «No encontramos esta campaña» y «Volver a campañas» (no un 404: las campañas creadas viven en el navegador).",
      "Quien la creó ve además sus solicitudes, cómo cerrarla y «Gestionar tu campaña»: son acciones de agencia.",
    ],
    endpoints: ["campanas.obtener", "campanas.listar-envios"],
    datos: DATOS_ALMACEN,
    respuesta: "Sin sonido: es navegación.",
    origen: [
      "components/campanas/campaign-detail.tsx:61",
      "components/campanas/campaign-detail.tsx:93",
      "components/campanas/campaign-detail.tsx:265",
      "lib/campanas.ts:30",
      "lib/campanas.ts:200",
      "lib/campanas.ts:237",
      "lib/campanas.ts:242",
      "lib/campanas.ts:273",
      "lib/campanas.ts:276",
      "app/[locale]/(app)/campanas/[id]/page.tsx:17",
    ],
    relacionadas: [
      "campanas.simular-pago",
      "campanas.consultar-derechos",
      "campanas.solicitar-entrar",
      "campanas.enviar-clip",
    ],
  },
  {
    id: "campanas.simular-pago",
    area: "campanas",
    titulo: "Calcular cuánto cobra un clip",
    resumen:
      "Mover las vistas de un clip hipotético y ver cuánto cobraría en esta campaña y qué regla lo decide.",
    quien: ["clipero", "agencia"],
    donde: [{ ruta: "/campanas/[id]", etiqueta: "Ficha › ¿Cuánto cobra un clip?" }],
    pasos: [
      "En la ficha, baja a «¿Cuánto cobra un clip?».",
      "Arrastra «Si un clip consigue»: de 1.000 a 5 millones de vistas.",
      "Lee «Cobra», la barra (su ancho entero es el tope por video) y el desglose: «{vistas} vistas × {CPM} / 1.000», «Tope por video ({%} del presupuesto)» y «Pago».",
      "Debajo, la regla que decide el pago y con cuántas vistas se llega al tope.",
    ],
    reglas: [
      "La barra va en escala logarítmica de 1.000 a 5.000.000 de vistas, redondeando a centenas.",
      "Arranca en el 60 % de las vistas que llevan al tope.",
      "Calcula con lo que QUEDA de presupuesto, no con el total: en una campaña casi agotada dice «Cobra lo que queda de presupuesto.».",
      "Una explicación por regla: «Aún no llega al mínimo de vistas: no cobra.», «Cobra todas sus vistas al CPM.», «Ha llegado al tope por video…» y «Cobra lo que queda de presupuesto.».",
      "Si lo que valdrían las vistas pasa del tope, esa cifra sale tachada.",
      "En «Liga de las Estrellas», que en la demo conserva US$ 3.144,41 de sus US$ 3.600: 100.000 vistas cobrarían US$ 72,00; 300.000 valdrían US$ 216,00 y se quedan en US$ 144 (al tope).",
    ],
    endpoints: ["campanas.obtener", "campanas.listar-envios"],
    datos:
      "Nada que guardar: cálculo puro (`pagoPorVideo`) con las reglas de la campaña y el restante de `liquidar`.",
    respuesta:
      'Sin sonido. El importe se anuncia a los lectores de pantalla (`aria-live="polite"`).',
    origen: [
      "components/campanas/payout-calculator.tsx:14",
      "components/campanas/payout-calculator.tsx:28",
      "components/campanas/payout-calculator.tsx:44",
      "components/campanas/payout-calculator.tsx:47",
      "components/campanas/campaign-detail.tsx:235",
    ],
    relacionadas: ["campanas.ver-campana"],
  },
  {
    id: "campanas.consultar-derechos",
    area: "campanas",
    titulo: "Consultar los derechos de una campaña",
    resumen:
      "Saber qué permite la agencia con sus clips —alcance, lista blanca, atribución y condiciones— antes de entrar y mientras se trabaja.",
    quien: ["clipero", "agencia"],
    donde: [
      { ruta: "/campanas/[id]", etiqueta: "Ficha › Derechos" },
      { ruta: "/operaciones/derechos", etiqueta: "Operaciones › Derechos" },
    ],
    pasos: [
      "En la ficha, la tarjeta «Derechos» dice el «Alcance», si hay lista blanca («Con lista blanca» / «Sin lista blanca»), la «Atribución», las «Condiciones» y las redes.",
      "«Ver en Operaciones» lleva a Operaciones › Derechos.",
      "Allí, una tarjeta por campaña con su licencia y la situación de tu lista blanca en «Lista blanca».",
    ],
    reglas: [
      "Alcance «Dentro de la campaña»: mientras esté abierta y con sus reglas; al cerrar, los clips se retiran. «Libre»: puedes dejar los clips publicados y volver a publicarlos después, en las mismas redes.",
      "Sin licencia escrita vale la de por defecto: dentro de la campaña y sin lista blanca (`LICENCIA_POR_DEFECTO`).",
      "Atribución hasta 60 caracteres y condiciones hasta 300 (`LIMITES_LICENCIA`); las escribe la agencia. «Liga de las Estrellas»: «@ligaestrellas» y «Sin música ajena encima; el marcador tiene que verse.».",
      "Situación de la lista blanca (`situacionListaBlanca`): «La agencia no ofrece lista blanca», «Disponible: pídela para una cuenta», «Pedida, a la espera de la agencia», «Activa: tu cuenta está dada de alta» o «Rechazada». Con varias solicitudes manda la activa y luego la pendiente.",
      "Sin campañas: «Todavía no estás en ninguna campaña: la licencia la da cada campaña.» y «Explorar campañas».",
      "Hoy Operaciones › Derechos saca las campañas de todas las participaciones del almacén y no solo de las tuyas (`derechos-panel.tsx:82`): en la demo salen campañas de otros cliperos.",
      "Con perfil de agencia, Operaciones › Derechos enseña en su lugar la cola de solicitudes de sus campañas (acción de agencia).",
    ],
    plan: {
      nota: "Todos los planes: Derechos es una herramienta de Operaciones sin capacidad de plan (`HERRAMIENTA_CAPACIDAD` solo limita recortar, reducir y variantes).",
    },
    endpoints: [
      "campanas.obtener",
      "campanas.listar-participaciones",
      "operaciones.listar-lista-blanca",
    ],
    datos:
      "La licencia va en cada campaña (`Campana.licencia`); las solicitudes, en `solicitudesListaBlanca` del almacén `clipealo-campanas-v1`.",
    respuesta: "Sin sonido: es consulta.",
    origen: [
      "components/campanas/derechos-card.tsx:20",
      "components/app/derechos-panel.tsx:76",
      "components/app/derechos-panel.tsx:82",
      "lib/derechos.ts:26",
      "lib/derechos.ts:40",
      "lib/derechos.ts:48",
      "lib/derechos.ts:163",
      "lib/operaciones.ts:40",
    ],
    relacionadas: [
      "operaciones.consultar-derechos",
      "operaciones.pedir-lista-blanca",
      "campanas.ver-campana",
    ],
  },

  /* ----------------------------------------------------------------------
     Participar: pedir entrar, entregar, retirarse
     ---------------------------------------------------------------------- */
  {
    id: "campanas.solicitar-entrar",
    area: "campanas",
    titulo: "Solicitar entrar en una campaña",
    resumen:
      "Pedir a quien paga que te deje trabajar en su campaña, enseñándole tu ficha de clipero: si te acepta, tienes un plazo para entregar.",
    quien: ["clipero", "agencia"],
    plan: {
      minimo: "creator",
      nota: "Participar en campañas es del plan Creador en adelante (`PLAN_MINIMO.participarCampanas`). Con Prueba el botón sigue diciendo «Solicitar entrar», apagado, con «Participar en campañas es del plan Creador en adelante.» y «Ver los planes». El plan se mira el último: si la campaña ya no admite a nadie, se dice eso y no se vende una mejora que no desbloquearía nada.",
    },
    donde: [
      { ruta: "/campanas", etiqueta: "Tarjeta de campaña" },
      { ruta: "/campanas/[id]", etiqueta: "Ficha de la campaña" },
    ],
    pasos: [
      "En la tarjeta o en la ficha, pulsa «Solicitar entrar».",
      "Si te faltan redes, país o idiomas, el diálogo te los pide antes («Antes de enviar tu primer clip») y sigues con «Guardar y continuar».",
      "Revisa «Esto es lo que verá {marca}»: nombre, país e idiomas, redes con el tramo de seguidores, temas, lo que llevas en Clipealo, experiencia editando y horas por semana.",
      "Escribe, si quieres, una «Nota (opcional)»: qué clips harías, dónde y cuándo (contador «n/280»).",
      "Pulsa «Enviar solicitud». La tarjeta pasa a «Solicitud enviada», con «{marca} está revisando tu solicitud.».",
    ],
    reglas: [
      "Solo en campañas con solicitud (`con-solicitud`, lo que traen por defecto). En una `abierta` no se pide: el botón es «Subir clip» y entregar es entrar.",
      "Lo impiden (`validarSolicitud`): tener ya en ella una participación que no esté retirada ni rechazada (también cuentan una cumplida o una caducada), inscripciones cerradas, campaña vencida, ninguna plaza libre, nota de más de 280 caracteres, sin redes, sin país y el plan. Redes y país se arreglan en el mismo diálogo; lo demás se lista en rojo y apaga «Enviar solicitud».",
      "Plazas: ocupan plaza las participaciones aceptadas, entregadas, cumplidas y en disputa (`plazasLibres`). Una campaña sin `plazas` no tiene límite. «Ámbar: Tra Tra Tra» pone 4 y en la demo le quedan 2 libres.",
      "La agencia ve solo `perfilParaAgencia`: ni correo, ni wallet, ni a qué otras campañas te presentas; de tus redes, el tramo de seguidores y nunca la cifra. Del historial: aprobados de enviados, tasa de aprobación y mediana de vistas de los aprobados medidos.",
      "Si te acepta, corre el plazo de entrega: `plazoEntregaDias` de la campaña (7 por defecto, `PLAZO_ENTREGA_DIAS`), contado desde que acepta y nunca más allá del fin de la campaña (`aceptar`).",
      "Tras un rechazo, la tarjeta dice «No te aceptaron» con el motivo y no ofrece volver a solicitar; tras retirarte, sí.",
      "Quien creó la campaña no puede solicitar en ella: ve «Es tu campaña».",
      "«te avisamos con su decisión» aún no tiene canal: no hay correo ni push (docs/costuras-backend.md:154). La decisión se ve en la tarjeta y en «Mis compromisos».",
      "El spec pide registrar el consentimiento con la finalidad `perfil-a-agencia` (docs/campanas-ciclo-2026-09.md:102); hoy no se registra: esa finalidad no está en `FINALIDADES` (`lib/privacidad.ts:15`).",
    ],
    estados: [
      {
        estado: "solicitada",
        significa: "«Solicitud enviada»: pediste entrar; decide la agencia.",
      },
      {
        estado: "aceptada",
        significa:
          "«Dentro de la campaña»: hay compromiso y corre el plazo para entregar.",
      },
      {
        estado: "entregada",
        significa:
          "«Entregado, en revisión»: entregaste tu clip; le toca revisarlo a quien paga.",
      },
      {
        estado: "cumplida",
        significa: "«Cumplido»: clip aprobado; ya cobra por sus vistas.",
      },
      {
        estado: "rechazada",
        significa:
          "«No te aceptaron», con su motivo: no encajabas con el público, con el tema, sin historial suficiente, plazas llenas, inscripciones cerradas u otro.",
      },
      {
        estado: "retirada",
        significa: "«Te retiraste»: te bajaste a tiempo y la plaza quedó libre.",
      },
      {
        estado: "caducada",
        significa:
          "«Plazo vencido»: pasó `venceEn` sin entrega. Lo decide el reloj, sin que nadie la toque; la plaza queda libre.",
      },
      {
        estado: "en-disputa",
        significa: "«En reclamación»: alguien reclamó; decide el equipo de Clipealo.",
      },
    ],
    errores: [
      {
        codigo: "yaDentro",
        cuando:
          "Ya tienes en esta campaña una participación que no está retirada ni rechazada (`participacionDe`).",
        frase: "campaigns.participation.errors.yaDentro",
        bloquea: true,
      },
      {
        codigo: "inscripcionesCerradas",
        cuando: "La agencia cerró las inscripciones.",
        frase: "campaigns.participation.errors.inscripcionesCerradas",
        bloquea: true,
      },
      {
        codigo: "campanaVencida",
        cuando: "Pasó la fecha de fin.",
        frase: "campaigns.participation.errors.campanaVencida",
        bloquea: true,
      },
      {
        codigo: "sinPlazas",
        cuando: "No queda ninguna plaza libre.",
        frase: "campaigns.participation.errors.sinPlazas",
        bloquea: true,
      },
      {
        codigo: "notaLarga",
        cuando: "La nota pasa de 280 caracteres (el campo ya no deja escribir más).",
        frase: "campaigns.participation.errors.notaLarga",
        bloquea: true,
      },
      {
        codigo: "sinRedes",
        cuando: "No has dicho dónde publicas: se pide en el mismo diálogo.",
        frase: "campaigns.participation.errors.sinRedes",
        bloquea: true,
      },
      {
        codigo: "sinPais",
        cuando: "No has dicho tu país: se pide en el mismo diálogo.",
        frase: "campaigns.participation.errors.sinPais",
        bloquea: true,
      },
      {
        codigo: "planInsuficiente",
        cuando:
          "Tu plan no incluye participar en campañas: Prueba, o un plan del backoffice sin la capacidad `participarCampanas`. Con ese plan «Solicitar entrar» ya sale apagado, así que en el diálogo solo aparece si el plan cambia con el diálogo abierto.",
        frase: "campaigns.participation.errors.planInsuficiente",
        bloquea: true,
      },
    ],
    endpoints: ["campanas.crear-participacion", "campanas.listar-participaciones"],
    datos:
      "Una `Participacion` nueva en `participaciones` del almacén `clipealo-campanas-v1`, con `solicitadaEn` = el «hoy» de la demo (`HOY_CAMPANAS`) para que el plazo prometido no salga inflado.",
    respuesta:
      '«Enviar solicitud» es `variant="brand"`: suena «pop» y se encuadra con la marca de recorte. Después, `toast.success` «Solicitud enviada» («{marca} la revisa y te avisamos con su decisión.») con su «ding». En la ficha, «Solicitar entrar» también es `brand` y suena al abrir el diálogo.',
    origen: [
      "components/campanas/solicitar-dialog.tsx:141",
      "components/campanas/solicitar-dialog.tsx:172",
      "components/campanas/solicitar-dialog.tsx:412",
      "components/campanas/solicitar-dialog.tsx:429",
      "components/campanas/solicitar-dialog.tsx:446",
      "lib/participacion.ts:44",
      "lib/participacion.ts:50",
      "lib/participacion.ts:225",
      "lib/participacion.ts:287",
      "lib/participacion.ts:343",
      "lib/participacion.ts:608",
      "lib/pricing.ts:77",
      "lib/privacidad.ts:15",
      "hooks/use-campanas.ts:478",
    ],
    relacionadas: [
      "campanas.cancelar-solicitud",
      "campanas.enviar-clip",
      "campanas.ver-compromisos",
    ],
  },
  {
    id: "campanas.cancelar-solicitud",
    area: "campanas",
    titulo: "Cancelar una solicitud",
    resumen: "Retirar una solicitud que la agencia aún no ha decidido.",
    quien: ["clipero", "agencia"],
    donde: [
      {
        ruta: "/campanas?vista=participando",
        etiqueta: "Campañas › Participando › Mis compromisos",
      },
    ],
    pasos: [
      "En «Participando», busca la campaña en «Mis compromisos» › «Activos» (con la etiqueta «Solicitud enviada»).",
      "Pulsa «Cancelar solicitud».",
      "Confirma en «¿Cancelar tu solicitud a «{título}»?» con «Sí, cancelarla», o vuelve con «Dejarlo como está».",
    ],
    reglas: [
      "Solo mientras está `solicitada`.",
      "Quien paga deja de verla, y puedes volver a solicitar mientras las inscripciones sigan abiertas.",
      "Es la misma transición que retirarse (`retirar`): queda `retirada`, con la fecha de la decisión.",
    ],
    endpoints: ["campanas.retirar-participacion"],
    datos:
      "Parche de la participación en `cambiosParticipacion` del almacén `clipealo-campanas-v1`.",
    respuesta:
      "`toast()` neutro «Solicitud cancelada» («Retiramos tu solicitud a «{título}».»), sin sonido: no es un logro ni un fallo.",
    origen: [
      "components/campanas/mis-compromisos.tsx:153",
      "components/campanas/mis-compromisos.tsx:167",
      "components/campanas/mis-compromisos.tsx:271",
      "lib/participacion.ts:417",
      "hooks/use-campanas.ts:517",
    ],
    relacionadas: ["campanas.solicitar-entrar", "campanas.ver-compromisos"],
  },
  {
    id: "campanas.enviar-clip",
    area: "campanas",
    titulo: "Enviar un clip a una campaña",
    resumen:
      "Entregar un clip publicado para que quien paga lo revise y, si cumple, cobre por sus vistas.",
    quien: ["clipero", "agencia"],
    plan: {
      minimo: "creator",
      nota: "Sin compromiso aceptado hace falta Creador: en una campaña abierta entregar es entrar y el plan la apaga igual («Subir clip» apagado con «Participar en campañas es del plan Creador en adelante.»). Con un compromiso aceptado se entrega aunque el plan haya bajado: el plazo lo dio la agencia y el plan es un contrato con Clipealo.",
    },
    donde: [
      { ruta: "/campanas", etiqueta: "Tarjeta de campaña › Subir clip" },
      { ruta: "/campanas/[id]", etiqueta: "Ficha de la campaña › Subir clip" },
      {
        ruta: "/campanas?vista=participando",
        etiqueta: "Mis compromisos › Entregar mi clip (lleva a la ficha)",
      },
    ],
    pasos: [
      "Pulsa «Subir clip» en la tarjeta o en la ficha. Desde «Mis compromisos», «Entregar mi clip» te lleva a la ficha. Con compromiso, debajo: «Te quedan N días para entregar, hasta el {fecha}.» o «Hoy es el último día para entregar».",
      "Si te faltan redes, país o idiomas, se piden antes («Antes de enviar tu primer clip» › «Guardar y continuar»).",
      "En «Clip», elige una de tus publicaciones en las redes de la campaña (sus vistas se leerán solas) o «Pegar un enlace de otro clip».",
      "Si pegas un enlace: rellena «Enlace» y elige la «Red» (solo las de la campaña).",
      "Con una publicación elegida, lee el estimado: «Con sus vistas de hoy cobraría US$ X», o que ya está al tope, o cuántas vistas le faltan para cobrar.",
      "Marca «Mi clip cumple los requisitos de la campaña» (sale con la lista de requisitos).",
      "Pulsa «Enviar clip».",
    ],
    reglas: [
      "Se entrega con un compromiso aceptado en plazo o en una campaña `abierta` (`puedeEntregar`), y si la campaña admite clips (`aceptaEnvios`): activa, o con inscripciones cerradas si ya estabas dentro. Pausada, agotada, vencida o finalizada no admiten clips de nadie.",
      "Solo las redes de la campaña: la lista de publicaciones ya viene filtrada por `campana.redes`.",
      "Un enlace vale si empieza por http(s) y tiene dominio (`^https?://\\S+\\.\\S+`).",
      "Si la campaña tiene requisitos, confirmar que se cumplen es obligatorio.",
      "De un enlace ajeno nadie lee las vistas: entra en revisión pero no suma al CPM. Una publicación de Clipealo ya indexada entra con sus vistas del índice (`INDEXADO_EN`); una publicada después del índice entra sin cifra, a la espera de su primera lectura, y no con cero.",
      "El estimado usa lo que queda de presupuesto, no el total.",
      "Un clip repetido en la misma campaña se reconoce por su publicación o, si vino por enlace, por la URL (`use-campanas.ts:326`). Dos fallos hoy: el repetido se descarta en silencio y el aviso de éxito sale igual; y solo se compara con los envíos hechos en este navegador, no con los de la semilla, así que «La regla de las tres reuniones» (`age_s8`), que la semilla ya tiene enviada a «Liga de las Estrellas», puede volver a entrar.",
      "Entregar cierra tu parte del compromiso (`compromisoAlEntregar`): de `aceptada` pasa a `entregada` con el clip; en una campaña abierta sin compromiso, nace uno ya `entregada`.",
      "Después decide la agencia: si lo aprueba, el clip cobra y el compromiso queda «Cumplido»; si lo rechaza, con motivo, el compromiso vuelve a `aceptada` y, si queda plazo, puedes entregar otro.",
      "La hora del envío es la real (`enviadoEn`) y decide el orden de reparto: `liquidar` paga por orden de llegada.",
      "El diálogo puede traer una micropregunta en línea, que se salta con «Ahora no».",
    ],
    estados: [
      {
        estado: "en-revision",
        significa: "«En revisión»: la agencia comprueba que cumple los requisitos.",
      },
      {
        estado: "aprobado",
        significa: "«Aprobado»: cobra por sus vistas según `liquidar`.",
      },
      {
        estado: "rechazado",
        significa: "«Rechazado»: no cobra; el motivo sale debajo del estado.",
      },
    ],
    errores: [
      {
        codigo: "linkError",
        cuando: "El enlace pegado no es un enlace público.",
        frase: "campaigns.submit.linkError",
        bloquea: true,
      },
      {
        codigo: "confirmError",
        cuando: "No se marcó que el clip cumple los requisitos.",
        frase: "campaigns.submit.confirmError",
        bloquea: true,
      },
      {
        codigo: "plan",
        cuando: "Sin compromiso aceptado y con el plan Prueba: el botón sale apagado.",
        frase: "campaigns.participation.blocked.plan",
        bloquea: true,
      },
      {
        codigo: "cerrada",
        cuando:
          "Inscripciones cerradas y no estás dentro: en una campaña abierta, entregar es entrar. Quien ya tiene un compromiso aceptado sigue entregando.",
        frase: "campaigns.participation.blocked.cerrada",
        bloquea: true,
      },
      {
        codigo: "pausada",
        cuando: "La campaña está pausada: el botón dice «No acepta clips».",
        frase: "campaigns.participation.blocked.pausada",
        bloquea: true,
      },
      {
        codigo: "agotada",
        cuando: "Se repartió todo el presupuesto.",
        frase: "campaigns.participation.blocked.agotada",
        bloquea: true,
      },
      {
        codigo: "vencida",
        cuando: "Pasó la fecha de fin.",
        frase: "campaigns.participation.blocked.vencida",
        bloquea: true,
      },
      {
        codigo: "finalizada",
        cuando: "La campaña ya se cerró.",
        frase: "campaigns.participation.blocked.finalizada",
        bloquea: true,
      },
    ],
    endpoints: ["campanas.crear-envio", "campanas.listar-participaciones"],
    datos:
      "Un `Envio` nuevo en `envios` del almacén `clipealo-campanas-v1`; el compromiso se parchea (`cambiosParticipacion`) o se añade (`participaciones`). Las publicaciones elegibles salen de las semillas indexadas y de lo publicado desde Clipealo (`clipealo-agenda-v1`).",
    respuesta:
      '«Enviar clip» es `variant="brand"`: «pop» y marca de recorte al pulsar. Después, `toast.success` «Clip enviado a revisión» («{marca} lo revisa y, si cumple, empieza a cobrar por sus vistas.»).',
    origen: [
      "components/campanas/submit-clip-dialog.tsx:101",
      "components/campanas/submit-clip-dialog.tsx:121",
      "components/campanas/submit-clip-dialog.tsx:124",
      "components/campanas/submit-clip-dialog.tsx:128",
      "components/campanas/submit-clip-dialog.tsx:155",
      "components/campanas/solicitar-dialog.tsx:151",
      "components/campanas/solicitar-dialog.tsx:174",
      "lib/campanas.ts:383",
      "lib/participacion.ts:254",
      "lib/participacion.ts:386",
      "hooks/use-campanas.ts:322",
      "hooks/use-campanas.ts:326",
      "hooks/use-campanas.ts:367",
    ],
    relacionadas: [
      "campanas.solicitar-entrar",
      "campanas.ver-envios",
      "campanas.actualizar-vistas",
    ],
  },
  {
    id: "campanas.retirarse-campana",
    area: "campanas",
    titulo: "Retirarse de una campaña",
    resumen:
      "Bajarse de un compromiso aceptado antes de entregar, sin penalización y liberando la plaza.",
    quien: ["clipero", "agencia"],
    donde: [
      {
        ruta: "/campanas?vista=participando",
        etiqueta: "Campañas › Participando › Mis compromisos",
      },
    ],
    pasos: [
      "En «Mis compromisos» › «Activos», busca la campaña («Dentro de la campaña»).",
      "Pulsa «Retirarme».",
      "Confirma en «¿Retirarte de «{título}»?» con «Sí, retirarme», o vuelve con «Dejarlo como está».",
    ],
    reglas: [
      "Solo con el compromiso aceptado y el plazo por delante. Entregado ya no: tu clip está en revisión.",
      "Sin penalización: la plaza queda libre al momento.",
      "Puedes volver a solicitar entrar mientras la campaña admita gente.",
    ],
    endpoints: ["campanas.retirar-participacion"],
    datos:
      "Parche de la participación en `cambiosParticipacion` del almacén `clipealo-campanas-v1`.",
    respuesta:
      "`toast()` neutro «Ya no estás en la campaña» («Tu plaza en «{título}» vuelve a estar libre.»), sin sonido.",
    origen: [
      "components/campanas/mis-compromisos.tsx:153",
      "components/campanas/mis-compromisos.tsx:271",
      "lib/participacion.ts:417",
      "hooks/use-campanas.ts:517",
    ],
    relacionadas: ["campanas.ver-compromisos", "campanas.cancelar-solicitud"],
  },

  /* ----------------------------------------------------------------------
     Participando: compromisos, envíos y vistas
     ---------------------------------------------------------------------- */
  {
    id: "campanas.ver-compromisos",
    area: "campanas",
    titulo: "Seguir mis compromisos",
    resumen:
      "Ver lo solicitado y lo aceptado, cada uno con su cuenta atrás, y lo que ya se cerró.",
    quien: ["clipero", "agencia"],
    donde: [
      {
        ruta: "/campanas?vista=participando",
        etiqueta: "Campañas › Participando › Mis compromisos",
      },
    ],
    pasos: [
      "En Campañas, abre «Participando»: arriba está «Mis compromisos».",
      "Elige «Activos» o «Historial»; cada pestaña lleva su número.",
      "En cada tarjeta: el estado, la campaña, «Solicitado el {fecha}» y, si hay plazo, «Te quedan N días», «Último día para entregar» o «El plazo venció hace N días», con «Hasta el {fecha}».",
      "Debajo, lo que toca: «Entregar mi clip» o «Ver campaña», «Cancelar solicitud» o «Retirarme», y «Reclamar».",
    ],
    reglas: [
      "«Activos»: solicitada, aceptada, entregada y en disputa, en ese orden de urgencia (aceptada, en disputa, entregada, solicitada) y, dentro, por los días que quedan.",
      "«Historial»: cumplida, rechazada, retirada y caducada, de la más reciente a la más antigua (por fecha de decisión o, sin ella, de solicitud).",
      "Una aceptada con el plazo pasado se lee «Plazo vencido» sin que nadie la toque (`estadoParticipacion`).",
      "En rojo solo el último día y lo vencido; la urgencia va también escrita.",
      "«Entregar mi clip» solo con el compromiso aceptado y en plazo; «Reclamar», solo si hay algún motivo posible ahora (`disputasPosibles`), también en «Historial» (una solicitud rechazada se puede reclamar).",
      "«Entregar mi clip» mira el compromiso, no el estado de la campaña: con la campaña pausada o agotada sale igual y lleva a una ficha que dice «No acepta clips».",
      "«Retirarme» sale con el compromiso aceptado en plazo y «Cancelar solicitud» con la solicitud pendiente; en los demás estados no hay salida.",
      "La pestaña vive en la URL (`?compromisos=activos` o `historial`).",
      "Los días se cuentan contra el «hoy» de la demo (`HOY_CAMPANAS`), igual en servidor y navegador. En la demo, Ana está dentro de «Liga de las Estrellas» con 6 días por delante.",
    ],
    endpoints: [
      "campanas.listar-participaciones",
      "campanas.listar",
      "campanas.listar-envios",
    ],
    datos: DATOS_ALMACEN,
    respuesta: "Sin sonido: es consulta.",
    origen: [
      "components/campanas/mis-compromisos.tsx:43",
      "components/campanas/mis-compromisos.tsx:51",
      "components/campanas/mis-compromisos.tsx:99",
      "components/campanas/mis-compromisos.tsx:202",
      "components/campanas/mis-compromisos.tsx:258",
      "lib/participacion.ts:178",
    ],
    relacionadas: [
      "campanas.enviar-clip",
      "campanas.retirarse-campana",
      "campanas.cancelar-solicitud",
      "campanas.abrir-reclamacion",
    ],
  },
  {
    id: "campanas.ver-envios",
    area: "campanas",
    titulo: "Ver mis clips enviados y lo que cobran",
    resumen:
      "Seguir cada clip entregado a una campaña: sus vistas, su estado y lo que cobra.",
    quien: ["clipero", "agencia"],
    donde: [
      {
        ruta: "/campanas?vista=participando",
        etiqueta: "Campañas › Participando › Tus clips enviados",
      },
    ],
    pasos: [
      "En «Participando», debajo de los compromisos: «Cobrado», «En revisión» y «Campañas».",
      "En «Tus clips enviados», la tabla: «Clip» (con la red y «publicado desde Clipealo» o «enlace pegado»), «Campaña», «Vistas», «Estado», «Cobras» y «Enviado».",
      "El título lleva a la ficha del clip en su proyecto (`/proyectos/[id]/clips/[clipId]`) cuando el envío guarda su clip y su proyecto; la campaña, a su ficha.",
    ],
    reglas: [
      "«Cobrado» suma lo que cobran tus clips aprobados según `liquidar`.",
      "La tabla va del envío más reciente al más antiguo (`enviadoEn`).",
      "«Vistas»: la cifra si hay lectura; si no, «—», y al pasar el ratón dice «Publicado desde Clipealo; todavía sin primera lectura.» o «Clipealo no lee las vistas de un enlace ajeno.».",
      "Debajo de «Cobras», la regla que lo limita: «Al tope por video», «Bajo el mínimo» o «Último presupuesto», cada una con su (i).",
      "Un rechazo enseña su motivo debajo del estado.",
      "Ejemplo de la demo: «El cartón que nadie esperaba» (Serie Bingo Monstruos, 412.400 vistas) cobra US$ 80,00 «Al tope por video»: el 5 % de US$ 1.600.",
      "Sin envíos: «Aún no has enviado clips a ninguna campaña» y «Explorar campañas».",
    ],
    estados: [
      { estado: "en-revision", significa: "«En revisión»." },
      { estado: "aprobado", significa: "«Aprobado»: cobra." },
      { estado: "rechazado", significa: "«Rechazado», con su motivo." },
    ],
    endpoints: ["campanas.listar-envios", "campanas.listar"],
    datos: DATOS_ALMACEN,
    respuesta: "Sin sonido: es consulta.",
    origen: [
      "components/campanas/my-submissions.tsx:69",
      "components/campanas/my-submissions.tsx:106",
      "components/campanas/my-submissions.tsx:203",
      "components/campanas/my-submissions.tsx:262",
      "lib/campanas.ts:246",
      "lib/campanas.ts:257",
    ],
    relacionadas: ["campanas.actualizar-vistas", "campanas.enviar-clip"],
  },
  {
    id: "campanas.actualizar-vistas",
    area: "campanas",
    titulo: "Actualizar las vistas de mis clips",
    resumen:
      "Volver a leer las vistas de los clips publicados desde Clipealo mientras su campaña siga viva, para que cobren por lo que llevan.",
    quien: ["clipero", "agencia"],
    donde: [
      {
        ruta: "/campanas?vista=participando",
        etiqueta: "Participando › Tus clips enviados › Actualizar vistas",
      },
    ],
    pasos: [
      "En «Tus clips enviados», pulsa «Actualizar vistas» (solo sale si hay algo que releer).",
      "Mientras lee, el botón se apaga y enseña un spinner en lugar del icono.",
      "Sale «Vistas actualizadas de N clips» y la tabla recalcula lo que cobra cada uno.",
    ],
    reglas: [
      "Se releen solo los clips publicados desde Clipealo (`medible`: con `publicacionId`) cuya campaña no esté finalizada, vencida ni agotada: entonces la última lectura es la que cuenta (`vistasCongeladas`). Pausada o con inscripciones cerradas se sigue leyendo.",
      "Cada lectura guarda las vistas y cuándo se leyeron.",
      "Lee con `leerVistas` → `leerMetricas`: con servidor es `POST /analiticas/metricas` con `{ ids, hasta }`; sin él, la curva determinista de `lib/analytics.ts`.",
      "Pide el instante «ahora», y como poco una hora después del índice de la demo, para que actualizar traiga algo.",
      "El aviso cuenta los clips que se intentaron releer, no los que cambiaron.",
      "Con servidor, un fallo de la lectura no se captura (`my-submissions.tsx:94`): el botón se quedaría girando y sin aviso. Falta un `toast.error` con `common.errors.<codigo>`.",
    ],
    endpoints: ["analiticas.leer-metricas", "campanas.leer-vistas-envio"],
    datos:
      "La lectura se escribe en `cambiosEnvio` del almacén `clipealo-campanas-v1` (`anotarVistas`).",
    respuesta:
      "Spinner en el botón mientras lee; después, `toast.success` «Vistas actualizadas de N clips» con su «ding».",
    origen: [
      "components/campanas/my-submissions.tsx:60",
      "components/campanas/my-submissions.tsx:89",
      "components/campanas/my-submissions.tsx:94",
      "components/campanas/my-submissions.tsx:103",
      "lib/campanas.ts:269",
      "lib/api/analiticas.ts:33",
      "lib/api/analiticas.ts:49",
      "hooks/use-campanas.ts:357",
    ],
    relacionadas: ["campanas.ver-envios"],
  },

  /* ----------------------------------------------------------------------
     Reclamar
     ---------------------------------------------------------------------- */
  {
    id: "campanas.abrir-reclamacion",
    area: "campanas",
    titulo: "Reclamar sobre un compromiso",
    resumen:
      "Abrir una disputa cuando la agencia no revisa, rechaza sin motivo o no paga: desde ahí decide el equipo de Clipealo.",
    quien: ["clipero", "agencia"],
    donde: [
      {
        ruta: "/campanas?vista=participando",
        etiqueta: "Mis compromisos › Reclamar",
      },
    ],
    pasos: [
      "En «Mis compromisos», pulsa «Reclamar» en la tarjeta (solo sale si hay algo que reclamar).",
      "En «Abrir una reclamación», elige en «¿Qué ha pasado?»: «No revisan mi clip», «Me rechazaron sin motivo» o «Aprobado y sin cobrar». Solo salen los posibles ahora.",
      "Si quieres, escríbelo en «Cuéntalo con tus palabras (opcional)», hasta 280 caracteres.",
      "Lee «Lo revisa el equipo de Clipealo» y pulsa «Enviar reclamación», o «Cancelar».",
    ],
    reglas: [
      "«No revisan mi clip»: con el clip entregado y, o sin plazo, o 3 días desde el fin del plazo o desde la solicitud (`DIAS_SIN_REVISAR` = 3; el código los llama hábiles pero cuenta días naturales). No se guarda cuándo se entregó: `sinRevisarDesde` cuenta desde `solicitadaEn`, así que un compromiso pedido hace 3 días o más se puede reclamar nada más entregar.",
      "«Me rechazaron sin motivo»: con la solicitud rechazada.",
      "«Aprobado y sin cobrar»: con tu clip aprobado.",
      "Una abierta a la vez por compromiso: con `disputaId`, `disputasPosibles` no devuelve motivos y «Reclamar» no sale. El laudo quita `disputaId`, y entonces se podría reclamar otra vez si hay motivo.",
      'Quien reclama desde «Mis compromisos» lo hace como clipero (`abrePor: "clipero"`), también con perfil de agencia: una agencia también clipea. Reclamar como agencia sobre su campaña es una acción de «agencias».',
      "Al enviarla, el compromiso pasa a «En reclamación»: bloquea el cierre de la campaña y solo el laudo del admin lo desbloquea.",
      "El admin decide entre liberar la plaza, dar una prórroga (7 días por defecto), pagar al clipero (solo si hay clip entregado: lo aprueba y entra en el reparto) o sin pago (el clip queda rechazado).",
      "El aviso dice que «el dinero en juego queda reservado»; `liquidar` hoy no reserva nada: reparte solo entre envíos aprobados.",
      "El aviso dice también «Lo que se decida lo ven las dos partes» y el toast «Te avisamos con el resultado»: hoy ninguna pantalla del clipero enseña el laudo ni la `notaAdmin` (solo el estado en que queda el compromiso) y no hay correo ni push (docs/costuras-backend.md:154).",
    ],
    estados: [
      { estado: "abierta", significa: "Recién abierta: espera al admin." },
      {
        estado: "en-revision",
        significa:
          "Está en el tipo (`ESTADOS_DISPUTA`), pero hoy nada lo escribe: la disputa pasa de «abierta» a «resuelta» con el laudo.",
      },
      {
        estado: "resuelta",
        significa: "Hay laudo, con una nota del admin (`notaAdmin`).",
      },
    ],
    errores: [
      {
        codigo: "abierta",
        cuando:
          "Ya hay una reclamación abierta sobre el compromiso. Es el texto del diálogo si se abre igual; desde «Mis compromisos» no llega a verse, porque «Reclamar» no sale.",
        frase: "compromisos.disputa.abierta",
        bloquea: true,
      },
      {
        codigo: "none",
        cuando:
          "Ningún motivo es posible ahora mismo. Igual que el anterior: el diálogo lo dice, pero «Reclamar» ya no sale sin motivos.",
        frase: "compromisos.disputa.none",
        bloquea: true,
      },
    ],
    endpoints: ["campanas.crear-disputa"],
    datos:
      "Una `Disputa` nueva en `disputas` y la participación parcheada en `cambiosParticipacion` del almacén `clipealo-campanas-v1`, fechadas con `HOY_CAMPANAS`. El admin la ve en /admin/disputas del mismo navegador.",
    respuesta:
      "Elegir un motivo hace «tap» (opción de un grupo). «Enviar reclamación» no es `brand` y no suena al pulsar; después, `toast.success` «Reclamación enviada» («El equipo de Clipealo la revisa y decide. Te avisamos con el resultado.»).",
    origen: [
      "components/campanas/mis-compromisos.tsx:134",
      "components/campanas/mis-compromisos.tsx:272",
      "components/campanas/disputa-dialog.tsx:111",
      "components/campanas/disputa-dialog.tsx:144",
      "lib/participacion.ts:47",
      "lib/participacion.ts:84",
      "lib/participacion.ts:436",
      "lib/participacion.ts:462",
      "lib/participacion.ts:467",
      "lib/participacion.ts:509",
      "hooks/use-campanas.ts:550",
    ],
    relacionadas: [
      "campanas.ver-compromisos",
      "agencias.reclamar-compromiso",
      "backoffice.dictar-laudo",
    ],
  },
]
