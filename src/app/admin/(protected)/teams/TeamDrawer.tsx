'use client'

import { useState, useEffect, useRef } from 'react';
import { X, Plus, Shield, Camera, Upload, AlertCircle, Loader2 } from 'lucide-react';
import { createTeam, updateTeam } from './actions';

interface TeamData {
  id: string;
  name: string;
  category: string;
  logo_url?: string | null;
}

interface CategoryOption {
  id?: string;
  name: string;
}

export default function TeamDrawer({
  isOpen,
  onClose,
  team = null,
  categories = [],
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  team?: TeamData | null;
  categories: CategoryOption[];
  onSuccess?: () => void;
}) {
  const isEditing = Boolean(team);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (team) {
      setName(team.name);
      setCategory(team.category);
      setLogoPreview(team.logo_url || null);
    } else {
      setName('');
      setCategory(categories[0]?.name || '');
      setLogoPreview(null);
    }
    setLogoFile(null);
    setErrorMsg(null);
  }, [team, categories, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('La imagen no debe pesar más de 5MB.');
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setLogoPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('El nombre del equipo es obligatorio.');
      return;
    }
    if (!category.trim()) {
      setErrorMsg('Debes seleccionar una disciplina o categoría.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const formData = new FormData();
    if (isEditing && team) {
      formData.append('id', team.id);
    }
    formData.append('name', name.trim());
    formData.append('category', category.trim());
    if (logoFile) {
      formData.append('logo', logoFile);
    }

    const res = isEditing ? await updateTeam(formData) : await createTeam(formData);
    setLoading(false);

    if (res?.error) {
      setErrorMsg(res.error);
    } else {
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-lg bg-white shadow-2xl flex flex-col transform transition-transform ease-in-out duration-300">
          
          {/* Header del Drawer */}
          <div className="p-6 bg-gradient-to-r from-kasa-vinotinto via-red-950 to-kasa-vinotinto text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md">
                <Shield className="w-6 h-6 text-kasa-dorado" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest text-white/70 block">
                  {isEditing ? 'Modificar Registro' : 'Nueva Ficha de Equipo'}
                </span>
                <h3 className="text-xl font-black text-white leading-tight">
                  {isEditing ? 'Editar Equipo' : 'Registrar Nuevo Equipo'}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {errorMsg && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs sm:text-sm text-red-700 font-medium flex items-center gap-2 animate-in shake duration-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Carga de Escudo / Logo */}
            <div className="flex flex-col items-center justify-center p-6 bg-gray-50/80 rounded-3xl border border-dashed border-gray-200 text-center">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative w-28 h-28 rounded-full border-2 border-gray-200 overflow-hidden bg-white shadow-sm flex items-center justify-center cursor-pointer group hover:border-kasa-vinotinto transition-all"
                title="Hacer clic para cargar o cambiar el escudo"
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400 group-hover:text-kasa-vinotinto transition-colors">
                    <Shield className="w-9 h-9 stroke-[1.5]" />
                    <span className="text-[10px] font-bold uppercase mt-1">Sin Escudo</span>
                  </div>
                )}
                
                {/* Overlay hover */}
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                  <span className="text-[10px] font-bold text-white uppercase mt-0.5">Cambiar</span>
                </div>
              </div>

              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*"
                onChange={handleFileChange}
                className="hidden" 
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 shadow-sm transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-kasa-vinotinto" />
                <span>{logoPreview ? 'Cambiar Escudo' : 'Cargar Escudo Oficial'}</span>
              </button>
              <p className="text-[10px] text-gray-400 mt-1">Formatos PNG, JPG o WEBP (Máx. 5MB)</p>
            </div>

            {/* Nombre del Equipo */}
            <div>
              <label htmlFor="team-name" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Nombre del Equipo *
              </label>
              <input 
                type="text" 
                id="team-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 bg-white text-gray-900 text-sm font-medium focus:ring-2 focus:ring-kasa-vinotinto outline-none transition-all shadow-sm"
                placeholder="Ej: Las Fieras, Cenicentas, Titanes..."
                autoFocus
              />
            </div>

            {/* Disciplina / Categoría */}
            <div>
              <label htmlFor="team-category" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Disciplina / Categoría *
              </label>
              <select 
                id="team-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 bg-white text-gray-900 text-sm font-medium focus:ring-2 focus:ring-kasa-vinotinto outline-none transition-all shadow-sm"
              >
                <option value="">Selecciona una disciplina</option>
                {categories.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-400 mt-1.5">
                Las atletas que pertenezcan a este equipo usarán automáticamente las posiciones de esta disciplina.
              </p>
            </div>

          </form>

          {/* Footer Fijo */}
          <div className="p-4 sm:p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 font-bold rounded-xl text-xs sm:text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-kasa-vinotinto to-red-900 hover:from-red-900 hover:to-red-950 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Guardando...' : isEditing ? 'Actualizar Equipo' : 'Registrar Equipo'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

