import { Gamepad2, Users, Video, Mic, Clapperboard, CalendarDays } from 'lucide-react';
import UseCasePageTemplate, { type UseCasePageData } from '@/components/use-cases/UseCasePageTemplate';
import heroImage from '@/assets/use-case-comunidades.jpg';

const data: UseCasePageData = {
  hero: {
    emoji: '🏆',
    tagline: 'PARA ORGANIZACIONES DE ESPORTS Y COMUNIDADES GAMER',
    title: 'Cada partida genera cientos de clips potenciales. Captura todos.',
    description: 'Clipealo convierte las transmisiones de tus torneos, ligas y partidas en highlights automáticos para crecer tu comunidad y atraer sponsors.',
    ctaText: 'Hablar con el equipo de Clipealo',
    ctaHref: 'https://wa.me/51906160948?text=Hola%2C%20quiero%20saber%20m%C3%A1s%20sobre%20Clipealo%20para%20esports',
    image: heroImage,
  },
  context: {
    title: 'El esports en LATAM crecerá 5x para 2030',
    stat: '$907.8M',
    description: 'El mercado de esports en Latinoamérica proyecta un crecimiento del 438% en los próximos 5 años. Free Fire, League of Legends, Valorant y Counter-Strike tienen ligas regionales con millones de espectadores. Sin embargo, la mayoría de organizaciones LATAM opera con equipos de contenido pequeños que no pueden aprovechar la cantidad de material que generan sus competencias.',
  },
  problem: {
    title: 'Generan horas de contenido. Publican minutos.',
    subtitle: 'Un torneo de 8 horas puede generar 200+ momentos clipables.',
    description: 'Pentakills, clutch 1v5, throws épicos, reacciones de jugadores, momentos de casters. Un equipo de contenido humano puede procesar 10-20 de esos momentos. Clipealo puede procesar todos.',
  },
  solution: {
    title: 'Casos de uso en esports',
    steps: [
      { title: 'Contenido para sponsors', description: 'Los sponsors quieren ver que su logo aparece en contenido viral. Clips de alta calidad con highlights de tus jugadores son la mejor demostración de ROI que puedes ofrecer a una marca.' },
      { title: 'Crecimiento de comunidad', description: 'Una org que publica 5-10 clips diarios durante un torneo crece 3-5x más rápido en TikTok e Instagram que una que publica 1-2 piezas semanales.' },
      { title: 'Archivo de contenido', description: 'Cada torneo queda documentado en clips organizados y editados. Un recurso invaluable para el historial de la organización y para atraer nuevos jugadores y patrocinadores.' },
    ],
  },
  contentTypes: {
    title: 'Tipos de contenido que genera',
    items: [
      { icon: Gamepad2, label: 'Highlights de partidas', description: 'Momentos clave automáticos de partidas completas' },
      { icon: Users, label: 'POV de jugadores estrella', description: 'Las mejores jugadas individuales' },
      { icon: Video, label: 'Resúmenes de jornada', description: '30-90 segundos por partida' },
      { icon: Mic, label: 'Reacciones de casters', description: 'Momentos de emoción de casters y analistas' },
      { icon: Clapperboard, label: 'Behind the scenes', description: 'Clips de entrenamientos y camerinos' },
      { icon: CalendarDays, label: 'Teasers pre-evento', description: 'Clips de enfrentamientos próximos' },
    ],
  },
  metrics: [
    { value: '200+', label: 'Momentos clipables en un torneo de 8 horas' },
    { value: '$907.8M', label: 'Proyección del mercado esports LATAM para 2030' },
    { value: '44%', label: 'Del viewership de esports 2024 fue co-streaming' },
  ],
  plans: {
    title: 'Plan recomendado',
    items: [
      { name: 'Premium', price: 'S/.126/mes', description: 'Procesamiento prioritario + soporte WhatsApp.', highlighted: false },
      { name: 'Enterprise', price: 'Precio negociado', description: 'Clipero dedicado incluido. Ideal para organizaciones con múltiples jugadores y torneos.', highlighted: true },
    ],
  },
  bottomCTA: {
    title: 'Tus jugadores hacen plays increíbles todos los días. El mundo merece verlos.',
    subtitle: 'Hablemos de cómo Clipealo puede impulsar tu organización.',
    ctaText: 'Contactar al equipo de Clipealo',
    ctaHref: 'https://wa.me/51906160948?text=Hola%2C%20quiero%20saber%20m%C3%A1s%20sobre%20Clipealo%20para%20esports',
  },
};

const ComunidadesPage = () => <UseCasePageTemplate data={data} />;
export default ComunidadesPage;
