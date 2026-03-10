import React, { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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

const GOLD_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
  .gold-text { background:linear-gradient(135deg,#E8C97A,#C9A84C 50%,#8B6914); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
  .gold-btn { background:linear-gradient(135deg,#C9A84C,#8B6914); color:#0A0A08; font-weight:700; transition:all 0.3s; border:none; cursor:pointer; }
  .gold-btn:hover { transform:scale(1.04); box-shadow:0 12px 32px rgba(201,168,76,0.35); }
  .worker-card { background:linear-gradient(135deg,#1a1200,#0f0c00); border:1px solid rgba(201,168,76,0.18); border-radius:1.5rem; padding:1rem; display:flex; align-items:center; cursor:pointer; transition:all 0.3s; }
  .worker-card:hover { border-color:rgba(201,168,76,0.45); transform:translateY(-4px); box-shadow:0 20px 40px rgba(0,0,0,0.5); }
`;

const MascotaCard = () => {
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

  const getEstadoStyle = (estado: string) => {
    if (estado === 'Disponible') return { bg: 'rgba(34,197,94,0.12)', color: '#86efac', border: 'rgba(34,197,94,0.3)' };
    if (estado === 'En proceso') return { bg: 'rgba(201,168,76,0.12)', color: '#C9A84C', border: 'rgba(201,168,76,0.3)' };
    return { bg: 'rgba(59,130,246,0.12)', color: '#93c5fd', border: 'rgba(59,130,246,0.3)' };
  };

  /* Loading */
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <style>{GOLD_STYLES}</style>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-2 border-transparent animate-spin mx-auto mb-4"
            style={{ borderTopColor: '#C9A84C', borderRightColor: '#8B6914' }} />
          <p className="text-lg" style={{ color: '#D4C5A0', fontFamily: "'Lato', sans-serif" }}>
            Cargando tus mascotas...
          </p>
        </div>
      </div>
    );
  }

  /* Error */
  if (error) {
    return (
      <div className="p-6">
        <style>{GOLD_STYLES}</style>
        <div className="max-w-md mx-auto text-center rounded-2xl p-8"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', fontFamily: "'Lato', sans-serif" }}>
          <p className="font-semibold mb-2" style={{ color: '#f87171' }}>❌ Error al cargar mascotas</p>
          <p className="text-sm mb-6" style={{ color: '#fca5a5' }}>{error}</p>
          <button onClick={() => window.location.reload()} className="gold-btn px-6 py-2 rounded-xl">Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" style={{ fontFamily: "'Lato', sans-serif" }}>
      <style>{GOLD_STYLES}</style>

      {/* Botón nuevo trabajador */}
      <div className="flex justify-center mb-10">
        <button onClick={irAFormularioNueva} className="gold-btn px-8 py-4 rounded-2xl flex items-center gap-3 tracking-widest uppercase text-sm">
          <span className="text-xl">➕</span>
          nuevo trabajadores
        </button>
      </div>

      {/* Lista */}
      <div className="flex flex-wrap justify-center gap-8">
        {mascotas.length > 0 ? (
          mascotas.map((m) => {
            const estadoStyle = getEstadoStyle(m.estado);
            return (
              <div
                key={m._id}
                onClick={() => irADetalle(m._id)}
                className="worker-card"
                style={{ width: '344px' }}
              >
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
                      <span className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{ background: estadoStyle.bg, color: estadoStyle.color, border: `1px solid ${estadoStyle.border}` }}>
                        {m.estado}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="ml-4" style={{ color: '#8B6914' }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-20 max-w-md mx-auto">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}>
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

export default MascotaCard;