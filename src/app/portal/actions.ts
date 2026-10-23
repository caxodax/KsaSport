'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getServiceSupabase } from '@/lib/supabase'
import { uploadImageToCloudflare } from '@/lib/cloudflare'
import { cleanCedula, formatCedula } from '@/lib/cedula'

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

  // Verificar si ya tiene algún perfil vinculado (Atleta o Staff/Admin)
  const adminSupabase = getServiceSupabase();
  const [athleteRes, adminRes] = await Promise.all([
    adminSupabase.from('athletes').select('id').eq('user_id', data.user.id).maybeSingle(),
    adminSupabase.from('admin_users').select('id').eq('id', data.user.id).maybeSingle(),
  ]);

  if (!athleteRes.data && !adminRes.data) {
    // Redirigir a vincular perfil si es cuenta recién creada
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
  
  // Como es una cuenta nueva, no tiene perfil vinculado
  redirect('/portal/link-profile')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function linkProfile(formData: FormData) {
  const rawCedula = formData.get('cedula') as string
  const cedula = cleanCedula(rawCedula)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No estás autenticado.' }
  }

  const adminSupabase = getServiceSupabase();
  const searchCedulas = Array.from(new Set([cedula, rawCedula?.trim(), formatCedula(cedula)].filter(Boolean)));
  
  // 1. Buscar si la cédula existe en atletas
  const { data: athlete } = await adminSupabase
    .from('athletes')
    .select('id, user_id')
    .in('cedula', searchCedulas)
    .maybeSingle();

  // 1.5 Buscar si existe en staff
  const { data: staff } = await adminSupabase
    .from('staff')
    .select('id, user_id, name, role')
    .in('cedula', searchCedulas)
    .maybeSingle();

  if (!athlete && !staff) {
    return { error: 'No se encontró ningún registro con esta cédula en Kasa Sports. Contacta a administración.' }
  }

  // 2. Verificar que no estén ya vinculados a otra cuenta
  if (athlete && athlete.user_id && athlete.user_id !== user.id) {
    return { error: 'Esta cédula ya está vinculada a otra cuenta de atleta.' }
  }

  if (staff && staff.user_id && staff.user_id !== user.id) {
    return { error: 'Esta cédula ya está vinculada a otra cuenta de usuario.' }
  }

  // 3. Vincular Atleta si existe
  if (athlete) {
    const { error: updateAthleteError } = await adminSupabase
      .from('athletes')
      .update({ user_id: user.id })
      .eq('id', athlete.id);
      
    if (updateAthleteError) {
      console.error('Error linking athlete:', updateAthleteError);
      return { error: 'Ocurrió un error al vincular el perfil de atleta.' }
    }
  }

  // 4. Vincular Staff si existe y otorgar rol técnico
  if (staff) {
    const roleId = `staff_${staff.id}`;

    // 4.1 Verificar si ya existe un rol específico configurado por el Super Admin
    const { data: existingRole } = await adminSupabase
      .from('admin_roles')
      .select('id, permissions')
      .eq('id', roleId)
      .maybeSingle();

    if (!existingRole) {
      // Crear rol predeterminado: solo Alineaciones y Roster (sin acceso financiero)
      const { error: roleInsertError } = await adminSupabase
        .from('admin_roles')
        .insert({
          id: roleId,
          name: `${staff.role || 'Staff'}: ${staff.name || 'Miembro'}`,
          permissions: ['view_lineup', 'view_roster']
        });

      if (roleInsertError) {
        console.error('Error creating staff role:', roleInsertError);
      }
    }

    // 4.2 Registrar / Actualizar en admin_users
    const { error: adminUserError } = await adminSupabase
      .from('admin_users')
      .upsert({
        id: user.id,
        email: user.email,
        role_id: roleId
      }, { onConflict: 'id' });

    if (adminUserError) {
      console.error('Error linking admin_users:', adminUserError);
      return { error: 'Error al conceder los accesos técnicos. Contacta a administración.' };
    }

    // 4.3 Vincular user_id en la tabla staff
    const { error: updateStaffError } = await adminSupabase
      .from('staff')
      .update({ user_id: user.id })
      .eq('id', staff.id);

    if (updateStaffError) {
      console.error('Error updating staff user_id:', updateStaffError);
    }
  }

  revalidatePath('/gateway');
  revalidatePath('/admin/staff');
  revalidatePath('/admin/users');
  revalidatePath('/portal/dashboard');
  redirect('/gateway');
}

export async function reportPayment(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  const adminSupabase = getServiceSupabase()
  
  const { data: athlete } = await adminSupabase
    .from('athletes')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!athlete) return { error: 'Atleta no encontrado' }

  const total_amount = Number(formData.get('total_amount'))
  const concept = formData.get('concept') as string
  const product_id = formData.get('product_id') as string
  const splitsJson = formData.get('splits_json') as string
  
  let splits: { 
    amount: string, 
    method: string, 
    reference: string,
    rate_type?: string,
    exchange_rate?: number | string,
    usdt_promedio?: number | string,
    transferred_amount?: number | string,
    payment_currency?: string,
    date_rate?: string
  }[] = []
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

  // En lugar de agrupar "Mixto", insertamos una fila por cada comprobante/fracción con su tasa congelada
  const todayDateStr = new Date().toISOString().split('T')[0];

  const rowsToInsert = splits.map((s, index) => ({
    athlete_id: athlete.id,
    product_id,
    amount: Number(s.amount),
    currency: 'USD',
    rate_type: s.rate_type || 'USD',
    exchange_rate: Number(s.exchange_rate) || 1.0000,
    usdt_promedio: s.usdt_promedio ? Number(s.usdt_promedio) : null,
    transferred_amount: s.transferred_amount !== undefined && s.transferred_amount !== null && s.transferred_amount !== '' 
      ? Number(s.transferred_amount) 
      : Number(s.amount),
    payment_currency: s.payment_currency || 'USD',
    date_rate: s.date_rate || todayDateStr,
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
