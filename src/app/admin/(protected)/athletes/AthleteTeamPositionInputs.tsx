'use client'

import { useState } from 'react';
import { normalizePositions, PositionItem } from '@/lib/positions';

interface TeamItem {
  id: string;
  name: string;
  category: string;
}

interface CategoryItem {
  id?: string;
  name: string;
  positions?: any;
}

export default function AthleteTeamPositionInputs({
  teams,
  categories,
  coachTeamId = null
}: {
  teams: TeamItem[];
  categories: CategoryItem[];
  coachTeamId?: string | null;
}) {
  const [selectedTeamId, setSelectedTeamId] = useState<string>(coachTeamId || '');

  const currentTeam = teams.find(t => t.id === selectedTeamId);
  const currentCategory = categories.find(c => c.name === currentTeam?.category);
  const availablePositions: PositionItem[] = normalizePositions(currentCategory?.positions);

  return (
    <>
      {coachTeamId ? (
        <input type="hidden" name="team_id" value={coachTeamId} />
      ) : (
        <div className="flex-1 min-w-[160px]">
          <label htmlFor="team_id" className="block text-sm font-medium text-gray-700 mb-1">
            Equipo
          </label>
          <select 
            id="team_id" 
            name="team_id" 
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto bg-white"
          >
            <option value="">Seleccionar Equipo</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
            ))}
          </select>
        </div>
      )}

      {/* Posición dependiente de la categoría */}
      <div className="w-full sm:w-44">
        <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
          Posición
        </label>
        <select 
          id="position" 
          name="position"
          disabled={!selectedTeamId || availablePositions.length === 0}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto bg-white disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200"
        >
          <option value="">
            {!selectedTeamId ? 'Elige equipo primero' : availablePositions.length === 0 ? 'No aplica' : 'Posición (Opcional)'}
          </option>
          {availablePositions.map((pos) => (
            <option key={pos.code} value={pos.code}>
              {pos.code} - {pos.name}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
