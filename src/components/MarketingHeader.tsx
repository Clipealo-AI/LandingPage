import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronDown, Menu, Moon, Sun, UserRound, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from 'next-themes';
import marketing from '../../messages/es/marketing.json';
import { appUrl, marketingMenus } from '@/data/marketingNavigation';
import { trackLead } from '@/lib/tracking';

function BrandLink() {
  return (
    <Link to="/" aria-label={marketing.header.home} className="reference-brand">
      <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <g stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 4.75H7.5A2.75 2.75 0 0 0 4.75 7.5V13" />
          <path d="M4.75 19v5.5a2.75 2.75 0 0 0 2.75 2.75H13" />
          <path d="M19 27.25h5.5a2.75 2.75 0 0 0 2.75-2.75V19" />
        </g>
        <rect className="reference-brand-accent" x="18" y="4" width="10" height="10" rx="3" />
      </svg>
      <span>Clipealo</span>
    </Link>
  );
}

const MarketingHeader = () => {
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const location = useLocation();
  const wrapper = useRef<HTMLElement>(null);

  useEffect(() => {
    setMobileOpen(false);
    setActiveMenu(null);
  }, [location.pathname]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
        setActiveMenu(null);
      }
    };
    const onPointerDown = (event: MouseEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setActiveMenu(null);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, []);

  const switchThemeLabel = theme === 'dark' ? marketing.header.switchToLight : marketing.header.switchToDark;
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');
  const closeMenus = () => {
    setActiveMenu(null);
    setMobileOpen(false);
  };

  const uploadLink = (source: string) => (
    <a className="reference-upload" href={appUrl} onClick={() => trackLead(source)}>
      {marketing.actions.upload} <ArrowRight aria-hidden="true" />
    </a>
  );

  return (
    <header ref={wrapper} className="reference-header">
      <div className="reference-header-inner reference-container">
        <BrandLink />
        <nav className="reference-nav" aria-label={marketing.header.mainNav}>
          {marketingMenus.map((menu) => (
            <button
              key={menu.key}
              type="button"
              aria-expanded={activeMenu === menu.key}
              aria-controls={`reference-menu-${menu.key}`}
              onClick={() => setActiveMenu((open) => (open === menu.key ? null : menu.key))}
            >
              {menu.label} <ChevronDown className={activeMenu === menu.key ? 'is-open' : ''} aria-hidden="true" />
            </button>
          ))}
          <Link to="/precios" onClick={closeMenus}>{marketing.nav.pricing}</Link>
        </nav>
        <div className="reference-actions">
          <button type="button" className="reference-icon-button" aria-label={switchThemeLabel} title={switchThemeLabel} onClick={toggleTheme}>
            {theme === 'dark' ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
          </button>
          <a className="reference-icon-button reference-login" href={appUrl} aria-label={marketing.header.login} title={marketing.header.login}>
            <UserRound aria-hidden="true" />
          </a>
          {uploadLink('Header - Subir un video')}
        </div>
        <button
          className="reference-menu-toggle"
          type="button"
          aria-label={mobileOpen ? marketing.header.closeMenu : marketing.header.openMenu}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>
      {activeMenu && marketingMenus.map((menu) => menu.key === activeMenu && (
        <div key={menu.key} id={`reference-menu-${menu.key}`} className="reference-dropdown" role="region" aria-label={menu.label}>
          <div className="reference-dropdown-grid">
            {menu.items.map(({ icon: Icon, label, description, href, ...item }) => {
              const external = 'external' in item && item.external;
              const className = 'reference-dropdown-link';
              const content = <><Icon aria-hidden="true" /><span><strong>{label}</strong><small>{description}</small></span></>;
              return external ? (
                <a className={className} href={href} key={href} target="_blank" rel="noopener noreferrer" onClick={() => setActiveMenu(null)}>{content}</a>
              ) : (
                <Link className={className} to={href} key={href} onClick={() => setActiveMenu(null)}>{content}</Link>
              );
            })}
          </div>
        </div>
      ))}
      {mobileOpen && (
        <nav className="reference-mobile-menu" aria-label={marketing.header.mobileNav}>
          {marketingMenus.map((menu) => (
            <details key={menu.key}>
              <summary>{menu.label}</summary>
              {menu.items.map(({ label, href, ...item }) => {
                const external = 'external' in item && item.external;
                return external ? (
                  <a key={href} href={href} target="_blank" rel="noopener noreferrer" onClick={closeMenus}>{label}</a>
                ) : (
                  <Link key={href} to={href} onClick={closeMenus}>{label}</Link>
                );
              })}
            </details>
          ))}
          <Link to="/precios" onClick={closeMenus}>{marketing.nav.pricing}</Link>
          <a href={appUrl} onClick={closeMenus}>{marketing.header.login}</a>
          <button type="button" className="reference-theme-mobile" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}{switchThemeLabel}
          </button>
          {uploadLink('Header móvil - Subir un video')}
        </nav>
      )}
    </header>
  );
};

export default MarketingHeader;
