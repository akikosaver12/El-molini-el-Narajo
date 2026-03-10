import React from 'react';
import { Link } from 'react-router-dom';
import { brandConfig } from '../../utils/brandConfig';

const GOLD_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
  .gold-text { background:linear-gradient(135deg,#E8C97A,#C9A84C 50%,#8B6914); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
  @keyframes shimmer { 0%{background-position:-200% center;} 100%{background-position:200% center;} }
  .shimmer-line { background:linear-gradient(90deg,transparent,#C9A84C44,transparent); background-size:200% 100%; animation:shimmer 3s ease-in-out infinite; }
  .footer-link { color:#8B6914; transition:all 0.2s; display:inline-flex; align-items:center; gap:4px; }
  .footer-link:hover { color:#E8C97A; transform:translateX(4px); }
  .footer-link-plain { color:#8B6914; font-size:0.875rem; transition:color 0.2s; }
  .footer-link-plain:hover { color:#C9A84C; }
  .social-btn {
    width:40px; height:40px; border-radius:0.75rem; display:flex; align-items:center; justify-content:center;
    background:rgba(201,168,76,0.08); border:1px solid rgba(201,168,76,0.2);
    font-size:1.125rem; transition:all 0.2s; cursor:pointer;
  }
  .social-btn:hover { background:rgba(201,168,76,0.2); border-color:rgba(201,168,76,0.5); transform:scale(1.1); }
  .trust-badge {
    display:flex; align-items:center; gap:8px;
    background:rgba(201,168,76,0.08); border:1px solid rgba(201,168,76,0.18);
    padding:6px 14px; border-radius:0.625rem;
  }
`;

const GoldDivider = () => (
  <div className="flex items-center gap-4 my-0">
    <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.4))' }} />
    <div className="w-1.5 h-1.5 rotate-45" style={{ background: '#C9A84C' }} />
    <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, transparent, rgba(201,168,76,0.4))' }} />
  </div>
);

const Footer: React.FC = () => {
  return (
    <footer style={{ backgroundColor: '#0A0A08', borderTop: '1px solid rgba(201,168,76,0.18)', fontFamily: "'Lato', sans-serif" }}>
      <style>{GOLD_STYLES}</style>

      {/* Línea shimmer superior */}
      <div className="shimmer-line h-px" />

      <div className="container mx-auto px-6 py-14">

        {/* ── Grid principal ── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">

          {/* COLUMNA 1: Info empresa */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden flex-shrink-0"
                style={{ border: '1px solid rgba(201,168,76,0.3)', background: 'rgba(201,168,76,0.08)' }}
              >
                <img
                  src={brandConfig.logo.url}
                  alt={brandConfig.logo.alt}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3
                  className="text-xl font-bold gold-text"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {brandConfig.name}
                </h3>
                <p className="text-sm" style={{ color: '#8B6914' }}>{brandConfig.slogan}</p>
              </div>
            </div>

            <p className="leading-relaxed mb-8 max-w-md font-light" style={{ color: '#D4C5A0' }}>
              {brandConfig.company.description}
            </p>

            {/* Redes sociales */}
            <div className="flex space-x-3">
              <a href={brandConfig.social.facebook} className="social-btn" title="Facebook">
                <span>📘</span>
              </a>
              <a href={brandConfig.social.instagram} className="social-btn" title="Instagram">
                <span>📷</span>
              </a>
              <a href={brandConfig.social.twitter} className="social-btn" title="Twitter">
                <span>🐦</span>
              </a>
            </div>
          </div>

          {/* COLUMNA 2: Enlaces rápidos */}
          <div>
            <h4
              className="text-lg font-bold mb-2"
              style={{ fontFamily: "'Playfair Display', serif", color: '#F5F0E8' }}
            >
              Enlaces Rápidos
            </h4>
            <GoldDivider />
            <ul className="space-y-3 mt-5">
              {[
                { to: '/', label: 'Inicio' },
                { to: '/products', label: 'Productos' },
                { to: '/about', label: 'Nosotros' },
                { to: '/contact', label: 'Contacto' }
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="footer-link text-sm font-medium">
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>

            <h5
              className="text-md font-semibold mt-8 mb-2"
              style={{ color: '#F5F0E8' }}
            >
              Soporte
            </h5>
            <GoldDivider />
            <ul className="space-y-2 mt-4">
              {['Centro de Ayuda', 'Términos de Servicio', 'Política de Privacidad'].map((item) => (
                <li key={item}>
                  <a href="#" className="footer-link-plain">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* COLUMNA 3: Contacto */}
          <div>
            <h4
              className="text-lg font-bold mb-2"
              style={{ fontFamily: "'Playfair Display', serif", color: '#F5F0E8' }}
            >
              Contacto
            </h4>
            <GoldDivider />

            <div className="space-y-5 mt-5">
              {[
                { icon: '📍', title: 'Dirección', content: 'Calle Principal #123\nCentro, Ciudad 12345' },
                { icon: '📞', title: 'Teléfono', content: '+1 (555) 123-4567' },
                { icon: '✉️', title: 'Email', content: 'info@mitienda.com' },
                { icon: '🕒', title: 'Horarios', content: 'Lun - Vie: 9AM - 6PM\nSáb: 10AM - 4PM' }
              ].map(({ icon, title, content }) => (
                <div key={title} className="flex items-start space-x-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}
                  >
                    <span className="text-sm">{icon}</span>
                  </div>
                  <div>
                    <h6 className="font-medium text-sm mb-0.5" style={{ color: '#C9A84C' }}>{title}</h6>
                    <p className="text-sm whitespace-pre-line font-light" style={{ color: '#D4C5A0' }}>{content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Separador ── */}
        <div className="pt-2 pb-4">
          <GoldDivider />
        </div>

        {/* ── Barra inferior ── */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0 pt-4">

          {/* Copyright */}
          <div className="text-center md:text-left">
            <p className="text-sm" style={{ color: '#8B6914' }}>
              &copy; 2025 Mi Tienda Online. Todos los derechos reservados.
            </p>
            <p className="text-xs mt-1" style={{ color: '#5a4a20' }}>
              Desarrollado con ❤️ usando React + TypeScript + TailwindCSS
            </p>
          </div>

          {/* Badges de confianza */}
          
        </div>
      </div>
    </footer>
  );
};

export default Footer;