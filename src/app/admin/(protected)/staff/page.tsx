import { getServiceSupabase } from '@/lib/supabase';
import { checkAdminPermission } from '@/lib/auth-admin';
import StaffDashboard from './StaffDashboard';

export const revalidate = 0;

export default async function StaffPage() {
  const { isSuperAdmin } = await checkAdminPermission('manage_catalog');
  const supabase = getServiceSupabase();

  const [
    staffQueryRes,
    { data: teamsData },
    { data: categoriesData },
    { data: adminUsersData },
    { data: adminRolesData }
  ] = await Promise.all([
    supabase
      .from('staff')
      .select('id, name, cedula, phone, role, team_id, user_id, avatar_url, teams!left(id, name, category, logo_url)')
      .order('created_at', { ascending: false }),
    supabase
      .from('teams')
      .select('id, name, category, logo_url')
      .order('name'),
    supabase
      .from('categories')
      .select('name')
      .order('name'),
    supabase
      .from('admin_users')
      .select('id, email, role_id, admin_roles(id, name, permissions)'),
    supabase
      .from('admin_roles')
      .select('id, name, permissions')
  ]);

  let staffData: any[] | null = staffQueryRes.data;
  if (staffQueryRes.error && staffQueryRes.error.message.includes('avatar_url')) {
    const fallbackRes = await supabase
      .from('staff')
      .select('id, name, cedula, phone, role, team_id, user_id, teams!left(id, name, category, logo_url)')
      .order('created_at', { ascending: false });
    staffData = (fallbackRes.data || []).map((s: any) => ({ ...s, avatar_url: null }));
  }

  const categories = categoriesData?.map(c => c.name) || [];

  // Enriquecer cada miembro del staff con su cuenta web y permisos activos
  const enrichedStaff = (staffData || []).map((s: any) => {
    const matchedUser = adminUsersData?.find((u: any) => u.id === s.user_id);
    const roleObj = Array.isArray(matchedUser?.admin_roles) ? matchedUser?.admin_roles[0] : matchedUser?.admin_roles;
    const roleId = `staff_${s.id}`;
    const matchedRole = adminRolesData?.find((r: any) => r.id === roleId);

    const activePermissions = (roleObj?.permissions as string[]) || (matchedRole?.permissions as string[]) || [];

    return {
      ...s,
      roleConfigured: !!matchedRole,
      rolePermissions: (matchedRole?.permissions as string[]) || [],
      user: matchedUser ? {
        id: matchedUser.id,
        email: matchedUser.email,
        role_id: matchedUser.role_id,
        permissions: activePermissions
      } : null
    };
  });

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full">
      <StaffDashboard
        initialStaff={enrichedStaff}
        teams={(teamsData as any) || []}
        categories={categories}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
}
