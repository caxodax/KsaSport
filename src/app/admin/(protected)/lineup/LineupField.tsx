'use client'

import { useState } from 'react';
import { User, X, Plus, Minus, Activity, ShieldAlert } from 'lucide-react';
import { assignPosition, unassignPosition, addDefensiveStat } from './actions';

interface Athlete {
  id: string;
  name: string;
  position: string | null;
  stats_avg: number | null;
  phone: string | null;
}

const POSITIONS = [
  { id: 'C', label: 'Catcher', top: '92%', left: '50%' },
  { id: 'P', label: 'Pitcher', top: '66%', left: '50%' },
  { id: '1B', label: 'Primera Base', top: '65%', left: '78%' },
  { id: '2B', label: 'Segunda Base', top: '48%', left: '55%' },
  { id: 'SS', label: 'Shortstop', top: '55%', left: '35%' },
  { id: '3B', label: 'Tercera Base', top: '65%', left: '22%' },
  { id: 'SF', label: 'Short Field', top: '78%', left: '33%' },
  { id: 'LF', label: 'Left Field', top: '25%', left: '15%' },
  { id: 'LCF', label: 'Left Center', top: '32%', left: '40%' },
  { id: 'CF', label: 'Center Field', top: '5%', left: '50%' },
  { id: '2F', label: 'Second Field', top: '55%', left: '65%' },
  { id: 'RCF', label: 'Right Center', top: '32%', left: '60%' },
  { id: 'RF', label: 'Right Field', top: '25%', left: '85%' },
];

export default function LineupField({ athletes }: { athletes: Athlete[] }) {
  const [selectedPos, setSelectedPos] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const getAthletesForPos = (posId: string) => athletes.filter(a => a.position === posId);
  const availableAthletes = athletes.filter(a => !a.position);

  const selectedPosData = POSITIONS.find(p => p.id === selectedPos);
  const activeAthletes = selectedPos ? getAthletesForPos(selectedPos) : [];

  const handleAssign = async (athleteId: string, posId: string) => {
    setLoadingId(athleteId);
    await assignPosition(athleteId, posId);
    setLoadingId(null);
  };

  const handleUnassign = async (athleteId: string) => {
    setLoadingId(athleteId);
    await unassignPosition(athleteId);
    setLoadingId(null);
  };

  const handleDefensiveOut = async (athleteId: string) => {
    // Para UX rápida podríamos hacer optimistic update, pero mantengamos simple.
    await addDefensiveStat(athleteId);
    alert('Out Defensivo registrado exitosamente.');
  };

  return (
    <div className="flex flex-col md:flex-row h-full w-full bg-[#3b8c2a] relative overflow-hidden">
      
      {/* 1. Baseball Field Area */}
      <div className="relative flex-1 min-h-[500px] md:min-h-full w-full overflow-hidden flex items-center justify-center p-4">
        
        {/* Aspect Ratio Container for Field */}
        <div className="relative w-full max-w-2xl aspect-square">
          
          {/* SVG Field Graphics */}
          <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0 drop-shadow-2xl">
            <defs>
              <pattern id="grass" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="10" height="10" fill="#4ab041"/>
                <rect width="5" height="10" fill="#5ebd52"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grass)" rx="4" />
            <path d="M 10 90 A 55 55 0 0 1 90 90 Z" fill="#d6a86c" />
            <polygon points="50,45 75,70 50,95 25,70" fill="url(#grass)" />
            {/* Foul Lines */}
            <line x1="50" y1="95" x2="0" y2="45" stroke="white" strokeWidth="0.5" opacity="0.8" />
            <line x1="50" y1="95" x2="100" y2="45" stroke="white" strokeWidth="0.5" opacity="0.8" />
            
            {/* Infield Base Paths (1B -> 2B -> 3B) */}
            <polyline points="75,70 50,45 25,70" stroke="white" strokeWidth="0.5" fill="none" opacity="0.8" />
            <polygon points="50,97 52,95 50,93 48,95" fill="white" /> {/* Home */}
            <polygon points="75,72 77,70 75,68 73,70" fill="white" /> {/* 1B */}
            <polygon points="50,47 52,45 50,43 48,45" fill="white" /> {/* 2B */}
            <polygon points="25,72 27,70 25,68 23,70" fill="white" /> {/* 3B */}
            <circle cx="50" cy="70" r="4" fill="#d6a86c" />
            <rect x="49" y="69.5" width="2" height="1" fill="white" />
            <circle cx="50" cy="95" r="4" fill="#d6a86c" />
            <polygon points="50,96 51.5,94.5 51.5,93 48.5,93 48.5,94.5" fill="white" />
          </svg>

          {/* Interactive Position Badges */}
          {POSITIONS.map((pos) => {
            const count = getAthletesForPos(pos.id).length;
            const isActive = selectedPos === pos.id;
            
            return (
              <button
                key={pos.id}
                onClick={() => setSelectedPos(pos.id)}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center transition-all duration-300 z-10 group
                  ${isActive ? 'scale-110 z-20' : 'hover:scale-105'}`}
                style={{ top: pos.top, left: pos.left }}
              >
                {/* Badge Label */}
                <div className={`px-2 md:px-3 py-1 rounded-full border-2 text-xs md:text-sm font-bold shadow-lg flex items-center gap-1.5 transition-colors
                  ${isActive 
                    ? 'bg-kasa-dorado border-white text-kasa-vinotinto' 
                    : count > 0 
                      ? 'bg-kasa-vinotinto border-white text-white' 
                      : 'bg-white/80 border-white/50 text-gray-700 backdrop-blur-sm'
                  }`}
                >
                  {pos.id}
                  {count > 0 && (
                    <span className={`flex items-center justify-center w-4 h-4 rounded-full text-[10px] 
                      ${isActive ? 'bg-white text-kasa-vinotinto' : 'bg-white text-kasa-vinotinto'}`}>
                      {count}
                    </span>
                  )}
                </div>
                
                {/* Small tooltip text */}
                <span className="mt-1 text-[10px] font-bold text-white bg-black/40 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden md:block">
                  {pos.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 2. Right Sidebar Panel (Player List) */}
      <div className={`
        absolute md:relative right-0 top-0 h-full bg-white shadow-[-10px_0_20px_rgba(0,0,0,0.1)] transition-transform duration-300 z-30
        w-full md:w-96 flex flex-col
        ${selectedPos ? 'translate-x-0' : 'translate-x-full md:translate-x-0 md:opacity-0 md:pointer-events-none'}
      `}>
        {selectedPos ? (
          <>
            <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedPosData?.label}</h2>
                <p className="text-sm text-gray-500">Gestión de la posición</p>
              </div>
              <button 
                onClick={() => setSelectedPos(null)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors md:hidden"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
              
              {/* ASIGNADAS */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">En el campo ({activeAthletes.length})</h3>
                <div className="space-y-3">
                  {activeAthletes.length > 0 ? (
                    activeAthletes.map(athlete => (
                      <div key={athlete.id} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-kasa-vinotinto rounded-full flex items-center justify-center text-white shrink-0">
                            <User className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 truncate">{athlete.name}</h4>
                            {athlete.stats_avg != null && (
                              <div className="flex items-center gap-1 text-xs font-bold text-blue-600">
                                AVG: {Number(athlete.stats_avg).toFixed(3)}
                              </div>
                            )}
                          </div>
                          <button
                            disabled={loadingId === athlete.id}
                            onClick={() => handleUnassign(athlete.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Quitar del campo"
                          >
                            <Minus className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="flex justify-between items-center border-t pt-2">
                          <span className="text-[10px] text-gray-500 font-medium">ESTADÍSTICAS</span>
                          <button
                            onClick={() => handleDefensiveOut(athlete.id)}
                            className="flex items-center gap-1 text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 px-2 py-1 rounded"
                          >
                            <ShieldAlert className="w-3 h-3" />
                            +1 Out Defensivo
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
                      <p className="text-gray-500 text-sm">Nadie asignado a {selectedPos}.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* DISPONIBLES */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">En la Banca ({availableAthletes.length})</h3>
                <div className="space-y-3">
                  {availableAthletes.length > 0 ? (
                    availableAthletes.map(athlete => (
                      <div key={athlete.id} className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-700 truncate">{athlete.name}</h4>
                        </div>
                        <button
                          disabled={loadingId === athlete.id}
                          onClick={() => handleAssign(athlete.id, selectedPos)}
                          className="flex items-center gap-1 bg-kasa-vinotinto hover:bg-red-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                        >
                          <Plus className="w-4 h-4" />
                          Asignar
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-400 text-sm">No hay jugadoras disponibles.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </>
        ) : (
          <div className="hidden md:flex flex-col items-center justify-center h-full p-8 text-center text-gray-400">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-gray-300" />
            </div>
            <p>Selecciona una posición en el campo para gestionar las asignaciones.</p>
          </div>
        )}
      </div>

    </div>
  )
}
