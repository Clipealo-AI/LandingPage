import type { Accion } from "@/lib/wiki/tipos"

/*
 * Formación tiene dos mitades que leen el mismo almacén:
 * - el alumno, en /formacion: ruta recomendada arriba, clase abierta debajo y el
 *   catálogo entero ordenado por lo que clipea;
 * - el admin, en /admin/formacion: publicar, retirar, decidir el plan de cada
 *   clase y ordenar las rutas.
 * Lo que el admin cambia se ve en /formacion del mismo navegador sin recargar.
 */

const DATOS_ALUMNO =
  "Catálogo: las semillas de `lib/formacion.ts` (8 clases y 2 rutas) más lo que el admin haya cambiado en ese mismo navegador (`clipealo-formacion-catalogo-v1`). Avance: `clipealo-formacion-v1` en el `localStorage` del navegador, sincronizado entre pestañas con el evento `storage`. Perfil para recomendar: `cuenta.clipero` de `useCuenta()`: los temas (`verticales`) y las redes que contestó en el onboarding, y la experiencia, que no pregunta el onboarding sino la micropregunta que sale al enviar un clip (`lib/micro-preguntas.ts`). Para elegir la ruta cuenta también si ya ha enviado algún clip a una campaña (los envíos de `useCampanas()`). El plan, que decide los candados, sale de `usePlan()` (`clipealo-plan-v1`). «Reiniciar demo» vacía el catálogo del admin pero no este avance (`reiniciarFormacion` existe y nadie lo llama). No hay frontera en `lib/api` todavía."

const DATOS_ADMIN =
  "El servidor solo trae las semillas (`getAdminFormacion`, lib/api/admin.ts) y lo que el admin cambia se guarda en su navegador (`clipealo-formacion-catalogo-v1`): de una semilla, solo el parche; de una clase o ruta creada en el panel, la entera. «Reiniciar demo» lo devuelve a las ocho clases de fábrica."

const AVISO_SIN_GUARDAR_ADMIN =
  "Si el navegador no guarda (incógnito, permisos), en lugar del aviso de éxito sale toast.warning, sin sonido: «Este navegador no guarda nada, así que el cambio se pierde al recargar.»"

export const ACCIONES: Accion[] = [
  /* ---------------------------------------------------------------------------
     El alumno, en /formacion
     --------------------------------------------------------------------------- */
  {
    id: "formacion.ver-catalogo",
    area: "formacion",
    titulo: "Ver el catálogo de clases",
    resumen:
      "Recorrer todas las clases publicadas, ordenadas por lo que clipea y con el motivo escrito en cada tarjeta.",
    quien: ["clipero", "agencia"],
    plan: {
      nota: "Se ve entero con cualquier plan. Lo que pide un plan superior sale igual, con candado y la insignia «Incluida en Creador»: nunca se esconde, porque el catálogo es la superficie de venta. Con el plan de la demo (Creador, `PLAN_DEMO`) no hay candados: ninguna clase de fábrica pide Empresa.",
    },
    donde: [{ ruta: "/formacion", etiqueta: "Formación › «Todas las clases»" }],
    pasos: [
      "Entra en «Formación» desde la barra lateral (grupo «Ganar», debajo de «Campañas»).",
      "Arriba lee el recuento de este navegador: «8 clases publicadas · 35 min en total · 0 de 8 vistas».",
      "Baja a «Todas las clases». Debajo del título se explica el orden: «Ordenadas por lo que clipeas y por lo que ya has editado» o, si la cuenta no tiene temas ni experiencia guardados, «Ordenadas por fecha de publicación».",
      "Cada tarjeta enseña la portada con la duración, el nivel («Inicio», «Medio», «Avanzado»), «Vista» si ya la terminó, el motivo («Por tus temas», «Por tus redes» o «Por tu nivel»), hasta dos temas y «+N» con el resto, y «Vista al N %» si la dejó a medias.",
    ],
    reglas: [
      "Solo salen las clases publicadas: un borrador o una clase retirada no existe para el alumno (`publicadas`).",
      "Orden (`recomendadas`): +3 puntos por cada tema en común (máximo 2 temas), +1 por cada red en común (máximo 2 redes), +2 si el nivel encaja con su experiencia y −4 si pide un plan que no tiene. A igualdad de puntos, la publicada más recientemente; a igualdad de fecha, por id.",
      "Nivel que encaja con cada experiencia (`NIVEL_POR_EXPERIENCIA`): «Nunca he editado» → Inicio; «Por diversión» → Inicio y Medio; «Con regularidad» y «Para clientes» → Medio y Avanzado.",
      "La rejilla no se reordena con lo visto: el panel no le pasa el progreso a `recomendadas`, para que marcar una clase no la mueva bajo el cursor. Los puntos que `PUNTOS` da a lo visto (`completada`: −20; `empezada`: +1) no se aplican aquí.",
      "El motivo de la tarjeta es el primero que se cumple: tema, red, nivel. Si no se cumple ninguno, la tarjeta no promete nada.",
      "El perfil se limpia contra la taxonomía (`perfilDesdeClipero`): temas y redes que no están en ella (como «Aún no lo sé» en los nichos) se descartan, y una experiencia que no sea una de las cuatro no cuenta.",
      "Los minutos son la suma de las duraciones publicadas, redondeada: con las ocho de fábrica, 2.090 s → 35 min.",
    ],
    endpoints: [
      "formacion.listar-catalogo",
      "formacion.leer-progreso",
      "cuenta.leer",
      "planes.obtener-suscripcion",
    ],
    datos: DATOS_ALUMNO,
    respuesta: "Ninguna: es lectura. Sin sonido ni aviso.",
    origen: [
      "app/[locale]/(app)/formacion/page.tsx:28",
      "components/formacion/formacion-panel.tsx:42",
      "components/formacion/leccion-card.tsx:33",
      "lib/formacion.ts:672",
      "lib/formacion.ts:719",
      "lib/formacion.ts:749",
      "lib/formacion.ts:852",
    ],
    relacionadas: [
      "formacion.abrir-clase",
      "formacion.seguir-ruta",
      "formacion.desbloquear-clase",
    ],
  },
  {
    id: "formacion.seguir-ruta",
    area: "formacion",
    titulo: "Empezar o seguir su ruta",
    resumen:
      "Abrir la siguiente clase de la ruta que le toca, viendo cuánto lleva y cuánto le queda.",
    quien: ["clipero", "agencia"],
    plan: {
      nota: "«Tu primera semana» es gratis de punta a punta. En «Sube tus vistas», tres de sus cuatro clases piden Creador: con Prueba el botón lleva primero a la única gratis («Entra en una campaña sin que te rechacen el clip») y, cuando ya no queda nada a su alcance, pasa a «Desbloquear lo que falta» con candado y abre la primera clase de pago, que enseña el muro del plan.",
    },
    donde: [{ ruta: "/formacion", etiqueta: "Formación › tarjeta «Tu ruta»" }],
    pasos: [
      "En la tarjeta «Tu ruta» de arriba, mira el avance y lo que queda: en «Sube tus vistas», con «El gancho» y «Publicar en TikTok, Reels y Shorts» vistas, «2 de 4 clases» y «Te queda 11 min 45 s». Si falta algo por plan se dice al lado: con Prueba y sin empezar «Sube tus vistas», «0 de 4 clases · 3 clases piden el plan Creador».",
      "Pulsa el botón naranja: «Empezar la ruta» si no ha terminado ninguna clase, «Seguir con la ruta» si ya lleva alguna, «Volver a verla» si la terminó o «Desbloquear lo que falta» si lo que queda pide plan.",
      "Al lado se lee adónde lleva: «Siguiente: {clase}», «Vuelves a empezar por: {clase}» o «Siguiente, con el plan Creador: {clase}».",
      "La clase se abre debajo de la tarjeta, con el foco y la vista ya en ella.",
      "También puede saltar a cualquier clase desde la lista numerada de la derecha: las terminadas llevan el check verde y las que su plan no alcanza, un candado.",
    ],
    reglas: [
      "Qué ruta se enseña (`rutaRecomendada`): primero la que tenga empezada y sin terminar (con al menos una clase completada); si no hay, la que se propone a su experiencia; si no contestó la experiencia, manda lo medido: si ya ha enviado algún clip a una campaña cuenta como «Con regularidad» y, si no, como «Nunca he editado»; si nada encaja, la primera.",
      "Solo cuentan las rutas con al menos una clase publicada. Si el admin retira todas, no hay tarjeta de ruta.",
      "De fábrica: «Tu primera semana» se propone a «Nunca he editado» y «Por diversión» (5 clases, 17 min 20 s); «Sube tus vistas», a «Con regularidad» y «Para clientes» (4 clases, 22 min 15 s). La cuenta de la demo (Ana Ruiz) clipea con regularidad, así que le toca «Sube tus vistas».",
      "El avance es por clases terminadas, no por segundos (`progresoRuta`). Las clases con candado cuentan en el total y se dicen aparte; lo ya completado sigue contando aunque la clase pase después a ser de pago.",
      "El botón lleva a la primera clase sin terminar y a su alcance (`siguienteLeccion`); si no queda ninguna, a la primera con candado (`siguienteBloqueada`); con la ruta terminada, a la primera.",
      "El plan que se nombra es el más bajo que abre algo de lo que falta (`planQueDesbloquea`), no el más alto de la ruta.",
    ],
    estados: [
      {
        estado: "Sin empezar",
        significa: "Ninguna clase completada. Botón «Empezar la ruta».",
      },
      {
        estado: "En curso",
        significa:
          "Alguna completada y alguna pendiente. Botón «Seguir con la ruta» y «Te queda {tiempo}».",
      },
      {
        estado: "Ruta terminada",
        significa:
          "Todas sus clases publicadas completadas: insignia verde «Ruta terminada», «{tiempo} en total» y botón «Volver a verla».",
      },
    ],
    endpoints: [
      "formacion.listar-catalogo",
      "formacion.leer-progreso",
      "cuenta.leer",
      "campanas.listar-envios",
      "planes.obtener-suscripcion",
    ],
    datos: DATOS_ALUMNO,
    respuesta:
      'El botón naranja es la única acción principal de la vista (`variant="brand"`): suena «pop» y se encuadra con la marca de recorte. Al abrirse la clase, la página se desplaza hasta ella (suave, o directa si en Ajustes › Perfil el «Movimiento» está en «Reducido»). Sin aviso.',
    origen: [
      "components/formacion/ruta-panel.tsx:34",
      "components/formacion/ruta-panel.tsx:149",
      "components/formacion/formacion-panel.tsx:68",
      "hooks/use-cuenta.ts:217",
      "lib/formacion.ts:578",
      "lib/formacion.ts:602",
      "lib/formacion.ts:626",
      "lib/formacion.ts:775",
    ],
    relacionadas: [
      "formacion.abrir-clase",
      "formacion.cambiar-de-ruta",
      "formacion.apartar-ruta",
      "formacion.desbloquear-clase",
    ],
  },
  {
    id: "formacion.cambiar-de-ruta",
    area: "formacion",
    titulo: "Pasar a la ruta que toca ahora",
    resumen:
      "Tras terminar una ruta, la tarjeta se queda con ella y ofrece ir a la que le corresponde ahora.",
    quien: ["clipero", "agencia"],
    donde: [{ ruta: "/formacion", etiqueta: "Formación › tarjeta «Tu ruta»" }],
    pasos: [
      "Al marcar como vista la última clase de la ruta, la tarjeta se queda con esa ruta, ahora con «Ruta terminada».",
      "Si la ruta que le tocaría ya es otra, aparece junto al botón naranja «Ir a «{ruta}»».",
      "Púlsalo: la tarjeta pasa a la ruta recomendada, con su avance y su botón.",
    ],
    reglas: [
      "La ruta recién terminada se fija a propósito: el premio es verla terminada, no que la sustituya otra en el mismo sitio.",
      "El botón solo sale cuando la ruta que se enseña y la recomendada son distintas.",
      "Fijar la ruta no se guarda: al recargar la página, manda otra vez la recomendada.",
    ],
    endpoints: ["formacion.listar-catalogo", "formacion.leer-progreso"],
    datos: DATOS_ALUMNO,
    respuesta: "Botón secundario (`outline`): sin sonido ni aviso.",
    origen: [
      "components/formacion/formacion-panel.tsx:70",
      "components/formacion/formacion-panel.tsx:165",
      "components/formacion/ruta-panel.tsx:159",
    ],
    relacionadas: ["formacion.seguir-ruta", "formacion.marcar-vista"],
  },
  {
    id: "formacion.abrir-clase",
    area: "formacion",
    titulo: "Abrir una clase",
    resumen:
      "Abrir el reproductor de una clase con de qué va, cuánto dura, su nivel, sus temas y sus redes.",
    quien: ["clipero", "agencia"],
    plan: {
      nota: "Una clase con candado se abre igual, pero en lugar del reproductor sale el muro del plan (ver «Ver de qué va una clase con candado»).",
    },
    donde: [
      { ruta: "/formacion", etiqueta: "Formación › «Todas las clases»" },
      { ruta: "/formacion", etiqueta: "Formación › lista de la tarjeta «Tu ruta»" },
    ],
    pasos: [
      "En una tarjeta, pulsa la portada o el botón: «Ver la clase», «Seguir viendo» si la dejó a medias o «Volver a verla» si ya la vio. También vale pulsar una clase en la lista de la ruta.",
      "La clase se abre debajo de la ruta: el reproductor y, al lado, el título, la descripción, «Duración», «Nivel», «Temas», «Redes» (si la clase habla de una red) y «Equipo de Clipealo · Publicada el {fecha}».",
      "Si el equipo aún no ha subido el video, bajo el reproductor se lee «El video se sube desde el panel del equipo. Mientras tanto, aquí tienes de qué va la clase.»",
      "Para cerrarla, «Cerrar la clase» (la X de arriba a la derecha).",
    ],
    reglas: [
      "Hay una sola clase abierta a la vez. Su tarjeta se encuadra con la marca de recorte y su botón pasa a secundario.",
      "Si el admin retira la clase mientras está abierta, se cierra sola: el catálogo manda.",
      "Hoy ninguna clase de fábrica tiene video (`video: {}`): el reproductor mantiene el encuadre con el título y el avance solo sube con «Marcar como vista».",
      "Qué clase está abierta no se guarda: al recargar no hay ninguna abierta.",
    ],
    endpoints: ["formacion.listar-catalogo", "formacion.leer-progreso"],
    datos: DATOS_ALUMNO,
    respuesta:
      "Los botones de la tarjeta son secundarios y no suenan. Al abrirse, el foco va a la clase y la página se desplaza hasta ella (suave, o directa si en Ajustes › Perfil el «Movimiento» está en «Reducido»).",
    origen: [
      "components/formacion/leccion-card.tsx:162",
      "components/formacion/formacion-panel.tsx:77",
      "components/formacion/formacion-panel.tsx:90",
      "components/formacion/reproductor-leccion.tsx:48",
      "components/formacion/reproductor-leccion.tsx:117",
      "components/formacion/reproductor-leccion.tsx:147",
    ],
    relacionadas: [
      "formacion.ver-clase",
      "formacion.marcar-vista",
      "formacion.ir-siguiente-clase",
      "formacion.desbloquear-clase",
    ],
  },
  {
    id: "formacion.ver-clase",
    area: "formacion",
    titulo: "Ver una clase y guardar por dónde va",
    resumen:
      "Mientras el video avanza se guarda el punto más lejano visto y, al pasar del 90 %, la clase queda como vista.",
    quien: ["clipero", "agencia"],
    plan: {
      nota: "Solo en clases a su alcance: en una con candado no hay reproductor, así que no hay avance que guardar.",
    },
    donde: [{ ruta: "/formacion", etiqueta: "Formación › clase abierta" }],
    pasos: [
      "Abre la clase y dale a reproducir.",
      "La clase abierta enseña la insignia «A medias» y la barra «Vista al N %»; su tarjeta del catálogo, la misma barra.",
      "Al llegar al 90 % de la duración, la clase pasa a «Vista» sin pulsar nada.",
    ],
    reglas: [
      "Se guarda el segundo más lejano: volver atrás para repasar no borra lo visto (`verSegundo`).",
      "El segundo se redondea hacia abajo y se acota a la duración de la clase.",
      "Cuenta como vista al llegar a duración × 0,9 (`UMBRAL_COMPLETADA` = 0.9): en «Publicar en TikTok, Reels y Shorts» (330 s), en el segundo 297. Los créditos no hacen falta.",
      "El porcentaje es segundo visto / duración, redondeado entre 0 y 100; una clase vista es 100 aunque saltara el final.",
      "Sin archivo de video el reproductor no informa del tiempo (`onTimeChange` solo corre con `src`): con las clases de hoy, que no tienen video, reproducir no sube el avance.",
    ],
    estados: [
      { estado: "Sin empezar", significa: "No hay nada guardado de esa clase." },
      {
        estado: "A medias",
        significa: "`segundoVisto` > 0 y sin completar: barra «Vista al N %».",
      },
      { estado: "Vista", significa: "`completada: true`: insignia verde «Vista»." },
    ],
    endpoints: ["formacion.guardar-avance"],
    datos: DATOS_ALUMNO,
    respuesta:
      "Ninguna: el avance se ve en la barra. Pasar del 90 % tampoco suena ni avisa; solo «Marcar como vista» lo hace.",
    origen: [
      "components/formacion/reproductor-leccion.tsx:81",
      "components/video/video-player.tsx:126",
      "components/formacion/use-progreso.ts:117",
      "lib/formacion.ts:422",
      "lib/formacion.ts:484",
      "lib/formacion.ts:495",
    ],
    relacionadas: ["formacion.abrir-clase", "formacion.marcar-vista"],
  },
  {
    id: "formacion.ir-siguiente-clase",
    area: "formacion",
    titulo: "Ir a la siguiente clase de la ruta",
    resumen: "Desde la clase abierta, saltar a la que toca en la ruta sin volver arriba.",
    quien: ["clipero", "agencia"],
    donde: [
      { ruta: "/formacion", etiqueta: "Formación › clase abierta › «Siguiente clase»" },
    ],
    pasos: [
      "Con una clase abierta, pulsa «Siguiente clase» (el primero de la fila de botones).",
      "Se abre la clase que toca de la ruta que se está enseñando.",
    ],
    reglas: [
      "Lleva a la primera clase de la ruta sin terminar y a su alcance (`siguienteLeccion`), no a la que va detrás de la abierta: si la abierta es la primera pendiente, apunta a ella misma y primero hay que terminarla o marcarla como vista.",
      "Si no queda ninguna clase a su alcance, el botón no sale.",
      "Va antes que «Marcar como vista» para que, al marcar, no salte bajo el cursor.",
    ],
    endpoints: ["formacion.listar-catalogo", "formacion.leer-progreso"],
    datos: DATOS_ALUMNO,
    respuesta: "Botón secundario (`outline`): sin sonido ni aviso.",
    origen: [
      "components/formacion/reproductor-leccion.tsx:206",
      "components/formacion/formacion-panel.tsx:198",
      "lib/formacion.ts:602",
    ],
    relacionadas: ["formacion.abrir-clase", "formacion.seguir-ruta"],
  },
  {
    id: "formacion.marcar-vista",
    area: "formacion",
    titulo: "Marcar una clase como vista",
    resumen:
      "Dar la clase por terminada sin exigir que el video corra; si era la última de la ruta, la ruta queda terminada.",
    quien: ["clipero", "agencia"],
    plan: { nota: "No aparece en una clase con candado." },
    donde: [
      { ruta: "/formacion", etiqueta: "Formación › clase abierta › «Marcar como vista»" },
    ],
    pasos: [
      "Con la clase abierta, pulsa «Marcar como vista».",
      "La clase pasa a «Vista» en su tarjeta y en la lista de la ruta, y el botón desaparece.",
      "Si era la última pendiente de la ruta, la tarjeta de arriba enseña «Ruta terminada» y se queda con esa ruta.",
    ],
    reglas: [
      "Deja el segundo visto en la duración de la clase, la marca como completada y guarda el momento (`completar`).",
      "Si ya estaba vista no cambia nada.",
      "Solo sale si la clase está a su alcance y todavía no está vista.",
      "La ruta termina si la clase marcada era la única pendiente de la ruta que se está enseñando.",
      "Si el navegador no guarda, avisa una sola vez mientras siga en la página, y el avance vive solo en memoria hasta recargar o cerrar la pestaña.",
    ],
    errores: [
      {
        codigo: "sinGuardar",
        cuando: "El navegador no deja guardar (modo incógnito, permisos).",
        frase: "formacion.avisos.sinGuardar",
        bloquea: false,
      },
    ],
    endpoints: ["formacion.completar-clase"],
    datos: DATOS_ALUMNO,
    respuesta:
      "toast.success «Clase vista: {clase}» (suena «success»). Si con ella termina la ruta, en su lugar toast.celebrate «Has terminado «{ruta}»»: arpegio y confeti de esquinas de recorte saliendo del icono del aviso. Sin almacenamiento, además toast.warning sin sonido: «Este navegador no guarda nada: tu avance se pierde al cerrar la pestaña.» El botón es secundario y no suena al pulsarlo.",
    origen: [
      "components/formacion/reproductor-leccion.tsx:211",
      "components/formacion/formacion-panel.tsx:102",
      "components/formacion/formacion-panel.tsx:118",
      "components/formacion/use-progreso.ts:120",
      "lib/formacion.ts:521",
      "lib/toast.ts:85",
    ],
    relacionadas: [
      "formacion.ver-clase",
      "formacion.empezar-de-nuevo",
      "formacion.cambiar-de-ruta",
    ],
  },
  {
    id: "formacion.empezar-de-nuevo",
    area: "formacion",
    titulo: "Empezar una clase de nuevo",
    resumen: "Borrar lo visto de una clase y dejarla como sin empezar.",
    quien: ["clipero", "agencia"],
    donde: [
      { ruta: "/formacion", etiqueta: "Formación › clase abierta › «Empezar de nuevo»" },
    ],
    pasos: [
      "Con la clase abierta, pulsa «Empezar de nuevo» (sale en cuanto la clase está empezada o vista).",
      "La clase pierde «Vista» o «A medias» y su barra, y deja de contar en el avance de su ruta: una ruta terminada vuelve a estar en curso (o sin empezar, si era la única vista).",
    ],
    reglas: [
      "Borra todo lo guardado de esa clase: el segundo visto y si estaba completada (`reiniciar`).",
      "Sale también en una clase con candado que se empezó antes de que pasara a ser de pago.",
      "No pide confirmación: se rehace viéndola o marcándola otra vez.",
    ],
    endpoints: ["formacion.reiniciar-clase"],
    datos: DATOS_ALUMNO,
    respuesta:
      "toast neutro «Clase otra vez desde el principio», sin sonido: deshacer no es un logro. El botón es fantasma (`ghost`) y no suena.",
    origen: [
      "components/formacion/reproductor-leccion.tsx:216",
      "components/formacion/formacion-panel.tsx:135",
      "components/formacion/use-progreso.ts:121",
      "lib/formacion.ts:542",
    ],
    relacionadas: ["formacion.marcar-vista", "formacion.ver-clase"],
  },
  {
    id: "formacion.apartar-ruta",
    area: "formacion",
    titulo: "Apartar la ruta («Ya me lo sé»)",
    resumen:
      "Quitar la tarjeta de la ruta de lo alto de la página sin tocar el avance, con la opción de deshacerlo.",
    quien: ["clipero", "agencia"],
    donde: [
      { ruta: "/formacion", etiqueta: "Formación › tarjeta «Tu ruta» › «Ya me lo sé»" },
    ],
    pasos: [
      "En la tarjeta «Tu ruta», pulsa «Ya me lo sé».",
      "La tarjeta se sustituye por una línea: ««{ruta}» está apartada.» con «Volver a enseñarla».",
      "Sale el aviso «Ruta apartada. Las clases siguen abajo.» con «Deshacer».",
    ],
    reglas: [
      "Apartar no es terminar: el avance no se toca y las clases siguen en «Todas las clases».",
      "Se guarda: aguanta la recarga. Y sobrevive aunque el resto del progreso guardado esté roto (`migrarProgreso`).",
      "Se aparta la ruta que se está enseñando. Si después la recomendada pasa a ser otra, esa sale con su tarjeta.",
    ],
    estados: [
      {
        estado: "Visible",
        significa: "La tarjeta «Tu ruta» ocupa lo alto de la página.",
      },
      {
        estado: "Apartada",
        significa: "Su id está en `ocultas`: queda una línea con «Volver a enseñarla».",
      },
    ],
    endpoints: ["formacion.ocultar-ruta"],
    datos: DATOS_ALUMNO,
    respuesta:
      "toast neutro, sin sonido: «Ruta apartada. Las clases siguen abajo.», con la acción «Deshacer» que la devuelve. Ni logro ni fallo. El botón es fantasma y no suena.",
    origen: [
      "components/formacion/ruta-panel.tsx:167",
      "components/formacion/formacion-panel.tsx:166",
      "components/formacion/use-progreso.ts:127",
      "lib/formacion.ts:457",
    ],
    relacionadas: ["formacion.volver-a-ensenar-ruta", "formacion.seguir-ruta"],
  },
  {
    id: "formacion.volver-a-ensenar-ruta",
    area: "formacion",
    titulo: "Volver a enseñar una ruta apartada",
    resumen:
      "Devolver la tarjeta de la ruta a lo alto de la página, con su avance intacto.",
    quien: ["clipero", "agencia"],
    donde: [
      { ruta: "/formacion", etiqueta: "Formación › «Volver a enseñarla»" },
      { ruta: "/formacion", etiqueta: "Formación › aviso «Ruta apartada» › «Deshacer»" },
    ],
    pasos: [
      "Pulsa «Volver a enseñarla» en la línea ««{ruta}» está apartada.», o «Deshacer» en el aviso mientras siga en pantalla.",
      "La tarjeta «Tu ruta» vuelve con su avance.",
    ],
    reglas: [
      "Es el mismo camino que apartarla, en el otro sentido (`ocultarRuta` con `false`).",
      "Si no estaba apartada, no cambia nada.",
    ],
    endpoints: ["formacion.ocultar-ruta"],
    datos: DATOS_ALUMNO,
    respuesta: "Ninguna: la tarjeta reaparece en su sitio, sin aviso ni sonido.",
    origen: [
      "components/formacion/formacion-panel.tsx:172",
      "components/formacion/formacion-panel.tsx:180",
      "lib/formacion.ts:457",
    ],
    relacionadas: ["formacion.apartar-ruta"],
  },
  {
    id: "formacion.desbloquear-clase",
    area: "formacion",
    titulo: "Ver de qué va una clase con candado",
    resumen:
      "Una clase que pide un plan superior se ve igual en el catálogo y, al abrirla, dice qué se gana y lleva a los planes.",
    quien: ["clipero", "agencia"],
    plan: {
      minimo: "creator",
      nota: "Una clase de pago pide que el plan tenga la capacidad `clasesDePago` (desde Creador en los planes de la web, `PLAN_MINIMO`) y que llegue al escalón de la clase. Un plan creado en el backoffice sobre Creador pero sin Formación no la abre. De fábrica piden Creador «El gancho: los tres primeros segundos», «Publicar en TikTok, Reels y Shorts» y «Lee tus analíticas y repite lo que funcionó»; ninguna pide Empresa.",
    },
    donde: [
      {
        ruta: "/formacion",
        etiqueta: "Formación › tarjeta con candado › «Ver de qué va»",
      },
      { ruta: "/precios", etiqueta: "Precios (desde «Ver los planes»)" },
    ],
    pasos: [
      "En «Todas las clases», la clase lleva un candado en la portada, la insignia «Incluida en Creador» y el botón «Ver de qué va».",
      "Pulsa «Ver de qué va» o la portada.",
      "En lugar del reproductor sale «Esta clase es del plan Creador» — «Se ve de qué va y cuánto dura; para verla entera hace falta el plan Creador.» — con lo que se gana: «Todas las clases, también las que vayan saliendo», «Las rutas completas, sin saltarte pasos», «Entrar en campañas de marcas y cobrar por tus clips» y «El calendario para programar tus publicaciones».",
      "Pulsa «Ver los planes» para ir a /precios.",
    ],
    reglas: [
      "La ve entera si su `planMinimo` es `free`, o si el plan permite `clasesDePago` y llega al escalón de la clase (`alAlcance`).",
      "Sin pagar se ve la portada, el título, la duración, el nivel, los temas y de qué va. Esconderla no vende: el catálogo es la superficie de venta (decisión del 17 sep 2026).",
      "En la rejilla baja 4 puntos: a igualdad de interés, sale antes lo que puede ver hoy.",
      "En una clase con candado no hay «Marcar como vista».",
      "Es una puerta de interfaz, no seguridad (lo dice el propio `MuroPlan`): en producción quien decide qué puede ver una cuenta es el servidor. Lo que tendrá que hacer está en el endpoint `formacion.listar-catalogo`.",
    ],
    endpoints: ["formacion.listar-catalogo", "planes.obtener-suscripcion"],
    datos:
      "El plan sale de `usePlan()`: la demo arranca en Creador (`PLAN_DEMO`) y el catálogo de planes lo edita el backoffice. Las clases, de `useCatalogo()`.",
    respuesta:
      "«Ver los planes» es el botón naranja del muro: suena «pop» y se encuadra con la marca de recorte. Sin aviso.",
    origen: [
      "components/formacion/leccion-card.tsx:129",
      "components/formacion/reproductor-leccion.tsx:96",
      "components/planes/muro-plan.tsx:73",
      "lib/formacion.ts:393",
      "lib/pricing.ts:75",
      "lib/pricing.ts:124",
    ],
    relacionadas: ["formacion.abrir-clase", "formacion.ver-catalogo"],
  },

  /* ---------------------------------------------------------------------------
     El admin, en /admin/formacion
     --------------------------------------------------------------------------- */
  {
    id: "formacion.revisar-catalogo",
    area: "formacion",
    titulo: "Revisar el estado del catálogo",
    resumen:
      "Ver de un vistazo cuántas clases hay publicadas, cuántos minutos suman, cuántas faltan por video y cuántas son de pago.",
    quien: ["admin"],
    donde: [{ ruta: "/admin/formacion", etiqueta: "Backoffice › Formación" }],
    pasos: [
      "En el backoffice, abre «Formación» (grupo «Creadores»). El número de la barra lateral son las clases publicadas sin video.",
      "Lee las cuatro cifras: «Publicadas» (con borradores y retiradas debajo), «Minutos publicados» (por nivel), «Sin video» y «De pago» (gratis, Creador y Empresa).",
      "Debajo, «Las vistas todavía no se cuentan» explica por qué no hay cifra de vistas.",
    ],
    reglas: [
      "Con el catálogo de fábrica: 8 publicadas, «Ningún borrador · nada retirado»; 35 minutos, «4 de inicio · 3 medias · 1 avanzadas»; 8 sin video; 3 de pago, «5 gratis · 3 en Creador · 0 en Empresa».",
      "«Sin video» cuenta las publicadas sin `video.url` y se pinta en tono de aviso si hay alguna: es el trabajo que le queda al equipo.",
      "No hay vistas a propósito: el avance de cada alumno vive en su navegador y no llega al servidor, así que contarlas sería inventar (`resumenCatalogo`).",
      "Sin selector de mes: una clase no pertenece a un mes, y enseñar uno haría pensar que las cifras son de ese mes.",
      "El número de la barra lateral lo calcula el servidor con su catálogo (hoy, las semillas), no con los cambios guardados en este navegador.",
    ],
    endpoints: ["formacion.listar-catalogo-admin"],
    datos: DATOS_ADMIN,
    respuesta: "Ninguna: es lectura.",
    origen: [
      "app/[locale]/(admin)/admin/formacion/page.tsx:32",
      "app/[locale]/(admin)/layout.tsx:40",
      "components/admin/formacion-admin.tsx:253",
      "components/admin/formacion-admin.tsx:288",
      "lib/formacion.ts:1055",
      "lib/api/admin.ts:190",
    ],
    relacionadas: ["formacion.buscar-clases", "formacion.subir-video-clase"],
  },
  {
    id: "formacion.buscar-clases",
    area: "formacion",
    titulo: "Buscar y filtrar las clases del catálogo",
    resumen: "Encontrar una clase por texto, estado o plan en la tabla del backoffice.",
    quien: ["admin"],
    donde: [
      {
        ruta: "/admin/formacion?estado=publicada&plan=creator",
        etiqueta: "Backoffice › Formación › «Clases del catálogo»",
      },
    ],
    pasos: [
      "En «Clases del catálogo», escribe en «Buscar por título o descripción».",
      "Filtra por «Estado» («Todos», «Borrador», «Publicada», «Retirada») y por «Plan».",
      "Ordena pulsando la cabecera: «Clase», «Estado», «Plan», «Nivel», «Duración» o «Publicada».",
      "Encima de la tabla se lee cuántas filas salen del total («{n} de {total}») y, al otro lado, el resumen de lo filtrado: «{n} clases · {min} min». «Limpiar» quita la búsqueda y los filtros.",
    ],
    reglas: [
      "Búsqueda, filtros, orden y página viven en la URL (`q`, `estado`, `plan`, `orden`, `pagina`): un enlace comparte la vista exacta.",
      "Orden por defecto: «Publicada», de la más reciente a la más antigua.",
      "25 filas por página; la paginación («Página {actual} de {paginas}») solo sale con más de 25, así que con las ocho clases de fábrica no se ve.",
      "Las publicadas sin video llevan la insignia «Sin video».",
      "En el filtro «Plan» las opciones se ven con su id (`free`, `creator`, `business`), no con el nombre del plan.",
      "Sin resultados: «Ninguna clase con estos filtros» — «Prueba a quitar el filtro o crea una clase nueva.»",
    ],
    endpoints: ["formacion.listar-catalogo-admin"],
    datos: DATOS_ADMIN,
    respuesta: "Ninguna: filtrar no suena (AGENTS.md, regla 7).",
    origen: [
      "components/admin/formacion-admin.tsx:312",
      "components/admin/formacion-admin.tsx:323",
      "components/admin/admin-table.tsx:98",
      "components/admin/admin-table.tsx:106",
      "components/admin/admin-table.tsx:242",
    ],
    relacionadas: ["formacion.revisar-catalogo", "formacion.editar-clase"],
  },
  {
    id: "formacion.crear-clase",
    area: "formacion",
    titulo: "Crear una clase",
    resumen:
      "Dar de alta una clase nueva, como borrador o ya publicada, y decidir qué plan hace falta para verla.",
    quien: ["admin"],
    donde: [
      { ruta: "/admin/formacion", etiqueta: "Backoffice › Formación › «Nueva clase»" },
    ],
    pasos: [
      "Pulsa «Nueva clase», arriba a la derecha.",
      "Rellena «Título», «De qué va» y «Duración (segundos)» (arranca en 180), y elige «Nivel» («Inicio», «Medio», «Avanzado») y «Estado» («Borrador», «Publicada», «Retirada»).",
      "Marca los «Temas» (a quien clipea esos temas la clase le sube en la rejilla y le sale con «Por tus temas») y, solo si la clase habla de una red concreta, las «Redes».",
      "Si ya lo tienes, pon el «Video de la clase» y el «Enlace de la portada»; los dos se pueden dejar para después.",
      "Elige el «Plan mínimo»: con Prueba la ve todo el mundo; con otro, sale la nota «Lo que pide plan sale con candado, nunca escondido.»",
      "Pulsa «Guardar».",
    ],
    reglas: [
      "Bloquean y se enseñan al intentar guardar: título de menos de 6 caracteres, descripción de menos de 20, duración fuera de 30–3.600 s, ningún tema o más de 6, y un enlace de video o de portada que no sea http(s) con dominio (`/^https?:\\/\\/\\S+\\.\\S+/`).",
      "Publicar sin video no bloquea: el aviso sale al lado desde el principio y la clase se ve en el catálogo con de qué va.",
      "Nace con id `lec_` + el instante en base 36 + 4 caracteres al azar, `publicadaEn` y `editadaEn` en el momento de guardar (en un borrador, `publicadaEn` es la fecha de creación) y autor «clipealo».",
      "Se recortan los espacios de título, descripción y enlaces; la duración se redondea; sin redes, el campo no se guarda.",
      "El título y la descripción se escriben en español (lo pide el propio formulario) y no se traducen: el alumno ve ese texto tal cual en los tres idiomas.",
      "Publicada, aparece al momento en /formacion del mismo navegador, sin recargar.",
    ],
    estados: [
      {
        estado: "Borrador",
        significa: "`borrador`: existe en el panel; el alumno no la ve.",
      },
      {
        estado: "Publicada",
        significa: "`publicada`: sale en /formacion y en sus rutas.",
      },
      {
        estado: "Retirada",
        significa:
          "`despublicada`: deja de verse, pero el id y el avance de los alumnos siguen.",
      },
    ],
    errores: [
      {
        codigo: "tituloCorto",
        cuando: "El título tiene menos de 6 caracteres.",
        frase: "admin.formacion.form.errors.tituloCorto",
        bloquea: true,
      },
      {
        codigo: "descripcionCorta",
        cuando: "La descripción tiene menos de 20 caracteres.",
        frase: "admin.formacion.form.errors.descripcionCorta",
        bloquea: true,
      },
      {
        codigo: "duracionRango",
        cuando: "La duración está fuera de 30–3.600 segundos.",
        frase: "admin.formacion.form.errors.duracionRango",
        bloquea: true,
      },
      {
        codigo: "temasRequeridos",
        cuando: "No hay ningún tema marcado.",
        frase: "admin.formacion.form.errors.temasRequeridos",
        bloquea: true,
      },
      {
        codigo: "temasDemasiados",
        cuando: "Hay más de 6 temas marcados.",
        frase: "admin.formacion.form.errors.temasDemasiados",
        bloquea: true,
      },
      {
        codigo: "videoUrl",
        cuando: "El enlace del video no es http(s) con dominio.",
        frase: "admin.formacion.form.errors.videoUrl",
        bloquea: true,
      },
      {
        codigo: "portadaUrl",
        cuando: "El enlace de la portada no es http(s) con dominio.",
        frase: "admin.formacion.form.errors.portadaUrl",
        bloquea: true,
      },
      {
        codigo: "publicadaSinVideo",
        cuando: "El estado es «Publicada» y no hay video.",
        frase: "admin.formacion.form.errors.publicadaSinVideo",
        bloquea: false,
      },
      {
        codigo: "noStorage",
        cuando: "El navegador no deja guardar (incógnito, permisos).",
        frase: "admin.formacion.toasts.noStorage",
        bloquea: false,
      },
    ],
    endpoints: ["formacion.crear-clase"],
    datos: DATOS_ADMIN,
    respuesta: `«Nueva clase» y «Guardar» son botones naranjas: suenan «pop» y se encuadran con la marca de recorte. Las opciones de temas y redes suenan «tap». Al guardar, toast.success «Clase guardada» con el título debajo (suena «success»). ${AVISO_SIN_GUARDAR_ADMIN}`,
    origen: [
      "components/admin/formacion-admin.tsx:243",
      "components/admin/formacion-admin.tsx:365",
      "components/admin/clase-form.tsx:130",
      "hooks/use-catalogo-formacion.ts:107",
      "lib/formacion.ts:873",
      "lib/formacion.ts:896",
      "lib/formacion.ts:939",
      "lib/formacion.ts:1005",
      "lib/formacion.ts:1033",
    ],
    relacionadas: [
      "formacion.subir-video-clase",
      "formacion.publicar-clase",
      "formacion.anadir-clase-a-ruta",
    ],
  },
  {
    id: "formacion.editar-clase",
    area: "formacion",
    titulo: "Editar una clase",
    resumen:
      "Cambiar el texto, la duración, los temas, el video o el plan de una clase existente.",
    quien: ["admin"],
    donde: [
      {
        ruta: "/admin/formacion",
        etiqueta: "Backoffice › Formación › menú de la fila › «Editar»",
      },
    ],
    pasos: [
      "En la fila de la clase, abre el menú «Qué hacer con {clase}» (los tres puntos) y elige «Editar».",
      "Se abre «Editar «{clase}»» con todo relleno.",
      "Cambia lo que haga falta y pulsa «Guardar».",
    ],
    reglas: [
      "Mismas validaciones que al crear.",
      "`publicadaEn` (la fecha que ve el alumno) pasa a ser el momento de guardar solo cuando el estado pasa a «Publicada» desde otro, también al volver de «Retirada» (`claseDeBorrador`); corregir una clase que ya estaba publicada no la mueve. `editadaEn` pasa siempre a ser el momento de guardar.",
      "De una clase de fábrica solo se guarda lo que cambia (`parcheLeccion`): así una mejora de la semilla sigue llegando.",
      "En cuanto el admin cambia el título o la descripción de una clase de fábrica, deja de traducirse y sale su texto en los tres idiomas.",
      "Cambiar el plan mínimo mueve el candado al momento; lo que los alumnos ya completaron sigue contando.",
    ],
    errores: [
      {
        codigo: "tituloCorto",
        cuando: "El título tiene menos de 6 caracteres.",
        frase: "admin.formacion.form.errors.tituloCorto",
        bloquea: true,
      },
      {
        codigo: "descripcionCorta",
        cuando: "La descripción tiene menos de 20 caracteres.",
        frase: "admin.formacion.form.errors.descripcionCorta",
        bloquea: true,
      },
      {
        codigo: "duracionRango",
        cuando: "La duración está fuera de 30–3.600 segundos.",
        frase: "admin.formacion.form.errors.duracionRango",
        bloquea: true,
      },
      {
        codigo: "temasRequeridos",
        cuando: "No queda ningún tema marcado.",
        frase: "admin.formacion.form.errors.temasRequeridos",
        bloquea: true,
      },
      {
        codigo: "temasDemasiados",
        cuando: "Hay más de 6 temas marcados.",
        frase: "admin.formacion.form.errors.temasDemasiados",
        bloquea: true,
      },
      {
        codigo: "videoUrl",
        cuando: "El enlace del video no es http(s) con dominio.",
        frase: "admin.formacion.form.errors.videoUrl",
        bloquea: true,
      },
      {
        codigo: "portadaUrl",
        cuando: "El enlace de la portada no es http(s) con dominio.",
        frase: "admin.formacion.form.errors.portadaUrl",
        bloquea: true,
      },
      {
        codigo: "publicadaSinVideo",
        cuando:
          "El estado es «Publicada» y no hay video (el caso de las ocho clases de fábrica al abrirlas).",
        frase: "admin.formacion.form.errors.publicadaSinVideo",
        bloquea: false,
      },
      {
        codigo: "noStorage",
        cuando: "El navegador no deja guardar.",
        frase: "admin.formacion.toasts.noStorage",
        bloquea: false,
      },
    ],
    endpoints: ["formacion.editar-clase"],
    datos: DATOS_ADMIN,
    respuesta: `«Guardar» es naranja: «pop» y marca de recorte. Al guardar, toast.success «Clase guardada» con el título (suena «success»). ${AVISO_SIN_GUARDAR_ADMIN}`,
    origen: [
      "components/admin/formacion-admin.tsx:196",
      "hooks/use-catalogo-formacion.ts:107",
      "lib/formacion.ts:325",
      "lib/formacion.ts:984",
      "lib/formacion.ts:1005",
      "components/formacion/texto-clase.ts:28",
    ],
    relacionadas: [
      "formacion.subir-video-clase",
      "formacion.publicar-clase",
      "formacion.retirar-clase",
    ],
  },
  {
    id: "formacion.subir-video-clase",
    area: "formacion",
    titulo: "Poner el video de una clase",
    resumen:
      "Subir el archivo de la clase o pegar su enlace desde el diálogo de la clase.",
    quien: ["admin"],
    donde: [
      {
        ruta: "/admin/formacion",
        etiqueta: "Backoffice › Formación › diálogo de la clase › «Video de la clase»",
      },
    ],
    pasos: [
      "En el diálogo de la clase, en «Video de la clase», suelta el archivo o pulsa «Seleccionar archivos».",
      "La cola enseña, por archivo, lo subido sobre el total en bytes («{subido} de {total}») y su estado; se puede «Pausar», «Reanudar», «Reintentar desde donde se quedó» o «Quitar {archivo}».",
      "O pega el enlace en «…o pega un enlace de YouTube, Drive o Vimeo» y pulsa «Importar» (o Intro).",
      "El enlace queda escrito debajo; «Quitar el enlace» lo borra.",
      "Pulsa «Guardar» para que la clase lo lleve.",
    ],
    reglas: [
      "Formatos MP4, MOV, WebM o MKV, hasta 8 GB por archivo.",
      "La subida se reanuda desde los bytes ya confirmados; como mucho dos archivos a la vez.",
      "Hoy el transporte recorre el archivo pero no lo guarda en ninguna parte: al terminar no hay enlace y se avisa «El archivo ha recorrido la cola entera, pero todavía no hay dónde guardarlo: hasta que haya almacenamiento no queda ningún enlace. Pega uno mientras tanto.» Cuando el almacenamiento devuelva la dirección, el enlace se rellenará solo.",
      "El enlace tiene que ser http(s) con dominio; si no, bloquea al guardar con «Escribe un enlace válido (https://…).»",
      "Sin video la clase se publica igual, y el reproductor del alumno dice que el video está por subir.",
    ],
    estados: [
      { estado: "En cola", significa: "`en-cola`: espera turno." },
      { estado: "Subiendo", significa: "`subiendo`: avanza por trozos." },
      { estado: "Pausado", significa: "`pausado`: se reanuda desde lo confirmado." },
      { estado: "Completado", significa: "`completado`: ha llegado entero." },
      { estado: "Error", significa: "`error`: se reintenta desde donde se quedó." },
    ],
    errores: [
      {
        codigo: "invalidType",
        cuando: "El archivo no es MP4, MOV, WebM ni MKV.",
        frase: "common.video.upload.invalidType",
        bloquea: true,
      },
      {
        codigo: "tooBig",
        cuando: "El archivo pasa de 8 GB.",
        frase: "common.video.upload.tooBig",
        bloquea: true,
      },
      {
        codigo: "videoUrl",
        cuando: "El enlace pegado no es http(s) con dominio.",
        frase: "admin.formacion.form.errors.videoUrl",
        bloquea: true,
      },
    ],
    endpoints: ["formacion.subir-video"],
    datos:
      "El archivo pasa por `useResumableUpload` con el transporte simulado de `lib/api/upload.ts`, que no devuelve `url`. El enlace se guarda con la clase, en el navegador del admin.",
    respuesta:
      "Un formato no admitido o un archivo demasiado grande suena «error» y sacude la zona de subida, con el motivo debajo. «Importar» es secundario y no suena.",
    origen: [
      "components/admin/clase-form.tsx:102",
      "components/admin/clase-form.tsx:269",
      "components/admin/clase-form.tsx:293",
      "components/video/upload-dropzone.tsx:28",
      "components/video/upload-dropzone.tsx:106",
      "hooks/use-resumable-upload.ts:47",
      "lib/api/upload.ts:54",
    ],
    relacionadas: ["formacion.crear-clase", "formacion.editar-clase"],
  },
  {
    id: "formacion.publicar-clase",
    area: "formacion",
    titulo: "Publicar una clase",
    resumen: "Hacer visible en /formacion un borrador o una clase retirada.",
    quien: ["admin"],
    donde: [
      {
        ruta: "/admin/formacion",
        etiqueta: "Backoffice › Formación › menú de la fila › «Publicar»",
      },
    ],
    pasos: [
      "En la fila de un borrador o de una clase retirada, abre el menú de los tres puntos.",
      "Elige «Publicar».",
    ],
    reglas: [
      "Cambia el estado a publicada y la fecha de edición: la clase aparece en /formacion y en las rutas que la llevan.",
      "Vuelve con el avance de los alumnos intacto: retirarla no borró nada.",
      "Este atajo no toca `publicadaEn`: un borrador publicado desde aquí conserva como fecha de publicación la de su creación. Publicarlo desde «Editar» sí lo estrena con la fecha del momento (`claseDeBorrador`).",
      "Una clase retirada que se vuelve a publicar desde aquí conserva también su `publicadaEn` antigua.",
      "Se puede publicar sin video; la cifra «Sin video» del panel lo cuenta (el número de la barra lateral no, porque sale de las semillas del servidor).",
    ],
    endpoints: ["formacion.cambiar-estado-clase"],
    datos: DATOS_ADMIN,
    respuesta: `toast.success «Clase publicada» con el título debajo (suena «success»). ${AVISO_SIN_GUARDAR_ADMIN}`,
    origen: [
      "components/admin/formacion-admin.tsx:212",
      "hooks/use-catalogo-formacion.ts:124",
      "lib/formacion.ts:1011",
    ],
    relacionadas: ["formacion.retirar-clase", "formacion.crear-clase"],
  },
  {
    id: "formacion.retirar-clase",
    area: "formacion",
    titulo: "Retirar una clase",
    resumen:
      "Dejar de enseñar una clase publicada sin borrarla ni perder el avance de nadie.",
    quien: ["admin"],
    donde: [
      {
        ruta: "/admin/formacion",
        etiqueta: "Backoffice › Formación › menú de la fila › «Retirar»",
      },
    ],
    pasos: [
      "En la fila de una clase publicada, abre el menú de los tres puntos y elige «Retirar».",
    ],
    reglas: [
      "Retirar no borra: el id sigue vivo y el avance de quien la estaba viendo también. Si vuelve a publicarse, vuelve intacta.",
      "Deja de salir en «Todas las clases» y en las rutas. Si todas las clases de una ruta quedan retiradas, la ruta deja de proponerse.",
      "Si en ese mismo navegador está abierta en /formacion (también en otra pestaña, por el evento `storage`), se cierra.",
      "Es la única salida para una clase de fábrica: esas no se borran.",
    ],
    endpoints: ["formacion.cambiar-estado-clase"],
    datos: DATOS_ADMIN,
    respuesta: `toast.success «Clase retirada» — «Deja de verse en Formación. El avance de quien la estaba viendo no se toca.» (suena «success»). ${AVISO_SIN_GUARDAR_ADMIN}`,
    origen: [
      "components/admin/formacion-admin.tsx:200",
      "hooks/use-catalogo-formacion.ts:124",
      "components/formacion/formacion-panel.tsx:81",
      "lib/formacion.ts:783",
    ],
    relacionadas: ["formacion.publicar-clase", "formacion.borrar-clase"],
  },
  {
    id: "formacion.borrar-clase",
    area: "formacion",
    titulo: "Borrar una clase creada en el panel",
    resumen: "Eliminar para siempre una clase que se creó desde el backoffice.",
    quien: ["admin"],
    donde: [
      {
        ruta: "/admin/formacion",
        etiqueta: "Backoffice › Formación › menú de la fila › «Borrar»",
      },
    ],
    pasos: [
      "En la fila de una clase creada en el panel, abre el menú de los tres puntos y elige «Borrar» (las de fábrica no lo tienen).",
      "Confirma en «¿Borrar «{clase}»?» con «Borrar la clase», o vuelve con «No borrarla».",
    ],
    reglas: [
      "Solo se borran las clases creadas en el panel. Una de fábrica se retira: borrarla dejaría rutas apuntando a un id que no existe y tiraría el avance de quien la estaba viendo.",
      "No se deshace.",
      "Al recargar, las rutas que la llevaban dejan de apuntar a ella (`migrarCatalogo` quita los ids que no existen).",
    ],
    endpoints: ["formacion.borrar-clase"],
    datos: DATOS_ADMIN,
    respuesta: `El botón de confirmar es destructivo. Al borrar, toast.success «Clase borrada» con el título (suena «success»). ${AVISO_SIN_GUARDAR_ADMIN}`,
    origen: [
      "components/admin/formacion-admin.tsx:226",
      "components/admin/formacion-admin.tsx:378",
      "hooks/use-catalogo-formacion.ts:147",
      "hooks/use-catalogo-formacion.ts:227",
      "lib/formacion.ts:1257",
    ],
    relacionadas: ["formacion.retirar-clase", "formacion.crear-clase"],
  },
  {
    id: "formacion.crear-ruta",
    area: "formacion",
    titulo: "Crear una ruta",
    resumen: "Dar de alta una ruta nueva: su título, de qué va y a quién se le propone.",
    quien: ["admin"],
    donde: [
      {
        ruta: "/admin/formacion",
        etiqueta: "Backoffice › Formación › «Rutas» › «Nueva ruta»",
      },
    ],
    pasos: [
      "En «Rutas», pulsa «Nueva ruta».",
      "Escribe «Título» y «De qué va», y marca «A quién se le propone»: «Nunca he editado», «Por diversión», «Con regularidad», «Para clientes».",
      "Pulsa «Guardar».",
      "Añádele las clases desde su tarjeta, con «Añadir una clase».",
    ],
    reglas: [
      "Bloquean: título de menos de 6 caracteres, descripción de menos de 20 y no elegir a quién se propone.",
      "Sin clases, o solo con clases sin publicar, se guarda igual y se avisa: el clipero no la ve hasta que lleve alguna publicada. Como el diálogo no lleva clases, al crearla sale siempre «Todavía no lleva ninguna clase…».",
      "Nace sin clases, con id `ruta_` + el instante en base 36 + 4 caracteres al azar.",
      "El plan de la ruta no se elige: es el más alto de sus clases publicadas y se calcula.",
      "«A quién se le propone» se cruza con la experiencia del clipero: la micropregunta «¿Cuánto has editado antes?» que sale al enviar un clip (el texto de ayuda del diálogo dice «onboarding», pero el onboarding no la pregunta). Sin respuesta, cuenta como «Con regularidad» si ya ha enviado algún clip y como «Nunca he editado» si no.",
      "Las rutas creadas van detrás de las de fábrica: si una nueva se propone a la misma experiencia que una de fábrica, se recomienda antes la de fábrica. `rutaRecomendada` recorre las rutas en ese orden: primero busca una empezada y sin terminar, y si no hay, se queda con la primera que encaja con la experiencia.",
    ],
    errores: [
      {
        codigo: "tituloCorto",
        cuando: "El título tiene menos de 6 caracteres.",
        frase: "admin.formacion.rutas.form.errors.tituloCorto",
        bloquea: true,
      },
      {
        codigo: "descripcionCorta",
        cuando: "La descripción tiene menos de 20 caracteres.",
        frase: "admin.formacion.rutas.form.errors.descripcionCorta",
        bloquea: true,
      },
      {
        codigo: "sinPara",
        cuando: "No se ha elegido a quién se propone.",
        frase: "admin.formacion.rutas.form.errors.sinPara",
        bloquea: true,
      },
      {
        codigo: "sinClases",
        cuando: "Todavía no lleva ninguna clase.",
        frase: "admin.formacion.rutas.form.errors.sinClases",
        bloquea: false,
      },
      {
        codigo: "sinPublicadas",
        cuando: "Ninguna de sus clases está publicada.",
        frase: "admin.formacion.rutas.form.errors.sinPublicadas",
        bloquea: false,
      },
    ],
    endpoints: ["formacion.crear-ruta"],
    datos: DATOS_ADMIN,
    respuesta: `«Nueva ruta» es secundario y no suena; «Guardar» es naranja («pop» y marca de recorte) y las opciones suenan «tap». Al guardar, toast.success «Ruta guardada» con el título (suena «success»). ${AVISO_SIN_GUARDAR_ADMIN}`,
    origen: [
      "components/admin/rutas-admin.tsx:106",
      "components/admin/rutas-admin.tsx:330",
      "components/admin/formacion-admin.tsx:299",
      "hooks/use-catalogo-formacion.ts:157",
      "lib/formacion.ts:1156",
      "lib/formacion.ts:1191",
      "lib/formacion.ts:1241",
      "lib/formacion.ts:775",
      "lib/micro-preguntas.ts:63",
    ],
    relacionadas: ["formacion.anadir-clase-a-ruta", "formacion.editar-ruta"],
  },
  {
    id: "formacion.editar-ruta",
    area: "formacion",
    titulo: "Editar una ruta",
    resumen: "Cambiar el título, la descripción o a quién se le propone una ruta.",
    quien: ["admin"],
    donde: [
      {
        ruta: "/admin/formacion",
        etiqueta: "Backoffice › Formación › «Rutas» › «Editar la ruta»",
      },
    ],
    pasos: [
      "En la tarjeta de la ruta, pulsa «Editar la ruta» (el lápiz).",
      "En «Editar «{ruta}»», cambia título, descripción o a quién se propone, y pulsa «Guardar».",
    ],
    reglas: [
      "Mismas validaciones que al crear.",
      "De una ruta de fábrica solo se guarda lo que cambia (`parcheRuta`).",
      "La tarjeta enseña el plan calculado, «N clases», «N sin publicar» en tono de aviso y «Se propone a: …».",
      "Los avisos que no bloquean (sin clases, ninguna publicada) salen en el diálogo desde que se abre; los que bloquean, al pulsar «Guardar».",
    ],
    errores: [
      {
        codigo: "tituloCorto",
        cuando: "El título tiene menos de 6 caracteres.",
        frase: "admin.formacion.rutas.form.errors.tituloCorto",
        bloquea: true,
      },
      {
        codigo: "descripcionCorta",
        cuando: "La descripción tiene menos de 20 caracteres.",
        frase: "admin.formacion.rutas.form.errors.descripcionCorta",
        bloquea: true,
      },
      {
        codigo: "sinPara",
        cuando: "No queda nadie a quien proponerla.",
        frase: "admin.formacion.rutas.form.errors.sinPara",
        bloquea: true,
      },
      {
        codigo: "sinClases",
        cuando: "La ruta no lleva ninguna clase.",
        frase: "admin.formacion.rutas.form.errors.sinClases",
        bloquea: false,
      },
      {
        codigo: "sinPublicadas",
        cuando: "Ninguna de sus clases está publicada.",
        frase: "admin.formacion.rutas.form.errors.sinPublicadas",
        bloquea: false,
      },
    ],
    endpoints: ["formacion.editar-ruta"],
    datos: DATOS_ADMIN,
    respuesta: `«Guardar» es naranja («pop» y marca de recorte). Al guardar, toast.success «Ruta guardada» con el título (suena «success»). ${AVISO_SIN_GUARDAR_ADMIN}`,
    origen: [
      "components/admin/rutas-admin.tsx:142",
      "components/admin/rutas-admin.tsx:164",
      "hooks/use-catalogo-formacion.ts:157",
      "lib/formacion.ts:335",
    ],
    relacionadas: ["formacion.ordenar-ruta", "formacion.crear-ruta"],
  },
  {
    id: "formacion.ordenar-ruta",
    area: "formacion",
    titulo: "Cambiar el orden de las clases de una ruta",
    resumen:
      "Subir o bajar una clase dentro de la ruta, que es el orden en que la ve el clipero.",
    quien: ["admin"],
    donde: [
      {
        ruta: "/admin/formacion",
        etiqueta: "Backoffice › Formación › «Rutas» › flechas de cada clase",
      },
    ],
    pasos: [
      "En la lista numerada de la ruta, pulsa «Subir {clase}» o «Bajar {clase}» (las flechas).",
      "El orden cambia al momento, sin abrir nada.",
    ],
    reglas: [
      "Un paso cada vez. La primera no se puede subir ni la última bajar: sus flechas están apagadas.",
      "El orden de la ruta es el orden en que el clipero ve sus clases y el que siguen «Seguir con la ruta» y «Siguiente clase».",
      "Se ordenan también los borradores y las retiradas, marcados con su estado.",
      "Se guarda la ruta entera con el orden nuevo.",
    ],
    endpoints: ["formacion.editar-ruta"],
    datos: DATOS_ADMIN,
    respuesta: `toast.success «Orden cambiado» (suena «success»). ${AVISO_SIN_GUARDAR_ADMIN}`,
    origen: [
      "components/admin/rutas-admin.tsx:198",
      "components/admin/formacion-admin.tsx:301",
      "hooks/use-catalogo-formacion.ts:204",
      "lib/formacion.ts:1248",
    ],
    relacionadas: ["formacion.anadir-clase-a-ruta", "formacion.quitar-clase-de-ruta"],
  },
  {
    id: "formacion.anadir-clase-a-ruta",
    area: "formacion",
    titulo: "Añadir una clase a una ruta",
    resumen: "Meter una clase del catálogo al final de una ruta.",
    quien: ["admin"],
    donde: [
      {
        ruta: "/admin/formacion",
        etiqueta: "Backoffice › Formación › «Rutas» › «Añadir una clase»",
      },
    ],
    pasos: [
      "En la tarjeta de la ruta, abre el desplegable «Añadir una clase».",
      "Elige una clase: se añade al final de la ruta.",
    ],
    reglas: [
      "Solo ofrece las clases que no están ya en la ruta, publicadas o no. Si no queda ninguna, el desplegable se apaga con «No queda ninguna clase por añadir».",
      "Una clase no se repite dentro de una ruta.",
      "Una clase sin publicar entra en la ruta, pero el alumno no la ve hasta que se publique.",
    ],
    endpoints: ["formacion.editar-ruta"],
    datos: DATOS_ADMIN,
    respuesta: `toast.success «Ruta guardada» (suena «success»). ${AVISO_SIN_GUARDAR_ADMIN}`,
    origen: [
      "components/admin/rutas-admin.tsx:230",
      "components/admin/formacion-admin.tsx:304",
      "hooks/use-catalogo-formacion.ts:209",
    ],
    relacionadas: ["formacion.quitar-clase-de-ruta", "formacion.ordenar-ruta"],
  },
  {
    id: "formacion.quitar-clase-de-ruta",
    area: "formacion",
    titulo: "Quitar una clase de una ruta",
    resumen: "Sacar una clase de la ruta sin tocarla en el catálogo.",
    quien: ["admin"],
    donde: [
      {
        ruta: "/admin/formacion",
        etiqueta: "Backoffice › Formación › «Rutas» › «Quitar {clase} de la ruta»",
      },
    ],
    pasos: [
      "En la lista de la ruta, pulsa «Quitar {clase} de la ruta» (la X de su fila).",
    ],
    reglas: [
      "Quita la clase de la ruta, no del catálogo.",
      "No pide confirmación: se vuelve a meter con «Añadir una clase», al final.",
      "Si la ruta se queda sin clases publicadas, deja de proponerse al alumno.",
    ],
    endpoints: ["formacion.editar-ruta"],
    datos: DATOS_ADMIN,
    respuesta: `toast.success «Ruta guardada» (suena «success»). ${AVISO_SIN_GUARDAR_ADMIN}`,
    origen: [
      "components/admin/rutas-admin.tsx:216",
      "components/admin/formacion-admin.tsx:307",
      "hooks/use-catalogo-formacion.ts:211",
    ],
    relacionadas: ["formacion.anadir-clase-a-ruta", "formacion.borrar-ruta"],
  },
  {
    id: "formacion.borrar-ruta",
    area: "formacion",
    titulo: "Borrar una ruta creada en el panel",
    resumen: "Eliminar para siempre una ruta que se creó desde el backoffice.",
    quien: ["admin"],
    donde: [
      {
        ruta: "/admin/formacion",
        etiqueta: "Backoffice › Formación › «Rutas» › «Borrar la ruta»",
      },
    ],
    pasos: [
      "En la tarjeta de una ruta creada en el panel, pulsa «Borrar la ruta» (la papelera; las de fábrica no la tienen).",
      "Confirma en «¿Borrar «{ruta}»?» con «Borrar la ruta», o vuelve con «No borrarla».",
    ],
    reglas: [
      "Solo se borran las rutas creadas en el panel, y no se deshace.",
      "Las clases no se tocan: siguen en el catálogo.",
    ],
    endpoints: ["formacion.borrar-ruta"],
    datos: DATOS_ADMIN,
    respuesta: `El botón de confirmar es destructivo. Al borrar, toast.success «Ruta borrada» (suena «success»). ${AVISO_SIN_GUARDAR_ADMIN}`,
    origen: [
      "components/admin/rutas-admin.tsx:150",
      "components/admin/rutas-admin.tsx:273",
      "hooks/use-catalogo-formacion.ts:173",
      "hooks/use-catalogo-formacion.ts:232",
    ],
    relacionadas: ["formacion.crear-ruta", "formacion.quitar-clase-de-ruta"],
  },
]
