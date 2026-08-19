import { createClient } from '@/lib/supabase/server'
import { getServiceSupabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'

export async function checkAdminPermission(requiredPermission?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const adminSupabase = getServiceSupabase()
  const { data: adminUser } = await adminSupabase
    .from('admin_users')
    .select(`
      role_id,
      admin_roles ( permissions )
    `)
    .eq('id', user.id)
    .single()

  if (!adminUser) {
    await supabase.auth.signOut()
    redirect('/admin/login')
  }

  const permissions = (adminUser.admin_roles as any)?.permissions || []

  if (requiredPermission && !permissions.includes(requiredPermission)) {
    redirect('/admin?error=unauthorized')
  }

  return { user, permissions, role_id: adminUser.role_id }
}
