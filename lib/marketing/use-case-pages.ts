import {
  Award,
  BarChart3,
  BookOpen,
  Briefcase,
  Building,
  Calendar,
  CalendarDays,
  Camera,
  Clapperboard,
  Compass,
  FolderArchive,
  Gamepad2,
  GraduationCap,
  HelpCircle,
  Lightbulb,
  MessageCircle,
  MessageSquare,
  Mic,
  Music,
  Rocket,
  Search,
  Smile,
  Sparkles,
  Swords,
  Trophy,
  Users,
  Video,
} from "lucide-react"
import { whatsappHref } from "@/lib/contact"

export const useCasePages = {
  cliperos: {
    hero: {
      emoji: "🎬",
      tagline: "LA HERRAMIENTA #1 PARA CLIPEROS EN LATAM",
      title: "Trabaja 10x más rápido. Gana 10x más.",
      description:
        "Clipealo detecta automáticamente los mejores momentos del stream. Tú haces la magia creativa. La IA hace el trabajo pesado.",
      ctaText: "Empieza con 60 minutos de video incluidos",
      ctaHref: "/precios",
      image: "/marketing/use-cases/cliperos.jpg",
    },
    problem: {
      title: "El problema que ningún clipero debería tener",
      subtitle: "Mirar 4-8 horas de stream para encontrar 3 momentos buenos no escala.",
      description:
        "Si quieres servir a 5 streamers, necesitas 40 horas semanales solo en revisar VODs. Eso no es un negocio — es un trabajo de tiempo completo sin pagar el tiempo de análisis.",
    },
    solution: {
      title: "Lo que cambia con Clipealo",
      steps: [
        {
          title: "De 4 horas de VOD a clips listos en minutos",
          description:
            "Pega el link del VOD. Clipealo analiza el audio, detecta los momentos de mayor energía, reconoce la cara del streamer y genera los mejores clips automáticamente. Tú revisas, ajustas y publicas.",
        },
        {
          title: "Sirve a más streamers con el mismo tiempo",
          description:
            "Un clipero promedio puede manejar 1-2 streamers en paralelo de forma manual. Con Clipealo, el análisis de VODs se automatiza y puedes escalar a 5-10 streamers simultáneamente sin sacrificar calidad.",
        },
        {
          title: "Sube el valor que ofreces",
          description:
            "Cuando la IA detecta los clips base, tú te enfocas en lo que realmente vale: el criterio creativo, la edición de calidad, el conocimiento del streamer y su audiencia. Eso es lo que justifica cobrar más.",
        },
      ],
    },
    contentTypes: {
      title: "Tipos de contenido que procesa",
      items: [
        {
          icon: Gamepad2,
          label: "Streams de gaming",
          description: "Kills, clutch, fails épicos",
        },
        {
          icon: MessageCircle,
          label: "Just Chatting",
          description: "Historias, debates, momentos virales",
        },
        {
          icon: Camera,
          label: "IRL",
          description: "Reacciones en calle, eventos, momentos inesperados",
        },
        {
          icon: Music,
          label: "Streams de música",
          description: "Mejores canciones, reacciones del chat",
        },
        {
          icon: Swords,
          label: "Debates y opiniones",
          description: "Frases punzantes, confrontaciones",
        },
        {
          icon: Search,
          label: "Reacciones",
          description: "Momentos de sorpresa, shock, humor",
        },
      ],
    },
    platforms: {
      title: "Plataformas soportadas",
      items: [
        { name: "YouTube", note: "Disponible en todos los planes" },
        { name: "Twitch", note: "Desde plan Básico" },
        { name: "Kick", note: "Desde plan Estándar" },
        { name: "Subida manual", note: "Disponible en todos los planes" },
      ],
    },
    metrics: [
      { value: "4h → 15min", label: "Tiempo de análisis de un VOD de 2 horas" },
      { value: "5-10x", label: "Más streamers que puedes atender en paralelo" },
      { value: "Ver precios vigentes", label: "Costo de recarga de horas adicionales" },
    ],
    bottomCTA: {
      title: "Empieza hoy. Empieza con 60 minutos de video incluidos en el plan Prueba.",
      subtitle:
        "Sin tarjeta de crédito. Sin setup técnico. Solo pega el link y ve cómo funciona.",
      ctaText: "Crear mi cuenta gratis",
      ctaHref: "/precios",
    },
  },
  streamers: {
    hero: {
      emoji: "🚀",
      tagline: "PARA STREAMERS DE TWITCH, YOUTUBE Y KICK",
      title: "Tu stream dura 4 horas. Tus clips duran para siempre.",
      description:
        "Clipealo convierte automáticamente tus mejores momentos en clips virales para TikTok, Reels y Shorts. Sin editar. Sin contratar. Sin perder tiempo.",
      ctaText: "Pruébalo gratis con tu primer VOD",
      ctaHref: "/precios",
      image: "/marketing/use-cases/streamers.jpg",
    },
    problem: {
      title: "Transmites horas. Publicas nada.",
      subtitle: "El 83% de los streamers abandona en los primeros 6 meses.",
      description:
        "La razón más común no es falta de talento — es el agotamiento de hacer stream + editar clips + publicar en redes todos los días. La IA puede quitarte la parte más pesada.",
    },
    solution: {
      title: "Cómo funciona",
      steps: [
        {
          title: "Pega el link de tu VOD",
          description:
            "YouTube, Twitch, Kick o sube el archivo directamente. Sin configuración técnica.",
        },
        {
          title: "La IA encuentra tus mejores momentos",
          description:
            "Analizamos el audio, detectamos tu cara, identificamos los momentos de mayor energía en tu stream. Obtienes clips con título, descripción y la razón por la que ese clip puede ser viral.",
        },
        {
          title: "Descarga y publica",
          description:
            "Clips listos para TikTok, Reels y Shorts. Con o sin marca de agua según tu plan.",
        },
      ],
    },
    highlight: {
      title: "Tu diferencial: la razón del clip",
      description:
        "No solo te decimos cuál es el clip — te explicamos POR QUÉ ese momento tiene potencial viral. Qué emoción activa, qué tipo de audiencia atrae, y qué lo hace diferente. Eso no lo hace ningún otro tool del mercado.",
    },
    contentTypes: {
      title: "Tipos de stream que procesa",
      items: [
        {
          icon: Gamepad2,
          label: "Gaming (FPS, MOBA, Battle Royale, RPG)",
          description: "Kills épicos, clutch plays, fails memorables",
        },
        {
          icon: MessageCircle,
          label: "Just Chatting",
          description: "Historias, reacciones, debates",
        },
        { icon: Camera, label: "IRL", description: "Calle, viajes, eventos, reacciones" },
        {
          icon: Music,
          label: "Música en vivo",
          description: "Covers, sesiones, momentos emotivos",
        },
        {
          icon: Trophy,
          label: "Deportes y competencias",
          description: "Highlights y jugadas clave",
        },
        {
          icon: Sparkles,
          label: "Varieté y entretenimiento",
          description: "Humor, sorpresas, contenido general",
        },
      ],
    },
    metrics: [
      { value: "10h/sem", label: "Que recuperas sin editar clips manualmente" },
      { value: "15 créditos/h", label: "De análisis IA incluidos en todos los planes" },
      { value: "3 plataformas", label: "YouTube, Twitch y Kick según tu plan" },
    ],
    bottomCTA: {
      title: "Deja de perder el contenido que ya creaste.",
      subtitle:
        "Cada hora de stream que no se convierte en clip es una oportunidad perdida de crecimiento.",
      ctaText: "Empezar gratis ahora",
      ctaHref: "/precios",
    },
  },
  podcasters: {
    hero: {
      emoji: "🎙️",
      tagline: "PARA PODCASTERS EN ESPAÑOL",
      title: "1 episodio. 30 clips. 30 minutos.",
      description:
        "Clipealo convierte tus episodios de podcast en contenido corto para TikTok, Reels y Shorts automáticamente. Más audiencia, menos edición.",
      ctaText: "Sube tu primer episodio gratis",
      ctaHref: "/precios",
      image: "/marketing/use-cases/podcasters.jpg",
    },
    context: {
      title: "LATAM ya superó a EE.UU. en oyentes de podcast",
      stat: "135.2M",
      description:
        "Con 135.2 millones de oyentes en 2023, Latinoamérica es el mercado de podcasting de más rápido crecimiento del mundo. Pero el 90% del consumo ocurre en Spotify — un ecosistema donde descubrir nuevos podcasts es difícil. Los clips en TikTok e Instagram son el canal más efectivo para hacer crecer tu audiencia hoy.",
    },
    problem: {
      title: "Escuchar 3 horas para hacer 5 clips no es sostenible",
      subtitle: "1 episodio de 3h → 9 horas de trabajo manual para generar clips.",
      description:
        "Escuchar el episodio completo, identificar los mejores momentos, descargar el fragmento, editar el video, agregar subtítulos, formatear para vertical, subir a cada plataforma. Ese ciclo consume 3-6 horas por episodio — tiempo que deberías invertir en grabar más y mejor contenido.",
    },
    solution: {
      title: "Cómo lo resuelve Clipealo",
      steps: [
        {
          title: "Sube el video o pega el link de YouTube",
          description:
            "Soporta episodios completos en YouTube o archivos subidos directamente. La IA analiza el audio de principio a fin.",
        },
        {
          title: "La IA detecta los mejores momentos",
          description:
            "Frases poderosas, momentos de tensión, humor, revelaciones, citas memorables — la IA identifica qué segmentos tienen mayor potencial para generar engagement en redes sociales.",
        },
        {
          title: "Clips con título, descripción y contexto",
          description:
            "Cada clip viene acompañado de un título optimizado para redes, una descripción y la razón específica por la que ese fragmento puede volverse viral con tu audiencia.",
        },
      ],
    },
    contentTypes: {
      title: "Casos de uso específicos",
      items: [
        {
          icon: Mic,
          label: "Entrevistas",
          description: "Las mejores respuestas y revelaciones del invitado",
        },
        {
          icon: Swords,
          label: "Debates",
          description: "Los momentos de mayor tensión o confrontación",
        },
        {
          icon: MessageSquare,
          label: "Monólogos de opinión",
          description: "Frases contundentes y posiciones claras",
        },
        {
          icon: BookOpen,
          label: "Historias",
          description: "El clímax, el giro o el desenlace más emotivo",
        },
        {
          icon: Smile,
          label: "Humor",
          description: "Chistes, anécdotas graciosas y reacciones",
        },
        {
          icon: Lightbulb,
          label: "Tips y consejos",
          description: "Micro-lecciones de 30-60 segundos",
        },
      ],
    },
    metrics: [
      { value: "30+", label: "Clips por episodio de 3 horas de duración" },
      { value: "15-30 min", label: "Para procesar un episodio completo" },
      { value: "135.2M", label: "Oyentes de podcast en LATAM — tu audiencia potencial" },
    ],
    bottomCTA: {
      title: "Tu próximo millón de views empieza con un clip de 45 segundos.",
      subtitle: "Empieza hoy. El plan Prueba incluye 60 minutos de video al mes.",
      ctaText: "Crear clips de mi podcast ahora",
      ctaHref: "/precios",
    },
  },
  creadores: {
    hero: {
      emoji: "🎥",
      tagline: "PARA CREADORES DE CONTENIDO EN LATAM",
      title: "Un video largo. Diez plataformas. Un solo clic.",
      description:
        "Clipealo convierte tu contenido de YouTube, streams y videos largos en clips optimizados para TikTok, Reels y Shorts automáticamente. Más alcance, menos trabajo.",
      ctaText: "Probar con mi próximo video",
      ctaHref: "/precios",
      image: "/marketing/use-cases/creadores.jpg",
    },
    context: {
      title: "LATAM es la región de más rápido crecimiento en creator economy",
      stat: "67%",
      description:
        "La economía de creadores de LATAM creció 67% interanual en 2024 — la tasa más alta del mundo. TikTok superó a Instagram en uso en Colombia. YouTube Shorts representa hoy más del 40% del descubrimiento de canales nuevos. Si produces contenido largo y no tienes clips cortos, estás perdiendo el 60% de tu potencial de crecimiento.",
    },
    problem: {
      title: "Crear clips manualmente no escala",
      subtitle: "Convertir 1 video de 30min en clips cortos = horas de trabajo manual.",
      description:
        "Producir un video de 30 minutos toma 2-4 horas. Convertirlo en 10 clips para Shorts, Reels y TikTok toma otras 6-10 horas de edición manual. Si publicas 2 videos por semana, estás invirtiendo más tiempo en clips que en crear contenido original. Ese ciclo rompe a los mejores creadores.",
    },
    solution: {
      title: "Tu flujo de trabajo con Clipealo",
      steps: [
        {
          title: "Sube o pega el link de tu video",
          description:
            "YouTube o archivo directo. Cualquier género: vlogs, tutoriales, entretenimiento, opinión, deportes.",
        },
        {
          title: "La IA selecciona los mejores momentos",
          description:
            "Analizamos el audio, la energía del video y los momentos de mayor engagement potencial. Obtienes clips con título optimizado para cada plataforma, descripción y la razón de su potencial viral.",
        },
        {
          title: "Multiplica tu presencia sin multiplicar tu tiempo",
          description:
            "Lo que antes tomaba 6-10 horas de edición, ahora toma 15-30 minutos. El tiempo que ganas lo inviertes en crear más contenido o simplemente vivir mejor.",
        },
      ],
    },
    contentTypes: {
      title: "Tipos de contenido que procesa",
      items: [
        {
          icon: Video,
          label: "Vlogs",
          description: "Mejores momentos, reacciones, situaciones graciosas",
        },
        {
          icon: BookOpen,
          label: "Tutoriales",
          description: "Los tips más accionables en 30-60 seg",
        },
        {
          icon: MessageSquare,
          label: "Contenido de opinión",
          description: "Tus afirmaciones más fuertes",
        },
        {
          icon: Sparkles,
          label: "Entretenimiento",
          description: "Humor, sorpresas, momentos inesperados",
        },
        {
          icon: Trophy,
          label: "Deportes y aventura",
          description: "Highlights, logros, fails",
        },
        {
          icon: Compass,
          label: "Lifestyle y viajes",
          description: "Momentos visuales impactantes",
        },
      ],
    },
    platforms: {
      title: "Canales donde publicas",
      items: [
        {
          name: "TikTok",
          note: "Alcance orgánico masivo, especialmente en Colombia y México",
        },
        { name: "YouTube Shorts", note: "Impulsa el crecimiento de tu canal principal" },
        { name: "Instagram Reels", note: "Comunidad y brand deals" },
        { name: "Facebook Reels", note: "Alcance a audiencia 25-40 años en LATAM" },
      ],
    },
    metrics: [
      { value: "5-15 min", label: "Para procesar un video de 30 minutos" },
      { value: "10-20 clips", label: "Generados por video según duración" },
      { value: "67%", label: "Creció la economía de creadores en LATAM en 2024" },
    ],
    bottomCTA: {
      title: "Cada video que publicas sin clips es contenido que nadie más descubrirá.",
      subtitle: "Empieza hoy. El plan Prueba incluye 60 minutos de video al mes.",
      ctaText: "Crear mis primeros clips ahora",
      ctaHref: "/precios",
    },
  },
  coaches: {
    hero: {
      emoji: "📚",
      tagline: "PARA COACHES, MENTORES Y EDUCADORES ONLINE",
      title: "Convierte tu conocimiento en contenido que te trae clientes.",
      description:
        "Clipealo transforma tus webinars, masterclasses y sesiones grabadas en clips cortos que construyen tu autoridad y llenan tu embudo de ventas — automáticamente.",
      ctaText: "Sube tu primera masterclass gratis",
      ctaHref: "/precios",
      image: "/marketing/use-cases/coaches.jpg",
    },
    context: {
      title: "El e-learning en LATAM creció 168% en 3 años",
      stat: "$27.84B",
      description:
        "El mercado de educación online en LATAM alcanzó $27.84 mil millones en 2024 y proyecta llegar a $112 mil millones para 2033. Pero con más competencia, la autoridad que construyes en redes sociales es el diferenciador más importante para vender tus cursos y mentorías.",
    },
    problem: {
      title: "Produces contenido de valor. Casi nadie lo ve.",
      subtitle: "Webinar de 2h → solo 5 clips (pérdida de valor).",
      description:
        "Grabas webinars de 2 horas con contenido de altísimo valor. Pero esas grabaciones quedan en un link de Zoom o un video de YouTube que nadie descubre. Los clips cortos en Instagram, TikTok y LinkedIn son el puente entre tu conocimiento y tu próximo estudiante o cliente.",
    },
    solution: {
      title: "Tu embudo de contenido con Clipealo",
      steps: [
        {
          title: "Sube tu webinar o masterclass",
          description:
            "Pega un enlace público de Zoom sin contraseña, usa YouTube o sube el archivo. Duración según tu plan.",
        },
        {
          title: "La IA identifica tus momentos de mayor impacto",
          description:
            "Consejos accionables, revelaciones, historias emotivas, contradicciones de la industria, cifras impactantes — los momentos que generan guardados, compartidos y conversiones.",
        },
        {
          title: "Clips que construyen autoridad y generan leads",
          description:
            "Cada clip lleva a tu audiencia a querer más. Son teasers naturales de tu conocimiento completo — el mejor anuncio que puedes tener es un contenido de valor genuino.",
        },
      ],
    },
    contentTypes: {
      title: "Casos de uso",
      items: [
        {
          icon: Video,
          label: "Webinars y masterclasses en vivo",
          description: "Convierte en 20+ clips por sesión",
        },
        {
          icon: GraduationCap,
          label: "Módulos de cursos",
          description: "Micro-lecciones de 30-60 segundos para marketing",
        },
        {
          icon: Users,
          label: "Sesiones de coaching grupal",
          description: "Testimonios y momentos de transformación",
        },
        {
          icon: Mic,
          label: "Conferencias y charlas",
          description: "Frases memorables y puntos clave",
        },
        {
          icon: BookOpen,
          label: "Entrevistas y podcasts de autoridad",
          description: "Tus mejores respuestas",
        },
        {
          icon: HelpCircle,
          label: "Q&A en vivo",
          description: "Las preguntas más comunes resueltas en clip",
        },
      ],
    },
    platforms: {
      title: "Publicación en",
      items: [
        { name: "Instagram Reels", note: "Autoridad y comunidad" },
        { name: "TikTok", note: "Alcance orgánico y descubrimiento" },
        { name: "YouTube Shorts", note: "Complementa tu canal educativo" },
        { name: "LinkedIn", note: "Coaches B2B y consultores" },
        { name: "WhatsApp Status", note: "Comportamiento único en LATAM" },
      ],
    },
    metrics: [{ value: "20+", label: "Clips por webinar de 2 horas" }],
    bottomCTA: {
      title:
        "Tu conocimiento vale demasiado para quedarse en una grabación que nadie ve.",
      subtitle: "60 minutos de video al mes en el plan Prueba. Sin tarjeta de crédito.",
      ctaText: "Empezar a crear clips de mi contenido",
      ctaHref: "/precios",
    },
  },
  comunidades: {
    hero: {
      emoji: "🏆",
      tagline: "PARA ORGANIZACIONES DE ESPORTS Y COMUNIDADES GAMER",
      title: "Cada partida genera cientos de clips potenciales. Captura todos.",
      description:
        "Clipealo convierte las transmisiones de tus torneos, ligas y partidas en highlights automáticos para crecer tu comunidad y atraer sponsors.",
      ctaText: "Hablar con el equipo de Clipealo",
      ctaHref: whatsappHref("Hola, quiero saber más sobre Clipealo para esports"),
      image: "/marketing/use-cases/comunidades.jpg",
    },
    context: {
      title: "El esports en LATAM crecerá 5x para 2030",
      stat: "$907.8M",
      description:
        "El mercado de esports en Latinoamérica proyecta un crecimiento del 438% en los próximos 5 años. Free Fire, League of Legends, Valorant y Counter-Strike tienen ligas regionales con millones de espectadores. Sin embargo, la mayoría de organizaciones LATAM opera con equipos de contenido pequeños que no pueden aprovechar la cantidad de material que generan sus competencias.",
    },
    problem: {
      title: "Generan horas de contenido. Publican minutos.",
      subtitle: "Un torneo de 8 horas puede generar 200+ momentos clipables.",
      description:
        "Pentakills, clutch 1v5, throws épicos, reacciones de jugadores, momentos de casters. Un equipo de contenido humano puede procesar 10-20 de esos momentos. Clipealo puede procesar todos.",
    },
    solution: {
      title: "Casos de uso en esports",
      steps: [
        {
          title: "Contenido para sponsors",
          description:
            "Los sponsors quieren ver que su logo aparece en contenido viral. Clips de alta calidad con highlights de tus jugadores son la mejor demostración de ROI que puedes ofrecer a una marca.",
        },
        {
          title: "Crecimiento de comunidad",
          description:
            "Una org que publica 5-10 clips diarios durante un torneo crece 3-5x más rápido en TikTok e Instagram que una que publica 1-2 piezas semanales.",
        },
        {
          title: "Archivo de contenido",
          description:
            "Cada torneo queda documentado en clips organizados y editados. Un recurso invaluable para el historial de la organización y para atraer nuevos jugadores y patrocinadores.",
        },
      ],
    },
    contentTypes: {
      title: "Tipos de contenido que genera",
      items: [
        {
          icon: Gamepad2,
          label: "Highlights de partidas",
          description: "Momentos clave automáticos de partidas completas",
        },
        {
          icon: Users,
          label: "POV de jugadores estrella",
          description: "Las mejores jugadas individuales",
        },
        {
          icon: Video,
          label: "Resúmenes de jornada",
          description: "30-90 segundos por partida",
        },
        {
          icon: Mic,
          label: "Reacciones de casters",
          description: "Momentos de emoción de casters y analistas",
        },
        {
          icon: Clapperboard,
          label: "Behind the scenes",
          description: "Clips de entrenamientos y camerinos",
        },
        {
          icon: CalendarDays,
          label: "Teasers pre-evento",
          description: "Clips de enfrentamientos próximos",
        },
      ],
    },
    metrics: [{ value: "200+", label: "Momentos clipables en un torneo de 8 horas" }],
    bottomCTA: {
      title:
        "Tus jugadores hacen plays increíbles todos los días. El mundo merece verlos.",
      subtitle: "Hablemos de cómo Clipealo puede impulsar tu organización.",
      ctaText: "Contactar al equipo de Clipealo",
      ctaHref: whatsappHref("Hola, quiero saber más sobre Clipealo para esports"),
    },
  },
  agencias: {
    hero: {
      emoji: "🎬",
      tagline: "PARA AGENCIAS DE CONTENIDO Y PRODUCCIÓN AUDIOVISUAL",
      title: "Escala tu producción de clips x5 sin contratar más editores.",
      description:
        "Clipealo automatiza el clipping de video para agencias que manejan múltiples clientes. Reduce costos, aumenta márgenes y entrega más contenido en menos tiempo.",
      ctaText: "Hablar con el equipo de Clipealo",
      ctaHref: whatsappHref("Hola, quiero saber más sobre Clipealo para agencias"),
      image: "/marketing/use-cases/agencias.jpg",
    },
    context: {
      title: "El video digital en LATAM crece al 36% anual",
      stat: "$10.25B",
      description:
        "Las marcas en LATAM aumentaron sus presupuestos de video marketing un 47% en 2024. El problema: las agencias tienen el mismo número de editores de siempre. La demanda creció, pero la capacidad de producción no escala de la misma forma. Clipealo es la palanca de escalabilidad que tu agencia necesita.",
    },
    problem: {
      title: "El cuello de botella de toda agencia: la edición de clips",
      subtitle: "15 clientes × 4 clips/semana = 120h de trabajo manual por semana.",
      description:
        "Una agencia mediana con 10-15 clientes que pide 3-5 clips por semana por cliente, necesita 30-75 horas semanales dedicadas solo a clips cortos. Con 2 editores de video a S/.3,000-5,000/mes cada uno, estás invirtiendo S/.6,000-10,000/mes en solo esta tarea. Clipealo automatiza parte de este flujo y ayuda a recuperar tiempo.",
    },
    solution: {
      title: "El modelo de agencia con Clipealo",
      steps: [
        {
          title: "Automatiza el 80% del trabajo de análisis",
          description:
            "La IA hace la tarea más tediosa: revisar horas de contenido, identificar los mejores momentos, generar clips base con títulos. Tu equipo humano agrega el criterio creativo, el branding del cliente y los ajustes finales.",
        },
        {
          title: "Aumenta tu oferta sin aumentar costos",
          description:
            "Con la misma estructura de equipo, puedes ofrecer 3-5x más clips por mes a cada cliente. Eso significa más valor percibido, más retención de clientes y posibilidad de cobrar más por el mismo paquete.",
        },
        {
          title: "Onboard clientes nuevos más rápido",
          description:
            "El tiempo de setup para procesar el contenido de un cliente nuevo pasa de días a minutos. Conectas su canal, defines los parámetros y Clipealo empieza a generar clips ese mismo día.",
        },
      ],
    },
    contentTypes: {
      title: "Casos de uso para agencias",
      items: [
        {
          icon: Video,
          label: "Webinars y eventos de clientes",
          description: "20+ clips por sesión",
        },
        {
          icon: Rocket,
          label: "Campañas de lanzamiento",
          description: "Múltiples variaciones de clips para A/B testing",
        },
        {
          icon: Calendar,
          label: "Contenido mensual de redes",
          description: "Generado desde 4-8 videos largos",
        },
        {
          icon: BarChart3,
          label: "Coberturas de eventos",
          description: "Procesamiento mismo día para publicación en vivo",
        },
        {
          icon: Award,
          label: "Testimoniales y casos de éxito",
          description: "Los mejores fragmentos editados",
        },
        {
          icon: FolderArchive,
          label: "Repurposing de archivo",
          description: "Valor de videos históricos de clientes",
        },
      ],
    },
    metrics: [
      { value: "5x", label: "Más clips producidos por el mismo equipo" },
      { value: "80%", label: "Reducción en tiempo de análisis y revisión de VODs" },
    ],
    bottomCTA: {
      title: "Tu agencia puede hacer más con lo que ya tiene.",
      subtitle: "Hablemos de cómo Clipealo encaja en tu stack de herramientas.",
      ctaText: "Contactar al equipo de Clipealo",
      ctaHref: whatsappHref("Hola, quiero saber más sobre Clipealo para agencias"),
    },
  },
  marcas: {
    hero: {
      emoji: "🏢",
      tagline: "PARA MARCAS Y EQUIPOS DE MARKETING",
      title: "Cada video de tu marca vale 10 veces más con Clipealo.",
      description:
        "Convierte tus webinars, lanzamientos, eventos y videos corporativos en clips cortos que generan engagement, leads y ventas — automáticamente.",
      ctaText: "Hablar con el equipo de Clipealo",
      ctaHref: whatsappHref("Hola, quiero saber más sobre Clipealo para marcas"),
      image: "/marketing/use-cases/marcas.jpg",
    },
    context: {
      title: "Las marcas en LATAM invierten millones en video. Aprovechan el 10%.",
      stat: "$5.37B",
      description:
        "Produces un webinar de 1 hora con expertos, un evento de lanzamiento, una conferencia de marca. Ese contenido cuesta miles de soles en producción. Pero en el formato largo, el alcance es limitado. Los clips cortos son el mecanismo que multiplica el ROI de cada producción de video que ya hiciste.",
    },
    problem: {
      title: "Produces assets costosos. Extraes poco valor de ellos.",
      subtitle: "Video de lanzamiento de $5,000 → solo 3 clips manualmente.",
      description:
        "Un webinar de 1 hora podría generar 10-20 clips. Hacerlo manualmente toma 8-16 horas de editor. La mayoría de equipos de marketing produce 1-3 clips y deja el resto sobre la mesa. Con Clipealo, el mismo video genera 20-30 clips en 30 minutos.",
    },
    solution: {
      title: "El flujo de contenido de marca",
      steps: [
        {
          title: "Maximiza el ROI de cada producción",
          description:
            "Si producir un video de marca cuesta S/.5,000, generar 30 clips del mismo material reduce el costo por pieza de contenido de S/.5,000 a S/.167. Eso cambia completamente la economía de tu estrategia de contenido.",
        },
        {
          title: "Velocidad para responder tendencias",
          description:
            "En TikTok y Reels, las tendencias duran 48-72 horas. Clipealo te permite procesar un video y tener clips listos el mismo día — no en 3 días cuando el equipo de edición tenga turno.",
        },
        {
          title: "Consistencia de publicación",
          description:
            "El mayor driver de crecimiento en redes sociales es la consistencia. Con Clipealo, un equipo de marketing de 2 personas puede mantener un calendario de publicación diario en 4-5 plataformas simultáneamente.",
        },
      ],
    },
    contentTypes: {
      title: "Casos de uso para marcas",
      items: [
        {
          icon: Rocket,
          label: "Lanzamientos de producto",
          description: "Clips del momento WOW y características clave",
        },
        {
          icon: Video,
          label: "Webinars y thought leadership",
          description: "Los insights más compartibles",
        },
        {
          icon: Building,
          label: "Eventos corporativos",
          description: "Highlights para comunidad interna y externa",
        },
        {
          icon: Users,
          label: "Testimoniales de clientes",
          description: "Los momentos más emotivos y concretos",
        },
        {
          icon: Camera,
          label: "Behind the scenes",
          description: "Humanización de marca con momentos auténticos",
        },
        {
          icon: Briefcase,
          label: "Employer branding",
          description: "Clips de cultura y equipo para atraer talento",
        },
      ],
    },
    platforms: {
      title: "Canales prioritarios para marcas en LATAM",
      items: [
        { name: "Instagram Reels", note: "Canal #1 para brand awareness en LATAM" },
        { name: "TikTok", note: "Crecimiento orgánico y audiencias jóvenes" },
        { name: "YouTube Shorts", note: "Complementa estrategia de YouTube long-form" },
        { name: "LinkedIn", note: "Marcas B2B, employer branding y thought leadership" },
        { name: "WhatsApp Business", note: "420M+ usuarios en LATAM" },
        { name: "Facebook Reels", note: "Audiencia 30-50 años, Perú y Bolivia" },
      ],
    },
    metrics: [
      { value: "441%", label: "Incremento en tasa de conversión con clips de TikTok" },
      { value: "30 clips", label: "De un webinar de 1 hora en 30 minutos" },
    ],
    bottomCTA: {
      title: "Cada video que produces merece llegar a la audiencia máxima posible.",
      subtitle:
        "Hablemos de cómo Clipealo encaja en la estrategia de contenido de tu marca.",
      ctaText: "Contactar al equipo de Clipealo",
      ctaHref: whatsappHref("Hola, quiero saber más sobre Clipealo para marcas"),
    },
  },
} as const
