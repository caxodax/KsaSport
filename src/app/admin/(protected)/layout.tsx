import Sidebar from './Sidebar';
import { createClient } from '@/lib/supabase/server';
import { getServiceSupabase } from '@/lib/supabase';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  // Verificar si es un admin registrado y obtener sus permisos
  const adminSupabase = getServiceSupabase()
  const { data: adminUser } = await adminSupabase
    .from('admin_users')
    .select(`
      email,
      role_id,
      admin_roles ( name, permissions )
    `)
    .eq('id', user.id)
    .single()

  if (!adminUser) {
    // Si entró con una cuenta normal de atleta a la fuerza, lo botamos
    await supabase.auth.signOut()
    redirect('/admin/login')
  }

  // Extraer permisos para inyectarlos en el Sidebar
  const permissions = (adminUser.admin_roles as any)?.permissions || []
  const roleName = (adminUser.admin_roles as any)?.name || 'Admin'
  
  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <Sidebar permissions={permissions} roleName={roleName} email={adminUser.email} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-gray-50">
        <div className="w-full flex-1 flex flex-col h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
