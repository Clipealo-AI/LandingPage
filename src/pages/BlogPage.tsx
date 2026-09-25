import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { blogArticles, categoryColors, type BlogCategory } from '@/data/blogArticles';

const categories: Array<'Todos' | BlogCategory> = ['Todos', 'Buenas Prácticas', 'Por Qué Importa', 'Guía de Inicio'];

const AuthorAvatar = ({ initial }: { initial: string }) => (
  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
    style={{ background: 'linear-gradient(135deg, #FF2D78, #7C3AED)' }}>
    {initial}
  </div>
);

const BlogPage = () => {
  const [activeCategory, setActiveCategory] = useState<'Todos' | BlogCategory>('Todos');

  const filtered = useMemo(() => {
    if (activeCategory === 'Todos') return blogArticles;
    return blogArticles.filter(a => a.category === activeCategory);
  }, [activeCategory]);

  const featured = filtered[0];
  const grid = filtered.slice(1);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Blog — Guías y estrategias para cliperos y streamers"
        description="Guías, estrategias y casos reales para cliperos, streamers y creadores de contenido en LATAM. Aprende a clipear y crece más rápido."
        canonicalPath="/blog"
      />
      <Header />

      {/* Hero */}
      <section className="pt-28 pb-8 px-4">
        <div className="max-w-[1100px] mx-auto">
          <motion.h1
            className="text-3xl sm:text-4xl md:text-[38px] font-extrabold leading-[1.15] mb-4"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          >
            Aprende a clipear. <span className="text-primary">Crece más rápido.</span>
          </motion.h1>
          <motion.p
            className="text-muted-foreground text-base md:text-lg max-w-[480px] mb-8"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          >
            Guías, estrategias y casos reales para cliperos, streamers y creadores de contenido en LATAM.
          </motion.p>
        </div>
      </section>

      {/* Filters */}
      <section className="px-4 mb-10">
        <div className="max-w-[1100px] mx-auto flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 border shrink-0"
              style={
                activeCategory === cat
                  ? { background: '#FF2D78', borderColor: '#FF2D78', color: '#fff' }
                  : { background: 'transparent', borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }
              }
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      <div className="max-w-[1100px] mx-auto px-4 pb-20">
        {filtered.length === 0 ? (
          <p className="text-muted-foreground text-center py-20">Pronto publicaremos artículos en esta categoría.</p>
        ) : (
          <>
            {/* Featured */}
            {featured && (
              <Link to={`/blog/${featured.id}`} className="block mb-10">
                <motion.article
                  className="grid md:grid-cols-2 rounded-[14px] border overflow-hidden transition-all duration-300 hover:-translate-y-1"
                  style={{ borderColor: '#1a1a2e', background: '#111120', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                >
                  <div className="aspect-[4/3] md:aspect-auto overflow-hidden">
                    <img src={featured.cover} alt={featured.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-8 md:p-9 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: categoryColors[featured.category] + '22', color: categoryColors[featured.category] }}>
                        {featured.category}
                      </span>
                      <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ background: '#ffffff08', color: '#8888AA' }}>
                        Destacado
                      </span>
                    </div>
                    <h2 className="text-xl md:text-[22px] font-bold leading-[1.35] mb-5 text-foreground">
                      {featured.title}
                    </h2>
                    <div className="flex items-center gap-3">
                      <AuthorAvatar initial={featured.author.initial} />
                      <div>
                        <p className="text-sm font-medium text-foreground">{featured.author.name}</p>
                        <p className="text-[11px] text-muted-foreground">{featured.author.role} · {featured.date}</p>
                      </div>
                    </div>
                  </div>
                </motion.article>
              </Link>
            )}

            {/* Grid */}
            {grid.length > 0 && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {grid.map((article, i) => (
                  <Link to={`/blog/${article.id}`} key={article.id}>
                    <motion.article
                      className="rounded-xl border overflow-hidden transition-all duration-300 hover:-translate-y-1 h-full flex flex-col"
                      style={{ borderColor: '#1a1a2e', background: '#111120' }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * i }}
                    >
                      <div className="aspect-video overflow-hidden">
                        <img src={article.cover} alt={article.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <span className="text-[11px] font-semibold px-3 py-1 rounded-full self-start mb-3" style={{ background: categoryColors[article.category] + '22', color: categoryColors[article.category] }}>
                          {article.category}
                        </span>
                        <h3 className="text-[15px] font-bold leading-[1.4] text-foreground mb-4 flex-1">
                          {article.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-auto">
                          <AuthorAvatar initial={article.author.initial} />
                          <div>
                            <p className="text-xs font-medium text-foreground">{article.author.name}</p>
                            <p className="text-[10px] text-muted-foreground">{article.author.role} · {article.date}</p>
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* CTA Banner */}
        <motion.div
          className="mt-16 rounded-2xl p-10 md:p-12 text-center border"
          style={{
            background: 'linear-gradient(135deg, rgba(255,45,120,0.12), rgba(124,58,237,0.10))',
            borderColor: 'rgba(255,45,120,0.20)',
          }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl md:text-[26px] font-extrabold mb-3 text-foreground">
            ¿Listo para aplicar todo esto?
          </h2>
          <p className="text-muted-foreground text-[15px] mb-6">
            Procesa tu primer VOD gratis. Sin tarjeta. Sin setup.
          </p>
          <a
            href="https://app.clipealo-ai.com/?utm_source=landing_blog&utm_medium=cta"
            className="btn-cta inline-block text-base"
          >
            Empezar con Clipealo gratis →
          </a>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

export default BlogPage;
