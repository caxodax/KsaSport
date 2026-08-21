import { getServiceSupabase } from '@/lib/supabase';
import { createClient } from '@/lib/supabase/server';
import { checkAdminPermission } from '@/lib/auth-admin';
import LineupClientWrapper from './LineupClientWrapper';

export const revalidate = 0;

export default async function LineupPage() {
  await checkAdminPermission('view_roster');
  const supabase = getServiceSupabase();
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();

  // Buscar permisos y rol
  const { data: adminUser } = await supabase.from('admin_users').select('role_id, admin_roles(name, permissions)').eq('id', user?.id).single();
  const isSuperAdmin = (adminUser?.admin_roles as any)?.permissions?.includes('manage_catalog');

  let coachTeamId: string | null = null;
  let teamName = "Academia Completa";

  if (!isSuperAdmin && user) {
    const { data: staffData } = await supabase.from('staff').select('team_id').eq('user_id', user.id).single();
    if (staffData?.team_id) {
      coachTeamId = staffData.team_id;
      const { data: teamInfo } = await supabase.from('teams').select('name').eq('id', coachTeamId).single();
      teamName = teamInfo?.name || "Tu Equipo";
    }
  }

  // Cargar atletas (agregamos batting_order)
  let athletesQuery = supabase.from('athletes').select('id, name, position, stats_avg, phone, batting_order');
  
  if (!isSuperAdmin) {
    athletesQuery = athletesQuery.eq('team_id', coachTeamId || '00000000-0000-0000-0000-000000000000');
  } else {
    // Si es super admin y quiere ver algo, tal vez deberiamos filtrar por un equipo o mostrar todos. 
    // Por ahora mostramos todos, agrupados.
  }

  const { data: athletes } = await athletesQuery.order('name');

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full flex flex-col h-full">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Alineación Interactiva</h1>
          <p className="text-gray-500 mt-1">
            {isSuperAdmin ? 'Mostrando jugadores de todos los equipos.' : `Visualizando Roster Oficial: ${teamName}`}
          </p>
        </div>
      </div>

      <div className="flex-1 w-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <LineupClientWrapper athletes={athletes || []} />
      </div>
    </div>
  );
}
