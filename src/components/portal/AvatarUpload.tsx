'use client';

import { useState, useRef } from 'react';
import { Camera, Loader2, Upload, X, User } from 'lucide-react';
import { updateAvatar } from '@/app/portal/dashboard/actions';

export default function AvatarUpload({ 
  athleteId, 
  currentAvatar,
  athleteName = ''
}: { 
  athleteId: string; 
  currentAvatar?: string | null;
  athleteName?: string;
}) {
  const [avatar, setAvatar] = useState<string | null>(currentAvatar || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || 'KS';
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Previsualización local rápida
    const objectUrl = URL.createObjectURL(file);
    setAvatar(objectUrl);
    setIsUploading(true);

    const formData = new FormData();
    formData.append('avatar', file);

    const res = await updateAvatar(athleteId, formData);
    
    if (res.error) {
      alert(`Error al subir la imagen: ${res.error}`);
      setAvatar(currentAvatar || null);
    } else if (res.avatar_url) {
      setAvatar(res.avatar_url);
    }

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      {/* Foto circular en el hero: click abre el modal */}
      <div 
        className="relative w-full h-full cursor-pointer group select-none overflow-hidden rounded-full" 
        onClick={() => setIsModalOpen(true)}
        title="Clic para ver o cambiar foto de perfil"
      >
        {avatar ? (
          <img 
            src={avatar} 
            alt={athleteName || "Avatar"} 
            className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-300" 
          />
        ) : (
          <div className="w-full h-full rounded-full bg-gradient-to-br from-rose-950 via-kasa-vinotinto to-amber-600 flex items-center justify-center text-white font-black text-3xl md:text-4xl tracking-wider shadow-inner">
            <span>{getInitials(athleteName)}</span>
          </div>
        )}

        {/* Overlay hover sutil con icono de cámara */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-2xs">
          <Camera className="w-7 h-7 drop-shadow-md" />
        </div>

        {/* Indicador de carga */}
        {isUploading && (
          <div className="absolute inset-0 rounded-full bg-black/75 flex flex-col items-center justify-center z-10">
            <Loader2 className="w-7 h-7 text-white animate-spin mb-1" />
            <span className="text-[10px] text-white font-black tracking-wider uppercase">Subiendo...</span>
          </div>
        )}
      </div>

      {/* Modal estilo QR / Perfil Pro */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-sm relative shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex flex-col items-center text-center mt-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Expediente del Atleta
              </span>
              <h3 className="text-xl font-black text-gray-900 mb-4">
                Foto de Perfil
              </h3>
              
              <div className="bg-slate-100 p-2 rounded-3xl shadow-inner border border-slate-200 mb-6 overflow-hidden">
                {avatar ? (
                  <img 
                    src={avatar} 
                    alt="Avatar Completo" 
                    className="w-64 h-64 object-cover rounded-2xl shadow-sm"
                  />
                ) : (
                  <div className="w-64 h-64 rounded-2xl bg-gradient-to-br from-rose-950 via-kasa-vinotinto to-amber-600 flex flex-col items-center justify-center text-white">
                    <span className="text-5xl font-black mb-2">{getInitials(athleteName)}</span>
                    <span className="text-xs text-white/80 font-medium">Sin fotografía cargada</span>
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-kasa-vinotinto to-red-900 hover:from-red-900 hover:to-kasa-vinotinto text-white text-xs font-black uppercase tracking-wider rounded-2xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Subiendo nueva foto...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Cambiar Fotografía</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <input 
        type="file" 
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
        disabled={isUploading}
      />
    </>
  );
}
