import type { Accion } from "@/lib/wiki/tipos"

/**
 * Acciones de «planes»: ver y comparar los planes, elegir uno, la suscripción
 * en Ajustes › Plan y facturación, el medidor de minutos y los candados que
 * pone cada escalón.
 *
 * Lo que se hace con el catálogo desde /admin/planes (crear, editar, ordenar,
 * apagar planes) es del backoffice. Las acciones que un candado apaga
 * (programar, encargar una operación, entrar en una campaña…) son de su área:
 * aquí está qué escalón pide cada una y cómo se llega a los planes desde ahí.
 */

const FACTURACION = {
  ruta: "/ajustes?seccion=facturacion",
  etiqueta: "Ajustes › Plan y facturación",
}

const PRECIOS = { ruta: "/precios", etiqueta: "Precios" }
const PRECIOS_LANDING = { ruta: "/#precios", etiqueta: "Portada › Precios" }

const SOLO_DE_PAGO =
  "Solo con un plan de pago (precio mensual mayor que 0). En Prueba (o cualquier plan a 0 US$) la tarjeta no enseña renovación, paso a anual, cancelación ni método de pago, y el botón no sale (components/app/billing-settings.tsx:69)."

export const ACCIONES: Accion[] = [
  {
    id: "planes.ver-precios",
    area: "planes",
    titulo: "Ver los planes y sus precios",
    resumen:
      "Comparar Prueba, Creador y Empresa —y los planes creados que estén a la vista— antes de elegir.",
    quien: ["visitante", "clipero", "agencia"],
    donde: [PRECIOS, PRECIOS_LANDING],
    pasos: [
      "Entra en «Precios» desde la cabecera de la web (/precios) o baja hasta la sección «Precios» de la portada.",
      "Cada plan visible es una tarjeta con su nombre, su lema, el precio al mes y los puntos de su escalón («600 minutos de video al mes», «Sin marca de agua»…). La destacada lleva «El más elegido».",
      "En /precios siguen «Todo, en detalle.» (la comparativa), «Las redes de cada plan.» y «Preguntas sobre el pago.»: crédito, quedarse sin créditos, cambiar de plan, anual, cancelar y reembolsos, moneda e impuestos, asientos y qué pasa al cancelar.",
      "Desde la portada, «Ver la comparativa completa y las redes de cada plan» lleva a /precios.",
    ],
    reglas: [
      "Precios de fábrica en US$ (`MONEDA`): Prueba 0; Creador 29 al mes o 14,50 con facturación anual; Empresa 39 o 19,50, más 15 al mes por cada miembro adicional (`PLANS`, lib/pricing.ts:176).",
      "Salen solo los planes activos y visibles del catálogo, en su orden (`planesVisibles`, lib/planes.ts:487). Con tres o menos van en una fila; con más, dos por fila y cuatro en pantallas anchas.",
      "El precio se escribe con la moneda del idioma: «14,50 US$» en español y «US$14.50» en inglés (`pricing.price`, components/planes/precio.tsx:12).",
      "La página abre con facturación anual: el interruptor empieza encendido (components/marketing/pricing-page.tsx:19).",
      "Los puntos de cada tarjeta son los de su escalón; la cifra de minutos, la del propio plan (`puntosDe`, lib/planes.ts:509).",
      "Como mucho un plan destacado en el catálogo, y su botón es la única acción naranja de la página.",
      "Un crédito es un minuto de video subido: los clips, las exportaciones y las publicaciones no consumen (pricing.faq.credit). Sin permanencia (marketing.pricingPage.lead).",
    ],
    endpoints: ["planes.listar"],
    datos:
      "Catálogo del navegador: semillas de lib/pricing.ts más los cambios del backoffice en `clipealo-planes-v1` (hooks/use-catalogo-planes.ts). Los textos de los tres de fábrica viven en messages/<idioma>/pricing.json; los de un plan creado, en el propio plan.",
    respuesta:
      "Sin sonido ni aviso: es lectura. En la portada, el encabezado y cada tarjeta entran la primera vez que llegan a la pantalla (grupos de movimiento); en /precios no hay entrada y todo se ve terminado desde el primer fotograma (components/marketing/pricing.tsx:29).",
    origen: [
      "components/marketing/pricing-page.tsx:17",
      "components/marketing/pricing.tsx:107",
      "lib/pricing.ts:176",
      "lib/planes.ts:487",
      "app/[locale]/(marketing)/precios/page.tsx:28",
      "lib/site.ts:32",
    ],
    relacionadas: [
      "planes.alternar-ciclo",
      "planes.comparar-prestaciones",
      "planes.consultar-redes-por-plan",
      "planes.elegir-plan",
    ],
  },
  {
    id: "planes.alternar-ciclo",
    area: "planes",
    titulo: "Ver el precio mensual o el anual",
    resumen:
      "Pasar todas las tarjetas —y en /precios la cabecera de la comparativa— del precio mensual al anual y al revés.",
    quien: ["visitante", "clipero", "agencia"],
    donde: [PRECIOS, PRECIOS_LANDING],
    pasos: [
      "Encima de las tarjetas están «Mensual», un interruptor (su nombre para lector de pantalla es «Facturación anual») y «Anual» con el ahorro «−50 %».",
      "Enciéndelo o apágalo: el precio de cada tarjeta cambia al momento.",
      "En anual, la tarjeta de Creador dice «14,50 US$ / mes» y «facturado anualmente (174 US$ al año) · antes 29 US$» con el precio viejo tachado; en mensual, «29 US$ / mes» y «o 14,50 US$ al mes con facturación anual».",
    ],
    reglas: [
      "El descuento anual es del 50 % (`DESCUENTO_ANUAL_PCT`, lib/pricing.ts:22): el badge se escribe desde esa cifra.",
      "El total anual es el precio anual al mes por 12: 174 US$ en Creador y 234 US$ en Empresa (components/marketing/pricing.tsx:221).",
      "En /precios un solo interruptor mueve a la vez las tarjetas y la cabecera de la comparativa.",
      "Prueba vale 0 en los dos ciclos: su precio no cambia y dice «para siempre».",
      "Es solo vista: no toca ninguna suscripción y no se recuerda al salir de la página. Pasar a anual una suscripción se hace en Facturación.",
    ],
    endpoints: ["planes.listar"],
    datos:
      "Estado de la página (`React.useState`, empieza en anual); los precios, del catálogo.",
    respuesta:
      "El interruptor suena al encenderse («toggle-on») y al apagarse («toggle-off»), como todo interruptor (components/shared/interaction-feedback.tsx:35). El precio rueda solo si cambia de verdad (Prueba vale 0 en los dos ciclos) y al pasar a anual el badge «−50 %» destella: es luz, así que se ve igual con «Reducir movimiento». Sin aviso. La comparativa no rueda sus cifras.",
    origen: [
      "components/marketing/pricing.tsx:54",
      "components/marketing/pricing.tsx:86",
      "components/marketing/pricing.tsx:170",
      "components/marketing/pricing.tsx:219",
      "components/marketing/pricing-page.tsx:19",
      "lib/pricing.ts:22",
    ],
    relacionadas: ["planes.ver-precios", "planes.pasar-a-anual"],
  },
  {
    id: "planes.comparar-prestaciones",
    area: "planes",
    titulo: "Comparar lo que incluye cada plan",
    resumen:
      "Leer, fila a fila, qué da cada plan: créditos, IA, exportación, publicación, ganar, equipo, marca y API.",
    quien: ["visitante", "clipero", "agencia"],
    donde: [{ ruta: "/precios#comparativa", etiqueta: "Precios › Todo, en detalle." }],
    pasos: [
      "En /precios, baja a «Todo, en detalle.».",
      "Hay una columna por plan visible con su nombre, el precio del ciclo elegido y su botón; la del destacado lleva «Más elegido» y va teñida. La primera columna («Prestación») queda fija al deslizar la tabla en el móvil.",
      "Las filas van en grupos. ✓ es incluido y — no incluido (con el texto para lector de pantalla); lo demás es una cifra o un texto: «Solo TikTok», «Ilimitados», «15 US$ al mes por asiento».",
    ],
    reglas: [
      "Minutos al mes: 60 · 600 · 600, «ampliables» en Empresa (`MINUTOS_INCLUIDOS`, lib/pricing.ts:159). La cifra la pone cada plan.",
      "Por video: hasta 60 min y 1 GB en Prueba, 600 min y 30 GB en Creador y Empresa; directos desde Creador (lib/pricing.ts:305).",
      "IA: clips y transcripción en todos; subtítulos automáticos, traducción a 9 idiomas, reencuadre automático y diccionario de nombres desde Creador.",
      "Exportación: 720p y solo 9:16 en Prueba, con marca de agua y 10 clips por proyecto; 4K, los cuatro formatos (9:16 · 4:5 · 1:1 · 16:9) y clips ilimitados desde Creador. «Operaciones» (recortar y reducir tamaño) desde Creador (lib/pricing.ts:337).",
      "Publicación: 1 · 6 · 20 cuentas conectadas sumando redes; «Solo TikTok» en Prueba y «Las seis» en los demás; publicar directo en todos; programar desde Creador; analíticas de clips «TikTok · últimos 5 clips» en Prueba (lib/pricing.ts:361).",
      "Ganar: participar en campañas desde Creador; Formación «La ruta de bienvenida» en Prueba y «Todas las clases» desde Creador.",
      "Equipo: almacenamiento 3 días · 100 GB · ilimitado; espacio privado en Prueba y Creador, compartido en Empresa; miembros por asiento y roles solo en Empresa (lib/pricing.ts:418).",
      "Marca y API: plantillas de subtítulos básicas en Prueba y todas desde Creador; kit de marca, plantillas de equipo y webhooks solo en Empresa; API limitada o con límites altos en Empresa; soporte por comunidad, correo o prioritario (lib/pricing.ts:444).",
      "La columna de un plan creado copia la de su escalón salvo lo que la app cobra de verdad: las cuatro capacidades, el asiento y las cuentas se escriben desde sus propios datos, y los minutos son los suyos (`valorCelda`, lib/planes.ts:529). La celda de Analíticas y las redes siguen siendo las de su escalón.",
      "«Lo que no está en la tabla no existe en el plan» (marketing.pricingPage.compare.lead): si la app bloquea algo por plan, tiene su fila.",
    ],
    endpoints: ["planes.listar"],
    datos:
      "Filas y valores por escalón en `FEATURE_GROUPS` (lib/pricing.ts:290); etiquetas en messages/<idioma>/pricing.json; columnas del catálogo del navegador.",
    respuesta:
      "Sin sonido ni movimiento: al cambiar de ciclo la cabecera se actualiza sin rodar las cifras.",
    origen: [
      "components/marketing/pricing-table.tsx:38",
      "lib/pricing.ts:290",
      "lib/planes.ts:529",
    ],
    relacionadas: ["planes.ver-precios", "planes.desbloquear-funcion"],
  },
  {
    id: "planes.consultar-redes-por-plan",
    area: "planes",
    titulo: "Ver qué redes entran en cada plan",
    resumen:
      "Saber desde qué plan se conecta y se publica en cada red, y qué formato y duración pide cada una.",
    quien: ["visitante", "clipero", "agencia"],
    donde: [{ ruta: "/precios#redes", etiqueta: "Precios › Las redes de cada plan." }],
    pasos: [
      "En /precios, pulsa «Redes por plan» junto al título de la comparativa o baja a «Las redes de cada plan.».",
      "Cada red tiene su tarjeta con una insignia: «Todos los planes» o «Desde Creador».",
      "Cada tarjeta dice «Formatos», «Duración máxima» y «Lo que mejor retiene», y tacha los planes que no la incluyen.",
    ],
    reglas: [
      "Redes por escalón (`NETWORKS_BY_PLAN`, lib/pricing.ts:515): Prueba solo TikTok; Creador y Empresa, las seis (TikTok, Instagram, YouTube, X, LinkedIn y Facebook).",
      "Un plan creado admite las redes de su escalón: no se eligen por plan (`redesDe`, lib/planes.ts:495).",
      "«Desde {plan}» nombra el primer plan visible, en el orden del catálogo, que admite la red; si es el primero de todos, la insignia dice «Todos los planes» (components/marketing/pricing-networks.tsx:30).",
    ],
    endpoints: ["planes.listar"],
    datos:
      "Redes por escalón en lib/pricing.ts; formatos, duración máxima y tramo que mejor retiene de cada red en lib/social.ts.",
    respuesta: "Sin sonido: «Redes por plan» es un enlace a la sección.",
    origen: [
      "components/marketing/pricing-networks.tsx:20",
      "components/marketing/pricing-page.tsx:53",
      "lib/pricing.ts:515",
      "lib/planes.ts:495",
    ],
    relacionadas: ["planes.comparar-prestaciones"],
  },
  {
    id: "planes.elegir-plan",
    area: "planes",
    titulo: "Elegir un plan",
    resumen:
      "Pulsar el botón de un plan en /precios o en la portada para empezar con él.",
    quien: ["visitante", "clipero", "agencia"],
    donde: [PRECIOS, PRECIOS_LANDING],
    pasos: [
      "Elige el ciclo con el interruptor entre «Mensual» y «Anual».",
      "Pulsa el botón de la tarjeta: «Empezar gratis» (Prueba), «Elegir Creador», «Elegir Empresa» o «Elegir {plan}» en un plan creado. En la comparativa, el mismo botón va en la cabecera de cada columna.",
      "Hoy el botón lleva a «Subir» (/subir): no hay pasarela y el plan no cambia.",
    ],
    reglas: [
      "Todos los botones llevan hoy a /subir (components/marketing/pricing.tsx:237 y components/marketing/pricing-table.tsx:95): falta el alta de suscripción, el portal de facturación y el webhook que mueva el plan (docs/costuras-backend.md:90).",
      "El texto del botón de un plan de fábrica sale de `pricing.plans.<id>.cta`; el de uno creado es «Elegir {plan}» con su nombre (`pricing.choose`).",
      "Solo se contratan planes activos y visibles: uno oculto solo se asigna desde el backoffice (lib/planes.ts:58).",
      "Prueba no se cobra ni caduca (settings.billing.plan.freeNote).",
      "Impuestos no incluidos: el IGV o IVA se calcula al pagar según el país; se aceptan tarjeta y, en Perú, Yape y Plin (pricing.faq.currencyTaxes).",
    ],
    endpoints: ["planes.listar", "planes.suscribir", "planes.cambiar-plan"],
    datos: "Nada se guarda todavía: el botón es un enlace.",
    respuesta:
      "Solo el botón de la tarjeta destacada es naranja (`brand`): suena «pop» y se encuadra con la marca de recorte. Los demás van en contorno y no suenan. Sin aviso: hoy solo navega.",
    origen: [
      "components/marketing/pricing.tsx:231",
      "components/marketing/pricing.tsx:237",
      "components/marketing/pricing-table.tsx:95",
      "docs/costuras-backend.md:89",
      "messages/es/pricing.json:54",
    ],
    relacionadas: ["planes.ver-precios", "planes.alternar-ciclo", "planes.mejorar-plan"],
  },
  {
    id: "planes.mejorar-plan",
    area: "planes",
    titulo: "Mejorar o cambiar de plan desde la app",
    resumen: "Ir desde la app a los planes para subir o bajar de plan.",
    quien: ["clipero", "agencia"],
    donde: [
      { ruta: "/dashboard", etiqueta: "Menú de usuario › Mejorar plan (en toda la app)" },
      FACTURACION,
    ],
    pasos: [
      "Abre el menú de usuario, en el pie de la barra lateral, y pulsa «Mejorar plan»: lleva a la sección «Precios» de la portada (/#precios).",
      "O en Ajustes › Plan y facturación pulsa «Cambiar de plan»: lleva a /precios.",
      "Elige el plan con su botón (ver «Elegir un plan»).",
    ],
    reglas: [
      "Subir de plan: se paga solo la parte proporcional del ciclo y los créditos nuevos entran al momento. Bajar: el cambio se aplica al final del ciclo actual (pricing.faq.changePlan).",
      "Bajar no desconecta cuentas: al publicar solo cuentan las primeras que se conectaron, de las redes del plan y hasta su cupo; las demás quedan «fuera del cupo» y desconectar siempre se puede, así que cada cual elige cuáles conserva (`cuentasPublicables`, lib/planes.ts:602).",
      "En Empresa se amplían los créditos sin cambiar de plan (pricing.faq.outOfCredits): lo promete la web, pero la app todavía no tiene dónde hacerlo.",
    ],
    endpoints: ["planes.obtener-suscripcion", "planes.cambiar-plan"],
    datos:
      "El plan es un id en `clipealo-plan-v1` (hooks/use-plan.ts). En la demo lo cambian el conmutador «Plan · demo», «Reiniciar demo» (vuelve a Creador) y conceder el perfil de agencia con un plan.",
    respuesta: "Sin sonido: son enlaces.",
    origen: [
      "components/app/user-nav-menu.tsx:79",
      "components/app/billing-settings.tsx:135",
      "messages/es/pricing.json:145",
      "lib/planes.ts:602",
    ],
    relacionadas: [
      "planes.elegir-plan",
      "planes.cambiar-plan-demo",
      "planes.consultar-plan-actual",
    ],
  },
  {
    id: "planes.desbloquear-funcion",
    area: "planes",
    titulo: "Desbloquear una función del plan",
    resumen:
      "Ver qué plan pide una función con candado y llegar a los planes desde el propio candado.",
    quien: ["clipero", "agencia"],
    plan: {
      minimo: "creator",
      nota: "Las cuatro capacidades de pago —programar, operaciones, participar en campañas y clases de pago— piden Creador (`PLAN_MINIMO`, lib/pricing.ts:75). Quien no llega no pierde de vista la función: o el botón sale apagado con el motivo escrito, o la vista entera es una tarjeta que dice lo que se gana; en los dos casos, con «Ver los planes».",
    },
    donde: [
      { ruta: "/calendario", etiqueta: "Calendario (la página entera es el candado)" },
      { ruta: "/studio/[id]", etiqueta: "Estudio › Programar" },
      {
        ruta: "/operaciones",
        etiqueta: "Operaciones (las tarjetas de cada herramienta)",
      },
      { ruta: "/operaciones/recortar", etiqueta: "Operaciones › Recortar › Encargar" },
      {
        ruta: "/operaciones/reducir",
        etiqueta: "Operaciones › Reducir tamaño › Encargar",
      },
      { ruta: "/operaciones/variantes", etiqueta: "Operaciones › Variantes › Encargar" },
      {
        ruta: "/proyectos/[id]/clips/[clipId]",
        etiqueta: "Clip › Publicar el clip (Programar y cuentas fuera del cupo)",
      },
      { ruta: "/campanas", etiqueta: "Campañas › Explorar" },
      { ruta: "/campanas/[id]", etiqueta: "Campaña › Solicitar entrar o Subir clip" },
      { ruta: "/formacion", etiqueta: "Formación › clases de Creador" },
      { ruta: "/analiticas", etiqueta: "Analíticas (clips que se miden)" },
      { ruta: "/ajustes?seccion=cuentas", etiqueta: "Ajustes › Cuentas conectadas" },
    ],
    pasos: [
      "Una vista entera bloqueada enseña una tarjeta con candado, lo que se gana y el botón «Ver los planes»: el Calendario («Programar es del plan Creador») o una clase de pago («Esta clase es del plan Creador»). En Formación, «Desbloquear lo que falta» abre la siguiente clase con candado.",
      "Un botón bloqueado sale apagado con el motivo debajo y el enlace «Ver los planes»: «Programar es del plan Creador en adelante.», «Recortar es del plan Creador en adelante.», «Participar en campañas es del plan Creador en adelante.».",
      "Un límite que recorta una lista se dice antes de ella: «Con el plan Prueba se miden tus últimos 5 clips de TikTok.» en Analíticas, o «Con el plan Prueba se ven las campañas que pagan por TikTok. Quedan N fuera.» en Explorar.",
      "En Cuentas conectadas, una red o un cupo fuera del plan dice «Instagram no entra en el plan Prueba.» o «El plan Prueba admite 1 cuenta conectada: desconecta una para conectar otra.»; al pie, «Ver planes».",
      "Pulsa «Ver los planes» (o «Ver planes»): lleva a /precios.",
    ],
    reglas: [
      "Programar (Creador): con Prueba el Calendario entero es el candado (components/agenda/agenda-view.tsx:277) y «Programar» sale apagado en el Estudio y en «Publicar el clip». Publicar ahora es de todos los planes, también de Prueba con su cuenta de TikTok.",
      "Operaciones (Creador): Recortar, Reducir tamaño y Variantes (`HERRAMIENTA_CAPACIDAD`, lib/operaciones.ts:40). En /operaciones su tarjeta dice «Del plan Creador en adelante» (con candado si el plan no llega) y se abre igual; dentro, «Encargar» sale apagado con «Recortar es del plan Creador en adelante.», «Reducir tamaño es…» o «Variantes es…». Publicación y Derechos son «En todos los planes».",
      "Campañas (Creador): «Solicitar entrar» o «Subir clip» apagados. El dominio devuelve `planInsuficiente` y lo pone el último de la lista: primero se dice lo que no se arregla pagando, para no vender una mejora que no desbloquearía nada (lib/participacion.ts:312).",
      "Explorar campañas solo enseña las que pagan por alguna red del plan, y dice cuántas quedan fuera (components/campanas/campaigns-explorer.tsx:152).",
      "Formación: una clase de pago pide la capacidad `clasesDePago` y llegar al escalón de la clase (`alAlcance`, lib/formacion.ts:393). De las ocho clases de fábrica, tres son de Creador: `lec_gancho`, `lec_publicar` y `lec_analiticas`.",
      "Cuentas conectadas: 1 en Prueba y solo de TikTok, 6 en Creador y 20 en Empresa, sumando todas las redes (`CUENTAS_POR_PLAN`, lib/pricing.ts:152). Conectar pasa por `validarConexion` (lib/planes.ts:563); desconectar, nunca.",
      "Publicar: «Publicar el clip» solo deja elegir las primeras cuentas conectadas, de las redes del plan y hasta su cupo (`cuentasPublicables`, lib/planes.ts:602); las demás —también las de una red fuera del plan— se listan aparte con «El plan {plan} cubre N cuentas conectadas y esta se queda fuera.» y «Ver los planes» (components/app/publicar-dialog.tsx:112). `validarPublicacion` (lib/planes.ts:628) es la misma regla con códigos, para que el servidor la repita.",
      "Analíticas: Prueba mide sus cinco últimos clips y solo de TikTok; Creador y Empresa, todos (`CLIPS_ANALITICA_POR_PLAN`, lib/pricing.ts:508).",
      "Un plan creado desbloquea exactamente su lista de capacidades, no la de su base (`planPermite`, lib/pricing.ts:100); las redes y los clips de Analíticas sí los hereda de su escalón.",
      "El plan que nombra cada candado sale de `PLAN_MINIMO` (o del `planMinimo` de la clase) y su nombre, del catálogo; nunca va escrito a mano: si una capacidad cambia de escalón, todos los textos lo dicen solos.",
      "Es una puerta de interfaz, no seguridad: el servidor repite cada puerta (components/planes/muro-plan.tsx:30, docs/costuras-backend.md:117). Perfil y plan son ejes distintos: la puerta de agencia es otra y nunca se apilan.",
    ],
    errores: [
      {
        codigo: "planInsuficiente",
        cuando: "Solicitar entrar o entregar en una campaña sin llegar a Creador.",
        frase: "campaigns.participation.errors.planInsuficiente",
        bloquea: true,
      },
      {
        codigo: "redFueraDelPlan",
        cuando:
          "Conectar una cuenta de una red que el escalón no admite: con Prueba, cualquiera que no sea TikTok. `validarPublicacion` devuelve el mismo código al publicar; el diálogo «Publicar el clip» lo enseña hoy con la frase de `fueraDelCupo`.",
        frase: "settings.accounts.fueraDelPlan",
        bloquea: true,
      },
      {
        codigo: "cuentasAgotadas",
        cuando: "Conectar una cuenta más con el cupo del plan ya lleno.",
        frase: "settings.accounts.sinCupo",
        bloquea: true,
      },
      {
        codigo: "fueraDelCupo",
        cuando:
          "Publicar en una cuenta conectada que queda fuera del cupo, por ejemplo tras bajar de Empresa a Creador.",
        frase: "app.publicar.fueraDelCupo",
        bloquea: true,
      },
    ],
    endpoints: ["planes.obtener-suscripcion", "planes.listar"],
    datos:
      "El plan (id en `clipealo-plan-v1`) resuelto contra el catálogo del navegador. Cada puerta se decide en React con `usePlan`; antes de hidratar vale el de la demo (Creador), así que con Prueba el candado aparece en la primera pasada del cliente.",
    respuesta:
      "El candado de vista entera lleva «Ver los planes» en naranja (`brand`): suena «pop» y se encuadra con la marca de recorte. El aviso en línea es un enlace de texto con candado, sin sonido, y se anuncia al vuelo (role=status) cuando se cambia de plan sin recargar.",
    origen: [
      "components/planes/muro-plan.tsx:33",
      "components/planes/aviso-plan.tsx:23",
      "lib/pricing.ts:75",
      "components/agenda/agenda-view.tsx:277",
      "components/app/studio.tsx:175",
      "components/app/publicar-dialog.tsx:369",
      "components/app/publicar-dialog.tsx:112",
      "lib/operaciones.ts:40",
      "components/app/operaciones-hub.tsx:62",
      "components/campanas/solicitar-dialog.tsx:172",
      "lib/participacion.ts:314",
      "components/campanas/campaigns-explorer.tsx:152",
      "lib/formacion.ts:393",
      "components/formacion/reproductor-leccion.tsx:97",
      "components/formacion/ruta-panel.tsx:152",
      "components/app/analytics-dashboard.tsx:259",
      "components/app/social-accounts.tsx:128",
      "lib/planes.ts:563",
      "lib/planes.ts:602",
      "lib/planes.ts:628",
    ],
    relacionadas: [
      "planes.comparar-prestaciones",
      "planes.mejorar-plan",
      "planes.cambiar-plan-demo",
    ],
  },
  {
    id: "planes.consultar-plan-actual",
    area: "planes",
    titulo: "Consultar tu plan y tu suscripción",
    resumen:
      "Ver en qué plan estás, cuánto pagas, cuándo se renueva y con qué medio de pago.",
    quien: ["clipero", "agencia"],
    donde: [FACTURACION],
    pasos: [
      "Abre el menú de usuario y pulsa «Facturación», o entra en Ajustes › «Plan y facturación».",
      "La tarjeta «Tu plan» dice el nombre del plan con su estado, el precio al mes y el ciclo («al mes · facturación mensual») y la renovación: «Se renueva el {renovación}. Cliente desde el {alta}.».",
      "Con facturación mensual añade lo que pagarías en anual: «Con facturación anual pagarías US$ 14,50 al mes (50 % menos).»; en Empresa, «Cada miembro adicional del equipo: US$ 15 al mes por asiento.».",
      "Con un plan de pago, «Método de pago» enseña la tarjeta: «Visa terminada en 4242 · Caduca 08/28».",
    ],
    reglas: [
      "El precio al mes es el del ciclo: `yearly` en anual y `monthly` en mensual, del plan del catálogo (components/app/billing-settings.tsx:65). Es el mismo que se ve en /precios.",
      "Un plan es de pago si su precio mensual es mayor que 0. En Prueba la tarjeta dice «El plan Prueba no se cobra ni caduca. Mejora cuando quieras.» y no hay renovación, paso a anual, cancelación ni tarjeta (components/app/billing-settings.tsx:69).",
      "La nota del asiento solo sale con plan de pago y precio de asiento mayor que 0; la demo no cuenta miembros.",
      "La barra lateral repite el nombre del plan: «Plan Creador».",
    ],
    estados: [
      {
        estado: "Activo",
        significa: "Plan de pago que se renueva en la fecha indicada.",
      },
      {
        estado: "Se cancela el {fecha}",
        significa:
          "Cancelada: conserva el plan hasta la renovación y después pasa a Prueba.",
      },
      {
        estado: "Sin coste",
        significa: "Prueba, o cualquier plan a 0 US$: no se cobra ni caduca.",
      },
    ],
    endpoints: ["planes.obtener-suscripcion", "planes.listar"],
    datos:
      "Plan: id en `clipealo-plan-v1`. Suscripción: `suscripcionDemo` fija (lib/ajustes.ts:224: mensual, activa desde el 2026-03-01, Visa 4242) y renovación en `usage.renewsAt` (2026-10-01). El ciclo y la cancelación son estado del componente: se pierden al recargar.",
    respuesta: "Sin sonido: es lectura.",
    origen: [
      "components/app/billing-settings.tsx:54",
      "components/app/billing-settings.tsx:65",
      "components/app/billing-settings.tsx:69",
      "lib/ajustes.ts:224",
      "lib/mock-data.ts:498",
      "components/app/user-nav-menu.tsx:84",
      "components/app/app-sidebar.tsx:184",
    ],
    relacionadas: [
      "planes.consultar-consumo",
      "planes.pasar-a-anual",
      "planes.cancelar-suscripcion",
      "planes.cambiar-metodo-pago",
      "planes.revisar-facturas",
    ],
  },
  {
    id: "planes.consultar-consumo",
    area: "planes",
    titulo: "Ver los minutos consumidos del mes",
    resumen: "Saber cuántos minutos de video del plan quedan hasta la renovación.",
    quien: ["clipero", "agencia"],
    donde: [
      {
        ruta: "/dashboard",
        etiqueta:
          "Panel › Minutos procesados, y el pie de la barra lateral en toda la app",
      },
      {
        ruta: FACTURACION.ruta,
        etiqueta: "Ajustes › Plan y facturación › Consumo del mes",
      },
    ],
    pasos: [
      "En el pie de la barra lateral ves «Plan Creador», una barra y «414 / 600 min este mes». Al plegar la barra se oculta.",
      "En el Panel, la tarjeta «Minutos procesados» dice los usados y «de 600 incluidos».",
      "En Ajustes › Plan y facturación, «Consumo del mes» dice «414 de 600 min», la barra y «69 % usado · 186 min disponibles hasta el {renovación} · 87 clips este mes.».",
    ],
    reglas: [
      "Un minuto es un minuto de video subido; los clips no consumen (settings.billing.usage.note).",
      "Los incluidos son los minutos del plan: 60 en Prueba y 600 en Creador y Empresa (`MINUTOS_INCLUIDOS`, lib/pricing.ts:159); un plan creado lleva los suyos, entre 1 y 100.000.",
      "El porcentaje es usados / incluidos × 100, redondeado. Desde el 80 % la barra de Facturación se pinta en color de aviso (`AVISO_CONSUMO_PCT`, components/app/billing-settings.tsx:47), el mismo umbral que el aviso «Minutos por agotarse» de Ajustes › Notificaciones (settings.notifications.types.minutos).",
      "Los minutos no consumidos no se acumulan. Sin minutos se puede seguir editando y publicando; para subir más video hay que esperar a la renovación o subir de plan, y en Empresa ampliarlos (pricing.faq.outOfCredits).",
      "Hoy la subida no se bloquea por minutos y la cifra es simulada: el 69 % de lo incluido y 87 clips (6 en Prueba) (lib/mock-data.ts:494).",
    ],
    endpoints: ["planes.leer-consumo", "planes.obtener-suscripcion", "planes.listar"],
    datos:
      "Simulado en lib/mock-data.ts: `minutosUsados(incluidos)` es el 69 % de los minutos del plan y `clipsDelMes`, 87 (6 en Prueba). La renovación es `usage.renewsAt`.",
    respuesta:
      "Sin sonido ni aviso. Desde el 80 % la barra de Facturación cambia a color de aviso.",
    origen: [
      "components/app/app-sidebar.tsx:110",
      "components/app/minutes-stat.tsx:17",
      "components/app/billing-settings.tsx:72",
      "components/app/billing-settings.tsx:228",
      "lib/mock-data.ts:494",
      "lib/pricing.ts:159",
    ],
    relacionadas: ["planes.consultar-plan-actual", "planes.mejorar-plan"],
  },
  {
    id: "planes.pasar-a-anual",
    area: "planes",
    titulo: "Pasar la suscripción a facturación anual",
    resumen: "Cambiar una suscripción mensual a anual para pagar la mitad al mes.",
    quien: ["clipero", "agencia"],
    plan: {
      nota: `${SOLO_DE_PAGO} Además, solo en ciclo mensual y sin cancelación pendiente.`,
    },
    donde: [FACTURACION],
    pasos: [
      "En Ajustes › Plan y facturación, la tarjeta «Tu plan» dice «Con facturación anual pagarías US$ 14,50 al mes (50 % menos).».",
      "Pulsa «Pasar a anual».",
      "El precio pasa a US$ 14,50 «al mes · facturación anual» y el botón desaparece.",
    ],
    reglas: [
      "El precio anual es el `yearly` del plan: US$ 14,50 al mes en Creador y 19,50 en Empresa. Se paga el año por adelantado y los créditos se entregan cada mes, no de golpe (pricing.faq.annualBilling).",
      "Se cobra desde la próxima renovación: el aviso dice «Desde el {renovación} pagas {yearly × 12} al año», US$ 174 en Creador.",
      "No hay botón para volver a mensual.",
    ],
    endpoints: ["planes.cambiar-plan", "planes.obtener-suscripcion"],
    datos:
      "Estado del componente (`ciclo`, que arranca en `suscripcionDemo.ciclo`, mensual): se pierde al recargar.",
    respuesta:
      "`toast.success` (suena): «Facturación anual activada» · «Desde el {renovación} pagas US$ 174 al año.» en Creador. El botón va en contorno y no suena al pulsarlo.",
    origen: [
      "components/app/billing-settings.tsx:137",
      "components/app/billing-settings.tsx:142",
      "messages/es/settings.json:338",
      "messages/es/pricing.json:149",
      "lib/pricing.ts:22",
    ],
    relacionadas: ["planes.alternar-ciclo", "planes.consultar-plan-actual"],
  },
  {
    id: "planes.cancelar-suscripcion",
    area: "planes",
    titulo: "Cancelar la suscripción",
    resumen: "Dejar de pagar el plan conservándolo hasta el final del ciclo pagado.",
    quien: ["clipero", "agencia"],
    plan: { nota: SOLO_DE_PAGO },
    donde: [FACTURACION],
    pasos: [
      "En Ajustes › Plan y facturación, pulsa «Cancelar suscripción».",
      "El diálogo pregunta «¿Cancelar Creador?» y explica: «Conservas el plan hasta el {renovación}. Después pasas a Prueba: 60 minutos al mes, 720p y marca de agua. Tus clips se pueden descargar durante 30 días.».",
      "Confirma con «Cancelar suscripción» o vuelve atrás con «Mantener Creador».",
      "La insignia pasa a «Se cancela el {renovación}», el texto a «Conservas Creador hasta el {renovación}; después pasas a Prueba.» y aparece «Mantener Creador».",
    ],
    reglas: [
      "Sin llamadas ni permanencia: se conserva el plan hasta el final del ciclo pagado (pricing.faq.cancelRefund).",
      "Reembolso: si es el primer pago y no se han consumido más de 30 créditos, se devuelve el importe durante los 7 días siguientes (pricing.faq.cancelRefund).",
      "Después de cancelar, todo el material se puede descargar durante 30 días (pricing.faq.afterCancel).",
      "Con la cancelación pendiente no se ofrece «Pasar a anual».",
    ],
    estados: [
      { estado: "Activo", significa: "Antes de cancelar: se renueva sola." },
      {
        estado: "Se cancela el {fecha}",
        significa:
          "Cancelada: sigue con el plan hasta la renovación y se puede mantener.",
      },
      {
        estado: "Prueba",
        significa: "Pasada la renovación: 60 minutos al mes, 720p y marca de agua.",
      },
    ],
    endpoints: ["planes.cancelar", "planes.obtener-suscripcion"],
    datos:
      "Estado del componente (`cancelada`): se pierde al recargar y la demo nunca pasa a Prueba.",
    respuesta:
      "Aviso neutro con el sonido «remove»: «Suscripción cancelada» · «Sigues con Creador hasta el {renovación}.». El botón que confirma es rojo (`destructive`), no naranja.",
    origen: [
      "components/app/billing-settings.tsx:169",
      "components/app/billing-settings.tsx:194",
      "components/app/billing-settings.tsx:195",
      "messages/es/settings.json:334",
      "messages/es/pricing.json:153",
      "messages/es/pricing.json:165",
    ],
    relacionadas: ["planes.mantener-suscripcion", "planes.consultar-plan-actual"],
  },
  {
    id: "planes.mantener-suscripcion",
    area: "planes",
    titulo: "Mantener una suscripción cancelada",
    resumen: "Deshacer la cancelación antes de que acabe el ciclo.",
    quien: ["clipero", "agencia"],
    plan: { nota: SOLO_DE_PAGO },
    donde: [FACTURACION],
    pasos: [
      "Con la suscripción cancelada, en Ajustes › Plan y facturación pulsa «Mantener Creador».",
      "La insignia vuelve a «Activo» y el texto a «Se renueva el {renovación}…».",
    ],
    reglas: [
      "Solo existe mientras hay una cancelación pendiente, antes de la fecha de renovación.",
      "La renovación queda en la misma fecha, con el mismo plan y ciclo.",
      "«Mantener {plan}» es también el botón que cierra el diálogo de cancelar sin cancelar.",
    ],
    endpoints: ["planes.reactivar", "planes.obtener-suscripcion"],
    datos: "Estado del componente (`cancelada` vuelve a `false`).",
    respuesta:
      "`toast.success` (suena): «Suscripción reactivada» · «Creador se renueva el {renovación}.». El botón es fantasma y no suena al pulsarlo.",
    origen: [
      "components/app/billing-settings.tsx:153",
      "components/app/billing-settings.tsx:157",
      "messages/es/settings.json:342",
    ],
    relacionadas: ["planes.cancelar-suscripcion"],
  },
  {
    id: "planes.cambiar-metodo-pago",
    area: "planes",
    titulo: "Cambiar el método de pago",
    resumen: "Cambiar la tarjeta o el medio con el que se cobra el plan.",
    quien: ["clipero", "agencia"],
    plan: { nota: SOLO_DE_PAGO },
    donde: [FACTURACION],
    pasos: [
      "En Ajustes › Plan y facturación, en «Método de pago», pulsa «Cambiar método de pago».",
      "Hoy aparece el aviso «La pasarela aún no está conectada» · «Aquí se abrirá el cambio de tarjeta, Yape o Plin.».",
    ],
    reglas: [
      "La tarjeta «Método de pago» solo se pinta con plan de pago.",
      "Se enseña la marca, los cuatro últimos dígitos y la caducidad: «Visa terminada en 4242 · Caduca 08/28» en la demo.",
      "Medios que promete la web: tarjeta y, en Perú, Yape y Plin (pricing.faq.currencyTaxes).",
    ],
    endpoints: ["planes.abrir-portal", "planes.obtener-suscripcion"],
    datos: "`suscripcionDemo.metodo`, fijo en lib/ajustes.ts:228.",
    respuesta: "Aviso neutro, sin sonido: informa de que falta la pasarela.",
    origen: [
      "components/app/billing-settings.tsx:245",
      "components/app/billing-settings.tsx:270",
      "lib/ajustes.ts:228",
      "messages/es/settings.json:363",
    ],
    relacionadas: ["planes.consultar-plan-actual"],
  },
  {
    id: "planes.revisar-facturas",
    area: "planes",
    titulo: "Revisar las facturas",
    resumen:
      "Ver qué se ha cobrado, cuándo, por qué plan y en qué estado está cada factura.",
    quien: ["clipero", "agencia"],
    donde: [FACTURACION],
    pasos: [
      "En Ajustes › Plan y facturación, baja a «Facturas».",
      "Cada fila tiene «Fecha», «Concepto» («Plan Creador · mensual»), «Número» (se oculta en el móvil), «Importe» y «Estado».",
    ],
    reglas: [
      "Importes en dólares sin impuestos; el IGV o IVA va desglosado en cada factura (settings.billing.invoices.description).",
      "El concepto se compone con el plan y el ciclo en el idioma de quien mira: la factura guarda ids, no el texto.",
      "La tabla se pinta con cualquier plan: en la demo, también con Prueba enseña las cuatro facturas de Creador.",
    ],
    estados: [
      { estado: "Pagada", significa: "Cobrada." },
      {
        estado: "Reembolsada",
        significa:
          "Devuelta. Existe en el tipo `Factura`; ninguna factura de la demo está así.",
      },
    ],
    endpoints: ["planes.listar-facturas"],
    datos:
      "`facturasDemo` (lib/ajustes.ts:243): cuatro facturas de Creador mensual a US$ 29, del 2026-06-01 al 2026-09-01, todas pagadas.",
    respuesta: "Sin sonido: es lectura.",
    origen: [
      "components/app/billing-settings.tsx:306",
      "lib/ajustes.ts:233",
      "lib/ajustes.ts:243",
      "messages/es/settings.json:370",
    ],
    relacionadas: ["planes.descargar-factura", "planes.consultar-plan-actual"],
  },
  {
    id: "planes.descargar-factura",
    area: "planes",
    titulo: "Descargar una factura",
    resumen: "Bajar el PDF de una factura.",
    quien: ["clipero", "agencia"],
    donde: [FACTURACION],
    pasos: [
      "En «Facturas», pulsa el icono de descarga de la fila («Descargar la factura F-2026-0912»).",
      "Hoy aparece «Factura F-2026-0912» · «La descarga en PDF llegará con la pasarela.».",
    ],
    reglas: [
      "Cada fila tiene su botón, con el número de la factura en su nombre para lector de pantalla («Descargar la factura {id}»).",
      "El PDF tendrá el impuesto desglosado: «el IGV o IVA va desglosado en cada factura» (settings.billing.invoices.description).",
    ],
    endpoints: ["planes.descargar-factura", "planes.listar-facturas"],
    datos: "No hay PDF todavía: el botón solo avisa.",
    respuesta: "Aviso neutro, sin sonido.",
    origen: [
      "components/app/billing-settings.tsx:329",
      "components/app/billing-settings.tsx:334",
      "messages/es/settings.json:385",
    ],
    relacionadas: ["planes.revisar-facturas"],
  },
  {
    id: "planes.cambiar-plan-demo",
    area: "planes",
    titulo: "Cambiar de plan en la demo",
    resumen:
      "Probar la app como Prueba, Creador, Empresa o un plan creado sin pagar: el conmutador de demostración.",
    quien: ["clipero", "agencia"],
    donde: [
      { ruta: "/dashboard", etiqueta: "Menú de usuario › Plan · demo (en toda la app)" },
    ],
    pasos: [
      "Abre el menú de usuario, en el pie de la barra lateral.",
      "En «Plan · demo», elige Prueba, Creador, Empresa o un plan creado en el backoffice.",
      "Los candados, la barra lateral, Facturación y los avisos de plan cambian al momento, sin recargar, también en las demás pestañas.",
    ],
    reglas: [
      "Es un aparato de demostración: en producción el plan lo pone la pasarela de pago y lo dice la suscripción, no el navegador (components/app/user-nav-menu.tsx:145, docs/costuras-backend.md:64).",
      "Ofrece los planes activos, también los ocultos, para probar un plan hecho a medida antes de venderlo (`planesAsignables`, lib/planes.ts:491).",
      "Solo se guarda el id; el plan entero se resuelve contra el catálogo. Un id que ya no está, o un plan apagado, cae a Creador (`planDe`, lib/planes.ts:476).",
      "La demo arranca en Creador a propósito, para enseñar el producto entero (`PLAN_DEMO`, lib/pricing.ts:124). «Reiniciar demo» vuelve a Creador (hooks/use-campanas.ts:624).",
      "Conceder el perfil de agencia con un plan también cambia el plan de la cuenta de la demo (hooks/use-campanas.ts:448).",
      "Sin almacenamiento disponible, el cambio dura hasta recargar.",
    ],
    endpoints: ["planes.obtener-suscripcion", "planes.listar"],
    datos:
      "El id del plan en `localStorage`, clave `clipealo-plan-v1` (`CLAVE_PLAN`), con el evento `clipealo:plan` para esta pestaña y `storage` para las demás (hooks/use-plan.ts).",
    respuesta:
      "Sin sonido ni aviso: es una opción de menú (no suena como un grupo de opciones) y el menú no se cierra al elegir.",
    origen: [
      "components/app/user-nav-menu.tsx:153",
      "components/app/user-nav-menu.tsx:67",
      "hooks/use-plan.ts:49",
      "lib/pricing.ts:124",
      "lib/pricing.ts:131",
      "lib/planes.ts:476",
    ],
    relacionadas: ["planes.mejorar-plan", "planes.desbloquear-funcion"],
  },
]
