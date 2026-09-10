import { getServiceSupabase } from '@/lib/supabase';
import StaffDashboard from './StaffDashboard';

export const revalidate = 0;

export default async function StaffPage() {
  const supabase = getServiceSupabase();

  const [
    { data: staffData },
    { data: teamsData },
    { data: categoriesData }
  ] = await Promise.all([
    supabase
      .from('staff')
      .select('id, name, cedula, phone, role, team_id, teams!left(id, name, category, logo_url)')
      .order('created_at', { ascending: false }),
    supabase
      .from('teams')
      .select('id, name, category, logo_url')
      .order('name'),
    supabase
      .from('categories')
      .select('name')
      .order('name')
  ]);

  const categories = categoriesData?.map(c => c.name) || [];

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full">
      <StaffDashboard
        initialStaff={(staffData as any) || []}
        teams={(teamsData as any) || []}
        categories={categories}
      />
    </div>
  );
}
