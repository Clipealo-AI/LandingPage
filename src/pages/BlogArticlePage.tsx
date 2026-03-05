import { useParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { blogArticles, categoryColors } from '@/data/blogArticles';

const AuthorAvatar = ({ initial }: { initial: string }) => (
  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
    style={{ background: 'linear-gradient(135deg, #FF2D78, #7C3AED)' }}>
    {initial}
  </div>
);

const renderContent = (text: string) => {
  if (text.startsWith('## ')) {
    return <h2 className="text-xl md:text-2xl font-bold text-foreground mt-10 mb-4">{text.replace('## ', '')}</h2>;
  }

  // Process markdown-like formatting
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  const rendered = parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-foreground font-semibold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });

  if (text.startsWith('- ')) {
    const items = text.split('\n').filter(Boolean);
    return (
      <ul className="space-y-2 my-4">
        {items.map((item, i) => {
          const content = item.replace(/^- /, '');
          const itemParts = content.split(/(\*\*[^*]+\*\*)/g);
          return (
            <li key={i} className="flex gap-2 text-muted-foreground leading-relaxed">
              <span className="text-primary mt-1.5 shrink-0">•</span>
              <span>
                {itemParts.map((p, j) =>
                  p.startsWith('**') && p.endsWith('**')
                    ? <strong key={j} className="text-foreground font-semibold">{p.slice(2, -2)}</strong>
                    : p
                )}
              </span>
            </li>
          );
        })}
      </ul>
    );
  }

  return <p className="text-muted-foreground leading-relaxed my-4 whitespace-pre-line">{rendered}</p>;
};

const BlogArticlePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const article = blogArticles.find(a => a.id === slug);

  if (!article) return <Navigate to="/blog" replace />;

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.metaDescription,
    image: typeof article.cover === 'string' ? article.cover : undefined,
    author: { '@type': 'Person', name: article.author.name },
    publisher: { '@type': 'Organization', name: 'Clipealo', logo: { '@type': 'ImageObject', url: 'https://www.clipealo-ai.com/favicon.png' } },
    datePublished: article.date,
    mainEntityOfPage: `https://www.clipealo-ai.com/blog/${article.id}`,
    inLanguage: 'es',
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={article.title}
        description={article.metaDescription}
        canonicalPath={`/blog/${article.id}`}
        type="article"
        jsonLd={articleJsonLd}
      />
      <Header />

      <article className="pt-28 pb-20 px-4">
        <div className="max-w-[720px] mx-auto">
          {/* Back */}
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Volver al blog
          </Link>

          {/* Category & Reading Time */}
          <div className="flex items-center gap-3 mb-5">
            <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: categoryColors[article.category] + '22', color: categoryColors[article.category] }}>
              {article.category}
            </span>
            <span className="text-xs text-muted-foreground">{article.readingTime} lectura</span>
          </div>

          {/* Title */}
          <motion.h1
            className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight mb-6 text-foreground"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          >
            {article.title}
          </motion.h1>

          {/* Author */}
          <div className="flex items-center gap-3 mb-8 pb-8 border-b border-border">
            <AuthorAvatar initial={article.author.initial} />
            <div>
              <p className="text-sm font-medium text-foreground">{article.author.name}</p>
              <p className="text-xs text-muted-foreground">{article.author.role} · {article.date}</p>
            </div>
          </div>

          {/* Cover */}
          <motion.div
            className="rounded-xl overflow-hidden mb-10"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          >
            <img src={article.cover} alt={article.title} className="w-full" />
          </motion.div>

          {/* Content */}
          <motion.div
            className="prose-custom"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          >
            {article.content.map((block, i) => (
              <div key={i}>{renderContent(block)}</div>
            ))}
          </motion.div>

          {/* CTA */}
          <div className="mt-12 rounded-2xl p-8 text-center border" style={{
            background: 'linear-gradient(135deg, rgba(255,45,120,0.12), rgba(124,58,237,0.10))',
            borderColor: 'rgba(255,45,120,0.20)',
          }}>
            <p className="text-lg font-bold text-foreground mb-2">¿Listo para probarlo?</p>
            <p className="text-sm text-muted-foreground mb-5">Clipealo detecta automáticamente los mejores momentos de tus VODs. 60 minutos gratis.</p>
            <a href="/#waitlist" className="btn-cta inline-block text-base">
              Empezar gratis →
            </a>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
};

export default BlogArticlePage;
