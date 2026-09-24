import type { Accion } from "@/lib/wiki/tipos"

/**
 * Acciones de «acceso»: entrar con correo, entrar con Google, Apple o TikTok,
 * crear la cuenta, recuperar la contraseña y cerrar la sesión.
 *
 * Casi todo pasa en /login (`components/auth/login-panel.tsx`), con el modo en
 * la URL (`?modo=registro`, `?modo=recuperar`); cerrar la sesión está en el menú
 * de usuario de la app y en el del backoffice. Hoy no hay sesión de verdad: las
 * cuatro funciones de `lib/auth.ts` simulan al servidor y devuelven lo mismo
 * que devolverá la API (`{ ok: true }` o `{ ok: false, error }`). Lo que pasa
 * después del alta —la bienvenida «Tu primer corte»— es del onboarding.
 */
export const ACCIONES: Accion[] = [
  {
    id: "acceso.iniciar-sesion",
    area: "acceso",
    titulo: "Iniciar sesión con correo y contraseña",
    resumen:
      "Entra en Clipealo con el correo y la contraseña de la cuenta y vuelve a la pantalla que se quería abrir.",
    quien: ["visitante"],
    donde: [
      {
        ruta: "/login",
        etiqueta: "Acceso › pestaña «Iniciar sesión» (la que se abre por defecto)",
      },
      {
        ruta: "/",
        etiqueta:
          "Cabecera de la web › icono de persona «Iniciar sesión» (en el móvil, dentro de «Abrir menú»)",
      },
    ],
    pasos: [
      "En la web, pulsa el icono de persona de la cabecera («Iniciar sesión»); en el móvil está dentro de «Abrir menú». También se puede abrir /login directamente.",
      "La pantalla dice «Bienvenido de nuevo» · «Entra para seguir con tus clips, campañas y wallet.», con la pestaña «Iniciar sesión» elegida.",
      "Escribe tu «Correo» y tu «Contraseña». El ojo del campo («Mostrar la contraseña» / «Ocultar la contraseña») enseña lo escrito sin quitarle el foco al campo.",
      "Deja marcada o desmarca «Mantener la sesión iniciada en este dispositivo» (viene marcada).",
      "Pulsa «Iniciar sesión». Mientras espera, el botón dice «Entrando…» y queda desactivado.",
      "Si todo va bien entras en la ruta que venía en `?next=` o, si no había ninguna válida, en /dashboard.",
    ],
    reglas: [
      "El correo se comprueba en el navegador antes de enviar, sin los espacios de los extremos: vacío da «Escribe tu correo.»; sin @, sin dominio, con espacios o con una extensión de menos de 2 caracteres da «Ese correo no parece válido: revisa que tenga @ y dominio.» (`validarCorreo`, patrón /^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/, lib/auth.ts:56).",
      "De la contraseña solo se comprueba que no esté vacía («Escribe tu contraseña.»): las reglas de fuerza son del alta, no de la entrada.",
      "Los errores salen junto a cada campo y solo después del primer intento; el foco va al primer campo con error.",
      "El correo escrito viaja entre modos: si la persona cambia a «Crear cuenta» o pulsa «¿Olvidaste tu contraseña?», no lo escribe otra vez.",
      "El destino de `?next=` solo admite rutas internas (`destinoSeguro`, lib/auth.ts:176): le quita el prefijo de idioma (/en/campaigns → /campaigns), descarta lo externo (https://…, //…, /\\…), /login y la bienvenida en sus tres idiomas (/bienvenida, /welcome, /boas-vindas). Si no vale, va a /dashboard.",
      "Entrar con correo lleva directo al destino: no mira si la bienvenida quedó a medias (eso solo lo hace «Continuar con…»).",
      "Mientras un «Continuar con…» está en marcha, «Iniciar sesión» queda desactivado.",
      "La casilla «Mantener la sesión iniciada en este dispositivo» hoy solo cambia el aviso de éxito: `iniciarSesion` recibe el correo y la contraseña, y nada más.",
      "En la demo entra cualquier correo válido con cualquier contraseña no vacía, tras 900 ms (lib/auth.ts:116).",
    ],
    errores: [
      {
        codigo: "correoVacio",
        cuando: "El campo «Correo» está vacío o solo tiene espacios.",
        frase: "auth.errors.correoVacio",
        bloquea: true,
      },
      {
        codigo: "correoInvalido",
        cuando:
          "El correo no tiene @, dominio o una extensión de al menos 2 caracteres, o lleva espacios.",
        frase: "auth.errors.correoInvalido",
        bloquea: true,
      },
      {
        codigo: "passwordVacia",
        cuando:
          "El campo «Contraseña» está vacío. Es una comprobación de la pantalla, no del servidor.",
        frase: "auth.errors.passwordVacia",
        bloquea: true,
      },
      {
        codigo: "credenciales",
        cuando:
          "El servidor no acepta el correo o la contraseña. Sale en un aviso («No pudimos iniciar sesión») y en un recuadro rojo encima del formulario, que no dice cuál de los dos falla.",
        frase: "auth.errors.credenciales",
        bloquea: true,
      },
    ],
    endpoints: ["acceso.entrar", "acceso.consultar-sesion"],
    datos:
      "No se guarda nada: `iniciarSesion` (lib/auth.ts:112) simula al servidor y no abre ninguna sesión. La app sigue siendo de la cuenta de la demo (`CUENTA_DEMO`, lib/campanas.ts:739) y de la que hay en el navegador (`clipealo-cuenta-v1`). La frontera que falta es `lib/api/sesion.ts` con `entrar()` y `sesionActual()` (docs/costuras-backend.md:81).",
    respuesta:
      "«Iniciar sesión» es el botón de marca: suena «pop» y se encuadra con la marca de recorte. Con algún campo mal: sonido de error, sacudida del formulario y foco en el primer campo con error. Si el servidor dice que no: toast.error «No pudimos iniciar sesión» con «Correo o contraseña incorrectos.» (suena y el aviso se sacude). Si entra: toast.success «Sesión iniciada» (el «ding»), con «Te recordaremos en este dispositivo.» si la casilla está marcada. Sin celebración.",
    origen: [
      "components/auth/login-panel.tsx:229",
      "components/auth/login-panel.tsx:242",
      "lib/auth.ts:112",
      "lib/auth.ts:176",
      "tests/e2e/login.spec.ts:24",
    ],
    relacionadas: [
      "acceso.continuar-con-proveedor",
      "acceso.recuperar-contrasena",
      "acceso.crear-cuenta",
      "acceso.cerrar-sesion",
    ],
  },
  {
    id: "acceso.continuar-con-proveedor",
    area: "acceso",
    titulo: "Entrar o crear la cuenta con Google, Apple o TikTok",
    resumen:
      "Entra (o se da de alta) con la cuenta de Google, Apple o TikTok, sin escribir correo ni contraseña.",
    quien: ["visitante"],
    donde: [
      {
        ruta: "/login",
        etiqueta:
          "Acceso › «Continuar con Google», «Continuar con Apple» o «Continuar con TikTok», encima de «o con tu correo» (en «Iniciar sesión» y en «Crear cuenta»)",
      },
    ],
    pasos: [
      "En /login, con la pestaña «Iniciar sesión» o «Crear cuenta» (los botones son los mismos en las dos), pulsa «Continuar con Google», «Continuar con Apple» o «Continuar con TikTok».",
      "El botón pulsado cambia el logo por un indicador de carga, y los tres botones de proveedor y el del formulario quedan desactivados hasta que vuelve.",
      "Si la cuenta es nueva, vas a la bienvenida «Tu primer corte» (/bienvenida?origen=oauth), que empieza preguntando «¿Cómo vas a usar Clipealo?» y pide la casilla de 18+ y los términos.",
      "Si ya tenías cuenta y la bienvenida está terminada o pospuesta, entras en la ruta de `?next=` o en /dashboard; si la dejaste sin empezar o a medias, vuelves a /bienvenida (con el `?next=`, si lo había).",
    ],
    reglas: [
      "Los proveedores son tres: Google, Apple y TikTok (`PROVEEDORES`, lib/auth.ts:20). Sus nombres son marcas y no se traducen. Google va a todo el ancho porque es el que más se usa; Apple y TikTok, debajo y a medias.",
      "Mientras un proveedor está en marcha no se puede pulsar otro ni enviar el formulario de correo.",
      "Una cuenta nueva por proveedor se crea con origen «oauth», sin tipo, sin la mayoría de edad y sin consentimientos: el proveedor no dice ni el tipo ni la edad. Por eso la primera toma de la bienvenida sale cuando falta el tipo, la casilla de 18+ o los términos (`necesitaPasoCuenta`, lib/onboarding.ts:416).",
      "Una cuenta que ya existía va a su destino solo si la bienvenida está «completado» o «pospuesto»; en cualquier otro estado vuelve a /bienvenida.",
      "El `?next=` pasa por la misma regla que al entrar con correo (`destinoSeguro`): solo rutas internas, nunca /login ni la bienvenida; por defecto, /dashboard.",
      "En la demo, `continuarCon` tarda 900 ms y siempre vuelve con una cuenta que ya existía (`nueva: false`, lib/auth.ts:150): se sigue con la cuenta que haya en el navegador, que de fábrica es Ana Ruiz con la bienvenida completada (`CUENTA_VACIA`, hooks/use-cuenta.ts:200). Si en este navegador se acaba de crear una cuenta que no ha terminado la bienvenida, «Continuar con…» lleva a /bienvenida.",
    ],
    errores: [
      {
        codigo: "proveedorNoDisponible",
        cuando:
          "El proveedor no es uno de los tres admitidos. Sale en un aviso «No se pudo continuar con {proveedor}» y no se entra.",
        frase: "auth.errors.proveedorNoDisponible",
        bloquea: true,
      },
    ],
    endpoints: [
      "acceso.iniciar-oauth",
      "acceso.completar-oauth",
      "acceso.consultar-sesion",
      "cuenta.leer",
    ],
    datos:
      "Simulado en `continuarCon` (lib/auth.ts:153), que no abre ningún proveedor. Una cuenta nueva se escribiría en el navegador con `registrar` (hooks/use-cuenta.ts, clave `clipealo-cuenta-v1`), y el estado de la bienvenida de una que ya existía se lee de ahí mismo (`leerCuenta`).",
    respuesta:
      "Los botones de proveedor son de contorno: no suenan al pulsarlos. Al volver: toast.success «Sesión iniciada con Google» (o Apple, o TikTok), también con una cuenta nueva. Si falla: toast.error «No se pudo continuar con Google» con «Proveedor no disponible.» (suena y el aviso se sacude).",
    origen: [
      "components/auth/login-panel.tsx:111",
      "components/auth/oauth-buttons.tsx:26",
      "lib/auth.ts:153",
      "lib/onboarding.ts:416",
      "tests/e2e/login.spec.ts:113",
    ],
    relacionadas: ["acceso.iniciar-sesion", "acceso.crear-cuenta"],
  },
  {
    id: "acceso.crear-cuenta",
    area: "acceso",
    titulo: "Crear una cuenta",
    resumen:
      "Da de alta una cuenta nueva con nombre, correo y contraseña, y pasa a la bienvenida «Tu primer corte».",
    quien: ["visitante"],
    plan: {
      nota: "No la limita ningún plan. La pantalla promete el plan Prueba: «60 minutos de video al mes, sin tarjeta» (`MINUTOS_INCLUIDOS.free` = 60, lib/pricing.ts:160). En la demo el alta no toca el plan guardado (`clipealo-plan-v1`): sigue el que hubiera en el navegador, que de fábrica es `PLAN_DEMO` = creator (lib/pricing.ts:124), hasta que se cambie en el menú de usuario.",
    },
    donde: [
      { ruta: "/login?modo=registro", etiqueta: "Acceso › pestaña «Crear cuenta»" },
    ],
    pasos: [
      "En /login pulsa la pestaña «Crear cuenta» (la dirección pasa a /login?modo=registro). Arriba: «Crea tu cuenta» · «Plan Prueba gratis: 60 minutos de video al mes, sin tarjeta.».",
      "Escribe «Nombre o canal», «Correo» y «Contraseña».",
      "Bajo la contraseña, un medidor de cuatro tramos con su palabra («Débil», «Aceptable», «Fuerte», «Muy fuerte») y la lista de reglas: «Al menos 8 caracteres», «Un número», «Mayúsculas y minúsculas» y «Un símbolo (opcional, la hace más fuerte)», cada una marcada cuando se cumple.",
      "Marca «Tengo 18 años o más» («Clipealo es para mayores de edad. Lo confirmamos en tu primer retiro.»).",
      "Marca «Acepto los términos y la política de privacidad». Debajo se lee para qué se usan los datos: el servicio, recomendar campañas y estadísticas en grupos de 50 personas o más, con la oposición en Ajustes › Tus datos.",
      "Pulsa «Crear cuenta gratis». Mientras espera, el botón dice «Creando la cuenta…».",
      "Con la cuenta creada vas a la bienvenida «Tu primer corte» (/bienvenida, con el `?next=` si lo había), que empieza preguntando «¿Cómo vas a usar Clipealo?».",
    ],
    reglas: [
      "«Nombre o canal»: entre 2 y 60 caracteres sin contar los espacios de los extremos (`NOMBRE_MAX` = 60, lib/auth.ts:35).",
      "«Correo»: la misma comprobación que al entrar (`validarCorreo`, lib/auth.ts:53).",
      "«Contraseña»: tres reglas obligatorias: al menos 8 caracteres (`PASSWORD_MIN` = 8, lib/auth.ts:34), un número, y mayúsculas y minúsculas (cuentan á, é, í, ó, ú y ñ). El símbolo es opcional y solo suma fuerza (`validarPasswordNueva`, lib/auth.ts:97). Si faltan, el error las enumera: «A tu contraseña le falta: un número, mayúsculas y minúsculas.».",
      "La fuerza va de 0 a 4: un punto por regla cumplida (el símbolo incluido) y uno más con 14 caracteres o más; con algo escrito, nunca menos de 1 ni más de 4 (`fuerzaPassword`, lib/auth.ts:88). El medidor nunca dice la fuerza solo con el color: siempre lleva la palabra.",
      "La casilla «Tengo 18 años o más» es obligatoria y va separada de los términos, antes que ellos: aceptar los términos no la marca. La edad real se verifica en el primer retiro (lib/auth.ts:46).",
      "Los términos son obligatorios: sin ellos, «Acepta los términos para crear la cuenta.».",
      "Todos los errores se enseñan a la vez tras el primer intento, y el foco va al primero.",
      "Se guardan cuatro consentimientos, cada uno con la clave exacta del texto que se enseñó: `terminos` y `privacidad` (auth.signup.accept), `mayor-edad` (auth.signup.adult.label) y `estadisticas` (auth.signup.privacyNote). Llevan la versión del aviso (`VERSION_AVISO` = privacidad-2026-10-v1, lib/privacidad.ts:31), el idioma, el origen «registro» y la fecha.",
      "El alta no pregunta si viene como clipero o como agencia: la cuenta nace sin tipo y lo pregunta la primera toma de la bienvenida.",
      "La cuenta nace sin verificar, con la bienvenida «sin-empezar», un nombre de canal sacado del nombre o, si no vale, del correo (sin tildes y en minúsculas: «Lucía Peña» → lucia.pena, `canalDesde`, hooks/use-cuenta.ts:293) y el idioma del público igual al de la interfaz.",
      "En la demo `crearCuenta` tarda 1.100 ms y repite las validaciones del nombre, el correo, la contraseña y la casilla de 18+, pero no la de los términos (lib/auth.ts:128); la cuenta nueva sustituye en el navegador a la que hubiera.",
    ],
    estados: [
      {
        estado: "sin-empezar",
        significa: "Recién creada: todavía no ha abierto la bienvenida.",
      },
      {
        estado: "en-curso",
        significa: "Ha empezado «Tu primer corte» y no lo ha terminado.",
      },
      {
        estado: "pospuesto",
        significa:
          "Pulsó «Hacerlo luego» en la bienvenida. Una cuenta completada nunca vuelve aquí.",
      },
      { estado: "completado", significa: "Terminó la bienvenida." },
    ],
    errores: [
      {
        codigo: "nombreCorto",
        cuando:
          "El nombre, sin los espacios de los extremos, tiene menos de 2 caracteres.",
        frase: "auth.errors.nombreCorto",
        bloquea: true,
      },
      {
        codigo: "nombreLargo",
        cuando: "El nombre pasa de 60 caracteres.",
        frase: "auth.errors.nombreLargo",
        bloquea: true,
      },
      {
        codigo: "correoVacio",
        cuando: "El campo «Correo» está vacío.",
        frase: "auth.errors.correoVacio",
        bloquea: true,
      },
      {
        codigo: "correoInvalido",
        cuando:
          "El correo no tiene @, dominio o una extensión de al menos 2 caracteres, o lleva espacios.",
        frase: "auth.errors.correoInvalido",
        bloquea: true,
      },
      {
        codigo: "passwordFalta",
        cuando:
          "A la contraseña le falta alguna de las tres reglas obligatorias (8 caracteres, un número, mayúsculas y minúsculas).",
        frase: "auth.errors.passwordFalta",
        bloquea: true,
      },
      {
        codigo: "mayorDeEdad",
        cuando:
          "No está marcada «Tengo 18 años o más», aunque se hayan aceptado los términos.",
        frase: "auth.errors.mayorDeEdad",
        bloquea: true,
      },
      {
        codigo: "aceptaTerminos",
        cuando: "No está marcada la casilla de los términos y la política de privacidad.",
        frase: "auth.errors.aceptaTerminos",
        bloquea: true,
      },
      {
        codigo: "datosCuenta",
        cuando:
          "El servidor rechaza los datos. Sale en un aviso «No pudimos crear la cuenta» y la persona sigue en el formulario.",
        frase: "auth.errors.datosCuenta",
        bloquea: true,
      },
    ],
    endpoints: ["acceso.registrar"],
    datos:
      "`crearCuenta` (lib/auth.ts:121) simula al servidor. La cuenta se escribe en el navegador (clave `clipealo-cuenta-v1`) con `registrar` de `useCuenta` (hooks/use-cuenta.ts:1109), que sustituye la que hubiera por la que construye `transicionesCuenta.registrar` (hooks/use-cuenta.ts:620): la `Cuenta` entera con sus consentimientos.",
    respuesta:
      "«Crear cuenta gratis» es el botón de marca: «pop» y marca de recorte. Con errores: sonido de error, sacudida del formulario y foco en el primero. Si el servidor lo rechaza: toast.error «No pudimos crear la cuenta» con «Revisa los datos de la cuenta.». Si sale bien no hay aviso ni celebración: la bienvenida la da la primera toma (components/auth/login-panel.tsx:425).",
    origen: [
      "components/auth/login-panel.tsx:391",
      "components/auth/login-panel.tsx:410",
      "lib/auth.ts:97",
      "lib/auth.ts:121",
      "hooks/use-cuenta.ts:620",
      "tests/e2e/login.spec.ts:48",
    ],
    relacionadas: ["acceso.continuar-con-proveedor", "acceso.iniciar-sesion"],
  },
  {
    id: "acceso.recuperar-contrasena",
    area: "acceso",
    titulo: "Pedir un enlace para recuperar la contraseña",
    resumen:
      "Quien no recuerda su contraseña pide un enlace a su correo para elegir una nueva.",
    quien: ["visitante"],
    donde: [
      {
        ruta: "/login?modo=recuperar",
        etiqueta: "Acceso › «¿Olvidaste tu contraseña?», junto al campo «Contraseña»",
      },
    ],
    pasos: [
      "En /login, pestaña «Iniciar sesión», pulsa «¿Olvidaste tu contraseña?», junto a «Contraseña» (la dirección pasa a /login?modo=recuperar).",
      "Arriba: «Recupera tu contraseña» · «Te enviamos un enlace para elegir una nueva.». El campo «Correo de tu cuenta» («El mismo con el que te registraste.») ya trae lo que hubieras escrito al intentar entrar.",
      "Pulsa «Enviar enlace». Mientras espera, el botón dice «Enviando…».",
      "Sale el recuadro «Revisa tu correo»: «Si hay una cuenta con ana@estudio.co, te llega un enlace para elegir una contraseña nueva. Caduca en 30 minutos.».",
      "«Volver a iniciar sesión» devuelve a la pestaña de entrar, con el correo aún escrito.",
    ],
    reglas: [
      "El correo se comprueba igual que al entrar (`validarCorreo`, lib/auth.ts:53); si no vale, suena el error y el mensaje sale junto al campo, sin sacudida.",
      "La respuesta es la misma exista o no la cuenta: por seguridad, la pantalla nunca dice si un correo está registrado (lib/auth.ts:140).",
      "El recuadro promete que el enlace caduca en 30 minutos (`auth.recover.sentText`, messages/es/auth.json:133).",
      "El correo que se enseña es el escrito, sin los espacios de los extremos.",
      "Tras un envío, «Reenviar el enlace» espera 30 segundos (ver «Reenviar el enlace de recuperación»).",
      "En la demo no se manda ningún correo: `enviarEnlaceRecuperacion` tarda 800 ms y solo comprueba el formato (lib/auth.ts:138).",
      "La página a la que llevaría el enlace, donde se elige la contraseña nueva, no existe todavía en el front.",
    ],
    errores: [
      {
        codigo: "correoVacio",
        cuando: "El campo «Correo de tu cuenta» está vacío.",
        frase: "auth.errors.correoVacio",
        bloquea: true,
      },
      {
        codigo: "correoInvalido",
        cuando:
          "El correo no tiene @, dominio o una extensión de al menos 2 caracteres, o lleva espacios.",
        frase: "auth.errors.correoInvalido",
        bloquea: true,
      },
      {
        codigo: "correoNoValido",
        cuando:
          "El servidor no acepta el correo. Sale en un aviso «No pudimos enviar el enlace» y se sigue en el formulario.",
        frase: "auth.errors.correoNoValido",
        bloquea: true,
      },
    ],
    endpoints: ["acceso.pedir-recuperacion"],
    datos:
      "Nada se guarda: `enviarEnlaceRecuperacion` (lib/auth.ts:138) simula al servidor. La pantalla recuerda en memoria a qué correo se mandó y la cuenta atrás del reenvío.",
    respuesta:
      "«Enviar enlace» es el botón de marca: «pop» y marca de recorte. Con el correo mal: sonido de error. Enviado: toast.success «Enlace enviado» con «Revisa también la carpeta de spam.» (el «ding») y el recuadro «Revisa tu correo», que se anuncia a los lectores de pantalla (role=status). Si falla: toast.error «No pudimos enviar el enlace» con la frase del código.",
    origen: [
      "components/auth/login-panel.tsx:639",
      "components/auth/login-panel.tsx:647",
      "lib/auth.ts:138",
      "tests/e2e/login.spec.ts:95",
    ],
    relacionadas: ["acceso.reenviar-enlace", "acceso.iniciar-sesion"],
  },
  {
    id: "acceso.reenviar-enlace",
    area: "acceso",
    titulo: "Reenviar el enlace de recuperación",
    resumen:
      "Si el correo no llega, pide el mismo enlace otra vez cuando han pasado 30 segundos.",
    quien: ["visitante"],
    donde: [
      {
        ruta: "/login?modo=recuperar",
        etiqueta: "Acceso › recuadro «Revisa tu correo» › «Reenviar el enlace»",
      },
    ],
    pasos: [
      "Después de «Enviar enlace», en el recuadro «Revisa tu correo», el botón dice «Reenviar en 30 s» y cuenta hacia atrás, desactivado.",
      "Cuando llega a cero pasa a «Reenviar el enlace»: púlsalo.",
      "El enlace se pide otra vez para el mismo correo y la cuenta atrás vuelve a empezar en 30 s.",
    ],
    reglas: [
      "Entre dos envíos hay 30 segundos de espera (`ESPERA_REENVIO_S` = 30, components/auth/login-panel.tsx:52): evita que se pida diez veces seguidas. El botón está desactivado mientras cuenta y mientras envía.",
      "La espera es solo de la pantalla y vive en memoria: al recargar vuelve el formulario vacío y se puede pedir otro enlace en el acto. El límite de verdad tiene que ponerlo el servidor (ver acceso.pedir-recuperacion).",
      "La respuesta sigue siendo la misma exista o no la cuenta.",
    ],
    errores: [
      {
        codigo: "correoNoValido",
        cuando:
          "El servidor no acepta el correo. Sale en un aviso «No pudimos enviar el enlace».",
        frase: "auth.errors.correoNoValido",
        bloquea: true,
      },
    ],
    endpoints: ["acceso.pedir-recuperacion"],
    datos:
      "La cuenta atrás vive en memoria, en el estado de la pantalla (components/auth/login-panel.tsx:630). El envío es la misma simulación que el primero (`enviarEnlaceRecuperacion`, lib/auth.ts:138).",
    respuesta:
      "Botón de contorno: no suena al pulsarlo. Al reenviar sale el mismo toast.success «Enlace enviado» con «Revisa también la carpeta de spam.»; si falla, toast.error «No pudimos enviar el enlace».",
    origen: [
      "components/auth/login-panel.tsx:52",
      "components/auth/login-panel.tsx:681",
      "tests/e2e/login.spec.ts:106",
    ],
    relacionadas: ["acceso.recuperar-contrasena"],
  },
  {
    id: "acceso.cerrar-sesion",
    area: "acceso",
    titulo: "Cerrar sesión",
    resumen:
      "Sale de la cuenta, en la app o en el backoffice, y vuelve a la pantalla de acceso.",
    quien: ["clipero", "agencia", "admin"],
    donde: [
      {
        ruta: "/dashboard",
        etiqueta:
          "Menú de usuario (tu nombre y tu correo, al pie de la barra lateral) › «Cerrar sesión». Está en todas las pantallas de la app",
      },
      {
        ruta: "/admin",
        etiqueta: "Backoffice › menú «Admin» al pie de la barra lateral › «Salir»",
      },
    ],
    pasos: [
      "En la app, abre el menú de usuario (tu nombre y tu correo, abajo en la barra lateral) y pulsa «Cerrar sesión», la última opción, en rojo.",
      "En el backoffice, el menú «Admin» del pie de la barra lateral tiene «Salir», también la última y en rojo.",
      "Sale el aviso «Sesión cerrada» y vuelves a /login.",
    ],
    reglas: [
      "Hoy no hay sesión que destruir: solo lleva a la pantalla de acceso. El aviso lo dice: «En la demo no hay sesión de verdad todavía: tus datos siguen guardados en este navegador.».",
      "En el backoffice el aviso dice que no hay sesión de operador y que el acceso al panel no está restringido.",
      "Ninguna ruta está protegida todavía (docs/costuras-backend.md:75), así que cerrar sesión no impide volver a la app ni al backoffice.",
      "No borra nada del navegador: eso lo hace «Reiniciar demo», otra opción del menú de usuario de la app (el del backoffice no la tiene).",
    ],
    endpoints: ["acceso.salir"],
    datos:
      "Nada cambia: la cuenta (`clipealo-cuenta-v1`) y el resto de almacenes del navegador siguen como estaban.",
    respuesta:
      "toast() neutro «Sesión cerrada», que no suena: informa, no premia. Lleva la explicación de la demo (app) o del backoffice.",
    origen: [
      "components/app/user-nav-menu.tsx:199",
      "components/admin/admin-user-nav.tsx:138",
      "docs/costuras-backend.md:73",
    ],
    relacionadas: ["acceso.iniciar-sesion", "backoffice.cerrar-sesion"],
  },
]
