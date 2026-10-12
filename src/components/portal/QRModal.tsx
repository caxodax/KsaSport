'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { QrCode, X, ShieldCheck, Trophy, Sparkles } from 'lucide-react';
import QRCodeDisplay from './QRCodeDisplay';
import HolographicPlayerCard from './HolographicPlayerCard';

export interface QRModalProps {
  athleteId: string;
  status: string;
  teamName?: string | null;
  teamLogoUrl?: string | null;
  athleteName?: string | null;
  triggerClassName?: string;
  triggerLabel?: string;
  athlete?: {
    id: string;
    name: string;
    cedula: string | number;
    status: string;
    avatar_url?: string | null;
    position?: string | null;
    stats_avg?: number | string | null;
    stats_hits?: number | string | null;
    stats_rbi?: number | string | null;
    stats_runs?: number | string | null;
    paid_until?: string | null;
  } | null;
  team?: {
    name?: string | null;
    logo_url?: string | null;
    category?: string | null;
  } | null;
  initialTab?: 'cromo' | 'qr';
}

export default function QRModal({ 
  athleteId, 
  status,
  teamName,
  teamLogoUrl,
  athleteName,
  triggerClassName,
  triggerLabel,
  athlete,
  team,
  initialTab = 'cromo'
}: QRModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'cromo' | 'qr'>(initialTab);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Construir objeto de atleta para el Cromo si solo se pasaron props básicas
  const resolvedAthlete = athlete || {
    id: athleteId,
    name: athleteName || 'Atleta Oficial',
    cedula: 'N/A',
    status: status,
    avatar_url: null,
    position: null,
    stats_avg: null,
    stats_hits: null,
    stats_rbi: null,
    stats_runs: null,
  };

  const resolvedTeam = team || {
    name: teamName,
    logo_url: teamLogoUrl,
    category: null,
  };

  return (
    <>
      <button 
        type="button"
        onClick={() => {
          setActiveTab(initialTab);
          setIsOpen(true);
        }}
        className={triggerClassName || "flex items-center justify-center gap-2 w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-xl transition-colors border border-gray-200 cursor-pointer"}
      >
        <Sparkles className="w-4 h-4 text-kasa-dorado" />
        <span>{triggerLabel || "Ver Ficha & Carnet QR"}</span>
      </button>

      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-slate-950 text-white rounded-[2.5rem] p-5 sm:p-6 w-full max-w-md relative shadow-2xl border border-white/15 animate-in zoom-in-95 duration-200 overflow-hidden my-auto max-h-[96vh] flex flex-col">
            
            {/* Acento superior de color */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-kasa-vinotinto via-kasa-dorado to-kasa-vinotinto" />

            {/* Botón Cerrar */}
            <button 
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 z-20 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors active:scale-95 cursor-pointer border border-white/10"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* Selector de Pestañas: Cromo 3D vs QR Oficial */}
            <div className="flex items-center justify-center gap-1.5 bg-white/5 p-1 rounded-2xl border border-white/10 mb-4 max-w-[270px] mx-auto shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('cromo')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'cromo'
                    ? 'bg-kasa-dorado text-kasa-vinotinto shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Cromo 3D Pro</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('qr')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'qr'
                    ? 'bg-white text-gray-900 shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Código QR</span>
              </button>
            </div>

            {/* Contenido según pestaña */}
            <div className="overflow-y-auto flex-1 flex flex-col items-center">
              {activeTab === 'cromo' ? (
                <div className="w-full flex justify-center py-1">
                  <HolographicPlayerCard
                    athlete={resolvedAthlete}
                    team={resolvedTeam}
                    showShareActions={true}
                  />
                </div>
              ) : (
                <div className="w-full bg-white text-gray-900 rounded-[2rem] p-6 text-center shadow-lg border border-gray-100 flex flex-col items-center my-auto">
                  {/* Escudo del equipo */}
                  {teamLogoUrl ? (
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-gray-100 shadow-md p-1 mb-2.5 flex items-center justify-center">
                      <img 
                        src={teamLogoUrl} 
                        alt={teamName || 'Equipo'} 
                        loading="lazy" 
                        decoding="async" 
                        className="w-full h-full object-contain rounded-xl" 
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-kasa-vinotinto/10 border border-kasa-vinotinto/20 p-2 mb-2 flex items-center justify-center text-kasa-vinotinto">
                      <Trophy className="w-6 h-6" />
                    </div>
                  )}

                  <span className="text-[11px] font-black uppercase tracking-widest text-kasa-dorado-dark font-display">
                    {teamName || 'KsaSport Oficial'}
                  </span>

                  <h3 className="text-xl font-black text-gray-900 leading-tight mb-4">
                    {athleteName || 'Carnet Digital'}
                  </h3>
                  
                  <div className="bg-white p-3.5 rounded-3xl shadow-xs border border-gray-100 mb-4 relative">
                    <QRCodeDisplay athleteId={athleteId} status={status} teamLogoUrl={teamLogoUrl} />
                  </div>

                  {/* Badge de Estatus */}
                  <div className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-3 ${
                    status === 'Solvente' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{status === 'Solvente' ? 'Jugadora Habilitada' : 'Estatus Restringido'}</span>
                  </div>
                  
                  <p className="text-xs text-gray-500 font-medium px-2">
                    Presenta este código ante la mesa técnica antes del inicio del juego para validar tu alineación.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>,
        document.body
      )}
    </>
  );
}
