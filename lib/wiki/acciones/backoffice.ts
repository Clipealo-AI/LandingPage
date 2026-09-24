import type { Accion, Rol } from "@/lib/wiki/tipos"

/**
 * Acciones de «backoffice»: todo lo que hace el equipo en `/admin`.
 *
 * Tres clases de acción, y la wiki las distingue en `datos` y `respuesta`:
 *
 * - **Leer el negocio.** Páginas de servidor que piden la instantánea del mes
 *   a `lib/api/admin.ts` (`server-only`), calculada sobre el dataset simulado.
 * - **Escribir de verdad en el navegador.** Catálogo de planes, preguntas,
 *   Formación, campañas, retiros, solicitud de agencia, disputas y casillero:
 *   el backoffice escribe en el mismo almacén que lee la app, así que lo que se
 *   decide aquí se ve allí sin recargar.
 * - **Acciones simuladas.** Cobros, afiliados, referidos, costes y usuarios son
 *   `MockAction` (components/admin/mock-action.tsx): enseñan «Acción simulada»
 *   con lo que harían, a la espera de su endpoint.
 *
 * Ninguna la limita el plan: el backoffice es del operador. Y ninguna ruta está
 * protegida todavía: `/admin` se abre sin sesión.
 *
 * Dos partes del backoffice se documentan en el área de lo que editan, para
 * no tener cada acción dos veces: el editor de Formación (/admin/formacion) en
 * `formacion.*` y los «Retiros por pagar» de /admin/campanas en `wallet.*`.
 */

const ADMIN: Rol[] = ["admin"]

const DATOS_INSTANTANEA =
  "Instantánea del mes calculada en el servidor (`lib/api/admin.ts`, `server-only`) sobre el dataset simulado de `lib/admin/mock-data.ts`: 652 usuarios, con «hoy» fijo en 2026-09-13 12:20 UTC. Al navegador solo llega lo que se pinta."

const DATOS_MOCK =
  "Nada todavía: es un `MockAction` y no escribe en ningún sitio. Las filas que enseña salen de la instantánea del mes (`lib/admin/mock-data.ts`)."

const DATOS_PLANES =
  "Almacén del navegador `clipealo-planes-v1` (hooks/use-catalogo-planes.ts): de los tres planes de la web solo el parche; los creados, enteros. Lo leen /precios, la app y cada puerta sin recargar."

const DATOS_MICRO =
  "Almacén del navegador `clipealo-micro-catalogo-v1` (hooks/use-catalogo-micro.ts): semillas + parches. Lo lee la app para decidir qué preguntar. Las respuestas viven en la cuenta de cada persona y no llegan aquí."

const DATOS_CAMPANAS =
  "Almacén del navegador `clipealo-campanas-v1` (hooks/use-campanas.ts), el mismo que lee la app: lo que se decide aquí se ve en /campanas sin recargar."

const DATOS_FEEDBACK =
  "Almacén del navegador `clipealo-feedback-v1` (hooks/use-feedback.ts), compartido con Ayuda › Tus mensajes."

const RESPUESTA_MOCK =
  "Hoy, `toast()` neutro «Acción simulada» con lo que haría (components/admin/mock-action.tsx:28). No suena: en el backoffice solo suena la acción principal de cada vista (AGENTS.md, regla 7)."

const RESPUESTA_MOCK_BRAND =
  'Es la acción principal de su vista (`variant="brand"`): suena «pop» y se encuadra con la marca de recorte al pulsarla. Después, `toast()` neutro «Acción simulada» con lo que haría.'

/* ---------------------------------------------------------------------------
   El marco: mes, idioma, sesión y tablas
   --------------------------------------------------------------------------- */

const MARCO: Accion[] = [
  {
    id: "backoffice.cambiar-mes",
    area: "backoffice",
    titulo: "Mirar otro mes",
    resumen:
      "Recalcula la página entera para un mes cerrado (o vuelve al mes en curso) sin perder el mes al navegar.",
    quien: ADMIN,
    donde: [
      { ruta: "/admin", etiqueta: "Panel" },
      { ruta: "/admin/usuarios", etiqueta: "Usuarios" },
      { ruta: "/admin/ingresos", etiqueta: "Ingresos" },
      { ruta: "/admin/costes", etiqueta: "Costes de IA" },
      { ruta: "/admin/planes", etiqueta: "Planes" },
      { ruta: "/admin/vencimientos", etiqueta: "Vencimientos" },
      { ruta: "/admin/afiliados", etiqueta: "Afiliados" },
      { ruta: "/admin/referidos", etiqueta: "Referidos" },
    ],
    pasos: [
      "En la barra superior, abre el desplegable «Mes». El mes en curso sale como «Septiembre de 2026 · hoy».",
      "Elige otro mes, p. ej. «Agosto de 2026».",
      "La URL pasa a `?mes=2026-08` y la cabecera cambia de «Hasta hoy · día 13 de 30» a «Mes cerrado».",
      "Navega por la barra lateral, las migas o los KPIs: todos los enlaces conservan `?mes=`.",
      "Para volver, elige el mes en curso: el `?mes=` desaparece de la URL.",
    ],
    reglas: [
      "El mes viaja en `?mes=AAAA-MM`; ausente es el mes en curso, y el mes en curso nunca se escribe (`conMes`, lib/admin/enlaces.ts:21).",
      "Un `?mes=` desconocido cae al mes en curso (`resolveMonth`).",
      "Doce meses elegibles: de octubre de 2025 a septiembre de 2026.",
      "La página es de servidor: cambiar el mes la recalcula entera; al navegador solo llegan los números que se pintan.",
      "Mes en curso: las métricas de flujo se comparan con los mismos días del mes anterior («hasta hoy»); las de stock, con el cierre anterior.",
      "Campañas, Formación, Preguntas, Casillero, Disputas y Mercado no tienen selector: no pertenecen a un mes.",
    ],
    endpoints: ["backoffice.listar-meses", "backoffice.leer-mes"],
    datos: DATOS_INSTANTANEA,
    respuesta:
      "Sin sonido ni aviso: es navegación. La cabecera cambia de «Hasta hoy» a «Mes cerrado».",
    origen: [
      "components/admin/month-picker.tsx:35",
      "lib/admin/enlaces.ts:21",
      "lib/api/admin.ts:61",
      "tests/e2e/backoffice.spec.ts:61",
    ],
    relacionadas: ["backoffice.consultar-panel"],
  },
  {
    id: "backoffice.cambiar-idioma",
    area: "backoffice",
    titulo: "Cambiar el idioma del backoffice",
    resumen:
      "Pone el backoffice en español, inglés o portugués sin cambiar el idioma del sitio público.",
    quien: ADMIN,
    donde: [{ ruta: "/admin", etiqueta: "Menú del operador (pie de la barra lateral)" }],
    pasos: [
      "Abre el menú del operador, al pie de la barra lateral: el botón que dice «Admin» y, debajo, «652 usuarios».",
      "Entra en el submenú «Idioma» y elige «Español», «English» o «Português (Brasil)»: cada idioma se escribe en su propio idioma.",
      "La misma página se vuelve a pintar en ese idioma, con el mismo mes y la misma consulta.",
    ],
    reglas: [
      "El admin guarda su idioma aparte, en la cookie `clipealo-admin-locale` (un año); por defecto, inglés (`ADMIN_LOCALE`, i18n/routing.ts:113).",
      "No usa el router de next-intl a propósito: ese escribiría la cookie del sitio. Solo cambia el prefijo de la URL (components/admin/admin-user-nav.tsx:51).",
      "Las rutas del admin no se traducen: `/admin/usuarios` es igual en los tres idiomas.",
    ],
    endpoints: ["backoffice.leer-mes"],
    datos: "Cookie del navegador `clipealo-admin-locale`, que aplica `proxy.ts`.",
    respuesta: "Sin aviso: la página se vuelve a pintar en el idioma elegido.",
    origen: [
      "components/admin/admin-user-nav.tsx:46",
      "i18n/routing.ts:113",
      "proxy.ts:9",
    ],
    relacionadas: ["cuenta.cambiar-idioma"],
  },
  {
    id: "backoffice.cerrar-sesion",
    area: "backoffice",
    titulo: "Salir del backoffice",
    resumen: "Cierra la sesión del operador y lleva a la pantalla de acceso.",
    quien: ADMIN,
    donde: [{ ruta: "/admin", etiqueta: "Menú del operador › Salir" }],
    pasos: [
      "Abre el menú del operador al pie de la barra lateral.",
      "Pulsa «Salir».",
      "Sale el aviso «Sesión cerrada» y se abre /login.",
    ],
    reglas: [
      "Hoy no hay sesión de operador: el aviso lo dice («En el arquetipo no hay sesión de operador todavía: el acceso al panel no está restringido»).",
      "Con servidor, salir invalida la sesión y el middleware protege `app/[locale]/(admin)` (docs/costuras-backend.md, «Sesión e identidad»).",
    ],
    endpoints: ["acceso.salir"],
    datos:
      "No hay sesión que cerrar: el operador es un objeto fijo en el componente (components/admin/admin-user-nav.tsx:66).",
    respuesta:
      "`toast()` neutro «Sesión cerrada» con la explicación; no suena. Luego navega a /login.",
    origen: ["components/admin/admin-user-nav.tsx:140"],
    relacionadas: ["acceso.cerrar-sesion"],
  },
  {
    id: "backoffice.buscar-y-filtrar-tablas",
    area: "backoffice",
    titulo: "Buscar, filtrar, ordenar y paginar una tabla",
    resumen:
      "Encuentra filas en cualquier tabla de trabajo del backoffice, con el estado en la URL para poder compartirlo.",
    quien: ADMIN,
    donde: [
      { ruta: "/admin/usuarios", etiqueta: "Usuarios › Todos los usuarios" },
      { ruta: "/admin/ingresos", etiqueta: "Ingresos › Pagos" },
      { ruta: "/admin/costes", etiqueta: "Costes de IA › Proyectos con coste" },
      {
        ruta: "/admin/vencimientos",
        etiqueta: "Vencimientos › Colas de cobro y retención",
      },
      {
        ruta: "/admin/afiliados",
        etiqueta: "Afiliados › Rendimiento y comisiones por código",
      },
      { ruta: "/admin/referidos", etiqueta: "Referidos › Todos los referidos" },
      { ruta: "/admin/formacion", etiqueta: "Formación › Clases" },
      { ruta: "/admin/feedback", etiqueta: "Casillero › La cola" },
    ],
    pasos: [
      "Escribe en el buscador de la tabla (p. ej. «Buscar por nombre, correo o país» en Usuarios).",
      "Elige filtros en los desplegables o botones de encima (p. ej. «Segmento», «Plan», «País», «Actividad»).",
      "Pulsa una cabecera para ordenar; otra vez, para invertir.",
      "Muévete con «Anterior» y «Siguiente»; el contador dice «{n} de {total}».",
      "«Limpiar» quita búsqueda y filtros.",
    ],
    reglas: [
      "Búsqueda, filtros, orden y página viven en la URL (`q`, `orden`, `pagina` y un parámetro por filtro): un enlace a «pagantes inactivos ordenados por importe» se comparte tal cual.",
      "25 filas por página por defecto; 20 en Costes y en Referidos.",
      "Parámetros por tabla: Usuarios `segmento`, `plan`, `organizacion`, `suscripcion`, `pais`, `canal`, `cohorte`, `actividad` (7, 30 o 90 d con proyecto); Pagos `estado`, `tipo`, `metodo`, `plan`; Costes `plan`, `fuente`, `estado`, `solo`; Vencimientos `cola`, `semaforo`, `plan`, `metodo`; Afiliados `estado`, `pendiente`, `alerta`; Referidos `estado`, `recompensa`, `atascados`; Formación `estado`, `plan`; Casillero `estado`, `tipo`, `de`.",
      "Los parámetros que enlaza el Panel (`segmento`, `cola`, `q`, `mes`) son parte del contrato entre páginas (AGENTS.md, «Backoffice»).",
      "Hoy todo pasa en el navegador sobre la lista entera; el pie resume las filas filtradas (p. ej. en Usuarios: de pago, PQL, pagantes inactivos y minutos).",
    ],
    endpoints: [
      "backoffice.listar-usuarios",
      "backoffice.listar-pagos",
      "backoffice.listar-proyectos",
      "backoffice.listar-referidos",
      "backoffice.leer-mes",
      "formacion.listar-catalogo-admin",
      "backoffice.listar-mensajes",
    ],
    datos: `${DATOS_INSTANTANEA} Formación y Casillero filtran lo del almacén del navegador.`,
    respuesta:
      "La búsqueda, los desplegables, el orden y la paginación no suenan. Los filtros de botones (p. ej. «Estado» e «Incidencias» en Costes, «Estado» en Formación y en Casillero) son un grupo de opciones con `role=radio`: elegir una nueva hace «tap» (components/shared/interaction-feedback.tsx:38).",
    origen: [
      "components/admin/admin-table.tsx:90",
      "components/admin/admin-table.tsx:116",
      "components/admin/usuarios-table.tsx:83",
      "components/admin/admin-table.tsx:196",
      "tests/e2e/backoffice.spec.ts:117",
    ],
    relacionadas: ["formacion.buscar-clases"],
  },
]

/* ---------------------------------------------------------------------------
   Leer el negocio
   --------------------------------------------------------------------------- */

const CONSULTAS: Accion[] = [
  {
    id: "backoffice.consultar-panel",
    area: "backoffice",
    titulo: "Leer el panel del día",
    resumen:
      "Responde en una pantalla cuánto ingreso recurrente hay y cuánto peligra, cuánta caja queda, si se ganan clientes y si hay uso real; debajo, lo que hay que cobrar o arreglar hoy.",
    quien: ADMIN,
    donde: [{ ruta: "/admin", etiqueta: "Panel" }],
    pasos: [
      "Abre «Panel» en la barra lateral (grupo «Negocio»).",
      "Lee los cuatro KPIs: «MRR real», «Caja neta hasta hoy», «Clientes de pago» y «Usuarios activos 30 d». Cada uno enlaza a su página.",
      "Trabaja «Hoy: colas con importe»: cada fila lleva su botón («Verificar pago», «Reintentar cobro», «Otorgar recompensa»…) que abre la página donde se resuelve.",
      "Si sale «Hay clips que no están saliendo», pulsa «Ver la salud de publicación».",
      "Mira «Activación por semana de alta», el «Puente de MRR · 6 meses», la «Caja neta · 6 meses» y «Usuarios de Prueba que ya se comportan como clientes» («Ver todos» abre Usuarios con `?segmento=pql`).",
      "Al final, «Bienvenida»: el funnel del onboarding «Tu primer corte».",
    ],
    reglas: [
      "Cliente de pago: suscripción activa o en los 7 días de gracia, plan distinto de Interno e importe mayor que 0. MRR: precio mensual normalizado (anual ÷ 12) de esos clientes.",
      "Las colas van rojo antes que ámbar y luego por importe; se enseñan 8 y el resto se enlaza a Vencimientos.",
      "Las filas y la alerta de publicación mandan a «/admin/costes#publicaciones»: la pantalla de publicaciones no existe todavía (app/[locale]/(admin)/admin/page.tsx:58).",
      "PQL del panel: Prueba sin ningún pago con dos proyectos listos en 14 días, al 80 % de sus minutos o activo esta semana con más de diez clips (admin.panel.pql.criteria).",
      "La barra lateral cuenta trabajo pendiente: Usuarios (colas de retención + alerta «revisar»), Vencimientos (colas de cobro), Formación (clases publicadas sin video), Disputas (no resueltas) y Casillero (sin abrir). Solo se pintan si son más de 0.",
      "Los datos de publicación y de onboarding son simulados y la pantalla lo dice.",
    ],
    endpoints: [
      "backoffice.leer-mes",
      "backoffice.listar-meses",
      "backoffice.leer-series",
      "backoffice.leer-onboarding",
      "formacion.listar-catalogo-admin",
    ],
    datos: DATOS_INSTANTANEA,
    origen: [
      "app/[locale]/(admin)/admin/page.tsx:65",
      "app/[locale]/(admin)/layout.tsx:32",
      "components/admin/admin-sidebar.tsx:83",
      "lib/admin/metrics.ts:951",
    ],
    relacionadas: ["backoffice.cambiar-mes", "backoffice.consultar-vencimientos"],
  },
  {
    id: "backoffice.consultar-ingresos",
    area: "backoffice",
    titulo: "Revisar ingresos y cobros",
    resumen:
      "Ve el MRR y su puente, lo que de verdad se cobra, la caja neta, el LTV y cada intento de cobro con su atribución.",
    quien: ADMIN,
    donde: [{ ruta: "/admin/ingresos", etiqueta: "Ingresos" }],
    pasos: [
      "Abre «Ingresos» en la barra lateral.",
      "Lee «MRR real», «Cobro efectivo de renovaciones · 3 m», «Caja neta hasta hoy» y «LTV realizado por cliente».",
      "En «Pagos», trabaja la tabla: pendientes y rechazados salen arriba.",
      "En «Recurrencia y cobro», cambia entre «Puente y caja», «MRR por plan», «Segunda cobranza» y «Método y tipo».",
    ],
    reglas: [
      "ARR = MRR × 12 y solo va en el pie: no es un KPI (docs/backoffice-metricas.md).",
      "Caja neta = cobros aprobados − reembolsos − coste de IA − comisiones pagadas − recompensas (`cajaNetaEn`, lib/admin/metrics.ts:1490); en el mes en curso, comparada con los mismos días del anterior.",
      "Importes en dólares (lib/admin/types.ts:7).",
    ],
    endpoints: [
      "backoffice.leer-mes",
      "backoffice.listar-meses",
      "backoffice.leer-series",
      "backoffice.listar-pagos",
    ],
    datos: DATOS_INSTANTANEA,
    origen: [
      "app/[locale]/(admin)/admin/ingresos/page.tsx:38",
      "components/admin/ingresos-pagos-table.tsx:113",
    ],
    relacionadas: [
      "backoffice.aprobar-pago",
      "backoffice.reembolsar-pago",
      "backoffice.exportar-pagos",
    ],
  },
  {
    id: "backoffice.consultar-costes",
    area: "backoffice",
    titulo: "Revisar costes de IA y salud del pipeline",
    resumen:
      "Convierte el coste de IA en coste por minuto, separa lo que cuesta servir a Prueba, detecta proyectos anómalos, errores del pipeline y envíos que no salen.",
    quien: ADMIN,
    donde: [{ ruta: "/admin/costes", etiqueta: "Costes de IA" }],
    pasos: [
      "Abre «Costes de IA» en la barra lateral.",
      "Lee «Coste de IA hasta hoy», «Coste por minuto procesado», «Margen bruto tras IA» y «Errores del pipeline 7 d».",
      "Recorre «Proyectos con coste», «Salud del pipeline», «Coste anómalo · 30 d», «Salud de publicación», «Rendimiento por fuente · 30 d», «Proveedor y modelo», «Top 10 de Prueba por coste» y «Seis meses».",
      "En las gráficas, «Ver los datos como tabla» despliega las cifras.",
    ],
    reglas: [
      "Anómalo: coste mayor que 3 veces la mediana de 30 d, o coste por minuto mayor que 2 veces la suya.",
      "Atascado: más de 2 horas «procesando» (lib/admin/metrics.ts:2389).",
      "Una fuente con más de 20 proyectos históricos y ninguno en 30 días es un conector roto (`alertaCaida`); una con al menos 5 proyectos y menos del 80 % de éxito se puede deshabilitar.",
      "Publicación: fallos de la semana sobre los intentados; aviso desde el 5 % y alerta desde el 10 % (`UMBRAL_FALLOS_PUBLICACION`, lib/admin/metrics.ts:118). Datos simulados: la agenda y las cuentas viven en el navegador.",
      "Proveedores: AssemblyAI (transcripción) y Gemini (análisis), con importes ya convertidos a dólares.",
    ],
    endpoints: [
      "backoffice.leer-mes",
      "backoffice.listar-meses",
      "backoffice.leer-series",
      "backoffice.listar-proyectos",
    ],
    datos: DATOS_INSTANTANEA,
    origen: [
      "app/[locale]/(admin)/admin/costes/page.tsx:71",
      "components/admin/costes-fuentes.tsx:71",
      "lib/admin/metrics.ts:2224",
    ],
    relacionadas: [
      "backoffice.reprocesar-proyecto",
      "backoffice.pedir-reconexion",
      "backoffice.exportar-costes",
    ],
  },
  {
    id: "backoffice.consultar-planes",
    area: "backoffice",
    titulo: "Revisar el negocio por plan",
    resumen:
      "Ve qué plan concentra el ingreso, cuánto cuesta servirlo, quién cuenta como cliente de pago y todas las suscripciones.",
    quien: ADMIN,
    donde: [{ ruta: "/admin/planes", etiqueta: "Planes" }],
    pasos: [
      "Abre «Planes» en la barra lateral.",
      "Lee «MRR por plan», «ARPPU», «Contribución tras IA» y «Altas y bajas de pago · 90 d».",
      "Debajo está «El catálogo», editable; luego «Una fila por plan», «Mezcla: clientes frente a MRR», «Qué cuenta como cliente de pago» y «Suscripciones».",
      "«Ver incoherencias» abre Usuarios con `?segmento=incoherencia`.",
    ],
    reglas: [
      "Contribución tras IA: MRR de los planes de pago − coste de IA del mes de sus usuarios; rojo por debajo del 80 %, ámbar si algún suscriptor baja del 70 % de margen.",
      "Gracia de 7 días (`GRACIA_DIAS`): una suscripción vencida sigue contando hasta 7 días después de la renovación fallida.",
      "Cada cuenta del catálogo está en el plan de su suscripción de pago vigente; sin ella, en Prueba.",
    ],
    endpoints: [
      "backoffice.leer-mes",
      "backoffice.listar-meses",
      "backoffice.listar-suscripciones",
      "backoffice.contar-cuentas-por-plan",
      "backoffice.listar-planes",
    ],
    datos: `${DATOS_INSTANTANEA} El catálogo, del almacén \`clipealo-planes-v1\`.`,
    origen: [
      "app/[locale]/(admin)/admin/planes/page.tsx:58",
      "app/[locale]/(admin)/admin/planes/page.tsx:231",
      "lib/admin/metrics.ts:84",
    ],
    relacionadas: ["backoffice.editar-plan", "backoffice.simular-contribucion"],
  },
  {
    id: "backoffice.consultar-usuarios",
    area: "backoffice",
    titulo: "Revisar usuarios, cohortes y canales",
    resumen:
      "Ve a las personas detrás de los números: quién se activa, quién convierte, quién usa sin pagar, quién está dormido y qué etiquetas de plan no cuadran.",
    quien: ADMIN,
    donde: [
      { ruta: "/admin/usuarios", etiqueta: "Usuarios" },
      { ruta: "/admin/usuarios?segmento=pql", etiqueta: "Usuarios PQL" },
    ],
    pasos: [
      "Abre «Usuarios» en la barra lateral (grupo «Clientes»).",
      "Lee «Usuarios activos 30 d», «Activación D7», «Conversión a 60 d» y «Usuarios PQL».",
      "Trabaja «Todos los usuarios» con sus filtros.",
      "En «Cohortes de alta», cambia entre «Funnel mensual», «Retención» y «Dormidos y ex-pagantes».",
      "Mira «Por país» y «Por canal de adquisición»; si hay etiquetas que no cuadran, sale el aviso con «Ver la lista» y «Reconciliar etiquetas».",
    ],
    reglas: [
      "Usuario activo: creó un proyecto en la ventana; la última actividad solo sirve para detectar pagantes inactivos.",
      "Activación D7: primer clip listo en los 7 días siguientes al alta.",
      "Pagantes activos por debajo del 70 % es aviso (`UMBRAL_PAGANTES_ACTIVOS_PCT`, lib/admin/metrics.ts:95); conversión de activados a pago por debajo del 8 % es alerta.",
      "Metas de conversión: 4 % a 60 días y 15 % entre activados (`META_CONV60_PCT`, lib/admin/metrics.ts:85).",
      "Retención M1: episódico por debajo del 20 %, núcleo desde el 35 %.",
      "Dormidos: se listan 10 como mucho (`DORMIDOS_LISTADOS`); el resto, por segmento en la tabla.",
    ],
    endpoints: [
      "backoffice.leer-mes",
      "backoffice.listar-meses",
      "backoffice.leer-series",
      "backoffice.listar-usuarios",
    ],
    datos: DATOS_INSTANTANEA,
    origen: [
      "app/[locale]/(admin)/admin/usuarios/page.tsx:49",
      "lib/admin/metrics.ts:95",
      "lib/admin/metrics.ts:112",
    ],
    relacionadas: [
      "backoffice.marcar-contactado",
      "backoffice.cambiar-plan-usuario",
      "backoffice.contactar-dormido",
    ],
  },
  {
    id: "backoffice.consultar-vencimientos",
    area: "backoffice",
    titulo: "Revisar vencimientos y cobros en riesgo",
    resumen:
      "Trabaja las colas de cobro y retención —pendientes de verificar, rechazados, vencidas, renovaciones con señal y pagantes inactivos— con importe, antigüedad y motivo.",
    quien: ADMIN,
    donde: [
      { ruta: "/admin/vencimientos", etiqueta: "Vencimientos y cobros" },
      { ruta: "/admin/vencimientos?cola=pendiente", etiqueta: "Cola «pendiente»" },
    ],
    pasos: [
      "Abre «Vencimientos» en la barra lateral (el número de la insignia son las colas de cobro).",
      "Lee «MRR en riesgo», «Renovaciones en 30 d», «Rechazados sin recuperar» y «Vencidas y pagos pendientes».",
      "Trabaja «Colas de cobro y retención»: una fila por suscripción, rojo primero.",
      "Abajo, «Bajas del mes».",
    ],
    reglas: [
      "Colas (lib/admin/metrics.ts:1994): pendiente de verificar; rechazado sin recuperar; vencida; próxima renovación; inactivo.",
      "Pago pendiente: ámbar pasadas 4 h, rojo pasadas 24 h.",
      "Rechazado: rojo con 3 o más intentos o 7 días vencida; si no, ámbar.",
      "Vencida: ámbar desde 3 días, rojo desde 7.",
      "Próxima renovación con señal: rojo si renueva en 7 días o menos, ámbar si no.",
      "Inactivo: rojo si no tiene proyectos en el ciclo y renueva en 15 días o menos.",
    ],
    endpoints: ["backoffice.leer-mes", "backoffice.listar-meses"],
    datos: DATOS_INSTANTANEA,
    origen: [
      "app/[locale]/(admin)/admin/vencimientos/page.tsx:40",
      "lib/admin/metrics.ts:2006",
      "app/[locale]/(admin)/admin/vencimientos/page.tsx:28",
    ],
    relacionadas: [
      "backoffice.atender-vencimiento",
      "backoffice.enviar-recordatorios-renovacion",
      "backoffice.programar-reintentos-rechazados",
    ],
  },
  {
    id: "backoffice.consultar-afiliados",
    area: "backoffice",
    titulo: "Revisar afiliados y sus comisiones",
    resumen:
      "Ve qué afiliado trae creadores que activan y pagan, cuánto se le debe a cada uno y desde cuándo, y cuánto se puede pagar por un cliente.",
    quien: ADMIN,
    donde: [{ ruta: "/admin/afiliados", etiqueta: "Afiliados" }],
    pasos: [
      "Abre «Afiliados» en la barra lateral (grupo «Crecimiento»).",
      "Lee «Comisión pendiente de liquidar», «CAC de afiliados · 90 d», «Pagantes atribuidos a afiliados» e «Ingreso atribuido 30 d · neto de comisión».",
      "Trabaja «Rendimiento y comisiones por código».",
      "En «Usuarios atribuidos por afiliado», despliega un afiliado para ver sus usuarios y sus acciones.",
      "Compara en «Canal afiliado frente al resto».",
    ],
    reglas: [
      "Pendiente = devengada − pagada; rojo si la más antigua pasa de 30 días.",
      "LTV:CAC por debajo de 1 es rojo; payback de más de 6 meses, aviso.",
      "Afiliados de la demo: CREADORESPE (25 %), PODLIMA (20 %), STREAMLATAM (30 %, pausado) y NEBULA (20 %).",
    ],
    endpoints: [
      "backoffice.leer-mes",
      "backoffice.listar-meses",
      "backoffice.listar-usuarios-afiliado",
    ],
    datos: DATOS_INSTANTANEA,
    origen: [
      "app/[locale]/(admin)/admin/afiliados/page.tsx:40",
      "lib/admin/mock-data.ts:275",
    ],
    relacionadas: [
      "backoffice.liquidar-comisiones",
      "backoffice.pausar-reactivar-afiliado",
      "backoffice.cambiar-comision-afiliado",
    ],
  },
  {
    id: "backoffice.consultar-referidos",
    area: "backoffice",
    titulo: "Revisar el programa de referidos",
    resumen:
      "Comprueba que el programa compensa y que ningún invitador se queda sin sus minutos.",
    quien: ADMIN,
    donde: [{ ruta: "/admin/referidos", etiqueta: "Referidos" }],
    pasos: [
      "Abre «Referidos» en la barra lateral.",
      "Lee «Recompensas pendientes», «Activación de invitados · 90 d», «Conversión de invitados · 90 d» y «Valor del programa · 90 d».",
      "Trabaja «Todos los referidos»: pendientes primero.",
      "Mira «Invitadores» y «Salud del programa».",
    ],
    reglas: [
      "Una recompensa pendiente es roja pasadas 48 h desde el primer pago del invitado (`SLA_RECOMPENSA_DIAS = 2`).",
      "Un minuto regalado vale US$ 29 ÷ 600 (`VALOR_MINUTO_RECOMPENSA`): la recompensa de 60 min vale US$ 2,90.",
      "Atascado: invitado registrado hace más de 14 días sin activar.",
    ],
    endpoints: [
      "backoffice.leer-mes",
      "backoffice.listar-meses",
      "backoffice.listar-referidos",
    ],
    datos: DATOS_INSTANTANEA,
    origen: [
      "app/[locale]/(admin)/admin/referidos/page.tsx:46",
      "app/[locale]/(admin)/admin/referidos/page.tsx:34",
      "lib/admin/metrics.ts:122",
    ],
    relacionadas: ["backoffice.otorgar-recompensas", "backoffice.recordar-invitado"],
  },
  {
    id: "backoffice.consultar-mercado",
    area: "backoffice",
    titulo: "Leer el mercado por nicho y país",
    resumen:
      "Compara la oferta de cliperos con el dinero activo, celda a celda, para saber qué nichos captar, a qué sectores vender, qué CPM recomendar y a qué creadores llamar.",
    quien: ADMIN,
    donde: [{ ruta: "/admin/mercado", etiqueta: "Mercado" }],
    pasos: [
      "Abre «Mercado» en la barra lateral (grupo «Creadores»).",
      "Lee «Cliperos con perfil», «Dinero sin quien lo clipee», «Celdas en escasez» y «Celdas con excedente».",
      "Recorre «Cobertura por nicho y país», «Huecos: dónde falta gente», «Excedentes: a quién vender», «CPM que llena por sector», «Creadores con fans y sin campaña» y «Calidad del dato».",
    ],
    reglas: [
      "Cobertura = cliperos ponderados por cada US$ 1.000 activos, en una ventana de 28 días.",
      "Estados: sin oferta, escasez (cobertura < 2 con al menos US$ 500), equilibrio, excedente (cobertura > 20) y sin datos. El estado va escrito, no solo en color.",
      "Una celda con menos de 10 personas no enseña su cifra; nada de aquí nombra a nadie.",
      "Sin selector de mes: siempre el mes en curso. La cabecera solo dice «Actualizado el {fecha} · {zona}», sin la insignia «Hasta hoy»: la página no le pasa el mes a `AdminPage` (app/[locale]/(admin)/admin/mercado/page.tsx:80).",
      "Datos simulados hasta conectar la API, y la página lo dice.",
    ],
    endpoints: [
      "backoffice.leer-mercado",
      "backoffice.leer-mes",
      "backoffice.leer-sincronizacion",
    ],
    datos: DATOS_INSTANTANEA,
    origen: [
      "app/[locale]/(admin)/admin/mercado/page.tsx:49",
      "lib/mercado.ts:41",
      "lib/mercado.ts:345",
    ],
  },
]

/* ---------------------------------------------------------------------------
   Cobros (Ingresos y Vencimientos)
   --------------------------------------------------------------------------- */

const COBROS: Accion[] = [
  {
    id: "backoffice.aprobar-pago",
    area: "backoffice",
    titulo: "Aprobar un pago pendiente",
    resumen:
      "Da por bueno un pago pendiente de verificar y activa la suscripción que paga.",
    quien: ADMIN,
    donde: [
      { ruta: "/admin/ingresos", etiqueta: "Ingresos › Pagos" },
      {
        ruta: "/admin/vencimientos?cola=pendiente",
        etiqueta: "Vencimientos › cola «pendiente» › «Verificar pago»",
      },
    ],
    pasos: [
      "En «Pagos», filtra «Estado: Pendientes»: los pendientes ya salen arriba.",
      "Localiza el pago, p. ej. el de Lucía Peña, US$ 39 (Empresa, renovación mensual por transferencia).",
      "Pulsa «Aprobar».",
      "El mismo cobro sale en Vencimientos, cola «pendiente», con el botón «Verificar pago»; la fila «Verificar pago» del Panel lleva ahí.",
    ],
    reglas: [
      "Solo los pagos «pendiente» tienen «Aprobar» y «Rechazar» (components/admin/ingresos-pagos-table.tsx:44).",
      "El efecto anunciado: marcar el pago como aprobado y activar su suscripción (admin.ingresos.table.approveEffect).",
      "En Vencimientos, la fila de un pago pendiente se pone ámbar pasadas 4 h y roja pasadas 24 h (lib/admin/metrics.ts:2009).",
    ],
    estados: [
      { estado: "pendiente", significa: "Llegó y nadie lo ha verificado." },
      {
        estado: "aprobado",
        significa: "Cobrado: cuenta en la caja y activa la suscripción.",
      },
    ],
    endpoints: ["backoffice.aprobar-pago", "backoffice.listar-pagos"],
    datos: DATOS_MOCK,
    respuesta: RESPUESTA_MOCK,
    origen: ["components/admin/ingresos-pagos-table.tsx:47", "lib/admin/metrics.ts:2009"],
    relacionadas: ["backoffice.rechazar-pago", "backoffice.atender-vencimiento"],
  },
  {
    id: "backoffice.rechazar-pago",
    area: "backoffice",
    titulo: "Rechazar un pago pendiente",
    resumen: "Rechaza un pago por verificar y avisa al usuario para que reintente.",
    quien: ADMIN,
    donde: [{ ruta: "/admin/ingresos", etiqueta: "Ingresos › Pagos" }],
    pasos: ["En «Pagos», localiza el pago pendiente.", "Pulsa «Rechazar»."],
    reglas: [
      "Solo sobre pagos «pendiente».",
      "El efecto anunciado: rechazar el pago y avisar al usuario para que reintente (admin.ingresos.table.rejectEffect).",
      "Con el último cobro rechazado, la suscripción entra en la cola «rechazado» de Vencimientos si está vencida o pendiente de pago (lib/admin/metrics.ts:1995).",
    ],
    endpoints: ["backoffice.rechazar-pago"],
    datos: DATOS_MOCK,
    respuesta: RESPUESTA_MOCK,
    origen: ["components/admin/ingresos-pagos-table.tsx:58", "lib/admin/metrics.ts:1995"],
    relacionadas: ["backoffice.aprobar-pago", "backoffice.reintentar-cobro"],
  },
  {
    id: "backoffice.reintentar-cobro",
    area: "backoffice",
    titulo: "Reintentar un cobro rechazado",
    resumen: "Vuelve a intentar un cobro que rechazó la pasarela, por el mismo método.",
    quien: ADMIN,
    donde: [
      { ruta: "/admin/ingresos", etiqueta: "Ingresos › Pagos" },
      {
        ruta: "/admin/vencimientos?cola=rechazado",
        etiqueta: "Vencimientos › «Reintentar cobro»",
      },
    ],
    pasos: [
      "En «Pagos», filtra «Estado: Rechazados».",
      "Mira el motivo de la pasarela (fondos insuficientes, tarjeta vencida, rechazada por el emisor, tiempo de Yape agotado).",
      "Pulsa «Reintentar».",
    ],
    reglas: [
      "Solo sobre pagos «rechazado».",
      "El motivo del rechazo es un código de la pasarela que la interfaz traduce (`FAILURE_REASONS`, lib/admin/types.ts:265).",
      "Si no se puede cobrar por el mismo método, la alternativa es un pago manual por Yape o transferencia.",
    ],
    endpoints: ["backoffice.reintentar-cobro"],
    datos: DATOS_MOCK,
    respuesta: RESPUESTA_MOCK,
    origen: ["components/admin/ingresos-pagos-table.tsx:70"],
    relacionadas: [
      "backoffice.registrar-pago-manual",
      "backoffice.programar-reintentos-rechazados",
    ],
  },
  {
    id: "backoffice.reembolsar-pago",
    area: "backoffice",
    titulo: "Reembolsar un pago",
    resumen:
      "Registra el reembolso de un pago aprobado y deshace lo que arrastraba: la comisión del afiliado y la recompensa del referido.",
    quien: ADMIN,
    donde: [{ ruta: "/admin/ingresos", etiqueta: "Ingresos › Pagos" }],
    pasos: [
      "En «Pagos», localiza el pago aprobado (p. ej. el de Mateo Herrera, US$ 29, atribuido a PODLIMA).",
      "Pulsa «Reembolsar». El aviso dice qué más se toca: «restaría US$ 5,80 de la comisión del afiliado», o «marcaría la recompensa del referido como no procedente», o las dos cosas.",
    ],
    reglas: [
      "Solo sobre pagos «aprobado».",
      "Si el pago tenía comisión, se resta de la del afiliado; si era el primer pago de un invitado, la recompensa de quien invitó pasa a «no procede».",
      "La tabla deduce la causa probable: «pipeline» si hubo un proyecto en error en los 7 días anteriores, «duplicado» si hay otro aprobado del mismo importe a menos de un día.",
    ],
    estados: [
      { estado: "reembolsado", significa: "Devuelto: resta en la caja y en el LTV." },
    ],
    endpoints: ["backoffice.reembolsar-pago"],
    datos: DATOS_MOCK,
    respuesta: RESPUESTA_MOCK,
    origen: ["components/admin/ingresos-pagos-table.tsx:82", "lib/admin/rows.ts:236"],
  },
  {
    id: "backoffice.registrar-pago-manual",
    area: "backoffice",
    titulo: "Registrar un pago manual",
    resumen:
      "Apunta un pago que llegó fuera de la pasarela (Yape, Plin o transferencia) con su comprobante.",
    quien: ADMIN,
    donde: [{ ruta: "/admin/ingresos", etiqueta: "Ingresos › Pagos › Pago manual" }],
    pasos: [
      "En la sección «Pagos», pulsa «Pago manual».",
      "Hoy sale «Acción simulada» con lo que abriría: un formulario con usuario, plan, importe y método (Yape, Plin o transferencia) y el comprobante.",
    ],
    reglas: [
      "Métodos manuales: Yape, Plin y transferencia, los de `PAYMENT_METHODS` menos tarjeta (lib/admin/types.ts:247).",
      "El formulario no existe todavía: el botón solo anuncia lo que haría (admin.ingresos.pagos.manualEffect).",
    ],
    endpoints: ["backoffice.registrar-pago-manual"],
    datos: DATOS_MOCK,
    respuesta: RESPUESTA_MOCK,
    origen: [
      "app/[locale]/(admin)/admin/ingresos/page.tsx:220",
      "lib/admin/types.ts:247",
    ],
    relacionadas: ["backoffice.reintentar-cobro"],
  },
  {
    id: "backoffice.exportar-pagos",
    area: "backoffice",
    titulo: "Exportar los pagos en CSV",
    resumen:
      "Descarga los pagos del mes con los filtros aplicados y las mismas columnas de la tabla.",
    quien: ADMIN,
    donde: [{ ruta: "/admin/ingresos", etiqueta: "Ingresos › Pagos › Exportar CSV" }],
    pasos: [
      "Aplica los filtros que quieras en «Pagos» y elige el mes.",
      "Pulsa «Exportar CSV».",
    ],
    reglas: ["El CSV lleva las filas filtradas, con las columnas de la tabla."],
    endpoints: ["backoffice.exportar-pagos"],
    datos: DATOS_MOCK,
    respuesta: RESPUESTA_MOCK,
    origen: ["app/[locale]/(admin)/admin/ingresos/page.tsx:223"],
  },
  {
    id: "backoffice.enviar-recordatorios-renovacion",
    area: "backoffice",
    titulo: "Mandar recordatorios de renovación",
    resumen:
      "Manda un recordatorio con enlace de pago a las renovaciones de los próximos 30 días que tienen alguna señal de riesgo.",
    quien: ADMIN,
    donde: [
      {
        ruta: "/admin/vencimientos",
        etiqueta: "Vencimientos › Colas de cobro y retención › Recordatorios ({n})",
      },
    ],
    pasos: ["En «Colas de cobro y retención», pulsa «Recordatorios ({n})» (hoy 4)."],
    reglas: [
      "Solo sale si hay renovaciones con señal en 30 días.",
      "El número son las renovaciones de los próximos 30 días que no están en verde (`conSenal`, lib/admin/metrics.ts:2099): con alguna señal de riesgo, o que renuevan en 7 días o menos.",
      "Señales de riesgo: rechazo previo, vencida en gracia, pago sin verificar, último cobro rechazado, inactivo 14 d o sin proyectos en el ciclo; la primera renovación se marca pero no cuenta como riesgo (`SENALES`, lib/admin/metrics.ts:149).",
    ],
    endpoints: ["backoffice.enviar-recordatorios"],
    datos: DATOS_MOCK,
    respuesta: RESPUESTA_MOCK,
    origen: [
      "app/[locale]/(admin)/admin/vencimientos/page.tsx:229",
      "lib/admin/metrics.ts:2099",
    ],
    relacionadas: ["backoffice.atender-vencimiento"],
  },
  {
    id: "backoffice.programar-reintentos-rechazados",
    area: "backoffice",
    titulo: "Reintentar todos los cobros rechazados",
    resumen: "Programa el reintento automático de los cobros rechazados: día 1, 3 y 7.",
    quien: ADMIN,
    donde: [
      {
        ruta: "/admin/vencimientos",
        etiqueta:
          "Vencimientos › Colas de cobro y retención › Reintentar rechazados ({n})",
      },
    ],
    pasos: ["Pulsa «Reintentar rechazados ({n})» (hoy 1, por US$ 29)."],
    reglas: [
      "Calendario fijo de reintentos: día 1, 3 y 7.",
      "Solo sale si hay rechazados sin recuperar.",
    ],
    endpoints: ["backoffice.programar-reintentos"],
    datos: DATOS_MOCK,
    respuesta: RESPUESTA_MOCK_BRAND,
    origen: ["app/[locale]/(admin)/admin/vencimientos/page.tsx:238"],
    relacionadas: ["backoffice.reintentar-cobro"],
  },
  {
    id: "backoffice.atender-vencimiento",
    area: "backoffice",
    titulo: "Atender una fila de vencimientos",
    resumen:
      "Hace lo que toca con una suscripción en cola: verificar el pago, reintentar, mandar enlace, recordar o contactar.",
    quien: ADMIN,
    donde: [
      {
        ruta: "/admin/vencimientos",
        etiqueta: "Vencimientos › Colas de cobro y retención",
      },
    ],
    pasos: [
      "Localiza la fila (rojo primero, luego por días restantes).",
      "Pulsa el botón de su columna de acción: «Verificar pago», «Reintentar cobro», «Enviar enlace Yape/Plin», «Contactar o pasar a Prueba», «Recordatorio de renovación», «Recordatorio previo» o «Mensaje personal».",
    ],
    reglas: [
      "La acción la decide la cola (lib/admin/metrics.ts:2006): pendiente → verificar pago; rechazado → reintentar cobro con tarjeta o enlace Yape/Plin si paga a mano; vencida → recordatorio hasta 7 días y, pasados, contactar o pasar a Prueba; próxima renovación con señal → recordatorio previo; inactivo → mensaje personal.",
      "Una próxima renovación sin señal sale como «Sin acción», sin botón.",
    ],
    endpoints: [
      "backoffice.aprobar-pago",
      "backoffice.reintentar-cobro",
      "backoffice.enviar-enlace-pago",
      "backoffice.enviar-recordatorios",
      "backoffice.registrar-contacto",
      "backoffice.cambiar-plan-usuario",
    ],
    datos: DATOS_MOCK,
    respuesta: RESPUESTA_MOCK,
    origen: ["components/admin/vencimientos-table.tsx:293", "lib/admin/metrics.ts:2014"],
    relacionadas: ["backoffice.consultar-vencimientos"],
  },
]

/* ---------------------------------------------------------------------------
   Usuarios
   --------------------------------------------------------------------------- */

const USUARIOS: Accion[] = [
  {
    id: "backoffice.marcar-contactado",
    area: "backoffice",
    titulo: "Marcar a un usuario como contactado",
    resumen:
      "Deja la fecha y una nota de que se habló con alguien: es lo que mide el cierre de PQL y la reactivación.",
    quien: ADMIN,
    donde: [{ ruta: "/admin/usuarios", etiqueta: "Usuarios › Todos los usuarios" }],
    pasos: [
      "Localiza a la persona (p. ej. filtra «Segmento: PQL»).",
      "Pulsa «Contactado» en su fila.",
    ],
    reglas: ["Registra la fecha de hoy y la nota del operador."],
    endpoints: ["backoffice.registrar-contacto"],
    datos: DATOS_MOCK,
    respuesta: RESPUESTA_MOCK,
    origen: ["components/admin/usuarios-table.tsx:353"],
    relacionadas: ["backoffice.contactar-dormido"],
  },
  {
    id: "backoffice.cambiar-plan-usuario",
    area: "backoffice",
    titulo: "Cambiar el plan de un usuario",
    resumen:
      "Pone a alguien en otro plan, le da una cortesía o lo pasa a Prueba conservando sus proyectos, con motivo.",
    quien: ADMIN,
    donde: [{ ruta: "/admin/usuarios", etiqueta: "Usuarios › Todos los usuarios" }],
    pasos: [
      "Localiza a la persona en la tabla.",
      "Pulsa «Cambiar plan» en su fila.",
      "Hoy sale «Acción simulada» con lo que abriría: plan destino, cortesía o paso a Prueba conservando proyectos, con motivo.",
    ],
    reglas: [
      "Pasar a Prueba conserva los proyectos (admin.usuarios.table.changePlanEffect).",
      "Una cortesía (importe 0) no cuenta como cliente de pago ni en el MRR (`isPayingAt`, lib/admin/metrics.ts:951).",
      "El diálogo no existe todavía: el botón solo anuncia el cambio.",
    ],
    endpoints: ["backoffice.cambiar-plan-usuario"],
    datos: DATOS_MOCK,
    respuesta: RESPUESTA_MOCK,
    origen: ["components/admin/usuarios-table.tsx:362", "lib/admin/metrics.ts:951"],
    relacionadas: ["backoffice.reconciliar-etiquetas"],
  },
  {
    id: "backoffice.reconciliar-etiquetas",
    area: "backoffice",
    titulo: "Reconciliar etiquetas de plan",
    resumen:
      "Pasa a Prueba a quien tiene etiqueta de plan de pago sin suscripción de pago detrás, conservando sus proyectos.",
    quien: ADMIN,
    donde: [{ ruta: "/admin/usuarios", etiqueta: "Usuarios › aviso de incoherencias" }],
    pasos: [
      "Si hay incoherencias, sale el aviso «{n} usuarios con etiqueta de plan de pago y sin suscripción de cliente de pago».",
      "«Ver la lista» abre la tabla con `?segmento=incoherencia`.",
      "Pulsa «Reconciliar etiquetas».",
    ],
    reglas: [
      "El aviso solo aparece con al menos una incoherencia (hoy, ninguna).",
      "Una suscripción vencida o pendiente de pago no es incoherencia: ya está en la cola de cobro.",
      "La etiqueta manda en el producto y la suscripción en el ingreso: mientras no coincidan, alguien usa un plan que no paga.",
    ],
    endpoints: ["backoffice.reconciliar-planes"],
    datos: DATOS_MOCK,
    respuesta: RESPUESTA_MOCK,
    origen: [
      "app/[locale]/(admin)/admin/usuarios/page.tsx:403",
      "lib/admin/metrics.ts:979",
    ],
  },
  {
    id: "backoffice.contactar-dormido",
    area: "backoffice",
    titulo: "Contactar a un dormido o ex-pagante",
    resumen:
      "Manda un mensaje de reactivación a quien activó y lleva de 30 a 180 días sin entrar, con oferta de vuelta si pagó alguna vez.",
    quien: ADMIN,
    donde: [
      {
        ruta: "/admin/usuarios",
        etiqueta: "Usuarios › Cohortes de alta › Dormidos y ex-pagantes",
      },
    ],
    pasos: [
      "En «Cohortes de alta», abre la pestaña «Dormidos y ex-pagantes».",
      "Localiza a la persona (p. ej. Renata Chávez, activada en Prueba, 211 min).",
      "Pulsa «Contactar».",
    ],
    reglas: [
      "Ex-pagantes primero: si vuelven, la baja era de precio o de cobro, no de producto.",
      "A los ex-pagantes el mensaje lleva oferta de vuelta.",
      "La reactivación se mide como «contactados que crean un proyecto en 30 d» desde la fecha de contacto, así que el botón la registra.",
    ],
    endpoints: ["backoffice.registrar-contacto"],
    datos: DATOS_MOCK,
    respuesta: RESPUESTA_MOCK,
    origen: ["components/admin/usuarios-dormidos.tsx:122", "lib/admin/metrics.ts:1021"],
    relacionadas: ["backoffice.marcar-contactado"],
  },
]

/* ---------------------------------------------------------------------------
   Costes de IA
   --------------------------------------------------------------------------- */

const COSTES: Accion[] = [
  {
    id: "backoffice.exportar-costes",
    area: "backoffice",
    titulo: "Exportar los costes del mes",
    resumen:
      "Descarga el CSV de costes: una fila por proyecto con su desglose por proveedor y modelo.",
    quien: ADMIN,
    donde: [{ ruta: "/admin/costes", etiqueta: "Costes de IA › Proyectos con coste" }],
    pasos: ["Elige el mes y pulsa «Exportar costes del mes»."],
    reglas: ["Importes en dólares, ya convertidos."],
    endpoints: ["backoffice.exportar-costes"],
    datos: DATOS_MOCK,
    respuesta: RESPUESTA_MOCK,
    origen: ["app/[locale]/(admin)/admin/costes/page.tsx:311"],
  },
  {
    id: "backoffice.reprocesar-proyecto",
    area: "backoffice",
    titulo: "Reprocesar un proyecto",
    resumen: "Vuelve a encolar un proyecto en error o atascado, sabiendo lo que costará.",
    quien: ADMIN,
    donde: [{ ruta: "/admin/costes", etiqueta: "Costes de IA › Proyectos con coste" }],
    pasos: [
      "En «Proyectos con coste», filtra «Estado: Error» o «Solo errores».",
      "Pulsa «Reprocesar» en la fila (p. ej. `prj_1119` de Fabián Ortiz, Kick, 35 min).",
    ],
    reglas: [
      "Solo en proyectos que no están «listo».",
      "El coste estimado es el mayor entre lo ya gastado y coste por minuto × minutos.",
      "Revisar antes de reprocesar si el proyecto es anómalo.",
    ],
    endpoints: ["backoffice.reprocesar-proyecto"],
    datos: DATOS_MOCK,
    respuesta: RESPUESTA_MOCK,
    origen: ["components/admin/costes-table.tsx:212"],
    relacionadas: [
      "backoffice.reprocesar-sin-resolver",
      "backoffice.marcar-anomalia-revisada",
    ],
  },
  {
    id: "backoffice.reprocesar-sin-resolver",
    area: "backoffice",
    titulo: "Reprocesar todos los errores sin resolver",
    resumen:
      "Reencola de una vez los proyectos en error que nadie ha rehecho, los de clientes de pago primero.",
    quien: ADMIN,
    donde: [{ ruta: "/admin/costes", etiqueta: "Costes de IA › Salud del pipeline" }],
    pasos: ["En «Salud del pipeline», pulsa «Reprocesar sin resolver»."],
    reglas: [
      "Sin resolver: en error y sin un proyecto listo posterior del mismo usuario con la misma fuente (hoy 29).",
      "El botón está apagado si no hay ninguno.",
    ],
    endpoints: ["backoffice.reprocesar-sin-resolver"],
    datos: DATOS_MOCK,
    respuesta: RESPUESTA_MOCK,
    origen: ["app/[locale]/(admin)/admin/costes/page.tsx:340"],
  },
  {
    id: "backoffice.cancelar-atascados",
    area: "backoffice",
    titulo: "Cancelar los proyectos atascados",
    resumen:
      "Cancela los proyectos que llevan más de dos horas procesando y avisa a sus usuarios para que los suban otra vez.",
    quien: ADMIN,
    donde: [{ ruta: "/admin/costes", etiqueta: "Costes de IA › Salud del pipeline" }],
    pasos: ["En «Salud del pipeline», pulsa «Cancelar atascados»."],
    reglas: [
      "Atascado: más de 2 horas «procesando» (hoy 5).",
      "El botón está apagado si no hay ninguno.",
    ],
    endpoints: ["backoffice.cancelar-atascados"],
    datos: DATOS_MOCK,
    respuesta: RESPUESTA_MOCK,
    origen: [
      "app/[locale]/(admin)/admin/costes/page.tsx:332",
      "lib/admin/metrics.ts:2389",
    ],
  },
  {
    id: "backoffice.marcar-anomalia-revisada",
    area: "backoffice",
    titulo: "Marcar una anomalía de coste como revisada",
    resumen:
      "Deja constancia de que un proyecto con coste anómalo se ha mirado, con la nota del operador.",
    quien: ADMIN,
    donde: [
      { ruta: "/admin/costes", etiqueta: "Costes de IA › Coste anómalo · 30 d" },
      {
        ruta: "/admin/costes",
        etiqueta: "Costes de IA › Proyectos con coste (filtro «Solo anómalos»)",
      },
    ],
    pasos: ["Pulsa «Marcar revisado» en la fila del proyecto anómalo."],
    reglas: [
      "Anómalo: coste mayor que 3 veces la mediana de 30 d, o coste por minuto mayor que 2 veces la suya.",
    ],
    endpoints: ["backoffice.marcar-anomalia-revisada"],
    datos: DATOS_MOCK,
    respuesta: RESPUESTA_MOCK,
    origen: [
      "components/admin/costes-anomalias.tsx:119",
      "components/admin/costes-table.tsx:229",
    ],
  },
  {
    id: "backoffice.deshabilitar-fuente",
    area: "backoffice",
    titulo: "Deshabilitar una fuente de video",
    resumen:
      "Quita temporalmente una fuente de la subida mientras su tasa de error es alta.",
    quien: ADMIN,
    donde: [
      { ruta: "/admin/costes", etiqueta: "Costes de IA › Salud del pipeline" },
      { ruta: "/admin/costes", etiqueta: "Costes de IA › Rendimiento por fuente · 30 d" },
    ],
    pasos: ["Pulsa «Deshabilitar» en la fila de la fuente."],
    reglas: [
      "En «Salud del pipeline», el botón sale con más del 20 % de errores en 7 días (components/admin/costes-pipeline.tsx:140).",
      "En «Rendimiento por fuente», con al menos 5 proyectos y menos del 80 % de éxito.",
    ],
    endpoints: ["backoffice.cambiar-fuente"],
    datos: DATOS_MOCK,
    respuesta: RESPUESTA_MOCK,
    origen: [
      "components/admin/costes-pipeline.tsx:167",
      "components/admin/costes-fuentes.tsx:71",
    ],
  },
  {
    id: "backoffice.revisar-conector",
    area: "backoffice",
    titulo: "Abrir una incidencia de conector",
    resumen: "Abre una incidencia cuando una fuente con uso histórico se queda a cero.",
    quien: ADMIN,
    donde: [
      { ruta: "/admin/costes", etiqueta: "Costes de IA › Rendimiento por fuente · 30 d" },
    ],
    pasos: ["Pulsa «Revisar conector» en la fila de la fuente."],
    reglas: ["Sale con más de 20 proyectos históricos y ninguno en 30 días."],
    endpoints: ["backoffice.abrir-incidencia-fuente"],
    datos: DATOS_MOCK,
    respuesta: RESPUESTA_MOCK,
    origen: ["components/admin/costes-fuentes.tsx:133", "lib/admin/metrics.ts:2224"],
  },
  {
    id: "backoffice.pedir-reconexion",
    area: "backoffice",
    titulo: "Pedir que reconecten las cuentas caducadas",
    resumen:
      "Escribe a quien tiene cuentas sociales caducadas para que las reconecte: los envíos que esperan salen en cuanto lo haga.",
    quien: ADMIN,
    donde: [{ ruta: "/admin/costes", etiqueta: "Costes de IA › Salud de publicación" }],
    pasos: [
      "En «Salud de publicación», pulsa «Pedir reconexión ({n})» (hoy 13 cuentas caducadas).",
    ],
    reglas: [
      "Es la única acción naranja de la página: reconectar es lo que desatasca los envíos que esperan.",
      "Apagado si no hay cuentas caducadas.",
      "Datos simulados: las cuentas viven hoy en el navegador (`clipealo-cuentas-v1`).",
    ],
    endpoints: ["backoffice.pedir-reconexion"],
    datos: DATOS_MOCK,
    respuesta: RESPUESTA_MOCK_BRAND,
    origen: [
      "app/[locale]/(admin)/admin/costes/page.tsx:373",
      "app/[locale]/(admin)/admin/costes/page.tsx:96",
    ],
  },
  {
    id: "backoffice.restringir-modelo-caro",
    area: "backoffice",
    titulo: "Restringir el modelo caro a planes de pago",
    resumen:
      "Deja el modelo de análisis más caro solo para los planes de pago; Prueba pasa al económico.",
    quien: ADMIN,
    donde: [{ ruta: "/admin/costes", etiqueta: "Costes de IA › Proveedor y modelo" }],
    pasos: ["En «Proveedor y modelo», pulsa «Restringir modelo caro a pago»."],
    reglas: [
      "El efecto anunciado: el modelo de análisis más caro queda para los planes de pago y Prueba pasa al económico (admin.costes.modelos.restrictEffect).",
      "Hoy el botón solo lo anuncia: no hay política de modelos guardada en ningún sitio.",
    ],
    endpoints: ["backoffice.cambiar-politica-ia"],
    datos: DATOS_MOCK,
    respuesta: RESPUESTA_MOCK,
    origen: ["app/[locale]/(admin)/admin/costes/page.tsx:400"],
  },
  {
    id: "backoffice.poner-tope-minutos-prueba",
    area: "backoffice",
    titulo: "Poner tope de minutos por proyecto en Prueba",
    resumen:
      "Limita los minutos por proyecto del plan Prueba (propuesta: 20 min) y avisa a los afectados.",
    quien: ADMIN,
    donde: [
      { ruta: "/admin/costes", etiqueta: "Costes de IA › Top 10 de Prueba por coste" },
    ],
    pasos: ["En «Top 10 de Prueba por coste», pulsa «Tope de minutos en Prueba»."],
    reglas: [
      "Es un tope por proyecto; el de minutos al mes del plan (60 en Prueba) está en el catálogo de planes.",
    ],
    endpoints: ["backoffice.cambiar-politica-ia"],
    datos: DATOS_MOCK,
    respuesta: RESPUESTA_MOCK,
    origen: ["app/[locale]/(admin)/admin/costes/page.tsx:413"],
    relacionadas: ["backoffice.editar-plan"],
  },
  {
    id: "backoffice.bloquear-cuenta-prueba",
    area: "backoffice",
    titulo: "Bloquear una cuenta de Prueba por coste",
    resumen:
      "Bloquea una cuenta de Prueba sin pagos que consume demasiada IA y le avisa por correo.",
    quien: ADMIN,
    donde: [
      { ruta: "/admin/costes", etiqueta: "Costes de IA › Top 10 de Prueba por coste" },
    ],
    pasos: [
      "En «Top 10 de Prueba por coste», localiza la cuenta (p. ej. Gonzalo Herrera, 70 min, US$ 0,14).",
      "Pulsa «Bloquear».",
    ],
    reglas: [
      "Solo cuentas de Prueba sin ningún pago: son las que lista el top.",
      "Una cuenta suspendida deja de contar como PQL.",
    ],
    endpoints: ["backoffice.bloquear-usuario"],
    datos: DATOS_MOCK,
    respuesta: RESPUESTA_MOCK,
    origen: ["components/admin/costes-top-free.tsx:97"],
  },
]

/* ---------------------------------------------------------------------------
   Afiliados y referidos
   --------------------------------------------------------------------------- */

const PROGRAMAS: Accion[] = [
  {
    id: "backoffice.liquidar-comisiones",
    area: "backoffice",
    titulo: "Liquidar comisiones de afiliados",
    resumen:
      "Paga la comisión pendiente de uno o de todos los afiliados y la registra con fecha de hoy.",
    quien: ADMIN,
    donde: [
      { ruta: "/admin/afiliados", etiqueta: "Afiliados › Liquidar pendientes · {monto}" },
      {
        ruta: "/admin/afiliados",
        etiqueta: "Afiliados › Rendimiento y comisiones por código › Liquidar",
      },
    ],
    pasos: [
      "Para todos: en la cabecera, pulsa «Liquidar pendientes · US$ 15,55».",
      "Para uno: pulsa «Liquidar» en su fila (p. ej. CREADORESPE, US$ 9,75).",
    ],
    reglas: [
      "El botón de la cabecera solo sale si hay comisión pendiente; el de cada fila, si ese afiliado la tiene.",
      "Pendiente = devengada − pagada. La comisión pagada lleva la fecha de hoy.",
    ],
    endpoints: ["backoffice.liquidar-comisiones"],
    datos: DATOS_MOCK,
    respuesta: `${RESPUESTA_MOCK_BRAND} El «Liquidar» de cada fila no es la acción principal: aviso neutro sin sonido.`,
    origen: [
      "app/[locale]/(admin)/admin/afiliados/page.tsx:150",
      "components/admin/afiliados-table.tsx:68",
    ],
  },
  {
    id: "backoffice.pausar-reactivar-afiliado",
    area: "backoffice",
    titulo: "Pausar o reactivar un código de afiliado",
    resumen:
      "Deja de atribuir altas nuevas a un código (o vuelve a hacerlo) sin tocar lo devengado.",
    quien: ADMIN,
    donde: [
      {
        ruta: "/admin/afiliados",
        etiqueta: "Afiliados › Rendimiento y comisiones por código",
      },
    ],
    pasos: [
      "Pulsa «Pausar» (o «Reactivar» si ya está pausado, como STREAMLATAM) en la fila del código.",
    ],
    reglas: [
      "Pausado deja de atribuir altas nuevas; las comisiones ya devengadas se conservan.",
      "Reactivado vuelve a atribuir desde hoy.",
    ],
    estados: [
      { estado: "activo", significa: "Atribuye altas y devenga comisión." },
      { estado: "pausado", significa: "No atribuye altas nuevas." },
    ],
    endpoints: ["backoffice.editar-afiliado"],
    datos: DATOS_MOCK,
    respuesta: RESPUESTA_MOCK,
    origen: ["components/admin/afiliados-table.tsx:80"],
  },
  {
    id: "backoffice.cambiar-comision-afiliado",
    area: "backoffice",
    titulo: "Cambiar el % de comisión de un afiliado",
    resumen:
      "Fija un nuevo porcentaje de comisión con fecha de efecto; los pagos anteriores conservan el suyo.",
    quien: ADMIN,
    donde: [
      {
        ruta: "/admin/afiliados",
        etiqueta: "Afiliados › Rendimiento y comisiones por código",
      },
    ],
    pasos: [
      "Pulsa «Cambiar %» en la fila del código (p. ej. CREADORESPE, hoy 25 %).",
      "Hoy sale «Acción simulada» con lo que abriría: un formulario para fijar el nuevo % con fecha de efecto.",
    ],
    reglas: [
      "Los pagos anteriores conservan el % vigente (admin.afiliados.actions.rateEffect).",
      "El formulario no existe todavía: el botón solo lo anuncia.",
    ],
    endpoints: ["backoffice.editar-afiliado"],
    datos: DATOS_MOCK,
    respuesta: RESPUESTA_MOCK,
    origen: ["components/admin/afiliados-table.tsx:98"],
  },
  {
    id: "backoffice.otorgar-recompensas",
    area: "backoffice",
    titulo: "Otorgar recompensas de referidos",
    resumen:
      "Da los minutos de regalo a quien invitó cuando su invitado ya pagó, y le avisa por correo.",
    quien: ADMIN,
    donde: [{ ruta: "/admin/referidos", etiqueta: "Referidos › Todos los referidos" }],
    pasos: [
      "Para todas: pulsa «Otorgar la pendiente» u «Otorgar las {n} pendientes» junto al título de la tabla.",
      "Para una: pulsa «Otorgar» en su fila (p. ej. Micaela Rojas, 60 min por invitar a Santiago Arias).",
    ],
    reglas: [
      "Solo recompensas pendientes: invitado convertido y minutos sin dar.",
      "Pasadas 48 h desde el primer pago del invitado, la pendiente es roja.",
      "60 min valen US$ 2,90 (US$ 29 ÷ 600 el minuto).",
    ],
    estados: [
      {
        estado: "pendiente",
        significa: "El invitado pagó y los minutos no se han dado.",
      },
      { estado: "otorgada", significa: "Minutos dados." },
      {
        estado: "no-procede",
        significa:
          "Hoy, el invitado aún no ha pagado (`computeReferralRows`, lib/admin/rows.ts:370). «No procede» la pondría también a mano por reembolso o fraude, cuando exista.",
      },
    ],
    endpoints: ["backoffice.otorgar-recompensas"],
    datos: DATOS_MOCK,
    respuesta: `${RESPUESTA_MOCK_BRAND} El «Otorgar» de cada fila: aviso neutro sin sonido.`,
    origen: [
      "app/[locale]/(admin)/admin/referidos/page.tsx:225",
      "components/admin/referidos-table.tsx:263",
      "lib/admin/rows.ts:370",
    ],
    relacionadas: ["backoffice.anular-recompensa-referido"],
  },
  {
    id: "backoffice.anular-recompensa-referido",
    area: "backoffice",
    titulo: "Marcar una recompensa como no procedente",
    resumen:
      "Anula la recompensa pendiente de un referido por reembolso o fraude, con su motivo.",
    quien: ADMIN,
    donde: [{ ruta: "/admin/referidos", etiqueta: "Referidos › Todos los referidos" }],
    pasos: ["Pulsa «No procede» en la fila con la recompensa pendiente."],
    reglas: ["Solo sobre recompensas pendientes. Guarda el motivo."],
    endpoints: ["backoffice.anular-recompensa"],
    datos: DATOS_MOCK,
    respuesta: RESPUESTA_MOCK,
    origen: ["components/admin/referidos-table.tsx:273"],
  },
  {
    id: "backoffice.recordar-invitado",
    area: "backoffice",
    titulo: "Recordar a un invitado que suba su primer video",
    resumen: "Manda un recordatorio a quien se registró por invitación y no ha activado.",
    quien: ADMIN,
    donde: [{ ruta: "/admin/referidos", etiqueta: "Referidos › Todos los referidos" }],
    pasos: [
      "Filtra «Atascados» si quieres ver solo los de más de 14 días.",
      "Pulsa «Recordar» en la fila (p. ej. Diego Castillo, invitado por Adrián Guerrero).",
    ],
    reglas: ["Solo en invitados «registrado»."],
    endpoints: ["backoffice.recordar-invitado"],
    datos: DATOS_MOCK,
    respuesta: RESPUESTA_MOCK,
    origen: ["components/admin/referidos-table.tsx:286"],
  },
  {
    id: "backoffice.editar-recompensa-referidos",
    area: "backoffice",
    titulo: "Editar la recompensa del programa de referidos",
    resumen:
      "Cambia la recompensa (minutos o descuento), su valor y la fecha desde la que vale.",
    quien: ADMIN,
    donde: [{ ruta: "/admin/referidos", etiqueta: "Referidos › Editar recompensa" }],
    pasos: [
      "En la cabecera, pulsa «Editar recompensa».",
      "Hoy sale «Acción simulada» con lo que abriría: el editor de la recompensa (minutos o descuento, valor y fecha de efecto).",
    ],
    reglas: [
      "Hoy la recompensa es de 60 minutos por invitado convertido (lib/admin/mock-data.ts:841).",
      "El editor no existe todavía: el botón solo lo anuncia.",
    ],
    endpoints: ["backoffice.editar-programa-referidos"],
    datos: DATOS_MOCK,
    respuesta: RESPUESTA_MOCK,
    origen: [
      "app/[locale]/(admin)/admin/referidos/page.tsx:106",
      "lib/admin/mock-data.ts:841",
    ],
  },
  {
    id: "backoffice.pausar-programa-referidos",
    area: "backoffice",
    titulo: "Pausar el programa de referidos",
    resumen:
      "Deja de generar enlaces de invitación; las recompensas ya pendientes se mantienen.",
    quien: ADMIN,
    donde: [{ ruta: "/admin/referidos", etiqueta: "Referidos › Pausar programa" }],
    pasos: ["En la cabecera, pulsa «Pausar programa»."],
    reglas: [
      "Deja de generar enlaces de invitación; las recompensas ya pendientes se mantienen (admin.referidos.pauseProgramEffect).",
      "Hoy el botón solo lo anuncia.",
    ],
    endpoints: ["backoffice.editar-programa-referidos"],
    datos: DATOS_MOCK,
    respuesta: RESPUESTA_MOCK,
    origen: ["app/[locale]/(admin)/admin/referidos/page.tsx:109"],
  },
]

/* ---------------------------------------------------------------------------
   Planes
   --------------------------------------------------------------------------- */

const REGLAS_FORM_PLAN = [
  "Nombre de 2 a 40 caracteres y sin repetir; lema hasta 80; precios y precio por asiento de 0 a 9999; minutos de 1 a 100 000; cuentas sociales de 1 a 1000 (`LIMITES_PLAN`, lib/planes.ts:80).",
  "El precio al mes con facturación anual no puede ser mayor que el mensual.",
  "Los errores que bloquean se enseñan al pulsar «Guardar»; mientras tanto el diálogo sigue abierto.",
  "Como mucho una tarjeta destacada: destacar esta quita la marca de la que la tenía.",
  "Las redes que admite y los clips que se miden en Analíticas los da su escalón: Prueba solo TikTok y 5 clips; Creador y Empresa, las seis redes y todos.",
]

const ERRORES_FORM_PLAN = [
  {
    codigo: "nombreCorto",
    cuando: "Plan creado con nombre de menos de 2 caracteres.",
    frase: "admin.planes.catalogo.form.errors.nombreCorto",
    bloquea: true,
  },
  {
    codigo: "nombreRepetido",
    cuando: "Ya hay un plan con ese nombre.",
    frase: "admin.planes.catalogo.form.errors.nombreRepetido",
    bloquea: true,
  },
  {
    codigo: "precioFuera",
    cuando: "Un precio fuera de 0–9999.",
    frase: "admin.planes.catalogo.form.errors.precioFuera",
    bloquea: true,
  },
  {
    codigo: "anualMayor",
    cuando: "El anual es mayor que el mensual.",
    frase: "admin.planes.catalogo.form.errors.anualMayor",
    bloquea: true,
  },
  {
    codigo: "minutosFuera",
    cuando: "Minutos fuera de 1–100 000.",
    frase: "admin.planes.catalogo.form.errors.minutosFuera",
    bloquea: true,
  },
  {
    codigo: "asientoFuera",
    cuando: "Precio por asiento fuera de 0–9999.",
    frase: "admin.planes.catalogo.form.errors.asientoFuera",
    bloquea: true,
  },
  {
    codigo: "cuentasFuera",
    cuando: "Cuentas fuera de 1–1000.",
    frase: "admin.planes.catalogo.form.errors.cuentasFuera",
    bloquea: true,
  },
]

const PLANES: Accion[] = [
  {
    id: "backoffice.simular-contribucion",
    area: "backoffice",
    titulo: "Simular la contribución de un cambio de límites",
    resumen:
      "Calcula qué contribución dejaría cada plan con otros límites de minutos, usando el coste por minuto de Costes.",
    quien: ADMIN,
    donde: [
      {
        ruta: "/admin/planes",
        etiqueta: "Planes › Una fila por plan › Simular contribución",
      },
    ],
    pasos: ["En «Una fila por plan», pulsa «Simular contribución»."],
    reglas: [
      "Nuevos límites de minutos por plan × coste por minuto de Costes → contribución prevista.",
      "Hoy el botón solo anuncia el simulador.",
    ],
    endpoints: ["backoffice.leer-mes"],
    datos: DATOS_MOCK,
    respuesta: RESPUESTA_MOCK,
    origen: ["app/[locale]/(admin)/admin/planes/page.tsx:238"],
    relacionadas: ["backoffice.editar-plan"],
  },
  {
    id: "backoffice.crear-plan",
    area: "backoffice",
    titulo: "Crear un plan a medida",
    resumen:
      "Crea un plan que hereda comparativa, tarjeta y redes de un escalón de la web, con su nombre, precios, minutos y lo que desbloquea.",
    quien: ADMIN,
    donde: [{ ruta: "/admin/planes", etiqueta: "Planes › El catálogo › Crear un plan" }],
    pasos: [
      "En «El catálogo», pulsa «Crear un plan».",
      "Escribe «Nombre» (p. ej. «Universidad») y, si quieres, «Lema» («Para que tus clases circulen en clips.»).",
      "Elige «Como qué plan»: Prueba, Creador o Empresa. Precios, minutos, cuentas y capacidades toman los de ese escalón (nace como Creador: US$ 29, 14,50 anual, 600 min, 6 cuentas).",
      "Ajusta «Precio al mes», «Precio al mes con facturación anual», «Minutos de video al mes», «Precio por asiento adicional» y «Cuentas sociales conectadas».",
      "Marca en «Qué desbloquea» las capacidades: «Programar publicaciones», «Entrar en campañas de marcas», «Formación» y «Recortar y reducir tamaño» (las cuatro de `PLAN_MINIMO`, todas desde Creador en los planes de la web).",
      "Decide «Sale en /precios», «Se puede tener» y «Tarjeta destacada».",
      "Pulsa «Guardar».",
    ],
    reglas: [
      ...REGLAS_FORM_PLAN,
      "El nombre va en el idioma en que se escriba: es contenido y no se traduce.",
      "Un plan nuevo va al final del orden, con id `plan_…`.",
      "Su columna de /precios se escribe desde sus capacidades, no desde el escalón: lo que se promete es lo que la app cobra.",
      "Un plan oculto no sale en /precios pero se concede desde la solicitud de agencia.",
      "Las cuentas por plan no lo conocen hasta que la API lo devuelva: su fila dice «Sin cuentas todavía en los datos del negocio».",
    ],
    errores: ERRORES_FORM_PLAN,
    endpoints: ["backoffice.crear-plan", "backoffice.listar-planes"],
    datos: DATOS_PLANES,
    respuesta:
      '«Guardar» es la acción principal del diálogo (`variant="brand"`): suena «pop» con marca de recorte. Al guardar, `toast.success` «Plan guardado» con el nombre (suena «success»). Los interruptores del formulario suenan al encenderse y apagarse; las opciones, «tap».',
    origen: [
      "components/admin/catalogo-planes.tsx:95",
      "components/admin/catalogo-planes.tsx:129",
      "components/admin/plan-form.tsx:99",
      "lib/planes.ts:205",
      "tests/e2e/planes-catalogo.spec.ts:13",
    ],
    relacionadas: ["backoffice.editar-plan", "backoffice.conceder-agencia"],
  },
  {
    id: "backoffice.editar-plan",
    area: "backoffice",
    titulo: "Editar un plan",
    resumen:
      "Cambia precios, precio por asiento, minutos, cuentas, capacidades y si sale de un plan de la web o de uno creado.",
    quien: ADMIN,
    donde: [{ ruta: "/admin/planes", etiqueta: "Planes › El catálogo" }],
    pasos: [
      "En la fila del plan, pulsa el lápiz («Editar Creador», «Editar Empresa»…).",
      "Cambia lo que haga falta, p. ej. «Precio por asiento adicional» de Empresa a 12, o el precio de Creador a 35 y sus minutos a 800.",
      "Pulsa «Guardar». El cambio se ve en /precios sin recargar.",
    ],
    reglas: [
      ...REGLAS_FORM_PLAN,
      "De un plan de la web no se cambian nombre, lema ni escalón: viven en los tres idiomas. De él se guarda solo lo que cambia contra fábrica.",
      "Apagado («Se puede tener» sin marcar) no se puede tener ni asignar: quien lo tenía cae al plan de la demo.",
    ],
    errores: ERRORES_FORM_PLAN,
    endpoints: ["backoffice.editar-plan", "backoffice.listar-planes"],
    datos: DATOS_PLANES,
    respuesta:
      "«Guardar» suena «pop» con marca de recorte; después, `toast.success` «Plan guardado» (suena «success»).",
    origen: [
      "components/admin/catalogo-planes.tsx:307",
      "hooks/use-catalogo-planes.ts:132",
      "tests/e2e/planes-catalogo.spec.ts:91",
    ],
    relacionadas: ["backoffice.mostrar-ocultar-plan", "backoffice.reiniciar-planes"],
  },
  {
    id: "backoffice.mostrar-ocultar-plan",
    area: "backoffice",
    titulo: "Enseñar u ocultar un plan en /precios",
    resumen: "Saca un plan de /precios sin apagarlo: se sigue pudiendo asignar a mano.",
    quien: ADMIN,
    donde: [{ ruta: "/admin/planes", etiqueta: "Planes › El catálogo" }],
    pasos: [
      "Usa el interruptor al principio de la fila («Enseñar {nombre} en /precios»).",
    ],
    reglas: [
      "Un plan apagado tiene el interruptor bloqueado: primero hay que volver a encenderlo.",
      "Oculto no sale en /precios; se asigna desde la solicitud de agencia o desde el menú de la demo.",
    ],
    estados: [
      { estado: "En /precios", significa: "Activo y visible." },
      { estado: "Oculto", significa: "Activo, no visible: solo se asigna a mano." },
      { estado: "Apagado", significa: "No se puede tener ni asignar." },
    ],
    endpoints: ["backoffice.editar-plan"],
    datos: DATOS_PLANES,
    respuesta:
      "El interruptor suena solo («toggle-on» o «toggle-off»); `toast()` neutro «Sale en /precios» o «Ya no sale en /precios» con el nombre.",
    origen: ["components/admin/catalogo-planes.tsx:209"],
  },
  {
    id: "backoffice.ordenar-planes",
    area: "backoffice",
    titulo: "Ordenar los planes",
    resumen:
      "Sube o baja un plan un puesto: es el orden de las tarjetas y de los selectores.",
    quien: ADMIN,
    donde: [{ ruta: "/admin/planes", etiqueta: "Planes › El catálogo" }],
    pasos: [
      "Pulsa la flecha arriba («Subir {nombre}») o abajo («Bajar {nombre}») de la fila.",
    ],
    reglas: [
      "El primero no sube y el último no baja: los botones están apagados.",
      "Se renumeran todos: dos planes nunca comparten orden.",
    ],
    endpoints: ["backoffice.mover-plan", "backoffice.listar-planes"],
    datos: DATOS_PLANES,
    respuesta: "`toast()` neutro «Orden cambiado»; no suena.",
    origen: ["components/admin/catalogo-planes.tsx:285", "lib/planes.ts:364"],
  },
  {
    id: "backoffice.borrar-plan",
    area: "backoffice",
    titulo: "Borrar un plan creado",
    resumen:
      "Borra un plan creado en el backoffice. Los tres de la web no se borran: se apagan.",
    quien: ADMIN,
    donde: [{ ruta: "/admin/planes", etiqueta: "Planes › El catálogo" }],
    pasos: [
      "Pulsa la papelera de la fila («Borrar {nombre}»). Solo la tienen los planes «Creado aquí».",
      "Confirma con «Borrar el plan» (o «No borrarlo»).",
    ],
    reglas: [
      "No se deshace. Quien lo tuviera cae al plan de la demo.",
      "Si solo quieres que no salga, ocúltalo.",
    ],
    endpoints: ["backoffice.borrar-plan"],
    datos: DATOS_PLANES,
    respuesta: "`toast()` neutro «Plan borrado» con el nombre; no suena.",
    origen: [
      "components/admin/catalogo-planes.tsx:154",
      "hooks/use-catalogo-planes.ts:209",
    ],
  },
  {
    id: "backoffice.reiniciar-planes",
    area: "backoffice",
    titulo: "Volver al catálogo de fábrica",
    resumen:
      "Deshace todos los cambios del catálogo: vuelven los tres planes de la web tal cual y se borran los creados.",
    quien: ADMIN,
    donde: [
      {
        ruta: "/admin/planes",
        etiqueta: "Planes › El catálogo › Volver a los de fábrica",
      },
    ],
    pasos: ["Pulsa «Volver a los de fábrica»."],
    reglas: [
      "Sin confirmación: el catálogo queda al instante como en `lib/pricing.ts` (Prueba gratis con 60 min; Creador US$ 29 con 600 min; Empresa US$ 39 con 600 min y US$ 15 por asiento).",
    ],
    endpoints: ["backoffice.reiniciar-planes"],
    datos: DATOS_PLANES,
    respuesta: "`toast()` neutro «Catálogo de fábrica»; no suena.",
    origen: [
      "components/admin/catalogo-planes.tsx:86",
      "tests/e2e/planes-catalogo.spec.ts:173",
    ],
  },
]

/* ---------------------------------------------------------------------------
   Campañas y solicitud de agencia (los retiros, en acciones/wallet.ts)
   --------------------------------------------------------------------------- */

const CAMPANAS: Accion[] = [
  {
    id: "backoffice.crear-campana",
    area: "backoffice",
    titulo: "Crear una campaña como Clipealo",
    resumen:
      "Abre el alta de campañas en nombre de Clipealo: las campañas solo las crean agencias y el admin.",
    quien: ADMIN,
    donde: [{ ruta: "/admin/campanas", etiqueta: "Campañas › Crear campaña" }],
    pasos: [
      "En la cabecera de «Campañas», pulsa «Crear campaña».",
      "Se abre /campanas/nueva?como=admin: el mismo formulario de las agencias, firmado por «Clipealo» (perfil admin).",
      "Al publicarla, vuelve a /admin/campanas.",
    ],
    reglas: [
      "Los usuarios son cliperos: solo agencias y admin crean campañas (`puedeCrearCampanas`, lib/campanas.ts:48).",
      "`?como=admin` es solo la entrada de la demo: en producción el perfil sale de la sesión, nunca de la URL (components/campanas/campaign-form.tsx:111).",
      'Las campañas del admin llevan `creadaPor: { perfil: "admin", nombre: "Clipealo" }`, como `cmp_liga`.',
    ],
    endpoints: ["agencias.crear-campana"],
    datos: DATOS_CAMPANAS,
    respuesta:
      'Es la acción principal de la vista (`variant="brand"`): suena «pop» y se encuadra con la marca de recorte; navega al formulario.',
    origen: [
      "components/admin/campanas-admin.tsx:91",
      "components/campanas/campaign-form.tsx:177",
    ],
    relacionadas: ["agencias.crear-campana", "backoffice.destacar-campana"],
  },
  {
    id: "backoffice.destacar-campana",
    area: "backoffice",
    titulo: "Destacar una campaña en Explorar",
    resumen: "Pone una campaña la primera de Explorar, o la quita de destacadas.",
    quien: ADMIN,
    donde: [{ ruta: "/admin/campanas", etiqueta: "Campañas › Todas las campañas" }],
    pasos: [
      "Abre el menú «…» de la campaña («Acciones de {titulo}»).",
      "Pulsa «Destacar en Explorar» (o «Quitar de destacadas»).",
    ],
    reglas: [
      "Solo campañas públicas en estado activa o pausada.",
      "Solo el admin destaca.",
    ],
    endpoints: ["backoffice.destacar-campana", "backoffice.listar-campanas"],
    datos: DATOS_CAMPANAS,
    respuesta:
      "`toast.success` «Campaña destacada» o «Ya no está destacada» con el título (suena «success»).",
    origen: ["components/admin/campanas-admin.tsx:338", "hooks/use-campanas.ts:313"],
  },
  {
    id: "backoffice.pausar-reanudar-campana",
    area: "backoffice",
    titulo: "Pausar o reanudar una campaña",
    resumen:
      "Para una campaña activa de cualquier agencia (deja de admitir clips) o la vuelve a abrir.",
    quien: ADMIN,
    donde: [{ ruta: "/admin/campanas", etiqueta: "Campañas › Todas las campañas" }],
    pasos: [
      "En el menú «…» de la campaña, pulsa «Pausar» (si está activa) o «Reanudar» (si está pausada).",
    ],
    reglas: [
      "Pausar solo una activa; reanudar solo una pausada.",
      "Una pausada no admite clips de nadie.",
    ],
    estados: [
      { estado: "activa", significa: "Admite clips y reparte presupuesto." },
      { estado: "pausada", significa: "Parada a mano: no admite clips." },
    ],
    endpoints: ["backoffice.cambiar-estado-campana", "backoffice.listar-campanas"],
    datos: DATOS_CAMPANAS,
    respuesta:
      "`toast.success` «Campaña pausada» o «Campaña reanudada» con el título (suena «success»).",
    origen: [
      "components/admin/campanas-admin.tsx:353",
      "components/admin/campanas-admin.tsx:360",
    ],
  },
  {
    id: "backoffice.finalizar-campana",
    area: "backoffice",
    titulo: "Finalizar una campaña desde el backoffice",
    resumen: "Cierra una campaña para siempre: deja de admitir clips y no se reabre.",
    quien: ADMIN,
    donde: [{ ruta: "/admin/campanas", etiqueta: "Campañas › Todas las campañas" }],
    pasos: [
      "En el menú «…» de la campaña, pulsa «Finalizar» (en rojo, separado del resto).",
    ],
    reglas: [
      "Solo sobre campañas activas, pausadas o agotadas.",
      "Sin confirmación y sin vuelta atrás.",
    ],
    estados: [
      { estado: "agotada", significa: "Activa sin presupuesto para el mínimo." },
      { estado: "finalizada", significa: "Cerrada: no admite clips de nadie." },
    ],
    endpoints: ["backoffice.cambiar-estado-campana", "backoffice.listar-campanas"],
    datos: DATOS_CAMPANAS,
    respuesta: "`toast.success` «Campaña finalizada» con el título (suena «success»).",
    origen: ["components/admin/campanas-admin.tsx:372", "lib/campanas.ts:356"],
    relacionadas: ["agencias.finalizar-campana", "backoffice.pausar-reanudar-campana"],
  },
  {
    id: "backoffice.citar-entrevista-agencia",
    area: "backoffice",
    titulo: "Citar a una organización a entrevista",
    resumen:
      "Antes de conceder el perfil de agencia, cita a la organización; lo ve en su pantalla de solicitud con la nota.",
    quien: ADMIN,
    donde: [{ ruta: "/admin/campanas", etiqueta: "Campañas › Perfil de agencia" }],
    pasos: [
      "En «Perfil de agencia», lee la tarjeta: organización, tipo («Universidad · pide el perfil de agencia»), quién escribe, correo, sector, países, redes, tramo de presupuesto y web.",
      "Pulsa «Citar entrevista».",
      "En «Citar a entrevista», elige «Cuándo» (sin cita previa se propone dentro de 7 días) y escribe la «Nota para la agencia», p. ej. «Videollamada de 20 minutos con quien lleve el canal.».",
      "Pulsa «Citar». La tarjeta pasa a decir «Entrevista citada el {fecha}».",
    ],
    reglas: [
      "Solo con una solicitud pendiente o ya citada; sin ninguna, la sección dice «Sin solicitudes pendientes.».",
      "Se puede volver a citar: la última cita es la que vale y la que ve la agencia.",
      "La cita es un día: se guarda a mediodía UTC para que caiga ese día en cualquier zona.",
      "Las solicitudes se revisan en 24–48 h (admin.campanas.kpis.teamFootnote).",
    ],
    estados: [
      { estado: "pendiente", significa: "La organización pidió el perfil." },
      { estado: "entrevista", significa: "Citada: el equipo la ve antes de decidir." },
    ],
    errores: [
      {
        codigo: "fecha",
        cuando: "El campo «Cuándo» está vacío.",
        frase: "admin.campanas.agency.interviewDialog.errors.fecha",
        bloquea: true,
      },
    ],
    endpoints: ["backoffice.citar-entrevista", "backoffice.listar-solicitudes-agencia"],
    datos: DATOS_CAMPANAS,
    respuesta:
      "`toast.success` «Entrevista citada» con «{nombre} lo verá en su solicitud» (suena «success»).",
    origen: [
      "components/admin/solicitud-agencia.tsx:132",
      "components/admin/solicitud-agencia.tsx:219",
      "hooks/use-campanas.ts:427",
      "tests/e2e/agencia-solicitud.spec.ts:48",
    ],
    relacionadas: ["backoffice.conceder-agencia", "backoffice.rechazar-agencia"],
  },
  {
    id: "backoffice.conceder-agencia",
    area: "backoffice",
    titulo: "Conceder el perfil de agencia con plan",
    resumen:
      "Da el perfil de agencia (publica campañas sin revisión) con el plan que salió de la entrevista, también uno oculto hecho a medida.",
    quien: ADMIN,
    donde: [{ ruta: "/admin/campanas", etiqueta: "Campañas › Perfil de agencia" }],
    pasos: [
      "Pulsa «Conceder con plan».",
      "En «Plan que se le asigna», elige el plan (Creador por defecto; los ocultos salen con «· oculto»).",
      "Pulsa «Conceder».",
    ],
    reglas: [
      "Se elige entre los planes activos del catálogo, también los ocultos; nunca uno apagado.",
      "Conceder cambia también el plan de la cuenta: las puertas se abren al momento («Crear campaña» aparece en /campanas).",
      "El plan se puede cambiar después desde Planes.",
    ],
    estados: [{ estado: "aprobada", significa: "Ya es agencia, con `planAsignado`." }],
    endpoints: [
      "backoffice.conceder-agencia",
      "backoffice.listar-planes",
      "backoffice.listar-solicitudes-agencia",
    ],
    datos: `${DATOS_CAMPANAS} El plan asignado se escribe además en \`clipealo-plan-v1\`.`,
    respuesta:
      "`toast.success` «Perfil de agencia concedido» con «{nombre} ya publica sin revisión, con el plan {plan}» (suena «success»).",
    origen: [
      "components/admin/solicitud-agencia.tsx:135",
      "components/admin/solicitud-agencia.tsx:284",
      "hooks/use-campanas.ts:448",
      "tests/e2e/agencia-solicitud.spec.ts:103",
    ],
    relacionadas: ["backoffice.crear-plan", "backoffice.citar-entrevista-agencia"],
  },
  {
    id: "backoffice.rechazar-agencia",
    area: "backoffice",
    titulo: "Rechazar una solicitud de agencia con motivo",
    resumen:
      "Rechaza la solicitud con un motivo que la organización lee antes de volver a pedirlo.",
    quien: ADMIN,
    donde: [{ ruta: "/admin/campanas", etiqueta: "Campañas › Perfil de agencia" }],
    pasos: [
      "Pulsa «Rechazar» en la tarjeta de la solicitud.",
      "En «Rechazar la solicitud», elige el «Motivo»: «No pudimos verificar la web», «Sector no admitido», «Faltan datos» (el de por defecto), «Solicitud duplicada» u «Otro motivo».",
      "Pulsa «Rechazar».",
    ],
    reglas: [
      "Siempre con motivo: «El motivo se le enseña: nadie se queda sin saber por qué».",
      "El motivo se guarda como código (`MOTIVOS_RECHAZO_AGENCIA`, lib/taxonomia.ts:650).",
      "La organización lo lee en /campanas/nueva y puede «Volver a solicitarlo» revisando lo que mandó.",
    ],
    estados: [
      { estado: "rechazada", significa: "Rechazada con motivo; puede volver a pedirlo." },
    ],
    endpoints: ["backoffice.rechazar-agencia", "backoffice.listar-solicitudes-agencia"],
    datos: DATOS_CAMPANAS,
    respuesta:
      "`toast()` neutro «Solicitud de agencia rechazada» con el nombre, con el sonido «remove».",
    origen: [
      "components/admin/solicitud-agencia.tsx:138",
      "components/admin/solicitud-agencia.tsx:336",
      "tests/e2e/agencia-solicitud.spec.ts:79",
    ],
  },
]

/* ---------------------------------------------------------------------------
   Disputas
   --------------------------------------------------------------------------- */

const DISPUTAS: Accion[] = [
  {
    id: "backoffice.dictar-laudo",
    area: "backoffice",
    titulo: "Arbitrar una disputa",
    resumen:
      "Decide qué pasa con un compromiso parado entre un clipero y quien paga: liberar la plaza, dar prórroga, pagar al clipero o cerrar sin pago.",
    quien: ADMIN,
    donde: [{ ruta: "/admin/disputas", etiqueta: "Disputas › Cola" }],
    pasos: [
      "Abre «Disputas» en la barra lateral (la insignia cuenta las no resueltas).",
      "Lee los KPIs «Por arbitrar», «Dinero en juego», «La que más espera» y «Resueltas».",
      "En la cola, la más antigua va primero (p. ej. Nora Vidal frente a Clipealo en la Liga de las Estrellas, «No entregó», hace 8 días, US$ 144 en juego). Pulsa «Arbitrar».",
      "Lee el expediente: las dos versiones, el clip entregado si lo hay («Ver el clip») y las fechas.",
      "En «El laudo», elige «Liberar la plaza», «Dar prórroga», «Pagar al clipero» o «Sin pago». Con prórroga, escribe los «Días de prórroga» (de 1 a 30; 7 por defecto).",
      "Escribe la «Nota para las dos partes» y pulsa «Dictar el laudo» (apagado hasta elegir un laudo).",
    ],
    reglas: [
      "«Pagar al clipero» solo sale si hay clip entregado: el dinero lo reparte la liquidación entre los envíos aprobados.",
      "Cada laudo deja el compromiso en un estado distinto y no tiene vuelta atrás: liberar la plaza → caducado, nadie cobra; prórroga → aceptado con plazo nuevo desde hoy; pagar → cumplido y el clip aprobado; sin pago → rechazado y el clip rechazado.",
      "La nota es obligatoria: la leen el clipero y quien paga.",
      "En juego = tope por video de la campaña (presupuesto × % de tope: US$ 3600 × 4 % = US$ 144 en la Liga).",
      "Se ve lo justo para decidir; nunca el wallet del clipero ni sus datos de cobro.",
      "El botón «Arbitrar» está apagado si falta el compromiso o la campaña.",
    ],
    estados: [
      { estado: "abierta", significa: "Pide decisión." },
      {
        estado: "en-revision",
        significa:
          "Existe en `ESTADOS_DISPUTA` (lib/participacion.ts:84) y cuenta como no resuelta, pero hoy nada pone una disputa en este estado.",
      },
      { estado: "resuelta", significa: "Tiene laudo y nota; pasa a «Resueltas»." },
    ],
    errores: [
      {
        codigo: "noteRequired",
        cuando: "Se dicta el laudo sin nota.",
        frase: "admin.disputas.form.noteRequired",
        bloquea: true,
      },
    ],
    endpoints: [
      "backoffice.listar-disputas",
      "backoffice.dictar-laudo",
      "backoffice.leer-sincronizacion",
    ],
    datos: `${DATOS_CAMPANAS} El servidor devuelve hoy la cola vacía (\`getAdminDisputas\`) y la página la une con la del navegador.`,
    respuesta:
      "Elegir un laudo hace «tap» (grupo de opciones). Al dictarlo, `toast.success` «Laudo dictado» con «{campana} · {laudo}» (suena «success»).",
    origen: [
      "components/admin/disputas-admin.tsx:256",
      "components/admin/disputas-admin.tsx:414",
      "lib/participacion.ts:509",
      "lib/participacion.ts:518",
    ],
    relacionadas: ["campanas.abrir-reclamacion", "agencias.reclamar-compromiso"],
  },
]

/* ---------------------------------------------------------------------------
   Preguntas
   --------------------------------------------------------------------------- */

const REGLAS_FORM_PREGUNTA = [
  "«La pregunta» de 8 a 120 caracteres; «Para qué se pregunta» de 10 a 200 y obligatorio: nadie responde a ciegas.",
  "De 2 a 8 opciones, de hasta 60 caracteres, sin vacías ni repetidas. «Quitar la opción» se apaga con 2 y «Añadir una opción», con 8.",
  "«Cuántas se pueden marcar»: «Una respuesta» o «Varias», y con varias, «Como mucho» de 1 a 8.",
  "«A partir de qué día desde el alta»: de 0 a 365 (7 por defecto). Es la única regla que puede tener una pregunta escrita aquí.",
  "Va en el idioma en que se escriba: es contenido y no se traduce. Solo se le pregunta a cliperos.",
]

const ERRORES_FORM_PREGUNTA = [
  {
    codigo: "tituloCorto",
    cuando: "La pregunta tiene menos de 8 caracteres.",
    frase: "admin.preguntas.form.errors.tituloCorto",
    bloquea: true,
  },
  {
    codigo: "ayudaCorta",
    cuando: "«Para qué se pregunta» tiene menos de 10 caracteres.",
    frase: "admin.preguntas.form.errors.ayudaCorta",
    bloquea: true,
  },
  {
    codigo: "pocasOpciones",
    cuando: "Menos de 2 opciones.",
    frase: "admin.preguntas.form.errors.pocasOpciones",
    bloquea: true,
  },
  {
    codigo: "opcionVacia",
    cuando: "Una opción sin escribir.",
    frase: "admin.preguntas.form.errors.opcionVacia",
    bloquea: true,
  },
  {
    codigo: "opcionRepetida",
    cuando: "Dos opciones iguales.",
    frase: "admin.preguntas.form.errors.opcionRepetida",
    bloquea: true,
  },
]

const PREGUNTAS: Accion[] = [
  {
    id: "backoffice.escribir-pregunta",
    area: "backoffice",
    titulo: "Escribir una micropregunta nueva",
    resumen:
      "Añade una pregunta al catálogo, con su «para qué» y sus opciones, en el panel o al enviar un clip.",
    quien: ADMIN,
    donde: [
      {
        ruta: "/admin/preguntas",
        etiqueta: "Preguntas › El catálogo › Escribir una pregunta",
      },
    ],
    pasos: [
      "En «El catálogo», pulsa «Escribir una pregunta».",
      "Escribe «La pregunta» (p. ej. «¿Qué es lo que más te cuesta al montar un clip?») y «Para qué se pregunta» («Para saber qué parte del editor mejorar primero.»).",
      "Elige «Dónde sale»: «Panel» o «Enviar clip».",
      "Elige «Cuántas se pueden marcar» y escribe las opciones («Opción 1», «Opción 2»…).",
      "Fija «A partir de qué día desde el alta» y deja «Preguntarla ya» si debe salir ya.",
      "Pulsa «Guardar».",
    ],
    reglas: [
      ...REGLAS_FORM_PREGUNTA,
      "Va al final de su lugar. Su respuesta se guarda en `Cuenta.respuestasLibres`: no tiene campo propio.",
      "En el lugar, sale la primera disponible respetando «Cada cuánto se pregunta».",
    ],
    errores: ERRORES_FORM_PREGUNTA,
    endpoints: [
      "backoffice.crear-pregunta",
      "backoffice.listar-preguntas",
      "backoffice.leer-sincronizacion",
    ],
    datos: DATOS_MICRO,
    respuesta:
      "«Guardar» es la acción principal del diálogo: suena «pop» con marca de recorte. Luego `toast.success` «Pregunta guardada» con la pregunta (suena «success»). Elegir lugar o tipo hace «tap».",
    origen: [
      "components/admin/preguntas-admin.tsx:100",
      "components/admin/preguntas-admin.tsx:133",
      "components/admin/pregunta-form.tsx:90",
      "lib/micro-catalogo.ts:200",
      "tests/e2e/preguntas.spec.ts:23",
    ],
    relacionadas: ["backoffice.activar-pregunta", "backoffice.editar-pregunta"],
  },
  {
    id: "backoffice.editar-pregunta",
    area: "backoffice",
    titulo: "Editar una micropregunta escrita aquí",
    resumen:
      "Reescribe una pregunta creada en el backoffice. Las del producto solo se encienden, apagan u ordenan.",
    quien: ADMIN,
    donde: [{ ruta: "/admin/preguntas", etiqueta: "Preguntas › El catálogo" }],
    pasos: [
      "Pulsa el lápiz de la fila («Editar {titulo}»). Solo lo tienen las «Escrita aquí».",
      "Cambia lo que haga falta y pulsa «Guardar».",
    ],
    reglas: [
      ...REGLAS_FORM_PREGUNTA,
      "Conserva su sitio en el orden.",
      "Las nueve del producto no se reescriben: su texto vive en los tres idiomas dentro del producto.",
    ],
    errores: ERRORES_FORM_PREGUNTA,
    endpoints: ["backoffice.editar-pregunta"],
    datos: DATOS_MICRO,
    respuesta:
      "«Guardar» suena «pop»; `toast.success` «Pregunta guardada» (suena «success»).",
    origen: [
      "components/admin/preguntas-admin.tsx:278",
      "hooks/use-catalogo-micro.ts:135",
    ],
  },
  {
    id: "backoffice.activar-pregunta",
    area: "backoffice",
    titulo: "Encender o apagar una micropregunta",
    resumen: "Decide si una pregunta se hace o no, sin borrar lo que ya se respondió.",
    quien: ADMIN,
    donde: [{ ruta: "/admin/preguntas", etiqueta: "Preguntas › El catálogo" }],
    pasos: ["Usa el interruptor de la fila («Preguntar {titulo}»)."],
    reglas: [
      "Apagada no se pregunta, pero lo respondido sigue en la cuenta. La fila lo dice con «Apagada».",
      "Vale para las nueve del producto y para las escritas aquí.",
    ],
    endpoints: ["backoffice.editar-pregunta", "backoffice.listar-preguntas"],
    datos: DATOS_MICRO,
    respuesta:
      "El interruptor suena solo («toggle-on» o «toggle-off»); `toast()` neutro «Se preguntará» o «Dejará de preguntarse» con la pregunta.",
    origen: [
      "components/admin/preguntas-admin.tsx:211",
      "tests/e2e/preguntas.spec.ts:84",
    ],
  },
  {
    id: "backoffice.ordenar-preguntas",
    area: "backoffice",
    titulo: "Ordenar las micropreguntas de un lugar",
    resumen:
      "Sube o baja una pregunta dentro de «Panel» o de «Enviar clip»: la primera disponible es la que sale.",
    quien: ADMIN,
    donde: [{ ruta: "/admin/preguntas", etiqueta: "Preguntas › El catálogo" }],
    pasos: ["Pulsa la flecha arriba («Subir {titulo}») o abajo («Bajar {titulo}»)."],
    reglas: [
      "Solo compite con las de su mismo lugar.",
      "La primera no sube y la última no baja.",
    ],
    endpoints: ["backoffice.mover-pregunta", "backoffice.listar-preguntas"],
    datos: DATOS_MICRO,
    respuesta: "`toast()` neutro «Orden cambiado»; no suena.",
    origen: ["components/admin/preguntas-admin.tsx:254", "lib/micro-catalogo.ts:271"],
  },
  {
    id: "backoffice.borrar-pregunta",
    area: "backoffice",
    titulo: "Borrar una micropregunta escrita aquí",
    resumen:
      "Borra una pregunta creada en el backoffice. Las del producto se apagan, no se borran.",
    quien: ADMIN,
    donde: [{ ruta: "/admin/preguntas", etiqueta: "Preguntas › El catálogo" }],
    pasos: [
      "Pulsa la papelera de la fila («Borrar {titulo}»).",
      "Confirma con «Borrar la pregunta» (o «No borrarla»).",
    ],
    reglas: [
      "No se deshace. Lo que la gente ya respondió se queda en su cuenta.",
      "Si solo quieres dejar de preguntarla, apágala.",
    ],
    endpoints: ["backoffice.borrar-pregunta"],
    datos: DATOS_MICRO,
    respuesta: "`toast()` neutro «Pregunta borrada» con la pregunta; no suena.",
    origen: [
      "components/admin/preguntas-admin.tsx:286",
      "components/admin/preguntas-admin.tsx:156",
    ],
  },
  {
    id: "backoffice.cambiar-reglas-preguntas",
    area: "backoffice",
    titulo: "Cambiar cada cuánto se pregunta",
    resumen:
      "Ajusta las reglas de frecuencia que valen para todo el catálogo de micropreguntas.",
    quien: ADMIN,
    donde: [
      { ruta: "/admin/preguntas", etiqueta: "Preguntas › Cada cuánto se pregunta" },
    ],
    pasos: [
      "En «Cada cuánto se pregunta», escribe el número en el campo, p. ej. «Días entre dos preguntas» de 3 a 14.",
      "Se guarda al escribir; no hay botón de guardar.",
    ],
    reglas: [
      "Valores de fábrica y rangos: «Días entre dos preguntas» 3 (0–60); «Días que tarda en volver un “Ahora no”» 7 (1–90); «Día en que se pregunta por las motivaciones» 7 (1–180); «Día en que se pregunta por las herramientas» 14 (1–180); «Días sin enviar antes de preguntar qué le frena» 7 (1–90); «Días antes de revisar si sigue con sus temas» 180 (30–730); «Envío en el que se pregunta la disponibilidad» 3 (1–50); «Ligas, géneros o formatos que se pueden marcar» 3 (1–10).",
      "Fuera de rango, al leerlo se recorta al límite: la migración impone el rango.",
    ],
    endpoints: ["backoffice.cambiar-reglas-preguntas", "backoffice.listar-preguntas"],
    datos: DATOS_MICRO,
    respuesta: "Sin aviso ni sonido: el campo guarda al escribir.",
    origen: [
      "components/admin/preguntas-admin.tsx:345",
      "lib/micro-catalogo.ts:75",
      "lib/micro-preguntas.ts:87",
      "tests/e2e/preguntas.spec.ts:105",
    ],
    relacionadas: ["backoffice.reiniciar-preguntas"],
  },
  {
    id: "backoffice.reiniciar-preguntas",
    area: "backoffice",
    titulo: "Volver a las preguntas de fábrica",
    resumen:
      "Deja el catálogo como vino: las nueve preguntas del producto, activas y en su sitio, con las reglas de fábrica.",
    quien: ADMIN,
    donde: [
      { ruta: "/admin/preguntas", etiqueta: "Preguntas › Cada cuánto se pregunta" },
    ],
    pasos: ["Pulsa «Volver a los valores de fábrica»."],
    reglas: [
      "Sin confirmación. Borra también las preguntas escritas aquí; lo respondido sigue en las cuentas.",
    ],
    endpoints: ["backoffice.reiniciar-preguntas"],
    datos: DATOS_MICRO,
    respuesta: "`toast()` neutro «Catálogo de fábrica»; no suena.",
    origen: [
      "components/admin/preguntas-admin.tsx:320",
      "hooks/use-catalogo-micro.ts:71",
    ],
  },
]

/* ---------------------------------------------------------------------------
   Casillero
   --------------------------------------------------------------------------- */

const CASILLERO: Accion[] = [
  {
    id: "backoffice.abrir-mensaje",
    area: "backoffice",
    titulo: "Leer un mensaje del casillero",
    resumen:
      "Abre lo que escribió un clipero o una agencia; abrirlo lo marca como leído.",
    quien: ADMIN,
    donde: [{ ruta: "/admin/feedback", etiqueta: "Casillero › La cola" }],
    pasos: [
      "Abre «Casillero» en la barra lateral (la insignia cuenta los sin abrir).",
      "Lee los KPIs «Sin abrir», «Pendientes», «Espera más larga» y «Respondidos».",
      "Pulsa el texto del mensaje en la tabla («Abrir el mensaje de {autor}»).",
      "Se abre «Mensaje de {autor}» con la fecha, la pantalla desde la que escribió, el tipo y el texto tal cual.",
    ],
    reglas: [
      "Abrirlo es leerlo: pasa de «Enviado» a «Leído por el equipo» sin botón aparte.",
      "Un mensaje ya leído, respondido o archivado no cambia al abrirlo.",
      "La cola va del más nuevo al más viejo; «Pendientes» son los nuevos y los leídos.",
    ],
    estados: [
      { estado: "nuevo", significa: "Sin abrir («Enviado» para quien escribió)." },
      { estado: "leido", significa: "Abierto por el equipo." },
    ],
    endpoints: [
      "backoffice.listar-mensajes",
      "backoffice.marcar-mensaje-leido",
      "backoffice.leer-sincronizacion",
    ],
    datos: DATOS_FEEDBACK,
    respuesta: "Sin aviso: abrir es navegación.",
    origen: ["components/admin/feedback-admin.tsx:70", "lib/feedback.ts:139"],
    relacionadas: ["backoffice.responder-mensaje", "backoffice.archivar-mensaje"],
  },
  {
    id: "backoffice.responder-mensaje",
    area: "backoffice",
    titulo: "Responder un mensaje del casillero",
    resumen:
      "Contesta a quien escribió; lo lee en su Ayuda › Tus mensajes y la campana se lo anuncia.",
    quien: ADMIN,
    donde: [{ ruta: "/admin/feedback", etiqueta: "Casillero › Mensaje de {autor}" }],
    pasos: [
      "Abre el mensaje.",
      "Escribe en «Tu respuesta» («Contesta lo que sepas y di lo que no. Lo lee tal cual.»).",
      "Pulsa «Responder».",
    ],
    reglas: [
      "La respuesta no puede ir vacía; al leer lo guardado se recorta a 1200 caracteres (`limpiarParcheFeedback`, lib/feedback.ts:265).",
      "Se puede volver a responder: reescribe la respuesta y su fecha (el diálogo enseña «Respondido el {fecha}»).",
      "La respuesta queda «sin leer» (`sinLeer: true`) para que la campana la anuncie una vez; deja de estarlo cuando quien escribió abre Ayuda › Tus mensajes (`marcarVisto`, lib/feedback.ts:158).",
    ],
    estados: [{ estado: "respondido", significa: "Tiene respuesta del equipo." }],
    errores: [
      {
        codigo: "vacia",
        cuando: "Se pulsa «Responder» sin texto.",
        frase: "admin.feedback.detalle.errors.vacia",
        bloquea: true,
      },
    ],
    endpoints: ["backoffice.responder-mensaje"],
    datos: DATOS_FEEDBACK,
    respuesta:
      '«Responder» es la acción principal (`variant="brand"`): suena «pop» con marca de recorte. Luego `toast.success` «Respuesta enviada» con «{autor} la verá en su Ayuda.» (suena «success»).',
    origen: [
      "components/admin/feedback-admin.tsx:222",
      "lib/feedback.ts:148",
      "lib/feedback.ts:158",
    ],
  },
  {
    id: "backoffice.archivar-mensaje",
    area: "backoffice",
    titulo: "Archivar un mensaje del casillero",
    resumen: "Saca un mensaje de la cola sin borrarlo.",
    quien: ADMIN,
    donde: [{ ruta: "/admin/feedback", etiqueta: "Casillero › Mensaje de {autor}" }],
    pasos: ["Abre el mensaje y pulsa «Archivar»."],
    reglas: [
      "Nada se borra: lo que alguien se molestó en escribir se archiva.",
      "El botón está apagado si ya está archivado.",
    ],
    estados: [
      { estado: "archivado", significa: "Fuera de la cola; sigue en el historial." },
    ],
    endpoints: ["backoffice.archivar-mensaje"],
    datos: DATOS_FEEDBACK,
    respuesta:
      "`toast()` neutro «Mensaje archivado» con «Sale de la cola, pero no se borra.»; no suena.",
    origen: [
      "components/admin/feedback-admin.tsx:229",
      "components/admin/feedback-admin.tsx:320",
    ],
  },
]

/** Todas las acciones del backoffice, en el orden de la barra lateral. */
export const ACCIONES: Accion[] = [
  ...MARCO,
  ...CONSULTAS,
  ...COBROS,
  ...USUARIOS,
  ...COSTES,
  ...PROGRAMAS,
  ...PLANES,
  ...CAMPANAS,
  ...DISPUTAS,
  ...PREGUNTAS,
  ...CASILLERO,
]
