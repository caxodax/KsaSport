'use client'

import { useState } from 'react';
import { Trash2, Edit2, Check, X, Plus, Zap } from 'lucide-react';
import { deleteCategory, updateCategory } from './actions';
import { PositionItem, normalizePositions, PRESET_POSITIONS } from '@/lib/positions';

interface CategoryData {
  id: string;
  name: string;
  positions?: any;
}

export default function CategoryRow({ category }: { category: CategoryData }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [positions, setPositions] = useState<PositionItem[]>(normalizePositions(category.positions));
  const [code, setCode] = useState('');
  const [posName, setPosName] = useState('');
  const [loading, setLoading] = useState(false);

  const initialPositions = normalizePositions(category.positions);

  const handleAddPosition = () => {
    const cleanCode = code.trim().toUpperCase();
    const cleanName = posName.trim();
    if (!cleanCode) return;

    if (positions.some(p => p.code === cleanCode)) return;

    setPositions([...positions, { code: cleanCode, name: cleanName || cleanCode }]);
    setCode('');
    setPosName('');
  };

  const handleRemovePosition = (codeToRemove: string) => {
    setPositions(positions.filter(p => p.code !== codeToRemove));
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('id', category.id);
    formData.append('name', name.trim());
    formData.append('positions', JSON.stringify(positions));

    await updateCategory(formData);
    setIsEditing(false);
    setLoading(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setName(category.name);
    setPositions(initialPositions);
    setCode('');
    setPosName('');
  };

  if (isEditing) {
    return (
      <tr className="bg-amber-50/40 border-y border-amber-200">
        <td colSpan={3} className="px-6 py-4">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="w-full sm:w-1/3">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Nombre de la Categoría
                </label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto bg-white"
                  autoFocus
                />
              </div>

              <div className="flex-1 w-full">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Agregar Posición (Código / Nombre)
                </label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="P, POR"
                    maxLength={6}
                    className="w-24 rounded-lg border border-gray-300 px-2 py-1.5 text-xs font-mono font-bold uppercase bg-white outline-none focus:ring-2 focus:ring-kasa-vinotinto"
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPosition(); } }}
                  />
                  <input 
                    type="text" 
                    value={posName}
                    onChange={(e) => setPosName(e.target.value)}
                    placeholder="Nombre completo"
                    className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs bg-white outline-none focus:ring-2 focus:ring-kasa-vinotinto"
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPosition(); } }}
                  />
                  <button 
                    type="button" 
                    onClick={handleAddPosition}
                    className="bg-gray-800 hover:bg-black text-white px-3 py-1.5 text-xs font-bold rounded-lg transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Chips de posiciones actuales */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Posiciones ({positions.length}):
                </span>
                <div className="flex gap-1">
                  {Object.entries(PRESET_POSITIONS).map(([key, preset]) => (
                    <button
                      type="button"
                      key={key}
                      onClick={() => setPositions([...preset.positions])}
                      className="text-[10px] bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded hover:bg-gray-50"
                    >
                      ⚡ {preset.label.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 p-2 bg-white rounded-lg border border-gray-200 max-h-36 overflow-y-auto">
                {positions.length > 0 ? (
                  positions.map(p => (
                    <span 
                      key={p.code} 
                      className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded border border-gray-200"
                    >
                      <strong className="font-mono text-kasa-vinotinto">{p.code}</strong>
                      <span className="text-gray-600 text-[11px]">{p.name}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemovePosition(p.code)}
                        className="text-gray-400 hover:text-red-600 ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400 italic">Sin posiciones asignadas.</span>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button 
                onClick={handleCancel} 
                disabled={loading} 
                className="text-gray-600 bg-gray-200 hover:bg-gray-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave} 
                disabled={loading} 
                className="text-white bg-green-600 hover:bg-green-700 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
              >
                <Check className="w-4 h-4" />
                Guardar Cambios
              </button>
            </div>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-gray-50/80 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-base font-bold text-gray-900">{category.name}</div>
      </td>
      <td className="px-6 py-4">
        {initialPositions.length > 0 ? (
          <div className="flex flex-wrap gap-1 items-center max-w-xl">
            {initialPositions.map(p => (
              <span 
                key={p.code}
                className="inline-flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-[11px] px-2 py-0.5 rounded border border-gray-200 transition-colors"
                title={`${p.code}: ${p.name}`}
              >
                <strong className="font-mono text-kasa-vinotinto">{p.code}</strong>
                <span className="text-gray-600 hidden lg:inline">{p.name}</span>
              </span>
            ))}
            <span className="text-[10px] text-gray-400 font-bold ml-1">
              ({initialPositions.length})
            </span>
          </div>
        ) : (
          <span className="text-xs text-gray-400 italic">No aplica posiciones</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2">
        <button 
          onClick={() => setIsEditing(true)} 
          className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg" 
          title="Editar categoría y posiciones"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button 
          onClick={async () => {
            if (confirm('¿Seguro que deseas eliminar esta categoría? (Los equipos asociados podrían verse afectados)')) {
              await deleteCategory(category.id);
            }
          }} 
          className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg" 
          title="Eliminar"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}

// Componente para la vista móvil (Tarjeta First-Mobile)
export function CategoryCard({ category }: { category: CategoryData }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [positions, setPositions] = useState<PositionItem[]>(normalizePositions(category.positions));
  const [code, setCode] = useState('');
  const [posName, setPosName] = useState('');
  const [loading, setLoading] = useState(false);

  const initialPositions = normalizePositions(category.positions);

  const handleAddPosition = () => {
    const cleanCode = code.trim().toUpperCase();
    const cleanName = posName.trim();
    if (!cleanCode) return;

    if (positions.some(p => p.code === cleanCode)) return;

    setPositions([...positions, { code: cleanCode, name: cleanName || cleanCode }]);
    setCode('');
    setPosName('');
  };

  const handleRemovePosition = (codeToRemove: string) => {
    setPositions(positions.filter(p => p.code !== codeToRemove));
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('id', category.id);
    formData.append('name', name.trim());
    formData.append('positions', JSON.stringify(positions));

    await updateCategory(formData);
    setIsEditing(false);
    setLoading(false);
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative">
      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Nombre</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto bg-white"
              autoFocus
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Agregar Posición</label>
            <div className="flex gap-1.5">
              <input 
                type="text" 
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Cód."
                maxLength={6}
                className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-xs font-mono font-bold uppercase bg-white outline-none"
              />
              <input 
                type="text" 
                value={posName}
                onChange={(e) => setPosName(e.target.value)}
                placeholder="Nombre"
                className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs bg-white outline-none"
              />
              <button 
                type="button" 
                onClick={handleAddPosition}
                className="bg-gray-800 text-white px-3 py-1.5 text-xs font-bold rounded-lg"
              >
                +
              </button>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Posiciones ({positions.length}):
            </span>
            <div className="flex flex-wrap gap-1 p-2 bg-gray-50 rounded-lg border border-gray-200 max-h-32 overflow-y-auto">
              {positions.map(p => (
                <span key={p.code} className="inline-flex items-center gap-1 bg-white text-gray-800 text-[11px] px-2 py-0.5 rounded border border-gray-200">
                  <strong className="font-mono text-kasa-vinotinto">{p.code}</strong>
                  <button type="button" onClick={() => handleRemovePosition(p.code)} className="text-gray-400 hover:text-red-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1 border-t border-gray-100">
            <button 
              onClick={() => { setIsEditing(false); setName(category.name); setPositions(initialPositions); }} 
              disabled={loading} 
              className="text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg text-xs font-bold"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSave} 
              disabled={loading} 
              className="text-white bg-green-600 px-3 py-1.5 rounded-lg text-xs font-bold"
            >
              Guardar
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-gray-900 text-base">{category.name}</h4>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setIsEditing(true)} 
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                title="Editar"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button 
                onClick={async () => {
                  if (confirm('¿Seguro que deseas eliminar esta categoría?')) {
                    await deleteCategory(category.id);
                  }
                }} 
                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" 
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Posiciones en vista móvil: badges compactos */}
          <div className="pt-1">
            {initialPositions.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {initialPositions.map(p => (
                  <span 
                    key={p.code} 
                    className="text-[11px] font-mono font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200"
                    title={p.name}
                  >
                    {p.code}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">Sin posiciones asignadas</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
