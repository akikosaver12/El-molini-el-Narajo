import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../../contexts/CartContext";
import { brandConfig } from "../../utils/brandConfig";

const GOLD_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
  .gold-text { background:linear-gradient(135deg,#E8C97A,#C9A84C 50%,#8B6914); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
  @keyframes shimmer { 0%{background-position:-200% center;} 100%{background-position:200% center;} }
  .shimmer-line { background:linear-gradient(90deg,transparent,#C9A84C44,transparent); background-size:200% 100%; animation:shimmer 3s ease-in-out infinite; }

  /* Nav links */
  .nav-link {
    padding:8px 16px; border-radius:12px; font-weight:500; font-size:0.9rem;
    color:#D4C5A0; transition:all 0.2s; letter-spacing:0.02em;
  }
  .nav-link:hover { color:#F5F0E8; background:rgba(201,168,76,0.1); }
  .nav-link-active {
    background:linear-gradient(135deg,#C9A84C,#8B6914);
    color:#0A0A08 !important; font-weight:700; box-shadow:0 4px 14px rgba(201,168,76,0.3);
  }

  /* Dropdown */
  .dropdown-panel {
    position:absolute; right:0; margin-top:8px; width:224px;
    background:#1a1200; border:1px solid rgba(201,168,76,0.25);
    border-radius:1rem; box-shadow:0 20px 40px rgba(0,0,0,0.6); z-index:50; overflow:hidden;
  }
  .dropdown-header {
    padding:12px 16px; border-bottom:1px solid rgba(201,168,76,0.15);
    background:rgba(201,168,76,0.06);
  }
  .dropdown-item {
    display:flex; align-items:center; padding:10px 16px; font-size:0.875rem;
    color:#D4C5A0; transition:all 0.15s; cursor:pointer; width:100%;
    background:transparent; border:none; text-align:left; gap:12px;
  }
  .dropdown-item:hover { background:rgba(201,168,76,0.08); color:#F5F0E8; }
  .dropdown-item-admin { color:#93c5fd; }
  .dropdown-item-admin:hover { background:rgba(59,130,246,0.1); }
  .dropdown-item-danger { color:#f87171; }
  .dropdown-item-danger:hover { background:rgba(239,68,68,0.08); }
  .dropdown-sep { border-top:1px solid rgba(201,168,76,0.12); margin:4px 0; }

  /* Carrito */
  .cart-btn {
    display:flex; align-items:center; gap:12px;
    background:#1a1200; border:1px solid rgba(201,168,76,0.3);
    color:#D4C5A0; padding:10px 16px; border-radius:1rem;
    transition:all 0.2s; font-family:'Lato',sans-serif;
  }
  .cart-btn:hover { border-color:rgba(201,168,76,0.6); color:#F5F0E8; box-shadow:0 4px 14px rgba(201,168,76,0.15); }

  /* Avatar */
  .avatar-btn {
    width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center;
    background:linear-gradient(135deg,#C9A84C,#8B6914);
    color:#0A0A08; font-weight:700; font-size:0.875rem;
    transition:all 0.2s; cursor:pointer; border:none;
    box-shadow:0 4px 14px rgba(201,168,76,0.25);
  }
  .avatar-btn:hover { transform:scale(1.08); box-shadow:0 6px 20px rgba(201,168,76,0.4); }

  /* Login btn */
  .login-btn {
    background:linear-gradient(135deg,#C9A84C,#8B6914); color:#0A0A08;
    padding:10px 18px; border-radius:1rem; font-weight:700; font-size:0.875rem;
    display:flex; align-items:center; gap:8px; transition:all 0.2s;
    letter-spacing:0.03em;
  }
  .login-btn:hover { transform:scale(1.04); box-shadow:0 8px 20px rgba(201,168,76,0.35); }

  /* Hamburger */
  .hamburger-btn {
    padding:8px; color:#D4C5A0; transition:color 0.2s; background:none; border:none; cursor:pointer;
  }
  .hamburger-btn:hover { color:#C9A84C; }

  /* Fav btn */
  .fav-btn { padding:8px; transition:color 0.2s; background:none; border:none; cursor:pointer; color:#8B6914; }
  .fav-btn:hover { color:#f87171; }
`;

const Header: React.FC = () => {
  const { state: cartState } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  const [user, setUser] = useState<{
    username: string;
    id: string;
    email?: string;
    role?: string;
  } | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadUser = () => {
      const rawUser = localStorage.getItem("user");
      if (rawUser) {
        try {
          const parsed = JSON.parse(rawUser);
          setUser({
            username: parsed?.name || parsed?.username || "",
            id: parsed?.id || "",
            email: parsed?.email || "",
            role: parsed?.role || "",
          });
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      const rawUser = localStorage.getItem("user");
      if (rawUser) {
        try {
          const parsed = JSON.parse(rawUser);
          setUser({
            username: parsed?.name || parsed?.username || "",
            id: parsed?.id || "",
            email: parsed?.email || "",
            role: parsed?.role || "",
          });
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]?.toUpperCase()).join("").slice(0, 2);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setMenuOpen(false);
    setMobileMenuOpen(false);
    navigate("/");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const NAV_LINKS = [
    { path: "/", label: "Inicio" },
    { path: "/products", label: "Productos" },
    { path: "/about", label: "Nosotros" },
    { path: "/contact", label: "Contacto" },
    { path: "/mascotas", label: "trajadores" },
  ];

  const NAV_LINKS_MOBILE = [
    { path: "/", label: "Inicio", icon: "" },
    { path: "/products", label: "Productos", icon: "" },
    { path: "/about", label: "Nosotros", icon: "" },
    { path: "/contact", label: "Contacto", icon: "" },
    { path: "/mascotas", label: "tranajadores", icon: "" },
  ];

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        backgroundColor: 'rgba(10,10,8,0.97)',
        borderBottom: '1px solid rgba(201,168,76,0.2)',
        backdropFilter: 'blur(12px)',
        fontFamily: "'Lato', sans-serif",
      }}
    >
      <style>{GOLD_STYLES}</style>

      {/* Línea shimmer top */}
      <div className="shimmer-line h-px" />

      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">

          {/* ── Logo ── */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden transition-all duration-300 group-hover:scale-105"
                style={{
                  background: 'rgba(201,168,76,0.1)',
                  border: '1px solid rgba(201,168,76,0.35)',
                  boxShadow: '0 4px 14px rgba(201,168,76,0.15)',
                }}
              >
                <img
                  src={brandConfig.logo.url}
                  alt={brandConfig.logo.alt}
                  className="w-full h-full object-contain"
                />
              </div>
              {/* shimmer sobre logo en hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 rounded-2xl transition-opacity duration-300 -skew-x-12 pointer-events-none" />
            </div>
            <div className="hidden sm:block">
              <h1
                className="text-xl font-bold gold-text"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {brandConfig.name}
              </h1>
              <p className="text-xs -mt-0.5" style={{ color: '#8B6914' }}>{brandConfig.slogan}</p>
            </div>
          </Link>

          {/* ── Nav Desktop ── */}
          <nav className="hidden lg:flex items-center space-x-1">
            {NAV_LINKS.map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                className={`nav-link ${isActive(path) ? 'nav-link-active' : ''}`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* ── Acciones ── */}
          <div className="flex items-center space-x-3">

            {/* Favoritos */}
            <button className="fav-btn">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>

            {/* Login / Avatar */}
            {!user ? (
              <Link to="/login" className="login-btn">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Iniciar sesión</span>
              </Link>
            ) : (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="avatar-btn"
                  title={`Usuario: ${user.username}`}
                >
                  {getInitials(user.username)}
                </button>

                {menuOpen && (
                  <div className="dropdown-panel">
                    {/* Cabecera */}
                    <div className="dropdown-header">
                      <p className="text-sm font-medium truncate" style={{ color: '#F5F0E8' }}>
                        {user.username}
                      </p>
                      {user.email && (
                        <p className="text-xs truncate mt-0.5" style={{ color: '#8B6914' }}>
                          {user.email}
                        </p>
                      )}
                    </div>

                    <div className="py-1">
                      <Link
                        to="/perfil"
                        className="dropdown-item"
                        onClick={() => setMenuOpen(false)}
                      >
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Mi Perfil
                      </Link>

                      <Link
                        to="/mascotas"
                        className="dropdown-item"
                        onClick={() => setMenuOpen(false)}
                      >
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        Mis trabajadores
                      </Link>

                      {user.role === "admin" && (
                        <Link
                          to="/admin"
                          className="dropdown-item dropdown-item-admin"
                          onClick={() => setMenuOpen(false)}
                        >
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Panel Admin
                        </Link>
                      )}

                      <div className="dropdown-sep" />

                      <button onClick={handleLogout} className="dropdown-item dropdown-item-danger">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Carrito */}
            <Link to="/cart" className="cart-btn group">
              <div className="relative">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 4H19m-10-4v6a2 2 0 104 0v-6m-4 0h4" />
                </svg>
                {cartState.itemCount > 0 && (
                  <div
                    className="absolute -top-2 -right-2 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse"
                    style={{ background: 'linear-gradient(135deg,#C9A84C,#8B6914)', color: '#0A0A08' }}
                  >
                    {cartState.itemCount}
                  </div>
                )}
              </div>
              <div className="hidden sm:block">
                <span className="font-medium text-sm">Carrito</span>
                {cartState.total > 0 && (
                  <p className="text-xs -mt-0.5" style={{ color: '#8B6914' }}>
                    {new Intl.NumberFormat("es-CO", {
                      style: "currency",
                      currency: "COP",
                      minimumFractionDigits: 0,
                    }).format(cartState.total)}
                  </p>
                )}
              </div>
            </Link>

            {/* Hamburguesa móvil */}
            <div className="lg:hidden relative" ref={mobileMenuRef}>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="hamburger-btn"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
              </button>

              {/* Dropdown móvil */}
              {mobileMenuOpen && (
                <div className="dropdown-panel" style={{ width: '224px' }}>
                  <div className="py-1">
                    {NAV_LINKS_MOBILE.map(({ path, label, icon }) => (
                      <Link
                        key={path}
                        to={path}
                        onClick={() => setMobileMenuOpen(false)}
                        className="dropdown-item"
                        style={isActive(path) ? {
                          background: 'linear-gradient(135deg,rgba(201,168,76,0.2),rgba(139,105,20,0.2))',
                          color: '#C9A84C',
                          fontWeight: 700,
                        } : {}}
                      >
                        <span className="text-lg">{icon}</span>
                        {label}
                      </Link>
                    ))}

                    {user && (
                      <>
                        <div className="dropdown-sep" />
                        <Link
                          to="/perfil"
                          onClick={() => setMobileMenuOpen(false)}
                          className="dropdown-item"
                        >
                          <span className="text-lg">👤</span>
                          Mi Perfil
                        </Link>

                        {user.role === "admin" && (
                          <Link
                            to="/admin"
                            onClick={() => setMobileMenuOpen(false)}
                            className="dropdown-item dropdown-item-admin"
                          >
                            <span className="text-lg">⚙️</span>
                            Panel Admin
                          </Link>
                        )}

                        <div className="dropdown-sep" />
                        <button onClick={handleLogout} className="dropdown-item dropdown-item-danger">
                          <span className="text-lg">🚪</span>
                          Cerrar sesión
                        </button>
                      </>
                    )}

                    {!user && (
                      <>
                        <div className="dropdown-sep" />
                        <Link
                          to="/login"
                          onClick={() => setMobileMenuOpen(false)}
                          className="dropdown-item"
                          style={{ color: '#C9A84C', fontWeight: 600 }}
                        >
                          <span className="text-lg">🔑</span>
                          Iniciar sesión
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;