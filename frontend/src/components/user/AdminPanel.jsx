import React, { useState, useEffect, useRef } from "react";
import {
  Package, Users, Calendar, Plus, Edit3, Trash2, Eye,
  RefreshCw, ArrowLeft, Save, X, Camera, Shield,
  Truck, Tag, Award, AlertCircle, CheckCircle,
  TrendingUp, Activity, Settings, Menu
} from "lucide-react";

const API_URL = process.env.REACT_APP_API_URL || "https://biosys1.onrender.com/api";

const GOLD_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
  .gold-text { background:linear-gradient(135deg,#E8C97A,#C9A84C 50%,#8B6914); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
  @keyframes shimmer { 0%{background-position:-200% center;} 100%{background-position:200% center;} }
  .shimmer-line { background:linear-gradient(90deg,transparent,#C9A84C44,transparent); background-size:200% 100%; animation:shimmer 3s ease-in-out infinite; }
  
  /* Sidebar */
  .sidebar { background:linear-gradient(180deg,#1a1200,#0f0c00); border-right:1px solid rgba(201,168,76,0.18); }
  .nav-btn { width:100%; text-align:left; padding:14px 16px; border-radius:12px; transition:all 0.2s; display:flex; align-items:center; gap:10px; font-weight:500; font-size:0.9375rem; border:none; cursor:pointer; font-family:'Lato',sans-serif; }
  .nav-btn-idle { color:#D4C5A0; background:transparent; }
  .nav-btn-idle:hover { background:rgba(201,168,76,0.08); color:#F5F0E8; }
  .nav-btn-active { background:linear-gradient(135deg,#C9A84C,#8B6914); color:#0A0A08; font-weight:700; box-shadow:0 4px 14px rgba(201,168,76,0.25); }

  /* Card */
  .card-dark { background:linear-gradient(135deg,#1a1200,#0f0c00); border:1px solid rgba(201,168,76,0.18); border-radius:1.25rem; }
  .card-dark-hover { transition:all 0.3s; }
  .card-dark-hover:hover { border-color:rgba(201,168,76,0.4); transform:translateY(-2px); box-shadow:0 16px 32px rgba(0,0,0,0.5); }

  /* Inputs */
  input.gold-input, textarea.gold-input, select.gold-select {
    background:#0f0c00; border:1px solid rgba(201,168,76,0.25); color:#D4C5A0;
    border-radius:0.875rem; padding:0.875rem 1rem; width:100%; outline:none;
    transition:border-color 0.2s; font-family:'Lato',sans-serif; font-size:0.9375rem; resize:none;
  }
  input.gold-input:focus, textarea.gold-input:focus, select.gold-select:focus { border-color:#C9A84C; }
  input.gold-input::placeholder, textarea.gold-input::placeholder { color:rgba(212,197,160,0.4); }
  select.gold-select option { background:#1a1200; color:#D4C5A0; }
  input[type=date].gold-input::-webkit-calendar-picker-indicator { filter:invert(0.6) sepia(1) saturate(2) hue-rotate(5deg); }
  input[type=number].gold-input::-webkit-outer-spin-button, input[type=number].gold-input::-webkit-inner-spin-button { opacity:0.5; }
  input[type=file].gold-file { background:#0f0c00; border:1px solid rgba(201,168,76,0.2); color:#D4C5A0; border-radius:0.75rem; padding:10px 12px; width:100%; font-family:'Lato',sans-serif; font-size:0.875rem; }

  /* Buttons */
  .gold-btn { background:linear-gradient(135deg,#C9A84C,#8B6914); color:#0A0A08; font-weight:700; border:none; cursor:pointer; transition:all 0.3s; font-family:'Lato',sans-serif; border-radius:0.875rem; }
  .gold-btn:hover:not(:disabled) { transform:scale(1.03); box-shadow:0 10px 28px rgba(201,168,76,0.35); }
  .gold-btn:disabled { opacity:0.5; cursor:not-allowed; transform:none !important; }
  .btn-blue { background:rgba(59,130,246,0.15); border:1px solid rgba(59,130,246,0.3); color:#93c5fd; border-radius:0.75rem; padding:10px 20px; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; gap:8px; font-weight:600; font-family:'Lato',sans-serif; }
  .btn-blue:hover { background:rgba(59,130,246,0.25); }
  .btn-red { background:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.3); color:#f87171; border-radius:0.75rem; padding:10px 20px; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; gap:8px; font-weight:600; font-family:'Lato',sans-serif; }
  .btn-red:hover { background:rgba(239,68,68,0.22); }
  .btn-gray { background:rgba(201,168,76,0.08); border:1px solid rgba(201,168,76,0.2); color:#D4C5A0; border-radius:0.75rem; padding:10px 20px; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; gap:8px; font-family:'Lato',sans-serif; }
  .btn-gray:hover { background:rgba(201,168,76,0.15); color:#F5F0E8; }

  /* Badges */
  .badge { padding:4px 10px; border-radius:999px; font-size:0.75rem; font-weight:600; display:inline-flex; align-items:center; gap:4px; }
  .badge-green { background:rgba(34,197,94,0.12); color:#86efac; border:1px solid rgba(34,197,94,0.3); }
  .badge-gold { background:rgba(201,168,76,0.12); color:#C9A84C; border:1px solid rgba(201,168,76,0.3); }
  .badge-blue { background:rgba(59,130,246,0.12); color:#93c5fd; border:1px solid rgba(59,130,246,0.3); }
  .badge-purple { background:rgba(168,85,247,0.12); color:#c084fc; border:1px solid rgba(168,85,247,0.3); }
  .badge-red { background:rgba(239,68,68,0.12); color:#f87171; border:1px solid rgba(239,68,68,0.3); }

  /* Checkbox panel */
  .check-panel-green { background:rgba(34,197,94,0.06); border:1px solid rgba(34,197,94,0.2); border-radius:0.875rem; padding:1rem; margin-bottom:1rem; cursor:pointer; }
  .check-panel-gold { background:rgba(201,168,76,0.06); border:1px solid rgba(201,168,76,0.2); border-radius:0.875rem; padding:1rem; margin-bottom:1rem; }
  .check-panel-blue { background:rgba(59,130,246,0.06); border:1px solid rgba(59,130,246,0.2); border-radius:0.875rem; padding:1rem; }

  /* Info grid cells */
  .info-cell { background:rgba(201,168,76,0.04); border:1px solid rgba(201,168,76,0.1); border-radius:0.625rem; padding:10px 12px; }

  /* Historial */
  .hist-op { background:rgba(59,130,246,0.06); border:1px solid rgba(59,130,246,0.2); border-radius:0.75rem; padding:12px; }
  .hist-cita { background:rgba(34,197,94,0.06); border:1px solid rgba(34,197,94,0.2); border-radius:0.75rem; padding:12px; }

  /* Server status */
  .status-online { background:rgba(34,197,94,0.1); border:1px solid rgba(34,197,94,0.3); color:#86efac; }
  .status-offline { background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); color:#f87171; }
  .status-checking { background:rgba(201,168,76,0.1); border:1px solid rgba(201,168,76,0.3); color:#C9A84C; }

  /* Warn banner */
  .warn-banner { background:rgba(234,179,8,0.08); border:1px solid rgba(234,179,8,0.3); border-radius:0.875rem; padding:1rem; margin-bottom:1.5rem; display:flex; align-items:flex-start; gap:10px; }

  /* Edit mode banner */
  .edit-banner { background:rgba(59,130,246,0.06); border:1px solid rgba(59,130,246,0.2); border-radius:1rem; padding:1.25rem; margin-bottom:1.5rem; }
`;

const GoldDivider = () => (
  <div className="flex items-center gap-3 my-4">
    <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.3))' }} />
    <div className="w-1 h-1 rotate-45" style={{ background: '#C9A84C' }} />
    <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, transparent, rgba(201,168,76,0.3))' }} />
  </div>
);

const SectionBox: React.FC<{ children: React.ReactNode; label: string; dotColor?: string }> = ({ children, label, dotColor = '#C9A84C' }) => (
  <div className="rounded-2xl p-6 mb-6" style={{ background: 'rgba(201,168,76,0.03)', border: '1px solid rgba(201,168,76,0.1)' }}>
    <h3 className="text-xl font-semibold mb-6 flex items-center gap-3" style={{ fontFamily: "'Playfair Display', serif", color: '#F5F0E8' }}>
      <div className="w-3 h-3 rounded-full" style={{ background: dotColor }} />
      {label}
    </h3>
    {children}
  </div>
);

const AdminPanel = () => {
  const getToken = () => {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = localStorage.getItem("token") || localStorage.getItem("auth") || "";
      try { const maybe = JSON.parse(raw); if (maybe?.token) return maybe.token; } catch {}
      return raw;
    }
    return "";
  };

  const [activeTab, setActiveTab] = useState("productos");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "", precio: "", descripcion: "", imagen: null, categoria: "otros", stock: "",
    tieneDescuento: false, porcentajeDescuento: "", fechaInicioDescuento: "", fechaFinDescuento: "",
    tieneGarantia: false, mesesGarantia: "", descripcionGarantia: "", envioGratis: false
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [mascotasUsuario, setMascotasUsuario] = useState([]);
  const [productos, setProductos] = useState([]);
  const [citas, setCitas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [warn, setWarn] = useState("");
  const [serverStatus, setServerStatus] = useState("checking");
  const fileRef = useRef(null);

  const emptyForm = { nombre: "", precio: "", descripcion: "", imagen: null, categoria: "otros", stock: "", tieneDescuento: false, porcentajeDescuento: "", fechaInicioDescuento: "", fechaFinDescuento: "", tieneGarantia: false, mesesGarantia: "", descripcionGarantia: "", envioGratis: false };

  const startEditProduct = (producto) => {
    setIsEditMode(true); setEditingProduct(producto); setActiveTab("productos"); setIsSidebarOpen(false);
    setFormData({ nombre: producto.nombre || "", precio: producto.precio || "", descripcion: producto.descripcion || "", imagen: null, categoria: producto.categoria || "otros", stock: producto.stock || "", tieneDescuento: producto.descuento?.tiene || false, porcentajeDescuento: producto.descuento?.porcentaje || "", fechaInicioDescuento: producto.descuento?.fechaInicio ? new Date(producto.descuento.fechaInicio).toISOString().split('T')[0] : "", fechaFinDescuento: producto.descuento?.fechaFin ? new Date(producto.descuento.fechaFin).toISOString().split('T')[0] : "", tieneGarantia: producto.garantia?.tiene || false, mesesGarantia: producto.garantia?.meses || "", descripcionGarantia: producto.garantia?.descripcion || "", envioGratis: producto.envioGratis || false });
    setPreviewImage(null); if (fileRef.current) fileRef.current.value = "";
  };

  const cancelEdit = () => {
    setIsEditMode(false); setEditingProduct(null); setFormData(emptyForm);
    setPreviewImage(null); if (fileRef.current) fileRef.current.value = "";
  };

  const handleAgregarCitaMedica = async (e, mascotaId) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const vacuna = { nombre: fd.get("nombre"), fecha: fd.get("fecha") };
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/mascotas/${mascotaId}/vacunas`, { method: "POST", headers: { "Accept": "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(vacuna) });
      if (!res.ok) throw new Error(`Error al agregar cita médica: ${await res.text()}`);
      const result = await res.json();
      setMascotasUsuario((prev) => prev.map((m) => (m._id === mascotaId ? result.mascota : m)));
      e.target.reset(); alert("✅ Cita médica agregada correctamente");
    } catch (err) { alert("No se pudo agregar la cita médica: " + err.message); }
  };

  const handleAgregarOperacion = async (e, mascotaId) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const operacion = { nombre: fd.get("nombre"), descripcion: fd.get("descripcion"), fecha: fd.get("fecha") };
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/mascotas/${mascotaId}/operaciones`, { method: "POST", headers: { "Accept": "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(operacion) });
      if (!res.ok) throw new Error(`Error al agregar operación: ${await res.text()}`);
      const result = await res.json();
      setMascotasUsuario((prev) => prev.map((m) => (m._id === mascotaId ? result.mascota : m)));
      e.target.reset(); alert("✅ Operación agregada correctamente");
    } catch (err) { alert("No se pudo agregar la operación: " + err.message); }
  };

  const checkServerHealth = async () => {
    try {
      const response = await fetch(`${API_URL}/health`);
      if (response.ok) { setServerStatus("online"); return true; }
      setServerStatus("offline"); return false;
    } catch { setServerStatus("offline"); return false; }
  };

  const fetchJSON = async (url, options: any = {}) => {
    try {
      const token = getToken();
      const headers: any = { ...(options.headers || {}) };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(url, { ...options, headers });
      let bodyText = await res.text();
      if (!res.ok) { let message = bodyText || `HTTP ${res.status}`; try { const j = JSON.parse(bodyText); message = j.error || j.message || message; } catch {} throw new Error(`${res.status} ${res.statusText} - ${message}`); }
      try { return JSON.parse(bodyText); } catch { return bodyText; }
    } catch (error) { console.error(`❌ Fetch error for ${url}:`, error); throw error; }
  };

  const handleChange = (e) => {
    const { name, value, files, type, checked } = e.target;
    if (files?.[0]) { setFormData((s) => ({ ...s, [name]: files[0] })); setPreviewImage(URL.createObjectURL(files[0])); }
    else if (type === 'checkbox') { setFormData((s) => ({ ...s, [name]: checked })); }
    else { setFormData((s) => ({ ...s, [name]: value })); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setWarn("");
    const isServerOnline = await checkServerHealth();
    if (!isServerOnline) { setWarn("❌ El servidor no está disponible."); return; }
    const token = getToken();
    if (!token) return setWarn("Debes iniciar sesión para gestionar productos.");
    setLoading(true);
    try {
      const data = new FormData();
      data.append("nombre", formData.nombre); data.append("precio", formData.precio); data.append("descripcion", formData.descripcion); data.append("categoria", formData.categoria); data.append("stock", formData.stock || "0"); data.append("envioGratis", formData.envioGratis); data.append("tieneDescuento", formData.tieneDescuento);
      if (formData.tieneDescuento) { data.append("porcentajeDescuento", formData.porcentajeDescuento); if (formData.fechaInicioDescuento) data.append("fechaInicioDescuento", formData.fechaInicioDescuento); if (formData.fechaFinDescuento) data.append("fechaFinDescuento", formData.fechaFinDescuento); }
      data.append("tieneGarantia", formData.tieneGarantia);
      if (formData.tieneGarantia) { data.append("mesesGarantia", formData.mesesGarantia); data.append("descripcionGarantia", formData.descripcionGarantia); }
      if (formData.imagen) data.append("imagen", formData.imagen);
      const url = isEditMode ? `${API_URL}/productos/${editingProduct._id}` : `${API_URL}/productos`;
      await fetchJSON(url, { method: isEditMode ? "PUT" : "POST", headers: { Authorization: `Bearer ${token}` }, body: data });
      alert(isEditMode ? "✅ Producto actualizado con éxito" : "✅ Producto agregado con éxito");
      setFormData(emptyForm); setPreviewImage(null); setIsEditMode(false); setEditingProduct(null);
      if (fileRef.current) fileRef.current.value = "";
      getProductos();
    } catch (err) { setWarn(`❌ Error al ${isEditMode ? 'actualizar' : 'crear'} producto: ${err.message}`); }
    finally { setLoading(false); }
  };

  const getUsuarios = async () => {
    setWarn("");
    if (!await checkServerHealth()) return setUsuarios([]);
    try {
      const token = getToken(); if (!token) return setWarn("Debes iniciar sesión como admin.");
      const me = await fetchJSON(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (me?.role !== "admin") return setWarn("Tu usuario no es admin.");
      setUsuarios(await fetchJSON(`${API_URL}/usuarios`, { headers: { Authorization: `Bearer ${token}` } }));
    } catch (error) { setWarn(`No se pudieron cargar los usuarios: ${error.message}`); }
  };

  const getMascotasUsuario = async (userId) => {
    setWarn("");
    try {
      const token = getToken(); if (!token) return setWarn("Debes iniciar sesión.");
      const data = await fetchJSON(`${API_URL}/usuarios/${userId}/mascotas`, { headers: { Authorization: `Bearer ${token}` } });
      setMascotasUsuario(data.mascotas || []);
    } catch (error) { setWarn(`No se pudieron cargar las mascotas: ${error.message}`); }
  };

  const getProductos = async () => {
    setWarn(""); if (!await checkServerHealth()) return setProductos([]);
    try { setProductos(await fetchJSON(`${API_URL}/productos`)); }
    catch (error) { setWarn(`No se pudieron cargar los productos: ${error.message}`); }
  };

  const getCategorias = async () => {
    try { setCategorias(await fetchJSON(`${API_URL}/productos/categorias/disponibles`)); }
    catch { setCategorias([{ value: 'alimento', label: 'Alimento' }, { value: 'juguetes', label: 'Juguetes' }, { value: 'medicamentos', label: 'Medicamentos' }, { value: 'accesorios', label: 'Accesorios' }, { value: 'higiene', label: 'Higiene' }, { value: 'otros', label: 'Otros' }]); }
  };

  const eliminarProducto = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este producto?")) return;
    if (!await checkServerHealth()) { alert("❌ El servidor no está disponible."); return; }
    try {
      const token = getToken(); if (!token) return alert("Debes iniciar sesión como admin.");
      await fetchJSON(`${API_URL}/productos/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      alert("🗑️ Producto eliminado con éxito"); getProductos();
    } catch (error) { alert(`❌ Error al eliminar: ${error.message}`); }
  };

  const getCitas = async () => {
    setWarn(""); if (!await checkServerHealth()) return setCitas([]);
    try {
      const token = getToken(); if (!token) return setWarn("Debes iniciar sesión como admin.");
      const me = await fetchJSON(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (me?.role !== "admin") return setWarn("Tu usuario no es admin.");
      setCitas(await fetchJSON(`${API_URL}/citas`, { headers: { Authorization: `Bearer ${token}` } }));
    } catch (error) { setWarn(`No se pudieron cargar las citas: ${error.message}`); }
  };

  const formatearPrecio = (precio) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(precio);
  const formatearFecha = (fecha) => fecha ? new Date(fecha).toLocaleDateString('es-CO') : "";

  useEffect(() => { checkServerHealth(); getCategorias(); }, []);
  useEffect(() => {
    if (activeTab === "verUsuarios") getUsuarios();
    if (activeTab === "verProductos") getProductos();
    if (activeTab === "verCitas") getCitas();
  }, [activeTab]);
  useEffect(() => { return () => { if (previewImage) URL.revokeObjectURL(previewImage); }; }, [previewImage]);

  const sidebarItems = [
    { id: "productos", label: isEditMode ? "Editar Producto" : "Crear Producto", icon: Plus },
    { id: "verProductos", label: "Ver Productos", icon: Package },
    { id: "verUsuarios", label: "Ver Usuarios", icon: Users },
    { id: "verCitas", label: "Ver Citas", icon: Calendar },
  ];

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#0A0A08', fontFamily: "'Lato', sans-serif" }}>
      <style>{GOLD_STYLES}</style>

      {/* Overlay móvil */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 sidebar transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="shimmer-line h-px" />
        <div className="p-6 h-full overflow-y-auto">
          {/* Logo */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#C9A84C,#8B6914)' }}>
                  <Settings className="text-black" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: '#F5F0E8' }}>Admin Panel</h2>
                  <p className="text-xs" style={{ color: '#8B6914' }}>Gestión del sistema</p>
                </div>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 rounded-lg" style={{ color: '#8B6914' }}>
                <X size={18} />
              </button>
            </div>

            {/* Estado servidor */}
            <div className={`px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 ${serverStatus === 'online' ? 'status-online' : serverStatus === 'offline' ? 'status-offline' : 'status-checking'}`}>
              <div className={`w-2 h-2 rounded-full ${serverStatus === 'online' ? 'bg-green-400' : serverStatus === 'offline' ? 'bg-red-400' : 'bg-amber-400'} animate-pulse`} />
              {serverStatus === "online" && "Servidor Online"}
              {serverStatus === "offline" && "Servidor Offline"}
              {serverStatus === "checking" && "Verificando..."}
            </div>
          </div>

          {/* Nav */}
          <nav className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.id}
                  onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); if (item.id !== "productos" && isEditMode) cancelEdit(); }}
                  className={`nav-btn ${activeTab === item.id ? 'nav-btn-active' : 'nav-btn-idle'}`}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 w-full lg:w-auto">
        {/* Header móvil */}
        <div className="lg:hidden sticky top-0 z-30 px-4 py-3 flex items-center gap-3"
          style={{ background: 'rgba(10,10,8,0.97)', borderBottom: '1px solid rgba(201,168,76,0.18)', backdropFilter: 'blur(12px)' }}>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-lg" style={{ color: '#C9A84C' }}>
            <Menu size={24} />
          </button>
          <h1 className="text-lg font-bold" style={{ fontFamily: "'Playfair Display', serif", color: '#F5F0E8' }}>Admin Panel</h1>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">

            {/* Page title */}
            <div className="mb-8">
              <h1 className="text-3xl lg:text-4xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: '#F5F0E8' }}>
                Panel de <span className="gold-text">Administración</span>
              </h1>
              <div className="shimmer-line h-px rounded-full mt-3" style={{ maxWidth: '200px' }} />
            </div>

            {/* Warn */}
            {warn && (
              <div className="warn-banner">
                <AlertCircle style={{ color: '#fde047' }} size={20} className="flex-shrink-0 mt-0.5" />
                <span style={{ color: '#fde047' }}>{warn}</span>
              </div>
            )}

            {/* ══════════════ TAB: CREAR/EDITAR PRODUCTO ══════════════ */}
            {activeTab === "productos" && (
              <div>
                {isEditMode && (
                  <div className="edit-banner">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                      <div>
                        <h3 className="text-lg font-semibold mb-1 flex items-center gap-2" style={{ color: '#93c5fd' }}>
                          <Edit3 size={18} /> ✏️ Editando: {editingProduct?.nombre}
                        </h3>
                        <p className="text-sm" style={{ color: '#7dd3fc' }}>Modifica los campos que desees actualizar</p>
                      </div>
                      <button onClick={cancelEdit} className="btn-gray whitespace-nowrap self-start sm:self-center"><X size={16} />❌ Cancelar</button>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="card-dark p-6 sm:p-10 space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

                    {/* Información básica */}
                    <SectionBox label={isEditMode ? "Editar Información Básica" : "Información Básica"}>
                      <div className="space-y-4">
                        <input type="text" name="nombre" placeholder="Nombre del producto" className="gold-input" onChange={handleChange} value={formData.nombre} required />
                        <textarea name="descripcion" placeholder="Descripción" className="gold-input" rows={3} onChange={handleChange} value={formData.descripcion} required />
                        <div className="grid grid-cols-2 gap-3">
                          <input type="number" name="precio" placeholder="Precio" min="0" step="0.01" className="gold-input" onChange={handleChange} value={formData.precio} required />
                          <input type="number" name="stock" placeholder="Stock" min="0" className="gold-input" onChange={handleChange} value={formData.stock} />
                        </div>
                        <select name="categoria" className="gold-select" onChange={handleChange} value={formData.categoria} required>
                          {categorias.map((cat) => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                        </select>
                        <div>
                          <label className="block text-sm font-semibold mb-2" style={{ color: '#D4C5A0' }}>
                            {isEditMode ? "Cambiar imagen (opcional)" : "Imagen del producto"}
                          </label>
                          <input ref={fileRef} type="file" name="imagen" accept="image/*" className="gold-file" onChange={handleChange} />
                          {isEditMode && !previewImage && editingProduct?.imagen && (
                            <div className="mt-4">
                              <p className="text-sm mb-2" style={{ color: '#8B6914' }}>Imagen actual:</p>
                              <img src={editingProduct.imagen} alt="Imagen actual" className="w-36 h-36 object-cover rounded-2xl"
                                style={{ border: '1px solid rgba(201,168,76,0.3)' }}
                                onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/200?text=Sin+Imagen'; }} />
                            </div>
                          )}
                        </div>
                        {previewImage && (
                          <div>
                            <p className="text-sm font-medium mb-2" style={{ color: '#D4C5A0' }}>{isEditMode ? "Nueva imagen:" : "Vista previa:"}</p>
                            <img src={previewImage} alt="preview" className="w-36 h-36 object-cover rounded-2xl" style={{ border: '1px solid rgba(201,168,76,0.3)' }} />
                          </div>
                        )}
                      </div>
                    </SectionBox>

                    {/* Opciones avanzadas */}
                    <SectionBox label="Opciones Avanzadas">
                      {/* Envío gratis */}
                      <label className="check-panel-green flex items-center gap-3">
                        <input type="checkbox" name="envioGratis" checked={formData.envioGratis} onChange={handleChange} className="w-5 h-5 rounded accent-amber-500" />
                        <Truck style={{ color: '#86efac' }} size={18} />
                        <span className="font-semibold" style={{ color: '#86efac' }}>🚚 Envío Gratis</span>
                      </label>

                      {/* Descuento */}
                      <div className="check-panel-gold">
                        <label className="flex items-center gap-3 mb-4 cursor-pointer">
                          <input type="checkbox" name="tieneDescuento" checked={formData.tieneDescuento} onChange={handleChange} className="w-5 h-5 rounded accent-amber-500" />
                          <Tag style={{ color: '#C9A84C' }} size={18} />
                          <span className="font-semibold" style={{ color: '#C9A84C' }}>Tiene Descuento</span>
                        </label>
                        {formData.tieneDescuento && (
                          <div className="space-y-3">
                            <input type="number" name="porcentajeDescuento" placeholder="% de descuento" min="1" max="100" className="gold-input" onChange={handleChange} value={formData.porcentajeDescuento} required={formData.tieneDescuento} />
                            <div className="grid grid-cols-2 gap-3">
                              <input type="date" name="fechaInicioDescuento" className="gold-input" onChange={handleChange} value={formData.fechaInicioDescuento} />
                              <input type="date" name="fechaFinDescuento" className="gold-input" onChange={handleChange} value={formData.fechaFinDescuento} />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Garantía */}
                      <div className="check-panel-blue">
                        <label className="flex items-center gap-3 mb-4 cursor-pointer">
                          <input type="checkbox" name="tieneGarantia" checked={formData.tieneGarantia} onChange={handleChange} className="w-5 h-5 rounded accent-blue-500" />
                          <Shield style={{ color: '#93c5fd' }} size={18} />
                          <span className="font-semibold" style={{ color: '#93c5fd' }}>Tiene Garantía</span>
                        </label>
                        {formData.tieneGarantia && (
                          <div className="space-y-3">
                            <input type="number" name="mesesGarantia" placeholder="Meses de garantía" min="1" max="120" className="gold-input" onChange={handleChange} value={formData.mesesGarantia} required={formData.tieneGarantia} />
                            <textarea name="descripcionGarantia" placeholder="Descripción de la garantía" className="gold-input" rows={2} onChange={handleChange} value={formData.descripcionGarantia} />
                          </div>
                        )}
                      </div>
                    </SectionBox>
                  </div>

                  <button type="submit" disabled={loading || serverStatus !== "online"}
                    className="gold-btn w-full py-4 px-8 text-lg flex items-center justify-center gap-3 tracking-widest uppercase">
                    <Save size={20} />
                    {loading ? (isEditMode ? "Actualizando..." : "Subiendo...") : (isEditMode ? "Actualizar Producto" : "Crear Producto")}
                  </button>
                </form>
              </div>
            )}

            {/* ══════════════ TAB: VER PRODUCTOS ══════════════ */}
            {activeTab === "verProductos" && (
              <div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-8">
                  <h2 className="text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: '#F5F0E8' }}>Productos</h2>
                  <button onClick={getProductos} className="btn-blue"><RefreshCw size={16} />Recargar</button>
                </div>

                <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {productos.length === 0 ? (
                    <div className="col-span-full text-center py-16">
                      <Package style={{ color: '#8B6914' }} className="mx-auto mb-4" size={48} />
                      <p className="text-xl" style={{ color: '#D4C5A0' }}>No hay productos registrados</p>
                    </div>
                  ) : productos.map((p) => (
                    <div key={p._id} className="card-dark card-dark-hover flex flex-col p-5">
                      {p.imagen && (
                        <img src={p.imagen} alt={p.nombre} className="w-full h-44 object-cover rounded-2xl mb-5"
                          style={{ border: '1px solid rgba(201,168,76,0.2)' }}
                          onError={(e) => { e.currentTarget.style.display = "none"; }} />
                      )}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {p.envioGratis && <span className="badge badge-green"><Truck size={11} />Envío Gratis</span>}
                        {p.descuentoVigente && <span className="badge badge-gold"><Tag size={11} />-{p.descuento.porcentaje}%</span>}
                        {p.garantia?.tiene && <span className="badge badge-blue"><Shield size={11} />Garantía</span>}
                        <span className="badge badge-purple">{categorias.find(cat => cat.value === p.categoria)?.label || p.categoria}</span>
                      </div>
                      <h3 className="font-bold text-lg mb-2" style={{ color: '#F5F0E8' }}>{p.nombre}</h3>
                      <div className="mb-3">
                        {p.descuentoVigente ? (
                          <div>
                            <span className="text-2xl font-bold" style={{ color: '#86efac' }}>{formatearPrecio(p.precioConDescuento)}</span>
                            <span className="text-sm line-through ml-2" style={{ color: '#8B6914' }}>{formatearPrecio(p.precio)}</span>
                            <div className="text-sm mt-0.5" style={{ color: '#86efac' }}>Ahorras: {formatearPrecio(p.ahorroDescuento)}</div>
                          </div>
                        ) : (
                          <span className="text-2xl font-bold gold-text">{formatearPrecio(p.precio)}</span>
                        )}
                      </div>
                      <p className="text-sm flex-1 mb-4 line-clamp-3 font-light" style={{ color: '#D4C5A0' }}>{p.descripcion}</p>
                      <div className="space-y-1.5 text-sm mb-5" style={{ color: '#D4C5A0' }}>
                        <div className="flex justify-between">
                          <span style={{ color: '#8B6914' }}>Stock:</span>
                          <span className="font-medium" style={{ color: p.stock <= 0 ? '#f87171' : '#86efac' }}>{p.stock || 0} unidades</span>
                        </div>
                        {p.garantia?.tiene && (
                          <div className="flex justify-between">
                            <span style={{ color: '#8B6914' }}>Garantía:</span>
                            <span className="font-medium">{p.garantia.meses} meses</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-auto space-y-2">
                        <p className="text-xs text-center truncate" style={{ color: '#5a4a20' }}>ID: {p._id}</p>
                        <button onClick={() => startEditProduct(p)} className="btn-blue w-full justify-center text-sm"><Edit3 size={15} />Editar</button>
                        <button onClick={() => eliminarProducto(p._id)} className="btn-red w-full justify-center text-sm"><Trash2 size={15} />Eliminar</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══════════════ TAB: VER USUARIOS ══════════════ */}
            {activeTab === "verUsuarios" && !selectedUser && (
              <div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-8">
                  <h2 className="text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: '#F5F0E8' }}>Usuarios</h2>
                  <button onClick={getUsuarios} className="btn-blue"><RefreshCw size={16} />Recargar</button>
                </div>
                <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {usuarios.length === 0 ? (
                    <div className="col-span-full text-center py-16">
                      <Users style={{ color: '#8B6914' }} className="mx-auto mb-4" size={48} />
                      <p className="text-xl" style={{ color: '#D4C5A0' }}>No hay usuarios registrados</p>
                    </div>
                  ) : usuarios.map((u) => (
                    <div key={u._id} onClick={() => { setSelectedUser(u); setActiveTab("detalleUsuario"); getMascotasUsuario(u._id); }}
                      className="card-dark card-dark-hover p-5 cursor-pointer">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,rgba(168,85,247,0.3),rgba(59,130,246,0.3))', border: '1px solid rgba(168,85,247,0.3)' }}>
                          <Users style={{ color: '#c084fc' }} size={18} />
                        </div>
                        <span className={`badge ${u.role === 'admin' ? 'badge-red' : 'badge-blue'}`}>{u.role?.toUpperCase()}</span>
                      </div>
                      <h3 className="font-bold text-base mb-1" style={{ color: '#F5F0E8' }}>{u.name}</h3>
                      <p className="text-sm mb-4 truncate" style={{ color: '#D4C5A0' }}>{u.email}</p>
                      <div className="flex justify-between items-center text-sm mb-4">
                        <span style={{ color: '#8B6914' }}>Mascotas:</span>
                        <span className="font-semibold" style={{ color: '#C9A84C' }}>{u.totalMascotas || 0}</span>
                      </div>
                      <div className="pt-3" style={{ borderTop: '1px solid rgba(201,168,76,0.12)' }}>
                        <div className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium" style={{ background: 'rgba(201,168,76,0.06)', color: '#C9A84C' }}>
                          <Eye size={14} /><span>Ver detalles</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══════════════ TAB: VER CITAS ══════════════ */}
            {activeTab === "verCitas" && (
              <div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-8">
                  <h2 className="text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: '#F5F0E8' }}>Citas</h2>
                  <button onClick={getCitas} className="btn-blue"><RefreshCw size={16} />Recargar</button>
                </div>
                <div className="grid gap-5 grid-cols-1 lg:grid-cols-2">
                  {citas.length === 0 ? (
                    <div className="col-span-full text-center py-16">
                      <Calendar style={{ color: '#8B6914' }} className="mx-auto mb-4" size={48} />
                      <p className="text-xl" style={{ color: '#D4C5A0' }}>No hay citas registradas</p>
                    </div>
                  ) : citas.map((c) => (
                    <div key={c._id} className="card-dark p-6">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-5">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-xl mb-1 truncate" style={{ color: '#F5F0E8' }}>{c.usuario?.name || "Usuario no especificado"}</h3>
                          <p className="text-sm truncate" style={{ color: '#D4C5A0' }}>{c.usuario?.email}</p>
                        </div>
                        <span className={`badge whitespace-nowrap ${c.estado === "confirmada" ? 'badge-green' : c.estado === "pendiente" ? 'badge-gold' : c.estado === "cancelada" ? 'badge-red' : 'badge-blue'}`}>
                          {c.estado?.toUpperCase() || "PENDIENTE"}
                        </span>
                      </div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="info-cell">
                            <span className="font-semibold block mb-0.5" style={{ color: '#C9A84C' }}>Fecha:</span>
                            <p style={{ color: '#F5F0E8' }}>{c.fecha ? new Date(c.fecha).toLocaleDateString() : "No especificada"}</p>
                          </div>
                          <div className="info-cell">
                            <span className="font-semibold block mb-0.5" style={{ color: '#C9A84C' }}>Hora:</span>
                            <p style={{ color: '#F5F0E8' }}>{c.hora || "No especificada"}</p>
                          </div>
                        </div>
                        {c.mascota && (
                          <div className="info-cell text-sm">
                            <span className="font-semibold block mb-0.5" style={{ color: '#C9A84C' }}>Mascota:</span>
                            <p style={{ color: '#F5F0E8' }}>{c.mascota.nombre} ({c.mascota.especie})</p>
                          </div>
                        )}
                        {c.motivo && (
                          <div className="info-cell text-sm" style={{ background: 'rgba(168,85,247,0.05)', borderColor: 'rgba(168,85,247,0.2)' }}>
                            <span className="font-semibold block mb-0.5" style={{ color: '#c084fc' }}>Motivo:</span>
                            <p style={{ color: '#F5F0E8' }}>{c.motivo}</p>
                          </div>
                        )}
                        {c.notas && (
                          <div className="info-cell text-sm" style={{ background: 'rgba(201,168,76,0.04)', borderColor: 'rgba(201,168,76,0.15)' }}>
                            <span className="font-semibold block mb-0.5" style={{ color: '#C9A84C' }}>Notas:</span>
                            <p style={{ color: '#D4C5A0' }}>{c.notas}</p>
                          </div>
                        )}
                        <div className="pt-3" style={{ borderTop: '1px solid rgba(201,168,76,0.1)' }}>
                          <p className="text-xs truncate" style={{ color: '#5a4a20' }}>ID: {c._id}</p>
                          {c.createdAt && <p className="text-xs" style={{ color: '#5a4a20' }}>Creada: {new Date(c.createdAt).toLocaleString()}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══════════════ TAB: DETALLE USUARIO ══════════════ */}
            {activeTab === "detalleUsuario" && selectedUser && (
              <div>
                <button onClick={() => { setActiveTab("verUsuarios"); setSelectedUser(null); }} className="btn-gray mb-8">
                  <ArrowLeft size={16} />Volver a Usuarios
                </button>

                <h2 className="text-3xl font-bold mb-8" style={{ fontFamily: "'Playfair Display', serif", color: '#F5F0E8' }}>
                  Mascotas de <span className="gold-text">{selectedUser.name}</span>
                </h2>

                <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                  {mascotasUsuario.length === 0 ? (
                    <div className="col-span-full text-center py-16 card-dark">
                      <Activity style={{ color: '#8B6914' }} className="mx-auto mb-4" size={48} />
                      <p className="text-xl" style={{ color: '#D4C5A0' }}>Este usuario no tiene mascotas registradas</p>
                    </div>
                  ) : mascotasUsuario.map((m) => (
                    <div key={m._id} className="card-dark p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-2xl truncate" style={{ fontFamily: "'Playfair Display', serif", color: '#F5F0E8' }}>{m.nombre}</h3>
                          <p style={{ color: '#C9A84C' }}>{m.especie} • {m.raza}</p>
                        </div>
                        {m.imagen && (
                          <img src={m.imagen} alt={m.nombre} className="w-20 h-20 object-cover rounded-2xl flex-shrink-0"
                            style={{ border: '1px solid rgba(201,168,76,0.3)' }}
                            onError={(e) => { e.currentTarget.style.display = "none"; }} />
                        )}
                      </div>

                      {/* Info básica */}
                      <div className="mb-6 p-4 rounded-2xl" style={{ background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.1)' }}>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {[
                            ['Edad', m.edad ? `${m.edad} años` : "No especificada"],
                            ['Género', m.genero || "No especificado"],
                            ['Estado', m.estado || "No especificado"],
                            ['Especie', m.raza || "No especificada"],
                            ['Enfermedades', m.enfermedades || "Ninguna"],
                          ].map(([label, value]) => (
                            <div key={String(label)}>
                              <span className="font-semibold block mb-0.5" style={{ color: '#C9A84C' }}>{label}:</span>
                              <p style={{ color: '#D4C5A0' }}>{value}</p>
                            </div>
                          ))}
                        </div>
                        {m.historial && (
                          <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(201,168,76,0.12)' }}>
                            <span className="font-semibold block mb-1 text-sm" style={{ color: '#C9A84C' }}>Historial:</span>
                            <p className="text-sm" style={{ color: '#D4C5A0' }}>{m.historial}</p>
                          </div>
                        )}
                      </div>

                      {/* Operaciones médicas */}
                      <div className="mb-6">
                        <h4 className="font-semibold mb-4 text-lg" style={{ color: '#93c5fd' }}>⚕️ Operaciones Médicas</h4>
                        {m.operaciones?.length > 0 ? (
                          <div className="space-y-2 mb-4">
                            {m.operaciones.map((op, idx) => (
                              <div key={idx} className="hist-op">
                                <div className="flex justify-between items-start mb-1.5">
                                  <span className="font-medium text-sm" style={{ color: '#93c5fd' }}>{op.nombre}</span>
                                  <span className="text-xs whitespace-nowrap" style={{ color: '#7dd3fc' }}>{new Date(op.fecha).toLocaleDateString()}</span>
                                </div>
                                {op.descripcion && <p className="text-xs" style={{ color: '#bfdbfe' }}>{op.descripcion}</p>}
                              </div>
                            ))}
                          </div>
                        ) : <p className="text-sm mb-4" style={{ color: '#8B6914' }}>No hay operaciones registradas</p>}

                        <form className="space-y-2" onSubmit={(e) => handleAgregarOperacion(e, m._id)}>
                          <input type="text" name="nombre" placeholder="Nombre de la operación (ej: Esterilización, Cirugía, etc.)" className="gold-input" required />
                          <textarea name="descripcion" placeholder="Descripción detallada del procedimiento" className="gold-input" rows={3} required />
                          <div className="grid grid-cols-2 gap-2">
                            <input type="date" name="fecha" className="gold-input" required />
                            <button type="submit" className="btn-blue justify-center text-sm">Agregar Operación</button>
                          </div>
                        </form>
                      </div>

                      {/* Citas médicas */}
                      <div>
                        <h4 className="font-semibold mb-4 text-lg" style={{ color: '#86efac' }}>💉 Citas Médicas</h4>
                        {m.vacunas?.length > 0 ? (
                          <div className="space-y-2 mb-4">
                            {m.vacunas.map((cita, idx) => (
                              <div key={idx} className="hist-cita">
                                <div className="flex justify-between items-start mb-1.5">
                                  <span className="font-medium text-sm" style={{ color: '#86efac' }}>{cita.nombre}</span>
                                  <span className="text-xs whitespace-nowrap" style={{ color: '#6ee7b7' }}>{new Date(cita.fecha).toLocaleDateString()}</span>
                                </div>
                                {cita.descripcion && <p className="text-xs" style={{ color: '#a7f3d0' }}>{cita.descripcion}</p>}
                              </div>
                            ))}
                          </div>
                        ) : <p className="text-sm mb-4" style={{ color: '#8B6914' }}>No hay citas médicas registradas</p>}

                        <form className="space-y-2" onSubmit={(e) => handleAgregarCitaMedica(e, m._id)}>
                          <input type="text" name="nombre" placeholder="Tipo de cita médica (ej: Vacuna Antirrábica, Consulta General, etc.)" className="gold-input" required />
                          <textarea name="descripcion" placeholder="Descripción de la cita médica (opcional)" className="gold-input" rows={3} />
                          <div className="grid grid-cols-2 gap-2">
                            <input type="date" name="fecha" className="gold-input" required />
                            <button type="submit" className="btn-blue justify-center text-sm" style={{ background:'rgba(34,197,94,0.15)', borderColor:'rgba(34,197,94,0.3)', color:'#86efac' }}>Agregar Cita Médica</button>
                          </div>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;