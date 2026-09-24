import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronDown, Menu, Moon, Sun, UserRound, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from 'next-themes';
import marketing from '../../messages/es/marketing.json';
import { appUrl, marketingMenus, resourceItems } from '@/data/marketingNavigation';
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

function DiscordMark() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.3698a19.7913 19.7913 0 0 0-4.8851-1.5152.0741.0741 0 0 0-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 0 0-.0785-.037 19.7363 19.7363 0 0 0-4.8852 1.515.0699.0699 0 0 0-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 0 0 .0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 0 0 .0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 0 0-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 0 1-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 0 1 .0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 0 1 .0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 0 1-.0066.1276 12.2986 12.2986 0 0 1-1.873.8914.076.076 0 0 0-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 0 0 .0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 0 0 .0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 0 0-.0312-.0286ZM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189Zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
    </svg>
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
          <a className="reference-icon-button" href={resourceItems[0].href} aria-label={marketing.header.discord} title={marketing.header.discord} target="_blank" rel="noopener noreferrer">
            <DiscordMark />
          </a>
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
          <a className="reference-mobile-discord" href={resourceItems[0].href} aria-label={marketing.header.discord} title={marketing.header.discord} target="_blank" rel="noopener noreferrer" onClick={closeMenus}>
            <DiscordMark />
          </a>
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
