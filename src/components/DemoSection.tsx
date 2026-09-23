import { Captions, Download, FolderOpen, Globe, Palette, Scissors, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [
  { icon: Scissors, title: 'Clips automáticos con IA', description: 'Pega el link o sube tu video. La IA detecta los mejores momentos, corta con precisión y genera clips listos para publicar sin edición manual.', href: '/funciones/clips-automaticos-con-ia', accent: 'orange' },
  { icon: Captions, title: 'Editor de subtítulos y estilos', description: 'Personaliza fuentes, colores, animaciones y posición. Subtítulos sincronizados automáticamente. Sin edición manual frame por frame.', href: '/funciones/editor-subtitulos-estilos', accent: 'blue' },
  { icon: Download, title: 'Exportación en masa', description: 'Descarga todos tus clips de un proyecto en un solo clic. Ahorra horas de trabajo cuando gestionas múltiples videos o clientes.', href: '/funciones/exportacion-en-masa', accent: 'teal' },
  { icon: Palette, title: 'Plantillas de marca', description: 'Configura las plantillas visuales de cada cliente con sus colores, fuentes y estilo. Aplícalas a todos sus clips en segundos.', href: '/funciones/plantillas-de-marca', accent: 'orange' },
  { icon: FolderOpen, title: 'Gestión de proyectos y carpetas', description: 'Organiza todos tus videos y clips por proyecto, cliente o campaña. Encuentra cualquier entrega en segundos.', href: '/funciones/gestion-proyectos-carpetas', accent: 'blue' },
  { icon: Smartphone, title: 'Exporta en 2 formatos', description: '16:9 para YouTube y Twitch. 9:16 para TikTok, Reels y Shorts. Reencuadre automático en 1 clic.', href: '/funciones/exporta-dos-formatos', accent: 'teal' },
  { icon: Globe, title: 'Entrenada en contenido LATAM', description: 'Detecta momentos virales en español. Entiende jerga local, contexto cultural y ritmo del contenido latino.', href: '/funciones/ia-entrenada-contenido-latam', accent: 'blue' },
];

const DemoSection = () => (
  <section id="funciones" className="brand-section bg-background">
    <div className="brand-container">
      <header className="mx-auto mb-12 max-w-3xl text-center">
        <p className="eyebrow mb-4">Una herramienta, todo el flujo</p>
        <h2 className="section-title text-balance">De video largo a contenido listo para publicar</h2>
        <p className="section-description mt-5">Conserva el control creativo y deja que Clipealo se encargue del trabajo repetitivo.</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon: Icon, title, description, href, accent }) => (
          <Link to={href} key={href} className="brand-card group flex min-h-52 flex-col p-6 transition duration-200 hover:-translate-y-1 hover:border-primary/35">
            <span className={`mb-5 grid h-11 w-11 place-items-center rounded-xl ${accent === 'orange' ? 'bg-[#fff0e9] text-[#e44b0d]' : accent === 'teal' ? 'bg-[#e4f8f6] text-[#008b83]' : 'bg-[#eaf1ff] text-[#1472fd]'}`}><Icon size={21} /></span>
            <h3 className="text-lg font-bold tracking-tight">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

export default DemoSection;
