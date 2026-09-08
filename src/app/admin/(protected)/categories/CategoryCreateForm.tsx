'use client'
import { useState } from 'react';
import { Plus, X, Zap, Check, AlertCircle } from 'lucide-react';
import { createCategory } from './actions';
import { PositionItem, PRESET_POSITIONS } from '@/lib/positions';

export default function CategoryCreateForm() {
  const [name, setName] = useState('');
  const [hasPositions, setHasPositions] = useState(true);
  const [positions, setPositions] = useState<PositionItem[]>([]);
  const [code, setCode] = useState('');
  const [posName, setPosName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  const handleAddPosition = () => {
    const cleanCode = code.trim().toUpperCase();
    const cleanName = posName.trim();

    if (!cleanCode) return;

    if (positions.some(p => p.code === cleanCode)) {
      setMessage({ text: `El código "${cleanCode}" ya está agregado.`, type: 'error' });
      return;
    }

    setPositions([...positions, { code: cleanCode, name: cleanName || cleanCode }]);
    setCode('');
    setPosName('');
    setMessage(null);
  };

  const handleRemovePosition = (codeToRemove: string) => {
    setPositions(positions.filter(p => p.code !== codeToRemove));
  };

  const handleApplyPreset = (presetKey: string) => {
    const preset = PRESET_POSITIONS[presetKey];
    if (preset) {
      setPositions([...preset.positions]);
      setHasPositions(true);
      setMessage({ text: `Plantilla ${preset.label} aplicada.`, type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('positions', JSON.stringify(hasPositions ? positions : []));

    const res = await createCategory(formData);
    setLoading(false);

    if (res?.error) {
      setMessage({ text: res.error, type: 'error' });
    } else {
      setName('');
      setPositions([]);
      setMessage({ text: 'Categoría registrada con éxito.', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 w-full">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="p-2 bg-red-50 rounded-xl">
          <Plus className="w-5 h-5 text-kasa-vinotinto" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Nueva Categoría o Disciplina</h3>
          <p className="text-xs text-gray-500">Crea disciplinas y define las posiciones que utilizarán los atletas.</p>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2 ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {message.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <Check className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="cat-name" className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5">
            Nombre de la Categoría / Disciplina *
          </label>
          <input 
            type="text" 
            id="cat-name" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 bg-white text-gray-900 text-sm focus:ring-2 focus:ring-kasa-vinotinto outline-none transition-all"
            placeholder="Ej: Kickingball, Fútbol Campo, Infantil B..."
          />
        </div>

        <div className="pt-2 border-t border-gray-100">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={hasPositions} 
              onChange={(e) => setHasPositions(e.target.checked)}
              className="w-4 h-4 rounded text-kasa-vinotinto focus:ring-kasa-vinotinto border-gray-300"
            />
            <span className="text-xs sm:text-sm font-bold text-gray-800">
              Esta disciplina utiliza posiciones en campo
            </span>
          </label>
        </div>

        {hasPositions && (
          <div className="bg-gray-50/70 p-3.5 sm:p-4 rounded-xl border border-gray-200/70 space-y-3">
            {/* Plantillas rápidas */}
            <div>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Carga rápida de posiciones:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(PRESET_POSITIONS).map(([key, preset]) => (
                  <button
                    type="button"
                    key={key}
                    onClick={() => handleApplyPreset(key)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 transition-colors shadow-sm"
                  >
                    <Zap className="w-3 h-3 text-amber-500" />
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs para agregar posición individual */}
            <div className="pt-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Agregar o personalizar posición:
              </span>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="w-full sm:w-28">
                  <input 
                    type="text" 
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Código (P, POR)"
                    maxLength={6}
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs sm:text-sm bg-white font-mono font-bold uppercase outline-none focus:ring-2 focus:ring-kasa-vinotinto"
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPosition(); } }}
                  />
                </div>
                <div className="flex-1">
                  <input 
                    type="text" 
                    value={posName}
                    onChange={(e) => setPosName(e.target.value)}
                    placeholder="Nombre completo (ej: Pitcher, Portero)"
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs sm:text-sm bg-white outline-none focus:ring-2 focus:ring-kasa-vinotinto"
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPosition(); } }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddPosition}
                  className="bg-gray-800 hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shrink-0"
                >
                  + Añadir
                </button>
              </div>
            </div>

            {/* Lista de chips agregados */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-gray-700">
                  Posiciones asignadas ({positions.length}):
                </span>
                {positions.length > 0 && (
                  <button 
                    type="button" 
                    onClick={() => setPositions([])} 
                    className="text-[11px] text-red-600 hover:underline font-medium"
                  >
                    Vaciar lista
                  </button>
                )}
              </div>

              {positions.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1 bg-white rounded-lg border border-gray-200">
                  {positions.map((p) => (
                    <span 
                      key={p.code}
                      className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs px-2.5 py-1 rounded-md border border-gray-200 transition-colors"
                      title={p.name}
                    >
                      <strong className="font-mono text-kasa-vinotinto">{p.code}</strong>
                      <span className="text-gray-600 hidden sm:inline">{p.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePosition(p.code)}
                        className="text-gray-400 hover:text-red-600 ml-0.5"
                        title="Eliminar posición"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-400 italic bg-white p-3 rounded-lg border border-dashed border-gray-200 text-center">
                  Usa los botones de carga rápida de arriba o agrega posiciones personalizadas.
                </div>
              )}
            </div>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button 
            type="submit" 
            disabled={loading}
            className="bg-kasa-vinotinto hover:bg-red-900 text-white font-bold py-2.5 px-6 rounded-xl transition-colors w-full sm:w-auto text-sm shadow-md disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Registrar Categoría'}
          </button>
        </div>
      </form>
    </div>
  );
}
