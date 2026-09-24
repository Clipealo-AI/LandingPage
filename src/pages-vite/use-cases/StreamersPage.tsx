import { Gamepad2, MessageCircle, Camera, Music, Trophy, Sparkles } from 'lucide-react';
import UseCasePageTemplate, { type UseCasePageData } from '@/components/use-cases/UseCasePageTemplate';
import heroImage from '@/assets/use-case-streamers.jpg';

const data: UseCasePageData = {
  hero: {
    emoji: '🚀',
    tagline: 'PARA STREAMERS DE TWITCH, YOUTUBE Y KICK',
    title: 'Tu stream dura 4 horas. Tus clips duran para siempre.',
    description: 'Clipealo convierte automáticamente tus mejores momentos en clips virales para TikTok, Reels y Shorts. Sin editar. Sin contratar. Sin perder tiempo.',
    ctaText: 'Pruébalo gratis con tu primer VOD',
    ctaHref: '/precios',
    image: heroImage,
  },
  problem: {
    title: 'Transmites horas. Publicas nada.',
    subtitle: 'El 83% de los streamers abandona en los primeros 6 meses.',
    description: 'La razón más común no es falta de talento — es el agotamiento de hacer stream + editar clips + publicar en redes todos los días. La IA puede quitarte la parte más pesada.',
  },
  solution: {
    title: 'Cómo funciona',
    steps: [
      { title: 'Pega el link de tu VOD', description: 'YouTube, Twitch, Kick o sube el archivo directamente. Sin configuración técnica.' },
      { title: 'La IA encuentra tus mejores momentos', description: 'Analizamos el audio, detectamos tu cara, identificamos los momentos de mayor energía en tu stream. Obtienes clips con título, descripción y la razón por la que ese clip puede ser viral.' },
      { title: 'Descarga y publica', description: 'Clips listos para TikTok, Reels y Shorts. Con o sin marca de agua según tu plan.' },
    ],
  },
  highlight: {
    title: 'Tu diferencial: la razón del clip',
    description: 'No solo te decimos cuál es el clip — te explicamos POR QUÉ ese momento tiene potencial viral. Qué emoción activa, qué tipo de audiencia atrae, y qué lo hace diferente. Eso no lo hace ningún otro tool del mercado.',
  },
  contentTypes: {
    title: 'Tipos de stream que procesa',
    items: [
      { icon: Gamepad2, label: 'Gaming (FPS, MOBA, Battle Royale, RPG)', description: 'Kills épicos, clutch plays, fails memorables' },
      { icon: MessageCircle, label: 'Just Chatting', description: 'Historias, reacciones, debates' },
      { icon: Camera, label: 'IRL', description: 'Calle, viajes, eventos, reacciones' },
      { icon: Music, label: 'Música en vivo', description: 'Covers, sesiones, momentos emotivos' },
      { icon: Trophy, label: 'Deportes y competencias', description: 'Highlights y jugadas clave' },
      { icon: Sparkles, label: 'Varieté y entretenimiento', description: 'Humor, sorpresas, contenido general' },
    ],
  },
  metrics: [
    { value: '10h/sem', label: 'Que recuperas sin editar clips manualmente' },
    { value: '15 créditos/h', label: 'De análisis IA incluidos en todos los planes' },
    { value: '3 plataformas', label: 'YouTube, Twitch y Kick según tu plan' },
  ],
  plans: {
    title: 'Planes para streamers',
    items: [
      { name: 'Básico', price: 'S/45/mes', description: 'Incluye Twitch y YouTube. 5h de análisis/mes.', highlighted: false },
      { name: 'Estándar', price: 'S/90/mes', description: 'Suma Kick. 10h de análisis/mes.', highlighted: true },
      { name: 'Premium', price: 'S/180/mes', description: 'Para streamers de alto volumen. Prioridad máxima.', highlighted: false },
    ],
  },
  bottomCTA: {
    title: 'Deja de perder el contenido que ya creaste.',
    subtitle: 'Cada hora de stream que no se convierte en clip es una oportunidad perdida de crecimiento.',
    ctaText: 'Empezar gratis ahora',
    ctaHref: '/precios',
  },
};

const StreamersPage = () => <UseCasePageTemplate data={data} />;
export default StreamersPage;
