import { checkAdminPermission } from '@/lib/auth-admin';
import { getServiceSupabase } from '@/lib/supabase';
import UsersDashboard from './UsersDashboard';
import { getCachedTeams } from '@/lib/catalogCache';

export const revalidate = 0;

export default async function UsersPage() {
  // 1. Seguridad estricta: Solo SuperAdmin con permiso manage_roles
  const { user } = await checkAdminPermission('manage_roles');
  const adminSupabase = getServiceSupabase();

  // 2. Asegurar que los roles intermedios existan en admin_roles
  await adminSupabase.from('admin_roles').upsert([
    { id: 'superadmin', name: 'Súper Administrador', permissions: ['view_roster', 'view_finances', 'manage_catalog', 'manage_settings', 'manage_roles'] },
    { id: 'treasurer', name: 'Tesorero / Finanzas', permissions: ['view_roster', 'view_finances'] },
    { id: 'coordinator', name: 'Coordinador Deportivo', permissions: ['view_roster', 'manage_catalog'] },
    { id: 'coach', name: 'Entrenador / Mánager', permissions: ['view_roster'] },
  ], { onConflict: 'id' });

  // 3. Obtener roles disponibles
  const { data: rolesData } = await adminSupabase
    .from('admin_roles')
    .select('id, name, permissions')
    .order('name');

  // 4. Obtener equipos
  const teamsData = await getCachedTeams();

  // 5. Obtener lista de usuarios administradores
  const { data: adminUsers } = await adminSupabase
    .from('admin_users')
    .select(`
      id,
      email,
      role_id,
      created_at,
      admin_roles ( id, name, permissions )
    `)
    .order('created_at', { ascending: false });

  // 6. Obtener staff técnico vinculado para mostrar equipo que dirigen
  const { data: staffData } = await adminSupabase
    .from('staff')
    .select('id, name, user_id, team_id, teams ( id, name, category )')
    .not('user_id', 'is', null);

  const enrichedUsers = (adminUsers || []).map((u: any) => {
    const matchedStaff = staffData?.find((s: any) => s.user_id === u.id);
    return {
      id: u.id,
      email: u.email,
      role_id: u.role_id,
      created_at: u.created_at,
      admin_roles: Array.isArray(u.admin_roles) ? u.admin_roles[0] : u.admin_roles,
      staff: matchedStaff ? {
        id: matchedStaff.id,
        name: matchedStaff.name,
        team_id: matchedStaff.team_id,
        teams: Array.isArray(matchedStaff.teams) ? matchedStaff.teams[0] : matchedStaff.teams,
      } : null,
    };
  });

  return (
    <UsersDashboard
      initialUsers={enrichedUsers}
      roles={(rolesData as any) || []}
      teams={teamsData}
      currentUserId={user.id}
    />
  );
}

