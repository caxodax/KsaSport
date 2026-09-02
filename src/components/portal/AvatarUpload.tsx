'use client';

import { useState, useRef } from 'react';
import { Camera, Loader2, Upload, X } from 'lucide-react';
import { updateAvatar } from '@/app/portal/dashboard/actions';

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
        className="relative w-full h-full cursor-pointer" 
        onClick={() => setIsModalOpen(true)}
      >
        {avatar ? (
          <img src={avatar} alt="Avatar" className="w-full h-full object-cover rounded-full" />
        ) : (
          <div className="w-full h-full rounded-full bg-black/40 flex items-center justify-center text-white/50">
            <Camera className="w-8 h-8" />
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 rounded-full bg-black/60 flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 text-white animate-spin mb-1" />
            <span className="text-[10px] text-white font-bold">Subiendo...</span>
          </div>
        )}
      </div>

      {/* Modal estilo QR (tarjeta blanca centrada, botón X) */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl p-6 w-full max-w-sm relative shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 bg-gray-100 text-gray-500 hover:text-gray-900 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex flex-col items-center text-center mt-4">
              <h3 className="text-xl font-black uppercase tracking-widest text-gray-900 mb-6">
                Foto de Perfil
              </h3>
              
              <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 mb-6">
                {avatar ? (
                  <img 
                    src={avatar} 
                    alt="Avatar Completo" 
                    className="w-64 h-64 object-cover rounded-xl"
                  />
                ) : (
                  <div className="w-64 h-64 bg-gray-50 flex items-center justify-center rounded-xl">
                    <Camera className="w-16 h-16 text-gray-300" />
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center justify-center gap-2 w-full py-3 bg-kasa-vinotinto hover:bg-red-900 text-white font-bold rounded-xl transition-colors shadow-lg disabled:opacity-50"
              >
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                {isUploading ? 'Subiendo nueva foto...' : 'Cambiar Foto'}
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
