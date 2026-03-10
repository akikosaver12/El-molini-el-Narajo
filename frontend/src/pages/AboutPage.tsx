import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { brandConfig } from '../utils/brandConfig';

/* ─────────────────────────────────────────────
   Paleta de colores:
   Fondo principal: #0A0A08 (negro cálido)
   Dorado principal: #C9A84C
   Dorado claro: #E8C97A
   Dorado oscuro: #8B6914
   Crema / texto secundario: #D4C5A0
   Blanco roto: #F5F0E8
───────────────────────────────────────────── */

const PROCESS_STEPS = [
  {
    number: '01',
    icon: '🗺️',
    title: 'Exploración Geológica',
    subtitle: 'Prospección y Análisis del Terreno',
    description:
      'Nuestros geólogos realizan estudios sísmicos y de perforación exploratoria para identificar yacimientos con alto contenido aurífero. Utilizamos tecnología de sensores remotos y software geoespacial avanzado para mapear con precisión cada veta mineral.',
    machines: ['Sondas de perforación rotativa', 'Drones topográficos LiDAR', 'Laboratorio geoquímico móvil'],
    color: 'from-amber-950 to-stone-900',
  },
  {
    number: '02',
    icon: '💣',
    title: 'Extracción y Voladura',
    subtitle: 'Minería a Cielo Abierto y Subterránea',
    description:
      'Con explosivos de precisión, liberamos el mineral de la roca madre. Nuestras operaciones de voladura controlada minimizan el impacto ambiental mientras maximizan el rendimiento de cada tonelada extraída.',
    machines: ['Excavadoras CAT 395', 'Perforadoras Sandvik DR412i', 'Camiones de acarreo Komatsu 730E'],
    color: 'from-stone-900 to-amber-950',
  },
  {
    number: '03',
    icon: '⚙️',
    title: 'Trituración y Molienda',
    subtitle: 'Reducción Granulométrica del Mineral',
    description:
      'El mineral bruto pasa por una serie de trituradoras primarias, secundarias y molinos de bolas que reducen el tamaño de partícula hasta micras, maximizando la superficie de contacto para la etapa de lixiviación.',
    machines: ['Trituradora de mandíbulas 48×60"', 'Molino SAG de 28 pies', 'Molinos de bolas 18×24"'],
    color: 'from-amber-950 to-stone-900',
  },
  {
    number: '04',
    icon: '🧪',
    title: 'Lixiviación con Cianuro',
    subtitle: 'Disolución Química del Oro',
    description:
      'El mineral molido se mezcla en circuitos de lixiviación con solución de cianuro de sodio controlada. El oro se disuelve formando un complejo aurocianuro que es captado eficientemente en la siguiente etapa.',
    machines: ['Tanques agitados CIL de 1,200 m³', 'Dosificadores de cianuro automáticos', 'Sistemas de detoxificación INCO'],
    color: 'from-stone-900 to-amber-950',
  },
  {
    number: '05',
    icon: '🔥',
    title: 'Fundición y Refinación',
    subtitle: 'Obtención del Oro Doré',
    description:
      'El precipitado de oro es sometido a hornos de fundición a 1,200 °C para producir lingotes Doré (aleación Au-Ag). Posteriormente, la refinería electrolítica eleva la pureza hasta 99.99%, conocida como oro de cuatro nueves.',
    machines: ['Hornos de inducción Inductotherm', 'Celdas electrolíticas de refinación', 'Analizador XRF Olympus Vanta'],
    color: 'from-amber-950 to-stone-900',
  },
  {
    number: '06',
    icon: '📦',
    title: 'Certificación y Venta',
    subtitle: 'Comercialización Global',
    description:
      'Cada lingote es pesado, analizado y certificado por laboratorios independientes. Operamos bajo los estándares de la London Bullion Market Association (LBMA) para comercializar nuestro oro en los mercados internacionales con total transparencia.',
    machines: ['Balanzas de precisión Mettler Toledo', 'Sistemas de custodia certificada', 'Plataforma de trading Bloomberg Terminal'],
    color: 'from-stone-900 to-amber-950',
  },
];

const STATS = [
  { value: '99.99%', label: 'Pureza del oro refinado' },
  { value: '1,200°C', label: 'Temperatura de fundición' },
  { value: 'LBMA', label: 'Certificación internacional' },
  { value: '6 Etapas', label: 'Proceso controlado' },
];

/* ── Componente de línea decorativa dorada ── */
const GoldDivider = () => (
  <div className="flex items-center justify-center gap-4 my-2">
    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-600/60" />
    <div className="w-2 h-2 rotate-45 bg-amber-500" />
    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-600/60" />
  </div>
);

/* ── Tarjeta de paso del proceso ── */
const ProcessCard: React.FC<{ step: typeof PROCESS_STEPS[0]; index: number }> = ({ step, index }) => {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const isEven = index % 2 === 0;

  return (
    <div
      ref={ref}
      className={`flex flex-col lg:flex-row items-start gap-8 transition-all duration-700 ease-out
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
        ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'}
      `}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      {/* Número + icono */}
      <div className="flex-shrink-0 flex flex-col items-center lg:w-32">
        <div
          className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center border border-amber-600/40
            bg-gradient-to-br from-amber-950/80 to-stone-900 shadow-lg shadow-amber-900/20"
        >
          <span className="text-2xl leading-none mb-1">{step.icon}</span>
          <span
            className="text-xs font-bold tracking-widest"
            style={{ color: '#C9A84C', fontFamily: "'Playfair Display', serif" }}
          >
            {step.number}
          </span>
        </div>
        {/* línea vertical conectora */}
        {index < PROCESS_STEPS.length - 1 && (
          <div className="w-px h-16 mt-3 bg-gradient-to-b from-amber-600/50 to-transparent hidden lg:block" />
        )}
      </div>

      {/* Contenido */}
      <div
        className="flex-1 rounded-2xl border border-amber-800/20 bg-gradient-to-br from-stone-900/90 to-black/80 p-8
          backdrop-blur-sm shadow-xl shadow-black/40 hover:border-amber-600/40 transition-colors duration-300"
      >
        <p className="text-xs tracking-[0.25em] uppercase mb-2" style={{ color: '#C9A84C' }}>
          {step.subtitle}
        </p>
        <h3
          className="text-2xl font-bold mb-4 text-amber-50"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {step.title}
        </h3>
        <p className="text-stone-400 leading-relaxed mb-6 text-[15px]">{step.description}</p>

        {/* Maquinaria */}
        <div>
          <p className="text-xs tracking-widest uppercase mb-3" style={{ color: '#8B6914' }}>
            Maquinaria Utilizada
          </p>
          <div className="flex flex-wrap gap-2">
            {step.machines.map((m) => (
              <span
                key={m}
                className="text-xs px-3 py-1.5 rounded-full border border-amber-800/40 text-amber-200/70
                  bg-amber-950/40 tracking-wide"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════ */
const AboutPage: React.FC = () => {
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: '#0A0A08', fontFamily: "'Lato', sans-serif" }}
    >
      {/* ── Fuentes ── */}
      <style>{`
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
      `}</style>

      {/* ════════════ HERO ════════════ */}
      <section
        className="relative overflow-hidden grain-overlay"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, #2a1a00 0%, #0A0A08 70%)',
          minHeight: '92vh',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {/* Partículas decorativas */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(18)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full opacity-20"
              style={{
                width: `${Math.random() * 4 + 1}px`,
                height: `${Math.random() * 4 + 1}px`,
                backgroundColor: '#C9A84C',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `shimmer ${3 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        {/* Línea horizontal superior decorativa */}
        <div className="absolute top-0 inset-x-0 h-px shimmer-line" />

        <div className="container mx-auto px-6 relative z-10">
          <div
            className={`max-w-5xl mx-auto text-center transition-all duration-1000 ease-out
              ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 border border-amber-700/50 rounded-full px-5 py-2 mb-10
                bg-amber-950/30 backdrop-blur-sm"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs tracking-[0.3em] uppercase font-light" style={{ color: '#C9A84C' }}>
                Minería Aurífera de Precisión
              </span>
            </div>

            {/* Título */}
            <h1
              className="font-black mb-4 leading-none"
              style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(3rem, 8vw, 7rem)' }}
            >
              <span className="gold-text">{brandConfig?.name ?? 'Áurum'}</span>
            </h1>
            <p
              className="text-lg tracking-[0.4em] uppercase font-light mb-10"
              style={{ color: '#8B6914' }}
            >
              Del yacimiento al mercado global
            </p>

            <GoldDivider />

            <p
              className="mt-10 text-lg leading-relaxed max-w-3xl mx-auto font-light"
              style={{ color: '#D4C5A0' }}
            >
              Somos una empresa minera con más de dos décadas de experiencia en la extracción, 
              procesamiento y comercialización de oro de alta pureza. Operamos con los más altos 
              estándares de seguridad, responsabilidad ambiental y excelencia técnica para llevar 
              el oro desde las profundidades de la tierra hasta los mercados internacionales.
            </p>

            {/* Stats rápidas */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
              {STATS.map((s, i) => (
                <div
                  key={s.label}
                  className="text-center"
                  style={{
                    transitionDelay: `${200 + i * 100}ms`,
                    opacity: heroVisible ? 1 : 0,
                    transform: heroVisible ? 'translateY(0)' : 'translateY(12px)',
                    transition: 'all 0.7s ease-out',
                  }}
                >
                  <p
                    className="text-2xl font-bold mb-1 gold-text"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {s.value}
                  </p>
                  <p className="text-xs tracking-wider uppercase" style={{ color: '#8B6914' }}>
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gradiente inferior */}
        <div
          className="absolute bottom-0 inset-x-0 h-32"
          style={{ background: 'linear-gradient(to top, #0A0A08, transparent)' }}
        />
      </section>

      {/* ════════════ PROCESO ════════════ */}
      <section className="py-24 px-6">
        <div className="container mx-auto">
          {/* Encabezado de sección */}
          <div className="text-center mb-20">
            <p className="text-xs tracking-[0.35em] uppercase mb-4" style={{ color: '#C9A84C' }}>
              Proceso de Producción
            </p>
            <h2
              className="text-4xl lg:text-5xl font-bold mb-6"
              style={{ fontFamily: "'Playfair Display', serif", color: '#F5F0E8' }}
            >
              De la Mina al Lingote
            </h2>
            <GoldDivider />
            <p className="mt-6 text-stone-400 max-w-2xl mx-auto leading-relaxed">
              Cada gramo de oro que producimos atraviesa un riguroso proceso de seis etapas, 
              controlado por ingenieros especializados y tecnología de punta, garantizando 
              la máxima calidad y trazabilidad en cada paso.
            </p>
          </div>

          {/* Tarjetas del proceso */}
          <div className="max-w-5xl mx-auto space-y-10">
            {PROCESS_STEPS.map((step, index) => (
              <ProcessCard key={step.number} step={step} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ NUESTRA HISTORIA ════════════ */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div
            className="max-w-4xl mx-auto rounded-3xl p-12 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #1a1200 0%, #0f0c00 50%, #1a1200 100%)',
              border: '1px solid rgba(201,168,76,0.25)',
            }}
          >
            {/* Detalle esquina */}
            <div
              className="absolute top-0 right-0 w-40 h-40 opacity-10"
              style={{
                background: 'radial-gradient(circle at top right, #C9A84C, transparent 70%)',
              }}
            />

            <p className="text-xs tracking-[0.3em] uppercase mb-4" style={{ color: '#C9A84C' }}>
              Quiénes Somos
            </p>
            <h2
              className="text-3xl lg:text-4xl font-bold mb-8"
              style={{ fontFamily: "'Playfair Display', serif", color: '#F5F0E8' }}
            >
              Nuestra Historia
            </h2>
            <GoldDivider />

            <div className="mt-8 space-y-6 text-stone-400 leading-relaxed text-[15px]">
              <p>
                Nuestra historia comienza en la profundidad de las cordilleras, con un equipo de 
                geólogos y mineros que compartían un mismo sueño: extraer el oro de forma responsable, 
                con respeto por la tierra y por las comunidades que habitan cerca de nuestras operaciones. 
                Desde nuestros primeros proyectos exploratorios, cada decisión ha estado guiada por 
                la búsqueda de la excelencia técnica y la ética empresarial.
              </p>
              <p>
                Con el paso de los años, hemos incorporado tecnología de vanguardia en cada etapa de 
                nuestra cadena productiva —desde la perforación exploratoria hasta la refinación 
                electrolítica— alcanzando una pureza de 99.99% en nuestros lingotes certificados. 
                Hoy, somos un referente en la industria aurífera, reconocidos por la trazabilidad 
                de nuestro producto y por nuestro compromiso ambiental con cero vertimientos y 
                planes de cierre responsable de minas.
              </p>
              <p>
                Nuestro mayor orgullo no es el oro que extraemos, sino la forma en que lo hacemos: 
                con transparencia, con tecnología y con la convicción de que la minería puede ser 
                un motor de desarrollo sostenible para las regiones donde operamos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════ CALL TO ACTION ════════════ */}
      <section className="py-20 px-6 relative overflow-hidden">
        {/* Fondo con gradiente dorado sutil */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 70% 60% at 50% 50%, #2a1a00 0%, #0A0A08 80%)',
          }}
        />
        <div className="absolute inset-0 shimmer-line opacity-30" />

        <div className="container mx-auto relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs tracking-[0.35em] uppercase mb-5" style={{ color: '#C9A84C' }}>
              Nuestros Productos
            </p>
            <h2
              className="text-4xl lg:text-5xl font-bold mb-6"
              style={{ fontFamily: "'Playfair Display', serif", color: '#F5F0E8' }}
            >
              Oro Certificado <br />
              <span className="gold-text">Para el Mundo</span>
            </h2>
            <GoldDivider />
            <p className="mt-8 mb-12 text-stone-400 leading-relaxed max-w-xl mx-auto">
              Ofrecemos lingotes y granallas de oro certificados bajo estándar LBMA, disponibles 
              para inversores institucionales, joyeros y mercados industriales. Cada producto incluye 
              certificado de análisis, peso exacto y número de trazabilidad.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/products"
                className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl
                  font-bold text-sm tracking-widest uppercase overflow-hidden transition-all duration-300
                  hover:scale-105 hover:shadow-xl hover:shadow-amber-900/40"
                style={{
                  background: 'linear-gradient(135deg, #C9A84C, #8B6914)',
                  color: '#0A0A08',
                }}
              >
                <span>Explorar Catálogo</span>
                <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>

              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl
                  font-bold text-sm tracking-widest uppercase border transition-all duration-300
                  hover:scale-105 hover:bg-amber-950/30"
                style={{ borderColor: 'rgba(201,168,76,0.5)', color: '#C9A84C' }}
              >
                Contactar un Asesor
              </Link>
            </div>

            <p className="mt-10 text-xs tracking-widest uppercase" style={{ color: '#8B6914' }}>
              🔒 Operaciones certificadas &nbsp;·&nbsp; 🌿 Minería responsable &nbsp;·&nbsp; 🌍 Mercados LBMA
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;