import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import marketing from '../../messages/es/marketing.json';
import { blogArticles } from '@/data/blogArticles';
import { appUrl } from '@/data/marketingNavigation';
import { trackLead } from '@/lib/tracking';

const AuthorAvatar = ({ initial }: { initial: string }) => (
  <span className="marketing-author-avatar" aria-hidden="true">{initial}</span>
);

const renderInline = (text: string) => text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => (
  part.startsWith('**') && part.endsWith('**')
    ? <strong key={index} className="text-foreground font-semibold">{part.slice(2, -2)}</strong>
    : part
));

const renderContent = (text: string) => {
  if (text.startsWith('## ')) {
    return <h2 className="text-xl md:text-2xl font-bold text-foreground mt-10 mb-4">{text.slice(3)}</h2>;
  }
  if (text.startsWith('- ')) {
    return (
      <ul className="space-y-2 my-4">
        {text.split('\n').filter(Boolean).map((item, index) => (
          <li key={index} className="flex gap-2 text-muted-foreground leading-relaxed">
            <span className="text-primary mt-1.5 shrink-0" aria-hidden="true">•</span>
            <span>{renderInline(item.replace(/^- /, ''))}</span>
          </li>
        ))}
      </ul>
    );
  }
  return <p className="text-muted-foreground leading-relaxed my-4 whitespace-pre-line">{renderInline(text)}</p>;
};

const BlogArticlePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const article = blogArticles.find((item) => item.id === slug);

  if (!article) return <Navigate to="/blog" replace />;

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.metaDescription,
    image: article.cover,
    author: { '@type': 'Person', name: article.author.name },
    publisher: { '@type': 'Organization', name: 'Clipealo', logo: { '@type': 'ImageObject', url: 'https://www.clipealo-ai.com/clipealo-icon.svg' } },
    datePublished: article.isoDate,
    dateModified: article.modifiedDate,
    mainEntityOfPage: `https://www.clipealo-ai.com/blog/${article.id}`,
    inLanguage: 'es',
  };
  const faqJsonLd = article.faqs?.length ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: article.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  } : null;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SEOHead
        title={article.title}
        description={article.metaDescription}
        ogImage={article.cover}
        canonicalPath={`/blog/${article.id}`}
        type="article"
        jsonLd={articleJsonLd}
        publishedTime={article.isoDate}
        modifiedTime={article.modifiedDate}
      />
      {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}
      <Header />

      <article className="marketing-article">
        <div className="marketing-article-content">
          <Link to="/blog" className="marketing-article-back"><ArrowLeft aria-hidden="true" />{marketing.blogPage.back}</Link>
          <div className="marketing-article-date"><Calendar aria-hidden="true" /><time dateTime={article.isoDate}>{marketing.blogPage.published.replace('{date}', article.displayDate)}</time></div>
          <div className="marketing-article-tags">
            <span className="marketing-blog-category">{article.category}</span>
            <span>{marketing.blogPage.readingTime.replace('{minutes}', article.readingTime.replace(/\s*min$/, ''))}</span>
          </div>
          <h1>{article.title}</h1>
          <div className="marketing-article-author">
            <AuthorAvatar initial={article.author.initial} />
            <div>
              <p>{article.author.name}</p>
              <span>{article.author.role} · {article.date}</span>
            </div>
          </div>
          <div className="marketing-article-cover">
            <img src={article.cover} alt={marketing.blogPage.coverAlt.replace('{title}', article.title)} />
          </div>
          <div className="prose-custom">
            {article.content.map((block, index) => <div key={index}>{renderContent(block)}</div>)}
          </div>

          {article.internalLinks.length > 0 && (
            <aside className="marketing-article-related">
              <h2>{marketing.blogPage.related}</h2>
              <ul>
                {article.internalLinks.map((item) => <li key={item.href}><Link to={item.href}>{item.label}</Link></li>)}
              </ul>
            </aside>
          )}

          <aside className="marketing-resource-cta">
            <h2>{marketing.blogPage.articleCtaTitle}</h2>
            <p>{marketing.blogPage.articleCtaLead}</p>
            <a href={appUrl} className="marketing-resource-cta-button" onClick={() => trackLead('Landing - CTA artículo blog')}>
              {marketing.actions.upload}<ArrowLeft className="rotate-180" aria-hidden="true" />
            </a>
          </aside>
        </div>
      </article>
      <Footer />
    </main>
  );
};

export default BlogArticlePage;
