'use client'

import { X, Shield, Layers } from 'lucide-react';
import { PositionItem } from '@/lib/positions';

export default function PositionsModal({
  isOpen,
  onClose,
  categoryName,
  positions
}: {
  isOpen: boolean;
  onClose: () => void;
  categoryName: string;
  positions: PositionItem[];
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con gradiente sutil */}
        <div className="bg-gradient-to-r from-kasa-vinotinto via-red-950 to-kasa-vinotinto p-6 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
              <Shield className="w-5 h-5 text-kasa-dorado" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-widest text-white/70 font-black">
                Posiciones Tácticas
              </span>
              <h3 className="text-xl font-black text-white leading-tight">
                {categoryName}
              </h3>
            </div>
          </div>
        </div>

        {/* Lista de posiciones en 2 columnas */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold mb-2">
            <span>Total configuradas: {positions.length} posiciones</span>
          </div>

          {positions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {positions.map((pos) => (
                <div 
                  key={pos.code}
                  className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 bg-gray-50/70 hover:bg-white hover:border-gray-200 hover:shadow-sm transition-all"
                >
                  <span className="w-12 h-9 rounded-lg bg-red-50 text-kasa-vinotinto font-mono font-black text-xs flex items-center justify-center shrink-0 border border-red-100">
                    {pos.code}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {pos.name}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium">
                      Código: {pos.code}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Layers className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">Esta disciplina no tiene posiciones configuradas.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl text-xs transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
