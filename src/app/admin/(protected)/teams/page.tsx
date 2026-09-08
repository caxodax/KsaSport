import { getServiceSupabase } from '@/lib/supabase';
import TeamDashboard from './TeamDashboard';

export const revalidate = 0;

export default async function TeamsPage() {
  const supabase = getServiceSupabase();

  // 1. Equipos registrados
  const { data: teams, error } = await supabase
    .from('teams')
    .select('id, name, category, logo_url, created_at')
    .order('name');

  // 2. Disciplinas/Categorías disponibles
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .order('name');

  // 3. Atletas para calcular nómina por equipo
  const { data: athletes } = await supabase
    .from('athletes')
    .select('id, team_id');

  // Agrupar conteo de atletas por equipo
  const athletesCountMap: Record<string, number> = {};
  athletes?.forEach(a => {
    if (a.team_id) {
      athletesCountMap[a.team_id] = (athletesCountMap[a.team_id] || 0) + 1;
    }
  });

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      {error && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-2xl text-sm font-medium">
          <strong>Aviso de conexión:</strong> {error.message}.
        </div>
      )}

      <TeamDashboard
        initialTeams={teams || []}
        categories={categories || []}
        athletesCountMap={athletesCountMap}
      />
    </div>
  );
}
