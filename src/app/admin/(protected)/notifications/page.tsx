import { getServiceSupabase } from '@/lib/supabase';
import { checkAdminPermission } from '@/lib/auth-admin';
import NotificationsHub from './NotificationsHub';

export const revalidate = 0;

export default async function NotificationsPage() {
  await checkAdminPermission('manage_settings');
  const supabase = getServiceSupabase();

  const [
    { count: subscriberCount },
    { count: athleteSubscriberCount },
    { data: logs },
    { data: teams },
    { data: athletes },
  ] = await Promise.all([
    supabase.from('push_subscriptions').select('*', { count: 'exact', head: true }),
    supabase.from('push_subscriptions').select('*', { count: 'exact', head: true }).not('athlete_id', 'is', null),
    supabase.from('push_notifications_log').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('teams').select('id, name, category').order('name'),
    supabase.from('athletes').select('id, name, cedula').order('name'),
  ]);

  const totalSent = logs?.reduce((sum, l) => sum + (l.sent_count || 0), 0) || 0;

  return (
    <div className="min-h-full bg-slate-100/70 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <NotificationsHub
          subscriberCount={subscriberCount || 0}
          athleteSubscriberCount={athleteSubscriberCount || 0}
          totalSentCount={totalSent}
          teams={teams || []}
          athletes={athletes || []}
          logs={logs || []}
        />
      </div>
    </div>
  );
}
