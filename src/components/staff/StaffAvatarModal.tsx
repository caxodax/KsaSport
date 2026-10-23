'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Loader2, Upload, X } from 'lucide-react';
import { updateStaffAvatar } from '@/app/admin/(protected)/staff/actions';
import { compressImageClient } from '@/lib/clientImageCompressor';
import { toast } from 'sonner';

export default function StaffAvatarModal({
  isOpen,
  onClose,
  staffId,
  staffName,
  currentAvatar,
  role = 'Staff',
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  staffId: string;
  staffName: string;
  currentAvatar?: string | null;
  role?: string;
  onSuccess?: (newAvatarUrl: string) => void;
}) {
  const [avatar, setAvatar] = useState<string | null>(currentAvatar || null);
  const [isUploading, setIsUploading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setAvatar(currentAvatar || null);
  }, [currentAvatar]);

  if (!isOpen || !mounted) return null;

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || 'ST';
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setAvatar(previewUrl);
    setIsUploading(true);

    try {
      const optimized = await compressImageClient(file, 1080, 0.85);
      const formData = new FormData();
      formData.append('avatar', optimized);

      const res = await updateStaffAvatar(staffId, formData);

      if (res?.error) {
        toast.error(res.error);
        setAvatar(currentAvatar || null);
      } else if (res?.avatar_url) {
        setAvatar(res.avatar_url);
        toast.success(`Foto de ${staffName} actualizada exitosamente.`);
        if (onSuccess) onSuccess(res.avatar_url);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error al procesar la imagen.');
      setAvatar(currentAvatar || null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-sm relative shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 text-center"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">
          {role} · Ksa Sports
        </span>
        <h3 className="text-xl font-black text-gray-900 mb-4">
          Foto de Perfil Oficial
        </h3>

        <div className="bg-slate-100 p-2 rounded-3xl shadow-inner border border-slate-200 mb-5 overflow-hidden mx-auto w-64 h-64 relative flex items-center justify-center">
          {avatar ? (
            <img 
              src={avatar} 
              alt={staffName} 
              className="w-full h-full object-cover rounded-2xl shadow-sm"
            />
          ) : (
            <div className="w-full h-full rounded-2xl bg-gradient-to-br from-rose-950 via-kasa-vinotinto to-amber-600 flex flex-col items-center justify-center text-white">
              <span className="text-5xl font-black mb-2">{getInitials(staffName)}</span>
              <span className="text-xs text-white/80 font-medium">Sin fotografía asignada</span>
            </div>
          )}

          {isUploading && (
            <div className="absolute inset-0 bg-black/75 rounded-2xl flex flex-col items-center justify-center z-10 text-white">
              <Loader2 className="w-8 h-8 animate-spin mb-2 text-kasa-dorado" />
              <span className="text-xs font-black uppercase tracking-wider">Subiendo foto...</span>
            </div>
          )}
        </div>

        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-kasa-vinotinto to-red-950 hover:from-red-900 hover:to-kasa-vinotinto text-white text-xs font-black uppercase tracking-wider rounded-2xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Guardando en la nube...</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 text-kasa-dorado" />
              <span>{avatar ? 'Cambiar Fotografía' : 'Subir Fotografía'}</span>
            </>
          )}
        </button>

        <p className="text-[11px] text-slate-400 mt-3 font-medium">
          Formatos JPG, PNG, WEBP. Optimización automática.
        </p>
      </div>

      <input 
        type="file" 
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
        disabled={isUploading}
      />
    </div>,
    document.body
  );
}
