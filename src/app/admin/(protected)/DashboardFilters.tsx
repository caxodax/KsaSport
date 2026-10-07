'use client'

import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import MultiSelectProductFilter, { ProductFilterItem } from './MultiSelectProductFilter';

export default function DashboardFilters({ 
  teams, 
  categories,
  products = [],
  basePath = '/admin',
  hideStatus = false,
  showRole = false
}: { 
  teams: { id: string, name: string }[], 
  categories: { name: string }[],
  products?: ProductFilterItem[],
  basePath?: string,
  hideStatus?: boolean,
  showRole?: boolean
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [query, setQuery] = useState(searchParams.get('query') || '');
  const [team, setTeam] = useState(searchParams.get('team') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [role, setRole] = useState(searchParams.get('role') || '');
  
  // Productos y estado de pago de producto
  const initialProducts = searchParams.get('products') ? (searchParams.get('products') || '').split(',').filter(Boolean) : [];
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(initialProducts);
  const [paymentStatus, setPaymentStatus] = useState(searchParams.get('payment_status') || '');

  // Sincronizar si cambia externamente
  useEffect(() => {
    const rawProducts = searchParams.get('products');
    setSelectedProductIds(rawProducts ? rawProducts.split(',').filter(Boolean) : []);
    setPaymentStatus(searchParams.get('payment_status') || '');
    setQuery(searchParams.get('query') || '');
    setTeam(searchParams.get('team') || '');
    setCategory(searchParams.get('category') || '');
    setStatus(searchParams.get('status') || '');
    setRole(searchParams.get('role') || '');
  }, [searchParams]);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    
    if (query) params.set('query', query); else params.delete('query');
    if (team) params.set('team', team); else params.delete('team');
    if (category) params.set('category', category); else params.delete('category');
    if (status && !hideStatus) params.set('status', status); else params.delete('status');
    if (role && showRole) params.set('role', role); else params.delete('role');

    // Filtros de productos
    if (selectedProductIds.length > 0) {
      params.set('products', selectedProductIds.join(','));
    } else {
      params.delete('products');
    }

    if (paymentStatus && selectedProductIds.length > 0) {
      params.set('payment_status', paymentStatus);
    } else {
      params.delete('payment_status');
    }

    params.set('page', '1'); // Resetear a página 1
    
    router.push(`${basePath}?${params.toString()}`);
  };

  const clearFilters = () => {
    setQuery(''); 
    setTeam(''); 
    setCategory(''); 
    setStatus(''); 
    setRole('');
    setSelectedProductIds([]);
    setPaymentStatus('');

    const params = new URLSearchParams();
    const fromVal = searchParams.get('from');
    const toVal = searchParams.get('to');
    if (fromVal) params.set('from', fromVal);
    if (toVal) params.set('to', toVal);
    router.push(params.toString() ? `${basePath}?${params.toString()}` : basePath);
  };

  const hasActiveFilters = 
    query || 
    team || 
    category || 
    (status && !hideStatus) || 
    (role && showRole) || 
    selectedProductIds.length > 0 || 
    paymentStatus;

  return (
    <form onSubmit={handleFilter} className="bg-white p-3 rounded-xl shadow-xs border border-gray-100 mb-6 flex flex-col lg:flex-row flex-wrap gap-2.5 items-center">
      
      {/* Búsqueda por Nombre o Cédula */}
      <div className="flex-1 min-w-[200px] w-full relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-9 rounded-md border border-gray-300 px-3 py-1.5 bg-white text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto transition-colors"
          placeholder="Buscar atleta por nombre o cédula..."
        />
      </div>

      {/* Selector de Categoría */}
      <div className="w-full sm:w-auto sm:min-w-[160px]">
        <select 
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-1.5 bg-white text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto transition-colors"
        >
          <option value="">Todas las categorías</option>
          {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
        </select>
      </div>

      {/* Selector de Equipo */}
      <div className="w-full sm:w-auto sm:min-w-[160px]">
        <select 
          value={team}
          onChange={(e) => setTeam(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-1.5 bg-white text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto transition-colors"
        >
          <option value="">Todos los equipos</option>
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {/* Selector Múltiple de Producto (si hay productos disponibles) */}
      {products.length > 0 && (
        <MultiSelectProductFilter
          products={products}
          selectedIds={selectedProductIds}
          onChange={setSelectedProductIds}
          currentCategoryFilter={category}
        />
      )}

      {/* Selector Contextual de Estado de Cobro de Producto */}
      {selectedProductIds.length > 0 ? (
        <div className="w-full sm:w-auto sm:min-w-[180px]">
          <select 
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="w-full rounded-md border-2 border-amber-500 bg-amber-50/50 text-amber-950 font-bold px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
          >
            <option value="">Estado: Todos</option>
            <option value="paid">✅ Pagaron Producto</option>
            <option value="unpaid">❌ Faltan por Pagar</option>
            <option value="pending">⏳ En Revisión</option>
          </select>
        </div>
      ) : (
        /* Selector Tradicional de Estatus General */
        !hideStatus && (
          <div className="w-full sm:w-auto sm:min-w-[140px]">
            <select 
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 bg-white text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto transition-colors"
            >
              <option value="">Estatus General</option>
              <option value="Solvente">Solvente</option>
              <option value="Moroso">Moroso</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>
        )
      )}

      {showRole && (
        <div className="w-full sm:w-auto sm:min-w-[140px]">
          <select 
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 bg-white text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto transition-colors"
          >
            <option value="">Todos (Rol)</option>
            <option value="Mánager">Mánager</option>
            <option value="Entrenador">Entrenador</option>
            <option value="Asistente Técnico">Asistente Técnico</option>
            <option value="Preparador Físico">Preparador Físico</option>
            <option value="Delegado">Delegado</option>
            <option value="Kinesiólogo">Kinesiólogo</option>
          </select>
        </div>
      )}

      {/* Botones de Acción */}
      <div className="flex gap-2 w-full sm:w-auto shrink-0 ml-auto">
        <button 
          type="submit" 
          className="bg-kasa-vinotinto hover:bg-red-950 text-white font-bold py-1.5 px-4 rounded-md transition-all text-sm w-full sm:w-auto flex items-center justify-center gap-1.5 shadow-xs active:scale-95 cursor-pointer"
        >
          <Filter className="w-4 h-4" /> 
          <span>Filtrar</span>
        </button>

        {hasActiveFilters && (
          <button 
            type="button" 
            onClick={clearFilters} 
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium text-gray-600 transition-colors flex items-center justify-center gap-1 cursor-pointer active:scale-95" 
            title="Limpiar todos los filtros"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

    </form>
  );
}
