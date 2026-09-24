import { Link } from 'react-router-dom';
import marketing from '../../messages/es/marketing.json';
import BrandLogo from '@/components/BrandLogo';
import { footerColumns } from '@/data/marketingNavigation';

const Footer = () => {
  const copyright = marketing.footer.copyright
    .replace('{year}', String(new Date().getFullYear()))
    .replace('{name}', 'Clipealo');

  return (
    <footer className="reference-footer">
      <div className="reference-footer-main reference-container">
        <div className="reference-footer-brand">
          <BrandLogo light />
          <p>{marketing.footer.tagline}</p>
        </div>
        <nav className="reference-footer-links" aria-label={marketing.header.mainNav}>
          {footerColumns.map((column) => (
            <section key={column.key} aria-label={column.label}>
              <h2>{column.label}</h2>
              <ul>
                {column.links.map((link) => (
                  <li key={link.href}>
                    {'external' in link && link.external ? (
                      <a href={link.href}>{link.label}</a>
                    ) : (
                      <Link to={link.href}>{link.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>
      </div>
      <div className="reference-footer-bottom reference-container">
        <p>{copyright}</p>
        <p>{marketing.claim}</p>
      </div>
    </footer>
  );
};

export default Footer;
