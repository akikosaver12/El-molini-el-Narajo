import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Camera, Upload, X, Check } from "lucide-react";

const API_URL = process.env.REACT_APP_API_URL || "https://biosys1.onrender.com/api";

interface FormState {
  nombre: string;
  tipoDocumento: string;
  numeroDocumento: string;
  estadoCivil: string;
  fechaExamenOcupacional: string;
  tallajeBotas: string;
  especie: string;
  raza: string;
  fechaNacimiento: string;
  genero: string;
  estado: string;
  imagen: File | null;
}

const GOLD_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
  .gold-text { background:linear-gradient(135deg,#E8C97A,#C9A84C 50%,#8B6914); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
  .gold-btn { background:linear-gradient(135deg,#C9A84C,#8B6914); color:#0A0A08; font-weight:700; transition:all 0.3s; border:none; cursor:pointer; }
  .gold-btn:hover:not(:disabled) { transform:scale(1.04); box-shadow:0 12px 32px rgba(201,168,76,0.35); }
  .gold-btn:disabled { opacity:0.5; cursor:not-allowed; transform:none !important; }
  input.gold-input, select.gold-select {
    background:#0f0c00; border:1px solid rgba(201,168,76,0.25); color:#D4C5A0;
    border-radius:1rem; padding:1rem 1.25rem; width:100%; outline:none;
    transition:border-color 0.2s; font-family:'Lato',sans-serif; font-size:1rem;
  }
  input.gold-input:focus, select.gold-select:focus { border-color:#C9A84C; }
  input.gold-input::placeholder { color:rgba(212,197,160,0.4); }
  select.gold-select option { background:#1a1200; color:#D4C5A0; }
  input[type=date].gold-input::-webkit-calendar-picker-indicator { filter:invert(0.6) sepia(1) saturate(2) hue-rotate(5deg); }
  @keyframes shimmer { 0%{background-position:-200% center;} 100%{background-position:200% center;} }
  .shimmer-line { background:linear-gradient(90deg,transparent,#C9A84C44,transparent); background-size:200% 100%; animation:shimmer 3s ease-in-out infinite; }
  .photo-zone { border:3px dashed rgba(201,168,76,0.3); border-radius:50%; overflow:hidden; transition:all 0.3s; background:#0f0c00; }
  .photo-zone.drag-active { border-color:#C9A84C; transform:scale(1.04); background:rgba(201,168,76,0.05); }
  .photo-zone.has-image { border-style:solid; border-color:rgba(201,168,76,0.5); }
  .photo-upload-btn { background:linear-gradient(135deg,#C9A84C,#8B6914); color:#0A0A08; padding:14px; border-radius:50%; cursor:pointer; transition:all 0.2s; border:4px solid #0A0A08; box-shadow:0 4px 14px rgba(201,168,76,0.4); display:flex; align-items:center; justify-content:center; }
  .photo-upload-btn:hover { transform:scale(1.12); }
  .photo-remove-btn { background:#dc2626; color:white; padding:10px; border-radius:50%; border:4px solid #0A0A08; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; justify-content:center; }
  .photo-remove-btn:hover { transform:scale(1.12); background:#b91c1c; }
  .edad-badge { display:flex; align-items:center; gap:8px; padding:8px 14px; border-radius:0.75rem; background:rgba(201,168,76,0.1); border:1px solid rgba(201,168,76,0.25); margin-top:12px; }
  .btn-cancelar { background:rgba(201,168,76,0.08); color:#D4C5A0; border:1px solid rgba(201,168,76,0.2); border-radius:1rem; padding:18px 48px; font-size:1.125rem; font-weight:600; cursor:pointer; transition:all 0.2s; font-family:'Lato',sans-serif; }
  .btn-cancelar:hover { background:rgba(201,168,76,0.15); color:#F5F0E8; }
`;

const GoldDivider = () => (
  <div className="flex items-center gap-4 my-2">
    <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.4))' }} />
    <div className="w-1.5 h-1.5 rotate-45" style={{ background: '#C9A84C' }} />
    <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, transparent, rgba(201,168,76,0.4))' }} />
  </div>
);

function EditarMascota() {
  const { idMascota } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormState>({
    nombre: "", tipoDocumento: "", numeroDocumento: "", estadoCivil: "",
    fechaExamenOcupacional: "", tallajeBotas: "", especie: "", raza: "",
    fechaNacimiento: "", genero: "", estado: "", imagen: null,
  });
  const [imagenActual, setImagenActual] = useState<string>("");
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const calcularEdad = (fechaNacimiento: string): number => {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return edad;
  };

  useEffect(() => {
    const fetchMascota = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/mascotas/${idMascota}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) throw new Error("Error cargando mascota");
        const data = await res.json();
        setFormData({
          nombre: data.nombre || "",
          tipoDocumento: data.tipoDocumento || "",
          numeroDocumento: data.numeroDocumento || "",
          estadoCivil: data.estadoCivil || "",
          fechaExamenOcupacional: data.fechaExamenOcupacional ? new Date(data.fechaExamenOcupacional).toISOString().split('T')[0] : "",
          tallajeBotas: data.tallajeBotas || "",
          especie: data.especie || "",
          raza: data.raza || "",
          fechaNacimiento: data.fechaNacimiento ? new Date(data.fechaNacimiento).toISOString().split('T')[0] : "",
          genero: data.genero || "",
          estado: data.estado || "",
          imagen: null,
        });
        setImagenActual(data.imagenUrl || "");
      } catch (err) {
        console.error("Error al cargar mascota:", err);
        alert("No se pudo cargar la mascota.");
      } finally { setLoading(false); }
    };
    if (idMascota) fetchMascota();
  }, [idMascota]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFormData((prev) => ({ ...prev, imagen: e.target.files![0] }));
  };
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) setFormData((prev) => ({ ...prev, imagen: file }));
    }
  };
  const removeImage = () => { setFormData((prev) => ({ ...prev, imagen: null })); setImagenActual(""); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => { if (value) data.append(key, value as any); });
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/mascotas/${idMascota}`, {
        method: "PUT",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: data,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.msg || "Error al actualizar");
      alert("Trabajador actualizado correctamente");
      navigate("/mascotas");
    } catch (err) {
      console.error("Error al actualizar:", err);
      alert(err instanceof Error ? err.message : "No se pudo actualizar el trabajador.");
    } finally { setIsSubmitting(false); }
  };

  const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <label className="block text-sm font-semibold mb-3" style={{ color: '#D4C5A0' }}>{children}</label>
  );

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen" style={{ backgroundColor: '#0A0A08' }}>
        <style>{GOLD_STYLES}</style>
        <div className="text-center">
          <div className="w-14 h-14 rounded-full border-2 border-transparent animate-spin mx-auto mb-4"
            style={{ borderTopColor: '#C9A84C', borderRightColor: '#8B6914' }} />
          <p style={{ color: '#D4C5A0' }}>Cargando datos del trabajador...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4" style={{ backgroundColor: '#0A0A08', fontFamily: "'Lato', sans-serif" }}>
      <style>{GOLD_STYLES}</style>

      <div className="max-w-4xl mx-auto">

        {/* Encabezado */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 border border-amber-700/50 rounded-full px-5 py-2 mb-6 bg-amber-950/30">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs tracking-[0.3em] uppercase" style={{ color: '#C9A84C' }}>Actualizar Registro</span>
          </div>
          <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: '#F5F0E8' }}>
            Editar <span className="gold-text">Trabajador</span>
          </h1>
          <p className="font-light" style={{ color: '#D4C5A0' }}>
            Actualiza la información del trabajador seleccionado
          </p>
          <GoldDivider />
        </div>

        {/* Zona de foto */}
        <div className="flex justify-center mb-12">
          <div className="relative">
            <div
              className={`w-48 h-48 photo-zone ${dragActive ? 'drag-active' : ''} ${(formData.imagen || imagenActual) ? 'has-image' : ''}`}
              onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
            >
              {formData.imagen ? (
                <img src={URL.createObjectURL(formData.imagen)} alt="Preview" className="w-full h-full object-cover" />
              ) : imagenActual ? (
                <img src={imagenActual} alt="Imagen actual" className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/200?text=Sin+Imagen'; }} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <div className="p-4 rounded-full mb-3" style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}>
                    <Camera size={40} style={{ color: '#C9A84C' }} />
                  </div>
                  <p className="text-sm font-medium" style={{ color: '#D4C5A0' }}>Foto de perfil</p>
                  <p className="text-xs mt-1" style={{ color: '#8B6914' }}>Arrastra o haz clic</p>
                </div>
              )}
            </div>

            <label htmlFor="imagen" className="absolute bottom-4 right-4 photo-upload-btn">
              {(formData.imagen || imagenActual) ? <Upload size={20} /> : <Camera size={20} />}
            </label>
            {(formData.imagen || imagenActual) && (
              <button type="button" onClick={removeImage} className="absolute top-4 right-4 photo-remove-btn">
                <X size={16} />
              </button>
            )}
            <input id="imagen" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </div>
        </div>

        {/* Form */}
        <div className="rounded-3xl p-8 md:p-12" style={{ background: 'linear-gradient(135deg,#1a1200,#0f0c00)', border: '1px solid rgba(201,168,76,0.2)' }}>
          <form onSubmit={handleSubmit}>

            {/* Datos Personales */}
            <div className="rounded-2xl p-8 mb-8" style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.12)' }}>
              <h3 className="text-2xl font-semibold mb-8 flex items-center gap-3" style={{ fontFamily: "'Playfair Display', serif", color: '#F5F0E8' }}>
                <div className="w-3 h-3 rounded-full" style={{ background: '#3b82f6' }} />
                Datos Personales
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <FieldLabel>Nombre Completo</FieldLabel>
                  <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="gold-input" placeholder="Ej: Juan Pérez García" />
                </div>
                <div>
                  <FieldLabel>Tipo de Documento</FieldLabel>
                  <select name="tipoDocumento" value={formData.tipoDocumento} onChange={handleChange} className="gold-select">
                    <option value="">Seleccionar tipo</option>
                    <option value="CC">Cédula de Ciudadanía (CC)</option>
                    <option value="TI">Tarjeta de Identidad (TI)</option>
                    <option value="CE">Cédula de Extranjería (CE)</option>
                    <option value="Pasaporte">Pasaporte</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <FieldLabel>Número de Documento</FieldLabel>
                  <input type="text" name="numeroDocumento" value={formData.numeroDocumento} onChange={handleChange} className="gold-input" placeholder="Ej: 1234567890" />
                </div>
                <div>
                  <FieldLabel>Estado Civil</FieldLabel>
                  <select name="estadoCivil" value={formData.estadoCivil} onChange={handleChange} className="gold-select">
                    <option value="">Seleccionar estado</option>
                    <option value="Soltero">Soltero(a)</option>
                    <option value="Casado">Casado(a)</option>
                    <option value="Divorciado">Divorciado(a)</option>
                    <option value="Viudo">Viudo(a)</option>
                    <option value="Unión Libre">Unión Libre</option>
                  </select>
                </div>
                <div>
                  <FieldLabel>Fecha de Nacimiento</FieldLabel>
                  <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange} max={new Date().toISOString().split('T')[0]} className="gold-input" />
                  {formData.fechaNacimiento && (
                    <div className="edad-badge">
                      <span className="text-sm font-medium" style={{ color: '#D4C5A0' }}>Edad:</span>
                      <span className="text-lg font-bold gold-text">{calcularEdad(formData.fechaNacimiento)} años</span>
                    </div>
                  )}
                </div>
                <div>
                  <FieldLabel>Género</FieldLabel>
                  <select name="genero" value={formData.genero} onChange={handleChange} className="gold-select">
                    <option value="">Seleccionar género</option>
                    <option value="Macho">♂️ Masculino</option>
                    <option value="Hembra">♀️ Femenino</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Información Laboral */}
            <div className="rounded-2xl p-8 mb-8" style={{ background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.12)' }}>
              <h3 className="text-2xl font-semibold mb-8 flex items-center gap-3" style={{ fontFamily: "'Playfair Display', serif", color: '#F5F0E8' }}>
                <div className="w-3 h-3 rounded-full" style={{ background: '#C9A84C' }} />
                Información Laboral
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <FieldLabel>Fecha del Examen Ocupacional</FieldLabel>
                  <input type="date" name="fechaExamenOcupacional" value={formData.fechaExamenOcupacional} onChange={handleChange} className="gold-input" />
                </div>
                <div>
                  <FieldLabel>Tallaje de Botas</FieldLabel>
                  <select name="tallajeBotas" value={formData.tallajeBotas} onChange={handleChange} className="gold-select">
                    <option value="">Seleccionar talla</option>
                    {['35','36','37','38','39','40','41','42','43','44','45','46'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <FieldLabel>Cargo</FieldLabel>
                  <select name="especie" value={formData.especie} onChange={handleChange} className="gold-select">
                    <option value="">Seleccionar cargo</option>
                    <option value="cochero">Cochero</option>
                    <option value="minero">Minero</option>
                    <option value="lavador">Lavador</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <FieldLabel>Horario</FieldLabel>
                  <input type="text" name="raza" value={formData.raza} onChange={handleChange} className="gold-input" placeholder="Ej: 7:00 AM - 5:00 PM" />
                </div>
                <div className="md:col-span-2">
                  <FieldLabel>Estado del Trabajador</FieldLabel>
                  <select name="estado" value={formData.estado} onChange={handleChange} className="gold-select">
                    <option value="">Seleccionar estado</option>
                    <option value="contador">Contador</option>
                    <option value="en espera">En Espera</option>
                    <option value="despedido">Despedido</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-center gap-6 mt-10">
              <button type="submit" disabled={isSubmitting} className="gold-btn py-5 px-12 rounded-2xl flex items-center gap-4 text-lg tracking-widest uppercase">
                {isSubmitting ? (
                  <><div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" /> Guardando...</>
                ) : (
                  <><Check size={24} /> Guardar Cambios</>
                )}
              </button>
              <button type="button" onClick={() => navigate("/mascotas")} className="btn-cancelar">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditarMascota;