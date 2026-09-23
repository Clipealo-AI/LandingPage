import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, ChevronDown, FileText, FolderOpen, Gamepad2, Globe, HelpCircle, Menu, MessageCircle, Palette, Search, Smartphone, Sun, Moon, Target, Users, Video, X, Zap } from 'lucide-react';
import { useTheme } from 'next-themes';
import BrandLogo from '@/components/BrandLogo';

const features = [
  { icon: Zap, label: 'Clips automáticos', description: 'La IA detecta momentos destacados y crea clips listos para publicar.', href: '/funciones/clips-automaticos-con-ia' },
  { icon: Target, label: 'Entrenada en contenido LATAM', description: 'Entiende el español latino, la jerga local y el contexto cultural.', href: '/funciones/ia-entrenada-contenido-latam' },
  { icon: MessageCircle, label: 'Editor de subtítulos', description: 'Personaliza fuentes, colores, animaciones y posición.', href: '/funciones/editor-subtitulos-estilos' },
  { icon: Smartphone, label: 'Exporta en 2 formatos', description: '16:9 y 9:16 con reencuadre automático.', href: '/funciones/exporta-dos-formatos' },
  { icon: Palette, label: 'Plantillas de marca', description: 'Aplica el branding de cada cliente en un clic.', href: '/funciones/plantillas-de-marca' },
  { icon: FolderOpen, label: 'Gestión de proyectos', description: 'Organiza videos y entregas por proyecto o cliente.', href: '/funciones/gestion-proyectos-carpetas' },
  { icon: Search, label: 'Exportación en masa', description: 'Descarga todos los clips de un proyecto juntos.', href: '/funciones/exportacion-en-masa' },
];
const useCases = [
  { icon: Video, label: 'Cliperos', description: 'Convierte momentos épicos en clips virales.', href: '/casos/cliperos' },
  { icon: Gamepad2, label: 'Streamers', description: 'Extrae los mejores momentos de tus streams.', href: '/casos/streamers' },
  { icon: MessageCircle, label: 'Podcasters', description: 'Convierte episodios largos en clips sociales.', href: '/casos/podcasters' },
  { icon: BookOpen, label: 'Coaches y educadores', description: 'Comparte clases y tutoriales como contenido corto.', href: '/casos/coaches' },
  { icon: Palette, label: 'Creadores de contenido', description: 'Lleva tus videos largos a todas tus redes.', href: '/casos/creadores' },
  { icon: Users, label: 'Comunidades y esports', description: 'Crea highlights de torneos y eventos.', href: '/casos/comunidades' },
  { icon: Globe, label: 'Agencias audiovisuales', description: 'Gestiona contenido de varios creadores.', href: '/casos/agencias' },
  { icon: Search, label: 'Marcas', description: 'Genera contenido a partir de streams patrocinados.', href: '/casos/marcas' },
];
const resources = [
  { icon: Users, label: 'Discord', description: 'Únete a la comunidad de creadores LATAM.', href: 'https://discord.com/invite/XjhXBtaK6A' },
  { icon: BookOpen, label: 'Blog', description: 'Guías para crear contenido y crecer.', href: '/blog' },
  { icon: HelpCircle, label: 'Preguntas frecuentes', description: 'Resolvemos tus dudas más comunes.', href: '/#faq' },
  { icon: FileText, label: 'Guías', description: 'Aprende a sacar más de Clipealo.', href: '/blog' },
];

type MenuKey = 'funcionalidades' | 'casos' | 'recursos';
const menus: Record<MenuKey, typeof features> = { funcionalidades: features, casos: useCases, recursos: resources };
const menuLabels: Record<MenuKey, string> = { funcionalidades: 'Funcionalidades', casos: 'Casos de uso', recursos: 'Recursos' };
const APP_URL = 'https://app.clipealo-ai.com';

const Header = () => {
  const [activeMenu, setActiveMenu] = useState<MenuKey | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const wrapperRef = useRef<HTMLElement>(null);
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const isDev = import.meta.env.VITE_DEPLOY_ENV === 'dev';
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    setActiveMenu(null);
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isDev) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 2500);
    fetch('https://backend.clipealo-ai.com/api/auth/check-session', { credentials: 'include', signal: controller.signal })
      .then((response) => response.json())
      .then((data) => setAuthenticated(data.authenticated === true))
      .catch(() => setAuthenticated(false))
      .finally(() => window.clearTimeout(timeout));
    return () => { controller.abort(); window.clearTimeout(timeout); };
  }, [isDev]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setActiveMenu(null);
    };
    const keydown = (event: KeyboardEvent) => { if (event.key === 'Escape') { setActiveMenu(null); setMobileOpen(false); } };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', keydown);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', keydown); };
  }, []);

  const goToApp = () => { window.location.href = authenticated ? `${APP_URL}/dashboard` : APP_URL; };
  const ThemeButton = ({ mobile = false }: { mobile?: boolean }) => (
    <button className="theme-toggle" aria-label={`Cambiar a tema ${theme === 'dark' ? 'claro' : 'oscuro'}`} title="Cambiar tema" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
      {mobile && <span className="sr-only">Cambiar tema</span>}
    </button>
  );

  return (
    <header ref={wrapperRef} className="site-header">
      <div className="header-inner">
        <BrandLogo />
        <nav className="header-nav" aria-label="Navegación principal">
          {(Object.keys(menus) as MenuKey[]).map((key) => (
            <div className="relative" key={key}>
              <button className="header-nav-link inline-flex items-center gap-1.5" aria-expanded={activeMenu === key} aria-controls={`menu-${key}`} onClick={() => setActiveMenu(activeMenu === key ? null : key)}>
                {menuLabels[key]} <ChevronDown size={15} className={activeMenu === key ? 'rotate-180 transition-transform' : 'transition-transform'} />
              </button>
              {activeMenu === key && (
                <div id={`menu-${key}`} className="header-dropdown" role="region" aria-label={menuLabels[key]}>
                  <div className="header-dropdown-grid">
                    {menus[key].map(({ icon: Icon, label, description, href }) => (
                      <Link key={href} className="header-dropdown-link" to={href} onClick={() => setActiveMenu(null)}>
                        <Icon size={19} aria-hidden="true" />
                        <span><strong>{label}</strong><small>{description}</small></span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          <Link className="header-nav-link" to="/precios">Precios</Link>
        </nav>
        <div className="header-desktop-actions flex items-center gap-3">
          <ThemeButton />
          <a href="https://discord.com/invite/XjhXBtaK6A" className="header-nav-link">Discord</a>
          <button className="brand-button" onClick={goToApp}>{authenticated ? 'Mi panel' : 'Iniciar sesión'}</button>
        </div>
        <button className="menu-toggle md:hidden" aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>
      {mobileOpen && (
        <nav className="mobile-menu" aria-label="Navegación móvil">
          {(['funcionalidades', 'casos', 'recursos'] as MenuKey[]).map((key) => (
            <details key={key}>
              <summary>{menuLabels[key]}</summary>
              {menus[key].map(({ label, href }) => <Link key={href} to={href}>{label}</Link>)}
            </details>
          ))}
          <Link to="/precios">Precios</Link>
          <Link to="/blog">Blog</Link>
          <Link to="https://discord.com/invite/XjhXBtaK6A" target="_blank" rel="noreferrer">Discord</Link>
          <div className="mobile-menu-actions"><ThemeButton mobile /><button className="brand-button" onClick={goToApp}>{authenticated ? 'Mi panel' : 'Iniciar sesión'}</button></div>
        </nav>
      )}
    </header>
  );
};

export default Header;
