import { createClient } from '@/lib/supabase/server'
import { getServiceSupabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'

export async function checkAdminPermission(requiredPermission?: string | string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
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
    redirect('/login')
  }

  const permissions: string[] = (adminUser.admin_roles as any)?.permissions || []
  const isSuperAdmin = adminUser.role_id === 'superadmin' || permissions.includes('manage_roles')

  if (requiredPermission && !isSuperAdmin) {
    const requiredList = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission]
    const hasPermission = requiredList.some(p => permissions.includes(p))
    if (!hasPermission) {
      redirect('/admin?error=unauthorized')
    }
  }

  return { user, permissions, role_id: adminUser.role_id, isSuperAdmin }
}
