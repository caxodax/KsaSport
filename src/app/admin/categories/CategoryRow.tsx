'use client'

import { useState } from 'react';
import { Trash2, Edit2, Check, X } from 'lucide-react';
import { deleteCategory, updateCategory } from './actions';

export default function CategoryRow({ category }: { category: { id: string, name: string } }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('id', category.id);
    formData.append('name', name);
    await updateCategory(formData);
    setIsEditing(false);
    setLoading(false);
  };

  if (isEditing) {
    return (
      <tr className="hover:bg-gray-50/80 transition-colors">
        <td className="px-6 py-4 whitespace-nowrap">
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto"
            autoFocus
          />
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-1">
          <button onClick={handleSave} disabled={loading} className="text-green-600 hover:text-green-800 p-2 hover:bg-green-50 rounded-lg disabled:opacity-50" title="Guardar">
            <Check className="w-4 h-4" />
          </button>
          <button onClick={() => { setIsEditing(false); setName(category.name); }} disabled={loading} className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg" title="Cancelar">
            <X className="w-4 h-4" />
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-gray-50/80 transition-colors">
      <td className="px-8 py-5 whitespace-nowrap">
        <div className="text-base font-bold text-gray-900">{category.name}</div>
      </td>
      <td className="px-8 py-5 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2">
        <button onClick={() => setIsEditing(true)} className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg" title="Editar">
          <Edit2 className="w-5 h-5" />
        </button>
        <button onClick={async () => {
          if (confirm('¿Seguro que deseas eliminar esta categoría? (Los equipos asociados podrían verse afectados)')) {
            await deleteCategory(category.id);
          }
        }} className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg" title="Eliminar">
          <Trash2 className="w-5 h-5" />
        </button>
      </td>
    </tr>
  );
}

// Componente para la vista móvil (Tarjeta)
export function CategoryCard({ category }: { category: { id: string, name: string } }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('id', category.id);
    formData.append('name', name);
    await updateCategory(formData);
    setIsEditing(false);
    setLoading(false);
  };

  return (
    <div className="bg-white p-3.5 rounded-lg shadow-sm border border-gray-100 relative">
      {isEditing ? (
        <div className="space-y-2">
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto"
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => { setIsEditing(false); setName(category.name); }} disabled={loading} className="text-gray-600 bg-gray-100 px-3 py-1.5 rounded-md text-sm font-medium">Cancelar</button>
            <button onClick={handleSave} disabled={loading} className="text-white bg-green-600 px-3 py-1.5 rounded-md text-sm font-medium">Guardar</button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-gray-900 text-base">{category.name}</h4>
          <div className="flex items-center gap-1">
            <button onClick={() => setIsEditing(true)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
              <Edit2 className="w-4 h-4" />
            </button>
            <button onClick={async () => {
              if (confirm('¿Seguro que deseas eliminar esta categoría?')) {
                await deleteCategory(category.id);
              }
            }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
