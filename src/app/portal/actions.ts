'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getServiceSupabase } from '@/lib/supabase'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const supabase = await createClient()

  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: 'Credenciales inválidas.' }
  }

  // Verificar si ya tiene el perfil vinculado
  const adminSupabase = getServiceSupabase();
  const { data: athlete } = await adminSupabase
    .from('athletes')
    .select('id')
    .eq('user_id', data.user.id)
    .single();

  if (!athlete) {
    // Redirigir a vincular perfil
    redirect('/portal/link-profile')
  }

  revalidatePath('/portal/dashboard')
  redirect('/portal/dashboard')
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // En un MVP, al crear la cuenta hacemos sign in automático
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  
  if (signInError) {
    return { error: 'Cuenta creada exitosamente. Por favor, revisa tu bandeja de entrada y confirma tu correo electrónico antes de continuar.' }
  }
  
  // Como es una cuenta nueva, no tiene perfil de atleta vinculado
  redirect('/portal/link-profile')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/portal/login')
}

export async function linkProfile(formData: FormData) {
  const cedula = formData.get('cedula') as string
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No estás autenticado.' }
  }

  const adminSupabase = getServiceSupabase();
  
  // 1. Buscar si la cédula existe
  const { data: athlete, error: findError } = await adminSupabase
    .from('athletes')
    .select('id, user_id')
    .eq('cedula', cedula)
    .single();

  if (findError || !athlete) {
    return { error: 'No se encontró ninguna atleta con esta cédula en Kasa Sports. Contacta a administración.' }
  }

  // 2. Verificar si ya está vinculada a otra cuenta
  if (athlete.user_id && athlete.user_id !== user.id) {
    return { error: 'Esta cédula ya está vinculada a otra cuenta de correo.' }
  }

  // 3. Vincular
  const { error: updateError } = await adminSupabase
    .from('athletes')
    .update({ user_id: user.id })
    .eq('id', athlete.id);

  if (updateError) {
    return { error: 'Ocurrió un error al vincular el perfil.' }
  }

  revalidatePath('/portal/dashboard')
  redirect('/portal/dashboard')
}

export async function reportPayment(formData: FormData) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) return { error: 'No autorizado' }

  const adminSupabase = getServiceSupabase()
  
  const { data: athlete } = await adminSupabase
    .from('athletes')
    .select('id')
    .eq('user_id', session.user.id)
    .single()

  if (!athlete) return { error: 'Atleta no encontrado' }

  const amount = Number(formData.get('amount'))
  const method = formData.get('method') as string
  const concept = formData.get('concept') as string
  const reference = formData.get('reference_number') as string || null

  const { error } = await adminSupabase
    .from('payments')
    .insert({
      athlete_id: athlete.id,
      amount,
      currency: 'USD',
      method,
      concept,
      status: 'Pendiente',
      reference_number: reference
    })

  if (error) return { error: error.message }

  revalidatePath('/portal/dashboard')
  redirect('/portal/dashboard')
}
