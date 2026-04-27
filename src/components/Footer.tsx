import { motion } from 'framer-motion';
import { Instagram, Facebook } from 'lucide-react';
import Logo from '@/assets/clipealo-logo.svg';

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.11 18.1.132 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

const footerColumns = [
  {
    title: 'FUNCIONALIDADES',
    links: [
      { label: 'Clips automáticos', href: '#' },
      { label: 'Subtítulos con IA', href: '#' },
      { label: 'Reencuadre automático', href: '#' },
      { label: 'Score de viralidad', href: '#' },
      { label: 'Detección LATAM', href: '#' },
      { label: 'Título y descripción con IA', href: '#' },
    ],
  },
  {
    title: 'CASOS DE USO',
    links: [
      { label: 'Cliperos', href: '/casos/cliperos' },
      { label: 'Streamers', href: '/casos/streamers' },
      { label: 'Podcasters', href: '/casos/podcasters' },
      { label: 'Coaches y educadores', href: '/casos/coaches' },
      { label: 'Creadores de contenido', href: '/casos/creadores' },
      { label: 'Comunidades y esports', href: '/casos/comunidades' },
      { label: 'Agencias audiovisuales', href: '/casos/agencias' },
      { label: 'Marcas', href: '/casos/marcas' },
    ],
  },
  {
    title: 'CANALES',
    links: [
      { label: 'Instagram Reels', href: '#' },
      { label: 'Facebook Reels', href: '#' },
      { label: 'TikTok', href: '#' },
      { label: 'YouTube Shorts', href: '#' },
    ],
  },
  {
    title: 'RECURSOS',
    links: [
      { label: 'Blog', href: '/blog' },
      { label: 'Precios', href: '/precios' },
      { label: 'Política de Privacidad', href: '/politica-de-privacidad' },
      { label: 'Términos y Condiciones', href: '#' },
      { label: 'Contacto', href: '#' },
    ],
  },
];

const socialLinks = [
  { icon: TikTokIcon, href: 'https://www.tiktok.com/@clipealo.ai?lang=en', label: 'TikTok' },
  { icon: Instagram, href: 'https://www.instagram.com/clipealo.pe/', label: 'Instagram' },
  { icon: Facebook, href: 'https://www.facebook.com/clipealo.pe', label: 'Facebook' },
  { icon: DiscordIcon, href: 'https://discord.com/invite/XjhXBtaK6A', label: 'Discord' },
];

const Footer = () => {
  return (
    <footer className="border-t border-border pt-12 pb-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 mb-12">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <motion.img
              src={Logo}
              alt="Clipealo"
              className="h-10 sm:h-12 mb-4 logo-glow"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            />
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
              Tu contenido, al toque.
            </p>
            {/* Social icons */}
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="social-icon w-9 h-9"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {footerColumns.map((col) => (
            <div key={col.title}>
              <h4 className="text-foreground font-bold text-xs tracking-widest mb-4 uppercase">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border pt-8 text-center space-y-3">
          <p className="text-sm font-bold tracking-[0.3em] uppercase text-foreground/80 flex items-center justify-center gap-3">
            Hecho en Perú
            <svg width="22" height="15" viewBox="0 0 22 15" className="inline-block flex-shrink-0" style={{letterSpacing: 0}}>
              <rect width="7.33" height="15" x="0" fill="#D91023"/>
              <rect width="7.34" height="15" x="7.33" fill="#FFFFFF"/>
              <rect width="7.33" height="15" x="14.67" fill="#D91023"/>
            </svg>
            para Latinoamérica
          </p>
          <p className="text-xs text-muted-foreground">
            © 2026 Clipealo. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
