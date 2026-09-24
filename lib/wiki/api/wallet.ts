import type { Endpoint } from "@/lib/wiki/tipos"

/**
 * Endpoints de «wallet».
 *
 * Ninguno está conectado: el wallet no tiene frontera en `lib/api/`. Los
 * retiros viven en el almacén `clipealo-campanas-v1` (`hooks/use-campanas.ts`)
 * y el saldo se calcula en el navegador con `resumenWallet` (`lib/wallet.ts`).
 */
export const ENDPOINTS: Endpoint[] = [
  {
    id: "wallet.resumen",
    area: "wallet",
    metodo: "GET",
    ruta: "/wallet",
    resumen:
      "El saldo del clipero: disponible, pendiente, ganado, retirado, movimientos y lo ganado por mes.",
    descripcion:
      "Sustituye a `resumenWallet(userId, campanas, envios, retiros, hasta)`, que hoy corre en el navegador sobre TODAS las campañas y TODOS los envíos del almacén. En producción el cálculo tiene que hacerse en el servidor: el reparto de una campaña va por orden de llegada entre los clips aprobados de todos los cliperos, y el cliente no debe recibir envíos ajenos para poder sumarlo. La respuesta es el mismo `ResumenWallet` que pinta `/wallet`, así que la pantalla no cambia.",
    estado: "por-construir",
    auth: "sesion",
    respuesta: {
      tipo: "ResumenWallet",
      definidoEn: "lib/wallet.ts:167",
      campos: [
        {
          nombre: "ganado",
          tipo: "number",
          requerido: true,
          descripcion:
            "US$ que han cobrado sus clips aprobados, con la regla de `liquidar` (lib/campanas.ts:308). Redondeado a céntimos.",
        },
        {
          nombre: "pendiente",
          tipo: "number",
          requerido: true,
          descripcion:
            "US$ que cobrarían sus clips «en-revision» con las vistas de hoy y el presupuesto que le queda a cada campaña. No se puede retirar.",
        },
        {
          nombre: "retirado",
          tipo: "number",
          requerido: true,
          descripcion: "Suma de sus retiros en estado «pagado».",
        },
        {
          nombre: "enCurso",
          tipo: "number",
          requerido: true,
          descripcion: "Suma de sus retiros en estado «solicitado».",
        },
        {
          nombre: "disponible",
          tipo: "number",
          requerido: true,
          descripcion: "ganado − retirado − enCurso. Es lo único retirable.",
        },
        {
          nombre: "movimientos",
          tipo: "Movimiento[]",
          requerido: true,
          descripcion:
            "Cada clip que cobra («ingreso», estado «cobrado»), cada clip en revisión («pendiente», estado «en-revision») y cada retiro («retiro», con su `EstadoRetiro` e importe negativo). Del más reciente al más antiguo.",
        },
        {
          nombre: "porMes",
          tipo: "{ mes: string; ganado: number }[]",
          requerido: true,
          descripcion:
            "Lo ganado por mes («2026-09»), los seis últimos meses con los vacíos a 0, del más antiguo al último.",
        },
      ],
      ejemplo: {
        ganado: 314.78,
        pendiente: 5.38,
        retirado: 60,
        enCurso: 0,
        disponible: 254.78,
        movimientos: [
          {
            id: "env_ana_04",
            tipo: "pendiente",
            fecha: "2026-09-13T01:00:00.000Z",
            concepto: "Liga de las Estrellas: temporada de otoño",
            detalle: "La regla de las tres reuniones",
            importe: 0,
            estado: "en-revision",
            campanaId: "cmp_liga",
          },
          {
            id: "env_ana_03",
            tipo: "pendiente",
            fecha: "2026-09-12T21:00:00.000Z",
            concepto: "Fernanda Millares: solo Instagram",
            detalle: "Por qué tu primer producto tiene que ser feo",
            importe: 5.38,
            estado: "en-revision",
            campanaId: "cmp_fer",
          },
          {
            id: "env_ana_01",
            tipo: "ingreso",
            fecha: "2026-09-08T17:00:00.000Z",
            concepto: "Serie Bingo Monstruos",
            detalle: "El cartón que nadie esperaba",
            importe: 80,
            estado: "cobrado",
            campanaId: "cmp_bingo",
          },
          {
            id: "env_ana_00d",
            tipo: "ingreso",
            fecha: "2026-09-07T15:00:00.000Z",
            concepto: "Álex Prado y el método Enfoque",
            detalle: "El hábito de los dos minutos",
            importe: 60.17,
            estado: "cobrado",
            campanaId: "cmp_alex",
          },
          {
            id: "env_ana_02",
            tipo: "ingreso",
            fecha: "2026-09-04T16:00:00.000Z",
            concepto: "Liga de las Estrellas: temporada de otoño",
            detalle: "El gol de chilena del minuto 89",
            importe: 28.01,
            estado: "cobrado",
            campanaId: "cmp_liga",
          },
          {
            id: "ret_ana_01",
            tipo: "retiro",
            fecha: "2026-08-20T15:00:00.000Z",
            metodo: "paypal",
            detalle: "a***@estudio.co",
            importe: -60,
            estado: "pagado",
          },
          {
            id: "env_ana_00c",
            tipo: "ingreso",
            fecha: "2026-08-12T20:00:00.000Z",
            concepto: "Casi Casi: el estribillo en todas partes",
            detalle: "Reacción de mi abuela a «Casi Casi»",
            importe: 24,
            estado: "cobrado",
            campanaId: "cmp_casi",
          },
          {
            id: "env_ana_00a",
            tipo: "ingreso",
            fecha: "2026-07-09T18:00:00.000Z",
            concepto: "Rutina de 10 minutos con Ruta Fit",
            detalle: "Plancha de 60 segundos sin trampas",
            importe: 122.6,
            estado: "cobrado",
            campanaId: "cmp_fit",
          },
        ],
        porMes: [
          { mes: "2026-04", ganado: 0 },
          { mes: "2026-05", ganado: 0 },
          { mes: "2026-06", ganado: 0 },
          { mes: "2026-07", ganado: 122.6 },
          { mes: "2026-08", ganado: 24 },
          { mes: "2026-09", ganado: 168.18 },
        ],
      },
    },
    errores: [
      {
        codigo: "no-autorizado",
        http: 401,
        cuando: "No hay sesión: el wallet es siempre el de quien pregunta.",
        frase: "common.errors.no-autorizado",
        bloquea: true,
      },
    ],
    reglas: [
      "Solo la cuenta de la sesión: nunca se acepta un `userId` de fuera. Hoy el navegador calcula siempre el de `CUENTA_DEMO` («u_ana», hooks/use-campanas.ts:268).",
      "Un clip aprobado cobra lo que le toca en `liquidar` (lib/campanas.ts:308): los aprobados de la campaña, de todos los cliperos, se pagan por orden de `enviadoEn`; cada uno cobra lo menor entre vistas ÷ 1.000 × CPM, el tope por video (presupuesto × `topePorVideoPct` ÷ 100) y lo que quede de presupuesto; por debajo de `minimoVistas` cobra 0 (lib/campanas.ts:283).",
      "Un clip aprobado que cobra 0 (bajo el mínimo o con el presupuesto agotado) no genera movimiento (lib/wallet.ts:197). En la demo, «env_ana_00b» de Ruta Fit está aprobado con 24.800 vistas y no aparece: el presupuesto de US$ 700 ya se había repartido.",
      "El pendiente se estima con `pagoPorVideo(campaña, vistas de hoy, restante)` (lib/wallet.ts:210). Sin medición las vistas cuentan 0 (`vistasDe`), nunca se inventan.",
      "Cada clip en revisión se estima por separado contra el mismo `restante` de su campaña: dos clips en revisión de una campaña casi agotada pueden sumar un pendiente mayor que lo que queda. Es una estimación; lo que cobra de verdad sale de `liquidar` al aprobarse.",
      "disponible = ganado − retirado − enCurso (lib/wallet.ts:262). Un retiro «rechazado» no resta: su importe vuelve a estar disponible.",
      "Todas las cifras van redondeadas a céntimos con `redondear` (Math.round(n × 100) ÷ 100, lib/campanas.ts:224).",
      "La fecha de un ingreso o un pendiente es el `enviadoEn` del clip; la de un retiro, su `solicitadoEn`. `porMes` suma los ingresos por el mes de esa fecha.",
      "`porMes` cubre seis meses (valor por defecto de `meses` en `resumenWallet`) terminando en el mes de hoy. Hoy «hoy» es `HOY_CAMPANAS` (2026-09-13); el servidor usa su reloj.",
      "El destino de un retiro nunca viaja entero en el resumen: `detalle` lleva `enmascarar(metodo, destino)` («a***@estudio.co», «•••• 4321») o, si fue rechazado, el motivo (lib/wallet.ts:240).",
    ],
    origen: "lib/wallet.ts:178",
  },
  {
    id: "wallet.solicitar-retiro",
    area: "wallet",
    metodo: "POST",
    ruta: "/wallet/retiros",
    resumen:
      "Pedir un retiro del saldo disponible a PayPal, transferencia bancaria o Yape.",
    descripcion:
      "Sustituye a `solicitarRetiro(r: Retiro)` de `hooks/use-campanas.ts`, que hoy solo añade el retiro al almacén del navegador. El cuerpo es el `Retiro` que monta el diálogo «Retirar fondos» y la respuesta, el `Retiro` guardado. Las validaciones que hoy hace el diálogo (`validarRetiro`, `validarDestino`) las tiene que repetir el servidor.",
    estado: "por-construir",
    auth: "sesion",
    cuerpo: {
      tipo: "Retiro",
      definidoEn: "lib/wallet.ts:55",
      campos: [
        {
          nombre: "importe",
          tipo: "number",
          requerido: true,
          descripcion: "US$ a retirar, ya redondeados a céntimos por el diálogo.",
        },
        {
          nombre: "metodo",
          tipo: '"paypal" | "transferencia" | "yape"',
          requerido: true,
          descripcion: "`MetodoRetiro` (lib/wallet.ts:26).",
        },
        {
          nombre: "destino",
          tipo: "string",
          requerido: true,
          descripcion:
            "Correo de PayPal, CCI o IBAN, o celular de Yape, sin espacios al principio ni al final.",
        },
        {
          nombre: "id",
          tipo: "string",
          requerido: true,
          descripcion:
            'Hoy lo inventa el cliente con `nuevoId("ret")` («ret_» + la hora en base 36 + uno o dos caracteres al azar, lib/campanas.ts:230).',
        },
        {
          nombre: "userId",
          tipo: "string",
          requerido: true,
          descripcion: "Hoy lo pone el cliente; el servidor lo toma de la sesión.",
        },
        {
          nombre: "nombre",
          tipo: "string",
          requerido: true,
          descripcion:
            "Nombre visible de la cuenta, el que verá el equipo en «Retiros por pagar».",
        },
        {
          nombre: "estado",
          tipo: '"solicitado"',
          requerido: true,
          descripcion: "Siempre nace «solicitado».",
        },
        {
          nombre: "solicitadoEn",
          tipo: "string",
          requerido: true,
          descripcion: "ISO. Hoy es el reloj del navegador (`new Date().toISOString()`).",
        },
      ],
      ejemplo: {
        id: "ret_mtzs7n9ckb",
        userId: "u_ana",
        nombre: "Ana Ruiz",
        importe: 50,
        metodo: "paypal",
        destino: "ana@estudio.co",
        estado: "solicitado",
        solicitadoEn: "2026-09-13T12:20:00.000Z",
      },
    },
    respuesta: {
      tipo: "Retiro",
      definidoEn: "lib/wallet.ts:55",
      ejemplo: {
        id: "ret_mtzs7n9ckb",
        userId: "u_ana",
        nombre: "Ana Ruiz",
        importe: 50,
        metodo: "paypal",
        destino: "ana@estudio.co",
        estado: "solicitado",
        solicitadoEn: "2026-09-13T12:20:00.000Z",
      },
    },
    errores: [
      {
        codigo: "amountRequired",
        http: 422,
        cuando: "El importe falta, no es un número o es 0 o menos.",
        frase: "campaigns.withdraw.errors.amountRequired",
        bloquea: true,
      },
      {
        codigo: "belowMinimum",
        http: 422,
        cuando:
          "El importe es menor que `RETIRO_MINIMO` (US$ 10). En el front el error lleva `values: { min: 10 }` (`ErrorRetiro`, lib/wallet.ts:115) y el diálogo formatea `min` en el idioma (components/wallet/withdraw-dialog.tsx:73).",
        frase: "campaigns.withdraw.errors.belowMinimum",
        bloquea: true,
      },
      {
        codigo: "aboveAvailable",
        http: 422,
        cuando:
          "El importe, redondeado a céntimos, supera el disponible calculado en el servidor (también si otro retiro en curso ya se lo llevó).",
        frase: "campaigns.withdraw.errors.aboveAvailable",
        bloquea: true,
      },
      {
        codigo: "invalidEmail",
        http: 422,
        cuando: "Método «paypal» y el destino no tiene forma de correo.",
        frase: "campaigns.withdraw.errors.invalidEmail",
        bloquea: true,
      },
      {
        codigo: "invalidPhone",
        http: 422,
        cuando:
          "Método «yape» y el destino, sin espacios, no son 9 dígitos que empiezan por 9.",
        frase: "campaigns.withdraw.errors.invalidPhone",
        bloquea: true,
      },
      {
        codigo: "invalidAccount",
        http: 422,
        cuando:
          "Método «transferencia» y el destino, sin espacios ni guiones, no es un CCI de 20 dígitos ni un IBAN.",
        frase: "campaigns.withdraw.errors.invalidAccount",
        bloquea: true,
      },
      {
        codigo: "no-autorizado",
        http: 401,
        cuando: "No hay sesión.",
        frase: "common.errors.no-autorizado",
        bloquea: true,
      },
    ],
    reglas: [
      "`id`, `userId`, `nombre`, `estado` («solicitado») y `solicitadoEn` los pone el servidor: no se fía de los del cuerpo.",
      "Importe: número mayor que 0, al menos `RETIRO_MINIMO` = US$ 10 (lib/wallet.ts:49) y no más que el disponible; esta última comparación, con los dos redondeados a céntimos (`validarRetiro`, lib/wallet.ts:132). Se guarda redondeado.",
      "Los errores de validación tienen la forma de `ErrorRetiro` (lib/wallet.ts:106): `{ code }`, y `belowMinimum` con `values.min`. Ojo: hoy `pedir` no lee el cuerpo de un error, convierte el estado HTTP en código (lib/api/cliente.ts:72) y un 422 llega como «conflicto» (lib/api/errores.ts:32). Para que el diálogo pinte la frase de cada campo, la función de la frontera que se escriba tendrá que leer el `ErrorRetiro` del cuerpo.",
      "El disponible se recalcula en el servidor con la regla de `wallet.resumen` y la comprobación y el alta van en la misma transacción: dos peticiones seguidas (dos pestañas, doble clic) no pueden retirar el mismo dinero. En el navegador eso lo evita solo que el retiro en curso ya no cuente como disponible.",
      "Destino según el método (`validarDestino`, lib/wallet.ts:117): PayPal, un correo (/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/); Yape, 9 dígitos que empiezan por 9 quitando espacios (/^9\\d{8}$/); transferencia, quitando espacios y guiones y en mayúsculas, 20 dígitos (CCI) o un IBAN (/^[A-Z]{2}\\d{2}[A-Z0-9]{10,30}$/).",
      "El método tiene que valer en el país de la cuenta (`Cuenta.pais`, lib/onboarding.ts:303) según `METODOS_POR_PAIS` (lib/wallet.ts:32): Yape solo en Perú; en el resto de países, Brasil incluido, PayPal y transferencia; sin país o con «Otro país», los de US (`metodosDe`). Hoy el diálogo NO lo aplica: ofrece los tres de `METODOS_RETIRO` a todas las cuentas (components/wallet/withdraw-dialog.tsx:179).",
      "No lo limita el plan: el código no mira el plan al retirar.",
      "Los retiros son en US$: el campo del diálogo lleva el prefijo «US$» y no hay conversión de moneda en el código.",
    ],
    origen: "hooks/use-campanas.ts:392",
  },
  {
    id: "wallet.listar-retiros",
    area: "wallet",
    metodo: "GET",
    ruta: "/admin/retiros",
    resumen:
      "La cola de retiros para el equipo: quién pide cuánto, por qué método y a qué destino.",
    descripcion:
      "Sustituye a la lista `retiros` de `useCampanas()` (semillas `retirosSemilla` + los pedidos en el navegador, con sus cambios encima). El backoffice la filtra por «solicitado» para «Retiros por pagar» y para la tarjeta «Pendiente del equipo».",
    estado: "por-construir",
    auth: "admin",
    parametros: [
      {
        nombre: "estado",
        tipo: '"solicitado" | "pagado" | "rechazado"',
        requerido: false,
        en: "consulta",
        descripcion:
          "Filtra por `EstadoRetiro`. /admin/campanas solo pide «solicitado» (components/admin/campanas-admin.tsx:75).",
      },
    ],
    respuesta: {
      tipo: "Retiro[]",
      definidoEn: "lib/wallet.ts:55",
      ejemplo: [
        {
          id: "ret_valeria_01",
          userId: "u_valeria",
          nombre: "Valeria Q.",
          importe: 145.5,
          metodo: "yape",
          destino: "987654321",
          estado: "solicitado",
          solicitadoEn: "2026-09-12T22:10:00.000Z",
        },
        {
          id: "ret_mateo_01",
          userId: "u_mateo",
          nombre: "Mateo F.",
          importe: 38,
          metodo: "paypal",
          destino: "mateo.f@gmail.com",
          estado: "solicitado",
          solicitadoEn: "2026-09-13T08:40:00.000Z",
        },
      ],
    },
    errores: [
      {
        codigo: "no-autorizado",
        http: 403,
        cuando: "La sesión no es de admin.",
        frase: "common.errors.no-autorizado",
        bloquea: true,
      },
    ],
    reglas: [
      "Solo admin. `destino` son datos de cobro y viajan enteros en `Retiro`: la tabla los enmascara al pintar (`enmascarar`, components/admin/campanas-admin.tsx:184), pero el servidor no debe dárselos a nadie más.",
      "Hoy ninguna pantalla enseña el destino completo: para pagar a mano, el equipo tendrá que poder leerlo en algún sitio, y esta respuesta es la única que lo lleva.",
      "Hoy la tabla los enseña en el orden del almacén (semillas y luego los nuevos), sin ordenar.",
    ],
    origen: "hooks/use-campanas.ts:296",
  },
  {
    id: "wallet.resolver-retiro",
    area: "wallet",
    metodo: "PATCH",
    ruta: "/admin/retiros/{id}",
    resumen: "El equipo cierra un retiro: «pagado» o «rechazado» con su motivo.",
    descripcion:
      "Sustituye a `resolverRetiro(id, estado, motivo?)` de `hooks/use-campanas.ts`, que escribe el cambio en el almacén del navegador. Lo usan «Marcar pagado» y el botón de rechazar de «Retiros por pagar».",
    estado: "por-construir",
    auth: "admin",
    parametros: [
      {
        nombre: "id",
        tipo: "string",
        requerido: true,
        en: "ruta",
        descripcion: "Id del retiro («ret_valeria_01»).",
      },
    ],
    cuerpo: {
      tipo: '{ estado: Exclude<EstadoRetiro, "solicitado">; motivo?: string }',
      definidoEn: "hooks/use-campanas.ts:394",
      campos: [
        {
          nombre: "estado",
          tipo: '"pagado" | "rechazado"',
          requerido: true,
          descripcion: "La decisión. Un retiro no vuelve a «solicitado».",
        },
        {
          nombre: "motivo",
          tipo: "string",
          requerido: false,
          descripcion:
            "Solo al rechazar. El tipo es texto; hoy la pantalla manda siempre la frase fija `admin.campanas.withdrawals.rejectReason` en el idioma de quien rechaza. El clipero la lee tal cual en sus movimientos (lib/wallet.ts:240).",
        },
      ],
      ejemplo: { estado: "rechazado", motivo: "Los datos de cobro no son válidos." },
    },
    respuesta: {
      tipo: "Retiro",
      definidoEn: "lib/wallet.ts:55",
      ejemplo: {
        id: "ret_valeria_01",
        userId: "u_valeria",
        nombre: "Valeria Q.",
        importe: 145.5,
        metodo: "yape",
        destino: "987654321",
        estado: "rechazado",
        solicitadoEn: "2026-09-12T22:10:00.000Z",
        resueltoEn: "2026-09-13T12:20:00.000Z",
        motivo: "Los datos de cobro no son válidos.",
      },
    },
    errores: [
      {
        codigo: "no-encontrado",
        http: 404,
        cuando: "No hay ningún retiro con ese id.",
        frase: "common.errors.no-encontrado",
        bloquea: true,
      },
      {
        codigo: "conflicto",
        http: 409,
        cuando:
          "El retiro ya no está «solicitado»: otra persona del equipo lo pagó o lo rechazó antes.",
        frase: "common.errors.conflicto",
        bloquea: true,
      },
      {
        codigo: "no-autorizado",
        http: 403,
        cuando: "La sesión no es de admin.",
        frase: "common.errors.no-autorizado",
        bloquea: true,
      },
    ],
    reglas: [
      "Solo se resuelve un retiro «solicitado». Hoy lo garantiza la pantalla, que solo enseña esos (components/admin/campanas-admin.tsx:75); `resolverRetiro` no lo comprueba y sobrescribe el cambio anterior, así que con dos pestañas a la vez gana el último clic.",
      "`resueltoEn` lo pone el servidor con su reloj. Hoy el navegador escribe `HOY_CAMPANAS`, el «hoy» fijo de la demo (hooks/use-campanas.ts:403), mientras que `solicitadoEn` sale del reloj real (components/wallet/withdraw-dialog.tsx:98): un retiro pedido después del 13 de septiembre de 2026 queda resuelto antes de haberse pedido.",
      "«pagado» pasa el importe a `retirado`; «rechazado» lo devuelve a `disponible` (lib/wallet.ts:262). El clipero lo ve en su wallet sin hacer nada más.",
      "En el código, marcar «pagado» solo cambia el estado: no hay integración con PayPal, bancos ni Yape. Si el pago se automatiza, el servidor marca «pagado» cuando la pasarela lo confirme, no antes.",
    ],
    origen: "hooks/use-campanas.ts:394",
  },
]
