'use client'

import { useState, useMemo } from 'react';
import { 
  ShoppingBag, Plus, Search, LayoutGrid, Table as TableIcon, 
  Calendar, DollarSign, Tag, Edit3, Trash2, Layers, 
  CheckCircle2, AlertCircle, Clock, ShieldCheck, X 
} from 'lucide-react';
import { toggleProductStatus, deleteProduct } from './actions';
import ProductDrawer, { ProductData, CategoryOption } from './ProductDrawer';

export default function ProductDashboard({
  initialProducts = [],
  categories = []
}: {
  initialProducts: ProductData[];
  categories: CategoryOption[];
}) {
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(null);

  // Helper de expiración
  const isProductExpired = (p: ProductData) => {
    if (!p.end_date) return false;
    const end = new Date(p.end_date);
    return end < new Date();
  };

  // Contadores
  const activeCount = useMemo(() => initialProducts.filter(p => p.is_active).length, [initialProducts]);
  const inactiveCount = useMemo(() => initialProducts.filter(p => !p.is_active).length, [initialProducts]);

  // Filtrado reactivo
  const filteredProducts = useMemo(() => {
    return initialProducts.filter(p => {
      // Búsqueda
      const matchSearch = !search.trim() || 
        p.name.toLowerCase().includes(search.toLowerCase()) || 
        (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
      
      // Estado
      const matchStatus = 
        selectedStatus === 'all' || 
        (selectedStatus === 'active' && p.is_active) || 
        (selectedStatus === 'inactive' && !p.is_active);

      // Categoría
      const matchCategory = 
        selectedCategory === 'all' || 
        (!p.categories || p.categories.length === 0 || p.categories.includes('Global') || p.categories.includes(selectedCategory));

      return matchSearch && matchStatus && matchCategory;
    });
  }, [initialProducts, search, selectedStatus, selectedCategory]);

  const handleOpenCreate = () => {
    setSelectedProduct(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (product: ProductData) => {
    setSelectedProduct(product);
    setIsDrawerOpen(true);
  };

  const handleToggleStatus = async (product: ProductData) => {
    await toggleProductStatus(product.id, product.is_active);
  };

  const handleDelete = async (product: ProductData) => {
    if (confirm(`¿Estás seguro de eliminar el producto "${product.name}"? Si ya posee pagos asociados quedará registrado en el historial contable.`)) {
      await deleteProduct(product.id);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. SECCIÓN DE CABECERA Y ACCIÓN PRINCIPAL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_4px_-1px_rgba(0,0,0,0.03)]">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-red-50 text-kasa-vinotinto text-xs font-black uppercase tracking-wider border border-red-200/80 shadow-2xs">
              Catálogo & Facturación
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-black uppercase tracking-wider border border-slate-200 shadow-2xs">
              {initialProducts.length} Registrados • {activeCount} Activos
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Catálogo de Tienda
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Administra los servicios, mensualidades y artículos disponibles para cobro.
          </p>
        </div>

        {/* Botón CTA Primario (Abre el Drawer) */}
        <button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-kasa-vinotinto to-red-900 hover:from-red-900 hover:to-kasa-vinotinto text-white text-xs sm:text-sm font-black px-6 py-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Producto / Servicio</span>
        </button>
      </div>

      {/* 2. BARRA DE HERRAMIENTAS (Búsqueda, Filtros y Conmutador de Vistas) */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_4px_-1px_rgba(0,0,0,0.03)] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        
        {/* Buscador */}
        <div className="relative flex-1 min-w-[240px]">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o descripción..."
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white rounded-2xl border border-slate-200 text-xs font-bold text-gray-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-kasa-vinotinto/20 focus:border-kasa-vinotinto transition-all shadow-2xs"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filtros de Estado */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200/80 shadow-2xs">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                selectedStatus === 'all'
                  ? 'bg-white text-gray-900 shadow-2xs'
                  : 'text-slate-500 hover:text-gray-900'
              }`}
            >
              Todos ({initialProducts.length})
            </button>
            <button
              onClick={() => setSelectedStatus('active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                selectedStatus === 'active'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-emerald-700'
              }`}
            >
              Activos ({activeCount})
            </button>
            <button
              onClick={() => setSelectedStatus('inactive')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                selectedStatus === 'inactive'
                  ? 'bg-slate-800 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Inactivos ({inactiveCount})
            </button>
          </div>

          {/* Filtro de Categoría */}
          {categories.length > 0 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-kasa-vinotinto/20 focus:border-kasa-vinotinto transition-all shadow-2xs"
            >
              <option value="all">Todas las Categorías</option>
              {categories.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          {/* Conmutador Tarjetas / Tabla */}
          <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200/80 shadow-2xs ml-auto lg:ml-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-kasa-vinotinto shadow-2xs'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Vista de Tarjetas"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-xl transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-kasa-vinotinto shadow-2xs'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Vista de Tabla"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

      {/* 3. CONTENIDO PRINCIPAL: TARJETAS O TABLA */}
      {filteredProducts.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_4px_-1px_rgba(0,0,0,0.03)]">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4 border border-slate-200">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-gray-900">
            No se encontraron productos
          </h3>
          <p className="text-xs text-slate-500 font-medium max-w-md mx-auto mt-1">
            {search || selectedStatus !== 'all' || selectedCategory !== 'all'
              ? 'Intenta ajustar los filtros de búsqueda o categoría para encontrar lo que necesitas.'
              : 'Aún no hay productos ni servicios registrados. Haz clic en "Nuevo Producto" para comenzar.'}
          </p>
          {(search || selectedStatus !== 'all' || selectedCategory !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedStatus('all');
                setSelectedCategory('all');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* VISTA DE TARJETAS (Grid First-Mobile) */
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-5">
          {filteredProducts.map((p) => {
            const expired = isProductExpired(p);
            const ribbonBorder = p.is_active 
              ? 'border-l-[6px] border-l-emerald-500' 
              : 'border-l-[6px] border-l-slate-300';

            return (
              <div
                key={p.id}
                className={`bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 ${ribbonBorder} shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_4px_-1px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between relative group`}
              >
                {/* Cabecera de la Tarjeta */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border shadow-2xs ${
                        p.is_active 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80' 
                          : 'bg-slate-100 text-slate-400 border-slate-200'
                      }`}>
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-black text-gray-900 text-base leading-snug truncate group-hover:text-kasa-vinotinto transition-colors">
                          {p.name}
                        </h3>
                        {/* Indicador de Vigencia */}
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border shadow-2xs ${
                            expired 
                              ? 'bg-rose-50 text-rose-700 border-rose-200' 
                              : p.is_active 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              expired ? 'bg-rose-500' : p.is_active ? 'bg-emerald-500' : 'bg-slate-400'
                            }`} />
                            {expired ? 'Vencido' : p.is_active ? 'Vigente' : 'Inactivo'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Precio de Alto Contraste */}
                    <div className="text-right shrink-0">
                      <span className="inline-block px-3 py-1.5 bg-slate-900 text-white font-mono font-black text-base sm:text-lg rounded-2xl shadow-xs border border-slate-800">
                        ${Number(p.price).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Descripción */}
                  <p className="text-xs text-slate-500 font-medium line-clamp-2 min-h-[32px] mb-3 leading-relaxed">
                    {p.description || 'Sin descripción detallada.'}
                  </p>

                  {/* Fechas de Cobro */}
                  {p.start_date && p.end_date && (
                    <div className="flex items-center gap-2 bg-slate-50/80 px-3 py-2 rounded-xl border border-slate-200/80 text-xs text-slate-600 font-bold mb-3 shadow-2xs">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono text-[11px]">
                        {new Date(p.start_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} — {new Date(p.end_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  )}

                  {/* Badges de Categorías y Condiciones */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-4">
                    {(!p.categories || p.categories.length === 0 || p.categories.includes('Global')) ? (
                      <span className="px-2.5 py-1 bg-red-50 text-kasa-vinotinto text-[10px] font-black uppercase tracking-wider rounded-lg border border-red-100 shadow-2xs flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        Global (Todas)
                      </span>
                    ) : (
                      p.categories.map((c) => (
                        <span 
                          key={c}
                          className="px-2.5 py-1 bg-sky-50 text-sky-800 text-[10px] font-black uppercase tracking-wider rounded-lg border border-sky-200/80 shadow-2xs flex items-center gap-1"
                        >
                          <Tag className="w-3 h-3 text-sky-600" />
                          {c}
                        </span>
                      ))
                    )}

                    {p.allows_installments && (
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-800 text-[10px] font-black uppercase tracking-wider rounded-lg border border-amber-200 shadow-2xs">
                        Permite Abonos
                      </span>
                    )}

                    {p.requires_opt_in && (
                      <span className="px-2.5 py-1 bg-amber-100/90 text-amber-950 text-[10px] font-black uppercase tracking-wider rounded-lg border border-amber-300 shadow-2xs">
                        Torneo (Opt-in)
                      </span>
                    )}
                  </div>
                </div>

                {/* Pie de Tarjeta: Switch de Estado y Botones de Acción */}
                <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  
                  {/* Toggle Rápido de Estado */}
                  <button
                    onClick={() => handleToggleStatus(p)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all border shadow-2xs ${
                      p.is_active
                        ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                    }`}
                    title="Clic para cambiar estado activo/inactivo"
                  >
                    <span className={`w-2 h-2 rounded-full ${
                      p.is_active ? 'bg-emerald-500' : 'bg-slate-400'
                    }`} />
                    <span>{p.is_active ? 'Activo' : 'Inactivo'}</span>
                  </button>

                  {/* Acciones */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="p-2 text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-xl border border-slate-200 hover:border-blue-200 transition-all shadow-2xs"
                      title="Editar producto"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      className="p-2 text-slate-600 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-xl border border-slate-200 hover:border-rose-200 transition-all shadow-2xs"
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* VISTA DE TABLA (Linear / Stripe style) */
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_4px_-1px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200">
                  <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-wider">
                    Producto & Vigencia
                  </th>
                  <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-wider">
                    Aplica a & Condiciones
                  </th>
                  <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-wider text-center">
                    Estado
                  </th>
                  <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-wider text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredProducts.map((p) => {
                  const expired = isProductExpired(p);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Producto */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-2xs ${
                            p.is_active 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-slate-100 text-slate-400 border-slate-200'
                          }`}>
                            <ShoppingBag className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-black text-gray-900 text-sm flex items-center gap-2">
                              <span>{p.name}</span>
                              {expired && (
                                <span className="bg-rose-50 text-rose-700 text-[10px] font-black uppercase px-2 py-0.5 rounded-md border border-rose-200">
                                  Vencido
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 font-medium truncate max-w-xs mt-0.5">
                              {p.description || 'Sin descripción'}
                            </div>
                            {p.start_date && p.end_date && (
                              <div className="text-[11px] font-mono text-slate-400 mt-1 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                <span>
                                  {new Date(p.start_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} — {new Date(p.end_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Precio */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="font-mono font-black text-base text-gray-900 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs inline-block">
                          ${Number(p.price).toFixed(2)}
                        </span>
                      </td>

                      {/* Aplica a & Condiciones */}
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {(!p.categories || p.categories.length === 0 || p.categories.includes('Global')) ? (
                            <span className="px-2.5 py-0.5 bg-red-50 text-kasa-vinotinto text-[10px] font-black uppercase tracking-wider rounded-lg border border-red-100">
                              Global
                            </span>
                          ) : (
                            p.categories.map((c) => (
                              <span 
                                key={c}
                                className="px-2.5 py-0.5 bg-sky-50 text-sky-800 text-[10px] font-black uppercase tracking-wider rounded-lg border border-sky-200"
                              >
                                {c}
                              </span>
                            ))
                          )}

                          {p.allows_installments && (
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-black uppercase tracking-wider rounded-lg border border-amber-200">
                              Abonos
                            </span>
                          )}

                          {p.requires_opt_in && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-950 text-[10px] font-black uppercase tracking-wider rounded-lg border border-amber-300">
                              Opt-in
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(p)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all border shadow-2xs ${
                            p.is_active
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${
                            p.is_active ? 'bg-emerald-500' : 'bg-slate-400'
                          }`} />
                          <span>{p.is_active ? 'Activo' : 'Inactivo'}</span>
                        </button>
                      </td>

                      {/* Acciones */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-2 text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-xl border border-slate-200 hover:border-blue-200 transition-all shadow-2xs"
                            title="Editar producto"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            className="p-2 text-slate-600 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-xl border border-slate-200 hover:border-rose-200 transition-all shadow-2xs"
                            title="Eliminar producto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. MODAL DRAWER (Creación y Edición) */}
      <ProductDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        categories={categories}
      />

    </div>
  );
}

