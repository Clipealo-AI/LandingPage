import avatarChupapi from '@/assets/testimonials/chupapi.jpeg';
import avatarGatimixx from '@/assets/testimonials/gatimixx.png';
import avatarSkilpe from '@/assets/testimonials/skilpe.jpeg';
import avatarRin from '@/assets/testimonials/rinnakavt.png';
import avatarEvolutive from '@/assets/testimonials/evolutive-playbook.jpg';
import avatarJarod from '@/assets/testimonials/jarod-blade.jpeg';
import avatarSirghostv from '@/assets/testimonials/sirghostv.jpg';

import iconTiktok from '@/assets/icons/tiktok.png';
import iconKick from '@/assets/icons/kick.png';
import iconTwitch from '@/assets/icons/twitch.png';
import iconLinkedin from '@/assets/icons/linkedin.png';
import iconYoutube from '@/assets/platform-youtube.png';

const testimonials = [
  {
    name: 'EL CHUPAPI L4D',
    avatar: avatarChupapi,
    platforms: [iconKick, iconTiktok],
    stat: '200 seguidores',
  },
  {
    name: 'Gatimixx',
    avatar: avatarGatimixx,
    platforms: [iconTwitch],
    stat: '150 seguidores',
  },
  {
    name: 'Skilpe',
    avatar: avatarSkilpe,
    platforms: [iconTiktok],
    stat: '+100K vistas',
  },
  {
    name: 'RinNakaVT',
    avatar: avatarRin,
    platforms: [iconTwitch],
    stat: '400 seguidores',
  },
  {
    name: 'Evolutive Playbook',
    avatar: avatarEvolutive,
    platforms: [iconLinkedin, iconYoutube],
    stat: 'Canal de gestión',
  },
  {
    name: 'Jarod Blade',
    avatar: avatarJarod,
    platforms: [iconTiktok],
    stat: '850 seguidores',
  },
  {
    name: 'SirGhostv',
    avatar: avatarSirghostv,
    platforms: [iconYoutube],
    stat: '1.85K seguidores',
  },
];

const items = [...testimonials, ...testimonials];

const TestimonialsSection = () => {
  return (
    <section className="relative py-12 overflow-hidden">
      <p className="text-center text-sm text-muted-foreground mb-8 tracking-wide uppercase">
        Quienes ya confían en Clipealo
      </p>

      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none bg-gradient-to-r from-background to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none bg-gradient-to-l from-background to-transparent" />

        <div className="flex animate-marquee gap-16 w-max">
          {items.map((t, i) => (
            <div key={i} className="flex flex-col items-center gap-2 min-w-[120px]">
              <img
                src={t.avatar}
                alt={t.name}
                className="w-14 h-14 rounded-full object-cover border border-border"
              />
              <span className="text-sm font-semibold text-foreground whitespace-nowrap">{t.name}</span>
              <div className="flex items-center gap-1.5">
                {t.platforms.map((icon, j) => (
                  <img key={j} src={icon} alt="" className="w-4 h-4 rounded-sm object-contain" />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">{t.stat}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
