'use server'

import { createClient } from '@/lib/supabase/server'
import { getServiceSupabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function loginAdmin(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()
  const adminSupabase = getServiceSupabase()

  // 1. Iniciar sesión en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError || !authData.user) {
    return { error: 'Credenciales inválidas o error de conexión.' }
  }

  // 2. Verificar si el usuario es un administrador autorizado
  const { data: adminUser, error: adminError } = await adminSupabase
    .from('admin_users')
    .select('role_id')
    .eq('id', authData.user.id)
    .single()

  if (adminError || !adminUser) {
    // Si no está en la tabla admin_users, cerramos sesión inmediatamente
    await supabase.auth.signOut()
    return { error: 'Acceso Denegado: No tienes permisos de administrador.' }
  }

  revalidatePath('/admin')
  redirect('/admin/dashboard')
}

export async function logoutAdmin() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}
