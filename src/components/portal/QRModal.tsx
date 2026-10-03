'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { QrCode, X, ShieldCheck, Trophy } from 'lucide-react';
import QRCodeDisplay from './QRCodeDisplay';

export default function QRModal({ 
  athleteId, 
  status,
  teamName,
  teamLogoUrl,
  athleteName,
  triggerClassName 
}: { 
  athleteId: string;
  status: string;
  teamName?: string | null;
  teamLogoUrl?: string | null;
  athleteName?: string | null;
  triggerClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={triggerClassName || "flex items-center justify-center gap-2 w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-xl transition-colors border border-gray-200"}
      >
        <QrCode className="w-5 h-5" />
        Ver Carnet Digital
      </button>

      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] p-6 w-full max-w-sm relative shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 overflow-hidden">
            {/* Acento superior de color */}
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-kasa-vinotinto via-kasa-dorado to-kasa-vinotinto" />

            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 bg-gray-100 text-gray-500 hover:text-gray-900 rounded-full transition-colors active:scale-95 cursor-pointer"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex flex-col items-center text-center mt-3">
              {/* Escudo del equipo oficial en el encabezado del carnet */}
              {teamLogoUrl ? (
                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-gray-100 shadow-md p-1 mb-2.5 flex items-center justify-center">
                  <img src={teamLogoUrl} alt={teamName || 'Equipo'} className="w-full h-full object-contain rounded-xl" />
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
              
              <div className="bg-white p-3.5 rounded-3xl shadow-sm border border-gray-100 mb-4 relative">
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
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
