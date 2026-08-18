'use client'

import { useState } from 'react';
import { Trash2, Edit2, Check, X } from 'lucide-react';
import { deleteTeam, updateTeam } from './actions';

export default function TeamRow({ 
  team, 
  categories 
}: { 
  team: { id: string, name: string, category: string },
  categories: { name: string }[]
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(team.name);
  const [category, setCategory] = useState(team.category);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !category) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('id', team.id);
    formData.append('name', name);
    formData.append('category', category);
    await updateTeam(formData);
    setIsEditing(false);
    setLoading(false);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setName(team.name);
    setCategory(team.category);
  }

  if (isEditing) {
    return (
      <tr className="hover:bg-gray-50/80 transition-colors">
        <td className="px-8 py-5 whitespace-nowrap">
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-1 text-base outline-none focus:ring-2 focus:ring-kasa-vinotinto"
            autoFocus
          />
        </td>
        <td className="px-8 py-5 whitespace-nowrap">
          <select 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto"
          >
            {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </td>
        <td className="px-8 py-5 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2">
          <button onClick={handleSave} disabled={loading} className="text-green-600 hover:text-green-800 p-2 hover:bg-green-50 rounded-lg disabled:opacity-50" title="Guardar">
            <Check className="w-5 h-5" />
          </button>
          <button onClick={cancelEdit} disabled={loading} className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg" title="Cancelar">
            <X className="w-5 h-5" />
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-gray-50/80 transition-colors">
      <td className="px-8 py-5 whitespace-nowrap">
        <div className="text-base font-bold text-gray-900">{team.name}</div>
      </td>
      <td className="px-8 py-5 whitespace-nowrap">
        <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
          {team.category}
        </span>
      </td>
      <td className="px-8 py-5 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2">
        <button onClick={() => setIsEditing(true)} className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg" title="Editar equipo">
          <Edit2 className="w-5 h-5" />
        </button>
        <button onClick={async () => {
            if (confirm('¿Seguro que deseas eliminar este equipo?')) {
              await deleteTeam(team.id);
            }
        }} className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg" title="Eliminar equipo">
          <Trash2 className="w-5 h-5" />
        </button>
      </td>
    </tr>
  );
}

export function TeamCard({ 
  team,
  categories 
}: { 
  team: { id: string, name: string, category: string },
  categories: { name: string }[] 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(team.name);
  const [category, setCategory] = useState(team.category);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !category) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('id', team.id);
    formData.append('name', name);
    formData.append('category', category);
    await updateTeam(formData);
    setIsEditing(false);
    setLoading(false);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setName(team.name);
    setCategory(team.category);
  }

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
          <select 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto"
          >
            {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={cancelEdit} disabled={loading} className="text-gray-600 bg-gray-100 px-3 py-1.5 rounded-md text-sm font-medium">Cancelar</button>
            <button onClick={handleSave} disabled={loading} className="text-white bg-green-600 px-3 py-1.5 rounded-md text-sm font-medium">Guardar</button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-gray-900 text-base">{team.name}</h4>
            <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
              {team.category}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setIsEditing(true)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
              <Edit2 className="w-4 h-4" />
            </button>
            <button onClick={async () => {
              if (confirm('¿Seguro que deseas eliminar este equipo?')) {
                await deleteTeam(team.id);
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
