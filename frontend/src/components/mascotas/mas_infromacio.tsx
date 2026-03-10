import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Search, FileText, User, Calendar, Briefcase, ClipboardCheck, Footprints } from "lucide-react";

const API_URL = process.env.REACT_APP_API_URL || "https://biosys1.onrender.com/api";

interface HistorialItem { tipo: 'vacuna' | 'operacion'; nombre: string; descripcion?: string; fecha: string; fechaObj: Date; }
interface Vacuna { nombre: string; fecha: string; imagen?: { data: string; contentType: string; }; }
interface Operacion { nombre: string; descripcion: string; fecha: string; imagen?: { data: string; contentType: string; }; }
interface Mascota {
  _id: string; nombre?: string; tipoDocumento?: string; numeroDocumento?: string;
  estadoCivil?: string; fechaExamenOcupacional?: string; tallajeBotas?: string;
  especie?: string; estado?: string; raza?: string; edad?: number;
  fechaNacimiento?: string; genero?: string; enfermedades?: string;
  historial?: string; vacunas?: Vacuna[]; operaciones?: Operacion[];
  imagenUrl?: string; usuario?: { _id: string; name: string; email: string; };
  createdAt?: string; updatedAt?: string;
}

const GOLD_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
  .gold-text { background:linear-gradient(135deg,#E8C97A,#C9A84C 50%,#8B6914); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
  .card-dark { background:linear-gradient(135deg,#1a1200,#0f0c00); border:1px solid rgba(201,168,76,0.18); }
  .info-field { background:rgba(201,168,76,0.05); border:1px solid rgba(201,168,76,0.12); border-radius:0.75rem; padding:1rem; }
  .hist-vacuna { background:rgba(34,197,94,0.06); border:1px solid rgba(34,197,94,0.2); border-radius:0.75rem; padding:1rem; transition:box-shadow 0.2s; }
  .hist-vacuna:hover { box-shadow:0 4px 12px rgba(34,197,94,0.1); }
  .hist-operacion { background:rgba(59,130,246,0.06); border:1px solid rgba(59,130,246,0.2); border-radius:0.75rem; padding:1rem; transition:box-shadow 0.2s; }
  .hist-operacion:hover { box-shadow:0 4px 12px rgba(59,130,246,0.1); }
  .gold-search { background:#0f0c00; border:1px solid rgba(201,168,76,0.25); color:#D4C5A0; border-radius:0.75rem; padding:8px 12px 8px 36px; outline:none; transition:border-color 0.2s; font-family:'Lato',sans-serif; width:100%; }
  .gold-search:focus { border-color:#C9A84C; }
  .gold-search::placeholder { color:rgba(212,197,160,0.4); }
  .btn-volver { border:1px solid rgba(201,168,76,0.3); color:#C9A84C; background:transparent; border-radius:0.75rem; padding:8px 14px; font-size:0.875rem; font-weight:600; cursor:pointer; transition:all 0.2s; font-family:'Lato',sans-serif; }
  .btn-volver:hover { background:rgba(201,168,76,0.08); }
  .btn-editar { background:linear-gradient(135deg,#C9A84C,#8B6914); color:#0A0A08; border:none; border-radius:0.75rem; padding:8px 14px; font-size:0.875rem; font-weight:700; cursor:pointer; transition:all 0.2s; font-family:'Lato',sans-serif; }
  .btn-editar:hover { transform:scale(1.04); box-shadow:0 6px 16px rgba(201,168,76,0.3); }
  .btn-eliminar { background:rgba(239,68,68,0.12); color:#f87171; border:1px solid rgba(239,68,68,0.3); border-radius:0.75rem; padding:8px 14px; font-size:0.875rem; font-weight:600; cursor:pointer; transition:all 0.2s; font-family:'Lato',sans-serif; }
  .btn-eliminar:hover { background:rgba(239,68,68,0.22); }
  .section-title { display:flex; align-items:center; gap:8px; margin-bottom:1rem; }
  @keyframes shimmer { 0%{background-position:-200% center;} 100%{background-position:200% center;} }
  .shimmer-line { background:linear-gradient(90deg,transparent,#C9A84C44,transparent); background-size:200% 100%; animation:shimmer 3s ease-in-out infinite; }
`;

/* ── InfoField component ── */
const InfoField: React.FC<{ label: string; value?: string; icon?: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="info-field">
    <div className="flex items-center gap-2 mb-1">
      {icon && <span style={{ color: '#8B6914' }}>{icon}</span>}
      <h3 className="text-xs sm:text-sm font-medium" style={{ color: '#8B6914' }}>{label}</h3>
    </div>
    <p className="text-sm sm:text-base font-semibold" style={{ color: '#F5F0E8' }}>{value || "No especificado"}</p>
  </div>
);

/* ── ActionButtons component ── */
const MascotaCard: React.FC<{ mascota: Mascota; navigate: any }> = ({ mascota, navigate }) => {
  const handleDelete = async () => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este trabajador?")) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) { alert("No hay token de autenticación"); return; }
      const response = await fetch(`${API_URL}/mascotas/${mascota._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || "Error al eliminar trabajador"); }
      alert("✅ Trabajador eliminado con éxito");
      navigate("/mascotas");
    } catch (err) {
      console.error("Error eliminando trabajador:", err);
      alert("❌ Ocurrió un error al eliminar el trabajador");
    }
  };

  return (
    <div className="w-full lg:absolute lg:top-4 lg:right-4 flex flex-col sm:flex-row lg:flex-row gap-2 sm:gap-3 mb-4 lg:mb-0">
      <button className="btn-volver flex-1 sm:flex-none" onClick={() => navigate("/mascotas")}>← Volver</button>
      <button className="btn-editar flex-1 sm:flex-none" onClick={() => navigate(`/edit/${mascota._id}`)}>✏️ Editar</button>
      <button className="btn-eliminar flex-1 sm:flex-none" onClick={handleDelete}>🗑️ Eliminar</button>
    </div>
  );
};

/* ══════════════════════════════════════════
   MascotaInfo Principal
══════════════════════════════════════════ */
const MascotaInfo: React.FC = () => {
  const { idMascota } = useParams<{ idMascota: string }>();
  const navigate = useNavigate();
  const [mascota, setMascota] = useState<Mascota | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [historialCompleto, setHistorialCompleto] = useState<HistorialItem[]>([]);

  useEffect(() => {
    const fetchMascota = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) { setError("No hay token de autenticación"); setLoading(false); return; }
        if (!idMascota) { setError("No se proporcionó un ID de mascota"); setLoading(false); return; }

        const response = await fetch(`${API_URL}/mascotas/${idMascota}`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });
        if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || "Error al obtener los datos de la mascota"); }
        const data = await response.json();
        setMascota(data);

        const historial: HistorialItem[] = [];
        if (data.vacunas) data.vacunas.forEach((v: Vacuna) => historial.push({ tipo: 'vacuna', nombre: v.nombre, fecha: v.fecha, fechaObj: new Date(v.fecha) }));
        if (data.operaciones) data.operaciones.forEach((op: Operacion) => historial.push({ tipo: 'operacion', nombre: op.nombre, descripcion: op.descripcion, fecha: op.fecha, fechaObj: new Date(op.fecha) }));
        historial.sort((a, b) => b.fechaObj.getTime() - a.fechaObj.getTime());
        setHistorialCompleto(historial);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ocurrió un error desconocido");
      } finally { setLoading(false); }
    };
    fetchMascota();
  }, [idMascota]);

  const historialFiltrado = historialCompleto.filter(item => {
    const s = searchTerm.toLowerCase();
    return item.nombre.toLowerCase().includes(s) || (item.descripcion && item.descripcion.toLowerCase().includes(s));
  });

  /* Loading */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#0A0A08' }}>
        <style>{GOLD_STYLES}</style>
        <div className="text-center">
          <div className="w-14 h-14 rounded-full border-2 border-transparent animate-spin mx-auto mb-4"
            style={{ borderTopColor: '#C9A84C', borderRightColor: '#8B6914' }} />
          <p className="font-medium" style={{ color: '#D4C5A0', fontFamily: "'Lato', sans-serif" }}>
            Cargando información del trabajador...
          </p>
        </div>
      </div>
    );
  }

  /* Error */
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#0A0A08' }}>
        <style>{GOLD_STYLES}</style>
        <div className="rounded-2xl p-8 text-center max-w-md" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', fontFamily: "'Lato', sans-serif" }}>
          <p className="font-semibold text-lg mb-4" style={{ color: '#f87171' }}>❌ Error: {error}</p>
          <p className="text-sm mt-2" style={{ color: '#fca5a5' }}>
            {idMascota ? `ID de trabajador: ${idMascota}` : "Sin ID específico"}
          </p>
          <button onClick={() => window.location.reload()} className="mt-6 gold-btn px-6 py-3 rounded-xl"
            style={{ background: 'linear-gradient(135deg,#C9A84C,#8B6914)', color: '#0A0A08', fontWeight: 700, border: 'none', cursor: 'pointer', borderRadius: '0.75rem', padding: '12px 24px' }}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!mascota) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#0A0A08' }}>
        <style>{GOLD_STYLES}</style>
        <div className="rounded-2xl p-8" style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.2)', fontFamily: "'Lato', sans-serif" }}>
          <p style={{ color: '#D4C5A0' }}>No se encontró información del trabajador</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ backgroundColor: '#0A0A08', fontFamily: "'Lato', sans-serif" }}>
      <style>{GOLD_STYLES}</style>

      {/* ════ COLUMNA IZQUIERDA ════ */}
      <div className="w-full lg:w-2/3 p-4 sm:p-6 lg:p-10 space-y-6">
        <div className="card-dark rounded-3xl p-6 sm:p-8">

          {/* Nombre */}
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 gold-text" style={{ fontFamily: "'Playfair Display', serif" }}>
            {mascota.nombre || "Sin nombre"}
          </h1>
          <p className="text-xs sm:text-sm mb-8" style={{ color: '#8B6914' }}>Información del Trabajador</p>

          {/* Datos Personales */}
          <div className="mb-8">
            <div className="section-title">
              <User style={{ color: '#3b82f6' }} size={24} />
              <h2 className="text-xl font-semibold" style={{ color: '#F5F0E8' }}>Datos Personales</h2>
            </div>
            <div className="h-px mb-4" style={{ background: 'rgba(201,168,76,0.15)' }} />
            <div className="grid md:grid-cols-2 gap-4">
              <InfoField icon={<FileText size={16} />} label="Tipo de Documento" value={mascota.tipoDocumento} />
              <InfoField icon={<FileText size={16} />} label="Número de Documento" value={mascota.numeroDocumento} />
              <InfoField icon={<User size={16} />} label="Estado Civil" value={mascota.estadoCivil} />
              <InfoField icon={<Calendar size={16} />} label="Edad" value={mascota.edad ? `${mascota.edad} años` : undefined} />
              <InfoField icon={<User size={16} />} label="Género" value={mascota.genero === "Macho" ? "Masculino" : mascota.genero === "Hembra" ? "Femenino" : mascota.genero} />
              {mascota.fechaNacimiento && (
                <InfoField icon={<Calendar size={16} />} label="Fecha de Nacimiento" value={new Date(mascota.fechaNacimiento).toLocaleDateString('es-CO')} />
              )}
            </div>
          </div>

          {/* Información Laboral */}
          <div className="mb-8">
            <div className="section-title">
              <Briefcase style={{ color: '#C9A84C' }} size={24} />
              <h2 className="text-xl font-semibold" style={{ color: '#F5F0E8' }}>Información Laboral</h2>
            </div>
            <div className="h-px mb-4" style={{ background: 'rgba(201,168,76,0.15)' }} />
            <div className="grid md:grid-cols-2 gap-4">
              {mascota.fechaExamenOcupacional && (
                <InfoField icon={<ClipboardCheck size={16} />} label="Fecha Examen Ocupacional" value={new Date(mascota.fechaExamenOcupacional).toLocaleDateString('es-CO')} />
              )}
              {mascota.tallajeBotas && (
                <InfoField icon={<Footprints size={16} />} label="Tallaje de Botas" value={mascota.tallajeBotas} />
              )}
              <InfoField icon={<Briefcase size={16} />} label="Cargo" value={mascota.especie as string} />
              <InfoField icon={<Calendar size={16} />} label="Horario" value={mascota.raza} />
              <InfoField icon={<FileText size={16} />} label="Estado" value={mascota.estado} />
            </div>
          </div>

          {/* Observaciones */}
          {mascota.enfermedades && mascota.enfermedades !== "Ninguna" && (
            <div className="mt-6 p-4 rounded-xl" style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#fde047' }}>⚠️ Observaciones</h3>
              <p className="text-sm" style={{ color: '#D4C5A0' }}>{mascota.enfermedades}</p>
            </div>
          )}
          {mascota.historial && (
            <div className="mt-6 p-4 rounded-xl" style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.15)' }}>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#C9A84C' }}>📝 Historial General</h3>
              <p className="text-sm" style={{ color: '#D4C5A0' }}>{mascota.historial}</p>
            </div>
          )}

          {/* Historial Médico */}
          <div className="mt-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-xl sm:text-2xl font-semibold" style={{ color: '#F5F0E8' }}>🏥 Historial Médico Completo</h2>
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: '#8B6914' }} />
                <input
                  type="text" placeholder="Buscar en historial..." value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)} className="gold-search"
                />
              </div>
            </div>

            {historialFiltrado.length > 0 ? (
              <div className="space-y-3">
                {historialFiltrado.map((item, index) => (
                  <div key={index} className={item.tipo === 'vacuna' ? 'hist-vacuna' : 'hist-operacion'}>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                      <div className="flex items-start gap-2 flex-wrap">
                        <span className="px-2 py-1 rounded-full text-xs font-medium"
                          style={item.tipo === 'vacuna'
                            ? { background: 'rgba(34,197,94,0.15)', color: '#86efac', border: '1px solid rgba(34,197,94,0.3)' }
                            : { background: 'rgba(59,130,246,0.15)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.3)' }}>
                          {item.tipo === 'vacuna' ? '💉 Vacuna' : '⚕️ Procedimiento'}
                        </span>
                        <span className="font-semibold text-sm sm:text-base" style={{ color: item.tipo === 'vacuna' ? '#86efac' : '#93c5fd' }}>
                          {item.nombre}
                        </span>
                      </div>
                      <span className="text-xs sm:text-sm whitespace-nowrap" style={{ color: item.tipo === 'vacuna' ? '#86efac' : '#93c5fd', opacity: 0.7 }}>
                        {item.fechaObj.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    {item.descripcion && (
                      <p className="text-xs sm:text-sm mt-2" style={{ color: item.tipo === 'vacuna' ? '#86efac' : '#93c5fd', opacity: 0.8 }}>
                        {item.descripcion}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}>
                  <span className="text-3xl">🔍</span>
                </div>
                <p className="text-sm sm:text-base" style={{ color: '#D4C5A0' }}>
                  {searchTerm ? 'No se encontraron resultados' : 'No hay registros médicos disponibles'}
                </p>
              </div>
            )}

            {historialCompleto.length > 0 && (
              <div className="mt-6 pt-6" style={{ borderTop: '1px solid rgba(201,168,76,0.15)' }}>
                <div className="flex flex-wrap gap-6 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: 'rgba(34,197,94,0.4)' }} />
                    <span style={{ color: '#86efac' }}>Vacunas: {historialCompleto.filter(h => h.tipo === 'vacuna').length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: 'rgba(59,130,246,0.4)' }} />
                    <span style={{ color: '#93c5fd' }}>Procedimientos: {historialCompleto.filter(h => h.tipo === 'operacion').length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold" style={{ color: '#C9A84C' }}>Total: {historialCompleto.length}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ════ COLUMNA DERECHA ════ */}
      <div className="relative w-full lg:w-1/3 flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8">
        <MascotaCard mascota={mascota} navigate={navigate} />

        {/* Imagen */}
        <div className="mt-8 w-full flex items-center justify-center">
          {mascota.imagenUrl ? (
            <img
              src={mascota.imagenUrl} alt={mascota.nombre || "Trabajador"}
              className="max-h-[400px] sm:max-h-[500px] max-w-full rounded-3xl shadow-2xl object-cover"
              style={{ border: '1px solid rgba(201,168,76,0.25)' }}
              onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/300x400/1a1200/C9A84C?text=Sin+Imagen"; }}
            />
          ) : (
            <div className="w-full max-w-sm aspect-square rounded-3xl flex items-center justify-center shadow-xl"
              style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.2)' }}>
              <div className="text-center">
                <span className="text-5xl sm:text-6xl mb-4 block">👤</span>
                <p className="text-sm sm:text-base" style={{ color: '#8B6914' }}>Sin imagen disponible</p>
              </div>
            </div>
          )}
        </div>

        {/* Fechas */}
        {(mascota.createdAt || mascota.updatedAt) && (
          <div className="mt-6 w-full space-y-3 text-xs sm:text-sm">
            {mascota.createdAt && (
              <div className="flex justify-between items-center p-3 rounded-xl"
                style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.12)' }}>
                <span className="font-medium" style={{ color: '#C9A84C' }}>Registrado:</span>
                <span style={{ color: '#D4C5A0' }}>{new Date(mascota.createdAt).toLocaleDateString('es-CO')}</span>
              </div>
            )}
            {mascota.updatedAt && (
              <div className="flex justify-between items-center p-3 rounded-xl"
                style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.12)' }}>
                <span className="font-medium" style={{ color: '#C9A84C' }}>Última actualización:</span>
                <span style={{ color: '#D4C5A0' }}>{new Date(mascota.updatedAt).toLocaleDateString('es-CO')}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MascotaInfo;