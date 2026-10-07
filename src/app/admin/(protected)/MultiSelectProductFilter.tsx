'use client'

import { useState, useRef, useEffect, useMemo } from 'react';
import { Tag, Check, ChevronDown, Search, X, Layers } from 'lucide-react';

export interface ProductFilterItem {
  id: string;
  name: string;
  price: number;
  categories?: string[] | null;
}

interface MultiSelectProductFilterProps {
  products: ProductFilterItem[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  currentCategoryFilter?: string;
}

export default function MultiSelectProductFilter({
  products,
  selectedIds,
  onChange,
  currentCategoryFilter = '',
}: MultiSelectProductFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer click afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrado de productos por categoría y por texto de búsqueda
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Si hay categoría seleccionada en el dashboard, priorizamos o filtramos los que coincidan
      const matchesCategory =
        !currentCategoryFilter ||
        !p.categories ||
        p.categories.length === 0 ||
        p.categories.includes('Global') ||
        p.categories.includes(currentCategoryFilter);

      const matchesSearch =
        !search.trim() ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.categories && p.categories.some((c) => c.toLowerCase().includes(search.toLowerCase())));

      return matchesCategory && matchesSearch;
    });
  }, [products, currentCategoryFilter, search]);

  const toggleProduct = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectAllVisible = () => {
    const visibleIds = filteredProducts.map((p) => p.id);
    const combined = Array.from(new Set([...selectedIds, ...visibleIds]));
    onChange(combined);
  };

  const clearSelection = () => {
    onChange([]);
  };

  const getButtonLabel = () => {
    if (selectedIds.length === 0) return 'Todos los productos';
    if (selectedIds.length === 1) {
      const found = products.find((p) => p.id === selectedIds[0]);
      return found ? found.name : '1 producto';
    }
    return `${selectedIds.length} productos`;
  };

  return (
    <div className="relative w-full lg:w-56" ref={containerRef}>
      {/* Botón Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 rounded-md border px-3 py-1.5 text-sm transition-all outline-none ${
          selectedIds.length > 0
            ? 'border-kasa-vinotinto bg-vinotinto-light/10 text-kasa-vinotinto font-bold shadow-2xs'
            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
        } focus:ring-2 focus:ring-kasa-vinotinto`}
      >
        <div className="flex items-center gap-1.5 truncate">
          <Tag className={`w-3.5 h-3.5 shrink-0 ${selectedIds.length > 0 ? 'text-kasa-vinotinto' : 'text-gray-400'}`} />
          <span className="truncate">{getButtonLabel()}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {selectedIds.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-kasa-vinotinto text-white text-[10px] font-black flex items-center justify-center">
              {selectedIds.length}
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Popover Flotante */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-72 sm:w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden flex flex-col p-2.5 animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header del Popover */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 px-1">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-kasa-vinotinto" />
              Filtrar por Producto
            </span>
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={clearSelection}
                className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" /> Limpiar
              </button>
            )}
          </div>

          {/* Micro-buscador interno */}
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto o jornada..."
              className="w-full pl-8 pr-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:bg-white focus:border-kasa-vinotinto transition-colors"
            />
          </div>

          {/* Acceso Rápido: Seleccionar visibles */}
          <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1 px-1">
            <span>{filteredProducts.length} productos disponibles</span>
            {filteredProducts.length > 1 && (
              <button
                type="button"
                onClick={selectAllVisible}
                className="text-kasa-vinotinto font-semibold hover:underline cursor-pointer"
              >
                Seleccionar todos
              </button>
            )}
          </div>

          {/* Lista Scrollable */}
          <div className="max-h-56 overflow-y-auto space-y-1 pr-0.5 my-1">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => {
                const isSelected = selectedIds.includes(product.id);
                const categoryLabel = product.categories && product.categories.length > 0 
                  ? product.categories.join(', ') 
                  : 'Global';

                return (
                  <div
                    key={product.id}
                    onClick={() => toggleProduct(product.id)}
                    className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors text-left ${
                      isSelected ? 'bg-vinotinto-light/10 text-kasa-vinotinto' : 'hover:bg-gray-50 text-gray-800'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-kasa-vinotinto border-kasa-vinotinto text-white'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold truncate leading-tight">
                          {product.name}
                        </span>
                        <span className="text-xs font-black text-emerald-700 shrink-0">
                          ${Number(product.price).toFixed(2)}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 block truncate mt-0.5">
                        {categoryLabel}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4 text-xs text-gray-400">
                No se encontraron productos.
              </div>
            )}
          </div>

          {/* Footer del Popover */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between mt-1 px-1">
            <span className="text-[10px] text-gray-400">
              {selectedIds.length > 0 ? `${selectedIds.length} marcado(s)` : 'Sin filtro de producto'}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 bg-kasa-vinotinto text-white text-xs font-bold rounded-md hover:bg-red-950 transition-colors cursor-pointer"
            >
              Listo
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
