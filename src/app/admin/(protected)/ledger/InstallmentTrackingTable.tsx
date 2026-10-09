'use client'

import { useState, useMemo } from 'react'
import { Users, X, Search, CheckCircle2, Clock } from 'lucide-react'

export interface InstallmentProductItem {
  id: string;
  name: string;
  price: number;
  rateType: string;
  currencySymbol: string;
  enrolledAthletes: string[];
  athleteCount: number;
  totalFacturado: number;
  totalAbonado: number;
  saldoPendiente: number;
}

interface InstallmentTrackingTableProps {
  items: InstallmentProductItem[];
}

export default function InstallmentTrackingTable({ items }: InstallmentTrackingTableProps) {
  const [selectedProduct, setSelectedProduct] = useState<InstallmentProductItem | null>(null)
  const [athleteSearch, setAthleteSearch] = useState('')

  const filteredAthletes = useMemo(() => {
    if (!selectedProduct?.enrolledAthletes) return []
    if (!athleteSearch.trim()) return selectedProduct.enrolledAthletes
    const query = athleteSearch.toLowerCase()
    return selectedProduct.enrolledAthletes.filter(name => 
      name.toLowerCase().includes(query)
    )
  }, [selectedProduct, athleteSearch])

  return (
    <>
      <div className="flex flex-col">
        {/* VISTA MÓVIL: TARJETAS COMPACTAS Y EQUILIBRADAS */}
        <div className="md:hidden divide-y divide-slate-100 bg-slate-50/30 p-3 sm:p-4 space-y-3">
          {items.map(prod => {
            const pct = prod.totalFacturado > 0 ? Math.min(100, (prod.totalAbonado / prod.totalFacturado) * 100) : 0;
            return (
              <div key={prod.id} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-black text-gray-900 text-sm leading-snug">{prod.name}</h4>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 uppercase">
                        {prod.rateType}
                      </span>
                    </div>

                    {prod.enrolledAthletes && prod.enrolledAthletes.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProduct(prod)
                          setAthleteSearch('')
                        }}
                        className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-bold text-kasa-vinotinto hover:text-red-900 bg-red-50 hover:bg-red-100/70 border border-red-100 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Ver {prod.athleteCount} inscritas</span>
                      </button>
                    )}
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase shrink-0 ${
                    pct >= 100 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}>
                    {pct >= 100 ? '100% Cobrado' : `${pct.toFixed(0)}% Cobrado`}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center text-xs">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Facturado</span>
                    <span className="font-bold text-slate-700 font-mono">{prod.currencySymbol}{prod.totalFacturado.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-emerald-600 font-bold uppercase block">Abonado</span>
                    <span className="font-black text-emerald-700 font-mono">{prod.currencySymbol}{prod.totalAbonado.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-red-600 font-bold uppercase block">Pendiente</span>
                    <span className="font-black text-red-700 font-mono">{prod.currencySymbol}{prod.saldoPendiente.toFixed(2)}</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
                    <span>Avance de Cobranza</span>
                    <span className="text-gray-900 font-mono font-black">{pct.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-700 ${pct >= 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* VISTA DESKTOP: TABLA LIMPIA Y PROPORCIONADA */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/70">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Producto / Liga</th>
                <th className="px-4 py-3.5 text-center text-xs font-black text-slate-500 uppercase tracking-wider">Atletas</th>
                <th className="px-4 py-3.5 text-right text-xs font-black text-slate-500 uppercase tracking-wider">Facturado</th>
                <th className="px-4 py-3.5 text-right text-xs font-black text-emerald-700 uppercase tracking-wider">Abonado</th>
                <th className="px-4 py-3.5 text-right text-xs font-black text-red-700 uppercase tracking-wider">Pendiente</th>
                <th className="px-5 py-3.5 text-center text-xs font-black text-slate-500 uppercase tracking-wider w-44">Progreso</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {items.map(prod => {
                const pct = prod.totalFacturado > 0 ? Math.min(100, (prod.totalAbonado / prod.totalFacturado) * 100) : 0;
                return (
                  <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900 text-sm">{prod.name}</span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase">
                          {prod.rateType}
                        </span>
                      </div>
                      {prod.enrolledAthletes && prod.enrolledAthletes.length > 0 && (
                        <div className="mt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProduct(prod)
                              setAthleteSearch('')
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-kasa-vinotinto hover:text-red-950 hover:underline cursor-pointer transition-colors"
                          >
                            <Users className="w-3.5 h-3.5 shrink-0" />
                            <span>Ver listado de {prod.athleteCount} atletas</span>
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700">
                        {prod.athleteCount}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-xs font-mono font-bold text-slate-600">
                        {prod.currencySymbol}{prod.totalFacturado.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-xs font-mono font-black text-emerald-700">
                        {prod.currencySymbol}{prod.totalAbonado.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-xs font-mono font-black text-red-700">
                        {prod.currencySymbol}{prod.saldoPendiente.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-2 rounded-full transition-all duration-700 ${pct >= 100 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-700 w-9 text-right shrink-0">
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL LIGHTBOX DE ATLETAS INSCRITAS */}
      {selectedProduct && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedProduct(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            {/* Cabecera del Modal */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/70">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-black text-gray-900 truncate">
                    {selectedProduct.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-200 text-slate-700">
                    {selectedProduct.rateType}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedProduct.athleteCount} atletas registradas en este producto
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Barra de Búsqueda Rápida */}
            <div className="p-3 sm:p-4 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={athleteSearch}
                  onChange={e => setAthleteSearch(e.target.value)}
                  placeholder="Buscar atleta por nombre..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-gray-900 focus:bg-white focus:border-kasa-vinotinto outline-none transition-all"
                  autoFocus
                />
              </div>
            </div>

            {/* Lista de Atletas en Chips Limpios */}
            <div className="p-4 sm:p-5 overflow-y-auto max-h-[50vh]">
              {filteredAthletes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredAthletes.map((name, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center gap-2 p-2 rounded-xl bg-slate-50/80 hover:bg-slate-100 border border-slate-200/60 transition-colors"
                    >
                      <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-[10px] font-mono font-bold text-slate-500 flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {name}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-slate-400">
                  {athleteSearch ? 'No se encontraron atletas con ese nombre.' : 'No hay atletas registradas.'}
                </div>
              )}
            </div>

            {/* Pie del Modal */}
            <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/70 flex justify-between items-center text-xs text-slate-500">
              <span>Total listadas: <strong>{filteredAthletes.length}</strong></span>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
