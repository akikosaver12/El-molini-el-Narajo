import React, { useState, useEffect } from 'react';

type Mascota = { _id: string; nombre: string; especie: string; raza: string; edad: number; };
type HorarioDisponible = { hora: string; periodo: string; };
type EstadoCita = 'pendiente' | 'confirmada' | 'cancelada' | 'completada';
type Cita = { _id: string; tipo: string; fecha: string; hora: string; motivo: string; notas?: string; estado: EstadoCita; mascota: Mascota | string; };

const API_URL = process.env.REACT_APP_API_URL || "https://biosys1.onrender.com/api";

/* ─── Estilos dorados compartidos ─── */
const GOLD_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
  .gold-text { background: linear-gradient(135deg,#E8C97A,#C9A84C 50%,#8B6914); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
  .gold-btn { background: linear-gradient(135deg,#C9A84C,#8B6914); color:#0A0A08; transition:all 0.3s; font-weight:700; }
  .gold-btn:hover:not(:disabled) { transform:scale(1.03); box-shadow:0 12px 32px rgba(201,168,76,0.3); }
  .gold-btn:disabled { opacity:0.5; cursor:not-allowed; }
  .card-dark { background:linear-gradient(135deg,#1a1200,#0f0c00); border:1px solid rgba(201,168,76,0.18); transition:border-color 0.3s; }
  .card-dark:hover { border-color:rgba(201,168,76,0.4); }
  select.gold-select, input.gold-input, textarea.gold-textarea {
    background:#0f0c00; border:1px solid rgba(201,168,76,0.25); color:#D4C5A0;
    border-radius:1rem; padding:1rem; width:100%; outline:none; transition:border-color 0.2s;
    font-family:'Lato',sans-serif;
  }
  select.gold-select:focus, input.gold-input:focus, textarea.gold-textarea:focus { border-color:#C9A84C; }
  select.gold-select:disabled, input.gold-input:disabled, textarea.gold-textarea:disabled { opacity:0.4; cursor:not-allowed; }
  select.gold-select option { background:#1a1200; color:#D4C5A0; }
  input.gold-input::placeholder, textarea.gold-textarea::placeholder { color:rgba(212,197,160,0.4); }
  textarea.gold-textarea { resize:none; }
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

const CitasPage = () => {
  const [formData, setFormData] = useState({ mascotaId: '', tipo: '', fecha: '', hora: '', motivo: '', notas: '' });
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [horariosDisponibles, setHorariosDisponibles] = useState<HorarioDisponible[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMascotas, setLoadingMascotas] = useState(true);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const parseJsonResponse = async (response: Response) => {
    const text = await response.text();
    if (!text) return {};
    try { return JSON.parse(text); }
    catch (error) { console.error('Respuesta no es JSON válido:', text); throw new Error('El servidor devolvió una respuesta inválida'); }
  };

  useEffect(() => { obtenerMascotas(); obtenerCitas(); }, []);
  useEffect(() => { if (formData.fecha) obtenerHorariosDisponibles(); }, [formData.fecha]);

  const obtenerMascotas = async () => {
    try {
      setLoadingMascotas(true);
      const token = localStorage.getItem('token');
      if (!token) { setMensaje({ tipo: 'error', texto: 'No hay sesión activa. Por favor inicia sesión.' }); return; }
      const response = await fetch(`${API_URL}/mascotas`, { method: 'GET', headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) {
        const data = await parseJsonResponse(response);
        setMascotas(data);
        if (data.length === 0) setMensaje({ tipo: 'error', texto: 'No tienes mascotas registradas. Registra una mascota primero para poder agendar citas.' });
      } else if (response.status === 401) {
        setMensaje({ tipo: 'error', texto: 'Sesión expirada. Por favor inicia sesión nuevamente.' });
        localStorage.removeItem('token');
      } else {
        const error = await parseJsonResponse(response);
        setMensaje({ tipo: 'error', texto: error.error || `Error ${response.status}: ${response.statusText}` });
      }
    } catch (error: any) {
      setMensaje({ tipo: 'error', texto: error.message || 'Error de conexión al cargar las mascotas.' });
    } finally { setLoadingMascotas(false); }
  };

  const obtenerCitas = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await fetch(`${API_URL}/citas`, { method: 'GET', headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) { const data = await parseJsonResponse(response); setCitas(data); }
    } catch (error) { console.error('Error obteniendo citas:', error); }
  };

  const obtenerHorariosDisponibles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/citas/horarios-disponibles/${formData.fecha}`, { method: 'GET', headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) {
        const data = await parseJsonResponse(response);
        setHorariosDisponibles(data.horariosDisponibles || []);
      } else {
        setHorariosDisponibles([]);
        const error = await parseJsonResponse(response);
        if (error.error) { setMensaje({ tipo: 'error', texto: error.error }); setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000); }
      }
    } catch (error) { setHorariosDisponibles([]); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'fecha') setFormData(prev => ({ ...prev, hora: '' }));
    if (mensaje.tipo === 'error' && mensaje.texto.includes('mascotas registradas')) setMensaje({ tipo: '', texto: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mascotas.length === 0) { setMensaje({ tipo: 'error', texto: 'No tienes mascotas registradas. Registra una mascota primero.' }); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/citas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        await parseJsonResponse(response);
        setMensaje({ tipo: 'success', texto: '¡Cita agendada exitosamente!' });
        setFormData({ mascotaId: '', tipo: '', fecha: '', hora: '', motivo: '', notas: '' });
        obtenerCitas();
        setHorariosDisponibles([]);
        setTimeout(() => setMensaje({ tipo: '', texto: '' }), 5000);
      } else {
        const error = await parseJsonResponse(response);
        setMensaje({ tipo: 'error', texto: error.error || 'Error al agendar cita' });
        setTimeout(() => setMensaje({ tipo: '', texto: '' }), 5000);
      }
    } catch (error: any) {
      setMensaje({ tipo: 'error', texto: error.message || 'Error de conexión' });
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 5000);
    }
    setLoading(false);
  };

  const formatearFecha = (fecha: string | number | Date) => {
    const parsed = new Date(fecha);
    if (isNaN(parsed.getTime())) return String(fecha);
    return parsed.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatearHora = (hora: string) => {
    if (!hora.includes(':')) return hora;
    const [hours, minutes] = hora.split(':');
    const hour24 = parseInt(hours, 10);
    if (isNaN(hour24)) return hora;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const obtenerFechaMinima = () => new Date().toISOString().split('T')[0];

  const getEstadoBadge = (estado: EstadoCita) => {
    const estilos: Record<EstadoCita, { bg: string; color: string }> = {
      pendiente:  { bg: 'rgba(234,179,8,0.12)',  color: '#fde047' },
      confirmada: { bg: 'rgba(34,197,94,0.12)',  color: '#86efac' },
      cancelada:  { bg: 'rgba(239,68,68,0.12)',  color: '#f87171' },
      completada: { bg: 'rgba(59,130,246,0.12)', color: '#93c5fd' },
    };
    const iconos: Record<EstadoCita, string> = { pendiente: '⏳', confirmada: '✅', cancelada: '❌', completada: '🏁' };
    const s = estilos[estado];
    return (
      <span
        className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium"
        style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}40` }}
      >
        <span>{iconos[estado]}</span>
        <span className="capitalize">{estado}</span>
      </span>
    );
  };

  const cancelarCita = async (citaId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres cancelar esta cita?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/citas/${citaId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) {
        setMensaje({ tipo: 'success', texto: 'Cita cancelada exitosamente' });
        obtenerCitas();
        setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
      } else {
        const errorObj = await parseJsonResponse(response) || {};
        setMensaje({ tipo: 'error', texto: errorObj.error || 'Error al cancelar cita' });
        setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
      }
    } catch (error: any) {
      setMensaje({ tipo: 'error', texto: error.message || 'Error de conexión' });
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
    }
  };

  /* ── Loading inicial ── */
  if (loadingMascotas) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0A0A08' }}>
        <style>{GOLD_STYLES}</style>
        <div className="text-center">
          <div
            className="w-16 h-16 rounded-full border-2 border-transparent animate-spin mx-auto mb-6"
            style={{ borderTopColor: '#C9A84C', borderRightColor: '#8B6914' }}
          />
          <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: '#F5F0E8' }}>
            Cargando sistema de citas...
          </h2>
          <p style={{ color: '#8B6914' }}>Verificando conexión con el servidor</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A0A08', fontFamily: "'Lato', sans-serif" }}>
      <style>{GOLD_STYLES}</style>

      {/* ══════════ HERO ══════════ */}
      <section
        className="relative py-16 overflow-hidden"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, #2a1a00 0%, #0A0A08 70%)' }}
      >
        <div className="absolute top-0 inset-x-0 h-px shimmer-line" />
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto">
            <div
              className="inline-flex items-center gap-2 border border-amber-700/50 rounded-full px-5 py-2 mb-6 bg-amber-950/30"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs tracking-[0.3em] uppercase" style={{ color: '#C9A84C' }}>Sistema de Citas</span>
            </div>
            <h1
              className="text-4xl lg:text-5xl font-bold mb-4"
              style={{ fontFamily: "'Playfair Display', serif", color: '#F5F0E8' }}
            >
              Agenda una <span className="gold-text">Cita</span> para tu trabajador
            </h1>
            <GoldDivider />
            <p className="mt-4 font-light" style={{ color: '#D4C5A0' }}>
              Horarios de atención: 7:00 AM - 12:00 PM y 2:00 PM - 6:00 PM
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 inset-x-0 h-16" style={{ background: 'linear-gradient(to top, #0A0A08, transparent)' }} />
      </section>

      {/* ══════════ CONTENIDO ══════════ */}
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* ── Formulario ── */}
          <div className="card-dark rounded-3xl p-8">
            <div className="mb-8">
              <p className="text-xs tracking-[0.3em] uppercase mb-2" style={{ color: '#C9A84C' }}>Nueva Cita</p>
              <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: '#F5F0E8' }}>
                📅 Agendar Nueva Cita
              </h2>
              <p style={{ color: '#D4C5A0' }}>Completa el formulario para agendar una cita para tu trabajador </p>
            </div>

            {/* Mensaje */}
            {mensaje.texto && (
              <div
                className="p-4 rounded-2xl mb-6 flex items-start space-x-3"
                style={{
                  background: mensaje.tipo === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${mensaje.tipo === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  color: mensaje.tipo === 'success' ? '#86efac' : '#f87171',
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold"
                  style={{ background: mensaje.tipo === 'success' ? '#16a34a' : '#dc2626' }}
                >
                  {mensaje.tipo === 'success' ? '✓' : '✗'}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{mensaje.texto}</p>
                  {mensaje.texto.includes('mascotas registradas') && (
                    <p className="text-sm mt-1">
                      <a href="/mascotas" className="underline hover:no-underline">Haz clic aquí para registrar tu primera mascota</a>
                    </p>
                  )}
                  {mensaje.texto.includes('servidor') && (
                    <div className="text-sm mt-2 p-2 rounded" style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', color: '#D4C5A0' }}>
                      <p><strong style={{ color: '#C9A84C' }}>Pasos para solucionar:</strong></p>
                      <ol className="list-decimal ml-4 mt-1">
                        <li>Verifica que el servidor backend esté ejecutándose</li>
                        <li>Confirma que está en el puerto correcto (puerto 5000)</li>
                        <li>Revisa la consola del servidor para errores</li>
                        <li>Verifica la conexión a MongoDB</li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Mascota */}
              <div>
                <label className="block font-semibold mb-3 text-sm" style={{ color: '#D4C5A0' }}>
                  trabajador * ({mascotas.length} {mascotas.length === 1 ? 'trabajador disponible' : 'trabajadores disponibles'})
                </label>
                <select name="mascotaId" value={formData.mascotaId} onChange={handleChange} className="gold-select" required disabled={mascotas.length === 0}>
                  <option value="">{mascotas.length === 0 ? 'No tienes trabajadores registrados' : 'Selecciona un trabajador'}</option>
                  {mascotas.map(m => (
                    <option key={m._id} value={m._id}>{m.nombre} - {m.especie} ({m.raza}) - {m.edad} {m.edad === 1 ? 'año' : 'años'}</option>
                  ))}
                </select>
                {mascotas.length === 0 && (
                  <p className="text-sm mt-2" style={{ color: '#f87171' }}>
                    <a href="/mascotas" className="underline hover:no-underline">Registra tu primer trabajador aquí</a>
                  </p>
                )}
              </div>

              {/* Tipo */}
              <div>
                <label className="block font-semibold mb-3 text-sm" style={{ color: '#D4C5A0' }}>Tipo de Cita *</label>
                <select name="tipo" value={formData.tipo} onChange={handleChange} className="gold-select" required disabled={mascotas.length === 0}>
                  <option value="">Selecciona el tipo de cita</option>
                  <option value="consulta">🩺 Consulta General</option>
                  <option value="operacion">⚕️ Operación/Cirugía</option>
                  <option value="vacunacion">💉 Vacunación</option>
                  <option value="emergencia">🚨 Emergencia</option>
                </select>
              </div>

              {/* Fecha */}
              <div>
                <label className="block font-semibold mb-3 text-sm" style={{ color: '#D4C5A0' }}>Fecha *</label>
                <input type="date" name="fecha" value={formData.fecha} onChange={handleChange} min={obtenerFechaMinima()} className="gold-input" required disabled={mascotas.length === 0} />
                <p className="text-xs mt-2" style={{ color: '#8B6914' }}>* No se pueden agendar citas los domingos</p>
              </div>

              {/* Hora */}
              <div>
                <label className="block font-semibold mb-3 text-sm" style={{ color: '#D4C5A0' }}>
                  Hora * {formData.fecha && `(${horariosDisponibles.length} horarios disponibles)`}
                </label>
                <select name="hora" value={formData.hora} onChange={handleChange} className="gold-select" required disabled={!formData.fecha || mascotas.length === 0}>
                  <option value="">{!formData.fecha ? 'Selecciona primero una fecha' : 'Selecciona una hora'}</option>
                  {horariosDisponibles.map(h => (
                    <option key={h.hora} value={h.hora}>{formatearHora(h.hora)} - {h.periodo}</option>
                  ))}
                </select>
                {formData.fecha && horariosDisponibles.length === 0 && (
                  <p className="text-sm mt-2" style={{ color: '#f87171' }}>No hay horarios disponibles para esta fecha</p>
                )}
              </div>

              {/* Motivo */}
              <div>
                <label className="block font-semibold mb-3 text-sm" style={{ color: '#D4C5A0' }}>Motivo de la Cita *</label>
                <textarea name="motivo" value={formData.motivo} onChange={handleChange} rows={4} className="gold-textarea" placeholder="Describe el motivo de la consulta..." required disabled={mascotas.length === 0} />
              </div>

              {/* Notas */}
              <div>
                <label className="block font-semibold mb-3 text-sm" style={{ color: '#D4C5A0' }}>Notas Adicionales</label>
                <textarea name="notas" value={formData.notas} onChange={handleChange} rows={3} className="gold-textarea" placeholder="Información adicional (opcional)..." disabled={mascotas.length === 0} />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || mascotas.length === 0}
                className="gold-btn w-full py-4 px-6 rounded-2xl flex items-center justify-center space-x-2 tracking-widest uppercase text-sm"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2" style={{ borderColor: '#0A0A08' }} />
                    <span>Agendando...</span>
                  </>
                ) : mascotas.length === 0 ? (
                  <span>🚫 Registra una mascota primero</span>
                ) : (
                  <span>📅 Agendar Cita</span>
                )}
              </button>
            </form>
          </div>

          {/* ── Panel derecho ── */}
          <div className="space-y-8">

            {/* Mis Citas */}
            <div className="card-dark rounded-3xl p-8">
              <h3 className="text-2xl font-bold mb-6 flex items-center space-x-3" style={{ fontFamily: "'Playfair Display', serif", color: '#F5F0E8' }}>
                <span>📋</span><span>Mis Citas Agendadas</span>
              </h3>

              {citas.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📅</div>
                  <p className="text-lg mb-1" style={{ color: '#D4C5A0' }}>No tienes citas agendadas</p>
                  <p style={{ color: '#8B6914' }}>Agenda tu primera cita usando el formulario</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {citas.slice(0, 5).map(cita => (
                    <div key={cita._id} className="rounded-2xl p-6" style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.15)' }}>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.25)' }}>
                            <span className="text-xl">
                              {cita.tipo === 'consulta' && '🩺'}
                              {cita.tipo === 'operacion' && '⚕️'}
                              {cita.tipo === 'vacunacion' && '💉'}
                              {cita.tipo === 'emergencia' && '🚨'}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-bold" style={{ color: '#F5F0E8' }}>
                              {typeof cita.mascota === 'object' && cita.mascota !== null ? cita.mascota.nombre : typeof cita.mascota === 'string' ? cita.mascota : 'Mascota'}
                            </h4>
                            <p className="text-sm capitalize" style={{ color: '#D4C5A0' }}>{cita.tipo.replace('_', ' ')}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getEstadoBadge(cita.estado)}
                          {cita.estado === 'pendiente' && (
                            <button onClick={() => cancelarCita(cita._id)} className="text-sm underline" style={{ color: '#f87171' }}>Cancelar</button>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span style={{ color: '#8B6914' }}>📅 Fecha:</span>
                          <p className="font-medium" style={{ color: '#D4C5A0' }}>{formatearFecha(cita.fecha)}</p>
                        </div>
                        <div>
                          <span style={{ color: '#8B6914' }}>🕐 Hora:</span>
                          <p className="font-medium" style={{ color: '#D4C5A0' }}>{formatearHora(cita.hora)}</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <span style={{ color: '#8B6914' }}>📝 Motivo:</span>
                        <p className="mt-1" style={{ color: '#D4C5A0' }}>{cita.motivo}</p>
                      </div>
                      {cita.notas && (
                        <div className="mt-3">
                          <span style={{ color: '#8B6914' }}>📋 Notas:</span>
                          <p className="text-sm mt-1" style={{ color: '#D4C5A0' }}>{cita.notas}</p>
                        </div>
                      )}
                    </div>
                  ))}
                  {citas.length > 5 && (
                    <p className="text-center pt-4" style={{ color: '#8B6914' }}>Y {citas.length - 5} citas más...</p>
                  )}
                </div>
              )}
            </div>

            {/* Horarios */}
            <div className="card-dark rounded-3xl p-8">
              <h3 className="text-xl font-bold mb-6 flex items-center space-x-2" style={{ fontFamily: "'Playfair Display', serif", color: '#F5F0E8' }}>
                <span>🕒</span><span>Horarios de Atención</span>
              </h3>
              <div className="space-y-4">
                {[
                  { icon: '🌅', color: '#C9A84C', label: 'Mañana', horario: '7:00 AM - 12:00 PM' },
                  { icon: '🌇', color: '#8B6914', label: 'Tarde', horario: '2:00 PM - 6:00 PM' },
                ].map(item => (
                  <div key={item.label} className="flex items-center space-x-3 p-4 rounded-xl" style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.15)' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: item.color }}>
                      <span className="text-black text-lg">{item.icon}</span>
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: '#F5F0E8' }}>{item.label}</p>
                      <p style={{ color: '#D4C5A0' }}>{item.horario}</p>
                    </div>
                  </div>
                ))}
                <div className="flex items-center space-x-3 p-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#dc2626' }}>
                    <span className="text-white text-lg">🚫</span>
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: '#f87171' }}>Domingos</p>
                    <p style={{ color: '#f87171', opacity: 0.7 }}>Cerrado</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tipos de servicios */}
            <div className="card-dark rounded-3xl p-8">
              <h3 className="text-xl font-bold mb-6 flex items-center space-x-2" style={{ fontFamily: "'Playfair Display', serif", color: '#F5F0E8' }}>
                <span>🏥</span><span>Tipos de Servicios</span>
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {[
                  { tipo: 'consulta', nombre: 'Consulta General', icono: '🩺', descripcion: 'Revisión general y diagnóstico', color: '#3b82f6' },
                  { tipo: 'operacion', nombre: 'Operación/Cirugía', icono: '⚕️', descripcion: 'Procedimientos quirúrgicos', color: '#ef4444' },
                  { tipo: 'vacunacion', nombre: 'Vacunación', icono: '💉', descripcion: 'Aplicación de vacunas', color: '#22c55e' },
                  { tipo: 'emergencia', nombre: 'Emergencia', icono: '🚨', descripcion: 'Atención urgente', color: '#C9A84C' },
                ].map(s => (
                  <div key={s.tipo} className="flex items-center space-x-4 p-4 rounded-xl" style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.12)' }}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.color }}>
                      <span className="text-white text-xl">{s.icono}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold" style={{ color: '#F5F0E8' }}>{s.nombre}</h4>
                      <p className="text-sm" style={{ color: '#D4C5A0' }}>{s.descripcion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Emergencias */}
            <div className="rounded-3xl p-8" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <h3 className="text-xl font-bold mb-4 flex items-center space-x-2" style={{ fontFamily: "'Playfair Display', serif", color: '#F5F0E8' }}>
                <span>🚨</span><span>Emergencias 24/7</span>
              </h3>
              <p className="mb-6 font-light" style={{ color: '#D4C5A0' }}>
                Si tu mascota tiene una emergencia fuera del horario de atención, contáctanos inmediatamente.
              </p>
              <div className="space-y-3">
                {[
                  { href: 'tel:+573001234567', icon: '📞', label: 'Llamar Emergencia', sub: '+57 300 123 4567', color: '#ef4444' },
                  { href: 'https://wa.me/573001234567', icon: '💬', label: 'WhatsApp', sub: 'Respuesta inmediata', color: '#22c55e' },
                ].map(item => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="flex items-center space-x-3 p-4 rounded-xl transition-all duration-200 group hover:scale-[1.02]"
                    style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.15)' }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: item.color }}>
                      <span className="text-white text-lg">{item.icon}</span>
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: '#F5F0E8' }}>{item.label}</p>
                      <p className="text-sm" style={{ color: '#D4C5A0' }}>{item.sub}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitasPage;