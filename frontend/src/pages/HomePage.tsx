import React from 'react'; 
import { Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/shop/ProductCard';
import Loading from '../components/common/Loading';
import { brandConfig } from '../utils/brandConfig';

/* ─── Shared style tag – same as AboutPage ─── */
const GOLD_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
  .gold-text {
    background: linear-gradient(135deg, #E8C97A 0%, #C9A84C 50%, #8B6914 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .grain-overlay::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events: none;
    opacity: 0.35;
    mix-blend-mode: overlay;
  }
  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  .shimmer-line {
    background: linear-gradient(90deg, transparent, #C9A84C44, transparent);
    background-size: 200% 100%;
    animation: shimmer 3s ease-in-out infinite;
  }
  @keyframes floatUp {
    0%,100% { transform: translateY(0px); opacity: 0.15; }
    50% { transform: translateY(-20px); opacity: 0.35; }
  }
`;

const GoldDivider = () => (
  <div className="flex items-center justify-center gap-4 my-2">
    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-600/60" />
    <div className="w-2 h-2 rotate-45 bg-amber-500" />
    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-600/60" />
  </div>
);

const HomePage: React.FC = () => {
  const { products, loading } = useProducts();
  const featuredProducts = products.slice(0, 3);

  return (
    <div style={{ backgroundColor: '#0A0A08', fontFamily: "'Lato', sans-serif" }}>
      <style>{GOLD_STYLES}</style>

      {/* ══════════ HERO SECTION ══════════ */}
      <section
        className="relative min-h-screen flex items-center justify-center overflow-hidden grain-overlay"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, #2a1a00 0%, #0A0A08 70%)' }}
      >
        {/* Partículas flotantes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${Math.random() * 5 + 1}px`,
                height: `${Math.random() * 5 + 1}px`,
                backgroundColor: '#C9A84C',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `floatUp ${4 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 4}s`,
              }}
            />
          ))}
        </div>

        {/* Línea shimmer superior */}
        <div className="absolute top-0 inset-x-0 h-px shimmer-line" />

        {/* Contenido HERO */}
        <div className="relative z-10 container mx-auto px-6 py-20 text-center">
          <div
            className="inline-flex items-center space-x-3 border border-amber-700/50 rounded-full px-6 py-3 mb-10
              bg-amber-950/30 backdrop-blur-sm"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span
              className="font-semibold text-2xl lg:text-3xl"
              style={{ color: '#E8C97A', fontFamily: "'Playfair Display', serif" }}
            >
              ✨ Bienvenido ✨
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          </div>

          <h1
            className="font-black mb-6 leading-none gold-text"
            style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(3.5rem, 9vw, 8rem)' }}
          >
            {brandConfig.name}
          </h1>

          <p
            className="text-lg lg:text-xl mb-8 leading-relaxed max-w-3xl mx-auto italic font-light tracking-wide"
            style={{ color: '#D4C5A0' }}
          >
            .
          </p>
        </div>

        {/* Degradado inferior */}
        <div
          className="absolute bottom-0 inset-x-0 h-32"
          style={{ background: 'linear-gradient(to top, #0A0A08, transparent)' }}
        />
      </section>

      {/* ══════════ SECCIÓN EQUIPO / MINA ══════════ */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-xs tracking-[0.35em] uppercase mb-4" style={{ color: '#C9A84C' }}>
              Operaciones
            </p>
            <GoldDivider />

            {/* Imagen */}
            <div
              className="relative rounded-3xl overflow-hidden aspect-video mt-10 mb-8 shadow-2xl"
              style={{ border: '1px solid rgba(201,168,76,0.25)' }}
            >
              <img
                src=""
                alt="Mina el naranjo"
                className="w-full h-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to top, #0A0A08 0%, rgba(10,10,8,0.3) 60%, transparent 100%)' }}
              />
            </div>

            <h3
              className="text-2xl font-bold mb-2"
              style={{ fontFamily: "'Playfair Display', serif", color: '#F5F0E8' }}
            >
              Mina el naranjo
            </h3>
            <p className="mb-6 font-light" style={{ color: '#D4C5A0' }}>
              la mejor mina para sacar oro
            </p>

            {/* Estrellas */}
            <div className="flex items-center justify-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-5 h-5 fill-current" style={{ color: '#C9A84C' }} viewBox="0 0 20 20">
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ PRODUCTOS DESTACADOS ══════════ */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          {/* Encabezado */}
          <div className="text-center mb-16">
            <div
              className="inline-flex items-center gap-2 border border-amber-700/50 rounded-full px-5 py-2 mb-6
                bg-amber-950/30 backdrop-blur-sm"
            >
              <span style={{ color: '#C9A84C' }}>⭐</span>
              <span className="text-xs tracking-[0.3em] uppercase font-medium" style={{ color: '#C9A84C' }}>
                Productos Destacados
              </span>
              <span style={{ color: '#C9A84C' }}>⭐</span>
            </div>

            <h2
              className="text-4xl lg:text-5xl font-bold mb-4"
              style={{ fontFamily: "'Playfair Display', serif", color: '#F5F0E8' }}
            >
              Los más <span className="gold-text">populares</span>
            </h2>
            <GoldDivider />
            <p className="mt-6 font-light max-w-2xl mx-auto" style={{ color: '#D4C5A0' }}>
              Descubre los productos más vendidos y mejor valorados por nuestra comunidad
            </p>
          </div>

          {/* Grid productos */}
          {loading ? (
            <div className="flex justify-center">
              <Loading message="Cargando productos increíbles..." size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="text-center mt-14">
            <Link
              to="/products"
              className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-sm
                tracking-widest uppercase transition-all duration-300 hover:scale-105 hover:shadow-xl
                hover:shadow-amber-900/40"
              style={{ background: 'linear-gradient(135deg, #C9A84C, #8B6914)', color: '#0A0A08' }}
            >
              <span>Ver Todos los Productos</span>
              <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;