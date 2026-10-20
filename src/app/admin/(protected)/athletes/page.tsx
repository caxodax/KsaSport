import { getServiceSupabase } from '@/lib/supabase';
import { checkAdminPermission } from '@/lib/auth-admin';
import AthleteDashboard from './AthleteDashboard';
import { cleanCedula } from '@/lib/cedula';
import { getCachedTeams, getCachedCategories } from '@/lib/catalogCache';

export const revalidate = 0;

export default async function AthletesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { user, permissions } = await checkAdminPermission('view_roster');
  const isSuperAdmin = permissions.includes('manage_catalog');
  const supabase = getServiceSupabase();
  
  // Si no es superadmin, buscar su equipo en la tabla staff
  let coachTeamId: string | null = null;
  if (!isSuperAdmin && user) {
    const { data: staffData } = await supabase.from('staff').select('team_id').eq('user_id', user.id).single();
    if (staffData?.team_id) {
      coachTeamId = staffData.team_id;
    }
  }

  const resolvedParams = await searchParams;

  // Extraer parámetros de búsqueda
  const query = typeof resolvedParams.query === 'string' ? resolvedParams.query : '';
  const teamFilter = typeof resolvedParams.team === 'string' ? resolvedParams.team : '';
  const categoryFilter = typeof resolvedParams.category === 'string' ? resolvedParams.category : '';
  const statusFilter = typeof resolvedParams.status === 'string' ? resolvedParams.status : '';
  
  // Paginación optimizada a 20 por página
  const page = typeof resolvedParams.page === 'string' ? Number(resolvedParams.page) : 1;
  const pageSize = 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Datos para los selectores de filtros y el formulario (con caché en memoria de 300s)
  const [teamsData, categoriesData] = await Promise.all([
    getCachedTeams(),
    getCachedCategories(),
  ]);

  // Consulta de Atletas con Filtros y Paginación
  const selectQuery = categoryFilter
    ? 'id, name, cedula, phone, status, team_id, position, stats_avg, stats_hits, stats_rbi, stats_runs, paid_until, has_alliance, avatar_url, user_id, teams!inner(id, name, category)'
    : 'id, name, cedula, phone, status, team_id, position, stats_avg, stats_hits, stats_rbi, stats_runs, paid_until, has_alliance, avatar_url, user_id, teams(id, name, category)';

  let athletesQuery = supabase
    .from('athletes')
    .select(selectQuery, { count: 'exact' });

  // Forzar el filtro si NO es superadmin
  if (!isSuperAdmin) {
    athletesQuery = athletesQuery.eq('team_id', coachTeamId || '00000000-0000-0000-0000-000000000000');
  }

  if (query) {
    const cleanQ = cleanCedula(query);
    if (cleanQ && cleanQ !== query) {
      athletesQuery = athletesQuery.or(`name.ilike.%${query}%,cedula.ilike.%${cleanQ}%,cedula.ilike.%${query}%`);
    } else {
      athletesQuery = athletesQuery.or(`name.ilike.%${query}%,cedula.ilike.%${query}%`);
    }
  }
  if (teamFilter && !coachTeamId) {
    athletesQuery = athletesQuery.eq('team_id', teamFilter);
  }
  if (categoryFilter) {
    athletesQuery = athletesQuery.eq('teams.category', categoryFilter);
  }
  if (statusFilter) {
    if (statusFilter === 'Exonerado' || statusFilter === 'Alianza') {
      athletesQuery = athletesQuery.eq('has_alliance', true);
    } else {
      athletesQuery = athletesQuery.eq('status', statusFilter);
    }
  }

  // Filtro de Registro en la App Móvil / Portal
  const portalFilter = typeof resolvedParams.portal === 'string' ? resolvedParams.portal : '';
  if (portalFilter === 'registered') {
    athletesQuery = athletesQuery.not('user_id', 'is', null);
  } else if (portalFilter === 'unregistered') {
    athletesQuery = athletesQuery.is('user_id', null);
  }

  // Métricas globales de adopción en la app
  let registeredQuery = supabase.from('athletes').select('id', { count: 'exact', head: true }).not('user_id', 'is', null);
  let totalAllQuery = supabase.from('athletes').select('id', { count: 'exact', head: true });
  if (!isSuperAdmin && coachTeamId) {
    registeredQuery = registeredQuery.eq('team_id', coachTeamId);
    totalAllQuery = totalAllQuery.eq('team_id', coachTeamId);
  }
  const [{ count: registeredCount }, { count: totalAthletesCount }, { data: athletes, error, count }] = await Promise.all([
    registeredQuery,
    totalAllQuery,
    athletesQuery.order('created_at', { ascending: false }).range(from, to)
  ]);

  const totalPages = count ? Math.ceil(count / pageSize) : 0;

  return (
    <div className="min-h-full bg-slate-100/70 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {error && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-2xl text-sm font-medium shadow-sm">
            <strong>Aviso de conexión:</strong> {error.message}.
          </div>
        )}

        <AthleteDashboard
          initialAthletes={(athletes as any) || []}
          teams={(teamsData as any) || []}
          categories={(categoriesData as any) || []}
          isSuperAdmin={Boolean(isSuperAdmin)}
          coachTeamId={coachTeamId}
          totalCount={count || 0}
          totalPages={totalPages}
          currentPage={page}
          resolvedParams={resolvedParams}
          registeredCount={registeredCount || 0}
          totalAthletes={totalAthletesCount || 0}
        />
      </div>
    </div>
  );
}
