import { motion } from 'framer-motion';
import { Scissors, Captions, Download, Palette, FolderOpen, Smartphone, Globe } from 'lucide-react';
import demoGif from '@/assets/demo-preview.gif';

const features = [
  {
    icon: Scissors,
    title: 'Clips automáticos con IA',
    description: 'Pega el link o sube tu video. La IA detecta los mejores momentos, corta con precisión y genera clips listos para publicar sin edición manual.',
    color: 'text-pink',
  },
  {
    icon: Captions,
    title: 'Editor de subtítulos y estilos',
    description: 'Personaliza fuentes, colores, animaciones y posición. Subtítulos sincronizados automáticamente. Sin edición manual frame por frame.',
    color: 'text-cyan',
  },
  {
    icon: Download,
    title: 'Exportación en masa',
    description: 'Descarga todos tus clips de un proyecto en un solo clic. Ahorra horas de trabajo cuando gestionas múltiples videos o clientes.',
    color: 'text-purple',
  },
  {
    icon: Palette,
    title: 'Plantillas de marca',
    description: 'Configura las plantillas visuales de cada cliente con sus colores, fuentes y estilo. Aplícalas a todos sus clips en segundos.',
    color: 'text-pink',
  },
  {
    icon: FolderOpen,
    title: 'Gestión de proyectos y carpetas',
    description: 'Organiza todos tus videos y clips por proyecto, cliente o campaña. Encuentra cualquier entrega en segundos.',
    color: 'text-cyan',
  },
  {
    icon: Smartphone,
    title: 'Exporta en 2 formatos',
    description: '16:9 para YouTube y Twitch. 9:16 para TikTok, Reels y Shorts. Reencuadre automático en 1 clic.',
    color: 'text-purple',
  },
  {
    icon: Globe,
    title: 'Entrenada en contenido LATAM',
    description: 'Detecta momentos virales en español. Entiende jerga local, contexto cultural y ritmo del contenido latino.',
    color: 'text-blue',
  },
];

const DemoSection = () => {
  return (
    <section className="relative py-16 px-4 overflow-hidden">
      <div className="relative z-10 max-w-5xl mx-auto">
        <h2 className="sr-only">Funciones para crear clips con IA</h2>

        {/* GIF Preview */}
        <motion.div
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-2xl overflow-hidden border border-border bg-card shadow-[0_0_60px_rgba(0,0,0,0.5)]"
        >
          <img
            src={demoGif}
            alt="Clipealo demo - convierte streams en clips virales"
            className="w-full h-auto"
            loading="lazy"
          />
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-14"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={false}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + index * 0.05 }}
              className="flex flex-col gap-3 bg-card/60 border border-border rounded-2xl p-6 hover:border-primary/30 transition-colors"
            >
              <feature.icon className={`w-6 h-6 ${feature.color}`} />
              <h3 className="text-base font-semibold text-foreground">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default DemoSection;
