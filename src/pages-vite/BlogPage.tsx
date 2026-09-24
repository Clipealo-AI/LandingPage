import { useMemo, useState } from 'react';
import { ArrowRight, Calendar, Clock, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import marketing from '../../messages/es/marketing.json';
import { blogArticles } from '@/data/blogArticles';
import { appUrl } from '@/data/marketingNavigation';
import { trackLead } from '@/lib/tracking';

const categories = [marketing.blogPage.allCategories, ...new Set(blogArticles.map((article) => article.category))];

const AuthorAvatar = ({ initial }: { initial: string }) => (
  <span className="marketing-author-avatar" aria-hidden="true">{initial}</span>
);

const BlogPage = () => {
  const [activeCategory, setActiveCategory] = useState<string>(marketing.blogPage.allCategories);
  const filteredArticles = useMemo(() => activeCategory === marketing.blogPage.allCategories
    ? blogArticles
    : blogArticles.filter((article) => article.category === activeCategory), [activeCategory]);
  const featuredArticle = filteredArticles[0];
  const otherArticles = filteredArticles.slice(1);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SEOHead title={marketing.blogPage.metaTitle} description={marketing.blogPage.metaDescription} canonicalPath="/blog" />
      <Header />
      <section className="marketing-index-hero">
        <div className="reference-container">
          <p className="eyebrow">{marketing.routeMenu.resources}</p>
          <h1 className="display-font text-balance">{marketing.blogPage.title}</h1>
          <p className="marketing-index-lead">{marketing.blogPage.lead}</p>
        </div>
      </section>

      <section className="marketing-index-content reference-container" aria-label={marketing.routeMenu.resources}>
        <div className="marketing-blog-filters" role="group" aria-label={marketing.blogPage.allCategories}>
          <Search aria-hidden="true" />
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              aria-pressed={activeCategory === category}
              className={activeCategory === category ? 'marketing-blog-filter is-active' : 'marketing-blog-filter'}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {!featuredArticle ? (
          <p className="marketing-blog-empty">{marketing.blogPage.empty}</p>
        ) : (
          <>
            <Link to={`/blog/${featuredArticle.id}`} className="marketing-blog-featured">
              <div className="marketing-blog-featured-image">
                <img src={featuredArticle.cover} alt={marketing.blogPage.coverAlt.replace('{title}', featuredArticle.title)} loading="lazy" />
              </div>
              <div className="marketing-blog-featured-copy">
                <span className="marketing-blog-featured-label">{marketing.blogPage.featured}</span>
                <span className="marketing-blog-category">{featuredArticle.category}</span>
                <h2>{featuredArticle.title}</h2>
                <p>{featuredArticle.metaDescription}</p>
                <div className="marketing-blog-meta">
                  <AuthorAvatar initial={featuredArticle.author.initial} />
                  <span>{featuredArticle.author.name}</span>
                  <span className="marketing-blog-meta-item"><Calendar aria-hidden="true" />{featuredArticle.displayDate}</span>
                  <span className="marketing-blog-meta-item"><Clock aria-hidden="true" />{featuredArticle.readingTime}</span>
                </div>
                <span className="marketing-feature-more">{marketing.blogPage.readArticle}<ArrowRight aria-hidden="true" /></span>
              </div>
            </Link>

            {otherArticles.length > 0 && (
              <div className="marketing-blog-grid">
                {otherArticles.map((article) => (
                  <Link key={article.id} to={`/blog/${article.id}`} className="marketing-blog-card">
                    <div className="marketing-blog-card-image">
                      <img src={article.cover} alt={marketing.blogPage.coverAlt.replace('{title}', article.title)} loading="lazy" />
                    </div>
                    <div className="marketing-blog-card-copy">
                      <span className="marketing-blog-category">{article.category}</span>
                      <h2>{article.title}</h2>
                      <p>{article.metaDescription}</p>
                      <div className="marketing-blog-meta">
                        <AuthorAvatar initial={article.author.initial} />
                        <span>{article.author.name}</span>
                        <span className="marketing-blog-meta-item"><Clock aria-hidden="true" />{article.readingTime}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        <aside className="marketing-resource-cta">
          <h2>{marketing.blogPage.ctaTitle}</h2>
          <p>{marketing.blogPage.ctaLead}</p>
          <a href={appUrl} className="marketing-resource-cta-button" onClick={() => trackLead('Landing - CTA blog')}>
            {marketing.actions.upload}<ArrowRight aria-hidden="true" />
          </a>
        </aside>
      </section>
      <Footer />
    </main>
  );
};

export default BlogPage;
