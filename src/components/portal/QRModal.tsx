'use client'

import { useState } from 'react';
import { QrCode, X } from 'lucide-react';
import QRCodeDisplay from './QRCodeDisplay';

export default function QRModal({ athleteId, status }: { athleteId: string, status: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center gap-2 w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-xl transition-colors border border-gray-200"
      >
        <QrCode className="w-5 h-5" />
        Ver Carnet Digital
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm relative shadow-2xl animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 bg-gray-100 text-gray-500 hover:text-gray-900 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex flex-col items-center text-center mt-4">
              <h3 className="text-xl font-black uppercase tracking-widest text-gray-900 mb-6">
                Carnet Digital
              </h3>
              
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6">
                <QRCodeDisplay athleteId={athleteId} status={status} />
              </div>
              
              <p className="text-sm text-gray-500 font-medium px-4">
                Presenta este código a la mesa técnica antes del juego para validar tu participación.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
