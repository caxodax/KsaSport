'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getServiceSupabase } from '@/lib/supabase'
import { uploadImageToCloudflare } from '@/lib/cloudflare'

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

  revalidatePath('/gateway')
  redirect('/gateway')
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
  
  // 1. Buscar si la cédula existe en atletas
  const { data: athlete } = await adminSupabase
    .from('athletes')
    .select('id, user_id')
    .eq('cedula', cedula)
    .single();

  // 1.5 Buscar si existe en staff
  const { data: staff } = await adminSupabase
    .from('staff')
    .select('id, user_id')
    .eq('cedula', cedula)
    .single();

  if (!athlete && !staff) {
    return { error: 'No se encontró ningún registro con esta cédula en Kasa Sports. Contacta a administración.' }
  }

  // 2. Verificar y vincular Atleta
  if (athlete) {
    if (athlete.user_id && athlete.user_id !== user.id) {
      return { error: 'Esta cédula ya está vinculada a otra cuenta de atleta.' }
    }
    const { error: updateError } = await adminSupabase
      .from('athletes')
      .update({ user_id: user.id })
      .eq('id', athlete.id);
      
    if (updateError) return { error: 'Ocurrió un error al vincular el perfil de atleta.' }
  }

  // 3. Verificar y vincular Staff
  if (staff) {
    if (staff.user_id && staff.user_id !== user.id) {
      return { error: 'Esta cédula ya está vinculada a otra cuenta de staff.' }
    }
    const { error: updateError } = await adminSupabase
      .from('staff')
      .update({ user_id: user.id })
      .eq('id', staff.id);
      
    if (updateError) return { error: 'Ocurrió un error al vincular el perfil de staff.' }

    // Darle acceso automático al panel de administración como Coach (solo si no es admin ya)
    const { data: existingAdmin } = await adminSupabase.from('admin_users').select('id').eq('id', user.id).single();
    
    if (!existingAdmin) {
      const { error: adminError } = await adminSupabase
        .from('admin_users')
        .insert({
          id: user.id,
          email: user.email,
          role_id: 'coach'
        });
        
      if (adminError) console.error("Error asignando rol de admin al coach:", adminError);
    }
  }

  revalidatePath('/gateway')
  redirect('/gateway')
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

  const total_amount = Number(formData.get('total_amount'))
  const concept = formData.get('concept') as string
  const product_id = formData.get('product_id') as string
  const splitsJson = formData.get('splits_json') as string
  
  let splits: { amount: string, method: string, reference: string }[] = []
  if (splitsJson) {
    splits = JSON.parse(splitsJson)
  } else {
    return { error: 'Datos de abonos incompletos.' }
  }

  const receiptUrls: string[] = []
  
  // Procesar archivos
  for (let i = 0; i < splits.length; i++) {
    const file = formData.get(`receipt_${i}`) as File | null
    if (file && file.size > 0) {
      const url = await uploadImageToCloudflare(file, 'pagos')
      if (url) {
        receiptUrls.push(url)
      } else {
        return { error: 'Error al subir el comprobante. Por favor, intenta de nuevo.' }
      }
    } else {
      return { error: 'No se detectó un archivo válido para uno de los comprobantes.' }
    }
  }

  // En lugar de agrupar "Mixto", insertamos una fila por cada comprobante/fracción
  const rowsToInsert = splits.map((s, index) => ({
    athlete_id: athlete.id,
    product_id,
    amount: Number(s.amount),
    currency: 'USD',
    method: s.method,
    concept: splits.length > 1 ? `${concept} (Parte ${index + 1}/${splits.length})` : concept,
    status: 'Pendiente',
    reference_number: s.reference,
    receipt_url: receiptUrls[index] || null
  }))

  const { error } = await adminSupabase
    .from('payments')
    .insert(rowsToInsert)

  if (error) return { error: error.message }

  revalidatePath('/portal/dashboard')
  redirect('/portal/dashboard')
}
