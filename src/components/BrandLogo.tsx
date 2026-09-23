import { Link } from 'react-router-dom';

interface BrandLogoProps {
  className?: string;
  light?: boolean;
}

const BrandLogo = ({ className = '', light = false }: BrandLogoProps) => (
  <Link to="/" aria-label="Clipealo, inicio" className={`brand-logo ${light ? 'brand-logo-light' : ''} ${className}`}>
    <svg viewBox="0 0 32 32" aria-hidden="true" className="brand-mark">
      <path d="M13.5 7.5H9.5A2.5 2.5 0 0 0 7 10v4M7 18.5v4A2.5 2.5 0 0 0 9.5 25h4M18.5 25h4a2.5 2.5 0 0 0 2.5-2.5v-4" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="17.5" y="7" width="8" height="8" rx="2.5" fill="#fd5e1c" />
    </svg>
    <span>Clipealo</span>
  </Link>
);

export default BrandLogo;
