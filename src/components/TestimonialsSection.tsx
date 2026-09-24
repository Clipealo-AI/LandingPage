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
import marketing from '../../messages/es/marketing.json';

const testimonials = [
  { name: 'Turno', avatar: '/clients/turno.webp', platforms: ['/platforms/youtube.webp', '/platforms/instagram.webp', '/platforms/tiktok.webp', '/platforms/x.webp'], stat: '124 mil suscriptores' },
  { name: 'EL CHUPAPI L4D', avatar: avatarChupapi, platforms: [iconKick, iconTiktok], stat: '200 seguidores' },
  { name: 'Gatimixx', avatar: avatarGatimixx, platforms: [iconTwitch], stat: '150 seguidores' },
  { name: 'Skilpe', avatar: avatarSkilpe, platforms: [iconTiktok], stat: '+100K vistas' },
  { name: 'RinNakaVT', avatar: avatarRin, platforms: [iconTwitch], stat: '400 seguidores' },
  { name: 'Evolutive Playbook', avatar: avatarEvolutive, platforms: [iconLinkedin, iconYoutube], stat: 'Canal de gestión' },
  { name: 'Jarod Blade', avatar: avatarJarod, platforms: [iconTiktok], stat: '850 seguidores' },
  { name: 'SirGhostv', avatar: avatarSirghostv, platforms: [iconYoutube], stat: '1.85K seguidores' },
];

const TestimonialsSection = () => (
  <section className="overflow-hidden border-y border-border bg-secondary-color py-14 sm:py-16" aria-label={marketing.community.creators}>
    <div className="brand-container mb-8 flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
      <div><p className="eyebrow">{marketing.community.creators}</p><h2 className="mt-2 text-2xl font-bold tracking-tight">{marketing.community.title}</h2></div>
      <p className="text-sm text-muted-foreground">{marketing.community.channels}</p>
    </div>
    <div className="relative">
      <div className="marketing-carousel-fade-left pointer-events-none absolute inset-y-0 left-0 z-10 w-12 sm:w-24" />
      <div className="marketing-carousel-fade-right pointer-events-none absolute inset-y-0 right-0 z-10 w-12 sm:w-24" />
      <div className="testimonials-track flex w-max gap-4" role="list">
        {[...testimonials, ...testimonials].map((person, index) => (
          <article key={`${person.name}-${index}`} role="listitem" aria-hidden={index >= testimonials.length} className="brand-card flex w-64 items-center gap-3 px-4 py-3">
            <img src={person.avatar} alt={index >= testimonials.length ? '' : person.name} className="h-12 w-12 shrink-0 rounded-full border border-border object-cover" loading="lazy" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{person.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{person.stat}</p>
              <div className="mt-1 flex gap-1">{person.platforms.map((icon, item) => <img key={item} src={icon} alt="" className="h-3.5 w-3.5 rounded-sm object-contain" />)}</div>
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialsSection;
