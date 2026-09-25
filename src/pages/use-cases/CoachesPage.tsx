import { Video, BookOpen, Users, Mic, HelpCircle, GraduationCap } from 'lucide-react';
import UseCasePageTemplate, { type UseCasePageData } from '@/components/use-cases/UseCasePageTemplate';
import heroImage from '@/assets/use-case-coaches.jpg';

const data: UseCasePageData = {
  hero: {
    emoji: '📚',
    tagline: 'PARA COACHES, MENTORES Y EDUCADORES ONLINE',
    title: 'Convierte tu conocimiento en contenido que te trae clientes.',
    description: 'Clipealo transforma tus webinars, masterclasses y sesiones grabadas en clips cortos que construyen tu autoridad y llenan tu embudo de ventas — automáticamente.',
    ctaText: 'Sube tu primera masterclass gratis',
    ctaHref: '/precios',
    image: heroImage,
  },
  context: {
    title: 'El e-learning en LATAM creció 168% en 3 años',
    stat: '$27.84B',
    description: 'El mercado de educación online en LATAM alcanzó $27.84 mil millones en 2024 y proyecta llegar a $112 mil millones para 2033. Pero con más competencia, la autoridad que construyes en redes sociales es el diferenciador más importante para vender tus cursos y mentorías.',
  },
  problem: {
    title: 'Produces contenido de valor. Casi nadie lo ve.',
    subtitle: 'Webinar de 2h → solo 5 clips (pérdida de valor).',
    description: 'Grabas webinars de 2 horas con contenido de altísimo valor. Pero esas grabaciones quedan en un link de Zoom o un video de YouTube que nadie descubre. Los clips cortos en Instagram, TikTok y LinkedIn son el puente entre tu conocimiento y tu próximo estudiante o cliente.',
  },
  solution: {
    title: 'Tu embudo de contenido con Clipealo',
    steps: [
      { title: 'Sube tu webinar o masterclass', description: 'Pega un enlace público de Zoom sin contraseña, usa YouTube o sube el archivo. Duración según tu plan.' },
      { title: 'La IA identifica tus momentos de mayor impacto', description: 'Consejos accionables, revelaciones, historias emotivas, contradicciones de la industria, cifras impactantes — los momentos que generan guardados, compartidos y conversiones.' },
      { title: 'Clips que construyen autoridad y generan leads', description: 'Cada clip lleva a tu audiencia a querer más. Son teasers naturales de tu conocimiento completo — el mejor anuncio que puedes tener es un contenido de valor genuino.' },
    ],
  },
  contentTypes: {
    title: 'Casos de uso',
    items: [
      { icon: Video, label: 'Webinars y masterclasses en vivo', description: 'Convierte en 20+ clips por sesión' },
      { icon: GraduationCap, label: 'Módulos de cursos', description: 'Micro-lecciones de 30-60 segundos para marketing' },
      { icon: Users, label: 'Sesiones de coaching grupal', description: 'Testimonios y momentos de transformación' },
      { icon: Mic, label: 'Conferencias y charlas', description: 'Frases memorables y puntos clave' },
      { icon: BookOpen, label: 'Entrevistas y podcasts de autoridad', description: 'Tus mejores respuestas' },
      { icon: HelpCircle, label: 'Q&A en vivo', description: 'Las preguntas más comunes resueltas en clip' },
    ],
  },
  platforms: {
    title: 'Publicación en',
    items: [
      { name: 'Instagram Reels', note: 'Autoridad y comunidad' },
      { name: 'TikTok', note: 'Alcance orgánico y descubrimiento' },
      { name: 'YouTube Shorts', note: 'Complementa tu canal educativo' },
      { name: 'LinkedIn', note: 'Coaches B2B y consultores' },
      { name: 'WhatsApp Status', note: 'Comportamiento único en LATAM' },
    ],
  },
  metrics: [
    { value: 'S/.48/mes', label: 'Plan Básico — si trae 1 venta de curso de S/.200, se paga 4x' },
    { value: '20+', label: 'Clips por webinar de 2 horas' },
    { value: 'IG + TikTok', label: 'Los 2 canales principales para coaches en LATAM' },
  ],
  bottomCTA: {
    title: 'Tu conocimiento vale demasiado para quedarse en una grabación que nadie ve.',
    subtitle: '60 minutos de análisis gratis. Sin tarjeta de crédito.',
    ctaText: 'Empezar a crear clips de mi contenido',
    ctaHref: '/precios',
  },
};

const CoachesPage = () => <UseCasePageTemplate data={data} />;
export default CoachesPage;
