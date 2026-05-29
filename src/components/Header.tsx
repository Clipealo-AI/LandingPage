import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, Zap, Target, BarChart3, MessageSquare, Smartphone, PenTool, FolderOpen, Search, Gamepad2, Music, Palette, Users, BookOpen, HelpCircle, MessageCircle, FileText, Video } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from '@/assets/clipealo-logo.svg';

const DiscordIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

const featuresItems = [
  { icon: Zap, label: 'Clips automáticos', description: 'Pega el link de tu stream. La IA procesa el video completo y genera clips listos para publicar.', color: 'text-[hsl(var(--color-pink))]', href: '/funciones/clips-automaticos-con-ia' },
  { icon: Target, label: 'Entrenada en contenido LATAM', description: 'Detecta momentos virales en español. Entiende jerga local y contexto cultural.', color: 'text-[hsl(var(--color-purple))]', href: '/funciones/ia-entrenada-contenido-latam' },
  { icon: MessageSquare, label: 'Editor de subtítulos', description: 'Personaliza fuentes, colores, animaciones y posición de subtítulos automáticos.', color: 'text-[hsl(var(--color-cyan))]', href: '/funciones/editor-subtitulos-estilos' },
  { icon: Smartphone, label: 'Exporta en 2 formatos', description: '16:9 para YouTube/Kick y 9:16 para TikTok/Reels. Reencuadre automático en 1 clic.', color: 'text-[hsl(var(--color-blue))]', href: '/funciones/exporta-dos-formatos' },
  { icon: PenTool, label: 'Plantillas de marca', description: 'Configura el branding de cada cliente y aplícalo a todos sus clips en un clic.', color: 'text-[hsl(var(--color-pink))]', href: '/funciones/plantillas-de-marca' },
  { icon: FolderOpen, label: 'Gestión de proyectos', description: 'Organiza todos tus videos y clips por cliente, campaña o fecha.', color: 'text-[hsl(var(--color-purple))]', href: '/funciones/gestion-proyectos-carpetas' },
  { icon: Search, label: 'Exportación en masa', description: 'Descarga todos los clips de un proyecto en un solo clic.', color: 'text-[hsl(var(--color-cyan))]', href: '/funciones/exportacion-en-masa' },
];

const useCasesItems = [
  { icon: Video, label: 'Cliperos', description: 'Convierte momentos épicos en clips virales listos para publicar.', color: 'text-[hsl(var(--color-pink))]', href: '/casos/cliperos' },
  { icon: Gamepad2, label: 'Streamers', description: 'Extrae los mejores momentos de tus streams automáticamente.', color: 'text-[hsl(var(--color-purple))]', href: '/casos/streamers' },
  { icon: MessageCircle, label: 'Podcasters', description: 'Convierte episodios largos en clips cortos para redes sociales.', color: 'text-[hsl(var(--color-cyan))]', href: '/casos/podcasters' },
  { icon: BookOpen, label: 'Coaches y educadores', description: 'Transforma clases y tutoriales en contenido fácil de compartir.', color: 'text-[hsl(var(--color-blue))]', href: '/casos/coaches' },
  { icon: Palette, label: 'Creadores de contenido', description: 'Convierte videos largos en contenido corto para todas tus redes.', color: 'text-[hsl(var(--color-pink))]', href: '/casos/creadores' },
  { icon: Users, label: 'Comunidades y esports', description: 'Crea highlights de torneos y eventos competitivos automáticamente.', color: 'text-[hsl(var(--color-purple))]', href: '/casos/comunidades' },
  { icon: Target, label: 'Agencias audiovisuales', description: 'Gestiona el contenido de múltiples creadores desde una sola herramienta.', color: 'text-[hsl(var(--color-cyan))]', href: '/casos/agencias' },
  { icon: Search, label: 'Marcas', description: 'Genera contenido de marca a partir de streams y videos patrocinados.', color: 'text-[hsl(var(--color-blue))]', href: '/casos/marcas' },
];

const resourcesItems = [
  { icon: Users, label: 'Discord', description: 'Únete a la comunidad de streamers LATAM.', color: 'text-[hsl(var(--color-purple))]', href: 'https://discord.com/invite/XjhXBtaK6A' },
  { icon: BookOpen, label: 'Blog', description: 'Tips para crecer como streamer con IA.', color: 'text-[hsl(var(--color-cyan))]', href: '/blog' },
  { icon: HelpCircle, label: 'FAQ', description: 'Resolvemos tus dudas más frecuentes.', color: 'text-[hsl(var(--color-blue))]', href: '#faq' },
  { icon: FileText, label: 'Guías', description: 'Aprende a sacar el máximo de Clipealo.', color: 'text-[hsl(var(--color-pink))]', href: '/blog' },
];

type DropdownKey = 'funcionalidades' | 'casos' | 'recursos' | null;

const APP_URL = 'https://app.clipealo-ai.com';
const API_URL = 'https://backend.clipealo-ai.com';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<DropdownKey>(null);
  const [mobileExpanded, setMobileExpanded] = useState<DropdownKey>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    fetch(`${API_URL}/api/auth/check-session`, {
      method: 'GET',
      credentials: 'include',
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => setIsAuthenticated(data.authenticated === true))
      .catch(() => setIsAuthenticated(false))
      .finally(() => clearTimeout(timeout));

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, []);

  const handleAuthCta = () => {
    if (isAuthenticated) {
      window.location.href = `${APP_URL}/dashboard`;
    } else {
      window.location.href = APP_URL;
    }
    setIsMenuOpen(false);
  };

  const authLabel = isAuthenticated ? 'Mi Panel' : 'Iniciar sesión';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMouseEnter = (key: DropdownKey) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveDropdown(key);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setActiveDropdown(null), 200);
  };

  const goToPricing = () => {
    navigate('/precios');
    setIsMenuOpen(false);
  };

  const scrollToSection = (href: string) => {
    if (href.startsWith('http')) {
      window.open(href, '_blank');
      setActiveDropdown(null);
      return;
    }
    if (href.startsWith('/')) {
      navigate(href);
      setActiveDropdown(null);
      setIsMenuOpen(false);
      return;
    }
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } else {
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
    }
    setActiveDropdown(null);
    setIsMenuOpen(false);
  };

  const navItems: { label: string; key: DropdownKey; items?: typeof featuresItems }[] = [
    { label: 'Funcionalidades', key: 'funcionalidades', items: featuresItems },
    { label: 'Casos de uso', key: 'casos', items: useCasesItems },
    { label: 'Recursos', key: 'recursos', items: resourcesItems },
  ];

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }} className="flex-shrink-0 -ml-2">
            <img src={Logo} alt="Clipealo" className="h-10 md:h-14" />
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1" ref={dropdownRef}>
            {navItems.map((item) => (
              <div
                key={item.key}
                className="relative"
                onMouseEnter={() => handleMouseEnter(item.key)}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeDropdown === item.key
                      ? 'text-foreground bg-muted/50'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {item.label}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === item.key ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {activeDropdown === item.key && item.items && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-popover border border-border rounded-xl shadow-2xl shadow-black/40 p-4 z-[100] max-w-[calc(100vw-2rem)] ${
                        item.items.length > 4 ? 'w-[700px]' : 'w-[500px]'
                      }`}
                      onMouseEnter={() => handleMouseEnter(item.key)}
                      onMouseLeave={handleMouseLeave}
                    >
                      <div className={`grid gap-1 ${item.items.length > 4 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {item.items.map((subItem) => {
                          const Icon = subItem.icon;
                          return (
                            <button
                              key={subItem.label}
                              onClick={() => {
                                if ('href' in subItem && subItem.href) {
                                  scrollToSection(subItem.href as string);
                                }
                                setActiveDropdown(null);
                              }}
                              className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left group"
                            >
                              <div className={`mt-0.5 ${subItem.color}`}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-foreground group-hover:text-foreground/90">{subItem.label}</p>
                                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{subItem.description}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}

            {/* Precios - no dropdown */}
            <button
              onClick={() => navigate('/precios')}
              className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Precios
            </button>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <motion.a
              href="https://discord.com/invite/XjhXBtaK6A"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-full text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-colors text-xs font-medium"
            >
              <DiscordIcon />
              Discord
            </motion.a>
            <motion.button
              onClick={handleAuthCta}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-2.5 bg-foreground text-background rounded-full font-semibold hover:bg-foreground/90 transition-colors text-sm"
            >
              {authLabel}
            </motion.button>
          </div>

          {/* Mobile */}
          <div className="flex lg:hidden items-center gap-2">
            <motion.a
              href="https://discord.com/invite/XjhXBtaK6A"
              target="_blank"
              rel="noopener noreferrer"
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center w-9 h-9 border border-border rounded-full text-muted-foreground"
            >
              <DiscordIcon />
            </motion.a>
            <motion.button
              onClick={handleAuthCta}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-2 bg-foreground text-background rounded-full font-semibold text-xs"
            >
              {isAuthenticated ? 'Mi Panel' : 'Acceder'}
            </motion.button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-foreground"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden py-4 border-t border-border/50 overflow-hidden"
            >
              <nav className="flex flex-col gap-1">
                {navItems.map((item) => (
                  <div key={item.key}>
                    <button
                      onClick={() => setMobileExpanded(mobileExpanded === item.key ? null : item.key)}
                      className="flex items-center justify-between w-full py-3 px-2 text-muted-foreground hover:text-foreground transition-colors font-medium"
                    >
                      {item.label}
                      <ChevronDown className={`w-4 h-4 transition-transform ${mobileExpanded === item.key ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {mobileExpanded === item.key && item.items && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pl-2 pb-2 space-y-1">
                            {item.items.map((subItem) => {
                              const Icon = subItem.icon;
                              return (
                                <button
                                  key={subItem.label}
                                  onClick={() => {
                                    if ('href' in subItem && subItem.href) scrollToSection(subItem.href as string);
                                    setIsMenuOpen(false);
                                  }}
                                  className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors text-left w-full"
                                >
                                  <div className={`mt-0.5 ${subItem.color}`}>
                                    <Icon className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-foreground">{subItem.label}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{subItem.description}</p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}

                <button
                  onClick={() => { navigate('/precios'); setIsMenuOpen(false); }}
                  className="py-3 px-2 text-muted-foreground hover:text-foreground transition-colors font-medium text-left"
                >
                  Precios
                </button>

                <motion.button
                  onClick={handleAuthCta}
                  whileTap={{ scale: 0.98 }}
                  className="mt-2 px-6 py-3 bg-foreground text-background rounded-full font-semibold"
                >
                  {authLabel}
                </motion.button>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
};

export default Header;
