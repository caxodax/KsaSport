'use client'

import { useState } from 'react';
import { User, Target, ShieldX, Check } from 'lucide-react';
import { addOffensiveStat, updateBattingOrder } from './actions';

interface Athlete {
  id: string;
  name: string;
  stats_avg: number | null;
  batting_order: number | null;
}

export default function BattingOrderView({ athletes }: { athletes: Athlete[] }) {
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  
  // Sort by batting order (nulls go to the end)
  const sortedAthletes = [...athletes].sort((a, b) => {
    if (a.batting_order === null && b.batting_order === null) return a.name.localeCompare(b.name);
    if (a.batting_order === null) return 1;
    if (b.batting_order === null) return -1;
    return a.batting_order - b.batting_order;
  });

  const handleStat = async (athleteId: string, type: 'hit' | 'out') => {
    setLoadingIds(prev => new Set(prev).add(athleteId));
    await addOffensiveStat(athleteId, type);
    // Remove from loading state
    setLoadingIds(prev => {
      const next = new Set(prev);
      next.delete(athleteId);
      return next;
    });
    alert(type === 'hit' ? '¡Hit registrado exitosamente!' : 'Out Ofensivo registrado exitosamente.');
  };

  const handleOrderChange = async (athleteId: string, order: number | null) => {
    setLoadingIds(prev => new Set(prev).add(athleteId));
    await updateBattingOrder(athleteId, order);
    setLoadingIds(prev => {
      const next = new Set(prev);
      next.delete(athleteId);
      return next;
    });
  };

  return (
    <div className="w-full h-full p-4 md:p-8 bg-gray-50 flex flex-col overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full">
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-100 bg-white sticky top-0 z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Orden al Bate (Lineup Ofensivo)</h2>
              <p className="text-sm text-gray-500">Asigna el orden del 1 al 13 y registra hits/outs en vivo.</p>
            </div>
            <div className="text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-medium">
              Total en Roster: {athletes.length}
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {sortedAthletes.length > 0 ? (
              sortedAthletes.map((athlete, index) => {
                const isLoading = loadingIds.has(athlete.id);
                return (
                  <div key={athlete.id} className="p-4 flex flex-col md:flex-row md:items-center gap-4 hover:bg-gray-50 transition-colors">
                    
                    {/* Order Selection */}
                    <div className="flex items-center gap-3 w-32 shrink-0">
                      <select
                        value={athlete.batting_order || ''}
                        onChange={(e) => handleOrderChange(athlete.id, e.target.value ? Number(e.target.value) : null)}
                        disabled={isLoading}
                        className="bg-gray-100 border-none rounded-lg px-2 py-1.5 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-kasa-vinotinto outline-none w-16"
                      >
                        <option value="">-</option>
                        {[...Array(20)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>{i + 1}</option>
                        ))}
                      </select>
                      <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Turno</span>
                    </div>

                    {/* Athlete Info */}
                    <div className="flex-1 flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-kasa-vinotinto rounded-full flex items-center justify-center text-white shrink-0 shadow-sm">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-gray-900 truncate">{athlete.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          {athlete.stats_avg != null ? (
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                              AVG: {Number(athlete.stats_avg).toFixed(3)}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">Sin AVG</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 mt-2 md:mt-0 justify-end">
                      <button
                        onClick={() => handleStat(athlete.id, 'hit')}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                      >
                        <Target className="w-4 h-4" />
                        +1 Hit
                      </button>
                      <button
                        onClick={() => handleStat(athlete.id, 'out')}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                      >
                        <ShieldX className="w-4 h-4" />
                        +1 Out (Ofensivo)
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">No hay jugadoras</h3>
                <p className="text-gray-500 mt-1">Tu equipo no tiene jugadoras registradas en el roster oficial.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
