import { useEffect, useRef, useState } from 'react';
import { Link2, ArrowRight } from 'lucide-react';

const APP_URL = 'https://app.clipealo-ai.com/?utm_source=landing_organico&utm_medium=clic_boton';

const YouTubeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path fill="#FF0000" d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.4 31.4 0 0 0 0 12a31.4 31.4 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.4 31.4 0 0 0 24 12a31.4 31.4 0 0 0-.5-5.8z"/>
    <path fill="#fff" d="M9.6 15.6V8.4l6.3 3.6z"/>
  </svg>
);

const KickIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path fill="#53FC18" d="M3 3h5v5h2V5h2V3h5v5h-2v2h-2v4h2v2h2v5h-5v-3h-2v-2H8v5H3z"/>
  </svg>
);

const DriveIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path fill="#0066DA" d="M1.6 17.5 3 20a2 2 0 0 0 1.7 1h7.6l-3.8-6.5z"/>
    <path fill="#00AC47" d="M12 3 8.2 9.5 16 22.5l3.8-6.5z"/>
    <path fill="#EA4335" d="m22.4 17.5-4.4-7.6L12 3l-3.8 6.5L16 22h3.3a2 2 0 0 0 1.7-1z"/>
    <path fill="#00832D" d="m12 3-3.8 6.5h7.6z"/>
    <path fill="#2684FC" d="M16.5 14.5h-9L4 21l-2.4-3.5z" opacity=".4"/>
    <path fill="#FFBA00" d="m22.4 17.5-2.5-4.3-3.4 1.3z"/>
  </svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path fill="#1877F2" d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7v-3.5h3.1V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9v2.2h3.4l-.6 3.5h-2.8v8.4A12 12 0 0 0 24 12"/>
  </svg>
);

const TwitchIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path fill="#9146FF" d="M2.5 2 1 5.8v15h5v3.2h2.8l3.2-3.2h4l5.5-5.5V2zm17 11.2-3.2 3.2h-3.2l-2.8 2.8v-2.8H6.5V3.8h13zM15 7h1.8v5.2H15zm-4.8 0H12v5.2h-1.8z"/>
  </svg>
);

const platforms = [
  { name: 'YouTube', Icon: YouTubeIcon },
  { name: 'Kick', Icon: KickIcon },
  { name: 'Google Drive', Icon: DriveIcon },
  { name: 'Facebook', Icon: FacebookIcon },
  { name: 'Twitch', Icon: TwitchIcon },
];

const StickyBottomBar = () => {
  const [visible, setVisible] = useState(false);
  const [hidden, setHidden] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const footer = document.querySelector('footer');
    if (!footer) return;
    const observer = new IntersectionObserver(
      ([entry]) => setHidden(entry.isIntersecting),
      { threshold: 0.05 }
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  const handleRedirect = () => {
    window.location.href = APP_URL;
  };

  return (
    <div
      ref={barRef}
      className="fixed left-1/2 bottom-6 px-4 w-full max-w-[900px] pointer-events-none"
      style={{
        zIndex: 9999,
        transform: `translateX(-50%) translateY(${visible && !hidden ? '0' : '120px'})`,
        opacity: visible && !hidden ? 1 : 0,
        transition: 'transform 0.4s ease, opacity 0.3s ease',
      }}
    >
      <div
        className="pointer-events-auto flex items-center gap-3 rounded-full px-3 md:px-5 py-2.5"
        style={{
          background: '#0d0d0d',
          border: '1px solid rgba(255, 45, 135, 0.3)',
          boxShadow: '0 0 20px rgba(255, 45, 135, 0.15), 0 8px 24px rgba(0,0,0,0.4)',
        }}
      >
        {/* Platform icons - hidden on mobile */}
        <div className="hidden md:flex items-center gap-2 pl-1">
          {platforms.map(({ name, Icon }) => (
            <div
              key={name}
              title={name}
              className="opacity-80 hover:opacity-100 transition-opacity"
            >
              <Icon className="w-6 h-6" />
            </div>
          ))}
        </div>

        {/* Input - hidden on mobile */}
        <button
          onClick={handleRedirect}
          className="hidden md:flex flex-1 items-center gap-2 rounded-full px-4 py-2.5 text-left text-sm text-muted-foreground hover:text-foreground transition-colors"
          style={{ background: '#1a1a1a' }}
        >
          <Link2 className="w-4 h-4 shrink-0" />
          <span className="truncate">Pega el link de tu transmisión...</span>
        </button>

        {/* CTA Button */}
        <button
          onClick={handleRedirect}
          className="flex-1 md:flex-none flex items-center justify-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-bold text-white transition-all hover:scale-[1.02]"
          style={{
            background: 'hsl(var(--color-pink))',
            boxShadow: '0 0 16px rgba(255, 45, 135, 0.4)',
          }}
          data-event="sticky_cta_click"
        >
          Haz clips
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default StickyBottomBar;
