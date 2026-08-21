'use client'

import { useState } from 'react';
import { Trash2, Edit2, Check, X } from 'lucide-react';
import { deleteAthlete, updateAthlete } from './actions';

export default function AthleteRow({ 
  athlete, 
  teams,
  isSuperAdmin = true
}: { 
  athlete: { id: string, name: string, cedula: string, phone: string, status: string, team_id: string, teams?: { name: string } | null, paid_until?: string | null, position?: string | null, stats_avg?: number | null },
  teams: { id: string, name: string }[],
  isSuperAdmin?: boolean
}) {
  const [isEditing, setIsEditing] = useState(false);
  
  const [name, setName] = useState(athlete.name);
  const [cedula, setCedula] = useState(athlete.cedula);
  const [phone, setPhone] = useState(athlete.phone || '');
  const [teamId, setTeamId] = useState(athlete.team_id || '');
  const [status, setStatus] = useState(athlete.status);
  const [paidUntil, setPaidUntil] = useState(athlete.paid_until || '');
  const [position, setPosition] = useState(athlete.position || '');
  const [statsAvg, setStatsAvg] = useState(athlete.stats_avg?.toString() || '');
  
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
    
    if (isSuperAdmin) {
      formData.append('status', status);
      if (paidUntil) formData.append('paid_until', paidUntil);
    }
    
    if (position) formData.append('position', position);
    if (statsAvg) formData.append('stats_avg', statsAvg);
    
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
    setPaidUntil(athlete.paid_until || '');
    setPosition(athlete.position || '');
    setStatsAvg(athlete.stats_avg?.toString() || '');
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
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-1/2 rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto"
              >
                <option value="">Posición</option>
                <option value="P">Pitcher (P)</option>
                <option value="C">Catcher (C)</option>
                <option value="1B">1ra Base (1B)</option>
                <option value="2B">2da Base (2B)</option>
                <option value="3B">3ra Base (3B)</option>
                <option value="SS">Shortstop (SS)</option>
                <option value="SF">Short Field (SF)</option>
                <option value="LF">Left Field (LF)</option>
                <option value="LCF">Left Center (LCF)</option>
                <option value="CF">Center Field (CF)</option>
                <option value="2F">Second Field (2F)</option>
                <option value="RCF">Right Center (RCF)</option>
                <option value="RF">Right Field (RF)</option>
              </select>
              <input 
                type="number" 
                step="0.001"
                value={statsAvg}
                onChange={(e) => setStatsAvg(e.target.value)}
                className="w-1/2 rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto"
                placeholder="AVG (Ej: 0.350)"
              />
            </div>
            {isSuperAdmin && (
              <div className="flex gap-2">
                <select 
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-1/2 rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto"
                >
                  <option value="Solvente">Solvente</option>
                  <option value="Moroso">Moroso</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
                <input 
                  type="date" 
                  value={paidUntil}
                  onChange={(e) => setPaidUntil(e.target.value)}
                  className="w-1/2 rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto"
                  title="Solvente hasta"
                />
              </div>
            )}
          </div>
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
        <div className="flex flex-col gap-1">
          {athlete.position && (
            <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded w-max">
              Pos: {athlete.position}
            </span>
          )}
          {athlete.stats_avg != null && (
            <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded w-max">
              AVG: {athlete.stats_avg}
            </span>
          )}
          <span className={`mt-1 px-2 py-1 inline-flex text-xs font-bold rounded-full border shadow-sm w-max
            ${athlete.status === 'Solvente' ? 'bg-green-50 text-green-700 border-green-200' : 
              athlete.status === 'Moroso' ? 'bg-red-50 text-red-700 border-red-200' : 
              'bg-gray-50 text-gray-700 border-gray-200'}`}>
            {athlete.status}
          </span>
          {athlete.paid_until && (
            <span className="text-[10px] text-gray-500 font-medium">
              Hasta: {new Date(athlete.paid_until).toLocaleDateString('es-ES')}
            </span>
          )}
        </div>
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
  teams,
  isSuperAdmin = true
}: { 
  athlete: { id: string, name: string, cedula: string, phone: string, status: string, team_id: string, teams?: { name: string } | null, paid_until?: string | null, position?: string | null, stats_avg?: number | null },
  teams: { id: string, name: string }[],
  isSuperAdmin?: boolean
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(athlete.name);
  const [cedula, setCedula] = useState(athlete.cedula);
  const [phone, setPhone] = useState(athlete.phone || '');
  const [teamId, setTeamId] = useState(athlete.team_id || '');
  const [status, setStatus] = useState(athlete.status);
  const [paidUntil, setPaidUntil] = useState(athlete.paid_until || '');
  const [position, setPosition] = useState(athlete.position || '');
  const [statsAvg, setStatsAvg] = useState(athlete.stats_avg?.toString() || '');
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
    
    if (isSuperAdmin) {
      formData.append('status', status);
      if (paidUntil) formData.append('paid_until', paidUntil);
    }
    
    if (position) formData.append('position', position);
    if (statsAvg) formData.append('stats_avg', statsAvg);
    
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
    setPaidUntil(athlete.paid_until || '');
    setPosition(athlete.position || '');
    setStatsAvg(athlete.stats_avg?.toString() || '');
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
          </div>
          <div className="flex gap-2">
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-1/2 rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto"
            >
              <option value="">Posición</option>
              <option value="P">Pitcher (P)</option>
              <option value="C">Catcher (C)</option>
              <option value="1B">1ra Base (1B)</option>
              <option value="2B">2da Base (2B)</option>
              <option value="3B">3ra Base (3B)</option>
              <option value="SS">Shortstop (SS)</option>
              <option value="SF">Short Field (SF)</option>
              <option value="LF">Left Field (LF)</option>
              <option value="LCF">Left Center (LCF)</option>
              <option value="CF">Center Field (CF)</option>
              <option value="2F">Second Field (2F)</option>
              <option value="RCF">Right Center (RCF)</option>
              <option value="RF">Right Field (RF)</option>
            </select>
            <input 
              type="number" 
              step="0.001"
              value={statsAvg}
              onChange={(e) => setStatsAvg(e.target.value)}
              className="w-1/2 rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto"
              placeholder="AVG: Ej 0.350"
            />
          </div>
          
          {isSuperAdmin && (
            <div className="flex gap-2">
              <select 
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-1/3 rounded-md border border-gray-300 px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto"
              >
                <option value="Solvente">Solvente</option>
                <option value="Moroso">Moroso</option>
                <option value="Inactivo">Inactivo</option>
              </select>
              <input 
                type="date" 
                value={paidUntil}
                onChange={(e) => setPaidUntil(e.target.value)}
                className="w-2/3 rounded-md border border-gray-300 px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto"
                title="Pagado hasta"
              />
            </div>
          )}
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
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2 py-0.5 inline-flex text-[10px] uppercase font-bold rounded-full border
                ${athlete.status === 'Solvente' ? 'bg-green-50 text-green-700 border-green-200' : 
                  athlete.status === 'Moroso' ? 'bg-red-50 text-red-700 border-red-200' : 
                  'bg-gray-50 text-gray-700 border-gray-200'}`}>
                {athlete.status}
              </span>
              {athlete.paid_until && (
                <span className="text-[10px] text-gray-500 font-medium">
                  {athlete.status === 'Solvente' ? 'Hasta' : 'Desde'}: {new Date(athlete.paid_until).toLocaleDateString('es-ES')}
                </span>
              )}
            </div>
            
            <div className="flex gap-2 mt-2">
              {athlete.position && (
                <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded w-max">
                  Pos: {athlete.position}
                </span>
              )}
              {athlete.stats_avg != null && (
                <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded w-max">
                  AVG: {athlete.stats_avg}
                </span>
              )}
            </div>
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
