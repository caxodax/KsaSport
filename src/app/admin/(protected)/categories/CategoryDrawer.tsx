'use client'

import { useState, useEffect } from 'react';
import { X, Plus, Zap, Check, AlertCircle, Shield, Trophy, Loader2 } from 'lucide-react';
import { createCategory, updateCategory } from './actions';
import { PositionItem, PRESET_POSITIONS, normalizePositions } from '@/lib/positions';

interface CategoryData {
  id: string;
  name: string;
  positions?: any;
}

export default function CategoryDrawer({
  isOpen,
  onClose,
  category = null,
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  category?: CategoryData | null;
  onSuccess?: () => void;
}) {
  const isEditing = Boolean(category);

  const [name, setName] = useState('');
  const [hasPositions, setHasPositions] = useState(true);
  const [positions, setPositions] = useState<PositionItem[]>([]);
  const [code, setCode] = useState('');
  const [posName, setPosName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (category) {
      setName(category.name);
      const parsed = normalizePositions(category.positions);
      setPositions(parsed);
      setHasPositions(parsed.length > 0);
    } else {
      setName('');
      setPositions([]);
      setHasPositions(true);
    }
    setCode('');
    setPosName('');
    setErrorMsg(null);
  }, [category, isOpen]);

  if (!isOpen) return null;

  const handleAddPosition = () => {
    const cleanCode = code.trim().toUpperCase();
    const cleanName = posName.trim();

    if (!cleanCode) return;

    if (positions.some(p => p.code === cleanCode)) {
      setErrorMsg(`El código "${cleanCode}" ya está en la lista.`);
      return;
    }

    setPositions([...positions, { code: cleanCode, name: cleanName || cleanCode }]);
    setCode('');
    setPosName('');
    setErrorMsg(null);
  };

  const handleRemovePosition = (codeToRemove: string) => {
    setPositions(positions.filter(p => p.code !== codeToRemove));
  };

  const handleApplyPreset = (presetKey: string) => {
    const preset = PRESET_POSITIONS[presetKey];
    if (preset) {
      setPositions([...preset.positions]);
      setHasPositions(true);
      setErrorMsg(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('El nombre de la disciplina es requerido.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const formData = new FormData();
    if (isEditing && category) {
      formData.append('id', category.id);
    }
    formData.append('name', name.trim());
    formData.append('positions', JSON.stringify(hasPositions ? positions : []));

    const res = isEditing ? await updateCategory(formData) : await createCategory(formData);
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
                <Trophy className="w-6 h-6 text-kasa-dorado" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest text-white/70 block">
                  {isEditing ? 'Modificar Registro' : 'Nueva Configuración'}
                </span>
                <h3 className="text-xl font-black text-white leading-tight">
                  {isEditing ? 'Editar Disciplina' : 'Nueva Disciplina Deportiva'}
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

          {/* Formulario con Scroll */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {errorMsg && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs sm:text-sm text-red-700 font-medium flex items-center gap-2 animate-in shake duration-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Campo: Nombre */}
            <div>
              <label htmlFor="drawer-name" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Nombre de la Categoría / Disciplina *
              </label>
              <input 
                type="text" 
                id="drawer-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 bg-white text-gray-900 text-sm font-medium focus:ring-2 focus:ring-kasa-vinotinto outline-none transition-all shadow-sm"
                placeholder="Ej: Kickingball, Fútbol Campo, Voleibol..."
                autoFocus
              />
              <p className="text-[11px] text-gray-400 mt-1.5">
                Este nombre aparecerá en los selectores de equipos y reportes financieros.
              </p>
            </div>

            {/* Switch iOS: Habilitar Posiciones */}
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-200/80">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Posiciones Tácticas</h4>
                  <p className="text-xs text-gray-500">¿Esta disciplina cuenta con posiciones específicas en cancha?</p>
                </div>
                <button
                  type="button"
                  onClick={() => setHasPositions(!hasPositions)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${hasPositions ? 'bg-kasa-vinotinto' : 'bg-gray-300'}`}
                >
                  <span 
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${hasPositions ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </button>
              </div>
            </div>

            {/* Sección de Posiciones */}
            {hasPositions && (
              <div className="space-y-4 bg-gray-50/70 p-4 rounded-2xl border border-gray-200/80">
                
                {/* Botones de Carga Rápida */}
                <div>
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
                    Plantillas Oficiales de Posiciones:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(PRESET_POSITIONS).map(([key, preset]) => (
                      <button
                        type="button"
                        key={key}
                        onClick={() => handleApplyPreset(key)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 transition-colors shadow-sm text-left"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="truncate">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input Agregar Posición */}
                <div className="pt-2 border-t border-gray-200/60">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
                    Añadir Posición Personalizada:
                  </span>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="Código (P, POR)"
                      maxLength={6}
                      className="w-28 rounded-xl border border-gray-300 px-3 py-2 text-xs font-mono font-bold uppercase bg-white outline-none focus:ring-2 focus:ring-kasa-vinotinto"
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPosition(); } }}
                    />
                    <input 
                      type="text" 
                      value={posName}
                      onChange={(e) => setPosName(e.target.value)}
                      placeholder="Nombre (ej: Pitcher, Portero)"
                      className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-xs bg-white outline-none focus:ring-2 focus:ring-kasa-vinotinto"
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPosition(); } }}
                    />
                    <button
                      type="button"
                      onClick={handleAddPosition}
                      className="bg-gray-900 hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Lista de Chips */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-700">
                      Posiciones registradas ({positions.length}):
                    </span>
                    {positions.length > 0 && (
                      <button 
                        type="button" 
                        onClick={() => setPositions([])} 
                        className="text-[11px] text-red-600 hover:underline font-bold"
                      >
                        Vaciar
                      </button>
                    )}
                  </div>

                  {positions.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 max-h-52 overflow-y-auto p-2 bg-white rounded-xl border border-gray-200">
                      {positions.map((p) => (
                        <span 
                          key={p.code}
                          className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-800 text-xs px-2.5 py-1 rounded-lg border border-gray-200"
                          title={p.name}
                        >
                          <strong className="font-mono text-kasa-vinotinto font-black">{p.code}</strong>
                          <span className="text-gray-600">{p.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemovePosition(p.code)}
                            className="text-gray-400 hover:text-red-600 ml-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 italic bg-white p-3 rounded-xl border border-dashed border-gray-200 text-center">
                      No hay posiciones agregadas aún. Selecciona una plantilla arriba o añade una manualmente.
                    </div>
                  )}
                </div>

              </div>
            )}

            <div className="h-6" />
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
              {loading ? 'Guardando...' : isEditing ? 'Actualizar Disciplina' : 'Guardar Disciplina'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

