'use client'

import { useState } from 'react';
import { Trash2, Edit2, Check, X } from 'lucide-react';
import { deleteAthlete, updateAthlete } from './actions';

export default function AthleteRow({ 
  athlete, 
  teams 
}: { 
  athlete: { id: string, name: string, cedula: string, phone: string, status: string, team_id: string, teams?: { name: string } | null },
  teams: { id: string, name: string }[]
}) {
  const [isEditing, setIsEditing] = useState(false);
  
  const [name, setName] = useState(athlete.name);
  const [cedula, setCedula] = useState(athlete.cedula);
  const [phone, setPhone] = useState(athlete.phone || '');
  const [teamId, setTeamId] = useState(athlete.team_id || '');
  const [status, setStatus] = useState(athlete.status);
  
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !cedula.trim()) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('id', athlete.id);
    formData.append('name', name);
    formData.append('cedula', cedula);
    formData.append('phone', phone);
    formData.append('team_id', teamId);
    formData.append('status', status);
    
    await updateAthlete(formData);
    setIsEditing(false);
    setLoading(false);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setName(athlete.name);
    setCedula(athlete.cedula);
    setPhone(athlete.phone || '');
    setTeamId(athlete.team_id || '');
    setStatus(athlete.status);
  }

  if (isEditing) {
    return (
      <tr className="hover:bg-gray-50/80 transition-colors">
        <td className="px-6 py-4 whitespace-nowrap">
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto"
            autoFocus
          />
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <input 
            type="text" 
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto"
          />
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <input 
            type="text" 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto"
            placeholder="Opcional"
          />
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <select 
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto"
          >
            <option value="">Sin equipo</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <select 
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto"
          >
            <option value="Solvente">Solvente</option>
            <option value="Moroso">Moroso</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-1">
          <button onClick={handleSave} disabled={loading} className="text-green-600 hover:text-green-800 p-1.5 hover:bg-green-50 rounded-md disabled:opacity-50" title="Guardar">
            <Check className="w-4 h-4" />
          </button>
          <button onClick={cancelEdit} disabled={loading} className="text-gray-500 hover:text-gray-700 p-1.5 hover:bg-gray-100 rounded-md" title="Cancelar">
            <X className="w-4 h-4" />
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-gray-50/80 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-bold text-gray-900">{athlete.name}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-500">{athlete.cedula}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-500">{athlete.phone || '-'}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
          {athlete.teams?.name || 'Sin equipo'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 py-1 inline-flex text-xs font-bold rounded-full border shadow-sm
          ${athlete.status === 'Solvente' ? 'bg-green-50 text-green-700 border-green-200' : 
            athlete.status === 'Moroso' ? 'bg-red-50 text-red-700 border-red-200' : 
            'bg-gray-50 text-gray-700 border-gray-200'}`}>
          {athlete.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-1">
        <button onClick={() => setIsEditing(true)} className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded-md" title="Editar">
          <Edit2 className="w-4 h-4" />
        </button>
        <button onClick={async () => {
            if (confirm('¿Seguro que deseas eliminar a este atleta?')) {
              await deleteAthlete(athlete.id);
            }
        }} className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-md" title="Eliminar">
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}

export function AthleteCard({ 
  athlete,
  teams 
}: { 
  athlete: { id: string, name: string, cedula: string, phone: string, status: string, team_id: string, teams?: { name: string } | null },
  teams: { id: string, name: string }[] 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(athlete.name);
  const [cedula, setCedula] = useState(athlete.cedula);
  const [phone, setPhone] = useState(athlete.phone || '');
  const [teamId, setTeamId] = useState(athlete.team_id || '');
  const [status, setStatus] = useState(athlete.status);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !cedula.trim()) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('id', athlete.id);
    formData.append('name', name);
    formData.append('cedula', cedula);
    formData.append('phone', phone);
    formData.append('team_id', teamId);
    formData.append('status', status);
    await updateAthlete(formData);
    setIsEditing(false);
    setLoading(false);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setName(athlete.name);
    setCedula(athlete.cedula);
    setPhone(athlete.phone || '');
    setTeamId(athlete.team_id || '');
    setStatus(athlete.status);
  }

  return (
    <div className={`bg-white p-3.5 rounded-lg shadow-sm border-l-4 relative ${athlete.status === 'Solvente' ? 'border-green-500' : athlete.status === 'Moroso' ? 'border-red-500' : 'border-gray-400'}`}>
      {isEditing ? (
        <div className="space-y-2">
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto"
            placeholder="Nombre Completo"
          />
          <div className="flex gap-2">
            <input 
              type="text" 
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              className="w-1/2 rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto"
              placeholder="Cédula"
            />
            <input 
              type="text" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-1/2 rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto"
              placeholder="Teléfono"
            />
          </div>
          <div className="flex gap-2">
            <select 
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="w-1/2 rounded-md border border-gray-300 px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto"
            >
              <option value="">Sin equipo</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <select 
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-1/2 rounded-md border border-gray-300 px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto"
            >
              <option value="Solvente">Solvente</option>
              <option value="Moroso">Moroso</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={cancelEdit} disabled={loading} className="text-gray-600 bg-gray-100 px-3 py-1.5 rounded-md text-sm font-medium">Cancelar</button>
            <button onClick={handleSave} disabled={loading} className="text-white bg-green-600 px-3 py-1.5 rounded-md text-sm font-medium">Guardar</button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-bold text-gray-900 text-base leading-tight">{athlete.name}</h4>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <p className="text-xs text-gray-500">{athlete.cedula}</p>
              {athlete.phone && <span className="text-xs text-gray-400 px-1 border-l border-gray-300">{athlete.phone}</span>}
              <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                {athlete.teams?.name || 'Sin equipo'}
              </span>
            </div>
            <span className={`mt-2 px-2 py-0.5 inline-flex text-[10px] uppercase font-bold rounded-full border
              ${athlete.status === 'Solvente' ? 'bg-green-50 text-green-700 border-green-200' : 
                athlete.status === 'Moroso' ? 'bg-red-50 text-red-700 border-red-200' : 
                'bg-gray-50 text-gray-700 border-gray-200'}`}>
              {athlete.status}
            </span>
          </div>
          <div className="flex flex-col gap-1 items-end ml-2">
            <button onClick={() => setIsEditing(true)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
              <Edit2 className="w-4 h-4" />
            </button>
            <button onClick={async () => {
              if (confirm('¿Seguro que deseas eliminar a esta atleta?')) {
                await deleteAthlete(athlete.id);
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
