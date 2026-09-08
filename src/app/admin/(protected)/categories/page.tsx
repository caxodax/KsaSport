import { getServiceSupabase } from '@/lib/supabase';
import CategoryDashboard from './CategoryDashboard';

export const revalidate = 0;

export default async function CategoriesPage() {
  const supabase = getServiceSupabase();
  
  // 1. Categorías con posiciones dinámicas
  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, name, positions, created_at')
    .order('name');

  // 2. Conteo de equipos por categoría
  const { data: teams } = await supabase
    .from('teams')
    .select('id, category');

  // 3. Conteo de atletas activos por categoría
  const { data: athletes } = await supabase
    .from('athletes')
    .select('id, team_id, teams!inner(category)')
    .in('status', ['Solvente', 'Moroso']);

  // Agrupar conteo de equipos por nombre de categoría
  const teamsCountMap: Record<string, number> = {};
  teams?.forEach(t => {
    if (t.category) {
      teamsCountMap[t.category] = (teamsCountMap[t.category] || 0) + 1;
    }
  });

  // Agrupar conteo de atletas activos por categoría
  const athletesCountMap: Record<string, number> = {};
  athletes?.forEach(a => {
    const cat = (a.teams as any)?.category;
    if (cat) {
      athletesCountMap[cat] = (athletesCountMap[cat] || 0) + 1;
    }
  });

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      {error && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-2xl text-sm font-medium">
          <strong>Aviso de conexión:</strong> {error.message}.
        </div>
      )}

      <CategoryDashboard 
        initialCategories={categories || []}
        teamsCountMap={teamsCountMap}
        athletesCountMap={athletesCountMap}
      />
    </div>
  );
}
