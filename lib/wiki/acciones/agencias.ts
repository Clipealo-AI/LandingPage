import type { Accion } from "@/lib/wiki/tipos"

/**
 * Acciones de «agencias»: la cara de quien paga.
 *
 * Pedir el perfil, montar y publicar campañas (públicas o privadas con
 * código), decidir con quién se trabaja, revisar lo que llega y cerrar sin
 * dejar a nadie colgado. Todo sale de `lib/agencia.ts`, `lib/campanas.ts`,
 * `lib/participacion.ts`, `lib/derechos.ts` y de los componentes que lo pintan.
 */
export const ACCIONES: Accion[] = [
  /* -------------------------------------------------------------------------
     El perfil de agencia
     ------------------------------------------------------------------------- */
  {
    id: "agencias.solicitar-perfil",
    area: "agencias",
    titulo: "Solicitar el perfil de agencia",
    resumen:
      "Una cuenta de clipero cuenta quién es su organización en cuatro tomas y envía la solicitud para poder crear campañas.",
    quien: ["clipero"],
    donde: [
      { ruta: "/campanas/nueva", etiqueta: "Crear campaña (puerta de agencia)" },
      { ruta: "/campanas", etiqueta: "Campañas › «¿Eres una agencia?»" },
      { ruta: "/bienvenida?tipo=agencia", etiqueta: "Bienvenida › rama de agencia" },
    ],
    pasos: [
      "Entra por Campañas › «¿Eres una agencia?» o abriendo Crear campaña: con perfil de clipero se ve la tarjeta «Perfil de agencia» y el botón «Solicitar perfil de agencia». También se llega eligiendo «Represento una marca o agencia» en la primera toma de la bienvenida.",
      "Toma 1, «¿A quién representas?»: elige una de las 13 tarjetas («Agencia de marketing o influencers», «Marca», «Startup o app», «Sello o distribuidora», «Artista», «Management de streamers», «Soy streamer o creador», «Infoproductor», «Club, liga o evento», «Medio o red de podcasts», «Universidad», «Instituto o academia» u «Otro»).",
      "Toma 2, «¿Cómo se llama y dónde te encontramos?»: «Nombre de la marca, artista o agencia», «Web o red oficial», «Tu papel (opcional)» y «País de la organización» (sale precargado con el de la cuenta).",
      "Toma 3, «¿Qué vas a promocionar?»: «Sector del producto» (los regulados llevan la insignia «Revisión») y «¿De qué va el contenido que quieres clipear?» (hasta 3 temas); si quiere, elige el creador en «¿Es de un creador concreto? (opcional)». Si representa a un streamer o a un management, la toma pide antes «¿Cuál es el canal?», pregunta los temas como «¿De qué va?» y no enseña el buscador de creador.",
      "Toma 4, «¿Dónde y para quién quieres los clips?»: «Redes donde se publican», «Países del público» e «Idiomas». El país de la organización (o el de la cuenta) y el idioma de la interfaz salen ya marcados. La reacción dice cuántos cliperos cubren esa combinación.",
      "En «Tu primera campaña, casi lista» mueve el simulador si quiere (ver «Simular la primera campaña») y, en «Dos cosas más (opcional)», marca los permisos y «¿Cómo llegaste a Clipealo?».",
      "Pulsa «Enviar solicitud».",
    ],
    reglas: [
      "Solo pide el perfil quien no lo tiene: `puedeCrearCampanas` es falso para el perfil `usuario`, y entonces Crear campaña enseña la puerta de agencia (`AgencyGate`) en vez del formulario.",
      "Las cuatro tomas son `tipo-org`, `org`, `promocion` y `alcance` (`TOMAS_AGENCIA`). El botón de la puerta lleva a la primera toma que aún no vale (`pasoRetomarAgencia`) y dice «Termina tu solicitud ({n} tomas)» si faltan o «Enviar tu solicitud» si solo falta enviarla.",
      "Nombre de la organización: de 2 a 60 caracteres (`LIMITES_ONBOARDING.orgMin` y `orgMax`). La web tiene que ser una dirección válida y el país es obligatorio; el papel («Fundador o fundadora», «Marketing», «Mánager», «Creador o creadora» u «Otro») es opcional.",
      "Si el dominio del correo coincide con la web (`dominioCoincide`), la reacción lo dice («la revisión irá más rápido») y el dato viaja en la solicitud.",
      "Temas del material: al menos 1 y como mucho 3 (`LIMITES_ONBOARDING.verticalesMaterial`). Intentar un cuarto solo avisa (`limiteElegidos`, no bloquea).",
      "Tipos `streamer-creador` y `management-streamers`: el enlace del canal es obligatorio (Twitch, Kick, YouTube o TikTok) y el sector se precarga en «entretenimiento y creadores», editable.",
      "Sectores regulados (finanzas y fintech, cripto y trading, apuestas y casino, salud y suplementos, alcohol, política y causas): la reacción avisa de que sus campañas se revisan a mano, solo entran cliperos con la edad verificada y llevan aviso legal.",
      "La estimación de cliperos solo se enseña en grupos de 50 o más y redondeada («más de 50 / 200 / 1.000 / 5.000», `umbralPublicoValor`); por debajo dice que aún son pocos.",
      "Llegar al render completa el onboarding pero no envía nada: la solicitud solo sale al pulsar «Enviar solicitud».",
      "Lo que viaja a la cola del admin (`datosSolicitudDe`) exige tipo, nombre, web, país, sector, temas, redes, países e idiomas. El tramo de presupuesto sale del presupuesto del simulador (`tramoPresupuestoDe`: menos de US$ 500, de 500 a 2.000, de 2.000 a 10.000, de 10.000 a 50.000 o de 50.000 en adelante).",
      "Al enviar, el borrador del simulador se guarda en la cuenta para precargar Crear campaña cuando concedan el perfil.",
      "La bienvenida promete la decisión en menos de 2 días hábiles (`PLAZO_REVISION_DIAS_HABILES`, de lunes a viernes, en UTC), pero la puerta de Crear campaña dice «la revisa en 24–48 h» (`campaigns.agencyGate.pending`).",
      "Si al pulsar falta un dato (`datosSolicitudDe` devuelve `null`), el aviso de error pide «Revisa tu conexión y vuelve a intentarlo.», aunque el fallo no es de conexión. Y la cuenta ya quedó marcada como enviada: `marcarSolicitudEnviada` va antes de la comprobación (`result-agencia.tsx:104`), así que en el primer envío la bienvenida pasa a «Solicitud enviada» sin que nada llegue a la cola, mientras la puerta de Crear campaña sigue pidiendo terminarla.",
    ],
    estados: [
      { estado: "ninguna", significa: "No ha enviado nada todavía." },
      {
        estado: "pendiente",
        significa: "Enviada: espera en la cola de /admin/campanas.",
      },
      {
        estado: "entrevista",
        significa:
          "El equipo la ha citado antes de decidir; la agencia ve la fecha y la nota.",
      },
      {
        estado: "aprobada",
        significa:
          "Perfil de agencia concedido con el plan que salió de la entrevista, que pasa a ser el plan de la cuenta.",
      },
      {
        estado: "rechazada",
        significa:
          "Rechazada con un motivo: web no verificable, sector no admitido, faltan datos, duplicada u otro.",
      },
    ],
    errores: [
      {
        codigo: "sinTipoOrg",
        cuando: "Continúa la toma 1 sin elegir a quién representa.",
        frase: "onboarding.errors.sinTipoOrg",
        bloquea: true,
      },
      {
        codigo: "orgCorto",
        cuando: "El nombre tiene menos de 2 caracteres.",
        frase: "onboarding.errors.orgCorto",
        bloquea: true,
      },
      {
        codigo: "orgLargo",
        cuando: "El nombre pasa de 60 caracteres.",
        frase: "onboarding.errors.orgLargo",
        bloquea: true,
      },
      {
        codigo: "webNoValida",
        cuando: "La web no es una dirección válida.",
        frase: "onboarding.errors.webNoValida",
        bloquea: true,
      },
      {
        codigo: "sinPais",
        cuando: "No elige el país de la organización.",
        frase: "onboarding.errors.sinPais",
        bloquea: true,
      },
      {
        codigo: "sinCanal",
        cuando: "Streamer o management sin enlace del canal.",
        frase: "onboarding.errors.sinCanal",
        bloquea: true,
      },
      {
        codigo: "enlaceNoReconocido",
        cuando: "El enlace del canal no es de Twitch, Kick, YouTube ni TikTok.",
        frase: "onboarding.errors.enlaceNoReconocido",
        bloquea: true,
      },
      {
        codigo: "sinSector",
        cuando: "No elige qué va a promocionar.",
        frase: "onboarding.errors.sinSector",
        bloquea: true,
      },
      {
        codigo: "sinTemaCanal",
        cuando: "No elige ningún tema del material.",
        frase: "onboarding.errors.sinTemaCanal",
        bloquea: true,
      },
      {
        codigo: "limiteElegidos",
        cuando: "Intenta marcar un cuarto tema.",
        frase: "onboarding.errors.limiteElegidos",
        bloquea: false,
      },
      {
        codigo: "sinRedes",
        cuando:
          "Toma 4 sin ninguna red. La frase es la del clipero y menciona «Aún no tengo cuenta», una opción que esta toma no tiene.",
        frase: "onboarding.errors.sinRedes",
        bloquea: true,
      },
      {
        codigo: "sinPaises",
        cuando: "Toma 4 sin ningún país del público.",
        frase: "onboarding.errors.sinPaises",
        bloquea: true,
      },
      {
        codigo: "sinIdiomas",
        cuando: "Toma 4 sin ningún idioma.",
        frase: "onboarding.errors.sinIdiomas",
        bloquea: true,
      },
      {
        codigo: "solicitudFallida",
        cuando:
          "Al pulsar «Enviar solicitud» falta algún dato obligatorio de las cuatro tomas (`datosSolicitudDe` devuelve `null`).",
        frase: "onboarding.errors.solicitudFallida.title",
        bloquea: true,
      },
    ],
    endpoints: [
      "onboarding.responder",
      "onboarding.consentir",
      "agencias.estimar-oferta",
      "agencias.guardar-borrador",
      "agencias.solicitar-perfil",
    ],
    datos:
      "Las respuestas de las tomas y el borrador viven en la cuenta (`clipealo-cuenta-v1`, `hooks/use-cuenta.ts`: `agencia` y `borradorCampana`); el estado de la solicitud y lo que ve la cola del admin, en `clipealo-campanas-v1` (`hooks/use-campanas.ts`: `solicitudAgencia` y `datosSolicitud`). La estimación de cliperos es de demo (`CLIPEROS_DEMO_POR_PAIS`).",
    respuesta:
      '«Enviar solicitud» es `variant="brand"`: suena «pop» y se encuadra con la marca de recorte. Si sale bien, `toast.success` «Solicitud enviada» · «Te avisamos en la app en cuanto la revisemos.», y el mismo texto se anuncia a los lectores de pantalla. Si falta un dato, `toast.error` «No pudimos enviar la solicitud», con su sonido de error y la sacudida.',
    origen: [
      "components/campanas/agency-gate.tsx:55",
      "components/campanas/agency-gate.tsx:120",
      "components/onboarding/tomas/tipo-org.tsx:15",
      "components/onboarding/tomas/org.tsx:35",
      "components/onboarding/tomas/promocion.tsx:49",
      "components/onboarding/tomas/alcance.tsx:29",
      "lib/onboarding.ts:682",
      "lib/onboarding.ts:392",
      "lib/agencia.ts:47",
      "lib/agencia.ts:56",
      "lib/agencia.ts:256",
      "lib/agencia.ts:443",
      "components/onboarding/resultados/result-agencia.tsx:103",
      "hooks/use-campanas.ts:411",
      "lib/taxonomia.ts:430",
      "lib/taxonomia.ts:591",
    ],
    relacionadas: [
      "agencias.simular-primera-campana",
      "agencias.consultar-solicitud",
      "agencias.reenviar-solicitud",
      "agencias.crear-campana",
    ],
  },
  {
    id: "agencias.simular-primera-campana",
    area: "agencias",
    titulo: "Simular la primera campaña",
    resumen:
      "Antes de enviar la solicitud, la agencia mueve presupuesto, CPM y mínimo de vistas y ve cuánto compra y entre cuántos clips se reparte.",
    quien: ["clipero"],
    donde: [
      {
        ruta: "/bienvenida?tipo=agencia",
        etiqueta: "Bienvenida › «Tu primera campaña, casi lista»",
      },
    ],
    pasos: [
      "Termina las cuatro tomas: llega a «Tu primera campaña, casi lista».",
      "En «Simulador», mueve «Presupuesto» y «CPM: pago por cada 1.000 vistas».",
      "En «Mínimo de vistas para cobrar» elige una opción («Sin mínimo», 500, 1.000, 2.000, 5.000 o 10.000 vistas).",
      "Lee el resumen («Con US$ 500 a US$ 0,65 por cada 1.000 vistas y un tope del 10 % por video…»), la sección «Mercado» y, a la derecha, «Así se verá en Explorar».",
    ],
    reglas: [
      "El presupuesto se mueve por 16 paradas, de US$ 100 a US$ 50.000 (`PRESUPUESTOS_SIMULADOR`); arranca en US$ 500 o en lo que dejó guardado.",
      "El CPM arranca a mitad del rango de referencia del sector y solo se mueve dentro de ese rango, en pasos de US$ 0,05. Sin referencia (política y causas) usa de US$ 0,30 a US$ 3 (`RANGO_CPM_SIN_REFERENCIA`) y parte de US$ 1. Siempre queda entre US$ 0,10 y US$ 20 (`LIMITES`).",
      "El tope por video del simulador es fijo: 10 % del presupuesto (`SIMULADOR_AGENCIA.topePorVideoPct`).",
      "Solo se ofrecen los mínimos que no superan las vistas con las que un video ya llega al tope (`simulacionAgencia`); el de partida es 1.000.",
      "Las cifras salen de las mismas funciones que pagan de verdad (`vistasCompradas`, `videosAlTope`, `topePorVideo`). En Música (CPM de referencia US$ 0,30–1, mitad US$ 0,65) con US$ 500 compra hasta 769.230 vistas, el tope por video es US$ 50 y cobran al tope al menos 10 videos.",
      "Cada cambio soltado (al levantar el deslizador o al elegir mínimo) se guarda como borrador de campaña (`borradorDeSolicitud`): marca, categoría derivada del tipo de organización, redes, sector, tema (el primero de los elegidos), países, idiomas, creador, las reglas de pago y, en la variante de streamer, el enlace del canal como material.",
      "Solo se ve mientras la solicitud no está enviada o tras un rechazo; en revisión queda la vista previa en solo lectura.",
    ],
    endpoints: ["agencias.guardar-borrador", "agencias.estimar-oferta"],
    datos:
      "El borrador se guarda en `Cuenta.borradorCampana` (`clipealo-cuenta-v1`). El cálculo es puro y se hace en el navegador.",
    respuesta:
      "Sin aviso: el resumen y la tarjeta se reescriben al moverlo. Las opciones de mínimo suenan «tap» al elegirlas (`data-sound`).",
    origen: [
      "components/onboarding/resultados/result-agencia.tsx:86",
      "components/onboarding/resultados/result-agencia.tsx:117",
      "components/onboarding/resultados/result-agencia.tsx:253",
      "lib/agencia.ts:137",
      "lib/agencia.ts:152",
      "lib/agencia.ts:155",
      "lib/agencia.ts:183",
      "lib/agencia.ts:227",
      "lib/onboarding.ts:1351",
      "lib/onboarding.ts:1363",
      "lib/taxonomia.ts:507",
    ],
    relacionadas: ["agencias.solicitar-perfil", "agencias.crear-campana"],
  },
  {
    id: "agencias.consultar-solicitud",
    area: "agencias",
    titulo: "Ver en qué va la solicitud",
    resumen:
      "Quien pidió el perfil ve si está en revisión, si le han citado a una entrevista, si se lo concedieron o por qué se rechazó.",
    quien: ["clipero"],
    donde: [
      { ruta: "/campanas/nueva", etiqueta: "Crear campaña (puerta de agencia)" },
      { ruta: "/bienvenida?tipo=agencia", etiqueta: "Bienvenida › «Tu solicitud»" },
    ],
    pasos: [
      "Abre Crear campaña (o Campañas › «¿Eres una agencia?»).",
      "Con la solicitud en revisión lee «Solicitud enviada. El equipo de Clipealo la revisa en 24–48 h.».",
      "Si le han citado, lee «El equipo te ha citado a una entrevista el {fecha}…» y, debajo, la nota del equipo si la hay.",
      "Si se rechazó, lee «La última solicitud se rechazó: {motivo}…» y puede pulsar «Volver a solicitarlo».",
      "En la bienvenida, «Solicitud enviada» dice además «Decisión antes del {fecha}.».",
      "Cuando se aprueba, Crear campaña deja de enseñar la puerta y la bienvenida dice «Ya eres agencia», con el botón «Crear campaña».",
    ],
    reglas: [
      "La puerta tiene cuatro caras (`estadoGate`): `solicitar` (no ha empezado), `terminar` (empezó y no la envió), `revision` (enviada) y `rechazada`.",
      "Para la puerta, `entrevista` cuenta como pendiente, con su propio aviso de fecha y nota.",
      "La bienvenida no enseña la entrevista: deduce el estado de `agencia.solicitudEnviadaEn`, del perfil y del motivo de rechazo, así que con la cita sigue diciendo «Solicitud enviada» y «Decisión antes del…».",
      "La cita es un día, no una hora: el backoffice la guarda a mediodía UTC para que caiga en ese día en cualquier zona.",
      "«Decisión antes del…» son 2 días hábiles después del envío, de lunes a viernes y en UTC (`decisionAntesDe`).",
      "El motivo de rechazo se guarda como código (`MOTIVOS_RECHAZO_AGENCIA`) y se enseña traducido.",
      "Lo que decide el admin se ve sin recargar: el almacén se sincroniza entre pestañas.",
    ],
    estados: [
      { estado: "pendiente", significa: "En la cola del admin." },
      { estado: "entrevista", significa: "Citada: `citadaEn` y una nota opcional." },
      { estado: "aprobada", significa: "Ya puede crear campañas." },
      { estado: "rechazada", significa: "Con motivo; puede reenviarla." },
    ],
    endpoints: ["agencias.leer-solicitud"],
    datos:
      "`clipealo-campanas-v1` (`hooks/use-campanas.ts`): `solicitudAgencia`, `entrevista`, `motivoRechazo` y `planAsignado`. El admin escribe en el mismo almacén desde /admin/campanas.",
    respuesta: 'Sin sonido: es lectura. Los avisos van con `role="status"`.',
    origen: [
      "components/campanas/agency-gate.tsx:87",
      "components/campanas/agency-gate.tsx:94",
      "components/campanas/agency-gate.tsx:107",
      "lib/agencia.ts:90",
      "lib/agencia.ts:117",
      "hooks/use-campanas.ts:81",
      "hooks/use-campanas.ts:247",
      "components/onboarding/resultados/result-agencia.tsx:170",
    ],
    relacionadas: [
      "agencias.solicitar-perfil",
      "agencias.reenviar-solicitud",
      "backoffice.citar-entrevista-agencia",
      "backoffice.conceder-agencia",
      "backoffice.rechazar-agencia",
    ],
  },
  {
    id: "agencias.reenviar-solicitud",
    area: "agencias",
    titulo: "Volver a enviar una solicitud rechazada",
    resumen:
      "Tras un rechazo, la agencia corrige lo que contó y vuelve a mandar la solicitud a la cola.",
    quien: ["clipero"],
    donde: [
      { ruta: "/campanas/nueva", etiqueta: "Crear campaña › «Volver a solicitarlo»" },
      {
        ruta: "/bienvenida?tipo=agencia",
        etiqueta: "Bienvenida › «Tu solicitud necesita cambios»",
      },
      {
        ruta: "/ajustes?seccion=datos",
        etiqueta: "Ajustes › Tus datos › «Lo que nos contaste»",
      },
    ],
    pasos: [
      "En la puerta de Crear campaña lee «La última solicitud se rechazó: {motivo}…» y pulsa «Volver a solicitarlo»: abre la bienvenida de agencia en la primera toma que no vale o, si todas valen, en «Tu solicitud necesita cambios».",
      "Lee «Rechazada: {motivo}». Para cambiar lo que contó, edita la respuesta en Ajustes › Tus datos › «Lo que nos contaste» (cada «Editar» abre esa toma): la pantalla de la solicitud no tiene enlaces para volver a las tomas.",
      "Ajusta el simulador si quiere y pulsa «Volver a enviar».",
    ],
    reglas: [
      "Reenviar pone la solicitud otra vez en `pendiente` y borra el motivo del rechazo anterior.",
      "El render siempre manda los datos nuevos, que sustituyen a los de la cola. `solicitarAgencia` admite llamarse sin datos y entonces conserva los anteriores (`datos ?? s.datosSolicitud`), pero hoy nadie la llama así.",
      "Vuelve a guardar el borrador del simulador en la cuenta y renueva `agencia.solicitudEnviadaEn`: «Decisión antes del…» cuenta desde el reenvío.",
      "Se vuelve a registrar el evento `solicitud_agencia` con estado `pendiente`, si el sector es regulado y el tramo de presupuesto.",
    ],
    errores: [
      {
        codigo: "solicitudFallida",
        cuando: "Falta algún dato obligatorio de las cuatro tomas.",
        frase: "onboarding.errors.solicitudFallida.title",
        bloquea: true,
      },
    ],
    endpoints: [
      "agencias.solicitar-perfil",
      "agencias.guardar-borrador",
      "agencias.leer-solicitud",
    ],
    datos:
      "`clipealo-campanas-v1`: `solicitudAgencia`, `datosSolicitud` y `motivoRechazo`; `clipealo-cuenta-v1`: `agencia.solicitudEnviadaEn`.",
    respuesta:
      'Botón `variant="brand"` («pop» y marca de recorte) y `toast.success` «Solicitud enviada», como el primer envío.',
    origen: [
      "hooks/use-campanas.ts:411",
      "hooks/use-campanas.ts:418",
      "hooks/use-campanas.ts:193",
      "components/onboarding/resultados/result-agencia.tsx:378",
    ],
    relacionadas: ["agencias.consultar-solicitud", "agencias.solicitar-perfil"],
  },

  /* -------------------------------------------------------------------------
     Crear y publicar
     ------------------------------------------------------------------------- */
  {
    id: "agencias.crear-campana",
    area: "agencias",
    titulo: "Crear y publicar una campaña",
    resumen:
      "La agencia pone presupuesto, CPM, máximo por video, material, derechos y fechas, y la campaña se publica en ese momento: si es pública, sale en Explorar.",
    quien: ["agencia", "admin"],
    donde: [
      { ruta: "/campanas/nueva", etiqueta: "Crear campaña" },
      { ruta: "/campanas", etiqueta: "Campañas › «Crear campaña»" },
      {
        ruta: "/campanas?vista=mis-campanas",
        etiqueta: "Mis campañas (vacía) › «Crear campaña»",
      },
      {
        ruta: "/bienvenida?tipo=agencia",
        etiqueta: "«Ya eres agencia» › «Crear campaña»",
      },
      {
        ruta: "/campanas/nueva?como=admin",
        etiqueta: "Desde el backoffice, como Clipealo",
      },
    ],
    pasos: [
      "Pulsa «Crear campaña». El formulario sale precargado con el borrador del simulador si lo hay.",
      "«La campaña»: «Marca, artista o creador», «Nombre de la campaña», «Categoría» (Influencers, Música, Marcas o Infoproductores), «Serie (opcional)» y «Qué clips buscas».",
      "«Material y redes»: «Enlace al material», «Redes donde se publica» (TikTok, Instagram, YouTube, X, LinkedIn o Facebook) y «Requisitos», uno por línea.",
      "«Derechos»: «Alcance» («Dentro de la campaña» o «Libre»), «Ofrezco lista blanca», «Atribución» y «Condiciones».",
      "«Pago»: «Presupuesto total» (US$), «CPM: pago por cada 1.000 vistas», «Máximo por video» (deslizador en %) y «Mínimo de vistas para cobrar».",
      "«Fechas y visibilidad»: «Empieza» y «Termina». Deja «Campaña privada» apagado para que salga en Explorar.",
      "Mira a la derecha «Así se verá» y «Cómo reparte»: vistas que compra, tope por video, videos que cobran al tope y la calculadora.",
      "Pulsa «Publicar campaña». Lleva a la ficha de la campaña (/campanas/[id]); desde el backoffice, a /admin/campanas.",
    ],
    reglas: [
      "Solo crean campañas las agencias y el admin (`puedeCrearCampanas`: todo perfil menos `usuario`); a un clipero Crear campaña le enseña la puerta de agencia.",
      "No depende del plan: lo abre el perfil. `PLAN_MINIMO` (lib/pricing.ts) no tiene ninguna capacidad para crear campañas.",
      "Se publica al momento, sin revisión, en estado `activa`.",
      "Marca de al menos 2 caracteres, nombre de al menos 6 y «Qué clips buscas» de al menos 20.",
      "El material tiene que ser un enlace `http(s)://…` con dominio, y hace falta al menos una red.",
      "Presupuesto de US$ 100 a US$ 100.000; CPM de US$ 0,10 a US$ 20 (la ayuda dice que lo habitual es de US$ 0,30 a US$ 3); máximo por video del 1 % al 50 % del presupuesto; mínimo de vistas de 0 a 100.000 (`LIMITES`).",
      "El mínimo de vistas no puede superar las vistas con las que un video ya llega al tope (`vistasHastaTope` = ⌈tope ÷ CPM × 1.000⌉).",
      "«Empieza» y «Termina» son obligatorias y el fin tiene que ser posterior al inicio; se guardan como las 00:00 del primer día y las 23:59 del último, en la hora local del navegador.",
      "La fecha de inicio no retiene nada: `estadoVisible` solo mira el fin, así que la campaña admite solicitudes y clips desde que se publica aunque empiece días después. El inicio solo lo usa el calendario, que avisa si se programa un clip fuera de la ventana de la campaña (`lib/agenda.ts:631`).",
      "Derechos: atribución de hasta 60 caracteres y condiciones de hasta 300 (`LIMITES_LICENCIA`). Sin tocarlos vale «Dentro de la campaña» y sin lista blanca (`LICENCIA_POR_DEFECTO`). Con «Ofrezco lista blanca», los cliperos pueden pedir el alta de sus cuentas y la agencia las resuelve en Operaciones › Derechos.",
      "El pago de un clip es mín(vistas ÷ 1.000 × CPM, tope % × presupuesto, lo que quede), y nada por debajo del mínimo de vistas; el presupuesto se reparte entre los aprobados por orden de llegada (`liquidar`).",
      "Valores de partida: Influencers; TikTok, Instagram y YouTube; US$ 1.000; CPM US$ 1; 10 %; 2.000 vistas; del 15 de septiembre al 15 de octubre de 2026. Con ellos compra 1.000.000 de vistas, el tope es US$ 100 (se alcanza con 100.000 vistas) y cobran al tope al menos 10 videos.",
      "Presupuesto y CPM se redondean a céntimos; los requisitos pierden las viñetas (`-`, `•`, `*`) y las líneas vacías.",
      "El formulario no tiene campos de segmentación: sector, tema, países, idiomas y creador solo llegan con el borrador del simulador. Un sector regulado marca la campaña como regulada y solo para cliperos verificados (`regulado` y `soloVerificados`), y la recomendación solo se la enseña a cuentas verificadas. La bienvenida promete que esas campañas «las revisamos a mano», pero ningún código las retiene: se publican igual, al momento.",
      "El formulario no deja elegir modo de entrada, plazo ni cupo: toda campaña nueva es «con solicitud», da 7 días para entregar (`PLAZO_ENTREGA_DIAS`) y no tiene tope de plazas.",
      "Destacar en Explorar es solo del admin: el interruptor «Destacar en Explorar» solo aparece con `?como=admin`, y lo que crea una agencia se guarda siempre sin destacar.",
      "La agencia firma como «{nombre} (agencia)», en el idioma de quien la crea; hoy {nombre} y la dueña (`creadaPor.userId`) son los de la cuenta demo (`CUENTA_DEMO`: Ana Ruiz, `u_ana`), no los de la organización. El admin firma como «Clipealo» y sin `userId`: en la app nadie la ve como suya (ni en Mis campañas ni con «Gestionar tu campaña»); se lleva desde /admin/campanas.",
      "Al publicar, el borrador guardado en la cuenta se borra: ya no espera a nadie.",
    ],
    estados: [
      { estado: "activa", significa: "Admite solicitudes y clips." },
      { estado: "pausada", significa: "La agencia la paró: no admite clips de nadie." },
      {
        estado: "agotada",
        significa:
          "No queda presupuesto ni para un céntimo: se deriva de la liquidación.",
      },
      {
        estado: "vencida",
        significa: "Pasó su fecha de fin: se deriva del reloj, no se guarda.",
      },
      {
        estado: "cerrada",
        significa:
          "Inscripciones cerradas: no entra nadie nuevo y solo entregan los ya aceptados.",
      },
      { estado: "finalizada", significa: "Cerrada para todos; no se deshace." },
    ],
    errores: [
      {
        codigo: "brandRequired",
        cuando: "Marca con menos de 2 caracteres.",
        frase: "campaigns.form.errors.brandRequired",
        bloquea: true,
      },
      {
        codigo: "titleShort",
        cuando: "Nombre con menos de 6 caracteres.",
        frase: "campaigns.form.errors.titleShort",
        bloquea: true,
      },
      {
        codigo: "descriptionShort",
        cuando: "«Qué clips buscas» con menos de 20 caracteres.",
        frase: "campaigns.form.errors.descriptionShort",
        bloquea: true,
      },
      {
        codigo: "materialUrl",
        cuando: "El material no es un enlace http(s) con dominio.",
        frase: "campaigns.form.errors.materialUrl",
        bloquea: true,
      },
      {
        codigo: "networksRequired",
        cuando: "Ninguna red elegida.",
        frase: "campaigns.form.errors.networksRequired",
        bloquea: true,
      },
      {
        codigo: "budgetRange",
        cuando: "Presupuesto fuera de US$ 100–100.000.",
        frase: "campaigns.form.errors.budgetRange",
        bloquea: true,
      },
      {
        codigo: "cpmRange",
        cuando: "CPM fuera de US$ 0,10–20.",
        frase: "campaigns.form.errors.cpmRange",
        bloquea: true,
      },
      {
        codigo: "capRange",
        cuando: "Máximo por video fuera del 1–50 %.",
        frase: "campaigns.form.errors.capRange",
        bloquea: true,
      },
      {
        codigo: "minViewsRange",
        cuando: "Mínimo de vistas fuera de 0–100.000.",
        frase: "campaigns.form.errors.minViewsRange",
        bloquea: true,
      },
      {
        codigo: "minViewsAboveCap",
        cuando: "El mínimo supera las vistas con las que un video llega al tope.",
        frase: "campaigns.form.errors.minViewsAboveCap",
        bloquea: true,
      },
      {
        codigo: "startRequired",
        cuando: "Sin fecha de inicio.",
        frase: "campaigns.form.errors.startRequired",
        bloquea: true,
      },
      {
        codigo: "endRequired",
        cuando: "Sin fecha de fin.",
        frase: "campaigns.form.errors.endRequired",
        bloquea: true,
      },
      {
        codigo: "endBeforeStart",
        cuando: "La fecha de fin no es posterior a la de inicio.",
        frase: "campaigns.form.errors.endBeforeStart",
        bloquea: true,
      },
      {
        codigo: "attributionLong",
        cuando: "Atribución de más de 60 caracteres.",
        frase: "campaigns.form.errors.attributionLong",
        bloquea: true,
      },
      {
        codigo: "conditionsLong",
        cuando: "Condiciones de más de 300 caracteres.",
        frase: "campaigns.form.errors.conditionsLong",
        bloquea: true,
      },
    ],
    endpoints: ["cuenta.leer", "agencias.crear-campana", "agencias.guardar-borrador"],
    datos:
      'La campaña se añade a `creadas` en `clipealo-campanas-v1` (`hooks/use-campanas.ts`); el borrador que la precarga vive en `Cuenta.borradorCampana` (`clipealo-cuenta-v1`). El id y la fecha se generan en el navegador (`nuevoId("cmp")`).',
    respuesta:
      '«Publicar campaña» es `variant="brand"` («pop» y marca de recorte). Publicar es un hito: `toast.celebrate` «Campaña publicada» · «Ya sale en Explorar.», con arpegio y confeti. Con errores, `toast.error` «Revisa la campaña» · «{n} campos por corregir.» (sonido de error y sacudida) y el foco salta al primer campo con error.',
    origen: [
      "components/campanas/campaign-form.tsx:79",
      "components/campanas/campaign-form.tsx:162",
      "components/campanas/campaign-form.tsx:198",
      "components/campanas/campaign-form.tsx:208",
      "components/campanas/campaign-form.tsx:587",
      "lib/campanas.ts:48",
      "lib/campanas.ts:200",
      "lib/campanas.ts:276",
      "lib/campanas.ts:308",
      "lib/campanas.ts:544",
      "lib/campanas.ts:594",
      "lib/campanas.ts:613",
      "lib/campanas.ts:631",
      "lib/recomendacion.ts:125",
      "lib/derechos.ts:48",
      "lib/participacion.ts:41",
      "lib/participacion.ts:44",
      "hooks/use-campanas.ts:307",
      "components/campanas/campaign-form.tsx:176",
      "lib/campanas.ts:356",
      "lib/agenda.ts:631",
      "lib/pricing.ts:75",
    ],
    relacionadas: [
      "agencias.crear-campana-privada",
      "agencias.ver-mis-campanas",
      "agencias.simular-primera-campana",
      "operaciones.aprobar-lista-blanca",
      "backoffice.crear-campana",
    ],
  },
  {
    id: "agencias.crear-campana-privada",
    area: "agencias",
    titulo: "Publicar una campaña privada con código",
    resumen:
      "La campaña no sale en Explorar: solo entra quien tenga el código de acceso que la agencia comparte.",
    quien: ["agencia", "admin"],
    donde: [
      { ruta: "/campanas/nueva", etiqueta: "Crear campaña › «Fechas y visibilidad»" },
    ],
    pasos: [
      "Rellena el formulario como en «Crear y publicar una campaña».",
      "En «Fechas y visibilidad» enciende «Campaña privada» («No sale en Explorar. Al publicarla te damos un código…»).",
      "Pulsa «Publicar campaña»: el aviso trae el código generado («Privada · código {code}»).",
    ],
    reglas: [
      "El código se genera al publicar y solo si la campaña es privada: dos bloques de 4 caracteres unidos por un guion, del alfabeto `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (sin 0/O ni 1/I, para dictarlo sin equivocarse).",
      "Una privada no sale en Explorar; quien no es su dueño y no la ha desbloqueado ve «Campaña privada» en su ficha y el botón para meter el código.",
      "Al buscar por código se normaliza lo que escribe la gente: mayúsculas, fuera todo lo que no sea letra o cifra y, si quedan 8, el guion en su sitio.",
      "La dueña la ve siempre, sin código.",
      "Las semillas traen un código escrito a mano, «LUMN-2026» («Lanzamiento privado de Lumen», de Agencia Nébula), que `generarCodigo` nunca daría: lleva un 0.",
    ],
    endpoints: ["agencias.crear-campana"],
    datos:
      "`Campana.privada` y `Campana.codigo` en `creadas` de `clipealo-campanas-v1`. Hoy el código lo genera el navegador con `Math.random`.",
    respuesta:
      "El mismo `toast.celebrate` «Campaña publicada», con la descripción «Privada · código {code}».",
    origen: [
      "components/campanas/campaign-form.tsx:555",
      "components/campanas/campaign-form.tsx:193",
      "lib/campanas.ts:412",
      "lib/campanas.ts:414",
      "lib/campanas.ts:424",
      "lib/campanas.ts:917",
      "components/campanas/campaign-detail.tsx:93",
    ],
    relacionadas: ["agencias.crear-campana", "agencias.copiar-codigo-acceso"],
  },
  {
    id: "agencias.copiar-codigo-acceso",
    area: "agencias",
    titulo: "Compartir el código de una campaña privada",
    resumen:
      "La agencia copia el código de acceso de su campaña privada para mandárselo a los cliperos que invita.",
    quien: ["agencia"],
    donde: [
      {
        ruta: "/campanas/[id]",
        etiqueta: "Ficha de la campaña › «Gestionar tu campaña»",
      },
      {
        ruta: "/campanas?vista=mis-campanas",
        etiqueta: "Mis campañas (insignia «Privada · {código}»)",
      },
    ],
    pasos: [
      "Abre la campaña privada desde Mis campañas (la tarjeta ya enseña «Privada · {código}»).",
      "En «Gestionar tu campaña», junto a «Código de acceso», pulsa el botón de copiar («Copiar el código»).",
      "Pégalo donde hables con los cliperos.",
    ],
    reglas: [
      "En la app el código solo lo ve quien creó la campaña: el bloque vive dentro de «Gestionar tu campaña», que solo existe para la dueña. Lo que crea el admin se guarda sin dueña en la app; su código se lee en la lista de /admin/campanas («Privada · {codigo}»).",
      "Copiar usa el portapapeles del navegador; si no está disponible no se copia, pero el aviso sale igual.",
    ],
    endpoints: ["campanas.obtener", "campanas.listar"],
    datos:
      "El código viaja en la propia campaña (`Campana.codigo`), y solo a quien la creó.",
    respuesta:
      "`toast.success` «Código copiado» · «Compártelo con los creadores que invites.» (suena «ding»).",
    origen: [
      "components/campanas/campaign-detail.tsx:410",
      "components/campanas/campaign-detail.tsx:425",
      "components/campanas/my-campaigns.tsx:65",
      "components/admin/campanas-admin.tsx:281",
    ],
    relacionadas: ["agencias.crear-campana-privada"],
  },

  /* -------------------------------------------------------------------------
     Seguir las campañas
     ------------------------------------------------------------------------- */
  {
    id: "agencias.ver-mis-campanas",
    area: "agencias",
    titulo: "Seguir mis campañas",
    resumen:
      "La agencia ve de un vistazo sus campañas: estado, presupuesto gastado, reglas de pago y clips por revisar.",
    quien: ["agencia"],
    donde: [
      { ruta: "/campanas?vista=mis-campanas", etiqueta: "Campañas › «Mis campañas»" },
    ],
    pasos: [
      "En Campañas abre la pestaña «Mis campañas».",
      "Cada tarjeta enseña el estado, «Privada · {código}» si lo es, «{n} clips por revisar» si hay, «Termina el {fecha}.», «{gastado} de {presupuesto}» con su barra y «CPM {cpm} · máximo {pct} por video».",
      "Pulsa el título para abrir la ficha y gestionarla.",
    ],
    reglas: [
      "La pestaña solo existe para quien crea campañas; un clipero que llegue con `?vista=mis-campanas` ve Explorar.",
      "Salen las campañas cuyo `creadaPor.userId` es la cuenta, de la más reciente a la más antigua.",
      "Lo gastado y el porcentaje salen de `liquidar` sobre los envíos aprobados; el estado, de `estadoVisible` (el guardado más `agotada`, `vencida` y `cerrada`, que se derivan).",
      "Sin campañas: «Aún no has creado campañas», con el botón «Crear campaña».",
      "En Explorar, la tarjeta de una campaña propia no ofrece solicitar: dice «Es tu campaña» y «{n} solicitudes esperando tu decisión.» (o «Aquí decides quién entra y cuándo se cierra.» si no hay ninguna).",
    ],
    endpoints: ["campanas.listar", "agencias.listar-envios"],
    datos:
      "Semillas de `lib/campanas.ts` más `creadas` y `cambios` de `clipealo-campanas-v1`. En la demo, la campaña de la cuenta es «Ámbar: Tra Tra Tra» (`cmp_anmi`).",
    respuesta: "Sin sonido: es navegación.",
    origen: [
      "components/campanas/my-campaigns.tsx:32",
      "components/campanas/my-campaigns.tsx:69",
      "components/campanas/campaigns-explorer.tsx:159",
      "components/campanas/campaigns-explorer.tsx:478",
      "lib/campanas.ts:356",
      "lib/campanas.ts:878",
      "components/campanas/solicitar-dialog.tsx:226",
    ],
    relacionadas: ["agencias.ver-tablero-campana", "agencias.crear-campana"],
  },
  {
    id: "agencias.ver-tablero-campana",
    area: "agencias",
    titulo: "Leer el tablero de la campaña",
    resumen:
      "Cinco cifras derivadas —plazas, clips esperados, presupuesto comprometido, días y ritmo— y la lista de quién está dentro.",
    quien: ["agencia"],
    donde: [
      { ruta: "/campanas/[id]", etiqueta: "Ficha de la campaña › «Cómo va la campaña»" },
    ],
    pasos: [
      "Abre tu campaña. «Cómo va la campaña» enseña «Plazas», «Clips que esperas», «Presupuesto comprometido», «Días de campaña» y «Ritmo necesario»; cada cifra lleva su ⓘ con de dónde sale.",
      "Más abajo, «Quién está dentro» lista los compromisos vivos: «Trabajando» con los días que le quedan, «Entregado, por revisar», «Cumplido», «Se le pasó el plazo» o «En disputa».",
    ],
    reglas: [
      "Ocupan plaza las participaciones `aceptada`, `entregada`, `cumplida` y `en-disputa` (la ⓘ de «Plazas» no nombra las que están en disputa, pero el cálculo las cuenta); sin `plazas`, «Sin cupo». En Ámbar (4 plazas) hay 2 dentro al abrir la demo: Kai Moreno trabajando y Nora Vidal con el clip entregado.",
      "Clips que esperas = compromisos aceptados que siguen en plazo.",
      "Presupuesto comprometido = esos clips × el tope por video: el caso peor, no una previsión. Si pasa de lo que queda, avisa de que alguno cobrará menos del tope. En Ámbar: 1 clip (Kai Moreno) × US$ 25 (5 % de US$ 500) = US$ 25.",
      "Días de campaña = días hasta la fecha de fin, redondeando hacia arriba; ritmo necesario = lo que queda ÷ los días que quedan, más cuántos clips al tope lo agotarían.",
      "Una aceptada con el plazo vencido se lee «caducada» sin que nadie la toque (`estadoParticipacion`).",
      "Solo lo ve la dueña de la campaña.",
    ],
    endpoints: [
      "campanas.obtener",
      "agencias.listar-participaciones",
      "agencias.listar-envios",
    ],
    datos:
      "`participaciones` y `cambiosParticipacion` de `clipealo-campanas-v1` sobre las semillas de `lib/participacion.ts` (`par_dem_03` a `par_dem_06` son las de Ámbar).",
    respuesta: "Sin sonido: es lectura.",
    origen: [
      "components/campanas/solicitudes-agencia.tsx:243",
      "components/campanas/solicitudes-agencia.tsx:267",
      "components/campanas/solicitudes-agencia.tsx:492",
      "lib/participacion.ts:178",
      "lib/participacion.ts:225",
      "lib/campanas.ts:891",
    ],
    relacionadas: [
      "agencias.ver-mis-campanas",
      "agencias.ver-perfil-solicitante",
      "agencias.finalizar-campana",
    ],
  },

  /* -------------------------------------------------------------------------
     Con quién trabaja: solicitudes de participación
     ------------------------------------------------------------------------- */
  {
    id: "agencias.ver-perfil-solicitante",
    area: "agencias",
    titulo: "Ver la ficha de quien pide entrar",
    resumen:
      "Cada solicitud llega con la ficha del clipero: lo justo para decidir y nada más.",
    quien: ["agencia"],
    donde: [{ ruta: "/campanas/[id]", etiqueta: "Ficha de la campaña › «Solicitudes»" }],
    pasos: [
      "En tu campaña baja a «Solicitudes»: hay una tarjeta por cada clipero que espera, de la más antigua a la más nueva.",
      "Lee su ficha: bajo el nombre, su país (con bandera) y sus idiomas; después «Redes» con su tramo de seguidores, «Temas», «Editando», «Horas por semana», «En Clipealo» («Clips aprobados», «Aprobación» y «Vistas medianas») y «Lo que cuenta».",
      "Debajo, «Solicitó el {fecha}» y los botones «Aceptar» y «Rechazar».",
    ],
    reglas: [
      "La ficha es `perfilParaAgencia` y solo lleva nombre, país, idiomas, redes con tramo, temas, experiencia, disponibilidad, historial en Clipealo y su nota.",
      "Nunca lleva correo, lo que ha ganado, a qué otras campañas se presentó ni sus creadores favoritos uno por uno; la tarjeta lo dice: «Esto es todo lo que enseña una solicitud…».",
      "Las redes van con tramo de seguidores, nunca con la cifra exacta de una cuenta ajena.",
      "La mediana de vistas solo cuenta clips aprobados con medición: los que llegaron por enlace ajeno no la falsean con ceros.",
      "La nota del clipero tiene como mucho 280 caracteres (`NOTA_MAX`).",
      "Lo que falta se dice: sin país, experiencia u horas, «No lo ha dicho»; sin redes, «No ha añadido redes»; sin temas, «No ha dicho qué clipea»; sin envíos, «Todavía no ha enviado clips por aquí: decides sin historial.». Sin idiomas no se pinta nada.",
    ],
    endpoints: ["agencias.leer-perfil-solicitante", "agencias.listar-participaciones"],
    datos:
      "Hoy la ficha se compone en el navegador: la de la cuenta demo con sus respuestas del onboarding y las demás con `PERFILES_DEMO` (Bruno Salas, Lucía Peña, Kai Moreno, Nora Vidal) y sus envíos.",
    respuesta: "Sin sonido: es lectura.",
    origen: [
      "components/campanas/solicitudes-agencia.tsx:458",
      "lib/participacion.ts:50",
      "lib/participacion.ts:584",
      "lib/participacion.ts:608",
      "lib/participacion.ts:832",
    ],
    relacionadas: ["agencias.aceptar-solicitud", "agencias.rechazar-solicitud"],
  },
  {
    id: "agencias.aceptar-solicitud",
    area: "agencias",
    titulo: "Aceptar a un clipero en la campaña",
    resumen:
      "La agencia acepta la solicitud y empieza a correr el plazo de entrega del clipero.",
    quien: ["agencia"],
    donde: [{ ruta: "/campanas/[id]", etiqueta: "Ficha de la campaña › «Solicitudes»" }],
    pasos: ["En «Solicitudes», revisa la ficha del clipero.", "Pulsa «Aceptar»."],
    reglas: [
      "Solo se acepta con la campaña `activa` (`estadoVisible`) y con plaza libre. Si no, «Aceptar» sale apagado y un aviso dice por qué: «Inscripciones cerradas», «Esta campaña ya no admite gente nueva» o «No quedan plazas libres…».",
      "El plazo de entrega es el de la campaña (7 días por defecto, `PLAZO_ENTREGA_DIAS`) desde que acepta, y nunca pasa de la fecha de fin: vence en la más temprana de las dos.",
      "Ejemplo: aceptar a Bruno Salas en Ámbar guarda su plazo hasta el 20 de septiembre de 2026: el almacén decide con el «hoy» de la demo (`HOY_CAMPANAS`, 13 de septiembre) más 7 días.",
      "El aviso calcula su fecha con el reloj real (`new Date()`, `solicitudes-agencia.tsx:121`) y el almacén guarda la de `HOY_CAMPANAS`: fuera del 13 de septiembre de 2026, «Tiene hasta el {fecha}» no coincide con el plazo guardado.",
      "Desde que acepta, ese compromiso impide finalizar la campaña mientras siga en plazo.",
      "El almacén no vuelve a comprobar al escribir: `decidirSolicitud` aplica la transición sin mirar si la solicitud sigue `solicitada` ni si queda plaza. Lo frena el botón apagado; con servidor lo tiene que comprobar `agencias.decidir-solicitud`.",
    ],
    estados: [
      { estado: "solicitada", significa: "El clipero pidió entrar; decide la agencia." },
      { estado: "aceptada", significa: "Hay compromiso y corre el plazo (`venceEn`)." },
      { estado: "entregada", significa: "Envió su clip: la pelota es de la agencia." },
      { estado: "cumplida", significa: "Clip aprobado." },
      { estado: "rechazada", significa: "La agencia no la quiso, con motivo." },
      { estado: "caducada", significa: "Venció el plazo sin entrega: la plaza vuelve." },
      { estado: "retirada", significa: "El clipero se bajó antes de entregar." },
      { estado: "en-disputa", significa: "Alguien reclamó; decide el admin." },
    ],
    errores: [
      {
        codigo: "sinPlazas",
        cuando:
          "La campaña tiene cupo y está lleno: «Aceptar» sale apagado, con el aviso. Es el código con el que `validarSolicitud` frena al clipero en el mismo caso.",
        frase: "campaignsAgencia.solicitudes.full",
        bloquea: true,
      },
      {
        codigo: "inscripcionesCerradas",
        cuando:
          "La agencia cerró las inscripciones: «Aceptar» sale apagado, con el aviso. Mismo código que en `validarSolicitud`.",
        frase: "campaignsAgencia.solicitudes.closed.title",
        bloquea: true,
      },
    ],
    endpoints: ["agencias.decidir-solicitud"],
    datos:
      "`cambiosParticipacion` en `clipealo-campanas-v1`; la fecha es el «hoy» de la demo (`HOY_CAMPANAS`).",
    respuesta:
      "`toast.success` «{nombre} está dentro» · «Tiene hasta el {fecha} para entregar su clip.» (suena «ding»).",
    origen: [
      "components/campanas/solicitudes-agencia.tsx:110",
      "components/campanas/solicitudes-agencia.tsx:119",
      "components/campanas/solicitudes-agencia.tsx:198",
      "hooks/use-campanas.ts:499",
      "lib/participacion.ts:343",
      "lib/participacion.ts:44",
      "lib/participacion.ts:268",
    ],
    relacionadas: ["agencias.rechazar-solicitud", "agencias.ver-perfil-solicitante"],
  },
  {
    id: "agencias.rechazar-solicitud",
    area: "agencias",
    titulo: "Rechazar a un clipero con motivo",
    resumen:
      "La agencia dice que no a una solicitud y deja el motivo, que el clipero verá en su idioma.",
    quien: ["agencia"],
    donde: [{ ruta: "/campanas/[id]", etiqueta: "Ficha de la campaña › «Solicitudes»" }],
    pasos: [
      "En la tarjeta del clipero pulsa «Rechazar».",
      "En «Rechazar a {nombre}» elige un motivo: «No encaja con el público», «No encaja con el tema», «Todavía sin historial», «No quedan plazas» u «Otro motivo».",
      "Pulsa «Rechazar solicitud» (o «Cancelar»).",
    ],
    reglas: [
      "No hay motivo preseleccionado: sin elegir uno, el botón está apagado y dice «Elige un motivo para poder rechazar.».",
      "«Inscripciones cerradas» no se elige a mano: solo lo pone el rechazo en bloque al cerrar las inscripciones.",
      "El motivo se guarda como código (`MOTIVOS_DECISION`) y el clipero lo ve traducido; puede volver a solicitarlo si cambian las cosas.",
      "Rechazar se puede aunque la campaña ya no admita gente nueva: lo que quede sin decidir se puede cerrar.",
      "El almacén no comprueba al escribir que la solicitud siga `solicitada`: solo lo asegura la lista, que no pinta otras. Con servidor lo comprueba `agencias.decidir-solicitud`.",
    ],
    endpoints: ["agencias.decidir-solicitud"],
    datos:
      "`cambiosParticipacion` en `clipealo-campanas-v1`: estado `rechazada`, `motivo` y `decididaEn`.",
    respuesta:
      'Aviso neutro con sonido de borrado (`sound: "remove"`): «Solicitud rechazada» · «{nombre}: {motivo}.».',
    origen: [
      "components/campanas/solicitudes-agencia.tsx:128",
      "components/campanas/solicitudes-agencia.tsx:379",
      "components/campanas/solicitudes-agencia.tsx:440",
      "lib/participacion.ts:65",
      "lib/participacion.ts:357",
      "hooks/use-campanas.ts:509",
    ],
    relacionadas: ["agencias.aceptar-solicitud", "agencias.cerrar-inscripciones"],
  },

  /* -------------------------------------------------------------------------
     Revisar lo que llega
     ------------------------------------------------------------------------- */
  {
    id: "agencias.aprobar-envio",
    area: "agencias",
    titulo: "Aprobar un clip entregado",
    resumen:
      "La agencia da por bueno un clip: empieza a cobrar por sus vistas y el compromiso del clipero queda cumplido.",
    quien: ["agencia"],
    donde: [
      {
        ruta: "/campanas/[id]",
        etiqueta: "Ficha de la campaña › «Gestionar tu campaña»",
      },
    ],
    pasos: [
      "En «Gestionar tu campaña» lee «{n} clips por revisar».",
      "En cada clip ves su título, la red y «{creador} · {vistas} vistas» («—» si no se pueden medir).",
      "Pulsa «Aprobar».",
    ],
    reglas: [
      "Solo se revisan los envíos `en-revision` de la campaña propia.",
      "Aprobar deja la participación de ese clip en `cumplida`, que ya no impide finalizar.",
      "Desde ese momento entra en el reparto: cobra mín(vistas ÷ 1.000 × CPM, tope por video, lo que quede) si pasa del mínimo, por orden de llegada (`enviadoEn`). En Ámbar, aprobar el clip de Nora Vidal (22.600 vistas) le paga US$ 11,30: 22,6 × US$ 0,50, por debajo del tope de US$ 25.",
      "El almacén escribe sin comprobar que el envío siga `en-revision` ni en qué estado está la campaña: los botones solo salen en los clips que esperan. Con servidor lo comprueba `agencias.revisar-envio`.",
      "Mientras la campaña acepte clips las vistas se releen; cuando deja de aceptarlos (finalizada, vencida o agotada) la última lectura es la que reparte (`vistasCongeladas`).",
    ],
    estados: [
      {
        estado: "en-revision",
        significa: "Entregado; espera la decisión de la agencia.",
      },
      { estado: "aprobado", significa: "Cuenta para la liquidación." },
      { estado: "rechazado", significa: "No cobra; lleva el motivo." },
    ],
    endpoints: ["agencias.revisar-envio", "agencias.listar-envios"],
    datos:
      "`cambiosEnvio` y `cambiosParticipacion` en `clipealo-campanas-v1`. En Ámbar espera el clip de Nora Vidal (`env_nora_01`).",
    respuesta:
      "`toast.success` «Clip aprobado» · «{título} empieza a cobrar por sus vistas.» (suena «ding»).",
    origen: [
      "components/campanas/campaign-detail.tsx:114",
      "components/campanas/campaign-detail.tsx:118",
      "components/campanas/campaign-detail.tsx:129",
      "hooks/use-campanas.ts:367",
      "lib/campanas.ts:269",
      "lib/campanas.ts:308",
      "lib/campanas.ts:1212",
    ],
    relacionadas: ["agencias.rechazar-envio", "agencias.finalizar-campana"],
  },
  {
    id: "agencias.rechazar-envio",
    area: "agencias",
    titulo: "Rechazar un clip entregado",
    resumen:
      "La agencia no acepta un clip; si al clipero le queda plazo, puede entregar otro.",
    quien: ["agencia"],
    donde: [
      {
        ruta: "/campanas/[id]",
        etiqueta: "Ficha de la campaña › «Gestionar tu campaña»",
      },
    ],
    pasos: ["En el clip por revisar pulsa «Rechazar»."],
    reglas: [
      "No se elige motivo ni se pide confirmación: el envío queda `rechazado` siempre con «No cumple los requisitos de la campaña.», guardado en el idioma de quien revisa, como contenido.",
      "La participación vuelve a `aceptada` y pierde el clip. Si le queda plazo, vuelve a trabajar y sigue impidiendo finalizar hasta que entregue otro o caduque; si no, el reloj la da por caducada y deja de impedirlo. (El comentario de `revisarEnvio` dice que en los dos casos deja de bloquear: no es así, `bloqueaCierre` cuenta las `aceptada` en plazo.)",
      "En Ámbar, rechazar el clip de Nora Vidal la deja caducada al momento (su plazo acabó el 12 de septiembre) y le abre a la agencia la reclamación «No entregó el clip».",
      "Un clip rechazado no cuenta en la liquidación.",
    ],
    endpoints: ["agencias.revisar-envio"],
    datos: "`cambiosEnvio` y `cambiosParticipacion` en `clipealo-campanas-v1`.",
    respuesta:
      'Aviso neutro con sonido de borrado (`sound: "remove"`): «Clip rechazado», con el título del clip.',
    origen: [
      "components/campanas/campaign-detail.tsx:125",
      "components/campanas/campaign-detail.tsx:132",
      "hooks/use-campanas.ts:382",
      "lib/participacion.ts:188",
      "lib/participacion.ts:446",
    ],
    relacionadas: ["agencias.aprobar-envio", "agencias.reclamar-compromiso"],
  },

  /* -------------------------------------------------------------------------
     Pausar, cerrar y finalizar
     ------------------------------------------------------------------------- */
  {
    id: "agencias.pausar-campana",
    area: "agencias",
    titulo: "Pausar una campaña",
    resumen: "La agencia para la campaña: no admite clips de nadie hasta que la reanude.",
    quien: ["agencia"],
    donde: [
      {
        ruta: "/campanas/[id]",
        etiqueta: "Ficha de la campaña › «Gestionar tu campaña»",
      },
    ],
    pasos: ["En «Gestionar tu campaña» pulsa «Pausar campaña»."],
    reglas: [
      "El botón solo aparece con la campaña en estado visto `activa` o `pausada`: con las inscripciones cerradas (se ve «Inscripciones cerradas»), agotada, vencida o finalizada no sale.",
      "Pausada no acepta solicitudes ni clips, tampoco de los ya aceptados (`aceptaEnvios`).",
      "Lo que la agencia decide a mano manda sobre lo derivado: una pausada se enseña pausada aunque ya esté vencida.",
    ],
    endpoints: ["agencias.cambiar-estado-campana"],
    datos: "`cambios[id].estado` en `clipealo-campanas-v1`.",
    respuesta:
      "`toast.success` «Campaña pausada» · «No acepta clips nuevos hasta que la reanudes.» (suena «ding»).",
    origen: [
      "components/campanas/campaign-detail.tsx:466",
      "components/campanas/campaign-detail.tsx:471",
      "hooks/use-campanas.ts:308",
      "lib/campanas.ts:361",
      "lib/campanas.ts:383",
    ],
    relacionadas: ["agencias.reanudar-campana"],
  },
  {
    id: "agencias.reanudar-campana",
    area: "agencias",
    titulo: "Reanudar una campaña pausada",
    resumen: "La campaña vuelve a estar activa y a aceptar clips.",
    quien: ["agencia"],
    donde: [
      {
        ruta: "/campanas/[id]",
        etiqueta: "Ficha de la campaña › «Gestionar tu campaña»",
      },
    ],
    pasos: ["En «Gestionar tu campaña» pulsa «Reanudar campaña»."],
    reglas: [
      "Vuelve a `activa`; lo que se enseñe después lo decide `estadoVisible` (puede salir agotada, vencida o con las inscripciones cerradas).",
    ],
    endpoints: ["agencias.cambiar-estado-campana"],
    datos: "`cambios[id].estado` en `clipealo-campanas-v1`.",
    respuesta:
      "`toast.success` «Campaña reanudada» · «Vuelve a aceptar clips.» (suena «ding»).",
    origen: ["components/campanas/campaign-detail.tsx:473", "lib/campanas.ts:356"],
    relacionadas: ["agencias.pausar-campana"],
  },
  {
    id: "agencias.cerrar-inscripciones",
    area: "agencias",
    titulo: "Cerrar las inscripciones",
    resumen:
      "La agencia deja de admitir gente nueva y termina con la que ya está dentro; lo que quede sin decidir se rechaza.",
    quien: ["agencia"],
    donde: [
      { ruta: "/campanas/[id]", etiqueta: "Ficha de la campaña › «Cerrar la campaña»" },
    ],
    pasos: [
      "En «Cerrar la campaña» (con la insignia «Inscripciones abiertas») pulsa «Cerrar inscripciones».",
      "Si hay solicitudes sin decidir, confirma en «¿Cerrar las inscripciones de «{título}»?» con «Cerrar y rechazar» (o «Seguir admitiendo»). Si no hay ninguna, se cierra sin preguntar.",
    ],
    reglas: [
      "Las solicitudes sin decidir se rechazan en bloque con el motivo `inscripciones-cerradas`: nadie se queda esperando una respuesta que no va a llegar.",
      "Los ya aceptados siguen pudiendo entregar: la campaña se enseña `cerrada` y `aceptaEnvios` los deja pasar.",
      "No aparece con la campaña finalizada.",
    ],
    endpoints: ["agencias.cambiar-inscripciones", "agencias.decidir-solicitud"],
    datos:
      "`cambios[id].inscripcionesAbiertas = false` y un rechazo por solicitud en `cambiosParticipacion` (`clipealo-campanas-v1`).",
    respuesta:
      "`toast.success` «Inscripciones cerradas» · «No entra gente nueva y se rechazaron {n} solicitudes.» (suena «ding»).",
    origen: [
      "components/campanas/cerrar-campana.tsx:105",
      "components/campanas/cerrar-campana.tsx:116",
      "components/campanas/cerrar-campana.tsx:146",
      "hooks/use-campanas.ts:527",
      "lib/campanas.ts:383",
    ],
    relacionadas: ["agencias.reabrir-inscripciones", "agencias.finalizar-campana"],
  },
  {
    id: "agencias.reabrir-inscripciones",
    area: "agencias",
    titulo: "Volver a abrir las inscripciones",
    resumen: "La campaña vuelve a admitir solicitudes de gente nueva.",
    quien: ["agencia"],
    donde: [
      { ruta: "/campanas/[id]", etiqueta: "Ficha de la campaña › «Cerrar la campaña»" },
    ],
    pasos: ["Con «Inscripciones cerradas», pulsa «Volver a abrir inscripciones»."],
    reglas: [
      "Las solicitudes que se rechazaron al cerrar no vuelven solas: tendrán que solicitarlo otra vez.",
    ],
    endpoints: ["agencias.cambiar-inscripciones"],
    datos: "`cambios[id].inscripcionesAbiertas = true` en `clipealo-campanas-v1`.",
    respuesta:
      "`toast.success` «Inscripciones abiertas» · «La campaña vuelve a admitir solicitudes.» (suena «ding»).",
    origen: ["components/campanas/cerrar-campana.tsx:123", "hooks/use-campanas.ts:527"],
    relacionadas: ["agencias.cerrar-inscripciones"],
  },
  {
    id: "agencias.finalizar-campana",
    area: "agencias",
    titulo: "Finalizar una campaña",
    resumen:
      "La agencia cierra la campaña para todos, solo cuando no queda trabajo pendiente con nadie.",
    quien: ["agencia"],
    donde: [
      { ruta: "/campanas/[id]", etiqueta: "Ficha de la campaña › «Cerrar la campaña»" },
    ],
    pasos: [
      "En «Cerrar la campaña» mira el texto bajo «Finalizar campaña»: o «No queda trabajo pendiente: puedes finalizar cuando quieras.» o lo que falta.",
      "Pulsa «Finalizar campaña».",
      "Confirma en «¿Finalizar «{título}»?» con «Finalizar campaña» (o «Seguir abierta»).",
    ],
    reglas: [
      "Solo se puede con cero pendientes (`puedeFinalizar`). Cuentan como pendientes las aceptadas dentro de plazo, las entregadas sin revisar y las que están en disputa; no cuentan las solicitadas, cumplidas, rechazadas, retiradas ni caducadas.",
      "El botón apagado dice exactamente qué falta: «Te faltan 1 clip por revisar y 1 clipero con plazo hasta el {fecha}.»; la fecha es el último plazo de los aceptados.",
      "En Ámbar no se puede finalizar al abrir la demo: falta revisar el clip de Nora Vidal y Kai Moreno tiene plazo hasta el 16 de septiembre de 2026.",
      "Finalizar no se deshace: deja de aceptar clips y se cierra para todos; las vistas se congelan y la última lectura es la que reparte.",
      "La confirmación no vuelve a comprobar: `finalizarCampana` «solo escribe la decisión» con lo que había al pintar el botón. Con servidor lo comprueba `agencias.finalizar-campana` con su hora.",
    ],
    endpoints: ["agencias.finalizar-campana", "agencias.listar-participaciones"],
    datos: '`cambios[id].estado = "finalizada"` en `clipealo-campanas-v1`.',
    respuesta:
      "El botón de confirmar es destructivo. Después, `toast.success` «Campaña finalizada» · «Nadie queda con trabajo por entregar.» (suena «ding»).",
    origen: [
      "components/campanas/cerrar-campana.tsx:83",
      "components/campanas/cerrar-campana.tsx:127",
      "components/campanas/cerrar-campana.tsx:168",
      "components/campanas/cerrar-campana.tsx:219",
      "lib/participacion.ts:188",
      "lib/participacion.ts:204",
      "lib/participacion.ts:222",
      "hooks/use-campanas.ts:540",
      "lib/campanas.ts:269",
    ],
    relacionadas: [
      "agencias.cerrar-inscripciones",
      "agencias.aprobar-envio",
      "agencias.reclamar-compromiso",
      "backoffice.finalizar-campana",
    ],
  },
  {
    id: "agencias.reclamar-compromiso",
    area: "agencias",
    titulo: "Reclamar sobre el compromiso de un clipero",
    resumen:
      "Si un clipero aceptado no entrega o su clip publicado incumple los requisitos, la agencia abre una reclamación y decide el admin.",
    quien: ["agencia"],
    donde: [
      { ruta: "/campanas/[id]", etiqueta: "Ficha de la campaña › «Quién está dentro»" },
    ],
    pasos: [
      "En «Quién está dentro», pulsa «Reclamar» junto al clipero (solo aparece si hay algo que reclamar).",
      "En «Abrir una reclamación», «¿Qué ha pasado?» ofrece solo el motivo que cabe, ya marcado: «No entregó el clip» si se le pasó el plazo, o «El clip no cumple» si lo entregó o ya se lo aprobaron.",
      "Si quiere, escribe en «Cuéntalo con tus palabras (opcional)».",
      "Lee el aviso «Lo revisa el equipo de Clipealo» y pulsa «Enviar reclamación».",
    ],
    reglas: [
      "La agencia puede reclamar `no-entrego` cuando el compromiso ya está caducado, y `contenido` cuando el clip está entregado o cumplido (`disputasPosibles`).",
      "Un compromiso con una reclamación abierta no admite otra: con `disputaId` no hay motivo posible y el botón «Reclamar» no sale.",
      "El detalle tiene como mucho 280 caracteres (`NOTA_MAX`).",
      "Mientras esté abierta, la participación queda `en-disputa` e impide finalizar la campaña; solo el laudo del admin la desbloquea.",
      "El aviso del diálogo promete que «el dinero en juego queda reservado», pero `liquidar` hoy no reserva nada: reparte entre los envíos aprobados, estén o no en disputa.",
    ],
    estados: [
      { estado: "abierta", significa: "Recién abierta, en la cola de /admin/disputas." },
      {
        estado: "en-revision",
        significa:
          "Está en el catálogo (`ESTADOS_DISPUTA`), pero hoy ninguna acción la pone ahí.",
      },
      {
        estado: "resuelta",
        significa: "Con laudo: liberar plaza, dar prórroga, pagar al clipero o sin pago.",
      },
    ],
    endpoints: ["campanas.crear-disputa"],
    datos: "`disputas` y `cambiosParticipacion` en `clipealo-campanas-v1`.",
    respuesta:
      "`toast.success` «Reclamación enviada» · «El equipo de Clipealo la revisa y decide. Te avisamos con el resultado.» (suena «ding»).",
    origen: [
      "components/campanas/solicitudes-agencia.tsx:524",
      "components/campanas/disputa-dialog.tsx:111",
      "components/campanas/disputa-dialog.tsx:146",
      "components/campanas/disputa-dialog.tsx:188",
      "lib/participacion.ts:436",
      "lib/participacion.ts:467",
      "hooks/use-campanas.ts:550",
      "lib/campanas.ts:308",
    ],
    relacionadas: [
      "agencias.finalizar-campana",
      "agencias.ver-tablero-campana",
      "backoffice.dictar-laudo",
      "campanas.abrir-reclamacion",
    ],
  },
]
