import type { Campo, Endpoint, ErrorDoc } from "@/lib/wiki/tipos"

/**
 * Endpoints de «backoffice»: lo que `/admin` necesita del servidor.
 *
 * Ninguno está `conectado`. `lib/api/admin.ts` es una frontera de servidor
 * (`server-only`) que hoy no llama a `pedir()`: calcula la instantánea del mes
 * sobre el dataset simulado de `lib/admin/mock-data.ts`. Lo demás —catálogos de
 * planes y preguntas, moderación de campañas, solicitud de agencia, disputas y
 * casillero— vive en almacenes del navegador que el backoffice comparte con la
 * app, y las acciones del operador sobre el negocio (cobros, afiliados,
 * referidos, costes) son `MockAction`: enseñan «Acción simulada» con lo que
 * harían (AGENTS.md, «Backoffice»).
 *
 * Dos partes del backoffice tienen sus endpoints en otra área, porque son la
 * otra mitad de un dominio que ya vive allí: el catálogo de Formación
 * (`formacion.listar-catalogo-admin`, `formacion.crear-clase`…) y los retiros
 * (`wallet.listar-retiros`, `wallet.resolver-retiro`). Las acciones de este
 * archivo los citan por su id.
 *
 * Todos piden sesión de operador (`auth: "admin"`). Hoy no hay ninguna: `/admin`
 * se abre sin más (docs/costuras-backend.md, «Sesión e identidad»).
 *
 * Importes en dólares con decimales, nunca en centavos (lib/admin/types.ts:7).
 * Y un aviso para todo 422 de validación: `pedir()` lo convierte en el código
 * `conflicto` y el cuerpo solo va al registro (lib/api/cliente.ts:70), así que
 * para enseñar el código de dominio (`anualMayor`, `tituloCorto`…) la frontera
 * tendrá que leer el `{ code }` del cuerpo.
 */

/** El mes del selector, en la consulta. */
const MES: Campo = {
  nombre: "mes",
  tipo: "MonthKey",
  requerido: false,
  en: "consulta",
  descripcion:
    "Mes «AAAA-MM». Ausente o desconocido, el mes en curso (`resolveMonth`, lib/api/admin.ts:61). Hoy son doce: de 2025-10 a 2026-09 (`MESES`, lib/admin/mock-data.ts:61).",
}

const enRuta = (nombre: string, descripcion: string): Campo => ({
  nombre,
  tipo: "string",
  requerido: true,
  en: "ruta",
  descripcion,
})

const SIN_ADMIN: ErrorDoc = {
  codigo: "no-autorizado",
  http: 403,
  cuando: "No hay sesión de operador, o la sesión no es de admin.",
  frase: "common.errors.no-autorizado",
  bloquea: true,
}

const noExiste = (que: string): ErrorDoc => ({
  codigo: "no-encontrado",
  http: 404,
  cuando: `${que} no existe.`,
  frase: "common.errors.no-encontrado",
  bloquea: true,
})

const conflicto = (cuando: string): ErrorDoc => ({
  codigo: "conflicto",
  http: 409,
  cuando,
  frase: "common.errors.conflicto",
  bloquea: true,
})

const SOLO_ADMIN =
  "Solo una sesión de operador. Hoy ninguna ruta de `/admin` comprueba nada: el servidor es la única puerta."

const DE_MOCK =
  "Hoy es un `MockAction` (components/admin/mock-action.tsx:22): no escribe nada y enseña «Acción simulada» con el efecto. El cuerpo y la respuesta son la propuesta mínima para cumplir ese efecto: el front todavía no tiene un tipo para ellos."

/* ---------------------------------------------------------------------------
   Lectura: la instantánea del mes y sus tablas
   --------------------------------------------------------------------------- */

const LECTURA: Endpoint[] = [
  {
    id: "backoffice.listar-meses",
    area: "backoffice",
    metodo: "GET",
    ruta: "/admin/meses",
    resumen: "Los meses que se pueden elegir en el selector y cuál es el mes en curso.",
    descripcion:
      "Sustituye a `getAdminMonths`. Lo piden todas las páginas que pintan `AdminPage`: con él se arma el selector «Mes» y se decide si el mes elegido se escribe en la URL (el mes en curso nunca se escribe).",
    estado: "por-construir",
    auth: "admin",
    respuesta: {
      tipo: "{ months: MonthKey[]; current: MonthKey }",
      definidoEn: "lib/admin/types.ts:13",
      campos: [
        {
          nombre: "months",
          tipo: "MonthKey[]",
          requerido: true,
          descripcion: "Del más antiguo al actual. El selector los pinta al revés.",
        },
        {
          nombre: "current",
          tipo: "MonthKey",
          requerido: true,
          descripcion: "El mes en curso: el que vale cuando la URL no lleva `?mes=`.",
        },
      ],
      ejemplo: {
        months: [
          "2025-10",
          "2025-11",
          "2025-12",
          "2026-01",
          "2026-02",
          "2026-03",
          "2026-04",
          "2026-05",
          "2026-06",
          "2026-07",
          "2026-08",
          "2026-09",
        ],
        current: "2026-09",
      },
    },
    errores: [SIN_ADMIN],
    reglas: [
      SOLO_ADMIN,
      "`current` es el mes del instante de sincronización, nunca el reloj del navegador: «hoy» en el backoffice es `updatedAt` (AGENTS.md, «Backoffice»).",
      "Los meses van en orden ascendente y sin huecos: el selector no ordena.",
    ],
    origen: "lib/api/admin.ts:67",
  },
  {
    id: "backoffice.leer-sincronizacion",
    area: "backoffice",
    metodo: "GET",
    ruta: "/admin/sincronizacion",
    resumen:
      "El instante de la última sincronización y la zona horaria con la que se pinta.",
    descripcion:
      "Las páginas sin mes (Mercado, Disputas, Preguntas y Casillero) leen hoy `getAdminDataset()` entero solo para la cabecera «Actualizado el {fecha} · {zona}». Con servidor basta con esto: el dataset crudo no tiene que salir nunca.",
    estado: "por-construir",
    auth: "admin",
    respuesta: {
      tipo: 'Pick<AdminDataset, "updatedAt" | "timeZone">',
      definidoEn: "lib/admin/types.ts:428",
      campos: [
        {
          nombre: "updatedAt",
          tipo: "string",
          requerido: true,
          descripcion: "ISO en UTC. Es el «hoy» de todo el backoffice.",
        },
        {
          nombre: "timeZone",
          tipo: "string",
          requerido: true,
          descripcion: "Zona IANA. Hoy «America/Lima».",
        },
      ],
      ejemplo: { updatedAt: "2026-09-13T12:20:00.000Z", timeZone: "America/Lima" },
    },
    errores: [SIN_ADMIN],
    reglas: [
      SOLO_ADMIN,
      "`updatedAt` cambia cada vez que se sincroniza, y es parte de la clave de la caché de la instantánea (`cached`, lib/api/admin.ts:54): al cambiar, lo invalida todo.",
    ],
    origen: "lib/api/admin.ts:40",
  },
  {
    id: "backoffice.leer-mes",
    area: "backoffice",
    metodo: "GET",
    ruta: "/admin/meses/{mes}",
    resumen:
      "La instantánea entera de un mes: KPIs, colas del día, funnel, costes, publicaciones y programas.",
    descripcion:
      "Sustituye a `getAdminMonth`. Es la lectura central: la piden el layout (contadores de la barra lateral) y casi todas las páginas. Las definiciones de negocio viven en `lib/admin/metrics.ts` y solo ahí; el servidor devuelve la instantánea calculada y ninguna página recalcula una métrica.",
    estado: "por-construir",
    auth: "admin",
    parametros: [
      enRuta(
        "mes",
        "Mes «AAAA-MM». Uno desconocido cae al mes en curso, como `resolveMonth` (lib/api/admin.ts:61)."
      ),
    ],
    respuesta: {
      tipo: "MonthlySnapshot",
      definidoEn: "lib/admin/metrics.ts:847",
      campos: [
        {
          nombre: "mtd",
          tipo: "{ dia: number; diasMes: number } | null",
          requerido: true,
          descripcion:
            "Solo en el mes en curso: el día de corte. Con él la cabecera dice «Hasta hoy · día {dia} de {diasMes}» y lo de flujo se compara con los mismos días del mes anterior.",
        },
        {
          nombre: "colas",
          tipo: "ColaItem[]",
          requerido: true,
          descripcion:
            "«Hoy: colas con importe»: una fila por cosa que cobrar, arreglar o contactar, rojo antes que ámbar y luego por importe (lib/admin/metrics.ts:758).",
        },
        {
          nombre: "alertas",
          tipo: "AlertItem[]",
          requerido: true,
          descripcion:
            "Alertas agregadas por `id` (`AlertaId`, lib/admin/metrics.ts:237): cobros, renovaciones, retencion, pipeline, revisar, comisiones, recompensas, coste y publicaciones.",
        },
        {
          nombre: "vencimientos",
          tipo: "VencimientosBlock",
          requerido: true,
          descripcion:
            "Las colas de cobro y retención, con una fila por suscripción (`RenewalItem`, lib/admin/metrics.ts:484).",
        },
        {
          nombre: "costes",
          tipo: "CostesBlock",
          requerido: true,
          descripcion: "Coste de IA, salud del pipeline, anomalías y top de Prueba.",
        },
        {
          nombre: "publicaciones",
          tipo: "PublicacionesBlock",
          requerido: true,
          descripcion:
            "Lo publicado y las cuentas conectadas por estado. Hoy SIMULADO: la agenda y las cuentas viven en el navegador y la pantalla lo dice.",
        },
      ],
      ejemplo: {
        month: "2026-09",
        previousMonth: "2026-08",
        updatedAt: "2026-09-13T12:20:00.000Z",
        timeZone: "America/Lima",
        mtd: { dia: 13, diasMes: 30 },
        mrr: {
          total: 286.5,
          previous: 286.5,
          arr: 3438,
          enRiesgo: { monto: 146, n: 4, pct: 51, d7Monto: 0, d7N: 0 },
        },
        caja: { neta: 167.89 },
        actividad: { mau: 104, wau: 40 },
        alertas: [
          {
            id: "cobros",
            severidad: "alta",
            n: 2,
            monto: 68,
            href: "/admin/vencimientos",
          },
        ],
        colas: [
          {
            id: "v-sub_13",
            tipo: "cobro",
            semaforo: "rojo",
            titulo: "pendiente",
            userId: "u_0501",
            userName: "Lucía Peña",
            countryCode: "PE",
            plan: "business",
            monto: 39,
            antiguedadDias: 4,
            motivo: { code: "transferenciaSinVerificar", values: { horas: 90 } },
            accion: "verificar-pago",
            href: "/admin/vencimientos?cola=pendiente",
          },
        ],
      },
    },
    errores: [SIN_ADMIN],
    reglas: [
      SOLO_ADMIN,
      "Una sola definición de cliente de pago: suscripción activa (o dentro de los 7 días de gracia tras un cobro fallido, `GRACIA_DIAS`), plan distinto de Interno e importe mayor que 0 (`isPayingAt`, lib/admin/metrics.ts:951).",
      "MRR = suma del precio mensual normalizado (anual ÷ 12) de los clientes de pago en el instante de referencia; nunca «ingreso del mes × 12» (lib/admin/metrics.ts:69).",
      "Baja involuntaria: el cobro falló y pasaron los 7 días de gracia (`isActiveAt`, lib/admin/metrics.ts:940).",
      "Las variaciones son absolutas (`deltaOf`), nunca «% contra el mes anterior». En el mes en curso lo de flujo se compara con los mismos días del mes anterior y lo de stock con el cierre anterior.",
      "Nunca el reloj del sistema: el instante de referencia es `updatedAt` o el cierre del mes elegido.",
      "Frontera de datos (§7.7): de cuentas y publicaciones viajan id, red, estado, intentos y fechas; nunca el handle, el token ni la URL de lo publicado (lib/api/admin.ts:170).",
      "Se puede cachear por `updatedAt` + mes, como hace hoy `cached` (lib/api/admin.ts:54): el mismo dataset da siempre la misma instantánea.",
    ],
    origen: "lib/api/admin.ts:75",
  },
  {
    id: "backoffice.leer-series",
    area: "backoffice",
    metodo: "GET",
    ruta: "/admin/series",
    resumen:
      "Series mensuales (puente de MRR, caja, costes, altas) y cohortes de alta para las gráficas.",
    descripcion:
      "Sustituye a `getAdminSeries(count, until)`. El Panel, Ingresos y Costes piden 6 meses; Usuarios, 8 (para las cohortes). El ejemplo es lo que devuelve hoy la petición del Panel (6 meses hasta 2026-09), recortado al último punto y a la última cohorte; con 8 meses, `retencionM1.cerradas` pasa de 4 a 6.",
    estado: "por-construir",
    auth: "admin",
    parametros: [
      {
        nombre: "hasta",
        tipo: "MonthKey",
        requerido: false,
        en: "consulta",
        descripcion: "Último mes de la serie. Por defecto, el mes en curso.",
      },
      {
        nombre: "n",
        tipo: "number",
        requerido: false,
        en: "consulta",
        descripcion: "Cuántos meses hacia atrás, incluido `hasta`. Por defecto 12.",
      },
    ],
    respuesta: {
      tipo: "{ series: SeriesPoint[]; cohortes: CohortRow[]; retencionM1: RetencionM1Block }",
      definidoEn: "lib/admin/metrics.ts:3481",
      campos: [
        {
          nombre: "series",
          tipo: "SeriesPoint[]",
          requerido: true,
          descripcion:
            "Un punto por mes (lib/admin/metrics.ts:881). `enCurso` marca el mes parcial, que las gráficas dibujan aparte.",
        },
        {
          nombre: "cohortes",
          tipo: "CohortRow[]",
          requerido: true,
          descripcion:
            "Retención por cohorte de alta, meses +0 a +5; `null` donde el mes aún no ha llegado (lib/admin/metrics.ts:906).",
        },
        {
          nombre: "retencionM1",
          tipo: "RetencionM1Block",
          requerido: true,
          descripcion:
            "Retención M1 sobre activados de la última cohorte cerrada: episódico por debajo del 20 %, núcleo desde el 35 % (`RETENCION_M1`, lib/admin/metrics.ts:107).",
        },
      ],
      ejemplo: {
        series: [
          {
            month: "2026-09",
            mrr: 286.5,
            nuevo: 68,
            expansion: 0,
            reactivacion: 0,
            contraccion: 0,
            baja: 68,
            neto: 0,
            cobros: 175,
            rechazados: 39,
            costes: 4.21,
            comisiones: 0,
            cajaNeta: 167.89,
            altas: 37,
            activos: 64,
            pagando: 9,
            conversionPct: 1.4,
            proyectos: 86,
            clips: 783,
            costeFree: 3.03,
            costePorMinuto: 0.002,
            enCurso: true,
          },
        ],
        cohortes: [
          {
            cohorte: "2026-08",
            registrados: 48,
            activadosD7: 11,
            retencion: [29.2, 27.1, null, null, null, null],
            retencionActivados: [100, 18.2, null, null, null, null],
          },
        ],
        retencionM1: {
          cohorte: "2026-07",
          pct: 28.6,
          media3Anteriores: 43.57,
          cerradas: 4,
          nivel: "medio",
        },
      },
    },
    errores: [SIN_ADMIN],
    reglas: [
      SOLO_ADMIN,
      "Los meses salen de la lista de `listar-meses`, recortada a `n` hacia atrás desde `hasta` (lib/api/admin.ts:89).",
      "El mes en curso va con `enCurso: true` y sus cifras de flujo llegan hasta `updatedAt`.",
    ],
    origen: "lib/api/admin.ts:87",
  },
  {
    id: "backoffice.listar-usuarios",
    area: "backoffice",
    metodo: "GET",
    ruta: "/admin/usuarios",
    resumen:
      "Una fila por usuario registrado hasta el mes elegido, con su segmento, uso y pagos.",
    descripcion:
      "Sustituye a `getAdminUsers`. Hoy llegan las 652 filas y `AdminTable` busca, filtra, ordena y pagina en el navegador; docs/costuras-backend.md pide paginación, búsqueda y orden en servidor. Si se hace, los parámetros son los que ya viven en la URL de la tabla, que son parte del contrato entre páginas.",
    estado: "por-construir",
    auth: "admin",
    parametros: [
      MES,
      {
        nombre: "segmento",
        tipo: "Segmento",
        requerido: false,
        en: "consulta",
        descripcion:
          "pql, pagante-inactivo, cobro-fallido, pendiente-verificacion, incoherencia, revisar, ex-pagante, dormido, sin-activar o activo (lib/admin/rows.ts:41). El Panel enlaza a `?segmento=pql`.",
      },
      {
        nombre: "q",
        tipo: "string",
        requerido: false,
        en: "consulta",
        descripcion:
          "Busca en nombre, correo y país. Las colas del Panel enlazan a `?q=<nombre>`.",
      },
    ],
    respuesta: {
      tipo: "UserRow[]",
      definidoEn: "lib/admin/rows.ts:53",
      ejemplo: [
        {
          id: "u_0127",
          name: "Ariana Mendoza",
          email: "ariana.mendoza@gmail.com",
          countryCode: "PE",
          plan: "free",
          suscripcion: "ninguna",
          channel: "directo",
          canalResuelto: { code: "canal", values: { canal: "directo" } },
          createdAt: "2026-02-10T06:09:58.243Z",
          cohorte: "2026-02",
          lastActiveAt: "2026-09-11T22:06:41.737Z",
          diasInactivo: 2,
          proyectos30d: 1,
          proyectosListos: 2,
          minutos30d: 31.1,
          costeIa30d: 0.06,
          pagosAprobados: 0,
          totalPaid: 0,
          pagosPendientes: 0,
          pagosRechazados: 0,
          ultimoProyectoAt: "2026-09-11T22:06:41.737Z",
          segmentos: ["pql"],
          prioridad: 600031.1,
        },
      ],
    },
    errores: [SIN_ADMIN],
    reglas: [
      SOLO_ADMIN,
      "Solo lo que la tabla pinta, filtra u ordena: cada campo de más viaja 652 veces al navegador (lib/admin/rows.ts:57).",
      "Orden por defecto: `prioridad` = peso del segmento más grave × 100 000 + minutos en 30 d (`prioridadDe`, lib/admin/rows.ts:111). Pesan 6 PQL y pagante inactivo; 5 cobro fallido y pendiente de verificar; 4 incoherencia y revisar; 3 ex-pagante; 2 dormido; 1 sin activar (lib/admin/rows.ts:93).",
      "PQL: plan Prueba, sin suspender y sin ningún pago, con 2 o más proyectos listos en 14 d, o el 80 % de sus minutos gastados en 30 d, o activo en los últimos 3 días con un proyecto listo en 30 d y 10 o más clips (`motivoPql`, lib/admin/metrics.ts:997).",
      "Incoherencia: etiqueta de plan de pago sin suscripción de pago detrás; una vencida o pendiente de pago no cuenta, porque ya está en la cola de cobro (`esIncoherente`, lib/admin/metrics.ts:979).",
      "Dormido: activó alguna vez, lleva entre 30 y 180 días sin entrar y no paga; ex-pagante si pagó alguna vez (`estadoDormido`, lib/admin/metrics.ts:1021).",
      "Guarda códigos, no frases: la tabla traduce segmentos, canales y estados.",
    ],
    origen: "lib/api/admin.ts:94",
  },
  {
    id: "backoffice.listar-pagos",
    area: "backoffice",
    metodo: "GET",
    ruta: "/admin/pagos",
    resumen:
      "Cada intento de cobro hasta la fecha de corte, con su atribución, su comisión y su recompensa.",
    descripcion:
      "Sustituye a `getAdminPayments`. Es la tabla «Pagos» de /admin/ingresos.",
    estado: "por-construir",
    auth: "admin",
    parametros: [MES],
    respuesta: {
      tipo: "PaymentRow[]",
      definidoEn: "lib/admin/rows.ts:215",
      ejemplo: [
        {
          id: "pay_13_p1",
          userId: "u_0501",
          subscriptionId: "sub_13",
          plan: "business",
          amount: 39,
          status: "pendiente",
          method: "transferencia",
          kind: "renovacion",
          createdAt: "2026-09-09T18:30:00.000Z",
          userName: "Lucía Peña",
          userEmail: "lucia.pena0@hotmail.com",
          billing: "mensual",
          atribucion: { code: "canal", values: { canal: "organico" } },
          comision: 0,
          recompensa: 0,
          causaReembolso: null,
        },
      ],
    },
    errores: [SIN_ADMIN],
    reglas: [
      SOLO_ADMIN,
      "Solo los pagos creados hasta el instante de referencia del mes (lib/admin/rows.ts:228).",
      "Orden: pendientes, luego rechazados, luego el resto; dentro, del más reciente al más antiguo (lib/admin/rows.ts:268).",
      "`comision` solo en pagos aprobados; `recompensa` solo en el primer pago aprobado (`kind: nueva`) de un referido convertido, valorada a US$ 29 ÷ 600 el minuto (`VALOR_MINUTO_RECOMPENSA`, lib/admin/metrics.ts:122).",
      "`causaReembolso` en los reembolsados: «pipeline» si el usuario tuvo un proyecto en error en los 7 días anteriores, «duplicado» si hay otro aprobado del mismo importe a menos de un día, «otro» si no (lib/admin/rows.ts:236).",
    ],
    origen: "lib/api/admin.ts:99",
  },
  {
    id: "backoffice.listar-proyectos",
    area: "backoffice",
    metodo: "GET",
    ruta: "/admin/proyectos",
    resumen:
      "Los proyectos con su coste de IA, el desglose por proveedor y modelo, la anomalía y el tiempo en cola.",
    descripcion:
      "Sustituye a `getAdminProjects`. Es la tabla «Proyectos con coste» de /admin/costes.",
    estado: "por-construir",
    auth: "admin",
    parametros: [MES],
    respuesta: {
      tipo: "ProjectRow[]",
      definidoEn: "lib/admin/rows.ts:275",
      ejemplo: [
        {
          id: "prj_1119",
          userId: "u_0209",
          userPlan: "free",
          source: "kick",
          status: "error",
          createdAt: "2026-08-29T22:03:14.435Z",
          clips: 0,
          minutes: 34.9,
          cost: 0.07496,
          userName: "Fabián Ortiz",
          costePorMinuto: 0.0021,
          desglose: [
            { provider: "assemblyai", model: "universal-3", amount: 0.05235 },
            { provider: "gemini", model: "gemini-3.1-flash", amount: 0.02261 },
          ],
          anomalia: null,
          horasEnCola: null,
          sinResolver: true,
        },
      ],
    },
    errores: [SIN_ADMIN],
    reglas: [
      SOLO_ADMIN,
      "Anomalía: coste mayor que 3 veces la mediana de los proyectos de 30 d («coste-3x-mediana») o coste por minuto mayor que 2 veces su mediana («coste-minuto-2x-mediana») (lib/admin/rows.ts:309).",
      "`sinResolver`: en error y sin un proyecto listo posterior del mismo usuario y la misma fuente.",
      "`horasEnCola` solo en los que siguen «procesando».",
      "Orden: sin resolver, luego anómalos, luego el resto del más nuevo al más viejo (lib/admin/rows.ts:336).",
    ],
    origen: "lib/api/admin.ts:104",
  },
  {
    id: "backoffice.listar-referidos",
    area: "backoffice",
    metodo: "GET",
    ruta: "/admin/referidos",
    resumen:
      "Una fila por referido, con el estado del invitado y el de la recompensa de quien invitó.",
    descripcion: "Sustituye a `getAdminReferrals`. Es la tabla «Todos los referidos».",
    estado: "por-construir",
    auth: "admin",
    parametros: [MES],
    respuesta: {
      tipo: "ReferralRow[]",
      definidoEn: "lib/admin/rows.ts:341",
      ejemplo: [
        {
          id: "ref_066",
          referrerId: "u_0241",
          referrerName: "Micaela Rojas",
          referrerPlan: "business",
          referredId: "u_0591",
          referredName: "Santiago Arias",
          referredEmail: "santiago.arias90@gmail.com",
          referredCountry: "PE",
          createdAt: "2026-08-06T06:26:15.828Z",
          status: "convertido",
          activadoAt: "2026-08-16T06:49:34.840Z",
          convertidoAt: "2026-09-05T14:05:00.000Z",
          rewardMinutes: 60,
          rewardValor: 2.9,
          rewardEstado: "pendiente",
          antiguedadPendienteDias: 8,
          atascado: false,
          ingresoInvitado: 29,
        },
      ],
    },
    errores: [SIN_ADMIN],
    reglas: [
      SOLO_ADMIN,
      "Recompensa pendiente: el invitado ya convirtió y quien invitó no ha recibido sus minutos (lib/admin/rows.ts:369).",
      "Atascado: el invitado sigue «registrado» más de 14 días después de la invitación (lib/admin/rows.ts:398).",
      "`rewardValor` = minutos × US$ 29 ÷ 600 (`VALOR_MINUTO_RECOMPENSA`): 60 min valen US$ 2,90.",
      "Orden: pendientes (la más antigua primero), luego atascados, luego por fecha.",
    ],
    origen: "lib/api/admin.ts:109",
  },
  {
    id: "backoffice.listar-suscripciones",
    area: "backoffice",
    metodo: "GET",
    ruta: "/admin/suscripciones",
    resumen: "Las suscripciones empezadas hasta el mes elegido, con su MRR normalizado.",
    descripcion:
      "Sustituye a `getAdminSubscriptions`. Alimenta /admin/planes: la tabla «Suscripciones» y la tarjeta «Qué cuenta como cliente de pago».",
    estado: "por-construir",
    auth: "admin",
    parametros: [MES],
    respuesta: {
      tipo: "SubscriptionRow[]",
      definidoEn: "lib/admin/rows.ts:456",
      ejemplo: [
        {
          id: "sub_01",
          userId: "u_0241",
          plan: "business",
          status: "activa",
          billing: "mensual",
          amount: 39,
          startedAt: "2026-05-03T14:00:00.000Z",
          renewsAt: "2026-10-03T14:00:00.000Z",
          paymentMethod: "tarjeta",
          userName: "Micaela Rojas",
          userEmail: "micaela.rojas40@gmail.com",
          activa: true,
          mrr: 39,
        },
      ],
    },
    errores: [SIN_ADMIN],
    reglas: [
      SOLO_ADMIN,
      "`mrr` = importe ÷ 12 si es anual; el importe, si es mensual.",
      "`activa` con la misma regla de gracia de 7 días que el MRR (`isActiveAt`).",
      "Orden: activas primero y, dentro, por MRR de mayor a menor.",
    ],
    origen: "lib/api/admin.ts:114",
  },
  {
    id: "backoffice.listar-usuarios-afiliado",
    area: "backoffice",
    metodo: "GET",
    ruta: "/admin/afiliados/{id}/usuarios",
    resumen:
      "Los usuarios que trajo un código de afiliado, con lo que pagaron y la comisión que generan.",
    descripcion:
      "Sustituye a `getAffiliateUsers`. La página de afiliados la pide una vez por afiliado para pintar «Usuarios atribuidos por afiliado».",
    estado: "por-construir",
    auth: "admin",
    parametros: [
      enRuta("id", "Id del afiliado, p. ej. `af_01` (Creadores Perú, CREADORESPE)."),
      MES,
    ],
    respuesta: {
      tipo: "AffiliateUserRow[]",
      definidoEn: "lib/admin/rows.ts:413",
      ejemplo: [
        {
          id: "u_0481",
          name: "Sebastián Mamani",
          email: "sebastian.mamani80@outlook.com",
          countryCode: "CL",
          createdAt: "2026-07-16T22:57:27.258Z",
          plan: "business",
          activadoD7: true,
          proyectos: 4,
          totalPaid: 39,
          comision: 9.75,
          costeIa: 0.16,
          method: "yape",
        },
      ],
    },
    errores: [SIN_ADMIN, noExiste("El afiliado")],
    reglas: [
      SOLO_ADMIN,
      "`comision` = total pagado × % de comisión del afiliado (25 % en CREADORESPE: US$ 39 → US$ 9,75).",
      "`activadoD7`: primer clip listo en los 7 días siguientes al alta (`esActivadoD7`, lib/admin/metrics.ts:956).",
      "Hoy un id desconocido devuelve la lista vacía (lib/admin/rows.ts:435); con servidor, 404.",
    ],
    origen: "lib/api/admin.ts:121",
  },
  {
    id: "backoffice.contar-cuentas-por-plan",
    area: "backoffice",
    metodo: "GET",
    ruta: "/admin/planes/cuentas",
    resumen:
      "Cuántas cuentas hay en cada plan al cierre del mes y cuántas de ellas pagan.",
    descripcion:
      "Sustituye a `getAdminCuentasPorPlan`. Lo pinta cada fila del catálogo editable de /admin/planes («{n} cuentas · {pago} de pago»).",
    estado: "por-construir",
    auth: "admin",
    parametros: [MES],
    respuesta: {
      tipo: "Record<string, CuentasPlan>",
      definidoEn: "lib/admin/metrics.ts:353",
      ejemplo: {
        free: { cuentas: 638, dePago: 0 },
        creator: { cuentas: 5, dePago: 5 },
        business: { cuentas: 4, dePago: 4 },
        interno: { cuentas: 5, dePago: 0 },
      },
    },
    errores: [SIN_ADMIN],
    reglas: [
      SOLO_ADMIN,
      "Cada cuenta está en el plan de su suscripción de pago vigente y, sin ella, en Prueba; Interno, por su etiqueta (`planResueltoAt`, lib/admin/metrics.ts:1052). La etiqueta `plan` del usuario no manda.",
      "Un plan creado en el catálogo (`plan_…`) no sale hasta que el servidor lo devuelva en usuarios y suscripciones: su fila dice «Sin cuentas todavía en los datos del negocio».",
      "`cuentas` no es un id de plan (los planes son free, creator, business o `plan_…`), así que la ruta no choca con `/admin/planes/{id}`.",
    ],
    origen: "lib/api/admin.ts:81",
  },
  {
    id: "backoffice.leer-onboarding",
    area: "backoffice",
    metodo: "GET",
    ruta: "/admin/onboarding",
    resumen:
      "El funnel de «Tu primer corte»: inicio, finalización, tiempos, tomas y consentimientos.",
    descripcion:
      "Sustituye a `getAdminOnboarding`. Es el bloque «Bienvenida» del Panel. Hoy los datos son simulados con semilla propia y la pantalla lo dice.",
    estado: "por-construir",
    auth: "admin",
    respuesta: {
      tipo: "OnboardingResumen",
      definidoEn: "lib/admin/metrics.ts:3641",
      ejemplo: {
        cuentas: 474,
        iniciados: 446,
        completados: 364,
        tasaInicio: 0.941,
        tasaFinalizacion: 0.816,
        p50Ms: 57983,
      },
    },
    errores: [SIN_ADMIN],
    reglas: [
      SOLO_ADMIN,
      "Solo ids, recuentos y fechas (§7.7): nunca el texto libre ni lo que gana cada cuenta (lib/admin/types.ts:146).",
      "Los tiempos por toma cuentan solo con la pestaña visible.",
    ],
    origen: "lib/api/admin.ts:139",
  },
  {
    id: "backoffice.leer-mercado",
    area: "backoffice",
    metodo: "GET",
    ruta: "/admin/mercado",
    resumen:
      "Oferta de cliperos frente a presupuesto activo por nicho y país: huecos, excedentes, CPM que llena y creadores con fans sin campaña.",
    descripcion:
      "Sustituye a `getAdminMercado`. La página pide hoy la vista sin filtros; la función ya acepta idioma y red, y los dos entran en la clave de la caché.",
    estado: "por-construir",
    auth: "admin",
    parametros: [
      {
        nombre: "idioma",
        tipo: "IdiomaAudiencia",
        requerido: false,
        en: "consulta",
        descripcion:
          "Filtra oferta y demanda por idioma de audiencia. Sin él, cualquiera.",
      },
      {
        nombre: "red",
        tipo: "SocialId",
        requerido: false,
        en: "consulta",
        descripcion: "Filtra por red. Sin ella, todas.",
      },
    ],
    respuesta: {
      tipo: "MercadoResumen",
      definidoEn: "lib/admin/metrics.ts:3769",
      ejemplo: {
        cliperos: 460,
        enRiesgo: 13615,
        huecos: [
          {
            clave: "deportes|global|*|*",
            vertical: "deportes",
            pais: "global",
            idioma: null,
            red: null,
            O: 5.5,
            D: 3144.41,
            R: 1.75,
            n: 10,
            campanas: 1,
            estado: "escasez",
            nivel: "celda",
            muestraBaja: true,
            oculta: false,
            envios7d: 23,
            saturacion: 7.31,
          },
        ],
      },
    },
    errores: [SIN_ADMIN],
    reglas: [
      SOLO_ADMIN,
      "Nada de aquí devuelve personas, solo recuentos; y una celda con menos de 10 personas no enseña su cifra (lib/mercado.ts:36).",
      "Ventana de 28 días. Cobertura R = cliperos ponderados por cada US$ 1.000 activos (`cobertura`, lib/mercado.ts:334).",
      "Estado de la celda (`estadoCelda`, lib/mercado.ts:345): sin oferta si hay dinero y nadie; escasez si R < 2 con al menos US$ 500 activos; excedente si R > 20, o sin demanda con una oferta ponderada de 20 o más; equilibrio si R está entre 2 y 20; sin datos en lo demás (sin demanda y oferta menor de 20, o R < 2 con menos de US$ 500).",
      "Muestra baja: oferta ponderada por debajo de 10 o menos de 3 campañas (`UMBRALES_MERCADO`, lib/mercado.ts:41).",
      "CPM que llena: campañas empezadas en los últimos 90 días que gastaron el 80 % antes de terminar o tuvieron 10 aprobados en su primera semana; con menos de 8 campañas se usa la base siguiente.",
    ],
    origen: "lib/api/admin.ts:149",
  },
]

/* ---------------------------------------------------------------------------
   Cobros: pagos, reintentos y recordatorios
   --------------------------------------------------------------------------- */

const PAGO_ID = enRuta("id", "Id del pago, p. ej. `pay_13_p1`.")

const COBROS: Endpoint[] = [
  {
    id: "backoffice.aprobar-pago",
    area: "backoffice",
    metodo: "POST",
    ruta: "/admin/pagos/{id}/aprobar",
    resumen:
      "Da por bueno un pago pendiente de verificar y activa la suscripción que paga.",
    descripcion: `${DE_MOCK} Efecto hoy anunciado: «Marcaría como aprobado el pago {pago} de {quien} y activaría la suscripción {suscripcion}» (admin.ingresos.table.approveEffect).`,
    estado: "por-construir",
    auth: "admin",
    parametros: [PAGO_ID],
    respuesta: {
      tipo: "Payment",
      definidoEn: "lib/admin/types.ts:273",
      ejemplo: {
        id: "pay_13_p1",
        userId: "u_0501",
        subscriptionId: "sub_13",
        plan: "business",
        amount: 39,
        status: "aprobado",
        method: "transferencia",
        kind: "renovacion",
        createdAt: "2026-09-09T18:30:00.000Z",
      },
    },
    errores: [
      SIN_ADMIN,
      noExiste("El pago"),
      conflicto("El pago ya no está «pendiente»: alguien lo aprobó o rechazó antes."),
    ],
    reglas: [
      SOLO_ADMIN,
      "Solo desde `pendiente`: la tabla solo ofrece «Aprobar» en los pendientes (components/admin/ingresos-pagos-table.tsx:44).",
      "Aprobar activa la suscripción del pago (`subscriptionId`) y la saca de la cola «pendiente» de Vencimientos.",
      "Si el usuario llegó por un afiliado, el pago aprobado devenga su comisión; si es el primer pago de un referido, deja pendiente la recompensa de quien invitó.",
      "Deja registro de quién aprobó y cuándo.",
    ],
    origen: "components/admin/ingresos-pagos-table.tsx:47",
  },
  {
    id: "backoffice.rechazar-pago",
    area: "backoffice",
    metodo: "POST",
    ruta: "/admin/pagos/{id}/rechazar",
    resumen: "Rechaza un pago pendiente y avisa al usuario para que reintente.",
    descripcion: `${DE_MOCK} Efecto anunciado: «Rechazaría el pago {pago} de {quien} y avisaría al usuario para que reintente» (admin.ingresos.table.rejectEffect).`,
    estado: "por-construir",
    auth: "admin",
    parametros: [PAGO_ID],
    respuesta: {
      tipo: "Payment",
      definidoEn: "lib/admin/types.ts:273",
      ejemplo: {
        id: "pay_13_p1",
        userId: "u_0501",
        subscriptionId: "sub_13",
        plan: "business",
        amount: 39,
        status: "rechazado",
        method: "transferencia",
        kind: "renovacion",
        createdAt: "2026-09-09T18:30:00.000Z",
      },
    },
    errores: [
      SIN_ADMIN,
      noExiste("El pago"),
      conflicto("El pago ya no está «pendiente»."),
    ],
    reglas: [
      SOLO_ADMIN,
      "Solo desde `pendiente`.",
      "Manda el aviso al usuario; la suscripción queda en la cola de rechazados sin recuperar.",
    ],
    origen: "components/admin/ingresos-pagos-table.tsx:58",
  },
  {
    id: "backoffice.reintentar-cobro",
    area: "backoffice",
    metodo: "POST",
    ruta: "/admin/pagos/{id}/reintentar",
    resumen: "Vuelve a intentar un cobro rechazado por el mismo método.",
    descripcion: `${DE_MOCK} Efecto anunciado: «Reintentaría el cobro de {quien} por {metodo} o registraría un pago manual por Yape o transferencia» (admin.ingresos.table.retryEffect). Para el pago manual está \`registrar-pago-manual\`.`,
    estado: "por-construir",
    auth: "admin",
    parametros: [PAGO_ID],
    respuesta: {
      tipo: "Payment",
      definidoEn: "lib/admin/types.ts:273",
      campos: [
        {
          nombre: "status",
          tipo: '"aprobado" | "rechazado" | "pendiente"',
          requerido: true,
          descripcion:
            "El resultado del nuevo intento, que es un pago nuevo; el rechazado no se toca.",
        },
        {
          nombre: "failureReason",
          tipo: "FailureReason",
          requerido: false,
          descripcion:
            "Si vuelve a fallar, el código de la pasarela: fondos-insuficientes, tarjeta-vencida, rechazada-emisor o yape-tiempo-agotado (lib/admin/types.ts:265).",
        },
      ],
      ejemplo: {
        id: "pay_11_r2",
        userId: "u_0401",
        subscriptionId: "sub_11",
        plan: "creator",
        amount: 29,
        status: "aprobado",
        method: "tarjeta",
        kind: "renovacion",
        createdAt: "2026-09-13T12:20:00.000Z",
      },
    },
    errores: [
      SIN_ADMIN,
      noExiste("El pago"),
      conflicto(
        "El pago no está «rechazado», o ya hay un cobro aprobado posterior de esa suscripción."
      ),
    ],
    reglas: [
      SOLO_ADMIN,
      "Solo sobre un pago `rechazado` (la tabla solo ofrece «Reintentar» ahí).",
      "El reintento es un pago nuevo con el mismo `subscriptionId`: el rechazado se queda como está, porque cuenta en los intentos fallidos de la cola.",
      "El motivo de rechazo viaja como código, nunca como la frase de la pasarela.",
    ],
    origen: "components/admin/ingresos-pagos-table.tsx:70",
  },
  {
    id: "backoffice.reembolsar-pago",
    area: "backoffice",
    metodo: "POST",
    ruta: "/admin/pagos/{id}/reembolsar",
    resumen:
      "Registra el reembolso de un pago aprobado y descuenta lo que arrastraba en comisión y recompensa.",
    descripcion: `${DE_MOCK} El efecto cambia según lo que arrastre el pago: solo reembolso; «restaría {comision} de la comisión del afiliado»; «marcaría la recompensa del referido como no procedente»; o las dos cosas (admin.ingresos.table.refundEffect*).`,
    estado: "por-construir",
    auth: "admin",
    parametros: [PAGO_ID],
    cuerpo: {
      tipo: "{ causa?: CausaReembolso }",
      definidoEn: "lib/admin/rows.ts:213",
      campos: [
        {
          nombre: "causa",
          tipo: '"pipeline" | "duplicado" | "otro"',
          requerido: false,
          descripcion:
            "Si el operador la sabe. Si no, el servidor la deduce como hoy `computePaymentRows`.",
        },
      ],
      ejemplo: { causa: "duplicado" },
    },
    respuesta: {
      tipo: "Payment",
      definidoEn: "lib/admin/types.ts:273",
      ejemplo: {
        id: "pay_04_2",
        userId: "u_0391",
        subscriptionId: "sub_04",
        plan: "creator",
        amount: 29,
        status: "reembolsado",
        method: "plin",
        kind: "renovacion",
        createdAt: "2026-08-22T14:05:00.000Z",
      },
    },
    errores: [SIN_ADMIN, noExiste("El pago"), conflicto("El pago no está «aprobado».")],
    reglas: [
      SOLO_ADMIN,
      "Solo sobre un pago `aprobado`.",
      "Si el pago tenía comisión de afiliado, se descuenta de su devengada (en el ejemplo, US$ 5,80 del 20 % de PODLIMA).",
      "Si era el primer pago de un referido convertido, su recompensa pasa a «no procede».",
      "Hoy un pago reembolsado no tiene fecha de reembolso propia: la caja neta lo resta en el mes del pago original (`cajaNetaEn`, lib/admin/metrics.ts:1490). Si el servidor guarda la fecha del reembolso, la métrica tendrá que leer esa.",
    ],
    origen: "components/admin/ingresos-pagos-table.tsx:94",
  },
  {
    id: "backoffice.registrar-pago-manual",
    area: "backoffice",
    metodo: "POST",
    ruta: "/admin/pagos",
    resumen:
      "Registra un pago que llegó fuera de la pasarela: Yape, Plin o transferencia, con su comprobante.",
    descripcion: `${DE_MOCK} Efecto anunciado: «Abriría el formulario de pago manual: usuario, plan, importe y método (Yape, Plin o transferencia) con el comprobante» (admin.ingresos.pagos.manualEffect).`,
    estado: "por-construir",
    auth: "admin",
    cuerpo: {
      tipo: 'Pick<Payment, "userId" | "plan" | "amount" | "method"> & { comprobante: string }',
      definidoEn: "lib/admin/types.ts:273",
      campos: [
        { nombre: "userId", tipo: "string", requerido: true, descripcion: "Quién paga." },
        {
          nombre: "plan",
          tipo: "PlanId",
          requerido: true,
          descripcion: "creator o business: Prueba e Interno no se cobran.",
        },
        {
          nombre: "amount",
          tipo: "number",
          requerido: true,
          descripcion: "En dólares, con decimales.",
        },
        {
          nombre: "method",
          tipo: '"yape" | "plin" | "transferencia"',
          requerido: true,
          descripcion: "Los tres manuales de `PAYMENT_METHODS` (lib/admin/types.ts:247).",
        },
        {
          nombre: "comprobante",
          tipo: "string",
          requerido: true,
          descripcion: "Referencia u operación del comprobante.",
        },
      ],
      ejemplo: {
        userId: "u_0501",
        plan: "business",
        amount: 39,
        method: "yape",
        comprobante: "YAPE-0913-4471",
      },
    },
    respuesta: {
      tipo: "Payment",
      definidoEn: "lib/admin/types.ts:273",
      ejemplo: {
        id: "pay_13_m1",
        userId: "u_0501",
        subscriptionId: "sub_13",
        plan: "business",
        amount: 39,
        status: "aprobado",
        method: "yape",
        kind: "renovacion",
        createdAt: "2026-09-13T12:20:00.000Z",
      },
    },
    errores: [
      SIN_ADMIN,
      noExiste("El usuario"),
      conflicto("El plan no se vende (Prueba o Interno) o el importe no es mayor que 0."),
    ],
    reglas: [
      SOLO_ADMIN,
      "`kind` lo decide el servidor: «nueva» si no había suscripción de pago, «renovacion» o «upgrade» si la había.",
      "Guarda la referencia del comprobante con el pago: es lo que el efecto anunciado pide (admin.ingresos.pagos.manualEffect).",
      "Si trae comisión o recompensa, las devenga igual que un pago de pasarela.",
    ],
    origen: "app/[locale]/(admin)/admin/ingresos/page.tsx:220",
  },
  {
    id: "backoffice.exportar-pagos",
    area: "backoffice",
    metodo: "GET",
    ruta: "/admin/pagos.csv",
    resumen: "Descarga los pagos del mes en CSV, con los filtros aplicados.",
    descripcion: `${DE_MOCK} Efecto anunciado: «Descargaría los pagos del mes con los filtros aplicados en CSV, con las mismas columnas de la tabla» (admin.ingresos.pagos.exportEffect).`,
    estado: "por-construir",
    auth: "admin",
    parametros: [
      MES,
      {
        nombre: "estado",
        tipo: "PaymentStatus",
        requerido: false,
        en: "consulta",
        descripcion:
          "aprobado, rechazado, pendiente o reembolsado: el filtro «Estado» de la tabla.",
      },
      {
        nombre: "tipo",
        tipo: "PaymentKind",
        requerido: false,
        en: "consulta",
        descripcion: "nueva, renovacion o upgrade.",
      },
      {
        nombre: "metodo",
        tipo: "PaymentMethod",
        requerido: false,
        en: "consulta",
        descripcion: "tarjeta, yape, plin o transferencia.",
      },
      {
        nombre: "plan",
        tipo: '"creator" | "business"',
        requerido: false,
        en: "consulta",
        descripcion: "Solo los planes de pago.",
      },
      {
        nombre: "q",
        tipo: "string",
        requerido: false,
        en: "consulta",
        descripcion: "La búsqueda «Buscar usuario o correo».",
      },
    ],
    respuesta: {
      tipo: "string (text/csv)",
      ejemplo:
        "fecha,usuario,correo,plan,tipo,ciclo,metodo,importe,estado,atribucion,comision,recompensa\n2026-09-09 13:30,Lucía Peña,lucia.pena0@hotmail.com,business,renovacion,mensual,transferencia,39,pendiente,organico,0,0",
    },
    errores: [SIN_ADMIN],
    reglas: [
      SOLO_ADMIN,
      "Las mismas filas y columnas que ve la tabla con esos filtros (`PaymentRow`).",
      "Las horas en la zona de la instantánea (America/Lima), como la columna «Fecha».",
    ],
    origen: "app/[locale]/(admin)/admin/ingresos/page.tsx:223",
  },
  {
    id: "backoffice.enviar-recordatorios",
    area: "backoffice",
    metodo: "POST",
    ruta: "/admin/suscripciones/recordatorios",
    resumen:
      "Manda el recordatorio previo con enlace de pago a las renovaciones indicadas.",
    descripcion: `${DE_MOCK} Efecto anunciado en Vencimientos: «Envía un recordatorio previo con enlace de pago a las {n} renovaciones con señal de los próximos 30 días» (admin.vencimientos.queues.remindersEffect). Lo usan también las filas cuya acción es «Recordatorio de renovación» o «Recordatorio previo».`,
    estado: "por-construir",
    auth: "admin",
    cuerpo: {
      tipo: "{ suscripciones: string[] }",
      campos: [
        {
          nombre: "suscripciones",
          tipo: "string[]",
          requerido: true,
          descripcion:
            "Ids de suscripción. Desde el botón de la cabecera, las renovaciones con señal a 30 d.",
        },
      ],
      ejemplo: { suscripciones: ["sub_01"] },
    },
    respuesta: {
      tipo: "{ enviados: number }",
      ejemplo: { enviados: 1 },
    },
    errores: [SIN_ADMIN],
    reglas: [
      SOLO_ADMIN,
      "Solo a suscripciones que siguen en la cola: una que ya renovó se salta sin error.",
      "Propuesta: guardar la fecha del aviso en la suscripción. Hoy la cola no sabe si ya se recordó a nadie.",
    ],
    origen: "app/[locale]/(admin)/admin/vencimientos/page.tsx:229",
  },
  {
    id: "backoffice.programar-reintentos",
    area: "backoffice",
    metodo: "POST",
    ruta: "/admin/pagos/reintentos",
    resumen: "Programa el reintento automático de los cobros rechazados: día 1, 3 y 7.",
    descripcion: `${DE_MOCK} Efecto anunciado: «Programa el reintento automático (día 1, 3 y 7) de {n} cobros rechazados por {monto}» (admin.vencimientos.queues.retryEffect).`,
    estado: "por-construir",
    auth: "admin",
    cuerpo: {
      tipo: "{ suscripciones: string[] }",
      campos: [
        {
          nombre: "suscripciones",
          tipo: "string[]",
          requerido: true,
          descripcion: "Las de la cola «rechazado» de Vencimientos.",
        },
      ],
      ejemplo: { suscripciones: ["sub_11"] },
    },
    respuesta: {
      tipo: "{ programados: number; importe: number }",
      ejemplo: { programados: 1, importe: 29 },
    },
    errores: [SIN_ADMIN],
    reglas: [
      SOLO_ADMIN,
      "Calendario fijo: día 1, 3 y 7 desde que se programa.",
      "Cada intento es un pago nuevo; en cuanto uno se aprueba, se cancelan los que quedan.",
      "En la cola, 3 o más intentos fallidos (o 7 días vencida) ponen la fila en rojo (lib/admin/metrics.ts:2017); los intentos son los cobros rechazados de los últimos 30 días (lib/admin/metrics.ts:1231).",
    ],
    origen: "app/[locale]/(admin)/admin/vencimientos/page.tsx:238",
  },
  {
    id: "backoffice.enviar-enlace-pago",
    area: "backoffice",
    metodo: "POST",
    ruta: "/admin/suscripciones/{id}/enlace-pago",
    resumen:
      "Manda un enlace de pago por Yape o Plin a quien paga a mano y tiene el cobro rechazado.",
    descripcion: `${DE_MOCK} Es la acción «Enviar enlace Yape/Plin» de la cola de Vencimientos, que sale en los rechazados que no pagan con tarjeta (lib/admin/metrics.ts:2022).`,
    estado: "por-construir",
    auth: "admin",
    parametros: [
      enRuta(
        "id",
        "Id de una suscripción de la cola «rechazado» que no paga con tarjeta. En los datos de hoy no hay ninguna: el único rechazado, `sub_11`, paga con tarjeta y su acción es «Reintentar cobro»."
      ),
    ],
    cuerpo: {
      tipo: '{ metodo: "yape" | "plin" }',
      ejemplo: { metodo: "yape" },
    },
    respuesta: {
      tipo: "{ enviadoEn: string }",
      ejemplo: { enviadoEn: "2026-09-13T12:20:00.000Z" },
    },
    errores: [SIN_ADMIN, noExiste("La suscripción")],
    reglas: [
      SOLO_ADMIN,
      "El importe del enlace es el del ciclo de la suscripción, no lo escribe el operador.",
    ],
    origen: "components/admin/vencimientos-table.tsx:293",
  },
]

/* ---------------------------------------------------------------------------
   Usuarios
   --------------------------------------------------------------------------- */

const USUARIO_ID = enRuta("id", "Id del usuario, p. ej. `u_0574` (Diego Torres).")

const USUARIOS: Endpoint[] = [
  {
    id: "backoffice.registrar-contacto",
    area: "backoffice",
    metodo: "POST",
    ruta: "/admin/usuarios/{id}/contactos",
    resumen:
      "Deja constancia de que se contactó a un usuario (o le manda el mensaje de reactivación) con fecha y nota.",
    descripcion: `${DE_MOCK} Lo piden «Contactado» en la tabla de usuarios («Marca a {nombre} como contactado hoy y guarda la nota; sirve para medir la tasa de cierre de PQL y la reactivación de dormidos») y «Contactar» en Dormidos («Envía un mensaje de reactivación a {nombre}… y guarda la fecha para medir si crea un proyecto en 30 d»).`,
    estado: "por-construir",
    auth: "admin",
    parametros: [USUARIO_ID],
    cuerpo: {
      tipo: '{ motivo: "pql" | "reactivacion" | "retencion"; oferta?: boolean; nota?: string }',
      campos: [
        {
          nombre: "motivo",
          tipo: '"pql" | "reactivacion" | "retencion"',
          requerido: true,
          descripcion: "Para qué métrica cuenta el contacto.",
        },
        {
          nombre: "oferta",
          tipo: "boolean",
          requerido: false,
          descripcion:
            "Con oferta de vuelta: la variante de los ex-pagantes en Dormidos.",
        },
        {
          nombre: "nota",
          tipo: "string",
          requerido: false,
          descripcion: "La nota del operador.",
        },
      ],
      ejemplo: {
        motivo: "pql",
        nota: "Le escribí por WhatsApp: prueba Creador la semana que viene.",
      },
    },
    respuesta: {
      tipo: "{ contactadoEn: string }",
      ejemplo: { contactadoEn: "2026-09-13T12:20:00.000Z" },
    },
    errores: [SIN_ADMIN, noExiste("El usuario")],
    reglas: [
      SOLO_ADMIN,
      "La fecha la pone el servidor: la reactivación se mide como «contactados que crean un proyecto en 30 d» desde esa fecha (admin.usuarios.dormant.note).",
      "Con `motivo: reactivacion` manda además el mensaje; con los otros dos solo registra.",
    ],
    origen: "components/admin/usuarios-table.tsx:353",
  },
  {
    id: "backoffice.cambiar-plan-usuario",
    area: "backoffice",
    metodo: "PUT",
    ruta: "/admin/usuarios/{id}/plan",
    resumen:
      "Cambia el plan de un usuario: plan destino, cortesía o paso a Prueba conservando proyectos.",
    descripcion: `${DE_MOCK} Efecto anunciado: «Abre el cambio de plan de {nombre} (ahora {plan}): plan destino, cortesía o paso a Prueba conservando proyectos, con motivo» (admin.usuarios.table.changePlanEffect).`,
    estado: "por-construir",
    auth: "admin",
    parametros: [USUARIO_ID],
    cuerpo: {
      tipo: "{ plan: PlanId; cortesia?: boolean; motivo: string }",
      definidoEn: "lib/planes.ts:48",
      campos: [
        {
          nombre: "plan",
          tipo: "PlanId",
          requerido: true,
          descripcion:
            "Un plan activo del catálogo, también uno oculto (`planesAsignables`, lib/planes.ts:491).",
        },
        {
          nombre: "cortesia",
          tipo: "boolean",
          requerido: false,
          descripcion: "Sin cobro: el backoffice lo cuenta como cortesía, fuera del MRR.",
        },
        {
          nombre: "motivo",
          tipo: "string",
          requerido: true,
          descripcion: "Queda en el registro.",
        },
      ],
      ejemplo: {
        plan: "free",
        motivo: "Etiqueta sin suscripción: pasa a Prueba conservando proyectos.",
      },
    },
    respuesta: {
      tipo: "{ plan: PlanId }",
      ejemplo: { plan: "free" },
    },
    errores: [
      SIN_ADMIN,
      noExiste("El usuario"),
      conflicto(
        "El plan está apagado o no existe en el catálogo: un plan apagado no se puede asignar."
      ),
    ],
    reglas: [
      SOLO_ADMIN,
      "Nunca borra proyectos: pasar a Prueba los conserva.",
      "Un plan apagado no se asigna; un id que no está en el catálogo tampoco (`planDe` los resuelve al plan de la demo, lib/planes.ts:476).",
      "Deja registro del motivo, de quién y de cuándo.",
    ],
    origen: "components/admin/usuarios-table.tsx:362",
  },
  {
    id: "backoffice.reconciliar-planes",
    area: "backoffice",
    metodo: "POST",
    ruta: "/admin/usuarios/reconciliar-planes",
    resumen:
      "Pasa a Prueba a quien tiene etiqueta de plan de pago sin suscripción de cliente de pago.",
    descripcion: `${DE_MOCK} Efecto anunciado: «Pasa a Prueba a los {n} usuarios sin suscripción de cliente de pago, conservando sus proyectos, y deja registro del cambio» (admin.usuarios.mismatch.reconcileEffect).`,
    estado: "por-construir",
    auth: "admin",
    respuesta: {
      tipo: "{ reconciliados: number }",
      ejemplo: { reconciliados: 0 },
    },
    errores: [SIN_ADMIN],
    reglas: [
      SOLO_ADMIN,
      "Solo los incoherentes según `esIncoherente` (lib/admin/metrics.ts:979): etiqueta de pago, no paga y la suscripción no está vencida ni pendiente de pago.",
      "Conserva los proyectos y registra el cambio de cada usuario.",
      "Idempotente: si no queda ninguno, devuelve 0.",
    ],
    origen: "app/[locale]/(admin)/admin/usuarios/page.tsx:403",
  },
  {
    id: "backoffice.bloquear-usuario",
    area: "backoffice",
    metodo: "POST",
    ruta: "/admin/usuarios/{id}/bloqueo",
    resumen: "Bloquea una cuenta de Prueba por alto coste de IA y la avisa por correo.",
    descripcion: `${DE_MOCK} Efecto anunciado: «Bloquea la cuenta de Prueba de {nombre} por alto coste ({monto} en el mes) y avisa por correo» (admin.costes.topFree.blockEffect).`,
    estado: "por-construir",
    auth: "admin",
    parametros: [USUARIO_ID],
    cuerpo: {
      tipo: '{ motivo: "alto-coste" }',
      ejemplo: { motivo: "alto-coste" },
    },
    respuesta: {
      tipo: 'Pick<AdminUser, "id" | "status">',
      definidoEn: "lib/admin/types.ts:87",
      ejemplo: { id: "u_0579", status: "suspendido" },
    },
    errores: [
      SIN_ADMIN,
      noExiste("El usuario"),
      conflicto("La cuenta paga: el bloqueo por coste es solo para Prueba."),
    ],
    reglas: [
      SOLO_ADMIN,
      "Solo cuentas de Prueba sin ningún pago: es lo que lista «Top 10 de Prueba por coste».",
      "Deja `status: suspendido`, que ya saca a la cuenta de los PQL (`motivoPql`).",
      "Manda el correo con el motivo.",
    ],
    origen: "components/admin/costes-top-free.tsx:97",
  },
]

/* ---------------------------------------------------------------------------
   Costes de IA y pipeline
   --------------------------------------------------------------------------- */

const PROYECTO_ID = enRuta("id", "Id del proyecto, p. ej. `prj_1119`.")
const FUENTE: Campo = enRuta(
  "fuente",
  "youtube, directo, kick, twitch, drive, facebook o zoom (`PROJECT_SOURCES`, lib/admin/types.ts:306)."
)

const COSTES: Endpoint[] = [
  {
    id: "backoffice.exportar-costes",
    area: "backoffice",
    metodo: "GET",
    ruta: "/admin/proyectos.csv",
    resumen:
      "Descarga el CSV de costes del mes: una fila por proyecto con el desglose por proveedor y modelo.",
    descripcion: `${DE_MOCK} Efecto anunciado: «Genera el CSV de costes de {mes} con una fila por proyecto y su desglose por proveedor y modelo» (admin.costes.proyectos.exportEffect).`,
    estado: "por-construir",
    auth: "admin",
    parametros: [MES],
    respuesta: {
      tipo: "string (text/csv)",
      ejemplo:
        "proyecto,usuario,plan,fuente,estado,minutos,clips,coste,coste_minuto,proveedor,modelo,importe\nprj_1119,Fabián Ortiz,free,kick,error,34.9,0,0.07496,0.0021,assemblyai,universal-3,0.05235",
    },
    errores: [SIN_ADMIN],
    reglas: [SOLO_ADMIN, "Costes en dólares, ya convertidos (lib/admin/types.ts:294)."],
    origen: "app/[locale]/(admin)/admin/costes/page.tsx:311",
  },
  {
    id: "backoffice.reprocesar-proyecto",
    area: "backoffice",
    metodo: "POST",
    ruta: "/admin/proyectos/{id}/reprocesar",
    resumen: "Vuelve a encolar un proyecto en error o atascado de cualquier usuario.",
    descripcion: `${DE_MOCK} Efecto anunciado: «Reencola el proyecto {proyecto} de {nombre} ({fuente}, {minutos} min). Coste estimado {monto}» (admin.costes.table.reprocessEffect). Es el equivalente de operador de \`POST /jobs/{id}/retry\` (lib/api/jobs.ts:169), que solo vale para los proyectos propios.`,
    estado: "por-construir",
    auth: "admin",
    parametros: [PROYECTO_ID],
    respuesta: {
      tipo: "AdminProject",
      definidoEn: "lib/admin/types.ts:317",
      ejemplo: {
        id: "prj_1119",
        userId: "u_0209",
        userPlan: "free",
        source: "kick",
        status: "procesando",
        createdAt: "2026-08-29T22:03:14.435Z",
        clips: 0,
        minutes: 34.9,
        cost: 0.07496,
      },
    },
    errores: [
      SIN_ADMIN,
      noExiste("El proyecto"),
      conflicto("El proyecto está «listo»: no hay nada que reprocesar."),
    ],
    reglas: [
      SOLO_ADMIN,
      "Solo proyectos que no están «listo» (la tabla solo ofrece «Reprocesar» ahí, components/admin/costes-table.tsx:211).",
      "El coste estimado es el mayor entre el coste ya gastado y coste por minuto × minutos; el nuevo gasto se apunta al mismo proyecto.",
    ],
    origen: "components/admin/costes-table.tsx:212",
  },
  {
    id: "backoffice.reprocesar-sin-resolver",
    area: "backoffice",
    metodo: "POST",
    ruta: "/admin/proyectos/reprocesar-sin-resolver",
    resumen: "Reencola todos los errores sin resolver, los de clientes de pago primero.",
    descripcion: `${DE_MOCK} Efecto anunciado: «Reencola los {n} errores sin resolver, los de clientes de pago primero. Coste estimado {monto}» (admin.costes.pipeline.reprocessEffect).`,
    estado: "por-construir",
    auth: "admin",
    respuesta: {
      tipo: "{ reencolados: number; dePago: number }",
      ejemplo: { reencolados: 29, dePago: 0 },
    },
    errores: [SIN_ADMIN],
    reglas: [
      SOLO_ADMIN,
      "Sin resolver: en error y sin un proyecto listo posterior del mismo usuario y la misma fuente (lib/admin/metrics.ts:2380).",
      "Orden de cola: primero los de clientes de pago (`sinResolverDePago`).",
      "El botón está apagado cuando no hay ninguno (`pipeline.sinResolver === 0`).",
    ],
    origen: "app/[locale]/(admin)/admin/costes/page.tsx:340",
  },
  {
    id: "backoffice.cancelar-atascados",
    area: "backoffice",
    metodo: "POST",
    ruta: "/admin/proyectos/cancelar-atascados",
    resumen:
      "Cancela los proyectos que llevan más de 2 horas procesando y avisa a sus usuarios.",
    descripcion: `${DE_MOCK} Efecto anunciado: «Cancela los {n} proyectos atascados y avisa a sus usuarios para que vuelvan a subirlos» (admin.costes.pipeline.cancelStuckEffect).`,
    estado: "por-construir",
    auth: "admin",
    respuesta: {
      tipo: "{ cancelados: number }",
      ejemplo: { cancelados: 5 },
    },
    errores: [SIN_ADMIN],
    reglas: [
      SOLO_ADMIN,
      "Atascado: «procesando» durante más de 2 horas (lib/admin/metrics.ts:2389).",
      "Cada usuario afectado recibe el aviso para volver a subir.",
      "El botón está apagado cuando no hay ninguno.",
    ],
    origen: "app/[locale]/(admin)/admin/costes/page.tsx:332",
  },
  {
    id: "backoffice.marcar-anomalia-revisada",
    area: "backoffice",
    metodo: "POST",
    ruta: "/admin/proyectos/{id}/anomalia-revisada",
    resumen:
      "Marca como revisada la anomalía de coste de un proyecto, con la nota del operador.",
    descripcion: `${DE_MOCK} Efecto anunciado: «Marca la anomalía del proyecto {proyecto} ({motivo}) como revisada y guarda la nota del operador» (admin.costes.anomalias.markReviewedEffect).`,
    estado: "por-construir",
    auth: "admin",
    parametros: [PROYECTO_ID],
    cuerpo: {
      tipo: "{ nota?: string }",
      ejemplo: { nota: "Directo de 3 h: el coste por minuto es normal." },
    },
    respuesta: {
      tipo: "{ revisadaEn: string }",
      ejemplo: { revisadaEn: "2026-09-13T12:20:00.000Z" },
    },
    errores: [
      SIN_ADMIN,
      noExiste("El proyecto"),
      conflicto("El proyecto no tiene anomalía."),
    ],
    reglas: [
      SOLO_ADMIN,
      "Solo proyectos con `anomalia` (3× la mediana de coste o 2× la de coste por minuto).",
      "Revisada no borra la anomalía del dato: la saca de la lista «Coste anómalo · 30 d».",
    ],
    origen: "components/admin/costes-anomalias.tsx:119",
  },
  {
    id: "backoffice.cambiar-fuente",
    area: "backoffice",
    metodo: "PATCH",
    ruta: "/admin/fuentes/{fuente}",
    resumen: "Deshabilita (o vuelve a habilitar) una fuente de video en la subida.",
    descripcion: `${DE_MOCK} Lo piden los dos «Deshabilitar»: el de «Salud del pipeline» («…hasta que baje la tasa de error») y el de «Rendimiento por fuente · 30 d» («…mientras se revisa su pipeline»).`,
    estado: "por-construir",
    auth: "admin",
    parametros: [FUENTE],
    cuerpo: {
      tipo: "{ habilitada: boolean }",
      ejemplo: { habilitada: false },
    },
    respuesta: {
      tipo: "{ fuente: ProjectSource; habilitada: boolean }",
      definidoEn: "lib/admin/types.ts:315",
      ejemplo: { fuente: "kick", habilitada: false },
    },
    errores: [SIN_ADMIN, noExiste("La fuente")],
    reglas: [
      SOLO_ADMIN,
      "La subida deja de ofrecer esa fuente; lo que ya estaba procesando sigue.",
      "Es temporal: se vuelve a habilitar con `habilitada: true`.",
    ],
    origen: "components/admin/costes-pipeline.tsx:167",
  },
  {
    id: "backoffice.abrir-incidencia-fuente",
    area: "backoffice",
    metodo: "POST",
    ruta: "/admin/fuentes/{fuente}/incidencias",
    resumen:
      "Abre una incidencia del conector de una fuente que tenía uso y se ha quedado a cero.",
    descripcion: `${DE_MOCK} Efecto anunciado: «Abre una incidencia del conector de {fuente}: {n} proyectos históricos y ninguno en 30 días» (admin.costes.fuentes.reviewConnectorEffect).`,
    estado: "por-construir",
    auth: "admin",
    parametros: [FUENTE],
    respuesta: {
      tipo: "{ incidencia: string; abiertaEn: string }",
      ejemplo: { incidencia: "inc_kick_0913", abiertaEn: "2026-09-13T12:20:00.000Z" },
    },
    errores: [SIN_ADMIN, noExiste("La fuente")],
    reglas: [
      SOLO_ADMIN,
      "Se ofrece cuando la fuente tiene más de 20 proyectos históricos y ninguno en 30 días (`alertaCaida`, lib/admin/metrics.ts:2224).",
    ],
    origen: "components/admin/costes-fuentes.tsx:133",
  },
  {
    id: "backoffice.pedir-reconexion",
    area: "backoffice",
    metodo: "POST",
    ruta: "/admin/cuentas/reconexion",
    resumen: "Escribe a quien tiene cuentas conectadas caducadas para que las reconecte.",
    descripcion: `${DE_MOCK} Efecto anunciado: «Escribe a quien tiene alguna de las {n} cuentas caducadas para que vuelva a conectarla. Los envíos que esperan salen en cuanto lo haga» (admin.costes.publicaciones.reconnectEffect).`,
    estado: "por-construir",
    auth: "admin",
    respuesta: {
      tipo: "{ cuentas: number; usuarios: number }",
      ejemplo: { cuentas: 13, usuarios: 13 },
    },
    errores: [SIN_ADMIN],
    reglas: [
      SOLO_ADMIN,
      "Solo cuentas con estado «caducada» (`ESTADOS_CUENTA` de lib/social.ts); las revocadas no se piden.",
      "Un aviso por persona, aunque tenga varias caducadas.",
      "Al reconectar, los envíos que esperaban por esa cuenta salen sin que nadie los reprograme.",
      "Nunca viaja el handle ni el token de la cuenta al backoffice (§7.7).",
    ],
    origen: "app/[locale]/(admin)/admin/costes/page.tsx:373",
  },
  {
    id: "backoffice.cambiar-politica-ia",
    area: "backoffice",
    metodo: "PATCH",
    ruta: "/admin/ia/politica",
    resumen:
      "Cambia la política de uso de IA: el modelo caro solo para planes de pago y el tope de minutos por proyecto en Prueba.",
    descripcion: `${DE_MOCK} Lo piden «Restringir modelo caro a pago» («…Prueba pasa al modelo económico») y «Tope de minutos en Prueba» («Pone un tope de minutos por proyecto en el plan Prueba (propuesta: 20 min) y avisa a los usuarios afectados»).`,
    estado: "por-construir",
    auth: "admin",
    cuerpo: {
      tipo: "{ modeloCaroSoloPago?: boolean; topeMinutosProyectoPrueba?: number | null }",
      campos: [
        {
          nombre: "modeloCaroSoloPago",
          tipo: "boolean",
          requerido: false,
          descripcion: "El modelo de análisis más caro, solo para los planes de pago.",
        },
        {
          nombre: "topeMinutosProyectoPrueba",
          tipo: "number | null",
          requerido: false,
          descripcion:
            "Minutos por proyecto en Prueba; `null` quita el tope. La propuesta en pantalla es 20.",
        },
      ],
      ejemplo: { topeMinutosProyectoPrueba: 20 },
    },
    respuesta: {
      tipo: "{ modeloCaroSoloPago: boolean; topeMinutosProyectoPrueba: number | null }",
      ejemplo: { modeloCaroSoloPago: false, topeMinutosProyectoPrueba: 20 },
    },
    errores: [SIN_ADMIN],
    reglas: [
      SOLO_ADMIN,
      "Vale para lo que se procese a partir de ese momento, no para lo que ya está en cola.",
      "Al poner el tope se avisa a los usuarios de Prueba afectados.",
      "El tope de minutos al mes del plan no se toca aquí: vive en el catálogo de planes (60 en Prueba, `MINUTOS_INCLUIDOS`).",
    ],
    origen: "app/[locale]/(admin)/admin/costes/page.tsx:400",
  },
]

/* ---------------------------------------------------------------------------
   Afiliados y referidos
   --------------------------------------------------------------------------- */

const PROGRAMAS: Endpoint[] = [
  {
    id: "backoffice.liquidar-comisiones",
    area: "backoffice",
    metodo: "POST",
    ruta: "/admin/afiliados/liquidaciones",
    resumen:
      "Liquida la comisión pendiente de uno o varios afiliados y la registra como pagada hoy.",
    descripcion: `${DE_MOCK} Lo piden «Liquidar pendientes · {monto}» en la cabecera («Se liquidarían {monto} a {n} afiliados y se registraría la comisión pagada con fecha de hoy») y «Liquidar» en cada código.`,
    estado: "por-construir",
    auth: "admin",
    cuerpo: {
      tipo: "{ afiliados: string[] }",
      campos: [
        {
          nombre: "afiliados",
          tipo: "string[]",
          requerido: true,
          descripcion:
            "Ids de afiliado. Desde la cabecera, todos los que tienen comisión pendiente.",
        },
      ],
      ejemplo: { afiliados: ["af_01", "af_02"] },
    },
    respuesta: {
      tipo: "{ liquidado: number; afiliados: number }",
      ejemplo: { liquidado: 15.55, afiliados: 2 },
    },
    errores: [SIN_ADMIN, noExiste("Uno de los afiliados")],
    reglas: [
      SOLO_ADMIN,
      "Pendiente = devengada − pagada. Se paga entera: no hay liquidaciones parciales.",
      "La comisión pagada lleva la fecha de hoy y resta en la caja neta del mes.",
      "Un afiliado sin pendiente se salta sin error.",
    ],
    origen: "app/[locale]/(admin)/admin/afiliados/page.tsx:150",
  },
  {
    id: "backoffice.editar-afiliado",
    area: "backoffice",
    metodo: "PATCH",
    ruta: "/admin/afiliados/{id}",
    resumen:
      "Pausa o reactiva un código de afiliado, o le cambia el % de comisión con fecha de efecto.",
    descripcion: `${DE_MOCK} Lo piden «Pausar» / «Reactivar» («El código {codigo} dejaría de atribuir altas nuevas; las comisiones ya devengadas se conservan») y «Cambiar %» («…con fecha de efecto; los pagos anteriores conservan el % vigente»).`,
    estado: "por-construir",
    auth: "admin",
    parametros: [enRuta("id", "Id del afiliado, p. ej. `af_03` (Streamers LATAM).")],
    cuerpo: {
      tipo: 'Partial<Pick<Affiliate, "status" | "commissionPct">> & { efectoDesde?: string }',
      definidoEn: "lib/admin/types.ts:401",
      campos: [
        {
          nombre: "status",
          tipo: '"activo" | "pausado"',
          requerido: false,
          descripcion: "Pausado deja de atribuir altas nuevas.",
        },
        {
          nombre: "commissionPct",
          tipo: "number",
          requerido: false,
          descripcion: "Nuevo % sobre cada pago aprobado atribuido.",
        },
        {
          nombre: "efectoDesde",
          tipo: "string",
          requerido: false,
          descripcion:
            "Fecha desde la que vale el nuevo %. Obligatoria si cambia `commissionPct`.",
        },
      ],
      ejemplo: { status: "activo" },
    },
    respuesta: {
      tipo: "Affiliate",
      definidoEn: "lib/admin/types.ts:401",
      ejemplo: {
        id: "af_03",
        name: "Streamers LATAM",
        code: "STREAMLATAM",
        commissionPct: 30,
        status: "activo",
        joinedAt: "2026-03-08T00:00:00.000Z",
        channel: "Canal de YouTube",
      },
    },
    errores: [SIN_ADMIN, noExiste("El afiliado")],
    reglas: [
      SOLO_ADMIN,
      "Pausar no borra lo devengado: solo deja de atribuir altas desde hoy. Reactivar vuelve a atribuir desde hoy.",
      "El nuevo % solo vale para los pagos desde `efectoDesde`; los anteriores conservan el suyo.",
    ],
    origen: "components/admin/afiliados-table.tsx:80",
  },
  {
    id: "backoffice.otorgar-recompensas",
    area: "backoffice",
    metodo: "POST",
    ruta: "/admin/referidos/recompensas",
    resumen:
      "Otorga los minutos de regalo pendientes a quien invitó y le avisa por correo.",
    descripcion: `${DE_MOCK} Lo piden «Otorgar las {n} pendientes» («Otorga {minutos} min a {n} invitadores y les avisa por correo») y «Otorgar» en cada fila.`,
    estado: "por-construir",
    auth: "admin",
    cuerpo: {
      tipo: "{ referidos: string[] }",
      campos: [
        {
          nombre: "referidos",
          tipo: "string[]",
          requerido: true,
          descripcion: "Ids de referido con la recompensa pendiente.",
        },
      ],
      ejemplo: { referidos: ["ref_066"] },
    },
    respuesta: {
      tipo: "{ otorgados: number; minutos: number }",
      ejemplo: { otorgados: 1, minutos: 60 },
    },
    errores: [SIN_ADMIN, noExiste("Uno de los referidos")],
    reglas: [
      SOLO_ADMIN,
      "Solo recompensas pendientes: invitado convertido y minutos sin dar. Una ya otorgada se salta.",
      "Cada invitador recibe `rewardMinutes` (60 en la demo) y un correo.",
      "El valor que resta en la caja es minutos × US$ 29 ÷ 600.",
    ],
    origen: "app/[locale]/(admin)/admin/referidos/page.tsx:225",
  },
  {
    id: "backoffice.anular-recompensa",
    area: "backoffice",
    metodo: "POST",
    ruta: "/admin/referidos/{id}/no-procede",
    resumen:
      "Marca la recompensa de un referido como no procedente (reembolso o fraude) con su motivo.",
    descripcion: `${DE_MOCK} Efecto anunciado: «Marca la recompensa de {nombre} como no procedente (reembolso o fraude) y deja constancia del motivo» (admin.referidos.table.notApplicableEffect).`,
    estado: "por-construir",
    auth: "admin",
    parametros: [enRuta("id", "Id del referido, p. ej. `ref_066`.")],
    cuerpo: {
      tipo: '{ motivo: "reembolso" | "fraude" }',
      ejemplo: { motivo: "reembolso" },
    },
    respuesta: {
      tipo: 'Pick<ReferralRow, "id" | "rewardEstado">',
      definidoEn: "lib/admin/rows.ts:341",
      ejemplo: { id: "ref_066", rewardEstado: "no-procede" },
    },
    errores: [
      SIN_ADMIN,
      noExiste("El referido"),
      conflicto("La recompensa ya está otorgada o ya no procede."),
    ],
    reglas: [SOLO_ADMIN, "Solo sobre una recompensa pendiente.", "Guarda el motivo."],
    origen: "components/admin/referidos-table.tsx:273",
  },
  {
    id: "backoffice.recordar-invitado",
    area: "backoffice",
    metodo: "POST",
    ruta: "/admin/referidos/{id}/recordatorio",
    resumen: "Manda a un invitado registrado un recordatorio para subir su primer video.",
    descripcion: `${DE_MOCK} Efecto anunciado: «Envía a {nombre} un recordatorio para subir su primer video» (admin.referidos.table.remindEffect).`,
    estado: "por-construir",
    auth: "admin",
    parametros: [enRuta("id", "Id del referido, p. ej. `ref_063` (Diego Castillo).")],
    respuesta: {
      tipo: "{ enviadoEn: string }",
      ejemplo: { enviadoEn: "2026-09-13T12:20:00.000Z" },
    },
    errores: [
      SIN_ADMIN,
      noExiste("El referido"),
      conflicto("El invitado ya no está «registrado»: ya activó."),
    ],
    reglas: [SOLO_ADMIN, "Solo a invitados en estado «registrado»."],
    origen: "components/admin/referidos-table.tsx:286",
  },
  {
    id: "backoffice.editar-programa-referidos",
    area: "backoffice",
    metodo: "PATCH",
    ruta: "/admin/referidos/programa",
    resumen: "Cambia la recompensa del programa de referidos o lo pausa.",
    descripcion: `${DE_MOCK} Lo piden «Editar recompensa» («Abre el editor de la recompensa: minutos o descuento, valor y fecha de efecto») y «Pausar programa» («…deja de generar enlaces de invitación. Las recompensas ya pendientes se mantienen»).`,
    estado: "por-construir",
    auth: "admin",
    cuerpo: {
      tipo: '{ pausado?: boolean; recompensa?: { tipo: "minutos" | "descuento"; valor: number; efectoDesde: string } }',
      ejemplo: {
        recompensa: {
          tipo: "minutos",
          valor: 60,
          efectoDesde: "2026-10-01T00:00:00.000Z",
        },
      },
    },
    respuesta: {
      tipo: '{ pausado: boolean; recompensa: { tipo: "minutos" | "descuento"; valor: number; efectoDesde: string } }',
      ejemplo: {
        pausado: false,
        recompensa: {
          tipo: "minutos",
          valor: 60,
          efectoDesde: "2026-10-01T00:00:00.000Z",
        },
      },
    },
    errores: [SIN_ADMIN],
    reglas: [
      SOLO_ADMIN,
      "Pausar deja de generar enlaces de invitación; las recompensas ya pendientes se mantienen.",
      "Una recompensa nueva vale desde su fecha de efecto; lo convertido antes cobra la anterior.",
    ],
    origen: "app/[locale]/(admin)/admin/referidos/page.tsx:106",
  },
]

/* ---------------------------------------------------------------------------
   Catálogo de planes (hoy `clipealo-planes-v1`)
   --------------------------------------------------------------------------- */

const PLAN_ID = enRuta(
  "id",
  "Id del plan: `free`, `creator`, `business` o uno creado (`plan_…`, `nuevoIdPlan`, lib/planes.ts:318)."
)

const ERRORES_PLAN: ErrorDoc[] = [
  {
    codigo: "nombreCorto",
    http: 422,
    cuando: "Plan creado con un nombre de menos de 2 caracteres.",
    frase: "admin.planes.catalogo.form.errors.nombreCorto",
    bloquea: true,
  },
  {
    codigo: "nombreRepetido",
    http: 422,
    cuando: "Ya hay otro plan con ese nombre (sin distinguir mayúsculas).",
    frase: "admin.planes.catalogo.form.errors.nombreRepetido",
    bloquea: true,
  },
  {
    codigo: "precioFuera",
    http: 422,
    cuando: "Precio mensual o anual fuera de 0–9999.",
    frase: "admin.planes.catalogo.form.errors.precioFuera",
    bloquea: true,
  },
  {
    codigo: "anualMayor",
    http: 422,
    cuando: "El precio al mes con facturación anual es mayor que el mensual.",
    frase: "admin.planes.catalogo.form.errors.anualMayor",
    bloquea: true,
  },
  {
    codigo: "minutosFuera",
    http: 422,
    cuando: "Minutos fuera de 1–100 000.",
    frase: "admin.planes.catalogo.form.errors.minutosFuera",
    bloquea: true,
  },
  {
    codigo: "asientoFuera",
    http: 422,
    cuando: "Precio por asiento fuera de 0–9999.",
    frase: "admin.planes.catalogo.form.errors.asientoFuera",
    bloquea: true,
  },
  {
    codigo: "cuentasFuera",
    http: 422,
    cuando: "Cuentas sociales fuera de 1–1000.",
    frase: "admin.planes.catalogo.form.errors.cuentasFuera",
    bloquea: true,
  },
]

const REGLAS_PLAN = [
  "Repetir `validarPlan` (lib/planes.ts:257) con los límites de `LIMITES_PLAN` (lib/planes.ts:80): nombre 2–40 caracteres, lema hasta 80, precios y asiento 0–9999, minutos 1–100 000, cuentas 1–1000, y el anual nunca mayor que el mensual. Lo que valida el navegador es cortesía.",
  "Precios con dos decimales como mucho; minutos y cuentas, enteros. Hoy solo lo hace `planDeBorrador` con los planes creados (lib/planes.ts:343): el parche de un plan de la web se guarda tal cual llega.",
  "Como mucho una tarjeta destacada: destacar un plan quita la marca de la que la tenía (`unicoDestacado`, hooks/use-catalogo-planes.ts:85).",
]

const PLANES: Endpoint[] = [
  {
    id: "backoffice.listar-planes",
    area: "backoffice",
    metodo: "GET",
    ruta: "/admin/planes",
    resumen:
      "El catálogo de planes aplicado, también los ocultos y los apagados, en su orden.",
    descripcion:
      "Sustituye a `leerCatalogoPlanes` sobre el almacén `clipealo-planes-v1`, que guarda semillas + parches: de los tres de la web solo lo que cambia; de los creados, el plan entero. Es el mismo catálogo que leen /precios, la app y cada puerta de plan; aquí llega entero porque el admin asigna también los ocultos.",
    estado: "por-construir",
    auth: "admin",
    respuesta: {
      tipo: "PlanCatalogo[]",
      definidoEn: "lib/planes.ts:50",
      ejemplo: [
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
          id: "plan_mtzs7n",
          origen: "creado",
          base: "creator",
          activo: true,
          visible: false,
          orden: 3,
          monthly: 45,
          yearly: 40,
          minutos: 1200,
          cuentas: 6,
          asiento: 0,
          capacidades: ["programar", "clasesDePago", "operaciones"],
          featured: false,
          nombre: "Universidad",
          lema: "Para que tus clases circulen en clips.",
        },
      ],
    },
    errores: [SIN_ADMIN],
    reglas: [
      SOLO_ADMIN,
      "Orden por `orden`; a igual orden, las semillas delante y luego por id (`aplicarPlanes`, lib/planes.ts:145).",
      "Los tres de la web no tienen `nombre` ni `lema`: viven en `pricing.plans.<id>` en los tres idiomas.",
    ],
    origen: "hooks/use-catalogo-planes.ts:61",
  },
  {
    id: "backoffice.crear-plan",
    area: "backoffice",
    metodo: "POST",
    ruta: "/admin/planes",
    resumen:
      "Crea un plan a medida que hereda comparativa, tarjeta y redes de un escalón de la web.",
    descripcion:
      "Sustituye a `guardar` de `useEditorPlanes` con un borrador sin `id`: hoy el id sale de `nuevoIdPlan(Date.now().toString(36))` y el plan se añade a `creados` al final del orden.",
    estado: "por-construir",
    auth: "admin",
    cuerpo: {
      tipo: "BorradorPlan",
      definidoEn: "lib/planes.ts:183",
      campos: [
        {
          nombre: "origen",
          tipo: '"creado"',
          requerido: true,
          descripcion: "Siempre «creado» al crear.",
        },
        {
          nombre: "nombre",
          tipo: "string",
          requerido: true,
          descripcion: "2–40 caracteres. Contenido: no se traduce.",
        },
        {
          nombre: "lema",
          tipo: "string",
          requerido: true,
          descripcion: "Hasta 80. Vacío, sale el de su escalón.",
        },
        {
          nombre: "base",
          tipo: '"free" | "creator" | "business"',
          requerido: true,
          descripcion: "El escalón del que hereda.",
        },
        {
          nombre: "monthly",
          tipo: "number",
          requerido: true,
          descripcion: "US$ al mes.",
        },
        {
          nombre: "yearly",
          tipo: "number",
          requerido: true,
          descripcion: "US$ al mes con facturación anual.",
        },
        {
          nombre: "minutos",
          tipo: "number",
          requerido: true,
          descripcion: "Minutos de video al mes.",
        },
        {
          nombre: "cuentas",
          tipo: "number",
          requerido: true,
          descripcion: "Cuentas sociales conectadas a la vez, sumando todas las redes.",
        },
        {
          nombre: "asiento",
          tipo: "number",
          requerido: true,
          descripcion: "US$ al mes por miembro adicional; 0, incluidos.",
        },
        {
          nombre: "capacidades",
          tipo: "Capacidad[]",
          requerido: true,
          descripcion:
            "programar, participarCampanas, clasesDePago y operaciones: lo que la app cobra de verdad.",
        },
        {
          nombre: "visible",
          tipo: "boolean",
          requerido: true,
          descripcion: "Sale en /precios.",
        },
        {
          nombre: "activo",
          tipo: "boolean",
          requerido: true,
          descripcion: "Se puede tener y asignar.",
        },
        {
          nombre: "featured",
          tipo: "boolean",
          requerido: true,
          descripcion: "Tarjeta destacada.",
        },
      ],
      ejemplo: {
        origen: "creado",
        nombre: "Universidad",
        lema: "Para que tus clases circulen en clips.",
        base: "creator",
        monthly: 45,
        yearly: 40,
        minutos: 1200,
        cuentas: 6,
        asiento: 0,
        capacidades: ["programar", "clasesDePago", "operaciones"],
        visible: false,
        activo: true,
        featured: false,
      },
    },
    respuesta: {
      tipo: "PlanCatalogo",
      definidoEn: "lib/planes.ts:50",
      ejemplo: {
        id: "plan_mtzs7n",
        origen: "creado",
        base: "creator",
        activo: true,
        visible: false,
        orden: 3,
        monthly: 45,
        yearly: 40,
        minutos: 1200,
        cuentas: 6,
        asiento: 0,
        capacidades: ["programar", "clasesDePago", "operaciones"],
        featured: false,
        nombre: "Universidad",
        lema: "Para que tus clases circulen en clips.",
      },
    },
    errores: [SIN_ADMIN, ...ERRORES_PLAN],
    reglas: [
      SOLO_ADMIN,
      ...REGLAS_PLAN,
      "El id lo pone el servidor con la forma `plan_…`: es lo que distingue un plan creado al leer (`limpiarPlan`, lib/planes.ts:392).",
      "Uno nuevo va al final del orden (hooks/use-catalogo-planes.ts:158).",
    ],
    origen: "hooks/use-catalogo-planes.ts:132",
  },
  {
    id: "backoffice.editar-plan",
    area: "backoffice",
    metodo: "PATCH",
    ruta: "/admin/planes/{id}",
    resumen:
      "Cambia un plan: precios, minutos, cuentas, asiento, capacidades y si sale, se puede tener o va destacado.",
    descripcion:
      "Sustituye a `guardar` (con `id`) y a `parchear` de `useEditorPlanes`. De un plan de la web se guarda solo el parche contra lo de fábrica (`parchePlan`, lib/planes.ts:163); uno creado se reescribe entero. El interruptor de cada fila manda solo `{ visible }`.",
    estado: "por-construir",
    auth: "admin",
    parametros: [PLAN_ID],
    cuerpo: {
      tipo: "BorradorPlan | ParchePlan",
      definidoEn: "lib/planes.ts:115",
      ejemplo: { asiento: 12 },
    },
    respuesta: {
      tipo: "PlanCatalogo",
      definidoEn: "lib/planes.ts:50",
      ejemplo: {
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
        asiento: 12,
        capacidades: ["programar", "participarCampanas", "clasesDePago", "operaciones"],
        featured: false,
      },
    },
    errores: [SIN_ADMIN, noExiste("El plan"), ...ERRORES_PLAN],
    reglas: [
      SOLO_ADMIN,
      ...REGLAS_PLAN,
      "De un plan de la web no se cambian nombre, lema ni escalón: viven en `messages/` (`ParchePlan`, lib/planes.ts:115).",
      "Apagar no borra: quien lo tenía cae al plan de la demo (`planDe`, lib/planes.ts:476). Con servidor, al plan que diga su suscripción.",
      "Oculto no sale en /precios pero se sigue asignando desde la solicitud de agencia (`planesAsignables`, lib/planes.ts:491).",
    ],
    origen: "hooks/use-catalogo-planes.ts:170",
  },
  {
    id: "backoffice.mover-plan",
    area: "backoffice",
    metodo: "POST",
    ruta: "/admin/planes/{id}/mover",
    resumen: "Sube o baja un plan un puesto en el orden de tarjetas y selectores.",
    descripcion:
      "Sustituye a `mover` de `useEditorPlanes`: se renumeran todos y se guarda solo el orden de los que cambian.",
    estado: "por-construir",
    auth: "admin",
    parametros: [PLAN_ID],
    cuerpo: {
      tipo: "{ delta: -1 | 1 }",
      ejemplo: { delta: -1 },
    },
    respuesta: {
      tipo: "PlanCatalogo[]",
      definidoEn: "lib/planes.ts:50",
      ejemplo: [
        { id: "free", orden: 0 },
        { id: "creator", orden: 1 },
        { id: "plan_mtzs7n", orden: 2 },
        { id: "business", orden: 3 },
      ],
    },
    errores: [SIN_ADMIN, noExiste("El plan")],
    reglas: [
      SOLO_ADMIN,
      "Se renumeran todos de 0 en adelante: dos planes nunca comparten orden (`moverPlan`, lib/planes.ts:364).",
      "En un extremo no pasa nada: el primero no sube y el último no baja.",
    ],
    origen: "hooks/use-catalogo-planes.ts:191",
  },
  {
    id: "backoffice.borrar-plan",
    area: "backoffice",
    metodo: "DELETE",
    ruta: "/admin/planes/{id}",
    resumen:
      "Borra un plan creado en el backoffice. Los de la web no se borran: se apagan.",
    descripcion: "Sustituye a `borrar` de `useEditorPlanes`.",
    estado: "por-construir",
    auth: "admin",
    parametros: [PLAN_ID],
    respuesta: { tipo: "void (204)" },
    errores: [
      SIN_ADMIN,
      noExiste("El plan"),
      conflicto(
        "Es uno de los tres de la web (free, creator o business): esos se apagan, no se borran."
      ),
    ],
    reglas: [
      SOLO_ADMIN,
      "Solo `origen: creado` (la fila solo ofrece la papelera ahí).",
      "No se deshace. Quien lo tuviera cae al plan de la demo hoy; con servidor, hay que decidir su plan antes de borrar.",
    ],
    origen: "hooks/use-catalogo-planes.ts:209",
  },
  {
    id: "backoffice.reiniciar-planes",
    area: "backoffice",
    metodo: "POST",
    ruta: "/admin/planes/reiniciar",
    resumen:
      "Vuelve al catálogo de fábrica: quita los parches de los tres de la web y los planes creados.",
    descripcion:
      "Sustituye a `reiniciarCatalogoPlanes`, que escribe `PLANES_VACIO` en `clipealo-planes-v1`.",
    estado: "por-construir",
    auth: "admin",
    respuesta: {
      tipo: "PlanCatalogo[]",
      definidoEn: "lib/planes.ts:92",
      ejemplo: [
        { id: "free", monthly: 0, yearly: 0, minutos: 60, cuentas: 1 },
        {
          id: "creator",
          monthly: 29,
          yearly: 14.5,
          minutos: 600,
          cuentas: 6,
          featured: true,
        },
        {
          id: "business",
          monthly: 39,
          yearly: 19.5,
          minutos: 600,
          cuentas: 20,
          asiento: 15,
        },
      ],
    },
    errores: [
      SIN_ADMIN,
      conflicto(
        "Propuesta: hay cuentas en alguno de los planes creados que se borrarían."
      ),
    ],
    reglas: [
      SOLO_ADMIN,
      "Devuelve `PLANES_SEMILLA` (lib/planes.ts:92): lo de `lib/pricing.ts`.",
      "Hoy no pide confirmación y borra también los planes creados, aunque alguien los tenga (components/admin/catalogo-planes.tsx:86). Propuesta para el servidor: con cuentas en planes creados, negarse con `conflicto`.",
    ],
    origen: "hooks/use-catalogo-planes.ts:103",
  },
]

/* ---------------------------------------------------------------------------
   Micropreguntas (hoy `clipealo-micro-catalogo-v1`)
   --------------------------------------------------------------------------- */

const PREGUNTA_ID = enRuta(
  "id",
  "Id de la pregunta: una de las nueve del producto (`experiencia`, `ligas`, `generos`, `formatos`, `disponibilidad`, `motivo-pausa`, `motivaciones`, `herramientas`, `sigues-clipeando`) o una escrita aquí (`micro_…`)."
)

const ERRORES_PREGUNTA: ErrorDoc[] = [
  {
    codigo: "tituloCorto",
    http: 422,
    cuando: "La pregunta tiene menos de 8 caracteres.",
    frase: "admin.preguntas.form.errors.tituloCorto",
    bloquea: true,
  },
  {
    codigo: "ayudaCorta",
    http: 422,
    cuando: "«Para qué se pregunta» tiene menos de 10 caracteres.",
    frase: "admin.preguntas.form.errors.ayudaCorta",
    bloquea: true,
  },
  {
    codigo: "pocasOpciones",
    http: 422,
    cuando: "Menos de 2 opciones escritas.",
    frase: "admin.preguntas.form.errors.pocasOpciones",
    bloquea: true,
  },
  {
    codigo: "opcionVacia",
    http: 422,
    cuando: "Hay una opción sin escribir.",
    frase: "admin.preguntas.form.errors.opcionVacia",
    bloquea: true,
  },
  {
    codigo: "opcionRepetida",
    http: 422,
    cuando: "Dos opciones iguales.",
    frase: "admin.preguntas.form.errors.opcionRepetida",
    bloquea: true,
  },
]

const REGLAS_PREGUNTA = [
  "Repetir `validarPregunta` (lib/micro-catalogo.ts:200) con `LIMITES_PREGUNTA` (lib/micro-catalogo.ts:147): pregunta 8–120 caracteres, «para qué» 10–200 y obligatorio, opciones de 1 a 60 caracteres, de 2 a 8, sin vacías ni repetidas.",
  "`max` solo con varias respuestas, de 1 a 8; `desdeAltaDias` de 0 a 365 (así lo limpia `limpiarPregunta`, lib/micro-catalogo.ts:306).",
  "Solo se pregunta a cliperos. Es contenido: va en el idioma en que se escriba y no se traduce.",
]

const PREGUNTAS: Endpoint[] = [
  {
    id: "backoffice.listar-preguntas",
    area: "backoffice",
    metodo: "GET",
    ruta: "/admin/preguntas",
    resumen: "El catálogo de micropreguntas aplicado y las reglas de frecuencia.",
    descripcion:
      "Sustituye a `useCatalogoMicro` sobre `clipealo-micro-catalogo-v1`: semillas + parches (activa, lugar, orden), preguntas creadas enteras y las reglas que se hayan tocado. Lo lee también la app para decidir qué preguntar.",
    estado: "por-construir",
    auth: "admin",
    respuesta: {
      tipo: "CatalogoMicro",
      definidoEn: "lib/micro-catalogo.ts:66",
      ejemplo: {
        preguntas: [
          {
            id: "experiencia",
            origen: "semilla",
            activa: true,
            lugar: "enviar",
            orden: 0,
          },
          {
            id: "micro_mtzs9a",
            origen: "creada",
            activa: true,
            lugar: "enviar",
            orden: 9,
            titulo: "¿Qué es lo que más te cuesta al montar un clip?",
            ayuda: "Para saber qué parte del editor mejorar primero.",
            tipo: "unica",
            opciones: ["Encontrar el momento", "Los subtítulos"],
            desdeAltaDias: 0,
          },
        ],
        reglas: {
          diasEntre: 3,
          diasPospuesta: 7,
          diasMotivaciones: 7,
          diasHerramientas: 14,
          diasSinEnvios: 7,
          diasRevalidar: 180,
          enviosDisponibilidad: 3,
          maxSubverticales: 3,
        },
      },
    },
    errores: [SIN_ADMIN],
    reglas: [
      SOLO_ADMIN,
      "Orden por `orden` y luego por id (`aplicarCatalogoMicro`, lib/micro-catalogo.ts:121).",
      "Las nueve del producto no llevan título ni opciones: viven en `messages/` (espacio `onboarding`).",
      "Las respuestas no viajan: viven en la cuenta de cada persona y la página lo dice (admin.preguntas.frontera).",
    ],
    origen: "hooks/use-catalogo-micro.ts:86",
  },
  {
    id: "backoffice.crear-pregunta",
    area: "backoffice",
    metodo: "POST",
    ruta: "/admin/preguntas",
    resumen:
      "Escribe una micropregunta nueva con su «para qué», sus opciones y dónde sale.",
    descripcion:
      "Sustituye a `guardar` de `useEditorMicro` sin `id`: hoy el id es `nuevoIdPregunta(Date.now().toString(36))` y la pregunta va al final.",
    estado: "por-construir",
    auth: "admin",
    cuerpo: {
      tipo: "BorradorPregunta",
      definidoEn: "lib/micro-catalogo.ts:158",
      ejemplo: {
        titulo: "¿Qué es lo que más te cuesta al montar un clip?",
        ayuda: "Para saber qué parte del editor mejorar primero.",
        lugar: "enviar",
        tipo: "unica",
        opciones: ["Encontrar el momento", "Los subtítulos"],
        max: 3,
        desdeAltaDias: 0,
        activa: true,
      },
    },
    respuesta: {
      tipo: "PreguntaCatalogo",
      definidoEn: "lib/micro-catalogo.ts:39",
      ejemplo: {
        id: "micro_mtzs9a",
        origen: "creada",
        activa: true,
        lugar: "enviar",
        orden: 9,
        titulo: "¿Qué es lo que más te cuesta al montar un clip?",
        ayuda: "Para saber qué parte del editor mejorar primero.",
        tipo: "unica",
        opciones: ["Encontrar el momento", "Los subtítulos"],
        desdeAltaDias: 0,
      },
    },
    errores: [SIN_ADMIN, ...ERRORES_PREGUNTA],
    reglas: [
      SOLO_ADMIN,
      ...REGLAS_PREGUNTA,
      "El id lo pone el servidor con la forma `micro_…`. Su respuesta cae en `Cuenta.respuestasLibres`: no tiene campo tipado.",
      "Se guarda sin espacios en los bordes y sin opciones vacías (`preguntaDeBorrador`, lib/micro-catalogo.ts:250); `max` solo se guarda con varias respuestas.",
      "Va al final: su `orden` es el mayor del catálogo más uno (hooks/use-catalogo-micro.ts:139).",
    ],
    origen: "hooks/use-catalogo-micro.ts:135",
  },
  {
    id: "backoffice.editar-pregunta",
    area: "backoffice",
    metodo: "PATCH",
    ruta: "/admin/preguntas/{id}",
    resumen: "Enciende o apaga una pregunta, o reescribe una escrita aquí.",
    descripcion:
      "Sustituye a `alternar` y a `guardar` (con `id`) de `useEditorMicro`. De las nueve del producto solo se cambia `activa` (y en el dato, `lugar` y `orden`); una escrita aquí se reescribe entera y su parche viejo sobra.",
    estado: "por-construir",
    auth: "admin",
    parametros: [PREGUNTA_ID],
    cuerpo: {
      tipo: 'BorradorPregunta | Partial<Pick<PreguntaCatalogo, "activa" | "lugar" | "orden">>',
      definidoEn: "lib/micro-catalogo.ts:39",
      ejemplo: { activa: false },
    },
    respuesta: {
      tipo: "PreguntaCatalogo",
      definidoEn: "lib/micro-catalogo.ts:39",
      ejemplo: {
        id: "herramientas",
        origen: "semilla",
        activa: false,
        lugar: "panel",
        orden: 7,
      },
    },
    errores: [
      SIN_ADMIN,
      noExiste("La pregunta"),
      conflicto(
        "Se intenta cambiar el texto u opciones de una de las nueve del producto: su texto vive en `messages/`."
      ),
      ...ERRORES_PREGUNTA,
    ],
    reglas: [
      SOLO_ADMIN,
      ...REGLAS_PREGUNTA,
      "De una semilla solo se guarda el parche de `activa`, `lugar` y `orden` (`parchePregunta`, lib/micro-catalogo.ts:132).",
      "Apagar no borra: lo respondido sigue en la cuenta.",
    ],
    origen: "hooks/use-catalogo-micro.ts:101",
  },
  {
    id: "backoffice.mover-pregunta",
    area: "backoffice",
    metodo: "POST",
    ruta: "/admin/preguntas/{id}/mover",
    resumen: "Sube o baja una pregunta dentro de su lugar (Panel o Enviar clip).",
    descripcion:
      "Sustituye a `mover` de `useEditorMicro`: intercambia el orden con la vecina de su mismo lugar y guarda solo los dos parches.",
    estado: "por-construir",
    auth: "admin",
    parametros: [PREGUNTA_ID],
    cuerpo: { tipo: "{ delta: -1 | 1 }", ejemplo: { delta: 1 } },
    respuesta: {
      tipo: "PreguntaCatalogo[]",
      definidoEn: "lib/micro-catalogo.ts:39",
      ejemplo: [
        { id: "ligas", lugar: "panel", orden: 2 },
        { id: "generos", lugar: "panel", orden: 1 },
      ],
    },
    errores: [SIN_ADMIN, noExiste("La pregunta")],
    reglas: [
      SOLO_ADMIN,
      "Solo compite con las de su mismo lugar (`moverPregunta`, lib/micro-catalogo.ts:271).",
      "La primera disponible de un lugar es la que sale: el orden decide qué se pregunta.",
      "En un extremo no pasa nada.",
    ],
    origen: "hooks/use-catalogo-micro.ts:121",
  },
  {
    id: "backoffice.borrar-pregunta",
    area: "backoffice",
    metodo: "DELETE",
    ruta: "/admin/preguntas/{id}",
    resumen: "Borra una pregunta escrita aquí. Las del producto no se borran: se apagan.",
    descripcion: "Sustituye a `borrar` de `useEditorMicro`.",
    estado: "por-construir",
    auth: "admin",
    parametros: [PREGUNTA_ID],
    respuesta: { tipo: "void (204)" },
    errores: [
      SIN_ADMIN,
      noExiste("La pregunta"),
      conflicto("Es una de las nueve del producto: esas se apagan, no se borran."),
    ],
    reglas: [
      SOLO_ADMIN,
      "Solo `origen: creada`.",
      "No se deshace. Lo que la gente ya respondió se queda en su cuenta.",
    ],
    origen: "hooks/use-catalogo-micro.ts:156",
  },
  {
    id: "backoffice.cambiar-reglas-preguntas",
    area: "backoffice",
    metodo: "PATCH",
    ruta: "/admin/preguntas/reglas",
    resumen: "Cambia cada cuánto se pregunta: días entre preguntas, umbrales y máximos.",
    descripcion:
      "Sustituye a `cambiarRegla` de `useEditorMicro`, que hoy guarda el número tal cual y deja el rango a la migración. `reglas` no es un id de pregunta (son las nueve o `micro_…`), así que la ruta no choca con `/admin/preguntas/{id}`.",
    estado: "por-construir",
    auth: "admin",
    cuerpo: {
      tipo: "Partial<ReglasMicro>",
      definidoEn: "lib/micro-catalogo.ts:72",
      ejemplo: { diasEntre: 14 },
    },
    respuesta: {
      tipo: "ReglasMicro",
      definidoEn: "lib/micro-catalogo.ts:72",
      ejemplo: {
        diasEntre: 14,
        diasPospuesta: 7,
        diasMotivaciones: 7,
        diasHerramientas: 14,
        diasSinEnvios: 7,
        diasRevalidar: 180,
        enviosDisponibilidad: 3,
        maxSubverticales: 3,
      },
    },
    errores: [SIN_ADMIN],
    reglas: [
      SOLO_ADMIN,
      "Rangos de `LIMITES_REGLAS` (lib/micro-catalogo.ts:75): diasEntre 0–60, diasPospuesta 1–90, diasMotivaciones 1–180, diasHerramientas 1–180, diasSinEnvios 1–90, diasRevalidar 30–730, enviosDisponibilidad 1–50, maxSubverticales 1–10.",
      "Fuera de rango se recorta al límite y se redondea, como hace `migrarCatalogoMicro` al leer (lib/micro-catalogo.ts:338).",
      "Solo se guarda lo tocado: lo demás sigue el valor de fábrica (`REGLAS_MICRO`, lib/micro-preguntas.ts:87).",
    ],
    origen: "hooks/use-catalogo-micro.ts:166",
  },
  {
    id: "backoffice.reiniciar-preguntas",
    area: "backoffice",
    metodo: "POST",
    ruta: "/admin/preguntas/reiniciar",
    resumen:
      "Vuelve al catálogo de fábrica: las nueve, activas, en su sitio, con las reglas de fábrica.",
    descripcion:
      "Sustituye a `reiniciarCatalogoMicro`, que escribe `CATALOGO_MICRO_VACIO`.",
    estado: "por-construir",
    auth: "admin",
    respuesta: {
      tipo: "CatalogoMicro",
      definidoEn: "lib/micro-catalogo.ts:87",
      ejemplo: {
        preguntas: [
          {
            id: "experiencia",
            origen: "semilla",
            activa: true,
            lugar: "enviar",
            orden: 0,
          },
        ],
        reglas: {
          diasEntre: 3,
          diasPospuesta: 7,
          diasMotivaciones: 7,
          diasHerramientas: 14,
          diasSinEnvios: 7,
          diasRevalidar: 180,
          enviosDisponibilidad: 3,
          maxSubverticales: 3,
        },
      },
    },
    errores: [SIN_ADMIN],
    reglas: [
      SOLO_ADMIN,
      "Borra también las preguntas escritas aquí; sus respuestas siguen en las cuentas.",
    ],
    origen: "hooks/use-catalogo-micro.ts:71",
  },
]

/* ---------------------------------------------------------------------------
   Campañas y solicitud de agencia (hoy `clipealo-campanas-v1`)
   --------------------------------------------------------------------------- */

const CAMPANA_ID = enRuta("id", "Id de la campaña, p. ej. `cmp_liga`.")
const SOLICITUD_ID = enRuta(
  "id",
  "Id de la solicitud. En la demo hay una sola, la de la cuenta de este navegador."
)

const CAMPANAS: Endpoint[] = [
  {
    id: "backoffice.listar-campanas",
    area: "backoffice",
    metodo: "GET",
    ruta: "/admin/campanas",
    resumen: "Todas las campañas de la plataforma con los envíos que las liquidan.",
    descripcion:
      "Sustituye a `useCampanas().campanas` y `envios` en /admin/campanas: con los envíos se calcula el consumo (`liquidar`) y el estado que se enseña (`estadoVisible`). Hoy app y backoffice comparten el almacén; al separarlos, este es el lado del admin.",
    estado: "por-construir",
    auth: "admin",
    respuesta: {
      tipo: "{ campanas: Campana[]; envios: Envio[] }",
      definidoEn: "lib/campanas.ts:75",
      ejemplo: {
        campanas: [
          {
            id: "cmp_liga",
            titulo: "Liga de las Estrellas: temporada de otoño",
            marca: "Liga de las Estrellas",
            categoria: "marcas",
            creadaPor: { perfil: "admin", nombre: "Clipealo" },
            estado: "activa",
            destacada: true,
            privada: false,
            presupuesto: 3600,
            cpm: 0.72,
            topePorVideoPct: 4,
            minimoVistas: 5000,
            redes: ["youtube", "tiktok", "instagram"],
            inicio: "2026-09-01T00:00:00.000Z",
            fin: "2026-11-30T23:59:00.000Z",
            creadaEn: "2026-08-30T15:00:00.000Z",
          },
        ],
        envios: [],
      },
    },
    errores: [SIN_ADMIN],
    reglas: [
      SOLO_ADMIN,
      "Todas, también las privadas y las de otras agencias: el admin modera la plataforma entera.",
      "Orden: de la más reciente a la más antigua por `creadaEn`.",
    ],
    origen: "components/admin/campanas-admin.tsx:49",
  },
  {
    id: "backoffice.destacar-campana",
    area: "backoffice",
    metodo: "PUT",
    ruta: "/admin/campanas/{id}/destacada",
    resumen: "Pone o quita una campaña de destacadas: sale primero en Explorar.",
    descripcion:
      "Sustituye a `destacar` de `useCampanas`, que guarda `{ destacada }` en `cambios`.",
    estado: "por-construir",
    auth: "admin",
    parametros: [CAMPANA_ID],
    cuerpo: { tipo: "{ destacada: boolean }", ejemplo: { destacada: false } },
    respuesta: {
      tipo: "Campana",
      definidoEn: "lib/campanas.ts:75",
      ejemplo: { id: "cmp_liga", destacada: false, estado: "activa" },
    },
    errores: [
      SIN_ADMIN,
      noExiste("La campaña"),
      conflicto("La campaña es privada o no está activa ni pausada."),
    ],
    reglas: [
      SOLO_ADMIN,
      "Solo el admin destaca (`Campana.destacada`, lib/campanas.ts:87).",
      "Una privada no se destaca: no sale en Explorar. Solo activas o pausadas (components/admin/campanas-admin.tsx:338).",
    ],
    origen: "hooks/use-campanas.ts:313",
  },
  {
    id: "backoffice.cambiar-estado-campana",
    area: "backoffice",
    metodo: "PATCH",
    ruta: "/admin/campanas/{id}/estado",
    resumen: "Pausa, reanuda o finaliza una campaña de cualquier agencia.",
    descripcion:
      "Sustituye a `cambiarEstado` de `useCampanas`, que guarda `{ estado }` en `cambios`.",
    estado: "por-construir",
    auth: "admin",
    parametros: [CAMPANA_ID],
    cuerpo: {
      tipo: '{ estado: "activa" | "pausada" | "finalizada" }',
      definidoEn: "lib/campanas.ts:50",
      ejemplo: { estado: "pausada" },
    },
    respuesta: {
      tipo: "Campana",
      definidoEn: "lib/campanas.ts:75",
      ejemplo: { id: "cmp_liga", estado: "pausada" },
    },
    errores: [
      SIN_ADMIN,
      noExiste("La campaña"),
      conflicto(
        "El paso no está permitido: una finalizada no vuelve, y solo se pausa una activa y se reanuda una pausada."
      ),
    ],
    reglas: [
      SOLO_ADMIN,
      "Pausar: solo una activa. Reanudar: solo una pausada. Finalizar: activa, pausada o agotada.",
      "Finalizada es definitivo: no admite clips de nadie y no se reabre.",
      "Estados guardados: activa, pausada, agotada, finalizada (`ESTADOS_CAMPANA`); «vencida» y «cerrada» se derivan (`estadoVisible`, lib/campanas.ts:356).",
    ],
    origen: "hooks/use-campanas.ts:308",
  },
  {
    id: "backoffice.listar-solicitudes-agencia",
    area: "backoffice",
    metodo: "GET",
    ruta: "/admin/solicitudes-agencia",
    resumen:
      "Las solicitudes de perfil de agencia pendientes o citadas a entrevista, con lo que envió la organización.",
    descripcion:
      "Sustituye a `solicitudAgencia`, `datosSolicitud` y `entrevista` de `useCampanas`: hoy solo existe la de la cuenta de este navegador. Con servidor es una cola de verdad.",
    estado: "por-construir",
    auth: "admin",
    parametros: [
      {
        nombre: "estado",
        tipo: "SolicitudAgencia",
        requerido: false,
        en: "consulta",
        descripcion: "Por defecto «pendiente» y «entrevista»: las que esperan al equipo.",
      },
    ],
    respuesta: {
      tipo: "{ id: string; estado: SolicitudAgencia; datos?: SolicitudAgenciaDatos; entrevista?: Entrevista }[]",
      definidoEn: "lib/onboarding.ts:330",
      ejemplo: [
        {
          id: "sol_up",
          estado: "pendiente",
          datos: {
            tipoOrganizacion: "universidad",
            organizacion: "Universidad del Pacífico",
            web: "https://up.edu.pe",
            dominioCoincide: true,
            pais: "PE",
            sector: "educacion-infoproductos",
            verticalesMaterial: ["educacion"],
            redesObjetivo: ["tiktok", "youtube"],
            paisesObjetivo: ["PE"],
            idiomasObjetivo: ["es"],
            nombre: "Lucía Paredes",
            correo: "lucia@up.edu.pe",
            tramoPresupuesto: "2k-10k",
            enviadaEn: "2026-09-12T10:00:00.000Z",
          },
        },
      ],
    },
    errores: [SIN_ADMIN],
    reglas: [
      SOLO_ADMIN,
      "Estados: ninguna, pendiente, entrevista, aprobada, rechazada (`ESTADOS_SOLICITUD`, hooks/use-campanas.ts:83).",
      "Lo primero que se mira es qué clase de organización es (`tipoOrganizacion`), y con quién se habla (`rol`, si lo dijo).",
    ],
    origen: "components/admin/solicitud-agencia.tsx:66",
  },
  {
    id: "backoffice.citar-entrevista",
    area: "backoffice",
    metodo: "POST",
    ruta: "/admin/solicitudes-agencia/{id}/entrevista",
    resumen:
      "Cita a la organización a una entrevista antes de decidir; la agencia la ve en su pantalla de solicitud.",
    descripcion:
      "Sustituye a `citarEntrevista(entrevista)`, que pone la solicitud en «entrevista» y guarda la cita. Se puede volver a citar: la última cita es la que vale.",
    estado: "por-construir",
    auth: "admin",
    parametros: [SOLICITUD_ID],
    cuerpo: {
      tipo: "Entrevista",
      definidoEn: "hooks/use-campanas.ts:92",
      campos: [
        {
          nombre: "citadaEn",
          tipo: "string",
          requerido: true,
          descripcion:
            "El día, a mediodía UTC para que caiga ese mismo día en cualquier zona (`isoDeDia`, components/admin/solicitud-agencia.tsx:200).",
        },
        {
          nombre: "nota",
          tipo: "string",
          requerido: false,
          descripcion: "Nota para la agencia. Vacía no viaja.",
        },
      ],
      ejemplo: {
        citadaEn: "2026-09-22T12:00:00.000Z",
        nota: "Videollamada de 20 minutos con quien lleve el canal.",
      },
    },
    respuesta: {
      tipo: "{ estado: SolicitudAgencia; entrevista: Entrevista }",
      definidoEn: "hooks/use-campanas.ts:92",
      ejemplo: {
        estado: "entrevista",
        entrevista: {
          citadaEn: "2026-09-22T12:00:00.000Z",
          nota: "Videollamada de 20 minutos con quien lleve el canal.",
        },
      },
    },
    errores: [
      SIN_ADMIN,
      noExiste("La solicitud"),
      {
        codigo: "fecha",
        http: 422,
        cuando: "Falta la fecha o no es un día «AAAA-MM-DD».",
        frase: "admin.campanas.agency.interviewDialog.errors.fecha",
        bloquea: true,
      },
      conflicto("La solicitud ya está aprobada o rechazada."),
    ],
    reglas: [
      SOLO_ADMIN,
      "Solo desde «pendiente» o «entrevista».",
      "La agencia lo ve en /campanas/nueva: «te ha citado a una entrevista», con la nota.",
    ],
    origen: "hooks/use-campanas.ts:427",
  },
  {
    id: "backoffice.conceder-agencia",
    area: "backoffice",
    metodo: "POST",
    ruta: "/admin/solicitudes-agencia/{id}/conceder",
    resumen: "Concede el perfil de agencia con el plan que salió de la entrevista.",
    descripcion:
      "Sustituye a `resolverAgencia(true, undefined, plan)`: la solicitud pasa a «aprobada», el perfil a «agencia», se guarda `planAsignado` y se cambia el plan de la cuenta (hooks/use-campanas.ts:448), que es lo que abre las puertas al momento.",
    estado: "por-construir",
    auth: "admin",
    parametros: [SOLICITUD_ID],
    cuerpo: {
      tipo: "{ plan: PlanId }",
      definidoEn: "lib/planes.ts:48",
      ejemplo: { plan: "business" },
    },
    respuesta: {
      tipo: "{ estado: SolicitudAgencia; perfil: Perfil; planAsignado: PlanId }",
      definidoEn: "hooks/use-campanas.ts:81",
      ejemplo: { estado: "aprobada", perfil: "agencia", planAsignado: "business" },
    },
    errores: [
      SIN_ADMIN,
      noExiste("La solicitud"),
      conflicto("El plan está apagado o no existe, o la solicitud ya está resuelta."),
    ],
    reglas: [
      SOLO_ADMIN,
      "El plan sale del catálogo entero, también los ocultos, pero nunca uno apagado (`planesAsignables`, lib/planes.ts:491).",
      "Una agencia publica campañas sin revisión: por eso se concede tras mirar la organización.",
      "El plan se puede cambiar después desde Planes (admin.campanas.agency.planHint).",
      "Registra el evento `solicitud_agencia` con estado «aprobada», el tramo de presupuesto y si el sector está regulado; nada más de la organización (`eventoSolicitud`, hooks/use-campanas.ts:193).",
    ],
    origen: "hooks/use-campanas.ts:435",
  },
  {
    id: "backoffice.rechazar-agencia",
    area: "backoffice",
    metodo: "POST",
    ruta: "/admin/solicitudes-agencia/{id}/rechazar",
    resumen: "Rechaza la solicitud de agencia con un motivo que la organización lee.",
    descripcion:
      "Sustituye a `resolverAgencia(false, motivo)`: la solicitud pasa a «rechazada» y el motivo se guarda como código.",
    estado: "por-construir",
    auth: "admin",
    parametros: [SOLICITUD_ID],
    cuerpo: {
      tipo: "{ motivo: MotivoRechazo }",
      definidoEn: "lib/taxonomia.ts:650",
      campos: [
        {
          nombre: "motivo",
          tipo: '"web-no-verificable" | "sector-no-admitido" | "datos-incompletos" | "duplicada" | "otro"',
          requerido: true,
          descripcion:
            "Código de `MOTIVOS_RECHAZO_AGENCIA`; la frase vive en `taxonomy.motivosRechazo`.",
        },
      ],
      ejemplo: { motivo: "web-no-verificable" },
    },
    respuesta: {
      tipo: "{ estado: SolicitudAgencia; motivoRechazo: MotivoRechazo }",
      definidoEn: "lib/taxonomia.ts:657",
      ejemplo: { estado: "rechazada", motivoRechazo: "web-no-verificable" },
    },
    errores: [
      SIN_ADMIN,
      noExiste("La solicitud"),
      conflicto("La solicitud ya está resuelta."),
    ],
    reglas: [
      SOLO_ADMIN,
      "Siempre con motivo: nadie se queda sin saber por qué (admin.campanas.agency.rejectDialog.description).",
      "El motivo es un código; la agencia lo lee traducido en /campanas/nueva y puede volver a solicitarlo.",
      "Registra el evento `solicitud_agencia` con estado «rechazada» (`eventoSolicitud`, hooks/use-campanas.ts:193).",
    ],
    origen: "hooks/use-campanas.ts:435",
  },
]

/* ---------------------------------------------------------------------------
   Disputas
   --------------------------------------------------------------------------- */

const DISPUTAS: Endpoint[] = [
  {
    id: "backoffice.listar-disputas",
    area: "backoffice",
    metodo: "GET",
    ruta: "/admin/disputas",
    resumen: "La cola de disputas con el compromiso de cada una: lo justo para arbitrar.",
    descripcion:
      "Sustituye a `getAdminDisputas`, que hoy devuelve la cola vacía a propósito: las disputas nacen y se resuelven en el navegador (`useCampanas`) y la página une lo del servidor con lo del cliente (manda el cliente).",
    estado: "por-construir",
    auth: "admin",
    respuesta: {
      tipo: "DisputasAdmin",
      definidoEn: "lib/api/admin.ts:195",
      ejemplo: {
        disputas: [
          {
            id: "dis_dem_01",
            participacionId: "par_dem_09",
            campanaId: "cmp_liga",
            abrePor: "agencia",
            motivo: "no-entrego",
            detalle: "Aceptamos su solicitud y el plazo venció sin clip ni respuesta.",
            estado: "abierta",
            abiertaEn: "2026-09-05T12:20:00.000Z",
          },
        ],
        participaciones: [
          {
            id: "par_dem_09",
            campanaId: "cmp_liga",
            userId: "u_nora",
            clipero: "Nora Vidal",
            estado: "en-disputa",
            solicitadaEn: "2026-08-24T12:20:00.000Z",
            decididaEn: "2026-08-25T12:20:00.000Z",
            venceEn: "2026-09-01T12:20:00.000Z",
            disputaId: "dis_dem_01",
          },
        ],
      },
    },
    errores: [SIN_ADMIN],
    reglas: [
      SOLO_ADMIN,
      "Frontera de datos: quién reclama, contra quién, por qué, las fechas y el tope por video de la campaña; nunca el wallet del clipero, sus otras campañas ni sus datos de cobro (lib/api/admin.ts:210).",
      "Estados: abierta, en-revision, resuelta (`ESTADOS_DISPUTA`, lib/participacion.ts:84); hoy nada pone una disputa «en-revision». La barra lateral cuenta las no resueltas (components/admin/admin-sidebar.tsx:83).",
    ],
    origen: "lib/api/admin.ts:213",
  },
  {
    id: "backoffice.dictar-laudo",
    area: "backoffice",
    metodo: "POST",
    ruta: "/admin/disputas/{id}/laudo",
    resumen:
      "Dicta el laudo de una disputa: liberar la plaza, dar prórroga, pagar al clipero o cerrar sin pago.",
    descripcion:
      "Sustituye a `resolverDisputa(d, p, laudo, { notaAdmin, prorrogaDias })`, que aplica `resolverDisputa` del dominio (lib/participacion.ts:518) y escribe a la vez la disputa, la participación y, si hay clip, el envío.",
    estado: "por-construir",
    auth: "admin",
    parametros: [enRuta("id", "Id de la disputa, p. ej. `dis_dem_01`.")],
    cuerpo: {
      tipo: "{ laudo: Laudo; notaAdmin: string; prorrogaDias?: number }",
      definidoEn: "lib/participacion.ts:87",
      campos: [
        {
          nombre: "laudo",
          tipo: '"liberar-plaza" | "dar-prorroga" | "pagar-clipero" | "sin-pago"',
          requerido: true,
          descripcion:
            "`LAUDOS`. «pagar-clipero» solo si hay clip entregado (`laudosPosibles`, lib/participacion.ts:509).",
        },
        {
          nombre: "notaAdmin",
          tipo: "string",
          requerido: true,
          descripcion: "La leen el clipero y quien paga. Obligatoria.",
        },
        {
          nombre: "prorrogaDias",
          tipo: "number",
          requerido: false,
          descripcion:
            "Solo con «dar-prorroga»: días desde hoy, de 1 a 30. Por defecto 7 (`PLAZO_ENTREGA_DIAS`).",
        },
      ],
      ejemplo: {
        laudo: "dar-prorroga",
        notaAdmin:
          "El plazo venció en plena semana de exámenes y avisó por el chat. Siete días más.",
        prorrogaDias: 7,
      },
    },
    respuesta: {
      tipo: "{ disputa: Disputa; participacion: Participacion; envio?: CambioEnvio }",
      definidoEn: "lib/participacion.ts:518",
      ejemplo: {
        disputa: {
          id: "dis_dem_01",
          participacionId: "par_dem_09",
          campanaId: "cmp_liga",
          abrePor: "agencia",
          motivo: "no-entrego",
          estado: "resuelta",
          abiertaEn: "2026-09-05T12:20:00.000Z",
          laudo: "dar-prorroga",
          notaAdmin:
            "El plazo venció en plena semana de exámenes y avisó por el chat. Siete días más.",
          resueltaEn: "2026-09-13T12:20:00.000Z",
        },
        participacion: {
          id: "par_dem_09",
          estado: "aceptada",
          venceEn: "2026-09-20T12:20:00.000Z",
        },
      },
    },
    errores: [
      SIN_ADMIN,
      noExiste("La disputa"),
      {
        codigo: "noteRequired",
        http: 422,
        cuando: "Falta la nota para las dos partes.",
        frase: "admin.disputas.form.noteRequired",
        bloquea: true,
      },
      conflicto(
        "La disputa ya está resuelta, o se pide «pagar-clipero» sin clip entregado."
      ),
    ],
    reglas: [
      SOLO_ADMIN,
      "Cada laudo deja el compromiso en un estado distinto y no tiene vuelta atrás: liberar-plaza → caducada; dar-prorroga → aceptada con plazo nuevo desde hoy; pagar-clipero → cumplida y el envío aprobado (entra en `liquidar`); sin-pago → rechazada con motivo «otro» y el envío rechazado.",
      "El laudo que paga tiene que tocar el envío: la participación «cumplida» no mueve dinero, lo reparte `liquidar` entre los envíos aprobados.",
      "La disputa queda «resuelta» con `laudo`, `notaAdmin` y `resueltaEn`; la participación pierde su `disputaId`.",
      "El instante lo pone el servidor (hoy, `HOY_CAMPANAS`).",
    ],
    origen: "hooks/use-campanas.ts:575",
  },
]

/* ---------------------------------------------------------------------------
   Casillero (hoy `clipealo-feedback-v1`)
   --------------------------------------------------------------------------- */

const MENSAJE_ID = enRuta("id", "Id del mensaje, p. ej. `fb_s2`.")

const CASILLERO: Endpoint[] = [
  {
    id: "backoffice.listar-mensajes",
    area: "backoffice",
    metodo: "GET",
    ruta: "/admin/feedback",
    resumen:
      "Todo lo que cliperos y agencias le han escrito al equipo, en todos sus estados.",
    descripcion:
      "Sustituye a `useFeedback().mensajes` en el backoffice: la cola entera, no solo la de una cuenta (eso es `ayuda.listar`). La barra lateral cuenta los «nuevo».",
    estado: "por-construir",
    auth: "admin",
    respuesta: {
      tipo: "Feedback[]",
      definidoEn: "lib/feedback.ts:43",
      ejemplo: [
        {
          id: "fb_s2",
          autor: "Nebula Studio",
          userId: "u_nebula",
          de: "agencia",
          tipo: "idea",
          texto:
            "Nos vendría muy bien poder exigir un mínimo de seguidores al aceptar cliperos. Ahora miramos el perfil uno a uno y se nos va la mañana.",
          ruta: "/campanas/cmp_arena",
          creadoEn: "2026-09-09T11:15:00.000Z",
          estado: "nuevo",
        },
      ],
    },
    errores: [SIN_ADMIN],
    reglas: [
      SOLO_ADMIN,
      "Del más nuevo al más viejo. Nada se borra: los archivados también llegan.",
      "El texto va tal cual se escribió: no se traduce ni se recorta.",
    ],
    origen: "hooks/use-feedback.ts:112",
  },
  {
    id: "backoffice.marcar-mensaje-leido",
    area: "backoffice",
    metodo: "POST",
    ruta: "/admin/feedback/{id}/leido",
    resumen: "Marca un mensaje como leído por el equipo al abrirlo.",
    descripcion:
      "Sustituye a `leer` de `useFeedback`, que aplica `marcarLeido` (lib/feedback.ts:139).",
    estado: "por-construir",
    auth: "admin",
    parametros: [MENSAJE_ID],
    respuesta: {
      tipo: "Feedback",
      definidoEn: "lib/feedback.ts:43",
      ejemplo: { id: "fb_s2", estado: "leido" },
    },
    errores: [SIN_ADMIN, noExiste("El mensaje")],
    reglas: [
      SOLO_ADMIN,
      "Solo pasa de «nuevo» a «leido»; en cualquier otro estado no cambia nada (ni borra una respuesta).",
      "Quien escribió lo ve como «Leído por el equipo».",
    ],
    origen: "hooks/use-feedback.ts:136",
  },
  {
    id: "backoffice.responder-mensaje",
    area: "backoffice",
    metodo: "POST",
    ruta: "/admin/feedback/{id}/respuesta",
    resumen:
      "Responde a un mensaje; la respuesta aparece en su Ayuda › Tus mensajes y la campana la anuncia.",
    descripcion:
      "Sustituye a `responder` de `useFeedback`, que aplica `responder` (lib/feedback.ts:148).",
    estado: "por-construir",
    auth: "admin",
    parametros: [MENSAJE_ID],
    cuerpo: {
      tipo: "{ respuesta: string }",
      campos: [
        {
          nombre: "respuesta",
          tipo: "string",
          requerido: true,
          descripcion:
            "No vacía; hasta 1200 caracteres (`LIMITES_FEEDBACK.respuestaMax`). Contenido: no se traduce.",
        },
      ],
      ejemplo: {
        respuesta:
          "Buena idea: lo apuntamos para los filtros de solicitudes. Te avisamos cuando salga.",
      },
    },
    respuesta: {
      tipo: "Feedback",
      definidoEn: "lib/feedback.ts:43",
      ejemplo: {
        id: "fb_s2",
        estado: "respondido",
        respuesta:
          "Buena idea: lo apuntamos para los filtros de solicitudes. Te avisamos cuando salga.",
        respondidoEn: "2026-09-13T12:20:00.000Z",
        sinLeer: true,
      },
    },
    errores: [
      SIN_ADMIN,
      noExiste("El mensaje"),
      {
        codigo: "vacia",
        http: 422,
        cuando: "La respuesta está vacía.",
        frase: "admin.feedback.detalle.errors.vacia",
        bloquea: true,
      },
    ],
    reglas: [
      SOLO_ADMIN,
      "Queda «respondido», con la respuesta sin espacios en los bordes, `respondidoEn` del servidor y `sinLeer: true` para que la campana lo anuncie una vez; pasa a `false` cuando quien escribió abre Ayuda › Tus mensajes (`marcarVisto`, lib/feedback.ts:158).",
      "Se recorta a 1200 caracteres (`limpiarParcheFeedback`, lib/feedback.ts:265).",
      "Volver a responder reescribe la respuesta y la fecha.",
      "Hará falta además un aviso de verdad (correo o push): docs/costuras-backend.md, «Casillero».",
    ],
    origen: "hooks/use-feedback.ts:137",
  },
  {
    id: "backoffice.archivar-mensaje",
    area: "backoffice",
    metodo: "POST",
    ruta: "/admin/feedback/{id}/archivar",
    resumen: "Saca un mensaje de la cola sin borrarlo.",
    descripcion:
      'Sustituye a `archivar` de `useFeedback` (`{ estado: "archivado" }`, lib/feedback.ts:155).',
    estado: "por-construir",
    auth: "admin",
    parametros: [MENSAJE_ID],
    respuesta: {
      tipo: "Feedback",
      definidoEn: "lib/feedback.ts:43",
      ejemplo: { id: "fb_s2", estado: "archivado" },
    },
    errores: [
      SIN_ADMIN,
      noExiste("El mensaje"),
      conflicto("El mensaje ya está archivado."),
    ],
    reglas: [
      SOLO_ADMIN,
      "Archivar no borra: sale de la cola y sigue en el historial de quien lo escribió.",
      "Conserva la respuesta si la tenía.",
    ],
    origen: "hooks/use-feedback.ts:139",
  },
]

/** Todos los endpoints del backoffice, en el orden de la barra lateral. */
export const ENDPOINTS: Endpoint[] = [
  ...LECTURA,
  ...COBROS,
  ...USUARIOS,
  ...COSTES,
  ...PROGRAMAS,
  ...PLANES,
  ...PREGUNTAS,
  ...CAMPANAS,
  ...DISPUTAS,
  ...CASILLERO,
]
