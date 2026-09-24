import type { Accion } from "@/lib/wiki/tipos"

/**
 * Acciones de «wallet».
 *
 * El clipero ve lo que ganan sus clips en campañas y lo retira; el equipo
 * paga o rechaza esos retiros desde el backoffice. Todo sale de las campañas
 * (`lib/wallet.ts` sobre `lib/campanas.ts`), así que el saldo cuadra con lo que
 * enseña cada campaña.
 */

const DATOS_WALLET =
  "Almacén del navegador `clipealo-campanas-v1` (hooks/use-campanas.ts): los retiros son las semillas `retirosSemilla` (lib/wallet.ts) más `retiros` y `cambiosRetiro`. El saldo no se guarda: lo calcula `resumenWallet` en el navegador sobre las campañas y los envíos del mismo almacén. No hay frontera en `lib/api/`."

/**
 * El wallet no tiene candado de plan (por eso las acciones no llevan `plan`):
 * lo que lo llena, sí.
 */
const REGLA_PLAN =
  "No lo limita el plan: /wallet no mira ni el plan ni el perfil, y se retira con cualquiera. Lo que llena el wallet sí: entrar en una campaña pide Creador (`PLAN_MINIMO.participarCampanas`, lib/pricing.ts:77), tanto al solicitarlo (lib/participacion.ts:314) como al entregar el clip en una campaña abierta, donde el botón sale apagado (components/campanas/solicitar-dialog.tsx:172)."

export const ACCIONES: Accion[] = [
  {
    id: "wallet.consultar-saldo",
    area: "wallet",
    titulo: "Consultar el saldo del wallet",
    resumen:
      "Saber cuánto se puede retirar ya, cuánto espera revisión, cuánto se ha ganado en total y cuánto se ha retirado.",
    quien: ["clipero"],
    donde: [{ ruta: "/wallet", etiqueta: "Wallet" }],
    pasos: [
      "Abre «Wallet» en la barra lateral (grupo «Ganar») o búscalo en el buscador (Ctrl/⌘ K).",
      "Arriba lee las cuatro cifras: «Disponible para retirar» (la destacada), «Pendiente de revisión», «Ganado en total» y «Retirado».",
      "Debajo de «Disponible para retirar» pone «listo para retirar» o, si hay retiros pedidos sin resolver, su suma: «US$ 50,00 en retiros en curso».",
      "La cabecera recuerda la regla: «Lo que ganan tus clips en campañas. Se cobra cuando el clip se aprueba y se retira desde US$ 10.»",
    ],
    reglas: [
      "«Ganado en total»: lo que cobran los clips aprobados de la cuenta con la regla de reparto de cada campaña (`liquidar`, lib/campanas.ts:308): vistas ÷ 1.000 × CPM, sin pasar del tope por video (presupuesto × `topePorVideoPct` ÷ 100) ni de lo que quede de presupuesto, por orden de llegada; bajo `minimoVistas`, 0 (lib/campanas.ts:283).",
      "Ejemplo de la demo: «El cartón que nadie esperaba» (Serie Bingo Monstruos) tiene 412.400 vistas × US$ 0,40 = US$ 164,96, pero el tope es el 5 % de US$ 1.600 = US$ 80, y cobra US$ 80.",
      "«Pendiente de revisión»: lo que cobrarían los clips «en revisión» con las vistas de hoy y el presupuesto que le queda a su campaña (lib/wallet.ts:210). No se puede retirar hasta que se aprueban. Sin vistas medidas cuenta 0.",
      "«Retirado»: los retiros pagados. «Disponible para retirar» = ganado − retirado − retiros en curso (lib/wallet.ts:262); un retiro rechazado no resta, así que su importe vuelve a estar disponible.",
      "Las cuatro cifras van en US$ con dos decimales. En la demo: disponible US$ 254,78, pendiente US$ 5,38, ganado US$ 314,78 y retirado US$ 60,00.",
      "El wallet es siempre el de la cuenta de la demo, `CUENTA_DEMO` («u_ana», Ana Ruiz): el id no cambia aunque cambie el nombre (hooks/use-campanas.ts:268).",
      "La página sale en la barra lateral para cualquier cuenta de la app (components/app/app-sidebar.tsx:89).",
      REGLA_PLAN,
    ],
    endpoints: ["wallet.resumen"],
    datos: DATOS_WALLET,
    respuesta: "Ninguna: es una consulta y la navegación no suena (AGENTS.md, regla 7).",
    origen: [
      "components/wallet/wallet-dashboard.tsx:65",
      "components/wallet/wallet-dashboard.tsx:92",
      "lib/wallet.ts:178",
      "lib/wallet.ts:262",
      "lib/campanas.ts:308",
    ],
    relacionadas: [
      "wallet.revisar-movimientos",
      "wallet.consultar-ganado-por-mes",
      "wallet.solicitar-retiro",
    ],
  },
  {
    id: "wallet.consultar-ganado-por-mes",
    area: "wallet",
    titulo: "Ver lo ganado por mes",
    resumen:
      "Ver en barras, o en tabla, cuánto cobraron los clips aprobados en cada uno de los seis últimos meses.",
    quien: ["clipero"],
    donde: [{ ruta: "/wallet", etiqueta: "Wallet › Ganado por mes" }],
    pasos: [
      "En /wallet, mira la tarjeta «Ganado por mes».",
      "El subtítulo dice lo del último mes, por ejemplo «US$ 168,18 en septiembre de 2026.».",
      "Pasa por encima de una barra para ver el importe exacto de ese mes.",
      "Abre «Ver los datos como tabla» para leer los mismos seis meses como filas mes → importe.",
    ],
    reglas: [
      "Seis meses que terminan en el de hoy, con los vacíos a US$ 0 (lib/wallet.ts:246). «Hoy» es el de la demo, `HOY_CAMPANAS` (13 de septiembre de 2026).",
      "Solo cuentan los ingresos (clips aprobados que cobran): ni el pendiente de revisión ni los retiros.",
      "Cada ingreso se apunta en el mes de su `enviadoEn`, cuando se envió el clip, no cuando se aprobó.",
      "Si el último mes está a 0, el subtítulo dice «Lo que cobraron tus clips aprobados en los últimos seis meses.».",
      "En la demo: abril, mayo y junio a US$ 0; julio US$ 122,60; agosto US$ 24,00; septiembre US$ 168,18.",
      "La gráfica se carga aparte (`dynamic`, sin render en el servidor) para que recharts no entre en la primera carga; mientras llega hay un hueco del mismo alto y la tabla plegada ya tiene el dato. Las barras no se animan (`isAnimationActive={false}`).",
    ],
    endpoints: ["wallet.resumen"],
    datos: DATOS_WALLET,
    respuesta: "Ninguna: es una consulta, sin sonido ni efecto.",
    origen: [
      "components/wallet/wallet-dashboard.tsx:38",
      "components/wallet/wallet-dashboard.tsx:121",
      "components/wallet/wallet-dashboard.tsx:133",
      "components/wallet/wallet-meses-chart.tsx:27",
      "lib/wallet.ts:246",
    ],
    relacionadas: ["wallet.consultar-saldo"],
  },
  {
    id: "wallet.revisar-movimientos",
    area: "wallet",
    titulo: "Revisar los movimientos del wallet",
    resumen:
      "Ver clip a clip qué ha cobrado, qué está en revisión y cada retiro, e ir a la campaña de la que sale cada clip.",
    quien: ["clipero"],
    donde: [{ ruta: "/wallet", etiqueta: "Wallet › Movimientos" }],
    pasos: [
      "En /wallet, baja a la tarjeta «Movimientos» («Cada clip que cobra, lo que está en revisión y tus retiros.»).",
      "Cada fila tiene «Concepto», «Fecha» (se oculta en móvil), «Estado» e «Importe».",
      "En la fila de un clip (cobrado o en revisión), pulsa el título de la campaña para abrir su ficha en /campanas/[id]; debajo va el título del clip.",
      "Si no hay nada, la tarjeta dice «Tu wallet está vacío» y el botón «Ver campañas» lleva a /campanas.",
    ],
    reglas: [
      "Tres tipos de fila: el cobro de un clip aprobado (+importe, «Cobrado»), un clip en revisión (+importe estimado, en gris, «En revisión») y un retiro (−importe, «Retiro a PayPal» o al método que sea, con su estado).",
      "Ordenadas de la más reciente a la más antigua (lib/wallet.ts:263). La fecha de un clip es su envío; la de un retiro, cuando se pidió. Se pintan en la zona horaria de quien mira.",
      "Un clip aprobado que cobra 0 no sale (lib/wallet.ts:197): en la demo, «El error que arruina tus sentadillas» (Ruta Fit, 24.800 vistas) está aprobado pero llegó cuando el presupuesto de US$ 700 ya estaba repartido.",
      "Un clip en revisión sin vistas medidas sale con +US$ 0,00: se cuenta 0, no se inventa una cifra (en la demo, «La regla de las tres reuniones»).",
      "En un retiro, el detalle es el destino enmascarado («a***@estudio.co», «•••• 4321») o, si fue rechazado con motivo, el motivo; el importe de un rechazado va tachado (components/wallet/wallet-dashboard.tsx:219).",
    ],
    estados: [
      {
        estado: "cobrado",
        significa: "«Cobrado»: clip aprobado; su importe ya es saldo.",
      },
      {
        estado: "en-revision",
        significa:
          "«En revisión»: clip enviado que aún no se ha revisado; su importe es una estimación.",
      },
      {
        estado: "solicitado",
        significa: "«En curso»: retiro pedido que el equipo aún no ha resuelto.",
      },
      { estado: "pagado", significa: "«Pagado»: el equipo lo marcó pagado." },
      { estado: "rechazado", significa: "«Rechazado»: el importe vuelve al disponible." },
    ],
    endpoints: ["wallet.resumen"],
    datos: DATOS_WALLET,
    respuesta:
      "Ninguna: la tabla y el enlace a la campaña son consulta y navegación, sin sonido.",
    origen: [
      "components/wallet/wallet-dashboard.tsx:158",
      "components/wallet/wallet-dashboard.tsx:196",
      "components/wallet/wallet-dashboard.tsx:169",
      "lib/wallet.ts:155",
      "lib/wallet.ts:240",
    ],
    relacionadas: ["wallet.consultar-saldo", "wallet.seguir-retiro"],
  },
  {
    id: "wallet.solicitar-retiro",
    area: "wallet",
    titulo: "Retirar fondos",
    resumen:
      "Pasar saldo disponible del wallet a PayPal, a una cuenta bancaria o a Yape.",
    quien: ["clipero"],
    donde: [{ ruta: "/wallet", etiqueta: "Wallet › Retirar fondos" }],
    pasos: [
      "En /wallet, pulsa «Retirar fondos», en la cabecera de la página. Está desactivado si «Disponible para retirar» no llega a US$ 10.",
      "El diálogo «Retirar fondos» dice cuánto hay: «Tienes US$ 254,78 disponibles. El mínimo por retiro es US$ 10.».",
      "Escribe el «Importe» en US$ (o pulsa «Todo»).",
      "Elige el «Método»: «PayPal» (en 24 h; es el marcado al abrir), «Transferencia bancaria» (en 1 a 3 días hábiles) o «Yape» (al momento). Al cambiar de método se vacía el destino.",
      "Rellena el destino que pide el método: «Correo de PayPal», «CCI o IBAN» o «Celular de Yape». Debajo va la ayuda de cada uno.",
      "Pulsa «Solicitar retiro». Si algo no vale, el error sale debajo de su campo y el diálogo sigue abierto.",
      "El diálogo se cierra y el retiro aparece en «Movimientos» como «Retiro a PayPal» (o al método elegido), «En curso»; el disponible baja al momento.",
    ],
    reglas: [
      "Mínimo por retiro: `RETIRO_MINIMO` = US$ 10 (lib/wallet.ts:49), porque por debajo la comisión de la pasarela se come el retiro. Con menos disponible el botón no se puede pulsar (components/wallet/withdraw-dialog.tsx:77).",
      "El importe tiene que ser un número mayor que 0, de al menos US$ 10 y no más que el disponible; esta última comparación se hace con los dos redondeados a céntimos (`validarRetiro`, lib/wallet.ts:132). Se guarda redondeado a dos decimales (components/wallet/withdraw-dialog.tsx:89).",
      "En español y portugués la primera coma se lee como decimal («50,5»); en inglés las comas separan miles y se quitan (components/wallet/withdraw-dialog.tsx:70). Un importe en español con punto de millares («1.000,50») no se lee como número y da «Escribe cuánto quieres retirar.».",
      "PayPal pide un correo; Yape, un celular de Perú de 9 dígitos que empieza por 9 (los espacios no cuentan); transferencia, un CCI de 20 dígitos o un IBAN (los espacios y guiones no cuentan) (`validarDestino`, lib/wallet.ts:117). El destino se guarda sin espacios al principio ni al final.",
      "Solo se retira lo ganado en clips aprobados; lo pendiente de revisión no.",
      "Al pedirlo, el importe deja de contar como disponible y pasa a «en retiros en curso»: no se puede pedir dos veces el mismo dinero. Queda «En curso» hasta que el equipo lo resuelve en /admin/campanas.",
      "Hoy el diálogo ofrece los tres métodos de `METODOS_RETIRO` a todas las cuentas (components/wallet/withdraw-dialog.tsx:179). El reparto por país, `METODOS_POR_PAIS` (Yape solo en Perú; Brasil sin Pix de momento), solo lo usa el onboarding para contar cómo se cobra: al retirar no se aplica.",
      "Los plazos («en 24 h», «en 1 a 3 días hábiles», «al momento») son los textos de `campaigns.withdrawal.method.<id>.eta`: el código no los mide.",
      "Al cerrar el diálogo, con o sin retiro, se vacían el importe y el destino y se olvidan los errores; el método elegido se queda.",
      REGLA_PLAN,
    ],
    estados: [
      {
        estado: "solicitado",
        significa: "«En curso»: pedido; ya no cuenta como disponible.",
      },
      { estado: "pagado", significa: "«Pagado»: el equipo lo pagó; suma a «Retirado»." },
      {
        estado: "rechazado",
        significa: "«Rechazado»: el importe vuelve a «Disponible para retirar».",
      },
    ],
    errores: [
      {
        codigo: "amountRequired",
        cuando: "El importe está vacío, no es un número o es 0 o negativo.",
        frase: "campaigns.withdraw.errors.amountRequired",
        bloquea: true,
      },
      {
        codigo: "belowMinimum",
        cuando: "El importe es menor de US$ 10 («El mínimo es US$ 10.»).",
        frase: "campaigns.withdraw.errors.belowMinimum",
        bloquea: true,
      },
      {
        codigo: "aboveAvailable",
        cuando: "El importe supera el disponible.",
        frase: "campaigns.withdraw.errors.aboveAvailable",
        bloquea: true,
      },
      {
        codigo: "invalidEmail",
        cuando: "Con PayPal, el destino no es un correo.",
        frase: "campaigns.withdraw.errors.invalidEmail",
        bloquea: true,
      },
      {
        codigo: "invalidPhone",
        cuando: "Con Yape, el destino no son 9 dígitos que empiezan por 9.",
        frase: "campaigns.withdraw.errors.invalidPhone",
        bloquea: true,
      },
      {
        codigo: "invalidAccount",
        cuando: "Con transferencia, el destino no es un CCI de 20 dígitos ni un IBAN.",
        frase: "campaigns.withdraw.errors.invalidAccount",
        bloquea: true,
      },
    ],
    endpoints: ["wallet.solicitar-retiro", "wallet.resumen"],
    datos: DATOS_WALLET,
    respuesta:
      "«Retirar fondos» es el botón `brand` de la vista: suena «pop» y se encuadra con la marca de recorte. Elegir otro método hace «tap», como cualquier opción de un grupo. Al pedir, `toast.success` «Retiro solicitado» con «US$ 50,00 a PayPal, en 24 h.» y el sonido «success». Los errores de validación no suenan ni sacan aviso: se pintan debajo de su campo, y solo después del primer intento.",
    origen: [
      "components/wallet/withdraw-dialog.tsx:120",
      "components/wallet/withdraw-dialog.tsx:90",
      "components/wallet/withdraw-dialog.tsx:100",
      "lib/wallet.ts:49",
      "lib/wallet.ts:117",
      "lib/wallet.ts:132",
      "hooks/use-campanas.ts:392",
    ],
    relacionadas: [
      "wallet.retirar-todo",
      "wallet.seguir-retiro",
      "wallet.marcar-retiro-pagado",
    ],
  },
  {
    id: "wallet.retirar-todo",
    area: "wallet",
    titulo: "Retirar todo el disponible",
    resumen: "Vaciar el wallet de un clic, sin teclear la cifra exacta.",
    quien: ["clipero"],
    donde: [{ ruta: "/wallet", etiqueta: "Wallet › Retirar fondos › Todo" }],
    pasos: [
      "En /wallet, pulsa «Retirar fondos».",
      "Al final del campo «Importe», pulsa «Todo»: el campo se rellena con el disponible exacto («254,78» en español y portugués, «254.78» en inglés).",
      "Elige el «Método» y rellena su destino.",
      "Pulsa «Solicitar retiro».",
    ],
    reglas: [
      "«Todo» escribe el disponible con dos decimales (components/wallet/withdraw-dialog.tsx:155). El disponible ya descuenta los retiros en curso.",
      "El diálogo solo se abre con US$ 10 o más disponibles, así que «Todo» parte de una cifra que llega al mínimo.",
      "Después pasa por las mismas validaciones y el mismo alta que «Retirar fondos».",
      "No lo limita el plan, igual que «Retirar fondos».",
    ],
    errores: [
      {
        codigo: "invalidEmail",
        cuando: "Con PayPal, el destino no es un correo.",
        frase: "campaigns.withdraw.errors.invalidEmail",
        bloquea: true,
      },
      {
        codigo: "invalidPhone",
        cuando: "Con Yape, el destino no son 9 dígitos que empiezan por 9.",
        frase: "campaigns.withdraw.errors.invalidPhone",
        bloquea: true,
      },
      {
        codigo: "invalidAccount",
        cuando: "Con transferencia, el destino no es un CCI de 20 dígitos ni un IBAN.",
        frase: "campaigns.withdraw.errors.invalidAccount",
        bloquea: true,
      },
    ],
    endpoints: ["wallet.solicitar-retiro"],
    datos: DATOS_WALLET,
    respuesta:
      "«Todo» no suena: solo rellena el campo. Al pedir, el mismo `toast.success` «Retiro solicitado» con el sonido «success».",
    origen: [
      "components/wallet/withdraw-dialog.tsx:155",
      "components/wallet/withdraw-dialog.tsx:162",
    ],
    relacionadas: ["wallet.solicitar-retiro"],
  },
  {
    id: "wallet.seguir-retiro",
    area: "wallet",
    titulo: "Seguir un retiro",
    resumen:
      "Saber si un retiro pedido sigue en curso, ya se pagó o se rechazó y por qué.",
    quien: ["clipero"],
    donde: [{ ruta: "/wallet", etiqueta: "Wallet › Movimientos" }],
    pasos: [
      "En /wallet, mira debajo de «Disponible para retirar»: mientras haya retiros sin resolver dice su suma, por ejemplo «US$ 50,00 en retiros en curso».",
      "En «Movimientos», busca la fila «Retiro a PayPal» (o al método que eligiera) con el destino enmascarado debajo.",
      "Lee su «Estado»: «En curso», «Pagado» o «Rechazado».",
      "Si es «Rechazado», debajo va el motivo del equipo, que hoy es siempre «Los datos de cobro no son válidos.», y el importe sale tachado.",
    ],
    reglas: [
      "Cuando el equipo lo paga, el importe pasa de «en retiros en curso» a «Retirado»; cuando lo rechaza, vuelve a «Disponible para retirar» y se puede pedir otra vez.",
      "Lo que el equipo decide en /admin aparece en /wallet sin recargar: el almacén se sincroniza entre pestañas con el evento `storage` (hooks/use-campanas.ts:248).",
      "No hay aviso aparte (ni correo ni notificación en la app) cuando se resuelve un retiro: el estado solo se ve aquí.",
    ],
    estados: [
      { estado: "solicitado", significa: "«En curso»: esperando al equipo." },
      { estado: "pagado", significa: "«Pagado»: cerrado; suma a «Retirado»." },
      {
        estado: "rechazado",
        significa:
          "«Rechazado»: cerrado; el importe vuelve al disponible y el motivo sale en el detalle.",
      },
    ],
    endpoints: ["wallet.resumen"],
    datos: DATOS_WALLET,
    respuesta: "Ninguna: es una consulta, sin sonido ni efecto.",
    origen: [
      "components/wallet/wallet-dashboard.tsx:96",
      "components/wallet/wallet-dashboard.tsx:190",
      "lib/wallet.ts:226",
      "lib/wallet.ts:240",
    ],
    relacionadas: [
      "wallet.solicitar-retiro",
      "wallet.marcar-retiro-pagado",
      "wallet.rechazar-retiro",
    ],
  },
  {
    id: "wallet.revisar-retiros-por-pagar",
    area: "wallet",
    titulo: "Revisar los retiros por pagar",
    resumen: "Ver qué cliperos esperan cobrar, cuánto, por qué método y desde cuándo.",
    quien: ["admin"],
    donde: [
      {
        ruta: "/admin/campanas",
        etiqueta: "Backoffice › Creadores › Campañas › Retiros por pagar",
      },
    ],
    pasos: [
      "En el backoffice, abre «Campañas» (grupo «Creadores»).",
      "La primera tarjeta, «Pendiente del equipo», cuenta los retiros por pagar más la solicitud de agencia pendiente, con la línea «2 retiros por pagar · US$ 183,50».",
      "En «Retiros por pagar» («Lo que los creadores piden sacar de su wallet.») cada fila lleva «Creador», «Método» (con el destino enmascarado debajo), «Importe» y «Pedido» (la fecha; se oculta en pantallas estrechas).",
      "Si no hay ninguno, la sección dice «No hay retiros por pagar.».",
    ],
    reglas: [
      "Solo salen los retiros en «solicitado» (components/admin/campanas-admin.tsx:75), en el orden del almacén, sin ordenar por fecha; los pagados y rechazados no se listan en ninguna parte del backoffice.",
      "El destino se enseña siempre enmascarado («•••• 4321», «m***@gmail.com»), aunque el `Retiro` lo lleva entero (components/admin/campanas-admin.tsx:184). Ninguna pantalla enseña el correo o la cuenta completos.",
      "La tarjeta se pone en tono de aviso en cuanto hay algo pendiente, y su nota recuerda el plazo del equipo: «Las solicitudes de agencia se revisan en 24–48 h; los retiros, en el día.».",
      "La barra del backoffice no lleva contador de retiros (a diferencia de «Disputas»): la cola solo se ve entrando en «Campañas» (components/admin/admin-sidebar.tsx:125).",
      "En la demo esperan Valeria Q. (US$ 145,50 por Yape, pedido el 12 de septiembre a las 22:10 UTC) y Mateo F. (US$ 38,00 por PayPal, el 13 a las 08:40 UTC). La fecha se pinta en la zona horaria de quien mira.",
    ],
    endpoints: ["wallet.listar-retiros"],
    datos: DATOS_WALLET + " El backoffice lee el mismo almacén que la app.",
    respuesta: "Ninguna: es una consulta, sin sonido.",
    origen: [
      "components/admin/campanas-admin.tsx:75",
      "components/admin/campanas-admin.tsx:101",
      "components/admin/campanas-admin.tsx:151",
      "lib/wallet.ts:68",
    ],
    relacionadas: ["wallet.marcar-retiro-pagado", "wallet.rechazar-retiro"],
  },
  {
    id: "wallet.marcar-retiro-pagado",
    area: "wallet",
    titulo: "Marcar un retiro como pagado",
    resumen: "Dejar constancia de que el equipo ya pagó a un clipero lo que pidió.",
    quien: ["admin"],
    donde: [
      { ruta: "/admin/campanas", etiqueta: "Backoffice › Campañas › Retiros por pagar" },
    ],
    pasos: [
      "En «Retiros por pagar», localiza la fila del clipero.",
      "Haz el pago fuera de Clipealo, por el método que eligió: el código no conecta con PayPal, bancos ni Yape.",
      "Pulsa «Marcar pagado».",
      "La fila desaparece de la cola y sale el aviso «Retiro pagado».",
    ],
    reglas: [
      "Un solo clic, sin confirmación: el retiro pasa a «pagado» y se apunta `resueltoEn` (hooks/use-campanas.ts:394). Esa fecha es `HOY_CAMPANAS`, el «hoy» fijo de la demo, no el reloj (hooks/use-campanas.ts:403).",
      "En el wallet del clipero el importe pasa de «en retiros en curso» a «Retirado» y la fila de «Movimientos» dice «Pagado».",
      "Marcar pagado no mueve dinero: solo registra un pago hecho aparte. Y la pantalla solo enseña el destino enmascarado, así que el correo o la cuenta completos a los que pagar no se ven en el backoffice.",
      "`resolverRetiro` no comprueba el estado anterior: si dos pestañas del equipo lo resuelven a la vez, gana el último clic.",
    ],
    estados: [
      {
        estado: "pagado",
        significa: "Cerrado: sale de la cola y suma a lo retirado del clipero.",
      },
    ],
    endpoints: ["wallet.resolver-retiro"],
    datos: DATOS_WALLET,
    respuesta:
      "`toast.success` «Retiro pagado» con «US$ 145,50 a Valeria Q. por Yape.» y el sonido «success». El botón es `outline`: no suena al pulsarlo.",
    origen: [
      "components/admin/campanas-admin.tsx:198",
      "components/admin/campanas-admin.tsx:199",
      "hooks/use-campanas.ts:403",
    ],
    relacionadas: [
      "wallet.revisar-retiros-por-pagar",
      "wallet.rechazar-retiro",
      "wallet.seguir-retiro",
    ],
  },
  {
    id: "wallet.rechazar-retiro",
    area: "wallet",
    titulo: "Rechazar un retiro",
    resumen: "Devolver al wallet del clipero un retiro que no se puede pagar.",
    quien: ["admin"],
    donde: [
      { ruta: "/admin/campanas", etiqueta: "Backoffice › Campañas › Retiros por pagar" },
    ],
    pasos: [
      "En «Retiros por pagar», localiza la fila del clipero.",
      "Pulsa la ✕ al final de la fila («Rechazar el retiro de Valeria Q.» para los lectores de pantalla).",
      "La fila desaparece de la cola y sale el aviso «Retiro rechazado».",
    ],
    reglas: [
      "Un solo clic, sin confirmación ni elección de motivo: se guarda siempre «Los datos de cobro no son válidos.» (`admin.campanas.withdrawals.rejectReason`), escrito en el idioma de quien rechaza (components/admin/campanas-admin.tsx:215).",
      "El clipero ve ese motivo en su fila de «Movimientos», con el importe tachado, y el importe vuelve a «Disponible para retirar»: puede pedirlo otra vez con otros datos.",
      "Como al pagar, `resueltoEn` es `HOY_CAMPANAS` y no se comprueba el estado anterior: si dos pestañas lo resuelven a la vez, gana el último clic.",
    ],
    estados: [
      {
        estado: "rechazado",
        significa:
          "Cerrado: sale de la cola y el importe vuelve al disponible del clipero.",
      },
    ],
    endpoints: ["wallet.resolver-retiro"],
    datos: DATOS_WALLET,
    respuesta:
      "`toast` neutro «Retiro rechazado» con «Valeria Q.: el importe vuelve a su wallet.» y el sonido «remove».",
    origen: [
      "components/admin/campanas-admin.tsx:213",
      "components/admin/campanas-admin.tsx:216",
      "components/admin/campanas-admin.tsx:225",
    ],
    relacionadas: [
      "wallet.revisar-retiros-por-pagar",
      "wallet.marcar-retiro-pagado",
      "wallet.seguir-retiro",
    ],
  },
]
