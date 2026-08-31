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
    <div className="relative w-24 h-24 mx-auto -mt-12 mb-4 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
      <div className="w-full h-full bg-white rounded-full p-1 shadow-sm relative overflow-hidden transition-all group-hover:shadow-md">
        {avatar ? (
          <img src={avatar} alt="Profile Avatar" className="w-full h-full rounded-full object-cover" />
        ) : (
          <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-gray-200 transition-colors">
            <Camera className="w-8 h-8" />
          </div>
        )}

        {/* Overlay hover */}
        <div className="absolute inset-1 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {isUploading ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : (
            <Upload className="w-6 h-6 text-white" />
          )}
        </div>
      </div>

      <input 
        type="file" 
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
        disabled={isUploading}
      />
    </div>
  );
}
