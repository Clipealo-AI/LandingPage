import type { SeccionMarca } from "@/lib/wiki/tipos"

/**
 * La guía de marca, sección a sección.
 *
 * Sale de las fuentes reales: los tokens de `app/globals.css`, el movimiento de
 * `app/motion/*.css`, las piezas de `components/brand/**`, las reglas del
 * sistema de diseño de `AGENTS.md`, el sonido y los efectos de `lib/` y la voz
 * de `messages/es`. `/design-system` enseña los componentes reales; aquí va el
 * porqué, lo que se cumple siempre y lo que no se hace.
 */
export const SECCIONES_MARCA: SeccionMarca[] = [
  /* ------------------------------------------------------------------------ */
  {
    id: "principios",
    titulo: "Principios",
    resumen:
      "Las ocho reglas del sistema de diseño en una página. Esta guía explica el porqué; /design-system enseña los componentes reales.",
    criterio: [
      "Clipealo es una plataforma de clipping y la marca gira alrededor de un gesto: recortar. El isotipo son corchetes de recorte, el acento naranja es «el momento seleccionado dentro del frame», la acción principal se encuadra con la marca de recorte al pulsarla y hasta el sonido de confirmar un recorte son «dos cortes de tijera».",
      "/design-system es «un manual de marca convertido en tokens, componentes y reglas»: todo lo que enseña es el código que usa el producto, sin capturas (muestras de color, escalas, radios, sombras, isotipo, marca de recorte, botones, formularios, componentes de video, datos y contrastes medidos). Esta guía no repite esas muestras: da el criterio, las reglas y lo que no se hace, y manda allí para verlo.",
      "Si tocas color, tipografía o un componente de components/video/**, mira /design-system: documenta el cambio solo, porque renderiza los componentes reales.",
    ],
    reglas: [
      "1 · Un componente nunca escribe un color: consume tokens semánticos (bg-card, text-muted-foreground, bg-brand).",
      '2 · Azul = estructura, naranja = acento: como mucho una acción variant="brand" visible por vista, más la marca de recorte y el clip seleccionado.',
      "3 · La display (Climate Crisis, utilidad .display) es solo para titulares de marketing; los títulos de componente van en DM Sans.",
      '4 · Los timecodes llevan data-slot="timecode" o la clase tabular, o el contador baila durante la reproducción.',
      "5 · El movimiento de la landing cuenta «de video largo a clip», breve y con red: cuatro disparadores (al cargar, al entrar en pantalla, ligado al scroll del reencuadre y ligado al gesto) y ninguno más.",
      "6 · «Reducir movimiento» reduce, no quita: lo que se desplaza o escala se sustituye en su sitio.",
      "7 · Sonido y efecto solo cuando lo merece: el botón brand suena («pop») y se encuadra; success y error suenan; celebrate es para hitos.",
      "8 · El estado natural es el estado final: sin JS, sin IntersectionObserver, al imprimir o en capturas, todo se ve terminado.",
    ],
    origen: [
      "AGENTS.md:18",
      "AGENTS.md:165",
      "messages/es/designSystem.json:9",
      "components/brand/logo.tsx:5",
      "lib/sound.ts:184",
      "app/[locale]/(marketing)/design-system/page.tsx",
    ],
  },

  /* ------------------------------------------------------------------------ */
  {
    id: "logotipo",
    titulo: "Logotipo e isotipo",
    resumen:
      "Tres corchetes de recorte y un cuadrado naranja: el momento seleccionado dentro del encuadre. El logotipo es ese isotipo más «Clipealo» en la display.",
    criterio: [
      "El isotipo son tres corchetes de recorte y una esquina sólida. El cuadrado naranja es «el momento seleccionado dentro del frame»: es la única pieza de la marca que siempre lleva acento.",
      "Los corchetes heredan currentColor. El color se decide con una utilidad de texto en el contenedor (text-foreground, text-white…), así el mismo isotipo funciona en claro y en oscuro sin variantes duplicadas; solo el cuadrado se mantiene naranja (fill-brand).",
      "El logotipo es el isotipo, en decorativo, seguido de la palabra «Clipealo» con la utilidad .display. Por eso la display aparece también en la barra lateral de la aplicación: dentro del logotipo es marca, no un título de componente.",
      "Las variantes vivas (color, sobre oscuro, monocromo y logotipo) están en /design-system, sección Marca.",
    ],
    reglas: [
      "<Logo size>: sm = isotipo size-6 y palabra text-lg (barras laterales de la app y del backoffice, /login); md = size-7 y text-2xl, el tamaño de cabecera (cabecera de marketing y pie); lg = size-9 y text-3xl, para pies y pantallas de bienvenida según el componente (hoy, el panel de marca del acceso y la 404).",
      "iconOnly deja solo el isotipo, que entonces sí lleva su <title>. El componente lo prevé para la barra lateral colapsada, avatares y favicon; hoy lo usan la barra lateral colapsada de la app y del backoffice y la cabecera del onboarding (/bienvenida).",
      'El isotipo suelto lleva <title>Clipealo</title> y role="img"; dentro del logotipo va decorative (role="presentation", aria-hidden) porque la palabra de al lado ya nombra la marca.',
      'tone="brand" por defecto; tone="mono" pinta también el cuadrado con currentColor, para sellos y favicon a una tinta.',
      'Sobre superficies oscuras el color se da en el contenedor: className="text-white" en el pie y la 404, text-ink-50 en el panel de acceso.',
      "Geometría: viewBox 32 × 32, trazo de 5,5 con remates y uniones redondos; el cuadrado de acento mide 10 × 10, con radio 3, en (18, 4).",
      "El favicon (app/icon.svg) es el isotipo en paper (#f8fbfe) sobre un cuadrado ink (#121f38) de radio 7, con el acento en #fd5e1c. Está redibujado para 32 px: trazo de 4 y cuadrado de acento de 8 × 8 con radio 2,5.",
    ],
    noHacer: [
      {
        que: "Recolorear el cuadrado de acento o pintarlo de otro color que no sea brand.",
        porque:
          'Es la única pieza que siempre lleva el naranja y significa el momento elegido. La única excepción prevista es tone="mono", a una sola tinta.',
      },
      {
        que: "Duplicar el SVG con colores fijos para el tema oscuro.",
        porque:
          "Los corchetes heredan currentColor: el tema se resuelve con la clase de texto del contenedor.",
      },
      {
        que: "Poner el isotipo con su <title> junto a la palabra «Clipealo».",
        porque:
          "Un lector de pantalla diría el nombre dos veces; por eso Logo pasa el isotipo como decorative.",
      },
    ],
    tokens: [
      {
        variable: "brand",
        nombre: "Acento del isotipo",
        uso: "El cuadrado del isotipo (fill-brand).",
      },
      {
        variable: "color-ink-900",
        nombre: "Ink · #121f38",
        uso: "Fondo del favicon.",
      },
      {
        variable: "color-ink-50",
        nombre: "Paper · #f8fbfe",
        uso: "Corchetes del favicon y del logotipo en el panel de acceso (text-ink-50).",
      },
    ],
    origen: [
      "components/brand/logo.tsx:5",
      "components/brand/logo.tsx:14",
      "components/brand/logo.tsx:59",
      "components/brand/logo.tsx:67",
      "components/brand/logo.tsx:89",
      "app/icon.svg",
      "components/app/app-sidebar.tsx:122",
      "components/admin/admin-sidebar.tsx:206",
      "app/[locale]/(auth)/login/page.tsx:62",
      "components/marketing/site-header.tsx:106",
      "components/marketing/cta.tsx:70",
      "components/auth/auth-brand-panel.tsx:49",
      "app/[locale]/not-found.tsx:20",
      "components/onboarding/onboarding-flow.tsx:585",
      "messages/es/designSystem.json:69",
    ],
  },

  /* ------------------------------------------------------------------------ */
  {
    id: "color",
    titulo: "Color",
    resumen:
      "Tres escalas OKLCH (ink, blue y brand) que salen de los cinco colores del manual, y una capa semántica que es lo único que tocan los componentes.",
    criterio: [
      "Los cinco colores del manual caen exactamente en un peldaño: paper #f8fbfe = ink-50, mist #dce9ff = blue-100, blue #1472fd = blue-500, orange #fd5e1c = brand-500 e ink #121f38 = ink-900. La paleta amplía la marca sin traicionarla.",
      "Azul = estructura: es el color que el sistema puede repetir sin gastarlo (--primary es blue-600 en claro). Naranja = acento: solo la acción principal, la marca de recorte y el momento seleccionado (--brand es brand-500). El naranja es un token aparte a propósito, para que el sistema no lo herede por accidente.",
      "Dos capas: las primitivas (bloque 1 de globals.css: --color-ink-*, --color-blue-*, --color-brand-*) y los semánticos (bloque 3: --primary, --brand, --muted, --stage…). Cambiar un tema es reasignar los semánticos, nunca tocar los componentes.",
      "«El naranja marca el momento seleccionado. Si aparece en todas partes deja de significarlo.» El ejemplo correcto e incorrecto de esta regla, las escalas y los semánticos en vivo están en /design-system, sección Color.",
    ],
    reglas: [
      "Un componente nunca escribe un color: consume semánticos (bg-card, text-muted-foreground, bg-brand).",
      "Las primitivas solo se usan en app/globals.css y en superficies que son siempre oscuras pase lo que pase: hero, pie, 404 y el monitor del onboarding (la columna bg-stage de /bienvenida).",
      'Como máximo una acción variant="brand" visible por vista, más la marca de recorte y el clip seleccionado.',
      "El texto sobre naranja va en ink-950 (--brand-foreground, 6,12:1), no en blanco (3,09:1: vale para un componente gráfico según WCAG 1.4.11, no para texto).",
      "El foco (--ring) es naranja: brand-600 en claro (4,0:1 sobre paper, cumple 1.4.11) y brand-400 en oscuro.",
      "--muted-foreground es ink-600 (5,5:1, AA): no se baja a ink-500.",
      "--accent es mist (1,23:1 sobre blanco); blue-50 daba 1,06:1 y el hover no se veía.",
      "Hover y pulsado de ghost y outline son alfas, no un color nuevo: de tinta en claro (--surface-hover al 12 % y --surface-active al 20 %, 1,27:1 y 1,51:1 medidos) y de blanco en oscuro (8 % y 14 %).",
      "--stage es la superficie del editor: oscura en los dos temas, porque el video manda el punto blanco.",
      "La selección de texto es brand-500 con texto ink-950.",
      "Los alias --color-paper, --color-mist y --color-ink existen para prosa y piezas sueltas de marketing.",
    ],
    noHacer: [
      {
        que: "Usar bg-blue-500, text-ink-700 u otra primitiva dentro de un componente.",
        porque:
          "Se salta la capa semántica: el tema oscuro no la reasigna y el componente queda mal en uno de los dos.",
      },
      {
        que: "Dos o tres botones naranjas en la misma vista.",
        porque:
          "«Tres naranjas compiten y ninguno gana»: el naranja deja de significar «esto es lo que hay que pulsar».",
      },
      {
        que: "Texto blanco sobre el naranja.",
        porque:
          "Medido, blanco sobre #fd5e1c da 3,09:1 y AA pide 4,5:1 para texto; ink-950 da 6,12:1.",
      },
      {
        que: "Pintar de naranja cabezales, cuchillas o luces.",
        porque:
          "El naranja es la marca de recorte y el clip seleccionado; lo demás va en primary, tinta o blanco.",
      },
    ],
    tokens: [
      {
        variable: "color-ink-50",
        nombre: "Paper · ink-50",
        uso: "Fondo de la página en claro.",
      },
      {
        variable: "color-ink-900",
        nombre: "Ink · ink-900",
        uso: "Texto en claro, tarjeta en oscuro.",
      },
      {
        variable: "color-ink-950",
        nombre: "ink-950",
        uso: "Texto sobre naranja, fondo en oscuro.",
      },
      {
        variable: "color-blue-100",
        nombre: "Mist · blue-100",
        uso: "Secundario y acento en claro; texto en oscuro.",
      },
      {
        variable: "color-blue-500",
        nombre: "Blue · blue-500",
        uso: "El azul del manual.",
      },
      {
        variable: "color-blue-600",
        nombre: "blue-600",
        uso: "--primary en claro (blanco encima: 5,9:1).",
      },
      {
        variable: "color-brand-500",
        nombre: "Orange · brand-500",
        uso: "--brand en los dos temas.",
      },
      {
        variable: "color-brand-600",
        nombre: "brand-600",
        uso: "Anillo de foco en claro.",
      },
      { variable: "background", nombre: "Fondo", uso: "Fondo de página." },
      { variable: "foreground", nombre: "Texto", uso: "Texto principal." },
      {
        variable: "card",
        nombre: "Tarjeta",
        uso: "Superficie de tarjetas: blanco en claro, ink-900 en oscuro.",
      },
      {
        variable: "card-foreground",
        nombre: "Texto de tarjeta",
        uso: "ink-900 en claro, mist en oscuro.",
      },
      {
        variable: "popover",
        nombre: "Superficie flotante",
        uso: "Menús, selects, paleta de comandos y avisos (toast): la misma superficie que la tarjeta.",
      },
      {
        variable: "popover-foreground",
        nombre: "Texto flotante",
        uso: "Texto de menús y avisos.",
      },
      {
        variable: "primary",
        nombre: "Primario (azul)",
        uso: "Estructura: botón default, enlaces, marcas activas.",
      },
      {
        variable: "primary-foreground",
        nombre: "Texto sobre primario",
        uso: "Texto del botón default: blanco en claro, ink-950 en oscuro.",
      },
      {
        variable: "primary-hover",
        nombre: "Primario al pasar",
        uso: "Hover del botón default: blue-700 en claro, blue-300 en oscuro.",
      },
      {
        variable: "secondary",
        nombre: "Secundario",
        uso: "Botón e insignia secondary: mist en claro, blanco al 8 % en oscuro.",
      },
      {
        variable: "secondary-foreground",
        nombre: "Texto sobre secundario",
        uso: "blue-900 en claro, mist en oscuro.",
      },
      {
        variable: "brand",
        nombre: "Marca (naranja)",
        uso: "La acción principal de la vista.",
      },
      {
        variable: "brand-foreground",
        nombre: "Texto sobre marca",
        uso: "ink-950 sobre el naranja.",
      },
      {
        variable: "brand-hover",
        nombre: "Marca al pasar",
        uso: "Hover del botón brand (brand-400).",
      },
      {
        variable: "brand-subtle",
        nombre: "Marca tenue",
        uso: "Fondo del botón y la insignia brand-subtle: brand-100 en claro, naranja al 16 % en oscuro.",
      },
      {
        variable: "brand-subtle-foreground",
        nombre: "Texto sobre marca tenue",
        uso: "brand-800 en claro, brand-300 en oscuro.",
      },
      {
        variable: "muted",
        nombre: "Apagado",
        uso: "Fondos neutros y controles deshabilitados.",
      },
      {
        variable: "muted-foreground",
        nombre: "Texto apagado",
        uso: "Texto secundario (5,5:1).",
      },
      {
        variable: "accent",
        nombre: "Acento de superficie",
        uso: "Fondo del elemento resaltado en menús y listas (focus:bg-accent): mist en claro, blanco al 8 % en oscuro.",
      },
      {
        variable: "accent-foreground",
        nombre: "Texto sobre acento",
        uso: "blue-900 en claro, mist en oscuro.",
      },
      {
        variable: "surface-hover",
        nombre: "Superficie al pasar",
        uso: "Hover de ghost y outline.",
      },
      {
        variable: "surface-active",
        nombre: "Superficie pulsada",
        uso: "Pulsado de ghost y outline.",
      },
      { variable: "border", nombre: "Borde", uso: "Bordes y separadores." },
      { variable: "input", nombre: "Borde de campo", uso: "Campos de formulario." },
      {
        variable: "ring",
        nombre: "Foco",
        uso: "Anillo de foco, naranja; solo sobre la sección naranja del CTA se pasa a tinta en el contenedor.",
      },
      {
        variable: "stage",
        nombre: "Escenario",
        uso: "Superficie del video y del editor.",
      },
      {
        variable: "stage-foreground",
        nombre: "Texto del escenario",
        uso: "Texto sobre el escenario (mist).",
      },
      {
        variable: "color-paper",
        nombre: "Alias paper",
        uso: "= ink-50, para prosa y piezas sueltas de marketing.",
      },
      {
        variable: "color-mist",
        nombre: "Alias mist",
        uso: "= blue-100; el texto del pie (text-mist).",
      },
      {
        variable: "color-ink",
        nombre: "Alias ink",
        uso: "= ink-900.",
      },
    ],
    origen: [
      "app/globals.css:22",
      "app/globals.css:67",
      "app/globals.css:173",
      "app/globals.css:215",
      "app/globals.css:230",
      "app/globals.css:257",
      "app/globals.css:397",
      "AGENTS.md:20",
      "AGENTS.md:27",
      "messages/es/designSystem.json:39",
      "messages/es/designSystem.json:210",
      "components/design-system/showcase.tsx:128",
      "components/ui/dropdown-menu.tsx:69",
      "components/marketing/cta.tsx:66",
    ],
  },

  /* ------------------------------------------------------------------------ */
  {
    id: "estados-y-graficos",
    titulo: "Estados y gráficos",
    resumen:
      "Verde, ámbar y rojo teñidos hacia el eje frío de la marca, y seis colores categóricos con orden fijo para las gráficas.",
    criterio: [
      "Los colores de estado (success, warning, danger) van teñidos hacia el eje frío de la marca para convivir con el azul y el naranja.",
      "Cada peldaño tiene un propósito: el 700 de success y warning existe para el texto pequeño sobre su propio tinte (el 600 sobre bg-success/12 daba 3,3:1 y AA pide 4,5:1 a 14 px); danger-400 es el rojo de texto sobre superficies oscuras.",
      "La paleta categórica son los dos tonos de la marca (naranja y azul) más cuatro armónicos, validada en banda de luminosidad, croma, separación para daltonismo y contraste contra #fff. En oscuro no es un volteo automático: cada peldaño se eligió y se validó contra la tarjeta oscura #121f38.",
      "El color sigue a la entidad, no a su posición: en analíticas cada red tiene el suyo y filtrar no repinta a las demás. La paleta y las tarjetas de métricas están en /design-system, sección Datos.",
    ],
    reglas: [
      "Insignias de estado con las variantes de Badge: success (bg-success/12 y texto success-700), warning (bg-warning/15 y texto warning-700) y destructive; en oscuro el texto sube al semántico.",
      "Orden fijo de chart-1 a chart-6, nunca ciclado. Lo que no cabe va a «Otros», no a un color generado.",
      "Colores por red en analíticas (COLOR_RED): TikTok chart-1, Instagram chart-2, YouTube chart-3, LinkedIn chart-4, X chart-5 y Facebook chart-6.",
      "Amarillo (chart-3) y teal (chart-5) quedan por debajo de 3:1 sobre blanco: las gráficas que los usen llevan etiqueta directa o vista de tabla.",
      "Una sola métrica destacada por vista.",
      "La identidad de una serie nunca depende solo del color: la leyenda nombra cada red con su total y debajo va la misma serie como tabla.",
      "En oscuro, --destructive pasa a danger-400: danger-500 daba 4,0:1 como texto pequeño sobre tarjeta.",
    ],
    noHacer: [
      {
        que: "Generar un color nuevo para una serie de más.",
        porque:
          "Sale de la paleta validada para contraste y daltonismo; lo que no cabe va a «Otros».",
      },
      {
        que: "Asignar los colores por posición y repintar al filtrar.",
        porque:
          "La misma red cambiaría de color entre vistas: el color sigue a la red, nunca a su posición.",
      },
      {
        que: "Texto de estado en success-600 o warning-600 sobre su propio tinte.",
        porque: "Se queda en 3,3:1 (verde) y 2,5:1 (naranja); para eso existe el 700.",
      },
    ],
    tokens: [
      {
        variable: "color-success-500",
        nombre: "success-500",
        uso: "--success en oscuro.",
      },
      {
        variable: "color-success-600",
        nombre: "success-600",
        uso: "--success en claro.",
      },
      {
        variable: "color-success-700",
        nombre: "success-700",
        uso: "Texto pequeño sobre el tinte verde.",
      },
      {
        variable: "color-warning-500",
        nombre: "warning-500",
        uso: "--warning en oscuro.",
      },
      {
        variable: "color-warning-600",
        nombre: "warning-600",
        uso: "--warning en claro.",
      },
      {
        variable: "color-warning-700",
        nombre: "warning-700",
        uso: "Texto pequeño sobre el tinte ámbar.",
      },
      {
        variable: "color-danger-400",
        nombre: "danger-400",
        uso: "Texto de error sobre oscuro.",
      },
      {
        variable: "color-danger-600",
        nombre: "danger-600",
        uso: "--destructive en claro.",
      },
      { variable: "success", nombre: "Éxito", uso: "Estados terminados bien." },
      { variable: "warning", nombre: "Aviso", uso: "Estados que piden atención." },
      {
        variable: "destructive",
        nombre: "Destructivo",
        uso: "Errores y acciones que borran.",
      },
      {
        variable: "destructive-foreground",
        nombre: "Texto sobre destructivo",
        uso: "Blanco en claro, ink-950 en oscuro.",
      },
      { variable: "chart-1", nombre: "Serie 1 · naranja", uso: "TikTok en analíticas." },
      { variable: "chart-2", nombre: "Serie 2 · azul", uso: "Instagram en analíticas." },
      {
        variable: "chart-3",
        nombre: "Serie 3 · amarillo",
        uso: "YouTube; bajo 3:1 sobre blanco: etiqueta directa o tabla.",
      },
      {
        variable: "chart-4",
        nombre: "Serie 4 · violeta",
        uso: "LinkedIn en analíticas.",
      },
      {
        variable: "chart-5",
        nombre: "Serie 5 · teal",
        uso: "X; bajo 3:1 sobre blanco: etiqueta directa o tabla.",
      },
      { variable: "chart-6", nombre: "Serie 6 · rosa", uso: "Facebook en analíticas." },
    ],
    origen: [
      "app/globals.css:72",
      "app/globals.css:75",
      "app/globals.css:269",
      "app/globals.css:319",
      "app/globals.css:340",
      "components/ui/badge.tsx:15",
      "lib/analytics.ts:41",
      "components/app/analytics-growth-chart.tsx:29",
      "messages/es/designSystem.json:142",
      "messages/es/designSystem.json:152",
      "components/design-system/showcase.tsx:616",
    ],
  },

  /* ------------------------------------------------------------------------ */
  {
    id: "tipografia",
    titulo: "Tipografía",
    resumen:
      "Climate Crisis para los titulares de marketing, DM Sans para todo lo demás y Geist Mono para lo técnico. Cifras tabulares en todo lo que cambia mientras se mira.",
    criterio: [
      "Las tres familias se declaran una sola vez, en app/fuentes.ts: next/font emite una hoja de estilos por punto de llamada, y mientras el layout y global-error.tsx las pedían cada uno por su cuenta salían tres hojas, y la del error se precargaba en todas las páginas.",
      "Climate Crisis es la voz de la marca en los titulares de marketing. A tamaño de tarjeta se vuelve ilegible, por eso los títulos de componente van en la sans y --font-heading apunta a DM Sans a propósito.",
      "Geist Mono se carga sin preload: sale en pocas pantallas (los códigos de afiliado del backoffice, el código de acceso de una campaña privada, el detalle técnico de un error, /design-system y esta wiki), y precargada en todas competía por el ancho de banda con la hoja bloqueante sin llegar a usarse.",
      "Los timecodes y contadores usan cifras de ancho fijo: si no, el contador baila durante la reproducción. La escala y los números tabulares se ven en /design-system, sección Tipografía.",
    ],
    reglas: [
      "Titulares de marketing con la utilidad .display: Climate Crisis 400, interletraje −0,02em, interlineado 0,92 y text-wrap: balance, con tamaño fluido (el h1 del hero es text-[clamp(1.9rem,5.6vw,5rem)]).",
      "La display sale en marketing, legal, las páginas de error (404 y error global), el panel de marca del acceso, dentro del logotipo y en los especímenes de /design-system; nunca como título de un componente de producto.",
      "Títulos de componente en font-heading, que es DM Sans. Discrepancia abierta sobre el peso: AGENTS.md (regla 3) pide DM Sans bold para los títulos de componente y /design-system lo repite para los subtítulos de tarjeta, pero los primitivos (CardTitle, DialogTitle, SheetTitle, DrawerTitle, AlertDialogTitle) usan font-medium.",
      'Timecodes con data-slot="timecode" o la clase tabular (font-variant-numeric: tabular-nums).',
      "Respaldo: la display cae en Arial Black y system-ui; DM Sans en ui-sans-serif y system-ui; la mono en ui-monospace y SFMono-Regular. Las tres con display: swap.",
      "El tamaño raíz sube por escalones y en rem: 1,0625rem desde 1536 px de ancho, 1,125rem desde 1920 px y 1,1875rem desde 2560 px. Nunca con vw.",
      "Números, dinero y fechas pasan por useFormat() de hooks/use-format.ts.",
    ],
    noHacer: [
      {
        que: "Usar la display en títulos de tarjeta, diálogos o tablas.",
        porque: "A tamaño de componente es ilegible.",
      },
      {
        que: "Llamar a Climate_Crisis, DM_Sans o Geist_Mono fuera de app/fuentes.ts.",
        porque:
          "Cada llamada emite su propia hoja: vuelve la hoja duplicada que se precargaba en todas las páginas.",
      },
      {
        que: 'Un timecode sin tabular ni data-slot="timecode".',
        porque: "Con cifras proporcionales el contador baila durante la reproducción.",
      },
      {
        que: "Escalar el texto con vw en el elemento raíz.",
        porque:
          "En rem se respeta la preferencia de fuente del navegador y no se rompe el zoom de solo texto (WCAG 1.4.4).",
      },
    ],
    tokens: [
      {
        variable: "font-display",
        nombre: "Climate Crisis",
        uso: "Titulares de marketing (.display) y logotipo.",
      },
      { variable: "font-sans", nombre: "DM Sans", uso: "Todo el texto de la interfaz." },
      {
        variable: "font-heading",
        nombre: "Títulos de componente",
        uso: "Apunta a la sans a propósito.",
      },
      { variable: "font-mono", nombre: "Geist Mono", uso: "Código y datos técnicos." },
    ],
    origen: [
      "app/fuentes.ts:3",
      "app/fuentes.ts:14",
      "app/fuentes.ts:34",
      "app/globals.css:85",
      "app/globals.css:202",
      "app/globals.css:402",
      "app/globals.css:497",
      "app/globals.css:600",
      "AGENTS.md:31",
      "AGENTS.md:34",
      "components/ui/card.tsx:40",
      "components/ui/dialog.tsx:124",
      "components/marketing/hero.tsx:97",
      "app/global-error.tsx:67",
      "messages/es/designSystem.json:53",
      "components/design-system/showcase.tsx:192",
    ],
  },

  /* ------------------------------------------------------------------------ */
  {
    id: "forma-y-espacio",
    titulo: "Forma, sombra y espacio",
    resumen:
      "Un radio base que copia la esquina del isotipo, sombras teñidas de tinta y cuatro contenedores, uno por tipo de superficie.",
    criterio: [
      "El radio base, 0,875rem, es el mismo ratio que las esquinas del isotipo: 3,5 de cada 32. La escala entera se deriva de él (sm 0,45×, md 0,7×, lg 1×, xl 1,4×, 2xl 2×, 3xl 2,6×, 4xl 3,2×); --radius-frame (1,75rem) es el de los marcos grandes de marketing.",
      "Las sombras van teñidas de ink: el negro puro se ve sucio sobre paper. Las de marca (shadow-brand y shadow-brand-sm) son un halo naranja para el botón brand y el botón de reproducir del reproductor.",
      "Cuatro anchos de contenedor, uno por tipo de superficie. Antes había uno solo, de lectura (80rem fijos), y lo usaba también la herramienta: a 2560 px el producto ocupaba la mitad de la pantalla.",
      "Las alturas del chrome (barra superior y timeline) son tokens para cortar los números mágicos repetidos. Radios y sombras en vivo: /design-system, sección «Forma y profundidad».",
    ],
    reglas: [
      "container-page: marketing y legal. Crece con tope, clamp(80rem, 41rem + 48.5vw, 110rem), porque la prosa por encima de ~75 caracteres por línea se lee peor.",
      "container-app: paneles, listas y rejillas del producto, hasta 140rem: son columnas de clips, no prosa.",
      "container-form: formularios de una columna, 64rem.",
      "container-fluid: la superficie de herramienta (el estudio), sin tope y solo con margen de respiro.",
      "Márgenes laterales por token (--gutter-page, --gutter-app, --gutter-tool) que crecen a 40rem, 80rem y 120rem de ancho.",
      "Rejilla de clips con grid-clips (auto-fill, mínimo --clip-min de 16rem): una sola definición para la biblioteca, el panel y el esqueleto de carga.",
      "El destino de un ancla deja sitio a la cabecera fija: scroll-padding-top = --spacing-topbar + 1,5rem.",
    ],
    noHacer: [
      {
        que: "Sombras en negro puro.",
        porque: "Sobre paper se ven sucias; las del sistema están teñidas de ink.",
      },
      {
        que: "Meter la herramienta en container-page.",
        porque:
          "Es el ancho de lectura: con él, a 2560 px la herramienta ocupaba la mitad de la pantalla.",
      },
      {
        que: "Un esqueleto de carga con otras columnas que la rejilla real.",
        porque:
          "Deja de ser la sombra de lo que va a llegar; por eso los dos usan grid-clips.",
      },
    ],
    tokens: [
      {
        variable: "radius",
        nombre: "Radio base",
        uso: "0,875rem: el ratio de la esquina del isotipo.",
      },
      { variable: "radius-sm", nombre: "Radio sm", uso: "0,45 × radio base." },
      { variable: "radius-md", nombre: "Radio md", uso: "0,7 × radio base." },
      { variable: "radius-lg", nombre: "Radio lg", uso: "El radio base (botones)." },
      { variable: "radius-xl", nombre: "Radio xl", uso: "1,4 × radio base." },
      { variable: "radius-2xl", nombre: "Radio 2xl", uso: "2 × radio base." },
      {
        variable: "radius-4xl",
        nombre: "Radio 4xl",
        uso: "3,2 × radio base: la pastilla de las insignias (rounded-4xl).",
      },
      {
        variable: "radius-frame",
        nombre: "Radio de marco",
        uso: "1,75rem: marcos grandes de marketing.",
      },
      { variable: "shadow-xs", nombre: "Sombra xs", uso: "Botón default." },
      { variable: "shadow-sm", nombre: "Sombra sm", uso: "Elevación mínima." },
      { variable: "shadow-md", nombre: "Sombra md", uso: "Elevación media." },
      { variable: "shadow-lg", nombre: "Sombra lg", uso: "Elevación alta." },
      { variable: "shadow-xl", nombre: "Sombra xl", uso: "La elevación máxima." },
      {
        variable: "shadow-brand",
        nombre: "Halo de marca",
        uso: "Hover del botón brand, botón de reproducir.",
      },
      {
        variable: "shadow-brand-sm",
        nombre: "Halo de marca pequeño",
        uso: "Botón brand en reposo.",
      },
      { variable: "spacing-topbar", nombre: "Barra superior", uso: "3,5rem de alto." },
      { variable: "spacing-timeline", nombre: "Timeline", uso: "8,5rem de alto." },
      { variable: "gutter-page", nombre: "Margen de página", uso: "De 1,25rem a 3rem." },
      { variable: "gutter-app", nombre: "Margen de la app", uso: "De 1rem a 2,5rem." },
      {
        variable: "gutter-tool",
        nombre: "Margen de herramienta",
        uso: "De 0,75rem a 1,25rem.",
      },
    ],
    origen: [
      "app/globals.css:90",
      "app/globals.css:110",
      "app/globals.css:125",
      "app/globals.css:206",
      "app/globals.css:370",
      "app/globals.css:549",
      "app/globals.css:566",
      "app/globals.css:610",
      "components/video/video-player.tsx:264",
      "messages/es/designSystem.json:63",
      "components/design-system/showcase.tsx:243",
    ],
  },

  /* ------------------------------------------------------------------------ */
  {
    id: "patrones-y-halo",
    titulo: "Patrones y halo",
    resumen:
      "Isotipos sueltos, líneas, rejilla técnica y un halo de luz: capas decorativas que visten las superficies de marca sin competir con el contenido.",
    criterio: [
      "Los patrones salen del manual (patrón 04) y son capas decorativas: absolutas, sin eventos de puntero y con aria-hidden. Nunca llevan contenido.",
      "Cada patrón tiene su fondo. Los isotipos sueltos son esquinas naranjas y solo se leen sobre oscuro; las líneas horizontales son para bloques naranja llenos; la rejilla técnica, para superficies de editor y fondos de sección.",
      "El halo (BrandGlow) es un degradado radial desde arriba con el 26 % del naranja o del azul: da profundidad detrás de un hero o de una tarjeta destacada.",
      "Todos se pueden fundir en los bordes (fade: top, bottom o edges) para que el patrón no choque contra el corte de la sección. Se ven en /design-system, sección Marca.",
    ],
    reglas: [
      "PatternIsotipos va siempre sobre bg-stage o ink-950, con opacidad 0,18 por defecto (en el producto, entre 0,10 y 0,22); mosaico de 140 px.",
      "PatternLineas solo sobre bloques naranja llenos (la sección final del CTA): líneas de tinta de 2 px cada 12 px, al 40 % de opacidad.",
      "GridBackdrop: rejilla de 56 px con el color de borde, al 60 % y fundida hacia los bordes por defecto.",
      'BrandGlow tone="brand" (naranja) por defecto, detrás del hero y del panel de acceso; tone="primary" (azul) en el monitor de /bienvenida.',
      "skeleton-media es el marcador de un medio sin póster: un brillo que recorre --color-muted (animate-shimmer, 2 s).",
    ],
    noHacer: [
      {
        que: "PatternIsotipos sobre fondo claro.",
        porque: "El naranja al 18 % se convierte en ruido.",
      },
      {
        que: "Poner texto o controles dentro de una capa de patrón.",
        porque: "Son decorativas: pointer-events: none y aria-hidden.",
      },
    ],
    tokens: [
      {
        variable: "color-brand-500",
        nombre: "Esquinas del patrón",
        uso: "El trazo de PatternIsotipos y el halo naranja.",
      },
      {
        variable: "color-blue-500",
        nombre: "Halo azul",
        uso: 'BrandGlow tone="primary".',
      },
      { variable: "border", nombre: "Rejilla", uso: "Las líneas de pattern-grid." },
      { variable: "animate-shimmer", nombre: "Brillo de carga", uso: "skeleton-media." },
    ],
    origen: [
      "components/brand/patterns.tsx:5",
      "components/brand/patterns.tsx:29",
      "components/brand/patterns.tsx:43",
      "components/brand/patterns.tsx:48",
      "components/brand/patterns.tsx:55",
      "app/globals.css:505",
      "app/globals.css:511",
      "app/globals.css:520",
      "app/globals.css:528",
      "components/marketing/hero.tsx:63",
      "components/onboarding/monitor.tsx:38",
      "components/marketing/cta.tsx:22",
    ],
  },

  /* ------------------------------------------------------------------------ */
  {
    id: "marca-de-recorte",
    titulo: "Marca de recorte",
    resumen:
      "Cuatro esquinas naranjas que dicen «este es el momento». Es el gesto de la marca: en el clip seleccionado, en la acción principal y en los hitos.",
    criterio: [
      "Recortar es lo que hace Clipealo, y la marca de recorte (módulo 05 del manual) lo dice sin palabras: envuelve lo seleccionado con cuatro esquinas. Con el cuadrado del isotipo y la acción principal, es donde vive el naranja.",
      "Tiene cuatro formas con el mismo dibujo: CropFrame (esquinas fijas alrededor de un contenido), [data-crop-mark] (una marca efímera sobre cualquier caja, con un pseudo y sin nodos), cropSnap() (el encuadre al pulsar la acción principal) y el confeti de esquinas de toast.celebrate.",
      "Es decorativa: nunca lleva texto ni foco propio. CropFrame pinta sus esquinas con border-brand; [data-crop-mark] y cropSnap() usan --crop-color (app/motion/base.css), que vale brand-500 por defecto y que la sección naranja del CTA cambia a tinta en su contenedor, porque ahí el naranja no se ve (1,34:1).",
      "Los tres tamaños de CropFrame se ven en /design-system, sección Marca.",
    ],
    reglas: [
      "CropFrame size: sm = esquina size-3.5 con borde de 2 px y radio 4, a 1 px del contenido; md = size-6, 3 px y radio 6, a 6 px (por defecto, y el de MediaFrame con cropped); lg = size-10, 4 px y radio 8, a 8 px, para titulares de hero.",
      "inset pega las esquinas al contenido; active={false} las apaga (opacidad) sin desmontar el contenedor.",
      "Cada esquina lleva data-crop-corner (tl, tr, bl, br): el movimiento las cierra desde fuera (.m-crop-corners) o con la Web Animations API sin tocar el componente.",
      "animateIn las hace entrar al montarse con animate-crop-in (450 ms, backwards); con «reducir movimiento», --motion-crop-from vale 1 y entran solo por opacidad, en su sitio.",
      "cropSnap(): esquinas de 2,5 px a 6 px del botón (medido sin su pulsación), con lado de entre 8 y 14 px (el 35 % del alto) y 560 ms: entra, se sostiene y se va. Con «reducir movimiento», solo opacidad.",
      'Solo se dispara en botones con data-effect="crop": los brand por defecto y el botón de tinta del CTA final.',
      "En marketing, con ratón, la acción principal «apunta»: al pasar por encima las esquinas se cierran a media opacidad y al pulsar entra cropSnap() justo donde apuntaban.",
      "En la landing, como mucho un gesto de marca de recorte por sección.",
      "Sobre naranja, en el contenedor: [--crop-color:var(--color-ink-950)], y lo mismo con --ring y --cut-color.",
    ],
    noHacer: [
      {
        que: "Poner texto, un botón o foco dentro de las esquinas.",
        porque: "Es decorativa: las esquinas son aria-hidden y no reciben eventos.",
      },
      {
        que: "Pintar las esquinas de un color distinto para variar.",
        porque:
          "Nada naranja nuevo y nada de colores nuevos: el naranja de las esquinas significa «seleccionado». Solo se pasan a tinta donde el fondo es naranja.",
      },
      {
        que: "Encuadrar botones secundarios.",
        porque:
          "Si todo se encuadra, nada es la acción principal: por defecto el efecto solo sale de la variante brand.",
      },
    ],
    tokens: [
      {
        variable: "brand",
        nombre: "Esquinas de CropFrame",
        uso: "border-brand en las cuatro esquinas.",
      },
      {
        variable: "color-brand-500",
        nombre: "Esquinas efímeras",
        uso: "--crop-color por defecto: [data-crop-mark] y cropSnap().",
      },
      {
        variable: "color-ink-950",
        nombre: "Esquinas sobre naranja",
        uso: "--crop-color en la sección del CTA.",
      },
      {
        variable: "animate-crop-in",
        nombre: "Entrada de las esquinas",
        uso: "450 ms con --ease-brand, backwards.",
      },
      {
        variable: "ease-brand",
        nombre: "Curva de marca",
        uso: "La curva de cropSnap y de crop-in.",
      },
    ],
    origen: [
      "components/brand/logo.tsx:94",
      "components/brand/logo.tsx:110",
      "components/brand/logo.tsx:116",
      "components/brand/logo.tsx:138",
      "app/motion/base.css:68",
      "app/motion/base.css:344",
      "app/motion/base.css:375",
      "app/motion/acciones.css:9",
      "lib/effects.ts:74",
      "lib/effects.ts:91",
      "lib/effects.ts:173",
      "components/marketing/cta.tsx:16",
      "components/video/media-frame.tsx:80",
      "AGENTS.md:53",
      "messages/es/designSystem.json:76",
    ],
  },

  /* ------------------------------------------------------------------------ */
  {
    id: "iconografia",
    titulo: "Iconografía",
    resumen:
      "lucide-react para toda la interfaz, al tamaño que marca el contenedor; el icono acompaña al texto, no lo sustituye.",
    criterio: [
      "Los iconos de la interfaz son de lucide-react (package.json). Los logotipos de redes y de acceso no: están dibujados en components/brand (ver «Logotipos de redes»).",
      "El tamaño lo pone el contenedor, no el icono: el botón da size-4 a cualquier svg sin tamaño propio (size-3 en xs e icon-xs, size-3.5 en sm, size-5 en xl e icon-xl), la insignia size-3 y los avisos size-4.",
      "Un icono acompaña: en los botones va junto a su texto, y el estado se escribe además de dibujarse. Un botón solo icono lleva aria-label traducido.",
    ],
    reglas: [
      'Icono al principio o al final de un botón o insignia: data-icon="inline-start" o "inline-end", y el control recorta su relleno de ese lado.',
      "Los iconos decorativos llevan aria-hidden (el candado de AvisoPlan, la marca de «hecho»).",
      "Botón solo icono: tamaños icon-xs (size-6), icon-sm (size-7), icon (size-8), icon-lg (size-9) e icon-xl (size-12), siempre con aria-label de messages/.",
      "Avisos: CircleCheck para éxito (con animate-pop), Info, TriangleAlert para aviso, OctagonX para error y Loader2 girando para cargando.",
      "En marketing, la flecha de la acción principal avanza al pasar el ratón (.m-nudge).",
      "El estado nunca va solo en el icono: se escribe («Hecho», «Pendiente»).",
    ],
    noHacer: [
      {
        que: "Fijar a mano el tamaño de un icono dentro de un botón sin motivo.",
        porque:
          "El botón ya lo escala con su propio tamaño ([&_svg:not([class*='size-'])]); un tamaño fijo rompe esa proporción.",
      },
      {
        que: "Un botón solo icono sin aria-label.",
        porque:
          "El lector de pantalla no tiene nada que leer; y la etiqueta sale de messages/, nunca escrita a mano.",
      },
    ],
    origen: [
      "package.json:34",
      "components/ui/button.tsx:12",
      "components/ui/button.tsx:40",
      "components/ui/badge.tsx:7",
      "components/ui/sonner.tsx:20",
      "components/planes/aviso-plan.tsx:49",
      "components/admin/catalogo-planes.tsx:283",
      "components/onboarding/misiones.tsx:129",
      "app/motion/acciones.css:87",
      "AGENTS.md:104",
    ],
  },

  /* ------------------------------------------------------------------------ */
  {
    id: "logotipos-de-redes",
    titulo: "Logotipos de redes",
    resumen:
      "SocialGlyph y SocialBadge: cada destino de publicación con su logotipo, en silueta neutra en las listas y a todo color donde se elige un destino.",
    criterio: [
      "Los trazos vienen de simple-icons (MIT) y están incrustados a propósito: seis logotipos no justifican una dependencia en tiempo de ejecución, y así el kit sigue siendo autocontenido. LinkedIn se dibujó aparte porque simple-icons lo retiró a petición de la marca.",
      "Se usan de forma nominativa, para identificar el destino de publicación.",
      "Hay dos decisiones distintas. El tono del glifo: current (silueta que hereda currentColor, el de por defecto) u official (como lo publica cada red en su manual; X y el cuerpo de TikTok heredan el color del contenedor). Y la pastilla SocialBadge: neutro (bg-muted con la silueta) o marca (blanca con el logotipo oficial), que el componente reserva a donde la persona elige o reconoce un destino, para que seis logotipos a todo color no compitan con el naranja de la marca.",
    ],
    reglas: [
      "Un solo punto de entrada: <SocialGlyph network> con el id de lib/social.ts (tiktok, instagram, youtube, x, linkedin, facebook).",
      "SocialBadge en pastilla: sm = size-8 con icono size-4, md = size-11 con size-5, lg = size-14 con size-7.",
      'SocialBadge tone="neutro" (por defecto): bg-muted y la silueta. tone="marca": pastilla blanca con anillo de borde y el logotipo oficial.',
      "La pastilla marca es blanca en claro y en oscuro: los logotipos oficiales están pensados sobre blanco, y X y TikTok heredan el negro.",
      'SocialBadge tone="marca" sale hoy en cuatro sitios, todos de elegir o reconocer un destino: conectar cuentas en Ajustes (/ajustes?seccion=cuentas), las redes de la página de precios, la sección de redes de la landing y los testimonios del panel de acceso. La pastilla neutra no la usa ahora ningún componente.',
      "El glifo suelto va en official junto a la red de una publicación, una cuenta o una campaña (analíticas, campañas, publicar, derechos, onboarding y los botones «Continuar con…»), y en current en la agenda (filtros, rejilla, compositor y ficha).",
      "Cuando el nombre de la red o de la cuenta va escrito al lado, el glifo lleva aria-hidden: el texto ya la nombra y el logo no lo repite.",
      "Twitch y Kick son plataformas de directo (de dónde viene el video), no destinos; Google y Apple son proveedores de acceso para los botones «Continuar con…» de /login.",
    ],
    noHacer: [
      {
        que: 'La pastilla blanca (SocialBadge tone="marca") repetida en un listado denso.',
        porque:
          "Está reservada a elegir o reconocer un destino: en cada fila, seis logotipos a todo color compiten con el naranja de la marca.",
      },
      {
        que: "Traer los logotipos de una librería de iconos externa.",
        porque: "Están incrustados a propósito para que el kit sea autocontenido.",
      },
      {
        que: "Usar el logotipo de una red fuera de su función de identificar un destino.",
        porque: "El uso es nominativo: identifica dónde se publica.",
      },
    ],
    tokens: [
      {
        variable: "muted",
        nombre: "Pastilla neutra",
        uso: 'Fondo de SocialBadge tone="neutro".',
      },
      {
        variable: "border",
        nombre: "Anillo de la pastilla",
        uso: 'ring-1 de SocialBadge tone="marca".',
      },
    ],
    origen: [
      "components/brand/social-icons.tsx:5",
      "components/brand/social-icons.tsx:24",
      "components/brand/social-icons.tsx:172",
      "components/brand/social-icons.tsx:220",
      "components/brand/social.tsx:28",
      "components/brand/social.tsx:34",
      "components/brand/social.tsx:43",
      "components/brand/social.tsx:67",
      "components/app/social-accounts.tsx:151",
      "components/marketing/pricing-networks.tsx:38",
      "components/marketing/redes.tsx:204",
      "components/auth/auth-brand-panel.tsx:88",
      "components/app/analytics-publications-table.tsx:72",
      "components/agenda/detalle-sheet.tsx:263",
      "lib/social.ts:12",
    ],
  },

  /* ------------------------------------------------------------------------ */
  {
    id: "botones",
    titulo: "Botones e insignias",
    resumen:
      "Ocho variantes de botón con un reparto claro: una acción naranja por vista, el azul para la estructura y los planos para el resto. Foco naranja y pulsación comunes a todos.",
    criterio: [
      "Button es el primitivo de shadcn extendido con variantes propias (brand y brand-subtle), nunca reescrito: components/ui/** lo genera la CLI y se regenera.",
      'La variante decide también la respuesta: brand suena («pop») y se encuadra con la marca de recorte por defecto; las demás, en silencio. sound y effect lo cambian en un botón concreto, y "none" lo quita. Los ejecuta un listener delegado, así el botón sigue pudiendo renderizarse en el servidor.',
      'Foco y pulsación cuelgan de [data-button], no de [data-slot="button"]: un Trigger con asChild (menú, tooltip, sheet, diálogo, sidebar) pisa el data-slot, y esos botones se quedaban con el halo viejo y sin pulsación.',
      "Deshabilitado: los rellenos (default, brand, brand-subtle, secondary, destructive) pasan a muted en vez de bajar la opacidad del botón, que dejaba el texto en 2:1; los planos (outline, ghost, link) sí se atenúan al 50 %, porque ahí el texto aguanta.",
      "Todas las variantes, con icono y deshabilitadas, están en /design-system, sección Controles.",
    ],
    reglas: [
      "brand: naranja con texto ink-950 y shadow-brand-sm (shadow-brand al pasar). La acción principal de la vista: como máximo un brand visible a la vez.",
      "default: fondo primary con primary-foreground (blanco en claro, ink-950 en oscuro) y shadow-xs; hover en primary-hover.",
      "brand-subtle: tinte brand-subtle con texto brand-subtle-foreground.",
      "outline: borde y fondo de página; hover con --surface-hover y pulsado con --surface-active (en oscuro, borde y fondo salen de --input).",
      "secondary: fondo --secondary (mist en claro) con --secondary-foreground; al pasar mezcla un 5 % del color de texto.",
      "ghost: sin fondo hasta el hover (--surface-hover).",
      "destructive: tinte rojo (bg-destructive/10) con texto destructive; no es un relleno rojo.",
      "link: texto primary, subrayado al pasar.",
      "Tamaños: xs (h-6), sm (h-7), default (h-8), lg (h-9) y xl (h-12, la escala de marketing, con objetivo táctil cómodo y texto a 16 px); cuadrados de icon-xs a icon-xl.",
      "Pulsación asimétrica: entra en 90 ms (--duration-press) y vuelve en 220 ms (--duration-base) con --ease-out-quint; baja 1 px y escala a 0,97 (0,92 en xs, icon-xs e icon-sm; 0,98 en xl e icon-xl; 1 dentro de un grupo de botones). Los que abren un menú (aria-haspopup) no se hunden.",
      "Foco: contorno sólido de 2 px con --ring, separado 2 px, en todas las variantes.",
      "Sobre una superficie naranja: [--ring:var(--color-ink-950)] en el contenedor, o el foco no se ve.",
      "Un botón apagado dice por qué: el motivo escrito debajo y atado con aria-describedby (AvisoPlan).",
      "Insignias (Badge): default, brand, brand-subtle, success, warning, secondary, destructive, outline, ghost y link; h-5, pastilla rounded-4xl, texto xs y el icono a size-3.",
    ],
    noHacer: [
      {
        que: "Dos botones brand visibles en la misma vista.",
        porque: "Deja de significar «esto es lo que hay que pulsar».",
      },
      {
        que: "Deshabilitar un botón relleno bajando su opacidad.",
        porque: "El texto se queda en 2:1 y casi no se lee; se pasa a muted.",
      },
      {
        que: 'Colgar estilos de foco o pulsación de [data-slot="button"].',
        porque:
          "Cualquier Trigger con asChild pisa el data-slot: los botones de menú, tooltip o diálogo se quedaban sin foco naranja ni pulsación.",
      },
      {
        que: "Reescribir components/ui/button.tsx.",
        porque: "Lo genera la CLI de shadcn: se extiende con variantes, no se reescribe.",
      },
    ],
    tokens: [
      { variable: "brand", nombre: "Botón brand", uso: "Fondo de la acción principal." },
      { variable: "brand-foreground", nombre: "Texto del brand", uso: "ink-950." },
      { variable: "brand-hover", nombre: "Brand al pasar", uso: "brand-400." },
      { variable: "primary", nombre: "Botón default", uso: "Fondo azul." },
      {
        variable: "primary-hover",
        nombre: "Default al pasar",
        uso: "blue-700 en claro, blue-300 en oscuro.",
      },
      { variable: "secondary", nombre: "Botón secondary", uso: "Fondo mist en claro." },
      { variable: "surface-hover", nombre: "Hover de planos", uso: "outline y ghost." },
      {
        variable: "surface-active",
        nombre: "Pulsado de planos",
        uso: "outline y ghost.",
      },
      {
        variable: "destructive",
        nombre: "Botón destructive",
        uso: "Texto y tinte al 10 %.",
      },
      { variable: "ring", nombre: "Foco", uso: "Contorno de 2 px." },
      { variable: "duration-press", nombre: "Ataque de la pulsación", uso: "90 ms." },
      { variable: "duration-base", nombre: "Vuelta de la pulsación", uso: "220 ms." },
      {
        variable: "ease-out-quint",
        nombre: "Curva de vuelta",
        uso: "Frena al final: «se desliza bien».",
      },
    ],
    origen: [
      "components/ui/button.tsx:8",
      "components/ui/button.tsx:18",
      "components/ui/button.tsx:37",
      "components/ui/button.tsx:61",
      "app/globals.css:432",
      "app/globals.css:451",
      "app/globals.css:472",
      "components/ui/badge.tsx:9",
      "components/planes/aviso-plan.tsx:9",
      "AGENTS.md:142",
      "AGENTS.md:153",
      "components/design-system/showcase.tsx:348",
    ],
  },

  /* ------------------------------------------------------------------------ */
  {
    id: "movimiento",
    titulo: "Movimiento",
    resumen:
      "La landing cuenta «de video largo a clip» con movimiento breve y con red: cuatro disparadores, una familia de curvas y todo terminado en su estado natural.",
    criterio: [
      "El movimiento cuenta una sola historia, de video largo a clip, y es breve: la carga del hero termina en 2 s y cada gesto al entrar en pantalla dura menos de 1,5 s. Y con red: sin JS, sin IntersectionObserver, al imprimir o con html[data-capture], todo se ve terminado.",
      "Una sola familia de curvas: --ease-brand para casi todo, --ease-out-quint para la vuelta de la pulsación y --ease-spring, un rebote corto, para lo que «encaja» (el pulgar de un interruptor, el icono de éxito).",
      "Escala de ritmo: 90 ms la pulsación, 140 ms el color, 220 ms transform y sombra, 320 ms el layout. Toda utilidad transition-* usa por defecto 140 ms con --ease-brand, con un valor literal de respaldo: un token borrado dejaría la duración en 0 s. Las entradas de la landing tienen su propio ritmo en app/motion/base.css: --duration-enter 520 ms, --duration-crop 450 ms y --stagger 80 ms entre los elementos de un grupo.",
      "Una sección de la landing en pequeño, con su botón «Repetir», está en /design-system, sección Accesibilidad › Movimiento.",
    ],
    reglas: [
      "Cuatro disparadores y ninguno más: al cargar (solo la primera pantalla, solo CSS, una vez, terminado en 2 s); al entrar en pantalla (grupos data-motion-group de lib/motion.ts, una vez por visita); ligado al scroll (solo el reencuadre, con useScrollProgress); ligado al gesto (hover, foco, clic, cambio de red o de ciclo).",
      "Nunca se anima el h1 ni la descripción del hero (candidatos a LCP): ni opacidad, ni máscara, ni partirlos.",
      "En bucle, solo el carrusel de la comunidad (animate-marquee, 40 s, en pausa mientras no se ve); cualquier otra animación termina sola en menos de 5 s. Los anillos del botón de reproducir del hero laten dos veces (pulse-ring, 1400 ms) y se paran.",
      "Solo se animan opacity, translate, scale, color, la luz de fondo y clip-path; nunca estado de React por fotograma ni librerías de animación. Las transiciones nombran translate y scale, no transform.",
      'Las animaciones usan backwards, nunca forwards; lo oculto solo existe en [data-motion-state="idle"] o detrás de .js.',
      "El estado del movimiento va en atributos (data-motion-state: static, idle, play), nunca en clases que React pueda reescribir. Lo que ya se veía al hidratar queda «static» y no se oculta para animarlo.",
      "El foco del teclado nunca espera: el grupo que lo recibe se ve terminado al instante.",
      "Luces y pre-encuadres de puntero solo con (hover: hover) and (pointer: fine).",
      "Nada naranja nuevo: cabezales, cuchillas y luces van en primary, tinta o blanco. Los titulares se cortan a 12 fps (.m-cut: 9 fotogramas en 720 ms con una cuchilla de 3 px).",
      "El CSS de movimiento vive en app/motion/*.css, un archivo por sección. Los @keyframes van ahí (los compartidos, en base.css), nunca dentro de @theme, y un test comprueba que cada animation-name existe.",
      "Ningún antepasado de la cabecera fija ni del bloque sticky del reencuadre lleva transform, filter, contain ni will-change.",
    ],
    noHacer: [
      {
        que: "Animaciones con forwards o contenido oculto por defecto.",
        porque:
          "Sin JS, sin observador o al imprimir se quedaría invisible: el estado natural es el estado final.",
      },
      {
        que: "Declarar @keyframes dentro de @theme.",
        porque:
          "Tailwind descarta los que ninguna clase animate-* usa: así fade-soft y pulse-soft no llegaban a producción.",
      },
      {
        que: "Animar el h1 o la descripción del hero.",
        porque: "Son candidatos a LCP.",
      },
      {
        que: "Usar animation-timeline o scroll-snap.",
        porque: "Lo único ligado al scroll es el reencuadre, y va con useScrollProgress.",
      },
    ],
    tokens: [
      {
        variable: "ease-brand",
        nombre: "Curva de marca",
        uso: "cubic-bezier(0.22, 1, 0.36, 1).",
      },
      {
        variable: "ease-out-quint",
        nombre: "Salida quint",
        uso: "cubic-bezier(0.23, 1, 0.32, 1).",
      },
      {
        variable: "ease-spring",
        nombre: "Rebote corto",
        uso: "cubic-bezier(0.34, 1.56, 0.64, 1).",
      },
      { variable: "duration-press", nombre: "Pulsación", uso: "90 ms." },
      { variable: "duration-fast", nombre: "Color", uso: "140 ms." },
      { variable: "duration-base", nombre: "Transform y sombra", uso: "220 ms." },
      { variable: "duration-slow", nombre: "Layout", uso: "320 ms." },
      {
        variable: "default-transition-duration",
        nombre: "Transición por defecto",
        uso: "--duration-fast con respaldo de 140 ms.",
      },
      {
        variable: "animate-pop",
        nombre: "Icono de éxito",
        uso: "0,42 s con --ease-spring, backwards.",
      },
      {
        variable: "animate-crop-in",
        nombre: "Entrada de esquinas",
        uso: "0,45 s con --ease-brand, backwards.",
      },
      {
        variable: "animate-marquee",
        nombre: "Carrusel",
        uso: "40 s en bucle: el único bucle de la landing.",
      },
    ],
    origen: [
      "AGENTS.md:36",
      "AGENTS.md:90",
      "app/globals.css:94",
      "app/globals.css:100",
      "app/globals.css:129",
      "app/motion/base.css:1",
      "app/motion/base.css:238",
      "app/motion/base.css:63",
      "app/motion/base.css:168",
      "app/motion/base.css:289",
      "app/motion/hero.css:253",
      "components/shared/marquee.tsx:166",
      "lib/motion.ts:7",
      "messages/es/designSystem.json:176",
      "components/design-system/showcase.tsx:647",
    ],
  },

  /* ------------------------------------------------------------------------ */
  {
    id: "reducir-movimiento",
    titulo: "Reducir movimiento",
    resumen:
      "Reducir, no quitar: en modo reducido nada se desplaza ni crece, pero todo sigue respondiendo en su sitio.",
    criterio: [
      "Antes una regla global cortaba todas las animaciones y transiciones a 0,01 ms, y con ella la respuesta a cualquier pulsación: en Windows con los efectos de animación apagados (un ajuste muy común) el producto parecía muerto.",
      "El movimiento completo es el de por defecto para todo el mundo (decisión del director, 15 sep 2026). Manda la preferencia guardada del usuario (Ajustes › Perfil › Movimiento, en /ajustes?seccion=perfil; clave clipealo-movimiento en localStorage), que el script de arranque deja en <html data-motion> antes del primer pintado; la del sistema solo decide sin JS.",
      "Una sola animación para los dos modos: las distancias y escalas iniciales viven en variables --motion-* de app/motion/base.css (--motion-distance 1,25rem, --motion-crop-from 1,35, --motion-crop-gap 0,75rem, --motion-pop-from 0,5, --motion-ring-to 1,6, --motion-aim-from 1,12), que valen 0 o 1 en modo reducido.",
    ],
    reglas: [
      "Sustituciones: desplazar → fundido; escalar → opacidad o anillo; barrido o cuchilla → destello o fundido; geometría ligada al scroll → cortes de montaje con fundido; cambio de tamaño animado → cambio instantáneo con fundido del contenido.",
      "Se quedan igual: la pulsación de 1 px, el color, la luz, los avisos, los indicadores (barras de progreso, cabezal en su sitio) y el texto que se escribe palabra a palabra.",
      "Las reglas propias del modo se escriben con @variant reduced; el JS pregunta a prefiereMenosMovimiento().",
      "Menús, diálogos, tooltips y paneles laterales entran y salen en fundido; el acordeón no anima la altura.",
      "Los efectos de lib/effects.ts no desaparecen: cropSnap queda en opacidad, la celebración pasa a un halo y la sacudida de error a un anillo rojo en su sitio.",
      "El titular cortado funde a cortes (cuatro escalones de opacidad en 720 ms), sin cuchilla.",
      "?movimiento=completo|reducido|sistema fuerza un modo durante la sesión para revisar.",
      "Lo que lee la persona en Ajustes: «En «Reducido» todo se ve igual, pero nada se desplaza ni crece.»",
    ],
    noHacer: [
      {
        que: "Una regla global que corte las transiciones a 0 ms.",
        porque: "Quita también la respuesta a los gestos y el producto parece muerto.",
      },
      {
        que: "Overrides por nombre de clase de Tailwind para el modo reducido.",
        porque:
          "Una sola animación sirve a los dos modos a través de las variables --motion-*.",
      },
      {
        que: "Quitar un efecto con «reducir» en vez de sustituirlo.",
        porque: "Reducir no es quitar la respuesta.",
      },
    ],
    origen: [
      "AGENTS.md:61",
      "app/globals.css:668",
      "app/motion/base.css:18",
      "app/motion/base.css:54",
      "app/motion/base.css:326",
      "app/motion/base.css:433",
      "lib/preferencia-movimiento.ts:13",
      "lib/preferencia-movimiento.ts:23",
      "components/app/profile-settings.tsx:392",
      "lib/effects.ts:8",
      "messages/es/settings.json:56",
    ],
  },

  /* ------------------------------------------------------------------------ */
  {
    id: "sonido-y-respuesta",
    titulo: "Sonido y respuesta",
    resumen:
      "Nueve sonidos sintetizados, avisos que suenan según lo que significan y efectos de marca reservados a lo que lo merece.",
    criterio: [
      "Sonido y efecto solo cuando lo merece. Si todo sonara, nada significaría nada: toast.warning no suena porque «un aviso no es un fallo» y así «error» sigue significando algo, y el toast() neutro informa, no premia.",
      "Los sonidos se sintetizan con Web Audio en el momento: sin archivos, sin peticiones y sin nada que cargar antes de la primera pulsación. Dos o tres osciladores con una envolvente corta, en el registro agudo y a poco volumen (volumen general 0,7), para que acompañen sin cansar.",
      'La preferencia es del dispositivo, no de la cuenta: vive en localStorage (clipealo-sonidos), encendida por defecto; solo "off" la apaga. Se cambia en Ajustes › Notificaciones › Preferencias de la interfaz (/ajustes?seccion=notificaciones), con un botón «Probar».',
      "Los botones declaran lo que merecen con atributos (data-sound, data-effect) y un único listener delegado, InteractionFeedback, los ejecuta.",
    ],
    reglas: [
      "Los nueve sonidos: pop (la acción principal, botón brand), tap (elegir una opción de un grupo), snip (confirmar un recorte), toggle-on y toggle-off (interruptores), success (una tarea terminada bien), celebrate (un hito: publicar, terminar una subida, conectar una red), error (algo no se pudo hacer) y remove (borrar).",
      "Los avisos van con toast de @/lib/toast, nunca de sonner: success suena «success»; error suena «error» y sacude el aviso; celebrate suena un arpegio y lanza confeti de esquinas de recorte desde el icono; toast(), info y warning no suenan.",
      'sound en las opciones cambia el sonido de un aviso («remove» al borrar, «snip» al recortar) o lo quita con false. Un borrado va con toast.error y sound: "remove": la sacudida solo acompaña al sonido de error.',
      "celebrate se usa hoy al terminar una subida, publicar (desde el diálogo o desde la agenda), conectar una red, publicar una campaña, desbloquear una campaña privada con su código, terminar una ruta de formación y cerrar el onboarding.",
      'Los interruptores (role="switch") suenan solos al encenderse y al apagarse, y las opciones de un grupo (role="radio") hacen «tap» al elegir una nueva; un control deshabilitado no suena.',
      "Los avisos salen abajo a la derecha, con botón de cerrar y sin richColors, sobre --popover con --border y el radio base; siguen el tema activo.",
      "Un sonido de resultado espera 0,11 s a que termine el de la pulsación («pop» y luego «ding», no los dos a la vez). El mismo sonido no se repite antes de 60 ms (pulsación) o 250 ms (resultado), y si el audio tarda más de 150 ms en despertar ya no suena.",
      "Nada de sonido en navegación, hover, filtros ni acciones del backoffice que no sean la principal; nunca suenan la luz, los pre-encuadres, la entrada de secciones ni el scroll.",
      "En la landing suena también el botón de tinta del CTA final («pop») y se encuadra en tinta: es la acción principal de su vista y sobre naranja no puede ser brand.",
      "playSound nunca lanza: sin Web Audio o con el audio bloqueado, la interfaz sigue igual, en silencio, y la acción ya tiene su respuesta visual.",
    ],
    noHacer: [
      {
        que: "Importar toast de sonner.",
        porque: "Se pierden el sonido y el efecto de cada variante.",
      },
      {
        que: "Usar celebrate para cualquier éxito.",
        porque:
          "Está reservado a los hitos (publicar, terminar una subida, conectar una red); el resto de resultados va con success.",
      },
      {
        que: "Poner sonido a la navegación, al hover o a los filtros.",
        porque:
          "El sonido se reserva a la acción principal, los interruptores, los hitos y los errores.",
      },
      {
        que: "Comunicar un resultado solo con sonido.",
        porque:
          "Se puede apagar en Ajustes y puede no haber audio: el aviso escrito siempre está.",
      },
    ],
    tokens: [
      {
        variable: "color-brand-500",
        nombre: "Confeti y encuadre",
        uso: "cropSnap y las piezas de burst.",
      },
      { variable: "color-blue-500", nombre: "Confeti azul", uso: "Piezas de burst." },
      {
        variable: "color-brand-300",
        nombre: "Confeti naranja claro",
        uso: "Piezas de burst.",
      },
      {
        variable: "color-blue-300",
        nombre: "Confeti azul claro",
        uso: "Piezas de burst.",
      },
      {
        variable: "destructive",
        nombre: "Anillo de error",
        uso: "La sacudida en modo reducido.",
      },
      {
        variable: "popover",
        nombre: "Superficie del aviso",
        uso: "Fondo de los toasts (--normal-bg de sonner).",
      },
    ],
    origen: [
      "lib/sound.ts:1",
      "lib/sound.ts:24",
      "lib/sound.ts:54",
      "lib/sound.ts:92",
      "lib/sound.ts:224",
      "lib/sound.ts:252",
      "lib/toast.ts:6",
      "lib/toast.ts:75",
      "lib/toast.ts:80",
      "lib/effects.ts:176",
      "lib/effects.ts:285",
      "components/shared/interaction-feedback.tsx:10",
      "components/providers.tsx:65",
      "components/ui/sonner.tsx:27",
      "components/app/upload-panel.tsx:175",
      "components/app/publicar-dialog.tsx:204",
      "components/agenda/detalle-sheet.tsx:231",
      "components/app/social-accounts.tsx:100",
      "components/campanas/campaign-form.tsx:198",
      "components/campanas/access-code-dialog.tsx:81",
      "components/formacion/formacion-panel.tsx:129",
      "components/onboarding/onboarding-flow.tsx:398",
      "components/app/clips-library.tsx:159",
      "AGENTS.md:79",
      "messages/es/settings.json:312",
    ],
  },

  /* ------------------------------------------------------------------------ */
  {
    id: "voz-y-escritura",
    titulo: "Voz y escritura",
    resumen:
      "Tuteo y frases cortas. El estado siempre escrito, los controles apagados dicen por qué y los errores dicen qué pasó y qué hacer.",
    criterio: [
      "La interfaz habla de tú, en frases cortas y concretas: «Sube el video completo.», «Escribe tu correo.», «Elige al menos un clip.».",
      "Un error dice qué pasó y cómo arreglarlo, sin culpar: «No hay conexión. Comprueba tu red y vuelve a intentarlo.», «Ese correo no parece válido: revisa que tenga @ y dominio.», «Alguien lo cambió antes que tú. Vuelve a cargar y mira cómo quedó.». Cuando el fallo es nuestro, se dice: «Se ha roto por nuestro lado. Ya lo estamos mirando.».",
      "Cuando algo falla, tranquiliza: «No hemos podido cargar esta parte. Puedes reintentarlo: no se ha perdido nada de tu trabajo.».",
      "Todo texto visible sale de messages/{es,en,pt}: el español define las claves, los datos de lib/ guardan ids y las validaciones devuelven códigos, no frases; el componente traduce.",
    ],
    reglas: [
      "Tuteo siempre.",
      "El estado se escribe, nunca solo en color ni solo en icono: «Hecho» y «Pendiente» en las misiones, la urgencia escrita en los compromisos, el medidor de contraseña con su palabra y los booleanos de la tabla de precios con texto oculto.",
      "Todo control deshabilitado explica por qué, escrito debajo y atado con aria-describedby: «Cambia el día o la hora para poder moverla.», «Descargar y duplicar necesitan el archivo renderizado, que todavía no se genera.», y los de plan con AvisoPlan y su enlace a /precios.",
      "Los errores de formulario dicen qué hacer: «Elige un día y una hora que no hayan pasado.», «Elige al menos una cuenta conectada donde publicar.». Lo que bloquea se titula como tal: «Esto hay que arreglarlo antes de programar».",
      "Hasta el error genérico da una salida: «Algo ha fallado. Vuelve a intentarlo.».",
      "Botones con verbo: «Subir un video», «Reintentar desde donde se quedó». Puntos suspensivos cuando abren un paso más («Publicar…», «Programar…») y en lo que está en curso («Entrando…», «Creando la cuenta…»).",
      "En español, «comillas angulares», coma decimal y espacio antes del % (12,4 %); en inglés, “comillas” y 12.4%; en portugués de Brasil, “aspas” y 12,4%.",
      "Plurales con ICU ({n, plural, one {# clip} other {# clips}}); números, dinero y fechas con useFormat().",
      "Etiquetas accesibles (aria-label, title, placeholder, alt), metadatos y avisos de toast también salen de messages/.",
      "El contenido de demo que en producción escribiría un usuario (títulos de clips y campañas, nombres de creadores y marcas) no se traduce.",
    ],
    noHacer: [
      {
        que: "Escribir texto visible a mano en un componente.",
        porque:
          "No se traduce: el español define las claves y messages.test.ts exige las mismas claves, variables y etiquetas ICU en los tres idiomas.",
      },
      {
        que: "Deshabilitar un control sin decir por qué.",
        porque:
          "Un disabled sale del orden de tabulación: sin el motivo escrito y atado con aria-describedby, con el teclado no se alcanza nunca.",
      },
      {
        que: "Indicar un estado solo con color o solo con un icono.",
        porque:
          "El estado va escrito para que lo lea también quien no distingue el color y el lector de pantalla.",
      },
      {
        que: "Devolver frases desde lib/ o desde una validación.",
        porque:
          "Los datos guardan ids y las validaciones devuelven códigos: el componente traduce.",
      },
    ],
    origen: [
      "AGENTS.md:14",
      "AGENTS.md:104",
      "AGENTS.md:121",
      "AGENTS.md:123",
      "AGENTS.md:137",
      "messages/es/common.json:4",
      "messages/es/common.json:25",
      "messages/es/common.json:110",
      "messages/es/common.json:120",
      "messages/es/common.json:232",
      "messages/es/auth.json:86",
      "messages/es/auth.json:105",
      "messages/es/calendario.json:106",
      "messages/es/calendario.json:139",
      "components/planes/aviso-plan.tsx:9",
      "components/campanas/solicitar-dialog.tsx:317",
      "components/onboarding/misiones.tsx:31",
      "components/campanas/mis-compromisos.tsx:201",
      "components/marketing/pricing-table.tsx:28",
      "components/auth/login-panel.tsx:478",
    ],
  },

  /* ------------------------------------------------------------------------ */
  {
    id: "accesibilidad",
    titulo: "Accesibilidad",
    resumen:
      "Contrastes medidos, no estimados; un solo foco naranja; el editor entero con teclado; nada depende solo del color.",
    criterio: [
      "Los contrastes (WCAG 2.2) están medidos y anotados junto a cada par crítico en globals.css. Cuando un par no llega, se cambia el token y se deja escrito por qué: muted-foreground no baja de ink-600, success-700 existe para el texto sobre su tinte y en oscuro primary sube a blue-400.",
      "Un solo tratamiento de foco en todo el producto, siempre naranja: 2 px de grosor y 2 px de separación. En la capa base para cualquier control, y sin capa para los botones del sistema, que así ganan al outline-none del primitivo.",
      "La tabla de pares medidos y las pestañas Teclado, Movimiento y Lectores están en /design-system, sección Accesibilidad.",
    ],
    reglas: [
      "En claro: foreground sobre background 15,8:1 (AAA); blanco sobre primary 5,9:1 (AA); muted-foreground 5,5:1 (AA); brand-foreground sobre brand 6,1:1 (AA); foco brand-600 sobre paper 4,0:1 (cumple 1.4.11).",
      "En oscuro: mist sobre ink 15,5:1 (AAA); primary blue-400 da 5,6:1 como texto y 5,8:1 como botón con tinta encima; muted-foreground 7,7:1 (AAA) sobre tarjeta.",
      "El motivo de un control apagado va a 14 px (text-sm), no a 12: a 12 px el gris no llega a 4,5:1.",
      'Controles deshabilitados con aria-describedby al motivo; avisos que aparecen al vuelo con role="status"; el progreso del proceso con aria-live="polite".',
      "Los sliders propios exponen rol, mínimo, máximo y aria-valuetext en timecode. El reproductor, la línea de tiempo y el recorte se manejan sin ratón.",
      "Las gráficas llevan vista de tabla y leyenda con nombre; nada depende solo del color.",
      "Enlace «Saltar al contenido» al principio de cada página (en el layout de idioma), oculto hasta que recibe el foco.",
      "Las regiones que reciben foco sin ser controles (la gráfica, el panel de pestañas) también lo muestran.",
      "Lo decorativo (patrones, esquinas de recorte, la capa de efectos) lleva aria-hidden.",
      "El tamaño raíz sube en rem, nunca en vw: se respeta la fuente del navegador y el zoom de solo texto (1.4.4).",
    ],
    noHacer: [
      {
        que: "Quitar el contorno de foco a un control.",
        porque:
          "Los primitivos traen outline-none: sin la regla de [data-button], el foco sobre un botón azul no se veía.",
      },
      {
        que: "Bajar --muted-foreground a ink-500.",
        porque: "Deja de llegar a AA (ink-600 da 5,5:1).",
      },
      {
        que: "Poner el motivo de un botón apagado en text-xs.",
        porque: "A 12 px el gris no llega a 4,5:1.",
      },
    ],
    tokens: [
      {
        variable: "ring",
        nombre: "Foco",
        uso: "brand-600 en claro, brand-400 en oscuro.",
      },
      {
        variable: "foreground",
        nombre: "Texto",
        uso: "15,8:1 en claro, 15,5:1 en oscuro.",
      },
      {
        variable: "muted-foreground",
        nombre: "Texto apagado",
        uso: "5,5:1 en claro, 7,7:1 en oscuro.",
      },
      { variable: "brand-foreground", nombre: "Texto sobre naranja", uso: "6,1:1." },
    ],
    origen: [
      "app/globals.css:215",
      "app/globals.css:239",
      "app/globals.css:255",
      "app/globals.css:259",
      "app/globals.css:294",
      "app/globals.css:301",
      "app/globals.css:312",
      "app/globals.css:382",
      "app/globals.css:432",
      "app/globals.css:484",
      "components/planes/aviso-plan.tsx:15",
      "components/video/trim-range.tsx:163",
      "messages/es/designSystem.json:171",
      "messages/es/designSystem.json:194",
      "messages/es/common.json:8",
      "app/[locale]/layout.tsx:91",
      "components/design-system/showcase.tsx:647",
    ],
  },

  /* ------------------------------------------------------------------------ */
  {
    id: "temas",
    titulo: "Temas claro y oscuro",
    resumen:
      "Claro es el tema del producto; oscuro es una elección explícita. Los dos salen del mismo bloque semántico, y el escenario del video es oscuro en ambos.",
    criterio: [
      'Claro es el tema por defecto (defaultTheme="light", color-scheme: light). El oscuro existe, pero es una elección explícita del usuario, no algo que se herede del sistema operativo; la opción «Sistema» sigue en el selector.',
      "El oscuro no es un volteo: se reasignan los semánticos en .dark y cada par se vuelve a medir. El azul sube dos peldaños (blue-600 → blue-400) porque como texto blue-600 daba 2,8:1 sobre la tarjeta; el rojo pasa a danger-400, y la paleta de gráficas se re-escalona contra la tarjeta #121f38.",
      "Hay superficies oscuras pase lo que pase: el escenario del video (--stage), el hero, el pie, la 404 y el monitor de /bienvenida. Ahí, y solo ahí, se usan primitivas.",
    ],
    reglas: [
      'next-themes con attribute="class", storageKey clipealo-theme y disableTransitionOnChange: cambiar de tema no anima nada.',
      "La variante dark de Tailwind es &:is(.dark *).",
      "En oscuro, secondary, muted, accent, bordes e inputs son alfas de blanco (8 %, 6 %, 8 %, 10 % y 18 %).",
      "La pastilla marca de SocialBadge es blanca en los dos temas; los avisos siguen el tema activo.",
      "La barra de desplazamiento es fina: ink-300 en claro, ink-700 en oscuro.",
      "Los tests e2e tienen un proyecto «oscuro» que siembra localStorage, porque el tema ya no se hereda del sistema.",
    ],
    noHacer: [
      {
        que: "Seguir el tema del sistema por defecto.",
        porque: "Claro es el tema del producto; el oscuro es una elección explícita.",
      },
      {
        que: "Escribir colores condicionales por tema dentro de un componente.",
        porque:
          "Cambiar un tema es reasignar el bloque semántico, nunca tocar los componentes.",
      },
      {
        que: "Pasar el escenario del video a claro.",
        porque: "El video manda el punto blanco: el editor es oscuro en ambos temas.",
      },
    ],
    tokens: [
      {
        variable: "background",
        nombre: "Fondo",
        uso: "ink-50 en claro, ink-950 en oscuro.",
      },
      {
        variable: "foreground",
        nombre: "Texto",
        uso: "ink-900 en claro, mist en oscuro.",
      },
      { variable: "card", nombre: "Tarjeta", uso: "Blanco en claro, ink-900 en oscuro." },
      {
        variable: "primary",
        nombre: "Primario",
        uso: "blue-600 en claro, blue-400 en oscuro.",
      },
      { variable: "stage", nombre: "Escenario", uso: "Oscuro en los dos temas." },
      { variable: "stage-muted", nombre: "Texto apagado del escenario", uso: "ink-400." },
      { variable: "stage-border", nombre: "Borde del escenario", uso: "Blanco al 10 %." },
      {
        variable: "sidebar",
        nombre: "Barra lateral",
        uso: "Blanco en claro, ink-900 en oscuro.",
      },
      {
        variable: "sidebar-foreground",
        nombre: "Texto de la barra lateral",
        uso: "ink-800 en claro, mist en oscuro.",
      },
      {
        variable: "sidebar-primary",
        nombre: "Primario de la barra lateral",
        uso: "blue-600 en claro, blue-500 en oscuro.",
      },
      {
        variable: "sidebar-accent",
        nombre: "Elemento activo de la barra lateral",
        uso: "Mist en claro, blanco al 8 % en oscuro.",
      },
      {
        variable: "sidebar-ring",
        nombre: "Foco de la barra lateral",
        uso: "brand-600 en claro, brand-400 en oscuro: el mismo foco naranja.",
      },
    ],
    origen: [
      "components/providers.tsx:52",
      "app/globals.css:20",
      "app/globals.css:180",
      "app/globals.css:219",
      "app/globals.css:290",
      "app/globals.css:301",
      "app/globals.css:340",
      "app/globals.css:413",
      "components/brand/social.tsx:67",
      "components/ui/sonner.tsx:14",
      "AGENTS.md:20",
      "AGENTS.md:211",
      "messages/es/designSystem.json:32",
    ],
  },
]
