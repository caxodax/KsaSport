'use client';

import { useState, useRef } from 'react';
import { Camera, Loader2, Upload } from 'lucide-react';
import { updateAvatar } from '@/app/portal/dashboard/actions';
import Image from 'next/image';

export default function AvatarUpload({ 
  athleteId, 
  currentAvatar 
}: { 
  athleteId: string; 
  currentAvatar?: string | null;
}) {
  const [avatar, setAvatar] = useState<string | null>(currentAvatar || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      // Revertir a la anterior si falla
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
      <div 
        className="relative w-full h-full group cursor-pointer" 
        onClick={() => setIsModalOpen(true)}
      >
        <div className="w-full h-full relative overflow-hidden transition-all group-hover:opacity-80">
          {avatar ? (
            <img src={avatar} alt="Profile Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-black/40 flex items-center justify-center text-white/50 transition-colors">
              <Camera className="w-8 h-8" />
            </div>
          )}

          {/* Overlay hover indicator for view */}
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-white text-xs font-bold px-3 py-1 bg-black/50 rounded-full border border-white/20">Cambiar Foto</span>
          </div>
          
          {isUploading && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin mb-2" />
              <span className="text-[10px] text-white font-bold">Subiendo...</span>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
          <div className="relative flex flex-col items-center max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="bg-white/5 p-2 w-full max-w-[320px] aspect-square rounded-full shadow-2xl relative border border-white/20">
              {avatar ? (
                <img src={avatar} alt="Avatar Completo" className="w-full h-full object-cover rounded-full shadow-inner" />
              ) : (
                <div className="w-full h-full bg-gray-900 flex items-center justify-center rounded-full shadow-inner">
                  <Camera className="w-16 h-16 text-gray-600" />
                </div>
              )}
            </div>
            
            <div className="mt-6 flex flex-col gap-3 w-full max-w-[320px]">
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center justify-center gap-2 w-full py-3 bg-kasa-vinotinto hover:bg-red-900 text-white font-bold rounded-xl transition-colors shadow-lg disabled:opacity-50"
              >
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                {isUploading ? 'Subiendo nueva foto...' : 'Cambiar Foto'}
              </button>
              
              <button 
                onClick={() => setIsModalOpen(false)}
                className="py-3 text-white/70 hover:text-white font-bold rounded-xl transition-colors hover:bg-white/10"
              >
                Cerrar
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
