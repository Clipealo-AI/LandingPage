import { Scissors, Clock, Users, Gamepad2, MessageCircle, Camera, Music, Swords, Search } from 'lucide-react';
import UseCasePageTemplate, { type UseCasePageData } from '@/components/use-cases/UseCasePageTemplate';
import heroImage from '@/assets/use-case-cliperos.jpg';

const data: UseCasePageData = {
  hero: {
    emoji: '🎬',
    tagline: 'LA HERRAMIENTA #1 PARA CLIPEROS EN LATAM',
    title: 'Trabaja 10x más rápido. Gana 10x más.',
    description: 'Clipealo detecta automáticamente los mejores momentos del stream. Tú haces la magia creativa. La IA hace el trabajo pesado.',
    ctaText: 'Empieza gratis — 30 minutos incluidos',
    ctaHref: '/precios',
    image: heroImage,
  },
  problem: {
    title: 'El problema que ningún clipero debería tener',
    subtitle: 'Mirar 4-8 horas de stream para encontrar 3 momentos buenos no escala.',
    description: 'Si quieres servir a 5 streamers, necesitas 40 horas semanales solo en revisar VODs. Eso no es un negocio — es un trabajo de tiempo completo sin pagar el tiempo de análisis.',
  },
  solution: {
    title: 'Lo que cambia con Clipealo',
    steps: [
      { title: 'De 4 horas de VOD a clips listos en minutos', description: 'Pega el link del VOD. Clipealo analiza el audio, detecta los momentos de mayor energía, reconoce la cara del streamer y genera los mejores clips automáticamente. Tú revisas, ajustas y publicas.' },
      { title: 'Sirve a más streamers con el mismo tiempo', description: 'Un clipero promedio puede manejar 1-2 streamers en paralelo de forma manual. Con Clipealo, el análisis de VODs se automatiza y puedes escalar a 5-10 streamers simultáneamente sin sacrificar calidad.' },
      { title: 'Sube el valor que ofreces', description: 'Cuando la IA detecta los clips base, tú te enfocas en lo que realmente vale: el criterio creativo, la edición de calidad, el conocimiento del streamer y su audiencia. Eso es lo que justifica cobrar más.' },
    ],
  },
  contentTypes: {
    title: 'Tipos de contenido que procesa',
    items: [
      { icon: Gamepad2, label: 'Streams de gaming', description: 'Kills, clutch, fails épicos' },
      { icon: MessageCircle, label: 'Just Chatting', description: 'Historias, debates, momentos virales' },
      { icon: Camera, label: 'IRL', description: 'Reacciones en calle, eventos, momentos inesperados' },
      { icon: Music, label: 'Streams de música', description: 'Mejores canciones, reacciones del chat' },
      { icon: Swords, label: 'Debates y opiniones', description: 'Frases punzantes, confrontaciones' },
      { icon: Search, label: 'Reacciones', description: 'Momentos de sorpresa, shock, humor' },
    ],
  },
  platforms: {
    title: 'Plataformas soportadas',
    items: [
      { name: 'YouTube', note: 'Disponible en todos los planes' },
      { name: 'Twitch', note: 'Desde plan Básico' },
      { name: 'Kick', note: 'Desde plan Estándar' },
      { name: 'Subida manual', note: 'Disponible en todos los planes' },
    ],
  },
  metrics: [
    { value: '4h → 15min', label: 'Tiempo de análisis de un VOD de 2 horas' },
    { value: '5-10x', label: 'Más streamers que puedes atender en paralelo' },
    { value: 'S/5.50/hora', label: 'Costo de recarga de horas adicionales' },
  ],
  bottomCTA: {
    title: 'Empieza hoy. Tus primeros 30 minutos son gratis.',
    subtitle: 'Sin tarjeta de crédito. Sin setup técnico. Solo pega el link y ve cómo funciona.',
    ctaText: 'Crear mi cuenta gratis',
    ctaHref: '/precios',
  },
};

const CliperosPage = () => <UseCasePageTemplate data={data} />;
export default CliperosPage;
