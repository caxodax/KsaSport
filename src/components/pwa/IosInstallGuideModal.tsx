'use client';

import { X, Share, PlusSquare, Smartphone, Check, BellRing } from 'lucide-react';

interface IosInstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: 'install' | 'push';
}

export default function IosInstallGuideModal({
  isOpen,
  onClose,
  reason = 'install',
}: IosInstallGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="ios-guide-title"
        className="bg-white rounded-t-[32px] sm:rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 text-gray-900 animate-in slide-in-from-bottom-8 max-h-[90vh] overflow-y-auto"
      >
        {/* Encabezado */}
        <div className="flex justify-between items-center border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-kasa-vinotinto p-1.5 flex items-center justify-center shrink-0 shadow-sm">
              <img src="/icon-192.png" alt="KsaSport" className="w-full h-full object-contain rounded-xl" />
            </div>
            <div>
              <h3 id="ios-guide-title" className="font-black text-lg text-gray-900 leading-tight">
                {reason === 'push' ? 'Activar Alertas en iPhone' : 'Instalar KsaSport en iPhone'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">Guía oficial para Safari (iOS / iPadOS)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] text-gray-400 hover:text-gray-700 flex items-center justify-center rounded-xl transition-colors cursor-pointer"
            aria-label="Cerrar guía"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Explicación de restricción de Apple */}
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-amber-950">
            {reason === 'push' ? (
              <>
                <BellRing className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Requisito del sistema Apple (iOS 16.4+)</span>
              </>
            ) : (
              <>
                <Smartphone className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Instalación en dispositivos Apple</span>
              </>
            )}
          </div>
          <p className="text-[11px] leading-relaxed text-amber-800">
            {reason === 'push'
              ? 'Por seguridad, Apple no permite activar notificaciones Push dentro del navegador Safari. Debes agregar la app a tu pantalla de inicio y abrirla desde allí para habilitarlas.'
              : 'En iOS, Safari no permite la instalación automática con 1 toque. Es necesario agregar la app a tu pantalla de inicio manualmente siguiendo estos 4 pasos:'}
          </p>
        </div>

        {/* 4 Pasos Visuales */}
        <div className="space-y-2.5">
          {/* Paso 1 */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-black text-xs">
              1
            </div>
            <div className="text-xs text-slate-700 min-w-0">
              <p className="font-bold text-gray-900">Pulsa el botón Compartir</p>
              <p className="text-slate-500 mt-0.5">
                En la barra inferior de Safari busca el ícono de compartir <Share className="w-3.5 h-3.5 inline text-blue-600 mx-0.5" />.
              </p>
            </div>
          </div>

          {/* Paso 2 */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 font-black text-xs">
              2
            </div>
            <div className="text-xs text-slate-700 min-w-0">
              <p className="font-bold text-gray-900">«Agregar a pantalla de inicio»</p>
              <p className="text-slate-500 mt-0.5">
                Desliza hacia abajo en la lista y toca <PlusSquare className="w-3.5 h-3.5 inline text-gray-800 mx-0.5" /> <strong>Agregar a pantalla de inicio</strong>.
              </p>
            </div>
          </div>

          {/* Paso 3 */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 font-black text-xs">
              3
            </div>
            <div className="text-xs text-slate-700 min-w-0">
              <p className="font-bold text-gray-900">Confirma pulsando «Agregar»</p>
              <p className="text-slate-500 mt-0.5">
                En la esquina superior derecha de tu iPhone, pulsa <strong>Agregar</strong>.
              </p>
            </div>
          </div>

          {/* Paso 4 (Clave para notificaciones) */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
            <div className="w-7 h-7 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 font-black text-xs shadow-sm">
              4
            </div>
            <div className="text-xs text-slate-700 min-w-0">
              <p className="font-bold text-emerald-950">¡Abre KsaSport desde tu inicio!</p>
              <p className="text-emerald-800 mt-0.5 font-medium">
                Cierra Safari y toca el nuevo ícono de <strong>KsaSport</strong> en tu pantalla de inicio. Desde allí funcionará a pantalla completa y podrás activar tus alertas con 1 toque.
              </p>
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="pt-2 space-y-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] w-full py-3.5 rounded-2xl bg-kasa-vinotinto text-white font-black text-xs hover:bg-red-950 transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-md active:scale-95"
          >
            <Check className="w-4 h-4 text-kasa-dorado" />
            <span>¡Entendido! La abriré desde mi pantalla de inicio</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] w-full py-2.5 rounded-2xl text-slate-500 hover:text-slate-800 font-semibold text-xs transition-colors cursor-pointer"
          >
            Cerrar guía
          </button>
        </div>
      </div>
    </div>
  );
}
