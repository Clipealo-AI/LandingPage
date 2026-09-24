import {
  BookOpen,
  Download,
  FileText,
  FolderOpen,
  Gamepad2,
  Globe,
  HelpCircle,
  Mail,
  MessageCircle,
  Palette,
  Search,
  Smartphone,
  Target,
  Users,
  Video,
  Zap,
} from 'lucide-react';
import marketing from '../../messages/es/marketing.json';

const featureLinks = marketing.routeMenu.featureLinks;
const caseLinks = marketing.routeMenu.caseLinks;
const resourceLinks = marketing.routeMenu.resourceLinks;

export const appUrl = 'https://app.clipealo-ai.com/';

export const featureItems = [
  { key: 'clips', slug: 'clips-automaticos-con-ia', icon: Zap, ...featureLinks.clips },
  { key: 'latam', slug: 'ia-entrenada-contenido-latam', icon: Target, ...featureLinks.latam },
  { key: 'subtitles', slug: 'editor-subtitulos-estilos', icon: MessageCircle, ...featureLinks.subtitles },
  { key: 'formats', slug: 'exporta-dos-formatos', icon: Smartphone, ...featureLinks.formats },
  { key: 'templates', slug: 'plantillas-de-marca', icon: Palette, ...featureLinks.templates },
  { key: 'projects', slug: 'gestion-proyectos-carpetas', icon: FolderOpen, ...featureLinks.projects },
  { key: 'bulk', slug: 'exportacion-en-masa', icon: Download, ...featureLinks.bulk },
] as const;

export const useCaseItems = [
  { key: 'cliperos', icon: Video, href: '/casos/cliperos', ...caseLinks.cliperos },
  { key: 'streamers', icon: Gamepad2, href: '/casos/streamers', ...caseLinks.streamers },
  { key: 'podcasters', icon: MessageCircle, href: '/casos/podcasters', ...caseLinks.podcasters },
  { key: 'coaches', icon: BookOpen, href: '/casos/coaches', ...caseLinks.coaches },
  { key: 'creators', icon: Palette, href: '/casos/creadores', ...caseLinks.creators },
  { key: 'communities', icon: Users, href: '/casos/comunidades', ...caseLinks.communities },
  { key: 'agencies', icon: Globe, href: '/casos/agencias', ...caseLinks.agencies },
  { key: 'brands', icon: Search, href: '/casos/marcas', ...caseLinks.brands },
] as const;

export const resourceItems = [
  { key: 'discord', icon: Users, href: 'https://discord.com/invite/XjhXBtaK6A', external: true, ...resourceLinks.discord },
  { key: 'blog', icon: BookOpen, href: '/blog', ...resourceLinks.blog },
  { key: 'faq', icon: HelpCircle, href: '/#faq', ...resourceLinks.faq },
  { key: 'contact', icon: Mail, href: 'mailto:contacto@clipealo.com', external: true, ...resourceLinks.contact },
] as const;

export const marketingMenus = [
  { key: 'features', label: marketing.routeMenu.features, items: featureItems.map((item) => ({ ...item, href: `/funciones/${item.slug}` })) },
  { key: 'cases', label: marketing.routeMenu.cases, items: useCaseItems },
  { key: 'resources', label: marketing.routeMenu.resources, items: resourceItems },
] as const;

export const footerColumns = [
  {
    key: 'product',
    label: marketing.footer.product,
    links: [
      { label: marketing.footer.allFunctions, href: '/funciones' },
      { label: marketing.footer.automaticClips, href: '/funciones/clips-automaticos-con-ia' },
      { label: marketing.footer.pricingLink, href: '/precios' },
    ],
  },
  {
    key: 'resources',
    label: marketing.footer.resources,
    links: [
      { label: marketing.footer.blog, href: '/blog' },
      { label: marketing.footer.faq, href: '/#faq' },
      { label: marketing.footer.contact, href: 'mailto:contacto@clipealo.com', external: true },
    ],
  },
  {
    key: 'legal',
    label: marketing.footer.legal,
    links: [
      { label: marketing.legalNav.privacy, href: `${appUrl}politica-de-privacidad`, external: true },
      { label: marketing.legalNav.terms, href: `${appUrl}terminos-y-condiciones`, external: true },
    ],
  },
] as const;
