import youtube from '@/assets/platform-youtube.png';
import twitch from '@/assets/platform-twitch.png';
import kick from '@/assets/platform-kick.png';

const platforms = [
  { name: 'YouTube', image: youtube },
  { name: 'Twitch', image: twitch },
  { name: 'Kick', image: kick },
  { name: 'Facebook', label: 'f' },
  { name: 'Google Drive', label: '△' },
  { name: 'Zoom', label: 'Z' },
];

const PlatformStrip = () => (
  <section className="border-y border-border bg-background px-5 py-10" aria-label="Fuentes de video compatibles">
    <div className="brand-container flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
      <p className="max-w-sm text-center text-sm font-semibold text-muted-foreground sm:text-left">Trabaja con los videos de las plataformas que ya usas</p>
      <ul className="flex flex-wrap items-center justify-center gap-x-7 gap-y-4" aria-label="YouTube, Twitch, Kick, Facebook, Google Drive y Zoom">
        {platforms.map((platform) => <li key={platform.name} className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
          {platform.image ? <img src={platform.image} alt="" className="h-5 w-5 object-contain" /> : <span aria-hidden="true" className="grid h-5 w-5 place-items-center rounded bg-[#eaf1ff] text-xs font-bold text-primary">{platform.label}</span>}{platform.name}
        </li>)}
      </ul>
    </div>
  </section>
);

export default PlatformStrip;
