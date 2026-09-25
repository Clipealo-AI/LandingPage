import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Type, Download, Palette, FolderOpen, Smartphone, Globe } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';

const features = [
  {
    slug: 'clips-automaticos-con-ia',
    title: 'Clips automáticos con IA',
    description: 'Pega el link o sube tu video. La IA procesa en 5 minutos y genera hasta 10 clips listos para publicar.',
    icon: Zap,
    color: 'text-[hsl(var(--color-pink))]',
  },
  {
    slug: 'editor-subtitulos-estilos',
    title: 'Editor de subtítulos y estilos',
    description: 'Personaliza fuentes, colores, animaciones y posición de subtítulos automáticos sincronizados.',
    icon: Type,
    color: 'text-[hsl(var(--color-purple))]',
  },
  {
    slug: 'exportacion-en-masa',
    title: 'Exportación en masa',
    description: 'Descarga todos los clips de un proyecto en un solo clic, ya formateados para cada plataforma.',
    icon: Download,
    color: 'text-[hsl(var(--color-cyan))]',
  },
  {
    slug: 'plantillas-de-marca',
    title: 'Plantillas de marca',
    description: 'Configura plantillas visuales por cliente con colores, fuentes y estilo de subtítulos.',
    icon: Palette,
    color: 'text-[hsl(var(--color-pink))]',
  },
  {
    slug: 'gestion-proyectos-carpetas',
    title: 'Gestión de proyectos y carpetas',
    description: 'Organiza videos y clips por proyecto, cliente o campaña. Encuentra cualquier entrega en segundos.',
    icon: FolderOpen,
    color: 'text-[hsl(var(--color-purple))]',
  },
  {
    slug: 'exporta-dos-formatos',
    title: 'Exporta en 2 formatos',
    description: '16:9 para YouTube y Twitch, 9:16 para TikTok, Reels y Shorts. Reencuadre automático.',
    icon: Smartphone,
    color: 'text-[hsl(var(--color-cyan))]',
  },
  {
    slug: 'ia-entrenada-contenido-latam',
    title: 'IA entrenada en contenido LATAM',
    description: 'Entiende jerga local, contexto cultural y ritmo del contenido de creadores latinoamericanos.',
    icon: Globe,
    color: 'text-[hsl(var(--color-pink))]',
  },
];

const FeaturesIndexPage = () => {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="Funciones — Clipealo"
        description="Funciones de Clipealo: clips con IA, editor de subtítulos, plantillas de marca, exportación en masa y más. Para agencias y cliperos en LATAM."
        canonicalPath="/funciones"
      />
      <Header />

      <section className="pt-28 pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground mb-6">
              Todas las funciones de Clipealo
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Cada video se procesa en 5 minutos y genera hasta 10 clips listos para publicar. Sin edición manual.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                >
                  <Link
                    to={`/funciones/${feature.slug}`}
                    className="block p-6 rounded-2xl border border-border bg-background hover:border-muted-foreground/30 transition-all group h-full"
                  >
                    <div className={`mb-4 ${feature.color}`}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground mb-2 group-hover:text-foreground/90">
                      {feature.title}
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/precios"
              className="inline-flex items-center px-8 py-3 bg-foreground text-background rounded-full font-semibold hover:bg-foreground/90 transition-colors"
            >
              Ver precios →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default FeaturesIndexPage;