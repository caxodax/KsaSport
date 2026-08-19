'use client'

import { useState } from 'react';
import { Trash2, Edit2, Check, X } from 'lucide-react';
import { deleteStaff, updateStaff } from './actions';

export default function StaffRow({ 
  staffMember, 
  teams 
}: { 
  staffMember: { id: string, name: string, cedula: string, phone: string, role: string, team_id: string, teams?: { name: string } | null },
  teams: { id: string, name: string }[]
}) {
  const [isEditing, setIsEditing] = useState(false);
  
  const [name, setName] = useState(staffMember.name);
  const [cedula, setCedula] = useState(staffMember.cedula);
  const [phone, setPhone] = useState(staffMember.phone || '');
  const [teamId, setTeamId] = useState(staffMember.team_id || '');
  const [role, setRole] = useState(staffMember.role);
  
  const [loading, setLoading] = useState(false);

  const roles = ["Mánager", "Entrenador", "Asistente Técnico", "Preparador Físico", "Delegado", "Kinesiólogo"];

  const handleSave = async () => {
    if (!name.trim() || !cedula.trim()) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('id', staffMember.id);
    formData.append('name', name);
    formData.append('cedula', cedula);
    formData.append('phone', phone);
    formData.append('team_id', teamId);
    formData.append('role', role);
    
    await updateStaff(formData);
    setIsEditing(false);
    setLoading(false);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setName(staffMember.name);
    setCedula(staffMember.cedula);
    setPhone(staffMember.phone || '');
    setTeamId(staffMember.team_id || '');
    setRole(staffMember.role);
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
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto"
          >
            {roles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <select 
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto"
          >
            <option value="">Sin equipo asignado</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
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
        <div className="text-sm font-bold text-gray-900">{staffMember.name}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-500">{staffMember.cedula}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-500">{staffMember.phone || '-'}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
          {staffMember.role}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
          {staffMember.teams?.name || 'No Asignado'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-1">
        <button onClick={() => setIsEditing(true)} className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded-md" title="Editar">
          <Edit2 className="w-4 h-4" />
        </button>
        <button onClick={async () => {
            if (confirm('¿Seguro que deseas eliminar a esta persona del staff?')) {
              await deleteStaff(staffMember.id);
            }
        }} className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-md" title="Eliminar">
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}

export function StaffCard({ 
  staffMember,
  teams 
}: { 
  staffMember: { id: string, name: string, cedula: string, phone: string, role: string, team_id: string, teams?: { name: string } | null },
  teams: { id: string, name: string }[] 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(staffMember.name);
  const [cedula, setCedula] = useState(staffMember.cedula);
  const [phone, setPhone] = useState(staffMember.phone || '');
  const [teamId, setTeamId] = useState(staffMember.team_id || '');
  const [role, setRole] = useState(staffMember.role);
  const [loading, setLoading] = useState(false);

  const roles = ["Mánager", "Entrenador", "Asistente Técnico", "Preparador Físico", "Delegado", "Kinesiólogo"];

  const handleSave = async () => {
    if (!name.trim() || !cedula.trim()) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('id', staffMember.id);
    formData.append('name', name);
    formData.append('cedula', cedula);
    formData.append('phone', phone);
    formData.append('team_id', teamId);
    formData.append('role', role);
    await updateStaff(formData);
    setIsEditing(false);
    setLoading(false);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setName(staffMember.name);
    setCedula(staffMember.cedula);
    setPhone(staffMember.phone || '');
    setTeamId(staffMember.team_id || '');
    setRole(staffMember.role);
  }

  return (
    <div className={`bg-white p-3.5 rounded-lg shadow-sm border-l-4 relative border-kasa-vinotinto/80`}>
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
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-1/2 rounded-md border border-gray-300 px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto"
            >
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select 
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="w-1/2 rounded-md border border-gray-300 px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto"
            >
              <option value="">Sin equipo</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
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
            <h4 className="font-bold text-gray-900 text-base leading-tight">{staffMember.name}</h4>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <p className="text-xs text-gray-500">{staffMember.cedula}</p>
              {staffMember.phone && <span className="text-xs text-gray-400 px-1 border-l border-gray-300">{staffMember.phone}</span>}
              <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                {staffMember.teams?.name || 'No asignado'}
              </span>
            </div>
            <span className={`mt-2 px-2 py-0.5 inline-flex text-[10px] uppercase font-bold rounded-full border bg-purple-50 text-purple-700 border-purple-200`}>
              {staffMember.role}
            </span>
          </div>
          <div className="flex flex-col gap-1 items-end ml-2">
            <button onClick={() => setIsEditing(true)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
              <Edit2 className="w-4 h-4" />
            </button>
            <button onClick={async () => {
              if (confirm('¿Seguro que deseas eliminar a esta persona del staff?')) {
                await deleteStaff(staffMember.id);
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
