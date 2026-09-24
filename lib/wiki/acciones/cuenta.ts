import type { Accion } from "@/lib/wiki/tipos"

/**
 * Acciones de «cuenta»: Ajustes (Perfil, Público, Cuentas conectadas,
 * Notificaciones y Tus datos), la campana de avisos, el menú de usuario
 * (sonidos, idioma, perfil de demo y reiniciar demo) y el tema.
 *
 * Se documentan en su área y no aquí: «Plan y facturación» (planes), «Editar»
 * una respuesta y «Ver la bienvenida» de Tus datos (`onboarding.editar-toma`,
 * `onboarding.ver-bienvenida-otra-vez`), «Cerrar sesión» (`acceso.cerrar-sesion`)
 * y, del menú de usuario, «Mejorar plan», «Plan · demo», «Enviar comentarios»,
 * «Backoffice» y «Wiki del producto».
 */
export const ACCIONES: Accion[] = [
  {
    id: "cuenta.editar-perfil",
    area: "cuenta",
    titulo: "Editar el perfil del canal",
    resumen:
      "Cambia el nombre que firma tus clips como marca de agua, las plataformas donde transmites y tu país.",
    quien: ["clipero", "agencia"],
    donde: [{ ruta: "/ajustes?seccion=perfil", etiqueta: "Ajustes › Perfil" }],
    pasos: [
      "Abre Ajustes: «Perfil» es la pestaña por defecto (tarjeta «Información del canal»).",
      "En «Nombre del canal» escribe el nombre sin arroba: la @ ya va delante y, si la pegas, se quita sola.",
      "En «Plataformas donde transmites» marca o desmarca Twitch, YouTube, Kick, TikTok o Facebook.",
      "Elige tu «País» en la lista.",
      "Pulsa «Guardar cambios». «Descartar» vuelve a lo guardado.",
    ],
    reglas: [
      "El nombre se valida mientras se escribe con `validarCanal` (lib/ajustes.ts:83): de 3 (`CANAL_MIN`) a 30 (`CANAL_MAX`) caracteres, solo letras sin tilde, números, punto y guion bajo. Con error, el campo se marca y «Guardar cambios» se queda apagado.",
      "El campo no admite más de 30 caracteres y quita las arrobas del principio al escribir o pegar (components/app/profile-settings.tsx:249). Se guarda sin espacios en los extremos.",
      "«Guardar cambios» solo se enciende si el borrador es distinto de lo guardado, y «Descartar» solo aparece entonces (components/app/settings-save-bar.tsx:26).",
      "Las plataformas son de dónde sale tu video, no dónde se publica: las redes de publicación se conectan en «Cuentas conectadas» (lib/ajustes.ts:32). Se puede no marcar ninguna.",
      "Hay 9 países —Perú, México, Colombia, Chile, Argentina, España, Ecuador, Brasil y Estados Unidos (lib/countries.ts:9)—, ordenados por su nombre en el idioma activo. El de la demo es Perú.",
      "Cambiar el país aquí cambia también el país de la cuenta, el mismo dato que la toma «basicos» de la bienvenida, marcado como declarado con la fecha del cambio (hooks/use-cuenta.ts:876).",
      "La bienvenida también escribe aquí (hooks/use-cuenta.ts:577): el país, las plataformas de directo y, si el enlace del canal que da el creador trae un nombre que pasa `validarCanal`, el nombre del canal (hooks/use-cuenta.ts:606).",
      "Mientras no se edita, la pantalla enseña lo guardado: un cambio hecho en otra pestaña aparece solo.",
    ],
    errores: [
      {
        codigo: "tooShort",
        cuando: "El nombre tiene menos de 3 caracteres.",
        frase: "settings.profile.channel.errors.tooShort",
        bloquea: true,
      },
      {
        codigo: "tooLong",
        cuando: "El nombre tiene más de 30 caracteres.",
        frase: "settings.profile.channel.errors.tooLong",
        bloquea: true,
      },
      {
        codigo: "invalidChars",
        cuando: "El nombre lleva tildes, espacios u otros signos.",
        frase: "settings.profile.channel.errors.invalidChars",
        bloquea: true,
      },
    ],
    endpoints: ["cuenta.leer", "cuenta.guardar-perfil"],
    datos:
      "Almacén del navegador `clipealo-cuenta-v1` (hooks/use-cuenta.ts), campo `perfilCanal`; mientras se edita hay un borrador en la pantalla. Semilla (`perfilInicial`, lib/ajustes.ts:65): canal «clipealo», YouTube y TikTok, Perú, America/Lima.",
    respuesta:
      "`toast.success` «Perfil guardado» · «Tus próximos clips llevarán la marca de agua @{channel}.», con su «ding». «Guardar cambios» es el botón `brand` de la vista: suena «pop» y se encuadra con la marca de recorte. Cada plataforma suena «tap» al marcarla o desmarcarla.",
    origen: [
      "components/app/profile-settings.tsx:105",
      "components/app/profile-settings.tsx:422",
      "lib/ajustes.ts:83",
      "hooks/use-cuenta.ts:876",
    ],
    relacionadas: [
      "cuenta.cambiar-foto",
      "cuenta.cambiar-zona-horaria",
      "cuenta.conectar-red",
    ],
  },
  {
    id: "cuenta.cambiar-foto",
    area: "cuenta",
    titulo: "Cambiar la foto del canal",
    resumen: "Pone una foto en tu perfil en lugar de las iniciales.",
    quien: ["clipero", "agencia"],
    donde: [{ ruta: "/ajustes?seccion=perfil", etiqueta: "Ajustes › Perfil" }],
    pasos: [
      "En Ajustes › Perfil pulsa el botón redondo de la esquina del avatar (se anuncia como «Cambiar la foto del canal»).",
      "Elige un PNG, JPG o WebP de tu equipo.",
      "La foto aparece en el avatar. Pulsa «Guardar cambios» para quedártela o «Descartar» para volver a la anterior.",
    ],
    reglas: [
      "Solo `image/png`, `image/jpeg` o `image/webp` (`AVATAR_TIPOS`, lib/ajustes.ts:91).",
      "Como mucho 5 MB (`AVATAR_MAX_BYTES` = 5 × 1024 × 1024, lib/ajustes.ts:92). El aviso dice cuánto pesa el archivo y cuál es el máximo.",
      "Sin foto, el avatar enseña las iniciales del nombre de la cuenta: «Ana Ruiz» → «AR».",
      "Hoy la foto es una URL `blob:` que solo vive en esta pestaña: al recargar se descarta y vuelven las iniciales (hooks/use-cuenta.ts:392). Para conservarla hace falta `cuenta.subir-avatar`.",
      "El avatar del menú de usuario no lee la foto: siempre enseña las iniciales (components/app/user-nav.tsx:51).",
    ],
    errores: [
      {
        codigo: "invalid",
        cuando: "El archivo no es PNG, JPG ni WebP.",
        frase: "settings.profile.photo.invalid.title",
        bloquea: true,
      },
      {
        codigo: "tooBig",
        cuando: "El archivo pesa más de 5 MB.",
        frase: "settings.profile.photo.tooBig.title",
        bloquea: true,
      },
    ],
    endpoints: ["cuenta.subir-avatar", "cuenta.guardar-perfil"],
    datos:
      "Borrador de la pantalla y, al guardar, `perfilCanal.avatarUrl` en `clipealo-cuenta-v1`. Las URL `blob:` no sobreviven a la recarga ni pasan a otra pestaña.",
    respuesta:
      "Si el archivo no vale: `toast.error` «Esa imagen no sirve» («Usa un PNG, JPG o WebP.») o «La imagen pesa demasiado» («Pesa {size}; el máximo es {max}.»), con sonido de error y sacudida del aviso. Al guardar, el `toast.success` «Perfil guardado» de la edición del perfil.",
    origen: [
      "components/app/profile-settings.tsx:160",
      "lib/ajustes.ts:91",
      "hooks/use-cuenta.ts:392",
    ],
    relacionadas: ["cuenta.editar-perfil"],
  },
  {
    id: "cuenta.cambiar-zona-horaria",
    area: "cuenta",
    titulo: "Elegir la zona horaria",
    resumen:
      "Fija la hora con la que se programan tus publicaciones y se lee tu calendario, abras la app desde donde la abras.",
    quien: ["clipero", "agencia"],
    donde: [
      { ruta: "/ajustes?seccion=perfil", etiqueta: "Ajustes › Perfil › Zona horaria" },
    ],
    pasos: [
      "En Ajustes › Perfil abre «Zona horaria».",
      "Elige la ciudad: al lado de cada una va su desfase (p. ej. «GMT-5»).",
      "Si no es la de tu dispositivo, debajo se lee «La de este dispositivo ({zona})».",
      "Pulsa «Guardar cambios». Hoy el botón solo se enciende si además cambias otro dato del perfil (ver reglas).",
    ],
    reglas: [
      "La lista son las zonas que conoce el navegador (`zonasDisponibles`, lib/fechas.ts:247), siempre con America/Lima y la guardada dentro, ordenadas por su nombre IANA.",
      "Por defecto, America/Lima (`ZONA_POR_DEFECTO`, lib/fechas.ts:35): Perú es el país por defecto de la cuenta. Una cuenta nueva también arranca en America/Lima, no en la zona del navegador (hooks/use-cuenta.ts:639).",
      "Es de la cuenta y no del navegador: quien abre la agenda desde otro país sigue viendo las horas de su zona (lib/ajustes.ts:59). El Calendario y la campana de avisos la usan para saber a qué día pertenece cada publicación.",
      "Hoy cambiar SOLO la zona no enciende «Guardar cambios»: la comparación del borrador con lo guardado (`mismos`, components/app/profile-settings.tsx:86) no mira la zona. Se guarda si a la vez cambia otro campo del perfil.",
      "Una zona guardada que este dispositivo no conozca vuelve a America/Lima al leerla (`zonaValida`, hooks/use-cuenta.ts:404).",
    ],
    endpoints: ["cuenta.guardar-perfil"],
    datos: "`perfilCanal.zona` en `clipealo-cuenta-v1`.",
    respuesta: "La del perfil: `toast.success` «Perfil guardado».",
    origen: [
      "components/app/profile-settings.tsx:361",
      "components/app/profile-settings.tsx:86",
      "lib/ajustes.ts:59",
      "lib/fechas.ts:247",
    ],
    relacionadas: ["cuenta.editar-perfil"],
  },
  {
    id: "cuenta.editar-publico",
    area: "cuenta",
    titulo: "Definir tu público",
    resumen:
      "Le dice a la IA a quién le habla tu canal para elegir momentos y escribir títulos, descripciones y hashtags.",
    quien: ["clipero", "agencia"],
    donde: [{ ruta: "/ajustes?seccion=publico", etiqueta: "Ajustes › Público" }],
    pasos: [
      "Abre Ajustes › Público (tarjeta «Tu público»).",
      "En «Temática del canal» elige hasta 3 temas; al llegar a 3, el resto se apaga hasta que quites uno.",
      "En «Edad de tu audiencia» marca los rangos que más te ven.",
      "Elige el «Idioma de tu audiencia».",
      "Enciende o apaga «Ocultar palabrotas en los subtítulos».",
      "Elige el «Tono de los títulos»: Cercano, Divertido, Profesional o Directo, cada uno con un título de ejemplo.",
      "Pulsa «Guardar cambios» o «Descartar».",
    ],
    reglas: [
      "Hasta 3 temas (`TEMAS_MAX`, lib/ajustes.ts:111) de 10: Gaming, Podcast y entrevistas, Educación, Humor, Deportes, Música, Negocios y finanzas, Tecnología, Estilo de vida y Actualidad.",
      "Edades: 13–17, 18–24, 25–34, 35–44 y 45+ (lib/ajustes.ts:113).",
      "9 idiomas de audiencia —los de subtítulos de los planes de pago—: es, en, pt, fr, it, de, ca, eu y gl, nombrados en el idioma de la interfaz (lib/ajustes.ts:121). Es el idioma de títulos, descripciones y hashtags; el de la interfaz se cambia en Perfil.",
      "Ocultar palabrotas las tapa con asteriscos en los subtítulos; el audio del clip no cambia.",
      "No filtra nada: orienta a la IA (components/app/audience-settings.tsx:72). La pantalla dice que se aplica a los próximos videos que subas.",
      "Hoy nadie más lo lee: `createJob` no lo envía al crear el trabajo (lib/api/jobs.ts:139). El render tendrá que leerlo de la cuenta.",
      "La bienvenida escribe aquí (hooks/use-cuenta.ts:577): sus nichos pasan a temas (solo los que son temas, hasta 3; «Aún no lo sé» no toca nada) y, si el idioma de la audiencia no está entre los idiomas que respondió, pasa a ser el primero de ellos (hooks/use-cuenta.ts:584). Lo que se guarda en Público no vuelve a las respuestas de la bienvenida.",
    ],
    endpoints: ["cuenta.leer", "cuenta.guardar-publico"],
    datos:
      "`publico` en `clipealo-cuenta-v1`; borrador en la pantalla mientras se edita. Semilla (`publicoInicial`, lib/ajustes.ts:145): Podcast y Negocios, 18–24 y 25–34, español, tono cercano, palabrotas visibles.",
    respuesta:
      "`toast.success` «Público guardado» · «Se aplica a los próximos videos que subas.», con su «ding». «Guardar cambios» suena «pop» con la marca de recorte; temas y edades suenan «tap» al marcarlos o desmarcarlos, el tono «tap» al elegir uno nuevo y el interruptor, `toggle-on` / `toggle-off`.",
    origen: [
      "components/app/audience-settings.tsx:79",
      "components/app/audience-settings.tsx:248",
      "lib/ajustes.ts:137",
      "hooks/use-cuenta.ts:888",
    ],
    relacionadas: ["cuenta.editar-perfil"],
  },
  {
    id: "cuenta.conectar-red",
    area: "cuenta",
    titulo: "Conectar una red social",
    resumen:
      "Da permiso a Clipealo para publicar en tu cuenta de TikTok, Instagram, YouTube, X, LinkedIn o Facebook.",
    quien: ["clipero", "agencia"],
    plan: {
      nota: "Prueba conecta 1 cuenta y solo de TikTok; Creador, 6; Empresa, 20, sumando todas las redes (`CUENTAS_POR_PLAN`, `NETWORKS_BY_PLAN`). La red que no entra se ve igual, con la tarjeta apagada y el motivo debajo. Publicar en ellas está en todos los planes; programar, desde Creador (`PLAN_MINIMO.programar`).",
    },
    donde: [
      { ruta: "/ajustes?seccion=cuentas", etiqueta: "Ajustes › Cuentas conectadas" },
    ],
    pasos: [
      "Abre Ajustes › Cuentas conectadas («Redes conectadas»). Arriba: «N de 6 conectadas · tu plan {plan} admite N cuentas sumando todas las redes».",
      "Las redes sin conectar tienen el borde discontinuo, «Sin conectar» y lo que admiten (p. ej. «Para ti · 9:16 · hasta 10 min»).",
      "Pulsa la tarjeta de la red.",
      "La tarjeta pasa a verde con «Conectada», la cuenta, sus seguidores (si los tiene) y «Desde el …».",
      "Si la tarjeta está apagada, el aviso de debajo dice por qué. La nota del final lleva a «Ver planes» (/precios).",
    ],
    reglas: [
      "Conectar pasa por `validarConexion` (lib/planes.ts:563): la red tiene que estar en las del escalón del plan (Prueba, solo TikTok; Creador y Empresa, las seis) y tus cuentas activas tienen que ser menos que las que admite el plan (1, 6 y 20 por defecto; el catálogo del backoffice puede cambiarlo).",
      "El cupo se cuenta con las cuentas de quien mira, por dueño: las de la agencia no gastan las del clipero (components/app/social-accounts.tsx:57).",
      "El contador de arriba cuenta redes, no cuentas: una red con dos cuentas cuenta una vez (components/app/social-accounts.tsx:109).",
      "Hoy las tarjetas enseñan las cuentas de los dos dueños, sea cual sea el perfil: con el perfil Usuario, Instagram y LinkedIn salen «Conectadas» con las cuentas de la agencia (@nebula.studio y @agencia-nebula), y pulsarlas las desconecta (components/app/social-accounts.tsx:64).",
      "Reconectar una red devuelve sus cuentas semilla, no una nueva. Si no tenía ninguna, la demo crea `cta_<red>_1` con «@clipealo», 0 seguidores y fecha fija del 9 sep 2026, siempre con dueño clipero aunque el perfil sea Agencia (components/app/social-accounts.tsx:83 y :97).",
      "Hoy reconectar TikTok devuelve sus dos cuentas semilla a la vez (@clipealo y @cortes.ana, components/app/social-accounts.tsx:84), pero `validarConexion` solo comprueba que quede sitio para una: se puede pasar del cupo del plan.",
      "Hoy no hay OAuth: conectar es un apunte en este navegador (docs/costuras-backend.md:61). Con servidor, el permiso que se pida a la red tiene que incluir publicar, no solo leer seguidores.",
      "Solo cuenta como conectada una cuenta con identidad (`handle`) y estado «conectada» (`cuentaActiva`, lib/social.ts:133).",
    ],
    estados: [
      {
        estado: "conectada",
        significa:
          "Tiene identidad y la conexión sigue viva: cuenta para el cupo y se puede publicar en ella.",
      },
      {
        estado: "caducada",
        significa:
          "La conexión expiró: deja de contar como activa y lo programado en ella se lee «Sin cuenta». Hoy ninguna acción de la app la produce; solo sale en los datos del backoffice.",
      },
      {
        estado: "revocada",
        significa:
          "Se retiró el permiso: igual que caducada, deja de contar. Existe para que el calendario distinga «ya no está» de «nunca la conectaste» (lib/social.ts:97).",
      },
    ],
    errores: [
      {
        codigo: "redFueraDelPlan",
        cuando: "La red no entra en el plan (en Prueba, todo lo que no sea TikTok).",
        frase: "settings.accounts.fueraDelPlan",
        bloquea: true,
      },
      {
        codigo: "cuentasAgotadas",
        cuando: "Ya tienes tantas cuentas activas como admite el plan.",
        frase: "settings.accounts.sinCupo",
        bloquea: true,
      },
    ],
    endpoints: [
      "cuenta.listar-redes",
      "cuenta.conectar-red",
      "planes.obtener-suscripcion",
    ],
    datos:
      "Almacén del navegador `clipealo-cuentas-v1` (hooks/use-cuentas-sociales.ts): guarda solo los ids de semillas desconectadas y las cuentas añadidas. Semillas (`socialAccounts`, lib/social.ts:142): @clipealo y @cortes.ana en TikTok y @clipealo en YouTube (clipero); @nebula.studio en Instagram y @agencia-nebula en LinkedIn (agencia).",
    respuesta:
      "`toast.celebrate` «{Red} conectada» · «Ya puedes publicar en {superficie} desde Clipealo.»: arpegio y confeti de esquinas de recorte desde el icono del aviso. Conectar una red es un hito (AGENTS.md, regla 7).",
    origen: [
      "components/app/social-accounts.tsx:66",
      "components/app/social-accounts.tsx:128",
      "lib/planes.ts:563",
      "hooks/use-cuentas-sociales.ts:107",
      "lib/pricing.ts:152",
      "lib/pricing.ts:515",
    ],
    relacionadas: [
      "cuenta.desconectar-red",
      "cuenta.cambiar-perfil-demo",
      "planes.consultar-redes-por-plan",
    ],
  },
  {
    id: "cuenta.desconectar-red",
    area: "cuenta",
    titulo: "Desconectar una red social",
    resumen: "Retira a Clipealo el acceso a tus cuentas de esa red.",
    quien: ["clipero", "agencia"],
    donde: [
      { ruta: "/ajustes?seccion=cuentas", etiqueta: "Ajustes › Cuentas conectadas" },
    ],
    pasos: [
      "En Ajustes › Cuentas conectadas, pasa por encima de una red conectada (borde verde, «Conectada»): aparece el icono de desenchufar.",
      "Pulsa la tarjeta.",
      "La tarjeta vuelve a «Sin conectar». Para reconectar, se pulsa otra vez.",
    ],
    reglas: [
      "Desconectar nunca pasa por el plan: siempre se puede, aunque tengas más cuentas de las que paga tu plan. Así quien baja de plan elige cuáles conserva (lib/planes.ts:596).",
      "El interruptor es de la RED: si tiene dos cuentas (la demo trae @clipealo y @cortes.ana en TikTok), se desconectan las dos (components/app/social-accounts.tsx:70).",
      "No pide confirmación.",
      "Lo publicado no cambia. Lo programado en esas cuentas queda «Sin cuenta» en el Calendario hasta que se vuelvan a conectar (lib/agenda.ts:269) y aparece en la campana de avisos.",
    ],
    endpoints: ["cuenta.desconectar-red", "cuenta.listar-redes"],
    datos:
      "Añade los ids a `desconectadas` en `clipealo-cuentas-v1` (hooks/use-cuentas-sociales.ts:118).",
    respuesta:
      "`toast` neutro «{Red} desconectada» · «Los clips ya publicados no se ven afectados; lo programado en esta cuenta se queda sin cuenta hasta que la vuelvas a conectar.», con el sonido `toggle-off` (el neutro no suena salvo que lo pida).",
    origen: [
      "components/app/social-accounts.tsx:69",
      "hooks/use-cuentas-sociales.ts:118",
      "lib/agenda.ts:269",
    ],
    relacionadas: [
      "cuenta.conectar-red",
      "cuenta.revisar-avisos",
      "calendario.revisar-pendientes",
    ],
  },
  {
    id: "cuenta.elegir-avisos",
    area: "cuenta",
    titulo: "Elegir qué avisos recibir",
    resumen:
      "Decide, aviso por aviso, si te llega por correo, en la app, por los dos o por ninguno.",
    quien: ["clipero", "agencia"],
    donde: [
      { ruta: "/ajustes?seccion=notificaciones", etiqueta: "Ajustes › Notificaciones" },
    ],
    pasos: [
      "Abre Ajustes › Notificaciones (o, desde la campana, «Elegir qué avisos quiero»).",
      "En la tabla «Avisos», enciende o apaga el interruptor de «Correo» o de «En la app» de cada aviso.",
      "No hay que guardar: cada cambio se aplica al momento («Los cambios se guardan al momento.»).",
    ],
    reglas: [
      "7 avisos y 2 canales. Por defecto (`TIPOS_AVISO`, lib/ajustes.ts:176): Clips listos, correo y app; Errores de procesado, correo y app; Publicaciones, solo app; Minutos por agotarse (al llegar al 80 % de los minutos del mes), correo y app; Resumen semanal (cada lunes), solo correo; Pagos y facturas, solo correo; Novedades de Clipealo (como mucho una vez al mes), ninguno.",
      "Un aviso nuevo en el catálogo entra con su valor por defecto y uno que desaparece se descarta (`migrarAvisos`, lib/ajustes.ts:200).",
      "Hoy solo se guarda la preferencia: no se manda ningún correo ni push (docs/costuras-backend.md:154). Es el contrato que tendrá que respetar quien mande los avisos.",
      "«Novedades de Clipealo» por correo y el permiso «Novedades y consejos por correo» de Tus datos son dos interruptores distintos y hoy no se sincronizan.",
    ],
    endpoints: ["cuenta.leer-avisos", "cuenta.cambiar-aviso"],
    datos: "Almacén del navegador `clipealo-avisos-v1` (hooks/use-avisos.ts).",
    respuesta:
      "Sin aviso: cada interruptor suena al cambiar (`toggle-on` / `toggle-off`) y eso basta (components/app/notification-settings.tsx:20).",
    origen: [
      "components/app/notification-settings.tsx:79",
      "hooks/use-avisos.ts:79",
      "lib/ajustes.ts:176",
    ],
    relacionadas: ["cuenta.revisar-avisos", "cuenta.cambiar-consentimiento"],
  },
  {
    id: "cuenta.revisar-avisos",
    area: "cuenta",
    titulo: "Revisar la campana de avisos",
    resumen:
      "Ve de un vistazo lo que pide una mano: publicaciones que no salieron, respuestas del equipo y tus primeras misiones.",
    quien: ["clipero", "agencia"],
    donde: [
      {
        ruta: "/dashboard",
        etiqueta: "Barra superior › Notificaciones (en todas las pantallas de la app)",
      },
    ],
    pasos: [
      "Pulsa la campana de la barra superior. Si hay algo pendiente, lleva un punto de color.",
      "Arriba salen «Tus primeras misiones» que quedan, con «N de M»; cada una lleva a donde se cumple.",
      "Si el equipo te respondió, un enlace a Ayuda con las respuestas sin leer.",
      "Debajo, las publicaciones que piden algo, con su fecha y hora: pulsa una para abrir ese día en el Calendario.",
      "Sin nada pendiente dice «No hay nada esperándote…». Al pie, «Elegir qué avisos quiero» lleva a Ajustes › Notificaciones.",
    ],
    reglas: [
      "Las publicaciones que salen son las que piden algo: fallidas, sin cuenta, o las que publica la persona y se le pasó la hora (`necesitanAtencion`, lib/agenda.ts:298), ordenadas por fecha.",
      "Las respuestas del equipo cuentan mientras no se abren (`respuestasSinLeer`, lib/feedback.ts:228).",
      "Las misiones solo salen mientras quedan: lo hecho no es un aviso (components/onboarding/misiones.tsx:186). Solo las tiene una cuenta clipero que no clipea únicamente sus videos (`misionesDe`, lib/micro-preguntas.ts:465); las de campañas no salen si el plan no deja participar.",
      "El punto se pinta solo si hay algo, sea cual sea el plan: publicar es de todos (components/app/avisos-boton.tsx:28).",
      "El día al que lleva cada publicación es el día civil en la zona horaria de la cuenta, no el de UTC (components/app/avisos-boton.tsx:42).",
    ],
    endpoints: [
      "calendario.listar",
      "cuenta.listar-redes",
      "ayuda.listar",
      "cuenta.leer",
      "proyectos.listar",
      "planes.obtener-suscripcion",
    ],
    datos:
      "Lee almacenes del navegador: la agenda (`clipealo-agenda-v1`), las cuentas conectadas (`clipealo-cuentas-v1`) y el casillero (`clipealo-feedback-v1`). Las misiones salen de la cuenta, el plan, los envíos y las campañas desbloqueadas, las cuentas conectadas y los proyectos de la frontera `listJobs` (GET /jobs).",
    respuesta: "Ninguna: abrirla es navegación y no suena.",
    origen: [
      "components/app/avisos-boton.tsx:35",
      "lib/agenda.ts:298",
      "lib/feedback.ts:228",
      "components/onboarding/misiones.tsx:186",
    ],
    relacionadas: [
      "cuenta.elegir-avisos",
      "cuenta.desconectar-red",
      "onboarding.seguir-misiones",
      "ayuda.abrir-respuestas-desde-avisos",
    ],
  },
  {
    id: "cuenta.cambiar-consentimiento",
    area: "cuenta",
    titulo: "Decidir para qué se usan tus datos",
    resumen:
      "Da o retira tu permiso finalidad por finalidad; cada decisión queda anotada con fecha y versión del aviso.",
    quien: ["clipero", "agencia"],
    donde: [
      {
        ruta: "/ajustes?seccion=datos",
        etiqueta: "Ajustes › Tus datos › Para qué usamos tus datos",
      },
    ],
    pasos: [
      "Abre Ajustes › Tus datos y baja a «Para qué usamos tus datos».",
      "Enciende o apaga cada finalidad: «Usar mis respuestas en las estadísticas de la plataforma», «Contar conmigo en los informes de sector», «Novedades y consejos por correo» y «Alertas de creadores por correo».",
      "Si tu cuenta es de agencia, además: «Novedades para marcas por correo» y «Que alguien del equipo me ayude con la primera campaña».",
      "No hay que guardar: el cambio se aplica al momento y aparece arriba del «Historial de consentimientos».",
    ],
    reglas: [
      "Cada cambio añade una entrada al registro y nunca reescribe las anteriores; lo que se ve es el valor vigente, la última entrada de cada finalidad (lib/privacidad.ts:104 y :112).",
      "Cada entrada guarda la finalidad, la decisión, la versión del aviso («privacidad-2026-10-v1», lib/privacidad.ts:31), el idioma, el origen «ajustes», la clave exacta del texto mostrado y la fecha.",
      "Sin ninguna entrada vale `VALOR_POR_DEFECTO` (lib/privacidad.ts:62): las estadísticas de plataforma vienen activas (aviso con derecho de oposición) y todo lo opcional, apagado.",
      "Lo necesario para darte el servicio (tu cuenta, las campañas, los pagos y la moderación) no se puede apagar: términos, privacidad y mayoría de edad no salen aquí.",
      "Oponerse a las estadísticas promete que dejas de contar en cualquier agregado (components/app/privacy-settings.tsx:74), pero hoy ningún agregado lee este permiso: lo tendrá que cumplir el servidor. Fuera del admin los agregados van en grupos de 50 o más (`UMBRAL_PUBLICO`, lib/privacidad.ts:138); los informes de sector suman tus respuestas a las de al menos 49 personas más.",
      "El evento `consentimiento_cambiado` solo se registra si el valor vigente cambia (hooks/use-cuenta.ts:846).",
      'El servidor no se fía de la pantalla: desde Ajustes (`origen: "ajustes"`) no acepta apagar términos, privacidad ni mayoría de edad, y `textoId` llega como `settings.datos.permisos.<clave>.label` (components/app/privacy-settings.tsx:102).',
    ],
    endpoints: ["onboarding.consentir", "cuenta.leer"],
    datos:
      "`consentimientos` de la cuenta en `clipealo-cuenta-v1`. La demo trae 4 entradas del registro del 18 ago 2026: términos, privacidad, mayoría de edad y estadísticas (hooks/use-cuenta.ts:174).",
    respuesta:
      "Sin aviso: el interruptor suena `toggle-on` / `toggle-off` y la entrada nueva aparece en el historial.",
    origen: [
      "components/app/privacy-settings.tsx:152",
      "components/onboarding/permisos.tsx:58",
      "hooks/use-cuenta.ts:830",
      "lib/privacidad.ts:62",
    ],
    relacionadas: ["cuenta.consultar-tus-datos", "cuenta.elegir-avisos"],
  },
  {
    id: "cuenta.consultar-tus-datos",
    area: "cuenta",
    titulo: "Consultar lo que Clipealo guarda de ti",
    resumen:
      "Ve cuánto de tu perfil está completo, lo que respondiste, cuánto se guarda cada dato, lo que nunca se pregunta y el historial de tus permisos.",
    quien: ["clipero", "agencia"],
    donde: [{ ruta: "/ajustes?seccion=datos", etiqueta: "Ajustes › Tus datos" }],
    pasos: [
      "Abre Ajustes › Tus datos.",
      "Arriba: «Perfil completado al N %» con su barra y la «Precisión de tus recomendaciones» (baja, media o alta). Debajo, «Ver la bienvenida».",
      "Al lado, «Lo que nos contaste»: cada toma de la bienvenida con tu respuesta, «Saltada» o «Sin responder», y su «Editar».",
      "Más abajo, «Cuánto guardamos cada dato» y «Lo que nunca te preguntamos».",
      "Al final, el «Historial de consentimientos»: se ven 5 entradas; «Ver todo el historial (N)» despliega el resto y «Ver menos» lo recoge.",
    ],
    reglas: [
      "La rama que puntúa es la de agencia si la cuenta es de agencia, la de creador si su objetivo es clipear solo sus videos y, si no, la de clipero (`ramaDe`, lib/onboarding.ts:1039).",
      "La completitud suma pesos por rama (`PESOS_COMPLETITUD`, lib/onboarding.ts:1002). Clipero: nichos 20, redes 15, cuenta conectada 20, fandom 15, país e idiomas 10, tamaño 10, experiencia 10. Creador: plataformas y frecuencia 25, tema del canal 20, enlace 15, redes 15, país e idiomas 10, cuenta conectada 15. Agencia: 10 por cada uno de sus diez datos.",
      "Una cuenta conectada en «Cuentas conectadas» cuenta aunque no se hayan medido sus seguidores (lib/onboarding.ts:1082). La demo, Ana, está al 85 %.",
      "Precisión: baja por debajo de 40, media de 40 a 69, alta desde 70 (lib/onboarding.ts:1143).",
      "«Lo que nos contaste» enseña solo las tomas del flujo de la cuenta, nunca la del resultado final (components/app/privacy-settings.tsx:326). «Editar» abre la bienvenida en esa toma (`/bienvenida?paso=…`, components/app/privacy-settings.tsx:455), y lo que se cambie allí se copia a Perfil y Público (hooks/use-cuenta.ts:577).",
      "Plazos de conservación, propuestos y a validar con abogado (`PLAZOS_CONSERVACION`, lib/privacidad.ts:161): tus respuestas se borran a los 18 meses sin actividad (se quedan país y consentimientos); el historial de consentimientos, mientras tengas la cuenta y el plazo legal de tu país; los seguidores que declares, hasta que se mida la cuenta; cómo llegaste, 12 meses; cómo recorriste la bienvenida, 24 meses sin el contenido.",
      "Nunca se pregunta: fecha de nacimiento (la comprueba el proveedor de verificación en el primer retiro), género, ingresos, ciudad, dirección o teléfono, religión, ideas políticas, salud ni datos de la familia (lib/privacidad.ts:187).",
      "El historial va del más reciente al más antiguo, con fecha y hora en la zona de quien mira, y columnas Fecha, Finalidad, Decisión, Dónde y Versión del aviso (components/app/privacy-settings.tsx:219).",
      "Hoy no hay forma de descargar o exportar tus datos: la pantalla solo los enseña.",
    ],
    endpoints: ["cuenta.leer", "onboarding.leer-respuestas", "cuenta.listar-redes"],
    datos:
      "Sale de `clipealo-cuenta-v1` y de las cuentas conectadas (`clipealo-cuentas-v1`), que la completitud mira al calcular en vez de copiarlas (hooks/use-cuenta.ts:1097).",
    respuesta: "Ninguna: es una consulta. «Ver todo el historial» no suena.",
    origen: [
      "components/app/privacy-settings.tsx:78",
      "components/app/privacy-settings.tsx:251",
      "lib/onboarding.ts:1071",
      "lib/privacidad.ts:161",
    ],
    relacionadas: [
      "cuenta.borrar-respuestas",
      "cuenta.cambiar-consentimiento",
      "onboarding.editar-toma",
      "onboarding.ver-bienvenida-otra-vez",
    ],
  },
  {
    id: "cuenta.borrar-respuestas",
    area: "cuenta",
    titulo: "Borrar mis respuestas",
    resumen:
      "Vacía lo que contaste en la bienvenida; tus recomendaciones vuelven a ser generales hasta que respondas otra vez.",
    quien: ["clipero", "agencia"],
    donde: [{ ruta: "/ajustes?seccion=datos", etiqueta: "Ajustes › Tus datos" }],
    pasos: [
      "En Ajustes › Tus datos, al final, pulsa «Borrar mis respuestas».",
      "El diálogo «¿Borrar tus respuestas?» explica qué se borra y qué no.",
      "Pulsa «Borrar respuestas» para confirmar o «Conservarlas» para salir sin tocar nada.",
    ],
    reglas: [
      "Vacía las respuestas de clipero y de creador y sus metadatos (fuente y fecha) (hooks/use-cuenta.ts:898).",
      "No borra la cuenta, el país, los idiomas, el historial de consentimientos, el perfil ni el público de Ajustes, ni el progreso de la bienvenida.",
      "A una agencia no le borra sus respuestas de agencia: `agencia` se conserva.",
      "Hoy tampoco vacía las respuestas a preguntas creadas desde el backoffice (`respuestasLibres`), aunque la tarjeta promete vaciar «lo que nos contaste en la bienvenida y después».",
      "La completitud se recalcula: la demo, Ana, pasa del 85 % (alta) al 40 % (media), porque la cuenta conectada, el país y los idiomas y el tamaño siguen contando.",
      "No se puede deshacer desde la app.",
    ],
    endpoints: ["cuenta.borrar-respuestas"],
    datos: "`clipero`, `creador` y `meta` en `clipealo-cuenta-v1`.",
    respuesta:
      "`toast.success` «Respuestas borradas» · «Tus recomendaciones vuelven a ser generales.», con su «ding». El botón de confirmar es rojo (`destructive`).",
    origen: [
      "components/app/privacy-settings.tsx:271",
      "components/app/privacy-settings.tsx:289",
      "hooks/use-cuenta.ts:898",
    ],
    relacionadas: ["cuenta.consultar-tus-datos", "onboarding.editar-toma"],
  },
  {
    id: "cuenta.cambiar-idioma",
    area: "cuenta",
    titulo: "Cambiar el idioma de Clipealo",
    resumen:
      "Pasa menús, botones y avisos a español, inglés o portugués de Brasil sin salir de la pantalla.",
    quien: ["visitante", "clipero", "agencia"],
    donde: [
      { ruta: "/ajustes?seccion=perfil", etiqueta: "Ajustes › Perfil › Idioma" },
      { ruta: "/dashboard", etiqueta: "Menú de usuario › Idioma" },
      { ruta: "/", etiqueta: "Cabecera y pie de la web (botón de idioma)" },
      { ruta: "/login", etiqueta: "Acceso (botón de idioma)" },
      { ruta: "/bienvenida", etiqueta: "Bienvenida (botón de idioma)" },
    ],
    pasos: [
      "En Ajustes › Perfil abre «Idioma»; o en el menú de usuario (tu nombre, al pie de la barra lateral) abre «Idioma»; o en la web, el acceso y la bienvenida, pulsa el botón de idiomas.",
      "Elige el idioma: cada uno sale escrito en el suyo (Español, English, Português (Brasil)).",
      "La misma pantalla se vuelve a pintar en ese idioma, con sus parámetros (?seccion=…).",
    ],
    reglas: [
      "Tres idiomas: es sin prefijo, en y pt con prefijo; las direcciones también se traducen (/ajustes → /en/settings, /pt/configuracoes) (i18n/routing.ts:19).",
      "Se aplica al momento, sin pasar por «Guardar cambios», y lo recuerda la cookie `clipealo-locale` durante un año, que escribe el proxy al entrar en la dirección nueva (i18n/routing.ts:22).",
      "Es el idioma de la interfaz. El de títulos y hashtags de tus clips se elige en Público.",
      "El backoffice guarda su idioma aparte (cookie `clipealo-admin-locale`, inglés por defecto): cambiar el de la app no lo mueve (i18n/routing.ts:113).",
    ],
    endpoints: [],
    datos: "Cookie `clipealo-locale` y prefijo de la URL. No es un dato de la cuenta.",
    respuesta:
      "Ninguna: cambiar de idioma no suena. Mientras carga, el selector queda ocupado (`aria-busy`).",
    origen: [
      "components/shared/locale-switcher.tsx:26",
      "components/app/profile-settings.tsx:337",
      "components/app/user-nav-menu.tsx:117",
      "i18n/routing.ts:22",
    ],
    relacionadas: ["cuenta.editar-publico", "backoffice.cambiar-idioma"],
  },
  {
    id: "cuenta.cambiar-tema",
    area: "cuenta",
    titulo: "Cambiar entre tema claro y oscuro",
    resumen: "Elige cómo se ve Clipealo: claro, oscuro o como el sistema.",
    quien: ["visitante", "clipero", "agencia"],
    donde: [
      { ruta: "/dashboard", etiqueta: "Barra superior › Cambiar tema (en toda la app)" },
      { ruta: "/", etiqueta: "Cabecera de la web" },
      { ruta: "/login", etiqueta: "Acceso" },
      { ruta: "/docs", etiqueta: "Barra superior de la wiki" },
    ],
    pasos: [
      "Pulsa el botón del sol (la luna en oscuro) de la barra superior, de la cabecera de la web, del acceso o de la wiki.",
      "Elige «Claro», «Oscuro» o «Sistema».",
      "También desde el buscador (⌘K o Ctrl+K), grupo «Tema»: «Claro» u «Oscuro».",
    ],
    reglas: [
      "Claro es el tema del producto y el de por defecto: el oscuro es una elección explícita y no se hereda del sistema operativo; «Sistema» existe para quien lo pida (components/providers.tsx:52).",
      "Se aplica sin transición y se recuerda en este navegador.",
    ],
    endpoints: [],
    datos:
      "localStorage `clipealo-theme` (next-themes). Es del dispositivo, no de la cuenta.",
    respuesta: "Ninguna.",
    origen: [
      "components/shared/theme-toggle.tsx:23",
      "components/providers.tsx:55",
      "components/app/command-menu.tsx:169",
    ],
  },
  {
    id: "cuenta.cambiar-movimiento",
    area: "cuenta",
    titulo: "Reducir el movimiento",
    resumen:
      "Elige si Clipealo se anima del todo o en «Reducido», donde todo se ve igual pero nada se desplaza ni crece.",
    quien: ["clipero", "agencia"],
    donde: [
      { ruta: "/ajustes?seccion=perfil", etiqueta: "Ajustes › Perfil › Movimiento" },
    ],
    pasos: ["En Ajustes › Perfil abre «Movimiento».", "Elige «Completo» o «Reducido»."],
    reglas: [
      "«Completo» es el de por defecto, aunque el sistema pida menos movimiento (`MOVIMIENTO_POR_DEFECTO`, lib/preferencia-movimiento.ts:21).",
      "Se aplica al momento, sin «Guardar cambios», y se recuerda en este navegador; las demás pestañas abiertas cambian también (hooks/use-movimiento.ts:17).",
      "Para revisar: `?movimiento=completo` o `?movimiento=reducido` en cualquier dirección lo cambia y lo guarda; `?movimiento=sistema` lo borra y vuelve a completo (lib/motion.ts:185).",
    ],
    endpoints: [],
    datos:
      "localStorage `clipealo-movimiento`, reflejado en `<html data-motion>` (lib/preferencia-movimiento.ts:72). Es del dispositivo, no de la cuenta.",
    respuesta: "Ninguna.",
    origen: [
      "components/app/profile-settings.tsx:394",
      "lib/preferencia-movimiento.ts:51",
      "lib/motion.ts:185",
    ],
    relacionadas: ["cuenta.activar-sonidos"],
  },
  {
    id: "cuenta.activar-sonidos",
    area: "cuenta",
    titulo: "Encender o apagar los sonidos",
    resumen: "Decide si la interfaz suena al pulsar y al terminar algo, y pruébalo.",
    quien: ["clipero", "agencia"],
    donde: [
      {
        ruta: "/ajustes?seccion=notificaciones",
        etiqueta: "Ajustes › Notificaciones › Preferencias de la interfaz",
      },
      { ruta: "/dashboard", etiqueta: "Menú de usuario › Sonidos" },
    ],
    pasos: [
      "En Ajustes › Notificaciones, tarjeta «Preferencias de la interfaz», usa el interruptor «Sonidos de la interfaz»; o en el menú de usuario marca o desmarca «Sonidos» (el menú no se cierra).",
      "Con los sonidos encendidos, «Probar» hace sonar el aviso de un hito con su confeti.",
    ],
    reglas: [
      "Encendidos por defecto: solo el valor «off» los apaga (lib/sound.ts:58).",
      "Son del dispositivo, no de la cuenta, y se sincronizan entre pestañas (lib/sound.ts:20).",
      "Qué suena (lib/sound.ts:9): «pop» en la acción principal de cada vista, «tap» al elegir una opción, «snip» al recortar, `toggle-on` / `toggle-off` en los interruptores, «success» al terminar algo bien, «celebrate» en los hitos (publicar, terminar una subida, conectar una red), «error» cuando algo falla y «remove» al borrar.",
      "«Probar» está apagado mientras los sonidos lo están.",
      "Apagar suena antes de apagarse y encender, después de encenderse (components/app/user-nav-menu.tsx:100).",
    ],
    endpoints: [],
    datos: "localStorage `clipealo-sonidos` («on» / «off»).",
    respuesta:
      "El interruptor suena `toggle-off` al apagar y `toggle-on` al encender. «Probar» suena «celebrate» y lanza el confeti de recorte desde el botón.",
    origen: [
      "components/app/interface-preferences.tsx:29",
      "components/app/user-nav-menu.tsx:97",
      "lib/sound.ts:58",
    ],
    relacionadas: ["cuenta.cambiar-movimiento"],
  },
  {
    id: "cuenta.reiniciar-demo",
    area: "cuenta",
    titulo: "Reiniciar la demo",
    resumen: "Devuelve este navegador al estado de fábrica de la demo.",
    quien: ["clipero", "agencia"],
    donde: [{ ruta: "/dashboard", etiqueta: "Menú de usuario › Reiniciar demo" }],
    pasos: [
      "Abre el menú de usuario (tu nombre, al pie de la barra lateral).",
      "Pulsa «Reiniciar demo». No pide confirmación.",
    ],
    reglas: [
      "Vuelven a las semillas: campañas, envíos, participaciones, disputas y retiros; la cuenta «Ana Ruiz»; el plan (Creador); las redes conectadas; el casillero; el catálogo de planes; el calendario; los avisos; el catálogo de preguntas; los textos de publicación y el catálogo de Formación (hooks/use-campanas.ts:621).",
      "El perfil vuelve a Usuario y la solicitud de agencia a «ninguna» (hooks/use-campanas.ts:140).",
      "No se tocan el progreso de Formación (`clipealo-formacion-v1`), el idioma, el tema, el movimiento ni los sonidos.",
      "Existe solo en la demo: en producción no hay estado de fábrica al que volver.",
    ],
    endpoints: [],
    datos:
      "Devuelve a su semilla los almacenes del navegador de la demo (`clipealo-campanas-v1`, `clipealo-cuenta-v1`, `clipealo-plan-v1`, `clipealo-cuentas-v1`, `clipealo-feedback-v1`, `clipealo-planes-v1`, `clipealo-agenda-v1`, `clipealo-avisos-v1`, `clipealo-micro-catalogo-v1`, `clipealo-publicacion-v1`, `clipealo-formacion-catalogo-v1`).",
    respuesta:
      "`toast.success` «Demo reiniciada» · «Campañas, calendario, cuenta, plan, redes, avisos y Formación vuelven a como estaban.», con su «ding».",
    origen: [
      "components/app/user-nav-menu.tsx:187",
      "hooks/use-campanas.ts:621",
      "hooks/use-cuenta.ts:1038",
    ],
    relacionadas: ["acceso.cerrar-sesion"],
  },
  {
    id: "cuenta.cambiar-perfil-demo",
    area: "cuenta",
    titulo: "Ver la app como usuario o como agencia (demo)",
    resumen:
      "Cambia entre el perfil de usuario y el de agencia sin pasar por la aprobación del admin.",
    quien: ["clipero", "agencia"],
    donde: [
      { ruta: "/dashboard", etiqueta: "Menú de usuario › Perfil de la cuenta · demo" },
    ],
    pasos: [
      "Abre el menú de usuario.",
      "En «Perfil de la cuenta · demo» elige «Usuario» o «Agencia». El menú sigue abierto para seguir probando.",
    ],
    reglas: [
      "Es un aparato de demostración: en producción el perfil de agencia lo concede el admin desde /admin/campanas (components/app/user-nav-menu.tsx:129).",
      "Con «Agencia» se abre Crear campaña (`puedeCrearCampanas`, lib/campanas.ts:48); con «Usuario», esa pantalla enseña la puerta de agencia (components/campanas/campaign-form.tsx:208). Operaciones › Derechos también cambia de vista (components/app/derechos-panel.tsx:65).",
      "El perfil decide de quién son las cuentas que cuentan para el cupo de redes: las del clipero o las de la agencia (components/app/social-accounts.tsx:59).",
      "Cuando el admin aprueba una solicitud de agencia, el perfil pasa solo a «Agencia» (hooks/use-campanas.ts:440).",
    ],
    endpoints: ["agencias.leer-solicitud"],
    datos: "`perfil` en `clipealo-campanas-v1` (hooks/use-campanas.ts:466).",
    respuesta: "Ninguna.",
    origen: ["components/app/user-nav-menu.tsx:135", "hooks/use-campanas.ts:466"],
    relacionadas: ["cuenta.conectar-red", "agencias.solicitar-perfil"],
  },
]
