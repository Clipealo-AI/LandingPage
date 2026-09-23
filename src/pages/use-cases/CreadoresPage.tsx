import { Video, BookOpen, MessageSquare, Sparkles, Trophy, Compass } from 'lucide-react';
import UseCasePageTemplate, { type UseCasePageData } from '@/components/use-cases/UseCasePageTemplate';
import heroImage from '@/assets/use-case-creadores.jpg';

const data: UseCasePageData = {
  hero: {
    emoji: '🎥',
    tagline: 'PARA CREADORES DE CONTENIDO EN LATAM',
    title: 'Un video largo. Diez plataformas. Un solo clic.',
    description: 'Clipealo convierte tu contenido de YouTube, streams y videos largos en clips optimizados para TikTok, Reels y Shorts automáticamente. Más alcance, menos trabajo.',
    ctaText: 'Probar con mi próximo video',
    ctaHref: '/precios',
    image: heroImage,
  },
  context: {
    title: 'LATAM es la región de más rápido crecimiento en creator economy',
    stat: '67%',
    description: 'La economía de creadores de LATAM creció 67% interanual en 2024 — la tasa más alta del mundo. TikTok superó a Instagram en uso en Colombia. YouTube Shorts representa hoy más del 40% del descubrimiento de canales nuevos. Si produces contenido largo y no tienes clips cortos, estás perdiendo el 60% de tu potencial de crecimiento.',
  },
  problem: {
    title: 'Crear clips manualmente no escala',
    subtitle: 'Convertir 1 video de 30min en clips cortos = horas de trabajo manual.',
    description: 'Producir un video de 30 minutos toma 2-4 horas. Convertirlo en 10 clips para Shorts, Reels y TikTok toma otras 6-10 horas de edición manual. Si publicas 2 videos por semana, estás invirtiendo más tiempo en clips que en crear contenido original. Ese ciclo rompe a los mejores creadores.',
  },
  solution: {
    title: 'Tu flujo de trabajo con Clipealo',
    steps: [
      { title: 'Sube o pega el link de tu video', description: 'YouTube o archivo directo. Cualquier género: vlogs, tutoriales, entretenimiento, opinión, deportes.' },
      { title: 'La IA selecciona los mejores momentos', description: 'Analizamos el audio, la energía del video y los momentos de mayor engagement potencial. Obtienes clips con título optimizado para cada plataforma, descripción y la razón de su potencial viral.' },
      { title: 'Multiplica tu presencia sin multiplicar tu tiempo', description: 'Lo que antes tomaba 6-10 horas de edición, ahora toma 15-30 minutos. El tiempo que ganas lo inviertes en crear más contenido o simplemente vivir mejor.' },
    ],
  },
  contentTypes: {
    title: 'Tipos de contenido que procesa',
    items: [
      { icon: Video, label: 'Vlogs', description: 'Mejores momentos, reacciones, situaciones graciosas' },
      { icon: BookOpen, label: 'Tutoriales', description: 'Los tips más accionables en 30-60 seg' },
      { icon: MessageSquare, label: 'Contenido de opinión', description: 'Tus afirmaciones más fuertes' },
      { icon: Sparkles, label: 'Entretenimiento', description: 'Humor, sorpresas, momentos inesperados' },
      { icon: Trophy, label: 'Deportes y aventura', description: 'Highlights, logros, fails' },
      { icon: Compass, label: 'Lifestyle y viajes', description: 'Momentos visuales impactantes' },
    ],
  },
  platforms: {
    title: 'Canales donde publicas',
    items: [
      { name: 'TikTok', note: 'Alcance orgánico masivo, especialmente en Colombia y México' },
      { name: 'YouTube Shorts', note: 'Impulsa el crecimiento de tu canal principal' },
      { name: 'Instagram Reels', note: 'Comunidad y brand deals' },
      { name: 'Facebook Reels', note: 'Alcance a audiencia 25-40 años en LATAM' },
    ],
  },
  metrics: [
    { value: '5-15 min', label: 'Para procesar un video de 30 minutos' },
    { value: '10-20 clips', label: 'Generados por video según duración' },
    { value: '67%', label: 'Creció la economía de creadores en LATAM en 2024' },
  ],
  bottomCTA: {
    title: 'Cada video que publicas sin clips es contenido que nadie más descubrirá.',
    subtitle: 'Empieza hoy. Tus primeros 30 minutos de análisis son completamente gratis.',
    ctaText: 'Crear mis primeros clips ahora',
    ctaHref: '/precios',
  },
};

const CreadoresPage = () => <UseCasePageTemplate data={data} />;
export default CreadoresPage;
