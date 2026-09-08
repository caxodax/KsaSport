export interface PositionItem {
  code: string;
  name: string;
}

export const PRESET_POSITIONS: Record<string, { label: string; positions: PositionItem[] }> = {
  kickingball: {
    label: 'Kickingball (13)',
    positions: [
      { code: 'P', name: 'Pitcher' },
      { code: 'C', name: 'Catcher' },
      { code: '1B', name: 'Primera Base' },
      { code: '2B', name: 'Segunda Base' },
      { code: '3B', name: 'Tercera Base' },
      { code: 'SS', name: 'Shortstop' },
      { code: 'SF', name: 'Short Field' },
      { code: 'LF', name: 'Left Field' },
      { code: 'LCF', name: 'Left Center' },
      { code: 'CF', name: 'Center Field' },
      { code: '2F', name: 'Second Field' },
      { code: 'RCF', name: 'Right Center' },
      { code: 'RF', name: 'Right Field' }
    ]
  },
  futbol: {
    label: 'Fútbol Campo (10)',
    positions: [
      { code: 'POR', name: 'Portero' },
      { code: 'DFC', name: 'Defensa Central' },
      { code: 'LD', name: 'Lateral Derecho' },
      { code: 'LI', name: 'Lateral Izquierdo' },
      { code: 'MCD', name: 'Mediocampista Defensivo' },
      { code: 'MC', name: 'Mediocampista Central' },
      { code: 'MCO', name: 'Mediocampista Ofensivo' },
      { code: 'ED', name: 'Extremo Derecho' },
      { code: 'EI', name: 'Extremo Izquierdo' },
      { code: 'DC', name: 'Delantero Centro' }
    ]
  },
  futsal: {
    label: 'Fútbol Sala (5)',
    positions: [
      { code: 'POR', name: 'Portero' },
      { code: 'CIER', name: 'Cierre' },
      { code: 'ALA-D', name: 'Ala Derecha' },
      { code: 'ALA-I', name: 'Ala Izquierda' },
      { code: 'PIV', name: 'Pívot' }
    ]
  },
  voleibol: {
    label: 'Voleibol (6)',
    positions: [
      { code: 'COL', name: 'Colocador / Armador' },
      { code: 'REM', name: 'Rematador Exterior' },
      { code: 'OP', name: 'Opuesto' },
      { code: 'CEN', name: 'Central' },
      { code: 'LIB', name: 'Líbero' },
      { code: 'DEF', name: 'Especialista Defensivo' }
    ]
  }
};

export function normalizePositions(raw: any): PositionItem[] {
  if (!raw) return [];
  
  let list = raw;
  if (typeof raw === 'string') {
    try {
      list = JSON.parse(raw);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(list)) return [];

  return list
    .map((item: any) => {
      if (typeof item === 'string') {
        const trimmed = item.trim();
        return { code: trimmed.toUpperCase(), name: trimmed };
      }
      if (item && typeof item === 'object') {
        const code = String(item.code || item.name || '').trim().toUpperCase();
        const name = String(item.name || item.code || '').trim();
        return { code, name };
      }
      return null;
    })
    .filter((p): p is PositionItem => Boolean(p && p.code));
}
