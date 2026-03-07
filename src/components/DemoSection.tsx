import { motion } from 'framer-motion';
import { Scissors, Captions, Maximize, LayoutGrid, AudioLines, Search, TrendingUp, FileText } from 'lucide-react';
import demoGif from '@/assets/demo-preview.gif';

const features = [
  { icon: Scissors, label: 'Clips automáticos', color: 'text-pink' },
  { icon: Captions, label: 'Subtítulos con IA', color: 'text-cyan' },
  { icon: Maximize, label: 'Reencuadre automático', color: 'text-purple' },
  { icon: TrendingUp, label: 'Score de viralidad', color: 'text-pink' },
  { icon: AudioLines, label: 'Detección LATAM', color: 'text-blue' },
  { icon: FileText, label: 'Título y descripción con IA', color: 'text-cyan' },
  { icon: LayoutGrid, label: 'Gestión de proyectos', color: 'text-purple' },
  { icon: Search, label: 'Búsqueda inteligente', color: 'text-blue' },
];

const DemoSection = () => {
  return (
    <section className="relative py-16 px-4 overflow-hidden">
      <div className="relative z-10 max-w-5xl mx-auto">
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

        {/* Feature Chips */}
        <motion.div
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex flex-wrap justify-center gap-3 mt-10"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={false}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + index * 0.05 }}
              className="flex items-center gap-2 bg-card/60 border border-border rounded-full px-4 py-2 text-sm text-muted-foreground hover:border-cyan/40 hover:text-foreground transition-colors"
            >
              <feature.icon className={`w-4 h-4 ${feature.color}`} />
              <span>{feature.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default DemoSection;
