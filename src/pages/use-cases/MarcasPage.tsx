import { Rocket, Video, Building, Users, Camera, Briefcase } from 'lucide-react';
import UseCasePageTemplate, { type UseCasePageData } from '@/components/use-cases/UseCasePageTemplate';
import heroImage from '@/assets/use-case-marcas.jpg';

const data: UseCasePageData = {
  hero: {
    emoji: '🏢',
    tagline: 'PARA MARCAS Y EQUIPOS DE MARKETING',
    title: 'Cada video de tu marca vale 10 veces más con Clipealo.',
    description: 'Convierte tus webinars, lanzamientos, eventos y videos corporativos en clips cortos que generan engagement, leads y ventas — automáticamente.',
    ctaText: 'Hablar con el equipo de Clipealo',
    ctaHref: 'https://wa.me/51906160948?text=Hola%2C%20quiero%20saber%20m%C3%A1s%20sobre%20Clipealo%20para%20marcas',
    image: heroImage,
  },
  context: {
    title: 'Las marcas en LATAM invierten millones en video. Aprovechan el 10%.',
    stat: '$5.37B',
    description: 'Produces un webinar de 1 hora con expertos, un evento de lanzamiento, una conferencia de marca. Ese contenido cuesta miles de soles en producción. Pero en el formato largo, el alcance es limitado. Los clips cortos son el mecanismo que multiplica el ROI de cada producción de video que ya hiciste.',
  },
  problem: {
    title: 'Produces assets costosos. Extraes poco valor de ellos.',
    subtitle: 'Video de lanzamiento de $5,000 → solo 3 clips manualmente.',
    description: 'Un webinar de 1 hora podría generar 10-20 clips. Hacerlo manualmente toma 8-16 horas de editor. La mayoría de equipos de marketing produce 1-3 clips y deja el resto sobre la mesa. Con Clipealo, el mismo video genera 20-30 clips en 30 minutos.',
  },
  solution: {
    title: 'El flujo de contenido de marca',
    steps: [
      { title: 'Maximiza el ROI de cada producción', description: 'Si producir un video de marca cuesta S/.5,000, generar 30 clips del mismo material reduce el costo por pieza de contenido de S/.5,000 a S/.167. Eso cambia completamente la economía de tu estrategia de contenido.' },
      { title: 'Velocidad para responder tendencias', description: 'En TikTok y Reels, las tendencias duran 48-72 horas. Clipealo te permite procesar un video y tener clips listos el mismo día — no en 3 días cuando el equipo de edición tenga turno.' },
      { title: 'Consistencia de publicación', description: 'El mayor driver de crecimiento en redes sociales es la consistencia. Con Clipealo, un equipo de marketing de 2 personas puede mantener un calendario de publicación diario en 4-5 plataformas simultáneamente.' },
    ],
  },
  contentTypes: {
    title: 'Casos de uso para marcas',
    items: [
      { icon: Rocket, label: 'Lanzamientos de producto', description: 'Clips del momento WOW y características clave' },
      { icon: Video, label: 'Webinars y thought leadership', description: 'Los insights más compartibles' },
      { icon: Building, label: 'Eventos corporativos', description: 'Highlights para comunidad interna y externa' },
      { icon: Users, label: 'Testimoniales de clientes', description: 'Los momentos más emotivos y concretos' },
      { icon: Camera, label: 'Behind the scenes', description: 'Humanización de marca con momentos auténticos' },
      { icon: Briefcase, label: 'Employer branding', description: 'Clips de cultura y equipo para atraer talento' },
    ],
  },
  platforms: {
    title: 'Canales prioritarios para marcas en LATAM',
    items: [
      { name: 'Instagram Reels', note: 'Canal #1 para brand awareness en LATAM' },
      { name: 'TikTok', note: 'Crecimiento orgánico y audiencias jóvenes' },
      { name: 'YouTube Shorts', note: 'Complementa estrategia de YouTube long-form' },
      { name: 'LinkedIn', note: 'Marcas B2B, employer branding y thought leadership' },
      { name: 'WhatsApp Business', note: '420M+ usuarios en LATAM' },
      { name: 'Facebook Reels', note: 'Audiencia 30-50 años, Perú y Bolivia' },
    ],
  },
  metrics: [
    { value: '441%', label: 'Incremento en tasa de conversión con clips de TikTok' },
    { value: 'S/.167', label: 'Costo por clip si produces 30 desde un video de S/.5,000' },
    { value: '30 clips', label: 'De un webinar de 1 hora en 30 minutos' },
  ],
  plans: {
    title: 'Plan recomendado',
    items: [
      { name: 'Premium', price: 'S/.126-198/mes', description: 'Para marcas con 1-2 videos por semana.', highlighted: false },
      { name: 'Enterprise', price: 'Precio negociado', description: 'Producción continua, múltiples usuarios y Clipero dedicado que conoce tu voz de marca.', highlighted: true },
    ],
  },
  bottomCTA: {
    title: 'Cada video que produces merece llegar a la audiencia máxima posible.',
    subtitle: 'Hablemos de cómo Clipealo encaja en la estrategia de contenido de tu marca.',
    ctaText: 'Contactar al equipo de Clipealo',
    ctaHref: 'https://wa.me/51906160948?text=Hola%2C%20quiero%20saber%20m%C3%A1s%20sobre%20Clipealo%20para%20marcas',
  },
};

const MarcasPage = () => <UseCasePageTemplate data={data} />;
export default MarcasPage;
