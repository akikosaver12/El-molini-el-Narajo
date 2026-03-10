import React, { useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/shop/ProductCard';
import Loading from '../components/common/Loading';
import { Grid, List } from "lucide-react";

/* ─── Estilos dorados compartidos ─── */
const GOLD_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
  .gold-text { background:linear-gradient(135deg,#E8C97A,#C9A84C 50%,#8B6914); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
  .gold-btn { background:linear-gradient(135deg,#C9A84C,#8B6914); color:#0A0A08; font-weight:700; transition:all 0.3s; }
  .gold-btn:hover { transform:scale(1.04); box-shadow:0 12px 32px rgba(201,168,76,0.3); }
  .card-filter { background:linear-gradient(135deg,#1a1200,#0f0c00); border:1px solid rgba(201,168,76,0.2); border-radius:1.5rem; padding:1.5rem; }
  input.gold-input, select.gold-select {
    background:#0f0c00; border:1px solid rgba(201,168,76,0.25); color:#D4C5A0;
    border-radius:0.75rem; padding:0.875rem 1rem; outline:none; transition:border-color 0.2s;
    font-family:'Lato',sans-serif;
  }
  input.gold-input:focus, select.gold-select:focus { border-color:#C9A84C; }
  input.gold-input::placeholder { color:rgba(212,197,160,0.4); }
  select.gold-select option { background:#1a1200; color:#D4C5A0; }
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

const ProductsPage: React.FC = () => {
  const { products, loading, error } = useProducts();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const getCategoryLabel = (categoria: string) => {
    const categoryMap: Record<string, string> = {
      alimento: 'Alimento', juguetes: 'Juguetes', medicamentos: 'Medicamentos',
      accesorios: 'Accesorios', higiene: 'Higiene', otros: 'Otros'
    };
    return categoryMap[categoria] || categoria;
  };

  const normalizedProducts = products.map(p => ({
    id: p._id,
    name: p.nombre,
    description: p.descripcion,
    price: p.precio,
    category: p.categoria,
    image: p.imagenUrl || p.imagen || "/placeholder.png",
    originalProduct: p
  }));

  const filteredProducts = normalizedProducts
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low': return a.price - b.price;
        case 'price-high': return b.price - a.price;
        case 'name': return a.name.localeCompare(b.name);
        default: return 0;
      }
    });

  const uniqueCategories = Array.from(new Set(normalizedProducts.map(p => p.category)));

  /* Loading */
  if (loading) {
    return (
      <div style={{ backgroundColor: '#0A0A08', minHeight: '100vh' }}>
        <style>{GOLD_STYLES}</style>
        <Loading message="Cargando productos increíbles..." size="lg" />
      </div>
    );
  }

  /* Error */
  if (error) {
    return (
      <div className="text-center py-20" style={{ backgroundColor: '#0A0A08', minHeight: '100vh' }}>
        <style>{GOLD_STYLES}</style>
        <h1 className="text-2xl font-bold mb-4" style={{ color: '#F5F0E8' }}>❌ Error al cargar productos</h1>
        <p className="mb-6" style={{ color: '#D4C5A0' }}>{error}</p>
        <button onClick={() => window.location.reload()} className="gold-btn px-6 py-3 rounded-xl">Reintentar</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A0A08', fontFamily: "'Lato', sans-serif" }}>
      <style>{GOLD_STYLES}</style>

      {/* Hero encabezado */}
      <section
        className="relative py-14 overflow-hidden"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, #2a1a00 0%, #0A0A08 70%)' }}
      >
        <div className="absolute top-0 inset-x-0 h-px shimmer-line" />
        <div className="container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 border border-amber-700/50 rounded-full px-5 py-2 mb-5 bg-amber-950/30">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs tracking-[0.3em] uppercase" style={{ color: '#C9A84C' }}>Catálogo</span>
          </div>
          <h1
            className="font-black mb-4"
            style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2.5rem,6vw,4.5rem)', color: '#F5F0E8' }}
          >
            Nuestros <span className="gold-text">Productos</span>
          </h1>
          <GoldDivider />
        </div>
        <div className="absolute bottom-0 inset-x-0 h-16" style={{ background: 'linear-gradient(to top, #0A0A08, transparent)' }} />
      </section>

      <section className="py-10 px-6">
        <div className="container mx-auto">

          {/* ── Filtros ── */}
          <div className="card-filter mb-8 flex flex-col lg:flex-row gap-4 items-center">
            {/* Buscar */}
            <div className="relative flex-1 w-full">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg" style={{ color: '#8B6914' }}>🔍</span>
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="gold-input w-full"
                style={{ paddingLeft: '2.75rem' }}
              />
            </div>

            {/* Categoría */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="gold-select"
              style={{ minWidth: '150px' }}
            >
              <option value="all">Todas</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
              ))}
            </select>

            {/* Ordenar */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="gold-select"
              style={{ minWidth: '200px' }}
            >
              <option value="name">Ordenar por nombre</option>
              <option value="price-low">Precio: menor a mayor</option>
              <option value="price-high">Precio: mayor a menor</option>
            </select>

            {/* Vista */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className="p-2.5 rounded-xl transition-all duration-200"
                style={{
                  background: viewMode === 'grid' ? 'linear-gradient(135deg,#C9A84C,#8B6914)' : 'rgba(201,168,76,0.1)',
                  color: viewMode === 'grid' ? '#0A0A08' : '#C9A84C',
                  border: '1px solid rgba(201,168,76,0.3)'
                }}
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className="p-2.5 rounded-xl transition-all duration-200"
                style={{
                  background: viewMode === 'list' ? 'linear-gradient(135deg,#C9A84C,#8B6914)' : 'rgba(201,168,76,0.1)',
                  color: viewMode === 'list' ? '#0A0A08' : '#C9A84C',
                  border: '1px solid rgba(201,168,76,0.3)'
                }}
              >
                <List size={20} />
              </button>
            </div>
          </div>

          {/* Contador */}
          <div className="mb-8">
            <p className="text-sm" style={{ color: '#8B6914' }}>
              {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
              {selectedCategory !== 'all' && ` en ${getCategoryLabel(selectedCategory)}`}
              {searchTerm && ` para "${searchTerm}"`}
            </p>
          </div>

          {/* Productos */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}
              >
                <span className="text-5xl">🔍</span>
              </div>
              <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: '#F5F0E8' }}>
                No se encontraron productos
              </h3>
              <p className="mb-8 font-light" style={{ color: '#D4C5A0' }}>
                {searchTerm || selectedCategory !== 'all'
                  ? 'Prueba ajustando los filtros de búsqueda'
                  : 'No hay productos disponibles en este momento'}
              </p>
              <button
                onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
                className="gold-btn px-6 py-3 rounded-xl tracking-widest uppercase text-sm"
              >
                Ver todos los productos
              </button>
            </div>
          ) : (
            <div className={
              viewMode === 'grid'
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                : "space-y-6"
            }>
              {filteredProducts.map(normalizedProduct => {
                const originalProduct = products.find(p => p._id === normalizedProduct.id);
                if (!originalProduct) return null;
                return <ProductCard key={normalizedProduct.id} product={originalProduct} />;
              })}
            </div>
          )}

          {/* Footer info */}
          {filteredProducts.length > 0 && (
            <div className="mt-14 text-center">
              <p className="text-sm" style={{ color: '#8B6914' }}>
                Mostrando {filteredProducts.length} de {products.length} productos disponibles
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ProductsPage;