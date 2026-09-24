import type { Accion } from "@/lib/wiki/tipos"

/**
 * Acciones de «onboarding»: la bienvenida «Tu primer corte» (recorrido del
 * clipero, del creador y exprés por invitación), posponer y retomar, el
 * resultado, las micropreguntas del perfilado progresivo y las primeras
 * misiones de la campana. La solicitud de agencia está en «agencias».
 */

const DATOS_CUENTA =
  "Almacén de la cuenta del navegador (`hooks/use-cuenta.ts`, clave `clipealo-cuenta-v1`): respuestas en `clipero`, `creador` y `agencia`, cada una con su `meta` (fuente y fecha), y el progreso en `onboarding`. Con la API, cada transición pasa a ser una llamada."

export const ACCIONES: Accion[] = [
  /* -------------------------------------------------------------------------
     Entrar y recorrer la bienvenida
     ------------------------------------------------------------------------- */
  {
    id: "onboarding.empezar-bienvenida",
    area: "onboarding",
    titulo: "Empezar la bienvenida «Tu primer corte»",
    resumen:
      "Justo después de crear la cuenta, la persona monta su perfil en unas pocas tomas y cada respuesta cambia al momento lo que va a ver.",
    quien: ["clipero", "agencia"],
    donde: [
      {
        ruta: "/bienvenida",
        etiqueta:
          "Tu primer corte (fuera de la barra lateral; /welcome en inglés y /boas-vindas en portugués)",
      },
    ],
    pasos: [
      "Crea la cuenta en /login con «Crear cuenta gratis», o entra por primera vez con Google, Apple o TikTok: la app la lleva a /bienvenida, con el `?next=` que traía.",
      "Mientras el navegador lee la cuenta se ve el esqueleto de una toma; después se abre la toma que le toca.",
      "Arriba ve el logo, «Toma {n} de {total}» (con un timecode 00:00:0n:00 decorativo en pantallas medianas o más), el selector de idioma y «Hacerlo luego»; debajo, el timeline «Tomas» con un segmento por toma.",
      "Cada toma escribe su pregunta palabra a palabra, enseña su «Para qué» con el icono ⓘ «Tus datos» y, al responder, una reacción que dice lo que cambia (p. ej. cuántas campañas encajan).",
      "Responde y pulsa «Continuar» hasta llegar al resultado.",
    ],
    reglas: [
      "Toma con la que se abre (`pasoInicial`): la de `?paso=` si se puede abrir; si no, la guardada en `pasoActual` (salvo con la bienvenida completada); si no, la primera del recorrido.",
      "Recorrido: el `?tipo=` de la URL; si no, el tipo de la cuenta; si no, el guardado en el progreso; si no, clipero.",
      "Tras el alta con correo el tipo se guarda vacío, así que la primera toma es siempre «Tu cuenta»: el formulario de acceso solo pide lo necesario para tener cuenta. El clipero tiene 5 tomas (6 con «Tu cuenta»), la agencia 4 (5 con «Tu cuenta») y el exprés 2; el resultado no cuenta como toma.",
      "`?next=` solo vale si es una ruta interna segura (`nextSeguro`): nunca /login, la propia bienvenida en sus tres idiomas ni /dashboard. Si vale, manda sobre el destino de la rama al terminar o al posponer.",
      "Origen que se registra: el `?origen=` de la URL; si no viene, `retomar` para una bienvenida pospuesta, `invitacion` en el modo exprés y `registro` en el resto.",
      "La primera toma saluda: «Hola, {nombre}. Montemos tu perfil en {total} tomas.»; sin nombre (un acceso nuevo con proveedor llega sin él), «Hola. Montemos tu perfil en {total} tomas.». El título de la pestaña dice «Toma {n} de {total} · {paso} · Clipealo» y, en el resultado, «{paso} · Clipealo».",
      "ⓘ «Tus datos» dice quién ve la respuesta (tú y el equipo; en estadísticas, solo en grupos de 50 personas o más y redondeado), cuánto se guarda (se borra a los 18 meses sin actividad, salvo país y consentimientos) y dónde se cambia (Ajustes › Tus datos).",
      "La página no se indexa (`robots: { index: false, follow: false }`) y robots.txt la bloquea (app/robots.ts:16).",
      "Si el navegador no deja guardar, avisa una vez por carga de página y deja seguir: lo respondido se pierde al cerrar la pestaña.",
    ],
    estados: [
      {
        estado: "sin-empezar",
        significa: "Cuenta nueva que aún no ha abierto la bienvenida.",
      },
      { estado: "en-curso", significa: "Ha empezado y no ha terminado ni pospuesto." },
      {
        estado: "pospuesto",
        significa: "Pulsó «Hacerlo luego»: se guarda la toma en la que lo dejó.",
      },
      {
        estado: "completado",
        significa: "Llegó al resultado. No vuelve atrás, aunque la repase.",
      },
    ],
    errores: [
      {
        codigo: "guardadoFallido",
        cuando: "El navegador no deja guardar (almacenamiento bloqueado o lleno).",
        frase: "onboarding.errors.guardadoFallido.title",
        bloquea: false,
      },
    ],
    endpoints: [
      "onboarding.leer",
      "onboarding.leer-respuestas",
      "onboarding.iniciar",
      "onboarding.ver-paso",
    ],
    datos: DATOS_CUENTA,
    respuesta:
      "Abrir la bienvenida no suena: tras el alta con correo no hay aviso (la bienvenida la da la primera toma); el aviso de éxito de un acceso con proveedor es del área acceso. Si no se puede guardar, `toast.error` «No podemos guardar tus respuestas en este navegador» («Puedes seguir, pero se perderán al cerrar la pestaña.»), con su sonido y la sacudida. El texto que se escribe solo sigue apareciendo con «reducir movimiento», como karaoke de color.",
    origen: [
      "app/[locale]/(onboarding)/bienvenida/page.tsx:28",
      "components/onboarding/onboarding-flow.tsx:121",
      "components/onboarding/onboarding-flow.tsx:138",
      "components/onboarding/onboarding-flow.tsx:186",
      "components/onboarding/onboarding-flow.tsx:425",
      "components/onboarding/onboarding-flow.tsx:446",
      "components/auth/login-panel.tsx:416",
      "lib/onboarding.ts:430",
    ],
    relacionadas: [
      "onboarding.elegir-tipo-cuenta",
      "onboarding.continuar-toma",
      "onboarding.posponer-bienvenida",
    ],
  },
  {
    id: "onboarding.elegir-tipo-cuenta",
    area: "onboarding",
    titulo: "Decir cómo vas a usar Clipealo (toma «Tu cuenta»)",
    resumen:
      "Elige entre hacer clips o representar una marca o agencia: es lo que decide todo el recorrido. Tras un acceso con Google, Apple o TikTok, además confirma los 18 años y acepta los términos.",
    quien: ["clipero", "agencia"],
    donde: [{ ruta: "/bienvenida?paso=cuenta", etiqueta: "Toma «Tu cuenta»" }],
    pasos: [
      "Lee «¿Cómo vas a usar Clipealo?» («Para enseñarte lo tuyo desde el principio.»).",
      "Elige una tarjeta (teclas 1-2): «Hago clips» o «Represento una marca o agencia».",
      "Si entró con Google, Apple o TikTok, marca también «Tengo 18 años o más» y «Acepto los términos y la política de privacidad», con el aviso de datos debajo.",
      "Pulsa «Continuar» o Enter.",
    ],
    reglas: [
      "La toma sale si falta el tipo, la mayoría de edad o los términos (`necesitaPasoCuenta`). Una vez vista se queda en el recorrido, para que el número de toma no cambie al completarla.",
      "Las casillas solo aparecen si faltan: quien viene del alta con correo ya las aceptó en el formulario y no se le piden dos veces.",
      "«Tengo 18 años o más» va separada de los términos y no se puede saltar: «Clipealo es para mayores de edad. Lo confirmamos en tu primer retiro.»",
      "Cada casilla registra su consentimiento con la clave exacta del texto: `mayor-edad` con `onboarding.cuenta.adult`; aceptar los términos registra `terminos` y `privacidad` con `onboarding.cuenta.terms` y, al marcarla, `estadisticas` con `onboarding.cuenta.privacyNote` (el aviso de las estadísticas en grupos de 50 personas o más).",
      "Con «Hago clips» sigue la rama del clipero; con «Represento una marca o agencia», las tomas de la solicitud de agencia (área agencias). Quien pide agencia sigue siendo usuario hasta que el admin le concede el perfil (`perfilDesdeTipo`).",
    ],
    errores: [
      {
        codigo: "sinTipo",
        cuando: "Pulsa «Continuar» sin elegir tarjeta.",
        frase: "onboarding.errors.sinTipo",
        bloquea: true,
      },
      {
        codigo: "sinMayorEdad",
        cuando: "No ha marcado «Tengo 18 años o más».",
        frase: "onboarding.errors.sinMayorEdad",
        bloquea: true,
      },
      {
        codigo: "sinTerminos",
        cuando: "No ha aceptado los términos.",
        frase: "onboarding.errors.sinTerminos",
        bloquea: true,
      },
    ],
    endpoints: [
      "onboarding.responder",
      "onboarding.consentir",
      "onboarding.responder-paso",
    ],
    datos:
      "`cuenta.tipo` y `cuenta.mayorDeEdad` con su `meta`, y el registro `cuenta.consentimientos`, al que solo se añaden entradas.",
    respuesta:
      "Elegir una tarjeta hace «tap» (grupo de opciones); las casillas no suenan. La reacción aparece 600 ms después del último cambio —la primera se escribe, las siguientes funden—: «Perfecto: montamos tu perfil de clipero.» o «Perfecto: preparamos tu solicitud de agencia.»",
    origen: [
      "components/onboarding/tomas/cuenta.tsx:39",
      "components/onboarding/tomas/cuenta.tsx:49",
      "components/onboarding/tomas/cuenta.tsx:114",
      "lib/onboarding.ts:416",
      "lib/onboarding.ts:1222",
    ],
    relacionadas: ["onboarding.elegir-objetivo", "onboarding.continuar-toma"],
  },
  {
    id: "onboarding.elegir-objetivo",
    area: "onboarding",
    titulo: "Elegir qué vienes a hacer (toma «Qué vienes a hacer»)",
    resumen:
      "El clipero elige entre campañas, sus propios videos o las dos cosas; eso decide sus tomas y adónde llega al final.",
    quien: ["clipero"],
    donde: [{ ruta: "/bienvenida?paso=objetivo", etiqueta: "Toma «Qué vienes a hacer»" }],
    pasos: [
      "Lee «¿Qué vienes a hacer a Clipealo?» («Para llevarte directo a lo tuyo.»).",
      "Elige una tarjeta (teclas 1-3): «Cobrar clipeando campañas», «Recortar mis directos y videos» o «Las dos cosas».",
      "Pulsa «Continuar».",
    ],
    reglas: [
      "Campañas y las dos cosas siguen con «Tus temas» y «Tus creadores»; mis videos, con «Tus directos» y «Tu canal». Las tres terminan con «Tus redes», «País e idiomas» y el resultado.",
      "Cambiar el objetivo recalcula al momento el recorrido y el total de tomas. Sin objetivo todavía, el recorrido se calcula como el de campañas.",
      "Decide adónde lleva «Hacerlo luego» (`destinoDeRama`): campañas → /campanas?orden=para-ti; mis videos → /subir; las dos cosas → /dashboard. Un `?next=` seguro manda sobre esto. Al terminar, el destino lo eligen los botones del resultado: campañas y las dos cosas acaban en «Para ti» (con «Ver mis campañas»); mis videos, en el resultado del creador («Subir mi primer video»).",
    ],
    errores: [
      {
        codigo: "sinObjetivo",
        cuando: "Pulsa «Continuar» sin elegir.",
        frase: "onboarding.errors.sinObjetivo",
        bloquea: true,
      },
    ],
    endpoints: ["onboarding.responder", "onboarding.responder-paso"],
    datos: "`cuenta.clipero.objetivo`, con su `meta`. " + DATOS_CUENTA,
    respuesta:
      "«tap» al elegir. Reacción: «Perfecto: te enseñamos campañas que pagan por vistas.», «Genial: dejamos cada red con su formato.» o «Hecho: te preparamos las campañas y te dejamos a mano subir tu primer video.»",
    origen: [
      "components/onboarding/tomas/objetivo.tsx:23",
      "lib/onboarding.ts:453",
      "lib/onboarding.ts:492",
    ],
    relacionadas: [
      "onboarding.elegir-temas",
      "onboarding.elegir-plataformas-directo",
      "onboarding.continuar-toma",
    ],
  },
  {
    id: "onboarding.elegir-temas",
    area: "onboarding",
    titulo: "Elegir qué te gustaría clipear (toma «Tus temas»)",
    resumen:
      "El clipero marca hasta 5 temas —y, si es gaming, sus juegos— y ve al momento cuántas campañas le esperan.",
    quien: ["clipero"],
    plan: {
      nota: "La cuenta de campañas que encajan solo incluye las que comparten alguna red con las que su plan puede conectar (con Prueba, solo TikTok): la misma regla que /campanas.",
    },
    donde: [{ ruta: "/bienvenida?paso=nichos", etiqueta: "Toma «Tus temas»" }],
    pasos: [
      "Lee «¿Qué te gustaría clipear?» («Elige hasta 5. Con esto ordenamos tu feed de campañas.»).",
      "Marca chips (teclas 1-9): Gaming, Directos y charlas, Podcasts y entrevistas, Deportes, Música, Humor, Educación, Negocios y emprendimiento, Finanzas personales, Tecnología e IA, Moda y belleza, Comida, Fitness y bienestar, Anime y VTubers… o «Aún no lo sé».",
      "Si marca Gaming aparece «¿Algún juego en concreto? (opcional)», con 8 juegos de su país y el buscador «Busca un juego».",
      "Pulsa «Continuar».",
    ],
    reglas: [
      "Hasta 5 temas (`LIMITES_ONBOARDING.nichos`). El sexto no entra: no suena y la región viva dice «Ya tienes 5. Quita uno para cambiarlo.»",
      "«Aún no lo sé» excluye al resto: marcarlo deja solo ese, y marcar un tema lo quita.",
      "Son 14 temas elegibles: Noticias y actualidad no se elige, solo es etiqueta de campaña.",
      "Juegos: hasta 5 y opcionales. Los 8 destacados dependen del país ya respondido (`JUEGOS_POR_PAIS`, `juegosDe`): como «País e idiomas» va después, lo normal es que aún no haya país y salgan los de la región andina (Free Fire, Minecraft, GTA V, Roblox, Valorant, League of Legends, EA Sports FC y Fortnite), los mismos que en Perú, Ecuador y Colombia. Si desmarca Gaming se borran los juegos.",
      "Los temas pasan a Ajustes › Público: solo los que son temas de Público y como mucho 3 (`TEMAS_MAX`). «Aún no lo sé» no toca Público.",
      "La reacción cuenta las campañas que encajan con lo marcado (`recomendarCampanas`): «{temas}: # campañas te esperan.» o, sin ninguna, «Aún no hay campañas de {temas}. Te avisamos en cuanto salga una.». Con «Aún no lo sé»: «Sin prisa: mientras tanto, # campañas te esperan.»",
    ],
    errores: [
      {
        codigo: "sinNichos",
        cuando: "Pulsa «Continuar» sin temas ni «Aún no lo sé».",
        frase: "onboarding.errors.sinNichos",
        bloquea: true,
      },
      {
        codigo: "limiteElegidos",
        cuando: "Intenta marcar un sexto tema o un sexto juego.",
        frase: "onboarding.errors.limiteElegidos",
        bloquea: false,
      },
    ],
    endpoints: ["onboarding.responder", "onboarding.responder-paso", "campanas.listar"],
    datos:
      "`cuenta.clipero.verticales` (lista o `aun-no-se`) y `cuenta.clipero.juegos`. Las campañas que se cuentan salen del almacén de campañas (`hooks/use-campanas.ts`).",
    respuesta:
      "Cada chip que se marca hace «tap»; desmarcar o chocar con el máximo no suena. La reacción aparece 600 ms después del último cambio.",
    origen: [
      "components/onboarding/tomas/nichos.tsx:41",
      "components/onboarding/tomas/nichos.tsx:84",
      "lib/onboarding.ts:392",
      "lib/creadores.ts:560",
      "hooks/use-cuenta.ts:587",
      "components/onboarding/onboarding-flow.tsx:224",
    ],
    relacionadas: [
      "onboarding.elegir-creadores",
      "onboarding.confirmar-temas",
      "onboarding.continuar-toma",
    ],
  },
  {
    id: "onboarding.elegir-creadores",
    area: "onboarding",
    titulo: "Elegir de quién harías clips (toma «Tus creadores»)",
    resumen:
      "El clipero pone en su radar hasta 5 streamers, podcasts, artistas o clubes: primero verá sus campañas y se le avisa cuando lancen una.",
    quien: ["clipero"],
    donde: [{ ruta: "/bienvenida?paso=fandom", etiqueta: "Toma «Tus creadores»" }],
    pasos: [
      "Lee «¿De quién harías clips encantado?» («Streamers, podcasts, artistas o clubes. Primero verás sus campañas.»).",
      "Marca tarjetas de «Populares entre cliperos de {pais}» («Populares entre cliperos» si no hay país; 8, teclas 1-8): cada una con su plataforma, sus seguidores, su tema y, si la tiene, la insignia «Tiene campaña».",
      "O escribe en «Busca por nombre o pega el enlace del canal»: elige un resultado, pega un enlace de Twitch, Kick, YouTube o TikTok, o pulsa «Añadir «{texto}»» si no aparece.",
      "Los elegidos salen en «Tu radar» con el contador «{n} de 5»; «Quitar a {creador}», o Retroceso con el buscador vacío, los quita.",
      "Si quiere, enciende «Avisarme también por correo».",
      "Pulsa «Continuar» o «Saltar esta toma».",
    ],
    reglas: [
      "Es la única toma opcional.",
      "Hasta 5 creadores (`LIMITES_ONBOARDING.creadores`). El sexto no entra y la región viva lo dice.",
      "Sugerencias: primero los que tienen una campaña activa que se puede hacer desde su país, después los de sus temas y luego el resto, por fans. El orden se baraja con su correo (siempre el mismo para esa persona) y nunca salen creadores marcados como no sugeribles.",
      "País de las sugerencias: el respondido o, si aún no lo hay, la región del navegador, sin guardarla.",
      "Un enlace o un nombre fuera del catálogo se guarda como pendiente (`CreadorPendiente`, pensado para la cola `#pendientes` del admin, lib/onboarding.ts:163); de un pendiente solo se usa su plataforma. Hoy el backoffice no lee estos pendientes del navegador: /admin/mercado enseña un recuento de su propio conjunto de datos.",
      "Sin preguntar se deduce del radar (`derivadosDelFandom`): las plataformas donde ve a sus creadores y sus formatos de directo, como `inferido`. Si en temas marcó «Aún no lo sé» (o no eligió ninguno), las verticales de sus creadores salen tras la insignia «Detectado» y la recomendación ya las usa, pero no se guardan como temas declarados.",
      "Reacción con el último añadido: «Más de {umbral} cliperos ya siguen a {creador}.» solo si son 50 o más, redondeado a 50, 200, 1.000 o 5.000 (`umbralPublico`); si no, «Serás de los primeros en clipear a {creador}.»",
      "Texto fijo: «Te avisamos en la app cuando lancen campaña.» El interruptor «Avisarme también por correo» viene apagado y registra la finalidad `alertas-correo`.",
    ],
    errores: [
      {
        codigo: "limiteElegidos",
        cuando: "Intenta añadir un sexto creador.",
        frase: "onboarding.errors.limiteElegidos",
        bloquea: false,
      },
      {
        codigo: "sugerenciasFallidas",
        cuando: "No se pudieron calcular las sugerencias: se puede buscar a mano.",
        frase: "onboarding.errors.sugerenciasFallidas",
        bloquea: false,
      },
      {
        codigo: "enlaceNoReconocido",
        cuando:
          "Pega una dirección que no es de Twitch, Kick, YouTube ni TikTok: no se puede añadir.",
        frase: "onboarding.errors.enlaceNoReconocido",
        bloquea: false,
      },
    ],
    endpoints: [
      "onboarding.sugerir-creadores",
      "onboarding.buscar-creadores",
      "onboarding.responder",
      "onboarding.consentir",
      "onboarding.responder-paso",
      "campanas.listar",
    ],
    datos:
      "`cuenta.clipero.creadoresFan` (ids `cre_…` o pendientes), `clipero.plataformasQueVe` y `clipero.subverticales.formatos` (inferidos). El catálogo es la semilla ficticia de `lib/creadores.ts`.",
    respuesta:
      "Añadir o quitar creadores va en silencio, en las tarjetas y en el buscador; cada alta o baja se anuncia («Añadido: {creador}. {n} de 5.»). El interruptor suena al encender y al apagar.",
    origen: [
      "components/onboarding/tomas/fandom.tsx:301",
      "components/onboarding/tomas/fandom.tsx:342",
      "components/onboarding/tomas/fandom.tsx:357",
      "components/onboarding/tomas/fandom.tsx:405",
      "components/onboarding/tomas/fandom.tsx:552",
      "lib/creadores.ts:514",
      "lib/onboarding.ts:1247",
    ],
    relacionadas: ["onboarding.saltar-toma", "onboarding.elegir-temas"],
  },
  {
    id: "onboarding.saltar-toma",
    area: "onboarding",
    titulo: "Saltar una toma opcional",
    resumen: "Deja sin responder «Tus creadores» y pasa a la siguiente toma.",
    quien: ["clipero"],
    donde: [{ ruta: "/bienvenida?paso=fandom", etiqueta: "Toma «Tus creadores»" }],
    pasos: ["Pulsa «Saltar esta toma», junto a «Continuar»."],
    reglas: [
      "Solo aparece en las tomas opcionales, que hoy son únicamente «Tus creadores» (`PASOS_OPCIONALES`).",
      "El segmento del timeline queda como «Saltada» y el resumen del resultado también lo dice.",
      "Una toma saltada no bloquea las siguientes ni el resultado; si luego se responde, deja de contar como saltada.",
      "Suma el tiempo que pasó en la toma.",
    ],
    estados: [
      { estado: "En curso", significa: "La toma que está en pantalla." },
      { estado: "Respondida", significa: "Pasó por ella con «Continuar»." },
      { estado: "Saltada", significa: "Pasó por ella con «Saltar esta toma»." },
      { estado: "Pendiente", significa: "Aún no ha llegado." },
    ],
    endpoints: [
      "onboarding.sumar-tiempo",
      "onboarding.saltar-paso",
      "onboarding.ver-paso",
    ],
    datos: "`cuenta.onboarding.pasosSaltados`. " + DATOS_CUENTA,
    respuesta:
      "Sin sonido ni aviso. La toma que sale funde (160 ms) y el foco va a la siguiente.",
    origen: [
      "components/onboarding/onboarding-flow.tsx:370",
      "components/onboarding/toma.tsx:309",
      "lib/onboarding.ts:133",
      "hooks/use-cuenta.ts:769",
    ],
    relacionadas: ["onboarding.elegir-creadores", "onboarding.editar-toma"],
  },
  {
    id: "onboarding.elegir-redes",
    area: "onboarding",
    titulo: "Decir dónde publicas (toma «Tus redes»)",
    resumen:
      "El clipero marca las redes donde publica, y solo se le enseñan campañas que puede aceptar.",
    quien: ["clipero"],
    plan: {
      nota: "Marcar redes no depende del plan: se puede marcar cualquiera. Pero Prueba solo conecta TikTok (`NETWORKS_BY_PLAN`) y la toma lo dice: «Con el plan Prueba solo se conecta TikTok. Marca igual donde publiques: nos dice qué campañas te sirven.» Creador y Empresa conectan las seis.",
    },
    donde: [
      { ruta: "/bienvenida?paso=redes", etiqueta: "Toma «Tus redes»" },
      {
        ruta: "/bienvenida?modo=expres",
        etiqueta: "Modo exprés por invitación (tras «Tu cuenta», si le falta algo)",
      },
    ],
    pasos: [
      "Lee «¿Dónde publicas tus clips?» («Solo te enseñamos campañas que puedas aceptar.»).",
      "Marca chips con los logos oficiales (teclas 1-8): TikTok, Instagram, YouTube, X, LinkedIn, Facebook, «Otra red» o «Aún no tengo cuenta».",
      "Pulsa «Continuar».",
    ],
    reglas: [
      "Al menos una. «Aún no tengo cuenta» excluye al resto.",
      "Reacción con la primera red marcada, con su duración y su formato ideales (`SOCIAL_NETWORKS`): «TikTok premia clips de 21 a 60 s en 9:16. Lo tendremos en cuenta.» (Instagram 15–45 s en 9:16, YouTube 25–55 s en 9:16, X 20–60 s en 16:9, LinkedIn 30–90 s en 1:1, Facebook 15–45 s en 9:16).",
      "Con «Aún no tengo cuenta»: «Sin problema: te enseñamos a abrirla al unirte a tu primera campaña.» Con «Otra red»: «Anotado: te avisamos cuando haya campañas para esa red.»",
      "Las redes filtran la recomendación: no se recomienda una campaña sin ninguna red en común. Con «Aún no tengo cuenta» o sin redes no se filtra.",
    ],
    errores: [
      {
        codigo: "sinRedes",
        cuando: "Pulsa «Continuar» sin marcar ninguna.",
        frase: "onboarding.errors.sinRedes",
        bloquea: true,
      },
    ],
    endpoints: ["onboarding.responder", "onboarding.responder-paso"],
    datos: "`cuenta.clipero.redes`. " + DATOS_CUENTA,
    respuesta: "«tap» al marcar un chip; desmarcar no suena.",
    origen: [
      "components/onboarding/tomas/redes.tsx:21",
      "components/onboarding/tomas/redes.tsx:78",
      "lib/pricing.ts:515",
      "lib/social.ts:46",
    ],
    relacionadas: [
      "onboarding.elegir-pais-idiomas",
      "onboarding.completar-requisitos-campana",
    ],
  },
  {
    id: "onboarding.elegir-pais-idiomas",
    area: "onboarding",
    titulo: "Decir desde dónde clipeas (toma «País e idiomas»)",
    resumen:
      "El clipero confirma su país y los idiomas de sus clips, y ve con qué métodos cobraría.",
    quien: ["clipero"],
    donde: [
      { ruta: "/bienvenida?paso=basicos", etiqueta: "Toma «País e idiomas»" },
      {
        ruta: "/bienvenida?modo=expres",
        etiqueta: "Última toma del modo exprés por invitación",
      },
    ],
    pasos: [
      "Lee «Lo último: ¿desde dónde clipeas?» («Para enseñarte campañas de tu país y cómo cobrar.»).",
      "Revisa «País»: viene elegido si el navegador trae una región de la lista; si no, «Elige tu país» (con bandera) u «Otro país».",
      "En «Idiomas de tus clips» (hasta 3) el idioma de la interfaz ya viene marcado: añade o quita.",
      "Pulsa «Continuar».",
    ],
    reglas: [
      "Países: PE, MX, CO, CL, AR, ES, EC, BR y US (`COUNTRY_CODES`), más «Otro país».",
      "Si aún no hay país, se toma la región de `navigator.languages` (p. ej. es-PE → Perú) si está en la lista; si aún no hay idiomas, el de la interfaz. Los dos se guardan como `inferido` al abrir la toma y, al pulsar «Continuar», pasan a `declarado`.",
      "Hasta 3 idiomas: el cuarto no entra y la región viva dice «Hasta 3 idiomas. Quita uno para cambiarlo.»",
      "Reacción: «En {pais} cobras con {metodos}.» (`METODOS_POR_PAIS`): en Perú, PayPal, Transferencia bancaria y Yape; en el resto, PayPal y Transferencia bancaria. Con «Otro país»: «Cobras con {metodos}.»",
      "El país (salvo «Otro país») pasa a Ajustes › Perfil; si el idioma de Público no está entre los elegidos, pasa a ser el primero de ellos.",
      "Es la última toma antes del resultado.",
    ],
    errores: [
      {
        codigo: "sinPais",
        cuando: "Pulsa «Continuar» sin país.",
        frase: "onboarding.errors.sinPais",
        bloquea: true,
      },
      {
        codigo: "sinIdiomas",
        cuando: "Pulsa «Continuar» sin ningún idioma.",
        frase: "onboarding.errors.sinIdiomas",
        bloquea: true,
      },
      {
        codigo: "maxIdiomas",
        cuando: "Intenta marcar un cuarto idioma.",
        frase: "onboarding.errors.maxIdiomas",
        bloquea: false,
      },
    ],
    endpoints: ["onboarding.responder", "onboarding.responder-paso"],
    datos:
      "`cuenta.pais` y `cuenta.idiomas`, con su `meta` (`inferido` → `declarado`); reflejados en `perfilCanal.pais` y `publico.idioma`.",
    respuesta:
      "El desplegable no suena; los chips de idioma hacen «tap» al marcar. La reacción aparece a los 600 ms.",
    origen: [
      "components/onboarding/tomas/basicos.tsx:42",
      "components/onboarding/tomas/basicos.tsx:64",
      "components/onboarding/onboarding-flow.tsx:346",
      "lib/wallet.ts:32",
      "hooks/use-cuenta.ts:579",
    ],
    relacionadas: ["onboarding.elegir-redes", "onboarding.ver-resultado-clipero"],
  },
  {
    id: "onboarding.elegir-plataformas-directo",
    area: "onboarding",
    titulo: "Decir dónde transmites (toma «Tus directos»)",
    resumen:
      "Quien viene a recortar sus videos dice dónde emite o sube sus videos largos y cada cuánto, y ve cuántos minutos subiría al mes.",
    quien: ["clipero"],
    donde: [
      { ruta: "/bienvenida?paso=directo", etiqueta: "Toma «Tus directos» (mis videos)" },
    ],
    pasos: [
      "Lee «¿Dónde transmites o subes tus videos largos?» («Dejamos lista la importación desde ahí.»).",
      "Marca plataformas: Twitch, YouTube, Kick, TikTok, Facebook o «No hago directos, subo videos».",
      "Si transmite, elige «¿Cada cuánto sales en directo?»: Casi a diario, 3 a 6 veces por semana, 1 o 2 por semana, Algunas veces al mes o De vez en cuando.",
      "Si quiere, «¿Cuánto dura un directo normal? (opcional)»: Menos de 1 h, De 1 a 3 h, De 3 a 6 h o Más de 6 h.",
      "Pulsa «Continuar».",
    ],
    reglas: [
      "Al menos una plataforma. «No hago directos, subo videos» excluye al resto y borra la frecuencia y la duración: no se guardan datos de directo de quien no transmite.",
      "Si transmite, la frecuencia es obligatoria; la duración, no.",
      "Minutos al mes (`minutosPrevistos`): directos por semana (6 · 4,5 · 1,5 · 0,6 · 0,25) × horas por directo (0,5 · 2 · 4,5 · 7; 2 si no responde) × 60 × 4,3 semanas × 0,30 (la parte que se sube), redondeado. Casi a diario de 1 a 3 h → unos 929 minutos.",
      "Las plataformas pasan a Ajustes › Perfil.",
    ],
    errores: [
      {
        codigo: "sinPlataformas",
        cuando: "Pulsa «Continuar» sin plataformas.",
        frase: "onboarding.errors.sinPlataformas",
        bloquea: true,
      },
      {
        codigo: "sinFrecuencia",
        cuando: "Transmite y no dice cada cuánto.",
        frase: "onboarding.errors.sinFrecuencia",
        bloquea: true,
      },
    ],
    endpoints: ["onboarding.responder", "onboarding.responder-paso"],
    datos:
      "`cuenta.creador.plataformasDirecto`, `creador.frecuencia` y `creador.duracion`; reflejado en `perfilCanal.plataformas`.",
    respuesta:
      "Chips de plataforma: «tap» al marcar. Tarjetas de frecuencia y duración: «tap» al elegir una nueva. Reacción: «Con ese ritmo subirías unos {min} minutos al mes.» o «Sin problema: sube tus videos cuando quieras y los dejamos listos para cada red.»",
    origen: [
      "components/onboarding/tomas/directo.tsx:64",
      "components/onboarding/tomas/directo.tsx:96",
      "lib/onboarding.ts:1168",
      "lib/onboarding.ts:1200",
    ],
    relacionadas: ["onboarding.describir-canal", "onboarding.ver-resultado-creador"],
  },
  {
    id: "onboarding.describir-canal",
    area: "onboarding",
    titulo: "Contar de qué va tu canal (toma «Tu canal»)",
    resumen:
      "El creador elige hasta 3 temas, pega el enlace de su canal para la importación y la marca de agua, y dice si le interesa que otros cliperos le recorten.",
    quien: ["clipero"],
    donde: [{ ruta: "/bienvenida?paso=canal", etiqueta: "Toma «Tu canal» (mis videos)" }],
    pasos: [
      "Lee «¿De qué va tu canal?» («Elige hasta 3. Ajustamos subtítulos, duración y plantillas.»).",
      "Marca hasta 3 temas (teclas 1-9).",
      "Si quiere, pega el enlace en «Enlace de tu canal (opcional)» (ej. twitch.tv/tucanal): al reconocerlo dice «Detectado: {plataforma} · @{handle}».",
      "Si quiere, responde «¿Te gustaría que otros cliperos recorten tus directos? Solo pagas por vistas.» («tus videos» si no transmite): «Sí, cuéntame», «Más adelante» o «No».",
      "Pulsa «Continuar».",
    ],
    reglas: [
      "Al menos 1 tema y como mucho 3 (`LIMITES_ONBOARDING.temasCanal`); pasan a Ajustes › Público.",
      "El enlace se reconoce mientras se escribe —twitch.tv/x, kick.com/x, youtube.com/@x, tiktok.com/@x— y se guarda al momento, sin verificar. Si hay texto y no se reconoce, no deja continuar.",
      "Si el handle vale como nombre de canal (3 a 30 caracteres: letras, números, punto y guion bajo), pasa a Ajustes › Perfil: es la marca de agua de sus clips. Reacción: «Tu marca de agua será @{handle}.»; si no vale, «Canal de {plataforma} listo para importar: @{handle}.»",
      "Con «Sí, cuéntame», el resultado le ofrece «Pide el perfil de agencia».",
      "La reacción sigue a lo último que tocó: el enlace, el interés («Hecho: al final te dejamos preparada la solicitud para lanzar tu campaña.») o los temas («Plantillas de {temas} listas para tus clips.»).",
    ],
    errores: [
      {
        codigo: "sinTemaCanal",
        cuando: "Pulsa «Continuar» sin temas.",
        frase: "onboarding.errors.sinTemaCanal",
        bloquea: true,
      },
      {
        codigo: "enlaceNoReconocido",
        cuando: "Hay texto en el enlace y no es de Twitch, Kick, YouTube ni TikTok.",
        frase: "onboarding.errors.enlaceNoReconocido",
        bloquea: true,
      },
      {
        codigo: "limiteElegidos",
        cuando: "Intenta marcar un cuarto tema.",
        frase: "onboarding.errors.limiteElegidos",
        bloquea: false,
      },
    ],
    endpoints: ["onboarding.responder", "onboarding.responder-paso"],
    datos:
      "`cuenta.creador.verticalesCanal`, `creador.enlaceCanal` (`{ plataforma, handle, verificado: false }`) y `creador.interesCampanaPropia`; reflejado en `publico.temas` y `perfilCanal.canal`.",
    respuesta: "Chips y tarjetas: «tap» al marcar. El campo de enlace no suena.",
    origen: [
      "components/onboarding/tomas/canal.tsx:64",
      "components/onboarding/tomas/canal.tsx:84",
      "lib/onboarding.ts:821",
      "hooks/use-cuenta.ts:606",
      "lib/ajustes.ts:83",
    ],
    relacionadas: [
      "onboarding.elegir-plataformas-directo",
      "onboarding.preparar-solicitud-agencia",
    ],
  },
  {
    id: "onboarding.continuar-toma",
    area: "onboarding",
    titulo: "Continuar a la siguiente toma",
    resumen:
      "Da la toma por respondida y pasa a la siguiente o al resultado; si falta algo, dice qué y lleva el foco allí.",
    quien: ["clipero", "agencia"],
    donde: [{ ruta: "/bienvenida", etiqueta: "Cualquier toma · «Continuar»" }],
    pasos: [
      "Pulsa «Continuar» (botón azul, con la pista «Enter ↵» si hay ratón) o Enter.",
      "Si la pregunta aún se estaba escribiendo, el primer toque solo la completa.",
      "Si falta algo, el error sale bajo su campo y el foco va a él; desde ahí se actualiza en vivo al corregir.",
    ],
    reglas: [
      "Teclado: Enter continúa (salvo dentro del buscador, un enlace o un botón que no sea opción); las teclas 1-9 eligen la opción n del grupo principal; Esc y cualquier otra tecla completan el texto que se escribe. Escribir en un campo o un desplegable nunca elige opciones.",
      "Valida con `validarToma`: los errores que bloquean impiden seguir; los informativos (límite de elegidos, máximo de idiomas) solo se anuncian.",
      "Antes de pasar: suma el tiempo de la toma (solo con la pestaña visible), convierte en declarados el país y los idiomas inferidos y registra la respuesta con el número de opciones y si aceleró el texto.",
      "La siguiente toma se calcula con lo ya guardado: si cambió el objetivo, cambia el recorrido.",
      "La URL pasa a `?paso=<siguiente>` con historial, para que funcione el atrás del navegador.",
      "Tras la última toma («País e idiomas» o, en la agencia, «Dónde y para quién») pasa al resultado, que no cuenta como toma y donde el teclado ya no continúa.",
    ],
    endpoints: [
      "onboarding.sumar-tiempo",
      "onboarding.responder",
      "onboarding.responder-paso",
      "onboarding.ver-paso",
    ],
    datos: DATOS_CUENTA + " El paso también va en la URL (`?paso=`).",
    respuesta:
      "«Continuar» no suena: va en azul, no en naranja. Al responder, un clip vuela desde la opción elegida hasta su segmento del timeline (420 ms) y la marca de recorte lo encuadra al llegar; con «reducir movimiento», el segmento se enciende con un anillo en su sitio. La toma que sale funde (160 ms) y el foco va al campo de texto de la nueva o a su título.",
    origen: [
      "components/onboarding/onboarding-flow.tsx:331",
      "components/onboarding/onboarding-flow.tsx:467",
      "components/onboarding/toma.tsx:318",
      "lib/onboarding.ts:615",
      "hooks/use-cuenta.ts:745",
    ],
    relacionadas: [
      "onboarding.volver-toma",
      "onboarding.acelerar-texto",
      "onboarding.empezar-bienvenida",
    ],
  },
  {
    id: "onboarding.volver-toma",
    area: "onboarding",
    titulo: "Volver a la toma anterior (o cambiar de idioma a mitad)",
    resumen:
      "Vuelve atrás sin perder lo respondido: lo ya escrito aparece al instante. Cambiar de idioma tampoco pierde nada.",
    quien: ["clipero", "agencia"],
    donde: [{ ruta: "/bienvenida", etiqueta: "Cualquier toma · «Atrás»" }],
    pasos: [
      "Pulsa «Atrás», abajo a la izquierda (no sale en la primera toma).",
      "O usa el atrás y el adelante del navegador: manda la URL (`?paso=`).",
      "Para cambiar de idioma, usa el selector de idioma de la barra superior.",
    ],
    reglas: [
      "Con el atrás o el adelante del navegador solo se abre una toma permitida (`pasoPermitido`): todas las obligatorias anteriores tienen que ser válidas; si no, se queda donde está.",
      "Lo ya escrito sale completo al volver: no se escribe otra vez.",
      "Suma el tiempo de la toma que deja.",
      "Cambiar de idioma conserva `?paso=` (p. ej. /en/welcome?paso=fandom) y las respuestas, que viven en la cuenta.",
    ],
    endpoints: ["onboarding.sumar-tiempo", "onboarding.ver-paso"],
    datos: DATOS_CUENTA,
    respuesta:
      "Sin sonido. Con «Atrás», la toma que sale funde (160 ms); con el atrás del navegador cambia sin fundido. En los dos casos el foco va a la toma que entra.",
    origen: [
      "components/onboarding/onboarding-flow.tsx:363",
      "components/onboarding/onboarding-flow.tsx:508",
      "components/onboarding/toma.tsx:297",
    ],
    relacionadas: ["onboarding.continuar-toma", "onboarding.editar-toma"],
  },
  {
    id: "onboarding.editar-toma",
    area: "onboarding",
    titulo: "Editar una toma ya respondida",
    resumen:
      "Salta directamente a una toma para cambiar la respuesta, desde el timeline, desde el resultado o desde Ajustes.",
    quien: ["clipero", "agencia"],
    donde: [
      { ruta: "/bienvenida", etiqueta: "Timeline «Tomas» (cada segmento)" },
      {
        ruta: "/bienvenida?paso=render",
        etiqueta: "Resultado · registro y «Lo que nos contaste» › «Editar»",
      },
      {
        ruta: "/ajustes?seccion=datos",
        etiqueta: "Ajustes › Tus datos › «Lo que nos contaste» › «Editar»",
      },
    ],
    pasos: [
      "En el timeline «Tomas», pulsa el segmento de una toma: su barra y su nombre hacen de botón.",
      "En el resultado, pulsa «Editar» junto a una línea del registro o de «Lo que nos contaste».",
      "En Ajustes › Tus datos, pulsa «Editar» junto a una respuesta de «Lo que nos contaste»: abre la bienvenida en esa toma (`/bienvenida?paso=…`).",
      "Cambia la respuesta y pulsa «Continuar».",
    ],
    reglas: [
      "Solo tomas del recorrido, nunca el resultado ni la toma en curso, y solo si todas las obligatorias anteriores son válidas (`puedeEditar`).",
      "Cada segmento pinta su estado (relleno si está respondida, con anillo la toma en curso, discontinuo si se saltó, gris si está pendiente) y lo dice al lector de pantalla: «Toma {n}, {paso}. {estado}». La saltada escribe «Saltada» también en pantalla.",
      "Desde Ajustes, la bienvenida se abre en esa toma solo si se puede (`pasoInicial`): si alguna obligatoria anterior no es válida, se abre en la que tenía abierta (si no la ha completado) o en la primera del recorrido.",
      "Editar no cambia el estado de la bienvenida: una completada sigue completada.",
      "Lo que se cambia se copia a Ajustes igual que en la bienvenida: país y plataformas de directo a Perfil; idiomas y temas a Público (hooks/use-cuenta.ts:577).",
    ],
    endpoints: ["onboarding.sumar-tiempo", "onboarding.ver-paso", "onboarding.responder"],
    datos: DATOS_CUENTA,
    respuesta: "Sin sonido: es navegación.",
    origen: [
      "components/onboarding/onboarding-flow.tsx:386",
      "components/onboarding/timeline-tomas.tsx:322",
      "components/onboarding/resultados/result-clipero.tsx:523",
      "components/app/privacy-settings.tsx:456",
    ],
    relacionadas: [
      "onboarding.volver-toma",
      "onboarding.ver-bienvenida-otra-vez",
      "cuenta.consultar-tus-datos",
    ],
  },
  {
    id: "onboarding.acelerar-texto",
    area: "onboarding",
    titulo: "Completar el texto que se escribe solo",
    resumen:
      "Quien tiene prisa hace que la pregunta salga entera; si lo hace en dos tomas seguidas, el resto de la bienvenida ya sale completa.",
    quien: ["clipero", "agencia"],
    donde: [{ ruta: "/bienvenida", etiqueta: "Cualquier toma" }],
    pasos: [
      "Mientras la pregunta se escribe palabra a palabra, toca la toma, pulsa cualquier tecla (Esc incluido) o pulsa «Continuar» una vez.",
      "En la primera toma, pulsa «Saltar intro».",
    ],
    reglas: [
      "Ritmo (`RITMO`): 300 ms antes de la primera palabra, 55 ms por palabra, +120 ms tras una coma y +200 ms tras un punto. Una frase se escribe en 900 ms como mucho sin contar la pausa (si no cabe, se comprime entera) y el saludo con la pregunta, en 1.500 ms (`TOPE_FRASES`).",
      "«Aprende la prisa»: dos tomas seguidas completadas a mano dan la animación por vista y el resto sale completo. Una toma que se deja escribir entera corta la racha.",
      "«Saltar intro» da la animación por vista al momento.",
      "Una toma ya vista sale completa.",
      "Con «reducir movimiento» el texto sigue apareciendo palabra a palabra, como karaoke de color.",
    ],
    endpoints: ["onboarding.actualizar"],
    datos: "`cuenta.onboarding.textoAcelerado` y `animacionVista`. " + DATOS_CUENTA,
    respuesta: "Sin sonido.",
    origen: [
      "components/onboarding/onboarding-flow.tsx:271",
      "components/onboarding/onboarding-flow.tsx:280",
      "components/onboarding/toma.tsx:181",
      "components/onboarding/toma.tsx:239",
      "lib/onboarding.ts:894",
      "hooks/use-cuenta.ts:794",
    ],
    relacionadas: ["onboarding.continuar-toma"],
  },
  {
    id: "onboarding.ver-tarjeta-perfil",
    area: "onboarding",
    titulo: "Ver cómo se monta tu tarjeta de perfil",
    resumen:
      "Mientras responde, una tarjeta 9:16 suma una capa con cada respuesta y enseña las campañas que ya encajan.",
    quien: ["clipero", "agencia"],
    donde: [
      {
        ruta: "/bienvenida",
        etiqueta: "Monitor (pantallas anchas) o barra «Ver tu tarjeta»",
      },
    ],
    pasos: [
      "En pantallas anchas, mira el monitor de la derecha: la tarjeta y, debajo, los segmentos de las tomas.",
      "En pantallas estrechas, pulsa la barra con sus iniciales para desplegar la tarjeta y otra vez para plegarla (el lector de pantalla la nombra «Ver tu tarjeta» y «Ocultar tu tarjeta»).",
    ],
    reglas: [
      "La barra plegada enseña sus temas (o su nombre), «Toma {n} de {total}» y «{n} campañas encajan contigo», y debajo los segmentos de las tomas; en la agencia no cuenta campañas.",
      "La tarjeta es la de su rama: clipero, creador o agencia.",
      "El monitor es decorativo para lectores de pantalla (`aria-hidden`): lo útil también está en la toma y en la región viva.",
    ],
    endpoints: ["onboarding.leer-respuestas", "campanas.listar"],
    datos: DATOS_CUENTA,
    respuesta: "La barra no suena (`data-sound=none`).",
    origen: [
      "components/onboarding/monitor.tsx:24",
      "components/onboarding/profile-card.tsx:585",
    ],
    relacionadas: ["onboarding.empezar-bienvenida"],
  },

  /* -------------------------------------------------------------------------
     Posponer y retomar
     ------------------------------------------------------------------------- */
  {
    id: "onboarding.posponer-bienvenida",
    area: "onboarding",
    titulo: "Dejar la bienvenida para luego («Hacerlo luego»)",
    resumen:
      "Sale de la bienvenida en cualquier toma: lo respondido se queda y se retoma donde lo dejó.",
    quien: ["clipero", "agencia"],
    donde: [{ ruta: "/bienvenida", etiqueta: "Barra superior · «Hacerlo luego»" }],
    pasos: [
      "Pulsa «Hacerlo luego» en la barra superior (sale en todas las tomas, no en el resultado).",
      "Aparece el aviso «Guardado. Lo retomas cuando quieras, desde donde lo dejaste.» y la app le lleva a su destino.",
    ],
    reglas: [
      "Destino: el `?next=` seguro, si lo había; si no, el de la rama: campañas → /campanas?orden=para-ti; mis videos → /subir; las dos cosas o sin objetivo → /dashboard; agencia → /campanas.",
      "Estado `pospuesto`, con la toma de abandono y la fecha. Una bienvenida ya completada no pasa a pospuesta.",
      "En la agencia, posponer no envía la solicitud.",
      "En esos destinos le espera la tarjeta «Termina tu perfil».",
      "Suma el tiempo de la toma.",
    ],
    estados: [
      { estado: "en-curso", significa: "Antes de pulsar." },
      {
        estado: "pospuesto",
        significa: "Después: se retoma desde la tarjeta «Termina tu perfil».",
      },
    ],
    endpoints: ["onboarding.sumar-tiempo", "onboarding.posponer"],
    datos: "`cuenta.onboarding.estado`, `pospuestoEn` y `pasoAbandono`. " + DATOS_CUENTA,
    respuesta: "`toast()` neutro, sin sonido: informa, no premia.",
    origen: [
      "components/onboarding/onboarding-flow.tsx:378",
      "components/onboarding/onboarding-flow.tsx:381",
      "hooks/use-cuenta.ts:798",
      "lib/onboarding.ts:492",
    ],
    relacionadas: ["onboarding.retomar-bienvenida"],
  },
  {
    id: "onboarding.retomar-bienvenida",
    area: "onboarding",
    titulo: "Retomar la bienvenida («Termina tu perfil»)",
    resumen: "Quien la dejó a medias ve cuánto le falta y vuelve a la toma donde estaba.",
    quien: ["clipero", "agencia"],
    donde: [
      { ruta: "/dashboard", etiqueta: "Tarjeta «Termina tu perfil» (botón naranja)" },
      { ruta: "/campanas", etiqueta: "Tarjeta «Termina tu perfil» (botón con borde)" },
      { ruta: "/subir", etiqueta: "Tarjeta «Termina tu perfil» (botón con borde)" },
    ],
    pasos: [
      "Mira la tarjeta «Termina tu perfil ({pct})»: barra de progreso, «Te quedan # tomas. Cuanto más sepamos, mejores campañas te enseñamos.», la precisión y «Te falta: …».",
      "Pulsa «Seguir donde lo dejé» («Empezar» si nunca empezó).",
      "La bienvenida se abre en esa toma, con lo ya respondido marcado.",
    ],
    reglas: [
      "Sale solo cuando el navegador ya leyó la cuenta y la bienvenida no está completada; se va sola al completarla.",
      "Lleva a `pasoActual` o, si no hay, a `pasoAbandono` (`/bienvenida?paso=…`); sin empezar, a /bienvenida.",
      "Tomas pendientes: las del recorrido que no están respondidas (una saltada también cuenta), sin contar el resultado.",
      "Completitud de 0 a 100 (`PESOS_COMPLETITUD`). Clipero: temas 20, redes 15, cuenta conectada 20, creadores 15, país e idiomas 10, tamaño de la cuenta 10, experiencia 10. Creador: plataformas y frecuencia 25, temas del canal 20, enlace 15, redes 15, país e idiomas 10, cuenta conectada 15. Una red conectada en Ajustes cuenta aunque no se haya declarado.",
      "Precisión: baja por debajo de 40, media de 40 a 69, alta desde 70.",
      "Naranja solo en el panel; en campañas y subir va con borde, porque cada vista tiene una sola acción naranja.",
      "Si la bienvenida estaba pospuesta, el inicio se registra con el origen `retomar`.",
    ],
    estados: [
      { estado: "sin-empezar", significa: "La tarjeta dice «Empezar»." },
      {
        estado: "en-curso · pospuesto",
        significa: "La tarjeta dice «Seguir donde lo dejé».",
      },
      { estado: "completado", significa: "La tarjeta no sale." },
    ],
    endpoints: [
      "onboarding.leer",
      "onboarding.leer-respuestas",
      "onboarding.iniciar",
      "onboarding.ver-paso",
    ],
    datos: DATOS_CUENTA,
    respuesta:
      "En el panel «Seguir donde lo dejé» es el botón naranja: suena «pop» y se encuadra con la marca de recorte. En campañas y subir no suena.",
    origen: [
      "components/onboarding/profile-progress-card.tsx:27",
      "components/onboarding/profile-progress-card.tsx:42",
      "components/onboarding/profile-progress-card.tsx:55",
      "app/[locale]/(app)/dashboard/page.tsx:64",
      "app/[locale]/(app)/campanas/page.tsx:32",
      "app/[locale]/(app)/subir/page.tsx:43",
      "lib/onboarding.ts:1002",
      "lib/onboarding.ts:1143",
    ],
    relacionadas: ["onboarding.posponer-bienvenida", "onboarding.empezar-bienvenida"],
  },

  /* -------------------------------------------------------------------------
     El resultado
     ------------------------------------------------------------------------- */
  {
    id: "onboarding.ver-resultado-clipero",
    area: "onboarding",
    titulo: "Ver tu primer corte (resultado del clipero)",
    resumen:
      "Al terminar las tomas, un registro con sus datos reales monta el resultado: campañas para él con su motivo, cómo se cobra, su primera misión y su tarjeta.",
    quien: ["clipero"],
    plan: {
      nota: "Entrar en una campaña es del plan Creador en adelante (`PLAN_MINIMO.participarCampanas`). Con Prueba el resultado enseña igual las campañas, pero avisa «Necesitas el plan Creador para entrar en una campaña.», y la primera misión no le pide unirse ni enviar.",
    },
    donde: [
      {
        ruta: "/bienvenida?paso=render",
        etiqueta: "Resultado «Tu primer corte está listo.» (campañas y las dos cosas)",
      },
    ],
    pasos: [
      "Tras «Continuar» en «País e idiomas» sale «Tu primer corte está listo.» y un registro que se escribe solo: T01 «Leyendo tus temas: …», T02 «Buscando campañas en {idiomas} para {redes}» con cuántas encajan, T03 «Tu radar: …» y T04 «Tu wallet: en {pais} cobras con {metodos}», cada línea con «Editar».",
      "Para no esperar, pulsa «Ver resultado ya».",
      "Revisa «Para ti»: 3 campañas, cada una con «Por qué la ves: …».",
      "Elige: «Ver mis campañas» (o «Continuar» si venía con destino), «Subir mi primer video» (si eligió las dos cosas), «Ver tus clips» (si ya tiene proyectos listos) o «Ir al panel».",
      "Más abajo: «Cómo se cobra» con la calculadora, «Primera misión», «Tu tarjeta de clipero», «Dos cosas más (opcional)» y «Lo que nos contaste».",
    ],
    reglas: [
      "El registro avanza una línea cada 450 ms y nunca pasa de 2,4 s en total (`TOPE_RENDER_MS`); solo salen las líneas de tomas de su recorrido. Un resultado ya visto sale terminado.",
      "Al terminar se completa la bienvenida y se celebra una sola vez por cuenta; la región viva anuncia una vez «Perfil listo: # campañas encajan contigo.»",
      "«Para ti» son las 3 primeras de la recomendación (`recomendarCampanas`), hecha solo con las campañas que comparten alguna red con su plan (con Prueba, TikTok): solo campañas que aceptan envíos, públicas o privadas ya desbloqueadas, que comparten alguna red con las que declaró, de sus idiomas y países, sin etiquetas que no tolera y, si son reguladas o solo para verificados, con la cuenta verificada. Puntos: +3 por tema, +2 si su creador está en su radar, +1 por red en común (máx. 2), +1 si es destacada, +1 con el 50 % o más del presupuesto por gastar.",
      "Si ninguna encaja con sus temas pero hay temas vecinos: «Mientras llegan campañas de {vertical}, estas de {adyacente} encajan contigo.»; si no hay nada: «Te avisamos en cuanto salga una.»",
      "«Cómo se cobra» usa la primera campaña de «Para ti» y la regla real (`pagoPorVideo`): por debajo del mínimo de vistas no cobra nada; desde ahí, CPM por cada 1.000 vistas, sin pasar del tope por video ni de lo que quede de presupuesto. Las vistas del ejemplo (`vistasEjemplo`) son 4 veces el mínimo o 20.000, lo que sea mayor, sin pasar de las que llevan al tope. Con la semilla «Liga de las Estrellas: temporada de otoño» (CPM 0,72, mínimo 5.000 vistas, tope del 4 % de 3.600 = 144): con 20.000 vistas cobraría 14,40.",
      "«Ver tus clips» solo sale si tiene algún proyecto listo, y lleva al último.",
      "«Dos cosas más» sale abierto en escritorio (64 rem o más) y plegado en móvil.",
    ],
    errores: [
      {
        codigo: "planInsuficiente",
        cuando:
          "Su plan (Prueba) no deja entrar en campañas: se avisa, no se bloquea el resultado.",
        frase: "campaigns.participation.errors.planInsuficiente",
        bloquea: false,
      },
    ],
    endpoints: [
      "onboarding.completar",
      "onboarding.actualizar",
      "campanas.listar",
      "campanas.listar-envios",
      "proyectos.listar",
    ],
    datos:
      "Se calcula en el navegador con las respuestas de la cuenta y las campañas y envíos del almacén de campañas (`hooks/use-campanas.ts`, con los envíos se liquida el presupuesto); los proyectos salen de la frontera `listJobs` (GET /jobs).",
    respuesta:
      "`toast.celebrate` «Tu perfil está listo» · «# campañas encajan contigo.»: arpegio y confeti de esquinas de recorte que sale del icono del aviso, una sola vez por cuenta. Las ✓ del registro saltan; con «reducir movimiento» las líneas funden escalonadas 80 ms y la ✓ funde. «Ver mis campañas» es la única acción naranja: suena «pop» y se encuadra.",
    origen: [
      "components/onboarding/resultados/result-clipero.tsx:86",
      "components/onboarding/resultados/render-log.tsx:13",
      "components/onboarding/resultados/render-log.tsx:178",
      "components/onboarding/onboarding-flow.tsx:395",
      "components/onboarding/resultados/result-clipero.tsx:234",
      "components/onboarding/resultados/result-clipero.tsx:288",
      "lib/recomendacion.ts:132",
      "lib/campanas.ts:276",
      "lib/campanas.ts:399",
      "components/onboarding/resultados/ver-tus-clips.tsx:26",
    ],
    relacionadas: [
      "onboarding.activar-permisos-resultado",
      "onboarding.contar-como-llegaste",
      "onboarding.seguir-misiones",
      "onboarding.editar-toma",
    ],
  },
  {
    id: "onboarding.ver-resultado-creador",
    area: "onboarding",
    titulo: "Ver tu primer corte (resultado del creador)",
    resumen:
      "Quien viene a recortar sus videos ve lo que se le ha dejado listo, cuántos minutos subiría y qué plan lo cubre, y sale a subir su primer video.",
    quien: ["clipero"],
    plan: {
      nota: "La previsión nombra el primer plan visible del catálogo cuyos minutos cubren los suyos (`planParaMinutos`); con la semilla, Prueba 60, Creador 600 y Empresa 600 minutos al mes (`MINUTOS_INCLUIDOS`). Si ninguno llega, nombra el último visible y dice que se puede ampliar. Aquí nada se bloquea: solo se informa, con «Ver precios».",
    },
    donde: [
      { ruta: "/bienvenida?paso=render", etiqueta: "Resultado de la rama «mis videos»" },
    ],
    pasos: [
      "Tras «País e idiomas» sale «Tu primer corte está listo.» y el registro: «Preparando la importación desde {plataformas}» (o «Preparando la subida de tus videos»), «Calculando tu ritmo: unos {min} minutos al mes», «Ajustando subtítulos y plantillas para {temas}» (con su marca de agua, si la tiene) y «Formatos para {redes}: {formatos}».",
      "Pulsa «Subir mi primer video» (o «Continuar» si venía con destino), «Ver tus clips» o «Ir al panel».",
      "Lee «Tu previsión» y, si quiere, «Ver precios».",
      "Si en «Tu canal» dijo «Sí, cuéntame», le espera «Pide el perfil de agencia».",
      "Más abajo: «Tu tarjeta de creador» («Tu perfil está al {pct}. Conecta tus redes para completarlo.»), «Dos cosas más (opcional)» —aquí solo los dos permisos, siempre desplegados y sin «¿Cómo llegaste a Clipealo?»— y «Lo que nos contaste».",
    ],
    reglas: [
      "Bajo el botón: «Pega el enlace de tu VOD de {plataforma} y lo recortamos en clips para cada red.» (la plataforma de su enlace o la primera que marcó) o, sin directos, «Arrastra tus videos y los recortamos en clips para cada red.»",
      "Previsión con `minutosPrevistos`. «1 o 2 por semana» de 3 a 6 h → unos 522 minutos: «El plan Creador incluye 600 minutos al mes.» Casi a diario de 1 a 3 h → unos 929: ningún plan de la semilla llega y dice «El plan Empresa incluye 600 minutos al mes y se puede ampliar.»",
      "Mismo registro, cierre y celebración que el del clipero: 450 ms por línea, 2,4 s como mucho, una sola celebración por cuenta; la región viva dice «Perfil listo: ya puedes subir tu primer video.»",
      "Sin misiones: quien solo recorta sus videos no tiene ninguna de campañas.",
    ],
    endpoints: [
      "onboarding.completar",
      "onboarding.actualizar",
      "planes.listar",
      "proyectos.listar",
    ],
    datos:
      "Respuestas de `cuenta.creador` y `cuenta.clipero.redes`; el catálogo de planes (`useCatalogoPlanes`, `lib/planes.ts`, editable desde el backoffice); proyectos de la frontera `listJobs` (GET /jobs).",
    respuesta:
      "El mismo `toast.celebrate` «Tu perfil está listo», una sola vez por cuenta. «Subir mi primer video» es la acción naranja: suena «pop» y se encuadra; «Ver precios» es un enlace, sin sonido.",
    origen: [
      "components/onboarding/resultados/result-creador.tsx:122",
      "components/onboarding/resultados/result-creador.tsx:257",
      "components/onboarding/resultados/result-creador.tsx:333",
      "lib/planes.ts:659",
      "lib/pricing.ts:159",
      "lib/onboarding.ts:1200",
    ],
    relacionadas: [
      "onboarding.preparar-solicitud-agencia",
      "onboarding.activar-permisos-resultado",
      "onboarding.elegir-plataformas-directo",
    ],
  },
  {
    id: "onboarding.activar-permisos-resultado",
    area: "onboarding",
    titulo: "Activar los permisos opcionales del resultado",
    resumen:
      "En «Dos cosas más (opcional)», decide si cuenta en los informes de sector y si recibe novedades por correo.",
    quien: ["clipero"],
    donde: [
      {
        ruta: "/bienvenida?paso=render",
        etiqueta: "Resultado › «Dos cosas más (opcional)»",
      },
    ],
    pasos: [
      "En el resultado del clipero, despliega «Dos cosas más (opcional)» si está plegado (en móvil); en el del creador está siempre abierto.",
      "Enciende o apaga «Contar conmigo en los informes de sector» («Sumamos tus respuestas a las de al menos 49 personas más… Nadie puede verte ahí.»).",
      "Enciende o apaga «Novedades y consejos por correo» («Uno o dos al mes. Te das de baja con un clic.»).",
    ],
    reglas: [
      "Los dos vienen apagados (`VALOR_POR_DEFECTO`).",
      "Cada cambio añade una entrada al registro de consentimientos (finalidades `informes-sector` y `novedades-correo`, origen `onboarding`, con la clave exacta del texto); lo que se ve es el valor vigente.",
      "En los informes nadie cuenta en grupos de menos de 50 personas (`UMBRAL_PUBLICO`).",
      "Se cambian después en Ajustes › Tus datos.",
    ],
    endpoints: ["onboarding.consentir"],
    datos: "Registro `cuenta.consentimientos` (solo se añaden entradas).",
    respuesta:
      "El interruptor suena al encender y al apagar (`toggle-on` / `toggle-off`). Sin aviso.",
    origen: [
      "components/onboarding/resultados/result-clipero.tsx:373",
      "components/onboarding/resultados/result-creador.tsx:305",
      "components/onboarding/permisos.tsx:58",
      "lib/privacidad.ts:62",
      "lib/privacidad.ts:138",
    ],
    relacionadas: ["onboarding.ver-resultado-clipero", "onboarding.contar-como-llegaste"],
  },
  {
    id: "onboarding.contar-como-llegaste",
    area: "onboarding",
    titulo: "Contar cómo llegaste a Clipealo",
    resumen:
      "Un texto corto y unos chips opcionales para saber de dónde viene cada persona.",
    quien: ["clipero"],
    donde: [
      {
        ruta: "/bienvenida?paso=render",
        etiqueta: "Resultado del clipero › «Dos cosas más (opcional)»",
      },
    ],
    pasos: [
      "Escribe en «¿Cómo llegaste a Clipealo? (opcional)» («Un video, un amigo, un anuncio…»).",
      "Y, si quiere, marca chips: Un video de un creador, Me lo contó alguien, TikTok, Instagram, YouTube, Un anuncio, Buscando en internet, Un evento u Otro.",
    ],
    reglas: [
      "Texto de hasta 120 caracteres, con el contador «{n} de 120».",
      "Los chips van barajados de forma estable con su correo (siempre el mismo orden para esa persona) y «Otro» va siempre el último. Ninguno viene marcado.",
      "Se guarda mientras escribe; sin texto ni chips, se borra la respuesta.",
      "El texto se guarda 12 meses; después solo queda la categoría (los chips).",
      "Sale en el resultado del clipero (campañas o las dos cosas), no en el del creador. La agencia tiene el mismo campo en su resultado (área agencias).",
    ],
    endpoints: ["onboarding.responder"],
    datos: "`cuenta.clipero.comoNosConociste` (`{ texto?, chips }`).",
    respuesta: "Los chips hacen «tap» al marcar; el campo de texto no suena.",
    origen: [
      "components/onboarding/resultados/como-llegaste.tsx:41",
      "components/onboarding/resultados/como-llegaste.tsx:50",
      "lib/onboarding.ts:1336",
      "lib/privacidad.ts:161",
    ],
    relacionadas: ["onboarding.activar-permisos-resultado"],
  },
  {
    id: "onboarding.preparar-solicitud-agencia",
    area: "onboarding",
    titulo: "Preparar la solicitud de agencia desde el resultado del creador",
    resumen:
      "El creador que quiere que otros cliperos le recorten abre la solicitud de agencia con su nombre, su canal y sus temas ya puestos.",
    quien: ["clipero"],
    donde: [
      {
        ruta: "/bienvenida?paso=render",
        etiqueta: "Resultado del creador › «Pide el perfil de agencia»",
      },
    ],
    pasos: [
      "En la tarjeta «Pide el perfil de agencia» («Lanza tu propia campaña y deja que otros cliperos recorten tus directos: solo pagas por vistas…»), pulsa «Preparar la solicitud».",
      "Se abre /bienvenida?tipo=agencia&origen=gate con las respuestas adelantadas; sigue en las tomas de agencia.",
    ],
    reglas: [
      "Solo sale si en «Tu canal» respondió «Sí, cuéntame», y nunca si ya es agencia o tiene una solicitud pendiente.",
      "Adelanta, como `inferido` y sin pisar nada que la agencia ya tenga: el tipo de organización «Soy streamer o creador» (`streamer-creador`), su nombre como organización (si tiene 2 caracteres o más, recortado a 60), el canal de su enlace y hasta 3 temas del canal como temas del material.",
      "Las tomas de agencia y el envío de la solicitud son del área agencias.",
    ],
    endpoints: ["onboarding.responder"],
    datos: "Escribe en `cuenta.agencia` con `fuente: inferido`.",
    respuesta: "Botón con borde: no suena.",
    origen: [
      "components/onboarding/resultados/result-creador.tsx:73",
      "components/onboarding/resultados/result-creador.tsx:383",
      "components/onboarding/resultados/result-creador.tsx:385",
    ],
    relacionadas: ["onboarding.describir-canal", "onboarding.ver-resultado-creador"],
  },
  {
    id: "onboarding.completar-modo-expres",
    area: "onboarding",
    titulo: "Pasar la bienvenida exprés al entrar con un código",
    resumen:
      "Quien entra en una campaña privada sin haber terminado la bienvenida contesta solo dos tomas y vuelve a la campaña.",
    quien: ["clipero"],
    donde: [
      { ruta: "/campanas", etiqueta: "«Código de acceso» › «Entrar»" },
      {
        ruta: "/campanas/[id]",
        etiqueta: "Ficha de una campaña privada aún bloqueada › «Código de acceso»",
      },
      { ruta: "/bienvenida?modo=expres", etiqueta: "Bienvenida exprés" },
    ],
    pasos: [
      "En /campanas pulsa «Código de acceso» (o abre un enlace con `?codigo=`, que abre el diálogo con el código puesto), escribe el código —p. ej. LUMN-2026— y pulsa «Entrar».",
      "Si su bienvenida no está completada, va a /bienvenida?modo=expres&tipo=clipero&origen=invitacion&next=/campanas/{id}.",
      "Contesta «Tus redes» y «País e idiomas» (y «Tu cuenta» solo si le falta algo).",
      "Sale «Listo. Te llevamos a «{campaña}».» y vuelve sola a la campaña; «Continuar» lo hace sin esperar.",
    ],
    reglas: [
      "Se activa cuando la bienvenida no está completada (`necesitaExpres`).",
      "A una campaña se entra como clipero, aunque la cuenta pidiera agencia (`tipo=clipero`).",
      "Dos tomas por diseño: «Tu cuenta» solo entra si de verdad falta el tipo, los 18 años o los términos.",
      "El render corto espera 1.400 ms antes de volver a la campaña.",
      "Si no tenía temas, guarda el de la campaña como `inferido` (Tecnología e IA en «Lanzamiento privado de Lumen»). El resto de preguntas queda para el perfilado progresivo.",
      "Si la campaña del `next` no está entre las que ve la bienvenida (no existe, o no comparte ninguna red con su plan), lleva a /campanas en vez de a una ficha que no está.",
      "Al llegar al render corto, la bienvenida queda completada.",
    ],
    endpoints: [
      "campanas.desbloquear",
      "onboarding.iniciar",
      "onboarding.responder",
      "onboarding.responder-paso",
      "onboarding.completar",
      "campanas.listar",
    ],
    datos: DATOS_CUENTA + " El modo va en la URL (`?modo=expres`).",
    respuesta:
      "Al entrar el código, `toast.celebrate` «Campaña desbloqueada» (área campañas). Al terminar el exprés, si es la primera vez, `toast.celebrate` «Tu perfil está listo». «Continuar» es naranja: «pop» y marca de recorte.",
    origen: [
      "components/campanas/access-code-dialog.tsx:82",
      "lib/invitacion.ts:12",
      "lib/invitacion.ts:22",
      "lib/onboarding.ts:445",
      "components/onboarding/resultados/result-expres.tsx:14",
      "components/onboarding/resultados/result-expres.tsx:35",
      "components/onboarding/resultados/result-expres.tsx:40",
    ],
    relacionadas: ["onboarding.elegir-redes", "onboarding.elegir-pais-idiomas"],
  },
  {
    id: "onboarding.ver-bienvenida-otra-vez",
    area: "onboarding",
    titulo: "Ver la bienvenida otra vez",
    resumen:
      "Desde Ajustes › Tus datos, repasa sus tomas con lo ya elegido y cambia lo que quiera.",
    quien: ["clipero", "agencia"],
    donde: [
      {
        ruta: "/ajustes?seccion=datos",
        etiqueta: "Ajustes › Tus datos › «Ver la bienvenida»",
      },
    ],
    pasos: [
      "En Ajustes › Tus datos, bajo la completitud y la precisión, pulsa «Ver la bienvenida» («Repasa tus tomas con lo que ya elegiste y cambia lo que quieras.»).",
      "Recorre las tomas: las preguntas se escriben otra vez y sus respuestas siguen marcadas.",
    ],
    reglas: [
      "Vacía las tomas vistas y quita la marca de animación vista: el texto se vuelve a escribir.",
      "No borra respuestas ni cambia el estado: una bienvenida completada sigue completada y se abre en su primera toma; una a medias se abre donde la dejó.",
      "Borrar las respuestas es otra acción de Ajustes › Tus datos («Borrar mis respuestas», área cuenta).",
    ],
    endpoints: ["onboarding.repetir", "onboarding.ver-paso"],
    datos: "`cuenta.onboarding.pasosVistos` y `animacionVista`. " + DATOS_CUENTA,
    respuesta: "Botón con borde: sin sonido.",
    origen: [
      "components/app/privacy-settings.tsx:128",
      "hooks/use-cuenta.ts:908",
      "components/onboarding/onboarding-flow.tsx:121",
    ],
    relacionadas: [
      "onboarding.editar-toma",
      "onboarding.acelerar-texto",
      "cuenta.borrar-respuestas",
    ],
  },

  /* -------------------------------------------------------------------------
     Micropreguntas (perfilado progresivo)
     ------------------------------------------------------------------------- */
  {
    id: "onboarding.responder-micropregunta",
    area: "onboarding",
    titulo: "Responder una micropregunta",
    resumen:
      "Lo que no se pregunta en el alta se pregunta cuando sirve, de una en una: en el panel o al subir un clip.",
    quien: ["clipero"],
    plan: {
      nota: "Solo la línea de «Subir clip» depende del plan: ese diálogo se abre desde el plan Creador (`PLAN_MINIMO.participarCampanas`); con Prueba el botón sale apagado. Las del panel no dependen del plan.",
    },
    donde: [
      { ruta: "/dashboard", etiqueta: "Tarjeta «Una pregunta rápida» del panel" },
      { ruta: "/campanas/[id]", etiqueta: "Línea dentro del diálogo «Subir clip»" },
      {
        ruta: "/campanas",
        etiqueta: "Línea dentro del diálogo «Subir clip» de una tarjeta de campaña",
      },
    ],
    pasos: [
      "Cuando toca, sale «Una pregunta rápida» con la pregunta, su «Para qué» y ⓘ «Tus datos».",
      "Elige una opción (o varias) y pulsa «Guardar».",
      "Queda una línea con lo que cambia (p. ej. «Guardado. Te daremos consejos de tu nivel.») y el foco en ella.",
    ],
    reglas: [
      "Cuándo sale cada una (`candidatasMicro`): «¿Cuánto has editado antes?» dentro de «Subir clip», mientras no la haya respondido. En el panel: «¿Qué ligas / qué música / qué directos te gusta clipear?» tras su primer clip aprobado en Deportes, Música o Directos y charlas; «¿Cuántas horas a la semana le dedicas a clipear?» desde el tercer envío; «¿Qué te frena?» cuando pasan 7 días desde su último envío sin haberla respondido después; «¿Qué buscas en Clipealo?» desde el día 7 del alta; «¿Con qué editas además de Clipealo?» desde el día 14; «¿Sigues clipeando {temas}?» a los 180 días de elegirlos.",
      "Solo para cliperos. Las del panel, solo con la bienvenida completada: antes se le pide terminarla.",
      "Como mucho una por sesión y una cada 3 días (`REGLAS_MICRO`); sale la primera disponible en el orden del catálogo. El admin puede apagarlas, moverlas de sitio, reordenarlas y cambiar sus umbrales; de esos umbrales la app lee todos menos `diasPospuesta` y `maxSubverticales`, que siguen en 7 y 3.",
      "Se da por enseñada al salir (`verMicro`): desde ahí cuentan los 3 días, se responda o no. Si vuelve a salir en la misma sesión, es la misma y no cuenta otra vez.",
      "Límites: ligas, géneros y formatos, hasta 3; motivaciones, hasta 2; en herramientas, «Ninguna» excluye al resto. «Guardar» se activa con al menos una opción.",
      "Si responde «Nunca he editado», le ofrece «Ver la guía de 2 minutos» (/ayuda).",
      "Lo respondido va a la cuenta como `declarado`. Lo que se puede medir no se pregunta.",
    ],
    estados: [
      { estado: "abierta", significa: "Esperando respuesta." },
      { estado: "respondida", significa: "Guardada; queda la línea de cierre." },
      { estado: "pospuesta", significa: "«Ahora no»: vuelve en 7 días." },
      { estado: "descartada", significa: "«No volver a preguntar»." },
    ],
    endpoints: [
      "onboarding.listar-micropreguntas",
      "onboarding.ver-micropregunta",
      "onboarding.responder",
    ],
    datos:
      "`cuenta.microPreguntas` (`ultimaEn`, `pospuestas`, `descartadas`) y el campo que responde cada una (`clipero.experiencia`, `clipero.subverticales`, `clipero.disponibilidad`…). «Una por sesión» va en `sessionStorage` (`clipealo-micro-sesion`). El catálogo, en `clipealo-micro-catalogo-v1`.",
    respuesta:
      "No suenan ni celebran: las opciones van en silencio y el cierre es una línea que funde (240 ms), sin aviso.",
    origen: [
      "components/onboarding/micro-question.tsx:105",
      "components/onboarding/micro-question.tsx:154",
      "components/onboarding/micro-question.tsx:464",
      "lib/micro-preguntas.ts:204",
      "lib/micro-preguntas.ts:359",
      "lib/micro-preguntas.ts:87",
      "app/[locale]/(app)/dashboard/page.tsx:120",
      "components/campanas/submit-clip-dialog.tsx:333",
    ],
    relacionadas: [
      "onboarding.posponer-micropregunta",
      "onboarding.descartar-micropregunta",
      "onboarding.confirmar-temas",
      "onboarding.responder-pregunta-creada",
    ],
  },
  {
    id: "onboarding.responder-pregunta-creada",
    area: "onboarding",
    titulo: "Responder una pregunta escrita por el equipo",
    resumen:
      "Las preguntas nuevas que el admin escribe en el backoffice salen igual que las micropreguntas y su respuesta se guarda aparte.",
    quien: ["clipero"],
    donde: [
      { ruta: "/dashboard", etiqueta: "Tarjeta «Una pregunta rápida» del panel" },
      { ruta: "/campanas/[id]", etiqueta: "Línea dentro del diálogo «Subir clip»" },
      {
        ruta: "/campanas",
        etiqueta: "Línea dentro del diálogo «Subir clip» de una tarjeta de campaña",
      },
    ],
    pasos: [
      "Lee la pregunta y su ayuda, tal como las escribió el equipo (p. ej. «¿Qué es lo que más te cuesta al montar un clip?»).",
      "Elige una opción (o varias, si la pregunta lo admite) y pulsa «Guardar».",
      "Queda la línea «Anotado. Gracias por contestar.»",
    ],
    reglas: [
      "Salen desde el día que diga la pregunta tras el alta (`desdeAltaDias`), en su lugar (panel o «Subir clip») y en su orden, mientras no estén respondidas; comparten la regla de una por sesión y una cada 3 días. Como las demás, solo para cliperos, y las del panel solo con la bienvenida completada.",
      "Van en el idioma en que se escribieron: no se traducen. Solo el armazón («Guardar», «Ahora no», «No volver a preguntar») sigue el idioma de la interfaz.",
      "Respuesta única o varias, hasta su máximo; «Guardar» se activa con al menos una.",
      "Una pregunta apagada deja de salir sin borrar lo respondido.",
    ],
    endpoints: [
      "onboarding.listar-micropreguntas",
      "onboarding.ver-micropregunta",
      "onboarding.responder-libre",
    ],
    datos: "`cuenta.respuestasLibres` (id de la pregunta → opciones marcadas).",
    respuesta: "En silencio, como las micropreguntas: sin sonido ni aviso.",
    origen: [
      "components/onboarding/micro-question.tsx:674",
      "components/onboarding/micro-question.tsx:800",
      "lib/micro-preguntas.ts:301",
      "lib/micro-catalogo.ts:39",
    ],
    relacionadas: [
      "onboarding.responder-micropregunta",
      "onboarding.posponer-micropregunta",
      "onboarding.descartar-micropregunta",
    ],
  },
  {
    id: "onboarding.posponer-micropregunta",
    area: "onboarding",
    titulo: "Posponer una micropregunta («Ahora no»)",
    resumen: "Aparta la pregunta por unos días sin responderla.",
    quien: ["clipero"],
    donde: [
      { ruta: "/dashboard", etiqueta: "Tarjeta «Una pregunta rápida» › «Ahora no»" },
      { ruta: "/campanas/[id]", etiqueta: "«Subir clip» › «Ahora no»" },
      { ruta: "/campanas", etiqueta: "«Subir clip» de una tarjeta › «Ahora no»" },
    ],
    pasos: [
      "Pulsa «Ahora no».",
      "Queda la línea «Vale. Te lo preguntamos dentro de unos días.»",
    ],
    reglas: [
      "Vuelve a salir a los 7 días (`DIAS_MICRO_POSPUESTA`). El catálogo tiene `reglas.diasPospuesta`, que el admin puede poner entre 1 y 90, pero «Ahora no» no lo lee: aplica siempre los 7 días.",
      "Ya contaba como la pregunta de la sesión desde que salió; además reinicia la espera de 3 días entre preguntas.",
    ],
    endpoints: ["onboarding.posponer-micropregunta"],
    datos: "`cuenta.microPreguntas.pospuestas` (id → fecha a partir de la que vuelve).",
    respuesta: "Sin sonido ni aviso: una línea que funde.",
    origen: [
      "components/onboarding/micro-question.tsx:638",
      "hooks/use-cuenta.ts:131",
      "hooks/use-cuenta.ts:926",
    ],
    relacionadas: [
      "onboarding.responder-micropregunta",
      "onboarding.descartar-micropregunta",
    ],
  },
  {
    id: "onboarding.descartar-micropregunta",
    area: "onboarding",
    titulo: "No volver a preguntar una micropregunta",
    resumen: "Descarta la pregunta para siempre.",
    quien: ["clipero"],
    donde: [
      {
        ruta: "/dashboard",
        etiqueta: "Tarjeta «Una pregunta rápida» › «No volver a preguntar»",
      },
      { ruta: "/campanas/[id]", etiqueta: "«Subir clip» › «No volver a preguntar»" },
      {
        ruta: "/campanas",
        etiqueta: "«Subir clip» de una tarjeta › «No volver a preguntar»",
      },
    ],
    pasos: [
      "Pulsa «No volver a preguntar».",
      "Queda la línea «Hecho. No te lo volveremos a preguntar.»",
    ],
    reglas: [
      "Una descartada no vuelve a salir nunca, aunque se cumpla lo que la dispara (`microDisponible`).",
      "Si estaba pospuesta, deja de estarlo. Como «Ahora no», reinicia la espera de 3 días entre preguntas.",
    ],
    endpoints: ["onboarding.descartar-micropregunta"],
    datos: "`cuenta.microPreguntas.descartadas`.",
    respuesta: "Sin sonido ni aviso: una línea que funde.",
    origen: [
      "components/onboarding/micro-question.tsx:650",
      "hooks/use-cuenta.ts:941",
      "lib/micro-preguntas.ts:328",
    ],
    relacionadas: [
      "onboarding.responder-micropregunta",
      "onboarding.posponer-micropregunta",
    ],
  },
  {
    id: "onboarding.confirmar-temas",
    area: "onboarding",
    titulo: "Confirmar que sigues clipeando tus temas",
    resumen:
      "A los 180 días de elegir sus temas, el panel le pregunta si siguen valiendo.",
    quien: ["clipero"],
    donde: [
      {
        ruta: "/dashboard",
        etiqueta: "Tarjeta «Una pregunta rápida» · «¿Sigues clipeando…?»",
      },
    ],
    pasos: [
      "En el panel sale «¿Sigues clipeando {temas}?» («Elegiste esos temas hace más de 6 meses. Así tu feed sigue al día.»).",
      "Pulsa «Sí, sigo» para dejarlos como están, o «Cambiar mis temas» para ir a la toma «Tus temas» (/bienvenida?paso=nichos).",
    ],
    reglas: [
      "Sale a los 180 días (`diasRevalidar`, que el admin puede poner entre 30 y 730) desde la fecha en que respondió sus temas, y solo si tiene temas (no con «Aún no lo sé»). Sigue las reglas de toda micropregunta: bienvenida completada, una por sesión y una cada 3 días.",
      "«Sí, sigo» vuelve a guardar los mismos temas: la fecha se pone al día y la pregunta no vuelve hasta que pasen otra vez esos días.",
      "También admite «Ahora no» y «No volver a preguntar».",
    ],
    endpoints: ["onboarding.ver-micropregunta", "onboarding.responder"],
    datos: "`cuenta.clipero.verticales` y su `meta.en`.",
    respuesta: "Queda «Perfecto: tu feed sigue igual.» en una línea, sin sonido.",
    origen: [
      "components/onboarding/micro-question.tsx:507",
      "components/onboarding/micro-question.tsx:621",
      "lib/micro-preguntas.ts:285",
    ],
    relacionadas: ["onboarding.elegir-temas", "onboarding.responder-micropregunta"],
  },
  {
    id: "onboarding.completar-requisitos-campana",
    area: "onboarding",
    titulo: "Completar lo que falta para entrar en una campaña",
    resumen:
      "Antes de solicitar entrar o de subir un clip, se piden las redes, el país y los idiomas que falten: sin eso no se le pueden enseñar campañas que pueda aceptar ni decirle cómo cobra.",
    quien: ["clipero"],
    plan: {
      minimo: "creator",
      nota: "Solo se llega con un plan que participa en campañas (`PLAN_MINIMO.participarCampanas` = Creador): con Prueba, «Solicitar entrar» y «Subir clip» salen apagados con el aviso del plan y el diálogo no se abre.",
    },
    donde: [
      {
        ruta: "/campanas/[id]",
        etiqueta: "«Solicitar entrar» y «Subir clip» › «Antes de enviar tu primer clip»",
      },
      {
        ruta: "/campanas",
        etiqueta: "Tarjeta de campaña › «Solicitar entrar» o «Subir clip»",
      },
    ],
    pasos: [
      "Pulsa «Solicitar entrar» o «Subir clip» en una campaña.",
      "Si falta algo, el diálogo empieza por «Antes de enviar tu primer clip» (p. ej. «Nos faltan dónde publicas, tu país y los idiomas de tus clips. Sin eso no podemos enseñarte campañas que puedas aceptar ni decirte cómo cobrar.»: nombra solo lo que falta).",
      "Rellena solo lo que falta: «¿Dónde publicas tus clips?», «¿Desde dónde clipeas?» y/o «Idiomas de tus clips» (hasta 3).",
      "Pulsa «Guardar y continuar»: sigue el formulario de la campaña.",
    ],
    reglas: [
      "Es obligatorio: no tiene «Ahora no».",
      "Misma validación que las tomas «Tus redes» y «País e idiomas» (`requisitosQueFaltan`).",
      "Los idiomas vienen con los de la cuenta o, si no hay, con el de la interfaz.",
      "Se guarda en la cuenta al pulsar: Ajustes y el feed «Para ti» lo ven enseguida.",
      "Los campos que se piden no cambian mientras se rellenan.",
      "Se pregunta con la cuenta ya leída del navegador; una vez guardado, el mismo diálogo no lo vuelve a pedir.",
    ],
    errores: [
      {
        codigo: "sinRedes",
        cuando: "No marca ninguna red.",
        frase: "onboarding.errors.sinRedes",
        bloquea: true,
      },
      {
        codigo: "sinPais",
        cuando: "No elige país.",
        frase: "onboarding.errors.sinPais",
        bloquea: true,
      },
      {
        codigo: "sinIdiomas",
        cuando: "No elige ningún idioma.",
        frase: "onboarding.errors.sinIdiomas",
        bloquea: true,
      },
    ],
    endpoints: ["onboarding.responder"],
    datos: "`cuenta.clipero.redes`, `cuenta.pais` y `cuenta.idiomas`.",
    respuesta:
      "Sin sonidos: los chips van en silencio y «Guardar y continuar» no suena. Con un error, sale bajo su campo y el foco va a él.",
    origen: [
      "components/onboarding/micro-question.tsx:869",
      "components/onboarding/micro-question.tsx:921",
      "lib/micro-preguntas.ts:393",
      "components/campanas/solicitar-dialog.tsx:446",
      "components/campanas/submit-clip-dialog.tsx:178",
    ],
    relacionadas: ["onboarding.elegir-redes", "onboarding.elegir-pais-idiomas"],
  },

  /* -------------------------------------------------------------------------
     Misiones en la campana
     ------------------------------------------------------------------------- */
  {
    id: "onboarding.seguir-misiones",
    area: "onboarding",
    titulo: "Seguir tus primeras misiones",
    resumen:
      "El clipero ve qué le queda para empezar —subir su primer video, unirse a una campaña, conectar su red y enviar su primer clip— y va directo a cada cosa.",
    quien: ["clipero"],
    plan: {
      nota: "Con un plan que no participa en campañas (Prueba) no salen «Únete a una campaña» ni «Envía tu primer clip»; «Conecta tu {red}» nombra una red que su plan pueda conectar (con Prueba, TikTok).",
    },
    donde: [
      {
        ruta: "/dashboard",
        etiqueta:
          "Campana «Notificaciones» de la barra superior (en toda la app) › «Tus primeras misiones»",
      },
      { ruta: "/bienvenida?paso=render", etiqueta: "Resultado › «Primera misión»" },
    ],
    pasos: [
      "Pulsa la campana «Notificaciones»: el punto naranja avisa si queda alguna misión (u otro aviso).",
      "En «Tus primeras misiones» ({hechas} de {total}) salen solo las pendientes; pulsa una para ir a donde se cumple.",
      "En el resultado de la bienvenida, «Primera misión» las enseña todas, numeradas, con «Hecho» o «Pendiente».",
    ],
    reglas: [
      "Misiones (`misionesDe`): «Únete a una campaña» → /campanas?orden=para-ti (hecha si hay algún envío o desbloqueó una privada); «Conecta tu {red}» → /ajustes?seccion=cuentas (hecha con una cuenta conectada activa, o una declarada con seguidores medidos); «Envía tu primer clip» → /campanas?vista=participando (hecha si hay algún envío). Con «las dos cosas», primero «Sube tu primer video» → /subir (hecha con algún proyecto).",
      "Hoy «algún envío» es cualquier envío del almacén de campañas (`useCampanas().envios`, que incluye los envíos semilla de la demo), no solo los de la cuenta: con la API, estas dos misiones deben contar solo los envíos de quien mira.",
      "Quien solo recorta sus videos no tiene misiones, y las cuentas de agencia tampoco.",
      "La red de «Conecta tu {red}» es la primera que declaró y su plan puede conectar; si no hay, la primera de su plan.",
      "La lista de la campana desaparece cuando no queda ninguna: lo ya hecho no es un aviso.",
      "El estado se dice con palabras («Hecho», «Pendiente»), nunca solo con el color o el icono.",
    ],
    estados: [
      { estado: "Pendiente", significa: "Sale en la campana y enciende su punto." },
      {
        estado: "Hecho",
        significa: "Tachada en el resultado; ya no sale en la campana.",
      },
    ],
    endpoints: [
      "onboarding.leer-respuestas",
      "campanas.listar-envios",
      "cuenta.listar-redes",
      "proyectos.listar",
    ],
    datos:
      "Se calculan en el navegador: objetivo y redes de la cuenta, envíos y campañas desbloqueadas del almacén de campañas, cuentas del almacén de redes (`clipealo-cuentas-v1`) y proyectos de la frontera `listJobs` (GET /jobs).",
    respuesta: "Sin sonido: son enlaces.",
    origen: [
      "components/onboarding/misiones.tsx:39",
      "components/onboarding/misiones.tsx:61",
      "components/onboarding/misiones.tsx:148",
      "lib/micro-preguntas.ts:459",
      "components/app/avisos-boton.tsx:49",
      "components/onboarding/resultados/result-clipero.tsx:327",
    ],
    relacionadas: ["onboarding.ver-resultado-clipero"],
  },
]
