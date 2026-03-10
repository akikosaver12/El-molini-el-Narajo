import React, { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { Search, X } from "lucide-react";

const API_URL = process.env.REACT_APP_API_URL || "https://biosys1.onrender.com/api";

interface Mascota {
  especie: ReactNode;
  _id: string;
  nombre: string;
  edad: string;
  genero: string;
  raza: string;
  estado: string;
  imagenUrl?: string;
}

interface Props {
  searchTerm?: string;
}

/* ─── Estilos dorados compartidos ─── */
const GOLD_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
  .gold-text { background:linear-gradient(135deg,#E8C97A,#C9A84C 50%,#8B6914); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
  .gold-btn { background:linear-gradient(135deg,#C9A84C,#8B6914); color:#0A0A08; font-weight:700; transition:all 0.3s; }
  .gold-btn:hover { transform:scale(1.04); box-shadow:0 12px 32px rgba(201,168,76,0.3); }
  .card-dark { background:linear-gradient(135deg,#1a1200 0%,#0f0c00 100%); border:1px solid rgba(201,168,76,0.18); transition:all 0.3s; }
  .card-dark:hover { border-color:rgba(201,168,76,0.45); transform:translateY(-4px); box-shadow:0 20px 40px rgba(0,0,0,0.5); }
  .gold-input { background:#0f0c00; border:1px solid rgba(201,168,76,0.25); color:#D4C5A0; border-radius:1rem; padding:1rem 1rem 1rem 3rem; width:100%; outline:none; transition:border-color 0.2s; font-family:'Lato',sans-serif; }
  .gold-input:focus { border-color:#C9A84C; }
  .gold-input::placeholder { color:rgba(212,197,160,0.4); }
  @keyframes shimmer { 0%{background-position:-200% center;} 100%{background-position:200% center;} }
  .shimmer-line { background:linear-gradient(90deg,transparent,#C9A84C44,transparent); background-size:200% 100%; animation:shimmer 3s ease-in-out infinite; }
`;

const GoldDivider = () => (
  <div className="flex items-center justify-center gap-4 my-2">
    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-600/60" />
    <div className="w-2 h-2 rotate-45 bg-amber-500" />
    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-600/60" />
  </div>
);

/* ══════════════════════════════════════════
   MascotaCard Component
══════════════════════════════════════════ */
const MascotaCard: React.FC<Props> = ({ searchTerm = "" }) => {
  const navigate = useNavigate();
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMascotas = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) { setError("No hay sesión activa"); setLoading(false); return; }
        const res = await fetch(`${API_URL}/mascotas`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
        const data = await res.json();
        setMascotas(data);
        setError(null);
      } catch (err) {
        console.error("Error al obtener mascotas:", err);
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally { setLoading(false); }
    };
    fetchMascotas();
  }, []);

  const irADetalle = (id: string) => navigate(`/mascota/${id}`);
  const irAFormularioNueva = () => navigate("/nueva-mascota");

  /* Loading */
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <div
            className="w-16 h-16 rounded-full border-2 border-transparent animate-spin mx-auto mb-4"
            style={{ borderTopColor: '#C9A84C', borderRightColor: '#8B6914' }}
          />
          <p className="text-lg" style={{ color: '#D4C5A0' }}>Cargando trabajadores...</p>
        </div>
      </div>
    );
  }

  /* Error */
  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto text-center rounded-2xl p-8" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <p className="font-semibold mb-2" style={{ color: '#f87171' }}>❌ Error al cargar trabajadores</p>
          <p className="text-sm mb-6" style={{ color: '#fca5a5' }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="gold-btn px-6 py-2 rounded-xl"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const filterTerm = searchTerm.trim().toLowerCase();
  const filteredMascotas = mascotas.filter(m => {
    if (!filterTerm) return true;
    const combined = [m.nombre, m._id, String(m.especie), m.raza, m.genero, m.estado, m.edad].join(" ").toLowerCase();
    return combined.includes(filterTerm);
  });

  const getEstadoStyle = (estado: string) => {
    if (estado === 'Disponible') return { bg: 'rgba(34,197,94,0.12)', color: '#86efac', border: 'rgba(34,197,94,0.3)' };
    if (estado === 'En proceso') return { bg: 'rgba(201,168,76,0.12)', color: '#C9A84C', border: 'rgba(201,168,76,0.3)' };
    return { bg: 'rgba(59,130,246,0.12)', color: '#93c5fd', border: 'rgba(59,130,246,0.3)' };
  };

  return (
    <div className="p-6">
      {/* Botón nuevo trabajador */}
      <div className="flex justify-center mb-10">
        <button
          onClick={irAFormularioNueva}
          className="gold-btn px-8 py-4 rounded-2xl flex items-center gap-3 tracking-widest uppercase text-sm"
        >
          <span className="text-xl">➕</span>
          nuevo trabajadores
        </button>
      </div>

      {/* Lista */}
      <div className="flex flex-wrap justify-center gap-8">
        {filteredMascotas.length > 0 ? (
          filteredMascotas.map(m => {
            const estadoStyle = getEstadoStyle(m.estado);
            return (
              <div
                key={m._id}
                onClick={() => irADetalle(m._id)}
                className="card-dark flex rounded-3xl p-4 cursor-pointer"
                style={{ width: '344px' }}
              >
                {/* Imagen */}
                <img
                  src={m.imagenUrl || "https://via.placeholder.com/150?text=Sin+Imagen"}
                  alt={m.nombre}
                  className="w-32 h-40 object-cover rounded-2xl mr-6 shadow-md flex-shrink-0"
                  style={{ border: '1px solid rgba(201,168,76,0.2)' }}
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/150?text=Error"; }}
                />

                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: '#F5F0E8' }}>
                    {m.nombre}
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center gap-2" style={{ color: '#D4C5A0' }}>
                      <span style={{ color: '#C9A84C' }}>🎂 Edad:</span>
                      {m.edad} {parseInt(m.edad) === 1 ? 'año' : 'años'}
                    </p>
                    <p className="flex items-center gap-2" style={{ color: '#D4C5A0' }}>
                      <span style={{ color: '#C9A84C' }}>{m.genero === 'Macho' ? '♂️' : '♀️'} Género:</span>
                      {m.genero}
                    </p>
                    <p className="flex items-center gap-2" style={{ color: '#D4C5A0' }}>
                      <span style={{ color: '#C9A84C' }}>trabajador:</span>
                      {m.especie}
                    </p>
                    <p className="flex items-center gap-2">
                      <span style={{ color: '#C9A84C' }}>📊 Estado:</span>
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{ background: estadoStyle.bg, color: estadoStyle.color, border: `1px solid ${estadoStyle.border}` }}
                      >
                        {m.estado}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="ml-4 flex items-center" style={{ color: '#8B6914' }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-20 max-w-md mx-auto">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}
            >
              <span className="text-6xl">👥</span>
            </div>
            <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: '#F5F0E8' }}>
              No hay trabajadores registrados
            </h3>
            <p className="mb-8 font-light" style={{ color: '#D4C5A0' }}>
              ¡Registra tu primer trabajador para comenzar a gestionar el personal!
            </p>
            <button onClick={irAFormularioNueva} className="gold-btn px-6 py-3 rounded-xl">
              Registrar Primer Trabajador
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════
   MascotaPage Principal
══════════════════════════════════════════ */
const MascotaPage = () => {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div style={{ backgroundColor: '#0A0A08', fontFamily: "'Lato', sans-serif", minHeight: '100vh' }}>
      <style>{GOLD_STYLES}</style>

      {/* Hero / Encabezado */}
      <section
        className="relative py-16 overflow-hidden"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, #2a1a00 0%, #0A0A08 70%)' }}
      >
        <div className="absolute top-0 inset-x-0 h-px shimmer-line" />

        <div className="container mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto">
            <div
              className="inline-flex items-center gap-2 border border-amber-700/50 rounded-full px-5 py-2 mb-6 bg-amber-950/30"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs tracking-[0.3em] uppercase" style={{ color: '#C9A84C' }}>Personal de la Mina</span>
            </div>

            <h1
              className="font-black mb-4 leading-none"
              style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2.5rem,7vw,5rem)', color: '#F5F0E8' }}
            >
              <span className="gold-text">trabajadores</span>
            </h1>

            <GoldDivider />

            <p className="mt-6 font-light text-lg mb-10" style={{ color: '#D4C5A0' }}>
              trabajadores registrados
            </p>

            {/* Barra de búsqueda */}
            <div className="relative max-w-2xl mx-auto">
              <Search
                className="absolute left-4 top-1/2 transform -translate-y-1/2"
                size={20}
                style={{ color: '#8B6914' }}
              />
              <input
                type="text"
                placeholder="Buscar por nombre, documento, cargo, horario o estado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="gold-input text-lg"
                style={{ paddingLeft: '3rem', paddingRight: searchTerm ? '3rem' : '1rem' }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 transition-colors"
                  style={{ color: '#8B6914' }}
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 h-16" style={{ background: 'linear-gradient(to top, #0A0A08, transparent)' }} />
      </section>

      <MascotaCard searchTerm={searchTerm} />
    </div>
  );
};

export default MascotaPage;