import type { Campo, Endpoint } from "@/lib/wiki/tipos"

/**
 * Endpoints de «acceso»: la sesión, el alta, la recuperación de la contraseña
 * y el OAuth de Google, Apple y TikTok.
 *
 * Ninguno existe todavía: no hay frontera en `lib/api/` para la sesión. Las
 * cuatro funciones de `lib/auth.ts` (`iniciarSesion`, `crearCuenta`,
 * `enviarEnlaceRecuperacion`, `continuarCon`) simulan al servidor y ya
 * devuelven lo que devolverá la API: `{ ok: true }` o `{ ok: false, error }`,
 * con el error como código (`ErrorAcceso`, lib/auth.ts:105). La frontera que
 * falta es `lib/api/sesion.ts` con `sesionActual()`, `entrar()` y `salir()`
 * (docs/costuras-backend.md:81).
 *
 * Ojo al conectarlos con `pedir()`: convierte cualquier 401 en `no-autorizado`,
 * 404 en `no-encontrado`, 422 en `conflicto` y 429 en `limite`
 * (lib/api/errores.ts:29), y el cuerpo del error solo va al registro
 * (lib/api/cliente.ts:70). La pantalla de acceso traduce los códigos de
 * `ErrorAcceso` (`auth.errors.<codigo>`), así que la frontera tendrá que leer el
 * `{ ok: false, error }` y devolverlo tal cual.
 */

/** Los proveedores que se admiten, como van en la ruta. */
const PARAM_PROVEEDOR: Campo = {
  nombre: "proveedor",
  tipo: '"google" | "apple" | "tiktok"',
  requerido: true,
  en: "ruta",
  descripcion:
    "`Proveedor` (lib/auth.ts:21). Solo esos tres (`PROVEEDORES`, lib/auth.ts:20); los nombres que ve la persona salen de `PROVEEDOR_LABEL` y no se traducen.",
}

/** `Resultado` de lib/auth.ts: lo que ya espera la pantalla. */
const RESPUESTA_RESULTADO = {
  tipo: "Resultado",
  definidoEn: "lib/auth.ts:108",
  campos: [
    {
      nombre: "ok",
      tipo: "boolean",
      requerido: true,
      descripcion: "`true` si salió bien.",
    },
    {
      nombre: "error",
      tipo: '"credenciales" | "datosCuenta" | "correoNoValido" | "proveedorNoDisponible"',
      requerido: false,
      descripcion:
        "Solo con `ok: false`. Es un código de `ErrorAcceso` (lib/auth.ts:105), nunca una frase: la pantalla lo pinta con `auth.errors.<codigo>`.",
    },
  ],
  ejemplo: { ok: true },
} satisfies Endpoint["respuesta"]

const CREADA = "2026-09-13T12:20:00.000Z"

export const ENDPOINTS: Endpoint[] = [
  {
    id: "acceso.entrar",
    area: "acceso",
    metodo: "POST",
    ruta: "/sesion",
    resumen: "Abre una sesión con correo y contraseña.",
    descripcion:
      "Sustituye a `iniciarSesion` (lib/auth.ts:112), que hoy espera 900 ms y deja entrar con cualquier correo válido y cualquier contraseña no vacía. Tiene que responder con la forma de `Resultado` para que la pantalla no cambie. La casilla «Mantener la sesión iniciada en este dispositivo» no viaja: `iniciarSesion` solo recibe el correo y la contraseña, así que hoy la duración de la sesión no puede depender de ella.",
    estado: "por-construir",
    auth: "publico",
    cuerpo: {
      tipo: "{ correo: string; password: string }",
      definidoEn: "lib/auth.ts:112",
      campos: [
        {
          nombre: "correo",
          tipo: "string",
          requerido: true,
          descripcion:
            "Tal como se escribió. La pantalla ya lo ha comprobado con `validarCorreo` (lib/auth.ts:53).",
        },
        {
          nombre: "password",
          tipo: "string",
          requerido: true,
          descripcion:
            "La contraseña, sin tocar. La pantalla solo comprueba que no esté vacía.",
        },
      ],
      ejemplo: { correo: "ana@estudio.co", password: "Secreta2026" },
    },
    respuesta: RESPUESTA_RESULTADO,
    errores: [
      {
        codigo: "credenciales",
        http: 401,
        cuando:
          'El correo no tiene cuenta o la contraseña no coincide. El cuerpo es `{ ok: false, error: "credenciales" }`.',
        frase: "auth.errors.credenciales",
        bloquea: true,
      },
    ],
    reglas: [
      "Volver a validar el correo con la misma regla que el front, tras quitar los espacios de los extremos: /^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/ (lib/auth.ts:56). Un correo mal formado o una contraseña vacía es `credenciales`, como en la simulación (lib/auth.ts:117).",
      "No decir cuál de los dos falla: la frase («Correo o contraseña incorrectos.») no lo distingue y la respuesta tampoco debe.",
      "Abrir la sesión que luego devuelve GET /sesion. Hoy nadie la lee: el `userId` de toda la app es el de `CUENTA_DEMO` (lib/campanas.ts:739), entre quien entre.",
    ],
    origen: "lib/auth.ts:112",
  },
  {
    id: "acceso.consultar-sesion",
    area: "acceso",
    metodo: "GET",
    ruta: "/sesion",
    resumen: "Dice quién tiene la sesión abierta.",
    descripcion:
      "Es el `sesionActual()` que pide docs/costuras-backend.md:81. Sustituye a `CUENTA_DEMO` (lib/campanas.ts:739), la cuenta fija con la que hoy se navega la app: su `userId` firma los envíos, los retiros, los comentarios al equipo y las campañas creadas, y sigue siendo u_ana aunque alguien se registre con otro nombre (hooks/use-campanas.ts:268). Está en un solo sitio a propósito para que cambiarla salga barato. El tipo del front solo lleva `userId` y `nombre`: el plan y el perfil (usuario o agencia) viven hoy en el navegador (`hooks/use-plan.ts` dice «En producción esto lo diría la sesión»), y el menú de usuario enseña «Backoffice» a todo el mundo cuando en producción debería decidirlo el rol de la sesión (components/app/user-nav-menu.tsx:165).",
    estado: "por-construir",
    auth: "sesion",
    respuesta: {
      tipo: "typeof CUENTA_DEMO",
      definidoEn: "lib/campanas.ts:739",
      campos: [
        {
          nombre: "userId",
          tipo: "string",
          requerido: true,
          descripcion:
            "El id de la cuenta. Es el que firma envíos, retiros, comentarios y campañas creadas (`creadaPor.userId`).",
        },
        {
          nombre: "nombre",
          tipo: "string",
          requerido: true,
          descripcion: "El nombre o canal con el que se dio de alta. No se traduce.",
        },
      ],
      ejemplo: { userId: "u_ana", nombre: "Ana Ruiz" },
    },
    errores: [
      {
        codigo: "no-autorizado",
        http: 401,
        cuando: "No hay sesión, o ha caducado. El código ya está traducido y esperando.",
        frase: "common.errors.no-autorizado",
        bloquea: true,
      },
    ],
    reglas: [
      "La identidad sale siempre de la sesión, nunca de un cuerpo ni de un parámetro que mande el front.",
      "Hoy ninguna ruta está protegida y /admin se abre sin más (docs/costuras-backend.md:75). Con esta sesión, el middleware tiene que proteger app/[locale]/(app) y app/[locale]/(admin) (docs/costuras-backend.md:84), y el backoffice solo se abre a operadores.",
    ],
    origen: "lib/campanas.ts:739",
  },
  {
    id: "acceso.salir",
    area: "acceso",
    metodo: "DELETE",
    ruta: "/sesion",
    resumen: "Cierra la sesión abierta.",
    descripcion:
      "Es el `salir()` de docs/costuras-backend.md:81. Hoy «Cerrar sesión» (app) y «Salir» (backoffice) solo llevan a /login y avisan de que la sesión aún no es de verdad: no hay nada que cerrar.",
    estado: "por-construir",
    auth: "sesion",
    respuesta: {
      tipo: "void",
      campos: [],
      ejemplo: null,
    },
    errores: [
      {
        codigo: "no-autorizado",
        http: 401,
        cuando: "No había sesión abierta.",
        frase: "common.errors.no-autorizado",
        bloquea: false,
      },
    ],
    reglas: [
      "Invalidar la sesión en el servidor: después, GET /sesion tiene que responder 401.",
      "Responder 204 sin cuerpo: `pedir()` devuelve `undefined` en un 204 (lib/api/cliente.ts:75).",
    ],
    origen: "components/app/user-nav-menu.tsx:199",
  },
  {
    id: "acceso.registrar",
    area: "acceso",
    metodo: "POST",
    ruta: "/cuentas",
    resumen: "Crea una cuenta nueva con sus consentimientos y abre su sesión.",
    descripcion:
      "Junta lo que hoy hacen dos piezas: `crearCuenta` (lib/auth.ts:121), que simula la validación en 1.100 ms, y la transición `registrar` de hooks/use-cuenta.ts:620, que construye la `Cuenta` entera en el navegador. El servidor recibe los datos del alta con los consentimientos que se enseñaron y devuelve la cuenta ya construida. Tras el alta la persona va directa a /bienvenida sin volver a entrar, así que la sesión tiene que quedar abierta. El front no tiene un código para «ese correo ya tiene cuenta»: con los códigos de hoy, ese caso solo puede responderse como `datosCuenta`.",
    estado: "por-construir",
    auth: "publico",
    cuerpo: {
      tipo: "DatosRegistro & { password: string; locale: Locale }",
      definidoEn: "hooks/use-cuenta.ts:542",
      campos: [
        {
          nombre: "nombre",
          tipo: "string",
          requerido: true,
          descripcion:
            "«Nombre o canal». Entre 2 y 60 caracteres sin los espacios de los extremos.",
        },
        {
          nombre: "correo",
          tipo: "string",
          requerido: true,
          descripcion: "Se guarda sin los espacios de los extremos.",
        },
        {
          nombre: "password",
          tipo: "string",
          requerido: true,
          descripcion:
            "Al menos 8 caracteres, un número, y mayúsculas y minúsculas (lib/auth.ts:97). El símbolo es opcional.",
        },
        {
          nombre: "tipo",
          tipo: '"clipero" | "agencia" | null',
          requerido: true,
          descripcion:
            "Desde el formulario siempre `null`: el tipo lo pregunta la primera toma de la bienvenida.",
        },
        {
          nombre: "mayorDeEdad",
          tipo: "boolean",
          requerido: true,
          descripcion: "La casilla «Tengo 18 años o más». Tiene que ser `true`.",
        },
        {
          nombre: "origen",
          tipo: '"registro" | "oauth"',
          requerido: false,
          descripcion: "Por defecto, «registro». Va a cada consentimiento.",
        },
        {
          nombre: "consentimientos",
          tipo: "{ finalidad: Finalidad; valor: boolean; textoId: string }[]",
          requerido: false,
          descripcion:
            "Lo que aceptó, con la clave exacta del texto que se le enseñó (components/auth/login-panel.tsx:418).",
        },
        {
          nombre: "locale",
          tipo: '"es" | "en" | "pt"',
          requerido: true,
          descripcion:
            "El idioma de la interfaz: va en cada consentimiento y, si es un idioma de audiencia, es el idioma del público.",
        },
      ],
      ejemplo: {
        nombre: "Lucía Peña",
        correo: "lucia@correo.pe",
        password: "Clipealo2026",
        tipo: null,
        mayorDeEdad: true,
        origen: "registro",
        consentimientos: [
          { finalidad: "terminos", valor: true, textoId: "auth.signup.accept" },
          { finalidad: "privacidad", valor: true, textoId: "auth.signup.accept" },
          { finalidad: "mayor-edad", valor: true, textoId: "auth.signup.adult.label" },
          { finalidad: "estadisticas", valor: true, textoId: "auth.signup.privacyNote" },
        ],
        locale: "es",
      },
    },
    respuesta: {
      tipo: "Cuenta",
      definidoEn: "lib/onboarding.ts:296",
      campos: [
        {
          nombre: "nombre",
          tipo: "string",
          requerido: true,
          descripcion: "El del alta, sin espacios en los extremos.",
        },
        {
          nombre: "correo",
          tipo: "string",
          requerido: true,
          descripcion: "El del alta, sin espacios en los extremos.",
        },
        {
          nombre: "tipo",
          tipo: '"clipero" | "agencia" | null',
          requerido: true,
          descripcion: "`null` hasta que lo conteste la bienvenida.",
        },
        {
          nombre: "creadaEn",
          tipo: "string",
          requerido: true,
          descripcion: "Instante ISO del alta.",
        },
        {
          nombre: "verificado",
          tipo: "boolean",
          requerido: true,
          descripcion:
            "Siempre `false` al nacer: la edad real se verifica en el primer retiro.",
        },
        {
          nombre: "perfilCanal",
          tipo: "PerfilCanal",
          requerido: true,
          descripcion:
            "Con el canal sacado del nombre o, si no vale, del correo (`canalDesde`, hooks/use-cuenta.ts:293); país y zona, los de por defecto.",
        },
        {
          nombre: "onboarding",
          tipo: "ProgresoOnboarding",
          requerido: true,
          descripcion: "`PROGRESO_VACIO` (lib/onboarding.ts:267): estado «sin-empezar».",
        },
        {
          nombre: "consentimientos",
          tipo: "RegistroConsentimiento[]",
          requerido: true,
          descripcion:
            "Uno por consentimiento del cuerpo, con versión, idioma, origen y fecha (lib/privacidad.ts:43).",
        },
      ],
      ejemplo: {
        nombre: "Lucía Peña",
        correo: "lucia@correo.pe",
        tipo: null,
        creadaEn: CREADA,
        mayorDeEdad: true,
        verificado: false,
        pais: null,
        idiomas: [],
        perfilCanal: {
          canal: "lucia.pena",
          avatarUrl: null,
          plataformas: [],
          pais: "PE",
          zona: "America/Lima",
        },
        publico: {
          temas: [],
          edades: [],
          idioma: "es",
          tono: "cercano",
          ocultarPalabrotas: false,
        },
        clipero: {},
        creador: {},
        agencia: {},
        meta: { mayorDeEdad: { fuente: "declarado", en: CREADA } },
        onboarding: {
          version: 1,
          taxonomia: 1,
          flujo: null,
          modo: "normal",
          estado: "sin-empezar",
          pasoActual: null,
          pasosVistos: [],
          pasosRespondidos: [],
          pasosSaltados: [],
          msPorPaso: {},
          textoAcelerado: 0,
          animacionVista: false,
          iniciadoEn: null,
          completadoEn: null,
          pospuestoEn: null,
          pasoAbandono: null,
          celebrado: false,
          celebradoAprobacion: false,
        },
        consentimientos: [
          {
            finalidad: "terminos",
            valor: true,
            version: "privacidad-2026-10-v1",
            locale: "es",
            origen: "registro",
            textoId: "auth.signup.accept",
            en: CREADA,
          },
          {
            finalidad: "privacidad",
            valor: true,
            version: "privacidad-2026-10-v1",
            locale: "es",
            origen: "registro",
            textoId: "auth.signup.accept",
            en: CREADA,
          },
          {
            finalidad: "mayor-edad",
            valor: true,
            version: "privacidad-2026-10-v1",
            locale: "es",
            origen: "registro",
            textoId: "auth.signup.adult.label",
            en: CREADA,
          },
          {
            finalidad: "estadisticas",
            valor: true,
            version: "privacidad-2026-10-v1",
            locale: "es",
            origen: "registro",
            textoId: "auth.signup.privacyNote",
            en: CREADA,
          },
        ],
        microPreguntas: { ultimaEn: null, pospuestas: {}, descartadas: [] },
        respuestasLibres: {},
        borradorCampana: null,
      },
    },
    errores: [
      {
        codigo: "datosCuenta",
        http: 422,
        cuando:
          'Algún dato no pasa las validaciones del formulario: nombre, correo, contraseña o la casilla de 18+ (lib/auth.ts:128). El cuerpo es `{ ok: false, error: "datosCuenta" }`.',
        frase: "auth.errors.datosCuenta",
        bloquea: true,
      },
    ],
    reglas: [
      "Repetir todas las validaciones del front: nombre entre 2 y 60 caracteres (`NOMBRE_MAX`, lib/auth.ts:35); correo con /^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/; contraseña con al menos 8 caracteres (`PASSWORD_MIN`, lib/auth.ts:34), un número, y mayúsculas y minúsculas, contando á, é, í, ó, ú y ñ (lib/auth.ts:72).",
      "Rechazar el alta sin `mayorDeEdad: true`, aunque los términos vengan aceptados: son casillas separadas y la de 18+ no se puede aceptar de paso (lib/auth.ts:49).",
      "Rechazar el alta si `consentimientos` no trae `terminos` y `privacidad` con `valor: true`: la pantalla no deja enviar sin la casilla («Acepta los términos para crear la cuenta.», components/auth/login-panel.tsx:385), pero `crearCuenta` no lo comprueba (lib/auth.ts:128).",
      "Guardar cada consentimiento como una entrada nueva, con la versión del aviso vigente (`VERSION_AVISO` = privacidad-2026-10-v1, lib/privacidad.ts:31), el `locale`, el `origen`, el `textoId` y la fecha del servidor. El registro solo crece: nunca se sobrescribe una entrada (lib/privacidad.ts:104).",
      "Crear la cuenta como `transicionesCuenta.registrar` (hooks/use-cuenta.ts:620): sin verificar, sin país ni idiomas, con la bienvenida en `PROGRESO_VACIO` y el flujo igual al tipo; el idioma del público es el `locale` si es un idioma de audiencia.",
      "La cuenta nace en el plan Prueba (free): la pantalla de alta promete «60 minutos de video al mes, sin tarjeta» (messages/es/auth.json:44; `MINUTOS_INCLUIDOS.free` = 60, lib/pricing.ts:160).",
    ],
    origen: "lib/auth.ts:121",
  },
  {
    id: "acceso.pedir-recuperacion",
    area: "acceso",
    metodo: "POST",
    ruta: "/sesion/recuperacion",
    resumen: "Manda al correo un enlace para elegir una contraseña nueva.",
    descripcion:
      "Sustituye a `enviarEnlaceRecuperacion` (lib/auth.ts:138), que hoy espera 800 ms, solo comprueba el formato del correo y no manda nada. Lo usan «Enviar enlace» y «Reenviar el enlace». La página a la que llevaría el enlace, donde se elige la contraseña nueva, no existe todavía en el front.",
    estado: "por-construir",
    auth: "publico",
    cuerpo: {
      tipo: "{ correo: string }",
      definidoEn: "lib/auth.ts:138",
      campos: [
        {
          nombre: "correo",
          tipo: "string",
          requerido: true,
          descripcion:
            "El «Correo de tu cuenta». La pantalla ya lo ha comprobado con `validarCorreo`.",
        },
      ],
      ejemplo: { correo: "ana@estudio.co" },
    },
    respuesta: RESPUESTA_RESULTADO,
    errores: [
      {
        codigo: "correoNoValido",
        http: 422,
        cuando:
          'El correo no tiene un formato válido. El cuerpo es `{ ok: false, error: "correoNoValido" }`.',
        frase: "auth.errors.correoNoValido",
        bloquea: true,
      },
      {
        codigo: "limite",
        http: 429,
        cuando:
          "Se pide otra vez antes de tiempo. La pantalla de acceso no tiene frase propia para este código: habría que llevarlo a la de `common.errors`.",
        frase: "common.errors.limite",
        bloquea: true,
      },
    ],
    reglas: [
      "Responder lo mismo exista o no una cuenta con ese correo: por seguridad, nadie puede averiguar así si un correo está registrado (lib/auth.ts:140).",
      "El enlace caduca a los 30 minutos: es lo que promete la pantalla («Caduca en 30 minutos.», messages/es/auth.json:133).",
      "Limitar los envíos por correo: la pantalla espera 30 s entre uno y otro (`ESPERA_REENVIO_S`, components/auth/login-panel.tsx:52), pero esa espera desaparece al recargar.",
      "Validar el formato con la misma regla que el front, tras quitar los espacios de los extremos.",
    ],
    origen: "lib/auth.ts:138",
  },
  {
    id: "acceso.iniciar-oauth",
    area: "acceso",
    metodo: "GET",
    ruta: "/sesion/oauth/{proveedor}",
    resumen: "Lleva a la autorización de Google, Apple o TikTok.",
    descripcion:
      "La primera mitad de «Continuar con…». `continuarCon` (lib/auth.ts:153) dice que con la API real abre el OAuth del proveedor y que hoy solo simula la vuelta. Esta ruta no responde JSON: redirige (302) a la pantalla de autorización del proveedor. El `next` de /login se pierde al salir del sitio, así que viaja aquí para recuperarlo a la vuelta.",
    estado: "por-construir",
    auth: "publico",
    parametros: [
      PARAM_PROVEEDOR,
      {
        nombre: "next",
        tipo: "string",
        requerido: false,
        en: "consulta",
        descripcion:
          "La ruta a la que volver, la misma de `/login?next=`. Solo rutas internas (`destinoSeguro`, lib/auth.ts:176).",
      },
    ],
    respuesta: {
      tipo: "void",
      campos: [
        {
          nombre: "Location",
          tipo: "string",
          requerido: true,
          descripcion: "Cabecera de la redirección 302: la autorización del proveedor.",
        },
      ],
    },
    errores: [
      {
        codigo: "proveedorNoDisponible",
        http: 404,
        cuando: "El proveedor no es google, apple ni tiktok.",
        frase: "auth.errors.proveedorNoDisponible",
        bloquea: true,
      },
    ],
    reglas: [
      "Solo los tres proveedores de `PROVEEDORES` (lib/auth.ts:20).",
      "Aplicar a `next` la regla de `destinoSeguro` (lib/auth.ts:176): nada externo (https://…, //…, /\\…), nunca /login ni la bienvenida (/bienvenida, /welcome, /boas-vindas), sin prefijo de idioma; si no vale, /dashboard.",
    ],
    origen: "lib/auth.ts:149",
  },
  {
    id: "acceso.completar-oauth",
    area: "acceso",
    metodo: "POST",
    ruta: "/sesion/oauth/{proveedor}/vuelta",
    resumen: "Cierra el OAuth: abre la sesión y dice si la cuenta es nueva.",
    descripcion:
      "La segunda mitad de «Continuar con…»: es lo que hoy simula `continuarCon` (lib/auth.ts:153), que tarda 900 ms y siempre dice `nueva: false`: se sigue con la cuenta que haya en el navegador (de fábrica, Ana Ruiz con la bienvenida completada). Con `nueva: true` la pantalla manda a /bienvenida?origen=oauth; con `nueva: false` mira el estado de la bienvenida de la cuenta para decidir si va al destino o a /bienvenida.",
    estado: "por-construir",
    auth: "publico",
    parametros: [PARAM_PROVEEDOR],
    cuerpo: {
      tipo: "{ code: string; state: string }",
      campos: [
        {
          nombre: "code",
          tipo: "string",
          requerido: true,
          descripcion: "El código de autorización con el que vuelve el proveedor.",
        },
        {
          nombre: "state",
          tipo: "string",
          requerido: true,
          descripcion: "El que se mandó en GET /sesion/oauth/{proveedor}.",
        },
      ],
    },
    respuesta: {
      tipo: "ResultadoOAuth",
      definidoEn: "lib/auth.ts:145",
      campos: [
        {
          nombre: "ok",
          tipo: "boolean",
          requerido: true,
          descripcion: "`true` si la sesión quedó abierta.",
        },
        {
          nombre: "nueva",
          tipo: "boolean",
          requerido: false,
          descripcion:
            "Solo con `ok: true`: si la cuenta se acaba de crear con este proveedor.",
        },
        {
          nombre: "error",
          tipo: '"proveedorNoDisponible"',
          requerido: false,
          descripcion: "Solo con `ok: false`. Un código de `ErrorAcceso`.",
        },
      ],
      ejemplo: { ok: true, nueva: false },
    },
    errores: [
      {
        codigo: "proveedorNoDisponible",
        http: 404,
        cuando:
          'El proveedor no es uno de los tres admitidos. El cuerpo es `{ ok: false, error: "proveedorNoDisponible" }`.',
        frase: "auth.errors.proveedorNoDisponible",
        bloquea: true,
      },
    ],
    reglas: [
      "Si no había cuenta, crearla como hace la pantalla con un OAuth nuevo (components/auth/login-panel.tsx:124): origen «oauth», tipo `null`, `mayorDeEdad: false` y sin consentimientos, y responder `nueva: true`. La bienvenida pide luego el tipo, la casilla de 18+ y los términos (lib/onboarding.ts:416).",
      "Nunca dar por aceptados los términos ni la mayoría de edad por venir de un proveedor: el proveedor no dice ni el tipo ni la edad.",
      "Dejar abierta la sesión que luego devuelve GET /sesion.",
    ],
    origen: "lib/auth.ts:153",
  },
]
