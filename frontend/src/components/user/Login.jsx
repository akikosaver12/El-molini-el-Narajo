import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from '@react-oauth/google';

const API_URL = process.env.REACT_APP_API_URL || "https://biosys1.onrender.com/api";

const GOLD_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
  .gold-text { background:linear-gradient(135deg,#E8C97A,#C9A84C 50%,#8B6914); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
  @keyframes shimmer { 0%{background-position:-200% center;} 100%{background-position:200% center;} }
  .shimmer-line { background:linear-gradient(90deg,transparent,#C9A84C44,transparent); background-size:200% 100%; animation:shimmer 3s ease-in-out infinite; }
  input.gold-input {
    width:100%; background:#0f0c00; border:1px solid rgba(201,168,76,0.25); color:#D4C5A0;
    border-radius:0.875rem; padding:0.875rem 1rem; outline:none; transition:border-color 0.2s;
    font-family:'Lato',sans-serif; font-size:1rem;
  }
  input.gold-input:focus { border-color:#C9A84C; }
  input.gold-input::placeholder { color:rgba(212,197,160,0.4); }
  .gold-btn { background:linear-gradient(135deg,#C9A84C,#8B6914); color:#0A0A08; font-weight:700; border:none; cursor:pointer; transition:all 0.3s; border-radius:0.875rem; padding:0.875rem 1rem; width:100%; font-family:'Lato',sans-serif; font-size:1rem; letter-spacing:0.05em; }
  .gold-btn:hover:not(:disabled) { transform:scale(1.02); box-shadow:0 10px 28px rgba(201,168,76,0.35); }
  .gold-btn:disabled { opacity:0.5; cursor:not-allowed; }
  .warn-banner { background:rgba(234,179,8,0.08); border:1px solid rgba(234,179,8,0.3); border-radius:0.875rem; padding:1rem; }
  .btn-outline-gold { background:transparent; border:1px solid rgba(201,168,76,0.35); color:#C9A84C; border-radius:0.75rem; padding:8px 12px; width:100%; font-size:0.875rem; cursor:pointer; transition:all 0.2s; font-family:'Lato',sans-serif; }
  .btn-outline-gold:hover { background:rgba(201,168,76,0.08); }
  .btn-warn-solid { background:rgba(234,179,8,0.2); border:1px solid rgba(234,179,8,0.4); color:#fde047; border-radius:0.75rem; padding:8px 12px; width:100%; font-size:0.875rem; cursor:pointer; transition:all 0.2s; font-family:'Lato',sans-serif; }
  .btn-warn-solid:hover { background:rgba(234,179,8,0.3); }
`;

const GoldDivider = () => (
  <div className="flex items-center gap-3 my-4">
    <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.3))' }} />
    <div className="w-1 h-1 rotate-45" style={{ background: '#C9A84C' }} />
    <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, transparent, rgba(201,168,76,0.3))' }} />
  </div>
);

function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setShowVerificationMessage(false);
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        alert("✅ Bienvenido " + data.user.name);
        if (data.user.role === "admin") navigate("/admin");
        else navigate("/home");
      } else {
        if (data.requiereVerificacion) {
          setShowVerificationMessage(true);
          setPendingEmail(data.email);
        } else {
          alert("❌ " + (data.error || "Credenciales incorrectas"));
        }
      }
    } catch (error) {
      alert("⚠️ No se pudo conectar al servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        alert("✅ Bienvenido " + data.user.name);
        if (data.user.role === "admin") navigate("/admin");
        else navigate("/home");
      } else {
        alert("❌ " + (data.error || "Error en autenticación con Google"));
      }
    } catch (error) {
      alert("⚠️ Error al iniciar sesión con Google: " + error.message);
    }
  };

  const handleGoogleError = () => alert("❌ Error al iniciar sesión con Google");

  const reenviarVerificacion = async () => {
    if (!pendingEmail) return;
    try {
      const res = await fetch(`${API_URL}/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail }),
      });
      const data = await res.json();
      if (res.ok) alert("✅ Email de verificación reenviado. Revisa tu bandeja de entrada.");
      else alert("❌ " + (data.error || "Error al reenviar email"));
    } catch {
      alert("❌ Error al reenviar email de verificación");
    }
  };

  const irAVerificacionPendiente = () => {
    navigate("/verificacion-pendiente", {
      state: { email: pendingEmail, mensaje: "Debes verificar tu email antes de iniciar sesión" }
    });
  };

  return (
    <div className="flex justify-center items-center min-h-screen px-4"
      style={{ backgroundColor: '#0A0A08', fontFamily: "'Lato', sans-serif" }}>
      <style>{GOLD_STYLES}</style>

      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="rounded-3xl p-8" style={{ background: 'linear-gradient(135deg,#1a1200,#0f0c00)', border: '1px solid rgba(201,168,76,0.2)' }}>
          <div className="shimmer-line h-px mb-8 rounded-full" />

          {/* Título */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 border border-amber-700/40 rounded-full px-4 py-1.5 mb-4 bg-amber-950/20">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs tracking-[0.25em] uppercase" style={{ color: '#C9A84C' }}>Acceso</span>
            </div>
            <h2 className="text-3xl font-bold gold-text" style={{ fontFamily: "'Playfair Display', serif" }}>
              Iniciar Sesión
            </h2>
          </div>

          {/* Banner verificación */}
          {showVerificationMessage && (
            <div className="warn-banner mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#fde047' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold mb-1" style={{ color: '#fde047' }}>Email no verificado</h3>
                  <p className="text-sm mb-3" style={{ color: '#D4C5A0' }}>
                    Debes verificar tu email antes de iniciar sesión. Revisa tu bandeja de entrada para{' '}
                    <strong style={{ color: '#C9A84C' }}>{pendingEmail}</strong>
                  </p>
                  <div className="space-y-2">
                    <button type="button" onClick={irAVerificacionPendiente} className="btn-warn-solid">
                      Ver instrucciones de verificación
                    </button>
                    <button type="button" onClick={reenviarVerificacion} className="btn-outline-gold">
                      Reenviar email de verificación
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Google Login */}
          <div className="mb-4 flex justify-center">
            <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} theme="filled_black" size="large" width="100%" />
          </div>

          <GoldDivider />

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <input type="email" name="email" placeholder="Correo electrónico" value={formData.email} onChange={handleChange} className="gold-input" required />
            <input type="password" name="password" placeholder="Contraseña" value={formData.password} onChange={handleChange} className="gold-input" required />

            <button type="submit" disabled={loading} className="gold-btn mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Ingresando...
                </span>
              ) : "Ingresar"}
            </button>
          </form>

          {/* Registro */}
          <p className="text-sm text-center mt-6" style={{ color: '#8B6914' }}>
            ¿No tienes cuenta?{" "}
            <span className="cursor-pointer font-semibold" style={{ color: '#C9A84C' }}
              onClick={() => navigate("/registro")}>
              Regístrate
            </span>
          </p>

          <div className="shimmer-line h-px mt-8 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default Login;