import type { Campo, Endpoint } from "@/lib/wiki/tipos"

/**
 * Endpoints de «ayuda»: el casillero visto desde la app.
 *
 * Hoy no hay frontera en `lib/api/` para esto: todo vive en el almacén del
 * navegador `clipealo-feedback-v1` (`hooks/use-feedback.ts`), que comparten la
 * app y el backoffice. Los tres son `por-construir`. Lo que hace el equipo con
 * la cola (leer, responder, archivar) es del backoffice y no va aquí.
 */

/** Los campos de un mensaje del casillero, tal como los usa el front. */
const CAMPOS_FEEDBACK: Campo[] = [
  {
    nombre: "id",
    tipo: "string",
    requerido: true,
    descripcion:
      "Lo pone el servidor. La demo lo forma como `fb_<semilla>` (`nuevoIdFeedback`, lib/feedback.ts:114); las semillas son `fb_s1`…`fb_s4`.",
  },
  {
    nombre: "autor",
    tipo: "string",
    requerido: true,
    descripcion: "Nombre de la cuenta que escribió. Contenido de usuario: no se traduce.",
  },
  {
    nombre: "userId",
    tipo: "string",
    requerido: true,
    descripcion: "La cuenta que escribió. Sale de la sesión, nunca del cuerpo.",
  },
  {
    nombre: "de",
    tipo: '"clipero" | "agencia"',
    requerido: true,
    descripcion:
      "Quién escribe (`AutorFeedback`). Sale del perfil de la cuenta: «agencia» si tiene perfil de agencia, «clipero» en cualquier otro caso.",
  },
  {
    nombre: "tipo",
    tipo: '"idea" | "problema" | "precio" | "contenido" | "otro"',
    requerido: true,
    descripcion:
      "De qué va (`TipoFeedback`, lib/feedback.ts:21). Se pinta con `feedback.tipos.<id>`.",
  },
  {
    nombre: "texto",
    tipo: "string",
    requerido: true,
    descripcion:
      "Lo que escribió, sin los espacios de los bordes. Entre 10 y 1200 caracteres. Nunca se traduce ni se reescribe.",
  },
  {
    nombre: "ruta",
    tipo: "string",
    requerido: false,
    descripcion:
      "Pantalla desde la que se mandó: ruta interna en español, sin idioma y sin consulta, con los segmentos dinámicos sin rellenar («/campanas/[id]»).",
  },
  {
    nombre: "creadoEn",
    tipo: "string",
    requerido: true,
    descripcion: "Instante ISO en UTC. Ordena la lista (del más nuevo al más viejo).",
  },
  {
    nombre: "estado",
    tipo: '"nuevo" | "leido" | "respondido" | "archivado"',
    requerido: true,
    descripcion:
      "`EstadoFeedback` (lib/feedback.ts:38). Se pinta con `feedback.estados.<id>`: «Enviado», «Leído por el equipo», «Respondido», «Archivado».",
  },
  {
    nombre: "respuesta",
    tipo: "string",
    requerido: false,
    descripcion:
      "La respuesta del equipo, hasta 1200 caracteres (`LIMITES_FEEDBACK.respuestaMax`). Contenido: no se traduce.",
  },
  {
    nombre: "respondidoEn",
    tipo: "string",
    requerido: false,
    descripcion: "Instante ISO de la respuesta.",
  },
  {
    nombre: "sinLeer",
    tipo: "boolean",
    requerido: false,
    descripcion:
      "`true` desde que el equipo responde hasta que quien escribió pulsa «Marcar como leída». Es lo que cuenta la campana.",
  },
]

export const ENDPOINTS: Endpoint[] = [
  {
    id: "ayuda.enviar",
    area: "ayuda",
    metodo: "POST",
    ruta: "/feedback",
    resumen: "Manda un comentario al equipo de Clipealo desde la app.",
    descripcion:
      "Sustituye a `enviar` de `useFeedback`, que hoy añade el mensaje a `creados` en el almacén `clipealo-feedback-v1`. El diálogo ya construye el mensaje entero con `feedbackDeBorrador` (lib/feedback.ts:116); el servidor solo tiene que fiarse de `tipo`, `texto` y `ruta` y poner él el resto. El diálogo valida antes de mandar, así que un 422 solo llega si alguien se salta el front; ojo: `pedir()` convierte cualquier 422 en el código `conflicto` y el cuerpo solo va al registro, nunca a la pantalla (lib/api/cliente.ts:72 y lib/api/errores.ts:32), así que para enseñar `textoCorto` o `textoLargo` la frontera tendría que leer el `{ code }`.",
    estado: "por-construir",
    auth: "sesion",
    cuerpo: {
      tipo: "BorradorFeedback & { ruta?: string }",
      definidoEn: "lib/feedback.ts:77",
      campos: [
        {
          nombre: "tipo",
          tipo: '"idea" | "problema" | "precio" | "contenido" | "otro"',
          requerido: true,
          descripcion:
            "Siempre llega con valor: el diálogo nace con «idea» (`FEEDBACK_NUEVO`, lib/feedback.ts:82).",
        },
        {
          nombre: "texto",
          tipo: "string",
          requerido: true,
          descripcion:
            "Entre 10 y 1200 caracteres una vez quitados los espacios de los bordes.",
        },
        {
          nombre: "ruta",
          tipo: "string",
          requerido: false,
          descripcion:
            "La ruta interna de la pantalla desde la que se escribe (`usePathname` de i18n/navigation.ts), p. ej. «/calendario».",
        },
      ],
      ejemplo: {
        tipo: "problema",
        texto: "Al mover una tarjeta de noche se me va al día siguiente.",
        ruta: "/calendario",
      },
    },
    respuesta: {
      tipo: "Feedback",
      definidoEn: "lib/feedback.ts:43",
      campos: CAMPOS_FEEDBACK,
      ejemplo: {
        id: "fb_mtzs7n9c56",
        autor: "Ana Ruiz",
        userId: "u_ana",
        de: "clipero",
        tipo: "problema",
        texto: "Al mover una tarjeta de noche se me va al día siguiente.",
        ruta: "/calendario",
        creadoEn: "2026-09-13T12:20:00.000Z",
        estado: "nuevo",
      },
    },
    errores: [
      {
        codigo: "textoCorto",
        http: 422,
        cuando: "El texto, sin los espacios de los bordes, tiene menos de 10 caracteres.",
        frase: "feedback.dialogo.errors.textoCorto",
        bloquea: true,
      },
      {
        codigo: "textoLargo",
        http: 422,
        cuando: "El texto pasa de 1200 caracteres.",
        frase: "feedback.dialogo.errors.textoLargo",
        bloquea: true,
      },
      {
        codigo: "no-autorizado",
        http: 401,
        cuando: "No hay sesión: un comentario siempre tiene autor.",
        frase: "common.errors.no-autorizado",
        bloquea: true,
      },
    ],
    reglas: [
      "Repetir `validarFeedback` (lib/feedback.ts:96): quitar los espacios de los bordes y exigir entre 10 y 1200 caracteres (`LIMITES_FEEDBACK`, lib/feedback.ts:71). Lo que valida el navegador es cortesía.",
      "`userId`, `autor` y `de` salen de la sesión, nunca del cuerpo. `de` es «agencia» si la cuenta tiene perfil de agencia y «clipero» en cualquier otro caso: una agencia que pudiera escribir como clipero falsearía la cola.",
      "`id` y `creadoEn` los pone el servidor. Hoy la demo fecha con `AHORA_DEMO` (2026-09-13T12:20:00.000Z) porque la cola ordena por fecha y, con el reloj real, el mensaje saldría del futuro respecto al «ahora» de la demo. Con servidor, el instante real.",
      "El mensaje nace en `nuevo`, sin `respuesta`, `respondidoEn` ni `sinLeer`, aunque vengan en el cuerpo.",
      "Un `tipo` que no está en `TIPOS_FEEDBACK` cae en «otro», que es lo que hace `limpiarFeedback` al leer lo guardado (lib/feedback.ts:251).",
      "El texto se guarda tal cual, solo sin los espacios de los bordes: no se traduce, no se corrige, no se reescribe.",
      "No hay borrado: ni la persona ni el equipo pueden borrar un mensaje. El equipo lo archiva.",
    ],
    origen: "hooks/use-feedback.ts:119",
  },
  {
    id: "ayuda.listar",
    area: "ayuda",
    metodo: "GET",
    ruta: "/feedback",
    resumen:
      "Los mensajes que la persona ha escrito al equipo, con su respuesta si la hay.",
    descripcion:
      "Hoy la app lee la cola entera (`useFeedback().mensajes`: semillas + creados + parches) y se queda con los suyos en el navegador con `misFeedbacks(…, CUENTA_DEMO.userId)`. Con servidor el filtro lo hace él y el de la app queda como red de seguridad, sin cambiar nada. Lo leen Ayuda › Tus mensajes y la campana de la barra superior (`respuestasSinLeer`). Hoy una respuesta aparece sin recargar porque app y backoffice comparten almacén; con servidor habrá que volver a pedir, y docs/costuras-backend.md pide además un aviso de verdad (correo o push) al responder.",
    estado: "por-construir",
    auth: "sesion",
    respuesta: {
      tipo: "Feedback[]",
      definidoEn: "lib/feedback.ts:43",
      campos: CAMPOS_FEEDBACK,
      ejemplo: [
        {
          id: "fb_s1",
          autor: "Ana Ruiz",
          userId: "u_ana",
          de: "clipero",
          tipo: "problema",
          texto:
            "Mandé un clip a la campaña de la Liga pegando el enlace y la tabla me dice «cobras US$ 0,00». Entiendo que no podéis leer las vistas de TikTok, pero entonces decidlo antes de que lo mande, no después.",
          ruta: "/campanas",
          creadoEn: "2026-09-10T16:40:00.000Z",
          estado: "nuevo",
        },
        {
          id: "fb_s3",
          autor: "Ana Ruiz",
          userId: "u_ana",
          de: "clipero",
          tipo: "precio",
          texto:
            "El salto de Prueba a Creador se me hace grande para lo que clipeo al mes. ¿No hay algo intermedio, o pagar por minutos sueltos?",
          ruta: "/precios",
          creadoEn: "2026-09-05T09:20:00.000Z",
          estado: "respondido",
          respuesta:
            "Gracias por decirlo con números. De momento no hay plan intermedio, pero los minutos sueltos están sobre la mesa y tu mensaje entra en esa discusión. Te escribimos si sale.",
          respondidoEn: "2026-09-06T10:00:00.000Z",
          sinLeer: true,
        },
      ],
    },
    errores: [
      {
        codigo: "no-autorizado",
        http: 401,
        cuando: "No hay sesión.",
        frase: "common.errors.no-autorizado",
        bloquea: true,
      },
    ],
    reglas: [
      "Solo los mensajes de la cuenta de la sesión (mismo `userId`, como `misFeedbacks`, lib/feedback.ts:222). Nunca los de otra cuenta: la cola entera es del backoffice.",
      "Ordenados por `creadoEn`, del más nuevo al más viejo.",
      "En todos sus estados, también `archivado`: archivar cambia el estado para el equipo, no quita el mensaje del historial de quien lo escribió.",
      "Con respuesta, lleva `respuesta`, `respondidoEn` y `sinLeer`; sin ella, esos campos no van.",
      "`texto` y `respuesta` van tal cual se escribieron, sin traducir.",
    ],
    origen: "hooks/use-feedback.ts:112",
  },
  {
    id: "ayuda.marcar-visto",
    area: "ayuda",
    metodo: "POST",
    ruta: "/feedback/{id}/visto",
    resumen: "Marca como leída la respuesta del equipo a un mensaje propio.",
    descripcion:
      "Sustituye a `visto` de `useFeedback`, que hoy guarda el parche `{ sinLeer: false }` (`marcarVisto`) en `cambios` del almacén `clipealo-feedback-v1`. Sin cuerpo, como `/jobs/{id}/retry`: la acción es el verbo, no un parche abierto.",
    estado: "por-construir",
    auth: "sesion",
    parametros: [
      {
        nombre: "id",
        tipo: "string",
        requerido: true,
        en: "ruta",
        descripcion: "El id del mensaje, p. ej. `fb_s3`.",
      },
    ],
    respuesta: {
      tipo: "Feedback",
      definidoEn: "lib/feedback.ts:43",
      ejemplo: {
        id: "fb_s3",
        autor: "Ana Ruiz",
        userId: "u_ana",
        de: "clipero",
        tipo: "precio",
        texto:
          "El salto de Prueba a Creador se me hace grande para lo que clipeo al mes. ¿No hay algo intermedio, o pagar por minutos sueltos?",
        ruta: "/precios",
        creadoEn: "2026-09-05T09:20:00.000Z",
        estado: "respondido",
        respuesta:
          "Gracias por decirlo con números. De momento no hay plan intermedio, pero los minutos sueltos están sobre la mesa y tu mensaje entra en esa discusión. Te escribimos si sale.",
        respondidoEn: "2026-09-06T10:00:00.000Z",
        sinLeer: false,
      },
    },
    errores: [
      {
        codigo: "no-encontrado",
        http: 404,
        cuando: "El mensaje no existe o no es de la cuenta de la sesión.",
        frase: "common.errors.no-encontrado",
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
      "Solo quien lo escribió: si el mensaje es de otra cuenta se responde 404, sin decir que existe.",
      "Solo pone `sinLeer` a `false` (`marcarVisto`, lib/feedback.ts:158). No toca `estado`, `respuesta` ni `respondidoEn`, y nunca el `texto`: `limpiarParcheFeedback` (lib/feedback.ts:265) ya impide que un parche reescriba lo que la persona escribió.",
      "Marcar una respuesta ya vista no falla ni cambia nada: el parche es el mismo.",
      "No se marca solo al pedir la lista: es un gesto de quien lee («Marcar como leída»), no del reloj.",
    ],
    origen: "hooks/use-feedback.ts:140",
  },
]
