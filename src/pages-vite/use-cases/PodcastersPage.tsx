import { Mic, MessageSquare, Swords, BookOpen, Smile, Lightbulb } from 'lucide-react';
import UseCasePageTemplate, { type UseCasePageData } from '@/components/use-cases/UseCasePageTemplate';
import heroImage from '@/assets/use-case-podcasters.jpg';

const data: UseCasePageData = {
  hero: {
    emoji: '🎙️',
    tagline: 'PARA PODCASTERS EN ESPAÑOL',
    title: '1 episodio. 30 clips. 30 minutos.',
    description: 'Clipealo convierte tus episodios de podcast en contenido corto para TikTok, Reels y Shorts automáticamente. Más audiencia, menos edición.',
    ctaText: 'Sube tu primer episodio gratis',
    ctaHref: '/precios',
    image: heroImage,
  },
  context: {
    title: 'LATAM ya superó a EE.UU. en oyentes de podcast',
    stat: '135.2M',
    description: 'Con 135.2 millones de oyentes en 2023, Latinoamérica es el mercado de podcasting de más rápido crecimiento del mundo. Pero el 90% del consumo ocurre en Spotify — un ecosistema donde descubrir nuevos podcasts es difícil. Los clips en TikTok e Instagram son el canal más efectivo para hacer crecer tu audiencia hoy.',
  },
  problem: {
    title: 'Escuchar 3 horas para hacer 5 clips no es sostenible',
    subtitle: '1 episodio de 3h → 9 horas de trabajo manual para generar clips.',
    description: 'Escuchar el episodio completo, identificar los mejores momentos, descargar el fragmento, editar el video, agregar subtítulos, formatear para vertical, subir a cada plataforma. Ese ciclo consume 3-6 horas por episodio — tiempo que deberías invertir en grabar más y mejor contenido.',
  },
  solution: {
    title: 'Cómo lo resuelve Clipealo',
    steps: [
      { title: 'Sube el video o pega el link de YouTube', description: 'Soporta episodios completos en YouTube o archivos subidos directamente. La IA analiza el audio de principio a fin.' },
      { title: 'La IA detecta los mejores momentos', description: 'Frases poderosas, momentos de tensión, humor, revelaciones, citas memorables — la IA identifica qué segmentos tienen mayor potencial para generar engagement en redes sociales.' },
      { title: 'Clips con título, descripción y contexto', description: 'Cada clip viene acompañado de un título optimizado para redes, una descripción y la razón específica por la que ese fragmento puede volverse viral con tu audiencia.' },
    ],
  },
  contentTypes: {
    title: 'Casos de uso específicos',
    items: [
      { icon: Mic, label: 'Entrevistas', description: 'Las mejores respuestas y revelaciones del invitado' },
      { icon: Swords, label: 'Debates', description: 'Los momentos de mayor tensión o confrontación' },
      { icon: MessageSquare, label: 'Monólogos de opinión', description: 'Frases contundentes y posiciones claras' },
      { icon: BookOpen, label: 'Historias', description: 'El clímax, el giro o el desenlace más emotivo' },
      { icon: Smile, label: 'Humor', description: 'Chistes, anécdotas graciosas y reacciones' },
      { icon: Lightbulb, label: 'Tips y consejos', description: 'Micro-lecciones de 30-60 segundos' },
    ],
  },
  metrics: [
    { value: '30+', label: 'Clips por episodio de 3 horas de duración' },
    { value: '15-30 min', label: 'Para procesar un episodio completo' },
    { value: '135.2M', label: 'Oyentes de podcast en LATAM — tu audiencia potencial' },
  ],
  plans: {
    title: 'Planes recomendados',
    items: [
      { name: 'Básico', price: 'S/45/mes', description: '5h/mes de análisis. YouTube incluido.', highlighted: false },
      { name: 'Estándar', price: 'S/90/mes', description: '10h/mes. + Kick para video podcasts.', highlighted: true },
    ],
  },
  bottomCTA: {
    title: 'Tu próximo millón de views empieza con un clip de 45 segundos.',
    subtitle: 'Empieza hoy. Tus primeros 30 minutos de análisis son completamente gratis.',
    ctaText: 'Crear clips de mi podcast ahora',
    ctaHref: '/precios',
  },
};

const PodcastersPage = () => <UseCasePageTemplate data={data} />;
export default PodcastersPage;
