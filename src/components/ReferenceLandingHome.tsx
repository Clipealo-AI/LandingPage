import { useEffect, useRef, useState } from 'react';
import { ArrowRight, BookOpen, Check, ChevronDown, FileText, Flame, FolderOpen, Gamepad2, Globe, HelpCircle, Languages, Menu, MessageCircle, Moon, Palette, Play, Search, Smartphone, Sparkles, Sun, Target, UserRound, Users, Video, X, Zap } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { trackLead } from '@/lib/tracking';

const APP_URL = 'https://app.clipealo-ai.com/?utm_source=landing_organico&utm_medium=clic_boton';
const clips = [
  { title: 'El error de contratar por zona horaria', score: 94 },
  { title: 'La regla de las tres reuniones', score: 88 },
  { title: 'Documentar es un acto de respeto', score: 81 },
];

function buildWaveform(bars: number, seed = 7, landmarks = [0.22, 0.55, 0.78]) {
  let state = seed >>> 0;
  const random = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };

  return Array.from({ length: bars }, (_, index) => {
    const position = index / (bars - 1);
    const peak = landmarks.reduce((sum, landmark) => sum + Math.exp(-(((position - landmark) * 9) ** 2)), 0);
    return Math.round(Math.min(1, 0.28 + random() * 0.3 + peak * 0.55) * 1000) / 1000;
  });
}

const menuItems = {
  funcionalidades: [
    { icon: Zap, label: 'Clips automáticos', description: 'La IA detecta momentos destacados y crea clips listos para publicar.', href: '/funciones/clips-automaticos-con-ia' },
    { icon: Target, label: 'Entrenada en contenido LATAM', description: 'Entiende el español latino, la jerga local y el contexto cultural.', href: '/funciones/ia-entrenada-contenido-latam' },
    { icon: MessageCircle, label: 'Editor de subtítulos', description: 'Personaliza fuentes, colores, animaciones y posición.', href: '/funciones/editor-subtitulos-estilos' },
    { icon: Smartphone, label: 'Exporta en 2 formatos', description: '16:9 y 9:16 con reencuadre automático.', href: '/funciones/exporta-dos-formatos' },
    { icon: Palette, label: 'Plantillas de marca', description: 'Aplica el branding de cada cliente en un clic.', href: '/funciones/plantillas-de-marca' },
    { icon: FolderOpen, label: 'Gestión de proyectos', description: 'Organiza videos y entregas por proyecto o cliente.', href: '/funciones/gestion-proyectos-carpetas' },
    { icon: Search, label: 'Exportación en masa', description: 'Descarga todos los clips de un proyecto juntos.', href: '/funciones/exportacion-en-masa' },
  ],
  casos: [
    { icon: Video, label: 'Cliperos', description: 'Convierte momentos épicos en clips virales.', href: '/casos/cliperos' },
    { icon: Gamepad2, label: 'Streamers', description: 'Extrae los mejores momentos de tus streams.', href: '/casos/streamers' },
    { icon: MessageCircle, label: 'Podcasters', description: 'Convierte episodios largos en clips sociales.', href: '/casos/podcasters' },
    { icon: BookOpen, label: 'Coaches y educadores', description: 'Comparte clases y tutoriales como contenido corto.', href: '/casos/coaches' },
    { icon: Palette, label: 'Creadores de contenido', description: 'Lleva tus videos largos a todas tus redes.', href: '/casos/creadores' },
    { icon: Users, label: 'Comunidades y esports', description: 'Crea highlights de torneos y eventos.', href: '/casos/comunidades' },
    { icon: Globe, label: 'Agencias audiovisuales', description: 'Gestiona contenido de varios creadores.', href: '/casos/agencias' },
    { icon: Search, label: 'Marcas', description: 'Genera contenido a partir de streams patrocinados.', href: '/casos/marcas' },
  ],
  recursos: [
    { icon: Users, label: 'Discord', description: 'Únete a la comunidad de creadores LATAM.', href: 'https://discord.com/invite/XjhXBtaK6A' },
    { icon: BookOpen, label: 'Blog', description: 'Guías para crear contenido y crecer.', href: '/blog' },
    { icon: HelpCircle, label: 'Preguntas frecuentes', description: 'Resolvemos tus dudas más comunes.', href: '/#faq' },
    { icon: FileText, label: 'Guías', description: 'Aprende a sacar más de Clipealo.', href: '/blog' },
  ],
} as const;

type MenuKey = keyof typeof menuItems;
const menuLabels: Record<MenuKey, string> = {
  funcionalidades: 'Funcionalidades',
  casos: 'Casos de uso',
  recursos: 'Recursos',
};

const ReferenceLandingHome = () => (
  <>
    <ReferenceHeader />
    <ReferenceHero />
  </>
);

export default ReferenceLandingHome;

function ReferenceBrand() {
  return (
    <Link to="/" aria-label="Clipealo, inicio" className="reference-brand">
      <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <g stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 4.75H7.5A2.75 2.75 0 0 0 4.75 7.5V13" />
          <path d="M4.75 19v5.5a2.75 2.75 0 0 0 2.75 2.75H13" />
          <path d="M19 27.25h5.5a2.75 2.75 0 0 0 2.75-2.75V19" />
        </g>
        <rect x="18" y="4" width="10" height="10" rx="3" fill="#fd5e1c" />
      </svg>
      <span>Clipealo</span>
    </Link>
  );
}

function ReferenceHeader() {
  const { theme, setTheme } = useTheme();
  const [languageOpen, setLanguageOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<MenuKey | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const wrapper = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setLanguageOpen(false);
        setMobileOpen(false);
        setActiveMenu(null);
      }
    };
    const onPointerDown = (event: MouseEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setActiveMenu(null);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, []);

  useEffect(() => {
    setLanguageOpen(false);
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <header ref={wrapper} className={`reference-header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="reference-header-inner reference-container">
        <ReferenceBrand />
        <nav className="reference-nav" aria-label="Navegación principal">
          {(Object.keys(menuItems) as MenuKey[]).map((key) => (
            <button
              key={key}
              type="button"
              aria-expanded={activeMenu === key}
              aria-controls={`reference-menu-${key}`}
              onClick={() => setActiveMenu((open) => open === key ? null : key)}
            >
              {menuLabels[key]} <ChevronDown className={activeMenu === key ? 'is-open' : ''} aria-hidden="true" />
            </button>
          ))}
          <Link to="/precios">Precios</Link>
        </nav>
        <div className="reference-actions">
          <button
            type="button"
            className="reference-icon-button"
            aria-label={`Cambiar a tema ${theme === 'dark' ? 'claro' : 'oscuro'}`}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Moon /> : <Sun />}
          </button>
          <div className="reference-language">
            <button
              type="button"
              className="reference-icon-button"
              aria-label="Idioma: español"
              aria-expanded={languageOpen}
              onClick={() => setLanguageOpen((open) => !open)}
            >
              <Languages />
            </button>
            {languageOpen && <div className="reference-language-menu" role="status"><Check aria-hidden="true" /> Español</div>}
          </div>
          <a className="reference-icon-button reference-login" href="https://app.clipealo-ai.com/" aria-label="Iniciar sesión" title="Iniciar sesión">
            <UserRound />
          </a>
          <a className="reference-upload" href={APP_URL} onClick={() => trackLead('Header - Subir un video')}>Subir un video</a>
        </div>
        <button
          className="reference-menu-toggle"
          type="button"
          aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>
      {activeMenu && (
        <div id={`reference-menu-${activeMenu}`} className="reference-dropdown" role="region" aria-label={menuLabels[activeMenu]}>
          <div className="reference-dropdown-grid">
            {menuItems[activeMenu].map(({ icon: Icon, label, description, href }) => (
              href.startsWith('http') ? (
                <a className="reference-dropdown-link" href={href} key={href} target="_blank" rel="noopener noreferrer" onClick={() => setActiveMenu(null)}>
                  <Icon aria-hidden="true" /><span><strong>{label}</strong><small>{description}</small></span>
                </a>
              ) : (
                <Link className="reference-dropdown-link" to={href} key={href} onClick={() => setActiveMenu(null)}>
                  <Icon aria-hidden="true" /><span><strong>{label}</strong><small>{description}</small></span>
                </Link>
              )
            ))}
          </div>
        </div>
      )}
      {mobileOpen && (
        <nav className="reference-mobile-menu" aria-label="Navegación móvil">
          {(Object.keys(menuItems) as MenuKey[]).map((key) => (
            <details key={key}>
              <summary>{menuLabels[key]}</summary>
              {menuItems[key].map(({ label, href }) => href.startsWith('http') ? (
                <a key={href} href={href} target="_blank" rel="noopener noreferrer">{label}</a>
              ) : (
                <Link key={href} to={href} onClick={() => setMobileOpen(false)}>{label}</Link>
              ))}
            </details>
          ))}
          <Link to="/precios" onClick={() => setMobileOpen(false)}>Precios</Link>
          <a href="https://app.clipealo-ai.com/" onClick={() => setMobileOpen(false)}>Iniciar sesión</a>
          <a className="reference-upload" href={APP_URL} onClick={() => trackLead('Header móvil - Subir un video')}>Subir un video</a>
        </nav>
      )}
    </header>
  );
}

function ReferenceHero() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPrefersReducedMotion(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return (
    <section className="reference-hero">
      <div className="reference-hero-pattern" aria-hidden="true" />
      <div className="reference-hero-glow" aria-hidden="true" />
      <div className="reference-hero-bottom-fade" aria-hidden="true" />
      <div className="reference-container reference-hero-content">
        <div className="reference-hero-copy">
          <div className="reference-hero-badge">
            <Sparkles aria-hidden="true" />
            <span>Reencuadre automático con seguimiento de quien habla</span>
          </div>
          <div className="reference-title-frame">
            <span className="reference-title-corner top-left" aria-hidden="true" />
            <span className="reference-title-corner top-right" aria-hidden="true" />
            <span className="reference-title-corner bottom-left" aria-hidden="true" />
            <span className="reference-title-corner bottom-right" aria-hidden="true" />
            <h1>De videos largos<br />a grandes clips.</h1>
          </div>
          <p className="reference-hero-description">
            Sube el video completo. La IA encuentra los momentos que la gente ve hasta el final y te los devuelve en 9:16, con subtítulos.
          </p>
          <div className="reference-hero-buttons">
            <a href={APP_URL} onClick={() => trackLead('Hero - Subir un video')} className="reference-button reference-button-primary">
              Subir un video <ArrowRight aria-hidden="true" />
            </a>
            <a href="#como-funciona" className="reference-button reference-button-secondary">
              <Play aria-hidden="true" fill="currentColor" /> Ver cómo funciona
            </a>
          </div>
          <p className="reference-hero-claim"><span>Recorta . Edita . Comparte . Crece</span></p>
        </div>
        <ProductPreview prefersReducedMotion={prefersReducedMotion} />
      </div>
    </section>
  );
}

function ProductPreview({ prefersReducedMotion }: { prefersReducedMotion: boolean }) {
  const peaks = buildWaveform(72, 21);

  return (
    <div className="reference-product-preview">
      <div className="reference-product-shell">
        <div className="reference-product-window">
          <div className="reference-product-main">
            <div className="reference-product-video" aria-label="Vista previa del video original">
              <div className="reference-play-button" aria-hidden="true"><Play fill="currentColor" /></div>
            </div>
            <div className="reference-wave-card">
              <div className="reference-wave-heading"><span>Momentos detectados</span><span className="reference-score"><Flame aria-hidden="true" /> 94</span></div>
              <div className={`reference-waveform ${prefersReducedMotion ? 'is-reduced' : ''}`} aria-hidden="true">
                {peaks.map((height, index) => <span key={index} style={{ height: `${Math.max(6, height * 100)}%` }} />)}
                <i />
              </div>
            </div>
          </div>
          <ul className="reference-clip-list" aria-label="Clips propuestos">
            {clips.map((clip, index) => (
              <li className="reference-clip-card" key={clip.title}>
                <span className={`reference-clip-thumb thumb-${index}`} aria-hidden="true" />
                <span className="reference-clip-copy">
                  <strong>{clip.title}</strong>
                  <small>{index === 2 ? '1:1' : '9:16'} · con subtítulos</small>
                </span>
                <span className="reference-score"><Flame aria-hidden="true" /> {clip.score}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
