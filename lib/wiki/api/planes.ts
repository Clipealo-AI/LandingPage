import type { Campo, Endpoint, ErrorDoc, Esquema } from "@/lib/wiki/tipos"

/**
 * Endpoints de «planes»: el catálogo que se enseña en /precios, la suscripción
 * de la cuenta, su consumo de minutos y sus facturas.
 *
 * Ninguno existe todavía como frontera en `lib/api/`: el catálogo vive en
 * `clipealo-planes-v1` (`hooks/use-catalogo-planes.ts`), el plan de la cuenta
 * en `clipealo-plan-v1` (`hooks/use-plan.ts`) y la suscripción, el consumo y
 * las facturas son semillas fijas (`lib/ajustes.ts`, `lib/mock-data.ts`). Por
 * eso los diez son `por-construir`. Escribir el catálogo (crear, editar,
 * ordenar, apagar planes) es del backoffice (/admin/planes) y no va aquí.
 */

/* ---------------------------------------------------------------------------
   Piezas compartidas
   --------------------------------------------------------------------------- */

const ERROR_SESION: ErrorDoc = {
  codigo: "no-autorizado",
  http: 401,
  cuando: "Sin sesión, o con una sesión que ya no vale.",
  frase: "common.errors.no-autorizado",
  bloquea: true,
}

const ERROR_SERVIDOR: ErrorDoc = {
  codigo: "servidor",
  http: 500,
  cuando: "Falla el servidor o la pasarela de pago.",
  frase: "common.errors.servidor",
  bloquea: true,
}

/** `PlanCatalogo`, tal como lo resuelve hoy `aplicarPlanes`. */
const CAMPOS_PLAN: Campo[] = [
  {
    nombre: "id",
    tipo: "PlanId",
    requerido: true,
    descripcion:
      "Uno de los tres escalones de la web (`free`, `creator`, `business`) o uno creado en el backoffice (`plan_…`, `nuevoIdPlan`, lib/planes.ts:318). Estable: lo guardan el plan de la cuenta (`clipealo-plan-v1`) y el perfil de agencia concedido (`planAsignado`, hooks/use-campanas.ts:120).",
  },
  {
    nombre: "origen",
    tipo: '"semilla" | "creado"',
    requerido: true,
    descripcion:
      "`semilla`: uno de los tres de la web, con sus textos en `messages/<idioma>/pricing.json`. `creado`: lo escribió un admin y lleva su nombre dentro.",
  },
  {
    nombre: "base",
    tipo: '"free" | "creator" | "business"',
    requerido: true,
    descripcion:
      "El escalón del que hereda comparativa, puntos de la tarjeta, redes y clips en Analíticas. Una semilla es su propia base.",
  },
  {
    nombre: "activo",
    tipo: "boolean",
    requerido: true,
    descripcion: "Apagado no se puede tener ni asignar. Apagar no borra.",
  },
  {
    nombre: "visible",
    tipo: "boolean",
    requerido: true,
    descripcion:
      "Sale en /precios y en la comparativa. Oculto solo se asigna desde el backoffice (lib/planes.ts:58).",
  },
  {
    nombre: "orden",
    tipo: "number",
    requerido: true,
    descripcion:
      "De menor a mayor: orden de las tarjetas, las columnas y los selectores.",
  },
  {
    nombre: "monthly",
    tipo: "number",
    requerido: true,
    descripcion:
      "US$ al mes con facturación mensual. Entre 0 y 9.999, dos decimales como mucho.",
  },
  {
    nombre: "yearly",
    tipo: "number",
    requerido: true,
    descripcion:
      "US$ al mes con facturación anual. Entre 0 y 9.999 y nunca mayor que `monthly` (código `anualMayor`, lib/planes.ts:293).",
  },
  {
    nombre: "minutos",
    tipo: "number",
    requerido: true,
    descripcion: "Minutos de video al mes. Entero entre 1 y 100.000 (`LIMITES_PLAN`).",
  },
  {
    nombre: "cuentas",
    tipo: "number",
    requerido: true,
    descripcion:
      "Cuentas sociales conectadas a la vez, sumando todas las redes. Entero entre 1 y 1.000. Las redes las da el escalón, no el plan.",
  },
  {
    nombre: "asiento",
    tipo: "number",
    requerido: true,
    descripcion:
      "US$ al mes por cada miembro adicional del equipo. 0: los miembros no se cobran aparte.",
  },
  {
    nombre: "capacidades",
    tipo: '("programar" | "participarCampanas" | "clasesDePago" | "operaciones")[]',
    requerido: true,
    descripcion:
      "Lo que desbloquea (`Capacidad`, lib/pricing.ts:83). En una semilla, las que `PLAN_MINIMO` le concede; en un plan creado, las que eligió el admin, en el orden de `CAPACIDADES`.",
  },
  {
    nombre: "featured",
    tipo: "boolean",
    requerido: true,
    descripcion:
      "La tarjeta destacada («El más elegido»). Como mucho una en todo el catálogo.",
  },
  {
    nombre: "nombre",
    tipo: "string",
    requerido: false,
    descripcion:
      "Solo en los creados: entre 2 y 40 caracteres, único sin mirar mayúsculas. Es contenido: no se traduce.",
  },
  {
    nombre: "lema",
    tipo: "string",
    requerido: false,
    descripcion:
      "Solo en los creados, hasta 80 caracteres. Sin él, la tarjeta usa el de su escalón.",
  },
]

/** La suscripción de la cuenta: lo que hoy reparten `use-plan`, `suscripcionDemo` y `usage`. */
const CAMPOS_SUSCRIPCION: Campo[] = [
  {
    nombre: "plan",
    tipo: "PlanId",
    requerido: true,
    descripcion:
      "El plan de la cuenta. Sustituye al id guardado en `clipealo-plan-v1`; el front lo resuelve contra el catálogo con `planDe` (lib/planes.ts:476). Sin suscripción de pago, `free`.",
  },
  {
    nombre: "ciclo",
    tipo: '"mensual" | "anual"',
    requerido: true,
    descripcion:
      "`CicloFacturacion` (lib/ajustes.ts:231). Decide qué precio del plan se cobra.",
  },
  {
    nombre: "estado",
    tipo: '"activa"',
    requerido: true,
    descripcion: "El único estado que conoce hoy el front (`suscripcionDemo.estado`).",
  },
  {
    nombre: "desde",
    tipo: "string",
    requerido: true,
    descripcion: "Instante ISO del alta: Facturación dice «Cliente desde el …».",
  },
  {
    nombre: "renewsAt",
    tipo: "string",
    requerido: true,
    descripcion:
      "Instante ISO de la próxima renovación (hoy `usage.renewsAt`, lib/mock-data.ts:498). También es la fecha hasta la que se conserva un plan cancelado y el final del periodo de consumo.",
  },
  {
    nombre: "cancelada",
    tipo: "boolean",
    requerido: true,
    descripcion:
      "Hay una cancelación pendiente para `renewsAt`. Hoy es estado del componente de Facturación (billing-settings.tsx:63) y se pierde al recargar.",
  },
  {
    nombre: "metodo",
    tipo: "{ marca: string; ultimos4: string; caduca: string }",
    requerido: false,
    descripcion:
      "Lo único que Facturación enseña del medio de pago. Solo en planes de pago (precio mensual > 0).",
  },
]

const SUSCRIPCION: Esquema = {
  tipo: "typeof suscripcionDemo & { plan: PlanId; renewsAt: string; cancelada: boolean }",
  definidoEn: "lib/ajustes.ts:224",
  campos: CAMPOS_SUSCRIPCION,
  ejemplo: {
    plan: "creator",
    ciclo: "mensual",
    estado: "activa",
    desde: "2026-03-01T00:00:00.000Z",
    renewsAt: "2026-10-01T00:00:00.000Z",
    cancelada: false,
    metodo: { marca: "Visa", ultimos4: "4242", caduca: "08/28" },
  },
}

/** Los tres de fábrica tal y como salen de `PLANES_SEMILLA`. */
const CATALOGO_EJEMPLO = [
  {
    id: "free",
    origen: "semilla",
    base: "free",
    activo: true,
    visible: true,
    orden: 0,
    monthly: 0,
    yearly: 0,
    minutos: 60,
    cuentas: 1,
    asiento: 0,
    capacidades: [],
    featured: false,
  },
  {
    id: "creator",
    origen: "semilla",
    base: "creator",
    activo: true,
    visible: true,
    orden: 1,
    monthly: 29,
    yearly: 14.5,
    minutos: 600,
    cuentas: 6,
    asiento: 0,
    capacidades: ["programar", "participarCampanas", "clasesDePago", "operaciones"],
    featured: true,
  },
  {
    id: "business",
    origen: "semilla",
    base: "business",
    activo: true,
    visible: true,
    orden: 2,
    monthly: 39,
    yearly: 19.5,
    minutos: 600,
    cuentas: 20,
    asiento: 15,
    capacidades: ["programar", "participarCampanas", "clasesDePago", "operaciones"],
    featured: false,
  },
]

const CUERPO_PLAN_CICLO: Campo[] = [
  {
    nombre: "plan",
    tipo: "PlanId",
    requerido: true,
    descripcion: "El plan elegido en /precios. Tiene que estar activo y visible.",
  },
  {
    nombre: "ciclo",
    tipo: '"mensual" | "anual"',
    requerido: true,
    descripcion:
      "El ciclo que estaba puesto en el interruptor «Mensual» / «Anual» al pulsar el botón.",
  },
]

/* ---------------------------------------------------------------------------
   Los endpoints
   --------------------------------------------------------------------------- */

export const ENDPOINTS: Endpoint[] = [
  {
    id: "planes.listar",
    area: "planes",
    metodo: "GET",
    ruta: "/planes",
    resumen:
      "El catálogo de planes ya aplicado: los tres de la web con sus cambios y los creados en el backoffice.",
    descripcion:
      "Sustituye al almacén `clipealo-planes-v1`, que guarda semillas + parches: de un escalón solo lo que cambió (`ParchePlan`: si está activo o a la vista, orden, precios, minutos, cuentas, asiento, capacidades y si es el destacado) y los planes creados enteros. Lo leen /precios (tarjetas, comparativa, redes), la barra lateral, Facturación, el conmutador de plan y cada puerta. `useCatalogoPlanes` ya devuelve esta forma: conectar es que el hook la pida aquí.",
    estado: "por-construir",
    auth: "publico",
    respuesta: {
      tipo: "PlanCatalogo[]",
      definidoEn: "lib/planes.ts:50",
      campos: CAMPOS_PLAN,
      ejemplo: CATALOGO_EJEMPLO,
    },
    errores: [ERROR_SERVIDOR],
    reglas: [
      "Devolver el catálogo en su orden: por `orden`, a igual orden las semillas delante y después por id (`aplicarPlanes`, lib/planes.ts:145).",
      "Sin sesión, solo los activos y visibles: son los que enseña /precios (`planesVisibles`, lib/planes.ts:487). Un plan oculto hecho para un cliente no se publica.",
      "Con sesión, incluir además el plan de esa cuenta aunque esté oculto: `planDe` lo busca en el catálogo y, si no lo encuentra, cae a Creador (`PLAN_DEMO`), que daría capacidades de pago a quien no las paga.",
      "Las semillas van sin `nombre` ni `lema`: sus textos están en `messages/` en tres idiomas. Los creados, con los suyos tal como se escribieron.",
      "Mantener los invariantes que hoy guarda el navegador: como mucho un `featured` (al destacar uno, los demás dejan de estarlo: `unicoDestacado`, hooks/use-catalogo-planes.ts:85), `yearly` ≤ `monthly`, precios con dos decimales y los límites de `LIMITES_PLAN` (lib/planes.ts:80). Un dato fuera de rango se descarta al leer, como hace `migrarPlanes` (lib/planes.ts:453).",
      "Las redes y los clips medidos en Analíticas no viajan: los pone el escalón (`NETWORKS_BY_PLAN`, `CLIPS_ANALITICA_POR_PLAN`) y no se editan por plan.",
    ],
    origen: "hooks/use-catalogo-planes.ts:118",
  },
  {
    id: "planes.obtener-suscripcion",
    area: "planes",
    metodo: "GET",
    ruta: "/suscripcion",
    resumen:
      "El plan de la cuenta y su suscripción: ciclo, alta, renovación, cancelación pendiente y método de pago.",
    descripcion:
      "Junta lo que hoy está en tres sitios: el id del plan en `clipealo-plan-v1` (hooks/use-plan.ts), que en la demo cambia el conmutador «Plan · demo»; `suscripcionDemo` (lib/ajustes.ts), fija; y la renovación en `usage.renewsAt`. Basta con el id del plan: el front lo resuelve contra el catálogo.",
    estado: "por-construir",
    auth: "sesion",
    respuesta: SUSCRIPCION,
    errores: [ERROR_SESION, ERROR_SERVIDOR],
    reglas: [
      "El plan sale de la suscripción vigente, nunca del navegador: «En producción lo dice la suscripción, no el navegador. El conmutador del menú de usuario es un aparato de demostración» (docs/costuras-backend.md:64).",
      "Sin suscripción de pago vigente, `plan` es `free` (Prueba): es la misma definición con la que el backoffice cuenta cuentas por plan (components/admin/catalogo-planes.tsx:50).",
      "Un plan apagado o borrado no se devuelve tal cual: hoy `planDe` lo hace caer a Creador (lib/planes.ts:476). El servidor decide a qué plan pasa esa cuenta y devuelve ese id.",
      "Es el plan con el que el servidor repite cada puerta —programar, operaciones, participar en campañas, clases de pago, redes y cupo de cuentas, clips en Analíticas—: las del navegador son puertas de interfaz, no seguridad (components/planes/muro-plan.tsx:30); para publicar, la de red y cupo es `validarPublicacion` (docs/costuras-backend.md:117).",
      "`metodo` solo en planes de pago: con precio mensual 0 Facturación no enseña tarjeta, renovación, paso a anual ni cancelación (components/app/billing-settings.tsx:69).",
      "Las fechas viajan como instante ISO en UTC. Facturación las pinta con la zona del navegador (`f.date`, sin zona fija): una renovación a medianoche UTC se lee como el día anterior en América.",
    ],
    origen: "hooks/use-plan.ts:78",
  },
  {
    id: "planes.suscribir",
    area: "planes",
    metodo: "POST",
    ruta: "/suscripcion",
    resumen: "Contratar un plan de pago desde /precios, con su ciclo.",
    descripcion:
      "No existe todavía: los botones de las tarjetas y de la comparativa llevan a /subir. Es el «alta de suscripción» que falta en docs/costuras-backend.md §Cobro, junto con el portal de facturación y el webhook que mueva el plan. La pasarela no está elegida.",
    estado: "por-construir",
    auth: "sesion",
    cuerpo: {
      tipo: "{ plan: PlanId; ciclo: CicloFacturacion }",
      definidoEn: "lib/ajustes.ts:231",
      campos: CUERPO_PLAN_CICLO,
      ejemplo: { plan: "creator", ciclo: "anual" },
    },
    respuesta: {
      ...SUSCRIPCION,
      ejemplo: {
        plan: "creator",
        ciclo: "anual",
        estado: "activa",
        desde: "2026-09-13T12:20:00.000Z",
        renewsAt: "2027-09-13T12:20:00.000Z",
        cancelada: false,
        metodo: { marca: "Visa", ultimos4: "4242", caduca: "08/28" },
      },
    },
    errores: [
      ERROR_SESION,
      {
        codigo: "no-encontrado",
        http: 404,
        cuando: "El plan no está en el catálogo o está apagado.",
        frase: "common.errors.no-encontrado",
        bloquea: true,
      },
      {
        codigo: "conflicto",
        http: 409,
        cuando:
          "La cuenta ya tiene una suscripción de pago: cambiar de plan va por PATCH /suscripcion.",
        frase: "common.errors.conflicto",
        bloquea: true,
      },
      {
        codigo: "conflicto",
        http: 422,
        cuando:
          "El plan está oculto (solo se asigna desde el backoffice) o es de precio 0: Prueba no se contrata.",
        frase: "common.errors.conflicto",
        bloquea: true,
      },
      ERROR_SERVIDOR,
    ],
    reglas: [
      "El importe lo pone el servidor desde el catálogo (`monthly` o `yearly` del plan), nunca el cuerpo. En US$ (`MONEDA`, lib/pricing.ts:21) e impuestos aparte: el IGV o IVA se calcula al pagar según el país (pricing.faq.currencyTaxes).",
      "Con ciclo anual se paga el año por adelantado (`yearly` × 12: US$ 174 en Creador, US$ 234 en Empresa) y los minutos se entregan cada mes, no de golpe (pricing.faq.annualBilling).",
      "El plan cambia cuando la pasarela confirma el cobro (el webhook que pide docs/costuras-backend.md:90), no al pulsar el botón.",
      "Solo planes activos y visibles; Prueba (`free`, 0 US$) no se contrata: es el plan de toda cuenta sin suscripción de pago y «no se cobra ni caduca» (settings.billing.plan.freeNote).",
      "Medios que promete la web: tarjeta y, en Perú, Yape y Plin (pricing.faq.currencyTaxes).",
    ],
    origen: "components/marketing/pricing.tsx:237",
  },
  {
    id: "planes.cambiar-plan",
    area: "planes",
    metodo: "PATCH",
    ruta: "/suscripcion",
    resumen: "Cambiar el plan o el ciclo de una suscripción que ya existe.",
    descripcion:
      "Hoy el plan se cambia escribiendo el id en el navegador (`cambiarPlan`, hooks/use-plan.ts:49) y el ciclo es estado del componente de Facturación: «Pasar a anual» lo cambia hasta recargar.",
    estado: "por-construir",
    auth: "sesion",
    cuerpo: {
      tipo: "Partial<{ plan: PlanId; ciclo: CicloFacturacion }>",
      definidoEn: "lib/ajustes.ts:231",
      campos: CUERPO_PLAN_CICLO.map((c) => ({ ...c, requerido: false })),
      ejemplo: { ciclo: "anual" },
    },
    respuesta: SUSCRIPCION,
    errores: [
      ERROR_SESION,
      {
        codigo: "no-encontrado",
        http: 404,
        cuando: "El plan de destino no está en el catálogo o está apagado.",
        frase: "common.errors.no-encontrado",
        bloquea: true,
      },
      {
        codigo: "conflicto",
        http: 409,
        cuando:
          "La cuenta no tiene suscripción de pago (no hay ciclo que cambiar) o el plan de destino está oculto.",
        frase: "common.errors.conflicto",
        bloquea: true,
      },
      ERROR_SERVIDOR,
    ],
    reglas: [
      "Subir de plan: se paga solo la parte proporcional del ciclo y los minutos nuevos entran al momento. Bajar: el cambio se aplica al final del ciclo actual (pricing.faq.changePlan).",
      "Pasar a anual se cobra desde la próxima renovación: el aviso de Facturación dice «Desde el {renovación} pagas {yearly × 12} al año» (components/app/billing-settings.tsx:142).",
      "Bajar de plan no desconecta ninguna cuenta. Al publicar solo cuentan las primeras que se conectaron, de las redes del plan y hasta su cupo (`cuentasPublicables`, lib/planes.ts:602); el servidor aplica esa misma regla al publicar.",
      "En Empresa se pueden ampliar minutos sin cambiar de plan (pricing.faq.outOfCredits); esa ampliación no tiene todavía forma en el front.",
    ],
    origen: "hooks/use-plan.ts:49",
  },
  {
    id: "planes.cancelar",
    area: "planes",
    metodo: "POST",
    ruta: "/suscripcion/cancelar",
    resumen:
      "Cancelar la suscripción: el plan se conserva hasta el final del ciclo pagado.",
    descripcion:
      "Hoy «Cancelar suscripción» solo cambia un estado del componente (`setCancelada(true)`), que se pierde al recargar; la demo nunca pasa a Prueba.",
    estado: "por-construir",
    auth: "sesion",
    respuesta: {
      ...SUSCRIPCION,
      ejemplo: {
        plan: "creator",
        ciclo: "mensual",
        estado: "activa",
        desde: "2026-03-01T00:00:00.000Z",
        renewsAt: "2026-10-01T00:00:00.000Z",
        cancelada: true,
        metodo: { marca: "Visa", ultimos4: "4242", caduca: "08/28" },
      },
    },
    errores: [
      ERROR_SESION,
      {
        codigo: "conflicto",
        http: 409,
        cuando: "No hay suscripción de pago que cancelar, o ya estaba cancelada.",
        frase: "common.errors.conflicto",
        bloquea: true,
      },
      ERROR_SERVIDOR,
    ],
    reglas: [
      "Sin llamadas ni permanencia: se conserva el plan hasta `renewsAt` y después la cuenta pasa a Prueba —60 minutos al mes, 720p y marca de agua— (settings.billing.plan.cancelDialog).",
      "Reembolso: si es el primer pago y no se han consumido más de 30 créditos (minutos de video), se devuelve el importe durante los 7 días siguientes, y la factura pasa a `reembolsada` (pricing.faq.cancelRefund).",
      "Tras cancelar, todo el material se puede descargar durante 30 días (pricing.faq.afterCancel).",
      "Al pasar a Prueba, las puertas se cierran con ella: una cuenta y solo de TikTok para publicar, cinco clips en Analíticas, y sin programar, operaciones, campañas ni clases de pago (`PLAN_MINIMO`, lib/pricing.ts:75).",
    ],
    origen: "components/app/billing-settings.tsx:194",
  },
  {
    id: "planes.reactivar",
    area: "planes",
    metodo: "POST",
    ruta: "/suscripcion/reactivar",
    resumen: "Deshacer una cancelación antes de que termine el ciclo.",
    descripcion:
      "Es «Mantener {plan}» de Facturación. Hoy solo devuelve a `false` el estado del componente.",
    estado: "por-construir",
    auth: "sesion",
    respuesta: SUSCRIPCION,
    errores: [
      ERROR_SESION,
      {
        codigo: "conflicto",
        http: 409,
        cuando:
          "La suscripción no está cancelada, o `renewsAt` ya pasó y la cuenta está en Prueba.",
        frase: "common.errors.conflicto",
        bloquea: true,
      },
      ERROR_SERVIDOR,
    ],
    reglas: [
      "Solo mientras hay una cancelación pendiente y antes de `renewsAt`.",
      "La renovación sigue en la misma fecha y con el mismo plan y ciclo: «{plan} se renueva el {date}» (settings.billing.plan.reactivatedToast).",
    ],
    origen: "components/app/billing-settings.tsx:157",
  },
  {
    id: "planes.abrir-portal",
    area: "planes",
    metodo: "POST",
    ruta: "/suscripcion/portal",
    resumen: "Abrir el portal de la pasarela para cambiar el método de pago.",
    descripcion:
      "Es el «portal de facturación» que falta en docs/costuras-backend.md §Cobro. Hoy «Cambiar método de pago» solo avisa de que la pasarela no está conectada. La forma de la respuesta es nueva: el front aún no tiene un tipo para ella.",
    estado: "por-construir",
    auth: "sesion",
    respuesta: {
      tipo: "{ url: string }",
      campos: [
        {
          nombre: "url",
          tipo: "string",
          requerido: true,
          descripcion:
            "La dirección del portal de la pasarela, de un solo uso, a la que se manda a la persona.",
        },
      ],
    },
    errores: [
      ERROR_SESION,
      {
        codigo: "conflicto",
        http: 409,
        cuando: "La cuenta no tiene plan de pago: no hay método que cambiar.",
        frase: "common.errors.conflicto",
        bloquea: true,
      },
      ERROR_SERVIDOR,
    ],
    reglas: [
      "Solo con plan de pago (precio mensual > 0): en Prueba la tarjeta «Método de pago» no se pinta.",
      "Medios que tiene que admitir el portal: tarjeta y, en Perú, Yape y Plin (settings.billing.payment.gatewayToast, pricing.faq.currencyTaxes).",
      "Al volver, GET /suscripcion devuelve el `metodo` nuevo: marca, cuatro últimos dígitos y caducidad es todo lo que Facturación enseña.",
    ],
    origen: "components/app/billing-settings.tsx:270",
  },
  {
    id: "planes.listar-facturas",
    area: "planes",
    metodo: "GET",
    ruta: "/facturas",
    resumen: "Las facturas de la cuenta, de la más reciente a la más antigua.",
    descripcion: "Sustituye a `facturasDemo`: cuatro facturas fijas de Creador mensual.",
    estado: "por-construir",
    auth: "sesion",
    respuesta: {
      tipo: "Factura[]",
      definidoEn: "lib/ajustes.ts:233",
      campos: [
        {
          nombre: "id",
          tipo: "string",
          requerido: true,
          descripcion: "Número de la factura, visible en la tabla: «F-2026-0912».",
        },
        {
          nombre: "fecha",
          tipo: "string",
          requerido: true,
          descripcion: "Instante ISO de emisión.",
        },
        {
          nombre: "plan",
          tipo: "PricingPlanId",
          requerido: true,
          descripcion:
            "El escalón facturado. El concepto «Plan {plan} · {ciclo}» se compone traduciendo `pricing.plans.<id>.name`, así que hoy solo admite los tres de la web.",
        },
        {
          nombre: "ciclo",
          tipo: '"mensual" | "anual"',
          requerido: true,
          descripcion: "El ciclo facturado.",
        },
        {
          nombre: "importe",
          tipo: "number",
          requerido: true,
          descripcion: "US$ sin impuestos.",
        },
        {
          nombre: "estado",
          tipo: '"pagada" | "reembolsada"',
          requerido: true,
          descripcion: "Se pinta con `settings.billing.invoices.status.<estado>`.",
        },
      ],
      ejemplo: [
        {
          id: "F-2026-0912",
          fecha: "2026-09-01T00:00:00.000Z",
          plan: "creator",
          ciclo: "mensual",
          importe: 29,
          estado: "pagada",
        },
        {
          id: "F-2026-0811",
          fecha: "2026-08-01T00:00:00.000Z",
          plan: "creator",
          ciclo: "mensual",
          importe: 29,
          estado: "pagada",
        },
      ],
    },
    errores: [ERROR_SESION, ERROR_SERVIDOR],
    reglas: [
      "Solo las facturas de la cuenta de la sesión.",
      "Importes en dólares sin impuestos: el IGV o IVA va desglosado en cada factura (settings.billing.invoices.description).",
      "Se mandan ids, no textos: el concepto y el estado los traduce el front.",
      "`Factura.plan` es un escalón (`PricingPlanId`): para facturar un plan creado hay que ampliar el tipo a `PlanId` y nombrarlo con `useNombrePlan`, o el concepto no se puede escribir.",
    ],
    origen: "lib/ajustes.ts:243",
  },
  {
    id: "planes.descargar-factura",
    area: "planes",
    metodo: "GET",
    ruta: "/facturas/{id}/pdf",
    resumen: "El PDF de una factura.",
    descripcion:
      "Hoy el icono de descarga solo avisa: «La descarga en PDF llegará con la pasarela.».",
    estado: "por-construir",
    auth: "sesion",
    parametros: [
      {
        nombre: "id",
        tipo: "string",
        requerido: true,
        en: "ruta",
        descripcion: "Número de la factura (`Factura.id`), por ejemplo «F-2026-0912».",
      },
    ],
    respuesta: { tipo: "Blob" },
    errores: [
      ERROR_SESION,
      {
        codigo: "no-encontrado",
        http: 404,
        cuando: "La factura no existe o no es de la cuenta de la sesión.",
        frase: "common.errors.no-encontrado",
        bloquea: true,
      },
      ERROR_SERVIDOR,
    ],
    reglas: [
      "Responde `application/pdf`. Solo la descarga el dueño de la factura: la de otra cuenta responde como si no existiera.",
      "El PDF lleva el impuesto desglosado (settings.billing.invoices.description).",
    ],
    origen: "components/app/billing-settings.tsx:334",
  },
  {
    id: "planes.leer-consumo",
    area: "planes",
    metodo: "GET",
    ruta: "/consumo",
    resumen:
      "Los minutos de video consumidos y los clips sacados en el periodo en curso.",
    descripcion:
      "Sustituye a las cifras simuladas de lib/mock-data.ts: `minutosUsados(incluidos)` (el 69 % de lo que incluye el plan, línea 494) y `clipsDelMes(plan)` (87, o 6 en Prueba, línea 496). El front no tiene un tipo con nombre para esto: los dos campos se llaman como esas funciones. Los incluidos no viajan: el front los lee del plan (`plan.minutos`).",
    estado: "por-construir",
    auth: "sesion",
    respuesta: {
      tipo: "{ minutosUsados: number; clipsDelMes: number }",
      definidoEn: "lib/mock-data.ts:494",
      campos: [
        {
          nombre: "minutosUsados",
          tipo: "number",
          requerido: true,
          descripcion:
            "Minutos de video subidos desde la última renovación. Entero: la barra lateral, el Panel y Facturación lo pintan tal cual.",
        },
        {
          nombre: "clipsDelMes",
          tipo: "number",
          requerido: true,
          descripcion:
            "Clips sacados en el periodo. No consumen minutos: es solo información.",
        },
      ],
      ejemplo: { minutosUsados: 414, clipsDelMes: 87 },
    },
    errores: [ERROR_SESION, ERROR_SERVIDOR],
    reglas: [
      "Un minuto es un minuto de video subido; los clips, las exportaciones y las publicaciones no consumen (settings.billing.usage.note, pricing.faq.credit).",
      "El periodo termina en `renewsAt`: los minutos que no se consumen no pasan al mes siguiente (pricing.faq.outOfCredits).",
      "Hoy nada impide subir sin minutos. El servidor tiene que rechazar el trabajo nuevo al agotarse (POST /jobs); editar y publicar lo que ya hay sigue permitido (pricing.faq.outOfCredits). Ese rechazo aún no tiene código en el front.",
      "El aviso «Minutos por agotarse» sale «al llegar al 80 % de los minutos del mes» (settings.notifications.types.minutos), por los canales que la persona tenga encendidos en Ajustes › Notificaciones. Es el mismo umbral con el que Facturación pinta la barra en color de aviso (`AVISO_CONSUMO_PCT`, components/app/billing-settings.tsx:47).",
    ],
    origen: "lib/mock-data.ts:494",
  },
]
