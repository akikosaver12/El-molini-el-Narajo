import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';

const API_URL = process.env.REACT_APP_API_URL || "https://biosys1.onrender.com/api";

/* ─── Estilos compartidos ─── */
const GOLD_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
  .gold-text {
    background: linear-gradient(135deg, #E8C97A 0%, #C9A84C 50%, #8B6914 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .gold-btn {
    background: linear-gradient(135deg, #C9A84C, #8B6914);
    color: #0A0A08;
    transition: all 0.3s;
  }
  .gold-btn:hover { transform: scale(1.03); box-shadow: 0 12px 32px rgba(201,168,76,0.3); }
  .gold-border { border: 1px solid rgba(201,168,76,0.25); }
  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  .shimmer-line {
    background: linear-gradient(90deg, transparent, #C9A84C44, transparent);
    background-size: 200% 100%;
    animation: shimmer 3s ease-in-out infinite;
  }
  .card-dark {
    background: linear-gradient(135deg, #1a1200 0%, #0f0c00 100%);
    border: 1px solid rgba(201,168,76,0.18);
    transition: border-color 0.3s;
  }
  .card-dark:hover { border-color: rgba(201,168,76,0.4); }
  input.gold-input, select.gold-input {
    background: #0f0c00;
    border: 1px solid rgba(201,168,76,0.25);
    color: #D4C5A0;
    border-radius: 0.75rem;
    padding: 0.875rem 1rem;
    width: 100%;
    outline: none;
    transition: border-color 0.2s;
  }
  input.gold-input:focus, select.gold-input:focus {
    border-color: #C9A84C;
  }
  input.gold-input::placeholder { color: rgba(212,197,160,0.4); }
`;

const GoldDivider = () => (
  <div className="flex items-center justify-center gap-4 my-2">
    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-600/60" />
    <div className="w-2 h-2 rotate-45 bg-amber-500" />
    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-600/60" />
  </div>
);

const CartPage: React.FC = () => {
  const { state: cartState, dispatch } = useCart();
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [error, setError] = useState('');

  const calculos = useMemo(() => {
    const subtotal = cartState.total;
    const ENVIO_GRATIS_MINIMO = 100000;
    const COSTO_ENVIO = 7000;
    const costoEnvio = subtotal >= ENVIO_GRATIS_MINIMO ? 0 : COSTO_ENVIO;
    const iva = Math.round(subtotal * 0.19);
    const totalFinal = subtotal + iva + costoEnvio;
    return { subtotal, costoEnvio, envioGratis: costoEnvio === 0, iva, totalFinal, ENVIO_GRATIS_MINIMO };
  }, [cartState.total]);

  const updateQuantity = (id: string, quantity: number) => {
    if (!id || quantity < 1) return;
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const removeFromCart = (id: string) => {
    if (!id) return;
    dispatch({ type: 'REMOVE_FROM_CART', payload: id });
  };

  const clearCartAction = () => dispatch({ type: 'CLEAR_CART' });

  const formatCOP = (value: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(value);

  const getCategoryLabel = (categoria: string) => {
    const categoryMap: Record<string, string> = {
      alimento: 'Alimento', juguetes: 'Juguetes', medicamentos: 'Medicamentos',
      accesorios: 'Accesorios', higiene: 'Higiene', otros: 'Otros'
    };
    return categoryMap[categoria] || categoria;
  };

  const clearCart = () => {
    if (window.confirm('¿Estás seguro de que quieres vaciar el carrito?')) clearCartAction();
  };

  const procesarPago = async () => {
    if (!cartState.items || cartState.items.length === 0) { setError('El carrito está vacío'); return; }
    const itemsValidos = cartState.items.filter(item => item && item.id && item.name && item.price);
    if (itemsValidos.length === 0) { setError('No hay productos válidos en el carrito'); return; }
    setProcesandoPago(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) { setError('Debes iniciar sesión para continuar'); setProcesandoPago(false); return; }
      const items = itemsValidos.map(item => ({
        title: item.name,
        unit_price: Math.round(item.price * 1.19),
        quantity: item.quantity,
        description: `${getCategoryLabel(item.category)} - ${item.name} (IVA incluido)`,
        currency_id: 'COP'
      }));
      if (calculos.costoEnvio > 0) {
        items.push({ title: 'Envío a domicilio', unit_price: calculos.costoEnvio, quantity: 1, description: 'Costo de envío estándar', currency_id: 'COP' });
      }
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const payer = {
        name: userData.name || 'Usuario', email: userData.email || 'user@example.com',
        phone: userData.telefono || '3001234567',
        address: { street_name: userData.direccion?.calle || 'Calle principal', street_number: 123, zip_code: '110111' }
      };
      const response = await fetch(`${API_URL}/crear-preferencia-pago`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ items, payer })
      });
      if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || 'Error al procesar el pago'); }
      const data = await response.json();
      const redirectUrl = data.init_point || data.sandbox_init_point;
      if (!redirectUrl) throw new Error('No se recibió URL de pago válida del servidor');
      window.location.href = redirectUrl;
    } catch (error) {
      console.error('Error procesando pago:', error);
      setError('Hubo un error al procesar el pago. Por favor intenta nuevamente.');
      setProcesandoPago(false);
    }
  };

  /* ── Estado: no logueado ── */
  if (!cartState.isUserLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-20" style={{ backgroundColor: '#0A0A08' }}>
        <style>{GOLD_STYLES}</style>
        <div className="max-w-md mx-auto text-center">
          <div className="relative mb-10">
            <div
              className="w-32 h-32 mx-auto rounded-3xl flex items-center justify-center shadow-xl"
              style={{ background: 'linear-gradient(135deg, #1a1200, #2a1a00)', border: '1px solid rgba(201,168,76,0.3)' }}
            >
              <div className="text-6xl">🔒</div>
            </div>
            <div
              className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center animate-bounce"
              style={{ background: '#C9A84C' }}
            >
              <span className="text-sm">🛒</span>
            </div>
          </div>
          <h1
            className="text-3xl font-bold mb-4"
            style={{ fontFamily: "'Playfair Display', serif", color: '#F5F0E8' }}
          >
            Inicia sesión para usar tu carrito
          </h1>
          <p className="mb-10 leading-relaxed font-light" style={{ color: '#D4C5A0' }}>
            Para agregar productos a tu carrito y mantener tus compras guardadas, necesitas tener una cuenta activa. ¡Es rápido y fácil!
          </p>
          <div className="space-y-4">
            <Link to="/login" className="block w-full gold-btn font-bold py-4 px-6 rounded-2xl text-center tracking-widest uppercase text-sm">
              🔑 Iniciar Sesión
            </Link>
            <Link
              to="/products"
              className="block w-full font-semibold py-4 px-6 rounded-2xl text-center transition-all duration-200 hover:scale-105"
              style={{ border: '1px solid rgba(201,168,76,0.35)', color: '#C9A84C', backgroundColor: 'transparent' }}
            >
              🛍️ Ver Productos
            </Link>
            <Link to="/" className="block w-full font-medium py-2 transition-colors" style={{ color: '#8B6914' }}>
              🏠 Volver al Inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Estado: carrito vacío ── */
  if (cartState.items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-20" style={{ backgroundColor: '#0A0A08' }}>
        <style>{GOLD_STYLES}</style>
        <div className="max-w-md mx-auto text-center">
          <div className="relative mb-10">
            <div
              className="w-32 h-32 mx-auto rounded-3xl flex items-center justify-center shadow-xl"
              style={{ background: 'linear-gradient(135deg, #1a1200, #0f0c00)', border: '1px solid rgba(201,168,76,0.2)' }}
            >
              <div className="text-6xl">🛒</div>
            </div>
            <div
              className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center animate-bounce"
              style={{ background: '#C9A84C' }}
            >
              <span className="text-sm">💨</span>
            </div>
          </div>
          <h1
            className="text-3xl font-bold mb-4"
            style={{ fontFamily: "'Playfair Display', serif", color: '#F5F0E8' }}
          >
            Tu carrito está vacío
          </h1>
          <p className="mb-10 leading-relaxed font-light" style={{ color: '#D4C5A0' }}>
            ¡No te preocupes! Tenemos productos increíbles esperándote. Explora nuestra colección y encuentra algo que te encante.
          </p>
          <div className="space-y-4">
            <Link to="/products" className="block w-full gold-btn font-bold py-4 px-6 rounded-2xl text-center tracking-widest uppercase text-sm">
              🛍️ Explorar Productos
            </Link>
            <Link
              to="/"
              className="block w-full font-semibold py-4 px-6 rounded-2xl text-center transition-all duration-200"
              style={{ border: '1px solid rgba(201,168,76,0.3)', color: '#C9A84C' }}
            >
              🏠 Volver al Inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Vista principal del carrito ── */
  return (
    <div className="min-h-screen py-12 px-6" style={{ backgroundColor: '#0A0A08', fontFamily: "'Lato', sans-serif" }}>
      <style>{GOLD_STYLES}</style>

      <div className="container mx-auto">
        {/* Encabezado */}
        <div className="mb-12">
          <nav className="mb-6">
            <div className="flex items-center space-x-2 text-sm" style={{ color: '#8B6914' }}>
              <Link to="/" className="hover:text-amber-400 transition-colors">Inicio</Link>
              <span>›</span>
              <span style={{ color: '#C9A84C' }}>Carrito de Compras</span>
            </div>
          </nav>

          <div className="shimmer-line h-px mb-8" />

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1
                className="text-4xl font-bold mb-2"
                style={{ fontFamily: "'Playfair Display', serif", color: '#F5F0E8' }}
              >
                🛒 Tu Carrito
              </h1>
              <p style={{ color: '#D4C5A0' }}>
                {cartState.itemCount} {cartState.itemCount === 1 ? 'producto' : 'productos'} en tu carrito
              </p>
            </div>

            <button
              onClick={clearCart}
              className="flex items-center space-x-2 font-medium py-3 px-4 rounded-xl transition-all duration-200"
              style={{ background: 'rgba(220,38,38,0.1)', color: '#f87171', border: '1px solid rgba(220,38,38,0.3)' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Vaciar Carrito</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

          {/* ── Lista de items ── */}
          <div className="xl:col-span-2 space-y-6">
            {cartState.items
              .filter(item => item && item.id)
              .map(item => (
                <div key={item.id} className="card-dark rounded-3xl p-6 group">
                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Imagen */}
                    <div className="flex-shrink-0">
                      <div
                        className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden"
                        style={{ border: '1px solid rgba(201,168,76,0.2)' }}
                      >
                        <img
                          src={item.image || 'https://via.placeholder.com/128?text=Producto'}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/128?text=Producto'; }}
                        />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div className="flex-1">
                          <h3
                            className="text-xl font-bold mb-2"
                            style={{ fontFamily: "'Playfair Display', serif", color: '#F5F0E8' }}
                          >
                            {item.name}
                          </h3>

                          <div className="flex flex-wrap gap-2 mb-4">
                            <span
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                              style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.25)' }}
                            >
                              {getCategoryLabel(item.category)}
                            </span>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                              style={{ background: 'rgba(34,197,94,0.1)', color: '#86efac', border: '1px solid rgba(34,197,94,0.2)' }}>
                              ✓ Disponible
                            </span>
                            {item.stock && item.stock <= 5 && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                                style={{ background: 'rgba(251,146,60,0.1)', color: '#fdba74', border: '1px solid rgba(251,146,60,0.2)' }}>
                                Solo {item.stock} disponibles
                              </span>
                            )}
                          </div>

                          <div className="flex items-baseline space-x-2 mb-4">
                            <span className="text-2xl font-bold gold-text">{formatCOP(item.price)}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end space-y-4">
                          {/* Qty control */}
                          <div
                            className="flex items-center space-x-3 rounded-xl p-1"
                            style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}
                          >
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="w-10 h-10 flex items-center justify-center rounded-lg font-bold transition-all duration-200 disabled:opacity-40"
                              style={{ color: '#C9A84C' }}
                            >
                              −
                            </button>
                            <span className="w-12 text-center font-bold text-lg" style={{ color: '#F5F0E8' }}>
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={!!item.stock && item.quantity >= item.stock}
                              className="w-10 h-10 flex items-center justify-center rounded-lg font-bold transition-all duration-200 disabled:opacity-40"
                              style={{ color: '#C9A84C' }}
                            >
                              +
                            </button>
                          </div>

                          <div className="text-right">
                            <p className="text-sm" style={{ color: '#8B6914' }}>Subtotal</p>
                            <p className="text-xl font-bold gold-text">{formatCOP(item.price * item.quantity)}</p>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="flex items-center space-x-2 font-medium transition-colors duration-200 text-sm"
                            style={{ color: '#f87171' }}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Eliminar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {/* ── Panel de resumen ── */}
          <div className="xl:col-span-1">
            <div
              className="rounded-3xl p-8 sticky top-24"
              style={{ background: 'linear-gradient(135deg, #1a1200, #0f0c00)', border: '1px solid rgba(201,168,76,0.25)' }}
            >
              <div className="mb-8">
                <h2
                  className="text-2xl font-bold mb-2"
                  style={{ fontFamily: "'Playfair Display', serif", color: '#F5F0E8' }}
                >
                  📋 Resumen del Pedido
                </h2>
                <p style={{ color: '#D4C5A0' }}>Revisa tu orden antes de proceder</p>
              </div>

              <div className="space-y-4 mb-8">
                {/* Subtotal */}
                <div className="flex justify-between items-center py-2">
                  <span style={{ color: '#D4C5A0' }}>Subtotal ({cartState.itemCount})</span>
                  <span className="font-semibold" style={{ color: '#F5F0E8' }}>{formatCOP(calculos.subtotal)}</span>
                </div>

                {/* IVA */}
                <div className="flex justify-between items-center py-2">
                  <span style={{ color: '#D4C5A0' }}>IVA (19%)</span>
                  <span className="font-semibold" style={{ color: '#F5F0E8' }}>{formatCOP(calculos.iva)}</span>
                </div>

                {/* Envío */}
                <div className="flex justify-between items-center py-2">
                  <span style={{ color: '#D4C5A0' }}>Envío</span>
                  <div className="text-right">
                    {calculos.envioGratis ? (
                      <>
                        <span className="font-semibold" style={{ color: '#86efac' }}>GRATIS</span>
                        <p className="text-xs" style={{ color: '#8B6914' }}>¡Felicidades! 🎉</p>
                      </>
                    ) : (
                      <>
                        <span className="font-semibold" style={{ color: '#F5F0E8' }}>{formatCOP(calculos.costoEnvio)}</span>
                        <p className="text-xs" style={{ color: '#8B6914' }}>Envío gratis en +{formatCOP(calculos.ENVIO_GRATIS_MINIMO)}</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Barra de progreso envío gratis */}
                {!calculos.envioGratis && (
                  <div className="py-2">
                    <div className="flex justify-between text-xs mb-2" style={{ color: '#8B6914' }}>
                      <span>Progreso para envío gratis</span>
                      <span>{Math.round((calculos.subtotal / calculos.ENVIO_GRATIS_MINIMO) * 100)}%</span>
                    </div>
                    <div className="w-full rounded-full h-2" style={{ background: 'rgba(201,168,76,0.15)' }}>
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min((calculos.subtotal / calculos.ENVIO_GRATIS_MINIMO) * 100, 100)}%`,
                          background: 'linear-gradient(135deg, #C9A84C, #8B6914)'
                        }}
                      />
                    </div>
                    <p className="text-xs mt-2" style={{ color: '#8B6914' }}>
                      Te faltan {formatCOP(calculos.ENVIO_GRATIS_MINIMO - calculos.subtotal)} para envío gratis
                    </p>
                  </div>
                )}

                <div className="h-px" style={{ background: 'rgba(201,168,76,0.25)' }} />

                {/* Total */}
                <div className="flex justify-between items-center py-2">
                  <span className="text-xl font-bold" style={{ color: '#F5F0E8' }}>Total a Pagar</span>
                  <span className="text-2xl font-bold gold-text">{formatCOP(calculos.totalFinal)}</span>
                </div>
              </div>

              {/* Código de descuento */}
              <div className="mb-8">
                <label className="block text-sm font-medium mb-2" style={{ color: '#D4C5A0' }}>
                  Código de descuento
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ingresa tu código"
                    className="gold-input flex-1"
                  />
                  <button
                    className="gold-btn px-4 py-3 rounded-xl font-medium"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    Aplicar
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-4 p-3 rounded-xl text-sm"
                  style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', color: '#f87171' }}>
                  {error}
                </div>
              )}

              {/* Botones */}
              <div className="space-y-4">
                <button
                  onClick={procesarPago}
                  disabled={procesandoPago}
                  className="w-full gold-btn font-bold py-4 px-6 rounded-2xl flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed tracking-widest uppercase text-sm"
                >
                  {procesandoPago ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      <span>Pagar {formatCOP(calculos.totalFinal)}</span>
                    </>
                  )}
                </button>

                <Link
                  to="/products"
                  className="block w-full text-center font-semibold py-4 px-6 rounded-2xl transition-all duration-200 hover:scale-105"
                  style={{ border: '1px solid rgba(201,168,76,0.3)', color: '#C9A84C' }}
                >
                  🛍️ Seguir Comprando
                </Link>
              </div>

              {/* Garantías */}
              <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(201,168,76,0.15)' }}>
                <div className="space-y-3">
                  {[
                    { icon: '🔒', text: 'Pago 100% seguro' },
                    { icon: '💳', text: 'Mercado Pago protege tus datos' },
                    { icon: '🚚', text: `Envío ${calculos.envioGratis ? 'GRATIS' : formatCOP(calculos.costoEnvio)}` },
                    { icon: '↩️', text: 'Devoluciones fáciles' }
                  ].map(({ icon, text }) => (
                    <div key={text} className="flex items-center space-x-3">
                      <span className="text-lg">{icon}</span>
                      <span className="text-sm" style={{ color: '#D4C5A0' }}>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;